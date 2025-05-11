/**
 * Módulo para gestionar proveedores en PocketBase
 * Este módulo proporciona funciones para crear, actualizar y consultar proveedores
 */

import { get, post } from './client.js';

/**
 * Obtiene o crea un proveedor en PocketBase y devuelve su ID y nombre
 * @param {string} nombreProveedor - Nombre del proveedor
 * @param {Function} fetchAdminFunc - Función para realizar peticiones autenticadas a PocketBase
 * @returns {Promise<Object|null>} - Objeto con ID y nombre del proveedor o null si no se pudo obtener/crear
 */
export async function obtenerIdProveedor(nombreProveedor, fetchAdminFunc = get) {
  if (!nombreProveedor) {
    console.warn('[obtenerIdProveedor] No se proporcionó nombre de proveedor');
    return null;
  }

  // Normalizar el nombre del proveedor
  const nombreNormalizado = nombreProveedor.trim().toUpperCase();
  
  try {
    console.log(`[obtenerIdProveedor] Buscando proveedor por nombre: "${nombreNormalizado}"`);
    
    // Buscar proveedor por nombre
    const filtro = encodeURIComponent(`nombre = "${nombreNormalizado.replace(/"/g, '\\"')}"`);
    const urlBusqueda = `/api/collections/proveedores/records?filter=${filtro}`;
    
    const resultado = await fetchAdminFunc(urlBusqueda);
    
    // Si existe, devolver su ID y nombre
    if (resultado && resultado.items && resultado.items.length > 0) {
      console.log(`[obtenerIdProveedor] Proveedor encontrado con ID: ${resultado.items[0].id}`);
      return {
        id: resultado.items[0].id,
        nombre: resultado.items[0].nombre
      };
    }
    
    // Si no existe, crearlo
    console.log(`[obtenerIdProveedor] Proveedor no encontrado, creando nuevo proveedor: "${nombreNormalizado}"`);
    
    const nuevoProveedor = {
      nombre: nombreNormalizado,
      activo: true,
      fecha_alta: new Date().toISOString()
    };
    
    const resultadoCreacion = await post('/api/collections/proveedores/records', nuevoProveedor);
    
    if (resultadoCreacion && resultadoCreacion.id) {
      console.log(`[obtenerIdProveedor] Proveedor creado con ID: ${resultadoCreacion.id}`);
      return {
        id: resultadoCreacion.id,
        nombre: resultadoCreacion.nombre
      };
    } else {
      console.error('[obtenerIdProveedor] Error al crear proveedor, respuesta inesperada:', resultadoCreacion);
      return null;
    }
  } catch (error) {
    console.error(`[obtenerIdProveedor] Error al obtener/crear proveedor "${nombreNormalizado}":`, error);
    return null;
  }
}

/**
 * Busca proveedores por nombre o parte del nombre
 * @param {string} nombreParcial - Parte del nombre a buscar
 * @param {Function} fetchAdminFunc - Función para realizar peticiones autenticadas a PocketBase
 * @returns {Promise<Array>} - Lista de proveedores que coinciden con la búsqueda
 */
export async function buscarProveedores(nombreParcial, fetchAdminFunc = get) {
  try {
    const filtro = nombreParcial 
      ? encodeURIComponent(`nombre ~ "${nombreParcial.replace(/"/g, '\\"')}"`) 
      : '';
    
    const url = `/api/collections/proveedores/records?${filtro ? `filter=${filtro}&` : ''}sort=nombre`;
    const resultado = await fetchAdminFunc(url);
    
    return resultado.items || [];
  } catch (error) {
    console.error(`[buscarProveedores] Error al buscar proveedores:`, error);
    return [];
  }
}

/**
 * Obtiene todos los proveedores activos
 * @param {Function} fetchAdminFunc - Función para realizar peticiones autenticadas a PocketBase
 * @returns {Promise<Array>} - Lista de proveedores activos
 */
export async function obtenerProveedoresActivos(fetchAdminFunc = get) {
  try {
    const filtro = encodeURIComponent('activo = true');
    const url = `/api/collections/proveedores/records?filter=${filtro}&sort=nombre`;
    
    const resultado = await fetchAdminFunc(url);
    return resultado.items || [];
  } catch (error) {
    console.error(`[obtenerProveedoresActivos] Error al obtener proveedores activos:`, error);
    return [];
  }
}

export default {
  obtenerIdProveedor,
  buscarProveedores,
  obtenerProveedoresActivos
};
