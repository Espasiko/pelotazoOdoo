/**
 * Script para probar la conexión con PocketBase de manera simple
 */

import PocketBase from 'pocketbase';

// URL de PocketBase
const pocketbaseUrl = 'http://127.0.0.1:8090';

// Credenciales
const email = 'yo@mail.com';
const password = 'Ninami12$ya';

// Inicializar PocketBase
const pb = new PocketBase(pocketbaseUrl);

async function probarConexion() {
  console.log(`Probando conexión con PocketBase en ${pocketbaseUrl}...`);
  
  try {
    // Probar acceso básico a la API
    console.log('Verificando si PocketBase está respondiendo...');
    
    try {
      const response = await fetch(`${pocketbaseUrl}/api/health`);
      if (response.ok) {
        console.log('✅ PocketBase está respondiendo correctamente');
      } else {
        console.log(`⚠️ PocketBase respondió con estado: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error al conectar con PocketBase:', error.message);
    }
    
    // Intentar autenticarse (probar diferentes endpoints)
    console.log('\nProbando diferentes métodos de autenticación...');
    
    // 1. Probar autenticación de administrador
    console.log('\n1. Intentando autenticación como administrador...');
    try {
      await pb.admins.authWithPassword(email, password);
      console.log('✅ Autenticación exitosa como administrador');
      console.log('Token:', pb.authStore.token);
      return;
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // 2. Probar autenticación de usuario
    console.log('\n2. Intentando autenticación como usuario...');
    try {
      await pb.collection('users').authWithPassword(email, password);
      console.log('✅ Autenticación exitosa como usuario');
      console.log('Token:', pb.authStore.token);
      return;
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // 3. Probar autenticación directa con fetch
    console.log('\n3. Intentando autenticación directa con fetch (admin)...');
    try {
      const response = await fetch(`${pocketbaseUrl}/api/admins/auth-with-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identity: email,
          password: password
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Autenticación exitosa como administrador con fetch');
        console.log('Token:', data.token);
        return;
      } else {
        console.log(`❌ Error: ${response.status} - ${response.statusText}`);
        const errorData = await response.json();
        console.log('Detalles:', errorData);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // 4. Probar autenticación directa con fetch (usuario)
    console.log('\n4. Intentando autenticación directa con fetch (usuario)...');
    try {
      const response = await fetch(`${pocketbaseUrl}/api/collections/users/auth-with-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identity: email,
          password: password
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Autenticación exitosa como usuario con fetch');
        console.log('Token:', data.token);
        return;
      } else {
        console.log(`❌ Error: ${response.status} - ${response.statusText}`);
        const errorData = await response.json();
        console.log('Detalles:', errorData);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // 5. Probar obtener lista de colecciones sin autenticación
    console.log('\n5. Intentando obtener lista de colecciones sin autenticación...');
    try {
      const response = await fetch(`${pocketbaseUrl}/api/collections`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Se obtuvieron colecciones sin autenticación');
        console.log(`Colecciones: ${data.items.map(c => c.name).join(', ')}`);
      } else {
        console.log(`❌ Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('\n❌ No se pudo autenticar con ningún método');
    console.log('Verifica las credenciales y la versión de PocketBase');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la prueba
probarConexion();
