// Restaurar el script para usar el JSON principal y probar la actualización de relaciones con la nueva versión de PocketBase
import PocketBase from 'pocketbase';
import fs from 'fs';

const pb = new PocketBase('http://127.0.0.1:8090');
const ADMIN_EMAIL = 'yo@mail.com';
const ADMIN_PASS = 'Ninami12$ya';
const JSON_PATH = './colecciones-pocketbase-import.json';

async function main() {
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
  const coleccionesDef = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

  // 1. Crear colecciones sin campos de relación
  for (const colDef of coleccionesDef) {
    const camposNoRelacion = colDef.fields.filter(f => f.type !== 'relation');
    try {
      await pb.collections.create({
        name: colDef.name,
        type: colDef.type,
        fields: camposNoRelacion
      });
      console.log(`Colección creada: ${colDef.name}`);
    } catch (e) {
      console.log(`Colección ya existe: ${colDef.name}`);
    }
  }

  // 2. Obtener IDs reales de las colecciones
  const existentes = await pb.collections.getFullList();
  const colIdMap = {};
  for (const col of existentes) {
    colIdMap[col.name] = col.id;
  }

  // 3. Para cada colección, reconstruir el array de campos desde el JSON, sustituyendo collectionId por el real y forzando string y required
  for (const colDef of coleccionesDef) {
    const col = existentes.find(c => c.name === colDef.name);
    if (!col) continue;
    // Reconstruir el array de campos
    const nuevosCampos = colDef.fields.map(f => {
      if (f.type === 'relation' && f.options && f.options.collectionId && colIdMap[f.options.collectionId]) {
        return {
          ...f,
          required: typeof f.required === 'boolean' ? f.required : false,
          options: { ...f.options, collectionId: String(colIdMap[f.options.collectionId]) }
        };
      }
      return { ...f };
    });
    // Log para depuración
    console.log(`Campos para ${colDef.name}:`, JSON.stringify(nuevosCampos, null, 2));
    try {
      await pb.collections.update(col.id, {
        fields: nuevosCampos
      });
      console.log(`Colección actualizada (todos los campos): ${colDef.name}`);
    } catch (e) {
      console.error(`Error actualizando ${colDef.name}:`, e?.response?.data || e);
    }
  }
}

main();
