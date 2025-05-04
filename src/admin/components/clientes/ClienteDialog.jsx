import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Slider,
  InputAdornment
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Home as HomeIcon,
  LocationCity as LocationCityIcon,
  Public as PublicIcon,
  MyLocation as MyLocationIcon
} from '@mui/icons-material';
import { useCreate, useUpdate } from '@refinedev/core';

export const ClienteDialog = ({ open, onClose, cliente }) => {
  const isEditing = !!cliente;
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    teléfono: '',
    dirección: '',
    código_postal: '',
    ciudad: '',
    provincia: '',
    distancia_tienda: 0
  });

  // Hooks para crear y actualizar clientes
  const { mutate: createCliente } = useCreate();
  const { mutate: updateCliente } = useUpdate();

  // Inicializar formulario con datos del cliente si estamos editando
  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || '',
        apellidos: cliente.apellidos || '',
        email: cliente.email || '',
        teléfono: cliente.teléfono || '',
        dirección: cliente.dirección || '',
        código_postal: cliente.código_postal || '',
        ciudad: cliente.ciudad || '',
        provincia: cliente.provincia || '',
        distancia_tienda: cliente.distancia_tienda || 0
      });
    } else {
      // Resetear formulario para nuevo cliente
      setFormData({
        nombre: '',
        apellidos: '',
        email: '',
        teléfono: '',
        dirección: '',
        código_postal: '',
        ciudad: '',
        provincia: '',
        distancia_tienda: 0
      });
    }
  }, [cliente, open]);

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Manejar cambio en el slider de distancia
  const handleDistanciaChange = (event, newValue) => {
    setFormData({
      ...formData,
      distancia_tienda: newValue
    });
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    if (isEditing) {
      // Actualizar cliente existente
      updateCliente({
        resource: 'clientes',
        id: cliente.id,
        values: formData,
      }, {
        onSuccess: () => {
          onClose();
        }
      });
    } else {
      // Crear nuevo cliente
      createCliente({
        resource: 'clientes',
        values: formData,
      }, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };

  // Función para determinar el color de la distancia
  const getDistanciaColor = (distancia) => {
    if (distancia <= 15) return '#4caf50';
    if (distancia <= 30) return '#ff9800';
    return '#f44336';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          backgroundColor: '#1e2a38',
          color: 'white',
          border: '1px solid #2d3748',
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: '#a0aec0' }}>
                Información Personal
              </Typography>
              <TextField
                name="nombre"
                label="Nombre"
                value={formData.nombre}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
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
              />
              <TextField
                name="apellidos"
                label="Apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
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
              />
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
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
              />
              <TextField
                name="teléfono"
                label="Teléfono"
                value={formData.teléfono}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: '#a0aec0' }}>
                Dirección
              </Typography>
              <TextField
                name="dirección"
                label="Dirección"
                value={formData.dirección}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
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
              />
              <TextField
                name="código_postal"
                label="Código Postal"
                value={formData.código_postal}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <HomeIcon sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
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
              />
              <TextField
                name="ciudad"
                label="Ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationCityIcon sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
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
              />
              <TextField
                name="provincia"
                label="Provincia"
                value={formData.provincia}
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PublicIcon sx={{ color: '#a0aec0' }} />
                    </InputAdornment>
                  ),
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
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: '#a0aec0', display: 'flex', alignItems: 'center' }}>
                  <MyLocationIcon sx={{ mr: 1 }} />
                  Distancia a la tienda: {formData.distancia_tienda} km
                </Typography>
                <Box sx={{ px: 2 }}>
                  <Slider
                    value={formData.distancia_tienda}
                    onChange={handleDistanciaChange}
                    aria-labelledby="distancia-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    min={0}
                    max={100}
                    sx={{
                      color: getDistanciaColor(formData.distancia_tienda),
                      '& .MuiSlider-thumb': {
                        height: 24,
                        width: 24,
                        backgroundColor: '#fff',
                        border: '2px solid currentColor',
                        '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                          boxShadow: 'inherit',
                        },
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" sx={{ color: '#4caf50' }}>
                      Envío gratis (0-15 km)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ff9800' }}>
                      Envío estándar (16-30 km)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#f44336' }}>
                      Envío premium (31+ km)
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={onClose}
            sx={{ color: 'white' }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
          >
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ClienteDialog;
