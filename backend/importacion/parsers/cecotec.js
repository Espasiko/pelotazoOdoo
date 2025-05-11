/**
 * Parser específico para Cecotec
 * Este módulo contiene funciones para procesar datos de productos de Cecotec
 */

import { limpiarPrecio } from '../utils.js';

/**
 * Parser específico para Cecotec
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parseCecotec(datos, tipo) {
  console.log(`[parseCecotec] Procesando ${datos.length} filas de datos Cecotec`);
  
  // Verificar si los datos tienen la estructura esperada para Cecotec
  let tieneEstructuraCecotec = false;
  if (datos && datos.length > 0) {
    // Buscar la primera fila que tenga la columna CECOTEC
    for (let i = 0; i < Math.min(5, datos.length); i++) {
      if (datos[i] && datos[i]['CECOTEC']) {
        tieneEstructuraCecotec = true;
        break;
      }
    }
  }
  
  // Detectar automáticamente las columnas basadas en el encabezado
  const header = datos[0] || {};
  const colMappings = {};
  
  // Buscar columnas por nombre en el encabezado
  Object.keys(header).forEach(key => {
    const headerValue = String(header[key] || '').toUpperCase();
    
    // Mapear columnas según el texto del encabezado
    if (headerValue.includes('CÓDIGO') || headerValue.includes('REFERENCIA') || headerValue.includes('REF')) {
      colMappings.codigo = key;
    } else if (headerValue.includes('DESCRIPCIÓN') || headerValue.includes('NOMBRE') || headerValue.includes('PRODUCTO')) {
      colMappings.nombre = key;
    } else if (headerValue.includes('PRECIO') && headerValue.includes('COMPRA')) {
      colMappings.precio_compra = key;
    } else if (headerValue.includes('PVP') || (headerValue.includes('PRECIO') && headerValue.includes('VENTA'))) {
      colMappings.pvp_final = key;
    } else if (headerValue.includes('STOCK') || headerValue.includes('UNIDADES')) {
      colMappings.stock_tienda = key;
    }
  });
  
  // Si no se detectaron columnas clave, usar el mapeo estático conocido para CECOTEC
  if (!colMappings.codigo || !colMappings.nombre) {
    console.log(`[parseCecotec] No se detectaron columnas clave en el encabezado, usando mapeo estático para CECOTEC`);
    colMappings.codigo = 'CECOTEC';
    colMappings.nombre = '__EMPTY_1';
    colMappings.unidades = '__EMPTY_2';
    colMappings.precio_compra = '__EMPTY_3';
    colMappings.descuento = '__EMPTY_4';
    colMappings.total_con_descuento = '__EMPTY_5';
    colMappings.iva_recargo = '__EMPTY_6';
    colMappings.margen = '__EMPTY_7';
    colMappings.pvp_web = '__EMPTY_8';
    colMappings.pvp_final = '__EMPTY_9';
    colMappings.beneficio_unitario = '__EMPTY_11';
    colMappings.beneficio_total = '__EMPTY_12';
    colMappings.vendidas = '__EMPTY_14';
    colMappings.stock_tienda = '__EMPTY_15';
  }
  
  console.log(`[parseCecotec] Mapeo de columnas detectado:`, colMappings);
  
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
