#!/bin/bash

# Activar entorno virtual
source /home/espasiko/odoo/odoo-venv/bin/activate

# Verificar que Odoo está en ejecución
echo "Verificando que Odoo está en ejecución..."
if ! curl -s http://localhost:8069 > /dev/null; then
    echo "ERROR: Odoo no está en ejecución. Por favor, inicie Odoo primero."
    echo "Puede iniciar Odoo ejecutando: bash /home/espasiko/odoo/start_application.sh"
    exit 1
fi

# Iniciar el servidor FastAPI con reintentos
MAX_RETRIES=3
RETRY_COUNT=0
SUCCESS=false

echo "Iniciando servidor FastAPI..."
while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$SUCCESS" = false ]; do
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo "Intento $RETRY_COUNT de $MAX_RETRIES"
    
    # Matar cualquier proceso existente de uvicorn
    pkill -f "uvicorn main:app" || true
    
    # Iniciar el servidor FastAPI
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
    PID=$!
    
    # Esperar a que el servidor inicie
    echo "Esperando a que el servidor inicie..."
    sleep 5
    
    # Verificar que el servidor está en ejecución
    if curl -s http://localhost:8000 > /dev/null; then
        SUCCESS=true
        echo "Servidor FastAPI iniciado correctamente en http://localhost:8000"
        echo "PID: $PID"
        
        # Mantener el script en ejecución para que el servidor no se detenga
        wait $PID
    else
        echo "Error al iniciar el servidor FastAPI. Reintentando..."
        sleep 2
    fi
done

if [ "$SUCCESS" = false ]; then
    echo "ERROR: No se pudo iniciar el servidor FastAPI después de $MAX_RETRIES intentos."
    exit 1
fi