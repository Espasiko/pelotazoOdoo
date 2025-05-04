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
    return null;
  }
}

// Función para configurar una colección
async function configurarColeccion(nombre, campos, reglas = {}) {
  try {
    console.log(`📝 Configurando colección "${nombre}"...`);
    
    // Verificar si la colección existe
    let coleccion = await obtenerColeccion(nombre);
    
    if (!coleccion) {
      // Crear la colección si no existe
      console.log(`📦 Creando colección "${nombre}"...`);
      coleccion = await pb.collections.create({
        name: nombre,
        type: 'base',
        schema: [],
        ...reglas
      });
      console.log(`✅ Colección "${nombre}" creada exitosamente`);
    }
    
    // Obtener los campos actuales
    const camposActuales = coleccion.fields || [];
    
    // Filtrar campos del sistema
    const camposNoSistema = camposActuales.filter(campo => !campo.system);
    
    // Crear un mapa de campos actuales por nombre
    const mapaCamposActuales = {};
    camposNoSistema.forEach(campo => {
      mapaCamposActuales[campo.name] = campo;
    });
    
    // Preparar los nuevos campos
    const nuevosCampos = [];
    
    // Añadir campos existentes que no están en la lista de campos a configurar
    Object.values(mapaCamposActuales).forEach(campo => {
      if (!campos.find(c => c.name === campo.name)) {
        nuevosCampos.push(campo);
      }
    });
    
    // Añadir o actualizar campos
    for (const campo of campos) {
      if (mapaCamposActuales[campo.name]) {
        // El campo ya existe, actualizarlo
        console.log(`🔄 Actualizando campo "${campo.name}" en colección "${nombre}"...`);
        
        // Mantener el ID del campo existente
        const campoActualizado = {
          ...mapaCamposActuales[campo.name],
          ...campo
        };
        
        nuevosCampos.push(campoActualizado);
      } else {
        // El campo no existe, añadirlo
        console.log(`➕ Añadiendo campo "${campo.name}" en colección "${nombre}"...`);
        nuevosCampos.push(campo);
      }
    }
    
    // Actualizar la colección con los nuevos campos
    const coleccionActualizada = await pb.collections.update(coleccion.id, {
      schema: nuevosCampos,
      ...reglas
    });
    
    console.log(`✅ Colección "${nombre}" configurada exitosamente con ${nuevosCampos.length} campos`);
    return coleccionActualizada;
  } catch (error) {
    console.error(`❌ Error al configurar colección "${nombre}":`, error.message);
    return null;
  }
}

// Función para configurar todas las colecciones
async function configurarTodasLasColecciones() {
  try {
    console.log('🚀 Configurando todas las colecciones...');
    
    // Configurar colección "categorias"
    const categorias = await configurarColeccion('categorias', [
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
    ], {
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    });
    
    // Configurar colección "proveedores"
    const proveedores = await configurarColeccion('proveedores', [
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
    ], {
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    });
    
    // Configurar colección "productos"
    const productos = await configurarColeccion('productos', [
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
      },
      {
        name: 'categoria',
        type: 'relation',
        required: false,
        options: {
          collectionId: 'categorias',
          cascadeDelete: false,
          maxSelect: 1,
          displayFields: ['nombre']
        }
      },
      {
        name: 'proveedor',
        type: 'relation',
        required: false,
        options: {
          collectionId: 'proveedores',
          cascadeDelete: false,
          maxSelect: 1,
          displayFields: ['nombre']
        }
      }
    ], {
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    });
    
    // Configurar colección "importaciones"
    const importaciones = await configurarColeccion('importaciones', [
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
    ], {
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    });
    
    console.log('✅ Todas las colecciones configuradas exitosamente');
    return {
      categorias,
      proveedores,
      productos,
      importaciones
    };
  } catch (error) {
    console.error('❌ Error al configurar todas las colecciones:', error.message);
    return null;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando configuración de colecciones...');
  
  // Autenticar
  const autenticado = await autenticarAdmin();
  if (!autenticado) {
    console.error('❌ Error en el proceso: No se pudo autenticar como superadmin');
    return;
  }
  
  // Configurar todas las colecciones
  await configurarTodasLasColecciones();
  
  console.log('✅ Proceso completado exitosamente');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
