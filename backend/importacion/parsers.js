/**
 * Módulo de parsers para el sistema de importación
 * Este módulo contiene funciones específicas para procesar datos de diferentes proveedores
 */

import { limpiarPrecio } from './utils.js';

/**
 * Parser genérico universal adaptable por mapeo de columnas
 * Mejorado: incluye heurística para variantes de nombres de columnas y logs de depuración.
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación (productos, precios, stock)
 * @param {Object} [config] - Configuración opcional (mapeo de columnas)
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parserGenericoUniversal(datos, tipo, config = {}) {
  if (!datos || datos.length === 0) {
    console.warn('[parserGenericoUniversal] Datos vacíos');
    return { productos: [], categorias: [] };
  }

  // Variantes de nombres para heurística
  const variantes = {
    codigo: ['CÓDIGO', 'COD', 'REFERENCIA', 'REF', 'SKU', 'ID', 'CODIGO', 'EAN', 'UPC'],
    nombre: ['DESCRIPCIÓN', 'DESC', 'NOMBRE', 'PRODUCTO', 'ARTICULO', 'DENOMINACION', 'TITULO'],
    unidades: ['UNID', 'CANTIDAD', 'STOCK', 'EXISTENCIAS', 'DISPONIBLE', 'INVENTARIO'],
    precio: ['IMPORTE', 'PRECIO', 'PVP', 'TARIFA', 'COSTE', 'VALOR', 'IMPORTE BRUTO'],
    pvp: ['PVP', 'PRECIO VENTA', 'PRECIO FINAL', 'PVP FINAL', 'P.V.P', 'P.V.P WEB', 'P.V.P FINAL CLIENTE'],
    pvp_final: ['FINAL', 'PVP FINAL', 'PRECIO FINAL', 'P.V.P FINAL'],
    vendidas: ['VENDIDAS', 'VENDIDO', 'SALIDA'],
    tienda: ['TIENDA', 'EN TIENDA', 'STOCK TIENDA', 'QUEDAN EN TIENDA'],
    nota: ['NOTA', 'OBS', 'OBSERVACION', 'OBSERVACIONES'],
    marca: ['MARCA', 'FABRICANTE', 'BRAND'],
    // Nuevas variantes para campos financieros y de inventario
    descuento: ['DTO', 'DESCUENTO', 'REBAJA', 'OFERTA'],
    margen: ['MARGEN', 'MARKUP', 'GANANCIA'],
    beneficio: ['BENEFICIO', 'GANANCIA', 'UTILIDAD'],
    beneficio_unitario: ['BENEFICIO UNITARIO', 'GANANCIA UNITARIA', 'UTILIDAD UNITARIA'],
    beneficio_total: ['BENEFICIO TOTAL', 'GANANCIA TOTAL', 'UTILIDAD TOTAL'],
    iva: ['IVA', 'IMPUESTO', 'IMPUESTOS', 'IVA 21%', 'IVA 21% + RECARGO 5,2%']
  };

  // Detectar encabezado (primera fila con algún campo clave)
  let header = null;
  let headerIdx = 0;
  for (let i = 0; i < datos.length; i++) {
    const row = datos[i];
    const values = Object.values(row).map(v => (v || '').toString().toUpperCase());
    if (values.some(v => variantes.codigo.includes(v)) && values.some(v => variantes.nombre.includes(v))) {
      header = row;
      headerIdx = i;
      break;
    }
  }
  if (!header) header = datos[0];

  // Mapeo automático o por config
  const mapCol = (nombre, variantesArr) => {
    if (config[nombre]) return config[nombre];
    
    // CASO ESPECIAL: Archivos ALMCE con columnas __EMPTY_X
    // Buscar en valores de encabezado para archivos con columnas __EMPTY_X
    for (const key of Object.keys(header)) {
      if (key.startsWith('__EMPTY_')) {
        const val = (header[key] || '').toString().toUpperCase();
        if (variantesArr.some(v => val.includes(v))) {
          console.log(`[parserGenericoUniversal] Mapeo especial: Columna ${key} con valor "${val}" mapeada a ${nombre}`);
          return key;
        }
      }
    }
    
    // Buscar por variantes en el header
    for (const key of Object.keys(header)) {
      const val = (header[key] || '').toString().toUpperCase();
      if (variantesArr.some(v => val.includes(v))) return key;
    }
    // Buscar por nombre de columna
    for (const key of Object.keys(header)) {
      if (key.toUpperCase().includes(nombre.toUpperCase())) return key;
    }
    // Buscar por variantes en key
    for (const key of Object.keys(header)) {
      if (variantesArr.some(v => key.toUpperCase().includes(v))) return key;
    }
    return null;
  };
  const colCodigo = mapCol('CÓDIGO', variantes.codigo);
  const colDesc = mapCol('DESCRIPCIÓN', variantes.nombre);
  const colUnidades = mapCol('UNID', variantes.unidades);
  const colPrecio = mapCol('IMPORTE', variantes.precio);
  const colPVP = mapCol('PVP', variantes.pvp);
  const colPVPFinal = mapCol('FINAL', variantes.pvp_final);
  const colVendidas = mapCol('VENDIDAS', variantes.vendidas);
  const colTienda = mapCol('TIENDA', variantes.tienda);
  const colNotas = mapCol('NOTA', variantes.nota);
  const colMarca = mapCol('MARCA', variantes.marca);
  const colDescuento = mapCol('DTO', variantes.descuento);
  const colMargen = mapCol('MARGEN', variantes.margen);
  const colBeneficioUnitario = mapCol('BENEFICIO UNITARIO', variantes.beneficio_unitario);
  const colBeneficioTotal = mapCol('BENEFICIO TOTAL', variantes.beneficio_total);
  const colIva = mapCol('IVA', variantes.iva);

  // Log de mapeo detectado
  console.log('[parserGenericoUniversal] Mapeo detectado:', {
    colCodigo, colDesc, colUnidades, colPrecio, colPVP, colPVPFinal, colVendidas, colTienda, colNotas,
    colMarca, colDescuento, colMargen, colBeneficioUnitario, colBeneficioTotal, colIva
  });

  // CASO ESPECIAL: Si no se encontró colPVP pero hay colPVPFinal, usar colPVPFinal como colPVP
  if (!colPVP && colPVPFinal) {
    console.log('[parserGenericoUniversal] Usando colPVPFinal como colPVP ya que no se encontró colPVP');
    colPVP = colPVPFinal;
  }
  
  // CASO ESPECIAL: Si no se encontró colPVP pero hay colPrecio, usar colPrecio con un markup como colPVP
  if (!colPVP && colPrecio) {
    console.log('[parserGenericoUniversal] Usando colPrecio con markup como colPVP ya que no se encontró colPVP');
    // Usaremos colPrecio con un markup del 30% como fallback para colPVP
    // Esto se hará en el procesamiento de cada fila
  }

  if (!colCodigo || !colDesc) {
    console.error('[parserGenericoUniversal] No se detectaron columnas de código o descripción. Revisa el archivo o pasa un mapeo manual.');
    return { productos: [], categorias: [] };
  }

  // Procesar filas
  let categoriaActual = null;
  const productos = [];
  const categoriasDetectadas = [];
  
  for (let i = headerIdx + 1; i < datos.length; i++) {
    const row = datos[i];
    
    // DETECCIÓN MEJORADA DE CATEGORÍAS
    // 1. Detectar fila con texto solo en la columna de categoría (caso simple)
    // 2. Detectar filas que parecen ser encabezados de categoría (texto en __EMPTY_1 sin código ni descripción)
    const posibleCategoria = row['__EMPTY_1'] || row['__EMPTY'] || '';
    
    // Caso 1: Fila con una sola propiedad que tiene un valor significativo
    const esCategoriaSimple = 
      Object.keys(row).length === 1 && 
      Object.values(row)[0] && 
      (Object.values(row)[0] + '').length > 2;
    
    // Caso 2: Fila con __EMPTY_1 que contiene un texto que parece categoría
    // y no tiene código ni descripción (no es un producto)
    const esCategoriaTipoAlmce = 
      posibleCategoria.length > 2 && 
      (!row[colCodigo] || !row[colDesc]) &&
      (
        // Palabras clave que suelen indicar categorías
        posibleCategoria.toUpperCase().includes('LAVADORA') ||
        posibleCategoria.toUpperCase().includes('SECADORA') ||
        posibleCategoria.toUpperCase().includes('FRIGORÍFICO') ||
        posibleCategoria.toUpperCase().includes('CONGELADOR') ||
        posibleCategoria.toUpperCase().includes('HORNO') ||
        posibleCategoria.toUpperCase().includes('MICROONDAS') ||
        posibleCategoria.toUpperCase().includes('CAMPANA') ||
        posibleCategoria.toUpperCase().includes('VITROCERÁMICA') ||
        posibleCategoria.toUpperCase().includes('LAVAVAJILLAS') ||
        // Marcas conocidas que a veces aparecen como "categorías"
        posibleCategoria.toUpperCase() === 'CORBERÓ' ||
        posibleCategoria.toUpperCase() === 'CANDY' ||
        posibleCategoria.toUpperCase() === 'BEKO' ||
        posibleCategoria.toUpperCase() === 'BALAY' ||
        posibleCategoria.toUpperCase() === 'BOSCH'
      );
    
    if (esCategoriaSimple || esCategoriaTipoAlmce) {
      // Es una categoría, actualizar categoriaActual
      const nuevaCategoria = esCategoriaSimple ? Object.values(row)[0].toString().trim() : posibleCategoria.trim();
      console.log(`[parserGenericoUniversal] Detectada categoría: "${nuevaCategoria}" en fila ${i}`);
      
      // Guardar la categoría en el array de categorías detectadas si no existe ya
      if (!categoriasDetectadas.includes(nuevaCategoria)) {
        categoriasDetectadas.push(nuevaCategoria);
      }
      
      categoriaActual = nuevaCategoria;
      continue; // Pasar a la siguiente fila
    }
    
    // Detectar producto: debe tener código y descripción
    const codigo = row[colCodigo];
    const nombre = row[colDesc];
    if (!codigo || !nombre) continue;

    // Log para depurar PVP
    console.log(`[parserGenericoUniversal] Debug PVP - Fila ${i}:`, JSON.stringify(row).substring(0, 300)); // Loguear parte de la fila
    console.log(`[parserGenericoUniversal] Debug PVP - Mapeo colPVP: ${colPVP}`);
    
    // Obtener precio de venta (con fallbacks)
    let precioVentaCrudo = row[colPVP] || row[colPrecio] || '0';
    let precioVenta = limpiarPrecio(precioVentaCrudo);
    if (isNaN(precioVenta) || precioVenta <= 0) {
      console.warn(`[parserGenericoUniversal] Precio inválido en fila ${i}: valor crudo '${precioVentaCrudo}', skipped.`);
      continue; // Saltar fila con precio inválido
    }
    console.log(`[parserGenericoUniversal] Debug PVP - Valor PVP después de limpiarPrecio: ${precioVenta}`);

    // EXTRAER MARCA
    let marcaExtraida = null;
    if (colMarca && row[colMarca]) { 
      marcaExtraida = row[colMarca].toString().trim();
    } else if (nombre) { 
      const palabrasNombre = nombre.toString().trim().split(' ');
      // Heurística simple: si la primera palabra es común como marca (ej. todo mayúsculas, o corta y común)
      // Esto es muy básico y podría necesitar refinamiento o una lista de marcas conocidas.
      if (palabrasNombre.length > 0) {
        const primeraPalabra = palabrasNombre[0];
        // Considerar marca si es TODO MAYÚSCULAS y tiene entre 2 y 10 caracteres (ej. SONY, LG, HP)
        // O si es una palabra común de marca (esto requeriría una lista)
        if (primeraPalabra.length >= 2 && primeraPalabra.length <= 15 && primeraPalabra === primeraPalabra.toUpperCase()) {
          // Podríamos tener una lista de palabras comunes que NO son marcas aquí (ej. 'PACK', 'SET', 'KIT', 'UNIDAD', 'CAJA', 'ROLLO')
          if (!['PACK', 'SET', 'KIT', 'UNIDAD', 'CAJA', 'ROLLO'].includes(primeraPalabra)) {
             marcaExtraida = primeraPalabra;
          }
        }
        // Si no se extrajo así, y hay más de una palabra, podríamos tomar las dos primeras si la segunda es corta
        if (!marcaExtraida && palabrasNombre.length > 1) {
            const dosPrimeras = `${palabrasNombre[0]} ${palabrasNombre[1]}`;
            // Ejemplo: "BOSCH Herramienta" -> "BOSCH" o "BOSCH Herramienta" si "Herramienta" no es genérico
            // Esto se vuelve complejo rápidamente. Una columna MARCA es lo ideal.
            // Por ahora, nos quedamos con la primera palabra si cumple la condición anterior.
        }
      }
    }

    // Notas
    // Concatenar todas las posibles notas/comentarios sueltos
    let notasConcat = [];
    if (colNotas && row[colNotas]) notasConcat.push(row[colNotas]);
    // Buscar notas en campos extra
    for (const key of Object.keys(row)) {
      if ((key + '').toUpperCase().includes('NOTA') || (key + '').toUpperCase().includes('OBS')) {
        if (row[key] && !notasConcat.includes(row[key])) notasConcat.push(row[key]);
      }
    }
    // Además, incluir cualquier campo suelto de texto que no sea código, nombre, precio, etc.
    const camposEstandar = [colCodigo, colDesc, colUnidades, colPrecio, colPVP, colPVPFinal, colVendidas, colTienda, colMarca, colDescuento, colMargen, colBeneficioUnitario, colBeneficioTotal, colIva];
    for (const key of Object.keys(row)) {
      if (!camposEstandar.includes(key) && typeof row[key] === 'string' && row[key].length > 2) {
        notasConcat.push(row[key]);
      }
    }
    let nota = notasConcat.filter(Boolean).join(' | ');

    // Crear objeto producto con todos los campos originales y mapeados según PocketBase
    const producto = {
      codigo: codigo.toString().trim(),
      nombre: nombre.toString().trim(),
      descripcion: nombre.toString().trim(), // fallback si no hay campo descripción específico
      precio_compra: limpiarPrecio(row[colPrecio]),
      precio_venta: precioVenta,
      descuento: colDescuento ? limpiarPrecio(row[colDescuento]) : undefined,
      margen: colMargen ? limpiarPrecio(row[colMargen]) : undefined,
      beneficio_unitario: colBeneficioUnitario ? limpiarPrecio(row[colBeneficioUnitario]) : 0,
      beneficio_total: colBeneficioTotal ? limpiarPrecio(row[colBeneficioTotal]) : 0,
      iva: colIva ? limpiarPrecio(row[colIva]) : 21,
      stock_actual: colTienda ? limpiarPrecio(row[colTienda]) : 0,
      unidades_vendidas: colVendidas ? limpiarPrecio(row[colVendidas]) : 0,
      notas: nota || '',
      categoriaExtraidaDelParser: categoriaActual,
      marca: marcaExtraida,
      datos_origen: JSON.stringify(row)
    };
    // Log para depuración
    console.log(`[parserGenericoUniversal] Producto procesado: ${producto.codigo} - ${producto.nombre} - PV: ${producto.precio_venta}€`);
    productos.push(producto);
  }
  console.log(`[parserGenericoUniversal] Productos extraídos: ${productos.length}`);
  console.log(`[parserGenericoUniversal] Categorías detectadas: ${categoriasDetectadas.length}`, categoriasDetectadas);
  
  // Devolver un objeto con los productos y las categorías detectadas
  return {
    productos,
    categorias: categoriasDetectadas
  };
}

/**
 * Parser específico para ALMCE (Almacén de Electrodomésticos)
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parserALMCE(datos, tipo) {
  // Mapeo específico ALMCE extendido
  const config = {
    'CÓDIGO': '__EMPTY_1',
    'DESCRIPCIÓN': '__EMPTY_2',
    'UNID': '__EMPTY_3',
    'IMPORTE': '__EMPTY_4',
    'DTO': '__EMPTY_5',
    'IVA': '__EMPTY_6',
    'PRECIO_CON_MARGEN': '__EMPTY_7',
    'PVP': '__EMPTY_8',
    'FINAL': '__EMPTY_9',
    'BENEFICIO_UNITARIO': '__EMPTY_14',
    'BENEFICIO_TOTAL': '__EMPTY_15',
    'VENDIDAS': '__EMPTY_11',
    'TIENDA': '__EMPTY_12',
    'NOTA': '__EMPTY_16'
  };
  return parserGenericoUniversal(datos, tipo, config);
}

/**
 * Parser específico para Cecotec
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parseCecotec(datos, tipo) {
  console.log(`[parseCecotec] Procesando ${datos.length} filas de datos Cecotec`);
  
  // Función para limpiar precios
  const limpiarPrecio = v => {
    if (v === undefined || v === null) return 0;
    if (typeof v === 'number') return v;
    return parseFloat((v || '').toString().replace(/[^0-9,\.]/g, '').replace(',', '.')) || 0;
  };
  
  // Mapeo específico para Cecotec
  const colMappings = {
    codigo: 'CECOTEC',
    nombre: '__EMPTY_1',
    unidades: '__EMPTY_2',
    precio_compra: '__EMPTY_3',
    descuento: '__EMPTY_4',
    total_con_descuento: '__EMPTY_5',
    iva_recargo: '__EMPTY_6',
    margen: '__EMPTY_7',
    pvp_web: '__EMPTY_8',
    pvp_final: '__EMPTY_9',
    beneficio_unitario: '__EMPTY_11',
    beneficio_total: '__EMPTY_12',
    vendidas: '__EMPTY_14',
    stock_tienda: '__EMPTY_15'
  };
  
  let categoriaActual = null;
  const productos = [];
  const categoriasDetectadas = [];
  
  // Procesar cada fila
  for (let i = 1; i < datos.length; i++) { // Empezar desde 1 para saltar el encabezado
    const row = datos[i];
    
    // Detectar si es una categoría
    const posibleCategoria = row[colMappings.codigo];
    const esCategoria = 
      posibleCategoria && 
      typeof posibleCategoria === 'string' && 
      !row[colMappings.precio_compra] &&
      !row[colMappings.pvp_final];
    
    if (esCategoria) {
      categoriaActual = posibleCategoria.trim();
      console.log(`[parseCecotec] Detectada categoría: "${categoriaActual}" en fila ${i}`);
      
      // Guardar categoría si no existe ya
      if (!categoriasDetectadas.includes(categoriaActual)) {
        categoriasDetectadas.push(categoriaActual);
      }
      continue;
    }
    
    // Detectar producto válido (debe tener código y nombre)
    const codigo = row[colMappings.codigo];
    const nombre = row[colMappings.nombre];
    
    if (!codigo || !nombre) {
      continue; // No es un producto válido
    }
    
    // Extraer todos los campos preservando valores originales
    const producto = {
      codigo: String(codigo),
      nombre: String(nombre),
      unidades: parseInt(row[colMappings.unidades] || 0, 10),
      
      // Campos financieros - preservar valores originales
      precio_compra: limpiarPrecio(row[colMappings.precio_compra]),
      descuento: limpiarPrecio(row[colMappings.descuento]),
      precio_con_descuento: limpiarPrecio(row[colMappings.total_con_descuento]),
      iva_recargo: limpiarPrecio(row[colMappings.iva_recargo]),
      margen: limpiarPrecio(row[colMappings.margen]),
      pvp_web: limpiarPrecio(row[colMappings.pvp_web]),
      precio_venta: limpiarPrecio(row[colMappings.pvp_final] || row[colMappings.pvp_web]), // Usar pvp_final o pvp_web como fallback
      beneficio_unitario: limpiarPrecio(row[colMappings.beneficio_unitario]),
      beneficio_total: limpiarPrecio(row[colMappings.beneficio_total]),
      
      // Campos de inventario
      vendidas: parseInt(row[colMappings.vendidas] || 0, 10),
      stock: parseInt(row[colMappings.stock_tienda] || 0, 10),
      
      // Otros campos
      categoriaExtraidaDelParser: categoriaActual,
      proveedor_nombre: 'CECOTEC',
      datos_origen: JSON.stringify(row)
    };
    
    // Log para depuración
    console.log(`[parseCecotec] Producto procesado: ${producto.codigo} - ${producto.nombre} - PV: ${producto.precio_venta}€`);
    
    productos.push(producto);
  }
  
  console.log(`[parseCecotec] Procesamiento completado: ${productos.length} productos y ${categoriasDetectadas.length} categorías`);
  
  return {
    productos: productos,
    categorias: categoriasDetectadas
  };
}

/**
 * Parser específico para BSH
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parseBSH(datos, tipo) {
  return parserGenericoUniversal(datos, tipo);
}

/**
 * Parser específico para Jata
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parseJata(datos, tipo) {
  // Usar el parser genérico pero con validación extra de precio_venta
  const resultado = parserGenericoUniversal(datos, tipo);
  const productosValidos = [];
  const productosOmitidos = [];

  for (const producto of resultado.productos) {
    const precioValido = limpiarPrecio(producto.precio_venta);
    if (precioValido === null) {
      console.warn(`[parseJata] Producto omitido por precio_venta inválido: código=${producto.codigo}, nombre=${producto.nombre}, precio_venta=${producto.precio_venta}`);
      productosOmitidos.push(producto);
      continue;
    }
    producto.precio_venta = precioValido;
    productosValidos.push(producto);
  }
  if (productosOmitidos.length > 0) {
    console.warn(`[parseJata] Total productos omitidos por precio_venta inválido: ${productosOmitidos.length}`);
  }
  return {
    ...resultado,
    productos: productosValidos
  };
}


/**
 * Parser específico para Orbegozo
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parseOrbegozo(datos, tipo) {
  return parserGenericoUniversal(datos, tipo);
}

/**
 * Parser específico para Alfadyser
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parseAlfadyser(datos, tipo) {
  return parserGenericoUniversal(datos, tipo);
}

/**
 * Parser específico para Vitrokitchen
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parseVitrokitchen(datos, tipo) {
  return parserGenericoUniversal(datos, tipo);
}

/**
 * Parser específico para Electrodirecto
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parseElectrodirecto(datos, tipo) {
  return parserGenericoUniversal(datos, tipo);
}

/**
 * Parser específico para Almacenes
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parseAlmacenes(datos, tipo) {
  return parserGenericoUniversal(datos, tipo);
}

/**
 * Parser específico para EAS-JOHNSON
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parseEasJohnson(datos, tipo) {
  console.log(`[parseEasJohnson] Procesando ${datos.length} filas de datos EAS-JOHNSON`);
  
  // Función para limpiar precios
  const limpiarPrecio = v => {
    if (v === undefined || v === null) return 0;
    if (typeof v === 'number') return v;
    return parseFloat((v || '').toString().replace(/[^0-9,\.]/g, '').replace(',', '.')) || 0;
  };
  
  // Mapeo específico para EAS-JOHNSON
  const colMappings = {
    codigo: 'EAS ELECTRIC & JOHNSON ',
    nombre: '__EMPTY',
    unidades: '__EMPTY_1',
    precio_compra: '__EMPTY_2',
    descuento1: '__EMPTY_3',
    descuento2: '__EMPTY_4',
    iva_recargo: '__EMPTY_5',
    margen: '__EMPTY_6',
    pvp_web: '__EMPTY_7',
    pvp_final: '__EMPTY_8',
    beneficio_unitario: '__EMPTY_10',
    beneficio_total: '__EMPTY_11',
    vendidas: '__EMPTY_13',
    stock_tienda: '__EMPTY_14'
  };
  
  let categoriaActual = null;
  const productos = [];
  const categoriasDetectadas = [];
  
  // Procesar cada fila
  for (let i = 1; i < datos.length; i++) { // Empezar desde 1 para saltar el encabezado
    const row = datos[i];
    
    // Detectar si es una categoría
    const posibleCategoria = row[colMappings.codigo];
    const esCategoria = 
      posibleCategoria && 
      typeof posibleCategoria === 'string' && 
      !row[colMappings.precio_compra] &&
      !row[colMappings.pvp_final];
    
    if (esCategoria) {
      categoriaActual = posibleCategoria.trim();
      console.log(`[parseEasJohnson] Detectada categoría: "${categoriaActual}" en fila ${i}`);
      
      // Guardar categoría si no existe ya
      if (!categoriasDetectadas.includes(categoriaActual)) {
        categoriasDetectadas.push(categoriaActual);
      }
      continue;
    }
    
    // Detectar producto válido (debe tener código y nombre)
    const codigo = row[colMappings.codigo];
    const nombre = row[colMappings.nombre];
    
    if (!codigo || !nombre) {
      continue; // No es un producto válido
    }
    
    // Extraer todos los campos preservando valores originales
    const producto = {
      codigo: String(codigo),
      nombre: String(nombre),
      unidades: parseInt(row[colMappings.unidades] || 0, 10),
      
      // Campos financieros - preservar valores originales
      precio_compra: limpiarPrecio(row[colMappings.precio_compra]),
      descuento1: limpiarPrecio(row[colMappings.descuento1]),
      descuento2: limpiarPrecio(row[colMappings.descuento2]),
      iva_recargo: limpiarPrecio(row[colMappings.iva_recargo]),
      margen: limpiarPrecio(row[colMappings.margen]),
      pvp_web: limpiarPrecio(row[colMappings.pvp_web]),
      precio_venta: limpiarPrecio(row[colMappings.pvp_final] || row[colMappings.pvp_web]), // Usar pvp_final o pvp_web como fallback
      beneficio_unitario: limpiarPrecio(row[colMappings.beneficio_unitario]),
      beneficio_total: limpiarPrecio(row[colMappings.beneficio_total]),
      
      // Campos de inventario
      vendidas: parseInt(row[colMappings.vendidas] || 0, 10),
      stock: parseInt(row[colMappings.stock_tienda] || 0, 10),
      
      // Otros campos
      categoriaExtraidaDelParser: categoriaActual,
      proveedor_nombre: 'EAS-JOHNSON',
      datos_origen: JSON.stringify(row)
    };
    
    // Log para depuración
    console.log(`[parseEasJohnson] Producto procesado: ${producto.codigo} - ${producto.nombre} - PV: ${producto.precio_venta}€`);
    
    productos.push(producto);
  }
  
  console.log(`[parseEasJohnson] Procesamiento completado: ${productos.length} productos y ${categoriasDetectadas.length} categorías`);
  
  return {
    productos: productos,
    categorias: categoriasDetectadas
  };
}

// Mapeo de proveedores a sus parsers específicos
export const proveedorParsers = {
  'ALMCE': parserALMCE,
  'GENERICO': parserGenericoUniversal,
  'CECOTEC': parseCecotec,
  'BSH': parseBSH,
  'JATA': parseJata,
  'ORBEGOZO': parseOrbegozo,
  'ALFADYSER': parseAlfadyser,
  'VITROKITCHEN': parseVitrokitchen,
  'ELECTRODIRECTO': parseElectrodirecto,
  'ALMACENES': parseAlmacenes,
  'EAS-JOHNSON': parseEasJohnson,
  // Añadir más parsers según sea necesario
};
