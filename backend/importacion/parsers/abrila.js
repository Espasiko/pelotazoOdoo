/**
 * Parser específico para archivos de ABRILA
 * Este módulo contiene la función de parser para procesar datos del proveedor ABRILA
 */

import { limpiarPrecio } from '../core/utils.js';

/**
 * Parser para archivos de ABRILA
 * @param {Array} datos - Datos a procesar
 * @returns {Object} - Datos procesados y normalizados con categorías detectadas
 */
function parserABRILA(datos) {
  console.log('[parserABRILA] Iniciando procesamiento de datos ABRILA');
  
  // Detectar categorías y normalizar datos
  const productos = [];
  let categoriasDetectadas = [];
  let categoriaActual = '';

  // Mapeo de columnas para ABRILA
  const colMappings = {
    codigo: 'REFERENCIA',
    nombre: 'DESCRIPCION',
    precio_compra: 'PRECIO COMPRA',
    pvp: 'PVP',
    stock: 'STOCK'
  };

  // Procesar filas
  for (let i = 0; i < datos.length; i++) {
    const row = datos[i];
    
    // Detectar si es una fila de categoría
    if (row['__EMPTY'] && !row[colMappings.codigo] && !row[colMappings.nombre]) {
      categoriaActual = row['__EMPTY'].toString().trim();
      if (!categoriasDetectadas.includes(categoriaActual)) {
        categoriasDetectadas.push(categoriaActual);
      }
      console.log(`[parserABRILA] Detectada categoría: ${categoriaActual}`);
      continue;
    }
    
    // Detectar si es un producto
    const codigo = row[colMappings.codigo];
    const nombre = row[colMappings.nombre];
    
    if (!codigo || !nombre) continue;
    
    // Crear objeto producto
    const producto = {
      codigo: String(codigo),
      nombre: String(nombre),
      descripcion: String(nombre),
      precio_compra: limpiarPrecio(row[colMappings.precio_compra]),
      precio_venta: limpiarPrecio(row[colMappings.pvp]),
      stock_actual: parseInt(row[colMappings.stock] || 0, 10),
      categoriaExtraidaDelParser: categoriaActual,
      proveedor_nombre: 'ABRILA',
      nombre_proveedor: 'ABRILA',
      iva: 21, // Valor por defecto para IVA
      activo: true, // Producto activo por defecto
      datos_origen: JSON.stringify(row),
      // Campos para notas o textos sueltos
      notas: row['NOTAS'] || row['OBSERVACIONES'] || row['COMENTARIOS'] || ''
    };
    
    // Calcular beneficio
    if (producto.precio_venta > 0 && producto.precio_compra > 0) {
      producto.beneficio = producto.precio_venta - producto.precio_compra;
      producto.margen = (producto.beneficio / producto.precio_venta) * 100;
    }
    
    productos.push(producto);
  }

  console.log(`[parserABRILA] Procesados ${productos.length} productos y detectadas ${categoriasDetectadas.length} categorías`);
  
  return {
    productos,
    categorias: categoriasDetectadas
  };
}

export { parserABRILA };
