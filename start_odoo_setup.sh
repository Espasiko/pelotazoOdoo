#!/bin/bash

# Detener cualquier instancia de Odoo en ejecución
echo "Deteniendo instancias de Odoo en ejecución..."
pkill -f "python3 odoo-bin"

# Crear directorio para logs si no existe
mkdir -p /home/espasiko/odoo/logs

# Iniciar Odoo en segundo plano
echo "Iniciando Odoo..."
cd /home/espasiko/odoo
nohup python3 odoo-bin -c odoo.conf --dev=all --log-level=info --logfile=/home/espasiko/odoo/logs/odoo.log &

# Esperar a que Odoo esté listo
echo "Esperando a que Odoo esté listo (esto puede tardar unos minutos)..."
sleep 60

# Ejecutar configuración de Odoo
echo "Ejecutando configuración de Odoo..."
python3 setup_odoo.py

# Esperar un poco más para asegurar que la configuración se aplique
echo "Esperando a que se complete la configuración..."
sleep 30

# Importar productos
echo "Importando productos..."
python3 import_products.py

echo ""
echo "========================================"
echo "¡Configuración completada con éxito!"
echo "Puedes acceder a Odoo en: http://localhost:8069"
echo "Usuario: admin"
echo "Contraseña: admin"
echo ""
echo "El frontend de Next.js está disponible en: http://localhost:3000"
echo "========================================"

# Mostrar logs en tiempo real
tail -f /home/espasiko/odoo/logs/odoo.log
