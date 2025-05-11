/**
 * Módulo para gestionar productos en PocketBase
 * Este módulo proporciona funciones para crear, actualizar y consultar productos
 */

import { get, post, patch } from './client.js';

/**
 * Importa (crea) un producto en PocketBase
 * @param {Object} productoData - Datos del producto a importar
 * @param {Function} fetchAdminFunc - Función para realizar la llamada API a PocketBase
 * @returns {Promise<Object>} - Producto creado
 */
export async function importarProducto(productoData, fetchAdminFunc = post) {
  try {
    // Validar datos mínimos
    if (!productoData.codigo || !productoData.nombre) {
      throw new Error('Datos de producto incompletos: se requiere código y nombre');
    }
    
    // Asegurar que el precio de venta sea un número
    if (isNaN(productoData.precio_venta) || productoData.precio_venta <= 0) {
      console.warn(`[importarProducto] Precio de venta inválido para ${productoData.codigo}: ${productoData.precio_venta}, usando 0`);
      productoData.precio_venta = 0;
    }
    
    // Asegurar que el IVA sea un número
    if (isNaN(productoData.iva)) {
      productoData.iva = 21; // IVA por defecto
    }
    
    // Crear producto en PocketBase
    const resultado = await fetchAdminFunc('/api/collections/productos/records', productoData);
    
    console.log(`[importarProducto] Producto creado: ${productoData.codigo} - ${productoData.nombre}`);
    return resultado;
  } catch (error) {
    console.error(`[importarProducto] Error al importar producto ${productoData.codigo}:`, error);
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
export async function actualizarProducto(productoId, productoData, fetchAdminFunc = patch) {
  try {
    // Validar ID de producto
    if (!productoId) {
      throw new Error('ID de producto no proporcionado');
    }
    
    // Crear URL de actualización
    const url = `/api/collections/productos/records/${productoId}`;
    
    // Actualizar producto en PocketBase
    const resultado = await fetchAdminFunc(url, productoData);
    
    console.log(`[actualizarProducto] Producto actualizado: ${productoData.codigo} - ${productoData.nombre}`);
    return resultado;
  } catch (error) {
    console.error(`[actualizarProducto] Error al actualizar producto ${productoId}:`, error);
    throw error;
  }
}

/**
 * Busca un producto por su código
 * @param {string} codigo - Código del producto a buscar
 * @param {Function} fetchAdminFunc - Función para realizar la llamada API a PocketBase
 * @returns {Promise<Object|null>} - Producto encontrado o null si no existe
 */
export async function buscarProductoPorCodigo(codigo, fetchAdminFunc = get) {
  try {
    // Validar código
    if (!codigo) {
      throw new Error('Código de producto no proporcionado');
    }
    
    // Crear filtro de búsqueda
    const filtro = encodeURIComponent(`codigo = "${codigo.replace(/"/g, '\\"')}"`);
    const url = `/api/collections/productos/records?filter=${filtro}`;
    
    // Buscar producto en PocketBase
    const resultado = await fetchAdminFunc(url);
    
    // Verificar si se encontró el producto
    if (resultado && resultado.items && resultado.items.length > 0) {
      return resultado.items[0];
    }
    
    return null;
  } catch (error) {
    console.error(`[buscarProductoPorCodigo] Error al buscar producto con código ${codigo}:`, error);
    return null;
  }
}

/**
 * Actualiza el campo nombre_proveedor en un producto existente
 * @param {string} productoId - ID del producto a actualizar
 * @param {string} nombreProveedor - Nombre del proveedor
 * @param {Function} fetchAdminFunc - Función para realizar la llamada API a PocketBase
 * @returns {Promise<Object>} - Producto actualizado
 */
export async function actualizarNombreProveedor(productoId, nombreProveedor, fetchAdminFunc = patch) {
  try {
    // Validar ID de producto y nombre de proveedor
    if (!productoId || !nombreProveedor) {
      throw new Error('ID de producto o nombre de proveedor no proporcionado');
    }
    
    // Crear URL de actualización
    const url = `/api/collections/productos/records/${productoId}`;
    
    // Actualizar solo el campo nombre_proveedor
    const resultado = await fetchAdminFunc(url, { nombre_proveedor: nombreProveedor });
    
    console.log(`[actualizarNombreProveedor] Campo nombre_proveedor actualizado para producto ${productoId}: ${nombreProveedor}`);
    return resultado;
  } catch (error) {
    console.error(`[actualizarNombreProveedor] Error al actualizar nombre_proveedor para producto ${productoId}:`, error);
    throw error;
  }
}

export default {
  importarProducto,
  actualizarProducto,
  buscarProductoPorCodigo,
  actualizarNombreProveedor
};
