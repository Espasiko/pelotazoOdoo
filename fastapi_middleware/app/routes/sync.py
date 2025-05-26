import logging
from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from app.services.sync_service import SyncService
from app.core.security import get_current_user
from app.schemas.user import UserInDB
from app.core.config import settings

# Configurar logging
logger = logging.getLogger(__name__)

class SyncResponse(BaseModel):
    status: str
    message: str
    details: Optional[Dict[str, Any]] = None
    sync_id: Optional[str] = None

router = APIRouter(prefix="/api/v1/sync", tags=["Sincronización"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Almacenar el estado de las sincronizaciones en memoria
# En producción, considera usar Redis o una base de datos para esto
sync_status = {}

async def run_sync(sync_id: str, user_id: int):
    """
    Ejecuta la sincronización en segundo plano
    """
    try:
        sync_service = SyncService()
        result = await sync_service.sync_products()
        sync_status[sync_id] = {
            "status": result["status"],
            "message": result["message"],
            "details": result.get("details", {}),
            "completed": True,
            "error": None
        }
        logger.info(f"Sincronización {sync_id} completada: {result['message']}")
    except Exception as e:
        error_msg = f"Error en sincronización {sync_id}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        sync_status[sync_id] = {
            "status": "error",
            "message": "Error durante la sincronización",
            "details": {"error": str(e)},
            "completed": True,
            "error": str(e)
        }

@router.post("/products", response_model=SyncResponse, status_code=status.HTTP_202_ACCEPTED)
async def sync_products(
    background_tasks: BackgroundTasks,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Inicia la sincronización de productos desde Odoo a la base de datos local.
    
    Esta operación se ejecuta en segundo plano y devuelve inmediatamente
    un ID de sincronización para hacer seguimiento del estado.
    
    Requiere autenticación de administrador.
    """
    # Verificar si el usuario es administrador
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción"
        )
    
    # Generar un ID único para esta sincronización
    import uuid
    import time
    sync_id = f"sync_{int(time.time())}_{uuid.uuid4().hex[:8]}"
    
    # Inicializar el estado de la sincronización
    sync_status[sync_id] = {
        "status": "pending",
        "message": "Sincronización en progreso",
        "details": {},
        "started_at": time.time(),
        "completed": False,
        "error": None
    }
    
    # Iniciar la sincronización en segundo plano
    background_tasks.add_task(run_sync, sync_id, current_user.id)
    
    logger.info(f"Iniciando sincronización {sync_id} solicitada por el usuario {current_user.id}")
    
    return SyncResponse(
        status="accepted",
        message="Sincronización iniciada correctamente",
        sync_id=sync_id
    )

@router.get("/products/status/{sync_id}", response_model=SyncResponse)
async def get_sync_status(
    sync_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Obtiene el estado de una sincronización por su ID.
    
    Útil para hacer seguimiento de sincronizaciones en segundo plano.
    """
    # Verificar si el usuario es administrador
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción"
        )
    
    # Obtener el estado de la sincronización
    status_info = sync_status.get(sync_id)
    if not status_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró ninguna sincronización con ID {sync_id}"
        )
    
    # Calcular la duración si está completada
    if status_info.get("completed"):
        duration = status_info.get("completed_at", time.time()) - status_info["started_at"]
        status_info["details"]["duration_seconds"] = round(duration, 2)
    
    return SyncResponse(
        status=status_info["status"],
        message=status_info["message"],
        details=status_info.get("details", {})
    )
