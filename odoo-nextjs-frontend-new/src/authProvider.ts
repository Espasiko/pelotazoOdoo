import type { AuthProvider } from "@refinedev/core";
import axios from "axios";

// Configuración de la API
const API_URL = "http://localhost:8000/api/v1";

export const AUTH_KEY = "auth";

interface AuthData {
  token: string;
  user: {
    id: number;
    name: string;
    username: string;
  };
}

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    try {
      console.log('Iniciando autenticación con:', { username });
      
      const response = await axios.post(
        `${API_URL}/auth/login`, 
        { username, password },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 segundos de timeout
        }
      );

      console.log('Respuesta de autenticación recibida');

      if (response.data?.access_token) {
        const authData: AuthData = {
          token: response.data.access_token,
          user: {
            id: response.data.user_id,
            name: response.data.name || username,
            username,
          }
        };

        localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        
        // Configurar el token por defecto para todas las peticiones
        axios.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
        
        console.log('Autenticación exitosa');
        return {
          success: true,
          redirectTo: "/",
        };
      }
      
      console.error('Error en la autenticación:', response.data);
      return {
        success: false,
        error: {
          name: "LoginError",
          message: response.data?.error || "Error en la autenticación",
        },
      };
    } catch (error: any) {
      console.error("Error de autenticación:", error);
      return {
        success: false,
        error: {
          name: "LoginError",
          message: error.response?.data?.detail || "Error de conexión con el servidor. Por favor, intente nuevamente.",
        },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem(AUTH_KEY);
    delete axios.defaults.headers.common['Authorization'];
    return {
      success: true,
      redirectTo: "/login",
    };
  },

  check: async () => {
    const authData = localStorage.getItem(AUTH_KEY);
    if (authData) {
      try {
        const { token } = JSON.parse(authData);
        if (token) {
          // Configurar el token en las cabeceras por defecto
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return { authenticated: true };
        }
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
      }
    }
    
    return { 
      authenticated: false, 
      redirectTo: "/login",
      error: {
        message: "Por favor inicie sesión para continuar",
        name: "No autenticado"
      }
    };
  },

  getPermissions: async () => {
    const authData = localStorage.getItem(AUTH_KEY);
    return authData ? JSON.parse(authData).user : null;
  },

  getIdentity: async () => {
    const authData = localStorage.getItem(AUTH_KEY);
    if (!authData) return null;
    
    try {
      const { user } = JSON.parse(authData) as AuthData;
      return {
        id: user.id,
        name: user.username,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`,
      };
    } catch (error) {
      console.error("Error al obtener identidad:", error);
      return null;
    }
  },

  onError: async (error: any) => {
    console.error("Error en la autenticación:", error);
    
    // Verificar si el error es de autenticación (401) o permisos (403)
    const status = error?.response?.status || error?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem(AUTH_KEY);
      delete axios.defaults.headers.common['Authorization'];
      
      return { 
        logout: true,
        redirectTo: "/login",
        error: {
          message: "Su sesión ha expirado o no tiene permisos para acceder a este recurso",
          name: "No autorizado"
        }
      };
    }
    
    return {};
  },
};
