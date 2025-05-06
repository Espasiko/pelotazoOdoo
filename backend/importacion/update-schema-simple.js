// Script para actualizar el esquema de la colección importaciones (versión simplificada)
import { fetchAdmin, autenticarAdmin } from './utils.js';

async function updateImportacionesSchema() {
  try {
    console.log('Actualizando esquema de la colección importaciones (versión simplificada)...');
    
    // Autenticar como admin
    await autenticarAdmin();
    
    // Verificar si existe la colección importaciones
    const collections = await fetchAdmin('/api/collections');
    const importaciones = collections.items.find(c => c.name === 'importaciones');
    
    if (!importaciones) {
      console.error('Error: La colección importaciones no existe');
      return;
    }
    
    console.log('Colección importaciones encontrada con ID:', importaciones.id);
    
    // Campos que necesitamos agregar (solo los esenciales)
    const camposFaltantes = [
      {
        name: 'estado',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'log',
        type: 'text',
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      },
      {
        name: 'proveedor',
        type: 'text',
        required: true,
        options: {
          min: null,
          max: null,
          pattern: ''
        }
      }
    ];
    
    // Verificar qué campos ya existen
    const camposExistentes = importaciones.schema.map(campo => campo.name);
    console.log('Campos existentes:', camposExistentes);
    
    // Filtrar solo los campos que faltan
    const camposParaAgregar = camposFaltantes.filter(campo => !camposExistentes.includes(campo.name));
    console.log('Campos para agregar:', camposParaAgregar.map(c => c.name));
    
    if (camposParaAgregar.length === 0) {
      console.log('No hay campos para agregar. El esquema ya está completo.');
      return;
    }
    
    // Actualizar el esquema
    const nuevoSchema = [...importaciones.schema, ...camposParaAgregar];
    
    const resultado = await fetchAdmin(`/api/collections/${importaciones.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        schema: nuevoSchema
      })
    });
    
    console.log('Esquema actualizado correctamente:', resultado);
    console.log('Campos agregados:', camposParaAgregar.map(c => c.name));
  } catch (error) {
    console.error('Error al actualizar esquema:', error);
  }
}

updateImportacionesSchema();
