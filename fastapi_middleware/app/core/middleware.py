"""
Middleware personalizado para la aplicación FastAPI.

Incluye:
- Logging de peticiones y respuestas
- Manejo de cabeceras personalizadas
- Manejo de errores
"""
import time
import json
import logging
from typing import Callable, Awaitable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware para el logging de peticiones y respuestas HTTP.
    
    Registra información detallada de cada petición entrante y su respuesta,
    incluyendo tiempo de procesamiento, códigos de estado, etc.
    """
    
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Obtener información de la petición
        request_id = request.headers.get('x-request-id', '')
        client_host = request.client.host if request.client else "unknown"
        user_agent = request.headers.get('user-agent', '')
        
        # Registrar inicio de la petición
        logger.info(
            f"Inicio de petición: {request.method} {request.url.path} - "
            f"ID: {request_id} - Cliente: {client_host} - User-Agent: {user_agent}"
        )
        
        # Medir tiempo de procesamiento
        start_time = time.time()
        
        try:
            # Procesar la petición
            response = await call_next(request)
            
            # Calcular tiempo de procesamiento
            process_time = (time.time() - start_time) * 1000
            process_time = round(process_time, 2)
            
            # Registrar respuesta exitosa
            logger.info(
                f"Respuesta: {request.method} {request.url.path} - "
                f"Status: {response.status_code} - "
                f"Tiempo: {process_time}ms - "
                f"ID: {request_id}"
            )
            
            # Agregar encabezados de tiempo de respuesta
            response.headers["X-Process-Time-MS"] = str(process_time)
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Calcular tiempo hasta el error
            process_time = (time.time() - start_time) * 1000
            process_time = round(process_time, 2)
            
            # Registrar error
            logger.error(
                f"Error en petición: {request.method} {request.url.path} - "
                f"Error: {str(e)} - "
                f"Tiempo: {process_time}ms - "
                f"ID: {request_id}",
                exc_info=True
            )
            
            # Re-lanzar la excepción para que sea manejada por los manejadores de excepciones de FastAPI
            raise


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Middleware para el manejo centralizado de errores.
    
    Captura excepciones no manejadas y devuelve respuestas de error estandarizadas.
    """
    
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        try:
            return await call_next(request)
            
        except Exception as e:
            logger.error(
                f"Error no manejado en {request.method} {request.url.path}: {str(e)}",
                exc_info=True
            )
            
            # Importar aquí para evitar dependencias circulares
            from fastapi.responses import JSONResponse
            from starlette import status
            
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "detail": "Error interno del servidor",
                    "error": str(e),
                    "path": request.url.path,
                    "method": request.method
                }
            )
