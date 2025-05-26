#!/usr/bin/env python3
import xmlrpc.client
import time

def setup_odoo():
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

    print("Configurando empresa...")
    # Configurar empresa
    company_id = models.execute_kw(db, uid, password,
        'res.company', 'search', [[('id', '=', 1)]])[0]
    
    models.execute_kw(db, uid, password, 'res.company', 'write', [company_id, {
        'name': 'Antonio Bonachera',
        'email': 'info@elpelotazo.com',
        'phone': '+34 123 456 789',
        'vat': 'ESB12345678',
        'street': 'Calle Principal 123',
        'zip': '28001',
        'city': 'Madrid',
        'country_id': 69,  # ID de España en Odoo
        'currency_id': 3,  # EUR
        'website': 'https://www.elpelotazo.com'
    }])

    print("Configurando usuario administrador...")
    # Configurar usuario administrador
    admin_id = models.execute_kw(db, uid, password,
        'res.users', 'search', [[('login', '=', 'admin')]])[0]
    
    models.execute_kw(db, uid, password, 'res.users', 'write', [admin_id, {
        'name': 'Desi',
        'email': 'desi@elpelotazo.com',
        'phone': '+34 987 654 321'
    }])

    print("Configurando la tienda en línea...")
    # Configurar tienda en línea
    website_ids = models.execute_kw(db, uid, password,
        'website', 'search', [[('id', '>', 0)]])
    
    if website_ids:
        models.execute_kw(db, uid, password, 'website', 'write', [website_ids[0], {
            'name': 'El Pelotazo Electro y Hogar',
            'company_id': company_id,
            'default_lang_id': 71,  # Español
            'default_lang_code': 'es_ES',
            'cookies_bar': True,
            'cookies_bar_content': 'Utilizamos cookies propias y de terceros para mejorar nuestros servicios y mostrarte publicidad relacionada con tus preferencias mediante el análisis de tus hábitos de navegación.'
        }])

    print("Configuración completada con éxito!")

if __name__ == "__main__":
    # Esperar a que Odoo esté listo
    print("Esperando a que Odoo esté listo...")
    time.sleep(20)
    setup_odoo()
