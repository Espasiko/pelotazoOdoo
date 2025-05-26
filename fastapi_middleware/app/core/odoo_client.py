import xmlrpc.client
from app.core.config import settings
import logging
import time
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

class OdooClient:
    """Cliente para comunicarse con Odoo a través de XML-RPC con manejo de reconexión"""
    
    def __init__(self):
        self.url = settings.ODOO_URL
        self.db = settings.ODOO_DB
        self.username = settings.ODOO_USERNAME
        self.password = settings.ODOO_PASSWORD
        self.uid = None
        self.max_retries = 3
        self.retry_delay = 1  # segundos
        self._init_connections()
    
    def _init_connections(self):
        """Inicializar conexiones a Odoo"""
        try:
            self.common = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/common')
            self.models = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/object')
            logger.info(f"Conexión establecida con Odoo en {self.url}")
        except Exception as e:
            logger.error(f"Error al inicializar conexiones con Odoo: {str(e)}")
            raise
    
    def authenticate(self, username=None, password=None) -> Optional[int]:
        """Autenticar con Odoo y obtener el UID con reintentos"""
        username = username or self.username
        password = password or self.password
        
        for attempt in range(self.max_retries):
            try:
                uid = self.common.authenticate(self.db, username, password, {})
                if uid:
                    self.uid = uid
                    logger.info(f"Autenticación exitosa con Odoo como {username} (uid: {uid})")
                    return uid
                logger.warning(f"Autenticación fallida con Odoo como {username} (intento {attempt+1}/{self.max_retries})")
            except Exception as e:
                logger.error(f"Error al autenticar con Odoo (intento {attempt+1}/{self.max_retries}): {str(e)}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay)
                    self._init_connections()  # Reiniciar conexiones
        
        logger.error(f"No se pudo autenticar con Odoo después de {self.max_retries} intentos")
        return None
    
    def execute_kw(self, model, method, args, kw=None):
        """Ejecutar un método en un modelo de Odoo con reintentos"""
        if not self.uid:
            self.authenticate()
            
        if not self.uid:
            raise Exception("No se pudo autenticar con Odoo")
        
        kw = kw or {}
        for attempt in range(self.max_retries):
            try:
                result = self.models.execute_kw(
                    self.db, self.uid, self.password, model, method, args, kw
                )
                return result
            except Exception as e:
                logger.error(f"Error al ejecutar método {method} en {model} (intento {attempt+1}/{self.max_retries}): {str(e)}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay)
                    # Reintentar autenticación si es necesario
                    self._init_connections()
                    self.authenticate()
                else:
                    raise
    
    def search_read(self, model, domain=None, fields=None, limit=None, offset=None, order=None):
        """Buscar y leer registros de un modelo de Odoo con mejor manejo de errores"""
        domain = domain or []
        fields = fields or []
        
        try:
            result = self.execute_kw(
                model, 'search_read',
                [domain],
                {
                    'fields': fields,
                    'limit': limit,
                    'offset': offset,
                    'order': order,
                }
            )
            logger.debug(f"Recuperados {len(result) if result else 0} registros del modelo {model}")
            return result
        except Exception as e:
            logger.error(f"Error al buscar y leer registros en {model}: {str(e)}")
            # Devolver una lista vacía en lugar de propagar el error
            # para evitar que la aplicación se detenga completamente
            return []
    
    def read(self, model, ids, fields=None):
        """Leer registros de un modelo de Odoo por IDs con mejor manejo de errores"""
        fields = fields or []
        try:
            result = self.execute_kw(model, 'read', [ids, fields])
            logger.debug(f"Leídos {len(result) if result else 0} registros del modelo {model}")
            return result
        except Exception as e:
            logger.error(f"Error al leer registros en {model} con IDs {ids}: {str(e)}")
            # Devolver una lista vacía en lugar de propagar el error
            return []
    
    def create(self, model, values):
        """Crear un registro en un modelo de Odoo con mejor manejo de errores"""
        try:
            result = self.execute_kw(model, 'create', [values])
            logger.info(f"Registro creado en {model} con ID: {result}")
            return result
        except Exception as e:
            logger.error(f"Error al crear registro en {model}: {str(e)}")
            # En caso de creación, sí propagamos el error ya que es crítico
            # para el flujo de la aplicación saber si se creó o no el registro
            raise
    
    def write(self, model, ids, values):
        """Actualizar registros en un modelo de Odoo con mejor manejo de errores"""
        try:
            result = self.execute_kw(model, 'write', [ids, values])
            logger.info(f"Registros actualizados en {model} con IDs: {ids}")
            return result
        except Exception as e:
            logger.error(f"Error al actualizar registros en {model} con IDs {ids}: {str(e)}")
            # En caso de actualización, sí propagamos el error ya que es crítico
            # para el flujo de la aplicación saber si se actualizó o no el registro
            raise
    
    def unlink(self, model, ids):
        """Eliminar registros de un modelo de Odoo con mejor manejo de errores"""
        try:
            result = self.execute_kw(model, 'unlink', [ids])
            logger.info(f"Registros eliminados en {model} con IDs: {ids}")
            return result
        except Exception as e:
            logger.error(f"Error al eliminar registros en {model} con IDs {ids}: {str(e)}")
            # En caso de eliminación, sí propagamos el error ya que es crítico
            # para el flujo de la aplicación saber si se eliminó o no el registro
            raise

# Instancia global del cliente de Odoo
odoo_client = OdooClient()
