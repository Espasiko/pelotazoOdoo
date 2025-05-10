/**
 * Sistema OCR para extraer datos de facturas en PDF
 * Utiliza Tesseract.js para OCR y PDF.js para procesar archivos PDF
 */

const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');
const pdfjsLib = require('pdfjs-dist');
const PocketBase = require('pocketbase/cjs');

// Configuración
const ADMIN_EMAIL = 'admin@elpelotazo.com';
const ADMIN_PASSWORD = 'admin123456';
const PB_URL = 'http://127.0.0.1:8090';
const PDF_DIR = path.join(__dirname, 'facturas_pdf');

// Inicializar PocketBase
const pb = new PocketBase(PB_URL);

// Asegurar que existe el directorio para facturas PDF
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
  console.log(`Directorio creado: ${PDF_DIR}`);
}

/**
 * Procesa un archivo PDF y extrae texto mediante OCR
 * @param {string} pdfPath - Ruta al archivo PDF
 * @returns {Promise<string>} - Texto extraído
 */
async function procesarPDF(pdfPath) {
  try {
    console.log(`Procesando PDF: ${pdfPath}`);
    
    // Cargar el PDF con PDF.js
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    console.log(`PDF cargado: ${pdf.numPages} páginas`);
    
    // Extraer texto de cada página
    let textoCompleto = '';
    
    // Crear worker de Tesseract
    const worker = await createWorker('spa');
    
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Procesando página ${i}/${pdf.numPages}`);
      
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      
      // Crear un canvas para renderizar la página
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Renderizar la página en el canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Obtener la imagen del canvas
      const imageData = canvas.toDataURL('image/png');
      
      // Realizar OCR con Tesseract.js
      const { data: { text } } = await worker.recognize(imageData);
      textoCompleto += text + '\n';
    }
    
    // Liberar recursos
    await worker.terminate();
    
    console.log('Procesamiento OCR completado');
    return textoCompleto;
  } catch (error) {
    console.error('Error al procesar PDF:', error);
    throw error;
  }
}

/**
 * Extrae información relevante del texto OCR
 * @param {string} texto - Texto extraído por OCR
 * @returns {Object} - Datos estructurados de la factura
 */
function extraerDatosFactura(texto) {
  // Implementación básica para extraer datos comunes de facturas
  const datos = {
    numeroFactura: extraerRegex(texto, /Factura[:\s]+(\w+[-/]?\d+)/i) || 
                  extraerRegex(texto, /N[º°]\s*Factura[:\s]+(\w+[-/]?\d+)/i) ||
                  extraerRegex(texto, /Factura\s*N[º°][:\s]+(\w+[-/]?\d+)/i),
    fecha: extraerRegex(texto, /Fecha[:\s]+(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})/i) ||
           extraerRegex(texto, /(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})/) ||
           extraerRegex(texto, /Fecha de emisión[:\s]+(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})/i),
    proveedor: extraerRegex(texto, /Proveedor[:\s]+([^\n\r]+)/i) ||
               extraerRegex(texto, /Emisor[:\s]+([^\n\r]+)/i),
    cif: extraerRegex(texto, /CIF[:\s]+([A-Z0-9-]+)/i) ||
         extraerRegex(texto, /NIF[:\s]+([A-Z0-9-]+)/i),
    importeTotal: extraerRegex(texto, /Total[:\s]+(\d+[.,]\d{2})/i) ||
                 extraerRegex(texto, /Importe total[:\s]+(\d+[.,]\d{2})/i),
    baseImponible: extraerRegex(texto, /Base imponible[:\s]+(\d+[.,]\d{2})/i),
    iva: extraerRegex(texto, /IVA[:\s]+(\d+[.,]\d{2})/i) ||
         extraerRegex(texto, /I\.V\.A\.[:\s]+(\d+[.,]\d{2})/i),
  };
  
  return datos;
}

/**
 * Función auxiliar para extraer datos mediante expresiones regulares
 */
function extraerRegex(texto, regex) {
  const match = texto.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Guarda los datos de la factura en PocketBase
 * @param {Object} datosFactura - Datos estructurados de la factura
 * @returns {Promise<Object>} - Registro creado en PocketBase
 */
async function guardarFactura(datosFactura) {
  try {
    // Autenticar como admin
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    
    // Crear registro de factura
    const record = await pb.collection('facturas_proveedores').create({
      numero: datosFactura.numeroFactura || 'Sin número',
      fecha: datosFactura.fecha || new Date().toISOString().split('T')[0],
      proveedor: datosFactura.proveedor || 'Desconocido',
      cif: datosFactura.cif || '',
      importe_total: parseFloat(datosFactura.importeTotal?.replace(',', '.') || '0'),
      base_imponible: parseFloat(datosFactura.baseImponible?.replace(',', '.') || '0'),
      iva: parseFloat(datosFactura.iva?.replace(',', '.') || '0'),
      procesado_ocr: true,
      datos_originales: JSON.stringify(datosFactura),
    });
    
    console.log(`Factura guardada con ID: ${record.id}`);
    return record;
  } catch (error) {
    console.error('Error al guardar factura:', error);
    throw error;
  }
}

/**
 * Procesa todos los archivos PDF en el directorio
 */
async function procesarTodosLosPDF() {
  try {
    // Obtener lista de archivos PDF
    const archivos = fs.readdirSync(PDF_DIR)
      .filter(file => file.toLowerCase().endsWith('.pdf'));
    
    console.log(`Encontrados ${archivos.length} archivos PDF para procesar`);
    
    for (const archivo of archivos) {
      const rutaCompleta = path.join(PDF_DIR, archivo);
      
      try {
        // Procesar PDF con OCR
        const textoExtraido = await procesarPDF(rutaCompleta);
        
        // Extraer datos estructurados
        const datosFactura = extraerDatosFactura(textoExtraido);
        console.log('Datos extraídos:', datosFactura);
        
        // Guardar en PocketBase
        await guardarFactura(datosFactura);
        
        // Mover archivo a carpeta de procesados
        const procesadosDir = path.join(PDF_DIR, 'procesados');
        if (!fs.existsSync(procesadosDir)) {
          fs.mkdirSync(procesadosDir, { recursive: true });
        }
        
        fs.renameSync(
          rutaCompleta, 
          path.join(procesadosDir, archivo)
        );
        
        console.log(`Archivo ${archivo} procesado y movido`);
      } catch (error) {
        console.error(`Error al procesar ${archivo}:`, error);
      }
    }
    
    console.log('Procesamiento de facturas completado');
  } catch (error) {
    console.error('Error en el procesamiento de facturas:', error);
  }
}

// Exportar funciones para uso en otros módulos
module.exports = {
  procesarPDF,
  extraerDatosFactura,
  guardarFactura,
  procesarTodosLosPDF
};

// Si se ejecuta directamente este script
if (require.main === module) {
  console.log('Iniciando procesamiento de facturas PDF...');
  procesarTodosLosPDF()
    .then(() => console.log('Procesamiento completado'))
    .catch(err => console.error('Error:', err));
}