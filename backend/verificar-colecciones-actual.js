// Script para verificar colecciones y relaciones en PocketBase
// Ejecutar en WSL con: node verificar-colecciones-actual.js

const POCKETBASE_URL = "http://127.0.0.1:8090";
const ADMIN_EMAIL = "yo@mail.com";
const ADMIN_PASSWORD = "Ninami12$ya";

async function verificarColecciones() {
  console.log("Verificando colecciones en PocketBase...");
  
  try {
    // 1. Autenticación como admin
    console.log("Autenticando como administrador...");
    const authResponse = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });
    
    if (!authResponse.ok) {
      throw new Error(`Error de autenticación: ${authResponse.status} ${authResponse.statusText}`);
    }
    
    const authData = await authResponse.json();
    const adminToken = authData.token;
    
    console.log("✅ Autenticación exitosa");
    
    // 2. Listar colecciones
    console.log("\nObteniendo lista de colecciones...");
    const collectionsResponse = await fetch(`${POCKETBASE_URL}/api/collections`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (!collectionsResponse.ok) {
      throw new Error(`Error al obtener colecciones: ${collectionsResponse.status} ${collectionsResponse.statusText}`);
    }
    
    const collectionsData = await collectionsResponse.json();
    const collections = collectionsData.items || [];
    
    console.log(`✅ Se encontraron ${collections.length} colecciones`);
    
    // 3. Verificar colecciones esperadas
    const expectedCollections = [
      "productos", "categorias", "proveedores", "clientes", 
      "facturas", "lineas_factura", "eventos_facturacion", 
      "importaciones", "gastos", "ingresos"
    ];
    
    console.log("\nVerificando colecciones esperadas:");
    const existingCollections = collections.map(c => c.name);
    const missingCollections = expectedCollections.filter(c => !existingCollections.includes(c));
    
    if (missingCollections.length > 0) {
      console.log(`❌ Faltan las siguientes colecciones: ${missingCollections.join(", ")}`);
    } else {
      console.log("✅ Todas las colecciones esperadas existen");
    }
    
    // 4. Verificar relaciones
    console.log("\nVerificando relaciones entre colecciones:");
    const expectedRelations = [
      { collection: "productos", field: "proveedor", target: "proveedores" },
      { collection: "productos", field: "categoria", target: "categorias" },
      { collection: "facturas", field: "cliente", target: "clientes" },
      { collection: "facturas", field: "origen_importacion", target: "importaciones" },
      { collection: "lineas_factura", field: "factura", target: "facturas" },
      { collection: "lineas_factura", field: "producto", target: "productos" },
      { collection: "eventos_facturacion", field: "factura", target: "facturas" },
      { collection: "gastos", field: "proveedor", target: "proveedores" }
    ];
    
    const relationResults = [];
    
    for (const relation of expectedRelations) {
      const collection = collections.find(c => c.name === relation.collection);
      if (!collection) {
        relationResults.push({
          ...relation,
          status: "ERROR",
          message: `Colección ${relation.collection} no encontrada`
        });
        continue;
      }
      
      const schema = collection.schema;
      const field = schema.find(f => f.name === relation.field);
      
      if (!field) {
        relationResults.push({
          ...relation,
          status: "ERROR",
          message: `Campo ${relation.field} no encontrado en ${relation.collection}`
        });
        continue;
      }
      
      if (field.type !== "relation") {
        relationResults.push({
          ...relation,
          status: "ERROR",
          message: `Campo ${relation.field} no es de tipo relación`
        });
        continue;
      }
      
      const targetCollection = collections.find(c => c.id === field.options?.collectionId);
      if (!targetCollection) {
        relationResults.push({
          ...relation,
          status: "ERROR",
          message: `Colección destino no encontrada para ${relation.field}`
        });
        continue;
      }
      
      if (targetCollection.name !== relation.target) {
        relationResults.push({
          ...relation,
          status: "ERROR",
          message: `Relación apunta a ${targetCollection.name} en lugar de ${relation.target}`
        });
        continue;
      }
      
      relationResults.push({
        ...relation,
        status: "OK",
        message: `Relación correcta: ${relation.collection}.${relation.field} -> ${relation.target}`
      });
    }
    
    // Mostrar resultados de relaciones
    const okRelations = relationResults.filter(r => r.status === "OK");
    const errorRelations = relationResults.filter(r => r.status === "ERROR");
    
    console.log(`✅ ${okRelations.length} relaciones correctas`);
    if (errorRelations.length > 0) {
      console.log(`❌ ${errorRelations.length} relaciones con problemas:`);
      errorRelations.forEach(r => {
        console.log(`   - ${r.message}`);
      });
    }
    
    // Resumen final
    console.log("\n=== RESUMEN ===");
    console.log(`Total colecciones: ${collections.length}`);
    console.log(`Colecciones esperadas: ${expectedCollections.length}`);
    console.log(`Colecciones faltantes: ${missingCollections.length}`);
    console.log(`Relaciones correctas: ${okRelations.length}`);
    console.log(`Relaciones con problemas: ${errorRelations.length}`);
    
    if (missingCollections.length === 0 && errorRelations.length === 0) {
      console.log("\n✅✅✅ VERIFICACIÓN EXITOSA: Todas las colecciones y relaciones están correctas");
    } else {
      console.log("\n⚠️ VERIFICACIÓN COMPLETADA CON ADVERTENCIAS: Revisa los detalles anteriores");
    }
    
  } catch (error) {
    console.error("❌ ERROR:", error.message);
  }
}

// Ejecutar la verificación
verificarColecciones();
