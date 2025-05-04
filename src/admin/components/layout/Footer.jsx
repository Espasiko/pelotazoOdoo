import React from 'react';
import { Box, Typography, Link } from '@mui/material';

export const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        mt: 'auto',
        backgroundColor: '#121826',
        borderTop: '1px solid #2d3748',
        textAlign: 'center'
      }}
    >
      <Typography variant="body2" sx={{ color: '#a0aec0' }}>
        {new Date().getFullYear()} El Pelotazo - Todos los derechos reservados
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, color: '#a0aec0' }}>
        <Link color="inherit" href="/admin/dashboard" sx={{ color: '#a0aec0', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
          Panel de Administración
        </Link>
        {' | '}
        <Link color="inherit" href="/tienda" sx={{ color: '#a0aec0', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
          Tienda Online
        </Link>
      </Typography>
    </Box>
  );
};

export default Footer;
