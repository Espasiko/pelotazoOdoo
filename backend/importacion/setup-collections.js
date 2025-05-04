/**
 * Script para configurar las reglas de acceso de las colecciones en PocketBase
 * Este script modifica las reglas de las colecciones para permitir operaciones CRUD sin autenticación
 */

import PocketBase from 'pocketbase';
import { pocketbaseConfig } from './config.js';
import fetch from 'node-fetch';

// Inicializar PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

// Función para autenticar en el Admin Dashboard
async function loginToAdminDashboard() {
  try {
    console.log('Intentando autenticar en el Admin Dashboard...');
    
    const response = await fetch(`${pocketbaseConfig.url}/_/`, {
      method: 'GET',
      redirect: 'manual'
    });
    
    // Obtener cookies de la respuesta
    const cookies = response.headers.get('set-cookie');
    if (!cookies) {
      throw new Error('No se pudieron obtener cookies del Admin Dashboard');
    }
    
    // Extraer el token CSRF
    const csrfTokenMatch = cookies.match(/pb_admin_auth=([^;]+)/);
    if (!csrfTokenMatch) {
      throw new Error('No se pudo extraer el token CSRF');
    }
    
    const csrfToken = csrfTokenMatch[1];
    console.log('Token CSRF obtenido:', csrfToken);
    
    // Iniciar sesión en el Admin Dashboard
    const loginResponse = await fetch(`${pocketbaseConfig.url}/_/api/admins/auth-with-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `pb_admin_auth=${csrfToken}`
      },
      body: JSON.stringify({
        identity: pocketbaseConfig.admin.email,
        password: pocketbaseConfig.admin.password
      })
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(`Error al iniciar sesión en el Admin Dashboard: ${errorData.message}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('Inicio de sesión exitoso en el Admin Dashboard');
    
    return {
      token: loginData.token,
      admin: loginData.admin,
      cookies: cookies
    };
  } catch (error) {
    console.error('Error al autenticar en el Admin Dashboard:', error);
    throw error;
  }
}

// Función para obtener la lista de colecciones
async function getCollections(authData) {
  try {
    console.log('Obteniendo lista de colecciones...');
    
    const response = await fetch(`${pocketbaseConfig.url}/_/api/collections`, {
      method: 'GET',
      headers: {
        'Authorization': authData.token,
        'Cookie': `pb_admin_auth=${authData.token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al obtener colecciones: ${errorData.message}`);
    }
    
    const collections = await response.json();
    console.log(`Se encontraron ${collections.items.length} colecciones`);
    
    return collections.items;
  } catch (error) {
    console.error('Error al obtener colecciones:', error);
    throw error;
  }
}

// Función para actualizar las reglas de una colección
async function updateCollectionRules(authData, collection) {
  try {
    console.log(`Actualizando reglas de la colección ${collection.name}...`);
    
    // Configurar reglas para permitir todas las operaciones sin autenticación
    const updatedCollection = {
      ...collection,
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: ""
    };
    
    const response = await fetch(`${pocketbaseConfig.url}/_/api/collections/${collection.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authData.token,
        'Cookie': `pb_admin_auth=${authData.token}`
      },
      body: JSON.stringify(updatedCollection)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al actualizar reglas de ${collection.name}: ${errorData.message}`);
    }
    
    console.log(`Reglas de la colección ${collection.name} actualizadas correctamente`);
    return true;
  } catch (error) {
    console.error(`Error al actualizar reglas de ${collection.name}:`, error);
    throw error;
  }
}

// Función principal
async function setupCollections() {
  try {
    // Autenticar en el Admin Dashboard
    const authData = await loginToAdminDashboard();
    
    // Obtener lista de colecciones
    const collections = await getCollections(authData);
    
    // Colecciones que queremos modificar
    const targetCollections = ['productos', 'categorias', 'proveedores', 'importaciones', 'devoluciones'];
    
    // Actualizar reglas de cada colección objetivo
    for (const collection of collections) {
      if (targetCollections.includes(collection.name)) {
        await updateCollectionRules(authData, collection);
      }
    }
    
    console.log('Configuración de colecciones completada con éxito');
  } catch (error) {
    console.error('Error al configurar colecciones:', error);
  }
}

// Ejecutar la configuración
setupCollections()
  .then(() => {
    console.log('Script finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error en el script:', error);
    process.exit(1);
  });
