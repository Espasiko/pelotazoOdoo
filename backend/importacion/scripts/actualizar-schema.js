/**
 * Script para actualizar el esquema de PocketBase
 * Este script añade el campo nombre_proveedor a la colección de productos
 */

import { pocketbaseConfig } from '../config.js';
import { autenticarAdmin } from '../db/client.js';
import { fetchAdmin } from '../db/client.js';

/**
 * Añade el campo nombre_proveedor a la colección de productos
 */
async function actualizarEsquema() {
  try {
    console.log('Iniciando actualización del esquema...');
    
    // Autenticar como admin
    const token = await autenticarAdmin();
    if (!token) {
      throw new Error('No se pudo autenticar como admin');
    }
    
    // Obtener la colección de productos
    const coleccion = await fetchAdmin('/api/collections/productos');
    
    // Verificar si el campo ya existe
    const campoExistente = coleccion.schema.find(campo => campo.name === 'nombre_proveedor');
    if (campoExistente) {
      console.log('El campo nombre_proveedor ya existe en la colección de productos.');
      return;
    }
    
    // Definir el nuevo campo
    const nuevoCampo = {
      name: 'nombre_proveedor',
      type: 'text',
      system: false,
      required: false,
      unique: false,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    };
    
    // Añadir el campo a la colección
    const schemaActualizado = [...coleccion.schema, nuevoCampo];
    
    // Actualizar la colección
    const resultado = await fetchAdmin(`/api/collections/productos`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schema: schemaActualizado
      })
    });
    
    console.log('Esquema actualizado correctamente.');
    console.log(`Campo nombre_proveedor añadido a la colección de productos.`);
  } catch (error) {
    console.error('Error al actualizar el esquema:', error);
  }
}

// Ejecutar la función principal
actualizarEsquema().then(() => {
  console.log('Proceso finalizado');
  process.exit(0);
}).catch(error => {
  console.error('Error en el script:', error);
  process.exit(1);
});
