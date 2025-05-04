import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Leer el archivo JSON con las definiciones de las colecciones
const coleccionesJSON = JSON.parse(fs.readFileSync('./colecciones-definicion.json', 'utf8'));

// Función para ejecutar un comando MCP (formato JSON-RPC 2.0)
function ejecutarComandoMCP(metodo, params) {
  return new Promise((resolve, reject) => {
    const proceso = spawn('node', [
      path.resolve('./pocketbase-mcp/build/index.js')
    ], {
      env: {
        ...process.env,
        POCKETBASE_URL: 'http://127.0.0.1:8090',
        POCKETBASE_ADMIN_EMAIL: 'yo@mail.com',
        POCKETBASE_ADMIN_PASSWORD: 'Ninami12$ya'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proceso.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(data.toString());
    });

    proceso.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(data.toString());
    });

    proceso.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Error en el comando MCP: ${stderr}`));
      }
    });

    // Crear mensaje en formato JSON-RPC 2.0
    const mensaje = {
      jsonrpc: "2.0",
      method: metodo,
      params: params,
      id: 1
    };

    // Enviar el comando al proceso
    proceso.stdin.write(JSON.stringify(mensaje) + '\n');
    proceso.stdin.end();
  });
}

// Función principal
async function main() {
  console.log('🚀 Iniciando creación de colecciones con MCP...');

  try {
    // Crear cada colección
    for (const coleccion of coleccionesJSON.collections) {
      console.log(`📦 Creando colección "${coleccion.name}"...`);
      
      try {
        // Comando para crear la colección en formato JSON-RPC 2.0
        await ejecutarComandoMCP("create_collection", {
          name: coleccion.name,
          type: 'base'
        });
        console.log(`✅ Colección "${coleccion.name}" creada exitosamente`);
      } catch (error) {
        console.error(`⚠️ Error al crear colección "${coleccion.name}": ${error.message}`);
        console.log('Intentando continuar con los campos...');
      }
      
      // Crear cada campo de la colección
      for (const campo of coleccion.schema) {
        console.log(`📋 Creando campo "${campo.name}" en colección "${coleccion.name}"...`);
        
        try {
          // Comando para crear el campo en formato JSON-RPC 2.0
          await ejecutarComandoMCP("create_field", {
            collection_name: coleccion.name,
            field: {
              name: campo.name,
              type: campo.type,
              required: campo.required,
              options: campo.options || {}
            }
          });
          console.log(`✅ Campo "${campo.name}" creado exitosamente en colección "${coleccion.name}"`);
        } catch (error) {
          console.error(`❌ Error al crear campo "${campo.name}" en colección "${coleccion.name}": ${error.message}`);
        }
      }
    }
    
    console.log('✅ Proceso completado exitosamente');
  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
  }
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
