/**
 * Utilidades para el sistema de importación
 */

import { pocketbaseConfig } from './config.js';
import fetch from 'node-fetch';

// URL base de PocketBase
const baseUrl = pocketbaseConfig.url;

/**
 * Limpia y valida un precio. Devuelve un número válido o null si es inválido o <= 0.
 * @param {any} v - Valor a limpiar
 * @returns {number|null}
 */
export function limpiarPrecio(v) {
  if (v === undefined || v === null) return null;
  const n = parseFloat((v + '').replace(/[^0-9,\.]/g, '').replace(',', '.'));
  if (isNaN(n) || n <= 0) return null;
  return n;
}


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
    
    // Determinar si estamos usando FormData
    const isFormData = options.body instanceof FormData;
    
    // Configurar opciones por defecto
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        // No establecer Content-Type para FormData, se establecerá automáticamente
        ...(!isFormData && { 'Content-Type': 'application/json' })
      }
    };
    
    // Combinar opciones
    const fetchOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        // Filtrar encabezados que no deben estar presentes con FormData
        ...(isFormData 
            ? Object.entries(options.headers || {}).reduce((acc, [key, value]) => {
                if (key.toLowerCase() !== 'content-type') acc[key] = value;
                return acc;
              }, {}) 
            : options.headers)
      }
    };
    
    // Registrar información de la solicitud
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    console.log(`[fetchAdmin] Enviando ${options.method || 'GET'} a ${url}`);
    if (isFormData) {
      console.log(`[fetchAdmin] Enviando FormData`);
    } else if (options.body && typeof options.body === 'string') {
      try {
        // Intentar registrar el cuerpo como JSON si es posible
        const bodyObj = JSON.parse(options.body);
        console.log(`[fetchAdmin] Cuerpo de la solicitud:`, JSON.stringify(bodyObj));
      } catch (e) {
        // Si no es JSON válido, registrar como está
        console.log(`[fetchAdmin] Cuerpo de la solicitud (no JSON):`, options.body.substring(0, 100) + '...');
      }
    }
    
    // Realizar la petición con reintentos
    const maxRetries = 2;
    let lastError = null;
    
    for (let retry = 0; retry <= maxRetries; retry++) {
      try {
        if (retry > 0) {
          console.log(`[fetchAdmin] Reintento ${retry}/${maxRetries} para ${url}`);
          // Esperar antes de reintentar
          await new Promise(resolve => setTimeout(resolve, 1000 * retry));
        }
        
        const response = await fetch(url, fetchOptions);
        
        // Verificar si la respuesta es exitosa
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            status: response.status,
            statusText: response.statusText
          }));
          
          console.error(`[fetchAdmin] Error HTTP ${response.status}: ${JSON.stringify(errorData)}`);
          
          // Si es un error 429 (Too Many Requests) o 5xx, reintentar
          if ((response.status === 429 || response.status >= 500) && retry < maxRetries) {
            lastError = new Error(`Error en petición a ${url}: ${response.status} ${response.statusText}`);
            lastError.response = response;
            lastError.errorData = errorData;
            continue; // Reintentar
          }
          
          throw new Error(`Error en petición a ${url}: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }
        
        // Intentar parsear la respuesta como JSON
        try {
          const jsonData = await response.json();
          console.log(`[fetchAdmin] Respuesta exitosa de ${url}`);
          return jsonData;
        } catch (jsonError) {
          // Si no es JSON, devolver un objeto con la información básica
          console.warn(`[fetchAdmin] La respuesta no es JSON válido:`, jsonError);
          return { success: true, status: response.status, statusText: response.statusText };
        }
      } catch (fetchError) {
        lastError = fetchError;
        
        // Solo reintentar errores de red o timeout
        if (retry < maxRetries && (fetchError.name === 'TypeError' || fetchError.name === 'AbortError')) {
          console.warn(`[fetchAdmin] Error de red en intento ${retry}, reintentando:`, fetchError);
          continue;
        }
        
        throw fetchError;
      }
    }
    
    // Si llegamos aquí, todos los reintentos fallaron
    throw lastError;
  } catch (error) {
    console.error('[fetchAdmin] Error final:', error);
    throw error;
  }
}
