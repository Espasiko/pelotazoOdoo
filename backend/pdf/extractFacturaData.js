// Función para extraer datos clave de una factura PDF usando pdf-parse
// Uso: llamar a extractFacturaData(bufferPDF) y devuelve un objeto con los campos extraídos

import pdfParse from 'pdf-parse';

/**
 * Extrae datos clave de una factura PDF (número, fechas, importes, cliente, etc.)
 * @param {Buffer} pdfBuffer - El buffer del archivo PDF
 * @returns {Promise<Object>} Objeto con los datos extraídos
 */
async function extractFacturaData(pdfBuffer) {
    const data = await pdfParse(pdfBuffer);
    const text = data.text;

    // Expresiones regulares para campos comunes de factura
    const regexNumero = /Factura[\s\n]*N[úu]mero[:\s\n]*([A-Za-z0-9\-_]+)/i;
    const regexPeriodo = /Periodo de consumo[\s\n]*([0-9]{2}\/[0-9]{2}\/[0-9]{4})\s*-\s*([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i;
    const regexEmision = /Fecha de emisi[óo]n[\s\n]*([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i;
    const regexVencimiento = /Fecha de vencimiento[\s\n]*([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i;
    const regexCliente = /Nombre y Apellidos[\s\n]*([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+)/i;
    const regexNIF = /NIF\/NIE[\s\n]*([A-Za-z0-9]+)/i;
    const regexImporteTotal = /TOTAL FACTURA.*?([0-9]+,[0-9]{2}) ?€?/i;
    const regexBaseImponible = /IMPORTE \(base imponible\).*?([0-9]+,[0-9]{2}) ?€?/i;
    const regexIVA = /IMPUESTOS.*?([0-9]+,[0-9]{2}) ?€?\s*\((\d{1,2}[\.,]\d{1,2})% IVA\)/i;
    const regexFormaPago = /Forma de pago[\s\n]*([A-Za-zñÑ ]+)/i;
    const regexIBAN = /N[ºo] de cuenta[\s\n]*([0-9]{4,})/i;
    
    // Extracción de campos
    const numero = (text.match(regexNumero) || [])[1] || '';
    const periodo = text.match(regexPeriodo);
    const fechaEmision = (text.match(regexEmision) || [])[1] || '';
    const fechaVencimiento = (text.match(regexVencimiento) || [])[1] || '';
    const cliente = (text.match(regexCliente) || [])[1] || '';
    const nif = (text.match(regexNIF) || [])[1] || '';
    const importeTotal = (text.match(regexImporteTotal) || [])[1] || '';
    const baseImponible = (text.match(regexBaseImponible) || [])[1] || '';
    const iva = (text.match(regexIVA) || [])[1] || '';
    const ivaPorcentaje = (text.match(regexIVA) || [])[2] || '';
    const formaPago = (text.match(regexFormaPago) || [])[1] || '';
    const iban = (text.match(regexIBAN) || [])[1] || '';

    return {
        numero,
        periodo: periodo ? { desde: periodo[1], hasta: periodo[2] } : {},
        fechaEmision,
        fechaVencimiento,
        cliente,
        nif,
        importeTotal,
        baseImponible,
        iva,
        ivaPorcentaje,
        formaPago,
        iban,
        textoCompleto: text // Para depuración y mejora futura
    };
}

export default extractFacturaData;
