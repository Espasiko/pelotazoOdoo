/**
 * Pruebas unitarias para el parser de ORBEGOZO
 * Este script prueba la funcionalidad del parser específico para ORBEGOZO
 */

import { strict as assert } from 'assert';
import { parserORBEGOZO } from '../parsers/orbegozo.js';

// Datos de prueba para ORBEGOZO
const datosORBEGOZO = [
  {
    "REFERENCIA": "REFERENCIA",
    "DESCRIPCION": "DESCRIPCION",
    "COSTE": "COSTE",
    "PVP": "PVP",
    "STOCK": "STOCK"
  },
  {
    "REFERENCIA": "CALEFACCIÓN",
    "DESCRIPCION": "",
    "COSTE": "",
    "PVP": "",
    "STOCK": ""
  },
  {
    "REFERENCIA": "OR001",
    "DESCRIPCION": "Radiador de aceite ORBEGOZO RA1500",
    "COSTE": "45.75",
    "PVP": "89.99",
    "STOCK": "12"
  },
  {
    "REFERENCIA": "OR002",
    "DESCRIPCION": "Calefactor ORBEGOZO CR5016",
    "COSTE": "18.50",
    "PVP": "32.95",
    "STOCK": "20"
  },
  {
    "REFERENCIA": "VENTILACIÓN",
    "DESCRIPCION": "",
    "COSTE": "",
    "PVP": "",
    "STOCK": ""
  },
  {
    "REFERENCIA": "OR003",
    "DESCRIPCION": "Ventilador de pie ORBEGOZO SF0147",
    "COSTE": "22.50",
    "PVP": "39.95",
    "STOCK": "8"
  }
];

/**
 * Prueba del Parser de ORBEGOZO
 */
function testParserORBEGOZO() {
  console.log('\n=== Prueba del Parser de ORBEGOZO ===');
  
  // Ejecutar el parser con los datos de prueba
  const resultado = parserORBEGOZO(datosORBEGOZO, 'excel');
  
  // Verificar que se hayan extraído los productos correctamente
  assert(resultado.productos.length === 3, `Se esperaban 3 productos, pero se obtuvieron ${resultado.productos.length}`);
  
  // Verificar que se hayan detectado las categorías correctamente
  assert(resultado.categorias.length === 2, `Se esperaban 2 categorías, pero se obtuvieron ${resultado.categorias.length}`);
  assert(resultado.categorias.includes('CALEFACCIÓN'), 'No se detectó la categoría CALEFACCIÓN');
  assert(resultado.categorias.includes('VENTILACIÓN'), 'No se detectó la categoría VENTILACIÓN');
  
  // Verificar que los productos tengan los datos correctos
  const producto1 = resultado.productos.find(p => p.codigo === 'OR001');
  assert(producto1, 'No se encontró el producto con código OR001');
  assert(producto1.nombre === 'Radiador de aceite ORBEGOZO RA1500', 'El nombre del producto OR001 no es correcto');
  assert(producto1.precio_compra === 45.75, 'El precio de compra del producto OR001 no es correcto');
  assert(producto1.precio_venta === 89.99, 'El precio de venta del producto OR001 no es correcto');
  assert(producto1.stock_actual === 12, 'El stock del producto OR001 no es correcto');
  assert(producto1.categoriaExtraidaDelParser === 'CALEFACCIÓN', 'La categoría del producto OR001 no es correcta');
  assert(producto1.proveedor_nombre === 'ORBEGOZO', 'El proveedor del producto OR001 no es correcto');
  
  // Verificar que los productos de la segunda categoría tengan la categoría correcta
  const producto3 = resultado.productos.find(p => p.codigo === 'OR003');
  assert(producto3, 'No se encontró el producto con código OR003');
  assert(producto3.categoriaExtraidaDelParser === 'VENTILACIÓN', 'La categoría del producto OR003 no es correcta');
  
  console.log('✅ Prueba del Parser de ORBEGOZO completada con éxito');
}

// Ejecutar la prueba
try {
  testParserORBEGOZO();
  console.log('\n✅ TODAS LAS PRUEBAS DEL PARSER DE ORBEGOZO COMPLETADAS CON ÉXITO');
} catch (error) {
  console.error('\n❌ ERROR EN LAS PRUEBAS:', error);
  process.exit(1);
}
