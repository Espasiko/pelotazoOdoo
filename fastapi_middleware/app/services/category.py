from typing import List, Optional
from app.core.odoo_client import odoo_client
from app.models.category import Category, CategoryCreate, CategoryUpdate, CategoryList
import logging

logger = logging.getLogger(__name__)

def get_categories(
    limit: int = 100,
    offset: int = 0,
    search: Optional[str] = None,
    parent_id: Optional[int] = None,
) -> CategoryList:
    """
    Obtener lista de categorías con filtros y paginación
    """
    try:
        # Construir dominio de búsqueda
        domain = []
        if search:
            domain.append(('name', 'ilike', search))
        
        if parent_id is not None:
            domain.append(('parent_id', '=', parent_id))
            
        # Campos a recuperar
        fields = ['name', 'parent_id', 'complete_name', 'child_id']
        
        # Obtener total de registros
        total = odoo_client.execute_kw(
            'product.category', 'search_count', [domain]
        )
        
        # Obtener categorías
        categories_data = odoo_client.search_read(
            'product.category', domain, fields, limit=limit, offset=offset, order='complete_name'
        )
        
        # Procesar resultados
        categories = []
        for c in categories_data:
            # Crear objeto de categoría
            category = {
                'id': c['id'],
                'name': c['name'],
                'parent_id': c['parent_id'][0] if c.get('parent_id') and isinstance(c['parent_id'], list) else c.get('parent_id'),
                'complete_name': c.get('complete_name', c['name']),
                'child_ids': c.get('child_id', []),
            }
            categories.append(Category(**category))
        
        # Calcular páginas
        pages = (total + limit - 1) // limit if limit > 0 else 1
        page = (offset // limit) + 1 if limit > 0 else 1
        
        return CategoryList(
            data=categories,
            total=total,
            page=page,
            page_size=limit,
            pages=pages
        )
    except Exception as e:
        logger.error(f"Error al obtener categorías: {str(e)}")
        raise

def get_category(category_id: int) -> Category:
    """
    Obtener una categoría por su ID
    """
    try:
        # Campos a recuperar
        fields = ['name', 'parent_id', 'complete_name', 'child_id']
        
        # Obtener categoría
        category_data = odoo_client.read('product.category', [category_id], fields)
        
        if not category_data:
            return None
            
        c = category_data[0]
        
        # Crear objeto de categoría
        category = {
            'id': category_id,
            'name': c['name'],
            'parent_id': c['parent_id'][0] if c.get('parent_id') and isinstance(c['parent_id'], list) else c.get('parent_id'),
            'complete_name': c.get('complete_name', c['name']),
            'child_ids': c.get('child_id', []),
        }
        
        return Category(**category)
    except Exception as e:
        logger.error(f"Error al obtener categoría {category_id}: {str(e)}")
        raise

def create_category(category: CategoryCreate) -> int:
    """
    Crear una nueva categoría
    """
    try:
        # Preparar valores
        values = {
            'name': category.name,
        }
        
        if category.parent_id is not None:
            values['parent_id'] = category.parent_id
        
        # Crear categoría
        category_id = odoo_client.create('product.category', values)
        return category_id
    except Exception as e:
        logger.error(f"Error al crear categoría: {str(e)}")
        raise

def update_category(category_id: int, category: CategoryUpdate) -> bool:
    """
    Actualizar una categoría existente
    """
    try:
        # Preparar valores
        values = {}
        
        if category.name is not None:
            values['name'] = category.name
        if category.parent_id is not None:
            values['parent_id'] = category.parent_id
        
        # Actualizar categoría
        if values:
            odoo_client.write('product.category', [category_id], values)
            return True
        return False
    except Exception as e:
        logger.error(f"Error al actualizar categoría {category_id}: {str(e)}")
        raise

def delete_category(category_id: int) -> bool:
    """
    Eliminar una categoría
    """
    try:
        odoo_client.unlink('product.category', [category_id])
        return True
    except Exception as e:
        logger.error(f"Error al eliminar categoría {category_id}: {str(e)}")
        raise
