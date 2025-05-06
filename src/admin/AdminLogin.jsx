import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';

// Instancia de PocketBase para autenticación
const pbUrl = 'http://172.21.181.243:8090';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@example.com'); // Email por defecto
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Autenticación directa con fetch en lugar de usar el SDK
      const response = await fetch(`${pbUrl}/api/admins/auth-with-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity: email,
          password: password
        })
      });

      if (!response.ok) {
        // Si la primera autenticación falla, intentar con la colección _superusers
        const superUserResponse = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identity: email,
            password: password
          })
        });

        if (!superUserResponse.ok) {
          throw new Error(`Error de autenticación: ${superUserResponse.status}`);
        }

        const authData = await superUserResponse.json();
        console.log('Login exitoso como superuser:', authData);
        
        localStorage.setItem('pelotazo_auth', JSON.stringify({
          token: authData.token,
          model: authData.record,
        }));
      } else {
        const authData = await response.json();
        console.log('Login exitoso como admin:', authData);
        
        localStorage.setItem('pelotazo_auth', JSON.stringify({
          token: authData.token,
          model: authData.record,
        }));
      }
      
      // Forzar reload para que la app detecte el nuevo estado
      window.location.reload();
    } catch (err) {
      console.error('Error de login:', err);
      setError('Credenciales incorrectas. Usa el email y contraseña del administrador de PocketBase.');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f5f5f5">
      <Paper elevation={3} sx={{ p: 4, minWidth: 320 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Acceso Administrador
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 2 }}>
          Usa las credenciales del administrador de PocketBase
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          {error && <Typography color="error" variant="body2">{error}</Typography>}
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Iniciar sesión
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default AdminLogin;
