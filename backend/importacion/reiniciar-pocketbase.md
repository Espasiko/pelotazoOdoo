# Guía para reiniciar PocketBase y solucionar problemas de estructura

Hemos identificado que PocketBase tiene los datos almacenados pero no puede acceder a ellos correctamente porque los campos no están definidos en el esquema. La solución más efectiva es reiniciar PocketBase desde cero y recrear la estructura correctamente.

## Paso 1: Hacer copia de seguridad

Ya hemos exportado los datos a archivos JSON en la carpeta `datos_exportados`. Estos archivos contienen todos los registros existentes, aunque sin los campos personalizados.

## Paso 2: Detener el servidor de PocketBase

Detén el servidor de PocketBase que está ejecutándose actualmente.

## Paso 3: Hacer copia de seguridad del directorio pb_data

```powershell
# Crear directorio de backups si no existe
mkdir -p "E:\1 programar APPs\1pelotanew\backups"

# Copiar el directorio pb_data
Copy-Item -Path "E:\1 programar APPs\1pelotanew\pb_data" -Destination "E:\1 programar APPs\1pelotanew\backups\pb_data_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
```

## Paso 4: Eliminar o renombrar el directorio pb_data

```powershell
# Renombrar el directorio pb_data (más seguro que eliminarlo)
Rename-Item -Path "E:\1 programar APPs\1pelotanew\pb_data" -NewName "pb_data_old_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
```

## Paso 5: Iniciar PocketBase nuevamente

Inicia PocketBase nuevamente. Esto creará una nueva base de datos limpia.

## Paso 6: Configurar el superusuario

Cuando inicies PocketBase por primera vez, te pedirá que configures un superusuario. Usa las mismas credenciales:
- Email: yo@mail.com
- Contraseña: Ninami12$ya

## Paso 7: Crear las colecciones con la estructura correcta

Ejecuta el script `crear-colecciones-desde-cero.js` que hemos preparado:

```powershell
cd "E:\1 programar APPs\1pelotanew\backend\importacion"
node crear-colecciones-desde-cero.js
```

## Paso 8: Importar los datos originales

Ejecuta el script `importar-datos-v2.js` para importar los datos desde los archivos JSON originales:

```powershell
cd "E:\1 programar APPs\1pelotanew\backend\importacion"
node importar-datos-v2.js
```

## Paso 9: Verificar que todo funcione correctamente

Ejecuta el script `verificar-registros-v2.js` para confirmar que las colecciones tienen la estructura correcta y los datos se han importado correctamente:

```powershell
cd "E:\1 programar APPs\1pelotanew\backend\importacion"
node verificar-registros-v2.js
```
