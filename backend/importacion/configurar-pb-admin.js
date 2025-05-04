/**
 * Script para configurar PocketBase usando la API Admin
 * Este script usa el enfoque correcto para crear colecciones con sus esquemas
 */

import PocketBase from 'pocketbase';
import { pocketbaseConfig } from './config.js';

// Inicializar PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

// Autenticar como superusuario
async function autenticarComoAdmin() {
  try {
    console.log('Autenticando como superusuario...');
    await pb.admins.authWithPassword(
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

// Función para eliminar una colección si existe
async function eliminarColeccionSiExiste(nombre) {
  try {
    console.log(`Verificando si existe la colección ${nombre}...`);
    
    // Obtener todas las colecciones
    const colecciones = await pb.collections.getFullList();
    const coleccion = colecciones.find(c => c.name === nombre);
    
    if (coleccion) {
      console.log(`Eliminando colección existente ${nombre}...`);
      await pb.collections.delete(coleccion.id);
      console.log(`Colección ${nombre} eliminada correctamente`);
    } else {
      console.log(`La colección ${nombre} no existe, no es necesario eliminarla`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error al eliminar colección ${nombre}:`, error);
    return false;
  }
}

// Función para crear una colección con campos
async function crearColeccion(nombre, tipo, campos, reglas = {}) {
  try {
    console.log(`Creando colección ${nombre}...`);
    
    // Configurar reglas de acceso
    const reglasAcceso = {
      listRule: reglas.listRule || "",
      viewRule: reglas.viewRule || "",
      createRule: reglas.createRule || "",
      updateRule: reglas.updateRule || "",
      deleteRule: reglas.deleteRule || ""
    };
    
    // Crear la colección
    const nuevaColeccion = await pb.collections.create({
      name: nombre,
      type: tipo || "base",
      schema: campos,
      ...reglasAcceso
    });
    
    console.log(`Colección ${nombre} creada correctamente con ID: ${nuevaColeccion.id}`);
    return nuevaColeccion;
  } catch (error) {
    console.error(`Error al crear colección ${nombre}:`, error);
    console.error('Detalles del error:', error.data);
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
    console.error('Detalles del error:', error.data);
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
      options: {
        default: true
      }
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
      options: {
        default: true
      }
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
      options: {
        default: true
      }
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
async function configurarPocketBase() {
  try {
    // Autenticar como admin
    await autenticarComoAdmin();
    
    // Colecciones a configurar
    const colecciones = Object.keys(esquemas);
    
    // Eliminar colecciones existentes
    for (const nombre of colecciones) {
      await eliminarColeccionSiExiste(nombre);
    }
    
    // Crear colecciones con sus esquemas
    const coleccionesCreadas = {};
    
    for (const nombre of colecciones) {
      coleccionesCreadas[nombre] = await crearColeccion(
        nombre, 
        "base", 
        esquemas[nombre]
      );
    }
    
    // Actualizar esquema de productos para añadir relaciones
    console.log('Actualizando esquema de productos para añadir relaciones...');
    
    // Obtener IDs de colecciones
    const productosId = coleccionesCreadas.productos.id;
    const categoriasId = coleccionesCreadas.categorias.id;
    const proveedoresId = coleccionesCreadas.proveedores.id;
    
    // Añadir campo de relación a categoría
    const esquemaProductosActualizado = [
      ...esquemas.productos,
      {
        name: "categoria",
        type: "relation",
        required: false,
        options: {
          collectionId: categoriasId,
          cascadeDelete: false,
          maxSelect: 1
        }
      },
      {
        name: "proveedor",
        type: "relation",
        required: false,
        options: {
          collectionId: proveedoresId,
          cascadeDelete: false,
          maxSelect: 1
        }
      }
    ];
    
    await pb.collections.update(productosId, {
      schema: esquemaProductosActualizado
    });
    
    console.log('Relaciones añadidas a productos');
    
    // Actualizar esquema de devoluciones para añadir relación con productos
    console.log('Actualizando esquema de devoluciones para añadir relación con productos...');
    
    const devolucionesId = coleccionesCreadas.devoluciones.id;
    
    const esquemaDevolucionesActualizado = [
      ...esquemas.devoluciones,
      {
        name: "producto",
        type: "relation",
        required: false,
        options: {
          collectionId: productosId,
          cascadeDelete: false,
          maxSelect: 1
        }
      }
    ];
    
    await pb.collections.update(devolucionesId, {
      schema: esquemaDevolucionesActualizado
    });
    
    console.log('Relación añadida a devoluciones');
    
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
