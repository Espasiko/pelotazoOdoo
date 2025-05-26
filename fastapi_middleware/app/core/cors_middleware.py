from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging

logger = logging.getLogger(__name__)

class CustomCORSMiddleware(BaseHTTPMiddleware):
    """
    Middleware personalizado para manejar CORS de manera más robusta
    """
    
    async def dispatch(self, request: Request, call_next):
        # Manejar solicitudes OPTIONS (preflight)
        if request.method == "OPTIONS":
            logger.debug(f"Solicitud OPTIONS recibida desde: {request.client.host}")
            response = Response(
                status_code=200,
                content="",
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
                    "Access-Control-Max-Age": "86400",  # 24 horas
                },
            )
            return response
        
        # Procesar la solicitud normalmente
        response = await call_next(request)
        
        # Agregar encabezados CORS a la respuesta
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept"
        
        return response

def setup_cors(app):
    """
    Configurar CORS para la aplicación FastAPI
    """
    # Agregar middleware CORS estándar
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Agregar middleware CORS personalizado
    app.add_middleware(CustomCORSMiddleware)
    
    logger.info("Middleware CORS configurado correctamente")