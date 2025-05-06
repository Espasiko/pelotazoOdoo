import PocketBase from 'pocketbase';

// Inicializar PocketBase
const pb = new PocketBase('http://172.21.181.243:8090');

export const authProvider = {
  login: async ({ email, password }) => {
    try {
      const authData = await pb.admins.authWithPassword(email, password);
      
      // Si la autenticación es exitosa, guardar el token en localStorage
      localStorage.setItem('pelotazo_auth', JSON.stringify({
        token: pb.authStore.token,
        model: pb.authStore.model,
      }));
      
      return {
        success: true,
        redirectTo: '/admin/dashboard',
      };
    } catch (error) {
      // Si hay un error, devolver un mensaje de error
      return {
        success: false,
        error: {
          message: 'Credenciales incorrectas',
          name: 'Error de autenticación',
        },
      };
    }
  },
  
  logout: async () => {
    // Limpiar la autenticación en PocketBase
    pb.authStore.clear();
    
    // Eliminar el token del localStorage
    localStorage.removeItem('pelotazo_auth');
    
    return {
      success: true,
      redirectTo: '/admin/login',
    };
  },
  
  check: async () => {
    // Verificar si hay un token en localStorage
    const authData = localStorage.getItem('pelotazo_auth');
    
    if (!authData) {
      return {
        authenticated: false,
        redirectTo: '/admin/login',
      };
    }
    
    // Verificar si el token es válido
    try {
      // Restaurar la sesión desde localStorage
      const parsedAuthData = JSON.parse(authData);
      pb.authStore.save(parsedAuthData.token, parsedAuthData.model);
      
      // Verificar si la sesión es válida
      if (pb.authStore.isValid) {
        return {
          authenticated: true,
        };
      } else {
        // Si la sesión no es válida, limpiar y redirigir al login
        pb.authStore.clear();
        localStorage.removeItem('pelotazo_auth');
        
        return {
          authenticated: false,
          redirectTo: '/admin/login',
        };
      }
    } catch (error) {
      // Si hay un error, limpiar y redirigir al login
      pb.authStore.clear();
      localStorage.removeItem('pelotazo_auth');
      
      return {
        authenticated: false,
        redirectTo: '/admin/login',
      };
    }
  },
  
  getPermissions: async () => {
    // Verificar si el usuario está autenticado
    const authData = localStorage.getItem('pelotazo_auth');
    
    if (!authData) {
      return null;
    }
    
    try {
      // Restaurar la sesión desde localStorage
      const parsedAuthData = JSON.parse(authData);
      pb.authStore.save(parsedAuthData.token, parsedAuthData.model);
      
      // Devolver los permisos del usuario (en este caso, simplemente devolvemos el modelo)
      if (pb.authStore.isValid) {
        return pb.authStore.model;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  },
  
  getIdentity: async () => {
    // Verificar si el usuario está autenticado
    const authData = localStorage.getItem('pelotazo_auth');
    
    if (!authData) {
      return null;
    }
    
    try {
      // Restaurar la sesión desde localStorage
      const parsedAuthData = JSON.parse(authData);
      pb.authStore.save(parsedAuthData.token, parsedAuthData.model);
      
      // Devolver la identidad del usuario
      if (pb.authStore.isValid) {
        const { id, email } = pb.authStore.model;
        
        return {
          id,
          email,
          name: email, // Usar el email como nombre por defecto
          avatar: null, // No hay avatar por defecto
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  },
  
  onError: async (error) => {
    // Manejar errores de autenticación
    const status = error?.response?.status;
    
    if (status === 401 || status === 403) {
      // Si hay un error de autenticación, limpiar y redirigir al login
      pb.authStore.clear();
      localStorage.removeItem('pelotazo_auth');
      
      return {
        logout: true,
        redirectTo: '/admin/login',
      };
    }
    
    // Para otros errores, simplemente devolver un mensaje
    return { error };
  },
};