#!/bin/bash

# Verificar si PostgreSQL está instalado
if command -v psql >/dev/null 2>&1; then
  echo "PostgreSQL está instalado"
  psql --version
else
  echo "PostgreSQL no está instalado"
fi

# Verificar si el servicio está activo
if systemctl is-active postgresql >/dev/null 2>&1; then
  echo "El servicio PostgreSQL está activo"
else
  echo "El servicio PostgreSQL no está activo o no está instalado como servicio systemd"
fi