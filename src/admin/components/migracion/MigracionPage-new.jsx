import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Divider
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  TableChart as TableChartIcon,
  Save as SaveIcon
} from '@mui/icons-material';

// Importar componentes
import FileUploader from './components/FileUploader';
import DataPreview from './components/DataPreview';
import MappingForm from './components/MappingForm';
import ImportResult from './components/ImportResult';

// Importar utilidades
import { readAndParseFile } from './utils/file-parsers';
import { initializeMappings, validateMappings } from './utils/mapping-utils';
import { importData } from './utils/import-service';

/**
 * Componente principal para la página de migración de datos
 * @returns {JSX.Element} - Elemento JSX
 */
export const MigracionPage = () => {
  // Estado
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mappings, setMappings] = useState({});
  const [targetResource, setTargetResource] = useState('clientes');
  const [importResult, setImportResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Pasos del proceso de migración
  const steps = [
    'Seleccionar archivo',
    'Mapear campos',
    'Importar datos'
  ];

  // Manejar selección de archivo
  const handleFileSelected = async (selectedFile) => {
    setFile(selectedFile);
    
    try {
      // Leer y parsear el archivo
      const parsedData = await readAndParseFile(selectedFile);
      
      setHeaders(parsedData.headers);
      setData(parsedData.data);
      
      // Inicializar mappings con valores vacíos
      setMappings(initializeMappings(parsedData.headers));
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
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
  const handleImport = async () => {
    try {
      // Avanzar al siguiente paso para mostrar la pantalla de carga
      setActiveStep(activeStep + 1);
      setIsImporting(true);
      
      // Importar datos
      const result = await importData(file, mappings, targetResource);
      
      // Actualizar estado con el resultado
      setImportResult(result);
      setIsImporting(false);
    } catch (error) {
      console.error('Error en la importación:', error);
      setImportResult({
        success: false,
        totalRecords: data.length,
        importedRecords: 0,
        errors: data.length,
        errorMessage: error.message
      });
      setIsImporting(false);
    }
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
    setIsImporting(false);
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
            <MappingForm 
              targetResource={targetResource}
              onResourceChange={handleResourceChange}
              headers={headers}
              mappings={mappings}
              onMappingChange={handleMappingChange}
            />
            
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
          <ImportResult 
            result={importResult}
            loading={isImporting}
          />
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
                disabled={(activeStep === 0 && !file) || (activeStep === 1 && !validateMappings(mappings))}
                startIcon={activeStep === 0 ? <CloudUploadIcon /> : activeStep === 1 ? <SaveIcon /> : <TableChartIcon />}
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
