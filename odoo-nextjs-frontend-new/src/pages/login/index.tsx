import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AUTH_KEY } from "../../authProvider";

const Login: React.FC = () => {
  const [username, setUsername] = useState("admin"); // Valor por defecto para facilitar pruebas
  const [password, setPassword] = useState("admin"); // Valor por defecto para facilitar pruebas
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem(AUTH_KEY);
      if (authData) {
        try {
          const { token } = JSON.parse(authData);
          if (token) {
            // Si ya hay un token válido, redirigir al dashboard
            navigate("/");
          }
        } catch (error) {
          // Si hay un error al parsear el token, eliminarlo
          localStorage.removeItem(AUTH_KEY);
        }
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log("Intentando login con:", { username, password });
      
      // Realizar la petición de login al middleware FastAPI
      const response = await axios.post("http://localhost:8000/api/v1/auth/login", {
        username,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log("Respuesta de login:", response.data);

      // Guardar el token en localStorage
      if (response.data && response.data.access_token) {
        localStorage.setItem(
          AUTH_KEY,
          JSON.stringify({
            token: response.data.access_token,
            user: {
              username,
              id: response.data.user_id,
              name: response.data.name,
            },
          })
        );

        console.log("Token guardado correctamente");

        // Redirigir al dashboard
        navigate("/");
      } else {
        console.error("Respuesta sin access_token:", response.data);
        setError("Respuesta de autenticación inválida: falta el token de acceso");
      }
    } catch (error: any) {
      console.error("Error de autenticación:", error);
      
      // Mostrar mensaje de error más detallado si está disponible
      if (error.response && error.response.data && error.response.data.error) {
        setError(`Error: ${error.response.data.error}`);
      } else {
        setError("Credenciales incorrectas o servidor no disponible. Por favor, inténtelo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">El Pelotazo</h1>
          <p className="mt-2 text-gray-600">Panel de Administración</p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-md">
            <p className="text-sm">
              <strong>Credenciales de acceso:</strong><br />
              Usuario: admin<br />
              Contraseña: admin
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Usuario
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
