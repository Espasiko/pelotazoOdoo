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
import { proveedorParsers } from './parsers.js';
import { detectarCategorias, asignarCategoria, analizarNota } from './categorias.js';
import { 
  obtenerIdProveedor, 
  actualizarImportacion, 
  actualizarLog,
  registrarDevolucion
} from './db-utils.js';

// URL base de PocketBase
const baseUrl = pocketbaseConfig.url;

/**
 * Función principal para importar datos
 * @param {string} filePath - Ruta al archivo a importar
 * @param {string} proveedor - Nombre del proveedor
 * @param {string} tipo - Tipo de importación (productos, precios, stock)
 * @param {string} importacionId - ID de la importación (opcional)
 * @returns {Promise<Object>} - Resultado de la importación
 */
export async function importarDatos(filePath, proveedor, tipo, importacionId = null) {
  try {
    console.log(`Iniciando importación de ${tipo} desde ${proveedor}...`);
    console.log(`ID de importación: ${importacionId || 'No especificado'}`);
    
    // Autenticarse como admin
    try {
      await autenticarAdmin();
    } catch (error) {
      console.error('Error al autenticar:', error);
      if (importacionId) {
        await actualizarImportacion(importacionId, 'error', { error: 'Error de autenticación' });
        await actualizarLog(importacionId, `Error de autenticación: ${error.message}`);
      }
      return { exito: false, error: 'Error de autenticación' };
    }

    // Si no se proporcionó un ID de importación, crear uno nuevo
    let importacion = null;
    if (!importacionId) {
      importacion = await fetchAdmin(`/api/collections/importaciones/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fecha: new Date().toISOString(),
          tipo: tipo,
          estado: 'procesando',
          archivo: path.basename(filePath),
          log: `Iniciando importación: ${new Date().toISOString()}\n`,
        }),
      });
      importacionId = importacion.id;
    } else {
      importacion = await fetchAdmin(`/api/collections/importaciones/records/${importacionId}`);
    }

    // Leer el archivo según su extensión
    let datos = [];
    try {
      datos = await leerArchivo(filePath);
      console.log(`Leídos ${datos.length} registros del archivo`);
      await actualizarLog(importacionId, `Leídos ${datos.length} registros del archivo`);
    } catch (error) {
      console.error('Error al leer archivo:', error);
      await actualizarLog(importacionId, `Error al leer archivo: ${error.message}`);
      await actualizarImportacion(importacionId, 'error', { error: `Error al leer archivo: ${error.message}` });
      return { exito: false, error: `Error al leer archivo: ${error.message}` };
    }
    
    // Obtener el ID del proveedor
    const proveedorId = await obtenerIdProveedor(proveedor);
    console.log(`ID del proveedor: ${proveedorId}`);
    await actualizarLog(importacionId, `Proveedor: ${proveedor} (ID: ${proveedorId})`);
    
    // Usar el parser específico para el proveedor o el genérico si no existe
    const parser = proveedorParsers[proveedor.toUpperCase()] || proveedorParsers['GENERICO'];
    const datosProcesados = parser(datos, tipo);
    console.log(`Procesados ${datosProcesados.length} registros`);
    await actualizarLog(importacionId, `Procesados ${datosProcesados.length} registros`);
    
    // Detectar categorías en los datos
    const categorias = await detectarCategorias(datosProcesados);
    console.log(`Detectadas ${categorias.length} categorías`);
    await actualizarLog(importacionId, `Detectadas ${categorias.length} categorías`);
    
    // Importar a la base de datos
    const resultado = await importarABaseDeDatos(datosProcesados, tipo, importacionId, proveedorId, categorias);
    console.log(`Importación completada: ${resultado.creados} creados, ${resultado.actualizados} actualizados, ${resultado.errores} errores`);
    await actualizarLog(importacionId, `Importación completada: ${resultado.creados} creados, ${resultado.actualizados} actualizados, ${resultado.errores} errores`);
    
    // Actualizar el estado de la importación
    await actualizarImportacion(importacionId, resultado.exito ? 'completado' : 'error', resultado);
    
    return resultado;
  } catch (error) {
    console.error('Error en importación:', error);
    
    if (importacionId) {
      await actualizarImportacion(importacionId, 'error', { error: error.message });
      await actualizarLog(importacionId, `Error: ${error.message}`);
    }
    
    return { exito: false, error: error.message };
  }
}

/**
 * Función para importar datos procesados a la base de datos
 * @param {Array} datos - Datos procesados
 * @param {string} tipo - Tipo de importación
 * @param {string} importacionId - ID de la importación
 * @param {string} proveedorId - ID del proveedor
 * @param {Array} categorias - Categorías disponibles
 * @returns {Promise<Object>} - Resultado de la importación
 */
async function importarABaseDeDatos(datos, tipo, importacionId, proveedorId, categorias = []) {
  const resultado = {
    exito: true,
    creados: 0,
    actualizados: 0,
    errores: 0,
    devoluciones: 0
  };
  
  try {
    console.log('Verificando estructura de la colección productos...');
    try {
      // Intentar obtener un producto para ver su estructura
      const productosTest = await fetchAdmin(`/api/collections/productos/records`, {
        method: 'GET',
        params: {
          limit: 1
        }
      });
      
      if (productosTest.items && productosTest.items.length > 0) {
        console.log('Estructura de productos:', Object.keys(productosTest.items[0]));
      } else {
        console.log('No hay productos en la base de datos para verificar estructura');
      }
    } catch (error) {
      console.error('Error al verificar estructura:', error);
    }
    
    // Procesar según el tipo de importación
    if (tipo === 'productos') {
      console.log('Importando productos...');
      await actualizarLog(importacionId, 'Importando productos...');
      
      // Procesar cada producto
      for (let i = 0; i < datos.length; i++) {
        const item = datos[i];
        
        try {
          // Verificar si el item tiene datos válidos
          if (!item || typeof item !== 'object') {
            console.log(`Ítem ${i} no válido, saltando...`);
            continue;
          }
          
          // Crear objeto de producto
          const producto = {
            nombre: item.nombre || item.NOMBRE || item.DESCRIPCION || `Producto ${item.codigo || item.CODIGO || i}`,
            codigo: item.codigo || item.CODIGO || item.REFERENCIA || item.REF || item.SKU || item.ID || `REF-${i}`,
            descripcion: item.descripcion || item.DESCRIPCION || '',
            precio: parseFloat((item.precio || item.PRECIO || item['P.V.P'] || item['P.V.P FINAL CLIENTE'] || '0').toString().replace(',', '.')) || 0,
            stock: parseInt(item.stock || item.STOCK || item.UNIDADES || item['UNID.'] || '0', 10) || 0,
            activo: true,
            fecha_alta: new Date().toISOString()
          };
          
          // Validar que el producto tenga datos mínimos
          if (!producto.codigo || !producto.nombre) {
            console.log(`Producto ${i} sin código o nombre válido, saltando...`);
            continue;
          }
          
          console.log(`Procesando producto ${i}: ${producto.codigo} - ${producto.nombre}`);
          
          // Asignar categoría si es posible
          try {
            const categoriaId = await asignarCategoria(i, categorias, producto.nombre);
            if (categoriaId) producto.categoria = categoriaId;
          } catch (catError) {
            console.error('Error al asignar categoría:', catError);
          }
          
          // Asignar proveedor si es válido
          if (proveedorId) producto.proveedor = proveedorId;
          
          // Verificar si el producto ya existe por su código
          try {
            let existentes = [];
            existentes = await fetchAdmin(`/api/collections/productos/records`, {
              method: 'GET',
              params: {
                filter: `codigo = "${producto.codigo}"`
              }
            });
            
            console.log(`Búsqueda de producto existente ${producto.codigo}:`, existentes);
            
            if (existentes.items && existentes.items.length > 0) {
              // Actualizar producto existente
              console.log(`Actualizando producto existente: ${producto.codigo} (ID: ${existentes.items[0].id})`);
              
              try {
                const productoActualizado = await fetchAdmin(`/api/collections/productos/records/${existentes.items[0].id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(producto),
                });
                
                console.log(`Producto actualizado correctamente:`, productoActualizado);
                resultado.actualizados++;
                await actualizarLog(importacionId, `Producto actualizado: ${producto.codigo} - ${producto.nombre} (ID: ${productoActualizado.id})`);
              } catch (updateError) {
                console.error(`Error al actualizar producto ${producto.codigo}:`, updateError);
                await actualizarLog(importacionId, `Error al actualizar producto ${producto.codigo}: ${updateError.message}`);
                resultado.errores++;
              }
            } else {
              // Crear nuevo producto
              console.log(`Creando nuevo producto: ${producto.codigo}`);
              console.log('Datos del producto:', JSON.stringify(producto));
              
              try {
                const nuevoProducto = await fetchAdmin(`/api/collections/productos/records`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(producto),
                });
                
                console.log(`Producto creado correctamente:`, nuevoProducto);
                resultado.creados++;
                await actualizarLog(importacionId, `Producto creado: ${producto.codigo} - ${producto.nombre} (ID: ${nuevoProducto.id})`);
              } catch (createError) {
                console.error(`Error al crear producto ${producto.codigo}:`, createError);
                console.error('Detalles del error:', createError.response ? await createError.response.text() : 'No hay detalles');
                await actualizarLog(importacionId, `Error al crear producto ${producto.codigo}: ${createError.message}`);
                resultado.errores++;
              }
            }
            
            // Verificar si hay notas que indiquen devoluciones
            if (item.NOTAS || item.OBSERVACIONES || item.COMENTARIOS) {
              const analisisNota = analizarNota(item.NOTAS || item.OBSERVACIONES || item.COMENTARIOS);
              if (analisisNota) {
                await registrarDevolucion(producto, analisisNota, proveedorId, importacionId);
                resultado.devoluciones++;
              }
            }
          } catch (error) {
            console.error(`Error al procesar producto ${producto.codigo}:`, error);
            await actualizarLog(importacionId, `Error al procesar producto ${producto.codigo}: ${error.message}`);
            resultado.errores++;
          }
        } catch (itemError) {
          console.error(`Error al procesar ítem ${i}:`, itemError);
          await actualizarLog(importacionId, `Error al procesar ítem ${i}: ${itemError.message}`);
          resultado.errores++;
        }
      }
    } else if (tipo === 'precios') {
      // Implementar actualización de precios
      console.log('Actualizando precios...');
      await actualizarLog(importacionId, 'Actualizando precios...');
      
      for (let i = 0; i < datos.length; i++) {
        const item = datos[i];
        
        try {
          const codigo = item['CÓDIGO'] || item.CODIGO || '';
          const precio = parseFloat((item['P.V.P FINAL CLIENTE'] || item.PRECIO || item.PVP || '0').toString().replace(',', '.')) || 0;
          
          if (!codigo) {
            console.log(`Ítem ${i} sin código, saltando...`);
            continue;
          }
          
          // Buscar producto por código
          const productos = await fetchAdmin(`/api/collections/productos/records`, {
            method: 'GET',
            params: {
              filter: `codigo = "${codigo}"`
            }
          });
          
          if (productos.items && productos.items.length > 0) {
            // Actualizar precio
            const producto = productos.items[0];
            
            await fetchAdmin(`/api/collections/productos/records/${producto.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                precio: precio
              }),
            });
            
            resultado.actualizados++;
            await actualizarLog(importacionId, `Precio actualizado para producto ${codigo}: ${precio}€`);
          } else {
            console.log(`Producto con código ${codigo} no encontrado para actualizar precio`);
            await actualizarLog(importacionId, `Producto con código ${codigo} no encontrado para actualizar precio`);
            resultado.errores++;
          }
        } catch (error) {
          console.error(`Error al actualizar precio para ítem ${i}:`, error);
          await actualizarLog(importacionId, `Error al actualizar precio: ${error.message}`);
          resultado.errores++;
        }
      }
    } else if (tipo === 'stock') {
      // Implementar actualización de stock
      console.log('Actualizando stock...');
      await actualizarLog(importacionId, 'Actualizando stock...');
      
      for (let i = 0; i < datos.length; i++) {
        const item = datos[i];
        
        try {
          const codigo = item['CÓDIGO'] || item.CODIGO || '';
          const stock = parseInt(item.STOCK || item.UNIDADES || '0', 10) || 0;
          
          if (!codigo) {
            console.log(`Ítem ${i} sin código, saltando...`);
            continue;
          }
          
          // Buscar producto por código
          const productos = await fetchAdmin(`/api/collections/productos/records`, {
            method: 'GET',
            params: {
              filter: `codigo = "${codigo}"`
            }
          });
          
          if (productos.items && productos.items.length > 0) {
            // Actualizar stock
            const producto = productos.items[0];
            
            await fetchAdmin(`/api/collections/productos/records/${producto.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                stock: stock
              }),
            });
            
            resultado.actualizados++;
            await actualizarLog(importacionId, `Stock actualizado para producto ${codigo}: ${stock} unidades`);
          } else {
            console.log(`Producto con código ${codigo} no encontrado para actualizar stock`);
            await actualizarLog(importacionId, `Producto con código ${codigo} no encontrado para actualizar stock`);
            resultado.errores++;
          }
        } catch (error) {
          console.error(`Error al actualizar stock para ítem ${i}:`, error);
          await actualizarLog(importacionId, `Error al actualizar stock: ${error.message}`);
          resultado.errores++;
        }
      }
    }
    
    resultado.exito = resultado.errores === 0;
    return resultado;
  } catch (error) {
    console.error('Error al importar datos:', error);
    await actualizarLog(importacionId, `Error al importar datos: ${error.message}`);
    return { exito: false, error: error.message };
  }
}

// Exportar funciones principales
export default {
  importarDatos
};
