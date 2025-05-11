# Sistema de Importación - El Pelotazo

Este módulo gestiona la importación de datos desde diferentes formatos y proveedores para la aplicación El Pelotazo.

## Estructura del Proyecto

La estructura del proyecto ha sido refactorizada para mejorar la organización y mantenibilidad:

```
importacion/
├── core/                  # Lógica principal de importación
│   ├── data-validator.js   # Validación de datos
│   ├── db-importer.js     # Importación a base de datos
│   ├── file-processor.js  # Procesamiento de archivos
│   ├── import-controller.js # Controlador de importación
│   └── index.js           # Índice del módulo core
├── db/                    # Interacción con la base de datos
│   ├── categories.js      # Gestión de categorías
│   ├── client.js          # Cliente PocketBase
│   ├── imports.js         # Gestión de importaciones
│   ├── index.js           # Índice del módulo db
│   ├── products.js        # Gestión de productos
│   └── providers.js       # Gestión de proveedores
├── parsers/               # Parsers para diferentes proveedores
│   ├── almce.js           # Parser específico para ALMCE
│   ├── becken-tegaluxe.js # Parser específico para BECKEN y TEGALUXE
│   ├── bsh.js             # Parser específico para BSH (BOSCH, SIEMENS, NEFF, BALAY)
│   ├── cecotec.js         # Parser específico para Cecotec
│   ├── generic.js         # Parser genérico universal
│   ├── index.js           # Índice del módulo parsers
│   ├── jata.js            # Parser específico para JATA
│   ├── orbegozo.js        # Parser específico para ORBEGOZO
│   └── providers-map.js   # Mapa de normalización de proveedores
├── scripts/               # Scripts de actualización
│   ├── actualizar-productos.js    # Actualización de productos
│   ├── actualizar-schema.js       # Actualización del esquema
│   ├── actualizar-sistema.js      # Script principal de actualización
│   └── inicializar-proveedores.js # Inicialización de proveedores
├── categorias.js          # Utilidades para categorías
├── config.js              # Configuración del sistema
├── file-readers.js        # Lectores de archivos
├── index.js               # Índice principal del sistema
├── parsers.js             # Archivo original de parsers (legacy)
├── server-restaurado.js   # Servidor de importación
└── utils.js               # Utilidades generales
```

## Módulos Principales

### Core

El módulo `core` contiene la lógica principal de importación:

- `data-validator.js`: Valida y normaliza datos antes de su importación.
- `file-processor.js`: Procesa archivos de diferentes formatos.
- `db-importer.js`: Importa datos procesados a la base de datos.
- `import-controller.js`: Coordina el proceso completo de importación.

### DB

El módulo `db` gestiona la interacción con PocketBase:

- `client.js`: Cliente para hacer peticiones a PocketBase.
- `providers.js`: Gestión de proveedores.
- `products.js`: Gestión de productos.
- `categories.js`: Gestión de categorías.
- `imports.js`: Gestión de importaciones.

### Parsers

El módulo `parsers` contiene los parsers para diferentes proveedores:

- `generic.js`: Parser genérico universal para cualquier formato de datos.
- `almce.js`: Parser específico para ALMCE, optimizado para su formato particular.
- `becken-tegaluxe.js`: Parser específico para BECKEN y TEGALUXE, con soporte para ambas marcas.
- `bsh.js`: Parser específico para BSH (BOSCH, SIEMENS, NEFF, BALAY).
- `cecotec.js`: Parser específico para Cecotec.
- `jata.js`: Parser específico para JATA, con detección automática de categorías.
- `orbegozo.js`: Parser específico para ORBEGOZO, con mapeo inteligente de columnas.
- `providers-map.js`: Mapa de normalización de nombres de proveedores.

#### Sistema de Parsers

El sistema de parsers está diseñado para procesar datos de diferentes proveedores con formatos variados. Cada parser implementa una lógica específica para extraer y normalizar la información según las particularidades del proveedor.

##### Características Principales

- **Detección automática de columnas**: Los parsers identifican automáticamente las columnas relevantes en los datos.
- **Extracción de categorías**: Detectan y extraen categorías de productos para su clasificación.
- **Normalización de datos**: Convierten los datos a un formato estándar compatible con el esquema de PocketBase.
- **Manejo de casos especiales**: Tratan casos particulares como filas de encabezado, categorías o datos incompletos.
- **Asignación de proveedor**: Asignan automáticamente el nombre del proveedor a cada producto.

##### Cómo Añadir un Nuevo Parser

1. **Crear el archivo del parser**: Crea un nuevo archivo en el directorio `parsers/` con el nombre del proveedor (ej: `nuevoProveedor.js`).

2. **Implementar la función del parser**: Sigue esta estructura básica:

```javascript
import { limpiarPrecio } from '../utils.js';

export function parserNUEVOPROVEEDOR(datos, tipo, config = {}) {
  console.log(`[parserNUEVOPROVEEDOR] Procesando ${datos.length} filas de datos`);
  
  // Detectar columnas
  const colMappings = {
    codigo: 'REFERENCIA',  // Ajustar según el formato del proveedor
    nombre: 'DESCRIPCION',
    precio_compra: 'COSTE',
    pvp: 'PVP',
    stock: 'STOCK'
  };
  
  // Procesar datos
  const productos = [];
  const categoriasDetectadas = [];
  
  // ... Lógica de procesamiento ...
  
  return {
    productos: productos,
    categorias: categoriasDetectadas
  };
}
```

3. **Actualizar el archivo index.js**: Importa y exporta el nuevo parser en `parsers/index.js`.

4. **Actualizar el mapeo de proveedores**: Añade el nuevo proveedor al objeto `proveedorParsers` en `parsers/index.js`.

5. **Crear pruebas unitarias**: Implementa pruebas para el nuevo parser en `tests/test-nuevoProveedor.js`.

6. **Actualizar run-all-tests.js**: Añade el nuevo archivo de pruebas a la lista en `tests/run-all-tests.js`.

##### Ejemplo de Uso

```javascript
import { getParser } from './parsers/index.js';

// Obtener el parser adecuado para el proveedor
const parser = getParser('NOMBRE_PROVEEDOR');

// Procesar los datos
const resultado = parser(datos, 'excel');

// Usar los productos procesados
console.log(`Productos procesados: ${resultado.productos.length}`);
console.log(`Categorías detectadas: ${resultado.categorias.length}`);
```

## Sistema de Validación de Datos

El sistema incluye un robusto mecanismo de validación de datos para garantizar la calidad e integridad de la información importada:

### Tipos de Validación

1. **Validación de formato**: Verifica que los datos tengan el formato correcto (códigos, precios, fechas, URLs).
2. **Validación de valores**: Comprueba que los valores estén dentro de rangos aceptables (precios positivos, stock no negativo, IVA válido).
3. **Validación de relaciones**: Asegura que las relaciones entre entidades sean válidas (productos-proveedores, productos-categorías).
4. **Validación de integridad**: Detecta y resuelve datos duplicados o contradictorios.

### Funcionalidades

- **Detección de errores**: Identifica y clasifica errores en críticos y no críticos.
- **Normalización automática**: Corrige formatos, ajusta valores fuera de rango y establece valores por defecto.
- **Registro detallado**: Proporciona información detallada sobre errores para facilitar su corrección.
- **Validación de entidades**: Valida productos, proveedores y categorías de forma independiente.

### Uso del Validador

```javascript
import { validateProduct } from './core/data-validator.js';

const producto = {
  codigo: 'PROD001',
  nombre: 'Televisor LED 55"',
  precio_venta: 499.99,
  precio_compra: 350.00
};

const resultado = validateProduct(producto);

if (resultado.isValid) {
  console.log('Producto válido:', resultado.product);
} else {
  console.log('Errores de validación:', resultado.errors);
  // Usar el producto normalizado a pesar de los errores
  console.log('Producto normalizado:', resultado.product);
}
```

## Uso General

Para importar datos desde un archivo:

```javascript
import { importarDatos } from './importacion/index.js';

// Importar datos desde un archivo
const resultado = await importarDatos('/ruta/al/archivo.csv', 'NOMBRE_PROVEEDOR');
console.log(`Importación completada: ${resultado.creados} creados, ${resultado.actualizados} actualizados`);
```

Para usar el servidor de importación:

```bash
node server-restaurado.js
```

## Scripts de Actualización

Los scripts de actualización se encuentran en el directorio `scripts`:

- `actualizar-schema.js`: Actualiza el esquema de la base de datos.
- `actualizar-productos.js`: Actualiza los productos existentes.
- `inicializar-proveedores.js`: Inicializa los proveedores.
- `actualizar-sistema.js`: Script principal que ejecuta todos los anteriores.

Para ejecutar todos los scripts de actualización:

```bash
node scripts/actualizar-sistema.js
```
