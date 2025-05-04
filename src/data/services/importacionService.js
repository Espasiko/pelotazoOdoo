/**
 * Servicio para la importación de datos
 * Capa de datos: Maneja las peticiones al servidor de importación
 */
import PocketBase from 'pocketbase';

// Instancia de PocketBase para autenticación
const pb = new PocketBase('http://127.0.0.1:8090');

// Función para obtener el token de autenticación del admin
const getAuthToken = () => {
  const authData = localStorage.getItem('pelotazo_auth');
  if (!authData) return null;
  try {
    const parsed = JSON.parse(authData);
    return parsed.token;
  } catch {
    return null;
  }
};

/**
 * Sube un archivo para importación
 * @param {File} file - Archivo a subir
 * @param {string} proveedor - Nombre del proveedor
 * @param {string} tipo - Tipo de importación (productos, precios, stock)
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const subirArchivoImportacion = async (file, proveedor, tipo) => {
  try {
    console.log(`Iniciando importación de ${tipo} desde ${proveedor}...`);
    
    // Obtener token de autenticación del admin
    const token = getAuthToken();
    if (!token) throw new Error('No hay sesión válida de PocketBase (admin)');
    
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('proveedor', proveedor);
    formData.append('tipo', tipo);
    formData.append('fecha', new Date().toISOString());
    formData.append('estado', 'procesando');
    formData.append('log', 'Iniciando importación...');

    // Usar el endpoint del backend para subir el archivo
    const response = await fetch('http://127.0.0.1:3100/api/importar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    // Si la respuesta no es OK, intentar obtener el mensaje de error
    if (!response.ok) {
      let errorMsg = `Error al subir el archivo: ${response.status} ${response.statusText}`;
      try {
        // Intentamos parsear como JSON primero
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } else {
          // Si no es JSON, obtenemos el texto
          const text = await response.text();
          // Si parece HTML, extraemos un mensaje más limpio
          if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            errorMsg = 'Error en el servidor. Verifica que el backend esté funcionando correctamente.';
          } else {
            errorMsg = text || errorMsg;
          }
        }
      } catch (e) {
        console.error('Error al procesar respuesta de error:', e);
      }
      throw new Error(errorMsg);
    }

    // Intentar parsear la respuesta como JSON
    let data;
    try {
      data = await response.json();
      console.log('Importación registrada:', data);
    } catch (e) {
      data = {};
      console.warn('No se pudo parsear la respuesta como JSON');
    }
    return data;
  } catch (error) {
    console.error('Error en el servicio de importación:', error);
    throw error;
  }
};

/**
 * Obtiene el historial de importaciones
 * @returns {Promise<Array>} - Lista de importaciones
 */
export const obtenerHistorialImportaciones = async () => {
  try {
    // Obtener token de autenticación del admin
    const token = getAuthToken();
    if (!token) throw new Error('No hay sesión válida de PocketBase (admin)');
    
    // Usar el endpoint del backend para obtener el historial
    const response = await fetch('http://127.0.0.1:3100/api/importaciones', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Si la respuesta no es OK, intentar obtener el mensaje de error
    if (!response.ok) {
      let errorMsg = `Error al obtener historial: ${response.status} ${response.statusText}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } else {
          const text = await response.text();
          if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            errorMsg = 'Error en el servidor. Verifica que el backend esté funcionando correctamente.';
          } else {
            errorMsg = text || errorMsg;
          }
        }
      } catch (e) {
        console.error('Error al procesar respuesta de error:', e);
      }
      throw new Error(errorMsg);
    }

    // Parsear la respuesta como JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener historial:', error);
    throw error;
  }
};

/**
 * Obtiene el estado de una importación
 * @param {string} importacionId - ID de la importación
 * @returns {Promise<Object>} - Datos de la importación
 */
export const obtenerEstadoImportacion = async (importacionId) => {
  try {
    // Obtener token de autenticación del admin
    const token = getAuthToken();
    if (!token) throw new Error('No hay sesión válida de PocketBase (admin)');
    
    // Usar el endpoint del backend para obtener el estado
    const response = await fetch(`http://127.0.0.1:3100/api/importaciones/${importacionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      let errorMsg = `Error al obtener estado: ${response.status} ${response.statusText}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } else {
          const text = await response.text();
          if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            errorMsg = 'Error en el servidor. Verifica que el backend esté funcionando correctamente.';
          } else {
            errorMsg = text || errorMsg;
          }
        }
      } catch (e) {
        console.error('Error al procesar respuesta de error:', e);
      }
      throw new Error(errorMsg);
    }

    // Parsear la respuesta como JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener estado de importación:', error);
    throw error;
  }
};

export default {
  subirArchivoImportacion,
  obtenerHistorialImportaciones,
  obtenerEstadoImportacion
};
