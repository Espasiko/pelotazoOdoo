/**
 * Servicio para la importación de datos
 * Capa de datos: Maneja las peticiones al servidor de importación
 */
import PocketBase from 'pocketbase';

// Instancia de PocketBase para autenticación
const pb = new PocketBase('http://localhost:8090');

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
        const response = await fetch(`${pb.baseUrl}/api/collections/productos/records?page=1&perPage=1`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          return token;
        }
      } catch (e) {
        console.error('Error verificando token:', e);
      }
    }

    // Si no hay token o no es válido, autenticar con credenciales
    const adminEmail = 'admin@pelotazo.com';
    const adminPassword = 'pelotazo2023';
    
    const authData = await pb.admins.authWithPassword(adminEmail, adminPassword);
    return authData.token;
  } catch (error) {
    console.error('Error al autenticar como admin:', error);
    return null;
  }
};

/**
 * Obtiene la lista de proveedores disponibles para importación
 * @returns {Promise<Array>} Lista de proveedores
 */
export const obtenerProveedores = async () => {
  try {
    const token = await autenticarAdmin();
    if (!token) throw new Error('No hay sesión válida de PocketBase (admin)');
    
    const response = await fetch(`${pb.baseUrl}/api/collections/proveedores/records?sort=nombre`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener proveedores: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.items.map(item => ({
      id: item.id,
      nombre: item.nombre,
      codigo: item.codigo
    }));
  } catch (error) {
    console.error('Error en el servicio de importación:', error);
    throw error;
  }
};

/**
 * Sube un archivo para importación
 * @param {File} file - Archivo a subir
 * @param {string} proveedor - Código del proveedor
 * @param {string} tipo - Tipo de importación (productos, precios, stock)
 * @returns {Promise<Object>} Resultado de la importación
 */
export const subirArchivoImportacion = async (file, proveedor, tipo) => {
  try {
    console.log(`Iniciando importación de ${tipo} desde ${proveedor}...`);
    
    // Obtener token de autenticación del admin
    const token = await autenticarAdmin();
    if (!token) throw new Error('No hay sesión válida de PocketBase (admin)');
    
    console.log('Creando FormData para enviar al servidor...');
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('proveedor', proveedor);
    formData.append('tipo', tipo);
    
    console.log('Datos a enviar:', {
      archivo: file.name,
      tipo_archivo: file.type,
      tamaño: file.size,
      proveedor,
      tipo
    });

    // Usar el endpoint del servidor de importación
    console.log(`Enviando petición a ${IMPORT_SERVER_URL}/importar`);
    const response = await fetch(`${IMPORT_SERVER_URL}/importar`, {
      method: 'POST',
      // No incluir Content-Type, dejar que el navegador lo establezca automáticamente con el boundary
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });
    console.log('Respuesta recibida:', response.status, response.statusText);

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

    // Parsear la respuesta
    const data = await response.json();
    console.log('Datos recibidos:', data);
    
    return {
      exito: true,
      importacionId: data.importacionId,
      mensaje: data.mensaje,
      detalles: {
        archivo: data.archivo,
        proveedor: data.proveedor,
        tipo: data.tipo
      }
    };
  } catch (error) {
    console.error('Error en el servicio de importación:', error);
    throw error;
  }
};

/**
 * Obtiene el estado de una importación
 * @param {string} importacionId - ID de la importación
 * @returns {Promise<Object>} Estado de la importación
 */
export const obtenerEstadoImportacion = async (importacionId) => {
  try {
    const token = await autenticarAdmin();
    if (!token) throw new Error('No hay sesión válida de PocketBase (admin)');
    
    const response = await fetch(`${IMPORT_SERVER_URL}/estado/${importacionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener estado: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener estado de importación:', error);
    throw error;
  }
};

/**
 * Obtiene el historial de importaciones
 * @returns {Promise<Array>} Historial de importaciones
 */
export const obtenerHistorialImportaciones = async () => {
  try {
    const token = await autenticarAdmin();
    if (!token) throw new Error('No hay sesión válida de PocketBase (admin)');
    
    const response = await fetch(`${pb.baseUrl}/api/collections/importaciones/records?sort=-created`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener historial: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error al obtener historial de importaciones:', error);
    throw error;
  }
};

export default {
  obtenerProveedores,
  subirArchivoImportacion,
  obtenerEstadoImportacion,
  obtenerHistorialImportaciones
};
