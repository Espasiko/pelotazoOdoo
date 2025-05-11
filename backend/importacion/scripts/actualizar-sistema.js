/**
 * Script principal para actualizar el sistema de importación
 * Este script ejecuta todos los pasos necesarios para la actualización:
 * 1. Añadir el campo nombre_proveedor a la colección de productos
 * 2. Inicializar todos los proveedores necesarios
 * 3. Actualizar los productos existentes con el nombre del proveedor
 * 4. Asegurar que todos los proveedores específicos estén disponibles
 */

import { pocketbaseConfig } from '../config.js';
import { autenticarAdmin } from '../db/client.js';
import { fetchAdmin } from '../db/client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

// Convertir exec a promesa
const execPromise = promisify(exec);

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ejecuta un script Node.js y espera a que termine
 * @param {string} scriptPath - Ruta al script a ejecutar
 * @returns {Promise<void>}
 */
async function ejecutarScript(scriptPath) {
  const absolutePath = path.resolve(scriptPath);
  console.log(`Ejecutando script: ${absolutePath}`);
  try {
    const { stdout, stderr } = await execPromise(`node "${absolutePath}"`);
    console.log('Salida del script:');
    console.log(stdout);
    if (stderr) {
      console.error('Errores del script:');
      console.error(stderr);
    }
  } catch (error) {
    console.error(`Error al ejecutar el script ${absolutePath}:`, error);
    throw error;
  }
}

/**
 * Función principal que ejecuta todos los pasos de la actualización
 */
async function actualizarSistema() {
  try {
    console.log('Iniciando actualización del sistema...');
    
    // 1. Actualizar el esquema para añadir el campo nombre_proveedor
    const schemaScriptPath = path.join(__dirname, 'actualizar-schema.js');
    await ejecutarScript(schemaScriptPath);
    
    // 2. Inicializar todos los proveedores necesarios
    const proveedoresScriptPath = path.join(__dirname, 'inicializar-proveedores.js');
    await ejecutarScript(proveedoresScriptPath);
    
    // 3. Actualizar los productos existentes con el nombre del proveedor
    const productosScriptPath = path.join(__dirname, 'actualizar-productos.js');
    await ejecutarScript(productosScriptPath);
    
    // 4. Asegurar que todos los proveedores específicos estén disponibles
    const todosProveedoresScriptPath = path.join(__dirname, 'actualizar-todos-proveedores.js');
    await ejecutarScript(todosProveedoresScriptPath);
    
    console.log('Actualización del sistema completada con éxito.');
  } catch (error) {
    console.error('Error durante la actualización del sistema:', error);
  }
}

// Ejecutar la función principal
actualizarSistema().then(() => {
  console.log('Proceso finalizado');
  process.exit(0);
}).catch(error => {
  console.error('Error en el script principal:', error);
  process.exit(1);
});
