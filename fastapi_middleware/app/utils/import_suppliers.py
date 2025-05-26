import os
import json
import logging
from app.core.odoo_client import odoo_client
from app.services.supplier import REQUIRED_SUPPLIERS, ensure_required_suppliers_exist

logger = logging.getLogger(__name__)

def import_suppliers_from_json():
    """
    Importar proveedores desde los archivos JSON que empiezan por PVP
    en la carpeta jsons y asegurar que los proveedores requeridos existen
    """
    try:
        # Primero asegurar que los proveedores requeridos existen
        ensure_required_suppliers_exist()
        
        # Buscar archivos JSON en la carpeta jsons
        json_dir = "/home/espasiko/odoo/custom_addons/pelotazo/jsons"
        if not os.path.exists(json_dir):
            logger.warning(f"Directorio de JSONs no encontrado: {json_dir}")
            return False
            
        # Obtener lista de archivos que empiezan por PVP
        json_files = [f for f in os.listdir(json_dir) if f.startswith("PVP") and f.endswith(".json")]
        
        if not json_files:
            logger.warning("No se encontraron archivos JSON que empiecen por PVP")
            return False
            
        # Procesar cada archivo
        suppliers_found = set()
        for json_file in json_files:
            file_path = os.path.join(json_dir, json_file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                # Extraer proveedores de los productos
                for product in data.get('products', []):
                    supplier_name = product.get('supplier', '')
                    if supplier_name and supplier_name.lower() != 'genérico' and supplier_name not in suppliers_found:
                        suppliers_found.add(supplier_name)
                        
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
            except Exception as e:
                logger.error(f"Error al procesar archivo {json_file}: {str(e)}")
                continue
                
        logger.info(f"Se encontraron {len(suppliers_found)} proveedores en los archivos JSON")
        return True
    except Exception as e:
        logger.error(f"Error al importar proveedores desde JSON: {str(e)}")
        return False

if __name__ == "__main__":
    # Configurar logging
    logging.basicConfig(level=logging.INFO)
    
    # Importar proveedores
    import_suppliers_from_json()
