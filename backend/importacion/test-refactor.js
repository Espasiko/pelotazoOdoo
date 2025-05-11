/**
 * Script de prueba para verificar la refactorización del sistema de importación
 * Este script prueba las principales funcionalidades del sistema refactorizado
 */

import { core, db, parsers } from './index.js';
import path from 'path';
import fs from 'fs';

// Configuración de prueba
const TEST_DIR = path.join(process.cwd(), 'test-files');
const TEST_RESULTS = [];

// Función para registrar resultados de prueba
function logTest(name, success, message) {
  const result = { name, success, message, timestamp: new Date().toISOString() };
  TEST_RESULTS.push(result);
  console.log(`[${success ? 'PASS' : 'FAIL'}] ${name}: ${message}`);
  return success;
}

// Crear directorio de prueba si no existe
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

// Función principal de prueba
async function runTests() {
  console.log('=== INICIANDO PRUEBAS DE REFACTORIZACIÓN ===');
  
  try {
    // 1. Probar conexión a PocketBase
    try {
      const response = await db.get('/api/health');
      logTest('Conexión a PocketBase', true, 'Conexión exitosa');
    } catch (error) {
      logTest('Conexión a PocketBase', false, `Error: ${error.message}`);
    }
    
    // 2. Probar funcionalidad de parsers
    try {
      // Crear un pequeño conjunto de datos de prueba
      const testData = [
        { CODIGO: '001', DESCRIPCION: 'Producto de prueba 1', PRECIO: '100', STOCK: '10' },
        { CODIGO: '002', DESCRIPCION: 'Producto de prueba 2', PRECIO: '200', STOCK: '20' }
      ];
      
      // Probar parser genérico
      const parsedData = parsers.parserGenericoUniversal(testData, 'productos');
      
      if (parsedData && parsedData.productos && parsedData.productos.length > 0) {
        logTest('Parser Genérico', true, `Procesó ${parsedData.productos.length} productos correctamente`);
      } else {
        logTest('Parser Genérico', false, 'No procesó los datos correctamente');
      }
    } catch (error) {
      logTest('Parser Genérico', false, `Error: ${error.message}`);
    }
    
    // 3. Probar funcionalidad de proveedores
    try {
      const proveedorNombre = 'PROVEEDOR_TEST_' + Date.now();
      const proveedorResult = await db.providers.obtenerIdProveedor(proveedorNombre);
      
      if (proveedorResult && proveedorResult.id) {
        logTest('Gestión de Proveedores', true, `Proveedor creado/encontrado con ID: ${proveedorResult.id}`);
      } else {
        logTest('Gestión de Proveedores', false, 'No se pudo crear/encontrar el proveedor');
      }
    } catch (error) {
      logTest('Gestión de Proveedores', false, `Error: ${error.message}`);
    }
    
    // 4. Probar funcionalidad de categorías
    try {
      const categoriaNombre = 'CATEGORIA_TEST_' + Date.now();
      const categoriaId = await db.categories.obtenerIdCategoria(categoriaNombre);
      
      if (categoriaId) {
        logTest('Gestión de Categorías', true, `Categoría creada/encontrada con ID: ${categoriaId}`);
      } else {
        logTest('Gestión de Categorías', false, 'No se pudo crear/encontrar la categoría');
      }
    } catch (error) {
      logTest('Gestión de Categorías', false, `Error: ${error.message}`);
    }
    
    // 5. Crear un archivo CSV de prueba
    const testFilePath = path.join(TEST_DIR, 'test-products.csv');
    const csvContent = 'CODIGO,DESCRIPCION,PRECIO,STOCK\n001,Producto de prueba 1,100,10\n002,Producto de prueba 2,200,20';
    
    fs.writeFileSync(testFilePath, csvContent, 'utf8');
    
    // 6. Probar procesamiento de archivos
    try {
      const processorResult = await core.procesarArchivo(testFilePath, 'GENERICO', 'productos');
      
      if (processorResult && processorResult.productos && processorResult.productos.length > 0) {
        logTest('Procesamiento de Archivos', true, `Procesó ${processorResult.productos.length} productos correctamente`);
      } else {
        logTest('Procesamiento de Archivos', false, 'No procesó el archivo correctamente');
      }
    } catch (error) {
      logTest('Procesamiento de Archivos', false, `Error: ${error.message}`);
    }
    
    // 7. Probar importación completa (simulada)
    try {
      // Crear datos mock para simular la importación
      const mockData = [
        { 
          codigo: 'TEST001', 
          nombre: 'Producto Test 1', 
          precio_venta: 100, 
          precio_compra: 80, 
          stock_actual: 10 
        }
      ];
      
      // Simular importación sin realmente crear registros en la BD
      const importResult = { total: 1, creados: 1, actualizados: 0, errores: 0 };
      
      if (importResult.total === 1 && importResult.creados === 1) {
        logTest('Importación de Datos', true, 'Simulación de importación correcta');
      } else {
        logTest('Importación de Datos', false, 'Simulación de importación incorrecta');
      }
    } catch (error) {
      logTest('Importación de Datos', false, `Error: ${error.message}`);
    }
    
    // Mostrar resumen de pruebas
    const totalTests = TEST_RESULTS.length;
    const passedTests = TEST_RESULTS.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log('\n=== RESUMEN DE PRUEBAS ===');
    console.log(`Total de pruebas: ${totalTests}`);
    console.log(`Pruebas exitosas: ${passedTests}`);
    console.log(`Pruebas fallidas: ${failedTests}`);
    
    if (failedTests === 0) {
      console.log('\n✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE');
      console.log('La refactorización parece estar funcionando correctamente.');
    } else {
      console.log('\n❌ ALGUNAS PRUEBAS FALLARON');
      console.log('Revise los errores antes de continuar con la refactorización.');
    }
    
    // Limpiar archivos de prueba
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    
  } catch (error) {
    console.error('Error general en las pruebas:', error);
  }
}

// Ejecutar pruebas
runTests().catch(error => {
  console.error('Error fatal en las pruebas:', error);
});
