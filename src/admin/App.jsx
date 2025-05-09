import React from 'react';
import { Refine } from '@refinedev/core';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import {
  ErrorComponent,
  notificationProvider,
  RefineSnackbarProvider,
  ThemedLayoutV2,
} from '@refinedev/mui';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { Route, Routes, Navigate } from 'react-router-dom';
import routerBindings, { NavigateToResource, UnsavedChangesNotifier } from '@refinedev/react-router-v6';
import { dataProvider } from './dataProvider';
import { authProvider } from './authProvider';
import AdminLogin from './AdminLogin';

// Importar componentes de layout
import Layout from './components/layout/Layout';
import Header from './components/layout/Header';
import Sider from './components/layout/Sider';
import Footer from './components/layout/Footer';

// Importar componentes de páginas
import Dashboard from './components/dashboard/Dashboard';
import Productos from './components/productos/Productos';
import Categorias from './components/categorias/Categorias';
import Marcas from './components/marcas/Marcas';
import { ClientesList } from './components/clientes';
import { PedidosList } from './components/pedidos';
import { FacturacionList } from './components/facturacion';
import FacturaPdfPage from './components/facturacion/FacturaPdfPage.jsx'; 
import { ImportadorPage } from './components/importacion';
import { ConfiguracionPage } from './components/configuracion';

const isAuthenticated = () => {
  const authData = localStorage.getItem('pelotazo_auth');
  if (!authData) return false;
  try {
    const parsed = JSON.parse(authData);
    return !!parsed.token;
  } catch {
    return false;
  }
};

const AdminApp = () => {
  return (
    <RefineKbarProvider>
      <RefineSnackbarProvider>
        <CssBaseline />
        <GlobalStyles styles={{ html: { WebkitFontSmoothing: "auto" } }} />
        {isAuthenticated() ? (
          <Refine
            dataProvider={dataProvider}
            notificationProvider={notificationProvider}
            routerProvider={routerBindings}
            authProvider={authProvider}
            resources={[
              {
                name: "dashboard",
                list: "dashboard",
                meta: {
                  label: "Dashboard",
                  icon: "Dashboard",
                },
              },
              {
                name: "productos",
                list: "productos",
                meta: {
                  label: "Productos",
                  icon: "Inventory",
                },
              },
              {
                name: "categorias",
                list: "categorias",
                meta: {
                  label: "Categorías",
                  icon: "Category",
                },
              },
              {
                name: "marcas",
                list: "marcas",
                meta: {
                  label: "Marcas",
                  icon: "Bookmark",
                },
              },
              {
                name: "clientes",
                list: "clientes",
                meta: {
                  label: "Clientes",
                  icon: "People",
                },
              },
              {
                name: "pedidos",
                list: "pedidos",
                meta: {
                  label: "Pedidos",
                  icon: "ShoppingCart",
                },
              },
              {
                name: "facturacion",
                list: "facturacion",
                meta: {
                  label: "Facturación",
                  icon: "Receipt",
                },
              },
              {
                name: "importacion",
                list: "importacion",
                meta: {
                  label: "Importación",
                  icon: "Upload",
                },
              },
              {
                name: "configuracion",
                list: "configuracion",
                meta: {
                  label: "Configuración",
                  icon: "Settings",
                },
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
              reactQuery: {
                devtoolConfig: false,
              },
            }}
          >
            <ThemedLayoutV2
              Header={Header}
              Sider={Sider}
              Footer={Footer}
              Title={() => <div>El Pelotazo</div>}
            >
              <Routes>
                <Route index element={<Navigate to="dashboard" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="productos" element={<Productos />} />
                <Route path="categorias" element={<Categorias />} />
                <Route path="marcas" element={<Marcas />} />
                <Route path="clientes" element={<ClientesList />} />
                <Route path="pedidos" element={<PedidosList />} />
                <Route path="facturacion" element={<FacturacionList />} />
                <Route path="factura-pdf" element={<FacturaPdfPage />} />
                <Route path="importacion" element={<ImportadorPage />} />
                <Route path="configuracion" element={<ConfiguracionPage />} />
                <Route path="*" element={<Navigate to="dashboard" />} />
              </Routes>
            </ThemedLayoutV2>
            <RefineKbar />
            <UnsavedChangesNotifier />
          </Refine>
        ) : (
          <AdminLogin />
        )}
      </RefineSnackbarProvider>
    </RefineKbarProvider>
  );
};

export default AdminApp;