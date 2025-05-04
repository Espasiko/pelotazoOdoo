/**
 * Sistema de importación para El Pelotazo
 * Este módulo maneja la importación de datos desde diferentes formatos y proveedores
 * Versión refactorizada y optimizada
 */

import PocketBase from 'pocketbase';
import { pocketbaseConfig } from './config.js';
import { autenticarAdmin } from './utils.js';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import fetch from 'node-fetch';

// Inicializar PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

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
      importacion = await pb.collection('importaciones').create({
        fecha: new Date().toISOString(),
        tipo: tipo,
        estado: 'procesando',
        archivo: path.basename(filePath),
        log: `Iniciando importación: ${new Date().toISOString()}\n`,
      });
      importacionId = importacion.id;
    } else {
      importacion = await pb.collection('importaciones').getOne(importacionId);
    }

    // Leer el archivo según su extensión
    const extension = path.extname(filePath).toLowerCase();
    let datos;
    
    if (extension === '.csv') {
      datos = await leerCSV(filePath);
      await actualizarLog(importacionId, `Archivo CSV leído correctamente: ${datos.length} filas`);
    } else if (extension === '.xlsx' || extension === '.xls') {
      datos = await leerExcel(filePath);
      await actualizarLog(importacionId, `Archivo Excel leído correctamente: ${datos.length} filas`);
    } else {
      const mensaje = `Formato de archivo no soportado: ${extension}`;
      await actualizarImportacion(importacionId, 'error', { error: mensaje });
      await actualizarLog(importacionId, mensaje);
      return { exito: false, error: mensaje };
    }

    // Verificar si hay datos
    if (!datos || datos.length === 0) {
      const mensaje = 'No se encontraron datos en el archivo';
      await actualizarImportacion(importacionId, 'error', { error: mensaje });
      await actualizarLog(importacionId, mensaje);
      return { exito: false, error: mensaje };
    }

    // Obtener o crear el proveedor
    const proveedorId = await obtenerIdProveedor(proveedor);
    if (!proveedorId) {
      const mensaje = `Error al obtener/crear el proveedor ${proveedor}`;
      await actualizarImportacion(importacionId, 'error', { error: mensaje });
      await actualizarLog(importacionId, mensaje);
      return { exito: false, error: mensaje };
    }
    
    await actualizarLog(importacionId, `Proveedor identificado con ID: ${proveedorId}`);

    // Procesar los datos según el proveedor
    const parser = proveedorParsers[proveedor] || parserGenerico;
    const datosProcesados = await parser(datos, tipo);
    
    await actualizarLog(importacionId, `Datos procesados: ${datosProcesados.length} registros válidos`);

    // Importar los datos procesados a la base de datos
    const resultado = await importarABaseDeDatos(datosProcesados, tipo, importacionId, proveedorId);
    
    // Actualizar el estado de la importación
    await actualizarImportacion(
      importacionId, 
      resultado.exito ? 'completado' : 'error', 
      resultado
    );

    return resultado;
  } catch (error) {
    console.error('Error en la importación:', error);
    if (importacionId) {
      await actualizarImportacion(importacionId, 'error', { error: error.message });
      await actualizarLog(importacionId, `Error en la importación: ${error.message}`);
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
function leerExcel(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
  } catch (error) {
    throw new Error(`Error al leer archivo Excel: ${error.message}`);
  }
}

// Función para obtener el ID de un proveedor por su nombre
async function obtenerIdProveedor(nombreProveedor) {
  try {
    console.log(`Buscando proveedor: ${nombreProveedor}`);
    
    // Buscar si el proveedor ya existe usando búsqueda aproximada
    try {
      const proveedorExistente = await pb.collection('proveedores').getFirstListItem(`nombre~"${nombreProveedor}"`);
      console.log(`Proveedor encontrado con ID: ${proveedorExistente.id}`);
      return proveedorExistente.id;
    } catch (error) {
      // Si no existe, crear un nuevo proveedor
      console.log(`Creando nuevo proveedor: ${nombreProveedor}`);
      
      // Verificar si la colección existe
      try {
        const colecciones = await pb.collections.getFullList();
        const existeColeccion = colecciones.some(c => c.name === 'proveedores');
        
        if (!existeColeccion) {
          console.error('La colección proveedores no existe en PocketBase');
          return null;
        }
      } catch (collError) {
        console.error('Error al verificar colecciones:', collError);
        return null;
      }
      
      // Crear el proveedor
      const nuevoProveedor = await pb.collection('proveedores').create({
        nombre: nombreProveedor,
        activo: true,
        fecha_alta: new Date().toISOString()
      });
      
      console.log(`Nuevo proveedor creado con ID: ${nuevoProveedor.id}`);
      return nuevoProveedor.id;
    }
  } catch (error) {
    console.error(`Error al obtener/crear proveedor ${nombreProveedor}:`, error);
    return null;
  }
}

// Función para obtener un proveedor por su nombre
async function obtenerProveedorPorNombre(nombreProveedor) {
  try {
    console.log(`Buscando proveedor con nombre: ${nombreProveedor}`);
    
    // Normalizar el nombre del proveedor para la búsqueda
    const nombreNormalizado = nombreProveedor.trim().toUpperCase();
    
    // Buscar el proveedor en la colección de proveedores usando búsqueda aproximada
    try {
      const proveedor = await pb.collection('proveedores').getFirstListItem(`nombre~"${nombreNormalizado}"`);
      console.log(`Proveedor encontrado: ${proveedor.id}`);
      return proveedor;
    } catch (error) {
      console.log(`No se encontró el proveedor: ${nombreProveedor}`);
      return null;
    }
  } catch (error) {
    console.error(`Error al buscar proveedor ${nombreProveedor}:`, error);
    return null;
  }
}

// Función para actualizar el estado de una importación
async function actualizarImportacion(importacionId, estado, resultado) {
  try {
    await pb.collection('importaciones').update(importacionId, {
      estado: estado,
      resultado: JSON.stringify(resultado),
      fecha_actualizacion: new Date().toISOString()
    });
    console.log(`Importación ${importacionId} actualizada a estado: ${estado}`);
  } catch (error) {
    console.error(`Error al actualizar importación ${importacionId}:`, error);
  }
}

// Función para añadir entradas al log de importación
async function actualizarLog(importacionId, mensaje) {
  try {
    const importacion = await pb.collection('importaciones').getOne(importacionId);
    const logActual = importacion.log || '';
    const nuevoLog = `${logActual}${new Date().toISOString()}: ${mensaje}\n`;
    
    await pb.collection('importaciones').update(importacionId, {
      log: nuevoLog
    });
  } catch (error) {
    console.error(`Error al actualizar log de importación ${importacionId}:`, error);
  }
}

// Función para detectar categorías en datos
async function detectarCategorias(datos) {
  const categorias = new Map();
  const categoriasPredefinidas = [
    'FRIGORÍFICOS', 'LAVADORAS', 'LAVAVAJILLAS', 'SECADORAS', 'HORNOS', 
    'CAFETERAS', 'ASPIRADORES', 'BATIDORAS', 'PLANCHAS', 'BÁSCULAS',
    'MICROONDAS', 'PLACAS', 'CAMPANAS', 'PEQUEÑO ELECTRODOMÉSTICO', 'OTROS'
  ];
  
  console.log('Detectando categorías en los datos...');
  
  try {
    // Recorrer los datos buscando posibles categorías
    for (let i = 0; i < datos.length; i++) {
      const fila = datos[i];
      
      // Verificar si es un encabezado de categoría
      let esEncabezadoCategoria = false;
      let nombreCategoria = '';
      
      // Criterios para identificar encabezados de categoría
      if (fila['DESCRIPCIÓN'] && 
          (!fila['CÓDIGO'] || fila['CÓDIGO'].trim() === '') && 
          (!fila['IMPORTE BRUTO'] || parseFloat(fila['IMPORTE BRUTO']) === 0 || fila['IMPORTE BRUTO'].trim() === '')) {
        
        nombreCategoria = fila['DESCRIPCIÓN'].trim().toUpperCase();
        
        // Verificar si el texto está en mayúsculas o tiene formato de título
        if (nombreCategoria === fila['DESCRIPCIÓN'].trim() || 
            nombreCategoria.split(' ').every(palabra => palabra === palabra.toUpperCase())) {
          esEncabezadoCategoria = true;
        }
      }
      
      if (esEncabezadoCategoria) {
        categorias.set(i, nombreCategoria);
        console.log(`Categoría detectada en línea ${i}: ${nombreCategoria}`);
        
        // Si la categoría no existe en la BD, crearla
        try {
          await crearCategoria(nombreCategoria);
        } catch (error) {
          console.error(`Error al crear categoría ${nombreCategoria}:`, error);
        }
      }
    }
    
    // Si no se detectaron categorías en el archivo, usar las predefinidas
    if (categorias.size === 0) {
      console.log('No se detectaron categorías en el archivo, usando predefinidas');
      categoriasPredefinidas.forEach((cat, idx) => {
        categorias.set(-100 - idx, cat);
      });
      
      // Asegurar que todas las categorías predefinidas existen en la BD
      for (const categoria of categoriasPredefinidas) {
        try {
          await crearCategoria(categoria, 'Categoría predefinida');
        } catch (error) {
          console.error(`Error al crear categoría predefinida ${categoria}:`, error);
        }
      }
    }
    
    console.log(`Total de categorías detectadas: ${categorias.size}`);
    return categorias;
  } catch (error) {
    console.error('Error al detectar categorías:', error);
    return new Map();
  }
}

// Función para asignar categoría a un producto basado en su posición o nombre
async function asignarCategoria(indice, categorias, nombreProducto) {
  try {
    // Buscar la categoría más cercana anterior al producto
    let categoriaAsignada = null;
    let ultimoIndice = -1;
    
    for (const [idx, nombre] of categorias.entries()) {
      if (idx < indice && idx > ultimoIndice) {
        categoriaAsignada = nombre;
        ultimoIndice = idx;
      }
    }
    
    // Si no se encontró categoría por posición, buscar por palabras clave en el nombre
    if (!categoriaAsignada && nombreProducto) {
      const nombreNormalizado = nombreProducto.toUpperCase();
      
      // Mapeo de palabras clave a categorías
      const mapeoCategoriasKeywords = {
        'FRIGORÍFICOS': ['FRIGO', 'FRIGORIFICO', 'COMBI', 'REFRIGERADOR', 'NEVERA'],
        'LAVADORAS': ['LAVADORA', 'LAVARROPAS', 'CARGA FRONTAL', 'CARGA SUPERIOR'],
        'LAVAVAJILLAS': ['LAVAVAJILLAS', 'LAVAPLATOS'],
        'SECADORAS': ['SECADORA', 'SECARROPAS'],
        'HORNOS': ['HORNO', 'PIROLÍTICO', 'MULTIFUNCIÓN'],
        'MICROONDAS': ['MICROONDAS', 'MICRO'],
        'PLACAS': ['PLACA', 'INDUCCIÓN', 'VITROCERÁMICA', 'ENCIMERA'],
        'CAMPANAS': ['CAMPANA', 'EXTRACTORA', 'EXTRACTOR'],
        'CAFETERAS': ['CAFETERA', 'CAFÉ', 'NESPRESSO', 'DOLCE GUSTO'],
        'ASPIRADORES': ['ASPIRADOR', 'ASPIRADORA', 'ROBOT', 'ESCOBA'],
        'BATIDORAS': ['BATIDORA', 'AMASADORA', 'PROCESADOR'],
        'PLANCHAS': ['PLANCHA', 'CENTRO PLANCHADO'],
        'BÁSCULAS': ['BASCULA', 'BÁSCULA', 'PESO'],
        'PEQUEÑO ELECTRODOMÉSTICO': ['TOSTADOR', 'EXPRIMIDOR', 'SANDWICHERA', 'FREIDORA', 'LICUADORA']
      };
      
      // Buscar coincidencias de palabras clave
      for (const [categoria, keywords] of Object.entries(mapeoCategoriasKeywords)) {
        if (keywords.some(keyword => nombreNormalizado.includes(keyword))) {
          categoriaAsignada = categoria;
          break;
        }
      }
    }
    
    // Si no se encontró categoría, usar "OTROS"
    if (!categoriaAsignada) {
      categoriaAsignada = 'OTROS';
    }
    
    // Buscar el ID de la categoría en la base de datos
    try {
      const categoriaEnBD = await pb.collection('categorias').getFirstListItem(`nombre~"${categoriaAsignada}"`);
      console.log(`Categoría asignada: ${categoriaAsignada} (ID: ${categoriaEnBD.id})`);
      return categoriaEnBD.id;
    } catch (error) {
      // Si la categoría no existe, crearla
      console.log(`Categoría ${categoriaAsignada} no encontrada, creándola...`);
      const nuevaCategoria = await crearCategoria(categoriaAsignada);
      if (nuevaCategoria) {
        return nuevaCategoria.id;
      } else {
        console.error(`No se pudo crear la categoría ${categoriaAsignada}`);
        return null;
      }
    }
  } catch (error) {
    console.error('Error al asignar categoría:', error);
    return null;
  }
}

// Función para crear una categoría o encontrar una existente
async function crearCategoria(nombre) {
  try {
    // Autenticar como superadmin
    await autenticarAdmin();
    
    try {
      // Buscar si la categoría ya existe
      const categorias = await pb.collection('categorias').getFullList({
        filter: `nombre="${nombre}"`
      });
      
      if (categorias && categorias.length > 0) {
        console.log(`Categoría existente encontrada: ${nombre}`);
        return categorias[0].id;
      }
      
      // Si no existe, crear la categoría
      console.log(`Creando nueva categoría: ${nombre}`);
      const data = {
        nombre: nombre,
        activo: true,
        fecha_alta: new Date().toISOString()
      };
      
      const record = await pb.collection('categorias').create(data);
      console.log(`Categoría creada con ID: ${record.id}`);
      return record.id;
    } catch (error) {
      console.error(`Error al buscar/crear categoría ${nombre}:`, error);
      
      // Generar un ID temporal para no bloquear el proceso
      const idTemporal = `temp_${nombre.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
      console.log(`Usando ID temporal: ${idTemporal}`);
      return idTemporal;
    }
  } catch (authError) {
    console.error('Error de autenticación al crear categoría:', authError);
    
    // Generar un ID temporal para no bloquear el proceso
    const idTemporal = `temp_${nombre.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
    console.log(`Usando ID temporal: ${idTemporal}`);
    return idTemporal;
  }
}

// Función para inicializar categorías predefinidas
async function inicializarCategoriasPredefinidas() {
  try {
    // Autenticarse como admin primero
    await autenticarAdmin();
    
    const categoriasPredefinidas = [
      'FRIGORÍFICOS', 'LAVADORAS', 'LAVAVAJILLAS', 'SECADORAS', 'HORNOS', 
      'CAFETERAS', 'ASPIRADORES', 'BATIDORAS', 'PLANCHAS', 'BÁSCULAS',
      'MICROONDAS', 'PLACAS', 'CAMPANAS', 'PEQUEÑO ELECTRODOMÉSTICO', 'OTROS'
    ];
    
    console.log('Inicializando categorías predefinidas...');
    const resultados = [];
    
    for (const categoria of categoriasPredefinidas) {
      const resultado = await crearCategoria(categoria, 'Categoría predefinida');
      if (resultado) {
        resultados.push(resultado);
      }
    }
    
    console.log(`Se inicializaron ${resultados.length} categorías predefinidas.`);
    return resultados;
  } catch (error) {
    console.error('Error en inicialización de categorías:', error);
  }
}

// Función para analizar notas y extraer información de abonos/devoluciones
function analizarNota(texto) {
  if (!texto) return null;
  
  const resultado = {
    esAbono: false,
    fechaAbono: null,
    responsable: null,
    motivo: null
  };
  
  // Detectar abonos
  if (texto.toUpperCase().includes('ABONADO')) {
    resultado.esAbono = true;
    
    // Extraer fecha
    const patronFecha = /ABONADO\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i;
    const coincidenciaFecha = texto.match(patronFecha);
    if (coincidenciaFecha) {
      resultado.fechaAbono = coincidenciaFecha[1];
    }
    
    // Extraer responsable
    if (texto.toUpperCase().includes('SE LO LLEVA PACO')) {
      resultado.responsable = 'PACO';
    } else if (texto.toUpperCase().includes('SE LO LLEVA AGENCIA')) {
      resultado.responsable = 'AGENCIA';
    } else if (texto.toUpperCase().includes('SE LO LLEVA SERVICIO')) {
      resultado.responsable = 'SERVICIO TÉCNICO';
    }
    
    // Extraer motivo
    const patronesMotivo = [
      /NO FUNCIONA/i,
      /ROTO/i,
      /NO SALE EL CAFÉ/i,
      /FALTA/i,
      /AVERÍA/i,
      /DESCONCHADO/i,
      /GOLPE/i
    ];
    
    for (const patron of patronesMotivo) {
      const coincidencia = texto.match(patron);
      if (coincidencia) {
        resultado.motivo = coincidencia[0];
        break;
      }
    }
  }
  
  return resultado;
}

// Función para registrar una devolución en la base de datos
async function registrarDevolucion(producto, analisisNota, proveedorId, importacionId) {
  try {
    // Crear registro de devolución
    const devolucion = {
      fecha: new Date().toISOString(),
      fecha_abono: analisisNota.fechaAbono || '',
      producto_codigo: producto.codigo || '',
      producto_nombre: producto.nombre || '',
      motivo: analisisNota.motivo || 'No especificado',
      responsable: analisisNota.responsable || 'No especificado',
      estado: 'procesado',
      notas: producto.notas || '',
      proveedor: proveedorId
    };
    
    // Guardar en la colección de devoluciones
    const nuevaDevolucion = await pb.collection('devoluciones').create(devolucion);
    
    await actualizarLog(importacionId, `Devolución registrada: ${producto.codigo} - ${producto.nombre} - ID: ${nuevaDevolucion.id}`);
    
    return nuevaDevolucion.id;
  } catch (error) {
    console.error(`Error al registrar devolución para ${producto.codigo}:`, error);
    await actualizarLog(importacionId, `Error al registrar devolución: ${error.message}`);
    return null;
  }
}

// Función para importar datos procesados a la base de datos
async function importarABaseDeDatos(datos, tipo, importacionId, proveedorId) {
  try {
    const resultado = {
      exito: true,
      total: datos.length,
      creados: 0,
      actualizados: 0,
      errores: 0,
      errores_detalle: [],
      devoluciones: 0
    };

    // Verificar la estructura actual de la colección de productos
    console.log('Verificando estructura de la colección productos...');
    try {
      // Intentar obtener un producto para ver su estructura
      const productosTest = await pb.collection('productos').getList(1, 1);
      if (productosTest.items.length > 0) {
        console.log('Estructura de productos:', Object.keys(productosTest.items[0]));
      } else {
        console.log('No hay productos en la base de datos para verificar estructura');
      }
    } catch (error) {
      console.error('Error al verificar estructura de productos:', error);
      await actualizarLog(importacionId, `Error al verificar estructura de productos: ${error.message}`);
    }

    // Detectar categorías en los datos
    const categorias = await detectarCategorias(datos);
    console.log(`Se detectaron ${categorias.size} categorías en los datos`);
    if (categorias.size > 0) {
      let categoriasLog = 'Categorías detectadas: ';
      for (const [indice, nombre] of categorias.entries()) {
        categoriasLog += `${nombre} (línea ${indice}), `;
      }
      await actualizarLog(importacionId, categoriasLog);
    }

    // Procesar según el tipo de importación
    if (tipo === 'productos') {
      for (let i = 0; i < datos.length; i++) {
        const productoOriginal = datos[i];
        
        try {
          // Verificar si es una fila de categoría (sin código, con descripción en mayúsculas)
          if ((!productoOriginal['CÓDIGO'] || productoOriginal['CÓDIGO'].trim() === '') && 
              productoOriginal['DESCRIPCIÓN'] && 
              productoOriginal['DESCRIPCIÓN'] === productoOriginal['DESCRIPCIÓN'].toUpperCase() &&
              (!productoOriginal['IMPORTE BRUTO'] || parseFloat(productoOriginal['IMPORTE BRUTO']) === 0 || productoOriginal['IMPORTE BRUTO'].trim() === '')) {
            
            // Es un encabezado de categoría, no un producto
            continue;
          }
          
          // Saltar filas sin código o descripción
          if (!productoOriginal['CÓDIGO'] || !productoOriginal['DESCRIPCIÓN']) {
            continue;
          }
          
          // Crear un objeto con solo los campos que sabemos que existen en la colección
          const producto = {
            codigo: productoOriginal['CÓDIGO'] || '',
            nombre: productoOriginal['DESCRIPCIÓN'] || `Producto ${productoOriginal['CÓDIGO']}`,
            precio: parseFloat((productoOriginal['P.V.P FINAL CLIENTE'] || '0').toString().replace(',', '.')) || 0,
            activo: true,
            fecha_alta: new Date().toISOString()
          };
          
          // Asignar categoría basada en la posición o el nombre
          try {
            const categoriaId = await asignarCategoria(i, categorias, productoOriginal['DESCRIPCIÓN']);
            console.log(`Asignando categoría ${categoriaId} al producto ${producto.codigo}`);
            
            // Solo asignar categoría si es un ID válido (no temporal)
            if (categoriaId && !categoriaId.startsWith('temp_')) {
              producto.categoria = categoriaId;
            } else {
              console.log(`Categoría temporal o inválida (${categoriaId}), no se asignará al producto`);
              await actualizarLog(importacionId, `Advertencia: No se pudo asignar categoría al producto ${producto.codigo}`);
            }
          } catch (catError) {
            console.error(`Error al asignar categoría al producto ${producto.codigo}:`, catError);
            await actualizarLog(importacionId, `Error al asignar categoría: ${catError.message}`);
          }
          
          // Asignar proveedor si es válido
          if (proveedorId && !proveedorId.startsWith('temp_')) {
            producto.proveedor = proveedorId;
          }
          
          // Verificar si el producto ya existe por su código
          try {
            let existentes = [];
            existentes = await pb.collection('productos').getList(1, 1, {
              filter: `codigo = "${producto.codigo}"`
            });
            
            if (existentes.items && existentes.items.length > 0) {
              // Actualizar producto existente
              console.log(`Actualizando producto existente: ${producto.codigo}`);
              const productoActualizado = await pb.collection('productos').update(existentes.items[0].id, producto);
              resultado.actualizados++;
              await actualizarLog(importacionId, `Producto actualizado: ${producto.codigo} - ${producto.nombre} (ID: ${productoActualizado.id})`);
            } else {
              // Crear nuevo producto
              console.log(`Creando nuevo producto: ${producto.codigo}`);
              console.log('Datos del producto:', JSON.stringify(producto));
              const nuevoProducto = await pb.collection('productos').create(producto);
              resultado.creados++;
              await actualizarLog(importacionId, `Producto creado: ${producto.codigo} - ${producto.nombre} (ID: ${nuevoProducto.id})`);
            }
          } catch (dbError) {
            console.error(`Error en operación de base de datos para producto ${producto.codigo}:`, dbError);
            resultado.errores++;
            resultado.errores_detalle.push({
              codigo: producto.codigo,
              error: dbError.message
            });
            await actualizarLog(importacionId, `Error en base de datos para producto ${producto.codigo}: ${dbError.message}`);
          }
        } catch (error) {
          console.error(`Error al procesar producto ${productoOriginal['CÓDIGO'] || 'sin código'}:`, error);
          resultado.errores++;
          resultado.errores_detalle.push({
            codigo: productoOriginal['CÓDIGO'] || 'sin código',
            error: error.message
          });
          await actualizarLog(importacionId, `Error en producto ${productoOriginal['CÓDIGO'] || 'sin código'}: ${error.message}`);
        }
      }
    } else if (tipo === 'precios') {
      // Lógica para actualizar solo precios
      for (const item of datos) {
        try {
          // Saltar filas sin código
          if (!item['CÓDIGO']) {
            continue;
          }
          
          let existentes = [];
          existentes = await pb.collection('productos').getList(1, 1, {
            filter: `codigo = "${item['CÓDIGO']}"`
          });
          
          if (existentes.items && existentes.items.length > 0) {
            // Solo actualizar el campo precio que sabemos que existe
            const datosActualizacion = {
              precio: parseFloat((item['P.V.P FINAL CLIENTE'] || '0').toString().replace(',', '.')) || 0
            };
            
            if (proveedorId) datosActualizacion.proveedor = proveedorId;
            
            await pb.collection('productos').update(existentes.items[0].id, datosActualizacion);
            resultado.actualizados++;
            await actualizarLog(importacionId, `Precio actualizado: ${item['CÓDIGO']}`);
          } else {
            // Si el producto no existe, crearlo con la información mínima
            const nuevoProducto = await pb.collection('productos').create({
              nombre: `Producto ${item['CÓDIGO'] || 'nuevo'}`,
              codigo: item['CÓDIGO'],
              precio: parseFloat((item['P.V.P FINAL CLIENTE'] || '0').toString().replace(',', '.')) || 0,
              proveedor: proveedorId,
              activo: true,
              fecha_alta: new Date().toISOString()
            });
            resultado.creados++;
            await actualizarLog(importacionId, `Producto creado con precio: ${item['CÓDIGO']} (ID: ${nuevoProducto.id})`);
          }
        } catch (error) {
          console.error(`Error al actualizar precio ${item['CÓDIGO'] || 'sin código'}:`, error);
          resultado.errores++;
          resultado.errores_detalle.push({
            codigo: item['CÓDIGO'] || 'sin código',
            error: error.message
          });
          await actualizarLog(importacionId, `Error en actualización de precio ${item['CÓDIGO'] || 'sin código'}: ${error.message}`);
        }
      }
    } else if (tipo === 'stock') {
      // Para stock, intentaremos actualizar el campo stock si existe, o añadirlo como nota al nombre
      for (const item of datos) {
        try {
          // Saltar filas sin código
          if (!item['CÓDIGO']) {
            continue;
          }
          
          let existentes = [];
          existentes = await pb.collection('productos').getList(1, 1, {
            filter: `codigo = "${item['CÓDIGO']}"`
          });
          
          if (existentes.items && existentes.items.length > 0) {
            // Intentar actualizar el stock si el campo existe, o añadirlo al nombre
            const productoExistente = existentes.items[0];
            const datosActualizacion = {};
            
            // Si el producto tiene un campo stock, lo actualizamos
            datosActualizacion.stock = parseInt(item['STOCK'] || item['UNID.'] || '0', 10);
            
            if (proveedorId) datosActualizacion.proveedor = proveedorId;
            
            await pb.collection('productos').update(productoExistente.id, datosActualizacion);
            resultado.actualizados++;
            await actualizarLog(importacionId, `Stock actualizado: ${item['CÓDIGO']}`);
          } else {
            // Si el producto no existe, crearlo con la información mínima
            const nuevoProducto = await pb.collection('productos').create({
              nombre: `Producto ${item['CÓDIGO'] || 'nuevo'}`,
              codigo: item['CÓDIGO'],
              stock: parseInt(item['STOCK'] || item['UNID.'] || '0', 10),
              precio: 0,
              proveedor: proveedorId,
              activo: true,
              fecha_alta: new Date().toISOString()
            });
            resultado.creados++;
            await actualizarLog(importacionId, `Producto creado con stock: ${item['CÓDIGO']} (ID: ${nuevoProducto.id})`);
          }
        } catch (error) {
          console.error(`Error al actualizar stock ${item['CÓDIGO'] || 'sin código'}:`, error);
          resultado.errores++;
          resultado.errores_detalle.push({
            codigo: item['CÓDIGO'] || 'sin código',
            error: error.message
          });
          await actualizarLog(importacionId, `Error en actualización de stock ${item['CÓDIGO'] || 'sin código'}: ${error.message}`);
        }
      }
    }

    // Añadir resumen de devoluciones si hay
    if (resultado.devoluciones > 0) {
      await actualizarLog(importacionId, `Se registraron ${resultado.devoluciones} devoluciones durante la importación`);
    }

    return resultado;
  } catch (error) {
    console.error('Error al importar a base de datos:', error);
    return {
      exito: false,
      error: error.message
    };
  }
}

// Parser genérico para cualquier proveedor
async function parserGenerico(datos, tipo) {
  console.log('Utilizando parser genérico');
  
  try {
    // Verificar si hay datos
    if (!datos || datos.length === 0) {
      console.error('No hay datos para procesar');
      return [];
    }
    
    console.log(`Procesando ${datos.length} filas con parser genérico`);
    
    // Normalizar nombres de columnas
    const columnas = Object.keys(datos[0]);
    const mapeoColumnas = {};
    
    // Mapeo de nombres de columnas comunes
    for (const col of columnas) {
      const colUpper = col.toUpperCase();
      
      if (colUpper.includes('CÓDIGO') || colUpper.includes('COD') || colUpper.includes('REFERENCIA')) {
        mapeoColumnas['CÓDIGO'] = col;
      } else if (colUpper.includes('DESCRIPCIÓN') || colUpper.includes('DESC') || colUpper.includes('NOMBRE')) {
        mapeoColumnas['DESCRIPCIÓN'] = col;
      } else if (colUpper.includes('PVP') || colUpper.includes('PRECIO') || colUpper.includes('P.V.P')) {
        mapeoColumnas['P.V.P FINAL CLIENTE'] = col;
      } else if (colUpper.includes('COSTE') || colUpper.includes('COSTO') || colUpper.includes('BRUTO')) {
        mapeoColumnas['IMPORTE BRUTO'] = col;
      } else if (colUpper.includes('STOCK') || colUpper.includes('UNID') || colUpper.includes('CANTIDAD')) {
        mapeoColumnas['STOCK'] = col;
      } else if (colUpper.includes('NOTA') || colUpper.includes('OBSERV')) {
        mapeoColumnas['OBSERVACIONES'] = col;
      }
    }
    
    console.log('Mapeo de columnas:', mapeoColumnas);
    
    // Procesar cada fila
    return datos.map(fila => {
      const resultado = {};
      
      // Aplicar mapeo de columnas
      for (const [clave, valor] of Object.entries(mapeoColumnas)) {
        if (fila[valor] !== undefined) {
          resultado[clave] = fila[valor];
        }
      }
      
      // Copiar columnas no mapeadas
      for (const col of columnas) {
        if (!Object.values(mapeoColumnas).includes(col) && fila[col] !== undefined) {
          resultado[col] = fila[col];
        }
      }
      
      return resultado;
    });
  } catch (error) {
    console.error('Error en parser genérico:', error);
    return [];
  }
}

// Parsers específicos para cada proveedor
async function parseCecotec(datos, tipo) {
  console.log('Utilizando parser específico para CECOTEC');
  return await parserGenerico(datos, tipo);
}

async function parseBSH(datos, tipo) {
  console.log('Utilizando parser específico para BSH');
  return await parserGenerico(datos, tipo);
}

// Implementar los demás parsers específicos con la misma estructura
async function parseJata(datos, tipo) {
  console.log('Utilizando parser específico para JATA');
  return await parserGenerico(datos, tipo);
}

async function parseOrbegozo(datos, tipo) {
  console.log('Utilizando parser específico para ORBEGOZO');
  return await parserGenerico(datos, tipo);
}

async function parseAlfadyser(datos, tipo) {
  console.log('Utilizando parser específico para ALFADYSER');
  return await parserGenerico(datos, tipo);
}

async function parseVitrokitchen(datos, tipo) {
  console.log('Utilizando parser específico para VITROKITCHEN');
  return await parserGenerico(datos, tipo);
}

async function parseElectrodirecto(datos, tipo) {
  console.log('Utilizando parser específico para ELECTRODIRECTO');
  return await parserGenerico(datos, tipo);
}

// Ejecutar inicialización de categorías al cargar el módulo
inicializarCategoriasPredefinidas().then(() => {
  console.log('Inicialización de categorías completada.');
}).catch(error => {
  console.error('Error en inicialización de categorías:', error);
});

// Exportar funciones principales
export {
  importarDatos,
  leerCSV,
  leerExcel,
  obtenerIdProveedor,
  obtenerProveedorPorNombre,
  actualizarImportacion,
  actualizarLog,
  detectarCategorias,
  asignarCategoria,
  crearCategoria,
  inicializarCategoriasPredefinidas,
  analizarNota,
  registrarDevolucion,
  importarABaseDeDatos,
  parserGenerico,
  parseCecotec,
  parseBSH,
  parseJata,
  parseOrbegozo,
  parseAlfadyser,
  parseVitrokitchen,
  parseElectrodirecto
};
