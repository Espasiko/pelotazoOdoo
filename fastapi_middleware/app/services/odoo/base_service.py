"""
Servicio base para la integración con Odoo a través de XML-RPC.

Este módulo proporciona una clase base para interactuar con la API de Odoo
de manera segura y eficiente, con manejo de conexiones, reintentos y errores.
"""
import xmlrpc.client
import logging
from typing import Any, Dict, List, Optional, Tuple, Union
from functools import wraps
import time
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger(__name__)


class OdooConnectionError(Exception):
    """Excepción para errores de conexión con Odoo."""
    pass


class OdooAuthenticationError(Exception):
    """Excepción para errores de autenticación con Odoo."""
    pass


class OdooConfig(BaseModel):
    """Configuración para la conexión con Odoo."""
    url: str = Field(..., description="URL base de la instancia de Odoo")
    db: str = Field(..., description="Nombre de la base de datos")
    username: str = Field(..., description="Nombre de usuario")
    password: str = Field(..., description="Contraseña")
    uid: Optional[int] = Field(None, description="ID de usuario autenticado")
    
    class Config:
        arbitrary_types_allowed = True


def handle_odoo_errors(func):
    """
    Decorador para manejar errores comunes de Odoo.
    
    Args:
        func: Función a decorar
        
    Returns:
        Función decorada con manejo de errores
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except (xmlrpc.client.Fault, ConnectionError) as e:
            logger.error(f"Error de conexión con Odoo: {str(e)}")
            raise OdooConnectionError(f"Error al conectar con Odoo: {str(e)}") from e
        except Exception as e:
            logger.error(f"Error inesperado en operación de Odoo: {str(e)}", exc_info=True)
            raise
    return wrapper


class OdooBaseService:
    """
    Clase base para servicios que interactúan con Odoo a través de XML-RPC.
    
    Proporciona métodos comunes para autenticación y ejecución de operaciones
    en modelos de Odoo.
    """
    
    def __init__(self, config: Optional[OdooConfig] = None):
        """
        Inicializa el servicio con la configuración proporcionada o la configuración por defecto.
        
        Args:
            config: Configuración de conexión con Odoo. Si no se proporciona,
                   se usa la configuración por defecto del módulo.
        """
        self.config = config or OdooConfig(
            url=settings.ODOO_URL,
            db=settings.ODOO_DB,
            username=settings.ODOO_USERNAME,
            password=settings.ODOO_PASSWORD
        )
        
        # Inicializar clientes XML-RPC
        self._common = None
        self._models = None
        self._uid = None
    
    @property
    def common(self):
        """Cliente para el endpoint common de Odoo."""
        if self._common is None:
            self._common = xmlrpc.client.ServerProxy(f"{self.config.url}/xmlrpc/2/common")
        return self._common
    
    @property
    def models(self):
        """Cliente para el endpoint object de Odoo."""
        if self._models is None:
            self._models = xmlrpc.client.ServerProxy(f"{self.config.url}/xmlrpc/2/object")
        return self._models
    
    @property
    def uid(self) -> int:
        """ID de usuario autenticado en Odoo."""
        if self.config.uid is None:
            self.authenticate()
        return self.config.uid
    
    @handle_odoo_errors
    def authenticate(self) -> int:
        """
        Autentica el usuario en Odoo y devuelve el UID.
        
        Returns:
            int: UID del usuario autenticado
            
        Raises:
            OdooAuthenticationError: Si la autenticación falla
        """
        try:
            logger.info(f"Autenticando usuario {self.config.username} en Odoo...")
            self.config.uid = self.common.authenticate(
                self.config.db,
                self.config.username,
                self.config.password,
                {}
            )
            
            if not self.config.uid:
                raise OdooAuthenticationError("Credenciales inválidas para Odoo")
                
            logger.info(f"Autenticación exitosa. UID: {self.config.uid}")
            return self.config.uid
            
        except xmlrpc.client.Fault as e:
            error_msg = f"Error de autenticación en Odoo: {str(e)}"
            logger.error(error_msg)
            raise OdooAuthenticationError(error_msg) from e
    
    @handle_odoo_errors
    def execute_kw(self, model: str, method: str, *args, **kwargs) -> Any:
        """
        Ejecuta un método de un modelo de Odoo.
        
        Args:
            model: Nombre del modelo de Odoo (ej: 'res.partner')
            method: Nombre del método a ejecutar
            *args: Argumentos posicionales para el método
            **kwargs: Argumentos nombrados para el método
            
        Returns:
            Resultado de la ejecución del método
            
        Raises:
            OdooConnectionError: Si hay un error de conexión
            OdooAuthenticationError: Si hay un error de autenticación
        """
        # Asegurarse de que estamos autenticados
        uid = self.uid
        
        # Preparar argumentos para la llamada
        args = list(args)
        
        # Llamar al método
        try:
            logger.debug(
                f"Ejecutando {model}.{method} con args={args}, kwargs={kwargs}"
            )
            
            result = self.models.execute_kw(
                self.config.db, uid, self.config.password,
                model, method, args, kwargs or {}
            )
            
            logger.debug(f"Resultado de {model}.{method}: {result}")
            return result
            
        except xmlrpc.client.Fault as e:
            error_msg = f"Error al ejecutar {model}.{method}: {str(e)}"
            logger.error(error_msg)
            
            # Si el error es de autenticación, intentar reconectar una vez
            if "AccessDenied" in str(e):
                logger.warning("Token de sesión expirado, intentando reautenticar...")
                self.config.uid = None  # Forzar reautenticación
                return self.execute_kw(model, method, *args, **kwargs)
                
            raise OdooConnectionError(error_msg) from e
    
    def search_read(
        self,
        model: str,
        domain: Optional[list] = None,
        fields: Optional[list] = None,
        offset: int = 0,
        limit: Optional[int] = None,
        order: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Busca y lee registros de un modelo de Odoo.
        
        Args:
            model: Nombre del modelo de Odoo
            domain: Dominio de búsqueda (filtro)
            fields: Lista de campos a devolver
            offset: Número de registros a omitir
            limit: Número máximo de registros a devolver
            order: Campo(s) por los que ordenar
            
        Returns:
            Lista de diccionarios con los registros encontrados
        """
        domain = domain or []
        fields = fields or ["id", "name"]
        
        kwargs = {"fields": fields}
        if offset:
            kwargs["offset"] = offset
        if limit:
            kwargs["limit"] = limit
        if order:
            kwargs["order"] = order
            
        return self.execute_kw(model, "search_read", domain, kwargs)
    
    def create(self, model: str, values: Dict[str, Any]) -> int:
        """
        Crea un nuevo registro en el modelo especificado.
        
        Args:
            model: Nombre del modelo de Odoo
            values: Valores para el nuevo registro
            
        Returns:
            ID del registro creado
        """
        return self.execute_kw(model, "create", values)
    
    def write(self, model: str, ids: Union[int, List[int]], values: Dict[str, Any]) -> bool:
        """
        Actualiza registros existentes.
        
        Args:
            model: Nombre del modelo de Odoo
            ids: ID o lista de IDs de los registros a actualizar
            values: Valores a actualizar
            
        Returns:
            True si la operación fue exitosa
        """
        if isinstance(ids, int):
            ids = [ids]
        return self.execute_kw(model, "write", ids, values)
    
    def unlink(self, model: str, ids: Union[int, List[int]]) -> bool:
        """
        Elimina registros.
        
        Args:
            model: Nombre del modelo de Odoo
            ids: ID o lista de IDs de los registros a eliminar
            
        Returns:
            True si la operación fue exitosa
        """
        if isinstance(ids, int):
            ids = [ids]
        return self.execute_kw(model, "unlink", ids)
    
    def call(self, model: str, method: str, *args, **kwargs) -> Any:
        """
        Método genérico para llamar a cualquier método de un modelo.
        
        Args:
            model: Nombre del modelo de Odoo
            method: Nombre del método a llamar
            *args: Argumentos posicionales
            **kwargs: Argumentos nombrados
            
        Returns:
            Resultado de la llamada al método
        """
        return self.execute_kw(model, method, *args, **kwargs)
