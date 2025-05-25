#!/bin/bash

# Colores para mejorar la legibilidad
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Configuración de la base de datos
DB_NAME="odoo_pelotazo"
DB_USER="odoo"
DB_PASS="odoo"
DB_HOST="localhost"

# Función para mostrar el menú principal
show_menu() {
    clear
    echo -e "${BLUE}=== GESTOR DE BASE DE DATOS POSTGRESQL PARA ODOO ===${NC}"
    echo -e "${BLUE}=================================================${NC}"
    echo -e "${GREEN}1.${NC} Listar tablas"
    echo -e "${GREEN}2.${NC} Ver estructura de una tabla"
    echo -e "${GREEN}3.${NC} Ejecutar consulta SQL personalizada"
    echo -e "${GREEN}4.${NC} Ver datos de una tabla (primeros 10 registros)"
    echo -e "${GREEN}5.${NC} Verificar instalación de módulos"
    echo -e "${GREEN}6.${NC} Entrar en modo consola SQL"
    echo -e "${GREEN}7.${NC} Realizar backup de la base de datos"
    echo -e "${GREEN}8.${NC} Salir"
    echo
    echo -e "${YELLOW}Selecciona una opción:${NC} "
    read -r option
}

# Función para listar todas las tablas
list_tables() {
    echo -e "${BLUE}Listando tablas en la base de datos $DB_NAME...${NC}"
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\dt"
    echo
    echo -e "${YELLOW}Presiona Enter para continuar...${NC}"
    read
}

# Función para ver la estructura de una tabla
show_table_structure() {
    echo -e "${YELLOW}Ingresa el nombre de la tabla:${NC} "
    read -r table_name
    echo -e "${BLUE}Mostrando estructura de la tabla $table_name...${NC}"
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d+ $table_name"
    echo
    echo -e "${YELLOW}Presiona Enter para continuar...${NC}"
    read
}

# Función para ejecutar una consulta SQL personalizada
execute_custom_query() {
    echo -e "${YELLOW}Ingresa tu consulta SQL (termina con semicolon ';'):${NC} "
    read -r sql_query
    echo -e "${BLUE}Ejecutando consulta...${NC}"
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "$sql_query"
    echo
    echo -e "${YELLOW}Presiona Enter para continuar...${NC}"
    read
}

# Función para ver los datos de una tabla (primeros 10 registros)
view_table_data() {
    echo -e "${YELLOW}Ingresa el nombre de la tabla:${NC} "
    read -r table_name
    echo -e "${BLUE}Mostrando los primeros 10 registros de la tabla $table_name...${NC}"
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT * FROM $table_name LIMIT 10;"
    echo
    echo -e "${YELLOW}Presiona Enter para continuar...${NC}"
    read
}

# Función para verificar la instalación de módulos
check_modules() {
    echo -e "${BLUE}Verificando módulos instalados en Odoo...${NC}"
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT name, state FROM ir_module_module WHERE state IN ('installed', 'to upgrade', 'to install') ORDER BY name;"
    echo
    echo -e "${YELLOW}Presiona Enter para continuar...${NC}"
    read
}

# Función para entrar en modo consola SQL
enter_sql_console() {
    echo -e "${BLUE}Entrando en modo consola SQL. Escribe '\\q' para salir.${NC}"
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME
}

# Función para realizar backup de la base de datos
backup_database() {
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$DB_NAME"_"$TIMESTAMP.sql"
    echo -e "${BLUE}Realizando backup de la base de datos a $BACKUP_FILE...${NC}"
    PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > "$BACKUP_FILE"
    echo -e "${GREEN}Backup completado: $BACKUP_FILE${NC}"
    echo
    echo -e "${YELLOW}Presiona Enter para continuar...${NC}"
    read
}

# Bucle principal
while true; do
    show_menu
    case $option in
        1) list_tables ;;
        2) show_table_structure ;;
        3) execute_custom_query ;;
        4) view_table_data ;;
        5) check_modules ;;
        6) enter_sql_console ;;
        7) backup_database ;;
        8) 
            echo -e "${GREEN}¡Hasta luego!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Opción inválida. Presiona Enter para continuar...${NC}"
            read
            ;;
    esac
done