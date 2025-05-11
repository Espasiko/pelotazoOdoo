/**
 * Cliente base para interactuar con PocketBase
 * Este módulo proporciona funciones básicas para realizar peticiones autenticadas a PocketBase
 */

import { pocketbaseConfig } from '../config.js';

// URL base de PocketBase
const baseUrl = pocketbaseConfig.url;

/**
 * Autenticar como administrador en PocketBase
 */
async function autenticarAdmin() {
  try {
    const url = `${baseUrl}/api/admins/auth-with-password`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identity: process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com',
        password: process.env.POCKETBASE_ADMIN_PASSWORD || '12345678'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en petición a PocketBase: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.token) {
      throw new Error('No se pudo autenticar como administrador');
    }

    return data.token;
  } catch (error) {
    console.error('Error al autenticar como administrador:', error);
    throw error;
  }
}

/**
 * Realizar una petición autenticada como admin a PocketBase
 * @param {string} endpoint - Endpoint al que hacer la petición
 * @param {Object} options - Opciones de la petición
 * @returns {Promise<Object>} - Respuesta de PocketBase
 */
async function fetchAdmin(endpoint, options = {}) {
  try {
    // Obtener token de autenticación
    const authToken = await autenticarAdmin();
    if (!authToken) {
      throw new Error('No se pudo obtener token de autenticación');
    }
    
    // Configurar URL
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    
    // Configurar opciones de la petición
    const fetchOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    // Log para depuración
    console.log(`[fetchAdmin] ${options.method || 'GET'} ${url}`);
    
    // Realizar petición
    const response = await fetch(url, fetchOptions);
    
    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en petición a PocketBase: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Parsear respuesta JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error en fetchAdmin: ${error.message}`);
    throw error;
  }
}

/**
 * Realizar una petición GET autenticada a PocketBase
 * @param {string} endpoint - Endpoint al que hacer la petición
 * @param {Object} options - Opciones adicionales de la petición
 * @returns {Promise<Object>} - Respuesta de PocketBase
 */
async function get(endpoint, options = {}) {
  return fetchAdmin(endpoint, { ...options, method: 'GET' });
}

/**
 * Realizar una petición POST autenticada a PocketBase
 * @param {string} endpoint - Endpoint al que hacer la petición
 * @param {Object} data - Datos a enviar en el cuerpo de la petición
 * @param {Object} options - Opciones adicionales de la petición
 * @returns {Promise<Object>} - Respuesta de PocketBase
 */
async function post(endpoint, data, options = {}) {
  return fetchAdmin(endpoint, {
    ...options,
    method: 'POST',
    headers: {
      ...options.headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

/**
 * Realizar una petición PATCH autenticada a PocketBase
 * @param {string} endpoint - Endpoint al que hacer la petición
 * @param {Object} data - Datos a enviar en el cuerpo de la petición
 * @param {Object} options - Opciones adicionales de la petición
 * @returns {Promise<Object>} - Respuesta de PocketBase
 */
async function patch(endpoint, data, options = {}) {
  return fetchAdmin(endpoint, {
    ...options,
    method: 'PATCH',
    headers: {
      ...options.headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

/**
 * Realizar una petición DELETE autenticada a PocketBase
 * @param {string} endpoint - Endpoint al que hacer la petición
 * @param {Object} options - Opciones adicionales de la petición
 * @returns {Promise<Object>} - Respuesta de PocketBase
 */
async function del(endpoint, options = {}) {
  return fetchAdmin(endpoint, { ...options, method: 'DELETE' });
}

// Exportar cliente completo
export {
  fetchAdmin,
  get,
  post,
  patch,
  del,
  autenticarAdmin
};
