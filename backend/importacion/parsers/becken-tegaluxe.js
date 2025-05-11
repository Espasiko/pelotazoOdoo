/**
 * Parser específico para BECKEN-TEGALUXE
 * Este módulo contiene funciones para procesar datos de productos de BECKEN y TEGALUXE
 */

import { limpiarPrecio } from '../utils.js';

/**
 * Parser específico para BECKEN-TEGALUXE
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @param {Object} [config] - Configuración opcional
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parserBECKENTEGALUXE(datos, tipo, config = {}) {
  console.log(`[parserBECKENTEGALUXE] Procesando ${datos.length} filas de datos BECKEN-TEGALUXE`);
  
  // Determinar el proveedor específico (BECKEN o TEGALUXE)
  let proveedor = 'BECKEN-TEGALUXE';
  if (config && config.proveedor) {
    proveedor = config.proveedor.toUpperCase();
  } else if (config && config.nombreArchivo) {
    if (config.nombreArchivo.toUpperCase().includes('BECKEN')) {
      proveedor = 'BECKEN';
    } else if (config.nombreArchivo.toUpperCase().includes('TEGALUXE')) {
      proveedor = 'TEGALUXE';
    }
  }
  
  console.log(`[parserBECKENTEGALUXE] Proveedor detectado: ${proveedor}`);
  
  // Detectar automáticamente las columnas basadas en el encabezado
  const header = datos[0] || {};
  const colMappings = {};
  
  // Buscar columnas por nombre en el encabezado
  Object.keys(header).forEach(key => {
    const headerValue = String(header[key] || '').toUpperCase();
    
    // Mapear columnas según el texto del encabezado
    if (headerValue.includes('REFERENCIA') || headerValue.includes('REF') || headerValue.includes('CODIGO')) {
      colMappings.codigo = key;
    } else if (headerValue.includes('DESCRIPCION') || headerValue.includes('PRODUCTO') || headerValue.includes('ARTICULO')) {
      colMappings.nombre = key;
    } else if (headerValue.includes('PRECIO') && (headerValue.includes('COMPRA') || headerValue.includes('COSTE'))) {
      colMappings.precio_compra = key;
    } else if (headerValue.includes('PVP') || (headerValue.includes('PRECIO') && headerValue.includes('VENTA'))) {
      colMappings.pvp = key;
    } else if (headerValue.includes('STOCK') || headerValue.includes('UNIDADES') || headerValue.includes('EXISTENCIAS')) {
      colMappings.stock = key;
    } else if (headerValue.includes('CATEGORIA') || headerValue.includes('FAMILIA')) {
      colMappings.categoria = key;
    }
  });
  
  // Si no se detectaron columnas clave, usar mapeo estático conocido
  if (!colMappings.codigo || !colMappings.nombre) {
    colMappings.codigo = 'REFERENCIA';
    colMappings.nombre = 'DESCRIPCION';
    colMappings.precio_compra = 'PRECIO COMPRA';
    colMappings.pvp = 'PVP';
    colMappings.stock = 'STOCK';
    colMappings.categoria = 'CATEGORIA';
  }
  
  console.log(`[parserBECKENTEGALUXE] Mapeo de columnas detectado:`, colMappings);
  
  // Procesar cada fila
  const productos = [];
  const categoriasDetectadas = [];
  let categoriaActual = '';
  
  for (let i = 1; i < datos.length; i++) {
    const row = datos[i];
    
    // Detectar si es una categoría
    if (colMappings.categoria && row[colMappings.categoria]) {
      categoriaActual = row[colMappings.categoria].toString().trim();
      
      // Guardar categoría si no existe ya y no está vacía
      if (categoriaActual && !categoriasDetectadas.includes(categoriaActual)) {
        categoriasDetectadas.push(categoriaActual);
        console.log(`[parserBECKENTEGALUXE] Detectada categoría: "${categoriaActual}" en fila ${i}`);
      }
    }
    
    // También detectar filas que son categorías (sin productos)
    const posibleCategoria = row[colMappings.codigo];
    const esCategoria = 
      posibleCategoria && 
      typeof posibleCategoria === 'string' && 
      !row[colMappings.precio_compra] &&
      !row[colMappings.pvp];
    
    if (esCategoria) {
      categoriaActual = posibleCategoria.trim();
      console.log(`[parserBECKENTEGALUXE] Detectada categoría: "${categoriaActual}" en fila ${i}`);
      
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
    
    // Crear objeto producto
    const producto = {
      codigo: String(codigo),
      nombre: String(nombre),
      descripcion: String(nombre),
      precio_compra: limpiarPrecio(row[colMappings.precio_compra]),
      precio_venta: limpiarPrecio(row[colMappings.pvp]),
      stock_actual: parseInt(row[colMappings.stock] || 0, 10),
      categoriaExtraidaDelParser: categoriaActual,
      proveedor_nombre: proveedor,
      nombre_proveedor: proveedor,
      iva: 21, // Valor por defecto para IVA
      activo: true, // Producto activo por defecto
      datos_origen: JSON.stringify(row),
      // Campos para notas o textos sueltos
      notas: row['NOTAS'] || row['OBSERVACIONES'] || row['COMENTARIOS'] || ''
    };
    
    // Calcular beneficio
    if (producto.precio_venta && producto.precio_compra) {
      producto.beneficio_unitario = parseFloat((producto.precio_venta - producto.precio_compra).toFixed(2));
      producto.beneficio_total = parseFloat((producto.beneficio_unitario * producto.stock_actual).toFixed(2));
    }
    
    // Log para depuración
    console.log(`[parserBECKENTEGALUXE] Producto procesado: ${producto.codigo} - ${producto.nombre} - PV: ${producto.precio_venta}€`);
    
    productos.push(producto);
  }
  
  console.log(`[parserBECKENTEGALUXE] Procesamiento completado: ${productos.length} productos y ${categoriasDetectadas.length} categorías`);
  
  return {
    productos: productos,
    categorias: categoriasDetectadas
  };
}
