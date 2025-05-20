#!/bin/bash

# Configurar PostgreSQL para Odoo
echo "Configurando PostgreSQL para Odoo..."

# Crear usuario odoo en PostgreSQL
sudo -u postgres createuser --createdb --username postgres --no-createrole --no-superuser odoo

# Establecer contraseña para el usuario odoo
sudo -u postgres psql -c "ALTER USER odoo WITH PASSWORD 'odoo';"

# Crear base de datos para Odoo
sudo -u postgres createdb --owner=odoo --template=template0 --encoding=UNICODE odoo_pelotazo

echo "PostgreSQL configurado correctamente."