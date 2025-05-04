import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';

// Importar componentes
import ConfiguracionGeneral from './components/ConfiguracionGeneral';
import ConfiguracionImpuestos from './components/ConfiguracionImpuestos';
import ConfiguracionEnviosPagos from './components/ConfiguracionEnviosPagos';

// Componente TabPanel para las pestañas
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`configuracion-tabpanel-${index}`}
      aria-labelledby={`configuracion-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export const ConfiguracionPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Estado para la configuración
  const [formData, setFormData] = useState({
    // Configuración general
    nombreTienda: 'El Pelotazo',
    telefono: '912345678',
    email: 'info@elpelotazo.com',
    sitioWeb: 'www.elpelotazo.com',
    direccion: 'Calle Comercio, 12',
    codigoPostal: '28001',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    cif: 'B12345678',
    
    // Configuración de impuestos
    impuestosIncluidos: true,
    facturacionElectronica: true,
    tiposIVA: [
      { nombre: 'General', porcentaje: 21 },
      { nombre: 'Reducido', porcentaje: 10 },
      { nombre: 'Superreducido', porcentaje: 4 }
    ],
    prefijoFacturas: 'FACT-2025-',
    numeroInicialFacturas: 1,
    
    // Configuración de envíos y pagos
    metodosEnvio: [
      { 
        nombre: 'Envío estándar', 
        descripcion: 'Entrega en 3-5 días laborables', 
        coste: 4.99,
        tiempoEstimado: '3-5 días'
      },
      { 
        nombre: 'Envío express', 
        descripcion: 'Entrega en 24-48 horas', 
        coste: 9.99,
        tiempoEstimado: '24-48 horas'
      },
      { 
        nombre: 'Recogida en tienda', 
        descripcion: 'Recoge tu pedido en nuestra tienda física', 
        coste: 0,
        tiempoEstimado: 'Mismo día'
      }
    ],
    metodosPago: [
      {
        nombre: 'Tarjeta de crédito/débito',
        descripcion: 'Pago seguro con tarjeta',
        comision: 0
      },
      {
        nombre: 'PayPal',
        descripcion: 'Pago rápido y seguro con PayPal',
        comision: 1.5
      },
      {
        nombre: 'Transferencia bancaria',
        descripcion: 'Pago mediante transferencia bancaria',
        comision: 0
      },
      {
        nombre: 'Contra reembolso',
        descripcion: 'Paga al recibir tu pedido',
        comision: 2
      }
    ]
  });

  // Cambiar pestaña
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Manejar guardar configuración
  const handleSave = () => {
    // Aquí implementaríamos la lógica para guardar la configuración
    // Por ahora, solo mostramos un mensaje de éxito
    setSnackbarMessage('Configuración guardada correctamente');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  // Manejar cierre del snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Manejar añadir tipo de IVA
  const handleAddTax = () => {
    setFormData({
      ...formData,
      tiposIVA: [...formData.tiposIVA, { nombre: '', porcentaje: 0 }]
    });
  };

  // Manejar eliminar tipo de IVA
  const handleRemoveTax = (index) => {
    const updatedTiposIVA = [...formData.tiposIVA];
    updatedTiposIVA.splice(index, 1);
    setFormData({
      ...formData,
      tiposIVA: updatedTiposIVA
    });
  };

  // Manejar cambio en tipo de IVA
  const handleTaxChange = (index, field, value) => {
    const updatedTiposIVA = [...formData.tiposIVA];
    updatedTiposIVA[index][field] = value;
    setFormData({
      ...formData,
      tiposIVA: updatedTiposIVA
    });
  };

  // Manejar añadir método de envío
  const handleAddShippingMethod = () => {
    setFormData({
      ...formData,
      metodosEnvio: [...formData.metodosEnvio, { 
        nombre: 'Nuevo método de envío', 
        descripcion: '', 
        coste: 0,
        tiempoEstimado: ''
      }]
    });
  };

  // Manejar eliminar método de envío
  const handleRemoveShippingMethod = (index) => {
    const updatedMetodosEnvio = [...formData.metodosEnvio];
    updatedMetodosEnvio.splice(index, 1);
    setFormData({
      ...formData,
      metodosEnvio: updatedMetodosEnvio
    });
  };

  // Manejar añadir método de pago
  const handleAddPaymentMethod = () => {
    setFormData({
      ...formData,
      metodosPago: [...formData.metodosPago, { 
        nombre: 'Nuevo método de pago', 
        descripcion: '', 
        comision: 0
      }]
    });
  };

  // Manejar eliminar método de pago
  const handleRemovePaymentMethod = (index) => {
    const updatedMetodosPago = [...formData.metodosPago];
    updatedMetodosPago.splice(index, 1);
    setFormData({
      ...formData,
      metodosPago: updatedMetodosPago
    });
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ color: 'white', mb: 3 }}>
        Configuración del Sistema
      </Typography>
      
      <Paper 
        elevation={0}
        sx={{ 
          backgroundColor: '#1e2a38',
          border: '1px solid #2d3748',
          borderRadius: 2,
          mb: 3
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: '#2d3748' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#e53935',
              },
              '& .MuiTab-root': {
                color: '#a0aec0',
                '&.Mui-selected': {
                  color: 'white',
                },
              },
              px: 2,
              pt: 1
            }}
          >
            <Tab 
              label="General" 
              icon={<SettingsIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Impuestos y Facturación" 
              icon={<ReceiptIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Envíos y Pagos" 
              icon={<ShippingIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <ConfiguracionGeneral 
              formData={formData}
              handleChange={handleChange}
              handleSave={handleSave}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <ConfiguracionImpuestos 
              formData={formData}
              handleChange={handleChange}
              handleSave={handleSave}
              handleAddTax={handleAddTax}
              handleRemoveTax={handleRemoveTax}
              handleTaxChange={handleTaxChange}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <ConfiguracionEnviosPagos 
              formData={formData}
              handleChange={handleChange}
              handleSave={handleSave}
              handleAddShippingMethod={handleAddShippingMethod}
              handleRemoveShippingMethod={handleRemoveShippingMethod}
              handleAddPaymentMethod={handleAddPaymentMethod}
              handleRemovePaymentMethod={handleRemovePaymentMethod}
            />
          </TabPanel>
        </Box>
      </Paper>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ConfiguracionPage;
