/**
 * Módulo de parsers para el sistema de importación
 * Este módulo contiene funciones específicas para procesar datos de diferentes proveedores
 */

/**
 * Parser genérico universal adaptable por mapeo de columnas
 * Mejorado: incluye heurística para variantes de nombres de columnas y logs de depuración.
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación (productos, precios, stock)
 * @param {Object} [config] - Configuración opcional (mapeo de columnas)
 * @returns {Array} - Datos procesados y normalizados
 */
export function parserGenericoUniversal(datos, tipo, config = {}) {
  if (!datos || datos.length === 0) {
    console.warn('[parserGenericoUniversal] Datos vacíos');
    return [];
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
    marca: ['MARCA', 'FABRICANTE', 'BRAND']
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

  // Log de mapeo detectado
  console.log('[parserGenericoUniversal] Mapeo detectado:', {
    colCodigo, colDesc, colUnidades, colPrecio, colPVP, colPVPFinal, colVendidas, colTienda, colNotas,
    colMarca
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
    return [];
  }

  // Función para limpiar precios
  const limpiarPrecio = v => parseFloat((v || '').toString().replace(/[^0-9,\.]/g, '').replace(',', '.')) || 0;

  // Procesar filas
  let categoriaActual = null;
  const productos = [];
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
    let precioVentaCrudo;
    if (colPVP) {
      precioVentaCrudo = row[colPVP];
    } else if (colPrecio) {
      // Si no hay colPVP, usar colPrecio con un markup del 30%
      const precioCosto = parseFloat(row[colPrecio] || 0);
      precioVentaCrudo = precioCosto * 1.3; // 30% de markup
    } else {
      precioVentaCrudo = undefined;
    }
    
    console.log(`[parserGenericoUniversal] Debug PVP - Valor crudo para PVP: ${precioVentaCrudo}`);
    
    const precioVentaLimpio = limpiarPrecio(precioVentaCrudo);
    console.log(`[parserGenericoUniversal] Debug PVP - Valor PVP después de limpiarPrecio: ${precioVentaLimpio}`);

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
    let nota = '';
    if (colNotas && row[colNotas]) nota = row[colNotas];
    // Buscar notas en campos extra
    for (const key of Object.keys(row)) {
      if ((key + '').toUpperCase().includes('NOTA') || (key + '').toUpperCase().includes('OBS')) {
        nota = row[key];
      }
    }
    productos.push({
      codigo: codigo.toString().trim(),
      nombre: nombre.toString().trim(),
      categoriaExtraidaDelParser: categoriaActual, 
      marcaExtraidaDelParser: marcaExtraida, 
      stock: parseInt(row[colUnidades] || '0', 10) || 0,
      precio_costo: limpiarPrecio(colPrecio ? row[colPrecio] : undefined),
      precio_venta: precioVentaLimpio, // Usar el valor ya limpiado
      pvp_final: limpiarPrecio(colPVPFinal ? row[colPVPFinal] : undefined),
      vendidas: parseInt(row[colVendidas] || '0', 10) || 0,
      stock_tienda: parseInt(row[colTienda] || '0', 10) || 0,
      nota,
      datos_origen: row
    });
  }
  console.log(`[parserGenericoUniversal] Productos extraídos: ${productos.length}`);
  return productos;
}

/**
 * Parser específico para ALMCE (Almacén de Electrodomésticos)
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados y normalizados
 */
export function parserALMCE(datos, tipo) {
  // Mapeo específico ALMCE
  const config = {
    'CÓDIGO': '__EMPTY_1',
    'DESCRIPCIÓN': '__EMPTY_2',
    'UNID': '__EMPTY_3',
    'IMPORTE': '__EMPTY_4',
    'PVP': '__EMPTY_8',
    'FINAL': '__EMPTY_9',
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
 * @returns {Array} - Datos procesados
 */
export function parseCecotec(datos, tipo) {
  return parserGenericoUniversal(datos, tipo);
}

/**
 * Parser específico para BSH
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados
 */
export function parseBSH(datos, tipo) {
  return parserGenericoUniversal(datos, tipo);
}

/**
 * Parser específico para Jata
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados
 */
export function parseJata(datos, tipo) {
  return parserGenericoUniversal(datos, tipo);
}

/**
 * Parser específico para Orbegozo
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados
 */
export function parseOrbegozo(datos, tipo) {
  return parserGenericoUniversal(datos, tipo);
}

/**
 * Parser específico para Alfadyser
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados
 */
export function parseAlfadyser(datos, tipo) {
  return parserGenericoUniversal(datos, tipo);
}

/**
 * Parser específico para Vitrokitchen
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados
 */
export function parseVitrokitchen(datos, tipo) {
  return parserGenericoUniversal(datos, tipo);
}

/**
 * Parser específico para Electrodirecto
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados
 */
export function parseElectrodirecto(datos, tipo) {
  return parserGenericoUniversal(datos, tipo);
}

/**
 * Parser específico para Almacenes
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Array} - Datos procesados
 */
export function parseAlmacenes(datos, tipo) {
  return parserGenericoUniversal(datos, tipo);
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
  // Añadir más parsers según sea necesario
};
