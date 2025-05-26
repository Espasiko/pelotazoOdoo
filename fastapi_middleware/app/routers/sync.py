from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any
from ..services.sync_service import SyncService

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.post("/sync/products", response_model=Dict[str, Any])
async def sync_products():
    """
    Sincroniza productos desde Odoo a la base de datos local
    """
    try:
        sync_service = SyncService()
        result = await sync_service.sync_products()
        
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])
            
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
