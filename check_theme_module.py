import xmlrpc.client
import sys

url = 'http://localhost:8069'
db = 'odoo_pelotazo'
username = 'admin'
password = 'admin'

# Autenticación
common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(url))
uid = common.authenticate(db, username, password, {})

if not uid:
    print("Error de autenticación")
    sys.exit(1)

# Modelo
models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(url))

# Buscar el módulo website_theme_install
theme_module = models.execute_kw(db, uid, password,
    'ir.module.module', 'search_read',
    [[['name', '=', 'website_theme_install']]],
    {'fields': ['name', 'state', 'shortdesc']}
)

if theme_module:
    print(f"Módulo de temas: {theme_module[0]['name']}, Estado: {theme_module[0]['state']}")
    
    if theme_module[0]['state'] != 'installed':
        print("Instalando módulo de temas...")
        models.execute_kw(db, uid, password,
            'ir.module.module', 'button_immediate_install',
            [[theme_module[0]['id']]]
        )
        print("Módulo de temas instalado correctamente")
else:
    print("El módulo de temas no se encuentra en la base de datos")
