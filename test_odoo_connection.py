import xmlrpc.client
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de Odoo
url = os.getenv("ODOO_URL", "http://localhost:8069")
db = os.getenv("ODOO_DB", "odoo_pelotazo")
username = os.getenv("ODOO_USERNAME", "admin")
password = os.getenv("ODOO_PASSWORD", "admin")

print(f"Conectando a Odoo en {url}...")

# Probar conexión común
common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(url))
print("Versión de Odoo:", common.version())

# Autenticación
uid = common.authenticate(db, username, password, {})
if not uid:
    print("Error: No se pudo autenticar con Odoo. Verifica las credenciales.")
    exit(1)

print(f"Autenticación exitosa. UID: {uid}")

# Obtener información del usuario
models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(url))
user_data = models.execute_kw(db, uid, password, 'res.users', 'read', [uid], {'fields': ['name', 'login', 'email']})
print("Información del usuario:", user_data)

# Listar algunos productos
try:
    products = models.execute_kw(
        db, uid, password,
        'product.template', 'search_read',
        [[('sale_ok', '=', True)]],
        {'fields': ['name', 'list_price'], 'limit': 5}
    )
    print("\nAlgunos productos:")
    for product in products:
        print(f"- {product['name']} (Precio: {product['list_price']})")
except Exception as e:
    print(f"Error al obtener productos: {str(e)}")

print("\nPrueba de conexión completada.")
