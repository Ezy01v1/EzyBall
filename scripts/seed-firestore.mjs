#!/usr/bin/env node
/**
 * Sube el contenido semilla de la Biblioteca a Firestore.
 *
 * Uso:
 *   1. Firebase Console > Configuracion del proyecto > Cuentas de servicio
 *      > Generar nueva clave privada. Guarda el JSON fuera del repo.
 *   2. set GOOGLE_APPLICATION_CREDENTIALS=C:\ruta\serviceAccount.json
 *      set FIREBASE_PROJECT_ID=tu-proyecto
 *   3. npm run seed:firestore -- --dry-run     (comprueba sin escribir)
 *      npm run seed:firestore                  (escribe de verdad)
 *
 * Requiere firebase-admin, que NO es dependencia de la app:
 *   npm install --no-save firebase-admin
 *
 * Es idempotente: usa el id del tip como id de documento, asi que volver a
 * ejecutarlo actualiza en vez de duplicar.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const aquí = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(aquí, '..');
const RUTA_SEED = join(RAIZ, 'src/features/library/data/seedTips.ts');

const dryRun = process.argv.includes('--dry-run');

/**
 * Lee los tips del fichero TypeScript sin compilarlo.
 *
 * Es deliberadamente tosco pero evita meter un paso de build solo para un
 * script que se ejecuta a mano un punado de veces. Si el seed crece o cambia
 * de forma, migrar a tsx/esbuild.
 */
function leerTips() {
  const fuente = readFileSync(RUTA_SEED, 'utf8');

  const inicio = fuente.indexOf('export const SEED_TIPS');
  if (inicio === -1) throw new Error('No encuentro SEED_TIPS en ' + RUTA_SEED);

  const apertura = fuente.indexOf('[', inicio);
  const cierre = fuente.lastIndexOf('];');
  if (apertura === -1 || cierre === -1) throw new Error('No puedo delimitar el array SEED_TIPS');

  const literal = fuente
    .slice(apertura, cierre + 1)
    // Sustituye la constante de fecha por su valor literal.
    .replace(/\bCREADO\b/g, JSON.stringify(extraerCreado(fuente)));

  // eslint-disable-next-line no-new-func
  return new Function(`return ${literal};`)();
}

function extraerCreado(fuente) {
  const match = fuente.match(/const CREADO = '([^']+)'/);
  if (!match) throw new Error('No encuentro la constante CREADO');
  return match[1];
}

async function main() {
  const tips = leerTips();
  console.log(`Leidos ${tips.length} tips del seed.`);

  const sinRevisar = tips.filter((tip) => !tip.autorRevisor);
  if (sinRevisar.length > 0) {
    // Regla de contenido: nada se publica sin pasar revision tecnica.
    console.error('Estos tips no tienen autorRevisor y no se subiran:');
    for (const tip of sinRevisar) console.error(`  - ${tip.id}`);
    process.exitCode = 1;
    return;
  }

  if (dryRun) {
    console.log('--dry-run: no se escribe nada. Resumen por categoria:');
    const porCategoria = {};
    for (const tip of tips) porCategoria[tip.categoria] = (porCategoria[tip.categoria] ?? 0) + 1;
    console.table(porCategoria);
    return;
  }

  const { initializeApp, applicationDefault } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });

  const db = getFirestore();
  const ahora = new Date().toISOString();

  // Firestore permite 500 operaciones por lote.
  const TAMANO_LOTE = 400;

  for (let i = 0; i < tips.length; i += TAMANO_LOTE) {
    const lote = db.batch();

    for (const tip of tips.slice(i, i + TAMANO_LOTE)) {
      const { id, ...datos } = tip;
      lote.set(db.collection('tips').doc(id), { ...datos, actualizadoEn: ahora }, { merge: true });
    }

    await lote.commit();
    console.log(`Subidos ${Math.min(i + TAMANO_LOTE, tips.length)}/${tips.length}`);
  }

  console.log('Listo. Los clientes lo veran en su proxima sincronizacion.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
