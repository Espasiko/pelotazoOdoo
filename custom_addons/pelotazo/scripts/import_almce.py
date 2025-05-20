#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import os
import xmlrpc.client
import re
from decimal import Decimal

# Configuración de conexión a Odoo
URL = 'http://localhost:8069'
DB = 'odoo_pelotazo'
USERNAME = 'admin'
PASSWORD = 'admin'

# Directorio con archivos CSV
CSV_DIR = '/home/espasiko/odoo/pelotanew-link/csv'

def connect_to_odoo():
    """Establece conexión con el servidor Odoo"""
    common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(URL))
    uid = common.authenticate(DB, USERNAME, PASSWORD, {})
    models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(URL))
    return uid, models

def clean_number(value):
    """Limpia y convierte un valor a número decimal"""
    if not value or value.strip() == '':
        return 0.0
    
    # Eliminar símbolos de moneda y espacios
    clean_value = re.sub(r'[€\s]', '', value.strip())
    
    # Reemplazar coma por punto para decimales
    clean_value = clean_value.replace(',', '.')
    
    try:
        return float(clean_value)
    except ValueError:
        return 0.0

def create_or_get_provider(uid, models, provider_name):
    """Crea o recupera un proveedor por nombre"""
    provider_id = models.execute_kw(DB, uid, PASSWORD, 'res.partner', 'search', 
                                  [[('name', '=', provider_name)]])
    
    if not provider_id:
        provider_id = models.execute_kw(DB, uid, PASSWORD, 'res.partner', 'create', [{
            'name': provider_name,
            'is_company': True,
            'supplier': True,  # Para versiones antiguas de Odoo
            'x_activo_proveedor': True
        }])
        print(f"Proveedor creado: {provider_name} (ID: {provider_id})")
    else:
        provider_id = provider_id[0]
        print(f"Proveedor existente: {provider_name} (ID: {provider_id})")
    
    return provider_id

def create_or_get_category(uid, models, category_name):
    """Crea o recupera una categoría por nombre"""
    if not category_name or category_name.strip() == '':
        # Usar categoría por defecto
        return 1
    
    category_id = models.execute_kw(DB, uid, PASSWORD, 'product.category', 'search', 
                                  [[('name', '=', category_name)]])
    
    if not category_id:
        category_id = models.execute_kw(DB, uid, PASSWORD, 'product.category', 'create', [{
            'name': category_name
        }])
        print(f"Categoría creada: {category_name} (ID: {category_id})")
    else:
        category_id = category_id[0]
        print(f"Categoría existente: {category_name} (ID: {category_id})")
    
    return category_id

def detect_brand_in_csv(lines):
    """Detecta las marcas presentes en el archivo CSV"""
    brands = []
    for line in lines:
        if ',' not in line:
            continue
        
        parts = line.split(',')
        if len(parts) > 1 and parts[1].strip() in ['BENAVENT', 'CORBERÓ', 'TEKA', 'FAGOR', 'BALAY']:
            brands.append(parts[1].strip())
    
    return brands

def import_almce_products():
    """Importa productos de los archivos CSV de ALMCE"""
    uid, models = connect_to_odoo()
    
    # Crear o recuperar proveedor ALMCE
    provider_id = create_or_get_provider(uid, models, 'ALMCE')
    
    # Contador de productos procesados
    processed_count = 0
    
    # Procesar cada archivo CSV
    for filename in os.listdir(CSV_DIR):
        if filename.startswith('PVP ALMCE') and filename.endswith('.csv'):
            # Extraer nombre de categoría del nombre del archivo
            category_name = filename.split('-')[-1].strip().split('.')[0]
            
            # Crear o recuperar categoría
            category_id = create_or_get_category(uid, models, category_name)
            
            print(f"\nProcesando archivo: {filename}")
            print(f"Categoría: {category_name} (ID: {category_id})")
            
            # Leer archivo CSV
            csv_path = os.path.join(CSV_DIR, filename)
            try:
                with open(csv_path, 'r', encoding='utf-8') as f:
                    # Leer todas las líneas
                    lines = f.readlines()
                    
                    # Detectar marcas en el archivo
                    brands = detect_brand_in_csv(lines)
                    print(f"Marcas detectadas: {brands}")
                    
                    # Encontrar la fila de encabezados
                    header_index = -1
                    for i, line in enumerate(lines):
                        if 'CÓDIGO,DESCRIPCIÓN' in line:
                            header_index = i
                            break
                    
                    if header_index == -1:
                        print(f"No se encontró encabezado en {filename}, omitiendo archivo")
                        continue
                    
                    # Crear un lector CSV con los encabezados correctos
                    reader = csv.DictReader(lines[header_index:])
                    
                    # Variables para seguir la marca actual
                    current_brand = None
                    
                    # Procesar cada fila
                    for row in reader:
                        # Verificar si hay un código de producto válido
                        if not row.get('CÓDIGO') or row['CÓDIGO'].strip() == '':
                            # Verificar si esta fila indica una marca
                            for key, value in row.items():
                                if value and value.strip() in brands:
                                    current_brand = value.strip()
                                    print(f"Cambiando a marca: {current_brand}")
                                    break
                            continue
                        
                        # Convertir valores numéricos
                        precio_compra = clean_number(row.get('IMPORTE BRUTO', '0'))
                        precio_venta = clean_number(row.get('P.V.P FINAL CLIENTE', '0'))
                        pvp_web = clean_number(row.get('P.V.P     WEB', '0'))
                        descuento = clean_number(row.get('DTO', '0'))
                        precio_margen = clean_number(row.get('PRECIO CON MARGEN 25%', '0'))
                        
                        # Unidades y stock
                        unidades = 0
                        if row.get('UNID.') and row['UNID.'].strip():
                            try:
                                unidades = int(row['UNID.'].strip())
                            except ValueError:
                                unidades = 0
                        
                        stock = 0
                        if row.get('QUEDAN EN TIENDA') and row['QUEDAN EN TIENDA'].strip():
                            try:
                                stock = int(row['QUEDAN EN TIENDA'].strip())
                            except ValueError:
                                stock = 0
                        
                        # Buscar producto por código
                        product_code = row['CÓDIGO'].strip()
                        product_id = models.execute_kw(DB, uid, PASSWORD, 'product.template', 'search', 
                                                    [[('default_code', '=', product_code)]])
                        
                        # Datos del producto
                        product_data = {
                            'name': row['DESCRIPCIÓN'].strip(),
                            'default_code': product_code,
                            'standard_price': precio_compra,
                            'list_price': precio_venta,
                            'categ_id': category_id,
                            'type': 'product',
                            'x_pvp_web': pvp_web,
                            'x_dto': descuento,
                            'x_precio_margen': precio_margen,
                            'x_nombre_proveedor': 'ALMCE',
                            'x_marca': current_brand,
                            'x_vendidas': unidades,
                        }
                        
                        # Crear o actualizar producto
                        if not product_id:
                            product_id = models.execute_kw(DB, uid, PASSWORD, 'product.template', 'create', [product_data])
                            print(f"Producto creado: {product_code} - {row['DESCRIPCIÓN'].strip()} (ID: {product_id})")
                        else:
                            product_id = product_id[0]
                            models.execute_kw(DB, uid, PASSWORD, 'product.template', 'write', [product_id, product_data])
                            print(f"Producto actualizado: {product_code} - {row['DESCRIPCIÓN'].strip()} (ID: {product_id})")
                        
                        # Actualizar relación con proveedor
                        seller_ids = models.execute_kw(DB, uid, PASSWORD, 'product.supplierinfo', 'search', 
                                                    [[('product_tmpl_id', '=', product_id), 
                                                      ('name', '=', provider_id)]])
                        
                        if not seller_ids:
                            models.execute_kw(DB, uid, PASSWORD, 'product.supplierinfo', 'create', [{
                                'product_tmpl_id': product_id,
                                'name': provider_id,
                                'min_qty': 1,
                                'price': precio_compra,
                            }])
                        
                        # Actualizar inventario si hay stock
                        if stock > 0:
                            # Obtener el product.product asociado al template
                            product_variant_ids = models.execute_kw(DB, uid, PASSWORD, 'product.product', 'search', 
                                                                [[('product_tmpl_id', '=', product_id)]])
                            
                            if product_variant_ids:
                                # Verificar si ya existe un quant para este producto
                                quant_ids = models.execute_kw(DB, uid, PASSWORD, 'stock.quant', 'search', 
                                                          [[('product_id', '=', product_variant_ids[0]), 
                                                            ('location_id.usage', '=', 'internal')]])
                                
                                if quant_ids:
                                    # Actualizar quant existente
                                    models.execute_kw(DB, uid, PASSWORD, 'stock.quant', 'write', 
                                                   [quant_ids[0], {'quantity': stock}])
                                else:
                                    # Crear nuevo quant
                                    # Buscar ubicación de stock interna
                                    location_ids = models.execute_kw(DB, uid, PASSWORD, 'stock.location', 'search', 
                                                                 [[('usage', '=', 'internal')]], {'limit': 1})
                                    
                                    if location_ids:
                                        models.execute_kw(DB, uid, PASSWORD, 'stock.quant', 'create', [{
                                            'product_id': product_variant_ids[0],
                                            'location_id': location_ids[0],
                                            'quantity': stock
                                        }])
                        
                        processed_count += 1
                
            except Exception as e:
                print(f"Error procesando {filename}: {str(e)}")
    
    print(f"\nImportación completada. {processed_count} productos procesados.")

if __name__ == "__main__":
    import_almce_products()