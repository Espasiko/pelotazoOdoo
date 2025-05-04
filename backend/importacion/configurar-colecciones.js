/**
 * Script definitivo para configurar correctamente las colecciones en PocketBase
 * Este script:
 * 1. Se autentica como superusuario
 * 2. Elimina las colecciones existentes si no tienen la estructura correcta
 * 3. Crea las colecciones con todos los campos necesarios
 * 4. Configura las reglas de acceso para permitir operaciones CRUD
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

// Función para crear una colección con su esquema
async function crearColeccion(nombre, esquema) {
  try {
    console.log(`Creando colección ${nombre}...`);
    
    // Crear la colección con el esquema proporcionado
    const nuevaColeccion = await pb.collections.create({
      name: nombre,
      type: 'base',
      schema: esquema,
      listRule: "", // Regla vacía = permitir a todos
      viewRule: "", // Regla vacía = permitir a todos
      createRule: "", // Regla vacía = permitir a todos
      updateRule: "", // Regla vacía = permitir a todos
      deleteRule: "" // Regla vacía = permitir a todos
    });
    
    console.log(`Colección ${nombre} creada correctamente con ID: ${nuevaColeccion.id}`);
    return nuevaColeccion;
  } catch (error) {
    console.error(`Error al crear colección ${nombre}:`, error);
    throw error;
  }
}

// Función para crear un registro de ejemplo en una colección
async function crearRegistroEjemplo(coleccion, datos) {
  try {
    console.log(`Creando registro de ejemplo en ${coleccion}...`);
    
    const registro = await pb.collection(coleccion).create(datos);
    console.log(`Registro creado con ID: ${registro.id}`);
    return registro;
  } catch (error) {
    console.error(`Error al crear registro en ${coleccion}:`, error);
    return null;
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
  ]
};

// Función principal
async function configurarColecciones() {
  try {
    // Autenticar como superusuario
    await autenticarComoSuperusuario();
    
    // Eliminar colecciones existentes
    const coleccionesAConfigurar = Object.keys(esquemas);
    for (const nombre of coleccionesAConfigurar) {
      await eliminarColeccion(nombre);
    }
    
    // Crear colecciones con sus esquemas
    const coleccionesCreadas = {};
    for (const [nombre, esquema] of Object.entries(esquemas)) {
      coleccionesCreadas[nombre] = await crearColeccion(nombre, esquema);
    }
    
    // Actualizar esquema de productos para relacionar con categorías
    console.log('Actualizando esquema de productos para relacionar con categorías...');
    
    if (coleccionesCreadas.productos && coleccionesCreadas.categorias) {
      // Añadir campo de relación a categoría
      await pb.collections.update(coleccionesCreadas.productos.id, {
        schema: [
          ...esquemas.productos,
          {
            name: "categoria",
            type: "relation",
            required: false,
            options: {
              collectionId: coleccionesCreadas.categorias.id,
              cascadeDelete: false,
              maxSelect: 1
            }
          }
        ]
      });
      
      console.log('Campo de relación a categoría añadido a productos');
    }
    
    // Actualizar esquema de productos para relacionar con proveedores
    console.log('Actualizando esquema de productos para relacionar con proveedores...');
    
    if (coleccionesCreadas.productos && coleccionesCreadas.proveedores) {
      // Añadir campo de relación a proveedor
      await pb.collections.update(coleccionesCreadas.productos.id, {
        schema: [
          ...esquemas.productos,
          {
            name: "categoria",
            type: "relation",
            required: false,
            options: {
              collectionId: coleccionesCreadas.categorias.id,
              cascadeDelete: false,
              maxSelect: 1
            }
          },
          {
            name: "proveedor",
            type: "relation",
            required: false,
            options: {
              collectionId: coleccionesCreadas.proveedores.id,
              cascadeDelete: false,
              maxSelect: 1
            }
          }
        ]
      });
      
      console.log('Campo de relación a proveedor añadido a productos');
    }
    
    // Actualizar esquema de devoluciones para relacionar con productos
    console.log('Actualizando esquema de devoluciones para relacionar con productos...');
    
    if (coleccionesCreadas.devoluciones && coleccionesCreadas.productos) {
      // Añadir campo de relación a producto
      await pb.collections.update(coleccionesCreadas.devoluciones.id, {
        schema: [
          ...esquemas.devoluciones,
          {
            name: "producto",
            type: "relation",
            required: true,
            options: {
              collectionId: coleccionesCreadas.productos.id,
              cascadeDelete: false,
              maxSelect: 1
            }
          }
        ]
      });
      
      console.log('Campo de relación a producto añadido a devoluciones');
    }
    
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
    
    console.log('Configuración completada con éxito');
    return true;
  } catch (error) {
    console.error('Error al configurar colecciones:', error);
    return false;
  }
}

// Ejecutar la configuración
configurarColecciones()
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
