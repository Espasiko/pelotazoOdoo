import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  TableChart as TableChartIcon,
  Save as SaveIcon,
  Check as CheckIcon
} from '@mui/icons-material';

// Importar componentes
import FileUploader from './components/FileUploader';
import DataPreview from './components/DataPreview';

// Función para parsear CSV
const parseCSV = (csvText) => {
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

// Función para parsear Excel (simulada)
const parseExcel = (excelData) => {
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

export const MigracionPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mappings, setMappings] = useState({});
  const [targetResource, setTargetResource] = useState('clientes');
  const [importResult, setImportResult] = useState(null);

  // Pasos del proceso de migración
  const steps = [
    'Seleccionar archivo',
    'Mapear campos',
    'Importar datos'
  ];

  // Manejar selección de archivo
  const handleFileSelected = (selectedFile) => {
    setFile(selectedFile);
    
    // Leer el archivo
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let parsedData;
        if (selectedFile.name.endsWith('.csv')) {
          parsedData = parseCSV(e.target.result);
        } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
          parsedData = parseExcel(e.target.result);
        }
        
        setHeaders(parsedData.headers);
        setData(parsedData.data);
        
        // Inicializar mappings con valores vacíos
        const initialMappings = {};
        parsedData.headers.forEach(header => {
          initialMappings[header] = '';
        });
        setMappings(initialMappings);
        
      } catch (error) {
        console.error('Error al procesar el archivo:', error);
      }
    };
    
    if (selectedFile.name.endsWith('.csv')) {
      reader.readAsText(selectedFile);
    } else {
      // Simulamos la lectura de Excel
      reader.onload();
    }
  };

  // Manejar cambio de mapeo de campos
  const handleMappingChange = (csvHeader, systemField) => {
    setMappings(prev => ({
      ...prev,
      [csvHeader]: systemField
    }));
  };

  // Manejar cambio de recurso objetivo
  const handleResourceChange = (event) => {
    setTargetResource(event.target.value);
  };

  // Manejar importación de datos
  const handleImport = () => {
    // Aquí implementaríamos la lógica real de importación
    // Por ahora, simulamos una importación exitosa
    
    // Contar registros mapeados correctamente
    const validRecords = data.filter(row => {
      // Un registro es válido si al menos tiene un campo mapeado con datos
      return Object.keys(mappings).some(header => 
        mappings[header] && row[header] && row[header].trim() !== ''
      );
    });
    
    setImportResult({
      success: true,
      totalRecords: data.length,
      importedRecords: validRecords.length,
      errors: data.length - validRecords.length
    });
    
    // Avanzar al siguiente paso
    setActiveStep(activeStep + 1);
  };

  // Manejar navegación entre pasos
  const handleNext = () => {
    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFile(null);
    setData([]);
    setHeaders([]);
    setMappings({});
    setImportResult(null);
  };

  // Renderizar contenido según el paso activo
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" sx={{ color: 'white', mb: 3 }}>
              Selecciona un archivo CSV o Excel para importar datos. El archivo debe contener encabezados en la primera fila.
            </Typography>
            <FileUploader 
              onFileSelected={handleFileSelected}
              acceptedFormats={['.csv', '.xlsx', '.xls']}
              maxSize={10}
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="body1" sx={{ color: 'white', mb: 3 }}>
              Mapea los campos del archivo con los campos del sistema. Solo se importarán los campos mapeados.
            </Typography>
            
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                mb: 3,
                backgroundColor: '#1e2a38',
                border: '1px solid #2d3748',
                borderRadius: 2
              }}
            >
              <FormControl fullWidth>
                <InputLabel id="resource-label" sx={{ color: '#a0aec0' }}>Importar a</InputLabel>
                <Select
                  labelId="resource-label"
                  value={targetResource}
                  onChange={handleResourceChange}
                  label="Importar a"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2d3748',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4a5568',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e53935',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'white',
                    }
                  }}
                >
                  <MenuItem value="clientes">Clientes</MenuItem>
                  <MenuItem value="productos">Productos</MenuItem>
                  <MenuItem value="categorias">Categorías</MenuItem>
                  <MenuItem value="marcas">Marcas</MenuItem>
                </Select>
              </FormControl>
            </Paper>
            
            <DataPreview 
              data={data}
              headers={headers}
              mappings={mappings}
              onMappingChange={handleMappingChange}
            />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {importResult ? (
              <>
                <CheckIcon sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
                <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
                  Importación completada
                </Typography>
                <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
                  Se han procesado {importResult.totalRecords} registros.
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      backgroundColor: '#1e2a38',
                      border: '1px solid #2d3748',
                      borderRadius: 2,
                      minWidth: '150px'
                    }}
                  >
                    <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                      {importResult.importedRecords}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Registros importados
                    </Typography>
                  </Paper>
                  
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      backgroundColor: '#1e2a38',
                      border: '1px solid #2d3748',
                      borderRadius: 2,
                      minWidth: '150px'
                    }}
                  >
                    <Typography variant="h4" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                      {importResult.errors}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                      Registros con errores
                    </Typography>
                  </Paper>
                </Box>
                
                {importResult.errors > 0 && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    Algunos registros no se pudieron importar debido a datos faltantes o inválidos.
                  </Alert>
                )}
              </>
            ) : (
              <>
                <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
                  Importando datos...
                </Typography>
                <Typography variant="body1" sx={{ color: '#a0aec0' }}>
                  Este proceso puede tardar unos minutos dependiendo del tamaño del archivo.
                </Typography>
              </>
            )}
          </Box>
        );
      default:
        return 'Paso desconocido';
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ color: 'white', mb: 3 }}>
        Migración de Datos
      </Typography>
      
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          backgroundColor: '#1e2a38',
          border: '1px solid #2d3748',
          borderRadius: 2,
          mb: 4
        }}
      >
        <Stepper 
          activeStep={activeStep} 
          alternativeLabel
          sx={{
            '& .MuiStepLabel-label': {
              color: '#a0aec0',
              '&.Mui-active': {
                color: 'white',
              },
              '&.Mui-completed': {
                color: '#4caf50',
              },
            },
            '& .MuiStepIcon-root': {
              color: '#2d3748',
              '&.Mui-active': {
                color: '#e53935',
              },
              '&.Mui-completed': {
                color: '#4caf50',
              },
            }
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>
      
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          backgroundColor: '#1e2a38',
          border: '1px solid #2d3748',
          borderRadius: 2,
          mb: 3
        }}
      >
        {getStepContent(activeStep)}
        
        <Divider sx={{ my: 3, backgroundColor: '#2d3748' }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ 
              color: 'white',
              '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            Atrás
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button 
                onClick={handleReset}
                variant="outlined"
                sx={{
                  color: 'white',
                  borderColor: '#2d3748',
                  '&:hover': {
                    borderColor: '#4a5568',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)'
                  }
                }}
              >
                Nueva importación
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={activeStep === steps.length - 2 ? handleImport : handleNext}
                disabled={(activeStep === 0 && !file) || (activeStep === 1 && Object.values(mappings).every(value => !value))}
                startIcon={activeStep === steps.length - 2 ? <SaveIcon /> : null}
              >
                {activeStep === steps.length - 2 ? 'Importar' : 'Siguiente'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default MigracionPage;
