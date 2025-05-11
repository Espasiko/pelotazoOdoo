/**
 * Utilidades comunes para el sistema de importación
 */

/**
 * Limpia y normaliza un valor de precio
 * @param {string|number} precio - Precio a limpiar
 * @returns {number} - Precio normalizado
 */
export function limpiarPrecio(precio) {
  if (!precio) return 0;
  
  // Si es un número, devolverlo directamente
  if (typeof precio === 'number') return precio;
  
  // Si es string, limpiarlo
  let precioLimpio = precio.toString()
    .replace(/[^\d.,]/g, '') // Eliminar todo excepto números, puntos y comas
    .replace(/,/g, '.'); // Reemplazar comas por puntos
  
  // Si hay múltiples puntos, dejar solo el último
  const puntos = precioLimpio.split('.');
  if (puntos.length > 2) {
    precioLimpio = puntos.slice(0, -1).join('') + '.' + puntos.slice(-1);
  }
  
  const precioNumerico = parseFloat(precioLimpio);
  return isNaN(precioNumerico) ? 0 : precioNumerico;
}

/**
 * Normaliza un valor booleano
 * @param {any} valor - Valor a normalizar
 * @returns {boolean} - Valor normalizado
 */
export function normalizarBooleano(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'string') {
    const valorLimpio = valor.toLowerCase().trim();
    return ['true', 'si', 'sí', '1', 'yes', 'y'].includes(valorLimpio);
  }
  if (typeof valor === 'number') return valor !== 0;
  return false;
}

/**
 * Normaliza un valor de texto
 * @param {any} valor - Valor a normalizar
 * @returns {string} - Valor normalizado
 */
export function normalizarTexto(valor) {
  if (!valor) return '';
  return valor.toString().trim();
}

/**
 * Normaliza un valor numérico
 * @param {any} valor - Valor a normalizar
 * @returns {number} - Valor normalizado
 */
export function normalizarNumero(valor) {
  if (typeof valor === 'number') return valor;
  if (!valor) return 0;
  
  const numeroLimpio = valor.toString()
    .replace(/[^\d.,\-]/g, '')
    .replace(/,/g, '.');
  
  const numeroNormalizado = parseFloat(numeroLimpio);
  return isNaN(numeroNormalizado) ? 0 : numeroNormalizado;
}

/**
 * Normaliza un valor de fecha
 * @param {any} valor - Valor a normalizar
 * @returns {string} - Valor normalizado en formato ISO
 */
export function normalizarFecha(valor) {
  if (!valor) return new Date().toISOString();
  
  try {
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) {
      return new Date().toISOString();
    }
    return fecha.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}
