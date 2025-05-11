/**
 * Script para actualizar el sistema de importación a la versión 2
 * Este script ejecuta todas las actualizaciones necesarias para la versión 2 del sistema
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';
import { fetchAdmin } from '../db/client.js';

// Configuración de rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Función para ejecutar un script
function ejecutarScript(script) {
  console.log(`\n=== Ejecutando ${script} ===\n`);
  try {
    execSync(`node ${path.join(__dirname, script)}`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error al ejecutar ${script}:`, error.message);
    return false;
  }
}

// Función para actualizar el esquema de PocketBase
async function actualizarEsquema() {
  console.log('\n=== Actualizando esquema de PocketBase ===');
  
  try {
    // Verificar si existen los nuevos campos en la colección de productos
    const response = await fetchAdmin('/api/collections/productos/schema');
    const schema = response.schema || [];
    
    // Verificar si ya existe el campo eficiencia_energetica
    const campoExistente = schema.find(field => field.name === 'eficiencia_energetica');
    
    if (campoExistente) {
      console.log('El esquema ya está actualizado con los nuevos campos.');
      return true;
    }
    
    // Definir nuevos campos para la colección de productos
    const nuevosCampos = [
      {
        name: 'eficiencia_energetica',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'peso',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'dimensiones',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'color',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'garantia',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'url_imagen',
        type: 'url',
        required: false,
        options: {
          exceptDomains: null,
          onlyDomains: null
        }
      },
      {
        name: 'subcategoria',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      }
    ];
    
    // Añadir nuevos campos al esquema
    const nuevoSchema = [...schema, ...nuevosCampos];
    
    // Actualizar esquema
    await fetchAdmin('/api/collections/productos/schema', {
      method: 'PUT',
      body: JSON.stringify({ schema: nuevoSchema })
    });
    
    console.log('Esquema de productos actualizado con éxito.');
    return true;
  } catch (error) {
    console.error('Error al actualizar el esquema:', error);
    return false;
  }
}

// Función para ejecutar las pruebas unitarias
function ejecutarPruebas() {
  console.log('\n=== Ejecutando pruebas unitarias ===');
  try {
    execSync(`node ${path.join(rootDir, 'tests', 'run-all-tests.js')}`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('Error al ejecutar las pruebas unitarias:', error);
    return false;
  }
}

// Función principal para actualizar el sistema
async function actualizarSistema() {
  console.log('=== INICIANDO ACTUALIZACIÓN DEL SISTEMA DE IMPORTACIÓN V2 ===');
  
  // Crear directorios si no existen
  const directorios = [
    path.join(rootDir, 'tests'),
    path.join(rootDir, 'logs')
  ];
  
  for (const dir of directorios) {
    if (!fs.existsSync(dir)) {
      console.log(`Creando directorio: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Ejecutar scripts de actualización
  const exitos = [];
  const fallos = [];
  
  // 1. Actualizar esquema
  const esquemaActualizado = await actualizarEsquema();
  if (esquemaActualizado) {
    exitos.push('Actualización de esquema');
  } else {
    fallos.push('Actualización de esquema');
  }
  
  // 2. Actualizar proveedores
  const proveedoresActualizados = ejecutarScript('inicializar-proveedores.js');
  if (proveedoresActualizados) {
    exitos.push('Inicialización de proveedores');
  } else {
    fallos.push('Inicialización de proveedores');
  }
  
  // 3. Actualizar productos
  const productosActualizados = ejecutarScript('actualizar-productos.js');
  if (productosActualizados) {
    exitos.push('Actualización de productos');
  } else {
    fallos.push('Actualización de productos');
  }
  
  // 4. Ejecutar pruebas unitarias
  const pruebasExitosas = ejecutarPruebas();
  if (pruebasExitosas) {
    exitos.push('Pruebas unitarias');
  } else {
    fallos.push('Pruebas unitarias');
  }
  
  // Mostrar resumen
  console.log('\n=== RESUMEN DE ACTUALIZACIÓN ===');
  console.log(`Total de tareas: ${exitos.length + fallos.length}`);
  console.log(`Tareas exitosas: ${exitos.length}`);
  console.log(`Tareas fallidas: ${fallos.length}`);
  
  if (fallos.length > 0) {
    console.error('\n❌ ALGUNAS TAREAS HAN FALLADO:');
    fallos.forEach(fallo => console.error(`- ${fallo}`));
    console.error('\nPor favor, revise los errores y vuelva a intentarlo.');
  } else {
    console.log('\n✅ ACTUALIZACIÓN COMPLETADA CON ÉXITO');
    console.log('\nEl sistema de importación ha sido actualizado a la versión 2.');
    console.log('Nuevas características:');
    console.log('- Validación de datos mejorada');
    console.log('- Parsers específicos para más proveedores');
    console.log('- Parser genérico mejorado');
    console.log('- Pruebas unitarias');
    console.log('- Nuevos campos en la base de datos');
  }
}

// Ejecutar actualización
actualizarSistema();
