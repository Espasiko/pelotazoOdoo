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

# Instalar el módulo pelotazo
print("Instalando el módulo 'pelotazo'...")
models.execute_kw(db, uid, password,
    'ir.module.module', 'button_immediate_install',
    [[models.execute_kw(db, uid, password,
        'ir.module.module', 'search',
        [[['name', '=', 'pelotazo']]])[0]]]
)

print("Módulo instalado correctamente")
