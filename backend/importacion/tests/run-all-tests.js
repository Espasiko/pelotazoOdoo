/**
 * Script para ejecutar todas las pruebas unitarias
 * Este script ejecuta todas las pruebas unitarias del sistema de importación
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Configuración de rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Función para ejecutar un script de prueba
function ejecutarScript(script) {
  console.log(`\n=== Ejecutando ${script} ===\n`);
  try {
    // Usar path.join para construir la ruta correctamente y evitar problemas con espacios
    const scriptPath = path.join(__dirname, script);
    console.log(`Ejecutando: node "${scriptPath}"`);
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error al ejecutar ${script}:`, error.message);
    return false;
  }
}

// Función principal para ejecutar todas las pruebas
async function ejecutarTodasLasPruebas() {
  console.log('=== INICIANDO TODAS LAS PRUEBAS UNITARIAS ===');
  
  // Lista de archivos de prueba a ejecutar
  const testFiles = [
    'test-parsers.js',
    'test-validacion.js',
    'test-almce.js',
    'test-jata.js',
    'test-orbegozo.js',
    'test-becken-tegaluxe.js'
  ];
  
  // Ejecutar cada script
  let exitosTotal = 0;
  let fallosTotal = 0;
  
  for (const script of testFiles) {
    const exito = ejecutarScript(script);
    if (exito) {
      exitosTotal++;
    } else {
      fallosTotal++;
    }
  }
  
  // Mostrar resumen
  console.log('\n=== RESUMEN DE PRUEBAS ===');
  console.log(`Total de pruebas: ${testFiles.length}`);
  console.log(`Pruebas exitosas: ${exitosTotal}`);
  console.log(`Pruebas fallidas: ${fallosTotal}`);
  
  if (fallosTotal > 0) {
    console.error('\n❌ ALGUNAS PRUEBAS HAN FALLADO');
    process.exit(1);
  } else {
    console.log('\n✅ TODAS LAS PRUEBAS HAN SIDO EXITOSAS');
  }
}

// Ejecutar todas las pruebas
ejecutarTodasLasPruebas();
