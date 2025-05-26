"""
Paquete principal de la aplicación FastAPI para El Pelotazo.

Este paquete contiene los módulos y componentes principales de la aplicación.
"""

# Importar servicios
from .services.sync_service import SyncService

# Hacer los servicios disponibles a nivel de paquete
__all__ = ['SyncService']
