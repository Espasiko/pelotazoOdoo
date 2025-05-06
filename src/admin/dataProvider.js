// Importar PocketBase
import PocketBase from 'pocketbase';

// URL base de PocketBase
const pbUrl = 'http://172.21.181.243:8090';

// Variable para almacenar el token de autenticación
let authToken = null;

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

// Autenticar como administrador al iniciar
async function autenticarAdmin() {
  try {
    // Verificar si tenemos un token guardado
    const token = getAuthToken();
    if (token) {
      // Verificar si el token es válido haciendo una petición de prueba
      try {
        const response = await fetch(`${pbUrl}/api/collections`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          console.log('Ya estamos autenticados con token guardado');
          authToken = token;
          return true;
        }
      } catch (tokenError) {
        console.error('Error al usar token guardado:', tokenError);
        // Si hay error con el token, continuamos con la autenticación directa
      }
    }
    
    // Si no hay token válido, intentar autenticar directamente
    try {
      console.log('Intentando autenticar como admin directamente...');
      const adminEmail = 'yo@mail.com';
      const adminPassword = 'Ninami12$ya';
      
      // Intentar autenticar con la API de admins
      const response = await fetch(`${pbUrl}/api/admins/auth-with-password`, {
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
        const superUserResponse = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
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
        
        // Guardar el token para futuras peticiones
        authToken = authData.token;
        
        // Guardar en localStorage
        localStorage.setItem('pelotazo_auth', JSON.stringify({
          token: authData.token,
          model: authData.record,
        }));
        
        return true;
      } else {
        const authData = await response.json();
        console.log('Autenticación directa exitosa como admin:', authData);
        
        // Guardar el token para futuras peticiones
        authToken = authData.token;
        
        // Guardar en localStorage
        localStorage.setItem('pelotazo_auth', JSON.stringify({
          token: authData.token,
          model: authData.record,
        }));
        
        return true;
      }
    } catch (authError) {
      console.error('Error al autenticar directamente:', authError);
      return false;
    }
  } catch (error) {
    console.error('Error al autenticar con PocketBase:', error);
    return false;
  }
}

// Función para realizar peticiones autenticadas a PocketBase
async function fetchAdmin(endpoint, options = {}) {
  const token = authToken || await getAuthToken();
  if (!token) {
    const autenticado = await autenticarAdmin();
    if (!autenticado) {
      throw new Error('No se pudo autenticar como administrador');
    }
  }
  
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  const url = endpoint.startsWith('http') ? endpoint : `${pbUrl}${endpoint}`;
  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    throw new Error(`Error en petición: ${response.status}`);
  }
  
  return await response.json();
}

// Mapeo de operadores de filtro de Refine a PocketBase
const mapOperator = (operator) => {
  switch (operator) {
    case 'eq':
      return '=';
    case 'ne':
      return '!=';
    case 'lt':
      return '<';
    case 'gt':
      return '>';
    case 'lte':
      return '<=';
    case 'gte':
      return '>=';
    case 'contains':
      return '~';
    case 'containss':
      return '~';
    case 'ncontains':
      return '!~';
    case 'ncontainss':
      return '!~';
    case 'in':
      return 'in';
    case 'nin':
      return '!in';
    default:
      return operator;
  }
};

// Convertir filtros de Refine a formato de PocketBase
const generateFilter = (filters) => {
  const pbFilters = [];
  
  if (filters && filters.length > 0) {
    filters.forEach(filter => {
      if (filter.operator) {
        let operator = mapOperator(filter.operator);
        let { value } = filter;
        
        if (typeof value === 'string') {
          value = `"${value}"`;
        } else if (value === null) {
          value = 'null';
        } else if (Array.isArray(value)) {
          value = `[${value.map(v => typeof v === 'string' ? `"${v}"` : v).join(',')}]`;
        }
        
        pbFilters.push(`${filter.field} ${operator} ${value}`);
      }
    });
  }
  
  return pbFilters;
};

export const dataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    try {
      const { current = 1, pageSize = 10 } = pagination || {};
      
      // Generar filtro
      let filterStr = '';
      if (filters && filters.length > 0) {
        const pbFilters = generateFilter(filters);
        filterStr = pbFilters.join(' && ');
      }
      
      // Generar ordenamiento
      let sortStr = '';
      if (sorters && sorters.length > 0) {
        sortStr = sorters.map(sorter => {
          return sorter.order === 'desc' ? `-${sorter.field}` : `+${sorter.field}`;
        }).join(',');
      }
      
      // Realizar la petición a PocketBase
      const response = await fetchAdmin(`/api/collections/${resource}?page=${current}&perPage=${pageSize}${filterStr ? `&filter=${filterStr}` : ''}${sortStr ? `&sort=${sortStr}` : ''}`);
      
      return {
        data: response.items,
        total: response.totalItems,
      };
    } catch (error) {
      console.error('Error en getList:', error);
      throw error;
    }
  },
  
  getMany: async ({ resource, ids }) => {
    try {
      const filterStr = `id?~ "${ids.join('||')}"`;
      const response = await fetchAdmin(`/api/collections/${resource}?page=1&perPage=100&filter=${filterStr}`);
      
      return {
        data: response.items,
      };
    } catch (error) {
      console.error('Error en getMany:', error);
      throw error;
    }
  },
  
  getOne: async ({ resource, id }) => {
    try {
      const record = await fetchAdmin(`/api/collections/${resource}/records/${id}`);
      
      return {
        data: record,
      };
    } catch (error) {
      console.error('Error en getOne:', error);
      throw error;
    }
  },
  
  create: async ({ resource, variables }) => {
    try {
      const record = await fetchAdmin(`/api/collections/${resource}/records`, {
        method: 'POST',
        body: JSON.stringify(variables),
      });
      
      return {
        data: record,
      };
    } catch (error) {
      console.error('Error en create:', error);
      throw error;
    }
  },
  
  update: async ({ resource, id, variables }) => {
    try {
      const record = await fetchAdmin(`/api/collections/${resource}/records/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(variables),
      });
      
      return {
        data: record,
      };
    } catch (error) {
      console.error('Error en update:', error);
      throw error;
    }
  },
  
  deleteOne: async ({ resource, id }) => {
    try {
      await fetchAdmin(`/api/collections/${resource}/records/${id}`, {
        method: 'DELETE',
      });
      
      return {
        data: { id },
      };
    } catch (error) {
      console.error('Error en deleteOne:', error);
      throw error;
    }
  },
  
  getApiUrl: () => {
    return `${pbUrl}/api`;
  },
  
  custom: async ({ url, method, filters, sorters, payload, query, headers }) => {
    try {
      // Construir la URL completa
      const config = {
        method: method || 'GET',
        url: url || '',
        data: payload,
        params: query,
        headers,
      };
      
      // Generar filtro
      if (filters && filters.length > 0) {
        const pbFilters = generateFilter(filters);
        const filterStr = pbFilters.join(' && ');
        config.params = { ...config.params, filter: filterStr };
      }
      
      // Generar ordenamiento
      if (sorters && sorters.length > 0) {
        const sortStr = sorters.map(sorter => {
          return sorter.order === 'desc' ? `-${sorter.field}` : `+${sorter.field}`;
        }).join(',');
        config.params = { ...config.params, sort: sortStr };
      }
      
      // Realizar la petición personalizada
      const response = await fetchAdmin(config.url, config);
      
      return {
        data: response,
      };
    } catch (error) {
      console.error('Error en custom:', error);
      throw error;
    }
  },
};