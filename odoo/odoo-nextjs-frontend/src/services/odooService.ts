import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_ODOO_API_URL;
const DB = process.env.NEXT_PUBLIC_ODOO_DB;
const USERNAME = process.env.NEXT_PUBLIC_ODOO_USERNAME;
const PASSWORD = process.env.NEXT_PUBLIC_ODOO_PASSWORD;

// Clase para manejar la autenticación y comunicación con Odoo a través de la API REST
class OdooService {
  private uid: number | null = null;
  private session_id: string | null = null;
  private token: string | null = null;

  // Método para autenticarse en Odoo
  async authenticate() {
    try {
      const response = await axios.post(`${API_URL}/api/auth`, {
        db: DB,
        login: USERNAME,
        password: PASSWORD
      });

      if (response.data.success) {
        this.uid = response.data.uid;
        this.session_id = response.data.session_id;
        // Guardar el token para futuras solicitudes
        this.token = response.data.session_id;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error de autenticación:', error);
      return false;
    }
  }

  // Método para obtener productos
  async getProducts(limit: number = 50, offset: number = 0, category?: string) {
    try {
      let url = `${API_URL}/api/products?limit=${limit}&offset=${offset}`;
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }

      const response = await axios.get(url);
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }
  }

  // Método para obtener un producto específico
  async getProduct(id: number) {
    try {
      const response = await axios.get(`${API_URL}/api/products/${id}`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error(`Error al obtener el producto ${id}:`, error);
      throw error;
    }
  }

  // Método para crear un producto
  async createProduct(productData: any) {
    if (!this.token) {
      await this.authenticate();
    }

    try {
      const response = await axios.post(`${API_URL}/api/products`, productData, {
        headers: {
          'Content-Type': 'application/json',
          'X-Openerp-Session-Id': this.session_id
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al crear el producto:', error);
      throw error;
    }
  }

  // Método para actualizar un producto
  async updateProduct(id: number, productData: any) {
    if (!this.token) {
      await this.authenticate();
    }

    try {
      const response = await axios.put(`${API_URL}/api/products/${id}`, productData, {
        headers: {
          'Content-Type': 'application/json',
          'X-Openerp-Session-Id': this.session_id
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar el producto ${id}:`, error);
      throw error;
    }
  }

  // Método para eliminar un producto
  async deleteProduct(id: number) {
    if (!this.token) {
      await this.authenticate();
    }

    try {
      const response = await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Openerp-Session-Id': this.session_id
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar el producto ${id}:`, error);
      throw error;
    }
  }

  // Método para obtener clientes/partners
  async getPartners(limit: number = 50, offset: number = 0) {
    try {
      const response = await axios.get(`${API_URL}/api/partners?limit=${limit}&offset=${offset}`);
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  }

  // Método para obtener órdenes de venta
  async getOrders(limit: number = 50, offset: number = 0) {
    try {
      const response = await axios.get(`${API_URL}/api/orders?limit=${limit}&offset=${offset}`);
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error al obtener órdenes de venta:', error);
      throw error;
    }
  }
}

export const odooService = new OdooService();
export default odooService;
