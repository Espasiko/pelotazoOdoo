/**
 * Parser específico para JATA
 * Este módulo contiene funciones para procesar datos de productos de JATA
 */

import { limpiarPrecio } from '../utils.js';

/**
 * Parser específico para JATA
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de importación
 * @param {Object} [config] - Configuración opcional
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
export function parserJATA(datos, tipo, config = {}) {
  console.log(`[parserJATA] Procesando ${datos.length} filas de datos JATA`);
  
  // Detectar automáticamente las columnas basadas en el encabezado
  const header = datos[0] || {};
  const colMappings = {};
  
  // Mapeo conocido para JATA
  colMappings.codigo = 'REFERENCIA';
  colMappings.nombre = 'DESCRIPCION';
  colMappings.precio_compra = 'COSTE';
  colMappings.pvp = 'PVP';
  colMappings.stock = 'STOCK';
  
  // Procesar cada fila
  const productos = [];
  const categoriasDetectadas = [];
  let categoriaActual = 'JATA';
  
  for (let i = 1; i < datos.length; i++) {
    const row = datos[i];
    
    // Detectar si es una categoría
    const posibleCategoria = row[colMappings.codigo];
    const esCategoria = 
      posibleCategoria && 
      typeof posibleCategoria === 'string' && 
      (posibleCategoria.toUpperCase().includes('TOTAL') || 
       posibleCategoria.toUpperCase().includes('CATEGORIA')) && 
      !row[colMappings.precio_compra];
    
    if (esCategoria) {
      categoriaActual = posibleCategoria.replace(/TOTAL|CATEGORIA/gi, '').trim();
      console.log(`[parserJATA] Detectada categoría: "${categoriaActual}" en fila ${i}`);
      
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
      proveedor_nombre: 'JATA',
      nombre_proveedor: 'JATA',
      iva: 21, // Valor por defecto para IVA
      activo: true, // Producto activo por defecto
      datos_origen: JSON.stringify(row),
      // Campos para notas o textos sueltos
      notas: row['NOTAS'] || row['OBSERVACIONES'] || ''
    };
    
    // Calcular beneficio
    if (producto.precio_venta && producto.precio_compra) {
      producto.beneficio_unitario = parseFloat((producto.precio_venta - producto.precio_compra).toFixed(2));
      producto.beneficio_total = parseFloat((producto.beneficio_unitario * producto.stock_actual).toFixed(2));
    }
    
    // Log para depuración
    console.log(`[parserJATA] Producto procesado: ${producto.codigo} - ${producto.nombre} - PV: ${producto.precio_venta}€`);
    
    productos.push(producto);
  }
  
  console.log(`[parserJATA] Procesamiento completado: ${productos.length} productos y ${categoriasDetectadas.length} categorías`);
  
  return {
    productos: productos,
    categorias: categoriasDetectadas
  };
}
