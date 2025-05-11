/**
 * Controlador principal para el sistema de importación
 * Este módulo coordina el proceso completo de importación de datos
 */

import path from 'path';
import { procesarArchivo } from './file-processor.js';
import { importarABaseDeDatos } from './db-importer.js';
import { fetchAdmin } from '../db/client.js';
import { detectarCategorias } from '../categorias.js';

/**
 * Importa datos desde un archivo a la base de datos
 * @param {string} filePath - Ruta del archivo a importar
 * @param {string} proveedor - Nombre del proveedor
 * @param {string} tipo - Tipo de importación (productos, precios, stock)
 * @param {string} importacionId - ID de la importación
 * @returns {Promise<Object>} - Resultado de la importación
 */
export async function importarDatos(filePath, proveedor, tipo = 'productos', importacionId = null) {
  console.log(`[importarDatos] Iniciando importación de ${filePath} para proveedor ${proveedor}`);
  
  try {
    // 1. Procesar archivo
    const datosProcessados = await procesarArchivo(filePath, proveedor, tipo);
    
    if (!datosProcessados || !datosProcessados.productos || datosProcessados.productos.length === 0) {
      console.warn(`[importarDatos] No se encontraron productos en el archivo ${filePath}`);
      return { 
        total: 0, 
        creados: 0, 
        actualizados: 0, 
        errores: 1, 
        erroresDetalle: [{ error: 'No se encontraron productos en el archivo' }] 
      };
    }
    
    console.log(`[importarDatos] Productos procesados: ${datosProcessados.productos.length}`);
    
    // 2. Detectar categorías
    const categoriasMap = detectarCategorias(datosProcessados.productos, datosProcessados.categorias);
    
    // 3. Importar a la base de datos
    const resultado = await importarABaseDeDatos(
      datosProcessados.productos, 
      proveedor, 
      importacionId, 
      fetchAdmin, 
      categoriasMap
    );
    
    console.log(`[importarDatos] Importación completada. Estadísticas: ${JSON.stringify(resultado)}`);
    
    return resultado;
  } catch (error) {
    console.error(`[importarDatos] Error en importación de ${filePath}:`, error);
    return { 
      total: 0, 
      creados: 0, 
      actualizados: 0, 
      errores: 1, 
      erroresDetalle: [{ error: error.message, stack: error.stack }] 
    };
  }
}

export default {
  importarDatos
};
