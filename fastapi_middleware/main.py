from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, products, suppliers, categories
from app.core.config import settings
import logging
from app.utils.init_db import initialize_database
from typing import List

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="El Pelotazo API",
    description="API para la tienda de electrodomésticos El Pelotazo",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# Configuración de CORS
origins = [
    "http://localhost:3000",  # Frontend Next.js
    "http://localhost:8000",  # Backend FastAPI
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix="/api/v1", tags=["Autenticación"])
app.include_router(products.router, prefix="/api/v1", tags=["Productos"])
app.include_router(suppliers.router, prefix="/api/v1", tags=["Proveedores"])
app.include_router(categories.router, prefix="/api/v1", tags=["Categorías"])

@app.get("/", tags=["Root"])
async def root():
    """
    Endpoint raíz que devuelve información básica sobre la API.
    """
    return {
        "message": "Bienvenido a la API de El Pelotazo",
        "version": "1.0.0",
        "documentation": "/docs",
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Manejador global de excepciones
    """
    logger.error(f"Error no manejado: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor"}
    )

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
    except Exception as e:
        logger.error(f"Error al inicializar la base de datos: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
