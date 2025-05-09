/**
 * Sistema de importación para El Pelotazo
 * Este módulo maneja la importación de datos desde diferentes formatos y proveedores
 * Versión refactorizada y optimizada
 */

import { pocketbaseConfig } from './config.js';
import { autenticarAdmin, fetchAdmin } from './utils.js';
import path from 'path';

// Importar módulos refactorizados
import { leerArchivoCSV, leerArchivoExcel, leerArchivoJSONNormalizado } from './file-readers.js';
import { 
  parserGenericoUniversal, 
  parseCecotec, 
  parseBSH, 
  parseJata, 
  parseOrbegozo, 
  parseAlfadyser, 
  parseVitrokitchen, 
  parseElectrodirecto, 
  parseAlmacenes,
  parseEasJohnson // Agregar el parser para EAS-JOHNSON
} from './parsers.js';
import { detectarCategorias, asignarCategoria, analizarNota } from './categorias.js';
import { obtenerIdProveedor, obtenerIdCategoria, importarProducto, actualizarProducto, actualizarLog, registrarDevolucion } from './db-utils.js';

// URL base de PocketBase
const baseUrl = pocketbaseConfig.url;

// --- LOG DETALLADO ANTES DE CADA ENVÍO DE PRODUCTO ---
function logProductoEnvio(accion, body) {
  console.log(`\n[${accion}] Enviando producto a PocketBase:`);
  try {
    console.log(JSON.stringify(body, null, 2));
  } catch(e) {
    console.log(body);
  }
}

/**
 * Importar datos desde un archivo a la base de datos
 * @param {string} filePath - Ruta del archivo a importar
 * @param {string} proveedor - Nombre del proveedor
 * @param {string} tipo - Tipo de importación (productos, precios, stock)
 * @param {string} importacionId - ID de la importación
 * @returns {Promise<Object>} - Resultado de la importación
 */
export async function importarDatos(filePath, proveedor, tipo = 'productos', importacionId = null) {
  console.log(`Iniciando importación desde ${filePath} para proveedor ${proveedor}`);
  
  try {
    // Determinar el tipo de archivo basado en la extensión
    const fileType = path.extname(filePath).slice(1).toLowerCase();
    console.log(`Tipo de archivo detectado: ${fileType}`);
    
    // Leer archivo según su tipo
    let datos;
    if (fileType === 'csv') {
      datos = await leerArchivoCSV(filePath);
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      datos = await leerArchivoExcel(filePath);
    } else if (fileType === 'json') {
      datos = await leerArchivoJSONNormalizado(filePath);
    } else {
      console.error(`Tipo de archivo no soportado: ${fileType}`);
      return {
        exito: false,
        error: `Tipo de archivo no soportado: ${fileType}`
      };
    }
    console.log(`Leídos ${datos.length} registros del archivo`);
    
    // Actualizar log si hay ID de importación
    if (importacionId) {
      await actualizarLog(importacionId, `Leídos ${datos.length} registros del archivo`);
    }
    
    // Procesar datos según el proveedor
    const resultado = await procesarArchivo(datos, proveedor);
    console.log(`Procesados ${resultado.productos.length} registros`);
    
    // Actualizar log si hay ID de importación
    if (importacionId) {
      await actualizarLog(importacionId, `Procesados ${resultado.productos.length} registros`);
    }
    
    // Detectar categorías explícitamente después de procesar los datos
    const categoriasDetectadas = await detectarCategorias(resultado.productos || []);
    const categoriasUnicasMap = {};
    for (const cat of categoriasDetectadas) {
      const catId = await obtenerIdCategoria(cat.nombre, fetchAdmin); // Usar obtenerIdCategoria para obtener o crear ID
      if (catId) {
        categoriasUnicasMap[cat.nombre] = catId;
      }
    }
    console.log(`Detectadas y mapeadas ${Object.keys(categoriasUnicasMap).length} categorías`);
    
    // Actualizar log si hay ID de importación
    if (importacionId) {
      await actualizarLog(importacionId, `Detectadas y mapeadas ${Object.keys(categoriasUnicasMap).length} categorías`);
    }
    
    // Importar a la base de datos
    const resultadoImportacion = await importarABaseDeDatos(
      resultado.productos, 
      proveedor, 
      importacionId, 
      fetchAdmin, 
      categoriasUnicasMap
    );
    
    console.log(`Importación completada: ${resultadoImportacion.stats.creados} creados, ${resultadoImportacion.stats.actualizados} actualizados, ${resultadoImportacion.stats.errores} errores`);
    
    // Actualizar log si hay ID de importación
    if (importacionId) {
      await actualizarLog(importacionId, `Importación completada: ${resultadoImportacion.stats.creados} creados, ${resultadoImportacion.stats.actualizados} actualizados, ${resultadoImportacion.stats.errores} errores`);
    }
    
    return resultadoImportacion;
  } catch (error) {
    console.error('Error en importación:', error);
    
    // Actualizar log si hay ID de importación
    if (importacionId) {
      await actualizarLog(importacionId, `Error en importación: ${error.message}`);
    }
    
    return {
      exito: false,
      error: error.message || 'Error desconocido en la importación'
    };
  }
}

/**
 * Procesar archivo según el proveedor
 * @param {Array} datos - Datos a procesar
 * @param {string} proveedor - Nombre del proveedor
 * @returns {Object} - Datos procesados
 */
async function procesarArchivo(datos, proveedor) {
  // Normalizar nombre del proveedor
  const proveedorNormalizado = (proveedor || '').toLowerCase().trim();
  
  // Seleccionar parser según el proveedor
  let resultado;
  
  switch (proveedorNormalizado) {
    case 'cecotec':
      resultado = parseCecotec(datos, 'productos'); // Asegurar que parsers no devuelvan categorías
      break;
    case 'bsh':
      resultado = parseBSH(datos, 'productos');
      break;
    case 'jata':
      resultado = parseJata(datos, 'productos');
      break;
    case 'almce':
      resultado = parseAlmacenes(datos, 'productos'); // Ajustar parser ALMCE si necesario
      break;
    case 'eas':
    case 'johnson':
    case 'eas-johnson':
    case 'eas johnson':
    case 'eas electric':
    case 'johnson electric':
      console.log('Usando parser específico para EAS-JOHNSON');
      resultado = parseEasJohnson(datos, 'productos');
      break;
    default:
      // Parser genérico para cualquier otro proveedor
      console.log(`No se encontró parser específico para el proveedor "${proveedor}", usando parser genérico universal`);
      resultado = parserGenericoUniversal(datos, 'productos');
  }
  
  // Remover cualquier lógica de categorías de los parsers, si existe
  delete resultado.categorias; // Asegurar que parsers no incluyan categorías
  
  return resultado;
}

/**
 * Importar datos procesados a la base de datos
 * @param {Array} datos - Datos procesados a importar
 * @param {string} proveedorNombre - Nombre del proveedor
 * @param {string} importacionId - Identificador único de la importación
 * @param {Function} fetchAdminFunc - Función para hacer peticiones autenticadas a PocketBase
 * @param {Object} categoriasMap - Mapa de categorías detectadas y sus IDs
 * @returns {Promise<Object>} - Resultado de la importación
 */
async function importarABaseDeDatos(datos, proveedorNombre, importacionId, fetchAdminFunc, categoriasMap) {
  console.log(`Importando ${datos.length} productos a la base de datos para proveedor ${proveedorNombre || 'desconocido'}`);
  
  if (!fetchAdminFunc) { // Verificación del parámetro renombrado
    console.error('Error Crítico: fetchAdminFunc no proporcionado a importarABaseDeDatos.');
    return {
      exito: false,
      error: 'Función fetchAdmin no configurada para la importación.',
      stats: { total: datos.length, creados: 0, actualizados: 0, errores: datos.length, erroresDetalle: [{ producto: 'General', error: 'fetchAdmin no configurado' }], devoluciones: 0 }
    };
  }

  // Variables para estadísticas
  const stats = {
    total: datos.length,
    creados: 0,
    actualizados: 0,
    errores: 0,
    erroresDetalle: [],
    devoluciones: 0
  };
  
  try {
    // 1. Obtener/Crear ID del PROVEEDOR PRINCIPAL
    let idProveedorPrincipal = null;
    if (proveedorNombre) {
      console.log(`Resolviendo ID para el proveedor principal: ${proveedorNombre}`);
      idProveedorPrincipal = await obtenerIdProveedor(proveedorNombre, fetchAdminFunc);
      if (!idProveedorPrincipal) {
        console.warn(`No se pudo resolver/crear ID para el proveedor ${proveedorNombre}`);
      } else {
        console.log(`ID del proveedor principal resuelto: ${idProveedorPrincipal}`);
      }
    }
    
    // Pre-crear o obtener IDs de categorías usando obtenerIdCategoria
    const categoriasFinales = {};
    for (const catNombre of Object.keys(categoriasMap)) {
      const catId = await obtenerIdCategoria(catNombre, fetchAdminFunc);
      if (catId) {
        categoriasFinales[catNombre] = catId;
      }
    }
    console.log(`Categorías finales mapeadas: ${JSON.stringify(categoriasFinales)}`);
    
    // 2. Procesar cada producto
    for (const producto of datos) {
      try {
        // Validar que el item tenga datos válidos
        if (!producto || typeof producto !== 'object') {
          console.log(`Ítem no válido, saltando...`);
          continue;
        }
        
        // Utilidad para normalizar precios y asegurar que nunca falte precio_venta
        function normalizaPrecio(valor, fallback = 0) {
          if (valor === undefined || valor === null) return fallback;
          if (typeof valor === 'number') return valor;
          if (typeof valor === 'string') {
            const limpio = valor.replace(/[^\d.,]/g, '').replace(',', '.');
            const num = parseFloat(limpio);
            if (!isNaN(num)) return num;
          }
          return fallback;
        }

        // Añadir log para ver el item completo que viene del parser
        console.log(`[importarABaseDeDatos] Procesando item:`, JSON.stringify(producto));

        // Validar precio_venta antes de construir el producto
        // Ahora esperamos que item.precio_venta venga directamente del parser
        let precioVentaValido = normalizaPrecio(producto.precio_venta, 0);
        // Permitir precio 0 si explícitamente es 0 o "0", pero no si es undefined, null, o texto no numérico
        if (precioVentaValido <= 0 && producto.precio_venta !== 0 && String(producto.precio_venta).trim() !== '0') {
          stats.errores++;
          // El log de error usará el valor de item.precio_venta tal como llegó
          stats.erroresDetalle.push({ 
            producto: producto.codigo || `Item`, 
            error: `Precio de venta inválido o cero. Valor recibido del parser: '${producto.precio_venta}'` 
          });
          continue; // Saltar este producto
        }

        // Crear el objeto base del producto
        const productoBase = {
          codigo: String(producto.codigo || producto.CODIGO || producto.EAN || producto.REFERENCIA || `SIN_CODIGO`),
          nombre: String(producto.nombre || producto.DESCRIPCION || producto.CONCEPTO || producto.TITULO || 'Sin Nombre'),
          descripcion: String(producto.descripcion_larga || producto.DESCRIPCION || ''), // Usar un campo más descriptivo si existe
          
          // Campos financieros - preservar valores originales sin recalcular
          precio_compra: normalizaPrecio(producto.precio_compra || producto.PRECIO_COMPRA || producto.NETO || 0, 0),
          precio_venta: precioVentaValido,
          iva: normalizaPrecio(producto.iva || producto.iva_recargo || producto.IVA || 21, 21),
          
          // Campos de inventario (ajustados a PocketBase)
          stock_actual: parseInt(producto.stock_actual || producto.stock || producto.STOCK || producto.UNIDADES || producto['UNID.'] || producto['QUEDAN EN TIENDA'] || 0, 10),
          unidades_vendidas: parseInt(producto.unidades_vendidas || producto.vendidas || producto['VENDIDAS'] || 0, 10),
          
          // Campos adicionales específicos
          margen: normalizaPrecio(producto.margen || 0),
          descuento: normalizaPrecio(producto.descuento || producto.descuento1 || 0),
          descuento_adicional: normalizaPrecio(producto.descuento2 || 0),
          beneficio_unitario: normalizaPrecio(producto.beneficio_unitario || 0),
          beneficio_total: normalizaPrecio(producto.beneficio_total || 0),
          vendidas: parseInt(producto.vendidas || 0, 10),
          pvp_web: normalizaPrecio(producto.pvp_web || 0),
          
          // Estado del producto
          activo: true,
          visible: true, // Asegurarnos de que el producto sea visible
          
          // Datos completos para referencia
          datos_origen: JSON.stringify(producto) // Guardar datos originales para referencia
        };
        
        // Log detallado del producto base que se va a procesar
        console.log(`[DEBUG] Producto base mapeado para PB:`, JSON.stringify(productoBase, null, 2));
        if (!productoBase.codigo || productoBase.codigo.startsWith('SIN_CODIGO_')) {
          console.log(`Producto sin código válido, saltando...`);
          continue;
        }
        
        console.log(`Procesando producto: ${productoBase.codigo} - ${productoBase.nombre}`);
        
        // ASIGNACIÓN DE CATEGORÍA
        if (producto.categoriaExtraidaDelParser) {
          const categoriaNombre = producto.categoriaExtraidaDelParser.trim();
          const categoriaId = await obtenerIdCategoria(categoriaNombre, fetchAdminFunc);
          if (categoriaId) {
            productoBase.categoria = categoriaId;
            console.log(`Categoría ID ${categoriaId} asignada a producto ${productoBase.codigo}`);
          } else {
            console.warn(`No se pudo resolver o crear categoría '${categoriaNombre}' para el producto ${productoBase.codigo}.`);
            stats.erroresDetalle.push({ producto: productoBase.codigo, campo: 'categoria', valor: categoriaNombre, error: `ID no resuelto después de intento de creación.` });
          }
        } else {
          console.log(`No se detectó categoría en el parser para el producto ${productoBase.codigo}.`);
        }

        // ASIGNAR PROVEEDOR PRINCIPAL (si se resolvió)
        if (idProveedorPrincipal) {
          productoBase.proveedor = idProveedorPrincipal;
        } else {
            // Opcional: registrar si no hay proveedor principal aunque se esperase
            if(proveedorNombre) { // Si se esperaba un proveedor pero no se resolvió su ID
                 stats.erroresDetalle.push({ producto: productoBase.codigo, campo: 'proveedor', valor: proveedorNombre, error: `ID del proveedor principal no resuelto. El producto no se asociará.` });
            }
        }
        
        // Verificar si el producto existe antes de actualizar o crear
        const filtroProducto = encodeURIComponent(`codigo = "${productoBase.codigo}"`);
        const urlBusquedaProducto = `/api/collections/productos/records?filter=${filtroProducto}`;
        const existentes = await fetchAdminFunc(urlBusquedaProducto);
        if (existentes.items && existentes.items.length > 0) {
          // Producto existe, actualizarlo
          const productoActualizado = { ...productoBase, // Asegurar campos actualizados
            categoria: existentes.items[0].categoria || null, // Mantener relación categoría existente si aplicable
            proveedor: existentes.items[0].proveedor || null
          };
          await actualizarProducto(existentes.items[0].id, productoActualizado, fetchAdminFunc);
          stats.actualizados++;
        } else {
          // Producto no existe, crearlo
          await importarProducto(productoBase, fetchAdminFunc);
          stats.creados++;
        }
        
        // Verificar si hay notas que indiquen devoluciones
        if (producto.NOTAS || producto.OBSERVACIONES || producto.COMENTARIOS) {
          const analisisNota = analizarNota(producto.NOTAS || producto.OBSERVACIONES || producto.COMENTARIOS);
          if (analisisNota) {
            await registrarDevolucion(productoBase, analisisNota, proveedorNombre, importacionId);
            stats.devoluciones++;
          }
        }
      } catch (error) {
        console.error(`Error al procesar producto ${producto.codigo}:`, error);
        stats.errores++;
      }
    }
    
    stats.exito = stats.errores === 0;
    return {
      exito: stats.exito,
      stats
    };
  } catch (error) {
    console.error(`Error general en la importación: ${error.message}`);
    return {
      exito: false,
      error: error.message,
      stats
    };
  }
  
  console.log(`Importación finalizada. Estadísticas: ${JSON.stringify(stats)}`);
  return {
    exito: true,
    stats
  };
}

// Exportar funciones principales
export default {
  importarDatos
};
