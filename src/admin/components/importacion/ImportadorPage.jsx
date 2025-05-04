import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  Upload as UploadIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useImportacion } from '../../../business/hooks/useImportacion';

// Componente para seleccionar archivo
const FileSelector = ({ onFileSelect }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Verificar extensión del archivo
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        setError('Formato de archivo no válido. Por favor, selecciona un archivo CSV o Excel.');
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setError('');
      onFileSelect(file);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1E293B', color: '#fff' }}>
      <Typography variant="h6" gutterBottom>
        Seleccionar Archivo
      </Typography>
      
      <Box sx={{ mt: 2 }}>
        <input
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          id="file-upload"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload">
          <Button
            variant="contained"
            component="span"
            startIcon={<UploadIcon />}
            sx={{ 
              backgroundColor: '#3182CE', 
              '&:hover': { backgroundColor: '#2C5282' } 
            }}
          >
            Seleccionar Archivo
          </Button>
        </label>
        
        {selectedFile && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1">
              Archivo seleccionado: <strong>{selectedFile.name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tamaño: {(selectedFile.size / 1024).toFixed(2)} KB
            </Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Paper>
  );
};

// Componente para seleccionar proveedor y tipo de importación
const ImportOptions = ({ proveedores, tipos, onOptionsChange }) => {
  const [proveedor, setProveedor] = useState('');
  const [tipo, setTipo] = useState('');
  const [error, setError] = useState('');

  const handleProveedorChange = (event) => {
    setProveedor(event.target.value);
    onOptionsChange({ proveedor: event.target.value, tipo });
  };

  const handleTipoChange = (event) => {
    setTipo(event.target.value);
    onOptionsChange({ proveedor, tipo: event.target.value });
  };

  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1E293B', color: '#fff' }}>
      <Typography variant="h6" gutterBottom>
        Opciones de Importación
      </Typography>
      
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="proveedor-label" sx={{ color: '#A0AEC0' }}>Proveedor</InputLabel>
          <Select
            labelId="proveedor-label"
            value={proveedor}
            onChange={handleProveedorChange}
            label="Proveedor"
            sx={{ 
              color: '#fff',
              '.MuiOutlinedInput-notchedOutline': { borderColor: '#4A5568' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182CE' },
              '.MuiSvgIcon-root': { color: '#A0AEC0' }
            }}
          >
            <MenuItem value="" disabled>Selecciona un proveedor</MenuItem>
            {proveedores.map(prov => (
              <MenuItem key={prov.id} value={prov.id}>{prov.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth>
          <InputLabel id="tipo-label" sx={{ color: '#A0AEC0' }}>Tipo de Importación</InputLabel>
          <Select
            labelId="tipo-label"
            value={tipo}
            onChange={handleTipoChange}
            label="Tipo de Importación"
            sx={{ 
              color: '#fff',
              '.MuiOutlinedInput-notchedOutline': { borderColor: '#4A5568' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#718096' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3182CE' },
              '.MuiSvgIcon-root': { color: '#A0AEC0' }
            }}
          >
            <MenuItem value="" disabled>Selecciona un tipo</MenuItem>
            {tipos.map(t => (
              <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
};

// Componente para previsualizar datos
const DataPreview = ({ previewData }) => {
  if (!previewData || previewData.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1E293B', color: '#fff' }}>
        <Typography variant="h6" gutterBottom>
          Vista Previa de Datos
        </Typography>
        <Alert severity="info" sx={{ mt: 2, backgroundColor: '#2D3748', color: '#CBD5E0' }}>
          Selecciona un archivo para ver una vista previa de los datos.
        </Alert>
      </Paper>
    );
  }

  // Obtener encabezados de la primera fila
  const headers = Object.keys(previewData[0]);

  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1E293B', color: '#fff' }}>
      <Typography variant="h6" gutterBottom>
        Vista Previa de Datos
      </Typography>
      
      <Box sx={{ mt: 2, overflow: 'auto' }}>
        <TableContainer component={Paper} sx={{ backgroundColor: '#2D3748', maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {headers.map((header, index) => (
                  <TableCell 
                    key={index}
                    sx={{ 
                      backgroundColor: '#4A5568', 
                      color: '#E2E8F0',
                      fontWeight: 'bold'
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.map((row, rowIndex) => (
                <TableRow key={rowIndex} hover>
                  {headers.map((header, colIndex) => (
                    <TableCell 
                      key={`${rowIndex}-${colIndex}`}
                      sx={{ 
                        color: '#E2E8F0',
                        borderBottom: '1px solid #4A5568'
                      }}
                    >
                      {row[header]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#A0AEC0' }}>
          Mostrando vista previa de {previewData.length} filas.
        </Typography>
      </Box>
    </Paper>
  );
};

// Componente para el historial de importaciones
const ImportHistory = ({ historial, onRefresh, loading }) => {
  // Función para formatear la fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para obtener el color del chip según el estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'completado':
        return 'success';
      case 'procesando':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3, backgroundColor: '#1E293B', color: '#fff' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Historial de Importaciones
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={loading}
          sx={{ color: '#90CDF4' }}
        >
          Actualizar
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={40} sx={{ color: '#90CDF4' }} />
        </Box>
      ) : historial.length === 0 ? (
        <Alert severity="info" sx={{ backgroundColor: '#2D3748', color: '#CBD5E0' }}>
          No hay importaciones registradas.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ backgroundColor: '#2D3748', maxHeight: 400 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: '#4A5568', color: '#E2E8F0', fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ backgroundColor: '#4A5568', color: '#E2E8F0', fontWeight: 'bold' }}>Tipo</TableCell>
                <TableCell sx={{ backgroundColor: '#4A5568', color: '#E2E8F0', fontWeight: 'bold' }}>Archivo</TableCell>
                <TableCell sx={{ backgroundColor: '#4A5568', color: '#E2E8F0', fontWeight: 'bold' }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historial.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ color: '#E2E8F0', borderBottom: '1px solid #4A5568' }}>
                    {formatDate(item.fecha)}
                  </TableCell>
                  <TableCell sx={{ color: '#E2E8F0', borderBottom: '1px solid #4A5568' }}>
                    {item.tipo}
                  </TableCell>
                  <TableCell sx={{ color: '#E2E8F0', borderBottom: '1px solid #4A5568' }}>
                    {item.archivo || 'N/A'}
                  </TableCell>
                  <TableCell sx={{ color: '#E2E8F0', borderBottom: '1px solid #4A5568' }}>
                    <Chip 
                      label={item.estado} 
                      color={getStatusColor(item.estado)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

// Componente principal de importación
const ImportadorPage = () => {
  const {
    file,
    proveedor,
    tipo,
    importacionActual,
    historial,
    loading,
    error,
    success,
    previewData,
    proveedores,
    tipos,
    handleFileChange,
    handleProveedorChange,
    handleTipoChange,
    iniciarImportacion,
    cargarHistorial,
    resetForm
  } = useImportacion();

  const [activeStep, setActiveStep] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Pasos del proceso de importación
  const steps = [
    'Seleccionar Archivo',
    'Configurar Importación',
    'Vista Previa',
    'Importar Datos'
  ];

  // Manejar cambio de opciones
  const handleOptionsChange = ({ proveedor: newProveedor, tipo: newTipo }) => {
    if (newProveedor) handleProveedorChange(newProveedor);
    if (newTipo) handleTipoChange(newTipo);
  };

  // Manejar avance de paso
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  // Manejar retroceso de paso
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Manejar inicio de importación
  const handleImport = async () => {
    try {
      const result = await iniciarImportacion();
      if (result) {
        setSnackbarMessage('Importación iniciada correctamente');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setActiveStep(4); // Paso final
      }
    } catch (err) {
      setSnackbarMessage('Error al iniciar la importación');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Manejar reinicio del proceso
  const handleReset = () => {
    resetForm();
    setActiveStep(0);
  };

  // Manejar cierre de snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Verificar si se puede avanzar al siguiente paso
  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return !!file;
      case 1:
        return !!proveedor && !!tipo;
      case 2:
        return true; // Siempre se puede avanzar desde la vista previa
      case 3:
        return true; // Siempre se puede iniciar la importación
      default:
        return false;
    }
  };

  // Renderizar el contenido según el paso actual
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <FileSelector onFileSelect={handleFileChange} />;
      case 1:
        return <ImportOptions 
          proveedores={proveedores} 
          tipos={tipos} 
          onOptionsChange={handleOptionsChange} 
        />;
      case 2:
        return <DataPreview previewData={previewData} />;
      case 3:
        return (
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1E293B', color: '#fff' }}>
            <Typography variant="h6" gutterBottom>
              Confirmar Importación
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                Archivo: <strong>{file?.name}</strong>
              </Typography>
              <Typography variant="body1">
                Proveedor: <strong>{proveedores.find(p => p.id === proveedor)?.nombre}</strong>
              </Typography>
              <Typography variant="body1">
                Tipo de Importación: <strong>{tipos.find(t => t.id === tipo)?.nombre}</strong>
              </Typography>
              
              <Alert severity="info" sx={{ mt: 2, backgroundColor: '#2D3748', color: '#CBD5E0' }}>
                Al hacer clic en "Importar", se iniciará el proceso de importación. Este proceso puede tardar varios minutos dependiendo del tamaño del archivo.
              </Alert>
            </Box>
          </Paper>
        );
      case 4:
        return (
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1E293B', color: '#fff' }}>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              {loading ? (
                <>
                  <CircularProgress size={60} sx={{ color: '#90CDF4', mb: 2 }} />
                  <Typography variant="h6">
                    Procesando importación...
                  </Typography>
                </>
              ) : success ? (
                <>
                  <CheckIcon sx={{ fontSize: 60, color: '#48BB78', mb: 2 }} />
                  <Typography variant="h6">
                    Importación iniciada correctamente
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    Puedes ver el progreso en el historial de importaciones.
                  </Typography>
                </>
              ) : (
                <>
                  <ErrorIcon sx={{ fontSize: 60, color: '#F56565', mb: 2 }} />
                  <Typography variant="h6">
                    Error al iniciar la importación
                  </Typography>
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    {error}
                  </Typography>
                </>
              )}
            </Box>
          </Paper>
        );
      default:
        return 'Paso desconocido';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#fff' }}>
        Importación de Datos
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4, color: '#A0AEC0' }}>
        Importa datos desde archivos CSV o Excel de tus proveedores. Selecciona un archivo, configura las opciones de importación y revisa los datos antes de importarlos.
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4, backgroundColor: '#1E293B' }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ 
          '& .MuiStepLabel-label': { color: '#A0AEC0' },
          '& .MuiStepLabel-label.Mui-active': { color: '#90CDF4' },
          '& .MuiStepLabel-label.Mui-completed': { color: '#68D391' },
          '& .MuiStepIcon-root': { color: '#4A5568' },
          '& .MuiStepIcon-root.Mui-active': { color: '#3182CE' },
          '& .MuiStepIcon-root.Mui-completed': { color: '#48BB78' }
        }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>
      
      {getStepContent(activeStep)}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={activeStep === 0 || activeStep === 4}
          onClick={handleBack}
          sx={{ 
            color: '#A0AEC0',
            '&:hover': { backgroundColor: '#2D3748' }
          }}
        >
          Atrás
        </Button>
        
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={!canProceed() || loading}
              startIcon={<SaveIcon />}
              sx={{ 
                backgroundColor: '#3182CE', 
                '&:hover': { backgroundColor: '#2C5282' },
                '&.Mui-disabled': { backgroundColor: '#4A5568', color: '#A0AEC0' }
              }}
            >
              {loading ? 'Procesando...' : 'Importar'}
            </Button>
          ) : activeStep === 4 ? (
            <Button
              variant="contained"
              onClick={handleReset}
              sx={{ 
                backgroundColor: '#3182CE', 
                '&:hover': { backgroundColor: '#2C5282' }
              }}
            >
              Nueva Importación
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canProceed()}
              sx={{ 
                backgroundColor: '#3182CE', 
                '&:hover': { backgroundColor: '#2C5282' },
                '&.Mui-disabled': { backgroundColor: '#4A5568', color: '#A0AEC0' }
              }}
            >
              Siguiente
            </Button>
          )}
        </Box>
      </Box>
      
      <Box sx={{ mt: 5 }}>
        <ImportHistory 
          historial={historial} 
          onRefresh={cargarHistorial}
          loading={loading}
        />
      </Box>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ImportadorPage;
