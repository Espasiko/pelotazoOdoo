#!/bin/bash

# Activar entorno virtual de Odoo
source /home/espasiko/odoo/odoo-venv/bin/activate

# Exportar variables de entorno
export ODOO_URL="http://localhost:8069"
export ODOO_DB="odoo_pelotazo"
export ODOO_USERNAME="admin"
export ODOO_PASSWORD="admin"
export SECRET_KEY="pelotazo_secret_key_change_in_production"

# Iniciar el servidor FastAPI con más información de depuración
echo "Iniciando servidor FastAPI en http://localhost:8000"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level debug
