/**
 * Pruebas unitarias para el parser de BECKEN-TEGALUXE
 * Este script prueba la funcionalidad del parser específico para BECKEN y TEGALUXE
 */

import { strict as assert } from 'assert';
import { parserBECKENTEGALUXE } from '../parsers/becken-tegaluxe.js';

// Datos de prueba para BECKEN
const datosBECKEN = [
  {
    "REFERENCIA": "REFERENCIA",
    "DESCRIPCION": "DESCRIPCION",
    "PRECIO COMPRA": "PRECIO COMPRA",
    "PVP": "PVP",
    "STOCK": "STOCK",
    "CATEGORIA": "CATEGORIA"
  },
  {
    "REFERENCIA": "BK001",
    "DESCRIPCION": "Televisor LED BECKEN 32\"",
    "PRECIO COMPRA": "120.50",
    "PVP": "199.99",
    "STOCK": "5",
    "CATEGORIA": "TELEVISORES"
  },
  {
    "REFERENCIA": "BK002",
    "DESCRIPCION": "Microondas BECKEN BMO2320",
    "PRECIO COMPRA": "45.75",
    "PVP": "79.95",
    "STOCK": "8",
    "CATEGORIA": "MICROONDAS"
  }
];

// Datos de prueba para TEGALUXE
const datosTEGALUXE = [
  {
    "REFERENCIA": "REFERENCIA",
    "DESCRIPCION": "DESCRIPCION",
    "PRECIO COMPRA": "PRECIO COMPRA",
    "PVP": "PVP",
    "STOCK": "STOCK",
    "CATEGORIA": "CATEGORIA"
  },
  {
    "REFERENCIA": "TG001",
    "DESCRIPCION": "Campana extractora TEGALUXE TX600",
    "PRECIO COMPRA": "85.25",
    "PVP": "149.99",
    "STOCK": "3",
    "CATEGORIA": "CAMPANAS"
  },
  {
    "REFERENCIA": "TG002",
    "DESCRIPCION": "Horno TEGALUXE TH450",
    "PRECIO COMPRA": "120.75",
    "PVP": "199.95",
    "STOCK": "6",
    "CATEGORIA": "HORNOS"
  }
];

/**
 * Prueba del Parser de BECKEN
 */
function testParserBECKEN() {
  console.log('\n=== Prueba del Parser de BECKEN ===');
  
  // Ejecutar el parser con los datos de prueba
  const resultado = parserBECKENTEGALUXE(datosBECKEN, 'excel', { proveedor: 'BECKEN' });
  
  // Verificar que se hayan extraído los productos correctamente
  assert(resultado.productos.length === 2, `Se esperaban 2 productos, pero se obtuvieron ${resultado.productos.length}`);
  
  // Verificar que se hayan detectado las categorías correctamente
  assert(resultado.categorias.length === 2, `Se esperaban 2 categorías, pero se obtuvieron ${resultado.categorias.length}`);
  assert(resultado.categorias.includes('TELEVISORES'), 'No se detectó la categoría TELEVISORES');
  assert(resultado.categorias.includes('MICROONDAS'), 'No se detectó la categoría MICROONDAS');
  
  // Verificar que los productos tengan los datos correctos
  const producto1 = resultado.productos.find(p => p.codigo === 'BK001');
  assert(producto1, 'No se encontró el producto con código BK001');
  assert(producto1.nombre === 'Televisor LED BECKEN 32"', 'El nombre del producto BK001 no es correcto');
  assert(producto1.precio_compra === 120.5, 'El precio de compra del producto BK001 no es correcto');
  assert(producto1.precio_venta === 199.99, 'El precio de venta del producto BK001 no es correcto');
  assert(producto1.stock_actual === 5, 'El stock del producto BK001 no es correcto');
  assert(producto1.categoriaExtraidaDelParser === 'TELEVISORES', 'La categoría del producto BK001 no es correcta');
  assert(producto1.proveedor_nombre === 'BECKEN', 'El proveedor del producto BK001 no es correcto');
  
  console.log('✅ Prueba del Parser de BECKEN completada con éxito');
}

/**
 * Prueba del Parser de TEGALUXE
 */
function testParserTEGALUXE() {
  console.log('\n=== Prueba del Parser de TEGALUXE ===');
  
  // Ejecutar el parser con los datos de prueba
  const resultado = parserBECKENTEGALUXE(datosTEGALUXE, 'excel', { proveedor: 'TEGALUXE' });
  
  // Verificar que se hayan extraído los productos correctamente
  assert(resultado.productos.length === 2, `Se esperaban 2 productos, pero se obtuvieron ${resultado.productos.length}`);
  
  // Verificar que se hayan detectado las categorías correctamente
  assert(resultado.categorias.length === 2, `Se esperaban 2 categorías, pero se obtuvieron ${resultado.categorias.length}`);
  assert(resultado.categorias.includes('CAMPANAS'), 'No se detectó la categoría CAMPANAS');
  assert(resultado.categorias.includes('HORNOS'), 'No se detectó la categoría HORNOS');
  
  // Verificar que los productos tengan los datos correctos
  const producto1 = resultado.productos.find(p => p.codigo === 'TG001');
  assert(producto1, 'No se encontró el producto con código TG001');
  assert(producto1.nombre === 'Campana extractora TEGALUXE TX600', 'El nombre del producto TG001 no es correcto');
  assert(producto1.precio_compra === 85.25, 'El precio de compra del producto TG001 no es correcto');
  assert(producto1.precio_venta === 149.99, 'El precio de venta del producto TG001 no es correcto');
  assert(producto1.stock_actual === 3, 'El stock del producto TG001 no es correcto');
  assert(producto1.categoriaExtraidaDelParser === 'CAMPANAS', 'La categoría del producto TG001 no es correcta');
  assert(producto1.proveedor_nombre === 'TEGALUXE', 'El proveedor del producto TG001 no es correcto');
  
  console.log('✅ Prueba del Parser de TEGALUXE completada con éxito');
}

// Ejecutar las pruebas
try {
  testParserBECKEN();
  testParserTEGALUXE();
  console.log('\n✅ TODAS LAS PRUEBAS DEL PARSER DE BECKEN-TEGALUXE COMPLETADAS CON ÉXITO');
} catch (error) {
  console.error('\n❌ ERROR EN LAS PRUEBAS:', error);
  process.exit(1);
}
