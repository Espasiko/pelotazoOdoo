#!/bin/bash

# Activar entorno virtual
source /home/espasiko/odoo/odoo-venv/bin/activate

# Iniciar Odoo con la configuración correcta
cd /home/espasiko/odoo/odoo
python odoo-bin -d odoo_pelotazo --db_user=odoo --db_password=odoo --db_host=localhost --addons-path=addons,/home/espasiko/odoo/custom_addons --http-interface=0.0.0.0 --http-port=8069 --limit-time-real=1000 --limit-time-cpu=600