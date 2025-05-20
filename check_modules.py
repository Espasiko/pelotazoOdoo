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

# Listar módulos instalados
modules = models.execute_kw(db, uid, password,
    'ir.module.module', 'search_read',
    [[['state', '=', 'installed']]],
    {'fields': ['name', 'state', 'shortdesc']}
)

print("Módulos instalados:")
for module in modules:
    print(f"- {module['name']} ({module['shortdesc']})")

# Buscar específicamente el módulo pelotazo
pelotazo_module = models.execute_kw(db, uid, password,
    'ir.module.module', 'search_read',
    [[['name', '=', 'pelotazo']]],
    {'fields': ['name', 'state', 'shortdesc']}
)

if pelotazo_module:
    print("\nMódulo El Pelotazo:")
    print(f"- Nombre: {pelotazo_module[0]['name']}")
    print(f"- Estado: {pelotazo_module[0]['state']}")
    print(f"- Descripción: {pelotazo_module[0]['shortdesc']}")
else:
    print("\nEl módulo 'pelotazo' no se encuentra en la base de datos")

# Buscar website_sale
website_sale = models.execute_kw(db, uid, password,
    'ir.module.module', 'search_read',
    [[['name', '=', 'website_sale']]],
    {'fields': ['name', 'state', 'shortdesc']}
)

if website_sale:
    print("\nMódulo Website Sale (Tienda online):")
    print(f"- Nombre: {website_sale[0]['name']}")
    print(f"- Estado: {website_sale[0]['state']}")
    print(f"- Descripción: {website_sale[0]['shortdesc']}")
else:
    print("\nEl módulo 'website_sale' no se encuentra en la base de datos")
