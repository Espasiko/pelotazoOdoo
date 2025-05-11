/**
 * Índice de parsers para el sistema de importación
 * Este módulo exporta todos los parsers disponibles para diferentes proveedores
 */

import { parserGenericoUniversal } from './generic.js';
import { parseCecotec } from './cecotec.js';
import { parserBSH } from './bsh.js';
import { parserALMCE } from './almce.js';
import { parserJATA } from './jata.js';
import { parserORBEGOZO } from './orbegozo.js';
import { parserBECKENTEGALUXE } from './becken-tegaluxe.js';
import { parserABRILA } from './abrila.js';
import { parserAGUACONFORT } from './aguaconfort.js';
import { parserEASJOHNSON } from './eas-johnson.js';
import { parserUFESA } from './ufesa.js';
import { parserNEVIR } from './nevir.js';
import { parserMIELECTRO } from './mielectro.js';
import { proveedoresNormalizados } from './providers-map.js';

// Exportar parsers individuales
export {
  parserGenericoUniversal,
  parseCecotec,
  parserBSH,
  parserALMCE,
  parserJATA,
  parserORBEGOZO,
  parserBECKENTEGALUXE,
  parserABRILA,
  parserAGUACONFORT,
  parserEASJOHNSON,
  parserUFESA,
  parserNEVIR,
  parserMIELECTRO,
  proveedoresNormalizados
};

// Mapeo de proveedores a sus parsers específicos
export const proveedorParsers = {
  'CECOTEC': parseCecotec,
  'BSH': parserBSH,
  'BOSCH': parserBSH,
  'SIEMENS': parserBSH,
  'NEFF': parserBSH,
  'BALAY': parserBSH,
  'ALMCE': parserALMCE,
  'JATA': parserJATA,
  'ORBEGOZO': parserORBEGOZO,
  'BECKEN': (datos, tipo) => parserBECKENTEGALUXE(datos, tipo, { proveedor: 'BECKEN' }),
  'TEGALUXE': (datos, tipo) => parserBECKENTEGALUXE(datos, tipo, { proveedor: 'TEGALUXE' }),
  'ABRILA': parserABRILA,
  'AGUACONFORT': parserAGUACONFORT,
  'EAS-JOHNSON': parserEASJOHNSON,
  'UFESA': parserUFESA,
  'NEVIR': parserNEVIR,
  'MIELECTRO': parserMIELECTRO,
  'GENERICO': parserGenericoUniversal,
  
  // Proveedores que usan el parser genérico con configuración específica
  'AIRPAL': (datos, tipo) => parserGenericoUniversal(datos, tipo, { proveedor: 'AIRPAL' }),
  'VITROKITCHEN': (datos, tipo) => parserGenericoUniversal(datos, tipo, { proveedor: 'VITROKITCHEN' }),
  'ELECTRODIRECTO': (datos, tipo) => parserGenericoUniversal(datos, tipo, { proveedor: 'ELECTRODIRECTO' }),
  'ALFADYSER': (datos, tipo) => parserGenericoUniversal(datos, tipo, { proveedor: 'ALFADYSER' })
};

// Función para obtener el parser adecuado según el proveedor
export function getParser(proveedor) {
  const proveedorNormalizado = (proveedor || '').toString().toUpperCase();
  const nombreNormalizado = proveedoresNormalizados[proveedorNormalizado] || proveedorNormalizado;
  
  return proveedorParsers[nombreNormalizado] || parserGenericoUniversal;
}

// Exportar por defecto un objeto con todos los parsers
export default {
  parserGenericoUniversal,
  parseCecotec,
  parserBSH,
  parserALMCE,
  parserJATA,
  parserORBEGOZO,
  parserBECKENTEGALUXE,
  parserABRILA,
  parserAGUACONFORT,
  parserEASJOHNSON,
  parserUFESA,
  parserNEVIR,
  parserMIELECTRO,
  getParser,
  proveedorParsers,
  proveedoresNormalizados
};
