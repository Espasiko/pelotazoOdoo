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
  Divider
} from '@mui/material';
import {
  Store as StoreIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  LocationOn as LocationOnIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';

const ConfiguracionGeneral = ({ formData, handleChange, handleSave }) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
        Información de la Tienda
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            name="nombreTienda"
            label="Nombre de la tienda"
            value={formData.nombreTienda || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <StoreIcon sx={{ color: '#a0aec0' }} />
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
        <Grid item xs={12} md={6}>
          <TextField
            name="telefono"
            label="Teléfono de contacto"
            value={formData.telefono || ''}
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
        <Grid item xs={12} md={6}>
          <TextField
            name="email"
            label="Email de contacto"
            value={formData.email || ''}
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
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="sitioWeb"
            label="Sitio web"
            value={formData.sitioWeb || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LanguageIcon sx={{ color: '#a0aec0' }} />
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
      </Grid>

      <Divider sx={{ my: 3, backgroundColor: '#2d3748' }} />

      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
        Dirección Fiscal
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            name="direccion"
            label="Dirección"
            value={formData.direccion || ''}
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
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            name="codigoPostal"
            label="Código Postal"
            value={formData.codigoPostal || ''}
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
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            name="ciudad"
            label="Ciudad"
            value={formData.ciudad || ''}
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
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            name="provincia"
            label="Provincia"
            value={formData.provincia || ''}
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
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="cif"
            label="CIF/NIF"
            value={formData.cif || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountBalanceIcon sx={{ color: '#a0aec0' }} />
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
      </Grid>

      <Divider sx={{ my: 3, backgroundColor: '#2d3748' }} />

      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
        Modelos de IA y MCPs
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            select
            name="modeloIA"
            label="Modelo IA preferido"
            value={formData.modeloIA || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            SelectProps={{ native: true }}
            InputLabelProps={{ sx: { color: '#a0aec0' } }}
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
          >
            <option value="">Selecciona un modelo</option>
            <option value="gpt-4.1">GPT-4.1</option>
            <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
            <option value="mistral-codestral">Mistral Codestral</option>
            <option value="groq">Groq</option>
            <option value="otro">Otro</option>
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="endpointIA"
            label="Endpoint API del modelo"
            value={formData.endpointIA || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ sx: { color: '#a0aec0' } }}
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
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="apiKeyIA"
            label="API Key del modelo"
            type="password"
            value={formData.apiKeyIA || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ sx: { color: '#a0aec0' } }}
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
          />
        </Grid>
      </Grid>

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

export default ConfiguracionGeneral;
