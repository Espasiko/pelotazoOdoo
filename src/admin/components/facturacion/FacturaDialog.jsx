import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  ShoppingCart as CartIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useCreate, useUpdate, useList } from '@refinedev/core';

// Importar componentes refactorizados
import FacturaGeneral from './components/FacturaGeneral';
import FacturaProductos from './components/FacturaProductos';

// Componente TabPanel para las pestañas
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`factura-tabpanel-${index}`}
      aria-labelledby={`factura-tab-${index}`}
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

export const FacturaDialog = ({ open, onClose, factura, tipoFactura = 'Normal' }) => {
  const isEditing = !!factura;
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    cliente_id: '',
    estado: 'Pendiente',
    metodo_pago: '',
    numero_factura: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
    items: [],
    tipo: tipoFactura
  });
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [newItem, setNewItem] = useState({
    producto_id: '',
    cantidad: 1,
    precio_unitario: 0
  });

  // Hooks para crear y actualizar facturas
  const { mutate: createFactura } = useCreate();
  const { mutate: updateFactura } = useUpdate();

  // Obtener lista de clientes
  const { data: clientesData } = useList({
    resource: 'clientes',
  });

  // Obtener lista de productos
  const { data: productosData } = useList({
    resource: 'productos',
  });

  // Inicializar datos cuando se abre el diálogo
  useEffect(() => {
    if (clientesData) {
      setClientes(clientesData.data || []);
    }

    if (productosData) {
      setProductos(productosData.data || []);
    }

    if (factura) {
      setFormData({
        cliente_id: factura.cliente?.id || '',
        estado: factura.estado || 'Pendiente',
        metodo_pago: factura.metodo_pago || '',
        numero_factura: factura.id || '',
        fecha: factura.fecha || new Date().toISOString().split('T')[0],
        notas: factura.notas || '',
        items: factura.items || [],
        tipo: factura.tipo || tipoFactura
      });
    } else {
      // Resetear formulario para nueva factura
      setFormData({
        cliente_id: '',
        estado: 'Pendiente',
        metodo_pago: '',
        numero_factura: tipoFactura === 'Normal' ? `F-${new Date().getFullYear()}-` : `FE-${new Date().getFullYear()}-`,
        fecha: new Date().toISOString().split('T')[0],
        notas: '',
        items: [],
        tipo: tipoFactura
      });
    }

    // Resetear pestaña activa
    setTabValue(0);
  }, [factura, open, clientesData, productosData, tipoFactura]);

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

  // Manejar cambios en el nuevo ítem
  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'producto_id') {
      const producto = productos.find(p => p.id === value);
      setNewItem({
        ...newItem,
        producto_id: value,
        precio_unitario: producto ? producto.precio : 0
      });
    } else {
      setNewItem({
        ...newItem,
        [name]: value
      });
    }
  };

  // Añadir ítem a la factura
  const handleAddItem = () => {
    if (!newItem.producto_id) return;

    const producto = productos.find(p => p.id === newItem.producto_id);
    
    const item = {
      ...newItem,
      producto: producto,
      subtotal: newItem.cantidad * newItem.precio_unitario
    };

    setFormData({
      ...formData,
      items: [...formData.items, item]
    });

    // Resetear nuevo ítem
    setNewItem({
      producto_id: '',
      cantidad: 1,
      precio_unitario: 0
    });
  };

  // Eliminar ítem de la factura
  const handleRemoveItem = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  // Calcular total de la factura
  const calcularTotal = () => {
    return formData.items.reduce((total, item) => total + (item.cantidad * item.precio_unitario), 0);
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    const facturaData = {
      ...formData,
      total: calcularTotal()
    };

    if (isEditing) {
      // Actualizar factura existente
      updateFactura({
        resource: 'facturas',
        id: factura.id,
        values: facturaData,
      }, {
        onSuccess: () => {
          onClose();
        }
      });
    } else {
      // Crear nueva factura
      createFactura({
        resource: 'facturas',
        values: facturaData,
      }, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };

  // Datos de ejemplo para clientes
  const clientesEjemplo = [
    { id: '1', nombre: 'Juan', apellidos: 'Pérez', email: 'juan@example.com' },
    { id: '2', nombre: 'María', apellidos: 'López', email: 'maria@example.com' },
    { id: '3', nombre: 'Carlos', apellidos: 'Rodríguez', email: 'carlos@example.com' },
    { id: '4', nombre: 'Ana', apellidos: 'Martínez', email: 'ana@example.com' },
    { id: '5', nombre: 'Pedro', apellidos: 'Sánchez', email: 'pedro@example.com' },
    { id: '6', nombre: 'Empresa A', apellidos: 'S.L.', email: 'info@empresaa.com', nif: 'B12345678' },
    { id: '7', nombre: 'Empresa B', apellidos: 'S.A.', email: 'info@empresab.com', nif: 'A87654321' }
  ];

  // Datos de ejemplo para productos
  const productosEjemplo = [
    { id: '1', nombre: 'Frigorífico Samsung RT38', precio: 899.99 },
    { id: '2', nombre: 'Televisor LG 43UQ75', precio: 499.50 },
    { id: '3', nombre: 'Microondas Cecotec ProClean 6010', precio: 89.99 },
    { id: '4', nombre: 'Lavadora Balay 3TS992B', precio: 449.00 },
    { id: '5', nombre: 'Cafetera Delonghi Magnifica', precio: 329.99 }
  ];

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
          {isEditing ? `Editar Factura: ${factura?.id}` : `Nueva Factura ${tipoFactura}`}
        </DialogTitle>
        <DialogContent>
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
              }}
            >
              <Tab label="Información General" icon={<ReceiptIcon />} iconPosition="start" />
              <Tab label="Productos" icon={<CartIcon />} iconPosition="start" />
            </Tabs>
          </Box>

          {/* Pestaña de Información General */}
          <TabPanel value={tabValue} index={0}>
            <FacturaGeneral 
              formData={formData} 
              handleChange={handleChange} 
              clientes={clientesEjemplo} 
            />
          </TabPanel>

          {/* Pestaña de Productos */}
          <TabPanel value={tabValue} index={1}>
            <FacturaProductos 
              formData={formData}
              newItem={newItem}
              productos={productosEjemplo}
              handleNewItemChange={handleNewItemChange}
              handleAddItem={handleAddItem}
              handleRemoveItem={handleRemoveItem}
              calcularTotal={calcularTotal}
            />
          </TabPanel>
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

export default FacturaDialog;
