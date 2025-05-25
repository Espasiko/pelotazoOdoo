import React, { useState, useEffect } from "react";
import axios from "axios";

// Definición de tipos para los productos
interface Product {
  id: number;
  name: string;
  price: number;
  x_nombre_proveedor?: string;
  x_marca?: string;
}

export const Dashboard: React.FC = () => {
  // Estado para productos y carga
  const [productsData, setProductsData] = useState<{
    data: Product[];
    total: number;
  }>({ data: [], total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos directamente desde la API de Odoo
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Obtener token del localStorage (asumiendo que el usuario ya está autenticado)
        const token = localStorage.getItem("auth");
        if (!token) {
          console.error("No hay token de autenticación");
          setIsLoading(false);
          return;
        }

        const parsedToken = JSON.parse(token);
        
        // Realizar la petición a la API de Odoo
        const response = await axios.get("http://localhost:8000/api/v1/products", {
          headers: {
            Authorization: `Bearer ${parsedToken.token}`,
          },
          params: {
            limit: 5,
          },
        });

        // Actualizar el estado con los datos recibidos
        setProductsData({
          data: response.data.data || [],
          total: response.data.total || 0,
        });
      } catch (error) {
        console.error("Error al cargar productos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Calcular estadísticas
  const totalProducts = productsData?.total || 0;
  const totalProveedores = productsData?.data
    ? [...new Set(productsData.data.map((product) => product.x_nombre_proveedor).filter(Boolean))].length
    : 0;
  const totalMarcas = productsData?.data
    ? [...new Set(productsData.data.map((product) => product.x_marca).filter(Boolean))].length
    : 0;
  
  // Calcular precio promedio
  const precioPromedio = productsData?.data && productsData.data.length > 0
    ? productsData.data.reduce((sum, product) => sum + (product.price || 0), 0) / productsData.data.length
    : 0;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard El Pelotazo</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <h3 className="text-gray-500 text-sm font-medium">Total Productos</h3>
              <p className="text-3xl font-bold">{totalProducts}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <h3 className="text-gray-500 text-sm font-medium">Total Proveedores</h3>
              <p className="text-3xl font-bold">{totalProveedores}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
              <h3 className="text-gray-500 text-sm font-medium">Total Marcas</h3>
              <p className="text-3xl font-bold">{totalMarcas}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <h3 className="text-gray-500 text-sm font-medium">Precio Promedio</h3>
              <p className="text-3xl font-bold">{precioPromedio.toFixed(2)} €</p>
            </div>
          </div>
          
          {/* Enlaces rápidos */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold mb-4">Enlaces Rápidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a 
                href="/products" 
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                <div className="mr-4 bg-blue-500 rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Gestionar Productos</h3>
                  <p className="text-sm text-gray-600">Ver y editar productos</p>
                </div>
              </a>
              
              <a 
                href="#" 
                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100"
              >
                <div className="mr-4 bg-green-500 rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Importar Datos</h3>
                  <p className="text-sm text-gray-600">Importar desde Excel/JSON</p>
                </div>
              </a>
              
              <a 
                href="#" 
                className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100"
              >
                <div className="mr-4 bg-purple-500 rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Informes</h3>
                  <p className="text-sm text-gray-600">Ver estadísticas y reportes</p>
                </div>
              </a>
            </div>
          </div>
          
          {/* Últimos productos */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Últimos Productos</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b">Nombre</th>
                    <th className="py-2 px-4 border-b">Precio</th>
                    <th className="py-2 px-4 border-b">Proveedor</th>
                    <th className="py-2 px-4 border-b">Beneficio</th>
                    <th className="py-2 px-4 border-b">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productsData?.data.slice(0, 5).map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{product.name}</td>
                      <td className="py-2 px-4 border-b">{product.price} €</td>
                      <td className="py-2 px-4 border-b">{product.x_nombre_proveedor || 'No especificado'}</td>
                      <td className="py-2 px-4 border-b">{product.price} €</td>
                      <td className="py-2 px-4 border-b">
                        <a 
                          href={`/products/${product.id}`} 
                          className="text-blue-500 hover:underline"
                        >
                          Ver detalles
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
