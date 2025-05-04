// Importar PocketBase
import PocketBase from 'pocketbase';

// Inicializar PocketBase con autoCancel en false para evitar cancelaciones
const pb = new PocketBase('http://127.0.0.1:8090', { 
  autoCancel: false 
});

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
      try {
        // Intentar usar el token existente
        pb.authStore.save(token);
        // Verificar si el token es válido
        if (pb.authStore.isValid) {
          console.log('Ya estamos autenticados con token guardado');
          return true;
        }
      } catch (tokenError) {
        console.error('Error al usar token guardado:', tokenError);
        // Si hay error con el token, limpiamos y continuamos
        pb.authStore.clear();
      }
    }
    
    // Si no hay token válido, mostrar mensaje de error
    console.error('No hay sesión válida de admin. Por favor inicia sesión.');
    return false;
  } catch (error) {
    console.error('Error al autenticar con PocketBase:', error);
    return false;
  }
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
      // Intentar autenticar antes de cada operación
      await autenticarAdmin();
      
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
      const result = await pb.collection(resource).getList(current, pageSize, {
        filter: filterStr,
        sort: sortStr,
      });
      
      return {
        data: result.items,
        total: result.totalItems,
      };
    } catch (error) {
      console.error('Error en getList:', error);
      throw error;
    }
  },
  
  getMany: async ({ resource, ids }) => {
    try {
      await autenticarAdmin();
      
      const filterStr = `id?~ "${ids.join('||')}"`;
      const result = await pb.collection(resource).getList(1, 100, {
        filter: filterStr,
      });
      
      return {
        data: result.items,
      };
    } catch (error) {
      console.error('Error en getMany:', error);
      throw error;
    }
  },
  
  getOne: async ({ resource, id }) => {
    try {
      await autenticarAdmin();
      
      const record = await pb.collection(resource).getOne(id);
      
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
      await autenticarAdmin();
      
      const record = await pb.collection(resource).create(variables);
      
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
      await autenticarAdmin();
      
      const record = await pb.collection(resource).update(id, variables);
      
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
      await autenticarAdmin();
      
      await pb.collection(resource).delete(id);
      
      return {
        data: { id },
      };
    } catch (error) {
      console.error('Error en deleteOne:', error);
      throw error;
    }
  },
  
  getApiUrl: () => {
    return `${pb.baseUrl}/api`;
  },
  
  custom: async ({ url, method, filters, sorters, payload, query, headers }) => {
    try {
      await autenticarAdmin();
      
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
      const response = await pb.send(config.url, config);
      
      return {
        data: response,
      };
    } catch (error) {
      console.error('Error en custom:', error);
      throw error;
    }
  },
};