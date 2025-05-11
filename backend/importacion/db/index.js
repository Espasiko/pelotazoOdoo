/**
 * Índice del módulo de base de datos para el sistema de importación
 * Este módulo exporta todas las funciones para interactuar con PocketBase
 */

import client, { fetchAdmin, get, post, patch, del } from './client.js';
import providers from './providers.js';
import products from './products.js';
import categories from './categories.js';
import imports from './imports.js';

// Exportar funciones individuales
export {
  // Cliente base
  fetchAdmin,
  get,
  post,
  patch,
  del,
  
  // Proveedores
  providers,
  
  // Productos
  products,
  
  // Categorías
  categories,
  
  // Importaciones
  imports
};

// Exportar funciones específicas para mantener compatibilidad con el código existente
export const obtenerIdProveedor = providers.obtenerIdProveedor;
export const obtenerIdCategoria = categories.obtenerIdCategoria;
export const importarProducto = products.importarProducto;
export const actualizarProducto = products.actualizarProducto;
export const actualizarImportacion = imports.actualizarImportacion;
export const actualizarLog = imports.actualizarLog;
export const registrarDevolucion = imports.registrarDevolucion;

// Exportar por defecto un objeto con todas las funciones
export default {
  client,
  fetchAdmin,
  get,
  post,
  patch,
  del,
  
  // Funciones específicas para mantener compatibilidad
  obtenerIdProveedor: providers.obtenerIdProveedor,
  obtenerIdCategoria: categories.obtenerIdCategoria,
  importarProducto: products.importarProducto,
  actualizarProducto: products.actualizarProducto,
  actualizarImportacion: imports.actualizarImportacion,
  actualizarLog: imports.actualizarLog,
  registrarDevolucion: imports.registrarDevolucion,
  
  // Módulos completos
  providers,
  products,
  categories,
  imports
};
