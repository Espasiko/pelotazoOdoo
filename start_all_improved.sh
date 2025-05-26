#!/bin/bash

# Definir colores para los mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con formato
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Matar procesos existentes
print_message "Deteniendo procesos existentes..."
pkill -f "odoo-bin" || true
pkill -f "uvicorn" || true
pkill -f "npm run dev" || true
sleep 2

# Iniciar Odoo
print_message "Iniciando Odoo..."
cd /home/espasiko/odoo
python odoo-bin -d odoo_pelotazo --db_user=odoo --db_password=odoo --db_host=localhost --addons-path=addons,/home/espasiko/odoo/custom_addons --http-interface=0.0.0.0 --http-port=8069 --limit-time-real=1000 --limit-time-cpu=600 &
ODOO_PID=$!

# Esperar a que Odoo esté listo
print_message "Esperando a que Odoo esté listo..."
ODOO_READY=false
MAX_RETRIES=30
COUNT=0

while [ $COUNT -lt $MAX_RETRIES ] && [ "$ODOO_READY" = false ]; do
    if curl -s http://localhost:8069 > /dev/null; then
        ODOO_READY=true
        print_message "Odoo está listo en http://localhost:8069"
    else
        COUNT=$((COUNT+1))
        echo -n "."
        sleep 1
    fi
done

if [ "$ODOO_READY" = false ]; then
    print_error "Odoo no está listo después de $MAX_RETRIES segundos. Abortando."
    exit 1
fi

# Iniciar FastAPI
print_message "Iniciando FastAPI middleware..."
cd /home/espasiko/odoo/fastapi_middleware
source /home/espasiko/odoo/odoo-venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
FASTAPI_PID=$!

# Esperar a que FastAPI esté listo
print_message "Esperando a que FastAPI esté listo..."
FASTAPI_READY=false
MAX_RETRIES=15
COUNT=0

while [ $COUNT -lt $MAX_RETRIES ] && [ "$FASTAPI_READY" = false ]; do
    if curl -s http://localhost:8000 > /dev/null; then
        FASTAPI_READY=true
        print_message "FastAPI está listo en http://localhost:8000"
    else
        COUNT=$((COUNT+1))
        echo -n "."
        sleep 1
    fi
done

if [ "$FASTAPI_READY" = false ]; then
    print_warning "FastAPI no está listo después de $MAX_RETRIES segundos. Continuando de todos modos..."
fi

# Iniciar Next.js
print_message "Iniciando frontend Next.js..."
cd /home/espasiko/odoo/odoo-nextjs-frontend-new
npm run dev &
NEXTJS_PID=$!

print_message "Esperando a que Next.js esté listo..."
sleep 5

print_message "Todos los servicios iniciados:"
print_message "- Odoo: http://localhost:8069 (PID: $ODOO_PID)"
print_message "- FastAPI: http://localhost:8000 (PID: $FASTAPI_PID)"
print_message "- Next.js: http://localhost:3000 (PID: $NEXTJS_PID)"
print_message "Presiona Ctrl+C para detener todos los servicios"

# Mantener el script en ejecución
wait $ODOO_PID $FASTAPI_PID $NEXTJS_PID