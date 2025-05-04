/**
 * Utilidades para el sistema de importación
 */

import { pocketbaseConfig } from './config.js';
import fetch from 'node-fetch';

// URL base de PocketBase
const baseUrl = pocketbaseConfig.url;

// Variables globales para almacenar la información de autenticación
let authToken = null;
let adminData = null;

// Función para autenticar como admin
export async function autenticarAdmin() {
  const adminEmail = pocketbaseConfig.admin.email;
  const adminPassword = pocketbaseConfig.admin.password;
  
  try {
    console.log('Intentando autenticar como admin en PocketBase...');
    
    // Si ya tenemos un token válido, lo reutilizamos
    if (authToken) {
      console.log('Ya tenemos un token de autenticación');
      return authToken;
    }
    
    // Intentar autenticar como admin usando la API REST directamente
    // Evitamos usar el SDK de PocketBase debido a problemas conocidos
    console.log(`Autenticando como admin (${adminEmail})...`);
    
    // Primero intentamos con la API de admins (versiones anteriores de PocketBase)
    const loginRes = await fetch(`${baseUrl}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: adminEmail, password: adminPassword })
    });
    
    if (loginRes.ok) {
      const loginData = await loginRes.json();
      authToken = loginData.token;
      adminData = loginData.admin;
      
      console.log('Autenticación exitosa como admin (API admins)');
      return authToken;
    }
    
    // Si falla, intentamos con la colección _superusers (versiones más recientes de PocketBase)
    console.log('Intentando autenticar con _superusers...');
    const superUserRes = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: adminEmail, password: adminPassword })
    });
    
    if (!superUserRes.ok) {
      throw new Error(`Error de autenticación: ${superUserRes.status} ${superUserRes.statusText}`);
    }
    
    const superUserData = await superUserRes.json();
    authToken = superUserData.token;
    adminData = superUserData.record;
    
    console.log('Autenticación exitosa como superadmin');
    return authToken;
  } catch (error) {
    console.error('Error al autenticar como admin:', error);
    throw new Error(`No se pudo autenticar como admin: ${error.message}`);
  }
}

// Función para verificar si existen las colecciones necesarias
export async function verificarColecciones() {
  try {
    console.log('Verificando colecciones en PocketBase...');
    
    // Obtener token de autenticación
    const token = await autenticarAdmin();
    
    if (!token) {
      throw new Error('No se pudo autenticar como admin');
    }
    
    // Usar fetch directo con el token para obtener las colecciones
    const collectionsRes = await fetch(`${baseUrl}/api/collections`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!collectionsRes.ok) {
      throw new Error(`Error al obtener colecciones: ${collectionsRes.status} ${collectionsRes.statusText}`);
    }
    
    const collectionsData = await collectionsRes.json();
    console.log(`Se encontraron ${collectionsData.items?.length || 0} colecciones`);
    
    // Definir las colecciones necesarias
    const coleccionesNecesarias = [
      'productos',
      'categorias',
      'proveedores',
      'devoluciones'
    ];
    
    // Verificar si existen las colecciones necesarias
    const coleccionesFaltantes = coleccionesNecesarias.filter(
      coleccion => !collectionsData.items.some(item => item.name === coleccion)
    );
    
    return {
      success: coleccionesFaltantes.length === 0,
      colecciones: coleccionesNecesarias,
      coleccionesFaltantes
    };
  } catch (error) {
    console.error('Error al verificar colecciones:', error.message);
    throw error;
  }
}

// Función para realizar peticiones a la API de PocketBase como admin
export async function fetchAdmin(endpoint, options = {}) {
  try {
    // Asegurarnos de tener un token válido
    const token = await autenticarAdmin();
    
    // Configurar opciones por defecto
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    // Combinar opciones
    const fetchOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
    
    // Realizar la petición
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    const response = await fetch(url, fetchOptions);
    
    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error en petición a ${url}: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }
    
    // Devolver la respuesta como JSON
    return await response.json();
  } catch (error) {
    console.error('Error en fetchAdmin:', error);
    throw error;
  }
}
