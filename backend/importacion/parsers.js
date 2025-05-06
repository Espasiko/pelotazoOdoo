/**
 * Módulo de parsers para el sistema de importación
 * Este módulo contiene funciones específicas para procesar datos de diferentes proveedores
 */

/**
 * Parser genérico para cualquier proveedor
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación (productos, precios, stock)
 * @returns {Array} - Datos procesados y normalizados
 */
export function parserGenerico(datos, tipo) {
  console.log(`Usando parser genérico para ${datos.length} registros de tipo ${tipo}`);
  console.log('Muestra de datos:', JSON.stringify(datos.slice(0, 2), null, 2));
  
  // Si no hay datos, devolver array vacío
  if (!datos || datos.length === 0) {
    console.log('No hay datos para procesar');
    return [];
  }
  
  // Obtener todas las claves posibles de los datos
  const todasLasClaves = new Set();
  datos.forEach(item => {
    Object.keys(item).forEach(key => todasLasClaves.add(key));
  });
  console.log('Claves encontradas en los datos:', Array.from(todasLasClaves));
  
  // Patrones comunes para identificar campos
  const patronesCodigo = ['COD', 'REFERENCIA', 'REF', 'SKU', 'EAN', 'UPC', 'ID', 'CODIGO'];
  const patronesNombre = ['DESC', 'NOMBRE', 'ARTICULO', 'PRODUCTO', 'DENOMINACION', 'TITULO'];
  const patronesPrecio = ['PRECIO', 'PVP', 'TARIFA', 'IMPORTE', 'COSTE', 'VALOR'];
  const patronesStock = ['STOCK', 'CANTIDAD', 'EXISTENCIAS', 'DISPONIBLE', 'INVENTARIO'];
  const patronesMarca = ['MARCA', 'FABRICANTE', 'PROVEEDOR', 'DISTRIBUIDOR'];
  const patronesCategoria = ['CATEGORIA', 'FAMILIA', 'GRUPO', 'SECCION', 'DEPARTAMENTO', 'TIPO'];
  
  // Normalizar los datos según el tipo de importación
  if (tipo === 'productos') {
    return datos.map((item, index) => {
      // Buscar campos de código en cualquier clave disponible
      let codigo = null;
      for (const key of Object.keys(item)) {
        if (typeof item[key] === 'string' || typeof item[key] === 'number') {
          // Comprobar si la clave coincide con algún patrón de código
          if (patronesCodigo.some(patron => key.toUpperCase().includes(patron))) {
            codigo = item[key];
            break;
          }
        }
      }
      
      // Si no se encontró un código, buscar un valor numérico que podría ser un código
      if (!codigo) {
        for (const key of Object.keys(item)) {
          if (!isNaN(item[key]) && item[key] !== '' && item[key] !== null) {
            codigo = item[key];
            break;
          }
        }
      }
      
      // Si aún no se encontró un código, generar uno
      if (!codigo) {
        codigo = `GEN-${index}`;
      }
      
      // Buscar campos de nombre/descripción
      let nombre = null;
      for (const key of Object.keys(item)) {
        if (typeof item[key] === 'string' && item[key].length > 3) {
          // Comprobar si la clave coincide con algún patrón de nombre
          if (patronesNombre.some(patron => key.toUpperCase().includes(patron))) {
            nombre = item[key];
            break;
          }
        }
      }
      
      // Si no se encontró un nombre, usar el primer campo de texto largo
      if (!nombre) {
        for (const key of Object.keys(item)) {
          if (typeof item[key] === 'string' && item[key].length > 3) {
            nombre = item[key];
            break;
          }
        }
      }
      
      // Si aún no se encontró un nombre, usar un genérico
      if (!nombre) {
        nombre = `Producto ${index}`;
      }
      
      // Buscar campos de precio
      let precio = 0;
      for (const key of Object.keys(item)) {
        // Comprobar si la clave coincide con algún patrón de precio
        if (patronesPrecio.some(patron => key.toUpperCase().includes(patron))) {
          const valor = parseFloat(item[key]);
          if (!isNaN(valor)) {
            precio = valor;
            break;
          }
        }
      }
      
      // Si no se encontró un precio, buscar cualquier valor numérico que podría ser un precio
      if (precio === 0) {
        for (const key of Object.keys(item)) {
          if (!key.toUpperCase().includes('STOCK') && !key.toUpperCase().includes('CANTIDAD')) {
            const valor = parseFloat(item[key]);
            if (!isNaN(valor) && valor > 0) {
              precio = valor;
              break;
            }
          }
        }
      }
      
      // Buscar campos de stock
      let stock = 0;
      for (const key of Object.keys(item)) {
        // Comprobar si la clave coincide con algún patrón de stock
        if (patronesStock.some(patron => key.toUpperCase().includes(patron))) {
          const valor = parseInt(item[key], 10);
          if (!isNaN(valor)) {
            stock = valor;
            break;
          }
        }
      }
      
      // Buscar campos de marca
      let marca = '';
      for (const key of Object.keys(item)) {
        // Comprobar si la clave coincide con algún patrón de marca
        if (patronesMarca.some(patron => key.toUpperCase().includes(patron))) {
          if (typeof item[key] === 'string' && item[key].length > 0) {
            marca = item[key];
            break;
          }
        }
      }
      
      // Buscar campos de categoría
      let categoria = '';
      for (const key of Object.keys(item)) {
        // Comprobar si la clave coincide con algún patrón de categoría
        if (patronesCategoria.some(patron => key.toUpperCase().includes(patron))) {
          if (typeof item[key] === 'string' && item[key].length > 0) {
            categoria = item[key];
            break;
          }
        }
      }
      
      // Crear objeto normalizado
      return {
        codigo: codigo.toString(),
        nombre: nombre.toString(),
        descripcion: nombre.toString(),
        precio: isNaN(precio) ? 0 : precio,
        stock: isNaN(stock) ? 0 : stock,
        proveedor: 'GENERICO',
        marca: marca,
        categoria: categoria,
        visible: true,
        destacado: false,
        datos_origen: item
      };
    });
  } else if (tipo === 'precios') {
    return datos.map((item, index) => {
      // Buscar campos de código
      let codigo = null;
      for (const key of Object.keys(item)) {
        if (patronesCodigo.some(patron => key.toUpperCase().includes(patron))) {
          codigo = item[key];
          break;
        }
      }
      
      // Buscar campos de precio
      let precio = 0;
      for (const key of Object.keys(item)) {
        if (patronesPrecio.some(patron => key.toUpperCase().includes(patron))) {
          const valor = parseFloat(item[key]);
          if (!isNaN(valor)) {
            precio = valor;
            break;
          }
        }
      }
      
      return {
        codigo: codigo ? codigo.toString() : `GEN-${index}`,
        precio: isNaN(precio) ? 0 : precio,
        datos_origen: item
      };
    });
  } else if (tipo === 'stock') {
    return datos.map((item, index) => {
      // Buscar campos de código
      let codigo = null;
      for (const key of Object.keys(item)) {
        if (patronesCodigo.some(patron => key.toUpperCase().includes(patron))) {
          codigo = item[key];
          break;
        }
      }
      
      // Buscar campos de stock
      let stock = 0;
      for (const key of Object.keys(item)) {
        if (patronesStock.some(patron => key.toUpperCase().includes(patron))) {
          const valor = parseInt(item[key], 10);
          if (!isNaN(valor)) {
            stock = valor;
            break;
          }
        }
      }
      
      return {
        codigo: codigo ? codigo.toString() : `GEN-${index}`,
        stock: isNaN(stock) ? 0 : stock,
        datos_origen: item
      };
    });
  }
  
  // Si el tipo no es reconocido, devolver los datos sin procesar
  console.log(`Tipo de importación no reconocido: ${tipo}`);
  return datos;
}

/**
 * Parser específico para Cecotec
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados
 */
export function parseCecotec(datos, tipo) {
  console.log(`Usando parser específico para Cecotec (${datos.length} registros)`);
  // Por ahora, usar el parser genérico
  return parserGenerico(datos, tipo);
}

/**
 * Parser específico para BSH
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados
 */
export function parseBSH(datos, tipo) {
  console.log(`Usando parser específico para BSH (${datos.length} registros)`);
  // Por ahora, usar el parser genérico
  return parserGenerico(datos, tipo);
}

/**
 * Parser específico para Jata
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados
 */
export function parseJata(datos, tipo) {
  console.log(`Usando parser específico para Jata (${datos.length} registros)`);
  // Por ahora, usar el parser genérico
  return parserGenerico(datos, tipo);
}

/**
 * Parser específico para Orbegozo
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados
 */
export function parseOrbegozo(datos, tipo) {
  console.log(`Usando parser específico para Orbegozo (${datos.length} registros)`);
  // Por ahora, usar el parser genérico
  return parserGenerico(datos, tipo);
}

/**
 * Parser específico para Alfadyser
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados
 */
export function parseAlfadyser(datos, tipo) {
  console.log(`Usando parser específico para Alfadyser (${datos.length} registros)`);
  // Por ahora, usar el parser genérico
  return parserGenerico(datos, tipo);
}

/**
 * Parser específico para Vitrokitchen
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados
 */
export function parseVitrokitchen(datos, tipo) {
  console.log(`Usando parser específico para Vitrokitchen (${datos.length} registros)`);
  // Por ahora, usar el parser genérico
  return parserGenerico(datos, tipo);
}

/**
 * Parser específico para Electrodirecto
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados
 */
export function parseElectrodirecto(datos, tipo) {
  console.log(`Usando parser específico para Electrodirecto (${datos.length} registros)`);
  // Por ahora, usar el parser genérico
  return parserGenerico(datos, tipo);
}

/**
 * Parser específico para Almacenes
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados
 */
function parseAlmacenes(datos, tipo) {
  console.log(`Usando parser específico para Almacenes con ${datos.length} registros de tipo ${tipo}`);
  
  // Mostrar las primeras filas para depuración
  console.log('Muestra de datos de Almacenes:', JSON.stringify(datos.slice(0, 2), null, 2));
  
  // Mapeo de columnas específicas de ALMCE
  const columnMap = {
    codigo: ['__EMPTY_1', 'CÓDIGO', 'CODIGO'],
    descripcion: ['__EMPTY_2', 'DESCRIPCIÓN', 'DESCRIPCION'],
    unidades: ['__EMPTY_3', 'UNID.', 'UNID'],
    importeBruto: ['__EMPTY_4', 'IMPORTE BRUTO'],
    dto: ['__EMPTY_5', 'DTO'],
    iva: ['__EMPTY_6', 'IVA 21% + RECARGO 5,2%'],
    precioConMargen: ['__EMPTY_7', 'PRECIO CON MARGEN 25%'],
    pvpWeb: ['__EMPTY_8', 'P.V.P     WEB', 'P.V.P WEB'],
    pvpFinal: ['__EMPTY_9', 'P.V.P FINAL CLIENTE'],
    vendidas: ['__EMPTY_11', 'VENDIDAS'],
    stock: ['__EMPTY_12', 'QUEDAN EN TIENDA']
  };
  
  // Función para limpiar valores monetarios
  const limpiarValorMonetario = (valor) => {
    if (!valor) return 0;
    if (typeof valor !== 'string') return parseFloat(valor) || 0;
    
    // Eliminar símbolo de euro, espacios y convertir comas a puntos
    const valorLimpio = valor.replace(/[€\s]/g, '').replace(',', '.');
    return parseFloat(valorLimpio) || 0;
  };
  
  // Función para obtener valor de una columna usando el mapeo
  const getColumnValue = (item, columnKeys) => {
    for (const key of columnKeys) {
      if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
        return item[key];
      }
    }
    return null;
  };
  
  // Variables para seguimiento de categorías y subcategorías
  let categoriaActual = '';
  let subcategoriaActual = '';
  
  // Productos procesados
  const productosProcesados = [];
  
  // Procesar cada fila
  datos.forEach((item, index) => {
    // Verificar si es una fila de categoría o subcategoría
    if (Object.keys(item).length === 1 && item['__EMPTY_1'] && !item['__EMPTY_2']) {
      // Es una fila de categoría o subcategoría
      if (item['__EMPTY_1'].length < 15) {
        categoriaActual = item['__EMPTY_1'].trim();
        console.log(`Detectada categoría: ${categoriaActual}`);
      } else {
        subcategoriaActual = item['__EMPTY_1'].trim();
        console.log(`Detectada subcategoría: ${subcategoriaActual}`);
      }
      return; // Saltar esta fila
    }
    
    // Verificar si es una fila de cabecera
    if (getColumnValue(item, columnMap.codigo) === 'CÓDIGO' || 
        getColumnValue(item, columnMap.descripcion) === 'DESCRIPCIÓN') {
      console.log('Detectada fila de cabecera, saltando...');
      return; // Saltar esta fila
    }
    
    // Verificar si es una fila vacía
    const isEmpty = Object.values(item).every(val => !val || val === '-   € ' || val === '  -   € ');
    if (isEmpty) {
      console.log('Detectada fila vacía, saltando...');
      return; // Saltar esta fila
    }
    
    // Obtener valores de las columnas
    const codigo = getColumnValue(item, columnMap.codigo);
    
    // Si no hay código, probablemente no es un producto válido
    if (!codigo) {
      console.log(`Fila ${index} sin código, saltando...`);
      return;
    }
    
    const descripcion = getColumnValue(item, columnMap.descripcion) || '';
    const unidades = parseInt(getColumnValue(item, columnMap.unidades) || 0, 10);
    const importeBruto = limpiarValorMonetario(getColumnValue(item, columnMap.importeBruto));
    const pvpFinal = limpiarValorMonetario(getColumnValue(item, columnMap.pvpFinal));
    const stockDisponible = parseInt(getColumnValue(item, columnMap.stock) || 0, 10);
    
    // Crear objeto de producto normalizado
    const producto = {
      codigo: codigo.toString(),
      nombre: descripcion.toString(),
      descripcion: descripcion.toString(),
      precio: pvpFinal > 0 ? pvpFinal : importeBruto,
      stock: isNaN(stockDisponible) ? unidades : stockDisponible,
      proveedor: 'ALMACENES',
      marca: subcategoriaActual || '',
      categoria: categoriaActual || '',
      visible: true,
      destacado: false,
      datos_origen: item
    };
    
    console.log(`Producto procesado: ${producto.codigo} - ${producto.nombre} - ${producto.precio}€`);
    productosProcesados.push(producto);
  });
  
  console.log(`Total de productos procesados: ${productosProcesados.length}`);
  return productosProcesados;
}

// Mapeo de proveedores a sus parsers específicos
export const proveedorParsers = {
  'CECOTEC': parseCecotec,
  'BSH': parseBSH,
  'JATA': parseJata,
  'ORBEGOZO': parseOrbegozo,
  'ALFADYSER': parseAlfadyser,
  'VITROKITCHEN': parseVitrokitchen,
  'ELECTRODIRECTO': parseElectrodirecto,
  'ALMCE': parseAlmacenes,
  'ALMACENES': parseAlmacenes,
  'GENERICO': parserGenerico
  // Añadir más parsers según sea necesario
};
