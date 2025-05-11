/**
 * Índice principal del sistema de importación
 * Este módulo exporta todas las funciones y módulos del sistema de importación
 */

// Importar módulos
import * as core from './core/index.js';
import * as db from './db/index.js';
import * as parsers from './parsers/index.js';

// Exportar módulos
export {
  core,
  db,
  parsers
};

// Exportar funciones específicas para mantener compatibilidad con código existente
export const importarDatos = core.importarDatos;
export const procesarArchivo = core.procesarArchivo;
export const obtenerIdProveedor = db.obtenerIdProveedor;
export const obtenerIdCategoria = db.obtenerIdCategoria;
export const importarProducto = db.products.importarProducto;
export const actualizarProducto = db.products.actualizarProducto;
export const fetchAdmin = db.fetchAdmin;

// Exportar por defecto un objeto con todas las funciones y módulos
export default {
  core,
  db,
  parsers,
  
  // Funciones específicas para mantener compatibilidad
  importarDatos: core.importarDatos,
  procesarArchivo: core.procesarArchivo,
  obtenerIdProveedor: db.obtenerIdProveedor,
  obtenerIdCategoria: db.obtenerIdCategoria,
  importarProducto: db.products.importarProducto,
  actualizarProducto: db.products.actualizarProducto,
  fetchAdmin: db.fetchAdmin
};
