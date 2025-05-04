import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de PocketBase
const pocketbaseConfig = {
  url: 'http://127.0.0.1:8090',
  admin: {
    email: 'yo@mail.com',
    password: 'Ninami12$ya'
  }
};

// Instancia de PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

// Función para autenticar como superadmin
async function autenticarAdmin() {
  try {
    // Verificar si ya estamos autenticados
    if (pb.authStore.isValid && pb.authStore.model?.id) {
      console.log('✅ Ya estamos autenticados como superadmin');
      return;
    }

    // Limpiar cualquier autenticación previa
    pb.authStore.clear();

    // Autenticar como superadmin
    const adminEmail = pocketbaseConfig.admin.email;
    const adminPassword = pocketbaseConfig.admin.password;
    
    console.log(`🔑 Autenticando como superadmin (${adminEmail})...`);
    
    // Intentar directamente con la colección de superusuarios
    await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
    console.log('✅ Autenticación exitosa como superusuario');
  } catch (error) {
    console.error('❌ Error al autenticar:', error.message);
    throw new Error(`Error de autenticación: ${error.message}`);
  }
}

// Definición de las colecciones a crear
const colecciones = [
  {
    name: "categorias",
    type: "base",
    schema: [
      {
        name: "nombre",
        type: "text",
        required: true
      },
      {
        name: "descripcion",
        type: "text",
        required: false
      },
      {
        name: "activo",
        type: "bool",
        required: false,
        options: {
          default: true
        }
      },
      {
        name: "fecha_alta",
        type: "date",
        required: false
      },
      {
        name: "visible_online",
        type: "bool",
        required: false,
        options: {
          default: false
        }
      },
      {
        name: "orden",
        type: "number",
        required: false
      }
    ]
  },
  {
    name: "proveedores",
    type: "base",
    schema: [
      {
        name: "nombre",
        type: "text",
        required: true
      },
      {
        name: "contacto",
        type: "text",
        required: false
      },
      {
        name: "activo",
        type: "bool",
        required: false,
        options: {
          default: true
        }
      },
      {
        name: "fecha_alta",
        type: "date",
        required: false
      },
      {
        name: "nif",
        type: "text",
        required: false
      },
      {
        name: "direccion",
        type: "text",
        required: false
      },
      {
        name: "email",
        type: "email",
        required: false
      },
      {
        name: "telefono",
        type: "text",
        required: false
      }
    ]
  },
  {
    name: "productos",
    type: "base",
    schema: [
      {
        name: "codigo",
        type: "text",
        required: true
      },
      {
        name: "codigo_barras",
        type: "text",
        required: false
      },
      {
        name: "codigo_barras_tipo",
        type: "text",
        required: false
      },
      {
        name: "nombre",
        type: "text",
        required: true
      },
      {
        name: "descripcion_larga",
        type: "text",
        required: false
      },
      {
        name: "precio_compra",
        type: "number",
        required: false
      },
      {
        name: "precio_venta",
        type: "number",
        required: false
      },
      {
        name: "iva",
        type: "number",
        required: false
      },
      {
        name: "recargo",
        type: "number",
        required: false
      },
      {
        name: "margen",
        type: "number",
        required: false
      },
      {
        name: "stock_actual",
        type: "number",
        required: false
      },
      {
        name: "stock_minimo",
        type: "number",
        required: false
      },
      {
        name: "activo",
        type: "bool",
        required: false,
        options: {
          default: true
        }
      },
      {
        name: "fecha_alta",
        type: "date",
        required: false
      },
      {
        name: "notas",
        type: "text",
        required: false
      },
      {
        name: "visible_online",
        type: "bool",
        required: false
      },
      {
        name: "reservable",
        type: "bool",
        required: false
      },
      {
        name: "porcentaje_deposito",
        type: "number",
        required: false
      },
      {
        name: "descripcion_online",
        type: "text",
        required: false
      },
      {
        name: "alerta_stock_bajo",
        type: "bool",
        required: false
      },
      {
        name: "ultima_alerta",
        type: "date",
        required: false
      }
    ]
  },
  {
    name: "importaciones",
    type: "base",
    schema: [
      {
        name: "tipo",
        type: "text",
        required: true
      },
      {
        name: "fecha",
        type: "date",
        required: true
      },
      {
        name: "total_registros",
        type: "number",
        required: false
      },
      {
        name: "registros_exitosos",
        type: "number",
        required: false
      },
      {
        name: "registros_fallidos",
        type: "number",
        required: false
      },
      {
        name: "notas",
        type: "text",
        required: false
      }
    ]
  },
  {
    name: "clientes",
    type: "base",
    schema: [
      {
        name: "nombre",
        type: "text",
        required: true
      },
      {
        name: "apellidos",
        type: "text",
        required: false
      },
      {
        name: "email",
        type: "email",
        required: false
      },
      {
        name: "telefono",
        type: "text",
        required: false
      },
      {
        name: "direccion",
        type: "text",
        required: false
      },
      {
        name: "codigo_postal",
        type: "text",
        required: false
      },
      {
        name: "poblacion",
        type: "text",
        required: false
      },
      {
        name: "provincia",
        type: "text",
        required: false
      },
      {
        name: "nif",
        type: "text",
        required: false
      },
      {
        name: "activo",
        type: "bool",
        required: false,
        options: {
          default: true
        }
      },
      {
        name: "fecha_alta",
        type: "date",
        required: false
      },
      {
        name: "notas",
        type: "text",
        required: false
      }
    ]
  },
  {
    name: "ventas",
    type: "base",
    schema: [
      {
        name: "fecha",
        type: "date",
        required: true
      },
      {
        name: "numero",
        type: "text",
        required: true
      },
      {
        name: "total",
        type: "number",
        required: true
      },
      {
        name: "estado",
        type: "text",
        required: false
      },
      {
        name: "metodo_pago",
        type: "text",
        required: false
      },
      {
        name: "notas",
        type: "text",
        required: false
      }
    ]
  },
  {
    name: "detalles_venta",
    type: "base",
    schema: [
      {
        name: "cantidad",
        type: "number",
        required: true
      },
      {
        name: "precio_unitario",
        type: "number",
        required: true
      },
      {
        name: "iva",
        type: "number",
        required: false
      },
      {
        name: "descuento",
        type: "number",
        required: false
      },
      {
        name: "total",
        type: "number",
        required: true
      },
      {
        name: "notas",
        type: "text",
        required: false
      }
    ]
  },
  {
    name: "reclamaciones",
    type: "base",
    schema: [
      {
        name: "fecha",
        type: "date",
        required: true
      },
      {
        name: "numero",
        type: "text",
        required: true
      },
      {
        name: "motivo",
        type: "text",
        required: true
      },
      {
        name: "estado",
        type: "text",
        required: false
      },
      {
        name: "resolucion",
        type: "text",
        required: false
      },
      {
        name: "fecha_resolucion",
        type: "date",
        required: false
      },
      {
        name: "notas",
        type: "text",
        required: false
      }
    ]
  },
  {
    name: "reservas_online",
    type: "base",
    schema: [
      {
        name: "fecha",
        type: "date",
        required: true
      },
      {
        name: "numero",
        type: "text",
        required: true
      },
      {
        name: "estado",
        type: "text",
        required: false
      },
      {
        name: "fecha_expiracion",
        type: "date",
        required: false
      },
      {
        name: "deposito",
        type: "number",
        required: false
      },
      {
        name: "total",
        type: "number",
        required: true
      },
      {
        name: "notas",
        type: "text",
        required: false
      }
    ]
  },
  {
    name: "facturas",
    type: "base",
    schema: [
      {
        name: "fecha",
        type: "date",
        required: true
      },
      {
        name: "numero",
        type: "text",
        required: true
      },
      {
        name: "total",
        type: "number",
        required: true
      },
      {
        name: "estado",
        type: "text",
        required: false
      },
      {
        name: "metodo_pago",
        type: "text",
        required: false
      },
      {
        name: "pdf",
        type: "file",
        required: false,
        options: {
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ["application/pdf"],
          protected: false
        }
      },
      {
        name: "notas",
        type: "text",
        required: false
      }
    ]
  },
  {
    name: "configuracion_sistema",
    type: "base",
    schema: [
      {
        name: "clave",
        type: "text",
        required: true
      },
      {
        name: "valor",
        type: "text",
        required: true
      },
      {
        name: "descripcion",
        type: "text",
        required: false
      }
    ]
  },
  {
    name: "backups",
    type: "base",
    schema: [
      {
        name: "fecha",
        type: "date",
        required: true
      },
      {
        name: "tipo",
        type: "text",
        required: true
      },
      {
        name: "ruta",
        type: "text",
        required: false
      },
      {
        name: "tamaño",
        type: "number",
        required: false
      },
      {
        name: "estado",
        type: "text",
        required: false
      },
      {
        name: "notas",
        type: "text",
        required: false
      }
    ]
  }
];

// Función para crear una colección
async function crearColeccion(coleccion) {
  try {
    console.log(`🆕 Creando colección "${coleccion.name}"...`);
    
    // Crear la colección
    const coleccionCreada = await pb.collections.create(coleccion);
    console.log(`✅ Colección "${coleccion.name}" creada correctamente`);
    
    return coleccionCreada;
  } catch (error) {
    console.error(`❌ Error al crear colección "${coleccion.name}":`, error.message);
    if (error.data) {
      console.error('Detalles del error:', JSON.stringify(error.data, null, 2));
    }
    return null;
  }
}

// Función para agregar relaciones
async function agregarRelaciones() {
  try {
    console.log('\n🔄 Agregando relaciones entre colecciones...');
    
    // Obtener IDs de las colecciones
    const coleccionesExistentes = await pb.collections.getFullList();
    
    const productosCol = coleccionesExistentes.find(c => c.name === 'productos');
    const categoriasCol = coleccionesExistentes.find(c => c.name === 'categorias');
    const proveedoresCol = coleccionesExistentes.find(c => c.name === 'proveedores');
    const ventasCol = coleccionesExistentes.find(c => c.name === 'ventas');
    const detallesVentaCol = coleccionesExistentes.find(c => c.name === 'detalles_venta');
    const clientesCol = coleccionesExistentes.find(c => c.name === 'clientes');
    const reclamacionesCol = coleccionesExistentes.find(c => c.name === 'reclamaciones');
    const reservasOnlineCol = coleccionesExistentes.find(c => c.name === 'reservas_online');
    
    // Verificar que todas las colecciones necesarias existen
    if (!productosCol || !categoriasCol || !proveedoresCol || !ventasCol || 
        !detallesVentaCol || !clientesCol || !reclamacionesCol || !reservasOnlineCol) {
      console.error('❌ No se encontraron todas las colecciones necesarias para las relaciones');
      return false;
    }
    
    // 1. Relaciones de productos
    console.log('🔄 Agregando relaciones a productos...');
    
    // Obtener esquema actual
    const productosSchema = [...productosCol.schema];
    
    // Agregar relación con categorías
    productosSchema.push({
      name: "categoria",
      type: "relation",
      required: false,
      options: {
        collectionId: categoriasCol.id,
        cascadeDelete: false,
        maxSelect: 1,
        displayFields: ["nombre"]
      }
    });
    
    // Agregar relación con proveedores
    productosSchema.push({
      name: "proveedor",
      type: "relation",
      required: false,
      options: {
        collectionId: proveedoresCol.id,
        cascadeDelete: false,
        maxSelect: 1,
        displayFields: ["nombre"]
      }
    });
    
    // Actualizar esquema de productos
    await pb.collections.update(productosCol.id, {
      schema: productosSchema
    });
    
    // 2. Relaciones de ventas
    console.log('🔄 Agregando relaciones a ventas...');
    
    // Obtener esquema actual
    const ventasSchema = [...ventasCol.schema];
    
    // Agregar relación con clientes
    ventasSchema.push({
      name: "cliente",
      type: "relation",
      required: false,
      options: {
        collectionId: clientesCol.id,
        cascadeDelete: false,
        maxSelect: 1,
        displayFields: ["nombre", "apellidos"]
      }
    });
    
    // Actualizar esquema de ventas
    await pb.collections.update(ventasCol.id, {
      schema: ventasSchema
    });
    
    // 3. Relaciones de detalles_venta
    console.log('🔄 Agregando relaciones a detalles_venta...');
    
    // Obtener esquema actual
    const detallesVentaSchema = [...detallesVentaCol.schema];
    
    // Agregar relación con ventas
    detallesVentaSchema.push({
      name: "venta",
      type: "relation",
      required: true,
      options: {
        collectionId: ventasCol.id,
        cascadeDelete: true,
        maxSelect: 1,
        displayFields: ["numero"]
      }
    });
    
    // Agregar relación con productos
    detallesVentaSchema.push({
      name: "producto",
      type: "relation",
      required: true,
      options: {
        collectionId: productosCol.id,
        cascadeDelete: false,
        maxSelect: 1,
        displayFields: ["nombre"]
      }
    });
    
    // Actualizar esquema de detalles_venta
    await pb.collections.update(detallesVentaCol.id, {
      schema: detallesVentaSchema
    });
    
    // 4. Relaciones de reclamaciones
    console.log('🔄 Agregando relaciones a reclamaciones...');
    
    // Obtener esquema actual
    const reclamacionesSchema = [...reclamacionesCol.schema];
    
    // Agregar relación con clientes
    reclamacionesSchema.push({
      name: "cliente",
      type: "relation",
      required: false,
      options: {
        collectionId: clientesCol.id,
        cascadeDelete: false,
        maxSelect: 1,
        displayFields: ["nombre", "apellidos"]
      }
    });
    
    // Agregar relación con productos
    reclamacionesSchema.push({
      name: "producto",
      type: "relation",
      required: false,
      options: {
        collectionId: productosCol.id,
        cascadeDelete: false,
        maxSelect: 1,
        displayFields: ["nombre"]
      }
    });
    
    // Actualizar esquema de reclamaciones
    await pb.collections.update(reclamacionesCol.id, {
      schema: reclamacionesSchema
    });
    
    // 5. Relaciones de reservas_online
    console.log('🔄 Agregando relaciones a reservas_online...');
    
    // Obtener esquema actual
    const reservasOnlineSchema = [...reservasOnlineCol.schema];
    
    // Agregar relación con clientes
    reservasOnlineSchema.push({
      name: "cliente",
      type: "relation",
      required: false,
      options: {
        collectionId: clientesCol.id,
        cascadeDelete: false,
        maxSelect: 1,
        displayFields: ["nombre", "apellidos"]
      }
    });
    
    // Agregar relación con productos
    reservasOnlineSchema.push({
      name: "productos",
      type: "relation",
      required: false,
      options: {
        collectionId: productosCol.id,
        cascadeDelete: false,
        maxSelect: null, // Múltiples productos
        displayFields: ["nombre"]
      }
    });
    
    // Actualizar esquema de reservas_online
    await pb.collections.update(reservasOnlineCol.id, {
      schema: reservasOnlineSchema
    });
    
    console.log('✅ Relaciones agregadas correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al agregar relaciones:', error.message);
    if (error.data) {
      console.error('Detalles del error:', JSON.stringify(error.data, null, 2));
    }
    return false;
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando creación de colecciones desde cero...');
    
    // Autenticar como superadmin
    await autenticarAdmin();
    
    // Crear colecciones
    const coleccionesCreadas = [];
    const coleccionesFallidas = [];
    
    for (const coleccion of colecciones) {
      const resultado = await crearColeccion(coleccion);
      
      if (resultado) {
        coleccionesCreadas.push(coleccion.name);
      } else {
        coleccionesFallidas.push(coleccion.name);
      }
    }
    
    // Agregar relaciones entre colecciones
    await agregarRelaciones();
    
    // Mostrar resumen
    console.log('\n📊 Resumen de la creación:');
    console.log(`✅ Colecciones creadas (${coleccionesCreadas.length}): ${coleccionesCreadas.join(', ')}`);
    
    if (coleccionesFallidas.length > 0) {
      console.log(`❌ Colecciones fallidas (${coleccionesFallidas.length}): ${coleccionesFallidas.join(', ')}`);
    }
    
    console.log('\n🏁 Proceso completado');
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
  }
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});
