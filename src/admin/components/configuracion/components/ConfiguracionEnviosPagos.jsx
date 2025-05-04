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
  IconButton,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Euro as EuroIcon,
  LocalShipping as ShippingIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';

const ConfiguracionEnviosPagos = ({
  formData,
  handleChange,
  handleSave,
  handleAddShippingMethod,
  handleRemoveShippingMethod,
  handleAddPaymentMethod,
  handleRemovePaymentMethod
}) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
        Métodos de Envío
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {formData.metodosEnvio && formData.metodosEnvio.length > 0 ? (
            formData.metodosEnvio.map((metodo, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card 
                  sx={{ 
                    backgroundColor: '#1e2a38',
                    border: '1px solid #2d3748',
                    height: '100%'
                  }}
                  elevation={0}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                        {metodo.nombre || 'Nuevo método de envío'}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveShippingMethod(index)}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                      {metodo.descripcion || 'Sin descripción'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ShippingIcon sx={{ color: '#a0aec0', mr: 1, fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        {metodo.coste === 0 ? 'Envío gratuito' : `Coste: ${metodo.coste}€`}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        Tiempo estimado: {metodo.tiempoEstimado || 'No especificado'}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      sx={{ color: 'white' }}
                    >
                      Editar
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body1" sx={{ color: '#a0aec0', textAlign: 'center', py: 3 }}>
                No hay métodos de envío configurados
              </Typography>
            </Grid>
          )}
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddShippingMethod}
            sx={{
              color: 'white',
              borderColor: '#2d3748',
              '&:hover': {
                borderColor: '#4a5568',
                backgroundColor: 'rgba(255, 255, 255, 0.04)'
              }
            }}
          >
            Añadir método de envío
          </Button>
        </Box>
      </Box>

      <Divider sx={{ my: 3, backgroundColor: '#2d3748' }} />

      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
        Métodos de Pago
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          {formData.metodosPago && formData.metodosPago.length > 0 ? (
            formData.metodosPago.map((metodo, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card 
                  sx={{ 
                    backgroundColor: '#1e2a38',
                    border: '1px solid #2d3748',
                    height: '100%'
                  }}
                  elevation={0}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                        {metodo.nombre || 'Nuevo método de pago'}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemovePaymentMethod(index)}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#a0aec0', mb: 2 }}>
                      {metodo.descripcion || 'Sin descripción'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CreditCardIcon sx={{ color: '#a0aec0', mr: 1, fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        {metodo.comision > 0 ? `Comisión: ${metodo.comision}%` : 'Sin comisión'}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      sx={{ color: 'white' }}
                    >
                      Editar
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body1" sx={{ color: '#a0aec0', textAlign: 'center', py: 3 }}>
                No hay métodos de pago configurados
              </Typography>
            </Grid>
          )}
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddPaymentMethod}
            sx={{
              color: 'white',
              borderColor: '#2d3748',
              '&:hover': {
                borderColor: '#4a5568',
                backgroundColor: 'rgba(255, 255, 255, 0.04)'
              }
            }}
          >
            Añadir método de pago
          </Button>
        </Box>
      </Box>

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

export default ConfiguracionEnviosPagos;
