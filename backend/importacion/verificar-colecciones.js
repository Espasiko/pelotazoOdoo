/**
 * Script para verificar la estructura de las colecciones en PocketBase
 * Este script muestra información detallada sobre las colecciones existentes
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

// Función para obtener la lista de colecciones
async function obtenerColecciones() {
  try {
    console.log('Obteniendo lista de colecciones...');
    
    const colecciones = await pb.collections.getFullList();
    console.log(`Se encontraron ${colecciones.length} colecciones`);
    
    return colecciones;
  } catch (error) {
    console.error('Error al obtener colecciones:', error);
    throw error;
  }
}

// Función para verificar los campos de una colección
async function verificarCamposColeccion(coleccion) {
  try {
    console.log(`\nVerificando campos de la colección "${coleccion.name}":`);
    console.log(`- ID: ${coleccion.id}`);
    console.log(`- Tipo: ${coleccion.type}`);
    console.log(`- Reglas:`);
    console.log(`  - Lista: "${coleccion.listRule}"`);
    console.log(`  - Ver: "${coleccion.viewRule}"`);
    console.log(`  - Crear: "${coleccion.createRule}"`);
    console.log(`  - Actualizar: "${coleccion.updateRule}"`);
    console.log(`  - Eliminar: "${coleccion.deleteRule}"`);
    
    console.log(`- Esquema (${coleccion.schema.length} campos):`);
    for (const campo of coleccion.schema) {
      console.log(`  - ${campo.name} (${campo.type})${campo.required ? ' [Requerido]' : ''}`);
      
      if (campo.options) {
        console.log(`    Opciones: ${JSON.stringify(campo.options)}`);
      }
    }
    
    // Intentar obtener un registro para ver su estructura
    try {
      const registros = await pb.collection(coleccion.name).getList(1, 1);
      if (registros.items.length > 0) {
        console.log(`- Ejemplo de registro:`);
        console.log(JSON.stringify(registros.items[0], null, 2));
      } else {
        console.log(`- No hay registros en esta colección`);
      }
    } catch (error) {
      console.error(`  Error al obtener registros: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error al verificar campos de ${coleccion.name}:`, error);
    return false;
  }
}

// Función para verificar si una colección tiene los campos necesarios
async function verificarEsquemaColeccion(coleccion, esquemaEsperado) {
  console.log(`\nVerificando esquema de la colección "${coleccion.name}":`);
  
  const camposActuales = coleccion.schema.map(campo => campo.name);
  const camposEsperados = esquemaEsperado.map(campo => campo.name);
  
  const camposFaltantes = camposEsperados.filter(campo => !camposActuales.includes(campo));
  const camposExtra = camposActuales.filter(campo => !camposEsperados.includes(campo) && !['id', 'created', 'updated'].includes(campo));
  
  if (camposFaltantes.length > 0) {
    console.log(`  ❌ Faltan campos: ${camposFaltantes.join(', ')}`);
  } else {
    console.log(`  ✅ Todos los campos esperados están presentes`);
  }
  
  if (camposExtra.length > 0) {
    console.log(`  ⚠️ Campos adicionales: ${camposExtra.join(', ')}`);
  }
  
  // Verificar tipos de campos
  for (const campoEsperado of esquemaEsperado) {
    const campoActual = coleccion.schema.find(campo => campo.name === campoEsperado.name);
    if (campoActual) {
      if (campoActual.type !== campoEsperado.type) {
        console.log(`  ❌ El campo "${campoEsperado.name}" tiene tipo "${campoActual.type}" pero se esperaba "${campoEsperado.type}"`);
      }
      
      if (campoEsperado.required && !campoActual.required) {
        console.log(`  ⚠️ El campo "${campoEsperado.name}" debería ser requerido`);
      }
    }
  }
  
  return camposFaltantes.length === 0;
}

// Definición de esquemas esperados para las colecciones
const esquemasEsperados = {
  categorias: [
    { name: 'nombre', type: 'text', required: true },
    { name: 'activo', type: 'bool', required: true },
    { name: 'fecha_alta', type: 'date', required: true }
  ],
  proveedores: [
    { name: 'nombre', type: 'text', required: true },
    { name: 'activo', type: 'bool', required: true },
    { name: 'fecha_alta', type: 'date', required: true }
  ],
  productos: [
    { name: 'codigo', type: 'text', required: true },
    { name: 'nombre', type: 'text', required: true },
    { name: 'precio', type: 'number', required: true },
    { name: 'activo', type: 'bool', required: true },
    { name: 'fecha_alta', type: 'date', required: true },
    { name: 'categoria', type: 'relation', required: false },
    { name: 'proveedor', type: 'relation', required: false }
  ],
  importaciones: [
    { name: 'fecha', type: 'date', required: true },
    { name: 'proveedor', type: 'text', required: true },
    { name: 'tipo', type: 'text', required: true },
    { name: 'estado', type: 'text', required: true },
    { name: 'archivo', type: 'text', required: true },
    { name: 'log', type: 'text', required: false }
  ],
  devoluciones: [
    { name: 'fecha', type: 'date', required: true },
    { name: 'producto', type: 'relation', required: true },
    { name: 'motivo', type: 'text', required: true },
    { name: 'cantidad', type: 'number', required: true }
  ]
};

// Función principal
async function main() {
  try {
    // Autenticar como superusuario
    await autenticarComoSuperusuario();
    
    // Obtener lista de colecciones
    const colecciones = await obtenerColecciones();
    
    // Verificar cada colección
    for (const coleccion of colecciones) {
      await verificarCamposColeccion(coleccion);
      
      // Si es una de nuestras colecciones, verificar su esquema
      if (esquemasEsperados[coleccion.name]) {
        await verificarEsquemaColeccion(coleccion, esquemasEsperados[coleccion.name]);
      }
    }
    
    // Verificar colecciones faltantes
    const coleccionesExistentes = colecciones.map(col => col.name);
    const coleccionesNecesarias = Object.keys(esquemasEsperados);
    const coleccionesFaltantes = coleccionesNecesarias.filter(col => !coleccionesExistentes.includes(col));
    
    if (coleccionesFaltantes.length > 0) {
      console.log(`\n❌ Faltan las siguientes colecciones: ${coleccionesFaltantes.join(', ')}`);
    } else {
      console.log(`\n✅ Todas las colecciones necesarias existen`);
    }
    
    console.log('\nVerificación completada');
  } catch (error) {
    console.error('Error en la verificación:', error);
  }
}

// Ejecutar la función principal
main()
  .then(() => {
    console.log('Script finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error fatal en el script:', error);
    process.exit(1);
  });
