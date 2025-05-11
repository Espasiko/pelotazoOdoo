/**
 * Pruebas unitarias para el módulo de validación de datos
 * Este script prueba las funciones de validación y normalización de datos
 */

import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import { validateProduct, validateProvider, validateCategory } from '../core/data-validator.js';

// Configuración de rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Pruebas para la validación de productos
function testValidacionProductos() {
  console.log('\n=== Prueba de Validación de Productos ===');
  
  // Producto válido
  const productoValido = {
    codigo: 'PROD001',
    nombre: 'Televisor LED 55"',
    descripcion: 'Televisor LED 4K de 55 pulgadas',
    precio_venta: 499.99,
    precio_compra: 350.00,
    iva: 21,
    stock_actual: 10
  };
  
  // Producto con errores no críticos
  const productoConErrores = {
    codigo: 'PROD002',
    nombre: 'Lavadora con errores',
    precio_venta: -10, // Error: precio negativo
    precio_compra: 400, // Error: precio de compra mayor que venta
    iva: 15, // Error: IVA no estándar
    stock_actual: 'cinco' // Error: stock no numérico
  };
  
  // Producto con errores críticos
  const productoConErroresCriticos = {
    descripcion: 'Producto sin código ni nombre',
    precio_venta: 29.99
  };
  
  // Ejecutar validaciones
  const resultadoValido = validateProduct(productoValido);
  const resultadoConErrores = validateProduct(productoConErrores);
  const resultadoConErroresCriticos = validateProduct(productoConErroresCriticos);
  
  // Verificar producto válido
  assert(resultadoValido.isValid === true, 'El producto válido debe pasar la validación');
  assert(resultadoValido.errors.length === 0, 'El producto válido no debe tener errores');
  
  // Verificar producto con errores no críticos
  assert(resultadoConErrores.isValid === false, 'El producto con errores debe fallar la validación');
  assert(resultadoConErrores.errors.length > 0, 'El producto con errores debe tener errores');
  assert(resultadoConErrores.product.precio_venta === -10, 'El precio de venta negativo debe mantenerse para ser corregido en el importer');
  assert(resultadoConErrores.product.iva === 21, 'El IVA no estándar debe normalizarse a 21');
  
  // Verificar producto con errores críticos
  assert(resultadoConErroresCriticos.isValid === false, 'El producto con errores críticos debe fallar la validación');
  assert(resultadoConErroresCriticos.errors.some(e => e.includes('código')), 'Debe detectar que falta el código');
  assert(resultadoConErroresCriticos.errors.some(e => e.includes('nombre')), 'Debe detectar que falta el nombre');
  
  console.log('✅ Prueba de Validación de Productos completada con éxito');
}

// Pruebas para la validación de proveedores
function testValidacionProveedores() {
  console.log('\n=== Prueba de Validación de Proveedores ===');
  
  // Proveedor válido
  const proveedorValido = {
    nombre: 'Proveedor Test',
    email: 'contacto@proveedor-test.com',
    telefono: '912345678'
  };
  
  // Proveedor con errores
  const proveedorConErrores = {
    nombre: 'Proveedor Con Errores',
    email: 'email-invalido',
    telefono: '123'
  };
  
  // Proveedor con errores críticos
  const proveedorConErroresCriticos = {
    email: 'contacto@proveedor-sin-nombre.com'
  };
  
  // Ejecutar validaciones
  const resultadoValido = validateProvider(proveedorValido);
  const resultadoConErrores = validateProvider(proveedorConErrores);
  const resultadoConErroresCriticos = validateProvider(proveedorConErroresCriticos);
  
  // Verificar proveedor válido
  assert(resultadoValido.isValid === true, 'El proveedor válido debe pasar la validación');
  assert(resultadoValido.errors.length === 0, 'El proveedor válido no debe tener errores');
  assert(resultadoValido.provider.telefono === '912 34 56 78', 'El teléfono debe formatearse correctamente');
  
  // Verificar proveedor con errores
  assert(resultadoConErrores.isValid === false, 'El proveedor con errores debe fallar la validación');
  assert(resultadoConErrores.errors.length > 0, 'El proveedor con errores debe tener errores');
  assert(resultadoConErrores.errors.some(e => e.includes('email')), 'Debe detectar que el email es inválido');
  assert(resultadoConErrores.errors.some(e => e.includes('teléfono')), 'Debe detectar que el teléfono es demasiado corto');
  
  // Verificar proveedor con errores críticos
  assert(resultadoConErroresCriticos.isValid === false, 'El proveedor con errores críticos debe fallar la validación');
  assert(resultadoConErroresCriticos.errors.some(e => e.includes('nombre')), 'Debe detectar que falta el nombre');
  
  console.log('✅ Prueba de Validación de Proveedores completada con éxito');
}

// Pruebas para la validación de categorías
function testValidacionCategorias() {
  console.log('\n=== Prueba de Validación de Categorías ===');
  
  // Categoría válida
  const categoriaValida = {
    nombre: 'electrodomésticos',
    descripcion: 'Categoría de electrodomésticos'
  };
  
  // Categoría con errores críticos
  const categoriaConErroresCriticos = {
    descripcion: 'Categoría sin nombre'
  };
  
  // Ejecutar validaciones
  const resultadoValido = validateCategory(categoriaValida);
  const resultadoConErroresCriticos = validateCategory(categoriaConErroresCriticos);
  
  // Verificar categoría válida
  assert(resultadoValido.isValid === true, 'La categoría válida debe pasar la validación');
  assert(resultadoValido.errors.length === 0, 'La categoría válida no debe tener errores');
  assert(resultadoValido.category.nombre === 'Electrodomésticos', 'El nombre de la categoría debe capitalizarse');
  
  // Verificar categoría con errores críticos
  assert(resultadoConErroresCriticos.isValid === false, 'La categoría con errores críticos debe fallar la validación');
  assert(resultadoConErroresCriticos.errors.some(e => e.includes('nombre')), 'Debe detectar que falta el nombre');
  
  console.log('✅ Prueba de Validación de Categorías completada con éxito');
}

// Pruebas para la normalización de datos
function testNormalizacionDatos() {
  console.log('\n=== Prueba de Normalización de Datos ===');
  
  // Producto con datos que requieren normalización
  const productoParaNormalizar = {
    codigo: '  PROD003  ',
    nombre: ' Televisor con espacios en blanco ',
    precio_venta: '599.9',
    precio_compra: '400',
    stock_actual: '15.5',
    iva: '9.5', // Valor que debe normalizarse a 10
    descuento: '110' // Valor fuera de rango
  };
  
  // Ejecutar validación (que incluye normalización)
  const resultado = validateProduct(productoParaNormalizar);
  
  // Verificar normalización
  assert(resultado.product.codigo === 'PROD003', 'Los espacios deben eliminarse del código');
  assert(resultado.product.nombre === 'Televisor con espacios en blanco', 'Los espacios deben eliminarse del nombre');
  assert(resultado.product.precio_venta === 599.9, 'El precio de venta debe convertirse a número');
  assert(resultado.product.precio_compra === 400, 'El precio de compra debe convertirse a número');
  assert(resultado.product.stock_actual === 15, 'El stock debe redondearse a entero');
  assert(resultado.product.iva === 10, 'El IVA debe normalizarse a un valor estándar (10)');
  assert(resultado.product.descuento === 100, 'El descuento debe limitarse a 100%');
  
  // Verificar campos calculados
  assert(resultado.product.beneficio_unitario === 199.9, 'El beneficio unitario debe calcularse correctamente');
  assert(resultado.product.margen === 49.97, 'El margen debe calcularse correctamente'); // Ajustado al redondeo real
  assert(resultado.product.beneficio_total === 2998.5, 'El beneficio total debe calcularse correctamente');
  
  console.log('✅ Prueba de Normalización de Datos completada con éxito');
}

// Función principal para ejecutar todas las pruebas
async function ejecutarPruebas() {
  console.log('=== INICIANDO PRUEBAS UNITARIAS DE VALIDACIÓN DE DATOS ===');
  
  try {
    // Ejecutar pruebas
    testValidacionProductos();
    testValidacionProveedores();
    testValidacionCategorias();
    testNormalizacionDatos();
    
    console.log('\n✅ TODAS LAS PRUEBAS DE VALIDACIÓN DE DATOS COMPLETADAS CON ÉXITO');
  } catch (error) {
    console.error('\n❌ ERROR EN LAS PRUEBAS:', error);
    process.exit(1);
  }
}

// Ejecutar pruebas
ejecutarPruebas();
