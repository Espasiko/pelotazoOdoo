import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { AUTH_KEY } from '../authProvider';

// Crear una instancia de axios con configuración base
const httpClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para añadir el token de autenticación a las peticiones
httpClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    try {
      const authData = localStorage.getItem(AUTH_KEY);
      if (authData) {
        const { token } = JSON.parse(authData);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    } catch (error) {
      console.error('Error al procesar token de autenticación:', error);
      return config;
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    // Manejar errores de red
    if (!error.response) {
      console.error('Error de red:', error.message);
      return Promise.reject({
        message: 'Error de conexión. Por favor, verifica tu conexión a internet o que el servidor esté en funcionamiento.',
        originalError: error,
      });
    }

    // Manejar errores de autenticación (401)
    if (error.response.status === 401) {
      // Limpiar token y redirigir a login
      localStorage.removeItem(AUTH_KEY);
      window.location.href = '/login';
      return Promise.reject({
        message: 'Sesión expirada o inválida. Por favor, inicia sesión nuevamente.',
        originalError: error,
      });
    }

    // Manejar otros errores
    const errorMessage = error.response.data?.detail || error.message || 'Error desconocido';
    console.error(`Error ${error.response.status}:`, errorMessage);
    
    return Promise.reject({
      status: error.response.status,
      message: errorMessage,
      originalError: error,
    });
  }
);

export default httpClient;