/**
 * Script para agregar campos a las colecciones existentes en PocketBase
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

// Función para obtener el ID de una colección por su nombre
async function obtenerIdColeccion(nombre) {
  try {
    const colecciones = await pb.collections.getFullList();
    const coleccion = colecciones.find(col => col.name === nombre);
    
    if (coleccion) {
      console.log(`Colección ${nombre} encontrada con ID: ${coleccion.id}`);
      return coleccion.id;
    } else {
      console.error(`No se encontró la colección ${nombre}`);
      return null;
    }
  } catch (error) {
    console.error(`Error al buscar colección ${nombre}:`, error);
    return null;
  }
}

// Función para agregar campos a una colección
async function agregarCamposColeccion(nombre, campos) {
  try {
    console.log(`Agregando campos a la colección ${nombre}...`);
    
    // Obtener ID de la colección
    const coleccionId = await obtenerIdColeccion(nombre);
    if (!coleccionId) {
      console.error(`No se puede actualizar la colección ${nombre} porque no se encontró`);
      return false;
    }
    
    // Obtener la colección actual
    const coleccion = await pb.collections.getOne(coleccionId);
    
    // Actualizar el esquema
    await pb.collections.update(coleccionId, {
      schema: campos
    });
    
    console.log(`Campos agregados a la colección ${nombre}`);
    return true;
  } catch (error) {
    console.error(`Error al agregar campos a la colección ${nombre}:`, error);
    console.error('Detalles del error:', error.response?.data || error.message);
    return false;
  }
}

// Definición de campos para cada colección
const camposColecciones = {
  categorias: [
    {
      name: "nombre",
      type: "text",
      required: true,
      unique: true,
      options: {
        min: null,
        max: null,
        pattern: ""
      }
    },
    {
      name: "activo",
      type: "bool",
      required: true,
      options: {
        default: true
      }
    },
    {
      name: "fecha_alta",
      type: "date",
      required: true,
      options: {
        min: "",
        max: ""
      }
    }
  ],
  
  proveedores: [
    {
      name: "nombre",
      type: "text",
      required: true,
      unique: true,
      options: {
        min: null,
        max: null,
        pattern: ""
      }
    },
    {
      name: "activo",
      type: "bool",
      required: true,
      options: {
        default: true
      }
    },
    {
      name: "fecha_alta",
      type: "date",
      required: true,
      options: {
        min: "",
        max: ""
      }
    }
  ],
  
  productos: [
    {
      name: "codigo",
      type: "text",
      required: true,
      options: {
        min: null,
        max: null,
        pattern: ""
      }
    },
    {
      name: "nombre",
      type: "text",
      required: true,
      options: {
        min: null,
        max: null,
        pattern: ""
      }
    },
    {
      name: "precio",
      type: "number",
      required: true,
      options: {
        min: null,
        max: null
      }
    },
    {
      name: "activo",
      type: "bool",
      required: true,
      options: {
        default: true
      }
    },
    {
      name: "fecha_alta",
      type: "date",
      required: true,
      options: {
        min: "",
        max: ""
      }
    }
  ],
  
  importaciones: [
    {
      name: "fecha",
      type: "date",
      required: true,
      options: {
        min: "",
        max: ""
      }
    },
    {
      name: "proveedor",
      type: "text",
      required: true,
      options: {
        min: null,
        max: null,
        pattern: ""
      }
    },
    {
      name: "tipo",
      type: "text",
      required: true,
      options: {
        min: null,
        max: null,
        pattern: ""
      }
    },
    {
      name: "estado",
      type: "text",
      required: true,
      options: {
        min: null,
        max: null,
        pattern: ""
      }
    },
    {
      name: "archivo",
      type: "text",
      required: true,
      options: {
        min: null,
        max: null,
        pattern: ""
      }
    },
    {
      name: "log",
      type: "text",
      required: false,
      options: {
        min: null,
        max: null,
        pattern: ""
      }
    }
  ],
  
  devoluciones: [
    {
      name: "fecha",
      type: "date",
      required: true,
      options: {
        min: "",
        max: ""
      }
    },
    {
      name: "motivo",
      type: "text",
      required: true,
      options: {
        min: null,
        max: null,
        pattern: ""
      }
    },
    {
      name: "cantidad",
      type: "number",
      required: true,
      options: {
        min: null,
        max: null
      }
    }
  ]
};

// Función principal
async function agregarCampos() {
  try {
    // Autenticar como superusuario
    await autenticarComoSuperusuario();
    
    // Agregar campos a cada colección
    for (const [nombre, campos] of Object.entries(camposColecciones)) {
      await agregarCamposColeccion(nombre, campos);
    }
    
    // Agregar relaciones
    console.log('Agregando relaciones entre colecciones...');
    
    // Obtener IDs de colecciones
    const productosId = await obtenerIdColeccion('productos');
    const categoriasId = await obtenerIdColeccion('categorias');
    const proveedoresId = await obtenerIdColeccion('proveedores');
    const devolucionesId = await obtenerIdColeccion('devoluciones');
    
    // Agregar relaciones a productos
    if (productosId && categoriasId && proveedoresId) {
      const camposProductos = [
        ...camposColecciones.productos,
        {
          name: "categoria",
          type: "relation",
          required: false,
          options: {
            collectionId: categoriasId,
            cascadeDelete: false,
            minSelect: null,
            maxSelect: 1,
            displayFields: []
          }
        },
        {
          name: "proveedor",
          type: "relation",
          required: false,
          options: {
            collectionId: proveedoresId,
            cascadeDelete: false,
            minSelect: null,
            maxSelect: 1,
            displayFields: []
          }
        }
      ];
      
      await agregarCamposColeccion('productos', camposProductos);
    }
    
    // Agregar relación a devoluciones
    if (devolucionesId && productosId) {
      const camposDevoluciones = [
        ...camposColecciones.devoluciones,
        {
          name: "producto",
          type: "relation",
          required: false,
          options: {
            collectionId: productosId,
            cascadeDelete: false,
            minSelect: null,
            maxSelect: 1,
            displayFields: []
          }
        }
      ];
      
      await agregarCamposColeccion('devoluciones', camposDevoluciones);
    }
    
    console.log('Campos agregados correctamente a todas las colecciones');
    return true;
  } catch (error) {
    console.error('Error al agregar campos:', error);
    return false;
  }
}

// Ejecutar el script
agregarCampos()
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
