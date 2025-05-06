import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';

/**
 * Componente para mostrar los resultados de la importación
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.result - Resultado de la importación
 * @param {boolean} props.loading - Indica si la importación está en proceso
 * @returns {JSX.Element} - Elemento JSX
 */
const ImportResult = ({ result, loading }) => {
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress sx={{ color: '#e53935', mb: 2 }} />
        <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
          Importando datos...
        </Typography>
        <Typography variant="body1" sx={{ color: '#a0aec0' }}>
          Este proceso puede tardar unos minutos dependiendo del tamaño del archivo.
        </Typography>
      </Box>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      {result.success ? (
        <CheckIcon sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
      ) : (
        <Alert severity="error" sx={{ mb: 2 }}>
          {result.errorMessage || 'Error en la importación'}
        </Alert>
      )}
      
      <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
        Importación completada
      </Typography>
      
      <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
        Se han procesado {result.totalRecords} registros.
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
            {result.importedRecords}
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
            {result.errors}
          </Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0' }}>
            Registros con errores
          </Typography>
        </Paper>
      </Box>
      
      {result.errors > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Algunos registros no se pudieron importar debido a datos faltantes o inválidos.
        </Alert>
      )}
      
      {result.detalles && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 2, 
            backgroundColor: '#1e2a38',
            border: '1px solid #2d3748',
            borderRadius: 2,
            textAlign: 'left'
          }}
        >
          <Typography variant="subtitle1" sx={{ color: 'white', mb: 1 }}>
            Detalles:
          </Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0', whiteSpace: 'pre-wrap' }}>
            {typeof result.detalles === 'string' 
              ? result.detalles 
              : JSON.stringify(result.detalles, null, 2)
            }
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ImportResult;
