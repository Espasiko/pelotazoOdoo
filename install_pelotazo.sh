#!/bin/bash

# Script para instalar y configurar el módulo El Pelotazo en Odoo

echo "Configurando PostgreSQL para Odoo..."
# Ejecutar el script de configuración de PostgreSQL
sudo bash /home/espasiko/odoo/setup_postgres.sh

# Activar el entorno virtual de Odoo
cd /home/espasiko/odoo
source odoo-venv/bin/activate

# Detener cualquier instancia de Odoo en ejecución
echo "Deteniendo cualquier instancia de Odoo en ejecución..."
pkill -f "odoo-bin" || true

# Instalar los módulos base necesarios primero
echo "Instalando módulos base de Odoo..."
python odoo/odoo-bin -d odoo_pelotazo -u base,product,stock,sale --addons-path=odoo/addons,custom_addons --stop-after-init

# Instalar o actualizar el módulo pelotazo
echo "Instalando/actualizando el módulo pelotazo..."
python odoo/odoo-bin -d odoo_pelotazo -i pelotazo --addons-path=odoo/addons,custom_addons --stop-after-init

# Iniciar Odoo en segundo plano
echo "Iniciando Odoo en segundo plano..."
python odoo/odoo-bin -d odoo_pelotazo --addons-path=odoo/addons,custom_addons &

echo "Esperando a que Odoo esté disponible..."
sleep 10

# Ejecutar el script de importación
echo "Ejecutando el script de importación de productos..."
python custom_addons/pelotazo/scripts/import_almce.py

echo "Instalación completada. Puedes acceder a Odoo en http://localhost:8069"
echo "Usuario: admin"
echo "Contraseña: admin"
echo ""
echo "Módulos activados: base, product, stock, sale, pelotazo"
echo ""
echo "Para ver los productos importados, ve a Inventario > Productos"