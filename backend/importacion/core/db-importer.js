/**
 * Módulo para importar datos a la base de datos
 * Este módulo proporciona funciones para importar productos y categorías a PocketBase
 */

import dbUtils from '../db/index.js';
import { detectarCategorias, asignarCategoria, analizarNota } from '../categorias.js';
import { validateProduct, validateProvider, validateCategory } from './data-validator.js';

/**
 * Importa datos procesados a la base de datos
 * @param {Array} datos - Datos procesados a importar
 * @param {string} proveedorNombre - Nombre del proveedor
 * @param {string} importacionId - Identificador único de la importación
 * @param {Function} fetchAdminFunc - Función para hacer peticiones autenticadas a PocketBase
 * @param {Object} categoriasMap - Mapa de categorías detectadas y sus IDs
 * @returns {Promise<Object>} - Resultado de la importación
 */
export async function importarABaseDeDatos(datos, proveedorNombre, importacionId, fetchAdminFunc, categoriasMap = {}) {
  console.log(`[importarABaseDeDatos] Iniciando importación de ${datos.length} productos para proveedor ${proveedorNombre}`);
  
  // Estadísticas de importación
  const stats = {
    total: datos.length,
    creados: 0,
    actualizados: 0,
    errores: 0,
    devoluciones: 0,
    erroresDetalle: []
  };
  
  // 1. Obtener/Crear ID del PROVEEDOR PRINCIPAL
  let idProveedorPrincipal = null;
  let nombreProveedorPrincipal = null;
  if (proveedorNombre) {
    try {
      const resultadoProveedor = await dbUtils.obtenerIdProveedor(proveedorNombre, fetchAdminFunc);
      if (resultadoProveedor) {
        idProveedorPrincipal = resultadoProveedor.id;
        nombreProveedorPrincipal = resultadoProveedor.nombre;
        console.log(`Proveedor principal resuelto: ${proveedorNombre} -> ID: ${idProveedorPrincipal}, Nombre: ${nombreProveedorPrincipal}`);
      } else {
        console.warn(`No se pudo resolver el proveedor principal: ${proveedorNombre}`);
      }
    } catch (error) {
      console.error(`Error al resolver proveedor principal ${proveedorNombre}:`, error);
    }
  }
  
  // Pre-crear o obtener IDs de categorías usando obtenerIdCategoria
  const categoriasFinales = {};
  for (const catNombre of Object.keys(categoriasMap)) {
    const catId = await dbUtils.obtenerIdCategoria(catNombre, fetchAdminFunc);
    if (catId) {
      categoriasFinales[catNombre] = catId;
    }
  }
  console.log(`Categorías finales mapeadas: ${JSON.stringify(categoriasFinales)}`);
  
  // Procesar cada producto
  for (const producto of datos) {
    try {
      // Crear objeto base del producto con campos requeridos
      const productoBase = {
        codigo: String(producto.codigo || producto.CODIGO || producto.EAN || producto.REFERENCIA || `SIN_CODIGO`),
        nombre: String(producto.nombre || producto.DESCRIPCION || producto.CONCEPTO || producto.TITULO || 'Sin Nombre'),
        descripcion: producto.descripcion || producto.DESCRIPCION_LARGA || producto.DESCRIPCION || '',
        precio_venta: parseFloat(producto.precio_venta || producto.PVP || producto.PRECIO || 0),
        precio_compra: parseFloat(producto.precio_compra || producto.COSTE || producto.PRECIO_COMPRA || 0),
        iva: parseFloat(producto.iva || producto.IVA || 21),
        stock_actual: parseInt(producto.stock_actual || producto.STOCK || producto.UNIDADES || 0, 10),
        stock_minimo: parseInt(producto.stock_minimo || producto.STOCK_MINIMO || 0, 10),
        activo: true,
        visible_online: true,
        codigo_barras: producto.codigo_barras || producto.EAN || producto.CODIGO_BARRAS || '',
        notas: producto.notas || producto.NOTAS || producto.OBSERVACIONES || '',
        fecha_alta: new Date().toISOString(),
        reservable: true,
        alerta_stock_bajo: true,
        descuento: parseFloat(producto.descuento || producto.DESCUENTO || 0),
        beneficio_unitario: parseFloat(producto.beneficio_unitario || producto.BENEFICIO_UNITARIO || 0),
        beneficio_total: parseFloat(producto.beneficio_total || producto.BENEFICIO_TOTAL || 0),
        unidades_vendidas: parseInt(producto.unidades_vendidas || producto.VENDIDAS || 0, 10),
        recargo_iva: parseFloat(producto.recargo_iva || producto.RECARGO_IVA || 0)
      };
      
      // Validar y normalizar datos del producto
      console.log(`[importarABaseDeDatos] Validando producto: ${productoBase.codigo} - ${productoBase.nombre}`);
      const validationResult = validateProduct(productoBase);
      
      if (!validationResult.isValid) {
        console.warn(`[importarABaseDeDatos] Producto ${productoBase.codigo} tiene errores de validación:`, validationResult.errors);
        stats.erroresDetalle.push({ 
          producto: productoBase.codigo, 
          errores: validationResult.errors 
        });
        
        // Decidir si continuar con el producto a pesar de los errores
        if (validationResult.errors.some(e => e.includes('obligatorio'))) {
          // Error crítico: faltan campos obligatorios
          stats.errores++;
          continue; // Saltar este producto
        }
        // Para otros errores no críticos, continuamos con el producto normalizado
      }
      
      // Usar el producto limpio/normalizado
      const productoValidado = validationResult.product;
      
      // Calcular precio con margen si no existe
      if (!productoValidado.precio_con_margen && productoValidado.precio_compra > 0) {
        productoValidado.precio_con_margen = productoValidado.precio_compra * 1.3; // 30% de margen por defecto
      }
      
      // ASIGNAR CATEGORÍA
      // 1. Usar categoría extraída por el parser si existe
      let categoriaId = null;
      if (producto.categoriaExtraidaDelParser) {
        const categoriaNombre = producto.categoriaExtraidaDelParser;
        // Validar la categoría
        const validationCategoryResult = validateCategory({ nombre: categoriaNombre });
        const categoriaValidada = validationCategoryResult.category;
        
        // Buscar en mapa de categorías pre-creadas
        if (categoriasFinales[categoriaValidada.nombre]) {
          categoriaId = categoriasFinales[categoriaValidada.nombre];
        } else {
          // Intentar crear/obtener categoría
          categoriaId = await dbUtils.obtenerIdCategoria(categoriaValidada.nombre, fetchAdminFunc);
          if (categoriaId) {
            categoriasFinales[categoriaValidada.nombre] = categoriaId;
          }
        }
        
        if (categoriaId) {
          productoValidado.categoria = categoriaId;
          console.log(`Categoría ID ${categoriaId} asignada a producto ${productoValidado.codigo}`);
        } else {
          console.warn(`No se pudo resolver o crear categoría '${categoriaValidada.nombre}' para el producto ${productoValidado.codigo}.`);
          stats.erroresDetalle.push({ producto: productoValidado.codigo, campo: 'categoria', valor: categoriaValidada.nombre, error: `ID no resuelto después de intento de creación.` });
        }
      } else {
        console.log(`No se detectó categoría en el parser para el producto ${productoValidado.codigo}.`);
      }

      // ASIGNAR PROVEEDOR PRINCIPAL (si se resolvió)
      if (idProveedorPrincipal) {
        // Validar el proveedor
        const validationProviderResult = validateProvider({
          id: idProveedorPrincipal,
          nombre: nombreProveedorPrincipal
        });
        
        productoValidado.proveedor = idProveedorPrincipal;
        productoValidado.nombre_proveedor = validationProviderResult.provider.nombre;
        
        console.log(`Proveedor ID ${idProveedorPrincipal} (${validationProviderResult.provider.nombre}) asignado a producto ${productoValidado.codigo}`);
      } else {
        // Opcional: registrar si no hay proveedor principal aunque se esperase
        if(proveedorNombre) { // Si se esperaba un proveedor pero no se resolvió su ID
          stats.erroresDetalle.push({ producto: productoValidado.codigo, campo: 'proveedor', valor: proveedorNombre, error: `ID del proveedor principal no resuelto. El producto no se asociará.` });
        }
      }
      
      // Verificar si el producto existe antes de actualizar o crear
      const filtroProducto = encodeURIComponent(`codigo = "${productoValidado.codigo}"`);
      const urlBusquedaProducto = `/api/collections/productos/records?filter=${filtroProducto}`;
      const existentes = await fetchAdminFunc(urlBusquedaProducto);
      if (existentes.items && existentes.items.length > 0) {
        // Producto existe, actualizarlo
        const productoActualizado = { ...productoValidado, // Asegurar campos actualizados
          categoria: existentes.items[0].categoria || productoValidado.categoria || null, // Mantener relación categoría existente si aplicable
          proveedor: existentes.items[0].proveedor || productoValidado.proveedor || null,
          nombre_proveedor: existentes.items[0].nombre_proveedor || productoValidado.nombre_proveedor || null
        };
        
        console.log(`Actualizando producto existente: ${productoValidado.codigo} - ${productoValidado.nombre}`);
        await dbUtils.actualizarProducto(existentes.items[0].id, productoActualizado, fetchAdminFunc);
        stats.actualizados++;
      } else {
        // Producto no existe, crearlo
        console.log(`Creando nuevo producto: ${productoValidado.codigo} - ${productoValidado.nombre}`);
        await dbUtils.importarProducto(productoValidado, fetchAdminFunc);
        stats.creados++;
      }
      
      // Verificar si hay notas que indiquen devoluciones
      if (producto.NOTAS || producto.OBSERVACIONES || producto.COMENTARIOS) {
        const analisisNota = analizarNota(producto.NOTAS || producto.OBSERVACIONES || producto.COMENTARIOS);
        if (analisisNota) {
          await dbUtils.registrarDevolucion(productoValidado, analisisNota, proveedorNombre, importacionId);
          stats.devoluciones++;
        }
      }
    } catch (error) {
      console.error(`Error al procesar producto ${producto.codigo || 'sin código'}:`, error);
      stats.errores++;
      stats.erroresDetalle.push({ 
        producto: producto.codigo || 'sin código', 
        error: error.message, 
        stack: error.stack 
      });
    }
  }
  
  console.log(`[importarABaseDeDatos] Importación completada. Estadísticas: ${JSON.stringify(stats)}`);
  
  // Actualizar importación con estadísticas
  if (importacionId) {
    try {
      await dbUtils.actualizarImportacion(importacionId, 'completado', stats);
    } catch (error) {
      console.error(`Error al actualizar importación ${importacionId}:`, error);
    }
  }
  
  return stats;
}

export default {
  importarABaseDeDatos
};
