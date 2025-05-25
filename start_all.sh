#!/bin/bash

# Colores para la salida
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Iniciando servicios para El Pelotazo...${NC}"

# Directorio base
BASE_DIR="/home/espasiko/odoo"

# Iniciar Odoo en segundo plano
echo -e "${YELLOW}Iniciando Odoo...${NC}"
cd $BASE_DIR
./start_application.sh &
ODOO_PID=$!
echo -e "${GREEN}Odoo iniciado con PID: $ODOO_PID${NC}"

# Esperar a que Odoo esté listo
echo -e "${YELLOW}Esperando a que Odoo esté listo...${NC}"
sleep 10

# Iniciar FastAPI middleware en segundo plano
echo -e "${YELLOW}Iniciando FastAPI middleware...${NC}"
cd $BASE_DIR/fastapi_middleware
./start_server.sh &
FASTAPI_PID=$!
echo -e "${GREEN}FastAPI middleware iniciado con PID: $FASTAPI_PID${NC}"

# Iniciar frontend Next.js en segundo plano
echo -e "${YELLOW}Iniciando frontend Next.js...${NC}"
cd $BASE_DIR/odoo-nextjs-frontend-new
npm run dev &
NEXTJS_PID=$!
echo -e "${GREEN}Frontend Next.js iniciado con PID: $NEXTJS_PID${NC}"

echo -e "${GREEN}Todos los servicios iniciados correctamente.${NC}"
echo -e "${YELLOW}URLs de acceso:${NC}"
echo -e "  - Odoo: ${GREEN}http://localhost:8069${NC}"
echo -e "  - FastAPI: ${GREEN}http://localhost:8000${NC}"
echo -e "  - Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "${YELLOW}Documentación API: ${GREEN}http://localhost:8000/docs${NC}"

# Función para manejar la señal de interrupción (Ctrl+C)
function cleanup {
    echo -e "${YELLOW}Deteniendo servicios...${NC}"
    kill $NEXTJS_PID 2>/dev/null
    kill $FASTAPI_PID 2>/dev/null
    kill $ODOO_PID 2>/dev/null
    echo -e "${GREEN}Todos los servicios detenidos.${NC}"
    exit 0
}

# Registrar la función de limpieza para señales de interrupción
trap cleanup SIGINT SIGTERM

# Mantener el script en ejecución
echo -e "${YELLOW}Presiona Ctrl+C para detener todos los servicios.${NC}"
wait
