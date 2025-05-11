/**
 * Módulo de validación de datos para el sistema de importación
 * Este módulo proporciona funciones para validar, limpiar y normalizar datos
 * antes de su importación a PocketBase
 */

/**
 * Valida un producto y devuelve el resultado de la validación
 * @param {Object} product - Producto a validar
 * @returns {Object} - Resultado de la validación con isValid, errors y product normalizado
 */
export function validateProduct(product) {
  const errors = [];
  
  // Validar campos requeridos
  if (!product.codigo) errors.push('El código del producto es obligatorio');
  if (!product.nombre) errors.push('El nombre del producto es obligatorio');
  
  // Validar formato y valores
  if (product.precio_venta !== undefined) {
    if (isNaN(parseFloat(product.precio_venta))) {
      errors.push('El precio de venta debe ser un número');
    } else if (parseFloat(product.precio_venta) < 0) {
      errors.push('El precio de venta no puede ser negativo');
    }
  }
  
  if (product.precio_compra !== undefined) {
    if (isNaN(parseFloat(product.precio_compra))) {
      errors.push('El precio de compra debe ser un número');
    } else if (parseFloat(product.precio_compra) < 0) {
      errors.push('El precio de compra no puede ser negativo');
    }
  }
  
  if (product.stock_actual !== undefined) {
    if (isNaN(parseInt(product.stock_actual))) {
      errors.push('El stock debe ser un número');
    } else if (parseInt(product.stock_actual) < 0) {
      errors.push('El stock no puede ser negativo');
    }
  }
  
  if (product.iva !== undefined) {
    if (isNaN(parseFloat(product.iva))) {
      errors.push('El IVA debe ser un número');
    } else {
      const iva = parseFloat(product.iva);
      if (![0, 4, 10, 21].includes(iva)) {
        errors.push('El IVA debe ser uno de los valores permitidos: 0%, 4%, 10%, 21%');
      }
    }
  }
  
  if (product.descuento !== undefined && product.descuento !== null) {
    if (isNaN(parseFloat(product.descuento))) {
      errors.push('El descuento debe ser un número');
    } else if (parseFloat(product.descuento) < 0 || parseFloat(product.descuento) > 100) {
      errors.push('El descuento debe estar entre 0 y 100%');
    }
  }
  
  // Validar coherencia
  if (product.precio_compra && product.precio_venta) {
    const precioCompra = parseFloat(product.precio_compra);
    const precioVenta = parseFloat(product.precio_venta);
    
    if (precioCompra > precioVenta) {
      errors.push('El precio de compra no debería ser mayor que el precio de venta');
    }
    
    // Calcular margen y verificar si es razonable
    const margen = ((precioVenta - precioCompra) / precioCompra) * 100;
    if (margen < 0) {
      errors.push('El margen de beneficio es negativo');
    } else if (margen > 500) {
      errors.push('El margen de beneficio es sospechosamente alto (>500%)');
    }
  }
  
  // Validar formato de código de barras (si existe)
  if (product.codigo_barras) {
    const codigoBarras = String(product.codigo_barras).replace(/\D/g, '');
    if (codigoBarras.length !== 8 && codigoBarras.length !== 13) {
      errors.push('El código de barras debe tener 8 o 13 dígitos');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    product: cleanProduct(product)
  };
}

/**
 * Limpia y normaliza los datos de un producto
 * @param {Object} product - Producto a limpiar
 * @returns {Object} - Producto limpio y normalizado
 */
function cleanProduct(product) {
  const cleanedProduct = { ...product };
  
  // Normalizar strings
  if (cleanedProduct.codigo) cleanedProduct.codigo = String(cleanedProduct.codigo).trim();
  if (cleanedProduct.nombre) cleanedProduct.nombre = String(cleanedProduct.nombre).trim();
  if (cleanedProduct.descripcion) {
    cleanedProduct.descripcion = String(cleanedProduct.descripcion || '').trim();
  }
  
  // Normalizar código de barras
  if (cleanedProduct.codigo_barras) {
    cleanedProduct.codigo_barras = String(cleanedProduct.codigo_barras).replace(/\D/g, '');
  }
  
  // Normalizar números
  if (cleanedProduct.precio_venta !== undefined) {
    cleanedProduct.precio_venta = parseFloat(parseFloat(cleanedProduct.precio_venta).toFixed(2));
  }
  
  if (cleanedProduct.precio_compra !== undefined) {
    cleanedProduct.precio_compra = parseFloat(parseFloat(cleanedProduct.precio_compra).toFixed(2));
  }
  
  if (cleanedProduct.stock_actual !== undefined) {
    cleanedProduct.stock_actual = parseInt(cleanedProduct.stock_actual);
  }
  
  if (cleanedProduct.stock_minimo !== undefined) {
    cleanedProduct.stock_minimo = parseInt(cleanedProduct.stock_minimo || 0);
  }
  
  if (cleanedProduct.iva !== undefined) {
    const iva = parseFloat(cleanedProduct.iva);
    // Normalizar a valores de IVA válidos
    if (iva <= 0) cleanedProduct.iva = 0;
    else if (iva <= 4) cleanedProduct.iva = 4;
    else if (iva <= 10) cleanedProduct.iva = 10;
    else cleanedProduct.iva = 21;
  } else {
    cleanedProduct.iva = 21; // Valor por defecto
  }
  
  if (cleanedProduct.descuento !== undefined && cleanedProduct.descuento !== null) {
    let descuento = parseFloat(cleanedProduct.descuento);
    if (isNaN(descuento)) descuento = 0;
    // Limitar descuento entre 0 y 100
    cleanedProduct.descuento = Math.max(0, Math.min(100, descuento));
  }
  
  // Establecer valores por defecto para campos obligatorios que faltan
  if (cleanedProduct.activo === undefined) cleanedProduct.activo = true;
  if (cleanedProduct.visible_online === undefined) cleanedProduct.visible_online = true;
  if (cleanedProduct.reservable === undefined) cleanedProduct.reservable = true;
  
  // Calcular campos derivados si es posible
  if (cleanedProduct.precio_compra && cleanedProduct.precio_venta) {
    // Calcular beneficio unitario
    cleanedProduct.beneficio_unitario = parseFloat((cleanedProduct.precio_venta - cleanedProduct.precio_compra).toFixed(2));
    
    // Calcular margen
    const margen = ((cleanedProduct.precio_venta - cleanedProduct.precio_compra) / cleanedProduct.precio_compra) * 100;
    cleanedProduct.margen = parseFloat(margen.toFixed(2));
    
    // Calcular beneficio total si hay stock
    if (cleanedProduct.stock_actual) {
      cleanedProduct.beneficio_total = parseFloat((cleanedProduct.beneficio_unitario * cleanedProduct.stock_actual).toFixed(2));
    }
  }
  
  return cleanedProduct;
}

/**
 * Valida un proveedor y devuelve el resultado de la validación
 * @param {Object} provider - Proveedor a validar
 * @returns {Object} - Resultado de la validación con isValid, errors y provider normalizado
 */
export function validateProvider(provider) {
  const errors = [];
  
  // Validar campos requeridos
  if (!provider.nombre) errors.push('El nombre del proveedor es obligatorio');
  
  // Validar formato de email si existe
  if (provider.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(provider.email)) {
      errors.push('El formato del email no es válido');
    }
  }
  
  // Validar formato de teléfono si existe
  if (provider.telefono) {
    const telefonoLimpio = String(provider.telefono).replace(/\D/g, '');
    if (telefonoLimpio.length < 9) {
      errors.push('El número de teléfono debe tener al menos 9 dígitos');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    provider: cleanProvider(provider)
  };
}

/**
 * Limpia y normaliza los datos de un proveedor
 * @param {Object} provider - Proveedor a limpiar
 * @returns {Object} - Proveedor limpio y normalizado
 */
function cleanProvider(provider) {
  const cleanedProvider = { ...provider };
  
  // Normalizar strings
  if (cleanedProvider.nombre) cleanedProvider.nombre = String(cleanedProvider.nombre).trim();
  if (cleanedProvider.descripcion) cleanedProvider.descripcion = String(cleanedProvider.descripcion || '').trim();
  if (cleanedProvider.email) cleanedProvider.email = String(cleanedProvider.email).trim().toLowerCase();
  
  // Normalizar teléfono
  if (cleanedProvider.telefono) {
    cleanedProvider.telefono = String(cleanedProvider.telefono).replace(/\D/g, '');
    // Asegurar formato español
    if (cleanedProvider.telefono.length === 9) {
      cleanedProvider.telefono = cleanedProvider.telefono.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    }
  }
  
  // Establecer valores por defecto
  if (cleanedProvider.activo === undefined) cleanedProvider.activo = true;
  
  return cleanedProvider;
}

/**
 * Valida una categoría y devuelve el resultado de la validación
 * @param {Object} category - Categoría a validar
 * @returns {Object} - Resultado de la validación con isValid, errors y category normalizada
 */
export function validateCategory(category) {
  const errors = [];
  
  // Validar campos requeridos
  if (!category.nombre) errors.push('El nombre de la categoría es obligatorio');
  
  return {
    isValid: errors.length === 0,
    errors,
    category: cleanCategory(category)
  };
}

/**
 * Limpia y normaliza los datos de una categoría
 * @param {Object} category - Categoría a limpiar
 * @returns {Object} - Categoría limpia y normalizada
 */
function cleanCategory(category) {
  const cleanedCategory = { ...category };
  
  // Normalizar strings
  if (cleanedCategory.nombre) {
    cleanedCategory.nombre = String(cleanedCategory.nombre).trim();
    // Capitalizar primera letra
    cleanedCategory.nombre = cleanedCategory.nombre.charAt(0).toUpperCase() + cleanedCategory.nombre.slice(1);
  }
  
  if (cleanedCategory.descripcion) {
    cleanedCategory.descripcion = String(cleanedCategory.descripcion || '').trim();
  }
  
  // Establecer valores por defecto
  if (cleanedCategory.activo === undefined) cleanedCategory.activo = true;
  if (cleanedCategory.visible_online === undefined) cleanedCategory.visible_online = true;
  
  return cleanedCategory;
}

export default {
  validateProduct,
  validateProvider,
  validateCategory
};
