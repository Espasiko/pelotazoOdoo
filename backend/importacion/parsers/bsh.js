/**
 * Parser específico para BSH (Bosch, Siemens, Neff, Gaggenau)
 * Este módulo proporciona funciones para procesar archivos de BSH
 */

import { detectarCategorias } from '../categorias.js';
import { proveedoresNormalizados } from './providers-map.js';

/**
 * Procesa datos de BSH
 * @param {Array} datos - Datos a procesar
 * @param {string} tipo - Tipo de datos (productos, pedidos, etc.)
 * @param {Object} config - Configuración adicional
 * @returns {Array} - Datos procesados
 */
export function parserBSH(datos, tipo, config = {}) {
  console.log(`[parserBSH] Procesando ${datos.length} registros de BSH`);
  
  // Normalizar nombre del proveedor
  const proveedorNormalizado = proveedoresNormalizados['BSH'] || 'BSH';
  
  // Mapeo de columnas específicas de BSH
  const mapeoColumnas = {
    codigo: ['REFERENCIA', 'EAN', 'MATERIAL', 'CODIGO'],
    nombre: ['DESCRIPCION', 'NOMBRE_ARTICULO', 'DENOMINACION'],
    descripcion: ['DESCRIPCION_LARGA', 'DESCRIPCION_TECNICA', 'CARACTERISTICAS'],
    precio_venta: ['PVP', 'PRECIO_VENTA_RECOMENDADO', 'PRECIO'],
    precio_compra: ['PRECIO_COMPRA', 'COSTE', 'PRECIO_NETO'],
    stock_actual: ['STOCK', 'DISPONIBILIDAD', 'UNIDADES_DISPONIBLES'],
    categoria: ['FAMILIA', 'CATEGORIA', 'LINEA_PRODUCTO']
  };
  
  const productosProcesados = datos.map(producto => {
    // Crear objeto base con valores por defecto
    const productoBase = {
      codigo: '',
      nombre: '',
      descripcion: '',
      precio_venta: 0,
      precio_compra: 0,
      iva: 21,
      stock_actual: 0,
      proveedor: proveedorNormalizado
    };
    
    // Mapear campos específicos de BSH a campos genéricos
    Object.keys(mapeoColumnas).forEach(campoGenerico => {
      const camposEspecificos = mapeoColumnas[campoGenerico];
      
      // Buscar el primer campo específico que exista en el producto
      for (const campoEspecifico of camposEspecificos) {
        if (producto[campoEspecifico] !== undefined) {
          // Convertir a número si es un campo numérico
          if (['precio_venta', 'precio_compra', 'stock_actual', 'iva'].includes(campoGenerico)) {
            productoBase[campoGenerico] = parseFloat(producto[campoEspecifico]) || 0;
          } else {
            productoBase[campoGenerico] = producto[campoEspecifico];
          }
          break;
        }
      }
    });
    
    // Procesar categoría
    if (producto.FAMILIA || producto.CATEGORIA || producto.LINEA_PRODUCTO) {
      const categoriaNombre = producto.FAMILIA || producto.CATEGORIA || producto.LINEA_PRODUCTO;
      productoBase.categoriaExtraidaDelParser = categoriaNombre;
    } else {
      // Intentar detectar categoría a partir del nombre o descripción
      const categorias = detectarCategorias(productoBase.nombre + ' ' + productoBase.descripcion);
      if (categorias.length > 0) {
        productoBase.categoriaExtraidaDelParser = categorias[0];
      }
    }
    
    // Procesar campos específicos de BSH
    
    // Procesar EAN/código de barras
    if (producto.EAN) {
      productoBase.codigo_barras = producto.EAN;
    }
    
    // Procesar marca
    if (producto.MARCA) {
      productoBase.marca = producto.MARCA;
    } else {
      // BSH incluye varias marcas, intentar detectar cuál es
      const nombreLower = productoBase.nombre.toLowerCase();
      if (nombreLower.includes('bosch')) {
        productoBase.marca = 'Bosch';
      } else if (nombreLower.includes('siemens')) {
        productoBase.marca = 'Siemens';
      } else if (nombreLower.includes('neff')) {
        productoBase.marca = 'Neff';
      } else if (nombreLower.includes('gaggenau')) {
        productoBase.marca = 'Gaggenau';
      } else {
        productoBase.marca = 'BSH';
      }
    }
    
    // Procesar dimensiones
    if (producto.DIMENSIONES || producto.MEDIDAS) {
      productoBase.dimensiones = producto.DIMENSIONES || producto.MEDIDAS;
    }
    
    // Procesar peso
    if (producto.PESO) {
      productoBase.peso = producto.PESO;
    }
    
    // Procesar color
    if (producto.COLOR) {
      productoBase.color = producto.COLOR;
    }
    
    // Procesar garantía
    if (producto.GARANTIA) {
      productoBase.garantia = producto.GARANTIA;
    }
    
    // Procesar eficiencia energética
    if (producto.EFICIENCIA_ENERGETICA || producto.CLASE_ENERGETICA) {
      productoBase.eficiencia_energetica = producto.EFICIENCIA_ENERGETICA || producto.CLASE_ENERGETICA;
    }
    
    // Calcular beneficio unitario si tenemos precio de compra y venta
    if (productoBase.precio_compra > 0 && productoBase.precio_venta > 0) {
      productoBase.beneficio_unitario = productoBase.precio_venta - productoBase.precio_compra;
      
      // Calcular margen
      productoBase.margen = ((productoBase.precio_venta - productoBase.precio_compra) / productoBase.precio_compra) * 100;
      
      // Calcular beneficio total si hay stock
      if (productoBase.stock_actual > 0) {
        productoBase.beneficio_total = productoBase.beneficio_unitario * productoBase.stock_actual;
      }
    }
    
    return productoBase;
  });
  
  console.log(`[parserBSH] Procesados ${productosProcesados.length} productos de BSH`);
  return productosProcesados;
}

export default parserBSH;
