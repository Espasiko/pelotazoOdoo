# Instrucciones de Configuracin e Inicio

Este documento proporciona instrucciones para configurar e iniciar la aplicacin Odoo con el frontend Next.js para El Pelotazo.

## Requisitos previos

- Sistema operativo Linux (Ubuntu/Debian recomendado)
- Acceso sudo

## Pasos para la configuracin

1. **Hacer ejecutables los scripts**

   ```bash
   bash make_scripts_executable.sh
   ```

2. **Verificar las instalaciones actuales**

   ```bash
   ./check_postgres.sh
   ./check_odoo_deps.sh
   ```

3. **Instalar dependencias**

   ```bash
   ./install_dependencies.sh
   ```

4. **Configurar PostgreSQL para Odoo**

   ```bash
   ./setup_postgres.sh
   ```

5. **Iniciar la aplicacin**

   ```bash
   ./start_application.sh
   ```

## Acceso a las aplicaciones

- **Odoo**: http://localhost:8069
  - Usuario: admin
  - Contrasea: admin (en la primera ejecucin)

- **Frontend Next.js**: http://localhost:3000

## Solucin de problemas

Si encuentras algn problema durante la instalacin o ejecucin:

1. Verifica que PostgreSQL est funcionando correctamente:
   ```bash
   sudo systemctl status postgresql
   ```

2. Verifica los logs de Odoo:
   ```bash
   tail -f odoo/odoo-server.log
   ```

3. Verifica que los puertos 8069 (Odoo) y 3000 (Next.js) no estn siendo utilizados por otras aplicaciones:
   ```bash
   sudo netstat -tulpn | grep 8069
   sudo netstat -tulpn | grep 3000
   ```

## Notas adicionales

- La primera vez que inicies Odoo, se te pedir crear una base de datos y configurar el usuario administrador.
- Para detener la aplicacin, presiona Ctrl+C en la terminal donde ejecutaste `start_application.sh`.