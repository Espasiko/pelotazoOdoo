/**
 * Módulo de compatibilidad para db-utils
 * Este módulo redirige las llamadas a los nuevos módulos en la carpeta db
 * 
 * NOTA: Este archivo se mantiene por compatibilidad con el código existente.
 * Para nuevas implementaciones, utilizar los módulos en /db directamente.
 */

// Importar funcionalidad refactorizada
import { 
  fetchAdmin, 
  get, 
  post, 
  patch, 
  obtenerIdProveedor, 
  obtenerIdCategoria, 
  importarProducto, 
  actualizarProducto, 
  actualizarImportacion, 
  actualizarLog, 
  registrarDevolucion 
} from './db/index.js';

// Exportar funciones individuales para mantener compatibilidad
export {
  fetchAdmin,
  obtenerIdProveedor,
  obtenerIdCategoria,
  importarProducto,
  actualizarProducto,
  actualizarImportacion,
  actualizarLog,
  registrarDevolucion
};

// Exportar por defecto un objeto con todas las funciones
export default {
  fetchAdmin,
  obtenerIdProveedor,
  obtenerIdCategoria,
  importarProducto,
  actualizarProducto,
  actualizarImportacion,
  actualizarLog,
  registrarDevolucion
};
