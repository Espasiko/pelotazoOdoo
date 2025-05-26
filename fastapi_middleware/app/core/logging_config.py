"""
Configuración de logging para la aplicación FastAPI.

Este módulo configura el sistema de logging con formato consistente,
niveles de log apropiados y manejadores para diferentes entornos.
"""
import logging
import sys
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Optional

from app.core.config import settings


def setup_logging():
    """
    Configura el sistema de logging para la aplicación.
    
    Configura:
    - Formato de logs consistente
    - Nivel de log según configuración
    - Salida a consola
    - Rotación de archivos de log en producción
    """
    # Crear directorio de logs si no existe
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Configurar el formato del log
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    formatter = logging.Formatter(log_format)
    
    # Configurar el nivel de log
    log_level = getattr(logging, settings.LOG_LEVEL.upper())
    
    # Configurar logger raíz
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Limpiar manejadores existentes
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Configurar manejador de consola
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # En producción, agregar manejador de archivo con rotación
    if not settings.DEBUG:
        log_file = log_dir / "app.log"
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5,
            encoding="utf-8"
        )
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    
    # Configurar nivel de log para bibliotecas específicas
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    # Configurar el logger de la aplicación
    logger = logging.getLogger("app")
    logger.setLevel(log_level)
    
    # Log de configuración completada
    logger.info("Configuración de logging completada")
    logger.debug("Modo DEBUG activado" if settings.DEBUG else "Modo PRODUCCIÓN")


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Obtiene un logger con el nombre especificado.
    
    Args:
        name: Nombre del logger. Si es None, devuelve el logger raíz.
        
    Returns:
        logging.Logger: Instancia del logger configurado.
    """
    return logging.getLogger(name or "app")
