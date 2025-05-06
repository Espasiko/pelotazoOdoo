/**
 * Módulo de lectura de archivos para el sistema de importación
 * Este módulo maneja la lectura de archivos CSV, Excel y JSON
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import xlsx from 'xlsx';

/**
 * Lee un archivo CSV y devuelve sus datos como un array de objetos
 * @param {string} filePath - Ruta al archivo CSV
 * @returns {Promise<Array>} - Array de objetos con los datos del CSV
 */
export async function leerArchivoCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * Lee un archivo Excel y devuelve sus datos como un array de objetos
 * @param {string} filePath - Ruta al archivo Excel
 * @returns {Promise<Array>} - Array de objetos con los datos del Excel
 */
export async function leerArchivoExcel(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
  } catch (error) {
    console.error('Error al leer archivo Excel:', error);
    throw error;
  }
}

/**
 * Lee un archivo JSON
 * @param {string} filePath - Ruta al archivo JSON
 * @returns {Promise<Array>} - Datos del archivo JSON
 */
async function leerArchivoJSON(filePath) {
  try {
    console.log(`Leyendo archivo JSON: ${filePath}`);
    
    // Leer el archivo
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parsear el contenido JSON
    const datos = JSON.parse(fileContent);
    
    // Verificar si es un array o un objeto
    if (Array.isArray(datos)) {
      console.log(`Leídos ${datos.length} registros del archivo JSON`);
      return datos;
    } else if (typeof datos === 'object') {
      // Si es un objeto, convertirlo en un array con un solo elemento
      console.log('El archivo JSON contiene un objeto, convirtiéndolo a array');
      return [datos];
    } else {
      throw new Error('El archivo JSON no contiene un array o un objeto válido');
    }
  } catch (error) {
    console.error('Error al leer archivo JSON:', error);
    throw error;
  }
}

/**
 * Lee un archivo según su extensión
 * @param {string} filePath - Ruta al archivo
 * @returns {Promise<Array>} - Datos del archivo
 */
export async function leerArchivo(filePath) {
  try {
    console.log(`Leyendo archivo: ${filePath}`);
    
    // Obtener extensión del archivo
    const extension = path.extname(filePath).toLowerCase();
    
    // Leer archivo según su extensión
    switch (extension) {
      case '.csv':
        return await leerArchivoCSV(filePath);
      case '.xlsx':
      case '.xls':
        return await leerArchivoExcel(filePath);
      case '.json':
        return await leerArchivoJSON(filePath);
      default:
        throw new Error(`Formato de archivo no soportado: ${extension}`);
    }
  } catch (error) {
    console.error('Error al leer archivo:', error);
    throw error;
  }
}
