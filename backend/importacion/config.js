/**
 * Configuración global para el sistema de importación
 */

// Configuración de PocketBase
export const pocketbaseConfig = {
  url: 'http://172.21.181.243:8090',
  admin: {
    email: 'yo@mail.com',
    password: 'Ninami12$ya'
  },
  clientOptions: {
    autoCancel: false  // Deshabilitar auto-cancelación
  }
};

export default pocketbaseConfig;

// Configuración del servidor
export const serverConfig = {
  port: 3100  // Cambiado de 3002 a 3100 para coincidir con el frontend
};
