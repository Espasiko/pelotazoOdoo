/**
 * Script para registrar un usuario administrador en PocketBase
 */

import fetch from 'node-fetch';
import readline from 'readline';

// URL de PocketBase
const pocketbaseUrl = 'http://127.0.0.1:8090';

// Crear interfaz de línea de comandos
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para preguntar al usuario
function pregunta(texto) {
  return new Promise((resolve) => {
    rl.question(texto, (respuesta) => {
      resolve(respuesta);
    });
  });
}

async function registrarAdmin() {
  console.log(`=== Registrar Administrador en PocketBase (${pocketbaseUrl}) ===\n`);
  
  try {
    // Verificar si PocketBase está respondiendo
    console.log('Verificando conexión con PocketBase...');
    const healthCheck = await fetch(`${pocketbaseUrl}/api/health`);
    
    if (!healthCheck.ok) {
      throw new Error(`PocketBase no está respondiendo correctamente: ${healthCheck.status}`);
    }
    
    console.log('✅ PocketBase está respondiendo correctamente\n');
    
    // Solicitar datos del administrador
    console.log('Por favor, introduce los datos del administrador:');
    const email = await pregunta('Email: ');
    const password = await pregunta('Contraseña: ');
    const passwordConfirm = await pregunta('Confirmar contraseña: ');
    
    if (password !== passwordConfirm) {
      throw new Error('Las contraseñas no coinciden');
    }
    
    // Registrar administrador
    console.log('\nRegistrando administrador...');
    
    const adminData = {
      email,
      password,
      passwordConfirm
    };
    
    const response = await fetch(`${pocketbaseUrl}/api/admins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(adminData)
    });
    
    if (response.ok) {
      console.log('✅ Administrador registrado correctamente');
      
      // Autenticar como administrador
      console.log('\nAutenticando como administrador...');
      
      const authResponse = await fetch(`${pocketbaseUrl}/api/admins/auth-with-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identity: email,
          password
        })
      });
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log('✅ Autenticación exitosa');
        
        // Guardar credenciales en config.js
        console.log('\n¿Deseas guardar estas credenciales en config.js? (s/n)');
        const guardar = await pregunta('> ');
        
        if (guardar.toLowerCase() === 's') {
          console.log('\nActualiza el archivo config.js con las siguientes credenciales:');
          console.log(`
export const pocketbaseConfig = {
  url: '${pocketbaseUrl}',
  admin: {
    email: '${email}',
    password: '${password}'
  }
};
          `);
        }
        
        console.log('\n=== RESUMEN ===');
        console.log('✅ Administrador registrado y autenticado correctamente');
        console.log('✅ Ahora puedes acceder al panel de administración:');
        console.log(`${pocketbaseUrl}/_/`);
        console.log('\nUtiliza estas credenciales para iniciar sesión:');
        console.log(`Email: ${email}`);
        console.log(`Contraseña: ${password}`);
      } else {
        const errorData = await authResponse.json();
        throw new Error(`Error al autenticar: ${errorData.message}`);
      }
    } else {
      const errorData = await response.json();
      
      if (response.status === 400 && errorData.message.includes('already exists')) {
        console.log('⚠️ Ya existe un administrador con ese email');
        console.log('Intenta iniciar sesión en el panel de administración:');
        console.log(`${pocketbaseUrl}/_/`);
      } else {
        throw new Error(`Error al registrar administrador: ${errorData.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Error:');
    console.error(error.message);
  } finally {
    rl.close();
  }
}

// Ejecutar el registro
registrarAdmin();
