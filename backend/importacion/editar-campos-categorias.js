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

// Función para obtener la colección categorias
async function obtenerColeccion() {
  try {
    console.log('🔍 Obteniendo información de la colección categorias...');
    const coleccion = await pb.collections.getOne('categorias');
    console.log('✅ Información obtenida:', JSON.stringify(coleccion, null, 2));
    return coleccion;
  } catch (error) {
    console.error('❌ Error al obtener la colección:', error.message);
    return null;
  }
}

// Función para añadir un campo a la colección categorias
async function añadirCampo(nombreCampo, tipoCampo, requerido) {
  try {
    console.log(`📝 Añadiendo campo "${nombreCampo}" (${tipoCampo}) a la colección categorias...`);
    
    // Obtener la colección actual
    const coleccion = await obtenerColeccion();
    if (!coleccion) {
      throw new Error('No se pudo obtener la colección');
    }
    
    // Preparar el nuevo campo
    const nuevoCampo = {
      name: nombreCampo,
      type: tipoCampo,
      required: requerido,
      options: {}
    };
    
    // Añadir opciones específicas según el tipo de campo
    if (tipoCampo === 'text') {
      nuevoCampo.options = {
        min: null,
        max: null,
        pattern: ''
      };
    } else if (tipoCampo === 'number') {
      nuevoCampo.options = {
        min: null,
        max: null
      };
    } else if (tipoCampo === 'bool') {
      nuevoCampo.options = {};
    }
    
    // Obtener el esquema actual
    let esquemaActual = coleccion.schema || [];
    
    // Verificar si el campo ya existe
    const campoExistente = esquemaActual.findIndex(campo => campo.name === nombreCampo);
    if (campoExistente !== -1) {
      console.log(`⚠️ El campo "${nombreCampo}" ya existe, actualizando...`);
      esquemaActual[campoExistente] = nuevoCampo;
    } else {
      // Añadir el nuevo campo al esquema
      esquemaActual.push(nuevoCampo);
    }
    
    // Actualizar la colección con el nuevo esquema
    const resultado = await pb.collections.update('categorias', {
      schema: esquemaActual
    });
    
    console.log(`✅ Campo "${nombreCampo}" añadido/actualizado exitosamente`);
    return resultado;
  } catch (error) {
    console.error(`❌ Error al añadir campo "${nombreCampo}":`, error.message);
    return null;
  }
}

// Función para crear un registro de prueba
async function crearRegistroPrueba() {
  try {
    console.log('📝 Creando registro de prueba en categorias...');
    
    const registro = await pb.collection('categorias').create({
      nombre: 'Categoría de prueba 2',
      descripcion: 'Descripción de prueba 2',
      visible: true,
      orden: 1,
      color: '#FF5733'
    });
    
    console.log('✅ Registro creado exitosamente:', registro);
    return registro;
  } catch (error) {
    console.error('❌ Error al crear registro de prueba:', error.message);
    return null;
  }
}

// Función para listar todos los registros
async function listarRegistros() {
  try {
    console.log('📋 Listando registros de categorias...');
    
    const registros = await pb.collection('categorias').getFullList();
    
    console.log(`✅ Se encontraron ${registros.length} registros:`);
    registros.forEach(registro => {
      console.log(`🔹 ID: ${registro.id}`);
      Object.keys(registro).forEach(key => {
        if (key !== 'id' && key !== 'collectionId' && key !== 'collectionName' && key !== 'created' && key !== 'updated' && key !== 'expand') {
          console.log(`   ${key}: ${registro[key]}`);
        }
      });
    });
    
    return registros;
  } catch (error) {
    console.error('❌ Error al listar registros:', error.message);
    return null;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando edición de campos en categorias...');
  
  // Autenticar
  const autenticado = await autenticarAdmin();
  if (!autenticado) {
    console.error('❌ Error en el proceso: No se pudo autenticar como superadmin');
    return;
  }
  
  // Obtener información actual de la colección
  await obtenerColeccion();
  
  // Añadir/actualizar campos
  await añadirCampo('nombre', 'text', true);
  await añadirCampo('descripcion', 'text', false);
  await añadirCampo('visible', 'bool', true);
  await añadirCampo('orden', 'number', false);
  await añadirCampo('color', 'text', false);
  
  // Obtener información actualizada de la colección
  await obtenerColeccion();
  
  // Crear un registro de prueba
  await crearRegistroPrueba();
  
  // Listar todos los registros
  await listarRegistros();
  
  console.log('✅ Proceso completado exitosamente');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
