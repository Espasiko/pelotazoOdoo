from typing import List, Optional
from app.core.odoo_client import odoo_client
from app.models.supplier import Supplier, SupplierCreate, SupplierUpdate, SupplierList
import logging

logger = logging.getLogger(__name__)

# Lista de proveedores específicos que deben estar disponibles
REQUIRED_SUPPLIERS = [
    "Abrila", "Aguaconfort", "Becken", "Tegaluxe", "EAS-Johnson", 
    "Ufesa", "Vitrokitchen", "Nevir", "Mielectro", "Electrodirecto"
]

def get_suppliers(
    limit: int = 100,
    offset: int = 0,
    search: Optional[str] = None,
) -> SupplierList:
    """
    Obtener lista de proveedores con filtros y paginación
    """
    try:
        # Construir dominio de búsqueda
        domain = [('supplier_rank', '>', 0)]  # Solo proveedores
        if search:
            domain.append(('name', 'ilike', search))
            
        # Campos a recuperar
        fields = [
            'name', 'vat', 'email', 'phone', 'mobile', 
            'street', 'city', 'zip', 'country_id', 'supplier_rank', 'active'
        ]
        
        # Obtener total de registros
        total = odoo_client.execute_kw(
            'res.partner', 'search_count', [domain]
        )
        
        # Obtener proveedores
        suppliers_data = odoo_client.search_read(
            'res.partner', domain, fields, limit=limit, offset=offset, order='name'
        )
        
        # Procesar resultados
        suppliers = []
        for s in suppliers_data:
            # Obtener nombre del país
            country_name = None
            if s.get('country_id'):
                country_id = s['country_id'][0] if isinstance(s['country_id'], list) else s['country_id']
                country_data = odoo_client.read('res.country', [country_id], ['name'])
                if country_data:
                    country_name = country_data[0]['name']
            
            # Crear objeto de proveedor
            supplier = {
                'id': s['id'],
                'name': s['name'],
                'vat': s.get('vat', ''),
                'email': s.get('email', ''),
                'phone': s.get('phone', ''),
                'mobile': s.get('mobile', ''),
                'street': s.get('street', ''),
                'city': s.get('city', ''),
                'zip': s.get('zip', ''),
                'country_id': s['country_id'][0] if s.get('country_id') and isinstance(s['country_id'], list) else s.get('country_id'),
                'country_name': country_name,
                'supplier_rank': s.get('supplier_rank', 1),
                'active': s.get('active', True),
            }
            suppliers.append(Supplier(**supplier))
        
        # Calcular páginas
        pages = (total + limit - 1) // limit if limit > 0 else 1
        page = (offset // limit) + 1 if limit > 0 else 1
        
        return SupplierList(
            data=suppliers,
            total=total,
            page=page,
            page_size=limit,
            pages=pages
        )
    except Exception as e:
        logger.error(f"Error al obtener proveedores: {str(e)}")
        raise

def get_supplier(supplier_id: int) -> Supplier:
    """
    Obtener un proveedor por su ID
    """
    try:
        # Campos a recuperar
        fields = [
            'name', 'vat', 'email', 'phone', 'mobile', 
            'street', 'city', 'zip', 'country_id', 'supplier_rank', 'active'
        ]
        
        # Obtener proveedor
        supplier_data = odoo_client.read('res.partner', [supplier_id], fields)
        
        if not supplier_data:
            return None
            
        s = supplier_data[0]
        
        # Obtener nombre del país
        country_name = None
        if s.get('country_id'):
            country_id = s['country_id'][0] if isinstance(s['country_id'], list) else s['country_id']
            country_data = odoo_client.read('res.country', [country_id], ['name'])
            if country_data:
                country_name = country_data[0]['name']
        
        # Crear objeto de proveedor
        supplier = {
            'id': supplier_id,
            'name': s['name'],
            'vat': s.get('vat', ''),
            'email': s.get('email', ''),
            'phone': s.get('phone', ''),
            'mobile': s.get('mobile', ''),
            'street': s.get('street', ''),
            'city': s.get('city', ''),
            'zip': s.get('zip', ''),
            'country_id': s['country_id'][0] if s.get('country_id') and isinstance(s['country_id'], list) else s.get('country_id'),
            'country_name': country_name,
            'supplier_rank': s.get('supplier_rank', 1),
            'active': s.get('active', True),
        }
        
        return Supplier(**supplier)
    except Exception as e:
        logger.error(f"Error al obtener proveedor {supplier_id}: {str(e)}")
        raise

def create_supplier(supplier: SupplierCreate) -> int:
    """
    Crear un nuevo proveedor
    """
    try:
        # Preparar valores
        values = {
            'name': supplier.name,
            'vat': supplier.vat,
            'email': supplier.email,
            'phone': supplier.phone,
            'mobile': supplier.mobile,
            'street': supplier.street,
            'city': supplier.city,
            'zip': supplier.zip,
            'country_id': supplier.country_id,
            'supplier_rank': supplier.supplier_rank,
            'active': supplier.active,
            'is_company': True,  # Los proveedores son empresas
        }
        
        # Crear proveedor
        supplier_id = odoo_client.create('res.partner', values)
        return supplier_id
    except Exception as e:
        logger.error(f"Error al crear proveedor: {str(e)}")
        raise

def update_supplier(supplier_id: int, supplier: SupplierUpdate) -> bool:
    """
    Actualizar un proveedor existente
    """
    try:
        # Preparar valores
        values = {}
        
        if supplier.name is not None:
            values['name'] = supplier.name
        if supplier.vat is not None:
            values['vat'] = supplier.vat
        if supplier.email is not None:
            values['email'] = supplier.email
        if supplier.phone is not None:
            values['phone'] = supplier.phone
        if supplier.mobile is not None:
            values['mobile'] = supplier.mobile
        if supplier.street is not None:
            values['street'] = supplier.street
        if supplier.city is not None:
            values['city'] = supplier.city
        if supplier.zip is not None:
            values['zip'] = supplier.zip
        if supplier.country_id is not None:
            values['country_id'] = supplier.country_id
        if supplier.supplier_rank is not None:
            values['supplier_rank'] = supplier.supplier_rank
        if supplier.active is not None:
            values['active'] = supplier.active
        
        # Actualizar proveedor
        if values:
            odoo_client.write('res.partner', [supplier_id], values)
            return True
        return False
    except Exception as e:
        logger.error(f"Error al actualizar proveedor {supplier_id}: {str(e)}")
        raise

def delete_supplier(supplier_id: int) -> bool:
    """
    Eliminar un proveedor
    """
    try:
        odoo_client.unlink('res.partner', [supplier_id])
        return True
    except Exception as e:
        logger.error(f"Error al eliminar proveedor {supplier_id}: {str(e)}")
        raise

def ensure_required_suppliers_exist():
    """
    Asegurar que los proveedores requeridos existan en el sistema
    """
    try:
        for supplier_name in REQUIRED_SUPPLIERS:
            # Verificar si el proveedor ya existe
            domain = [('name', '=', supplier_name), ('supplier_rank', '>', 0)]
            supplier_ids = odoo_client.execute_kw(
                'res.partner', 'search', [domain]
            )
            
            # Si no existe, crearlo
            if not supplier_ids:
                values = {
                    'name': supplier_name,
                    'supplier_rank': 1,
                    'is_company': True,
                    'active': True,
                }
                odoo_client.create('res.partner', values)
                logger.info(f"Proveedor {supplier_name} creado correctamente")
        
        return True
    except Exception as e:
        logger.error(f"Error al asegurar proveedores requeridos: {str(e)}")
        raise

def import_suppliers_from_json_files():
    """
    Importar proveedores desde los archivos JSON
    """
    # Esta función se implementará más adelante para importar proveedores
    # desde los archivos que empiezan por PVP en la carpeta jsons
    pass
