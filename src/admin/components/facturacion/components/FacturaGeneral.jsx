import React from 'react';
import {
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Event as EventIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';

const FacturaGeneral = ({ formData, handleChange, clientes }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FormControl fullWidth margin="normal">
          <InputLabel id="cliente-label" sx={{ color: '#a0aec0' }}>Cliente</InputLabel>
          <Select
            labelId="cliente-label"
            name="cliente_id"
            value={formData.cliente_id}
            onChange={handleChange}
            required
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
            <MenuItem value="" disabled>Seleccione un cliente</MenuItem>
            {clientes.map((cliente) => (
              <MenuItem key={cliente.id} value={cliente.id}>
                {cliente.nombre} {cliente.apellidos} ({cliente.email})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          name="numero_factura"
          label="Número de factura"
          value={formData.numero_factura || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <ReceiptIcon sx={{ color: '#a0aec0' }} />
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
          name="fecha"
          label="Fecha de emisión"
          type="date"
          value={formData.fecha || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EventIcon sx={{ color: '#a0aec0' }} />
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
            shrink: true,
            sx: { color: '#a0aec0' }
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel id="estado-label" sx={{ color: '#a0aec0' }}>Estado de la factura</InputLabel>
          <Select
            labelId="estado-label"
            name="estado"
            value={formData.estado || 'Pendiente'}
            onChange={handleChange}
            required
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
            <MenuItem value="Pendiente">Pendiente</MenuItem>
            <MenuItem value="Enviada">Enviada</MenuItem>
            <MenuItem value="Pagada">Pagada</MenuItem>
            <MenuItem value="Vencida">Vencida</MenuItem>
            <MenuItem value="Anulada">Anulada</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel id="metodo-pago-label" sx={{ color: '#a0aec0' }}>Método de pago</InputLabel>
          <Select
            labelId="metodo-pago-label"
            name="metodo_pago"
            value={formData.metodo_pago || ''}
            onChange={handleChange}
            required
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
            <MenuItem value="" disabled>Seleccione un método de pago</MenuItem>
            <MenuItem value="Tarjeta">Tarjeta de crédito/débito</MenuItem>
            <MenuItem value="PayPal">PayPal</MenuItem>
            <MenuItem value="Transferencia">Transferencia bancaria</MenuItem>
            <MenuItem value="Contra reembolso">Contra reembolso</MenuItem>
            <MenuItem value="Bizum">Bizum</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          name="notas"
          label="Notas adicionales"
          value={formData.notas || ''}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
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
    </Grid>
  );
};

export default FacturaGeneral;
