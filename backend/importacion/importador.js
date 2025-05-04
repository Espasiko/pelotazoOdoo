/**
 * Sistema de importación para El Pelotazo
 * Este módulo maneja la importación de datos desde diferentes formatos y proveedores
 * Versión refactorizada y optimizada
 */

import { pocketbaseConfig } from './config.js';
import { autenticarAdmin, fetchAdmin } from './utils.js';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import fetch from 'node-fetch';

// URL base de PocketBase
const baseUrl = pocketbaseConfig.url;

// Mapeo de proveedores a sus parsers específicos
const proveedorParsers = {
  'CECOTEC': parseCecotec,
  'BSH': parseBSH,
  'JATA': parseJata,
  'ORBEGOZO': parseOrbegozo,
  'ALFADYSER': parseAlfadyser,
  'VITROKITCHEN': parseVitrokitchen,
  'ELECTRODIRECTO': parseElectrodirecto,
  'GENERICO': parserGenerico
  // Añadir más parsers según sea necesario
};

// Función principal para importar datos
async function importarDatos(filePath, proveedor, tipo, importacionId = null) {
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
    const extension = path.extname(filePath).toLowerCase();
    
    if (extension === '.csv') {
      datos = await leerCSV(filePath);
    } else if (extension === '.xlsx' || extension === '.xls') {
      datos = await leerExcel(filePath);
    } else {
      throw new Error(`Formato de archivo no soportado: ${extension}`);
    }
    
    console.log(`Leídos ${datos.length} registros del archivo`);
    await actualizarLog(importacionId, `Leídos ${datos.length} registros del archivo`);
    
    // Obtener el ID del proveedor
    const proveedorId = await obtenerIdProveedor(proveedor);
    console.log(`ID del proveedor: ${proveedorId}`);
    await actualizarLog(importacionId, `Proveedor: ${proveedor} (ID: ${proveedorId})`);
    
    // Usar el parser específico para el proveedor o el genérico si no existe
    const parser = proveedorParsers[proveedor.toUpperCase()] || parserGenerico;
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

// Función para leer archivos CSV
async function leerCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Función para leer archivos Excel
async function leerExcel(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
  } catch (error) {
    console.error('Error al leer archivo Excel:', error);
    throw error;
  }
}

// Función para obtener el ID de un proveedor por su nombre
async function obtenerIdProveedor(nombreProveedor) {
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
      return `temp_${nombreNormalizado.replace(/\s+/g, '_').toLowerCase()}`;
    }
  }
  
  // Si llegamos aquí, no se pudo encontrar ni crear el proveedor
  return `temp_${nombreNormalizado.replace(/\s+/g, '_').toLowerCase()}`;
}

// Función para obtener un proveedor por su nombre
async function obtenerProveedorPorNombre(nombreProveedor) {
  if (!nombreProveedor) return null;
  
  // Normalizar el nombre del proveedor
  const nombreNormalizado = nombreProveedor.trim().toUpperCase();
  
  // Buscar el proveedor en la colección de proveedores usando búsqueda aproximada
  try {
    const proveedor = await fetchAdmin(`/api/collections/proveedores/records`, {
      method: 'GET',
      params: {
        filter: `nombre~"${nombreNormalizado}"`
      }
    });
    
    if (proveedor.items && proveedor.items.length > 0) {
      console.log(`Proveedor encontrado: ${proveedor.items[0].id}`);
      return proveedor.items[0];
    }
  } catch (error) {
    console.log(`No se encontró el proveedor: ${nombreProveedor}`);
    return null;
  }
  
  return null;
}

// Función para actualizar el estado de una importación
async function actualizarImportacion(importacionId, estado, resultado) {
  try {
    await fetchAdmin(`/api/collections/importaciones/records/${importacionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        estado: estado,
        resultado: JSON.stringify(resultado),
        fecha_actualizacion: new Date().toISOString()
      }),
    });
    console.log(`Importación ${importacionId} actualizada a estado: ${estado}`);
  } catch (error) {
    console.error(`Error al actualizar importación ${importacionId}:`, error);
  }
}

// Función para añadir entradas al log de importación
async function actualizarLog(importacionId, mensaje) {
  try {
    const importacion = await fetchAdmin(`/api/collections/importaciones/records/${importacionId}`);
    const logActual = importacion.log || '';
    const nuevoLog = `${logActual}${new Date().toISOString()}: ${mensaje}\n`;
    
    await fetchAdmin(`/api/collections/importaciones/records/${importacionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        log: nuevoLog
      }),
    });
  } catch (error) {
    console.error(`Error al actualizar log de importación ${importacionId}:`, error);
  }
}

// Función para detectar categorías en datos
async function detectarCategorias(datos) {
  // Mapeo de palabras clave a categorías
  const mapeoCategoriasKeywords = {
    'ELECTRODOMESTICO': 'ELECTRODOMÉSTICOS',
    'ELECTRO': 'ELECTRODOMÉSTICOS',
    'COCINA': 'COCINA',
    'HORNO': 'COCINA',
    'VITRO': 'COCINA',
    'MICROONDAS': 'COCINA',
    'FRIGO': 'REFRIGERACIÓN',
    'FRIGORIFICO': 'REFRIGERACIÓN',
    'CONGELADOR': 'REFRIGERACIÓN',
    'NEVERA': 'REFRIGERACIÓN',
    'LAVADORA': 'LAVADO',
    'SECADORA': 'LAVADO',
    'LAVAVAJILLAS': 'LAVADO',
    'ASPIRADORA': 'PEQUEÑO ELECTRODOMÉSTICO',
    'PLANCHA': 'PEQUEÑO ELECTRODOMÉSTICO',
    'BATIDORA': 'PEQUEÑO ELECTRODOMÉSTICO',
    'CAFETERA': 'PEQUEÑO ELECTRODOMÉSTICO',
    'TOSTADORA': 'PEQUEÑO ELECTRODOMÉSTICO',
    'CALEFACTOR': 'CLIMATIZACIÓN',
    'VENTILADOR': 'CLIMATIZACIÓN',
    'AIRE': 'CLIMATIZACIÓN',
    'CALEFACCION': 'CLIMATIZACIÓN',
    'CLIMATIZACION': 'CLIMATIZACIÓN',
    'TELEVISION': 'IMAGEN Y SONIDO',
    'TV': 'IMAGEN Y SONIDO',
    'AUDIO': 'IMAGEN Y SONIDO',
    'ALTAVOZ': 'IMAGEN Y SONIDO',
    'AURICULAR': 'IMAGEN Y SONIDO',
    'TELEFONO': 'TELEFONÍA',
    'MOVIL': 'TELEFONÍA',
    'SMARTPHONE': 'TELEFONÍA',
    'TABLET': 'INFORMÁTICA',
    'ORDENADOR': 'INFORMÁTICA',
    'PORTATIL': 'INFORMÁTICA',
    'IMPRESORA': 'INFORMÁTICA',
    'MONITOR': 'INFORMÁTICA',
    'TECLADO': 'INFORMÁTICA',
    'RATON': 'INFORMÁTICA',
    'CONSOLA': 'GAMING',
    'VIDEOJUEGO': 'GAMING',
    'GAMING': 'GAMING',
    'JUEGO': 'GAMING',
    'CAMARA': 'FOTOGRAFÍA',
    'FOTO': 'FOTOGRAFÍA',
    'OBJETIVO': 'FOTOGRAFÍA',
    'FLASH': 'FOTOGRAFÍA',
    'TRIPODE': 'FOTOGRAFÍA'
  };
  
  // Detectar categorías en los datos
  const categorias = new Set();
  
  // Función para normalizar texto
  const normalizar = (texto) => {
    if (!texto) return '';
    return texto.toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, '');
  };
  
  // Recorrer los datos y buscar palabras clave
  for (const item of datos) {
    // Buscar en todos los campos de texto
    for (const campo in item) {
      if (typeof item[campo] === 'string') {
        const textoNormalizado = normalizar(item[campo]);
        
        // Buscar coincidencias con palabras clave
        for (const keyword in mapeoCategoriasKeywords) {
          if (textoNormalizado.includes(keyword)) {
            categorias.add(mapeoCategoriasKeywords[keyword]);
          }
        }
      }
    }
  }
  
  // Si no se detectó ninguna categoría, usar "OTROS"
  if (categorias.size === 0) {
    categorias.add('OTROS');
  }
  
  return Array.from(categorias);
}

// Función para asignar categoría a un producto basado en su posición o nombre
async function asignarCategoria(indice, categorias, nombreProducto) {
  // Si se proporcionaron categorías, intentar asignar por posición
  if (categorias && categorias.length > 0) {
    // Calcular la categoría basada en la posición
    const numCategorias = categorias.length;
    const categoriaIndex = indice % numCategorias;
    const categoriaAsignada = categorias[categoriaIndex];
    
    console.log(`Asignando categoría por posición: ${categoriaAsignada}`);
    
    // Buscar el ID de la categoría en la base de datos
    try {
      const categoriaEnBD = await fetchAdmin(`/api/collections/categorias/records`, {
        method: 'GET',
        params: {
          filter: `nombre="${categoriaAsignada}"`
        }
      });
      
      if (categoriaEnBD.items && categoriaEnBD.items.length > 0) {
        console.log(`Categoría asignada: ${categoriaAsignada} (ID: ${categoriaEnBD.items[0].id})`);
        return categoriaEnBD.items[0].id;
      }
    } catch (error) {
      // Si la categoría no existe, crearla
      console.log(`Categoría ${categoriaAsignada} no encontrada, creándola...`);
      return await crearCategoria(categoriaAsignada);
    }
  }
  
  // Si no hay categorías o falló la asignación por posición, intentar detectar por nombre
  if (nombreProducto) {
    // Mapeo de palabras clave a categorías
    const mapeoCategoriasKeywords = {
      'ELECTRODOMESTICO': 'ELECTRODOMÉSTICOS',
      'ELECTRO': 'ELECTRODOMÉSTICOS',
      'COCINA': 'COCINA',
      'HORNO': 'COCINA',
      'VITRO': 'COCINA',
      'MICROONDAS': 'COCINA',
      'FRIGO': 'REFRIGERACIÓN',
      'FRIGORIFICO': 'REFRIGERACIÓN',
      'CONGELADOR': 'REFRIGERACIÓN',
      'NEVERA': 'REFRIGERACIÓN',
      'LAVADORA': 'LAVADO',
      'SECADORA': 'LAVADO',
      'LAVAVAJILLAS': 'LAVADO',
      'ASPIRADORA': 'PEQUEÑO ELECTRODOMÉSTICO',
      'PLANCHA': 'PEQUEÑO ELECTRODOMÉSTICO',
      'BATIDORA': 'PEQUEÑO ELECTRODOMÉSTICO',
      'CAFETERA': 'PEQUEÑO ELECTRODOMÉSTICO',
      'TOSTADORA': 'PEQUEÑO ELECTRODOMÉSTICO'
    };
    
    // Normalizar nombre
    const nombreNormalizado = nombreProducto.toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    
    // Buscar coincidencias con palabras clave
    for (const keyword in mapeoCategoriasKeywords) {
      if (nombreNormalizado.includes(keyword)) {
        const categoriaDetectada = mapeoCategoriasKeywords[keyword];
        console.log(`Categoría detectada por nombre: ${categoriaDetectada}`);
        return await crearCategoria(categoriaDetectada);
      }
    }
  }
  
  // Si todo falla, asignar a "OTROS"
  console.log('No se pudo asignar categoría, usando OTROS');
  return await crearCategoria('OTROS');
}

// Función para crear una categoría o encontrar una existente
async function crearCategoria(nombre) {
  if (!nombre) {
    console.log('No se proporcionó nombre de categoría, usando OTROS');
    nombre = 'OTROS';
  }
  
  try {
    // Buscar si la categoría ya existe
    const categorias = await fetchAdmin(`/api/collections/categorias/records`, {
      method: 'GET',
      params: {
        filter: `nombre="${nombre}"`
      }
    });
    
    if (categorias.items && categorias.items.length > 0) {
      console.log(`Categoría existente encontrada: ${nombre}`);
      return categorias.items[0].id;
    }
    
    // Si no existe, crear la categoría
    console.log(`Creando nueva categoría: ${nombre}`);
    const data = {
      nombre: nombre,
      activo: true,
      fecha_alta: new Date().toISOString()
    };
    
    const record = await fetchAdmin(`/api/collections/categorias/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });
    
    console.log(`Categoría creada con ID: ${record.id}`);
    return record.id;
  } catch (error) {
    console.error(`Error al buscar/crear categoría ${nombre}:`, error);
    // Devolver un ID temporal para no bloquear la importación
    const idTemporal = `temp_${nombre.toLowerCase().replace(/\s+/g, '_')}`;
    console.log(`Usando ID temporal: ${idTemporal}`);
    return idTemporal;
  }
}

// Función para inicializar categorías predefinidas
async function inicializarCategoriasPredefinidas() {
  try {
    console.log('Inicializando categorías predefinidas...');
    
    // Autenticar como admin
    await autenticarAdmin();
    
    // Lista de categorías predefinidas
    const categoriasPredefinidas = [
      'ELECTRODOMÉSTICOS',
      'COCINA',
      'REFRIGERACIÓN',
      'LAVADO',
      'PEQUEÑO ELECTRODOMÉSTICO',
      'CLIMATIZACIÓN',
      'IMAGEN Y SONIDO',
      'TELEFONÍA',
      'INFORMÁTICA',
      'GAMING',
      'FOTOGRAFÍA',
      'HOGAR',
      'JARDÍN',
      'BRICOLAJE',
      'OTROS'
    ];
    
    // Crear cada categoría si no existe
    let contador = 0;
    for (const categoria of categoriasPredefinidas) {
      await crearCategoria(categoria);
      contador++;
    }
    
    console.log(`Se inicializaron ${contador} categorías predefinidas.`);
  } catch (error) {
    console.error('Error en inicialización de categorías:', error);
  }
}

// Función para analizar notas y extraer información de abonos/devoluciones
function analizarNota(texto) {
  if (!texto) return null;
  
  // Convertir a string si no lo es
  const textoStr = String(texto);
  
  // Patrones para detectar abonos/devoluciones
  const patrones = [
    // Patrón para abonos
    {
      regex: /abono|devoluci[oó]n|reembolso|retorno|cr[eé]dito/i,
      tipo: 'abono'
    },
    // Patrón para productos defectuosos
    {
      regex: /defectuoso|averiado|roto|da[ñn]ado|fallo|error|mal estado/i,
      tipo: 'defectuoso'
    },
    // Patrón para cambios
    {
      regex: /cambio|sustituci[oó]n|reemplazo/i,
      tipo: 'cambio'
    }
  ];
  
  // Buscar coincidencias
  for (const patron of patrones) {
    if (patron.regex.test(textoStr)) {
      return {
        tipo: patron.tipo,
        texto: textoStr,
        fecha: new Date().toISOString()
      };
    }
  }
  
  // Si no hay coincidencias, devolver null
  return null;
}

// Función para registrar una devolución en la base de datos
async function registrarDevolucion(producto, analisisNota, proveedorId, importacionId) {
  try {
    console.log(`Registrando devolución para producto ${producto.codigo}`);
    
    // Crear objeto de devolución
    const devolucion = {
      producto_codigo: producto.codigo,
      producto_nombre: producto.nombre,
      tipo: analisisNota.tipo,
      motivo: analisisNota.texto,
      fecha: new Date().toISOString(),
      proveedor: proveedorId,
      importacion: importacionId
    };
    
    // Guardar en la colección de devoluciones
    const nuevaDevolucion = await fetchAdmin(`/api/collections/devoluciones/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(devolucion),
    });
    
    await actualizarLog(importacionId, `Devolución registrada: ${producto.codigo} - ${producto.nombre} - ID: ${nuevaDevolucion.id}`);
    
    return nuevaDevolucion.id;
  } catch (error) {
    console.error('Error al registrar devolución:', error);
    await actualizarLog(importacionId, `Error al registrar devolución: ${error.message}`);
    return null;
  }
}

// Función para importar datos procesados a la base de datos
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
          // Crear objeto de producto
          const producto = {
            nombre: item.nombre || item.NOMBRE || item.DESCRIPCION || `Producto ${item.codigo || item.CODIGO || i}`,
            codigo: item.codigo || item.CODIGO || item.REFERENCIA || `REF-${i}`,
            descripcion: item.descripcion || item.DESCRIPCION || '',
            precio: parseFloat((item.precio || item.PRECIO || item['P.V.P'] || item['P.V.P FINAL CLIENTE'] || '0').toString().replace(',', '.')) || 0,
            stock: parseInt(item.stock || item.STOCK || item.UNIDADES || item['UNID.'] || '0', 10) || 0,
            activo: true,
            fecha_alta: new Date().toISOString()
          };
          
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
            
            if (existentes.items && existentes.items.length > 0) {
              // Actualizar producto existente
              console.log(`Actualizando producto existente: ${producto.codigo}`);
              const productoActualizado = await fetchAdmin(`/api/collections/productos/records/${existentes.items[0].id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(producto),
              });
              resultado.actualizados++;
              await actualizarLog(importacionId, `Producto actualizado: ${producto.codigo} - ${producto.nombre} (ID: ${productoActualizado.id})`);
            } else {
              // Crear nuevo producto
              console.log(`Creando nuevo producto: ${producto.codigo}`);
              console.log('Datos del producto:', JSON.stringify(producto));
              const nuevoProducto = await fetchAdmin(`/api/collections/productos/records`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(producto),
              });
              resultado.creados++;
              await actualizarLog(importacionId, `Producto creado: ${producto.codigo} - ${producto.nombre} (ID: ${nuevoProducto.id})`);
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
      console.log('Importando precios...');
      await actualizarLog(importacionId, 'Importando precios...');
      
      // Procesar cada precio
      for (let i = 0; i < datos.length; i++) {
        const item = datos[i];
        
        try {
          if (!item['CÓDIGO']) {
            console.log('Ítem sin código, saltando...');
            continue;
          }
          
          let existentes = [];
          existentes = await fetchAdmin(`/api/collections/productos/records`, {
            method: 'GET',
            params: {
              filter: `codigo = "${item['CÓDIGO']}"`
            }
          });
          
          if (existentes.items && existentes.items.length > 0) {
            // Solo actualizar el campo precio que sabemos que existe
            const datosActualizacion = {
              precio: parseFloat((item['P.V.P FINAL CLIENTE'] || '0').toString().replace(',', '.')) || 0
            };
            
            if (proveedorId) datosActualizacion.proveedor = proveedorId;
            
            await fetchAdmin(`/api/collections/productos/records/${existentes.items[0].id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(datosActualizacion),
            });
            resultado.actualizados++;
            await actualizarLog(importacionId, `Precio actualizado: ${item['CÓDIGO']}`);
          } else {
            // Crear un producto básico con el precio
            const nuevoProducto = await fetchAdmin(`/api/collections/productos/records`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                nombre: `Producto ${item['CÓDIGO'] || 'nuevo'}`,
                codigo: item['CÓDIGO'],
                precio: parseFloat((item['P.V.P FINAL CLIENTE'] || '0').toString().replace(',', '.')) || 0,
                proveedor: proveedorId,
                activo: true,
                fecha_alta: new Date().toISOString()
              }),
            });
            resultado.creados++;
            await actualizarLog(importacionId, `Producto creado con precio: ${item['CÓDIGO']} (ID: ${nuevoProducto.id})`);
          }
        } catch (error) {
          console.error(`Error al procesar precio para ${item['CÓDIGO'] || 'desconocido'}:`, error);
          await actualizarLog(importacionId, `Error al procesar precio: ${error.message}`);
          resultado.errores++;
        }
      }
    } else if (tipo === 'stock') {
      console.log('Importando stock...');
      await actualizarLog(importacionId, 'Importando stock...');
      
      // Procesar cada stock
      for (let i = 0; i < datos.length; i++) {
        const item = datos[i];
        
        try {
          if (!item['CÓDIGO']) {
            console.log('Ítem sin código, saltando...');
            continue;
          }
          
          let existentes = [];
          existentes = await fetchAdmin(`/api/collections/productos/records`, {
            method: 'GET',
            params: {
              filter: `codigo = "${item['CÓDIGO']}"`
            }
          });
          
          if (existentes.items && existentes.items.length > 0) {
            // Intentar actualizar el stock si el campo existe, o añadirlo al nombre
            const productoExistente = existentes.items[0];
            const datosActualizacion = {
              stock: parseInt(item['STOCK'] || item['UNID.'] || '0', 10) || 0
            };
            
            if (proveedorId) datosActualizacion.proveedor = proveedorId;
            
            await fetchAdmin(`/api/collections/productos/records/${productoExistente.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(datosActualizacion),
            });
            resultado.actualizados++;
            await actualizarLog(importacionId, `Stock actualizado: ${item['CÓDIGO']}`);
          } else {
            // Crear un producto básico con el stock
            const nuevoProducto = await fetchAdmin(`/api/collections/productos/records`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                nombre: `Producto ${item['CÓDIGO'] || 'nuevo'}`,
                codigo: item['CÓDIGO'],
                stock: parseInt(item['STOCK'] || item['UNID.'] || '0', 10),
                precio: 0,
                proveedor: proveedorId,
                activo: true,
                fecha_alta: new Date().toISOString()
              }),
            });
            resultado.creados++;
            await actualizarLog(importacionId, `Producto creado con stock: ${item['CÓDIGO']} (ID: ${nuevoProducto.id})`);
          }
        } catch (error) {
          console.error(`Error al procesar stock para ${item['CÓDIGO'] || 'desconocido'}:`, error);
          await actualizarLog(importacionId, `Error al procesar stock: ${error.message}`);
          resultado.errores++;
        }
      }
    } else {
      console.log(`Tipo de importación no soportado: ${tipo}`);
      await actualizarLog(importacionId, `Tipo de importación no soportado: ${tipo}`);
      resultado.exito = false;
    }
    
    return resultado;
  } catch (error) {
    console.error('Error general en importación a base de datos:', error);
    await actualizarLog(importacionId, `Error general en importación: ${error.message}`);
    resultado.exito = false;
    resultado.errores++;
    return resultado;
  }
}

// Parser genérico para cualquier proveedor
function parserGenerico(datos, tipo) {
  console.log(`Usando parser genérico para ${datos.length} registros de tipo ${tipo}`);
  
  // Si no hay datos, devolver array vacío
  if (!datos || datos.length === 0) {
    return [];
  }
  
  // Normalizar los datos según el tipo de importación
  if (tipo === 'productos') {
    return datos.map((item, index) => {
      // Intentar mapear campos comunes
      return {
        codigo: item.CODIGO || item.REFERENCIA || item.REF || item.SKU || item.ID || `GEN-${index}`,
        nombre: item.NOMBRE || item.DESCRIPCION || item.PRODUCTO || item.ARTICULO || `Producto Genérico ${index}`,
        descripcion: item.DESCRIPCION || item.DETALLES || item.CARACTERISTICAS || '',
        precio: parseFloat((item.PRECIO || item.PVP || item['P.V.P'] || item.IMPORTE || '0').toString().replace(',', '.')) || 0,
        stock: parseInt(item.STOCK || item.UNIDADES || item.CANTIDAD || '0', 10) || 0
      };
    });
  } else if (tipo === 'precios') {
    return datos.map((item, index) => {
      // Mapear solo código y precio
      return {
        CÓDIGO: item.CODIGO || item.REFERENCIA || item.REF || item.SKU || item.ID || `GEN-${index}`,
        'P.V.P FINAL CLIENTE': item.PRECIO || item.PVP || item['P.V.P'] || item.IMPORTE || '0'
      };
    });
  } else if (tipo === 'stock') {
    return datos.map((item, index) => {
      // Mapear solo código y stock
      return {
        CÓDIGO: item.CODIGO || item.REFERENCIA || item.REF || item.SKU || item.ID || `GEN-${index}`,
        STOCK: item.STOCK || item.UNIDADES || item.CANTIDAD || '0'
      };
    });
  }
  
  // Si el tipo no es reconocido, devolver los datos sin cambios
  return datos;
}

// Parsers específicos para cada proveedor
function parseCecotec(datos, tipo) {
  console.log(`Usando parser específico para CECOTEC (${datos.length} registros)`);
  return parserGenerico(datos, tipo);
}

function parseBSH(datos, tipo) {
  console.log(`Usando parser específico para BSH (${datos.length} registros)`);
  return parserGenerico(datos, tipo);
}

// Implementar los demás parsers específicos con la misma estructura
function parseJata(datos, tipo) {
  console.log(`Usando parser específico para JATA (${datos.length} registros)`);
  return parserGenerico(datos, tipo);
}

function parseOrbegozo(datos, tipo) {
  console.log(`Usando parser específico para ORBEGOZO (${datos.length} registros)`);
  return parserGenerico(datos, tipo);
}

function parseAlfadyser(datos, tipo) {
  console.log(`Usando parser específico para ALFADYSER (${datos.length} registros)`);
  return parserGenerico(datos, tipo);
}

function parseVitrokitchen(datos, tipo) {
  console.log(`Usando parser específico para VITROKITCHEN (${datos.length} registros)`);
  return parserGenerico(datos, tipo);
}

function parseElectrodirecto(datos, tipo) {
  console.log(`Usando parser específico para ELECTRODIRECTO (${datos.length} registros)`);
  return parserGenerico(datos, tipo);
}

// Ejecutar inicialización de categorías al cargar el módulo
inicializarCategoriasPredefinidas().then(() => {
  console.log('Inicialización de categorías completada.');
}).catch(error => {
  console.error('Error en inicialización de categorías:', error);
});

// Exportar funciones públicas
export {
  importarDatos,
  obtenerProveedorPorNombre,
  obtenerIdProveedor,
  actualizarImportacion,
  actualizarLog,
  detectarCategorias,
  analizarNota,
  importarABaseDeDatos
};
