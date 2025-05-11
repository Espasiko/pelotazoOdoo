/**
 * Script para actualizar los productos existentes
 * Este script añade el campo nombre_proveedor a todos los productos que ya tienen un proveedor asignado
 */

import { pocketbaseConfig } from './config.js';
import { autenticarAdmin } from './utils.js';
import { fetchAdmin } from './db/client.js';

/**
 * Actualiza los productos existentes para añadir el campo nombre_proveedor
 */
async function actualizarProductos() {
  try {
    console.log('Iniciando actualización de productos...');
    
    // Autenticar como admin
    const token = await autenticarAdmin();
    if (!token) {
      throw new Error('No se pudo autenticar como admin');
    }
    
    // Obtener todos los productos con proveedor asignado
    const productos = await fetchAdmin('/api/collections/productos/records?perPage=500&filter=' + encodeURIComponent('proveedor != null && proveedor != ""'));
    
    console.log(`Encontrados ${productos.items.length} productos con proveedor asignado`);
    
    // Obtener todos los proveedores
    const proveedores = await fetchAdmin('/api/collections/proveedores/records?perPage=500');
    
    // Crear un mapa de ID de proveedor a nombre de proveedor
    const mapaProveedores = {};
    for (const proveedor of proveedores.items) {
      mapaProveedores[proveedor.id] = proveedor.nombre;
    }
    
    // Contador de productos actualizados
    let productosActualizados = 0;
    let productosConError = 0;
    
    // Actualizar cada producto
    for (const producto of productos.items) {
      try {
        // Si el producto ya tiene nombre_proveedor, saltarlo
        if (producto.nombre_proveedor) {
          console.log(`El producto ${producto.codigo} ya tiene nombre_proveedor: ${producto.nombre_proveedor}`);
          continue;
        }
        
        // Obtener el nombre del proveedor
        const nombreProveedor = mapaProveedores[producto.proveedor];
        
        if (!nombreProveedor) {
          console.warn(`No se encontró el nombre del proveedor con ID ${producto.proveedor} para el producto ${producto.codigo}`);
          continue;
        }
        
        // Actualizar el producto
        await fetchAdmin(`/api/collections/productos/records/${producto.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre_proveedor: nombreProveedor
          })
        });
        
        console.log(`Producto ${producto.codigo} actualizado con nombre_proveedor: ${nombreProveedor}`);
        productosActualizados++;
      } catch (error) {
        console.error(`Error al actualizar el producto ${producto.codigo}:`, error);
        productosConError++;
      }
    }
    
    console.log(`Actualización completada. ${productosActualizados} productos actualizados. ${productosConError} productos con error.`);
  } catch (error) {
    console.error('Error al actualizar los productos:', error);
  }
}

// Ejecutar la función principal
actualizarProductos().then(() => {
  console.log('Proceso finalizado');
  process.exit(0);
}).catch(error => {
  console.error('Error en el script:', error);
  process.exit(1);
});
