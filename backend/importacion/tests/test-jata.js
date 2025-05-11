/**
 * Pruebas unitarias para el parser de JATA
 * Este script prueba la funcionalidad del parser específico para JATA
 */

import { strict as assert } from 'assert';
import { parserJATA } from '../parsers/jata.js';

// Datos de prueba para JATA
const datosJATA = [
  {
    "REFERENCIA": "REFERENCIA",
    "DESCRIPCION": "DESCRIPCION",
    "COSTE": "COSTE",
    "PVP": "PVP",
    "STOCK": "STOCK"
  },
  {
    "REFERENCIA": "CATEGORIA PEQUEÑO ELECTRODOMESTICO",
    "DESCRIPCION": "",
    "COSTE": "",
    "PVP": "",
    "STOCK": ""
  },
  {
    "REFERENCIA": "JT001",
    "DESCRIPCION": "Plancha de vapor JATA PL501",
    "COSTE": "15.50",
    "PVP": "29.99",
    "STOCK": "10"
  },
  {
    "REFERENCIA": "JT002",
    "DESCRIPCION": "Tostadora JATA TT500",
    "COSTE": "12.75",
    "PVP": "24.95",
    "STOCK": "15"
  },
  {
    "REFERENCIA": "CATEGORIA COCINA",
    "DESCRIPCION": "",
    "COSTE": "",
    "PVP": "",
    "STOCK": ""
  },
  {
    "REFERENCIA": "JT003",
    "DESCRIPCION": "Batidora JATA BT200",
    "COSTE": "18.25",
    "PVP": "34.99",
    "STOCK": "8"
  }
];

/**
 * Prueba del Parser de JATA
 */
function testParserJATA() {
  console.log('\n=== Prueba del Parser de JATA ===');
  
  // Ejecutar el parser con los datos de prueba
  const resultado = parserJATA(datosJATA, 'excel');
  
  // Verificar que se hayan extraído los productos correctamente
  assert(resultado.productos.length === 3, `Se esperaban 3 productos, pero se obtuvieron ${resultado.productos.length}`);
  
  // Verificar que se hayan detectado las categorías correctamente
  assert(resultado.categorias.length === 2, `Se esperaban 2 categorías, pero se obtuvieron ${resultado.categorias.length}`);
  assert(resultado.categorias.includes('PEQUEÑO ELECTRODOMESTICO'), 'No se detectó la categoría PEQUEÑO ELECTRODOMESTICO');
  assert(resultado.categorias.includes('COCINA'), 'No se detectó la categoría COCINA');
  
  // Verificar que los productos tengan los datos correctos
  const producto1 = resultado.productos.find(p => p.codigo === 'JT001');
  assert(producto1, 'No se encontró el producto con código JT001');
  assert(producto1.nombre === 'Plancha de vapor JATA PL501', 'El nombre del producto JT001 no es correcto');
  assert(producto1.precio_compra === 15.5, 'El precio de compra del producto JT001 no es correcto');
  assert(producto1.precio_venta === 29.99, 'El precio de venta del producto JT001 no es correcto');
  assert(producto1.stock_actual === 10, 'El stock del producto JT001 no es correcto');
  assert(producto1.categoriaExtraidaDelParser === 'PEQUEÑO ELECTRODOMESTICO', 'La categoría del producto JT001 no es correcta');
  assert(producto1.proveedor_nombre === 'JATA', 'El proveedor del producto JT001 no es correcto');
  
  // Verificar que los productos de la segunda categoría tengan la categoría correcta
  const producto3 = resultado.productos.find(p => p.codigo === 'JT003');
  assert(producto3, 'No se encontró el producto con código JT003');
  assert(producto3.categoriaExtraidaDelParser === 'COCINA', 'La categoría del producto JT003 no es correcta');
  
  console.log('✅ Prueba del Parser de JATA completada con éxito');
}

// Ejecutar la prueba
try {
  testParserJATA();
  console.log('\n✅ TODAS LAS PRUEBAS DEL PARSER DE JATA COMPLETADAS CON ÉXITO');
} catch (error) {
  console.error('\n❌ ERROR EN LAS PRUEBAS:', error);
  process.exit(1);
}
