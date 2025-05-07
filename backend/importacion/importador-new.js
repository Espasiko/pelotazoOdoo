/**
 * Sistema de importación para El Pelotazo
 * Este módulo maneja la importación de datos desde diferentes formatos y proveedores
 * Versión refactorizada y optimizada
 */

import { pocketbaseConfig } from './config.js';
import { autenticarAdmin, fetchAdmin } from './utils.js';
import path from 'path';

// Importar módulos refactorizados
import { leerArchivo } from './file-readers.js';
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
import { 
  obtenerIdProveedor, 
  actualizarImportacion, 
  actualizarLog,
  registrarDevolucion
} from './db-utils.js';

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
    const fileType = path.extname(filePath).toLowerCase().replace('.', '');
    console.log(`Tipo de archivo detectado: ${fileType}`);
    
    // Leer archivo según su tipo
    const datos = await leerArchivo(filePath, fileType);
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
    
    // Detectar categorías únicas
    const categoriasUnicas = resultado.categorias || [];
    console.log(`Detectadas ${categoriasUnicas.length} categorías`);
    
    // Actualizar log si hay ID de importación
    if (importacionId) {
      await actualizarLog(importacionId, `Detectadas ${categoriasUnicas.length} categorías`);
    }
    
    // Importar a la base de datos usando la función fetchAdmin importada al principio del archivo
    const resultadoImportacion = await importarABaseDeDatos(
      resultado.productos, 
      proveedor, 
      importacionId, 
      fetchAdmin, // Usar la función fetchAdmin importada
      categoriasUnicas
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
      resultado = parseCecotec(datos, 'productos');
      break;
    case 'bsh':
      resultado = parseBSH(datos, 'productos');
      break;
    case 'jata':
      resultado = parseJata(datos, 'productos');
      break;
    case 'orbegozo':
      resultado = parseOrbegozo(datos, 'productos');
      break;
    case 'alfadyser':
      resultado = parseAlfadyser(datos, 'productos');
      break;
    case 'vitrokitchen':
      resultado = parseVitrokitchen(datos, 'productos');
      break;
    case 'electrodirecto':
      resultado = parseElectrodirecto(datos, 'productos');
      break;
    case 'almce':
    case 'almacenes':
      resultado = parseAlmacenes(datos, 'productos');
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
  
  return resultado;
}

/**
 * Importar datos procesados a la base de datos
 * @param {Array} datos - Datos procesados a importar
 * @param {string} proveedorNombre - Nombre del proveedor
 * @param {string} importacionId - Identificador único de la importación
 * @param {Function} fetchAdminFunc - Función para hacer peticiones autenticadas a PocketBase
 * @param {Array} categoriasDetectadas - Lista de categorías detectadas en el archivo
 * @returns {Promise<Object>} - Resultado de la importación
 */
async function importarABaseDeDatos(datos, proveedorNombre, importacionId, fetchAdminFunc /* Antiguamente pbClient, pero es fetchAdmin */, categoriasDetectadas = []) {
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
      idProveedorPrincipal = await obtenerOCrearIdRelacion(proveedorNombre, 'proveedores', fetchAdminFunc);
      if (!idProveedorPrincipal) {
        console.warn(`No se pudo resolver/crear ID para el proveedor ${proveedorNombre}`);
      } else {
        console.log(`ID del proveedor principal resuelto: ${idProveedorPrincipal}`);
      }
    }
    
    // 2. Pre-crear todas las categorías detectadas
    console.log(`Pre-creando ${categoriasDetectadas.length} categorías detectadas...`);
    const categoriasIds = {};
    for (const nombreCategoria of categoriasDetectadas) {
      if (nombreCategoria && nombreCategoria.trim()) {
        const categoriaId = await obtenerOCrearIdRelacion(nombreCategoria.trim(), 'categorias', fetchAdminFunc);
        if (categoriaId) {
          categoriasIds[nombreCategoria.trim()] = categoriaId;
          console.log(`Categoría "${nombreCategoria}" pre-creada/encontrada con ID: ${categoriaId}`);
        } else {
          console.warn(`No se pudo pre-crear/encontrar la categoría "${nombreCategoria}"`);
        }
      }
    }
    
    // 3. Procesar cada producto
    for (let i = 0; i < datos.length; i++) {
      const item = datos[i];
      
      try {
        // Validar que el item tenga datos válidos
        if (!item || typeof item !== 'object') {
          console.log(`Ítem ${i} no válido, saltando...`);
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
        console.log(`[importarABaseDeDatos] Procesando item ${i}:`, JSON.stringify(item));

        // Validar precio_venta antes de construir el producto
        // Ahora esperamos que item.precio_venta venga directamente del parser
        let precioVentaValido = normalizaPrecio(item.precio_venta, 0);
        // Permitir precio 0 si explícitamente es 0 o "0", pero no si es undefined, null, o texto no numérico
        if (precioVentaValido <= 0 && item.precio_venta !== 0 && String(item.precio_venta).trim() !== '0') {
          stats.errores++;
          // El log de error usará el valor de item.precio_venta tal como llegó
          stats.erroresDetalle.push({ 
            producto: item.codigo || `Item ${i}`, 
            error: `Precio de venta inválido o cero. Valor recibido del parser: '${item.precio_venta}'` 
          });
          continue; // Saltar este producto
        }

        // Crear el objeto base del producto
        const producto = {
          codigo: String(item.codigo || item.CODIGO || item.EAN || item.REFERENCIA || `SIN_CODIGO_${i}`),
          nombre: String(item.nombre || item.DESCRIPCION || item.CONCEPTO || item.TITULO || 'Sin Nombre'),
          descripcion: String(item.descripcion_larga || item.DESCRIPCION || ''), // Usar un campo más descriptivo si existe
          
          // Campos financieros - preservar valores originales sin recalcular
          precio_compra: normalizaPrecio(item.precio_compra || item.PRECIO_COMPRA || item.NETO || 0, 0),
          precio_venta: precioVentaValido,
          iva: normalizaPrecio(item.iva || item.iva_recargo || item.IVA || 21, 21),
          
          // Campos de inventario
          stock: parseInt(item.stock || item.STOCK || item.UNIDADES || item['UNID.'] || '0', 10) || 0,
          
          // Campos adicionales específicos
          margen: normalizaPrecio(item.margen || 0),
          descuento: normalizaPrecio(item.descuento || item.descuento1 || 0),
          descuento_adicional: normalizaPrecio(item.descuento2 || 0),
          beneficio_unitario: normalizaPrecio(item.beneficio_unitario || 0),
          beneficio_total: normalizaPrecio(item.beneficio_total || 0),
          vendidas: parseInt(item.vendidas || 0, 10),
          pvp_web: normalizaPrecio(item.pvp_web || 0),
          
          // Estado del producto
          activo: true,
          visible: true, // Asegurarnos de que el producto sea visible
          
          // Datos completos para referencia
          datos_origen: JSON.stringify(item) // Guardar datos originales para referencia
        };
        
        // Log del producto base que se va a procesar
        // console.log(`Producto base (${i}):`, JSON.stringify(producto, null, 2));
        if (!producto.codigo || producto.codigo.startsWith('SIN_CODIGO_')) {
          console.log(`Producto ${i} sin código válido, saltando...`);
          continue;
        }
        
        console.log(`Procesando producto ${i}: ${producto.codigo} - ${producto.nombre}`);
        
        // ASIGNACIÓN DE CATEGORÍA
        if (item.categoriaExtraidaDelParser) {
          const categoriaId = categoriasIds[item.categoriaExtraidaDelParser.trim()];
          if (categoriaId) {
            producto.categoria = categoriaId; // Asignar el ID para la relación
            console.log(`Categoría ID ${categoriaId} asignada a producto ${producto.codigo}`);
          } else {
            stats.erroresDetalle.push({ producto: producto.codigo, campo: 'categoria', valor: item.categoriaExtraidaDelParser, error: `No se pudo resolver/crear ID para categoría.` });
            console.warn(`No se pudo resolver o crear la categoría '${item.categoriaExtraidaDelParser}' para el producto ${producto.codigo}.`);
            // No se incrementa stats.errores aquí, se hará si la creación/actualización del producto falla debido a esto (si categoria es obligatoria)
          }
        } else {
          console.log(`No se detectó categoría en el parser para el producto ${producto.codigo}.`);
          // Opcional: registrar si no hay categoría y se esperaba
          // stats.erroresDetalle.push({ producto: producto.codigo, campo: 'categoria', error: 'Categoría no detectada por el parser.' });
        }

        // ASIGNAR PROVEEDOR PRINCIPAL (si se resolvió)
        if (idProveedorPrincipal) {
          producto.proveedor = idProveedorPrincipal;
        } else {
            // Opcional: registrar si no hay proveedor principal aunque se esperase
            if(proveedorNombre) { // Si se esperaba un proveedor pero no se resolvió su ID
                 stats.erroresDetalle.push({ producto: producto.codigo, campo: 'proveedor', valor: proveedorNombre, error: `ID del proveedor principal no resuelto. El producto no se asociará.` });
            }
        }
        
        // Verificar si el producto ya existe por su código
        try {
          let existentes = [];
          
          try {
            // Intentar buscar por código exacto
            const existentesRes = await fetchAdminFunc(`/api/collections/productos/records?filter=(codigo='${encodeURIComponent(producto.codigo)}')`);
            existentes = existentesRes;
          } catch (error) {
            console.error(`Error al buscar producto existente por código exacto: ${error.message}`);
            // Intentar con una búsqueda menos estricta
            try {
              const existentesRes = await fetchAdminFunc(`/api/collections/productos/records?filter=(codigo~'${encodeURIComponent(producto.codigo)}')`);
              existentes = existentesRes;
            } catch (error2) {
              console.error(`Error al buscar producto existente por código similar: ${error2.message}`);
            }
          }
          
          if (existentes && existentes.items && existentes.items.length > 0) {
            // El producto ya existe, actualizarlo
            console.log(`Producto existente encontrado con ID: ${existentes.items[0].id}`);
            
            try {
              // Obtener el producto existente para preservar los campos obligatorios
              const productoExistenteRes = await fetchAdminFunc(`/api/collections/productos/records/${existentes.items[0].id}`);
              const productoExistente = productoExistenteRes;
              
              console.log(`Datos del producto existente:`, JSON.stringify(productoExistente).substring(0, 200) + '...');
              
              // Asegurarnos de que los campos obligatorios estén presentes
              const productoActualizado = {
                nombre: producto.nombre || productoExistente.nombre,
                codigo: producto.codigo || productoExistente.codigo,
                descripcion: producto.descripcion || productoExistente.descripcion || '',
                precio_venta: typeof producto.precio_venta === 'number' && !isNaN(producto.precio_venta) ? producto.precio_venta : productoExistente.precio_venta || 0,
                precio_compra: typeof producto.precio_compra === 'number' && !isNaN(producto.precio_compra) ? producto.precio_compra : productoExistente.precio_compra || 0,
                iva: parseFloat(producto.iva) || parseFloat(productoExistente.iva) || 21,
                stock: parseInt(producto.stock) || parseInt(productoExistente.stock) || 0,
                
                // Campos adicionales específicos - preservar valores originales
                margen: typeof producto.margen === 'number' ? producto.margen : productoExistente.margen || 0,
                descuento: typeof producto.descuento === 'number' ? producto.descuento : productoExistente.descuento || 0,
                descuento_adicional: typeof producto.descuento_adicional === 'number' ? producto.descuento_adicional : productoExistente.descuento_adicional || 0,
                beneficio_unitario: typeof producto.beneficio_unitario === 'number' ? producto.beneficio_unitario : productoExistente.beneficio_unitario || 0,
                beneficio_total: typeof producto.beneficio_total === 'number' ? producto.beneficio_total : productoExistente.beneficio_total || 0,
                vendidas: parseInt(producto.vendidas) || parseInt(productoExistente.vendidas) || 0,
                pvp_web: typeof producto.pvp_web === 'number' ? producto.pvp_web : productoExistente.pvp_web || 0,
                
                // Estado del producto
                activo: producto.activo !== undefined ? producto.activo : productoExistente.activo !== undefined ? productoExistente.activo : true,
                visible: producto.visible !== undefined ? producto.visible : productoExistente.visible !== undefined ? productoExistente.visible : true,
                
                // Asegurarnos de que las relaciones se envían correctamente
                proveedor: producto.proveedor || productoExistente.proveedor || null,
                categoria: producto.categoria || productoExistente.categoria || null,
                
                // Datos de origen actualizados
                datos_origen: JSON.stringify({
                  ...JSON.parse(productoExistente.datos_origen || '{}'),
                  ...JSON.parse(producto.datos_origen || '{}')
                })
              };
              
              logProductoEnvio('ACTUALIZAR', productoActualizado);
              
              const productoActualizadoRes = await fetchAdminFunc(`/api/collections/productos/records/${existentes.items[0].id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(productoActualizado),
              });
              
              console.log(`Producto actualizado con ID: ${productoActualizadoRes.id}`);
              stats.actualizados++;
            } catch (updateError) {
              console.error(`Error al actualizar producto: ${updateError.message}`);
              stats.errores++;
              stats.erroresDetalle.push({
                codigo: producto.codigo,
                error: updateError.message
              });
              
              // Intentar actualizar con campos mínimos
              try {
                console.log(`Intentando actualizar con campos mínimos...`);
                const productoActualizadoMinimo = {
                  nombre: producto.nombre,
                  codigo: producto.codigo,
                  precio_venta: typeof producto.precio_venta === 'number' && !isNaN(producto.precio_venta) ? producto.precio_venta : 0,
                  iva: parseFloat(producto.iva) || 21
                };
                logProductoEnvio('ACTUALIZAR', productoActualizadoMinimo);
                
                const productoActualizadoMinimoRes = await fetchAdminFunc(`/api/collections/productos/records/${existentes.items[0].id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(productoActualizadoMinimo),
                });
                
                console.log(`Producto actualizado con campos mínimos, ID: ${productoActualizadoMinimoRes.id}`);
                stats.actualizados++;
                // Corregir el contador de errores
                stats.errores--;
                stats.erroresDetalle.pop();
              } catch (minUpdateError) {
                console.error(`Error al actualizar producto con campos mínimos: ${minUpdateError.message}`);
              }
            }
          } else {
            // Crear nuevo producto
            console.log(`Creando nuevo producto: ${producto.codigo} - ${producto.nombre}`);
            
            try {
              const nuevoProducto = {
                nombre: producto.nombre,
                codigo: producto.codigo,
                descripcion: producto.descripcion || '',
                precio_venta: typeof producto.precio_venta === 'number' && !isNaN(producto.precio_venta) ? producto.precio_venta : 0,
                precio_compra: typeof producto.precio_compra === 'number' && !isNaN(producto.precio_compra) ? producto.precio_compra : 0,
                iva: parseFloat(producto.iva) || 21,
                stock: parseInt(producto.stock) || 0,
                activo: producto.activo !== undefined ? producto.activo : true,
                visible: producto.visible !== undefined ? producto.visible : true,
                // Asegurarnos de que las relaciones se envían correctamente
                proveedor: producto.proveedor || null,
                categoria: producto.categoria || null,
                datos_origen: producto.datos_origen
              };
              logProductoEnvio('CREAR', nuevoProducto);
              
              const nuevoProductoRes = await fetchAdminFunc(`/api/collections/productos/records`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(nuevoProducto),
              });
              
              console.log(`Nuevo producto creado con ID: ${nuevoProductoRes.id}`);
              stats.creados++;
            } catch (createError) {
              console.error(`Error al crear producto: ${createError.message}`);
              stats.errores++;
              stats.erroresDetalle.push({
                codigo: producto.codigo,
                error: createError.message
              });
              
              // Intentar crear con campos mínimos
              try {
                console.log(`Intentando crear producto con campos mínimos...`);
                const productoMinimo = {
                  nombre: producto.nombre,
                  codigo: producto.codigo,
                  precio_venta: typeof producto.precio_venta === 'number' && !isNaN(producto.precio_venta) ? producto.precio_venta : 0,
                  iva: parseFloat(producto.iva) || 21,
                  stock: parseInt(producto.stock) || 0,
                  activo: true,
                  visible: true,
                  // Asegurarnos de que las relaciones se envían correctamente
                  proveedor: producto.proveedor || null
                };
                logProductoEnvio('CREAR', productoMinimo);
                
                const nuevoProductoMinimoRes = await fetchAdminFunc(`/api/collections/productos/records`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(productoMinimo),
                });
                
                console.log(`Nuevo producto creado con campos mínimos, ID: ${nuevoProductoMinimoRes.id}`);
                stats.creados++;
                // Corregir el contador de errores
                stats.errores--;
                stats.erroresDetalle.pop();
              } catch (minCreateError) {
                console.error(`Error al crear producto con campos mínimos: ${minCreateError.message}`);
                console.error(`Datos del producto mínimo:`, JSON.stringify(productoMinimo));
              }
            }
          }
          
          // Verificar si hay notas que indiquen devoluciones
          if (item.NOTAS || item.OBSERVACIONES || item.COMENTARIOS) {
            const analisisNota = analizarNota(item.NOTAS || item.OBSERVACIONES || item.COMENTARIOS);
            if (analisisNota) {
              await registrarDevolucion(producto, analisisNota, proveedorNombre, importacionId);
              stats.devoluciones++;
            }
          }
        } catch (error) {
          console.error(`Error al procesar producto ${producto.codigo}:`, error);
          stats.errores++;
        }
      } catch (itemError) {
        console.error(`Error al procesar ítem ${i}:`, itemError);
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

// Nueva función auxiliar corregida para usar fetchAdminFunc
async function obtenerOCrearIdRelacion(nombreEntidad, nombreColeccion, fetchAdminFunc) {
  if (!fetchAdminFunc) {
    console.error(`Error Crítico: fetchAdminFunc no proporcionado a obtenerOCrearIdRelacion para ${nombreColeccion} con entidad ${nombreEntidad}`);
    return null;
  }
  if (!nombreEntidad || typeof nombreEntidad !== 'string' || nombreEntidad.trim() === '') {
    console.log(`Nombre de entidad para ${nombreColeccion} no válido o vacío: '${nombreEntidad}'`);
    return null;
  }
  const nombreNormalizado = nombreEntidad.trim();

  try {
    console.log(`Buscando en ${nombreColeccion} por nombre: '${nombreNormalizado}' usando fetchAdminFunc`);
    // Construir el filtro para la URL. Asegúrate que el campo se llame 'nombre'.
    const filtro = encodeURIComponent(`nombre = "${nombreNormalizado.replace(/"/g, '\"')}"`);
    const urlBusqueda = `/api/collections/${nombreColeccion}/records?filter=${filtro}`;
    
    const records = await fetchAdminFunc(urlBusqueda);

    if (records && records.items && records.items.length > 0) {
      console.log(`Entidad encontrada en ${nombreColeccion} con ID: ${records.items[0].id}`);
      return records.items[0].id; // Devolver ID existente
    } else {
      console.log(`Creando nueva entidad en ${nombreColeccion}: '${nombreNormalizado}' usando fetchAdminFunc`);
      const urlCreacion = `/api/collections/${nombreColeccion}/records`;
      const newRecord = await fetchAdminFunc(urlCreacion, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreNormalizado }),
      });
      
      if (newRecord && newRecord.id) {
        console.log(`Nueva entidad creada en ${nombreColeccion} con ID: ${newRecord.id}`);
        return newRecord.id; // Devolver ID del nuevo registro
      } else {
        console.error(`No se pudo crear la entidad '${nombreNormalizado}' en ${nombreColeccion}. Respuesta:`, newRecord);
        return null;
      }
    }
  } catch (error) {
    console.error(`Error en obtenerOCrearIdRelacion para '${nombreNormalizado}' en '${nombreColeccion}':`, error);
    // Considerar si el error es un objeto de error de fetch o la respuesta de PocketBase
    if (error.data && error.data.data) {
        Object.keys(error.data.data).forEach(key => {
            if(error.data.data[key] && error.data.data[key].message) {
                console.error(`Detalle del error de PocketBase (campo ${key}): ${error.data.data[key].message}`);
            }
        });
    } else if (error.message) {
        console.error("Error general en obtenerOCrearIdRelacion:", error.message);
    }
    return null;
  }
}

// Exportar funciones principales
export default {
  importarDatos
};
