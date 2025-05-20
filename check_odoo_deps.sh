#!/bin/bash

# Verificar Python
echo "=== Python ==="
if command -v python3 >/dev/null 2>&1; then
  echo "Python estu00e1 instalado"
  python3 --version
else
  echo "Python no estu00e1 instalado"
fi

# Verificar pip
echo -e "\n=== pip ==="
if command -v pip3 >/dev/null 2>&1; then
  echo "pip estu00e1 instalado"
  pip3 --version
else
  echo "pip no estu00e1 instalado"
fi

# Verificar entorno virtual
echo -e "\n=== Entorno Virtual ==="
if [ -d "odoo-venv" ]; then
  echo "El entorno virtual odoo-venv existe"
else
  echo "El entorno virtual odoo-venv no existe"
fi

# Verificar Node.js y npm para el frontend
echo -e "\n=== Node.js y npm ==="
if command -v node >/dev/null 2>&1; then
  echo "Node.js estu00e1 instalado"
  node --version
else
  echo "Node.js no estu00e1 instalado"
fi

if command -v npm >/dev/null 2>&1; then
  echo "npm estu00e1 instalado"
  npm --version
else
  echo "npm no estu00e1 instalado"
fi