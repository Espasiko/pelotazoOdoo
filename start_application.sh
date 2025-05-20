#!/bin/bash

echo "=== Iniciando Odoo y el frontend ==="

# Verificar si PostgreSQL está activo
if ! systemctl is-active postgresql >/dev/null 2>&1; then
  echo "Iniciando PostgreSQL..."
  sudo systemctl start postgresql
fi

# Iniciar Odoo en segundo plano
echo "Iniciando Odoo..."
source odoo-venv/bin/activate
cd odoo
python3 odoo-bin --addons-path=addons,../custom_addons -d odoo_pelotazo --db_host=localhost --db_port=5432 --db_user=odoo --db_password=odoo --http-port=8069 &
ODOO_PID=$!
cd ..
deactivate

echo "Odoo iniciado en http://localhost:8069"

# Iniciar el frontend en segundo plano
echo "Iniciando frontend Next.js..."
cd odoo-nextjs-frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Frontend iniciado en http://localhost:3000"

echo "=== Aplicación iniciada ==="
echo "Presiona Ctrl+C para detener ambos servicios"

# Manejar la señal de interrupción (Ctrl+C)
trap "kill $ODOO_PID $FRONTEND_PID; exit" INT

# Mantener el script en ejecución
wait