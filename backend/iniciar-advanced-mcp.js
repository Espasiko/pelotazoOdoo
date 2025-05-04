import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Obtener el directorio actual en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al directorio del MCP avanzado
const mcpDir = path.join(__dirname, 'advanced-pocketbase-mcp');
const envPath = path.join(mcpDir, '.env');

// Cargar variables de entorno desde el archivo .env
if (fs.existsSync(envPath)) {
  console.log(`📝 Cargando variables de entorno desde ${envPath}...`);
  dotenv.config({ path: envPath });
} else {
  console.error(`❌ No se encontró el archivo .env en ${envPath}`);
  process.exit(1);
}

// Verificar que las variables de entorno necesarias estén definidas
const requiredEnvVars = ['POCKETBASE_URL'];
const optionalEnvVars = ['POCKETBASE_ADMIN_TOKEN', 'POCKETBASE_ADMIN_EMAIL', 'POCKETBASE_ADMIN_PASSWORD'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Variable de entorno requerida no definida: ${envVar}`);
    process.exit(1);
  }
}

// Verificar las variables opcionales
let authMethod = 'ninguna';
if (process.env.POCKETBASE_ADMIN_TOKEN) {
  authMethod = 'token';
  console.log('✅ Se usará autenticación por token de administrador');
} else if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
  authMethod = 'credenciales';
  console.log('✅ Se usará autenticación por credenciales de administrador');
} else {
  console.warn('⚠️ No se ha definido un método de autenticación (token o credenciales)');
}

// Puerto para el servidor MCP
const MCP_PORT = 3333;

// Configurar el entorno para el proceso hijo
const env = {
  ...process.env,
  MCP_PORT: MCP_PORT.toString(),
  NODE_ENV: 'production'
};

// Ruta al archivo JavaScript compilado
const indexJsPath = path.join(mcpDir, 'build', 'index.js');

if (!fs.existsSync(indexJsPath)) {
  console.error(`❌ No se encontró el archivo index.js en ${indexJsPath}`);
  console.log('⚙️ Asegúrate de haber compilado el código TypeScript a JavaScript');
  process.exit(1);
}

console.log('🚀 Iniciando servidor MCP avanzado...');
console.log(`📌 URL de PocketBase: ${process.env.POCKETBASE_URL}`);
console.log(`📌 Método de autenticación: ${authMethod}`);
console.log(`📌 Puerto del MCP: ${MCP_PORT}`);

// Iniciar el proceso del MCP server
const mcpProcess = spawn('node', [indexJsPath], {
  env,
  cwd: mcpDir,
  stdio: 'pipe' // Capturar stdout y stderr
});

// Manejar la salida estándar
mcpProcess.stdout.on('data', (data) => {
  console.log(`📤 MCP: ${data.toString().trim()}`);
});

// Manejar la salida de error
mcpProcess.stderr.on('data', (data) => {
  console.error(`❌ MCP Error: ${data.toString().trim()}`);
});

// Manejar la finalización del proceso
mcpProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ El servidor MCP se ha cerrado correctamente');
  } else {
    console.error(`❌ El servidor MCP se ha cerrado con código de error: ${code}`);
  }
});

// Manejar errores en el proceso
mcpProcess.on('error', (err) => {
  console.error('❌ Error al iniciar el servidor MCP:', err.message);
});

console.log(`✅ Servidor MCP iniciado en el puerto ${MCP_PORT}`);
console.log('🔍 Para detener el servidor, presiona Ctrl+C');

// Manejar la señal de interrupción (Ctrl+C)
process.on('SIGINT', () => {
  console.log('🛑 Deteniendo el servidor MCP...');
  mcpProcess.kill();
  process.exit(0);
});
