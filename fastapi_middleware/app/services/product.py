from typing import List, Optional, Dict, Any
from app.core.odoo_client import odoo_client
from app.models.product import Product, ProductCreate, ProductUpdate, ProductList
import logging

logger = logging.getLogger(__name__)

def get_products(
    limit: int = 10,
    offset: int = 0,
    search: Optional[str] = None,
    order: Optional[str] = None,
    supplier: Optional[str] = None,
    category_id: Optional[int] = None,
) -> ProductList:
    """
    Obtener lista de productos con filtros y paginación
    """
    try:
        # Construir dominio de búsqueda
        domain = []
        if search:
            domain.append('|')
            domain.append(('name', 'ilike', search))
            domain.append(('default_code', 'ilike', search))
        
        if supplier:
            domain.append(('x_nombre_proveedor', 'ilike', supplier))
            
        if category_id:
            domain.append(('categ_id', '=', category_id))
            
        # Campos a recuperar
        fields = [
            'id', 'name', 'description_sale', 'list_price', 'standard_price',
            'default_code', 'barcode', 'active', 'sale_ok', 'purchase_ok',
            'categ_id', 'image_1920', 'x_nombre_proveedor', 'x_marca',
            'x_pvp_web', 'x_precio_venta_web', 'x_dto', 'x_precio_margen',
            'x_beneficio', 'x_beneficio_unitario', 'x_beneficio_total', 'x_vendidas'
        ]
        
        # Obtener total de registros
        total = odoo_client.execute_kw(
            'product.template', 'search_count', [domain]
        )
        
        # Obtener productos
        products_data = odoo_client.search_read(
            'product.template', domain, fields, limit=limit, offset=offset, order=order or 'name'
        )
        
        # Procesar resultados
        products = []
        for p in products_data:
            # Obtener nombre de categoría
            categ_name = None
            if p.get('categ_id'):
                categ_id = p['categ_id'][0] if isinstance(p['categ_id'], list) else p['categ_id']
                categ_data = odoo_client.read('product.category', [categ_id], ['name'])
                if categ_data:
                    categ_name = categ_data[0]['name']
            
            # Crear objeto de producto
            product = {
                'id': p['id'],
                'name': p['name'],
                'description': p.get('description_sale', ''),
                'list_price': p['list_price'],
                'standard_price': p.get('standard_price', 0),
                'default_code': p.get('default_code', ''),
                'barcode': p.get('barcode', ''),
                'active': p.get('active', True),
                'sale_ok': p.get('sale_ok', True),
                'purchase_ok': p.get('purchase_ok', True),
                'categ_id': p['categ_id'][0] if isinstance(p['categ_id'], list) else p['categ_id'],
                'categ_name': categ_name,
                'image_url': f"/api/v1/products/{p['id']}/image" if p.get('image_1920') else None,
                
                # Campos personalizados
                'x_nombre_proveedor': p.get('x_nombre_proveedor', ''),
                'x_marca': p.get('x_marca', ''),
                'x_pvp_web': p.get('x_pvp_web', 0),
                'x_precio_venta_web': p.get('x_precio_venta_web', 0),
                'x_dto': p.get('x_dto', 0),
                'x_precio_margen': p.get('x_precio_margen', 0),
                'x_beneficio': p.get('x_beneficio', 0),
                'x_beneficio_unitario': p.get('x_beneficio_unitario', 0),
                'x_beneficio_total': p.get('x_beneficio_total', 0),
                'x_vendidas': p.get('x_vendidas', 0),
                
                # Alias para compatibilidad con el frontend
                'supplier': p.get('x_nombre_proveedor', ''),
                'brand': p.get('x_marca', ''),
                'price': p['list_price'],
            }
            products.append(Product(**product))
        
        # Calcular páginas
        pages = (total + limit - 1) // limit if limit > 0 else 1
        page = (offset // limit) + 1 if limit > 0 else 1
        
        return ProductList(
            data=products,
            total=total,
            page=page,
            page_size=limit,
            pages=pages
        )
    except Exception as e:
        logger.error(f"Error al obtener productos: {str(e)}")
        raise

def get_product(product_id: int) -> Product:
    """
    Obtener un producto por su ID
    """
    try:
        # Campos a recuperar
        fields = [
            'name', 'description_sale', 'list_price', 'standard_price',
            'default_code', 'barcode', 'active', 'sale_ok', 'purchase_ok',
            'categ_id', 'image_1920', 'x_nombre_proveedor', 'x_marca',
            'x_pvp_web', 'x_precio_venta_web', 'x_dto', 'x_precio_margen',
            'x_beneficio', 'x_beneficio_unitario', 'x_beneficio_total', 'x_vendidas'
        ]
        
        # Obtener producto
        product_data = odoo_client.read('product.template', [product_id], fields)
        
        if not product_data:
            return None
            
        p = product_data[0]
        
        # Obtener nombre de categoría
        categ_name = None
        if p.get('categ_id'):
            categ_id = p['categ_id'][0] if isinstance(p['categ_id'], list) else p['categ_id']
            categ_data = odoo_client.read('product.category', [categ_id], ['name'])
            if categ_data:
                categ_name = categ_data[0]['name']
        
        # Crear objeto de producto
        product = {
            'id': product_id,
            'name': p['name'],
            'description': p.get('description_sale', ''),
            'list_price': p['list_price'],
            'standard_price': p.get('standard_price', 0),
            'default_code': p.get('default_code', ''),
            'barcode': p.get('barcode', ''),
            'active': p.get('active', True),
            'sale_ok': p.get('sale_ok', True),
            'purchase_ok': p.get('purchase_ok', True),
            'categ_id': p['categ_id'][0] if isinstance(p['categ_id'], list) else p['categ_id'],
            'categ_name': categ_name,
            'image_url': f"/api/v1/products/{product_id}/image" if p.get('image_1920') else None,
            
            # Campos personalizados
            'x_nombre_proveedor': p.get('x_nombre_proveedor', ''),
            'x_marca': p.get('x_marca', ''),
            'x_pvp_web': p.get('x_pvp_web', 0),
            'x_precio_venta_web': p.get('x_precio_venta_web', 0),
            'x_dto': p.get('x_dto', 0),
            'x_precio_margen': p.get('x_precio_margen', 0),
            'x_beneficio': p.get('x_beneficio', 0),
            'x_beneficio_unitario': p.get('x_beneficio_unitario', 0),
            'x_beneficio_total': p.get('x_beneficio_total', 0),
            'x_vendidas': p.get('x_vendidas', 0),
            
            # Alias para compatibilidad con el frontend
            'supplier': p.get('x_nombre_proveedor', ''),
            'brand': p.get('x_marca', ''),
            'price': p['list_price'],
        }
        
        return Product(**product)
    except Exception as e:
        logger.error(f"Error al obtener producto {product_id}: {str(e)}")
        raise

def create_product(product: ProductCreate) -> int:
    """
    Crear un nuevo producto
    """
    try:
        # Preparar valores
        values = {
            'name': product.name,
            'description_sale': product.description,
            'list_price': float(product.list_price),
            'standard_price': float(product.standard_price) if product.standard_price else 0,
            'default_code': product.default_code,
            'barcode': product.barcode,
            'active': product.active,
            'sale_ok': product.sale_ok,
            'purchase_ok': product.purchase_ok,
            'categ_id': product.categ_id,
            'x_nombre_proveedor': product.x_nombre_proveedor,
            'x_marca': product.x_marca,
        }
        
        # Añadir campos personalizados si están presentes
        if product.x_pvp_web is not None:
            values['x_pvp_web'] = float(product.x_pvp_web)
        if product.x_precio_venta_web is not None:
            values['x_precio_venta_web'] = float(product.x_precio_venta_web)
        if product.x_dto is not None:
            values['x_dto'] = float(product.x_dto)
        if product.x_precio_margen is not None:
            values['x_precio_margen'] = float(product.x_precio_margen)
        if product.x_vendidas is not None:
            values['x_vendidas'] = product.x_vendidas
        
        # Crear producto
        product_id = odoo_client.create('product.template', values)
        return product_id
    except Exception as e:
        logger.error(f"Error al crear producto: {str(e)}")
        raise

def update_product(product_id: int, product: ProductUpdate) -> bool:
    """
    Actualizar un producto existente
    """
    try:
        # Preparar valores
        values = {}
        
        if product.name is not None:
            values['name'] = product.name
        if product.description is not None:
            values['description_sale'] = product.description
        if product.list_price is not None:
            values['list_price'] = float(product.list_price)
        if product.standard_price is not None:
            values['standard_price'] = float(product.standard_price)
        if product.default_code is not None:
            values['default_code'] = product.default_code
        if product.barcode is not None:
            values['barcode'] = product.barcode
        if product.active is not None:
            values['active'] = product.active
        if product.sale_ok is not None:
            values['sale_ok'] = product.sale_ok
        if product.purchase_ok is not None:
            values['purchase_ok'] = product.purchase_ok
        if product.categ_id is not None:
            values['categ_id'] = product.categ_id
        if product.x_nombre_proveedor is not None:
            values['x_nombre_proveedor'] = product.x_nombre_proveedor
        if product.x_marca is not None:
            values['x_marca'] = product.x_marca
        
        # Añadir campos personalizados si están presentes
        if product.x_pvp_web is not None:
            values['x_pvp_web'] = float(product.x_pvp_web)
        if product.x_precio_venta_web is not None:
            values['x_precio_venta_web'] = float(product.x_precio_venta_web)
        if product.x_dto is not None:
            values['x_dto'] = float(product.x_dto)
        if product.x_precio_margen is not None:
            values['x_precio_margen'] = float(product.x_precio_margen)
        if product.x_vendidas is not None:
            values['x_vendidas'] = product.x_vendidas
        
        # Actualizar producto
        if values:
            odoo_client.write('product.template', [product_id], values)
            return True
        return False
    except Exception as e:
        logger.error(f"Error al actualizar producto {product_id}: {str(e)}")
        raise

def delete_product(product_id: int) -> bool:
    """
    Eliminar un producto
    """
    try:
        odoo_client.unlink('product.template', [product_id])
        return True
    except Exception as e:
        logger.error(f"Error al eliminar producto {product_id}: {str(e)}")
        raise
