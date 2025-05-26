# Plan de Desarrollo para El Pelotazo: Integración Odoo-Next.js

## Resumen Ejecutivo

Este documento presenta un plan de desarrollo completo para la integración de Odoo con Next.js para "El Pelotazo", una tienda de electrodomésticos. El plan incluye la implementación de un panel de administración personalizado utilizando Refine y NextUI, un sistema OCR para procesamiento de documentos, integración con TPV y códigos de barras, y un sistema de importación de datos desde archivos Excel/JSON existentes.

## Objetivos del Proyecto

1. Desarrollar un panel de administración personalizado y fácil de usar para la dueña del negocio
2. Implementar un sistema OCR para procesamiento de facturas y albaranes
3. Integrar con sistemas de TPV y lectores de códigos de barras
4. Importar datos de proveedores y productos desde archivos existentes
5. Mantener Odoo como backend robusto mientras se ofrece una experiencia de usuario moderna

## Stack Tecnológico y Versiones

### Backend (Odoo)
- **Odoo**: Versión 18.0 Community Edition
- **Python**: Versión 3.10+ (compatible con Odoo 18)
- **PostgreSQL**: Versión 14+ (recomendada para Odoo 18)
- **Módulo REST API**: `rest_api_odoo` v18.0

### Frontend (Next.js)
- **Next.js**: Versión 14.0.4
- **React**: Versión 18.2+
- **Node.js**: Versión 18.17+ (LTS)
- **TypeScript**: Versión 5.1+
- **Refine**: Versión 4.0+ (para el panel de administración)
- **NextUI**: Versión 2.0+ (para componentes de UI)

### Herramientas de Integración
- **Axios**: Versión 1.6+ (para llamadas HTTP)
- **React Query**: Versión 5.0+ (para gestión de estado y caché)
- **JWT**: Para autenticación segura

### Herramientas OCR y Procesamiento de Imágenes
- **Tesseract OCR**: Versión 5.3+ con pytesseract 0.3.10+
- **OpenCV**: Versión 4.8+ con python-opencv
- **Hugging Face Transformers**: Para modelos OCR avanzados

### Integración con TPV y Códigos de Barras
- **pyzbar**: Versión 0.1.9+ (para lectura de códigos de barras)
- **python-barcode**: Versión 0.14+ (para generación de códigos de barras)

### Procesamiento de Datos
- **pandas**: Versión 2.1+ (para importación de datos)
- **openpyxl**: Versión 3.1+ (para manejo de archivos Excel)

## Plan de Desarrollo Actualizado

### Fase 1: Configuración del Entorno (2 semanas)

#### Semana 1: Configuración de Odoo
- Instalación y configuración de Odoo 18
- Configuración de PostgreSQL
- Instalación del módulo REST API para Odoo
- Configuración de la autenticación con API keys

#### Semana 2: Configuración del Frontend
- Configuración del proyecto Next.js 14
- Instalación y configuración de Refine y NextUI
- Configuración de TypeScript y ESLint
- Implementación de la estructura base del proyecto

### Fase 2: Normalización e Importación de Datos (3 semanas)

#### Semana 3: Análisis y Preparación de Datos
- Análisis de la estructura de los archivos JSON/Excel existentes
- Diseño del esquema de mapeo para la importación
- Desarrollo de scripts para normalizar los datos

#### Semana 4-5: Implementación de la Importación
- Desarrollo de scripts Python con pandas para procesar los archivos
- Implementación de la biblioteca odoo_csv_import para la carga masiva
- Creación de una interfaz en el panel de administración para gestionar importaciones
- Pruebas con datos reales y validación

### Fase 3: Desarrollo del Panel de Administración con Refine (4 semanas)

#### Semana 6: Configuración de Refine y Autenticación
- Configuración del proveedor de datos para Odoo en Refine
- Implementación del sistema de autenticación con JWT
- Desarrollo de la estructura base del panel de administración

#### Semana 7-8: Implementación de Módulos Principales
- Desarrollo del dashboard con KPIs (ventas, beneficios, inventario)
- Implementación de la gestión de productos con filtros por proveedor
- Desarrollo de la gestión de proveedores
- Implementación de visualizaciones y gráficos

#### Semana 9: Personalización y Optimización
- Personalización de la interfaz según las necesidades de la dueña
- Optimización del rendimiento y experiencia de usuario
- Implementación de funcionalidades adicionales solicitadas

### Fase 4: Integración de OCR y Sistemas Externos (4 semanas)

#### Semana 10-11: Sistema OCR
- Desarrollo del servicio OCR con Tesseract y OpenCV
- Integración con modelos de Hugging Face para casos complejos
- Implementación de la API para el servicio OCR
- Integración con el panel de administración

#### Semana 12-13: Integración con TPV y Verifactu
- Desarrollo del módulo para integración con TPV
- Implementación de la lectura de códigos de barras
- Integración con Verifactu para facturación electrónica
- Pruebas de integración completa

### Fase 5: Tienda Dinámica y Funcionalidades Avanzadas (3 semanas)

#### Semana 14-15: Tienda Dinámica
- Desarrollo de componentes para la tienda online
- Integración con el catálogo de productos de Odoo
- Implementación de filtros y búsqueda para clientes
- Pruebas de rendimiento y usabilidad

#### Semana 16: Funcionalidades Avanzadas
- Implementación de búsqueda semántica de productos
- Desarrollo de recomendaciones personalizadas
- Integración con sistemas de notificaciones
- Optimización para dispositivos móviles

### Fase 6: Pruebas y Despliegue (2 semanas)

#### Semana 17: Pruebas Integrales
- Pruebas de integración de todos los componentes
- Pruebas de rendimiento y optimización
- Corrección de errores y ajustes finales

#### Semana 18: Despliegue y Documentación
- Despliegue en entorno de producción
- Documentación técnica del sistema
- Capacitación para usuarios finales
- Entrega final del proyecto

## Detalles de Implementación

### 1. Importación de Datos desde JSON/Excel

La estructura de los datos existentes en los archivos JSON muestra información de productos con campos como código, descripción, unidades, precios, descuentos, márgenes, etc. Para importar estos datos a Odoo, utilizaremos el siguiente enfoque:

```python
import pandas as pd
import os
import json
from odoo_csv_import import import_threaded as odoo_import

def process_json_files(json_dir):
    products_data = []
    
    for file in os.listdir(json_dir):
        if file.endswith('.json'):
            with open(os.path.join(json_dir, file), 'r') as f:
                data = json.load(f)
                
                # Extraer nombre del proveedor del nombre del archivo
                provider_name = file.split('_')[0].replace('PVP ', '')
                
                for item in data:
                    if isinstance(item, dict) and '__EMPTY' in item:
                        product = {
                            'name': item.get('__EMPTY', ''),
                            'default_code': item.get('ABRILA' if 'ABRILA' in item else '__EMPTY_1', ''),
                            'list_price': item.get('__EMPTY_7', 0),
                            'standard_price': item.get('__EMPTY_2', 0),
                            'x_nombre_proveedor': provider_name,
                            'x_dto': item.get('__EMPTY_3', 0),
                            'x_pvp_web': item.get('__EMPTY_6', 0),
                            'x_precio_margen': item.get('__EMPTY_5', 0),
                            'x_beneficio_unitario': item.get('__EMPTY_9', 0),
                            'x_vendidas': item.get('__EMPTY_12', 0)
                        }
                        products_data.append(product)
    
    # Convertir a DataFrame y exportar a CSV
    df = pd.DataFrame(products_data)
    df.to_csv('products_for_odoo.csv', index=False)
    
    return 'products_for_odoo.csv'
```

### 2. Panel de Administración con Refine y NextUI

Refine proporciona una forma eficiente de crear paneles de administración con Next.js. A continuación se muestra un ejemplo de configuración para integrar Refine con la API de Odoo:

```typescript
// src/App.tsx
import { Refine } from "@refinedev/core";
import { DataProvider } from "@refinedev/core";
import axios from "axios";
import { NextUIProvider } from "@nextui-org/react";

// Componentes
import { ProductList, ProductCreate, ProductEdit, ProductShow } from "./pages/products";
import { ProviderList, ProviderCreate, ProviderEdit, ProviderShow } from "./pages/providers";
import { Dashboard } from "./pages/dashboard";

// Crear un proveedor de datos personalizado para Odoo
const odooDataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_ODOO_API_URL}/send_request?model=${resource}`,
      {
        headers: {
          "api-key": process.env.ODOO_API_KEY,
        },
      }
    );
    
    return {
      data: response.data.data,
      total: response.data.total,
    };
  },
  // Implementar otros métodos (getOne, create, update, delete, etc.)
};

const App = () => {
  return (
    <NextUIProvider>
      <Refine
        dataProvider={odooDataProvider}
        resources={[
          {
            name: "product.template",
            list: ProductList,
            create: ProductCreate,
            edit: ProductEdit,
            show: ProductShow,
            meta: {
              label: "Productos",
              icon: ProductIcon,
            },
          },
          {
            name: "res.partner",
            list: ProviderList,
            create: ProviderCreate,
            edit: ProviderEdit,
            show: ProviderShow,
            meta: {
              label: "Proveedores",
              icon: ProviderIcon,
            },
          },
        ]}
        dashboard={Dashboard}
      >
        {/* Componentes de la aplicación */}
      </Refine>
    </NextUIProvider>
  );
};
```

### 3. Sistema OCR para Procesamiento de Documentos

Para el sistema OCR, utilizaremos Tesseract con Python y modelos de Hugging Face para casos más complejos:

```python
import pytesseract
import cv2
import numpy as np
from PIL import Image
import requests
import json
from transformers import TrOCRProcessor, VisionEncoderDecoderModel

def process_image_basic(image_path):
    # Cargar imagen
    img = cv2.imread(image_path)
    
    # Preprocesamiento de la imagen
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    
    # OCR con Tesseract
    text = pytesseract.image_to_string(thresh, lang='spa')
    
    return text

def process_image_advanced(image_path):
    # Cargar modelo de Hugging Face para OCR avanzado
    processor = TrOCRProcessor.from_pretrained('microsoft/trocr-base-handwritten')
    model = VisionEncoderDecoderModel.from_pretrained('microsoft/trocr-base-handwritten')
    
    # Cargar y procesar imagen
    image = Image.open(image_path).convert("RGB")
    pixel_values = processor(image, return_tensors="pt").pixel_values
    
    # Generar texto
    generated_ids = model.generate(pixel_values)
    generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
    
    return generated_text
```

### 4. Integración con TPV y Códigos de Barras

```python
from pyzbar.pyzbar import decode
import cv2
import barcode
from barcode.writer import ImageWriter

def read_barcode(image_path):
    # Leer imagen
    img = cv2.imread(image_path)
    
    # Decodificar códigos de barras
    barcodes = decode(img)
    
    results = []
    for barcode_data in barcodes:
        # Extraer datos y tipo
        barcode_text = barcode_data.data.decode('utf-8')
        barcode_type = barcode_data.type
        
        results.append({
            'text': barcode_text,
            'type': barcode_type
        })
    
    return results

def generate_barcode(code, output_path, barcode_type='ean13'):
    # Crear código de barras
    EAN = getattr(barcode, barcode_type.upper())
    my_code = EAN(code, writer=ImageWriter())
    
    # Guardar como imagen
    my_code.save(output_path)
    
    return output_path
```

## Conclusión

Este plan de desarrollo proporciona una hoja de ruta clara para la implementación del proyecto "El Pelotazo", integrando Odoo con Next.js y utilizando Refine para crear un panel de administración moderno y fácil de usar. La combinación de estas tecnologías permitirá desarrollar una solución completa que satisfaga todas las necesidades del negocio, desde la gestión de productos y proveedores hasta el procesamiento de documentos con OCR y la integración con sistemas de TPV y códigos de barras.

El enfoque híbrido propuesto aprovecha lo mejor de ambos mundos: la robustez y funcionalidad de Odoo como backend, y la flexibilidad y experiencia de usuario moderna de Next.js con Refine como frontend. Esto proporcionará a la dueña del negocio una herramienta potente y fácil de usar para gestionar su tienda de electrodomésticos de manera eficiente.
