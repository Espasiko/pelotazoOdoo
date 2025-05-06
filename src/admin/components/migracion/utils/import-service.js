/**
 * Servicios para la importación de datos
 */

/**
 * Importa datos al servidor
 * @param {File} file - Archivo a importar
 * @param {Object} mappings - Mapeos de campos
 * @param {string} targetResource - Recurso objetivo (clientes, productos, etc.)
 * @returns {Promise<Object>} - Promesa que resuelve a un objeto con el resultado de la importación
 */
export const importData = async (file, mappings, targetResource) => {
  try {
    // Preparar los datos para enviar al servidor
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('proveedor', targetResource);
    formData.append('tipo', 'productos');
    
    // Añadir los mapeos de campos
    formData.append('mappings', JSON.stringify(mappings));
    
    console.log('Enviando datos al servidor de importación...');
    
    // Llamar al endpoint de importación
    const response = await fetch('http://localhost:3100/api/importar', {
      method: 'POST',
      body: formData,
      // No es necesario headers con FormData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en la importación: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Respuesta del servidor:', result);
    
    return {
      success: true,
      totalRecords: result.totalRecords || 0,
      importedRecords: result.registrosImportados || 0,
      errors: result.errores || 0,
      detalles: result.detalles || null
    };
  } catch (error) {
    console.error('Error en la importación:', error);
    return {
      success: false,
      totalRecords: 0,
      importedRecords: 0,
      errors: 0,
      errorMessage: error.message
    };
  }
};

/**
 * Obtiene el historial de importaciones
 * @param {number} page - Número de página
 * @param {number} perPage - Registros por página
 * @returns {Promise<Object>} - Promesa que resuelve a un objeto con el historial de importaciones
 */
export const getImportHistory = async (page = 1, perPage = 10) => {
  try {
    const response = await fetch(`http://localhost:3100/api/importaciones?page=${page}&perPage=${perPage}`);
    
    if (!response.ok) {
      throw new Error(`Error al obtener historial: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al obtener historial de importaciones:', error);
    return {
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: page
    };
  }
};

/**
 * Obtiene los detalles de una importación
 * @param {string} importId - ID de la importación
 * @returns {Promise<Object>} - Promesa que resuelve a un objeto con los detalles de la importación
 */
export const getImportDetails = async (importId) => {
  try {
    const response = await fetch(`http://localhost:3100/api/importaciones/${importId}`);
    
    if (!response.ok) {
      throw new Error(`Error al obtener detalles: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al obtener detalles de importación:', error);
    return null;
  }
};
