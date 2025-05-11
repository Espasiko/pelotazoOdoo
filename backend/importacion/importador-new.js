/**
 * Sistema de importación para El Pelotazo
 * Este módulo maneja la importación de datos desde diferentes formatos y proveedores
 * Versión refactorizada y optimizada
 * 
 * NOTA: Este archivo se mantiene por compatibilidad con el código existente.
 * Para nuevas implementaciones, utilizar los módulos en /core, /db y /parsers.
 */

// Importar funcionalidad refactorizada
import { importarDatos as importarDatosCore } from './core/index.js';

/**
 * Importar datos desde un archivo a la base de datos
 * @param {string} filePath - Ruta del archivo a importar
 * @param {string} proveedor - Nombre del proveedor
 * @param {string} tipo - Tipo de importación (productos, precios, stock)
 * @param {string} importacionId - ID de la importación
 * @returns {Promise<Object>} - Resultado de la importación
 */
export async function importarDatos(filePath, proveedor, tipo = 'productos', importacionId = null) {
  console.log(`[importador-new.js] Redirigiendo importación a módulo core: ${filePath} para proveedor ${proveedor}`);
  
  // Redirigir a la nueva implementación
  return importarDatosCore(filePath, proveedor, tipo, importacionId);
}

// Exportar funciones principales
export default {
  importarDatos
};
