/**
 * Script de prueba para escribir datos en la colección de proveedores
 * Este script utiliza las funciones existentes para interactuar con PocketBase
 */

import { autenticarAdmin, fetchAdmin } from './utils.js';

/**
 * Función principal para crear o actualizar un proveedor de prueba
 */
async function crearProveedorPrueba() {
  try {
    console.log('Iniciando prueba de escritura en proveedores...');
    
    // Autenticarse como admin
    await autenticarAdmin();
    
    // Buscar si ya existe un proveedor con nombre similar a "Trajano"
    const busqueda = await fetchAdmin(`/api/collections/proveedores/records`, {
      method: 'GET',
      params: {
        filter: `nombre~"TRAJANO"`
      }
    });
    
    let proveedorId;
    
    // Si existe, actualizarlo
    if (busqueda.items && busqueda.items.length > 0) {
      proveedorId = busqueda.items[0].id;
      console.log(`Actualizando proveedor existente con ID: ${proveedorId}`);
      
      const resultado = await fetchAdmin(`/api/collections/proveedores/records/${proveedorId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          notas: 'C trajano-Spas',
          updated: new Date().toISOString()
        })
      });
      
      console.log('Proveedor actualizado correctamente:', resultado);
    } 
    // Si no existe, crearlo
    else {
      console.log('Creando nuevo proveedor de prueba');
      
      const resultado = await fetchAdmin(`/api/collections/proveedores/records`, {
        method: 'POST',
        body: JSON.stringify({
          nombre: 'TRAJANO TEST',
          notas: 'C trajano-Spas',
          activo: true,
          created: new Date().toISOString()
        })
      });
      
      console.log('Proveedor creado correctamente:', resultado);
    }
    
    console.log('Prueba completada con éxito');
  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

// Ejecutar la función principal
crearProveedorPrueba();
