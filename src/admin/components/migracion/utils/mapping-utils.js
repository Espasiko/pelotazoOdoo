/**
 * Utilidades para mapeo de campos en la importación de datos
 */

/**
 * Inicializa los mapeos de campos con valores vacíos
 * @param {Array} headers - Encabezados del archivo
 * @returns {Object} - Objeto con mapeos inicializados
 */
export const initializeMappings = (headers) => {
  const initialMappings = {};
  headers.forEach(header => {
    initialMappings[header] = '';
  });
  return initialMappings;
};

/**
 * Obtiene las opciones de campos para un tipo de recurso
 * @param {string} resourceType - Tipo de recurso (clientes, productos, etc.)
 * @returns {Array} - Array de objetos con value y label
 */
export const getFieldOptions = (resourceType) => {
  switch (resourceType) {
    case 'clientes':
      return [
        { value: 'nombre', label: 'Nombre' },
        { value: 'apellidos', label: 'Apellidos' },
        { value: 'email', label: 'Email' },
        { value: 'telefono', label: 'Teléfono' },
        { value: 'direccion', label: 'Dirección' },
        { value: 'ciudad', label: 'Ciudad' },
        { value: 'codigo_postal', label: 'Código Postal' },
        { value: 'provincia', label: 'Provincia' },
        { value: 'pais', label: 'País' },
        { value: 'nif', label: 'NIF/CIF' },
        { value: 'empresa', label: 'Empresa' },
        { value: 'notas', label: 'Notas' }
      ];
    case 'productos':
      return [
        { value: 'codigo', label: 'Código' },
        { value: 'nombre', label: 'Nombre' },
        { value: 'descripcion', label: 'Descripción' },
        { value: 'precio', label: 'Precio' },
        { value: 'stock', label: 'Stock' },
        { value: 'categoria', label: 'Categoría' },
        { value: 'marca', label: 'Marca' },
        { value: 'proveedor', label: 'Proveedor' },
        { value: 'ean', label: 'EAN/UPC' },
        { value: 'peso', label: 'Peso' },
        { value: 'dimensiones', label: 'Dimensiones' },
        { value: 'activo', label: 'Activo' }
      ];
    case 'categorias':
      return [
        { value: 'nombre', label: 'Nombre' },
        { value: 'descripcion', label: 'Descripción' },
        { value: 'padre', label: 'Categoría Padre' },
        { value: 'orden', label: 'Orden' },
        { value: 'activo', label: 'Activo' }
      ];
    case 'marcas':
      return [
        { value: 'nombre', label: 'Nombre' },
        { value: 'descripcion', label: 'Descripción' },
        { value: 'logo', label: 'Logo URL' },
        { value: 'web', label: 'Sitio Web' },
        { value: 'activo', label: 'Activo' }
      ];
    default:
      return [];
  }
};

/**
 * Valida los mapeos para asegurar que al menos un campo está mapeado
 * @param {Object} mappings - Objeto con los mapeos
 * @returns {boolean} - true si al menos un campo está mapeado
 */
export const validateMappings = (mappings) => {
  return Object.values(mappings).some(value => value !== '');
};

/**
 * Obtiene los recursos disponibles para importación
 * @returns {Array} - Array de objetos con value y label
 */
export const getAvailableResources = () => {
  return [
    { value: 'clientes', label: 'Clientes' },
    { value: 'productos', label: 'Productos' },
    { value: 'categorias', label: 'Categorías' },
    { value: 'marcas', label: 'Marcas' }
  ];
};
