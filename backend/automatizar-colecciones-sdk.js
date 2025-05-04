// Script Node.js para automatizar colecciones PocketBase usando el SDK (sin relaciones)
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

  // 2. Actualizar campos simples (sin relaciones)
  const existentes = await pb.collections.getFullList();
  for (const colDef of coleccionesDef) {
    const col = existentes.find(c => c.name === colDef.name);
    if (!col) continue;
    const nuevosCampos = colDef.fields.filter(f => f.type !== 'relation');
    try {
      await pb.collections.update(col.id, {
        fields: nuevosCampos
      });
      console.log(`Colección actualizada (campos simples): ${colDef.name}`);
    } catch (e) {
      console.error(`Error actualizando ${colDef.name}:`, e?.response?.data || e);
    }
  }
}

main();
