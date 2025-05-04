/**
 * Script para verificar los registros en las colecciones de PocketBase
 */

import PocketBase from 'pocketbase';
import { pocketbaseConfig } from './config.js';

// Inicializar PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

// Función para autenticar como superusuario
async function autenticarComoSuperusuario() {
  try {
    console.log('Intentando autenticar como superusuario...');
    
    // Limpiar cualquier autenticación previa
    pb.authStore.clear();
    
    // Usar el método correcto para autenticar superusuarios
    await pb.collection('_superusers').authWithPassword(
      pocketbaseConfig.admin.email, 
      pocketbaseConfig.admin.password
    );
    
    console.log('Autenticación exitosa como superusuario');
    return true;
  } catch (error) {
    console.error('Error al autenticar como superusuario:', error);
    throw error;
  }
}

// Función para verificar registros en una colección
async function verificarRegistros(coleccion) {
  try {
    console.log(`Verificando registros en la colección ${coleccion}...`);
    
    // Obtener registros
    const registros = await pb.collection(coleccion).getFullList({
      sort: '-created'
    });
    
    console.log(`Se encontraron ${registros.length} registros en la colección ${coleccion}`);
    
    // Mostrar detalles de los primeros 5 registros
    if (registros.length > 0) {
      console.log(`Mostrando detalles de los primeros ${Math.min(5, registros.length)} registros:`);
      
      for (let i = 0; i < Math.min(5, registros.length); i++) {
        console.log(`Registro ${i + 1}:`);
        console.log(JSON.stringify(registros[i], null, 2));
      }
    }
    
    return registros;
  } catch (error) {
    console.error(`Error al verificar registros en la colección ${coleccion}:`, error);
    return [];
  }
}

// Función principal
async function verificarTodasLasColecciones() {
  try {
    // Autenticar como superusuario
    await autenticarComoSuperusuario();
    
    // Colecciones a verificar
    const colecciones = ['categorias', 'proveedores', 'productos', 'importaciones', 'devoluciones'];
    
    // Verificar cada colección
    for (const coleccion of colecciones) {
      await verificarRegistros(coleccion);
      console.log('-----------------------------------');
    }
    
    console.log('Verificación completada');
    return true;
  } catch (error) {
    console.error('Error al verificar colecciones:', error);
    return false;
  }
}

// Ejecutar la verificación
verificarTodasLasColecciones()
  .then(resultado => {
    if (resultado) {
      console.log('Script finalizado correctamente');
    } else {
      console.error('Script finalizado con errores');
    }
    process.exit(resultado ? 0 : 1);
  })
  .catch(error => {
    console.error('Error fatal en el script:', error);
    process.exit(1);
  });
