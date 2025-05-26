import logging
from app.services.supplier import ensure_required_suppliers_exist
from app.utils.import_suppliers import import_suppliers_from_json

logger = logging.getLogger(__name__)

def initialize_database():
    """
    Inicializar la base de datos con los datos necesarios
    """
    try:
        # Asegurar que los proveedores requeridos existen
        logger.info("Asegurando que los proveedores requeridos existen...")
        try:
            ensure_required_suppliers_exist()
        except Exception as e:
            logger.warning(f"No se pudieron asegurar los proveedores requeridos: {str(e)}")
        
        # Importar proveedores desde archivos JSON
        logger.info("Importando proveedores desde archivos JSON...")
        try:
            import_suppliers_from_json()
        except Exception as e:
            logger.warning(f"No se pudieron importar los proveedores desde JSON: {str(e)}")
        
        logger.info("Base de datos inicializada correctamente")
        return True
    except Exception as e:
        logger.error(f"Error al inicializar la base de datos: {str(e)}")
        # No bloqueamos el inicio de la aplicación si hay errores en la inicialización
        return True
