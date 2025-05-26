#!/usr/bin/env python3
import xmlrpc.client
import time

def import_products():
    # Configuración de la conexión
    url = "http://localhost:8069"
    db = "odoo_pelotazo"
    username = "admin"
    password = "admin"

    print("Conectando a Odoo...")
    common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(url))
    uid = common.authenticate(db, username, password, {})
    models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(url))

    if not uid:
        print("Error: No se pudo autenticar con Odoo")
        return

    # Obtener o crear categorías
    def get_or_create_category(name, parent_id=False):
        domain = [('name', '=', name)]
        if parent_id:
            domain.append(('parent_id', '=', parent_id))
        categories = models.execute_kw(db, uid, password,
            'product.category', 'search_read', [domain], {'fields': ['id']})
        
        if categories:
            return categories[0]['id']
        else:
            return models.execute_kw(db, uid, password, 'product.category', 'create', [{
                'name': name,
                'parent_id': parent_id
            }])

    print("Creando categorías...")
    category_lavadoras = get_or_create_category("Lavadoras")
    category_campanas = get_or_create_category("Campanas")
    category_frigorificos = get_or_create_category("Frigoríficos")
    category_televisores = get_or_create_category("Televisores")

    # Obtener o crear proveedor BSH
    print("Configurando proveedor BSH...")
    supplier_ids = models.execute_kw(db, uid, password,
        'res.partner', 'search', [[('name', '=', 'BSH')]])
    
    if not supplier_ids:
        supplier_id = models.execute_kw(db, uid, password, 'res.partner', 'create', [{
            'name': 'BSH',
            'company_type': 'company',
            'supplier_rank': 1,
            'is_company': True,
            'email': 'info@bsh-group.com',
            'phone': '+34 900 100 123',
            'website': 'https://www.bsh-group.com/es/',
            'vat': 'ESA28000000',
            'street': 'Calle de la Empresa, 1',
            'city': 'Madrid',
            'zip': '28001',
            'country_id': 69,  # España
            'lang': 'es_ES'
        }])
    else:
        supplier_id = supplier_ids[0]

    # Datos de los productos
    products = [
        {
            'default_code': '3TS993BP',
            'name': 'LAVADORA BALAY 3TS993BP',
            'list_price': 659.0,
            'x_precio_venta_web': 535.0,
            'categ_id': category_lavadoras,
            'x_nombre_proveedor': 'BSH',
            'x_marca': 'BALAY',
            'description_sale': 'Carga Frontal – EFICIENCIA ENERGETICA A, Libre instalación, 60 cm., 9 Kg, 1.200 rpm, Blanco, Display LED, tapa desmontable, botón Pausa+carga, motor ExtraSilencio ahorrarás energía y casi ni te enterarás de que tu lavadora está centrifugando.',
            'x_garantia': '10 años de garantía del motor: sustitución, mano de obra y desplazamiento incluido.'
        },
        {
            'default_code': '3TS395BDS',
            'name': 'LAVADORA BALAY AUTODOSIFICACION 9KG',
            'list_price': 819.0,
            'x_precio_venta_web': 589.0,
            'categ_id': category_lavadoras,
            'x_nombre_proveedor': 'BSH',
            'x_marca': 'BALAY',
            'description_sale': 'Motor ExtraSilencio: Su motor ExtraSilencio tiene 10 años de garantía. Función Pausa+carga, Programa Plancha, Tecnología AquaControl Plus. Reducción de ruido con paneles antivibración y Sensor 3G que corrige cualquier posible desequilibrio de la carga, reduciendo la potencia sonora al mínimo. Tambor VarioSoft. Indicación de tiempo restante: gracias al display LED.',
            'x_garantia': '10 años de garantía del motor'
        },
        {
            'default_code': 'WM12N265ES',
            'name': 'iQ300, Lavadora SIEMENS de carga frontal, 8 kg, 1200 r.p.m., Blanco',
            'list_price': 669.0,
            'x_precio_venta_web': 489.0,
            'categ_id': category_lavadoras,
            'x_nombre_proveedor': 'BSH',
            'x_marca': 'SIEMENS',
            'description_sale': 'Lavadoras superrápidas: con los programas Express 15 min y Express 30 min. Eficiencia energética Clase A. SmartFinish: Dedica menos tiempo a planchar, las prendas más arrugadas se alisan visiblemente en solo 20 minutos. Motor iQdrive con 10 años de garantía. Tambor waveDrum.',
            'x_garantia': '10 años de garantía del motor'
        },
        {
            'default_code': 'CLT704VIN',
            'name': 'LAVADORA CORBERÓ 7KG',
            'list_price': 376.0,
            'x_precio_venta_web': 339.0,
            'categ_id': category_lavadoras,
            'x_nombre_proveedor': 'BSH',
            'x_marca': 'CORBERÓ',
            'description_sale': 'Lavad. Corbero CLT704VIN, Carga Frontal, 7 Kg, 1400 Rpm, Motor Inverter, Color Blanco, 16 Programas, Vapor, Antialérgico, Inicio diferido 3-24 Horas, Lavado Rápido de 15-30 Min., Puerta XXL, Eficiencia Energética A.',
            'x_garantia': '2 años de garantía'
        }
    ]

    print("Importando productos...")
    for product_data in products:
        # Verificar si el producto ya existe
        product_ids = models.execute_kw(db, uid, password,
            'product.template', 'search', [[('default_code', '=', product_data['default_code'])]])
        
        if product_ids:
            print(f"Actualizando producto {product_data['name']}...")
            models.execute_kw(db, uid, password, 'product.template', 'write', [product_ids, product_data])
        else:
            print(f"Creando producto {product_data['name']}...")
            # Añadir campos obligatorios
            product_data.update({
                'type': 'product',
                'sale_ok': True,
                'purchase_ok': True,
                'available_in_pos': True,
                'invoice_policy': 'order',
                'sale_line_warn': 'no-message',
                'purchase_line_warn': 'no-message',
                'tracking': 'none',
                'uom_id': 1,  # Unidades
                'uom_po_id': 1,  # Unidades
                'description_purchase': 'Proveedor: ' + product_data.get('x_nombre_proveedor', '')
            })
            models.execute_kw(db, uid, password, 'product.template', 'create', [product_data])

    print("¡Productos importados exitosamente!")

if __name__ == "__main__":
    # Esperar a que Odoo esté listo
    print("Esperando a que Odoo esté listo...")
    time.sleep(30)  # Dar más tiempo para asegurar que Odoo esté listo
    import_products()
