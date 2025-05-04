import React from 'react';
import { Box } from '@mui/material';
import Sider from './Sider';
import Header from './Header';
import Footer from './Footer';

const drawerWidth = 240;

export const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#121826' }}>
      <Sider />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: '#121826',
        }}
      >
        <Header sticky />
        <Box sx={{ 
          flexGrow: 1, 
          p: 3,
          backgroundColor: '#121826',
          overflow: 'auto'
        }}>
          {children}
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;
