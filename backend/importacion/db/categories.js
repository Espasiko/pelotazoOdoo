/**
 * Módulo para gestionar categorías en PocketBase
 * Este módulo proporciona funciones para crear, actualizar y consultar categorías
 */

import { get, post } from './client.js';

/**
 * Obtiene el ID de una categoría por su nombre
 * @param {string} nombreCategoria - Nombre de la categoría
 * @param {Function} fetchAdminFunc - Función para realizar la llamada API a PocketBase
 * @returns {Promise<string|null>} - ID de la categoría o null si no existe
 */
export async function obtenerIdCategoria(nombreCategoria, fetchAdminFunc = get) {
  if (!nombreCategoria) {
    console.warn('[obtenerIdCategoria] No se proporcionó nombre de categoría');
    return null;
  }

  // Normalizar el nombre de la categoría
  const nombreNormalizado = nombreCategoria.trim();
  
  try {
    console.log(`[obtenerIdCategoria] Buscando categoría por nombre: "${nombreNormalizado}"`);
    
    // Buscar categoría por nombre
    const filtro = encodeURIComponent(`nombre = "${nombreNormalizado.replace(/"/g, '\\"')}"`);
    const urlBusqueda = `/api/collections/categorias/records?filter=${filtro}`;
    
    const resultado = await fetchAdminFunc(urlBusqueda);
    
    // Si existe, devolver su ID
    if (resultado && resultado.items && resultado.items.length > 0) {
      console.log(`[obtenerIdCategoria] Categoría encontrada con ID: ${resultado.items[0].id}`);
      return resultado.items[0].id;
    }
    
    // Si no existe, crearla
    console.log(`[obtenerIdCategoria] Categoría no encontrada, creando nueva categoría: "${nombreNormalizado}"`);
    
    const nuevaCategoria = {
      nombre: nombreNormalizado,
      activo: true,
      fecha_alta: new Date().toISOString(),
      visible_online: true
    };
    
    const resultadoCreacion = await post('/api/collections/categorias/records', nuevaCategoria);
    
    if (resultadoCreacion && resultadoCreacion.id) {
      console.log(`[obtenerIdCategoria] Categoría creada con ID: ${resultadoCreacion.id}`);
      return resultadoCreacion.id;
    } else {
      console.error('[obtenerIdCategoria] Error al crear categoría, respuesta inesperada:', resultadoCreacion);
      return null;
    }
  } catch (error) {
    console.error(`[obtenerIdCategoria] Error al obtener/crear categoría "${nombreNormalizado}":`, error);
    return null;
  }
}

/**
 * Busca categorías por nombre o parte del nombre
 * @param {string} nombreParcial - Parte del nombre a buscar
 * @param {Function} fetchAdminFunc - Función para realizar peticiones autenticadas a PocketBase
 * @returns {Promise<Array>} - Lista de categorías que coinciden con la búsqueda
 */
export async function buscarCategorias(nombreParcial, fetchAdminFunc = get) {
  try {
    const filtro = nombreParcial 
      ? encodeURIComponent(`nombre ~ "${nombreParcial.replace(/"/g, '\\"')}"`) 
      : '';
    
    const url = `/api/collections/categorias/records?${filtro ? `filter=${filtro}&` : ''}sort=nombre`;
    const resultado = await fetchAdminFunc(url);
    
    return resultado.items || [];
  } catch (error) {
    console.error(`[buscarCategorias] Error al buscar categorías:`, error);
    return [];
  }
}

/**
 * Obtiene todas las categorías activas
 * @param {Function} fetchAdminFunc - Función para realizar peticiones autenticadas a PocketBase
 * @returns {Promise<Array>} - Lista de categorías activas
 */
export async function obtenerCategoriasActivas(fetchAdminFunc = get) {
  try {
    const filtro = encodeURIComponent('activo = true');
    const url = `/api/collections/categorias/records?filter=${filtro}&sort=nombre`;
    
    const resultado = await fetchAdminFunc(url);
    return resultado.items || [];
  } catch (error) {
    console.error(`[obtenerCategoriasActivas] Error al obtener categorías activas:`, error);
    return [];
  }
}

export default {
  obtenerIdCategoria,
  buscarCategorias,
  obtenerCategoriasActivas
};
