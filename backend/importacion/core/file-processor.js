/**
 * Módulo para procesar archivos en el sistema de importación
 * Este módulo proporciona funciones para procesar diferentes tipos de archivos
 */

import { leerArchivoCSV, leerArchivoExcel, leerArchivoJSONNormalizado } from '../file-readers.js';
import { getParser } from '../parsers/index.js';
import path from 'path';

/**
 * Procesa un archivo según su tipo y proveedor
 * @param {string} filePath - Ruta del archivo a procesar
 * @param {string} proveedor - Nombre del proveedor
 * @param {string} tipo - Tipo de importación (productos, precios, stock)
 * @returns {Promise<Object>} - Datos procesados
 */
export async function procesarArchivo(filePath, proveedor, tipo = 'productos') {
  try {
    console.log(`[procesarArchivo] Procesando archivo: ${filePath}, proveedor: ${proveedor}, tipo: ${tipo}`);
    
    // Obtener extensión del archivo
    const extension = path.extname(filePath).toLowerCase();
    
    // Leer datos según el tipo de archivo
    let datos = [];
    if (extension === '.csv') {
      datos = await leerArchivoCSV(filePath);
    } else if (extension === '.xlsx' || extension === '.xls') {
      datos = await leerArchivoExcel(filePath);
    } else if (extension === '.json') {
      datos = await leerArchivoJSONNormalizado(filePath);
    } else {
      throw new Error(`Tipo de archivo no soportado: ${extension}`);
    }
    
    console.log(`[procesarArchivo] Datos leídos: ${datos.length} filas`);
    
    // Obtener el parser adecuado según el proveedor
    const parser = getParser(proveedor);
    
    // Procesar datos con el parser
    const resultado = parser(datos, tipo);
    
    console.log(`[procesarArchivo] Datos procesados: ${resultado.productos.length} productos, ${resultado.categorias.length} categorías`);
    
    return resultado;
  } catch (error) {
    console.error(`[procesarArchivo] Error al procesar archivo ${filePath}:`, error);
    throw error;
  }
}

/**
 * Analiza un archivo para detectar automáticamente el proveedor
 * @param {string} filePath - Ruta del archivo a analizar
 * @returns {Promise<string>} - Nombre del proveedor detectado
 */
export async function detectarProveedor(filePath) {
  try {
    console.log(`[detectarProveedor] Analizando archivo: ${filePath}`);
    
    // Obtener extensión del archivo
    const extension = path.extname(filePath).toLowerCase();
    
    // Leer primeras filas del archivo
    let datos = [];
    if (extension === '.csv') {
      datos = await leerArchivoCSV(filePath, 10); // Leer solo 10 filas
    } else if (extension === '.xlsx' || extension === '.xls') {
      datos = await leerArchivoExcel(filePath, 10); // Leer solo 10 filas
    } else if (extension === '.json') {
      datos = await leerArchivoJSONNormalizado(filePath);
    } else {
      throw new Error(`Tipo de archivo no soportado: ${extension}`);
    }
    
    // Intentar detectar proveedor por nombre de archivo
    const nombreArchivo = path.basename(filePath).toUpperCase();
    if (nombreArchivo.includes('CECOTEC')) return 'CECOTEC';
    if (nombreArchivo.includes('BSH')) return 'BSH';
    if (nombreArchivo.includes('JATA')) return 'JATA';
    if (nombreArchivo.includes('ORBEGOZO')) return 'ORBEGOZO';
    if (nombreArchivo.includes('ALFADYSER')) return 'ALFADYSER';
    if (nombreArchivo.includes('VITROKITCHEN')) return 'VITROKITCHEN';
    if (nombreArchivo.includes('ELECTRODIRECTO')) return 'ELECTRODIRECTO';
    if (nombreArchivo.includes('ALMCE')) return 'ALMCE';
    if (nombreArchivo.includes('ABRILA')) return 'ABRILA';
    if (nombreArchivo.includes('AGUACONFORT')) return 'AGUACONFORT';
    if (nombreArchivo.includes('AIRPAL')) return 'AIRPAL';
    if (nombreArchivo.includes('BECKEN')) return 'BECKEN';
    if (nombreArchivo.includes('TEGALUXE')) return 'TEGALUXE';
    if (nombreArchivo.includes('EAS-JOHNSON')) return 'EAS-JOHNSON';
    if (nombreArchivo.includes('MIELECTRO')) return 'MIELECTRO';
    if (nombreArchivo.includes('NEVIR')) return 'NEVIR';
    if (nombreArchivo.includes('UFESA')) return 'UFESA';
    
    // Si no se detectó por nombre de archivo, intentar detectar por contenido
    if (datos.length > 0) {
      // Buscar columnas o valores que indiquen el proveedor
      for (const row of datos) {
        for (const key in row) {
          const value = String(row[key] || '').toUpperCase();
          if (key.toUpperCase() === 'CECOTEC' || value.includes('CECOTEC')) return 'CECOTEC';
          if (key.toUpperCase() === 'BSH' || value.includes('BSH')) return 'BSH';
          if (key.toUpperCase() === 'JATA' || value.includes('JATA')) return 'JATA';
          if (key.toUpperCase() === 'ORBEGOZO' || value.includes('ORBEGOZO')) return 'ORBEGOZO';
          // ... y así sucesivamente para otros proveedores
        }
      }
    }
    
    // Si no se pudo detectar, devolver genérico
    console.log(`[detectarProveedor] No se pudo detectar proveedor, usando GENERICO`);
    return 'GENERICO';
  } catch (error) {
    console.error(`[detectarProveedor] Error al detectar proveedor para ${filePath}:`, error);
    return 'GENERICO';
  }
}

export default {
  procesarArchivo,
  detectarProveedor
};
