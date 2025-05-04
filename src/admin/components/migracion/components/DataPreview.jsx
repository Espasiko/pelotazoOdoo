import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';

const DataPreview = ({ data, headers, mappings, onMappingChange }) => {
  // Si no hay datos, mostrar mensaje
  if (!data || data.length === 0) {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          backgroundColor: '#1e2a38',
          border: '1px solid #2d3748',
          borderRadius: 2
        }}
      >
        <Typography variant="body1" sx={{ color: 'white', textAlign: 'center' }}>
          No hay datos para previsualizar. Por favor, carga un archivo primero.
        </Typography>
      </Paper>
    );
  }

  // Campos disponibles en el sistema
  const systemFields = [
    { id: 'nombre', label: 'Nombre' },
    { id: 'apellidos', label: 'Apellidos' },
    { id: 'email', label: 'Email' },
    { id: 'telefono', label: 'Teléfono' },
    { id: 'direccion', label: 'Dirección' },
    { id: 'codigo_postal', label: 'Código Postal' },
    { id: 'ciudad', label: 'Ciudad' },
    { id: 'provincia', label: 'Provincia' },
    { id: 'pais', label: 'País' },
    { id: 'precio', label: 'Precio' },
    { id: 'stock', label: 'Stock' },
    { id: 'descripcion', label: 'Descripción' },
    { id: 'categoria', label: 'Categoría' },
    { id: 'marca', label: 'Marca' },
    { id: 'fecha', label: 'Fecha' }
  ];

  // Manejar cambio de mapeo
  const handleMappingChange = (csvHeader, systemField) => {
    onMappingChange(csvHeader, systemField);
  };

  return (
    <>
      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
        Mapeo de Campos
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
        <Grid container spacing={2}>
          {headers.map((header) => (
            <Grid item xs={12} sm={6} md={4} key={header}>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel id={`mapping-${header}-label`} sx={{ color: '#a0aec0' }}>
                  {header}
                </InputLabel>
                <Select
                  labelId={`mapping-${header}-label`}
                  value={mappings[header] || ''}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
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
                  <MenuItem value="">
                    <em>No mapear</em>
                  </MenuItem>
                  {systemFields.map((field) => (
                    <MenuItem key={field.id} value={field.id}>
                      {field.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
        Vista Previa de Datos
      </Typography>
      
      <TableContainer 
        component={Paper}
        sx={{ 
          backgroundColor: '#1e2a38',
          border: '1px solid #2d3748',
          borderRadius: 2,
          mb: 3
        }}
        elevation={0}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              {headers.map((header) => (
                <TableCell 
                  key={header} 
                  sx={{ 
                    color: '#a0aec0', 
                    borderBottom: '1px solid #2d3748',
                    fontWeight: 'medium'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {header}
                    {mappings[header] && (
                      <Chip 
                        label={systemFields.find(f => f.id === mappings[header])?.label || mappings[header]} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.slice(0, 5).map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((header, cellIndex) => (
                  <TableCell 
                    key={`${rowIndex}-${cellIndex}`}
                    sx={{ 
                      color: 'white', 
                      borderBottom: '1px solid #2d3748'
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
      
      {data.length > 5 && (
        <Typography variant="body2" sx={{ color: '#a0aec0', textAlign: 'center', mb: 3 }}>
          Mostrando 5 de {data.length} registros
        </Typography>
      )}
    </>
  );
};

export default DataPreview;
