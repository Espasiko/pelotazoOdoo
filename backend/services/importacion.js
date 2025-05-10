// Servicio de importación principal para El Pelotazo
import { fetchAdmin } from '../utils/auth.js';
import { actualizarLog, obtenerIdCategoria, obtenerIdProveedor, importarProducto, actualizarProducto } from '../importacion/db-utils.js';

/**
 * Importar datos procesados a la base de datos
 * @param {Array} datos - Datos procesados a importar
 * @param {string} proveedorNombre - Nombre del proveedor
 * @param {string} importacionId - Identificador único de la importación
 * @param {Object} categoriasMap - Mapa de categorías detectadas y sus IDs
 * @returns {Promise<Object>} - Resultado de la importación
 */
export async function importarABaseDeDatos(datos, proveedorNombre, importacionId = null, categoriasMap = {}) {
  console.log(`Importando ${datos.length} productos a la base de datos para proveedor ${proveedorNombre || 'desconocido'}`);
  // Variables para estadísticas
  const stats = {
    total: datos.length,
    creados: 0,
    actualizados: 0,
    errores: 0,
    erroresDetalle: [],
    devoluciones: 0
  };
  for (const producto of datos) {
    try {
      // Aquí puedes adaptar la lógica de obtención/creación de IDs de categoría/proveedor
      // y la lógica de creación/actualización según tu flujo
      // Ejemplo:
      const idCategoria = await obtenerIdCategoria(producto.categoria, categoriasMap, fetchAdmin);
      const idProveedor = await obtenerIdProveedor(producto.proveedor, fetchAdmin);
      const body = {
        ...producto,
        categoria: idCategoria,
        proveedor: idProveedor
      };
      // Intentar crear producto
      const creado = await importarProducto(body, fetchAdmin);
      if (creado && creado.id) {
        stats.creados++;
      } else {
        // Si ya existe, intentar actualizar
        const actualizado = await actualizarProducto(body, fetchAdmin);
        if (actualizado && actualizado.id) {
          stats.actualizados++;
        } else {
          stats.errores++;
          stats.erroresDetalle.push({ producto: producto.codigo || producto.nombre, error: 'No se pudo crear ni actualizar' });
        }
      }
    } catch (err) {
      stats.errores++;
      stats.erroresDetalle.push({ producto: producto.codigo || producto.nombre, error: err.message });
    }
  }
  if (importacionId) {
    await actualizarLog(importacionId, `Importación finalizada. Creados: ${stats.creados}, Actualizados: ${stats.actualizados}, Errores: ${stats.errores}`);
  }
  return { exito: stats.errores === 0, stats };
}
