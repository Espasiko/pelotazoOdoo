/**
 * Script para inicializar proveedores en PocketBase
 * Este script crea todos los proveedores necesarios para el sistema de importación
 */

import { pocketbaseConfig } from '../config.js';
import { autenticarAdmin } from '../db/client.js';
import { fetchAdmin } from '../db/client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lista de proveedores a inicializar
const PROVEEDORES = [
  'ABRILA',
  'AGUACONFORT',
  'AIRPAL',
  'ALFADYSER',
  'ALMCE',
  'BECKEN',
  'TEGALUXE',
  'BSH',
  'CECOTEC',
  'EAS-JOHNSON',
  'ELECTRODIRECTO',
  'JATA',
  'MIELECTRO',
  'NEVIR',
  'ORBEGOZO',
  'UFESA',
  'VITROKITCHEN'
];

/**
 * Busca proveedores adicionales en archivos JSON que empiecen con PVP
 * @returns {Promise<string[]>} - Lista de nombres de proveedores encontrados
 */
async function buscarProveedoresEnArchivos() {
  try {
    // Ruta a la carpeta jsons
    const jsonsPath = path.join(__dirname, '..', '..', 'jsons');
    
    // Verificar si la carpeta existe
    if (!fs.existsSync(jsonsPath)) {
      console.warn(`La carpeta ${jsonsPath} no existe`);
      return [];
    }
    
    // Leer archivos en la carpeta
    const archivos = fs.readdirSync(jsonsPath);
    
    // Filtrar archivos que empiecen con PVP y terminen en .json
    const archivosPVP = archivos.filter(archivo => 
      archivo.startsWith('PVP') && archivo.endsWith('.json')
    );
    
    console.log(`Encontrados ${archivosPVP.length} archivos PVP`);
    
    // Conjunto para almacenar nombres de proveedores únicos
    const proveedoresEncontrados = new Set();
    
    // Procesar cada archivo
    for (const archivo of archivosPVP) {
      try {
        const rutaArchivo = path.join(jsonsPath, archivo);
        const contenido = fs.readFileSync(rutaArchivo, 'utf8');
        const datos = JSON.parse(contenido);
        
        // Extraer nombre del proveedor del nombre del archivo
        // Formato esperado: PVP_NOMBREPROVEEDOR.json o PVP NOMBREPROVEEDOR.json
        let nombreProveedor = archivo
          .replace(/^PVP[_\s]+/, '')
          .replace(/\.json$/, '')
          .trim()
          .toUpperCase();
        
        if (nombreProveedor) {
          proveedoresEncontrados.add(nombreProveedor);
        }
      } catch (error) {
        console.error(`Error al procesar archivo ${archivo}:`, error.message);
      }
    }
    
    return [...proveedoresEncontrados];
  } catch (error) {
    console.error('Error al buscar proveedores en archivos:', error);
    return [];
  }
}

/**
 * Inicializa los proveedores en PocketBase
 */
async function inicializarProveedores() {
  try {
    console.log('Iniciando inicialización de proveedores...');
    
    // Autenticar como admin
    const token = await autenticarAdmin();
    if (!token) {
      throw new Error('No se pudo autenticar como admin');
    }
    
    // Obtener proveedores existentes
    const proveedoresExistentes = await fetchAdmin('/api/collections/proveedores/records?perPage=100');
    const nombresExistentes = new Set(proveedoresExistentes.items.map(p => p.nombre.trim().toUpperCase()));
    
    console.log(`Proveedores existentes: ${Array.from(nombresExistentes).join(', ')}`);
    
    // Buscar proveedores adicionales en archivos
    const proveedoresArchivos = await buscarProveedoresEnArchivos();
    console.log(`Proveedores encontrados en archivos: ${proveedoresArchivos.join(', ')}`);
    
    // Combinar listas de proveedores
    const todosProveedores = [...new Set([...PROVEEDORES, ...proveedoresArchivos])];
    
    // Crear proveedores que no existen
    let proveedoresCreados = 0;
    
    for (const nombre of todosProveedores) {
      const nombreNormalizado = nombre.trim().toUpperCase();
      
      if (!nombresExistentes.has(nombreNormalizado)) {
        console.log(`Creando proveedor: ${nombreNormalizado}`);
        
        try {
          const nuevoProveedor = await fetchAdmin('/api/collections/proveedores/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre: nombreNormalizado,
              activo: true
            })
          });
          
          console.log(`Proveedor creado con ID: ${nuevoProveedor.id}`);
          proveedoresCreados++;
        } catch (error) {
          console.error(`Error al crear proveedor ${nombreNormalizado}:`, error);
        }
      } else {
        console.log(`El proveedor ${nombreNormalizado} ya existe, omitiendo...`);
      }
    }
    
    console.log(`Inicialización completada. ${proveedoresCreados} proveedores creados.`);
  } catch (error) {
    console.error('Error al inicializar proveedores:', error);
  }
}

// Ejecutar la función principal
inicializarProveedores().then(() => {
  console.log('Proceso finalizado');
  process.exit(0);
}).catch(error => {
  console.error('Error en el script:', error);
  process.exit(1);
});
