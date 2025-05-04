/**
 * Script para probar la conexión con PocketBase
 */

import PocketBase from 'pocketbase';
import { pocketbaseConfig } from './config.js';

// URL de PocketBase
const pocketbaseUrl = pocketbaseConfig.url;

// Inicializar PocketBase
const pb = new PocketBase(pocketbaseUrl);

async function testConnection() {
  console.log(`Intentando conectar a PocketBase en ${pocketbaseUrl}...`);
  
  try {
    // Probar primero si podemos acceder a la API sin autenticación
    console.log('Probando acceso a la API sin autenticación...');
    const healthCheck = await fetch(`${pocketbaseUrl}/api/health`);
    if (healthCheck.ok) {
      console.log('✅ PocketBase está respondiendo correctamente');
    } else {
      console.log(`⚠️ PocketBase respondió con estado: ${healthCheck.status}`);
    }
    
    // Intentar crear un usuario de prueba si no existe
    console.log('Intentando registrar un usuario de prueba...');
    try {
      const userData = {
        email: pocketbaseConfig.user.email,
        password: pocketbaseConfig.user.password,
        passwordConfirm: pocketbaseConfig.user.password,
        name: 'Usuario de Prueba'
      };
      
      // Verificar si la colección users existe
      const collectionsResponse = await fetch(`${pocketbaseUrl}/api/collections`);
      const collections = await collectionsResponse.json();
      
      const usersCollection = collections.items.find(c => c.name === 'users');
      
      if (!usersCollection) {
        console.log('⚠️ No se encontró la colección "users". Creando...');
        // Aquí podrías crear la colección users si tienes permisos
      }
      
      // Intentar crear el usuario
      const createUserResponse = await fetch(`${pocketbaseUrl}/api/collections/users/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (createUserResponse.ok) {
        console.log('✅ Usuario creado correctamente');
      } else if (createUserResponse.status === 400) {
        console.log('⚠️ El usuario ya existe o hay un error en los datos');
      } else {
        console.log(`⚠️ Error al crear usuario: ${createUserResponse.status}`);
      }
    } catch (userError) {
      console.log('⚠️ Error al intentar crear usuario:', userError.message);
    }
    
    // Intentar autenticarse como usuario
    console.log(`Intentando autenticar con email: ${pocketbaseConfig.user.email}`);
    const authResponse = await fetch(`${pocketbaseUrl}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identity: pocketbaseConfig.user.email,
        password: pocketbaseConfig.user.password
      })
    });
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Autenticación exitosa como usuario');
      
      // Guardar el token en el almacén de autenticación
      pb.authStore.save(authData.token, authData.record);
      
      // Probar obtener colecciones
      console.log('Obteniendo lista de colecciones...');
      const collectionsResponse = await fetch(`${pocketbaseUrl}/api/collections`, {
        headers: {
          'Authorization': pb.authStore.token
        }
      });
      
      if (collectionsResponse.ok) {
        const collections = await collectionsResponse.json();
        console.log(`✅ Se obtuvieron ${collections.items.length} colecciones:`);
        collections.items.forEach(collection => {
          console.log(`  - ${collection.name}`);
        });
      } else {
        console.log(`⚠️ Error al obtener colecciones: ${collectionsResponse.status}`);
      }
      
      console.log('✅ Conexión con PocketBase establecida correctamente');
    } else {
      const errorData = await authResponse.json();
      throw new Error(`Error de autenticación: ${errorData.message}`);
    }
  } catch (error) {
    console.error('❌ Error al conectar con PocketBase:');
    console.error(error);
    
    if (error.status === 403) {
      console.log('\n⚠️ Error de permisos (403): Verifica que las credenciales sean correctas');
    }
    
    if (error.status === 404 || error.message?.includes('404')) {
      console.log('\n⚠️ Error 404: Verifica que PocketBase esté en ejecución en la URL correcta');
      console.log(`URL utilizada: ${pocketbaseUrl}`);
      console.log('Intentando acceder a la API directamente...');
      
      try {
        const response = await fetch(`${pocketbaseUrl}/api/`);
        if (response.ok) {
          console.log('✅ La API de PocketBase está respondiendo correctamente');
          console.log('El problema podría ser con las credenciales o con el endpoint de autenticación');
        } else {
          console.log(`⚠️ La API de PocketBase respondió con estado: ${response.status}`);
        }
      } catch (fetchError) {
        console.error('❌ Error al acceder directamente a la API:', fetchError);
      }
    }
  }
}

// Ejecutar la prueba
testConnection();
