/**
 * Parser genérico universal para el sistema de importación
 * Este módulo contiene la función de parser genérico que puede adaptarse a diferentes formatos
 */

import { limpiarPrecio } from '../utils.js';
import { proveedoresNormalizados } from './providers-map.js';

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
  
  // Extraer el nombre del proveedor del config o intentar detectarlo de los datos
  let nombreProveedor = config.proveedor || 'GENERICO';
  
  // Si no se especificó un proveedor, intentar detectarlo de los datos
  if (nombreProveedor === 'GENERICO' && datos.length > 0) {
    // Buscar en la primera fila para ver si hay alguna clave que indique el proveedor
    const primeraFila = datos[0];
    for (const key in primeraFila) {
      if (key && typeof key === 'string') {
        // Verificar si la clave es un nombre de proveedor conocido
        const keyUpper = key.toUpperCase();
        if (proveedoresNormalizados[keyUpper]) {
          nombreProveedor = keyUpper;
          console.log(`[parserGenericoUniversal] Proveedor detectado automáticamente de la clave: ${nombreProveedor}`);
          break;
        }
        
        // Verificar si el valor es un nombre de proveedor conocido
        if (primeraFila[key] && typeof primeraFila[key] === 'string') {
          const valueUpper = primeraFila[key].toString().toUpperCase();
          if (proveedoresNormalizados[valueUpper]) {
            nombreProveedor = valueUpper;
            console.log(`[parserGenericoUniversal] Proveedor detectado automáticamente del valor: ${nombreProveedor}`);
            break;
          }
        }
      }
    }
  }
  
  console.log(`[parserGenericoUniversal] Procesando datos para proveedor: ${nombreProveedor}`);
  
  // Normalizar el nombre del proveedor
  const proveedorNormalizado = nombreProveedor.toUpperCase();
  // Usar el nombre normalizado del proveedor si existe en el mapa
  const proveedorFinal = proveedoresNormalizados[proveedorNormalizado] || proveedorNormalizado;

  // Variantes de nombres para heurística
  const variantes = {
    codigo: ['CÓDIGO', 'COD', 'REFERENCIA', 'REF', 'SKU', 'ID', 'CODIGO', 'EAN', 'UPC', 'CODIGO PRODUCTO', 'CODIGO ARTICULO', 'MATERIAL', 'REFERENCIA FABRICANTE'],
    nombre: ['DESCRIPCIÓN', 'DESC', 'NOMBRE', 'PRODUCTO', 'ARTICULO', 'DENOMINACION', 'TITULO', 'CONCEPTO', 'NOMBRE ARTICULO', 'NOMBRE PRODUCTO', 'DESCRIPCION CORTA'],
    descripcion: ['DESCRIPCIÓN LARGA', 'DESCRIPCION COMPLETA', 'DESCRIPCION DETALLADA', 'CARACTERISTICAS', 'ESPECIFICACIONES', 'DETALLES', 'FICHA TECNICA'],
    unidades: ['UNID', 'CANTIDAD', 'STOCK', 'EXISTENCIAS', 'DISPONIBLE', 'INVENTARIO', 'STOCK ACTUAL', 'STOCK DISPONIBLE', 'UNIDADES', 'UNIDADES DISPONIBLES'],
    stock_minimo: ['STOCK MINIMO', 'MINIMO', 'STOCK MIN', 'PUNTO PEDIDO', 'PUNTO DE PEDIDO', 'NIVEL MINIMO'],
    precio: ['IMPORTE', 'PRECIO', 'PVP', 'TARIFA', 'COSTE', 'VALOR', 'IMPORTE BRUTO', 'PRECIO COMPRA', 'PRECIO COSTE', 'COSTE UNITARIO'],
    pvp: ['PVP', 'PRECIO VENTA', 'PRECIO FINAL', 'PVP FINAL', 'P.V.P', 'P.V.P WEB', 'P.V.P FINAL CLIENTE', 'PRECIO VENTA PUBLICO', 'PRECIO RECOMENDADO', 'PRECIO VENTA RECOMENDADO'],
    pvp_final: ['FINAL', 'PVP FINAL', 'PRECIO FINAL', 'P.V.P FINAL', 'PRECIO CON IVA', 'PRECIO FINAL CON IVA', 'PVP CON IVA'],
    vendidas: ['VENDIDAS', 'VENDIDO', 'SALIDA', 'UNIDADES VENDIDAS', 'VENTAS', 'TOTAL VENDIDO', 'HISTORICO VENTAS'],
    tienda: ['TIENDA', 'EN TIENDA', 'STOCK TIENDA', 'QUEDAN EN TIENDA', 'DISPONIBLE TIENDA', 'ALMACEN TIENDA'],
    nota: ['NOTA', 'OBS', 'OBSERVACION', 'OBSERVACIONES', 'COMENTARIOS', 'NOTAS ADICIONALES', 'INFORMACION ADICIONAL'],
    marca: ['MARCA', 'FABRICANTE', 'BRAND', 'NOMBRE MARCA', 'MARCA COMERCIAL', 'MARCA FABRICANTE'],
    categoria: ['CATEGORIA', 'FAMILIA', 'GRUPO', 'LINEA', 'SECCION', 'DEPARTAMENTO', 'TIPO PRODUCTO', 'CLASIFICACION', 'SUBCATEGORIA'],
    subcategoria: ['SUBCATEGORIA', 'SUBFAMILIA', 'SUBGRUPO', 'SUBLINEA'],
    codigo_barras: ['CODIGO BARRAS', 'BARCODE', 'EAN13', 'EAN-13', 'UPC', 'GTIN'],
    // Campos financieros y de inventario
    descuento: ['DTO', 'DESCUENTO', 'REBAJA', 'OFERTA', 'DESCUENTO APLICADO', 'PORCENTAJE DESCUENTO', '% DESCUENTO', 'DESCUENTO %'],
    margen: ['MARGEN', 'MARKUP', 'GANANCIA', 'MARGEN BENEFICIO', 'MARGEN COMERCIAL', '% MARGEN', 'MARGEN %'],
    beneficio: ['BENEFICIO', 'GANANCIA', 'UTILIDAD', 'RENTABILIDAD', 'BENEFICIO BRUTO'],
    beneficio_unitario: ['BENEFICIO UNITARIO', 'GANANCIA UNITARIA', 'UTILIDAD UNITARIA', 'BENEFICIO POR UNIDAD', 'GANANCIA POR UNIDAD'],
    beneficio_total: ['BENEFICIO TOTAL', 'GANANCIA TOTAL', 'UTILIDAD TOTAL', 'BENEFICIO STOCK', 'VALOR BENEFICIO'],
    iva: ['IVA', 'IMPUESTO', 'IMPUESTOS', 'IVA 21%', 'IVA 21% + RECARGO 5,2%', 'TIPO IMPOSITIVO', 'TIPO IVA', '% IVA', 'IVA %'],
    recargo_iva: ['RECARGO', 'RECARGO EQUIVALENCIA', 'RE', 'RECARGO IVA', 'RECARGO DE EQUIVALENCIA'],
    // Campos adicionales
    peso: ['PESO', 'PESO NETO', 'PESO BRUTO', 'PESO KG', 'PESO UNITARIO'],
    dimensiones: ['DIMENSIONES', 'MEDIDAS', 'TAMAÑO', 'ALTO X ANCHO X FONDO', 'DIMENSIONES PRODUCTO'],
    color: ['COLOR', 'ACABADO', 'COLOR PRINCIPAL', 'TONALIDAD'],
    garantia: ['GARANTIA', 'PERIODO GARANTIA', 'AÑOS GARANTIA', 'MESES GARANTIA'],
    fecha_alta: ['FECHA ALTA', 'FECHA CREACION', 'FECHA INCORPORACION', 'FECHA CATALOGO'],
    url_imagen: ['IMAGEN', 'URL IMAGEN', 'FOTO', 'IMAGEN PRODUCTO', 'RUTA IMAGEN', 'LINK IMAGEN'],
    eficiencia_energetica: ['EFICIENCIA', 'CLASE ENERGETICA', 'EFICIENCIA ENERGETICA', 'CONSUMO ENERGETICO', 'CLASE ENERGIA']
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
  const colDescLarga = mapCol('DESCRIPCIÓN LARGA', variantes.descripcion);
  const colUnidades = mapCol('UNID', variantes.unidades);
  const colStockMinimo = mapCol('STOCK MINIMO', variantes.stock_minimo);
  const colPrecio = mapCol('IMPORTE', variantes.precio);
  const colPVP = mapCol('PVP', variantes.pvp);
  const colPVPFinal = mapCol('FINAL', variantes.pvp_final);
  const colVendidas = mapCol('VENDIDAS', variantes.vendidas);
  const colTienda = mapCol('TIENDA', variantes.tienda);
  const colNotas = mapCol('NOTA', variantes.nota);
  const colMarca = mapCol('MARCA', variantes.marca);
  const colCategoria = mapCol('CATEGORIA', variantes.categoria);
  const colSubcategoria = mapCol('SUBCATEGORIA', variantes.subcategoria);
  const colCodigoBarras = mapCol('CODIGO BARRAS', variantes.codigo_barras);
  const colDescuento = mapCol('DTO', variantes.descuento);
  const colMargen = mapCol('MARGEN', variantes.margen);
  const colBeneficioUnitario = mapCol('BENEFICIO UNITARIO', variantes.beneficio_unitario);
  const colBeneficioTotal = mapCol('BENEFICIO TOTAL', variantes.beneficio_total);
  const colIva = mapCol('IVA', variantes.iva);
  const colRecargoIva = mapCol('RECARGO', variantes.recargo_iva);
  const colPeso = mapCol('PESO', variantes.peso);
  const colDimensiones = mapCol('DIMENSIONES', variantes.dimensiones);
  const colColor = mapCol('COLOR', variantes.color);
  const colGarantia = mapCol('GARANTIA', variantes.garantia);
  const colFechaAlta = mapCol('FECHA ALTA', variantes.fecha_alta);
  const colUrlImagen = mapCol('IMAGEN', variantes.url_imagen);
  const colEficienciaEnergetica = mapCol('EFICIENCIA', variantes.eficiencia_energetica);

  // Log de mapeo detectado
  console.log('[parserGenericoUniversal] Mapeo detectado:', {
    colCodigo, colDesc, colDescLarga, colUnidades, colStockMinimo, colPrecio, colPVP, colPVPFinal, 
    colVendidas, colTienda, colNotas, colMarca, colCategoria, colSubcategoria, colCodigoBarras,
    colDescuento, colMargen, colBeneficioUnitario, colBeneficioTotal, colIva, colRecargoIva,
    colPeso, colDimensiones, colColor, colGarantia, colFechaAlta, colUrlImagen, colEficienciaEnergetica
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
    const camposEstandar = [
      colCodigo, colDesc, colDescLarga, colUnidades, colStockMinimo, colPrecio, colPVP, colPVPFinal, 
      colVendidas, colTienda, colNotas, colMarca, colCategoria, colSubcategoria, colCodigoBarras,
      colDescuento, colMargen, colBeneficioUnitario, colBeneficioTotal, colIva, colRecargoIva,
      colPeso, colDimensiones, colColor, colGarantia, colFechaAlta, colUrlImagen, colEficienciaEnergetica
    ];
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
      descripcion: colDescLarga && row[colDescLarga] ? row[colDescLarga].toString().trim() : nombre.toString().trim(), // Usar descripción larga si existe
      precio_compra: limpiarPrecio(row[colPrecio]),
      precio_venta: precioVenta,
      descuento: colDescuento ? limpiarPrecio(row[colDescuento]) : undefined,
      margen: colMargen ? limpiarPrecio(row[colMargen]) : undefined,
      beneficio_unitario: colBeneficioUnitario ? limpiarPrecio(row[colBeneficioUnitario]) : 0,
      beneficio_total: colBeneficioTotal ? limpiarPrecio(row[colBeneficioTotal]) : 0,
      iva: colIva ? limpiarPrecio(row[colIva]) : 21,
      recargo_iva: colRecargoIva ? limpiarPrecio(row[colRecargoIva]) : 0,
      stock_actual: colUnidades ? limpiarPrecio(row[colUnidades]) : (colTienda ? limpiarPrecio(row[colTienda]) : 0),
      stock_minimo: colStockMinimo ? limpiarPrecio(row[colStockMinimo]) : 0,
      unidades_vendidas: colVendidas ? limpiarPrecio(row[colVendidas]) : 0,
      notas: nota || '',
      categoriaExtraidaDelParser: colCategoria && row[colCategoria] ? row[colCategoria].toString().trim() : categoriaActual,
      subcategoria: colSubcategoria && row[colSubcategoria] ? row[colSubcategoria].toString().trim() : '',
      marca: marcaExtraida || (colMarca && row[colMarca] ? row[colMarca].toString().trim() : ''),
      codigo_barras: colCodigoBarras && row[colCodigoBarras] ? row[colCodigoBarras].toString().trim() : '',
      peso: colPeso && row[colPeso] ? row[colPeso].toString().trim() : '',
      dimensiones: colDimensiones && row[colDimensiones] ? row[colDimensiones].toString().trim() : '',
      color: colColor && row[colColor] ? row[colColor].toString().trim() : '',
      garantia: colGarantia && row[colGarantia] ? row[colGarantia].toString().trim() : '',
      fecha_alta: colFechaAlta && row[colFechaAlta] ? row[colFechaAlta].toString().trim() : new Date().toISOString(),
      url_imagen: colUrlImagen && row[colUrlImagen] ? row[colUrlImagen].toString().trim() : '',
      eficiencia_energetica: colEficienciaEnergetica && row[colEficienciaEnergetica] ? row[colEficienciaEnergetica].toString().trim() : '',
      proveedor_nombre: proveedorFinal, // Asegurarse de que siempre tenga el proveedor correcto
      nombre_proveedor: proveedorFinal, // Campo adicional para mostrar en la interfaz
      activo: true, // Campo obligatorio según el esquema
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
