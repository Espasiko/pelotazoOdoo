import React, { useEffect, useState } from "react";
import { Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";

import routerBindings, {
  NavigateToResource,
} from "@refinedev/react-router";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import { authProvider, AUTH_KEY } from "./authProvider";
import { dataProvider } from "./dataProvider";

// Importar los componentes reales
import Dashboard from "./pages/dashboard";
import ProductList from "./pages/products";
import ProductShow from "./pages/products/show";
import Login from "./pages/login";

// Componente para proteger rutas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const checkAuth = async () => {
      try {
        const authData = localStorage.getItem(AUTH_KEY);
        if (authData) {
          const { token } = JSON.parse(authData);
          if (token) {
            setIsAuthenticated(true);
            return;
          }
        }
        setIsAuthenticated(false);
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Renderizar los hijos si está autenticado
  return <>{children}</>;
};

// Componente de aplicación principal con enfoque mínimo
function App() {
  return (
    <BrowserRouter>
      <DevtoolsProvider>
        <Refine
          dataProvider={dataProvider}
          routerProvider={routerBindings}
          authProvider={authProvider}
          resources={[
            {
              name: "dashboard",
              list: "/",
            },
            {
              name: "products",
              list: "/products",
              show: "/products/:id",
            },
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: false,
            useNewQueryKeys: true,
            projectId: "pelotazo-admin",
            disableTelemetry: true,
          }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route index element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute>
                <ProductList />
              </ProtectedRoute>
            } />
            <Route path="/products/:id" element={
              <ProtectedRoute>
                <ProductShow />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Refine>
        <DevtoolsPanel />
      </DevtoolsProvider>
    </BrowserRouter>
  );
}

export default App;
