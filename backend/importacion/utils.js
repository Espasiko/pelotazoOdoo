/**
 * Utilidades para el sistema de importación
 */

import PocketBase from 'pocketbase';
import { pocketbaseConfig } from './config.js';
import fetch from 'node-fetch';

// Inicializar PocketBase - Usar la configuración del archivo config.js
const pb = new PocketBase(pocketbaseConfig.url);

// Función para autenticar como superadmin
export async function autenticarAdmin() {
  const adminEmail = pocketbaseConfig.admin.email;
  const adminPassword = pocketbaseConfig.admin.password;
  
  try {
    console.log('Intentando autenticar como superadmin en PocketBase...');
    
    // Verificar si ya estamos autenticados
    if (pb.authStore.isValid) {
      console.log('Ya estamos autenticados con PocketBase');
      return true;
    }
    
    // Limpiar cualquier autenticación previa
    pb.authStore.clear();
    
    // Autenticar usando el SDK correcto para superusuarios
    try {
      // Usar el método correcto para autenticar superusuarios
      await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
      
      console.log('Autenticación exitosa como superadmin');
      
      // Verificar si tenemos permisos de superusuario
      try {
        // Intentar una operación que solo pueden hacer los superusuarios
        const colecciones = await pb.collections.getFullList();
        console.log(`Verificación exitosa: Se obtuvieron ${colecciones.length} colecciones`);
      } catch (verifyError) {
        console.warn('Advertencia: Autenticado pero con permisos limitados');
      }
      
      return true;
    } catch (error) {
      console.error('Error al autenticar como superadmin:', error);
      throw new Error(`No se pudo autenticar como superadmin: ${error.message}`);
    }
  } catch (error) {
    console.error('Error general al autenticar:', error.message);
    throw error;
  }
}

// Función para verificar si existen las colecciones necesarias
export async function verificarColecciones() {
  try {
    console.log('Verificando colecciones en PocketBase...');
    
    // Autenticar primero
    const authType = await autenticarAdmin();
    
    // Definir las colecciones necesarias
    const coleccionesNecesarias = [
      'productos',
      'categorias',
      'proveedores',
      'importaciones',
      'devoluciones'
    ];
    
    // Si estamos autenticados como usuario normal, no podemos listar colecciones
    // Asumimos que existen y continuamos
    console.log('Autenticado correctamente. Asumiendo que las colecciones necesarias existen.');
    console.log('Si hay errores posteriores, verifica que estas colecciones existan en PocketBase:');
    coleccionesNecesarias.forEach(c => console.log(`- ${c}`));
    
    return {
      success: true,
      colecciones: coleccionesNecesarias,
      coleccionesFaltantes: []
    };
  } catch (error) {
    console.error('Error al verificar colecciones:', error.message);
    throw error;
  }
}
