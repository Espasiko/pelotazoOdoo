/**
 * Función mejorada para obtener o crear un proveedor por su nombre
 * Garantiza la creación de múltiples proveedores con nombres únicos
 */

import { pocketbaseConfig } from './config.js';
import { autenticarAdmin, fetchAdmin } from './utils.js';
import { proveedoresNormalizados as proveedoresNormalizadosParser } from './parsers.js';

// Variable global para rastrear proveedores creados en esta sesión
if (!global.proveedoresCreados) global.proveedoresCreados = [];

/**
 * Obtiene el ID de un proveedor por su nombre, creando uno nuevo si no existe
 * @param {string} nombreProveedor - Nombre del proveedor
 * @param {Function} fetchAdminFunc - Función para realizar la llamada API a PocketBase
 * @returns {Promise<string|null>} - ID del proveedor o null si no se pudo obtener/crear
 */
export async function obtenerIdProveedor(nombreProveedor, fetchAdminFunc = fetchAdmin) {
  // Validación básica
  if (!nombreProveedor || typeof nombreProveedor !== 'string') {
    console.log('[obtenerIdProveedor] Nombre de proveedor inválido o no proporcionado');
    return null;
  }

  // Normalizar el nombre del proveedor (eliminar espacios extra, convertir a mayúsculas)
  const nombreNormalizado = nombreProveedor.trim().toUpperCase();
  console.log(`[obtenerIdProveedor] Procesando proveedor: "${nombreProveedor}" (normalizado: "${nombreNormalizado}")`);

  // 1. PASO 1: Buscar si el proveedor ya existe exactamente como está
  try {
    const proveedorExacto = await fetchAdminFunc(`/api/collections/proveedores/records`, {
      method: 'GET',
      params: {
        filter: `nombre="${nombreProveedor}"`,
        sort: "-created",
        perPage: 1
      }
    });

    if (proveedorExacto.items && proveedorExacto.items.length > 0) {
      console.log(`[obtenerIdProveedor] Proveedor encontrado exacto: ${proveedorExacto.items[0].id} - ${proveedorExacto.items[0].nombre}`);
      return proveedorExacto.items[0].id;
    }
  } catch (error) {
    console.warn(`[obtenerIdProveedor] Error al buscar proveedor exacto:`, error);
    // Continuar con el siguiente paso
  }

  // 2. PASO 2: Buscar por nombre normalizado
  try {
    const proveedorNormalizado = await fetchAdminFunc(`/api/collections/proveedores/records`, {
      method: 'GET',
      params: {
        filter: `nombre~"${nombreNormalizado}"`,
        sort: "-created",
        perPage: 5
      }
    });

    if (proveedorNormalizado.items && proveedorNormalizado.items.length > 0) {
      // Verificar si hay una coincidencia exacta o muy cercana
      for (const item of proveedorNormalizado.items) {
        const itemNombre = item.nombre.toUpperCase();
        if (itemNombre === nombreNormalizado || 
            itemNombre.includes(nombreNormalizado) || 
            nombreNormalizado.includes(itemNombre)) {
          console.log(`[obtenerIdProveedor] Proveedor encontrado por nombre normalizado: ${item.id} - ${item.nombre}`);
          return item.id;
        }
      }
    }
  } catch (error) {
    console.warn(`[obtenerIdProveedor] Error al buscar proveedor normalizado:`, error);
    // Continuar con el siguiente paso
  }

  // 3. PASO 3: Crear un nuevo proveedor con un nombre único
  console.log(`[obtenerIdProveedor] No se encontró proveedor existente, creando uno nuevo`);
  
  // Generar un nombre único para el proveedor
  // Formato: NOMBRE_ORIGINAL (TIMESTAMP)
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').substring(0, 14);
  const nombreUnico = `${nombreProveedor} (${timestamp})`;
  
  console.log(`[obtenerIdProveedor] Nombre único generado: "${nombreUnico}"`);
  
  // Datos del proveedor
  const datosProveedor = {
    nombre: nombreUnico,
    activo: true,
    fecha_alta: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
    notas: `Creado automáticamente durante importación el ${new Date().toISOString()}`
  };
  
  // Intentar crear el proveedor
  try {
    console.log(`[obtenerIdProveedor] Enviando datos para crear proveedor:`, JSON.stringify(datosProveedor));
    
    const nuevoProveedor = await fetchAdminFunc(`/api/collections/proveedores/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosProveedor)
    });
    
    if (nuevoProveedor && nuevoProveedor.id) {
      console.log(`[obtenerIdProveedor] Proveedor creado exitosamente: ${nuevoProveedor.id} - ${nuevoProveedor.nombre}`);
      
      // Registrar el proveedor creado
      global.proveedoresCreados.push({
        id: nuevoProveedor.id,
        nombre: nuevoProveedor.nombre,
        nombreOriginal: nombreProveedor,
        timestamp: new Date().toISOString()
      });
      
      console.log(`[obtenerIdProveedor] Total de proveedores creados en esta sesión: ${global.proveedoresCreados.length}`);
      
      return nuevoProveedor.id;
    } else {
      console.error(`[obtenerIdProveedor] Respuesta inesperada al crear proveedor:`, JSON.stringify(nuevoProveedor));
      return null;
    }
  } catch (error) {
    console.error(`[obtenerIdProveedor] Error al crear proveedor:`, error);
    
    // Intentar extraer más detalles del error
    if (error.response) {
      try {
        const errorBody = await error.response.json().catch(() => ({}));
        console.error(`[obtenerIdProveedor] Detalles del error:`, JSON.stringify(errorBody));
        
        // Si es un error de unicidad, intentar con un nombre aún más único
        if (errorBody.code === 400 && errorBody.data && errorBody.data.nombre && 
            errorBody.data.nombre.code === 'validation_not_unique') {
          
          const nombreMásÚnico = `${nombreProveedor} (${timestamp}_${Math.floor(Math.random() * 10000)})`;
          console.log(`[obtenerIdProveedor] Intentando con nombre aún más único: ${nombreMásÚnico}`);
          
          // Actualizar los datos del proveedor con el nuevo nombre
          datosProveedor.nombre = nombreMásÚnico;
          
          // Intentar crear de nuevo
          try {
            const segundoIntento = await fetchAdminFunc(`/api/collections/proveedores/records`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(datosProveedor)
            });
            
            if (segundoIntento && segundoIntento.id) {
              console.log(`[obtenerIdProveedor] Proveedor creado en segundo intento: ${segundoIntento.id} - ${segundoIntento.nombre}`);
              return segundoIntento.id;
            }
          } catch (segundoError) {
            console.error(`[obtenerIdProveedor] Error en segundo intento:`, segundoError);
          }
        }
      } catch (extractionError) {
        console.error(`[obtenerIdProveedor] Error al extraer detalles:`, extractionError);
      }
    }
    
    // Si todo falla, intentar con FormData como último recurso
    try {
      console.log(`[obtenerIdProveedor] Último intento con FormData`);
      
      const formData = new FormData();
      const nombreFormData = `${nombreProveedor} (FD_${timestamp}_${Math.floor(Math.random() * 10000)})`;
      
      formData.append('nombre', nombreFormData);
      formData.append('activo', 'true');
      formData.append('fecha_alta', new Date().toISOString().split('T')[0]);
      formData.append('notas', `Creado con FormData el ${new Date().toISOString()}`);
      
      const formDataResult = await fetchAdminFunc(`/api/collections/proveedores/records`, {
        method: 'POST',
        body: formData
      });
      
      if (formDataResult && formDataResult.id) {
        console.log(`[obtenerIdProveedor] Proveedor creado con FormData: ${formDataResult.id} - ${formDataResult.nombre}`);
        return formDataResult.id;
      }
    } catch (formDataError) {
      console.error(`[obtenerIdProveedor] Error con FormData:`, formDataError);
    }
    
    return null;
  }
}

export default obtenerIdProveedor;
