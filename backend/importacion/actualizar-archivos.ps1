# Script para actualizar los archivos del importador
# Este script reemplaza los archivos originales con las versiones refactorizadas

# Crear carpeta de respaldo si no existe
$backupFolder = ".\backups"
if (-not (Test-Path $backupFolder)) {
    New-Item -Path $backupFolder -ItemType Directory
}

# Obtener fecha y hora para el nombre del backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Hacer backup de los archivos originales
Write-Host "Haciendo backup de los archivos originales..."
if (Test-Path ".\importador.js") {
    Copy-Item ".\importador.js" -Destination "$backupFolder\importador_$timestamp.js"
    Write-Host "Backup de importador.js creado en $backupFolder\importador_$timestamp.js"
}

if (Test-Path ".\server.js") {
    Copy-Item ".\server.js" -Destination "$backupFolder\server_$timestamp.js"
    Write-Host "Backup de server.js creado en $backupFolder\server_$timestamp.js"
}

# Reemplazar los archivos originales con las versiones refactorizadas
Write-Host "Reemplazando archivos con versiones refactorizadas..."
if (Test-Path ".\importador_nuevo.js") {
    Copy-Item ".\importador_nuevo.js" -Destination ".\importador.js" -Force
    Write-Host "importador.js actualizado correctamente"
}

if (Test-Path ".\server_nuevo.js") {
    Copy-Item ".\server_nuevo.js" -Destination ".\server.js" -Force
    Write-Host "server.js actualizado correctamente"
}

# Limpiar archivos temporales
Write-Host "Limpiando archivos temporales..."
$tempFiles = @(
    ".\importador_parte1.js",
    ".\importador_parte2.js",
    ".\importador_parte3.js",
    ".\importador_parte4.js",
    ".\importador_nuevo.js",
    ".\server_nuevo.js"
)

foreach ($file in $tempFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Eliminado: $file"
    }
}

Write-Host "Proceso completado. Los archivos han sido actualizados y se han creado copias de seguridad."
