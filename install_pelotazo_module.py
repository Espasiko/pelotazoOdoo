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

# Buscar el módulo pelotazo
pelotazo_module = models.execute_kw(db, uid, password,
    'ir.module.module', 'search_read',
    [[['name', '=', 'pelotazo']]],
    {'fields': ['name', 'state', 'shortdesc']}
)

if pelotazo_module:
    print(f"Módulo El Pelotazo encontrado: {pelotazo_module[0]['name']}, Estado: {pelotazo_module[0]['state']}")
    
    if pelotazo_module[0]['state'] != 'installed':
        print("Instalando módulo El Pelotazo...")
        try:
            models.execute_kw(db, uid, password,
                'ir.module.module', 'button_immediate_install',
                [[pelotazo_module[0]['id']]]
            )
            print("Módulo El Pelotazo instalado correctamente")
        except Exception as e:
            print(f"Error al instalar el módulo: {e}")
    else:
        print("El módulo ya está instalado. Actualizando...")
        try:
            models.execute_kw(db, uid, password,
                'ir.module.module', 'button_immediate_upgrade',
                [[pelotazo_module[0]['id']]]
            )
            print("Módulo El Pelotazo actualizado correctamente")
        except Exception as e:
            print(f"Error al actualizar el módulo: {e}")
else:
    print("El módulo 'pelotazo' no se encuentra en la base de datos")
    sys.exit(1)
