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

// Definición de esquemas para las colecciones
const esquemas = {
  categorias: [
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
      required: false
    },
    {
      name: "fecha_alta",
      type: "date",
      required: false
    },
    {
      name: "visible_online",
      type: "bool",
      required: false
    },
    {
      name: "orden",
      type: "number",
      required: false
    }
  ],
  proveedores: [
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
      required: false
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
  ],
  productos: [
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
      required: false
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
  ],
  importaciones: [
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
};

// Función para actualizar el esquema de una colección
async function actualizarEsquema(coleccionId, nombreColeccion, esquema) {
  try {
    console.log(`🔄 Actualizando esquema de la colección "${nombreColeccion}"...`);
    
    // Obtener la colección actual
    const coleccion = await pb.collections.getOne(coleccionId);
    console.log(`✅ Colección "${nombreColeccion}" encontrada`);
    
    // Actualizar el esquema
    await pb.collections.update(coleccionId, {
      schema: esquema
    });
    
    console.log(`✅ Esquema de "${nombreColeccion}" actualizado correctamente`);
    return true;
  } catch (error) {
    console.error(`❌ Error al actualizar esquema de "${nombreColeccion}":`, error.message);
    if (error.data) {
      console.error('Detalles del error:', JSON.stringify(error.data, null, 2));
    }
    return false;
  }
}

// Función para agregar relaciones después de que los esquemas básicos estén creados
async function agregarRelaciones(colecciones) {
  try {
    console.log('\n🔄 Agregando relaciones entre colecciones...');
    
    // Obtener IDs de las colecciones
    const productosId = colecciones.find(c => c.name === 'productos')?.id;
    const categoriasId = colecciones.find(c => c.name === 'categorias')?.id;
    const proveedoresId = colecciones.find(c => c.name === 'proveedores')?.id;
    
    if (!productosId || !categoriasId || !proveedoresId) {
      console.error('❌ No se encontraron todas las colecciones necesarias para las relaciones');
      return false;
    }
    
    // Obtener el esquema actual de productos
    const productosColeccion = await pb.collections.getOne(productosId);
    const esquemaActual = productosColeccion.schema || [];
    
    // Agregar relación con categorías
    const relacionCategoria = {
      name: "categoria",
      type: "relation",
      required: false,
      options: {
        collectionId: categoriasId,
        cascadeDelete: false,
        maxSelect: 1,
        displayFields: ["nombre"]
      }
    };
    
    // Agregar relación con proveedores
    const relacionProveedor = {
      name: "proveedor",
      type: "relation",
      required: false,
      options: {
        collectionId: proveedoresId,
        cascadeDelete: false,
        maxSelect: 1,
        displayFields: ["nombre"]
      }
    };
    
    // Actualizar el esquema con las relaciones
    const nuevoEsquema = [...esquemaActual, relacionCategoria, relacionProveedor];
    
    await pb.collections.update(productosId, {
      schema: nuevoEsquema
    });
    
    console.log('✅ Relaciones agregadas correctamente a "productos"');
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
    console.log('🚀 Iniciando actualización de esquemas...');
    
    // Autenticar como superadmin
    await autenticarAdmin();
    
    // Obtener todas las colecciones
    const colecciones = await pb.collections.getFullList();
    console.log(`📋 Se encontraron ${colecciones.length} colecciones`);
    
    // Actualizar esquemas de las colecciones principales
    const resultados = {};
    
    for (const [nombreColeccion, esquema] of Object.entries(esquemas)) {
      const coleccion = colecciones.find(c => c.name === nombreColeccion);
      
      if (coleccion) {
        const resultado = await actualizarEsquema(coleccion.id, nombreColeccion, esquema);
        resultados[nombreColeccion] = resultado ? 'actualizado' : 'error';
      } else {
        console.log(`⚠️ Colección "${nombreColeccion}" no encontrada`);
        resultados[nombreColeccion] = 'no encontrada';
      }
    }
    
    // Agregar relaciones después de que los esquemas básicos estén creados
    await agregarRelaciones(colecciones);
    
    // Mostrar resumen
    console.log('\n📊 Resumen de la actualización:');
    
    for (const [nombre, resultado] of Object.entries(resultados)) {
      console.log(`   - ${nombre}: ${resultado}`);
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
