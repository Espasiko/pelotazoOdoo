/**
 * Script para corregir los esquemas de las colecciones en PocketBase
 * Este script:
 * 1. Se autentica como superusuario
 * 2. Actualiza los esquemas de las colecciones existentes
 * 3. Verifica que los campos se hayan creado correctamente
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

// Función para actualizar el esquema de una colección
async function actualizarEsquemaColeccion(nombre, esquema) {
  try {
    console.log(`Actualizando esquema de la colección ${nombre}...`);
    
    // Obtener ID de la colección
    const coleccionId = await obtenerIdColeccion(nombre);
    if (!coleccionId) {
      console.error(`No se puede actualizar el esquema de ${nombre} porque no se encontró la colección`);
      return false;
    }
    
    // Actualizar el esquema
    await pb.collections.update(coleccionId, {
      schema: esquema
    });
    
    console.log(`Esquema de la colección ${nombre} actualizado correctamente`);
    return true;
  } catch (error) {
    console.error(`Error al actualizar esquema de ${nombre}:`, error);
    return false;
  }
}

// Función para verificar si una colección tiene registros
async function verificarRegistrosColeccion(nombre) {
  try {
    const registros = await pb.collection(nombre).getList(1, 1);
    console.log(`La colección ${nombre} tiene ${registros.totalItems} registros`);
    return registros.totalItems > 0;
  } catch (error) {
    console.error(`Error al verificar registros de ${nombre}:`, error);
    return false;
  }
}

// Función para crear un registro de ejemplo
async function crearRegistroEjemplo(nombre, datos) {
  try {
    console.log(`Creando registro de ejemplo en ${nombre}...`);
    const registro = await pb.collection(nombre).create(datos);
    console.log(`Registro creado con ID: ${registro.id}`);
    return registro;
  } catch (error) {
    console.error(`Error al crear registro en ${nombre}:`, error);
    console.error('Datos que se intentaron crear:', JSON.stringify(datos, null, 2));
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
  categorias: {
    nombre: "ELECTRODOMÉSTICOS",
    activo: true,
    fecha_alta: new Date().toISOString()
  },
  proveedores: {
    nombre: "ALFADYSER",
    activo: true,
    fecha_alta: new Date().toISOString()
  },
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
  },
  devoluciones: {
    fecha: new Date().toISOString(),
    motivo: "Producto defectuoso",
    cantidad: 1
  }
};

// Función principal
async function corregirEsquemas() {
  try {
    // Autenticar como superusuario
    await autenticarComoSuperusuario();
    
    // Actualizar esquemas de las colecciones
    for (const [nombre, esquema] of Object.entries(esquemas)) {
      const resultado = await actualizarEsquemaColeccion(nombre, esquema);
      
      if (resultado) {
        // Verificar si la colección tiene registros
        const tieneRegistros = await verificarRegistrosColeccion(nombre);
        
        // Si no tiene registros, crear uno de ejemplo
        if (!tieneRegistros && datosEjemplo[nombre]) {
          await crearRegistroEjemplo(nombre, datosEjemplo[nombre]);
        }
      }
    }
    
    // Actualizar esquema de productos para relacionar con categorías y proveedores
    console.log('Actualizando esquema de productos para añadir relaciones...');
    
    const productosId = await obtenerIdColeccion('productos');
    const categoriasId = await obtenerIdColeccion('categorias');
    const proveedoresId = await obtenerIdColeccion('proveedores');
    
    if (productosId && categoriasId && proveedoresId) {
      // Añadir campos de relación
      const esquemaProductosCompleto = [
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
        schema: esquemaProductosCompleto
      });
      
      console.log('Relaciones añadidas a productos');
    }
    
    // Actualizar esquema de devoluciones para relacionar con productos
    console.log('Actualizando esquema de devoluciones para añadir relación con productos...');
    
    const devolucionesId = await obtenerIdColeccion('devoluciones');
    
    if (devolucionesId && productosId) {
      // Añadir campo de relación
      const esquemaDevolucionesCompleto = [
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
        schema: esquemaDevolucionesCompleto
      });
      
      console.log('Relación añadida a devoluciones');
    }
    
    console.log('Corrección de esquemas completada con éxito');
    return true;
  } catch (error) {
    console.error('Error al corregir esquemas:', error);
    return false;
  }
}

// Ejecutar la corrección
corregirEsquemas()
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
