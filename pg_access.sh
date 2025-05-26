#!/bin/bash

# Script para acceder a la base de datos PostgreSQL de Odoo
echo "Conectando a la base de datos PostgreSQL de Odoo..."
echo "Base de datos: odoo_pelotazo"
echo "Usuario: odoo"
echo "Contraseña: odoo"
echo ""
echo "Comandos útiles:"
echo "  \\dt - Listar tablas"
echo "  \\d+ nombre_tabla - Mostrar estructura de una tabla"
echo "  SELECT * FROM nombre_tabla LIMIT 10; - Mostrar 10 registros de una tabla"
echo "  \\q - Salir"
echo ""

# Conectar a la base de datos
PGPASSWORD=odoo psql -h localhost -U odoo -d odoo_pelotazo