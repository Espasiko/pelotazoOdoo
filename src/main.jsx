import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AdminApp from './admin/App';
import { theme, dashboardTheme } from './theme';
import './index.css'; // Importar estilos CSS

// Componente temporal para la tienda
const TiendaApp = () => (
  <div style={{ padding: '20px' }}>
    <h1>Tienda Online - El Pelotazo</h1>
    <p>Los mejores electrodomésticos al mejor precio.</p>
    <p>Próximamente: catálogo completo con reserva online.</p>
  </div>
);

// Componente que aplica el tema adecuado según la ruta
const ThemedApp = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/admin/*" 
          element={
            <ThemeProvider theme={dashboardTheme}>
              <CssBaseline />
              <AdminApp />
            </ThemeProvider>
          } 
        />
        <Route 
          path="/tienda/*" 
          element={
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <TiendaApp />
            </ThemeProvider>
          } 
        />
        <Route path="/" element={<Navigate to="/tienda" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemedApp />
  </React.StrictMode>
);