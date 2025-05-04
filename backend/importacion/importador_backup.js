/**
 * Sistema de importación para El Pelotazo
 * Este módulo maneja la importación de datos desde diferentes formatos y proveedores
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import PocketBase from 'pocketbase';

// Inicializar PocketBase
const pb = new PocketBase('http://localhost:8095');

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
      await pb.admins.authWithPassword('yo@mail.com', 'Ninami12$ya');
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
    
    // Buscar si el proveedor ya existe
    const proveedores = await pb.collection('proveedores').getList(1, 1, {
      filter: `nombre = "${nombreProveedor}"`
    });
    
    if (proveedores.items.length > 0) {
      console.log(`Proveedor encontrado con ID: ${proveedores.items[0].id}`);
      return proveedores.items[0].id;
    }
    
    // Si no existe, crear un nuevo proveedor
    console.log(`Creando nuevo proveedor: ${nombreProveedor}`);
    const nuevoProveedor = await pb.collection('proveedores').create({
      nombre: nombreProveedor,
      activo: true,
      fecha_alta: new Date().toISOString()
    });
    
    console.log(`Nuevo proveedor creado con ID: ${nuevoProveedor.id}`);
    return nuevoProveedor.id;
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
    
    // Buscar el proveedor en la colección de proveedores
    const proveedores = await pb.collection('proveedores').getList(1, 1, {
      filter: `nombre ~ "${nombreNormalizado}"`
    });
    
    if (proveedores.items.length > 0) {
      console.log(`Proveedor encontrado: ${proveedores.items[0].id}`);
      return proveedores.items[0];
    } else {
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
    return await pb.collection('importaciones').update(importacionId, {
      estado: estado,
      resultado: JSON.stringify(resultado),
      fecha_actualizacion: new Date().toISOString()
    });
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
    
    return await pb.collection('importaciones').update(importacionId, {
      log: nuevoLog
    });
  } catch (error) {
    console.error(`Error al actualizar log de importación ${importacionId}:`, error);
  }
}

// Función para detectar categorías en datos
async function detectarCategorias(datos) {
  const categorias = new Map();
  
  try {
    // Verificar si existe la colección de categorías
    let categoriasExistentes = [];
    let nombresCategorias = new Set();
    
    try {
      // Primero verificar si ya existen categorías en la base de datos
      const result = await pb.collection('categorias').getList(1, 100);
      categoriasExistentes = result.items;
      nombresCategorias = new Set(categoriasExistentes.map(cat => cat.nombre.toUpperCase()));
      console.log(`Categorías existentes en BD: ${nombresCategorias.size}`);
    } catch (error) {
      // Si hay error, puede que la colección no exista
      console.error('Error al obtener categorías:', error);
      
      // Intentar crear la colección si no existe
      try {
        console.log('Intentando crear colección de categorías...');
        // Nota: Esta parte solo funcionaría si tienes permisos para crear colecciones
        // En un entorno real, deberías crear la colección manualmente en PocketBase
      } catch (createError) {
        console.error('No se pudo crear la colección:', createError);
      }
    }
    
    // Categorías predefinidas para asegurar que existan las básicas
    const categoriasPredefinidas = [
      'FRIGORÍFICOS', 'LAVADORAS', 'LAVAVAJILLAS', 'SECADORAS', 'HORNOS', 
      'CAFETERAS', 'ASPIRADORES', 'BATIDORAS', 'PLANCHAS', 'BÁSCULAS',
      'MICROONDAS', 'PLACAS', 'CAMPANAS', 'PEQUEÑO ELECTRODOMÉSTICO', 'OTROS'
    ];
    
    // Crear categorías predefinidas si no existen
    for (const nombreCategoria of categoriasPredefinidas) {
      if (!nombresCategorias.has(nombreCategoria.toUpperCase())) {
        try {
          const nuevaCategoria = await pb.collection('categorias').create({
            nombre: nombreCategoria,
            descripcion: `Categoría predefinida`
          });
          console.log(`Categoría predefinida creada: ${nuevaCategoria.nombre} (ID: ${nuevaCategoria.id})`);
          nombresCategorias.add(nombreCategoria.toUpperCase());
        } catch (error) {
          console.error(`Error al crear categoría predefinida ${nombreCategoria}:`, error);
        }
      }
    }
    
    // Recorrer los datos buscando posibles categorías
    for (let i = 0; i < datos.length; i++) {
      const item = datos[i];
      
      // Verificar si es una fila de categoría (sin código, con descripción en mayúsculas)
      if ((!item['CÓDIGO'] || item['CÓDIGO'].trim() === '') && 
          item['DESCRIPCIÓN'] && 
          item['DESCRIPCIÓN'] === item['DESCRIPCIÓN'].toUpperCase() &&
          (!item['IMPORTE BRUTO'] || item['IMPORTE BRUTO'].trim() === '')) {
        
        const nombreCategoria = item['DESCRIPCIÓN'].trim();
        
        // Registrar la posición de la categoría en el archivo
        categorias.set(i, nombreCategoria);
        
        // Si la categoría no existe en la BD, crearla
        if (!nombresCategorias.has(nombreCategoria.toUpperCase())) {
          try {
            const nuevaCategoria = await pb.collection('categorias').create({
              nombre: nombreCategoria,
              descripcion: `Categoría detectada automáticamente en importación`
            });
            console.log(`Categoría creada: ${nuevaCategoria.nombre} (ID: ${nuevaCategoria.id})`);
            nombresCategorias.add(nombreCategoria.toUpperCase());
          } catch (error) {
            console.error(`Error al crear categoría ${nombreCategoria}:`, error);
          }
        }
      }
    }
    
    // Si no se detectaron categorías en el archivo, usar las predefinidas
    if (categorias.size === 0) {
      console.log('No se detectaron categorías en el archivo, usando predefinidas');
      // Asignar categorías predefinidas a posiciones ficticias para que puedan ser usadas
      categoriasPredefinidas.forEach((cat, idx) => {
        categorias.set(-100 - idx, cat); // Usar índices negativos para no colisionar
      });
    }
    
    return categorias;
  } catch (error) {
    console.error('Error al detectar categorías:', error);
    return new Map(); // Devolver mapa vacío en caso de error
  }
}

// Función para asignar categoría a un producto basado en su posición
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
    
    // Si no se encontró categoría por posición, intentar buscar por palabras clave
    if (!categoriaAsignada && nombreProducto) {
      // Mapeo directo de palabras clave a categorías
      const mapeoCategoriasDirectas = {
        'FRIGORÍFICO': 'FRIGORÍFICOS',
        'FRIGORIFICO': 'FRIGORÍFICOS',
        'COMBI': 'FRIGORÍFICOS',
        'LAVADORA': 'LAVADORAS',
        'LAVAVAJILLAS': 'LAVAVAJILLAS',
        'SECADORA': 'SECADORAS',
        'HORNO': 'HORNOS',
        'CAFETERA': 'CAFETERAS',
        'CAFÉ': 'CAFETERAS',
        'CAFE': 'CAFETERAS',
        'ASPIRADOR': 'ASPIRADORES',
        'CONGA': 'ASPIRADORES',
        'BATIDORA': 'BATIDORAS',
        'PLANCHA': 'PLANCHAS',
        'BÁSCULA': 'BÁSCULAS',
        'BASCULA': 'BÁSCULAS',
        'MICROONDAS': 'MICROONDAS',
        'PLACA': 'PLACAS',
        'VITROCERÁMICA': 'PLACAS',
        'VITROCERAMICA': 'PLACAS',
        'INDUCCIÓN': 'PLACAS',
        'INDUCCION': 'PLACAS',
        'CAMPANA': 'CAMPANAS'
      };
      
      // Convertir el nombre a mayúsculas para comparar
      const nombreUpper = nombreProducto.toUpperCase();
      
      // Buscar coincidencias directas
      for (const [keyword, categoria] of Object.entries(mapeoCategoriasDirectas)) {
        if (nombreUpper.includes(keyword)) {
          categoriaAsignada = categoria;
          break;
        }
      }
      
      // Si encontramos una coincidencia directa, buscar su ID
      if (categoriaAsignada) {
        try {
          const categoriaDB = await pb.collection('categorias').getFirstListItem(`nombre="${categoriaAsignada}"`);
          return categoriaDB.id;
        } catch (error) {
          console.error(`Error al buscar categoría por palabra clave ${categoriaAsignada}:`, error);
          
          // Intentar crear la categoría si no existe
          try {
            const nuevaCategoria = await pb.collection('categorias').create({
              nombre: categoriaAsignada,
              descripcion: `Categoría detectada automáticamente por palabra clave`
            });
            console.log(`Categoría creada por palabra clave: ${nuevaCategoria.nombre} (ID: ${nuevaCategoria.id})`);
            return nuevaCategoria.id;
          } catch (createError) {
            console.error(`Error al crear categoría ${categoriaAsignada}:`, createError);
          }
        }
      }
      
      // Si no hay coincidencia directa, buscar en la base de datos
      try {
        const categoriasDB = await pb.collection('categorias').getList(1, 100);
        
        // Buscar coincidencias en el nombre del producto
        for (const categoria of categoriasDB.items) {
          const palabrasClave = categoria.nombre.split(' ');
          for (const palabra of palabrasClave) {
            if (palabra.length > 3 && nombreUpper.includes(palabra.toUpperCase())) {
              // Encontramos una coincidencia
              return categoria.id;
            }
          }
        }
      } catch (error) {
        console.error('Error al buscar categorías en BD:', error);
      }
    }
    
    // Si encontramos una categoría por posición, buscar su ID en la base de datos
    if (categoriaAsignada) {
      try {
        const categoriaDB = await pb.collection('categorias').getFirstListItem(`nombre="${categoriaAsignada}"`);
        return categoriaDB.id;
      } catch (error) {
        console.error(`Error al buscar categoría ${categoriaAsignada}:`, error);
        
        // Intentar crear la categoría si no existe
        try {
          const nuevaCategoria = await pb.collection('categorias').create({
            nombre: categoriaAsignada,
            descripcion: `Categoría detectada automáticamente por posición`
          });
          console.log(`Categoría creada por posición: ${nuevaCategoria.nombre} (ID: ${nuevaCategoria.id})`);
          return nuevaCategoria.id;
        } catch (createError) {
          console.error(`Error al crear categoría ${categoriaAsignada}:`, createError);
        }
      }
    }
    
    // Si no se pudo asignar ninguna categoría, usar la categoría "OTROS"
    try {
      const otrosCategoria = await pb.collection('categorias').getFirstListItem(`nombre="OTROS"`);
      return otrosCategoria.id;
    } catch (error) {
      console.error('Error al buscar categoría OTROS:', error);
      
      // Intentar crear la categoría OTROS si no existe
      try {
        const nuevaCategoria = await pb.collection('categorias').create({
          nombre: 'OTROS',
          descripcion: `Categoría por defecto`
        });
        console.log(`Categoría OTROS creada: (ID: ${nuevaCategoria.id})`);
        return nuevaCategoria.id;
      } catch (createError) {
        console.error('Error al crear categoría OTROS:', createError);
      }
    }
    
    return null; // Si no se pudo asignar categoría
  } catch (error) {
    console.error('Error al asignar categoría:', error);
    return null;
  }
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
              (!productoOriginal['IMPORTE BRUTO'] || productoOriginal['IMPORTE BRUTO'].trim() === '')) {
            
            // Es un encabezado de categoría, no un producto
            continue;
          }
          
          // Saltar filas sin código o descripción
          if (!productoOriginal['CÓDIGO'] || !productoOriginal['DESCRIPCIÓN']) {
            continue;
          }
          
          // Crear un objeto con solo los campos que sabemos que existen en la colección
          // Basado en la migración, solo tenemos nombre y precio
          const producto = {
            nombre: productoOriginal['DESCRIPCIÓN'] || `Producto ${productoOriginal['CÓDIGO']}`,
            precio: parseFloat((productoOriginal['P.V.P FINAL CLIENTE'] || '0').toString().replace(',', '.')) || 0
          };
          
          // Intentar añadir otros campos si existen en la estructura actual
          if (productoOriginal['CÓDIGO']) producto.codigo = productoOriginal['CÓDIGO'];
          if (productoOriginal['DESCRIPCIÓN']) producto.descripcion = productoOriginal['DESCRIPCIÓN'];
          
          // Extraer precio de coste
          if (productoOriginal['IMPORTE BRUTO']) {
            producto.precio_coste = parseFloat((productoOriginal['IMPORTE BRUTO'] || '0').toString().replace(',', '.')) || 0;
          }
          
          // Extraer stock
          if (productoOriginal['UNID.'] || productoOriginal['STOCK']) {
            producto.stock = parseInt(productoOriginal['UNID.'] || productoOriginal['STOCK'] || '0', 10);
          }
          
          // Asignar categoría basada en la posición o el nombre
          producto.categoria = await asignarCategoria(i, categorias, productoOriginal['DESCRIPCIÓN']);
          
          // Extraer marca si está disponible
          if (productoOriginal['MARCA']) {
            producto.marca = productoOriginal['MARCA'];
          } else {
            // Intentar extraer marca del nombre
            const descripcion = productoOriginal['DESCRIPCIÓN'] || '';
            const marcaMatch = descripcion.match(/\(([^)]+)\)/);
            if (marcaMatch && marcaMatch[1]) {
              producto.marca = marcaMatch[1].trim();
            }
          }
          
          // Asignar proveedor
          if (proveedorId) producto.proveedor = proveedorId;
          
          // Buscar notas en columnas específicas
          let notasTexto = '';
          const posiblesColumnasNotas = ['OBSERVACIONES', 'NOTAS', 'QUEDAN EN TIENDA', 'ABONO'];
          
          for (const columna of posiblesColumnasNotas) {
            if (productoOriginal[columna] && productoOriginal[columna].trim() !== '') {
              notasTexto += productoOriginal[columna].trim() + ' ';
            }
          }
          
          producto.notas = notasTexto.trim();
          
          // Analizar notas para detectar abonos/devoluciones
          if (producto.notas) {
            const analisisNota = analizarNota(producto.notas);
            
            if (analisisNota && analisisNota.esAbono) {
              // Registrar devolución
              const devolucionId = await registrarDevolucion(producto, analisisNota, proveedorId, importacionId);
              
              if (devolucionId) {
                resultado.devoluciones++;
                // Marcar el producto como devuelto en su estado
                producto.estado = 'devuelto';
                producto.devolucion_id = devolucionId;
              }
            }
          }
          
          // Verificar si el producto ya existe por su código
          let existentes = [];
          if (producto.codigo) {
            existentes = await pb.collection('productos').getList(1, 1, {
              filter: `codigo = "${producto.codigo}"`
            });
          }
          
          if (existentes.items && existentes.items.length > 0) {
            // Actualizar producto existente
            const productoActualizado = await pb.collection('productos').update(existentes.items[0].id, producto);
            resultado.actualizados++;
            await actualizarLog(importacionId, `Producto actualizado: ${producto.codigo} - ${producto.nombre} (ID: ${productoActualizado.id})`);
          } else {
            // Crear nuevo producto
            const nuevoProducto = await pb.collection('productos').create(producto);
            resultado.creados++;
            await actualizarLog(importacionId, `Producto creado: ${producto.codigo} - ${producto.nombre} (ID: ${nuevoProducto.id})`);
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
            
            // Añadir precio_coste si existe en la estructura
            if (item['IMPORTE BRUTO']) {
              datosActualizacion.precio_coste = parseFloat((item['IMPORTE BRUTO'] || '0').toString().replace(',', '.')) || 0;
            }
            
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
              precio_coste: parseFloat((item['IMPORTE BRUTO'] || '0').toString().replace(',', '.')) || 0,
              proveedor: proveedorId
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
              proveedor: proveedorId
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

// Función para crear una categoría en PocketBase
async function crearCategoria(nombre, descripcion = 'Categoría creada automáticamente') {
  try {
    // Normalizar el nombre (quitar espacios extras, convertir a mayúsculas)
    const nombreNormalizado = nombre.trim().toUpperCase();
    
    // Verificar si ya existe
    try {
      const categoriaExistente = await pb.collection('categorias').getFirstListItem(`nombre~"${nombreNormalizado}"`);
      console.log(`Categoría ya existe: ${categoriaExistente.nombre} (ID: ${categoriaExistente.id})`);
      return categoriaExistente;
    } catch (error) {
      // Si no existe, crearla
      console.log(`Creando nueva categoría: ${nombreNormalizado}`);
      const nuevaCategoria = await pb.collection('categorias').create({
        nombre: nombreNormalizado,
        descripcion: descripcion
      });
      console.log(`Categoría creada: ${nuevaCategoria.nombre} (ID: ${nuevaCategoria.id})`);
      return nuevaCategoria;
    }
  } catch (error) {
    console.error(`Error al crear categoría ${nombre}:`, error);
    return null;
  }
}

// Función para inicializar categorías predefinidas
async function inicializarCategoriasPredefinidas() {
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
}

// Ejecutar inicialización de categorías
inicializarCategoriasPredefinidas().then(() => {
  console.log('Inicialización de categorías completada.');
}).catch(error => {
  console.error('Error en inicialización de categorías:', error);
});

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
              (!productoOriginal['IMPORTE BRUTO'] || productoOriginal['IMPORTE BRUTO'].trim() === '')) {
            
            // Es un encabezado de categoría, no un producto
            continue;
          }
          
          // Saltar filas sin código o descripción
          if (!productoOriginal['CÓDIGO'] || !productoOriginal['DESCRIPCIÓN']) {
            continue;
          }
          
          // Crear un objeto con solo los campos que sabemos que existen en la colección
          // Basado en la migración, solo tenemos nombre y precio
          const producto = {
            nombre: productoOriginal['DESCRIPCIÓN'] || `Producto ${productoOriginal['CÓDIGO']}`,
            precio: parseFloat((productoOriginal['P.V.P FINAL CLIENTE'] || '0').toString().replace(',', '.')) || 0
          };
          
          // Intentar añadir otros campos si existen en la estructura actual
          if (productoOriginal['CÓDIGO']) producto.codigo = productoOriginal['CÓDIGO'];
          if (productoOriginal['DESCRIPCIÓN']) producto.descripcion = productoOriginal['DESCRIPCIÓN'];
          
          // Extraer precio de coste
          if (productoOriginal['IMPORTE BRUTO']) {
            producto.precio_coste = parseFloat((productoOriginal['IMPORTE BRUTO'] || '0').toString().replace(',', '.')) || 0;
          }
          
          // Extraer stock
          if (productoOriginal['UNID.'] || productoOriginal['STOCK']) {
            producto.stock = parseInt(productoOriginal['UNID.'] || productoOriginal['STOCK'] || '0', 10);
          }
          
          // Asignar categoría basada en la posición o el nombre
          producto.categoria = await asignarCategoria(i, categorias, productoOriginal['DESCRIPCIÓN']);
          
          // Extraer marca si está disponible
          if (productoOriginal['MARCA']) {
            producto.marca = productoOriginal['MARCA'];
          } else {
            // Intentar extraer marca del nombre
            const descripcion = productoOriginal['DESCRIPCIÓN'] || '';
            const marcaMatch = descripcion.match(/\(([^)]+)\)/);
            if (marcaMatch && marcaMatch[1]) {
              producto.marca = marcaMatch[1].trim();
            }
          }
          
          // Asignar proveedor
          if (proveedorId) producto.proveedor = proveedorId;
          
          // Buscar notas en columnas específicas
          let notasTexto = '';
          const posiblesColumnasNotas = ['OBSERVACIONES', 'NOTAS', 'QUEDAN EN TIENDA', 'ABONO'];
          
          for (const columna of posiblesColumnasNotas) {
            if (productoOriginal[columna] && productoOriginal[columna].trim() !== '') {
              notasTexto += productoOriginal[columna].trim() + ' ';
            }
          }
          
          producto.notas = notasTexto.trim();
          
          // Analizar notas para detectar abonos/devoluciones
          if (producto.notas) {
            const analisisNota = analizarNota(producto.notas);
            
            if (analisisNota && analisisNota.esAbono) {
              // Registrar devolución
              const devolucionId = await registrarDevolucion(producto, analisisNota, proveedorId, importacionId);
              
              if (devolucionId) {
                resultado.devoluciones++;
                // Marcar el producto como devuelto en su estado
                producto.estado = 'devuelto';
                producto.devolucion_id = devolucionId;
              }
            }
          }
          
          // Verificar si el producto ya existe por su código
          let existentes = [];
          if (producto.codigo) {
            existentes = await pb.collection('productos').getList(1, 1, {
              filter: `codigo = "${producto.codigo}"`
            });
          }
          
          if (existentes.items && existentes.items.length > 0) {
            // Actualizar producto existente
            const productoActualizado = await pb.collection('productos').update(existentes.items[0].id, producto);
            resultado.actualizados++;
            await actualizarLog(importacionId, `Producto actualizado: ${producto.codigo} - ${producto.nombre} (ID: ${productoActualizado.id})`);
          } else {
            // Crear nuevo producto
            const nuevoProducto = await pb.collection('productos').create(producto);
            resultado.creados++;
            await actualizarLog(importacionId, `Producto creado: ${producto.codigo} - ${producto.nombre} (ID: ${nuevoProducto.id})`);
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
            
            // Añadir precio_coste si existe en la estructura
            if (item['IMPORTE BRUTO']) {
              datosActualizacion.precio_coste = parseFloat((item['IMPORTE BRUTO'] || '0').toString().replace(',', '.')) || 0;
            }
            
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
              precio_coste: parseFloat((item['IMPORTE BRUTO'] || '0').toString().replace(',', '.')) || 0,
              proveedor: proveedorId
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
              proveedor: proveedorId
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

// Función para crear una categoría en PocketBase
async function crearCategoria(nombre, descripcion = 'Categoría creada automáticamente') {
  try {
    // Normalizar el nombre (quitar espacios extras, convertir a mayúsculas)
    const nombreNormalizado = nombre.trim().toUpperCase();
    
    // Verificar si ya existe
    try {
      const categoriaExistente = await pb.collection('categorias').getFirstListItem(`nombre~"${nombreNormalizado}"`);
      console.log(`Categoría ya existe: ${categoriaExistente.nombre} (ID: ${categoriaExistente.id})`);
      return categoriaExistente;
    } catch (error) {
      // Si no existe, crearla
      console.log(`Creando nueva categoría: ${nombreNormalizado}`);
      const nuevaCategoria = await pb.collection('categorias').create({
        nombre: nombreNormalizado,
        descripcion: descripcion
      });
      console.log(`Categoría creada: ${nuevaCategoria.nombre} (ID: ${nuevaCategoria.id})`);
      return nuevaCategoria;
    }
  } catch (error) {
    console.error(`Error al crear categoría ${nombre}:`, error);
    return null;
  }
}

// Función para inicializar categorías predefinidas
async function inicializarCategoriasPredefinidas() {
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
}

// Ejecutar inicialización de categorías
inicializarCategoriasPredefinidas().then(() => {
  console.log('Inicialización de categorías completada.');
}).catch(error => {
  console.error('Error en inicialización de categorías:', error);
});

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
              (!productoOriginal['IMPORTE BRUTO'] || productoOriginal['IMPORTE BRUTO'].trim() === '')) {
            
            // Es un encabezado de categoría, no un producto
            continue;
          }
          
          // Saltar filas sin código o descripción
          if (!productoOriginal['CÓDIGO'] || !productoOriginal['DESCRIPCIÓN']) {
            continue;
          }
          
          // Crear un objeto con solo los campos que sabemos que existen en la colección
          // Basado en la migración, solo tenemos nombre y precio
          const producto = {
            nombre: productoOriginal['DESCRIPCIÓN'] || `Producto ${productoOriginal['CÓDIGO']}`,
            precio: parseFloat((productoOriginal['P.V.P FINAL CLIENTE'] || '0').toString().replace(',', '.')) || 0
          };
          
          // Intentar añadir otros campos si existen en la estructura actual
          if (productoOriginal['CÓDIGO']) producto.codigo = productoOriginal['CÓDIGO'];
          if (productoOriginal['DESCRIPCIÓN']) producto.descripcion = productoOriginal['DESCRIPCIÓN'];
          
          // Extraer precio de coste
          if (productoOriginal['IMPORTE BRUTO']) {
            producto.precio_coste = parseFloat((productoOriginal['IMPORTE BRUTO'] || '0').toString().replace(',', '.')) || 0;
          }
          
          // Extraer stock
          if (productoOriginal['UNID.'] || productoOriginal['STOCK']) {
            producto.stock = parseInt(productoOriginal['UNID.'] || productoOriginal['STOCK'] || '0', 10);
          }
          
          // Asignar categoría basada en la posición o el nombre
          producto.categoria = await asignarCategoria(i, categorias, productoOriginal['DESCRIPCIÓN']);
          
          // Extraer marca si está disponible
          if (productoOriginal['MARCA']) {
            producto.marca = productoOriginal['MARCA'];
          } else {
            // Intentar extraer marca del nombre
            const descripcion = productoOriginal['DESCRIPCIÓN'] || '';
            const marcaMatch = descripcion.match(/\(([^)]+)\)/);
            if (marcaMatch && marcaMatch[1]) {
              producto.marca = marcaMatch[1].trim();
            }
          }
          
          // Asignar proveedor
          if (proveedorId) producto.proveedor = proveedorId;
          
          // Buscar notas en columnas específicas
          let notasTexto = '';
          const posiblesColumnasNotas = ['OBSERVACIONES', 'NOTAS', 'QUEDAN EN TIENDA', 'ABONO'];
          
          for (const columna of posiblesColumnasNotas) {
            if (productoOriginal[columna] && productoOriginal[columna].trim() !== '') {
              notasTexto += productoOriginal[columna].trim() + ' ';
            }
          }
          
          producto.notas = notasTexto.trim();
          
          // Analizar notas para detectar abonos/devoluciones
          if (producto.notas) {
            const analisisNota = analizarNota(producto.notas);
            
            if (analisisNota && analisisNota.esAbono) {
              // Registrar devolución
              const devolucionId = await registrarDevolucion(producto, analisisNota, proveedorId, importacionId);
              
              if (devolucionId) {
                resultado.devoluciones++;
                // Marcar el producto como devuelto en su estado
                producto.estado = 'devuelto';
                producto.devolucion_id = devolucionId;
              }
            }
          }
          
          // Verificar si el producto ya existe por su código
          let existentes = [];
          if (producto.codigo) {
            existentes = await pb.collection('productos').getList(1, 1, {
              filter: `codigo = "${producto.codigo}"`
            });
          }
          
          if (existentes.items && existentes.items.length > 0) {
            // Actualizar producto existente
            const productoActualizado = await pb.collection('productos').update(existentes.items[0].id, producto);
            resultado.actualizados++;
            await actualizarLog(importacionId, `Producto actualizado: ${producto.codigo} - ${producto.nombre} (ID: ${productoActualizado.id})`);
          } else {
            // Crear nuevo producto
            const nuevoProducto = await pb.collection('productos').create(producto);
            resultado.creados++;
            await actualizarLog(importacionId, `Producto creado: ${producto.codigo} - ${producto.nombre} (ID: ${nuevoProducto.id})`);
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
            
            // Añadir precio_coste si existe en la estructura
            if (item['IMPORTE BRUTO']) {
              datosActualizacion.precio_coste = parseFloat((item['IMPORTE BRUTO'] || '0').toString().replace(',', '.')) || 0;
            }
            
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
              precio_coste: parseFloat((item['IMPORTE BRUTO'] || '0').toString().replace(',', '.')) || 0,
              proveedor: proveedorId
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
              proveedor: proveedorId
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
  
  // Detectar categorías en los datos
  const categorias = await detectarCategorias(datos);
  console.log(`Se detectaron ${categorias.size} categorías en parser genérico`);
  
  if (tipo === 'productos') {
    // Usamos Promise.all con map para manejar operaciones asíncronas
    return Promise.all(datos.map(async (item, indice) => {
      // Intentar encontrar los campos de código, descripción y precio en diferentes formatos
      const codigo = item['CÓDIGO'] || item['REFERENCIA'] || item['COD'] || item['CODIGO'] || item['codigo'] || '';
      const descripcion = item['DESCRIPCIÓN'] || item['NOMBRE'] || item['PRODUCTO'] || item['descripcion'] || '';
      
      // Si no hay código o descripción, saltar
      if (!codigo || !descripcion) {
        return null;
      }
      
      // Crear un objeto con solo los campos que sabemos que existen en la colección
      // Basado en la migración, solo tenemos nombre y precio
      const producto = {
        nombre: descripcion,
        precio: parseFloat((item['P.V.P FINAL CLIENTE'] || '0').toString().replace(',', '.')) || 0
      };
      
      // Intentar añadir otros campos si existen en la estructura actual
      if (item['CÓDIGO']) producto.codigo = item['CÓDIGO'];
      if (item['DESCRIPCIÓN']) producto.descripcion = item['DESCRIPCIÓN'];
      
      // Extraer precio de coste
      if (item['IMPORTE BRUTO']) {
        producto.precio_coste = parseFloat((item['IMPORTE BRUTO'] || '0').toString().replace(',', '.')) || 0;
      }
      
      // Extraer stock
      if (item['UNID.'] || item['STOCK']) {
        producto.stock = parseInt(item['UNID.'] || item['STOCK'] || '0', 10);
      }
      
      // Asignar categoría basada en la posición o el nombre
      producto.categoria = await asignarCategoria(indice, categorias, descripcion);
      
      // Extraer marca si está disponible
      if (item['MARCA']) {
        producto.marca = item['MARCA'];
      } else {
        // Intentar extraer marca del nombre
        const marcaMatch = descripcion.match(/\(([^)]+)\)/);
        if (marcaMatch && marcaMatch[1]) {
          producto.marca = marcaMatch[1].trim();
        }
      }
      
      // Buscar notas en columnas específicas
      let notas = '';
      const posiblesColumnasNotas = ['OBSERVACIONES', 'NOTAS', 'QUEDAN EN TIENDA', 'ABONO', 'COMENTARIOS', 'notas'];
      
      for (const columna of posiblesColumnasNotas) {
        if (item[columna] && item[columna].toString().trim() !== '') {
          notas += item[columna].toString().trim() + ' ';
        }
      }
      
      return {
        ...producto,
        notas: notas.trim()
      };
    }));
  } else if (tipo === 'precios') {
    return datos.map(item => {
      if (!item['CÓDIGO'] || !item['IMPORTE BRUTO']) {
        return null;
      }
      
      // Extraer precio venta público si existe
      let precioVenta = 0;
      if (item['P.V.P FINAL CLIENTE']) {
        precioVenta = parseFloat((item['P.V.P FINAL CLIENTE'] || '0').toString().replace(',', '.')) || 0;
      } else if (item['PVP']) {
        precioVenta = parseFloat((item['PVP'] || '0').toString().replace(',', '.')) || 0;
      }
      
      return {
        codigo: item['CÓDIGO'] || '',
        precio_coste: parseFloat((item['IMPORTE BRUTO'] || '0').toString().replace(',', '.')) || 0,
        precio_venta: precioVenta,
        precio: precioVenta // Campo que existe en la base de datos
      };
    }).filter(item => item !== null);
  } else if (tipo === 'stock') {
    return datos.map(item => {
      if (!item['CÓDIGO']) {
        return null;
      }
      
      return {
        codigo: item['CÓDIGO'] || '',
        stock: parseInt(item['STOCK'] || item['UNID.'] || '0', 10)
      };
    }).filter(item => item !== null);
  }
  
  return [];
}

// Parsers específicos para cada proveedor
async function parseCecotec(datos, tipo) {
  console.log('Procesando datos de CECOTEC');
  
  // Detectar categorías en los datos
  const categorias = await detectarCategorias(datos);
  console.log(`Se detectaron ${categorias.size} categorías en CECOTEC`);
  
  if (tipo === 'productos') {
    // Usamos Promise.all con map para manejar operaciones asíncronas
    return Promise.all(datos.filter(item => item['CÓDIGO'] && item['DESCRIPCIÓN']).map(async (item, indice) => {
      // Extraer datos básicos
      const producto = {
        codigo: item['CÓDIGO'],
        nombre: item['DESCRIPCIÓN'],
        marca: 'CECOTEC'
      };
      
      // Extraer categoría del producto
      producto.categoria = await asignarCategoria(indice, categorias, item['DESCRIPCIÓN']);
      
      // Extraer precio venta público si existe
      let precioVenta = 0;
      if (item['P.V.P FINAL CLIENTE']) {
        precioVenta = parseFloat(item['P.V.P FINAL CLIENTE'].toString().replace(',', '.')) || 0;
      }
      
      // Extraer precio coste si existe
      let precioCoste = 0;
      if (item['IMPORTE BRUTO']) {
        precioCoste = parseFloat(item['IMPORTE BRUTO'].toString().replace(',', '.')) || 0;
      }
      
      // Extraer stock si existe
      let stock = 0;
      if (item['UNID.']) {
        stock = parseInt(item['UNID.'].toString(), 10) || 0;
      }
      
      // Buscar notas en columnas específicas
      let notas = '';
      if (item['OBSERVACIONES']) {
        notas = item['OBSERVACIONES'].toString().trim();
      }
      
      // Verificar si es una devolución o abono
      const esDevolucion = notas.toLowerCase().includes('devol') || 
                          notas.toLowerCase().includes('abono') ||
                          (item['IMPORTE BRUTO'] && parseFloat(item['IMPORTE BRUTO'].toString().replace(',', '.')) < 0);
      
      return {
        ...producto,
        precio_coste: precioCoste,
        precio_venta: precioVenta,
        precio: precioVenta,
        stock: stock,
        activo: true,
        fecha_alta: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
        notas: notas,
        es_devolucion: esDevolucion
      };
    }));
  } else {
    return [];
  }
}

async function parseBSH(datos, tipo) {
  console.log('Procesando datos de BSH');
  
  // Detectar categorías en los datos
  const categorias = await detectarCategorias(datos);
  console.log(`Se detectaron ${categorias.size} categorías en BSH`);
  
  if (tipo === 'productos') {
    // Usamos Promise.all con map para manejar operaciones asíncronas
    return Promise.all(datos.filter(item => item['CÓDIGO'] && item['DESCRIPCIÓN']).map(async (item, indice) => {
      // Extraer datos básicos
      const producto = {
        codigo: item['CÓDIGO'],
        nombre: item['DESCRIPCIÓN'],
        marca: 'BOSCH'
      };
      
      // Extraer categoría del producto
      producto.categoria = await asignarCategoria(indice, categorias, item['DESCRIPCIÓN']);
      
      // Extraer precio venta público si existe
      let precioVenta = 0;
      if (item['P.V.P FINAL CLIENTE']) {
        precioVenta = parseFloat(item['P.V.P FINAL CLIENTE'].toString().replace(',', '.')) || 0;
      }
      
      // Extraer precio coste si existe
      let precioCoste = 0;
      if (item['IMPORTE BRUTO']) {
        precioCoste = parseFloat(item['IMPORTE BRUTO'].toString().replace(',', '.')) || 0;
      }
      
      // Extraer stock si existe
      let stock = 0;
      if (item['UNID.']) {
        stock = parseInt(item['UNID.'].toString(), 10) || 0;
      }
      
      // Buscar notas en columnas específicas
      let notas = '';
      if (item['OBSERVACIONES']) {
        notas = item['OBSERVACIONES'].toString().trim();
      }
      
      // Verificar si es una devolución o abono
      const esDevolucion = notas.toLowerCase().includes('devol') || 
                          notas.toLowerCase().includes('abono') ||
                          (item['IMPORTE BRUTO'] && parseFloat(item['IMPORTE BRUTO'].toString().replace(',', '.')) < 0);
      
      return {
        ...producto,
        precio_coste: precioCoste,
        precio_venta: precioVenta,
        precio: precioVenta,
        stock: stock,
        activo: true,
        fecha_alta: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
        notas: notas,
        es_devolucion: esDevolucion
      };
    }));
  } else {
    return [];
  }
}

// Implementar los demás parsers específicos con la misma estructura
async function parseJata(datos, tipo) {
  console.log('Procesando datos de JATA');
  
  // Detectar categorías en los datos
  const categorias = await detectarCategorias(datos);
  console.log(`Se detectaron ${categorias.size} categorías en JATA`);
  
  // Usar el parser genérico pero añadiendo la marca y categorías detectadas
  const datosProcesados = await parserGenerico(datos, tipo);
  
  // Añadir marca y categoría a cada producto
  if (tipo === 'productos') {
    return Promise.all(datosProcesados.map(async (item, indice) => {
      if (item) {
        const productoConMarca = {
          ...item,
          marca: 'JATA'
        };
        
        if (tipo === 'productos') {
          productoConMarca.categoria = await asignarCategoria(indice, categorias, item.nombre);
        }
        
        return productoConMarca;
      }
      return item;
    }));
  }
  
  return datosProcesados;
}

async function parseOrbegozo(datos, tipo) {
  console.log('Procesando datos de ORBEGOZO');
  
  // Detectar categorías en los datos
  const categorias = await detectarCategorias(datos);
  console.log(`Se detectaron ${categorias.size} categorías en ORBEGOZO`);
  
  // Usar el parser genérico pero añadiendo la marca y categorías detectadas
  const datosProcesados = await parserGenerico(datos, tipo);
  
  // Añadir marca y categoría a cada producto
  if (tipo === 'productos') {
    return Promise.all(datosProcesados.map(async (item, indice) => {
      if (item) {
        const productoConMarca = {
          ...item,
          marca: 'ORBEGOZO'
        };
        
        if (tipo === 'productos') {
          productoConMarca.categoria = await asignarCategoria(indice, categorias, item.nombre);
        }
        
        return productoConMarca;
      }
      return item;
    }));
  }
  
  return datosProcesados;
}

async function parseAlfadyser(datos, tipo) {
  console.log('Procesando datos de ALFADYSER');
  
  // Detectar categorías en los datos
  const categorias = await detectarCategorias(datos);
  console.log(`Se detectaron ${categorias.size} categorías en ALFADYSER`);
  
  // Usar el parser genérico pero añadiendo la marca y categorías detectadas
  const datosProcesados = await parserGenerico(datos, tipo);
  
  // Añadir marca y categoría a cada producto
  if (tipo === 'productos') {
    return Promise.all(datosProcesados.map(async (item, indice) => {
      if (item) {
        const productoConMarca = {
          ...item,
          marca: 'ALFADYSER'
        };
        
        if (tipo === 'productos') {
          productoConMarca.categoria = await asignarCategoria(indice, categorias, item.nombre);
        }
        
        return productoConMarca;
      }
      return item;
    }));
  }
  
  return datosProcesados;
}

async function parseVitrokitchen(datos, tipo) {
  console.log('Procesando datos de VITROKITCHEN');
  
  // Detectar categorías en los datos
  const categorias = await detectarCategorias(datos);
  console.log(`Se detectaron ${categorias.size} categorías en VITROKITCHEN`);
  
  // Usar el parser genérico pero añadiendo la marca y categorías detectadas
  const datosProcesados = await parserGenerico(datos, tipo);
  
  // Añadir marca y categoría a cada producto
  if (tipo === 'productos') {
    return Promise.all(datosProcesados.map(async (item, indice) => {
      if (item) {
        const productoConMarca = {
          ...item,
          marca: 'VITROKITCHEN'
        };
        
        if (tipo === 'productos') {
          productoConMarca.categoria = await asignarCategoria(indice, categorias, item.nombre);
        }
        
        return productoConMarca;
      }
      return item;
    }));
  }
  
  return datosProcesados;
}

async function parseElectrodirecto(datos, tipo) {
  console.log('Procesando datos de ELECTRODIRECTO');
  
  // Detectar categorías en los datos
  const categorias = await detectarCategorias(datos);
  console.log(`Se detectaron ${categorias.size} categorías en ELECTRODIRECTO`);
  
  // Usar el parser genérico pero añadiendo la marca y categorías detectadas
  const datosProcesados = await parserGenerico(datos, tipo);
  
  // Añadir marca y categoría a cada producto
  if (tipo === 'productos') {
    return Promise.all(datosProcesados.map(async (item, indice) => {
      if (item) {
        const productoConMarca = {
          ...item,
          marca: 'ELECTRODIRECTO'
        };
        
        if (tipo === 'productos') {
          productoConMarca.categoria = await asignarCategoria(indice, categorias, item.nombre);
        }
        
        return productoConMarca;
      }
      return item;
    }));
  }
  
  return datosProcesados;
}

// Exportar funciones principales
export {
  importarDatos,
  leerCSV,
  leerExcel,
  obtenerIdProveedor,
  obtenerProveedorPorNombre,
  actualizarImportacion,
  actualizarLog,
  analizarNota,
  detectarCategorias,
  asignarCategoria,
  registrarDevolucion,
  importarABaseDeDatos,
  parserGenerico,
  parseCecotec,
  parseBSH,
  parseJata,
  parseOrbegozo,
  parseAlfadyser,
  parseVitrokitchen,
  parseElectrodirecto,
  crearCategoria,
  inicializarCategoriasPredefinidas
};
