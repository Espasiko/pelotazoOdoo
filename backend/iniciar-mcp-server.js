import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Token de administrador generado previamente
const adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc0NjI4MjI5MywiaWQiOiJsaG42dmJtMTk3MDg3OGUiLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.iizSza8KYUgqfpX3nbYfTwooWQfGMKrsLBmPwtN1GWA";

// Ruta al ejecutable del MCP server
const mcpServerPath = path.join(__dirname, 'pocketbase-mcp', 'build', 'index.js');

// Configurar variables de entorno
const env = {
  ...process.env,
  POCKETBASE_API_URL: 'http://127.0.0.1:8090',
  POCKETBASE_ADMIN_TOKEN: adminToken
};

// Iniciar el MCP server
console.log('🚀 Iniciando MCP server para PocketBase...');
console.log(`📂 Ruta del servidor: ${mcpServerPath}`);
console.log(`🔗 URL de PocketBase: ${env.POCKETBASE_API_URL}`);
console.log(`🔑 Token de administrador configurado: ${env.POCKETBASE_ADMIN_TOKEN.substring(0, 20)}...`);

const mcpServer = spawn('node', [mcpServerPath], { 
  env,
  stdio: 'inherit' // Mostrar la salida del MCP server en la consola
});

// Manejar eventos del proceso
mcpServer.on('error', (error) => {
  console.error(`❌ Error al iniciar el MCP server: ${error.message}`);
});

mcpServer.on('close', (code) => {
  console.log(`🛑 MCP server cerrado con código: ${code}`);
});

// Manejar señales para cerrar el proceso correctamente
process.on('SIGINT', () => {
  console.log('👋 Cerrando MCP server...');
  mcpServer.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('👋 Cerrando MCP server...');
  mcpServer.kill('SIGTERM');
});

console.log('✅ MCP server iniciado correctamente');
console.log('ℹ️ Presiona Ctrl+C para detener el servidor');
