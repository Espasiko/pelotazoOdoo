import os
import sys
import logging
import asyncio
import time
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.utils import get_openapi
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.routes import (
    auth,
    products,
    suppliers,
    categories,
    sync
)
from app.utils.init_db import initialize_database
from app.core.logging_config import setup_logging
from app.core.middleware import LoggingMiddleware

# Configurar logging
setup_logging()
logger = logging.getLogger(__name__)

# Configurar el event loop para Windows si es necesario
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Configuración del ciclo de vida de la aplicación
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicio de la aplicación
    startup_time = time.time()
    logger.info("Iniciando aplicación El Pelotazo API...")
    
    # Inicializar la base de datos
    try:
        await initialize_database()
        logger.info("Base de datos inicializada correctamente")
    except Exception as e:
        logger.error(f"Error al inicializar la base de datos: {str(e)}")
        # No hacemos raise aquí para permitir que la aplicación se inicie
        # incluso si hay problemas con la base de datos
    
    # Tiempo de inicio
    app.state.startup_time = startup_time
    logger.info(f"Aplicación lista en {time.time() - startup_time:.2f} segundos")
    
    yield
    
    # Cierre de la aplicación
    logger.info("Cerrando aplicación El Pelotazo API...")
    # Aquí podrías agregar lógica de limpieza si es necesario

# Crear la aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    API para la tienda de electrodomésticos El Pelotazo.
    
    Proporciona acceso a productos, categorías, proveedores y sincronización con Odoo.
    """,
    version=settings.API_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# Personalizar la documentación OpenAPI
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.PROJECT_NAME,
        version=settings.API_VERSION,
        description="""
        ## Descripción
        
        API para la tienda de electrodomésticos El Pelotazo.
        
        ## Autenticación
        
        La mayoría de los endpoints requieren autenticación mediante JWT.
        Utiliza el endpoint `/api/v1/auth/login` para obtener un token.
        
        ## Códigos de estado
        
        - 200: Éxito
        - 201: Recurso creado
        - 400: Solicitud incorrecta
        - 401: No autorizado
        - 403: Prohibido
        - 404: No encontrado
        - 500: Error interno del servidor
        """,
        routes=app.routes,
    )
    
    # Personalizar esquema OpenAPI aquí si es necesario
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Configuración de CORS
if settings.BACKEND_CORS_ORIGINS:
    origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
else:
    origins = []

# Agregar orígenes adicionales si es necesario
additional_origins = [
    "http://localhost:3000",  # Frontend Next.js local
    "http://localhost:8000",  # Backend FastAPI local
    "http://127.0.0.1:3000",  # Frontend Next.js local (alternativo)
    "http://127.0.0.1:8000",  # Backend FastAPI local (alternativo)
]

# Combinar orígenes únicos
origins = list(set(origins + additional_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Agregar middleware de compresión GZIP
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Agregar middleware de logging
app.add_middleware(LoggingMiddleware)

# Incluir routers
app.include_router(auth.router, prefix="/api/v1", tags=["Autenticación"])
app.include_router(products.router, prefix="/api/v1", tags=["Productos"])
app.include_router(suppliers.router, prefix="/api/v1", tags=["Proveedores"])
app.include_router(categories.router, prefix="/api/v1", tags=["Categorías"])
app.include_router(sync.router, prefix="/api/v1", tags=["Sincronización"])

# Servir archivos estáticos (si es necesario)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get(
    "/", 
    tags=["Root"],
    summary="Endpoint raíz",
    description="Devuelve información básica sobre la API y su estado actual.",
    response_description="Información de la API"
)
async def root():
    """
    Endpoint raíz que devuelve información básica sobre la API.
    
    Incluye:
    - Nombre y versión de la API
    - Estado actual
    - Tiempo de actividad
    - Enlaces a la documentación
    """
    return {
        "message": "Bienvenido a la API de El Pelotazo",
        "version": "1.0.0",
        "documentation": "/docs",
    }

# Manejadores de excepciones globales
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Manejador global para excepciones HTTP.
    """
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} - {request.method} {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Manejador global para errores de validación.
    """
    logger.warning(f"Error de validación: {exc.errors()} - {request.method} {request.url}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Error de validación", "errors": exc.errors()},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Manejador global para cualquier excepción no manejada.
    """
    logger.error(
        f"Error no manejado: {str(exc)}\n"
        f"URL: {request.method} {request.url}\n"
        f"Headers: {dict(request.headers)}\n"
        f"Query params: {dict(request.query_params)}\n"
        f"Path params: {request.path_params}",
        exc_info=True
    )
    
    # No exponer detalles del error en producción
    detail = "Ha ocurrido un error interno en el servidor"
    if settings.DEBUG:
        detail = f"{str(exc)}\n{type(exc).__name__}"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": detail},
    )

# Endpoint de salud
@app.get(
    "/health",
    tags=["Sistema"],
    summary="Verificar el estado del servicio",
    description="Devuelve el estado actual de la API y sus dependencias.",
    response_description="Estado del servicio"
)
async def health_check():
    """
    Verifica el estado de la API y sus dependencias.
    
    Útil para monitoreo y balanceo de carga.
    """
    # Aquí podrías verificar el estado de la base de datos y otros servicios
    db_status = "ok"
    try:
        # Ejecutar una consulta simple para verificar la conexión a la base de datos
        # Esto es un ejemplo, ajusta según tu ORM
        # await database.execute("SELECT 1")
        pass
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "ok",
        "timestamp": time.time(),
        "uptime": time.time() - app.state.startup_time,
        "version": settings.API_VERSION,
        "dependencies": {
            "database": db_status,
            # Agrega más dependencias aquí según sea necesario
        }
    }

# Redireccionar a la documentación desde la raíz
@app.get("", include_in_schema=False)
async def redirect_to_docs():
    return RedirectResponse(url="/api/docs")

# Evento de inicio de la aplicación
@app.on_event("startup")
async def startup_event():
    """
    Evento que se ejecuta al iniciar la aplicación
    """
    logger.info("Iniciando aplicación...")
    
    # Inicializar base de datos
    try:
        initialize_database()
        
        # Sincronizar productos al iniciar (opcional, se puede comentar si no se desea)
        # sync_service = SyncService()
        # await sync_service.sync_products()
        
    except Exception as e:
        logger.error(f"Error al inicializar la base de datos: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # Configuración para desarrollo
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        workers=settings.WORKERS if not settings.DEBUG else 1,
        proxy_headers=True,
        forwarded_allow_ips='*',
    )
