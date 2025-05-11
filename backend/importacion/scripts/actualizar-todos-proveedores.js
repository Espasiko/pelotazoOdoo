/**
 * Script para actualizar todos los proveedores en PocketBase
 * Este script asegura que todos los proveedores estén disponibles en el sistema
 */

import { fetchAdmin } from '../db/client.js';
import { proveedoresNormalizados } from '../parsers/providers-map.js';
import { proveedorParsers } from '../parsers/index.js';
import { pocketbaseConfig } from '../config.js';

// Lista de proveedores que deben estar disponibles
const proveedoresRequeridos = [
  'ABRILA',
  'AGUACONFORT',
  'AIRPAL',
  'ALFADYSER',
  'ALMCE',
  'BALAY',
  'BECKEN',
  'BOSCH',
  'BSH',
  'CECOTEC',
  'EAS-JOHNSON',
  'ELECTRODIRECTO',
  'JATA',
  'MIELECTRO',
  'NEFF',
  'NEVIR',
  'ORBEGOZO',
  'SIEMENS',
  'TEGALUXE',
  'UFESA',
  'VITROKITCHEN'
];

/**
 * Función para actualizar todos los proveedores
 */
async function actualizarTodosProveedores() {
  console.log('=== INICIANDO ACTUALIZACIÓN DE TODOS LOS PROVEEDORES ===');
  
  try {
    console.log(`Conectado a PocketBase en ${pocketbaseConfig.url}`);
    
    // Obtener proveedores existentes
    const filtro = encodeURIComponent(`activo = true`);
    const urlBusqueda = `/api/collections/proveedores/records?filter=${filtro}&perPage=100`;
    const resultado = await fetchAdmin(urlBusqueda, { method: 'GET' });
    
    const proveedoresExistentes = resultado.items || [];
    console.log(`Proveedores existentes: ${proveedoresExistentes.length}`);
    
    // Mapear proveedores existentes por nombre
    const mapProveedoresExistentes = {};
    proveedoresExistentes.forEach(proveedor => {
      mapProveedoresExistentes[proveedor.nombre.toUpperCase()] = proveedor;
    });
    
    // Crear o actualizar cada proveedor requerido
    let creados = 0;
    let actualizados = 0;
    
    for (const nombreProveedor of proveedoresRequeridos) {
      // Normalizar nombre del proveedor
      const nombreNormalizado = proveedoresNormalizados[nombreProveedor.toUpperCase()] || nombreProveedor.toUpperCase();
      
      // Verificar si el proveedor ya existe
      if (mapProveedoresExistentes[nombreNormalizado]) {
        console.log(`Proveedor ${nombreNormalizado} ya existe, actualizando...`);
        
        // Actualizar proveedor existente
        const proveedorExistente = mapProveedoresExistentes[nombreNormalizado];
        const urlActualizacion = `/api/collections/proveedores/records/${proveedorExistente.id}`;
        const proveedorActualizado = await fetchAdmin(urlActualizacion, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre: nombreNormalizado,
            activo: true
          })
        });
        
        console.log(`Proveedor ${nombreNormalizado} actualizado con éxito`);
        actualizados++;
      } else {
        console.log(`Proveedor ${nombreNormalizado} no existe, creando...`);
        
        // Crear nuevo proveedor
        const urlCreacion = `/api/collections/proveedores/records`;
        const nuevoProveedor = await fetchAdmin(urlCreacion, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre: nombreNormalizado,
            activo: true,
            fecha_alta: new Date().toISOString()
          })
        });
        
        console.log(`Proveedor ${nombreNormalizado} creado con éxito`);
        creados++;
      }
    }
    
    console.log(`\n=== RESUMEN DE ACTUALIZACIÓN DE PROVEEDORES ===`);
    console.log(`Total de proveedores requeridos: ${proveedoresRequeridos.length}`);
    console.log(`Proveedores creados: ${creados}`);
    console.log(`Proveedores actualizados: ${actualizados}`);
    console.log(`\n✅ ACTUALIZACIÓN DE PROVEEDORES COMPLETADA CON ÉXITO`);
    
  } catch (error) {
    console.error(`\n❌ ERROR EN LA ACTUALIZACIÓN DE PROVEEDORES:`, error);
    process.exit(1);
  }
}

// Ejecutar la función principal
actualizarTodosProveedores();
