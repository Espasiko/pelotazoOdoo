import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import { getFieldOptions } from '../utils/mapping-utils';

/**
 * Componente para el formulario de mapeo de campos
 * @param {Object} props - Propiedades del componente
 * @param {string} props.targetResource - Recurso objetivo (clientes, productos, etc.)
 * @param {Function} props.onResourceChange - Función para manejar cambio de recurso
 * @param {Array} props.headers - Encabezados del archivo
 * @param {Object} props.mappings - Mapeos de campos
 * @param {Function} props.onMappingChange - Función para manejar cambio de mapeo
 * @returns {JSX.Element} - Elemento JSX
 */
const MappingForm = ({ targetResource, onResourceChange, headers, mappings, onMappingChange }) => {
  // Obtener opciones de campos para el recurso seleccionado
  const fieldOptions = getFieldOptions(targetResource);
  
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
            onChange={onResourceChange}
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
      
      <Paper 
        elevation={0}
        sx={{ 
          p: 2,
          backgroundColor: '#1e2a38',
          border: '1px solid #2d3748',
          borderRadius: 2
        }}
      >
        <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>
          Mapeo de campos
        </Typography>
        
        {headers.map((header, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel id={`mapping-${index}-label`} sx={{ color: '#a0aec0' }}>
                {header}
              </InputLabel>
              <Select
                labelId={`mapping-${index}-label`}
                value={mappings[header] || ''}
                onChange={(e) => onMappingChange(header, e.target.value)}
                label={header}
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
                <MenuItem value="">No importar</MenuItem>
                {fieldOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ))}
      </Paper>
    </Box>
  );
};

export default MappingForm;
