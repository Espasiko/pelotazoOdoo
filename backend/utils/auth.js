// Autenticación y fetchAdmin robusto para PocketBase
import { POCKETBASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD } from '../config/index.js';

let adminToken = null;
let tokenExpires = null;

/**
 * Autentica como admin y obtiene un token válido. Reutiliza el token si sigue siendo válido.
 * Lanza error si no puede autenticarse.
 */
export async function autenticarAdmin() {
  // Si ya hay token y no ha expirado, reutilizar
  if (adminToken && tokenExpires && Date.now() < tokenExpires) {
    return adminToken;
  }
  // Login directo a la API REST de PocketBase
  const loginRes = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  if (!loginRes.ok) {
    throw new Error(`[auth] Error autenticando admin: ${loginRes.status} ${loginRes.statusText}`);
  }
  const loginData = await loginRes.json();
  adminToken = loginData.token;
  // PocketBase devuelve expires en segundos desde epoch
  tokenExpires = loginData.admin?.tokenExpires ? loginData.admin.tokenExpires * 1000 : Date.now() + 10 * 60 * 1000; // fallback: 10 min
  return adminToken;
}

/**
 * Hace una petición autenticada como admin a la API REST de PocketBase.
 * endpoint: puede ser relativo o absoluto.
 * options: fetch options extra.
 */
export async function fetchAdmin(endpoint, options = {}) {
  const token = await autenticarAdmin();
  const defaultHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  const fetchOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  };
  const url = endpoint.startsWith('http') ? endpoint : `${POCKETBASE_URL}${endpoint}`;
  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    throw new Error(`[fetchAdmin] Error en petición: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}
