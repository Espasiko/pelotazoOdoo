/**
 * Parser específico para ALMCE
 * Este módulo contiene funciones para procesar datos de productos de ALMCE
 */

import { limpiarPrecio } from '../utils.js';

/**
 * Parser específico para ALMCE
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @param {Object} [config] - Configuración opcional
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parserALMCE(datos, tipo, config = {}) {
  console.log(`[parserALMCE] Procesando ${datos.length} filas de datos ALMCE`);
  
  // Detectar la categoría del archivo basado en el nombre del archivo o config
  let categoriaArchivo = '';
  if (config.categoria) {
    categoriaArchivo = config.categoria;
  } else if (config.nombreArchivo) {
    // Extraer categoría del nombre del archivo (ej: "PVP ALMCE.xlsx - FRIGOS_extracted.json" -> "FRIGOS")
    const match = config.nombreArchivo.match(/ALMCE\.xlsx - ([^_]+)/);
    if (match && match[1]) {
      categoriaArchivo = match[1].trim();
    }
  }
  
  console.log(`[parserALMCE] Categoría detectada del archivo: ${categoriaArchivo || 'No detectada'}`);
  
  // Detectar automáticamente las columnas basadas en el encabezado
  const header = datos[0] || {};
  const colMappings = {};
  
  // Mapeo conocido para ALMCE
  colMappings.codigo = 'REFERENCIA';
  colMappings.nombre = 'DESCRIPCION';
  colMappings.precio_compra = 'COSTE';
  colMappings.pvp = 'PVP';
  colMappings.stock = 'STOCK';
  colMappings.marca = 'MARCA';
  
  // Procesar cada fila
  const productos = [];
  const categoriasDetectadas = [];
  let categoriaActual = categoriaArchivo;
  
  // Si tenemos una categoría del archivo, la agregamos a las detectadas
  if (categoriaArchivo && !categoriasDetectadas.includes(categoriaArchivo)) {
    categoriasDetectadas.push(categoriaArchivo);
  }
  
  for (let i = 1; i < datos.length; i++) {
    const row = datos[i];
    
    // Detectar si es una categoría
    if (row[colMappings.codigo] && 
        typeof row[colMappings.codigo] === 'string' && 
        row[colMappings.codigo].includes('TOTAL') && 
        !row[colMappings.pvp]) {
      continue; // Saltar filas de totales
    }
    
    // Detectar producto válido (debe tener código y nombre)
    const codigo = row[colMappings.codigo];
    const nombre = row[colMappings.nombre];
    
    if (!codigo || !nombre) {
      continue; // No es un producto válido
    }
    
    // Extraer marca del nombre si está disponible
    let marca = row[colMappings.marca] || '';
    if (!marca && nombre) {
      const marcasComunes = ['BOSCH', 'SIEMENS', 'BALAY', 'NEFF', 'LG', 'SAMSUNG', 'TEKA', 'WHIRLPOOL', 'BEKO'];
      for (const marcaComun of marcasComunes) {
        if (nombre.toUpperCase().includes(marcaComun)) {
          marca = marcaComun;
          break;
        }
      }
    }
    
    // Crear objeto producto
    const producto = {
      codigo: String(codigo),
      nombre: String(nombre),
      descripcion: String(nombre),
      precio_compra: limpiarPrecio(row[colMappings.precio_compra]),
      precio_venta: limpiarPrecio(row[colMappings.pvp]),
      stock_actual: parseInt(row[colMappings.stock] || 0, 10),
      marca: marca,
      categoriaExtraidaDelParser: categoriaActual,
      proveedor_nombre: 'ALMCE',
      nombre_proveedor: 'ALMCE',
      iva: 21, // Valor por defecto para IVA
      activo: true, // Producto activo por defecto
      datos_origen: JSON.stringify(row),
      // Campos para notas o textos sueltos
      notas: row['NOTAS'] || row['OBSERVACIONES'] || row['COMENTARIOS'] || ''
    };
    
    // Calcular beneficio
    if (producto.precio_venta && producto.precio_compra) {
      producto.beneficio_unitario = producto.precio_venta - producto.precio_compra;
      producto.beneficio_total = producto.beneficio_unitario * producto.stock_actual;
    }
    
    // Log para depuración
    console.log(`[parserALMCE] Producto procesado: ${producto.codigo} - ${producto.nombre} - PV: ${producto.precio_venta}€`);
    
    productos.push(producto);
  }
  
  console.log(`[parserALMCE] Procesamiento completado: ${productos.length} productos y ${categoriasDetectadas.length} categorías`);
  
  return {
    productos: productos,
    categorias: categoriasDetectadas
  };
}
