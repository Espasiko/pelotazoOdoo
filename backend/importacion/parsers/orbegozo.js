/**
 * Parser específico para ORBEGOZO
 * Este módulo contiene funciones para procesar datos de productos de ORBEGOZO
 */

import { limpiarPrecio } from '../utils.js';

/**
 * Parser específico para ORBEGOZO
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @param {Object} [config] - Configuración opcional
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parserORBEGOZO(datos, tipo, config = {}) {
  console.log(`[parserORBEGOZO] Procesando ${datos.length} filas de datos ORBEGOZO`);
  
  // Detectar automáticamente las columnas basadas en el encabezado
  const header = datos[0] || {};
  const colMappings = {};
  
  // Buscar columnas por nombre en el encabezado
  Object.keys(header).forEach(key => {
    const headerValue = String(header[key] || '').toUpperCase();
    
    // Mapear columnas según el texto del encabezado
    if (headerValue.includes('REFERENCIA') || headerValue.includes('REF')) {
      colMappings.codigo = key;
    } else if (headerValue.includes('DESCRIPCION') || headerValue.includes('PRODUCTO')) {
      colMappings.nombre = key;
    } else if (headerValue.includes('PRECIO') && headerValue.includes('COMPRA')) {
      colMappings.precio_compra = key;
    } else if (headerValue.includes('PVP') || headerValue.includes('PRECIO VENTA')) {
      colMappings.pvp = key;
    } else if (headerValue.includes('STOCK') || headerValue.includes('UNIDADES')) {
      colMappings.stock = key;
    }
  });
  
  // Si no se detectaron columnas clave, usar mapeo estático conocido para ORBEGOZO
  if (!colMappings.codigo || !colMappings.nombre) {
    colMappings.codigo = 'REFERENCIA';
    colMappings.nombre = 'DESCRIPCION';
    colMappings.precio_compra = 'COSTE';
    colMappings.pvp = 'PVP';
    colMappings.stock = 'STOCK';
  }
  
  // Asegurarse de que la columna precio_compra esté mapeada correctamente
  if (!colMappings.precio_compra) {
    colMappings.precio_compra = 'COSTE';
  }
  
  console.log(`[parserORBEGOZO] Mapeo de columnas detectado:`, colMappings);
  
  // Procesar cada fila
  const productos = [];
  const categoriasDetectadas = [];
  let categoriaActual = 'ORBEGOZO';
  
  for (let i = 1; i < datos.length; i++) {
    const row = datos[i];
    
    // Detectar si es una categoría
    const posibleCategoria = row[colMappings.codigo];
    const esCategoria = 
      posibleCategoria && 
      typeof posibleCategoria === 'string' && 
      !row[colMappings.precio_compra] &&
      !row[colMappings.pvp];
    
    if (esCategoria) {
      categoriaActual = posibleCategoria.trim();
      console.log(`[parserORBEGOZO] Detectada categoría: "${categoriaActual}" en fila ${i}`);
      
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
      proveedor_nombre: 'ORBEGOZO',
      nombre_proveedor: 'ORBEGOZO',
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
    console.log(`[parserORBEGOZO] Producto procesado: ${producto.codigo} - ${producto.nombre} - PV: ${producto.precio_venta}€`);
    
    productos.push(producto);
  }
  
  console.log(`[parserORBEGOZO] Procesamiento completado: ${productos.length} productos y ${categoriasDetectadas.length} categorías`);
  
  return {
    productos: productos,
    categorias: categoriasDetectadas
  };
}
