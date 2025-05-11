/**
 * Módulo para gestionar importaciones en PocketBase
 * Este módulo proporciona funciones para crear, actualizar y consultar importaciones
 */

import { get, post, patch } from './client.js';

/**
 * Actualiza el estado de una importación
 * @param {string} importacionId - ID de la importación
 * @param {string} estado - Nuevo estado
 * @param {Object} resultado - Resultado de la importación
 * @returns {Promise<Object>} - Importación actualizada
 */
export async function actualizarImportacion(importacionId, estado, resultado) {
  try {
    // Validar ID de importación
    if (!importacionId) {
      throw new Error('ID de importación no proporcionado');
    }
    
    // Crear datos de actualización
    const datosActualizacion = {
      estado: estado || 'completado',
      total_registros: resultado?.total || 0,
      registros_exitosos: resultado?.creados + resultado?.actualizados || 0,
      registros_fallidos: resultado?.errores || 0,
      notas: resultado?.erroresDetalle ? JSON.stringify(resultado.erroresDetalle) : ''
    };
    
    // Crear URL de actualización
    const url = `/api/collections/importaciones/records/${importacionId}`;
    
    // Actualizar importación en PocketBase
    const respuesta = await patch(url, datosActualizacion);
    
    console.log(`[actualizarImportacion] Importación ${importacionId} actualizada a estado: ${estado}`);
    return respuesta;
  } catch (error) {
    console.error(`[actualizarImportacion] Error al actualizar importación ${importacionId}:`, error);
    throw error;
  }
}

/**
 * Añade una entrada al log de importación
 * @param {string} importacionId - ID de la importación
 * @param {string} mensaje - Mensaje a añadir al log
 * @returns {Promise<Object>} - Importación actualizada
 */
export async function actualizarLog(importacionId, mensaje) {
  try {
    // Validar ID de importación y mensaje
    if (!importacionId || !mensaje) {
      throw new Error('ID de importación o mensaje no proporcionado');
    }
    
    // Obtener importación actual
    const url = `/api/collections/importaciones/records/${importacionId}`;
    const importacion = await get(url);
    
    // Añadir mensaje al log
    const timestamp = new Date().toISOString();
    const nuevoMensaje = `[${timestamp}] ${mensaje}`;
    
    // Actualizar log en PocketBase
    const notasActuales = importacion.notas || '';
    const nuevasNotas = notasActuales ? `${notasActuales}\n${nuevoMensaje}` : nuevoMensaje;
    
    // Actualizar importación
    const respuesta = await patch(url, { notas: nuevasNotas });
    
    console.log(`[actualizarLog] Log de importación ${importacionId} actualizado`);
    return respuesta;
  } catch (error) {
    console.error(`[actualizarLog] Error al actualizar log de importación ${importacionId}:`, error);
    throw error;
  }
}

/**
 * Registra una devolución en la base de datos
 * @param {Object} producto - Producto devuelto
 * @param {Object} analisisNota - Análisis de la nota de devolución
 * @param {string} proveedorId - ID del proveedor
 * @param {string} importacionId - ID de la importación
 * @returns {Promise<Object>} - Devolución creada
 */
export async function registrarDevolucion(producto, analisisNota, proveedorId, importacionId) {
  try {
    // Validar datos mínimos
    if (!producto || !analisisNota || !proveedorId) {
      throw new Error('Datos de devolución incompletos');
    }
    
    // Crear datos de devolución
    const datosDevolucion = {
      fecha: new Date().toISOString(),
      motivo: analisisNota.motivo || 'No especificado',
      estado: 'pendiente',
      producto_codigo: producto.codigo,
      producto_nombre: producto.nombre,
      proveedor: proveedorId,
      importacion: importacionId,
      notas: analisisNota.textoOriginal || ''
    };
    
    // Crear devolución en PocketBase
    const respuesta = await post('/api/collections/devoluciones/records', datosDevolucion);
    
    console.log(`[registrarDevolucion] Devolución registrada para producto ${producto.codigo}`);
    return respuesta;
  } catch (error) {
    console.error(`[registrarDevolucion] Error al registrar devolución:`, error);
    throw error;
  }
}

/**
 * Crea una nueva importación
 * @param {string} tipo - Tipo de importación
 * @param {string} archivoId - ID del archivo importado
 * @param {string} nombreArchivo - Nombre del archivo importado
 * @returns {Promise<Object>} - Importación creada
 */
export async function crearImportacion(tipo, archivoId, nombreArchivo) {
  try {
    // Validar datos mínimos
    if (!tipo || !nombreArchivo) {
      throw new Error('Datos de importación incompletos');
    }
    
    // Crear datos de importación
    const datosImportacion = {
      tipo: tipo,
      fecha: new Date().toISOString(),
      archivo: archivoId,
      nombre_archivo: nombreArchivo,
      estado: 'iniciado',
      total_registros: 0,
      registros_exitosos: 0,
      registros_fallidos: 0
    };
    
    // Crear importación en PocketBase
    const respuesta = await post('/api/collections/importaciones/records', datosImportacion);
    
    console.log(`[crearImportacion] Importación creada para archivo ${nombreArchivo}`);
    return respuesta;
  } catch (error) {
    console.error(`[crearImportacion] Error al crear importación:`, error);
    throw error;
  }
}

export default {
  actualizarImportacion,
  actualizarLog,
  registrarDevolucion,
  crearImportacion
};
