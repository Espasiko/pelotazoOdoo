import PocketBase from 'pocketbase';
import { pocketbaseConfig } from './config.js';

// Instancia de PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

// Función para autenticar como superadmin
async function autenticarAdmin() {
  try {
    // Verificar si ya estamos autenticados
    if (pb.authStore.isValid && pb.authStore.model?.id) {
      console.log('✅ Ya estamos autenticados como superadmin');
      return true;
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
    return true;
  } catch (error) {
    console.error('❌ Error al autenticar:', error.message);
    return false;
  }
}

// Función para obtener una colección
async function obtenerColeccion(nombre) {
  try {
    return await pb.collections.getOne(nombre);
  } catch (error) {
    console.error(`❌ Error al obtener colección "${nombre}":`, error.message);
    return null;
  }
}

// Función para añadir o actualizar un campo en una colección
async function añadirActualizarCampo(coleccionId, campo) {
  try {
    // Obtener la colección actual
    const coleccion = await pb.collections.getOne(coleccionId);
    
    // Verificar si el campo ya existe
    const campoExistente = coleccion.fields.find(c => c.name === campo.name);
    
    // Preparar el esquema actualizado
    let nuevoEsquema;
    
    if (campoExistente) {
      // Actualizar campo existente
      console.log(`🔄 Actualizando campo "${campo.name}" en colección "${coleccion.name}"...`);
      nuevoEsquema = coleccion.fields.map(c => {
        if (c.name === campo.name) {
          return { ...c, ...campo };
        }
        return c;
      });
    } else {
      // Añadir nuevo campo
      console.log(`➕ Añadiendo campo "${campo.name}" a la colección "${coleccion.name}"...`);
      nuevoEsquema = [...coleccion.fields, campo];
    }
    
    // Actualizar la colección con el nuevo esquema
    await pb.collections.update(coleccionId, {
      schema: nuevoEsquema
    });
    
    console.log(`✅ Campo "${campo.name}" añadido/actualizado exitosamente`);
    return true;
  } catch (error) {
    console.error(`❌ Error al añadir/actualizar campo "${campo.name}":`, error.message);
    return false;
  }
}

// Función para editar campos de todas las colecciones
async function editarCamposTodasColecciones() {
  try {
    console.log('🚀 Editando campos de todas las colecciones...');
    
    // Campos para categorias
    const camposCategorias = [
      {
        name: 'nombre',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'descripcion',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'visible',
        type: 'bool',
        required: true,
        options: {}
      },
      {
        name: 'orden',
        type: 'number',
        required: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        name: 'color',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'imagen_categoria',
        type: 'file',
        required: false,
        options: {
          maxSelect: 1,
          maxSize: 5242880, // 5MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          thumbs: ['100x100', '200x200']
        }
      }
    ];
    
    // Campos para proveedores
    const camposProveedores = [
      {
        name: 'nombre',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'contacto',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'telefono',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'email',
        type: 'email',
        required: false,
        options: {
          exceptDomains: null,
          onlyDomains: null
        }
      },
      {
        name: 'direccion',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'notas',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'activo',
        type: 'bool',
        required: true,
        options: {}
      }
    ];
    
    // Campos para productos
    const camposProductos = [
      {
        name: 'codigo',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'nombre',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'precio',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: null
        }
      },
      {
        name: 'activo',
        type: 'bool',
        required: true,
        options: {}
      },
      {
        name: 'fecha_alta',
        type: 'date',
        required: true,
        options: {
          min: '',
          max: ''
        }
      },
      {
        name: 'descripcion',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'stock',
        type: 'number',
        required: false,
        options: {
          min: 0,
          max: null
        }
      },
      {
        name: 'imagen_producto',
        type: 'file',
        required: false,
        options: {
          maxSelect: 5,
          maxSize: 5242880, // 5MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          thumbs: ['100x100', '200x200', '500x500']
        }
      }
    ];
    
    // Campos para importaciones
    const camposImportaciones = [
      {
        name: 'fecha',
        type: 'date',
        required: true,
        options: {
          min: '',
          max: ''
        }
      },
      {
        name: 'archivo',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'registros_procesados',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: null
        }
      },
      {
        name: 'registros_creados',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: null
        }
      },
      {
        name: 'registros_actualizados',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: null
        }
      },
      {
        name: 'registros_error',
        type: 'number',
        required: true,
        options: {
          min: 0,
          max: null
        }
      },
      {
        name: 'notas',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'archivo_original',
        type: 'file',
        required: false,
        options: {
          maxSelect: 1,
          maxSize: 10485760, // 10MB
          mimeTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
          thumbs: []
        }
      }
    ];
    
    // Obtener colecciones
    const colecciones = {
      categorias: await obtenerColeccion('categorias'),
      proveedores: await obtenerColeccion('proveedores'),
      productos: await obtenerColeccion('productos'),
      importaciones: await obtenerColeccion('importaciones')
    };
    
    // Editar campos de categorias
    if (colecciones.categorias) {
      console.log('\n📝 Editando campos de categorias...');
      for (const campo of camposCategorias) {
        await añadirActualizarCampo(colecciones.categorias.id, campo);
      }
      // Crear registro de prueba
      console.log('📝 Creando registro de prueba en categorias...');
      const registroCategorias = await pb.collection('categorias').create({
        nombre: 'Categoría de prueba ' + Date.now(),
        descripcion: 'Descripción de prueba',
        visible: true,
        orden: 1,
        color: '#FF5733'
      });
      console.log('✅ Registro creado exitosamente:', registroCategorias);
    } else {
      console.error('❌ No se encontró la colección categorias');
    }
    
    // Editar campos de proveedores
    if (colecciones.proveedores) {
      console.log('\n📝 Editando campos de proveedores...');
      for (const campo of camposProveedores) {
        await añadirActualizarCampo(colecciones.proveedores.id, campo);
      }
      // Crear registro de prueba
      console.log('📝 Creando registro de prueba en proveedores...');
      const registroProveedores = await pb.collection('proveedores').create({
        nombre: 'Proveedor de prueba ' + Date.now(),
        contacto: 'Contacto de prueba',
        telefono: '123456789',
        email: 'prueba@ejemplo.com',
        direccion: 'Dirección de prueba',
        notas: 'Notas de prueba',
        activo: true
      });
      console.log('✅ Registro creado exitosamente:', registroProveedores);
    } else {
      console.error('❌ No se encontró la colección proveedores');
    }
    
    // Editar campos de productos
    if (colecciones.productos) {
      console.log('\n📝 Editando campos de productos...');
      for (const campo of camposProductos) {
        await añadirActualizarCampo(colecciones.productos.id, campo);
      }
      // Crear registro de prueba
      console.log('📝 Creando registro de prueba en productos...');
      const registroProductos = await pb.collection('productos').create({
        codigo: 'PROD-' + Date.now(),
        nombre: 'Producto de prueba ' + Date.now(),
        precio: 19.99,
        activo: true,
        fecha_alta: new Date().toISOString().split('T')[0],
        descripcion: 'Descripción de producto de prueba',
        stock: 10
      });
      console.log('✅ Registro creado exitosamente:', registroProductos);
    } else {
      console.error('❌ No se encontró la colección productos');
    }
    
    // Editar campos de importaciones
    if (colecciones.importaciones) {
      console.log('\n📝 Editando campos de importaciones...');
      for (const campo of camposImportaciones) {
        await añadirActualizarCampo(colecciones.importaciones.id, campo);
      }
      // Crear registro de prueba
      console.log('📝 Creando registro de prueba en importaciones...');
      const registroImportaciones = await pb.collection('importaciones').create({
        fecha: new Date().toISOString().split('T')[0],
        archivo: 'importacion_' + Date.now() + '.csv',
        registros_procesados: 100,
        registros_creados: 50,
        registros_actualizados: 30,
        registros_error: 20,
        notas: 'Importación de prueba'
      });
      console.log('✅ Registro creado exitosamente:', registroImportaciones);
    } else {
      console.error('❌ No se encontró la colección importaciones');
    }
    
    console.log('\n✅ Edición de campos completada para todas las colecciones');
    return true;
  } catch (error) {
    console.error('❌ Error al editar campos de las colecciones:', error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando edición de campos en todas las colecciones...');
  
  // Autenticar
  const autenticado = await autenticarAdmin();
  if (!autenticado) {
    console.error('❌ Error en el proceso: No se pudo autenticar como superadmin');
    return;
  }
  
  // Editar campos de todas las colecciones
  await editarCamposTodasColecciones();
  
  console.log('✅ Proceso completado exitosamente');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
