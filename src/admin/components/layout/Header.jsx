import React, { useEffect, useState } from 'react';
import { useLogout, useGetIdentity } from '@refinedev/core';
import {
  AppBar,
  IconButton,
  Avatar,
  Box,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

// Componente Logo inline para evitar problemas de carga
const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="28" height="28" rx="4" fill="#e53935" />
    <text x="11" y="22" fontFamily="Arial" fontSize="18" fontWeight="bold" fill="#ffffff">P</text>
  </svg>
);

export const Header = ({ sticky = false }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { mutate: logout } = useLogout();
  const { data: user } = useGetIdentity();
  const [userAvatar, setUserAvatar] = useState(null);

  useEffect(() => {
    if (user?.avatar) {
      setUserAvatar(user.avatar);
    } else {
      // Avatar por defecto si no hay uno definido
      setUserAvatar(null);
    }
  }, [user]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  return (
    <AppBar 
      position={sticky ? "sticky" : "relative"} 
      elevation={0}
      sx={{ 
        backgroundColor: '#121826', 
        borderBottom: '1px solid #2d3748',
        boxShadow: 'none'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Logo />
          <Typography variant="h6" noWrap component="div" sx={{ ml: 1 }}>
            El Pelotazo
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="inherit" sx={{ mr: 2 }}>
            <NotificationsIcon />
          </IconButton>
          
          <IconButton
            onClick={handleClick}
            size="small"
            aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
          >
            <Avatar 
              sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
              src={userAvatar}
            >
              {user?.name?.charAt(0) || 'A'}
            </Avatar>
          </IconButton>
        </Box>
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={Boolean(anchorEl)}
          onClose={handleClose}
          onClick={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              backgroundColor: '#1e2a38',
              color: 'white',
              border: '1px solid #2d3748',
              '& .MuiMenuItem-root': {
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
              },
              '& .MuiDivider-root': {
                borderColor: '#2d3748',
              },
            },
          }}
        >
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <PersonIcon fontSize="small" sx={{ color: 'white' }} />
            </ListItemIcon>
            Mi Perfil
          </MenuItem>
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" sx={{ color: 'white' }} />
            </ListItemIcon>
            Configuración
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: 'white' }} />
            </ListItemIcon>
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
