import { DataProvider, BaseRecord, GetManyParams, GetManyResponse } from "@refinedev/core";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { AUTH_KEY } from "../authProvider";

// Crear una instancia de axios con la URL base de la API de Odoo
const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_ODOO_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para añadir el token de autenticación a cada solicitud
axiosInstance.interceptors.request.use((config) => {
  const authData = localStorage.getItem(AUTH_KEY);
  
  if (authData) {
    try {
      const { token } = JSON.parse(authData);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error al procesar el token de autenticación:", error);
    }
  }
  
  return config;
});

// Función para normalizar los campos de productos
const normalizeProduct = (product: any) => {
  return {
    id: product.id,
    name: product.name,
    price: product.list_price, // Mapear list_price a price para compatibilidad
    list_price: product.list_price,
    description: product.description || '',
    supplier: product.supplier || product.x_nombre_proveedor || '', // Usar cualquiera de los dos campos
    brand: product.brand || product.x_marca || '', // Usar cualquiera de los dos campos
    x_nombre_proveedor: product.x_nombre_proveedor || product.supplier || '',
    x_marca: product.x_marca || product.brand || '',
    x_pvp_web: product.x_pvp_web || 0,
    x_precio_venta_web: product.x_precio_venta_web || 0,
    x_dto: product.x_dto || 0,
    x_precio_margen: product.x_precio_margen || 0,
    x_beneficio: product.x_beneficio || 0,
    x_beneficio_unitario: product.x_beneficio_unitario || 0,
    x_beneficio_total: product.x_beneficio_total || 0,
    x_vendidas: product.x_vendidas || 0,
    // Añadir campos adicionales según sea necesario
  };
};

// Proveedor de datos personalizado para Odoo
export const odooDataProvider: DataProvider = {
  // Obtener una lista de recursos (por ejemplo, productos)
  getList: async ({ resource, pagination, filters, sorters }) => {
    const url = `/api/v1/${resource.toLowerCase()}`;
    
    // Configurar parámetros de paginación
    const { current = 1, pageSize = 10 } = pagination || {};
    const offset = (current - 1) * pageSize;
    
    try {
      const response = await axiosInstance.get(url, {
        params: {
          limit: pageSize,
          offset: offset,
          // Añadir filtros si es necesario
          ...(filters && { filters: JSON.stringify(filters) }),
        },
      });
      
      // Verificar si la respuesta es exitosa
      if (response.data.success) {
        // Normalizar los datos si son productos
        const normalizedData = resource.toLowerCase() === 'products' 
          ? response.data.data.map(normalizeProduct)
          : response.data.data;
          
        return {
          data: normalizedData,
          total: response.data.total || response.data.data.length,
        };
      } else {
        throw new Error(response.data.error || "Error al obtener datos");
      }
    } catch (error) {
      console.error("Error en getList:", error);
      throw error;
    }
  },
  
  // Obtener un recurso específico por ID
  getOne: async ({ resource, id }) => {
    const url = `/api/v1/${resource.toLowerCase()}/${id}`;
    
    try {
      const response = await axiosInstance.get(url);
      
      if (response.data.success) {
        // Normalizar los datos si son productos
        const normalizedData = resource.toLowerCase() === 'products' 
          ? normalizeProduct(response.data.data)
          : response.data.data;
          
        return {
          data: normalizedData,
        };
      } else {
        throw new Error(response.data.error || "Error al obtener el recurso");
      }
    } catch (error) {
      console.error("Error en getOne:", error);
      throw error;
    }
  },
  
  // Crear un nuevo recurso
  create: async ({ resource, variables }) => {
    const url = `/api/v1/${resource.toLowerCase()}`;
    
    try {
      const response = await axiosInstance.post(url, variables);
      
      if (response.data.success) {
        return {
          data: response.data.data,
        };
      } else {
        throw new Error(response.data.error || "Error al crear el recurso");
      }
    } catch (error) {
      console.error("Error en create:", error);
      throw error;
    }
  },
  
  // Actualizar un recurso existente
  update: async ({ resource, id, variables }) => {
    const url = `/api/v1/${resource.toLowerCase()}/${id}`;
    
    try {
      const response = await axiosInstance.put(url, variables);
      
      if (response.data.success) {
        return {
          data: response.data.data,
        };
      } else {
        throw new Error(response.data.error || "Error al actualizar el recurso");
      }
    } catch (error) {
      console.error("Error en update:", error);
      throw error;
    }
  },
  
  // Eliminar un recurso
  deleteOne: async ({ resource, id }) => {
    const url = `/api/v1/${resource.toLowerCase()}/${id}`;
    
    try {
      const response = await axiosInstance.delete(url);
      
      if (response.data.success) {
        return {
          data: response.data.data,
        };
      } else {
        throw new Error(response.data.error || "Error al eliminar el recurso");
      }
    } catch (error) {
      console.error("Error en deleteOne:", error);
      throw error;
    }
  },
  
  // Método para autenticación personalizada
  custom: async ({ url, method, payload, query, headers }) => {
    try {
      const response = await axiosInstance({
        method: method || "GET",
        url,
        data: payload,
        params: query,
        headers,
      });
      
      return {
        data: response.data,
      };
    } catch (error) {
      console.error("Error en custom:", error);
      throw error;
    }
  },
  
  // Métodos requeridos por Refine pero que no usaremos directamente
  getApiUrl: () => import.meta.env.VITE_ODOO_API_URL || "http://localhost:8000",
  getMany: async <TData extends BaseRecord = BaseRecord>({ resource, ids }: GetManyParams): Promise<GetManyResponse<TData>> => {
    // Implementación simple que llama a getOne para cada ID
    const results = await Promise.all(
      ids.map(async (id) => {
        const { data } = await odooDataProvider.getOne({ resource, id });
        return data as TData;
      })
    );
    
    return { data: results };
  },
  createMany: async ({ resource, variables }) => {
    throw new Error("createMany no implementado");
  },
  deleteMany: async ({ resource, ids }) => {
    throw new Error("deleteMany no implementado");
  },
  updateMany: async ({ resource, ids, variables }) => {
    throw new Error("updateMany no implementado");
  },
};

export default odooDataProvider;
