/**
 * Módulo de utilidades de base de datos para el sistema de importación
 * Este módulo maneja operaciones CRUD y consultas a PocketBase
 */

import { pocketbaseConfig } from './config.js';
import { autenticarAdmin, fetchAdmin } from './utils.js';

/**
 * Obtiene el ID de un proveedor por su nombre
 * @param {string} nombreProveedor - Nombre del proveedor
 * @returns {Promise<string|null>} - ID del proveedor o null si no existe
 */
export async function obtenerIdProveedor(nombreProveedor) {
  if (!nombreProveedor) {
    console.log('No se proporcionó nombre de proveedor, usando genérico');
    return null;
  }
  
  // Normalizar el nombre del proveedor
  const nombreNormalizado = nombreProveedor.trim().toUpperCase();
  
  // Buscar si el proveedor ya existe usando búsqueda aproximada
  try {
    const proveedorExistente = await fetchAdmin(`/api/collections/proveedores/records`, {
      method: 'GET',
      params: {
        filter: `nombre~"${nombreNormalizado}"`
      }
    });
    
    if (proveedorExistente.items && proveedorExistente.items.length > 0) {
      console.log(`Proveedor encontrado con ID: ${proveedorExistente.items[0].id}`);
      return proveedorExistente.items[0].id;
    }
  } catch (error) {
    console.error('Error al buscar proveedor:', error);
  }
  
  // Si no existe, crear un nuevo proveedor
  console.log(`Creando nuevo proveedor: ${nombreProveedor}`);
  
  // Verificar si la colección existe
  try {
    const colecciones = await fetchAdmin(`/api/collections`);
    const existeColeccion = colecciones.some(c => c.name === 'proveedores');
    
    if (!existeColeccion) {
      console.error('La colección proveedores no existe en PocketBase');
      return `temp_${nombreNormalizado.replace(/\s+/g, '_').toLowerCase()}`;
    }
  } catch (error) {
    console.error('Error al verificar colecciones:', error);
  }
  
  // Crear el proveedor
  try {
    const nuevoProveedor = await fetchAdmin(`/api/collections/proveedores/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: nombreProveedor,
        activo: true,
        fecha_alta: new Date().toISOString()
      }),
    });
    
    console.log(`Nuevo proveedor creado con ID: ${nuevoProveedor.id}`);
    return nuevoProveedor.id;
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    return null;
  }
}

/**
 * Obtiene un proveedor por su nombre
 * @param {string} nombreProveedor - Nombre del proveedor
 * @returns {Promise<Object|null>} - Objeto proveedor o null si no existe
 */
export async function obtenerProveedorPorNombre(nombreProveedor) {
  if (!nombreProveedor) return null;
  
  // Normalizar el nombre del proveedor
  const nombreNormalizado = nombreProveedor.trim().toUpperCase();
  
  try {
    const proveedores = await fetchAdmin(`/api/collections/proveedores/records`, {
      method: 'GET',
      params: {
        filter: `nombre~"${nombreNormalizado}"`
      }
    });
    
    if (proveedores.items && proveedores.items.length > 0) {
      return proveedores.items[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener proveedor por nombre:', error);
    return null;
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
    console.error('No se proporcionó ID de importación para actualizar');
    return null;
  }
  
  try {
    const importacionActualizada = await fetchAdmin(`/api/collections/importaciones/records/${importacionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        estado: estado,
        resultado: JSON.stringify(resultado),
        fecha_fin: new Date().toISOString()
      }),
    });
    
    console.log(`Importación ${importacionId} actualizada a estado: ${estado}`);
    return importacionActualizada;
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
    console.error('No se proporcionó ID de importación para actualizar log');
    return null;
  }
  
  try {
    // Obtener importación actual
    const importacion = await fetchAdmin(`/api/collections/importaciones/records/${importacionId}`);
    
    // Añadir mensaje al log
    const logActual = importacion.log || '';
    const nuevoLog = `${logActual}${new Date().toISOString()}: ${mensaje}\n`;
    
    // Actualizar importación
    const importacionActualizada = await fetchAdmin(`/api/collections/importaciones/records/${importacionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        log: nuevoLog
      }),
    });
    
    return importacionActualizada;
  } catch (error) {
    console.error('Error al actualizar log:', error);
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
  try {
    // Crear registro de devolución
    const devolucion = await fetchAdmin(`/api/collections/devoluciones/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        producto: producto.codigo,
        nombre_producto: producto.nombre,
        fecha: new Date().toISOString(),
        motivo: analisisNota.motivo || 'No especificado',
        cantidad: analisisNota.cantidad || 1,
        importe: analisisNota.importe || 0,
        proveedor: proveedorId,
        importacion: importacionId,
        estado: 'pendiente'
      }),
    });
    
    console.log(`Devolución registrada para producto ${producto.codigo}`);
    await actualizarLog(importacionId, `Devolución registrada para producto ${producto.codigo}: ${analisisNota.motivo || 'No especificado'}`);
    
    return devolucion;
  } catch (error) {
    console.error('Error al registrar devolución:', error);
    await actualizarLog(importacionId, `Error al registrar devolución para producto ${producto.codigo}: ${error.message}`);
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
    console.log(`Buscando en categorías por nombre: '${nombreNormalizado}' usando fetchAdminFunc`);
    const filtro = encodeURIComponent(`nombre = "${nombreNormalizado.replace(/"/g, '\"')}" `);
    const urlBusqueda = `/api/collections/categorias/records?filter=${filtro}`;
    const records = await fetchAdminFunc(urlBusqueda);
    if (records && records.items && records.items.length > 0) {
      console.log(`Categoría encontrada con ID: ${records.items[0].id}`);
      return records.items[0].id;
    } else {
      console.log(`Creando nueva categoría: '${nombreNormalizado}' usando fetchAdminFunc`);
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
        console.error(`No se pudo crear la categoría '${nombreNormalizado}'. Respuesta:`, newRecord);
        return null;
      }
    }
  } catch (error) {
    console.error(`Error en obtenerIdCategoria para '${nombreNormalizado}':`, error);
    if (error.data && error.data.data) {
      Object.keys(error.data.data).forEach(key => {
        if (error.data.data[key] && error.data.data[key].message) {
          console.error(`Detalle del error de PocketBase (campo ${key}): ${error.data.data[key].message}`);
        }
      });
    } else if (error.message) {
      console.error('Error general en obtenerIdCategoria:', error.message);
    }
    return null;
  }
}
