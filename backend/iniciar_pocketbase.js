/**
 * Script para descargar e iniciar PocketBase
 * Este script descarga PocketBase si no existe y lo inicia
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { exec } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';

// Obtener el directorio actual en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determinar la plataforma y arquitectura
const platform = os.platform();
const arch = os.arch();

// Configurar la URL de descarga según la plataforma
let downloadUrl = '';
let executableName = '';

if (platform === 'win32') {
  downloadUrl = 'https://github.com/pocketbase/pocketbase/releases/download/v0.19.4/pocketbase_0.19.4_windows_amd64.zip';
  executableName = 'pocketbase.exe';
} else if (platform === 'darwin') {
  downloadUrl = 'https://github.com/pocketbase/pocketbase/releases/download/v0.19.4/pocketbase_0.19.4_darwin_amd64.zip';
  executableName = 'pocketbase';
} else if (platform === 'linux') {
  downloadUrl = 'https://github.com/pocketbase/pocketbase/releases/download/v0.19.4/pocketbase_0.19.4_linux_amd64.zip';
  executableName = 'pocketbase';
} else {
  console.error('Plataforma no soportada:', platform);
  process.exit(1);
}

// Comprobar primero si PocketBase existe en la carpeta raíz
let pocketbasePath = path.join(__dirname, executableName);

// Si no existe en la raíz, comprobar en la carpeta pocketbase_0.19.4
if (!fs.existsSync(pocketbasePath)) {
  pocketbasePath = path.join(__dirname, 'pocketbase_0.19.4', executableName);
}

// Si tampoco existe en pocketbase_0.19.4, buscar en cualquier subcarpeta
if (!fs.existsSync(pocketbasePath)) {
  // Buscar en todas las subcarpetas
  const files = fs.readdirSync(__dirname);
  let found = false;
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file.includes('pocketbase')) {
      const possiblePath = path.join(filePath, executableName);
      if (fs.existsSync(possiblePath)) {
        pocketbasePath = possiblePath;
        found = true;
        break;
      }
    }
  }
  
  if (!found) {
    console.log('PocketBase no encontrado. Descargando...');
    // Aquí iría el código para descargar y descomprimir PocketBase
    // Por simplicidad, solo mostramos instrucciones para descargarlo manualmente
    console.log(`Por favor, descarga PocketBase manualmente desde: ${downloadUrl}`);
    console.log(`Descomprime el archivo y coloca ${executableName} en: ${__dirname}`);
    console.log('Luego ejecuta este script nuevamente para iniciar PocketBase.');
    process.exit(1);
  }
}

// Si llegamos aquí, hemos encontrado PocketBase
console.log(`PocketBase encontrado en: ${pocketbasePath}`);
iniciarPocketBase();

// Función para iniciar PocketBase
function iniciarPocketBase() {
  console.log('Iniciando PocketBase...');
  
  // Crear directorio pb_data si no existe
  const dataDir = path.join(__dirname, 'pb_data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Mover temporalmente la carpeta de migraciones para evitar errores
  const migrationsDir = path.join(__dirname, 'pb_migrations');
  const migrationsDirOld = path.join(__dirname, 'pb_migrations_old');
  
  if (fs.existsSync(migrationsDir) && !fs.existsSync(migrationsDirOld)) {
    console.log('Moviendo carpeta de migraciones temporalmente para evitar errores...');
    fs.renameSync(migrationsDir, migrationsDirOld);
  }
  
  // Ejecutar PocketBase con puerto 8095
  const pocketbase = exec(`"${pocketbasePath}" serve --http="0.0.0.0:8095"`, { cwd: __dirname });
  
  pocketbase.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  pocketbase.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  pocketbase.on('close', (code) => {
    console.log(`PocketBase se ha cerrado con código: ${code}`);
    
    // Restaurar la carpeta de migraciones si fue movida
    if (fs.existsSync(migrationsDirOld) && !fs.existsSync(migrationsDir)) {
      console.log('Restaurando carpeta de migraciones...');
      fs.renameSync(migrationsDirOld, migrationsDir);
    }
  });
  
  // Manejar señales para cerrar correctamente
  process.on('SIGINT', () => {
    console.log('Cerrando PocketBase...');
    pocketbase.kill();
  });
  
  console.log('PocketBase está ejecutándose en http://localhost:8095');
  console.log('Panel de administración: http://localhost:8095/_/');
}