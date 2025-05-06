/**
 * Utilidades para parsear archivos CSV y Excel
 */

/**
 * Parsea un archivo CSV y extrae los encabezados y datos
 * @param {string} csvText - Contenido del archivo CSV
 * @returns {Object} - Objeto con headers y data
 */
export const parseCSV = (csvText) => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    
    const values = lines[i].split(',');
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    
    data.push(row);
  }
  
  return { headers, data };
};

/**
 * Parsea un archivo Excel (simulado)
 * En una implementación real, usaríamos una biblioteca como xlsx
 * @param {ArrayBuffer} excelData - Datos del archivo Excel
 * @returns {Object} - Objeto con headers y data
 */
export const parseExcel = (excelData) => {
  // En una implementación real, usaríamos una biblioteca como xlsx
  // Aquí simulamos datos de ejemplo
  const headers = ['Nombre', 'Apellidos', 'Email', 'Teléfono', 'Dirección'];
  
  const data = [
    {
      'Nombre': 'Juan',
      'Apellidos': 'Pérez',
      'Email': 'juan@example.com',
      'Teléfono': '612345678',
      'Dirección': 'Calle Principal 123'
    },
    {
      'Nombre': 'María',
      'Apellidos': 'López',
      'Email': 'maria@example.com',
      'Teléfono': '698765432',
      'Dirección': 'Avenida Central 45'
    },
    {
      'Nombre': 'Carlos',
      'Apellidos': 'Rodríguez',
      'Email': 'carlos@example.com',
      'Teléfono': '634567890',
      'Dirección': 'Plaza Mayor 8'
    },
    {
      'Nombre': 'Ana',
      'Apellidos': 'Martínez',
      'Email': 'ana@example.com',
      'Teléfono': '678901234',
      'Dirección': 'Calle Secundaria 56'
    },
    {
      'Nombre': 'Pedro',
      'Apellidos': 'Sánchez',
      'Email': 'pedro@example.com',
      'Teléfono': '645678901',
      'Dirección': 'Avenida Principal 23'
    }
  ];
  
  return { headers, data };
};

/**
 * Determina el tipo de archivo y lo parsea
 * @param {File} file - Archivo a parsear
 * @param {string} content - Contenido del archivo
 * @returns {Promise<Object>} - Promesa que resuelve a un objeto con headers y data
 */
export const parseFile = (file, content) => {
  if (file.name.endsWith('.csv')) {
    return parseCSV(content);
  } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    return parseExcel(content);
  } else {
    throw new Error('Formato de archivo no soportado');
  }
};

/**
 * Lee un archivo y lo parsea
 * @param {File} file - Archivo a leer y parsear
 * @returns {Promise<Object>} - Promesa que resuelve a un objeto con headers y data
 */
export const readAndParseFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = parseFile(file, e.target.result);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // En una implementación real, leeríamos el archivo como ArrayBuffer
      // reader.readAsArrayBuffer(file);
      // Pero como estamos simulando, simplemente llamamos a onload
      reader.onload({ target: { result: null } });
    } else {
      reject(new Error('Formato de archivo no soportado'));
    }
  });
};
