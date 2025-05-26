"""
Servicio para la gestión de productos en Odoo.

Este módulo proporciona funcionalidad para sincronizar productos entre Odoo
y la base de datos local, incluyendo la gestión de categorías, atributos y variantes.
"""
from typing import List, Dict, Any, Optional, Tuple
import logging
from datetime import datetime

from prisma import Prisma
from prisma.models import Product as DBProduct

from .base_service import OdooBaseService, OdooConfig
from app.core.config import settings

logger = logging.getLogger(__name__)

# Mapeo de campos entre Odoo y nuestro modelo local
PRODUCT_FIELD_MAPPING = {
    'id': 'odoo_id',
    'name': 'name',
    'default_code': 'sku',
    'barcode': 'barcode',
    'list_price': 'price',
    'x_pvp_web': 'sale_price',
    'x_dto': 'discount',
    'x_marca': 'brand',
    'qty_available': 'stock_quantity',
    'description_sale': 'description',
    'categ_id': 'category_id',
    'image_1920': 'image_url',
    'active': 'is_active',
    'create_date': 'created_at',
    'write_date': 'updated_at'
}

# Campos a solicitar a la API de Odoo
PRODUCT_FIELDS = list(PRODUCT_FIELD_MAPPING.keys())


class ProductService(OdooBaseService):
    """
    Servicio para la gestión de productos en Odoo.
    
    Proporciona métodos para buscar, crear, actualizar y sincronizar
    productos entre Odoo y la base de datos local.
    """
    
    def __init__(self, config: Optional[OdooConfig] = None):
        """Inicializa el servicio de productos."""
        super().__init__(config)
        self.prisma = Prisma()
    
    async def _map_odoo_to_local(self, odoo_product: Dict[str, Any]) -> Dict[str, Any]:
        """
        Mapea un producto de Odoo al formato local.
        
        Args:
            odoo_product: Diccionario con los datos del producto de Odoo
            
        Returns:
            Dict con los datos mapeados al formato local
        """
        mapped = {}
        
        # Mapear campos directos
        for odoo_field, local_field in PRODUCT_FIELD_MAPPING.items():
            if odoo_field in odoo_product:
                mapped[local_field] = odoo_product[odoo_field]
        
        # Procesar campos especiales
        if 'categ_id' in odoo_product and isinstance(odoo_product['categ_id'], (list, tuple)):
            mapped['category_id'] = odoo_product['categ_id'][0] if odoo_product['categ_id'] else None
        
        # Procesar imagen
        if 'image_1920' in odoo_product and odoo_product['image_1920']:
            # Aquí podrías implementar la lógica para guardar la imagen
            # Por ahora, solo guardamos un indicador de que hay imagen
            mapped['has_image'] = True
        
        # Asegurar que los campos requeridos tengan un valor por defecto
        mapped.setdefault('is_active', True)
        mapped.setdefault('stock_quantity', 0)
        
        return mapped
    
    async def get_products(
        self,
        domain: Optional[List[Any]] = None,
        fields: Optional[List[str]] = None,
        limit: Optional[int] = None,
        offset: int = 0,
        order: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Obtiene productos de Odoo.
        
        Args:
            domain: Dominio de búsqueda (filtro)
            fields: Campos a devolver
            limit: Límite de resultados
            offset: Desplazamiento para paginación
            order: Campo(s) para ordenar
            
        Returns:
            Lista de productos de Odoo
        """
        domain = domain or [('sale_ok', '=', True)]  # Solo productos disponibles para venta
        fields = fields or PRODUCT_FIELDS
        
        return self.search_read(
            'product.product',
            domain=domain,
            fields=fields,
            limit=limit,
            offset=offset,
            order=order
        )
    
    async def sync_products(
        self,
        domain: Optional[List[Any]] = None,
        batch_size: int = 100,
        full_sync: bool = False
    ) -> Dict[str, int]:
        """
        Sincroniza productos desde Odoo a la base de datos local.
        
        Args:
            domain: Dominio de búsqueda para filtrar productos
            batch_size: Tamaño del lote para procesamiento por lotes
            full_sync: Si es True, realiza una sincronización completa (elimina registros locales que no existen en Odoo)
            
        Returns:
            Diccionario con estadísticas de la sincronización
        """
        stats = {
            'total': 0,
            'created': 0,
            'updated': 0,
            'deleted': 0,
            'errors': 0,
            'start_time': datetime.utcnow()
        }
        
        try:
            # Conectar a la base de datos
            await self.prisma.connect()
            
            # Obtener IDs de productos existentes para seguimiento
            existing_ids = set()
            if full_sync:
                existing_products = await DBProduct.prisma().find_many(select={'odoo_id': True})
                existing_ids = {p.odoo_id for p in existing_products}
            
            # Obtener productos de Odoo por lotes
            offset = 0
            while True:
                products = await self.get_products(
                    domain=domain,
                    fields=PRODUCT_FIELDS,
                    limit=batch_size,
                    offset=offset,
                    order='id ASC'  # Ordenar por ID para paginación consistente
                )
                
                if not products:
                    break
                
                logger.info(f"Procesando lote de {len(products)} productos (offset: {offset})")
                
                for product_data in products:
                    try:
                        odoo_id = product_data['id']
                        
                        # Mapear datos de Odoo al formato local
                        product_values = await self._map_odoo_to_local(product_data)
                        
                        # Verificar si el producto ya existe
                        existing_product = await DBProduct.prisma().find_unique(
                            where={'odoo_id': odoo_id}
                        )
                        
                        if existing_product:
                            # Actualizar producto existente
                            await DBProduct.prisma().update(
                                where={'id': existing_product.id},
                                data=product_values
                            )
                            stats['updated'] += 1
                            
                            # Eliminar de la lista de IDs existentes (para seguimiento de eliminados)
                            if odoo_id in existing_ids:
                                existing_ids.remove(odoo_id)
                        else:
                            # Crear nuevo producto
                            await DBProduct.prisma().create(
                                data={
                                    'odoo_id': odoo_id,
                                    **product_values
                                }
                            )
                            stats['created'] += 1
                        
                        stats['total'] += 1
                        
                        # Log cada 100 productos procesados
                        if stats['total'] % 100 == 0:
                            logger.info(f"Productos procesados: {stats['total']}")
                            
                    except Exception as e:
                        logger.error(f"Error al procesar producto {product_data.get('id')}: {str(e)}", exc_info=True)
                        stats['errors'] += 1
                
                # Pasar al siguiente lote
                offset += len(products)
                if len(products) < batch_size:
                    break
            
            # Eliminar productos que ya no existen en Odoo (solo en sincronización completa)
            if full_sync and existing_ids:
                logger.info(f"Eliminando {len(existing_ids)} productos que ya no existen en Odoo")
                
                # Eliminar en lotes para evitar timeouts
                batch = []
                for odoo_id in existing_ids:
                    batch.append(odoo_id)
                    if len(batch) >= 100:
                        await self._delete_products_batch(batch)
                        stats['deleted'] += len(batch)
                        batch = []
                
                # Eliminar cualquier lote restante
                if batch:
                    await self._delete_products_batch(batch)
                    stats['deleted'] += len(batch)
            
            logger.info("Sincronización de productos completada")
            
        except Exception as e:
            logger.error(f"Error en la sincronización de productos: {str(e)}", exc_info=True)
            stats['error'] = str(e)
            
        finally:
            # Cerrar la conexión a la base de datos
            await self.prisma.disconnect()
            
            # Calcular tiempo de ejecución
            stats['end_time'] = datetime.utcnow()
            stats['duration_seconds'] = (stats['end_time'] - stats['start_time']).total_seconds()
            
            logger.info(
                f"Resumen de sincronización: "
                f"{stats['total']} procesados, "
                f"{stats['created']} creados, "
                f"{stats['updated']} actualizados, "
                f"{stats['deleted']} eliminados, "
                f"{stats['errors']} errores, "
                f"duración: {stats['duration_seconds']:.2f} segundos"
            )
            
        return stats
    
    async def _delete_products_batch(self, odoo_ids: List[int]) -> None:
        """
        Elimina un lote de productos por sus IDs de Odoo.
        
        Args:
            odoo_ids: Lista de IDs de Odoo a eliminar
        """
        try:
            await DBProduct.prisma().delete_many(
                where={
                    'odoo_id': {
                        'in': odoo_ids
                    }
                }
            )
        except Exception as e:
            logger.error(f"Error al eliminar lote de productos: {str(e)}", exc_info=True)
            raise
