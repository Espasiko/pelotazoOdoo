"""
Servicio de sincronización entre Odoo y la base de datos local.

Este módulo proporciona la capa de servicio principal para sincronizar datos
entre Odoo y la base de datos local, coordinando las operaciones de los
servicios específicos de cada modelo.
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from prisma import Prisma

from app.core.config import settings
from app.services.odoo.product_service import ProductService
from app.services.odoo.base_service import OdooConfig

# Configurar logging
logger = logging.getLogger(__name__)

class SyncService:
    """
    Servicio principal para la sincronización con Odoo.
    
    Coordina la sincronización de diferentes modelos (productos, categorías, etc.)
    entre Odoo y la base de datos local.
    """
    
    def __init__(self):
        """Inicializa el servicio de sincronización."""
        self.prisma = Prisma()
        
        # Configuración de conexión con Odoo
        self.odoo_config = OdooConfig(
            url=settings.ODOO_URL,
            db=settings.ODOO_DB,
            username=settings.ODOO_USERNAME,
            password=settings.ODOO_PASSWORD
        )
        
        # Inicializar servicios específicos
        self.product_service = ProductService(self.odoo_config)
        
    async def test_connection(self) -> Dict[str, Any]:
        """
        Prueba la conexión con Odoo y devuelve información del servidor.
        
        Returns:
            Dict con información de la conexión y estado
        """
        try:
            # El servicio de productos hereda de OdooBaseService, que maneja la conexión
            version_info = await self.product_service.get_version()
            
            return {
                "status": "success",
                "message": "Conexión exitosa con Odoo",
                "version": version_info,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error al probar la conexión con Odoo: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Error al conectar con Odoo: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def get_product_by_id(self, product_id: int) -> Optional[Dict[str, Any]]:
        """
        Obtiene un producto de Odoo por su ID.
        
        Args:
            product_id: ID del producto en Odoo
            
        Returns:
            Dict con los datos del producto o None si no se encuentra
        """
        try:
            # Buscar primero en la base de datos local
            await self.prisma.connect()
            local_product = await self.prisma.product.find_first(
                where={"odoo_id": product_id}
            )
            
            if local_product:
                return dict(local_product)
                
            # Si no se encuentra localmente, buscar en Odoo
            product = await self.product_service.get_product_by_id(product_id)
            if not product:
                return None
                
            # Guardar en la base de datos local para futuras consultas
            product_values = await self.product_service._map_odoo_to_local(product)
            
            new_product = await self.prisma.product.create(
                data={
                    'odoo_id': product_id,
                    **product_values
                }
            )
            
            return dict(new_product)
            
        except Exception as e:
            logger.error(f"Error al obtener producto {product_id}: {str(e)}", exc_info=True)
            return None
            
        finally:
            await self.prisma.disconnect()
    
    async def search_products(
        self,
        search_term: Optional[str] = None,
        category_id: Optional[int] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        in_stock: bool = False,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Busca productos en Odoo con los criterios especificados.
        
        Args:
            search_term: Término de búsqueda para nombres y códigos
            category_id: ID de categoría para filtrar
            min_price: Precio mínimo
            max_price: Precio máximo
            in_stock: Si es True, solo devuelve productos con stock disponible
            limit: Límite de resultados
            offset: Desplazamiento para paginación
            
        Returns:
            Dict con los resultados de la búsqueda y metadatos de paginación
        """
        try:
            # Construir dominio de búsqueda
            domain = [('sale_ok', '=', True)]
            
            if search_term:
                domain.extend([
                    '|',
                    ('name', 'ilike', search_term),
                    '|',
                    ('default_code', 'ilike', search_term),
                    ('barcode', '=', search_term)
                ])
                
            if category_id:
                domain.append(('categ_id', '=', int(category_id)))
                
            if min_price is not None:
                domain.append(('list_price', '>=', float(min_price)))
                
            if max_price is not None:
                domain.append(('list_price', '<=', float(max_price)))
                
            if in_stock:
                domain.append(('qty_available', '>', 0))
            
            # Realizar búsqueda en Odoo
            product_ids = await self.product_service.search(
                'product.template',
                domain=domain,
                limit=limit,
                offset=offset,
                order='write_date desc'
            )
            
            if not product_ids:
                return {
                    "items": [],
                    "total": 0,
                    "limit": limit,
                    "offset": offset
                }
            
            # Obtener detalles de los productos
            fields = ['id', 'name', 'default_code', 'list_price', 'x_pvp_web', 'qty_available']
            products = await self.product_service.read(
                'product.template',
                product_ids,
                fields=fields
            )
            
            # Obtener el total de resultados (sin límite)
            total = await self.product_service.search_count(
                'product.template',
                domain=domain
            )
            
            # Formatear resultados
            formatted_products = []
            for product in products:
                formatted_products.append({
                    'id': product['id'],
                    'name': product['name'],
                    'sku': product.get('default_code'),
                    'price': float(product.get('list_price', 0.0)),
                    'sale_price': float(product.get('x_pvp_web', 0.0)),
                    'stock_quantity': float(product.get('qty_available', 0.0)),
                    'in_stock': float(product.get('qty_available', 0.0)) > 0
                })
            
            return {
                "items": formatted_products,
                "total": total,
                "limit": limit,
                "offset": offset
            }
            
        except Exception as e:
            logger.error(f"Error en la búsqueda de productos: {str(e)}", exc_info=True)
            return {
                "items": [],
                "total": 0,
                "error": str(e),
                "limit": limit,
                "offset": offset
            }
    
    async def sync_products(
        self,
        domain: Optional[List[Any]] = None,
        batch_size: int = 100,
        full_sync: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Sincroniza productos desde Odoo a la base de datos local.
        
        Args:
            domain: Dominio de búsqueda para filtrar productos en Odoo
            batch_size: Tamaño del lote para procesamiento por lotes
            full_sync: Si es True, realiza una sincronización completa
            **kwargs: Argumentos adicionales para la sincronización
            
        Returns:
            Dict con estadísticas de la sincronización
        """
        logger.info("Iniciando sincronización de productos")
        
        try:
            # Ejecutar la sincronización a través del servicio de productos
            stats = await self.product_service.sync_products(
                domain=domain,
                batch_size=batch_size,
                full_sync=full_sync,
                **kwargs
            )
            
            # Formatear resultado
            result = {
                "status": "completed" if stats.get('status') != 'error' else 'error',
                "message": "Sincronización de productos completada",
                "stats": {
                    "total": stats.get('total', 0),
                    "created": stats.get('created', 0),
                    "updated": stats.get('updated', 0),
                    "deleted": stats.get('deleted', 0),
                    "errors": stats.get('errors', 0),
                    "duration_seconds": stats.get('duration_seconds', 0)
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
            if 'error' in stats:
                result["error"] = stats['error']
            
            logger.info(
                f"Sincronización completada: {result['stats']['total']} productos procesados, "
                f"{result['stats']['created']} creados, {result['stats']['updated']} actualizados, "
                f"{result['stats']['deleted']} eliminados, {result['stats']['errors']} errores"
            )
            
            return result
            
        except Exception as e:
            error_msg = f"Error en la sincronización de productos: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            return {
                "status": "error",
                "message": error_msg,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

# Ejemplo de uso:
# sync_service = SyncService()
# await sync_service.sync_products()
