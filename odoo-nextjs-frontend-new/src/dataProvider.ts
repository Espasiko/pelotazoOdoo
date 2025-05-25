import { DataProvider } from "@refinedev/core";
import { stringify } from "query-string";
import httpClient from "./api/httpClient";

const API_URL = "/"; // Base URL ya está configurada en httpClient

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    const url = `${API_URL}/${resource}`;
    
    const { current = 1, pageSize = 10 } = pagination ?? {};
    
    const queryFilters: Record<string, any> = {};
    
    // Procesar filtros
    if (filters) {
      filters.forEach((filter) => {
        if (filter.operator === "eq" && filter.value !== undefined) {
          queryFilters[filter.field] = filter.value;
        } else if (filter.operator === "contains" && filter.value !== undefined) {
          queryFilters["search"] = filter.value;
        }
      });
    }
    
    // Procesar ordenación
    let order = undefined;
    if (sorters && sorters.length > 0) {
      const sorter = sorters[0];
      order = `${sorter.field} ${sorter.order === "desc" ? "desc" : "asc"}`;
    }
    
    const query = {
      limit: pageSize,
      offset: (current - 1) * pageSize,
      ...queryFilters,
      order,
    };
    
    const { data } = await axiosInstance.get(`${url}?${stringify(query)}`);
    
    return {
      data: data.data,
      total: data.total,
    };
  },
  
  getOne: async ({ resource, id, meta }) => {
    const url = `${API_URL}/${resource}/${id}`;
    
    const { data } = await axiosInstance.get(url);
    
    return {
      data,
    };
  },
  
  create: async ({ resource, variables, meta }) => {
    const url = `${API_URL}/${resource}`;
    
    const { data } = await axiosInstance.post(url, variables);
    
    return {
      data,
    };
  },
  
  update: async ({ resource, id, variables, meta }) => {
    const url = `${API_URL}/${resource}/${id}`;
    
    const { data } = await axiosInstance.put(url, variables);
    
    return {
      data,
    };
  },
  
  deleteOne: async ({ resource, id, meta }) => {
    const url = `${API_URL}/${resource}/${id}`;
    
    const { data } = await axiosInstance.delete(url);
    
    return {
      data,
    };
  },
  
  getApiUrl: () => {
    return API_URL;
  },
  
  custom: async ({ url, method, filters, sorters, payload, query, headers }: {
    url: string;
    method: "get" | "delete" | "head" | "options" | "post" | "put" | "patch";
    filters?: any;
    sorters?: any;
    payload?: any;
    query?: any;
    headers?: Record<string, string>;
  }) => {
    let requestUrl = `${API_URL}${url}`;
    
    if (query) {
      requestUrl = `${requestUrl}?${stringify(query)}`;
    }
    
    if (headers) {
      // Añadir headers a la petición actual en lugar de modificar los defaults
      Object.keys(headers).forEach(key => {
        axiosInstance.defaults.headers.common[key] = headers[key];
      });
    }
    
    let axiosResponse;
    switch (method) {
      case "put":
      case "post":
      case "patch":
        axiosResponse = await axiosInstance[method](requestUrl, payload);
        break;
      case "delete":
        axiosResponse = await axiosInstance.delete(requestUrl, {
          data: payload,
        });
        break;
      default:
        axiosResponse = await axiosInstance.get(requestUrl);
        break;
    }
    
    const { data } = axiosResponse;
    
    return { data };
  },
};
