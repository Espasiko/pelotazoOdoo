/**
 * Índice del módulo core para el sistema de importación
 * Este módulo exporta todas las funciones principales del sistema de importación
 */

import { importarDatos } from './import-controller.js';
import { procesarArchivo, detectarProveedor } from './file-processor.js';
import { importarABaseDeDatos } from './db-importer.js';

// Exportar funciones individuales
export {
  importarDatos,
  procesarArchivo,
  detectarProveedor,
  importarABaseDeDatos
};

// Exportar por defecto un objeto con todas las funciones
export default {
  importarDatos,
  procesarArchivo,
  detectarProveedor,
  importarABaseDeDatos
};
