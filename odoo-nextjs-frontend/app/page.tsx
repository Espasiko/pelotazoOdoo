import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <main className="flex flex-col items-center max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Integración de Odoo con Next.js y React</h1>
        
        <p className="text-xl mb-12 text-center max-w-3xl">
          Ejemplo de aplicación que integra Odoo como backend con Next.js y React como frontend
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
            <div className="bg-blue-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-center">Productos</h2>
            <p className="text-gray-600 mb-4 text-center">Gestiona los productos de tu catálogo de Odoo</p>
            <Link href="/products" className="text-blue-500 hover:underline block text-center">
              Ver productos →
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
            <div className="bg-green-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-center">Clientes</h2>
            <p className="text-gray-600 mb-4 text-center">Administra los clientes de tu sistema Odoo</p>
            <Link href="#" className="text-green-500 hover:underline block text-center">
              Ver clientes →
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
            <div className="bg-purple-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-center">Ventas</h2>
            <p className="text-gray-600 mb-4 text-center">Consulta y gestiona tus órdenes de venta</p>
            <Link href="#" className="text-purple-500 hover:underline block text-center">
              Ver ventas →
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
          <h2 className="text-2xl font-bold mb-4">Sobre esta integración</h2>
          <p className="mb-4">
            Esta aplicación demuestra cómo integrar Odoo con Next.js y React para crear una interfaz moderna 
            y personalizada que se comunica con el backend de Odoo.
          </p>
          <p className="mb-4">Características principales:</p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">Autenticación con el backend de Odoo</li>
            <li className="mb-2">Consulta de datos usando React Query</li>
            <li className="mb-2">Operaciones CRUD en modelos de Odoo</li>
            <li className="mb-2">Interfaz de usuario moderna con Tailwind CSS</li>
          </ul>
          <div className="mt-6">
            <a 
              href="https://github.com/odoo/odoo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline inline-flex items-center"
            >
              Ver repositorio de Odoo en GitHub
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
