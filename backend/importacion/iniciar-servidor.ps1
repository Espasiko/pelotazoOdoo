# Script para iniciar el servidor de importación con autenticación previa
# Este script se asegura de que PocketBase esté en ejecución y luego inicia el servidor con autenticación

# Definir la función para verificar si un proceso está en ejecución
function Test-ProcessRunning {
    param (
        [string]$ProcessName
    )
    
    $running = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    return ($null -ne $running)
}

# Verificar si PocketBase está en ejecución
if (-not (Test-ProcessRunning -ProcessName "pocketbase")) {
    Write-Host "PocketBase no está en ejecución. Iniciando PocketBase..."
    
    # Iniciar PocketBase en segundo plano
    $pocketbasePath = Join-Path -Path (Split-Path -Parent $PSScriptRoot) -ChildPath "pocketbase.exe"
    
    if (Test-Path $pocketbasePath) {
        Start-Process -FilePath $pocketbasePath -ArgumentList "serve" -NoNewWindow -WorkingDirectory (Split-Path -Parent $PSScriptRoot)
        Write-Host "PocketBase iniciado en http://127.0.0.1:8090"
        
        # Esperar un momento para que PocketBase se inicie completamente
        Write-Host "Esperando 5 segundos para que PocketBase se inicie..."
        Start-Sleep -Seconds 5
    } else {
        Write-Host "No se encontró PocketBase en $pocketbasePath"
        Write-Host "Por favor, asegúrate de que PocketBase esté instalado correctamente."
        exit 1
    }
} else {
    Write-Host "PocketBase ya está en ejecución."
}

# Verificar si hay un proceso de Node.js en ejecución
$nodeProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue

# Detener el proceso si existe
if ($null -ne $nodeProcess) {
    Stop-Process -Id $nodeProcess.Id -Force
    Write-Host "Se detuvo el proceso de Node.js"
}

# Iniciar el servidor con autenticación previa
Write-Host "Iniciando servidor de importación con autenticación previa..."
node iniciar-servidor.js

# Nota: Este script no finaliza hasta que el servidor se detenga
Write-Host "Servidor finalizado."
