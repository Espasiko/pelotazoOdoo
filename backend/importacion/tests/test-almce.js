/**
 * Pruebas unitarias para el parser de ALMCE
 * Este script prueba el parser específico para ALMCE
 */

import { strict as assert } from 'assert';
import { parserALMCE } from '../parsers/almce.js';

// Función para crear datos de prueba específicos para ALMCE
function crearDatosPruebaALMCE() {
  return [
    // Encabezado (fila 0)
    {
      REFERENCIA: 'REFERENCIA',
      DESCRIPCION: 'DESCRIPCION',
      COSTE: 'COSTE',
      PVP: 'PVP',
      STOCK: 'STOCK',
      MARCA: 'MARCA'
    },
    // Producto 1 (fila 1)
    {
      REFERENCIA: 'ALMCE001',
      DESCRIPCION: 'Frigorífico Combi BOSCH KGN39VIDA',
      COSTE: '650',
      PVP: '899',
      STOCK: '3',
      MARCA: 'BOSCH'
    },
    // Producto 2 (fila 2)
    {
      REFERENCIA: 'ALMCE002',
      DESCRIPCION: 'Lavadora BALAY 3TS994B',
      COSTE: '450',
      PVP: '599',
      STOCK: '5',
      MARCA: 'BALAY'
    },
    // Fila de total (debe ser ignorada)
    {
      REFERENCIA: 'TOTAL FRIGOS',
      DESCRIPCION: '',
      COSTE: '1100',
      PVP: '',
      STOCK: '8'
    }
  ];
}

// Pruebas para el parser de ALMCE
function testParserALMCE() {
  console.log('\n=== Prueba del Parser de ALMCE ===');
  
  // Crear datos de prueba
  const datos = crearDatosPruebaALMCE();
  
  // Ejecutar parser con categoría FRIGOS
  const resultado = parserALMCE(datos, 'productos', { categoria: 'FRIGOS' });
  
  // Verificar resultados
  assert(resultado && resultado.productos && resultado.productos.length === 2, 'El parser de ALMCE debe procesar 2 productos');
  
  // Verificar campos del primer producto
  const producto1 = resultado.productos[0];
  assert(producto1.codigo === 'ALMCE001', `Código incorrecto: ${producto1.codigo}`);
  assert(producto1.nombre === 'Frigorífico Combi BOSCH KGN39VIDA', `Nombre incorrecto: ${producto1.nombre}`);
  assert(producto1.precio_venta === 899, `Precio de venta incorrecto: ${producto1.precio_venta}`);
  assert(producto1.precio_compra === 650, `Precio de compra incorrecto: ${producto1.precio_compra}`);
  assert(producto1.stock_actual === 3, `Stock incorrecto: ${producto1.stock_actual}`);
  assert(producto1.marca === 'BOSCH', `Marca incorrecta: ${producto1.marca}`);
  assert(producto1.categoriaExtraidaDelParser === 'FRIGOS', `Categoría incorrecta: ${producto1.categoriaExtraidaDelParser}`);
  
  // Verificar que el proveedor sea ALMCE
  assert(producto1.proveedor_nombre === 'ALMCE', `Proveedor incorrecto: ${producto1.proveedor_nombre}`);
  
  // Verificar beneficios calculados
  assert(producto1.beneficio_unitario === 249, `Beneficio unitario incorrecto: ${producto1.beneficio_unitario}`);
  assert(producto1.beneficio_total === 747, `Beneficio total incorrecto: ${producto1.beneficio_total}`);
  
  console.log('✅ Prueba del Parser de ALMCE completada con éxito');
}

// Ejecutar pruebas
try {
  testParserALMCE();
  console.log('\n✅ TODAS LAS PRUEBAS DEL PARSER DE ALMCE COMPLETADAS CON ÉXITO');
} catch (error) {
  console.error('\n❌ ERROR EN LAS PRUEBAS:', error);
  process.exit(1);
}
