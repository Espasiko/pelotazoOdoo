# Script para mover y organizar carpetas de PocketBase
# Este script mueve las carpetas de respaldo a una ubicación centralizada

# Crear carpeta de respaldos si no existe
$backupsFolder = "..\pb_backups"
if (-not (Test-Path $backupsFolder)) {
    New-Item -Path $backupsFolder -ItemType Directory -Force
    Write-Host "Carpeta de respaldos creada: $backupsFolder"
}

# Mover carpetas de datos de respaldo
$carpetasParaMover = @(
    "..\pb_data_backup",
    "..\pb_data_clean",
    "..\pb_data_new",
    "..\pb_migrations_backup",
    "..\pb_migrations_old"
)

foreach ($carpeta in $carpetasParaMover) {
    if (Test-Path $carpeta) {
        $nombreCarpeta = Split-Path $carpeta -Leaf
        $destino = Join-Path $backupsFolder $nombreCarpeta
        
        # Si ya existe la carpeta destino, añadir timestamp
        if (Test-Path $destino) {
            $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
            $destino = "$destino`_$timestamp"
        }
        
        # Mover la carpeta
        Move-Item $carpeta $destino -Force
        Write-Host "Movida carpeta $nombreCarpeta a $destino"
    } else {
        Write-Host "Carpeta $carpeta no encontrada, saltando..."
    }
}

Write-Host "Proceso completado. Las carpetas han sido organizadas."
