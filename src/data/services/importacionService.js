/**
 * Servicio para la importación de datos
 * Capa de datos: Maneja las peticiones al servidor de importación
 */
import PocketBase from 'pocketbase';

// Instancia de PocketBase para autenticación
const pb = new PocketBase('http://172.21.181.243:8090');

// URL del servidor de importación
const IMPORT_SERVER_URL = 'http://localhost:3100';

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

// Función para autenticar como admin
const autenticarAdmin = async () => {
  try {
    // Verificar si tenemos un token guardado
    const token = getAuthToken();
    if (token) {
      // Verificar si el token es válido haciendo una petición de prueba
      try {
        const response = await fetch(`http://172.21.181.243:8090/api/collections`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          console.log('Ya estamos autenticados con token guardado');
          return token;
        }
      } catch (tokenError) {
        console.error('Error al usar token guardado:', tokenError);
      }
    }
    
    // Si no hay token válido, intentar autenticar directamente
    try {
      console.log('Intentando autenticar como admin directamente...');
      const adminEmail = 'yo@mail.com';
      const adminPassword = 'Ninami12$ya';
      
      // Intentar autenticar con la API de admins
      const response = await fetch(`http://172.21.181.243:8090/api/admins/auth-with-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identity: adminEmail,
          password: adminPassword
        })
      });
      
      if (!response.ok) {
        // Si falla, intentar con la colección _superusers
        const superUserResponse = await fetch(`http://172.21.181.243:8090/api/collections/_superusers/auth-with-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            identity: adminEmail,
            password: adminPassword
          })
        });
        
        if (!superUserResponse.ok) {
          throw new Error(`Error de autenticación: ${superUserResponse.status}`);
        }
        
        const authData = await superUserResponse.json();
        console.log('Autenticación directa exitosa como superuser:', authData);
        
        // Guardar en localStorage
        localStorage.setItem('pelotazo_auth', JSON.stringify({
          token: authData.token,
          model: authData.record,
        }));
        
        return authData.token;
      } else {
        const authData = await response.json();
        console.log('Autenticación directa exitosa como admin:', authData);
        
        // Guardar en localStorage
        localStorage.setItem('pelotazo_auth', JSON.stringify({
          token: authData.token,
          model: authData.record,
        }));
        
        return authData.token;
      }
    } catch (authError) {
      console.error('Error al autenticar directamente:', authError);
      throw authError;
    }
  } catch (error) {
    console.error('Error al autenticar con PocketBase:', error);
    throw error;
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
    const token = await autenticarAdmin();
    if (!token) throw new Error('No hay sesión válida de PocketBase (admin)');
    
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('proveedor', proveedor);
    formData.append('tipo', tipo);
    formData.append('fecha', new Date().toISOString());
    formData.append('estado', 'procesando');
    formData.append('log', 'Iniciando importación...');

    // Usar el endpoint del backend para subir el archivo
    const response = await fetch(`${IMPORT_SERVER_URL}/api/importar`, {
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
    const token = await autenticarAdmin();
    if (!token) throw new Error('No hay sesión válida de PocketBase (admin)');
    
    // Usar el endpoint del backend para obtener el historial
    const response = await fetch(`${IMPORT_SERVER_URL}/api/importaciones`, {
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
    const token = await autenticarAdmin();
    if (!token) throw new Error('No hay sesión válida de PocketBase (admin)');
    
    // Usar el endpoint del backend para obtener el estado
    const response = await fetch(`${IMPORT_SERVER_URL}/api/importaciones/${importacionId}`, {
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
