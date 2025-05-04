import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper,
  LinearProgress,
  Alert
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

const FileUploader = ({ onFileSelected, acceptedFormats, maxSize = 10 }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Función para validar el archivo
  const validateFile = (file) => {
    // Validar tipo de archivo
    const fileType = file.name.split('.').pop().toLowerCase();
    if (!acceptedFormats.includes(`.${fileType}`)) {
      return `Formato de archivo no válido. Formatos aceptados: ${acceptedFormats.join(', ')}`;
    }

    // Validar tamaño de archivo (en MB)
    if (file.size > maxSize * 1024 * 1024) {
      return `El archivo es demasiado grande. Tamaño máximo: ${maxSize}MB`;
    }

    return '';
  };

  // Manejar selección de archivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        setFile(null);
      } else {
        setError('');
        setFile(selectedFile);
        onFileSelected(selectedFile);
      }
    }
  };

  // Manejar arrastrar y soltar
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Manejar soltar archivo
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validationError = validateFile(droppedFile);
      
      if (validationError) {
        setError(validationError);
        setFile(null);
      } else {
        setError('');
        setFile(droppedFile);
        onFileSelected(droppedFile);
      }
    }
  };

  // Simular carga de archivo
  const simulateUpload = () => {
    setUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        const newProgress = prevProgress + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploading(false);
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: '#1e2a38',
        border: dragActive ? '2px dashed #e53935' : '1px solid #2d3748',
        borderRadius: 2,
        p: 3,
        mb: 3,
        transition: 'all 0.2s ease'
      }}
    >
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          cursor: 'pointer',
          position: 'relative'
        }}
        onClick={() => document.getElementById('file-input').click()}
      >
        {!file && !uploading ? (
          <>
            <CloudUploadIcon sx={{ fontSize: 60, color: dragActive ? '#e53935' : '#a0aec0', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
              Arrastra y suelta un archivo o haz clic para seleccionar
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              Formatos aceptados: {acceptedFormats.join(', ')} (Máx. {maxSize}MB)
            </Typography>
            <input
              id="file-input"
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </>
        ) : uploading ? (
          <Box sx={{ width: '100%', p: 2 }}>
            <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
              Procesando archivo...
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ 
                mb: 2,
                height: 10,
                borderRadius: 5,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#e53935'
                }
              }} 
            />
            <Typography variant="body2" sx={{ color: '#a0aec0', textAlign: 'center' }}>
              {uploadProgress}% completado
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <FileIcon sx={{ fontSize: 40, color: '#e53935', mr: 2 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
                {file.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                simulateUpload();
              }}
            >
              Procesar
            </Button>
          </Box>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
};

export default FileUploader;
