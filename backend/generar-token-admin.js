import PocketBase from 'pocketbase';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Obtener el directorio actual en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de PocketBase
const pocketbaseConfig = {
  url: 'http://127.0.0.1:8090',
  admin: {
    email: 'yo@mail.com',
    password: 'Ninami12$ya'
  }
};

// Instancia de PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

// Función para generar un token de administrador
async function generarTokenAdmin() {
  try {
    console.log(`🔑 Autenticando como administrador (${pocketbaseConfig.admin.email})...`);
    
    // Autenticar como administrador
    const adminData = await pb.admins.authWithPassword(
      pocketbaseConfig.admin.email,
      pocketbaseConfig.admin.password
    );
    
    console.log('✅ Autenticación exitosa como administrador');
    console.log('📝 Token JWT generado:');
    console.log(pb.authStore.token);
    
    // Guardar el token en un archivo .env para el MCP
    const envContent = `# PocketBase API URL (required)
POCKETBASE_URL=http://127.0.0.1:8090

# Admin token for authentication (required)
POCKETBASE_ADMIN_TOKEN=${pb.authStore.token}

# Admin credentials (as fallback)
POCKETBASE_ADMIN_EMAIL=${pocketbaseConfig.admin.email}
POCKETBASE_ADMIN_PASSWORD=${pocketbaseConfig.admin.password}
`;
    
    const envPath = path.join(__dirname, 'advanced-pocketbase-mcp', '.env');
    fs.writeFileSync(envPath, envContent);
    
    console.log(`✅ Token guardado en ${envPath}`);
    
    // Actualizar también el archivo mcp_config.json
    const mcpConfigPath = 'c:\\Users\\USER\\.codeium\\windsurf\\mcp_config.json';
    if (fs.existsSync(mcpConfigPath)) {
      const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      
      if (mcpConfig.mcpServers && mcpConfig.mcpServers['pocketbase-server']) {
        mcpConfig.mcpServers['pocketbase-server'].env = {
          POCKETBASE_URL: 'http://127.0.0.1:8090',
          POCKETBASE_ADMIN_TOKEN: pb.authStore.token,
          POCKETBASE_ADMIN_EMAIL: pocketbaseConfig.admin.email,
          POCKETBASE_ADMIN_PASSWORD: pocketbaseConfig.admin.password
        };
        
        fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
        console.log(`✅ Token actualizado en ${mcpConfigPath}`);
      }
    }
    
    return pb.authStore.token;
  } catch (error) {
    console.error('❌ Error al generar token de administrador:', error.message);
    
    // Intentar autenticar como superusuario
    try {
      console.log('🔄 Intentando autenticar como superusuario...');
      
      await pb.collection('_superusers').authWithPassword(
        pocketbaseConfig.admin.email,
        pocketbaseConfig.admin.password
      );
      
      console.log('✅ Autenticación exitosa como superusuario');
      console.log('📝 Token JWT generado:');
      console.log(pb.authStore.token);
      
      // Guardar el token en un archivo .env para el MCP
      const envContent = `# PocketBase API URL (required)
POCKETBASE_URL=http://127.0.0.1:8090

# Admin token for authentication (required)
POCKETBASE_ADMIN_TOKEN=${pb.authStore.token}

# Admin credentials (as fallback)
POCKETBASE_ADMIN_EMAIL=${pocketbaseConfig.admin.email}
POCKETBASE_ADMIN_PASSWORD=${pocketbaseConfig.admin.password}
`;
      
      const envPath = path.join(__dirname, 'advanced-pocketbase-mcp', '.env');
      fs.writeFileSync(envPath, envContent);
      
      console.log(`✅ Token guardado en ${envPath}`);
      
      // Actualizar también el archivo mcp_config.json
      const mcpConfigPath = 'c:\\Users\\USER\\.codeium\\windsurf\\mcp_config.json';
      if (fs.existsSync(mcpConfigPath)) {
        const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
        
        if (mcpConfig.mcpServers && mcpConfig.mcpServers['pocketbase-server']) {
          mcpConfig.mcpServers['pocketbase-server'].env = {
            POCKETBASE_URL: 'http://127.0.0.1:8090',
            POCKETBASE_ADMIN_TOKEN: pb.authStore.token,
            POCKETBASE_ADMIN_EMAIL: pocketbaseConfig.admin.email,
            POCKETBASE_ADMIN_PASSWORD: pocketbaseConfig.admin.password
          };
          
          fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
          console.log(`✅ Token actualizado en ${mcpConfigPath}`);
        }
      }
      
      return pb.authStore.token;
    } catch (superUserError) {
      console.error('❌ Error al autenticar como superusuario:', superUserError.message);
      throw error;
    }
  }
}

// Ejecutar la función principal
generarTokenAdmin().catch(error => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});
