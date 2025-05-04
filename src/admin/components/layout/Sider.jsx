import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Avatar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Bookmark as BookmarkIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useResource } from '@refinedev/core';

const drawerWidth = 240;

  /**
   * Sider es un componente que se encarga de renderizar el menú de navegación lateral
   * en la interfaz de administración de El Pelotazo.
   * 
   * Utiliza la hook `useResource` para obtener la lista de recursos y mostrarlos en el
   * menú de navegación. También utiliza la hook `useLocation` para obtener la ruta actual
   * y verificar si una ruta está activa o no.
   * 
   * El componente utiliza el estilo de Material UI para su diseño y utiliza los iconos
   * de Material UI para los elementos del menú de navegación.
   * 
   * El componente returneda un JSX que se encarga de renderizar el menú de navegación
   * lateral. El menú está compuesto por una lista de elementos que se generan dinámicamente
   * a partir de la lista de recursos. Cada elemento del menú tiene un icono y un título
   * que se muestra en el elemento. El título se muestra en negrita si la ruta actual coincide
   * con la ruta del elemento.
   * 
   * El componente también muestra un footer que contiene información del usuario actual.
   */
export const Sider = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { resources } = useResource();

  // Función para obtener el icono según el nombre
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Dashboard': return <DashboardIcon />;
      case 'Inventory': return <InventoryIcon />;
      case 'Category': return <CategoryIcon />;
      case 'Bookmark': return <BookmarkIcon />;
      case 'People': return <PeopleIcon />;
      case 'ShoppingCart': return <ShoppingCartIcon />;
      case 'Receipt': return <ReceiptIcon />;
      case 'Upload': return <UploadIcon />;
      case 'Settings': return <SettingsIcon />;
      default: return <DashboardIcon />;
    }
  };

  // Función para manejar la navegación
  const handleNavigation = (path) => {
    // Asegurarse de que la ruta sea relativa al contexto de /admin/
    if (path.startsWith('/')) {
      // Si es una ruta absoluta, convertirla a relativa
      const relativePath = path.substring(1); // Quitar la barra inicial
      navigate(relativePath);
    } else {
      // Si ya es relativa, usarla directamente
      navigate(path);
    }
  };

  // Función para verificar si una ruta está activa
  const isActive = (path) => {
    if (path.startsWith('/')) {
      // Si es una ruta absoluta, convertirla a relativa para comparar
      path = path.substring(1);
    }
    
    // Verificar si la ruta actual coincide con la ruta del elemento
    return currentPath.endsWith(path) || 
           (path === 'dashboard' && currentPath === '/admin/') ||
           (path === 'dashboard' && currentPath === '/admin');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1A2233',
          color: '#fff',
          borderRight: '1px solid #2D3748'
        },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* Logo y título */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: 2,
          borderBottom: '1px solid #2D3748'
        }}>
          <Avatar 
            sx={{ 
              bgcolor: '#e53935',
              width: 40,
              height: 40,
              marginRight: 2
            }}
          >
            P
          </Avatar>
          <Typography variant="h6" noWrap>
            El Pelotazo
          </Typography>
        </Box>

        {/* Menú de navegación */}
        <List sx={{ flexGrow: 1, pt: 0 }}>
          {resources
            .filter(resource => resource.list)
            .map((resource, index) => (
              <React.Fragment key={resource.name}>
                <ListItemButton
                  onClick={() => handleNavigation(resource.list)}
                  selected={isActive(resource.list)}
                  sx={{
                    py: 1.5,
                    '&.Mui-selected': {
                      backgroundColor: '#2D3748',
                      '&:hover': {
                        backgroundColor: '#2D3748',
                      },
                    },
                    '&:hover': {
                      backgroundColor: '#1E293B',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: '#A0AEC0', minWidth: 40 }}>
                    {resource.meta?.icon ? getIcon(resource.meta.icon) : <DashboardIcon />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={resource.meta?.label || resource.name} 
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: isActive(resource.list) ? 'bold' : 'normal',
                    }}
                  />
                </ListItemButton>
                {index < resources.length - 1 && <Divider sx={{ borderColor: '#2D3748' }} />}
              </React.Fragment>
            ))}
        </List>

        {/* Footer del sidebar */}
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid #2D3748',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Avatar 
            sx={{ 
              bgcolor: '#3182CE',
              width: 32,
              height: 32,
              marginRight: 1.5,
              fontSize: '0.8rem'
            }}
          >
            AD
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Admin
            </Typography>
            <Typography variant="caption" sx={{ color: '#A0AEC0' }}>
              Administrador
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sider;
