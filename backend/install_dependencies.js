/**
 * Script para instalar las dependencias necesarias para el sistema de importación y OCR
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Lista de dependencias necesarias
const dependencies = [
  // Dependencias para manejo de archivos
  'csv-parser',        // Para procesar archivos CSV
  'xlsx',              // Para procesar archivos Excel
  'multer',            // Para subir archivos
  
  // Dependencias para OCR
  'tesseract.js',      // OCR para extraer texto de imágenes
  'pdf.js',            // Para procesar archivos PDF
  'pdf-parse',         // Para extraer texto de PDFs
  
  // Utilidades
  'lodash',            // Funciones de utilidad
  'date-fns',          // Manejo de fechas
];

async function installDependencies() {
  console.log('Instalando dependencias necesarias...');
  
  try {
    // Verificar si package.json existe
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.error('Error: No se encontró el archivo package.json');
      process.exit(1);
    }
    
    // Instalar dependencias
    console.log(`Instalando las siguientes dependencias: ${dependencies.join(', ')}`);
    const command = `npm install --save ${dependencies.join(' ')}`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('npm WARN')) {
      console.error('Error al instalar dependencias:', stderr);
      process.exit(1);
    }
    
    console.log('Dependencias instaladas correctamente.');
    console.log(stdout);
    
    // Actualizar package.json con scripts personalizados
    console.log('Actualizando package.json con scripts personalizados...');
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Añadir scripts personalizados si no existen
    packageJson.scripts = packageJson.scripts || {};
    
    if (!packageJson.scripts['setup:db']) {
      packageJson.scripts['setup:db'] = 'node backend/setup_database.js';
    }
    
    if (!packageJson.scripts['import:data']) {
      packageJson.scripts['import:data'] = 'node backend/importacion/importador.js';
    }
    
    // Guardar cambios en package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('package.json actualizado correctamente.');
    console.log('Instalación completada con éxito.');
    
  } catch (error) {
    console.error('Error durante la instalación:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
installDependencies();
