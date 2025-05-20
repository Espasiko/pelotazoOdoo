import axios from 'axios';

// Configuración de la API de Odoo
const ODOO_API_URL = process.env.NEXT_PUBLIC_ODOO_API_URL;
const ODOO_DB = process.env.NEXT_PUBLIC_ODOO_DB;
const ODOO_USERNAME = process.env.NEXT_PUBLIC_ODOO_USERNAME;
const ODOO_PASSWORD = process.env.NEXT_PUBLIC_ODOO_PASSWORD;

// URL del proxy API en Next.js
const PROXY_API_URL = '/api/odoo';

console.log('Configuración de Odoo:', { ODOO_API_URL, ODOO_DB });

// Crear una instancia de axios con configuración personalizada para el proxy API
const api = axios.create({
  baseURL: PROXY_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Aumentar el tiempo de espera para evitar errores de timeout
  timeout: 15000,
  // No usar withCredentials para evitar problemas de CORS
  withCredentials: false,
});

// Configurar axios para que no lance errores en respuestas con códigos de estado 4xx o 5xx
api.defaults.validateStatus = function (status) {
  return status >= 200 && status < 600; // Aceptar cualquier código de estado entre 200 y 599
};

// Interceptor para manejar errores
api.interceptors.response.use(
  response => response,
  error => {
    console.error('Error en la solicitud a Odoo:', error);
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Respuesta del servidor:', error.response.data);
    } else if (error.request) {
      // La solicitud se realizó pero no se recibió respuesta
      console.error('No se recibió respuesta del servidor');
    }
    return Promise.reject(error);
  }
);

// Clase para manejar la autenticación y comunicación con Odoo a través de la API REST
class OdooService {
  private uid: number | null = null;
  private session_id: string | null = null;
  private api_key: string | null = null;

  // Método para autenticarse en Odoo a través del proxy API
  async authenticate() {
    try {
      console.log('Intentando autenticar con Odoo a través del proxy API');
      
      // Intentar autenticación a través del proxy API
      try {
        // Usar el endpoint de autenticación de Odoo a través del proxy
        const response = await api.post('', {
          username: ODOO_USERNAME,
          password: ODOO_PASSWORD,
          db: ODOO_DB
        }, {
          params: {
            endpoint: 'web/session/authenticate'
          }
        });
        
        console.log('Respuesta de autenticación:', response);
        
        if (response.data && response.status === 200) {
          if (response.data.result && response.data.result.uid) {
            this.uid = response.data.result.uid;
            this.session_id = response.data.result.session_id;
            console.log('Autenticación exitosa, UID:', this.uid);
            
            // Almacenar la sesión para futuras solicitudes
            if (this.session_id) {
              localStorage.setItem('odoo_session_id', this.session_id);
            }
            return true;
          }
        }
      } catch (error) {
        console.log('Error en autenticación a través del proxy:', error);
      }
      
      // Intentar con el endpoint de autenticación alternativo
      try {
        const response = await api.post('', {
          login: ODOO_USERNAME,
          password: ODOO_PASSWORD,
          db: ODOO_DB
        }, {
          params: {
            endpoint: 'api/auth'
          }
        });
        
        console.log('Respuesta de API auth alternativa:', response);
        
        if (response.data && response.data.success) {
          this.uid = response.data.uid;
          this.session_id = response.data.session_id;
          console.log('Autenticación exitosa con API alternativa');
          
          // Almacenar la sesión para futuras solicitudes
          if (this.session_id) {
            localStorage.setItem('odoo_session_id', this.session_id);
          }
          return true;
        }
      } catch (error) {
        console.log('Error en autenticación alternativa:', error);
      }
      
      // Si todo falla, intentar con credenciales simples
      // Esto simplemente establece las credenciales para futuras solicitudes
      // sin verificar explícitamente la autenticación
      console.log('Usando credenciales simples para futuras solicitudes');
      this.session_id = 'using-direct-credentials';
      return true;
    } catch (error) {
      console.error('Error de autenticación:', error);
      return false;
    }
  }

  // Método simplificado para obtener productos directamente desde la API de Odoo
  async getProducts(limit: number = 50, offset: number = 0, category?: string) {
    try {
      console.log('Obteniendo productos directamente desde Odoo...');
      
      // Hacer una solicitud directa a la API de Odoo
      const response = await fetch(`${ODOO_API_URL}/api/products?limit=${limit}&offset=${offset}${category ? `&category=${category}` : ''}`);
      
      console.log('Respuesta de la API de Odoo:', response.status);
      
      if (!response.ok) {
        throw new Error(`Error en la respuesta de la API: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Datos recibidos de la API:', data ? 'Sí' : 'No');
      
      if (data && data.success && Array.isArray(data.data)) {
        console.log('Productos obtenidos:', data.data.length);
        return data.data;
      } else {
        console.error('Formato de respuesta inesperado:', data);
        return [];
      }
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return [];
    }
  }

  // Método simplificado para obtener un producto específico directamente desde la API de Odoo
  async getProduct(id: number) {
    try {
      console.log(`Obteniendo producto ${id} directamente desde Odoo...`);
      
      // Hacer una solicitud directa a la API de Odoo
      const response = await fetch(`${ODOO_API_URL}/api/products/${id}`);
      
      console.log(`Respuesta de la API de Odoo para producto ${id}:`, response.status);
      
      if (!response.ok) {
        throw new Error(`Error en la respuesta de la API: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Datos recibidos de la API:', data ? 'Sí' : 'No');
      
      if (data && data.success && data.data) {
        console.log('Producto obtenido:', data.data.id);
        return data.data;
      } else {
        console.error('Formato de respuesta inesperado:', data);
        return null;
      }
    } catch (error) {
      console.error(`Error al obtener el producto ${id}:`, error);
      return null;
    }
  }

  // Método para crear un producto a través del proxy API
  async createProduct(productData: any) {
    if (!this.session_id && !this.api_key) {
      await this.authenticate();
    }

    try {
      console.log('Creando producto a través del proxy API');
      
      const response = await api.post('', productData, { 
        params: {
          endpoint: 'api/products'
        }
      });
      
      console.log('Respuesta de creación de producto:', response);
      return response.data;
    } catch (error) {
      console.error('Error al crear el producto:', error);
      return null;
    }
  }

  // Método para actualizar un producto a través del proxy API
  async updateProduct(id: number, productData: any) {
    if (!this.session_id && !this.api_key) {
      await this.authenticate();
    }

    try {
      console.log(`Actualizando producto ${id} a través del proxy API`);
      
      const response = await api.put('', productData, { 
        params: {
          endpoint: `api/products/${id}`
        }
      });
      
      console.log(`Respuesta de actualización de producto ${id}:`, response);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar el producto ${id}:`, error);
      return null;
    }
  }

  // Método para eliminar un producto a través del proxy API
  async deleteProduct(id: number) {
    if (!this.session_id && !this.api_key) {
      await this.authenticate();
    }

    try {
      console.log(`Eliminando producto ${id} a través del proxy API`);
      
      const response = await api.delete('', { 
        params: {
          endpoint: `api/products/${id}`
        }
      });
      
      console.log(`Respuesta de eliminación de producto ${id}:`, response);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar el producto ${id}:`, error);
      return null;
    }
  }

  // Método para obtener clientes/partners a través del proxy API
  async getPartners(limit: number = 50, offset: number = 0) {
    try {
      console.log(`Obteniendo partners a través del proxy API (limit: ${limit}, offset: ${offset})`);
      
      const response = await api.get('', { 
        params: {
          endpoint: `api/partners`,
          limit,
          offset
        }
      });
      
      console.log('Respuesta de partners:', response);
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error al obtener partners:', error);
      return [];
    }
  }

  // Método para obtener órdenes de venta a través del proxy API
  async getOrders(limit: number = 50, offset: number = 0) {
    try {
      console.log(`Obteniendo órdenes de venta a través del proxy API (limit: ${limit}, offset: ${offset})`);
      
      const response = await api.get('', { 
        params: {
          endpoint: `api/orders`,
          limit,
          offset
        }
      });
      
      console.log('Respuesta de órdenes de venta:', response);
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error al obtener órdenes de venta:', error);
      return [];
    }
  }
}

export const odooService = new OdooService();
export default odooService;
