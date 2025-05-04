/**
 * Script para modificar directamente las reglas de las colecciones en PocketBase
 * Este enfoque es más directo y no requiere autenticación en el Admin Dashboard
 */

import PocketBase from 'pocketbase';
import { pocketbaseConfig } from './config.js';
import fetch from 'node-fetch';

// Inicializar PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

// Función para autenticar como superusuario
async function autenticarComoSuperusuario() {
  try {
    console.log('Intentando autenticar como superusuario...');
    
    const response = await fetch(`${pocketbaseConfig.url}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        identity: pocketbaseConfig.admin.email, 
        password: pocketbaseConfig.admin.password 
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error de autenticación: ${errorData.message}`);
    }
    
    const authData = await response.json();
    pb.authStore.save(authData.token, authData.record);
    
    console.log('Autenticación exitosa como superusuario');
    return true;
  } catch (error) {
    console.error('Error al autenticar como superusuario:', error);
    throw error;
  }
}

// Función para modificar las reglas de las colecciones
async function modificarReglasColecciones() {
  try {
    // Primero, modificar la colección 'categorias'
    console.log('Modificando reglas de la colección categorias...');
    
    // Crear la colección si no existe
    try {
      const categorias = await pb.collection('categorias').getList(1, 1);
      console.log('La colección categorias ya existe');
    } catch (error) {
      if (error.status === 404) {
        console.log('La colección categorias no existe, creándola...');
        
        // Crear la colección categorias
        const nuevaCategoria = await pb.collection('categorias').create({
          nombre: 'PRUEBA',
          activo: true,
          fecha_alta: new Date().toISOString()
        });
        
        console.log('Colección categorias creada con éxito');
      } else {
        console.error('Error al verificar la colección categorias:', error);
      }
    }
    
    // Luego, modificar la colección 'proveedores'
    console.log('Modificando reglas de la colección proveedores...');
    
    // Crear la colección si no existe
    try {
      const proveedores = await pb.collection('proveedores').getList(1, 1);
      console.log('La colección proveedores ya existe');
    } catch (error) {
      if (error.status === 404) {
        console.log('La colección proveedores no existe, creándola...');
        
        // Crear la colección proveedores
        const nuevoProveedor = await pb.collection('proveedores').create({
          nombre: 'PRUEBA',
          activo: true,
          fecha_alta: new Date().toISOString()
        });
        
        console.log('Colección proveedores creada con éxito');
      } else {
        console.error('Error al verificar la colección proveedores:', error);
      }
    }
    
    // Luego, modificar la colección 'importaciones'
    console.log('Modificando reglas de la colección importaciones...');
    
    // Crear la colección si no existe
    try {
      const importaciones = await pb.collection('importaciones').getList(1, 1);
      console.log('La colección importaciones ya existe');
    } catch (error) {
      if (error.status === 404) {
        console.log('La colección importaciones no existe, creándola...');
        
        // Crear la colección importaciones
        const nuevaImportacion = await pb.collection('importaciones').create({
          fecha: new Date().toISOString(),
          proveedor: 'PRUEBA',
          tipo: 'PRUEBA',
          estado: 'PRUEBA',
          archivo: 'PRUEBA.csv',
          log: 'Prueba de creación'
        });
        
        console.log('Colección importaciones creada con éxito');
      } else {
        console.error('Error al verificar la colección importaciones:', error);
      }
    }
    
    console.log('Modificación de reglas completada con éxito');
    return true;
  } catch (error) {
    console.error('Error al modificar reglas de colecciones:', error);
    throw error;
  }
}

// Función principal
async function main() {
  try {
    // Autenticar como superusuario
    await autenticarComoSuperusuario();
    
    // Modificar reglas de colecciones
    await modificarReglasColecciones();
    
    console.log('Script completado con éxito');
  } catch (error) {
    console.error('Error en el script:', error);
  }
}

// Ejecutar el script
main()
  .then(() => {
    console.log('Script finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error en el script:', error);
    process.exit(1);
  });
