#!/bin/bash

# Script para instalar el idioma español en Odoo

echo "Instalando el idioma español en Odoo..."

# Activar el entorno virtual de Odoo
cd /home/espasiko/odoo
source odoo-venv/bin/activate

# Detener cualquier instancia de Odoo en ejecución
echo "Deteniendo cualquier instancia de Odoo en ejecución..."
pkill -f "odoo-bin" || true

# Instalar el módulo de traducción español
echo "Instalando el módulo de traducción español..."
python odoo/odoo-bin -d odoo_pelotazo -i base_setup,l10n_es --addons-path=odoo/addons,custom_addons --stop-after-init

# Configurar el idioma español como predeterminado
echo "Configurando el idioma español como predeterminado..."
python - << EOF
import xmlrpc.client

# Configuración de conexión a Odoo
url = 'http://localhost:8069'
db = 'odoo_pelotazo'
username = 'admin'
password = 'admin'

# Autenticación
common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(url))
uid = common.authenticate(db, username, password, {})
models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(url))

# Obtener el ID del idioma español
lang_ids = models.execute_kw(db, uid, password, 'res.lang', 'search', [[('code', '=', 'es_ES')]])
if not lang_ids:
    # Si no existe, activar el idioma español
    models.execute_kw(db, uid, password, 'res.lang', 'load_lang', ['es_ES'])
    lang_ids = models.execute_kw(db, uid, password, 'res.lang', 'search', [[('code', '=', 'es_ES')]])

# Activar el idioma español
if lang_ids:
    models.execute_kw(db, uid, password, 'res.lang', 'write', [lang_ids, {'active': True}])
    
    # Establecer español como idioma predeterminado para el usuario admin
    models.execute_kw(db, uid, password, 'res.users', 'write', [uid, {'lang': 'es_ES'}])
    
    # Establecer español como idioma predeterminado para la compañía
    company_ids = models.execute_kw(db, uid, password, 'res.company', 'search', [[]])
    if company_ids:
        models.execute_kw(db, uid, password, 'res.company', 'write', [company_ids, {'partner_id.lang': 'es_ES'}])
    
    print("Idioma español configurado correctamente.")
else:
    print("No se pudo encontrar o activar el idioma español.")
EOF

# Iniciar Odoo en segundo plano
echo "Iniciando Odoo en segundo plano..."
python odoo/odoo-bin -d odoo_pelotazo --addons-path=odoo/addons,custom_addons &

echo "Instalación completada. Puedes acceder a Odoo en http://localhost:8069"
echo "El idioma debería estar configurado en español."
echo "Si no ves la interfaz en español, sigue estos pasos:"
echo "1. Inicia sesión con usuario 'admin' y contraseña 'admin'"
echo "2. Ve a Configuración > Traducciones > Idiomas"
echo "3. Asegúrate de que 'Español / Spanish' esté instalado y activado"
echo "4. Ve a Preferencias de usuario (menú de la esquina superior derecha)"
echo "5. Cambia el idioma a 'Español / Spanish' y guarda"