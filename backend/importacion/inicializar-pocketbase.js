/**
 * Script para inicializar PocketBase con las colecciones necesarias
 */

import PocketBase from 'pocketbase';
import fetch from 'node-fetch';

// URL de PocketBase
const pocketbaseUrl = 'http://127.0.0.1:8090';

// Inicializar PocketBase
const pb = new PocketBase(pocketbaseUrl);

async function inicializarPocketBase() {
  console.log(`Inicializando PocketBase en ${pocketbaseUrl}...`);
  
  try {
    // Verificar si PocketBase está respondiendo
    console.log('Verificando conexión con PocketBase...');
    const healthCheck = await fetch(`${pocketbaseUrl}/api/health`);
    
    if (!healthCheck.ok) {
      throw new Error(`PocketBase no está respondiendo correctamente: ${healthCheck.status}`);
    }
    
    console.log('✅ PocketBase está respondiendo correctamente');
    
    // Verificar si existen las colecciones necesarias
    console.log('Verificando colecciones existentes...');
    
    const coleccionesNecesarias = [
      'productos',
      'categorias',
      'proveedores',
      'importaciones',
      'devoluciones',
      'users'
    ];
    
    // Obtener lista de colecciones
    const collectionsResponse = await fetch(`${pocketbaseUrl}/api/collections`);
    
    if (!collectionsResponse.ok) {
      throw new Error(`Error al obtener colecciones: ${collectionsResponse.status}`);
    }
    
    const collectionsData = await collectionsResponse.json();
    const coleccionesExistentes = collectionsData.items.map(c => c.name);
    
    console.log('Colecciones existentes:', coleccionesExistentes);
    
    // Verificar colecciones faltantes
    const coleccionesFaltantes = coleccionesNecesarias.filter(
      c => !coleccionesExistentes.includes(c)
    );
    
    if (coleccionesFaltantes.length > 0) {
      console.log(`⚠️ Faltan las siguientes colecciones: ${coleccionesFaltantes.join(', ')}`);
      console.log('Debes crear estas colecciones manualmente desde el panel de administración de PocketBase:');
      console.log(`${pocketbaseUrl}/_/`);
    } else {
      console.log('✅ Todas las colecciones necesarias existen');
    }
    
    // Verificar si podemos crear un registro en la colección de prueba
    if (coleccionesExistentes.includes('productos')) {
      console.log('Intentando crear un producto de prueba...');
      
      const productoData = {
        nombre: 'Producto de prueba',
        descripcion: 'Este es un producto de prueba',
        precio: 100,
        stock: 10,
        activo: true
      };
      
      try {
        const createResponse = await fetch(`${pocketbaseUrl}/api/collections/productos/records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productoData)
        });
        
        if (createResponse.ok) {
          const createData = await createResponse.json();
          console.log(`✅ Producto de prueba creado con ID: ${createData.id}`);
        } else {
          const errorData = await createResponse.json();
          console.log(`⚠️ Error al crear producto: ${errorData.message}`);
          
          if (errorData.message.includes('Failed to authorize')) {
            console.log('Es necesario autenticarse para crear registros.');
            console.log('Asegúrate de que las colecciones tengan los permisos adecuados.');
          }
        }
      } catch (error) {
        console.log('⚠️ Error al crear producto:', error.message);
      }
    }
    
    console.log('\n===== RESUMEN =====');
    console.log('PocketBase está funcionando correctamente en:', pocketbaseUrl);
    console.log('Panel de administración:', `${pocketbaseUrl}/_/`);
    
    if (coleccionesFaltantes.length > 0) {
      console.log('\n⚠️ ACCIÓN REQUERIDA:');
      console.log('1. Accede al panel de administración de PocketBase');
      console.log('2. Crea las siguientes colecciones:', coleccionesFaltantes.join(', '));
      console.log('3. Configura los permisos adecuados para cada colección');
    } else {
      console.log('\n✅ Sistema listo para usar');
    }
    
  } catch (error) {
    console.error('❌ Error al inicializar PocketBase:');
    console.error(error);
  }
}

// Ejecutar la inicialización
inicializarPocketBase();
