/**
 * Script definitivo para configurar PocketBase correctamente
 * Este script:
 * 1. Se autentica como superusuario
 * 2. Crea las colecciones necesarias si no existen
 * 3. Configura las reglas de acceso para permitir operaciones CRUD
 */

import PocketBase from 'pocketbase';
import { pocketbaseConfig } from './config.js';
import fs from 'fs';
import path from 'path';

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

// Función para verificar si una colección existe
async function verificarColeccion(nombre) {
  try {
    const colecciones = await pb.collections.getFullList();
    return colecciones.some(col => col.name === nombre);
  } catch (error) {
    console.error(`Error al verificar colección ${nombre}:`, error);
    return false;
  }
}

// Función para crear una colección si no existe
async function crearColeccionSiNoExiste(nombre, schema) {
  try {
    const existe = await verificarColeccion(nombre);
    
    if (existe) {
      console.log(`La colección ${nombre} ya existe`);
      return true;
    }
    
    console.log(`Creando colección ${nombre}...`);
    
    // Crear la colección con el esquema proporcionado
    await pb.collections.create({
      name: nombre,
      type: 'base',
      schema: schema,
      listRule: "", // Regla vacía = permitir a todos
      viewRule: "", // Regla vacía = permitir a todos
      createRule: "", // Regla vacía = permitir a todos
      updateRule: "", // Regla vacía = permitir a todos
      deleteRule: "" // Regla vacía = permitir a todos
    });
    
    console.log(`Colección ${nombre} creada con éxito`);
    return true;
  } catch (error) {
    console.error(`Error al crear colección ${nombre}:`, error);
    return false;
  }
}

// Función para actualizar las reglas de una colección existente
async function actualizarReglasColeccion(nombre) {
  try {
    const colecciones = await pb.collections.getFullList();
    const coleccion = colecciones.find(col => col.name === nombre);
    
    if (!coleccion) {
      console.error(`No se encontró la colección ${nombre}`);
      return false;
    }
    
    console.log(`Actualizando reglas de la colección ${nombre}...`);
    
    // Actualizar las reglas para permitir todas las operaciones
    await pb.collections.update(coleccion.id, {
      listRule: "", // Regla vacía = permitir a todos
      viewRule: "", // Regla vacía = permitir a todos
      createRule: "", // Regla vacía = permitir a todos
      updateRule: "", // Regla vacía = permitir a todos
      deleteRule: "" // Regla vacía = permitir a todos
    });
    
    console.log(`Reglas de la colección ${nombre} actualizadas correctamente`);
    return true;
  } catch (error) {
    console.error(`Error al actualizar reglas de ${nombre}:`, error);
    return false;
  }
}

// Definición de esquemas para las colecciones
const esquemas = {
  categorias: [
    {
      name: "nombre",
      type: "text",
      required: true,
      unique: true
    },
    {
      name: "activo",
      type: "bool",
      required: true,
      default: true
    },
    {
      name: "fecha_alta",
      type: "date",
      required: true
    }
  ],
  proveedores: [
    {
      name: "nombre",
      type: "text",
      required: true,
      unique: true
    },
    {
      name: "activo",
      type: "bool",
      required: true,
      default: true
    },
    {
      name: "fecha_alta",
      type: "date",
      required: true
    }
  ],
  productos: [
    {
      name: "codigo",
      type: "text",
      required: true
    },
    {
      name: "nombre",
      type: "text",
      required: true
    },
    {
      name: "categoria",
      type: "relation",
      required: true,
      options: {
        collectionId: null, // Se actualizará después de crear la colección categorias
        cascadeDelete: false
      }
    },
    {
      name: "precio",
      type: "number",
      required: true
    },
    {
      name: "activo",
      type: "bool",
      required: true,
      default: true
    },
    {
      name: "fecha_alta",
      type: "date",
      required: true
    }
  ],
  importaciones: [
    {
      name: "fecha",
      type: "date",
      required: true
    },
    {
      name: "proveedor",
      type: "text",
      required: true
    },
    {
      name: "tipo",
      type: "text",
      required: true
    },
    {
      name: "estado",
      type: "text",
      required: true
    },
    {
      name: "archivo",
      type: "text",
      required: true
    },
    {
      name: "log",
      type: "text",
      required: false
    }
  ],
  devoluciones: [
    {
      name: "fecha",
      type: "date",
      required: true
    },
    {
      name: "producto",
      type: "relation",
      required: true,
      options: {
        collectionId: null, // Se actualizará después de crear la colección productos
        cascadeDelete: false
      }
    },
    {
      name: "motivo",
      type: "text",
      required: true
    },
    {
      name: "cantidad",
      type: "number",
      required: true
    }
  ]
};

// Función principal para configurar PocketBase
async function configurarPocketBase() {
  try {
    // Autenticar como superusuario
    await autenticarComoSuperusuario();
    
    // Crear colecciones en orden (para manejar relaciones)
    await crearColeccionSiNoExiste('categorias', esquemas.categorias);
    await crearColeccionSiNoExiste('proveedores', esquemas.proveedores);
    
    // Actualizar esquema de productos para relacionar con categorias
    if (await verificarColeccion('categorias')) {
      const colecciones = await pb.collections.getFullList();
      const categoriasCol = colecciones.find(col => col.name === 'categorias');
      
      if (categoriasCol) {
        esquemas.productos.find(field => field.name === 'categoria').options.collectionId = categoriasCol.id;
      }
    }
    
    await crearColeccionSiNoExiste('productos', esquemas.productos);
    await crearColeccionSiNoExiste('importaciones', esquemas.importaciones);
    
    // Actualizar esquema de devoluciones para relacionar con productos
    if (await verificarColeccion('productos')) {
      const colecciones = await pb.collections.getFullList();
      const productosCol = colecciones.find(col => col.name === 'productos');
      
      if (productosCol) {
        esquemas.devoluciones.find(field => field.name === 'producto').options.collectionId = productosCol.id;
      }
    }
    
    await crearColeccionSiNoExiste('devoluciones', esquemas.devoluciones);
    
    // Actualizar reglas de todas las colecciones
    const coleccionesObjetivo = ['categorias', 'proveedores', 'productos', 'importaciones', 'devoluciones'];
    
    for (const nombre of coleccionesObjetivo) {
      await actualizarReglasColeccion(nombre);
    }
    
    console.log('Configuración de PocketBase completada con éxito');
    return true;
  } catch (error) {
    console.error('Error al configurar PocketBase:', error);
    return false;
  }
}

// Ejecutar la configuración
configurarPocketBase()
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
