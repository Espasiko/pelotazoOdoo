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
 * Lee un archivo JSON y lo normaliza a un array de objetos planos compatibles con el parser universal
 * - Si el JSON es un array de arrays, usa la primera fila como cabecera
 * - Si es un array de objetos, lo devuelve tal cual
 * - Si es un objeto, lo mete en un array
 * - Si detecta formato inválido, lanza error descriptivo
 * @param {string} filePath - Ruta al archivo JSON
 * @returns {Promise<Array>} - Datos normalizados
 */
export async function leerArchivoJSONNormalizado(filePath) {
  try {
    console.log(`[leerArchivoJSONNormalizado] Leyendo archivo JSON: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let datos = JSON.parse(fileContent);
    // Caso: array de arrays (tipo Excel exportado a JSON)
    if (Array.isArray(datos) && Array.isArray(datos[0])) {
      const cabecera = datos[0];
      const filas = datos.slice(1);
      const resultado = filas.map(fila => {
        const obj = {};
        cabecera.forEach((col, idx) => {
          obj[col] = fila[idx];
        });
        return obj;
      });
      console.log(`[leerArchivoJSONNormalizado] Normalizado array de arrays a array de objetos (${resultado.length} registros)`);
      return resultado;
    }
    // Caso: array de objetos
    if (Array.isArray(datos)) {
      console.log(`[leerArchivoJSONNormalizado] Array de objetos detectado (${datos.length} registros)`);
      return datos;
    }
    // Caso: objeto único
    if (typeof datos === 'object') {
      console.log('[leerArchivoJSONNormalizado] Objeto único detectado, convirtiendo a array');
      return [datos];
    }
    throw new Error('El archivo JSON no contiene un array o un objeto válido');
  } catch (error) {
    console.error('[leerArchivoJSONNormalizado] Error al leer archivo JSON:', error);
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
        return await leerArchivoJSONNormalizado(filePath);
      default:
        throw new Error(`Formato de archivo no soportado: ${extension}`);
    }
  } catch (error) {
    console.error('Error al leer archivo:', error);
    throw error;
  }
}
