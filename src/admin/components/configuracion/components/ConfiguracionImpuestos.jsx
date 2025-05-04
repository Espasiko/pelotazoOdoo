import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  InputAdornment,
  FormControlLabel,
  Switch,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Percent as PercentIcon
} from '@mui/icons-material';

const ConfiguracionImpuestos = ({ 
  formData, 
  handleChange, 
  handleSave,
  handleAddTax,
  handleRemoveTax,
  handleTaxChange
}) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
        Configuración de Impuestos
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.impuestosIncluidos || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'impuestosIncluidos',
                    value: e.target.checked
                  }
                })}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#e53935',
                    '&:hover': {
                      backgroundColor: 'rgba(229, 57, 53, 0.08)',
                    },
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#e53935',
                  },
                }}
              />
            }
            label="Precios con impuestos incluidos"
            sx={{ color: 'white' }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.facturacionElectronica || false}
                onChange={(e) => handleChange({
                  target: {
                    name: 'facturacionElectronica',
                    value: e.target.checked
                  }
                })}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#e53935',
                    '&:hover': {
                      backgroundColor: 'rgba(229, 57, 53, 0.08)',
                    },
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#e53935',
                  },
                }}
              />
            }
            label="Habilitar facturación electrónica"
            sx={{ color: 'white' }}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ color: 'white' }}>
            Tipos de IVA
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddTax}
            sx={{
              color: 'white',
              borderColor: '#2d3748',
              '&:hover': {
                borderColor: '#4a5568',
                backgroundColor: 'rgba(255, 255, 255, 0.04)'
              }
            }}
          >
            Añadir tipo
          </Button>
        </Box>

        <TableContainer 
          component={Paper}
          sx={{ 
            backgroundColor: '#1e2a38',
            border: '1px solid #2d3748',
            mb: 3
          }}
          elevation={0}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Nombre</TableCell>
                <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Porcentaje</TableCell>
                <TableCell align="center" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium', width: '100px' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.tiposIVA && formData.tiposIVA.length > 0 ? (
                formData.tiposIVA.map((tipo, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                      <TextField
                        name="nombre"
                        value={tipo.nombre || ''}
                        onChange={(e) => handleTaxChange(index, 'nombre', e.target.value)}
                        variant="standard"
                        fullWidth
                        InputProps={{
                          sx: {
                            color: 'white',
                            '&:before': {
                              borderBottomColor: '#2d3748',
                            },
                            '&:hover:not(.Mui-disabled):before': {
                              borderBottomColor: '#4a5568',
                            },
                            '&.Mui-focused:after': {
                              borderBottomColor: '#e53935',
                            },
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                      <TextField
                        name="porcentaje"
                        value={tipo.porcentaje || ''}
                        onChange={(e) => handleTaxChange(index, 'porcentaje', e.target.value)}
                        variant="standard"
                        type="number"
                        InputProps={{
                          endAdornment: <InputAdornment position="end"><PercentIcon sx={{ color: '#a0aec0' }} /></InputAdornment>,
                          sx: {
                            color: 'white',
                            '&:before': {
                              borderBottomColor: '#2d3748',
                            },
                            '&:hover:not(.Mui-disabled):before': {
                              borderBottomColor: '#4a5568',
                            },
                            '&.Mui-focused:after': {
                              borderBottomColor: '#e53935',
                            },
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #2d3748' }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveTax(index)}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748' }}>
                    No hay tipos de IVA configurados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider sx={{ my: 3, backgroundColor: '#2d3748' }} />

      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
        Numeración de Facturas
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            name="prefijoFacturas"
            label="Prefijo para facturas"
            value={formData.prefijoFacturas || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputProps={{
              sx: {
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
              }
            }}
            InputLabelProps={{
              sx: { color: '#a0aec0' }
            }}
            helperText="Ejemplo: FACT-2025-"
            FormHelperTextProps={{
              sx: { color: '#a0aec0' }
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="numeroInicialFacturas"
            label="Número inicial para facturas"
            value={formData.numeroInicialFacturas || ''}
            onChange={handleChange}
            type="number"
            fullWidth
            margin="normal"
            InputProps={{
              sx: {
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
              }
            }}
            InputLabelProps={{
              sx: { color: '#a0aec0' }
            }}
            helperText="Ejemplo: 1"
            FormHelperTextProps={{
              sx: { color: '#a0aec0' }
            }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3, backgroundColor: '#2d3748' }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
        >
          Guardar Cambios
        </Button>
      </Box>
    </Box>
  );
};

export default ConfiguracionImpuestos;
