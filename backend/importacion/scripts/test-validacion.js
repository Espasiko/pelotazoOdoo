/**
 * Script para probar la validación de datos
 * Este script prueba la funcionalidad de validación de datos con ejemplos reales e inventados
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { validateProduct, validateProvider, validateCategory } from '../core/data-validator.js';
import { procesarArchivo } from '../core/file-processor.js';
import { importarABaseDeDatos } from '../core/db-importer.js';
import { fetchAdmin } from '../db/client.js';

// Configuración de rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Función principal
async function testValidacion() {
  console.log('=== INICIANDO PRUEBA DE VALIDACIÓN DE DATOS ===');
  
  // 1. Probar validación de productos individuales
  console.log('\n--- Prueba 1: Validación de productos individuales ---');
  
  // Producto válido
  const productoValido = {
    codigo: 'TEST001',
    nombre: 'Producto de prueba válido',
    descripcion: 'Este es un producto válido para pruebas',
    precio_venta: 99.99,
    precio_compra: 50.00,
    iva: 21,
    stock_actual: 10
  };
  
  // Producto con errores no críticos
  const productoConErrores = {
    codigo: 'TEST002',
    nombre: 'Producto con errores',
    precio_venta: -10, // Error: precio negativo
    precio_compra: 100, // Error: precio de compra mayor que venta
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
  
  // Mostrar resultados
  console.log('\nProducto válido:');
  console.log('- Es válido:', resultadoValido.isValid);
  console.log('- Errores:', resultadoValido.errors.length > 0 ? resultadoValido.errors : 'Ninguno');
  console.log('- Producto normalizado:', resultadoValido.product);
  
  console.log('\nProducto con errores no críticos:');
  console.log('- Es válido:', resultadoConErrores.isValid);
  console.log('- Errores:', resultadoConErrores.errors);
  console.log('- Producto normalizado:', resultadoConErrores.product);
  
  console.log('\nProducto con errores críticos:');
  console.log('- Es válido:', resultadoConErroresCriticos.isValid);
  console.log('- Errores:', resultadoConErroresCriticos.errors);
  console.log('- Producto normalizado:', resultadoConErroresCriticos.product);
  
  // 2. Probar validación de proveedores
  console.log('\n--- Prueba 2: Validación de proveedores ---');
  
  const proveedorValido = {
    nombre: 'Proveedor Test',
    email: 'contacto@proveedor-test.com',
    telefono: '912345678'
  };
  
  const proveedorConErrores = {
    nombre: 'Proveedor Con Errores',
    email: 'email-invalido',
    telefono: '123'
  };
  
  const resultadoProveedorValido = validateProvider(proveedorValido);
  const resultadoProveedorConErrores = validateProvider(proveedorConErrores);
  
  console.log('\nProveedor válido:');
  console.log('- Es válido:', resultadoProveedorValido.isValid);
  console.log('- Errores:', resultadoProveedorValido.errors.length > 0 ? resultadoProveedorValido.errors : 'Ninguno');
  console.log('- Proveedor normalizado:', resultadoProveedorValido.provider);
  
  console.log('\nProveedor con errores:');
  console.log('- Es válido:', resultadoProveedorConErrores.isValid);
  console.log('- Errores:', resultadoProveedorConErrores.errors);
  console.log('- Proveedor normalizado:', resultadoProveedorConErrores.provider);
  
  // 3. Probar validación de categorías
  console.log('\n--- Prueba 3: Validación de categorías ---');
  
  const categoriaValida = {
    nombre: 'electrodomésticos',
    descripcion: 'Categoría de electrodomésticos'
  };
  
  const categoriaConErrores = {
    descripcion: 'Categoría sin nombre'
  };
  
  const resultadoCategoriaValida = validateCategory(categoriaValida);
  const resultadoCategoriaConErrores = validateCategory(categoriaConErrores);
  
  console.log('\nCategoría válida:');
  console.log('- Es válida:', resultadoCategoriaValida.isValid);
  console.log('- Errores:', resultadoCategoriaValida.errors.length > 0 ? resultadoCategoriaValida.errors : 'Ninguno');
  console.log('- Categoría normalizada:', resultadoCategoriaValida.category);
  
  console.log('\nCategoría con errores:');
  console.log('- Es válida:', resultadoCategoriaConErrores.isValid);
  console.log('- Errores:', resultadoCategoriaConErrores.errors);
  console.log('- Categoría normalizada:', resultadoCategoriaConErrores.category);
  
  // 4. Probar validación con un archivo real (opcional)
  try {
    // Buscar un archivo JSON o Excel de prueba en la carpeta jsons
    const rutaArchivoPrueba = path.join(rootDir, 'jsons', 'PVP_CECOTEC.json');
    console.log(`\n--- Prueba 4: Procesando archivo real: ${rutaArchivoPrueba} ---`);
    
    // Procesar archivo
    const datosArchivo = await procesarArchivo(rutaArchivoPrueba, 'Cecotec');
    console.log(`Archivo procesado. Se encontraron ${datosArchivo.length} productos.`);
    
    // Validar los primeros 5 productos para no saturar la consola
    console.log('\nValidando los primeros 5 productos del archivo:');
    for (let i = 0; i < Math.min(5, datosArchivo.length); i++) {
      const producto = datosArchivo[i];
      const resultadoValidacion = validateProduct(producto);
      
      console.log(`\nProducto #${i+1}: ${producto.codigo} - ${producto.nombre}`);
      console.log('- Es válido:', resultadoValidacion.isValid);
      console.log('- Errores:', resultadoValidacion.errors.length > 0 ? resultadoValidacion.errors : 'Ninguno');
      console.log('- Campos normalizados:', Object.keys(resultadoValidacion.product).join(', '));
    }
    
    // Contar cuántos productos tienen errores
    let productosConErrores = 0;
    let erroresCriticos = 0;
    let erroresNoCriticos = 0;
    
    for (const producto of datosArchivo) {
      const resultadoValidacion = validateProduct(producto);
      if (!resultadoValidacion.isValid) {
        productosConErrores++;
        
        // Verificar si hay errores críticos
        if (resultadoValidacion.errors.some(e => e.includes('obligatorio'))) {
          erroresCriticos++;
        } else {
          erroresNoCriticos++;
        }
      }
    }
    
    console.log(`\nResumen de validación del archivo completo:`);
    console.log(`- Total de productos: ${datosArchivo.length}`);
    console.log(`- Productos con errores: ${productosConErrores} (${((productosConErrores/datosArchivo.length)*100).toFixed(2)}%)`);
    console.log(`- Productos con errores críticos: ${erroresCriticos}`);
    console.log(`- Productos con errores no críticos: ${erroresNoCriticos}`);
    
  } catch (error) {
    console.error('Error al procesar archivo real:', error);
  }
  
  console.log('\n=== PRUEBA DE VALIDACIÓN COMPLETADA ===');
}

// Ejecutar prueba
testValidacion().catch(error => {
  console.error('Error en la prueba de validación:', error);
});
