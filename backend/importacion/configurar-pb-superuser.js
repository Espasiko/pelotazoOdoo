/**
 * Script para configurar PocketBase usando la API de superusuarios
 * Este script:
 * 1. Se autentica como superusuario
 * 2. Elimina las colecciones existentes
 * 3. Crea nuevas colecciones con el esquema correcto
 * 4. Verifica que los campos se hayan creado correctamente
 */

import PocketBase from 'pocketbase';
import { pocketbaseConfig } from './config.js';
import fs from 'fs';

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
async function crearColeccion(nombre, esquema, reglas = {}) {
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
      type: "base",
      schema: esquema,
      ...reglasAcceso
    });
    
    console.log(`Colección ${nombre} creada correctamente con ID: ${nuevaColeccion.id}`);
    return nuevaColeccion;
  } catch (error) {
    console.error(`Error al crear colección ${nombre}:`, error);
    console.error('Detalles del error:', error.response?.data || error.message);
    throw error;
  }
}

// Función para verificar si una colección tiene los campos correctos
async function verificarCamposColeccion(nombre, camposEsperados) {
  try {
    console.log(`Verificando campos de la colección ${nombre}...`);
    
    // Obtener la colección
    const colecciones = await pb.collections.getFullList();
    const coleccion = colecciones.find(col => col.name === nombre);
    
    if (!coleccion) {
      console.error(`No se encontró la colección ${nombre}`);
      return false;
    }
    
    // Verificar los campos
    const camposActuales = coleccion.schema.map(campo => campo.name);
    const camposFaltantes = camposEsperados.filter(campo => !camposActuales.includes(campo));
    
    if (camposFaltantes.length > 0) {
      console.error(`Faltan campos en la colección ${nombre}: ${camposFaltantes.join(', ')}`);
      return false;
    }
    
    console.log(`La colección ${nombre} tiene todos los campos esperados`);
    return true;
  } catch (error) {
    console.error(`Error al verificar campos de la colección ${nombre}:`, error);
    return false;
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
    console.error('Detalles del error:', error.response?.data || error.message);
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

// Función para crear un archivo JSON con la configuración de las colecciones
async function exportarConfiguracionJSON() {
  try {
    console.log('Exportando configuración a JSON...');
    
    const configuracion = {
      collections: {}
    };
    
    // Añadir cada colección a la configuración
    for (const [nombre, esquema] of Object.entries(esquemas)) {
      configuracion.collections[nombre] = {
        name: nombre,
        type: "base",
        schema: esquema,
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: ""
      };
    }
    
    // Escribir el archivo JSON
    const rutaArchivo = './colecciones-config.json';
    fs.writeFileSync(rutaArchivo, JSON.stringify(configuracion, null, 2));
    
    console.log(`Configuración exportada a ${rutaArchivo}`);
    console.log('Puedes importar este archivo desde la interfaz de administración de PocketBase');
    console.log('Ve a Configuración > Importar colecciones y selecciona el archivo');
    
    return true;
  } catch (error) {
    console.error('Error al exportar configuración a JSON:', error);
    return false;
  }
}

// Función principal
async function configurarPocketBase() {
  try {
    // Autenticar como superusuario
    await autenticarComoSuperusuario();
    
    // Exportar configuración a JSON
    await exportarConfiguracionJSON();
    
    // Eliminar colecciones existentes
    for (const nombre of Object.keys(esquemas)) {
      await eliminarColeccion(nombre);
    }
    
    // Crear colecciones con sus esquemas
    const coleccionesCreadas = {};
    
    for (const [nombre, esquema] of Object.entries(esquemas)) {
      coleccionesCreadas[nombre] = await crearColeccion(nombre, esquema);
    }
    
    // Actualizar esquema de productos para añadir relaciones
    console.log('Actualizando esquema de productos para añadir relaciones...');
    
    // Obtener IDs de colecciones
    const productosId = coleccionesCreadas.productos.id;
    const categoriasId = coleccionesCreadas.categorias.id;
    const proveedoresId = coleccionesCreadas.proveedores.id;
    
    // Añadir campo de relación a categoría y proveedor
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
    
    // Verificar que las colecciones tengan los campos correctos
    console.log('Verificando campos de las colecciones...');
    
    const verificaciones = {
      categorias: await verificarCamposColeccion('categorias', ['nombre', 'activo', 'fecha_alta']),
      proveedores: await verificarCamposColeccion('proveedores', ['nombre', 'activo', 'fecha_alta']),
      productos: await verificarCamposColeccion('productos', ['codigo', 'nombre', 'precio', 'activo', 'fecha_alta', 'categoria', 'proveedor']),
      importaciones: await verificarCamposColeccion('importaciones', ['fecha', 'proveedor', 'tipo', 'estado', 'archivo', 'log']),
      devoluciones: await verificarCamposColeccion('devoluciones', ['fecha', 'motivo', 'cantidad', 'producto'])
    };
    
    const todasVerificacionesExitosas = Object.values(verificaciones).every(v => v);
    
    if (!todasVerificacionesExitosas) {
      console.error('Algunas colecciones no tienen los campos correctos');
      return false;
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
