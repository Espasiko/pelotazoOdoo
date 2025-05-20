#!/bin/bash

echo "=== Instalando dependencias para Odoo y el frontend ==="

# Actualizar repositorios
echo "Actualizando repositorios..."
sudo apt update

# Instalar PostgreSQL si no está instalado
if ! command -v psql >/dev/null 2>&1; then
  echo "Instalando PostgreSQL..."
  sudo apt install -y postgresql postgresql-client
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
else
  echo "PostgreSQL ya está instalado"
fi

# Instalar dependencias de Python para Odoo
echo "Instalando dependencias de Python para Odoo..."
sudo apt install -y python3-pip python3-dev python3-venv libxml2-dev libxslt1-dev libldap2-dev libsasl2-dev libssl-dev libpq-dev libjpeg-dev zlib1g-dev

# Crear entorno virtual si no existe
if [ ! -d "odoo-venv" ]; then
  echo "Creando entorno virtual para Odoo..."
  python3 -m venv odoo-venv
fi

# Activar entorno virtual e instalar dependencias de Odoo
echo "Instalando dependencias de Python en el entorno virtual..."
source odoo-venv/bin/activate
pip install wheel
pip install -r odoo/requirements.txt
deactivate

# Instalar Node.js y npm si no están instalados
if ! command -v node >/dev/null 2>&1; then
  echo "Instalando Node.js y npm..."
  sudo apt install -y nodejs npm
else
  echo "Node.js ya está instalado"
fi

# Instalar dependencias del frontend
echo "Instalando dependencias del frontend..."
cd odoo-nextjs-frontend
npm install
cd ..

echo "=== Instalación completada ==="