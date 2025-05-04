/**
 * Script para recrear completamente las colecciones en PocketBase
 * Este script:
 * 1. Se autentica como superusuario
 * 2. Elimina completamente las colecciones existentes
 * 3. Crea nuevas colecciones con el esquema correcto
 * 4. Crea registros de ejemplo para verificar
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

// Función para eliminar una colección
async function eliminarColeccion(nombre) {
  try {
    console.log(`Eliminando colección ${nombre}...`);
    
    // Obtener lista de colecciones
    const colecciones = await pb.collections.getFullList();
    const coleccion = colecciones.find(col => col.name === nombre);
    
    if (coleccion) {
      await pb.collections.delete(coleccion.id);
      console.log(`Colección ${nombre} eliminada correctamente`);
      return true;
    } else {
      console.log(`La colección ${nombre} no existe, no es necesario eliminarla`);
      return false;
    }
  } catch (error) {
    console.error(`Error al eliminar colección ${nombre}:`, error);
    return false;
  }
}

// Definición de esquemas para las colecciones
const esquemas = {
  categorias: {
    name: "categorias",
    type: "base",
    schema: [
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
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: ""
  },
  
  proveedores: {
    name: "proveedores",
    type: "base",
    schema: [
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
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: ""
  },
  
  productos: {
    name: "productos",
    type: "base",
    schema: [
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
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: ""
  },
  
  importaciones: {
    name: "importaciones",
    type: "base",
    schema: [
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
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: ""
  },
  
  devoluciones: {
    name: "devoluciones",
    type: "base",
    schema: [
      {
        name: "fecha",
        type: "date",
        required: true
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
    ],
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: ""
  }
};

// Función para crear una colección
async function crearColeccion(definicion) {
  try {
    console.log(`Creando colección ${definicion.name}...`);
    
    const coleccion = await pb.collections.create(definicion);
    console.log(`Colección ${definicion.name} creada correctamente con ID: ${coleccion.id}`);
    return coleccion;
  } catch (error) {
    console.error(`Error al crear colección ${definicion.name}:`, error);
    throw error;
  }
}

// Función para crear un registro de ejemplo
async function crearRegistroEjemplo(coleccion, datos) {
  try {
    console.log(`Creando registro de ejemplo en ${coleccion}...`);
    
    const registro = await pb.collection(coleccion).create(datos);
    console.log(`Registro creado con ID: ${registro.id}`);
    return registro;
  } catch (error) {
    console.error(`Error al crear registro en ${coleccion}:`, error);
    console.error('Datos que se intentaron crear:', JSON.stringify(datos, null, 2));
    return null;
  }
}

// Función para añadir relaciones a las colecciones
async function añadirRelaciones(colecciones) {
  try {
    console.log('Añadiendo relaciones entre colecciones...');
    
    // Añadir relaciones a productos (categoría y proveedor)
    const esquemaProductosActualizado = [...esquemas.productos.schema];
    
    // Añadir relación a categoría
    esquemaProductosActualizado.push({
      name: "categoria",
      type: "relation",
      required: false,
      options: {
        collectionId: colecciones.categorias.id,
        cascadeDelete: false,
        maxSelect: 1
      }
    });
    
    // Añadir relación a proveedor
    esquemaProductosActualizado.push({
      name: "proveedor",
      type: "relation",
      required: false,
      options: {
        collectionId: colecciones.proveedores.id,
        cascadeDelete: false,
        maxSelect: 1
      }
    });
    
    await pb.collections.update(colecciones.productos.id, {
      schema: esquemaProductosActualizado
    });
    
    console.log('Relaciones añadidas a productos');
    
    // Añadir relación a devoluciones (producto)
    const esquemaDevolucionesActualizado = [...esquemas.devoluciones.schema];
    
    // Añadir relación a producto
    esquemaDevolucionesActualizado.push({
      name: "producto",
      type: "relation",
      required: false,
      options: {
        collectionId: colecciones.productos.id,
        cascadeDelete: false,
        maxSelect: 1
      }
    });
    
    await pb.collections.update(colecciones.devoluciones.id, {
      schema: esquemaDevolucionesActualizado
    });
    
    console.log('Relación añadida a devoluciones');
    
    return true;
  } catch (error) {
    console.error('Error al añadir relaciones:', error);
    return false;
  }
}

// Datos de ejemplo para crear registros iniciales
const datosEjemplo = {
  categorias: [
    {
      nombre: "ELECTRODOMÉSTICOS",
      activo: true,
      fecha_alta: new Date().toISOString()
    },
    {
      nombre: "PEQUEÑO ELECTRODOMÉSTICO",
      activo: true,
      fecha_alta: new Date().toISOString()
    },
    {
      nombre: "INFORMÁTICA",
      activo: true,
      fecha_alta: new Date().toISOString()
    }
  ],
  
  proveedores: [
    {
      nombre: "ALFADYSER",
      activo: true,
      fecha_alta: new Date().toISOString()
    },
    {
      nombre: "CECOTEC",
      activo: true,
      fecha_alta: new Date().toISOString()
    },
    {
      nombre: "BSH",
      activo: true,
      fecha_alta: new Date().toISOString()
    }
  ],
  
  productos: {
    codigo: "TEST001",
    nombre: "Producto de prueba",
    precio: 99.99,
    activo: true,
    fecha_alta: new Date().toISOString()
  },
  
  importaciones: {
    fecha: new Date().toISOString(),
    proveedor: "ALFADYSER",
    tipo: "productos",
    estado: "completado",
    archivo: "test.xlsx",
    log: "Importación de prueba"
  }
};

// Función principal
async function recrearColecciones() {
  try {
    // Autenticar como superusuario
    await autenticarComoSuperusuario();
    
    // Eliminar colecciones existentes
    for (const nombre of Object.keys(esquemas)) {
      await eliminarColeccion(nombre);
    }
    
    // Crear nuevas colecciones
    const coleccionesCreadas = {};
    
    for (const [nombre, definicion] of Object.entries(esquemas)) {
      coleccionesCreadas[nombre] = await crearColeccion(definicion);
    }
    
    // Añadir relaciones entre colecciones
    await añadirRelaciones(coleccionesCreadas);
    
    // Crear registros de ejemplo
    console.log('Creando registros de ejemplo...');
    
    // Crear categorías de ejemplo
    for (const categoria of datosEjemplo.categorias) {
      await crearRegistroEjemplo('categorias', categoria);
    }
    
    // Crear proveedores de ejemplo
    for (const proveedor of datosEjemplo.proveedores) {
      await crearRegistroEjemplo('proveedores', proveedor);
    }
    
    // Crear producto de ejemplo
    await crearRegistroEjemplo('productos', datosEjemplo.productos);
    
    // Crear importación de ejemplo
    await crearRegistroEjemplo('importaciones', datosEjemplo.importaciones);
    
    console.log('Recreación de colecciones completada con éxito');
    return true;
  } catch (error) {
    console.error('Error al recrear colecciones:', error);
    return false;
  }
}

// Ejecutar la recreación
recrearColecciones()
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
