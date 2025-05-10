/**
 * Módulo para generar IDs de proveedores sin intentar crearlos en PocketBase
 */

/**
 * Genera un ID para un proveedor basado en su nombre
 * No intenta crear el proveedor en PocketBase, solo genera un ID único
 * 
 * @param {string} nombreProveedor - Nombre del proveedor
 * @returns {string} - ID generado para el proveedor
 */
export function generarIdProveedor(nombreProveedor) {
  if (!nombreProveedor) {
    console.log('[generarIdProveedor] No se proporcionó nombre de proveedor, generando ID genérico');
    return `prov_generico_${Date.now()}`;
  }
  
  // Normalizar el nombre del proveedor
  const nombreNormalizado = nombreProveedor.trim().toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '')
    .substring(0, 20); // Limitar longitud
  
  // Generar un ID único basado en el nombre y timestamp
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 10000);
  const idProveedor = `prov_${nombreNormalizado}_${timestamp}_${randomPart}`;
  
  console.log(`[generarIdProveedor] Generado ID para proveedor "${nombreProveedor}": ${idProveedor}`);
  
  // Registrar el proveedor generado para seguimiento
  if (!global.proveedoresGenerados) global.proveedoresGenerados = [];
  global.proveedoresGenerados.push({
    id: idProveedor,
    nombre: nombreProveedor,
    timestamp: new Date().toISOString()
  });
  
  return idProveedor;
}

export default generarIdProveedor;
