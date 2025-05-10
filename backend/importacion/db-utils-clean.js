/**
 * Módulo de utilidades de base de datos para el sistema de importación
 * Este módulo maneja operaciones CRUD y consultas a PocketBase
 */

import { pocketbaseConfig } from './config.js';
import { autenticarAdmin, limpiarPrecio } from './utils.js';

// URL base de PocketBase
const baseUrl = pocketbaseConfig.url;

/**
 * Realizar una petición autenticada como admin a PocketBase
 * @param {string} endpoint - Endpoint al que hacer la petición
 * @param {Object} options - Opciones de la petición
 * @returns {Promise<Object>} - Respuesta de PocketBase
 */
export async function fetchAdmin(endpoint, options = {}) {
  try {
    // Obtener token de autenticación
    const authToken = await autenticarAdmin();
    if (!authToken) {
      throw new Error('No se pudo obtener token de autenticación');
    }
    
    // Configurar URL
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    
    // Configurar opciones de la petición
    const fetchOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    // Realizar petición
    console.log(`[fetchAdmin] ${options.method || 'GET'} ${url}`);
    const response = await fetch(url, fetchOptions);
    
    // Para registro y depuración
    const contentType = response.headers.get('content-type');
    
    // Verificar formato de respuesta para parsear adecuadamente
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw { status: response.status, data, message: data.message || response.statusText };
      }
      return data;
    } else if (contentType && contentType.includes('text/')) {
      // Texto plano, HTML, etc.
      const text = await response.text();
      if (!response.ok) {
        throw { status: response.status, data: text, message: response.statusText };
      }
      return { text };
    } else {
      // Otros tipos de datos (binarios, etc.)
      const blob = await response.blob();
      if (!response.ok) {
        throw { status: response.status, data: blob, message: response.statusText };
      }
      return { blob };
    }
  } catch (error) {
    // Mejorar el logging de errores
    if (error && error.data) {
      console.error(`Error en fetchAdmin (${endpoint}):`, error.message || 'Error desconocido');
      if (error.data.data) {
        Object.keys(error.data.data).forEach(key => {
          console.error(`- Campo ${key}: ${error.data.data[key].message}`);
        });
      }
    } else {
      console.error(`Error en fetchAdmin (${endpoint}):`, error);
    }
    throw error;
  }
}

/**
 * Actualiza el estado de una importación
 * @param {string} importacionId - ID de la importación
 * @param {string} estado - Nuevo estado
 * @param {Object} resultado - Resultado de la importación
 * @returns {Promise<Object>} - Importación actualizada
 */
export async function actualizarImportacion(importacionId, estado, resultado) {
  if (!importacionId) {
    console.warn('No se puede actualizar una importación sin ID');
    return null;
  }
  
  try {
    const datos = {
      estado: estado
    };
    
    // Añadir estadísticas si hay resultado
    if (resultado) {
      if (resultado.stats) {
        datos.total_registros = resultado.stats.total || 0;
        datos.registros_exitosos = (resultado.stats.creados || 0) + (resultado.stats.actualizados || 0);
        datos.registros_fallidos = resultado.stats.errores || 0;
      }
      
      // Añadir notas si hay error
      if (resultado.error) {
        datos.notas = `Error: ${resultado.error}`;
      }
    }
    
    console.log(`Actualizando importación ${importacionId} a estado ${estado}`);
    
    const response = await fetchAdmin(`/api/collections/importaciones/records/${importacionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    
    console.log(`Importación actualizada: ${response.id}`);
    return response;
  } catch (error) {
    console.error('Error al actualizar importación:', error);
    return null;
  }
}

/**
 * Añade una entrada al log de importación
 * @param {string} importacionId - ID de la importación
 * @param {string} mensaje - Mensaje a añadir al log
 * @returns {Promise<Object>} - Importación actualizada
 */
export async function actualizarLog(importacionId, mensaje) {
  if (!importacionId) {
    console.warn('No se puede actualizar log de una importación sin ID');
    return null;
  }
  
  if (!mensaje) {
    console.warn('No se puede actualizar log sin mensaje');
    return null;
  }
  
  try {
    // Obtener registro actual para añadir al log
    console.log(`Obteniendo importación ${importacionId} para actualizar log`);
    const importacion = await fetchAdmin(`/api/collections/importaciones/records/${importacionId}`);
    
    if (!importacion) {
      console.error(`No se encontró la importación ${importacionId}`);
      return null;
    }
    
    // Preparar nuevo mensaje de log con timestamp
    const timestamp = new Date().toISOString();
    const nuevoMensaje = `[${timestamp}] ${mensaje}`;
    
    // Añadir al log existente o crear nuevo
    let logActualizado = '';
    if (importacion.log) {
      logActualizado = `${importacion.log}\n${nuevoMensaje}`;
    } else {
      logActualizado = nuevoMensaje;
    }
    
    // Actualizar registro
    console.log(`Actualizando log de importación ${importacionId}`);
    const response = await fetchAdmin(`/api/collections/importaciones/records/${importacionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: logActualizado })
    });
    
    console.log(`Log de importación actualizado: ${response.id}`);
    return response;
  } catch (error) {
    console.error('Error al actualizar log de importación:', error);
    return null;
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
  if (!producto || !analisisNota) {
    console.warn('No se puede registrar una devolución sin producto o análisis');
    return null;
  }
  
  try {
    const datosDevolucion = {
      producto: producto.id || null,
      codigo_producto: producto.codigo || '',
      nombre_producto: producto.nombre || '',
      fecha: analisisNota.fecha || new Date().toISOString().split('T')[0],
      cantidad: analisisNota.cantidad || 1,
      motivo: analisisNota.motivo || 'Sin especificar',
      proveedor: proveedorId || null,
      importacion: importacionId || null,
      estado: 'pendiente',
      notas: analisisNota.textoCompleto || ''
    };
    
    console.log(`Registrando devolución para producto ${producto.codigo || producto.id || 'desconocido'}`);
    
    const response = await fetchAdmin(`/api/collections/devoluciones/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosDevolucion)
    });
    
    console.log(`Devolución registrada con ID: ${response.id}`);
    return response;
  } catch (error) {
    console.error('Error al registrar devolución:', error);
    return null;
  }
}

/**
 * Importa (crea) un producto en PocketBase
 * @param {Object} productoData - Datos del producto a importar
 * @param {Function} fetchAdminFunc - Función para realizar la llamada API a PocketBase
 * @returns {Promise<Object>} - Producto creado
 */
export async function importarProducto(productoData, fetchAdminFunc) {
  try {
    // Forzar que stock_actual y unidades_vendidas sean enteros
    if ('stock_actual' in productoData) productoData.stock_actual = parseInt(productoData.stock_actual, 10) || 0;
    if ('unidades_vendidas' in productoData) productoData.unidades_vendidas = parseInt(productoData.unidades_vendidas, 10) || 0;
    
    console.log(`[IMPORTAR] Enviando producto con código: ${productoData.codigo}`);
    
    const response = await fetchAdminFunc('/api/collections/productos/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productoData)
    });
    
    console.log(`Producto creado con ID: ${response.id}`);
    return response;
  } catch (error) {
    console.error('Error al importar producto:', error);
    throw error;
  }
}

/**
 * Actualiza un producto en PocketBase
 * @param {string} productoId - ID del producto a actualizar
 * @param {Object} productoData - Datos del producto a actualizar
 * @param {Function} fetchAdminFunc - Función para realizar la llamada API a PocketBase
 * @returns {Promise<Object>} - Producto actualizado
 */
export async function actualizarProducto(productoId, productoData, fetchAdminFunc) {
  try {
    // Forzar que stock_actual y unidades_vendidas sean enteros
    if ('stock_actual' in productoData) productoData.stock_actual = parseInt(productoData.stock_actual, 10) || 0;
    if ('unidades_vendidas' in productoData) productoData.unidades_vendidas = parseInt(productoData.unidades_vendidas, 10) || 0;
    
    console.log(`[ACTUALIZAR] Actualizando producto con ID: ${productoId}`);
    
    const response = await fetchAdminFunc(`/api/collections/productos/records/${productoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productoData)
    });
    
    console.log(`Producto actualizado con ID: ${response.id}`);
    return response;
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    throw error;
  }
}

/**
 * Obtiene el ID de una categoría por su nombre
 * @param {string} nombreCategoria - Nombre de la categoría
 * @param {Function} fetchAdminFunc - Función para realizar la llamada API a PocketBase
 * @returns {Promise<string|null>} - ID de la categoría o null si no existe
 */
export async function obtenerIdCategoria(nombreCategoria, fetchAdminFunc) {
  if (!fetchAdminFunc) {
    console.error(`Error Crítico: fetchAdminFunc no proporcionado a obtenerIdCategoria para ${nombreCategoria}`);
    return null;
  }
  if (!nombreCategoria || typeof nombreCategoria !== 'string' || nombreCategoria.trim() === '') {
    console.log(`Nombre de categoría no válido o vacío: '${nombreCategoria}'`);
    return null;
  }
  const nombreNormalizado = nombreCategoria.trim();
  try {
    console.log(`Buscando en categorías por nombre: '${nombreNormalizado}'`);
    const filtro = encodeURIComponent(`nombre = "${nombreNormalizado.replace(/"/g, '\"')}" `);
    const urlBusqueda = `/api/collections/categorias/records?filter=${filtro}`;
    const records = await fetchAdminFunc(urlBusqueda);
    if (records && records.items && records.items.length > 0) {
      console.log(`Categoría encontrada con ID: ${records.items[0].id}`);
      return records.items[0].id;
    } else {
      console.log(`Creando nueva categoría: '${nombreNormalizado}'`);
      const urlCreacion = `/api/collections/categorias/records`;
      const newRecord = await fetchAdminFunc(urlCreacion, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreNormalizado })
      });
      if (newRecord && newRecord.id) {
        console.log(`Nueva categoría creada con ID: ${newRecord.id}`);
        return newRecord.id;
      } else {
        console.error(`No se pudo crear la categoría '${nombreNormalizado}'`);
        return null;
      }
    }
  } catch (error) {
    console.error(`Error en obtenerIdCategoria para '${nombreNormalizado}':`, error);
    return null;
  }
}

// Exportar funciones principales
export default {
  obtenerIdCategoria,
  importarProducto,
  actualizarProducto,
  actualizarLog,
  registrarDevolucion
};
