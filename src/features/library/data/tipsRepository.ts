import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { COLLECTIONS, getDb } from '@/services/firebase';
import { readJson, storageKeys, writeJson } from '@/services/storage';
import type { Tip, TipCategory, TipLevel } from '@/types/tip';
import type { CourtZoneId } from '@/types/court';

import { SEED_TIPS } from './seedTips';

/**
 * Repositorio offline-first de la Biblioteca.
 *
 * Orden de resolución:
 *   1. cache en AsyncStorage (lo último sincronizado)
 *   2. contenido semilla empaquetado (primera apertura / sin Firebase)
 *
 * Firestore nunca está en el camino crítico de la lectura: `getTips()` resuelve
 * sin red y `syncTips()` corre en segundo plano y actualiza el cache.
 */

interface TipsCache {
  tips: Tip[];
  /** ISO 8601 del `actualizadoEn` más alto que ya tenemos. Cursor de sync. */
  cursor: string;
}

let memoryCache: Tip[] | null = null;

function mergeById(base: Tip[], incoming: Tip[]): Tip[] {
  const byId = new Map(base.map((tip) => [tip.id, tip]));
  for (const tip of incoming) {
    byId.set(tip.id, tip);
  }
  return [...byId.values()];
}

function onlyPublished(tips: Tip[]): Tip[] {
  return tips.filter((tip) => tip.publicado);
}

function maxCursor(tips: Tip[]): string {
  return tips.reduce((acc, tip) => (tip.actualizadoEn > acc ? tip.actualizadoEn : acc), '');
}

/** Lectura principal. Nunca falla y nunca espera a la red. */
export async function getTips(): Promise<Tip[]> {
  if (memoryCache) return memoryCache;

  const cached = await readJson<TipsCache>(storageKeys.tips);
  const tips = cached?.tips?.length ? mergeById(SEED_TIPS, cached.tips) : SEED_TIPS;

  memoryCache = onlyPublished(tips);
  return memoryCache;
}

export async function getTipById(id: string): Promise<Tip | null> {
  const tips = await getTips();
  return tips.find((tip) => tip.id === id) ?? null;
}

/**
 * Sincronización incremental con Firestore.
 *
 * Solo pide los documentos con `actualizadoEn` mayor al cursor local, así una
 * biblioteca de miles de tips no vuelve a descargarse entera en cada apertura.
 * Devuelve cuántos documentos entraron; 0 significa "ya estabas al día" o
 * "sin Firebase configurado".
 */
export async function syncTips(): Promise<number> {
  const db = getDb();
  if (!db) return 0;

  const cached = await readJson<TipsCache>(storageKeys.tips);
  const cursor = cached?.cursor ?? '';

  try {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.tips),
        where('publicado', '==', true),
        where('actualizadoEn', '>', cursor),
        orderBy('actualizadoEn', 'asc'),
        limit(500),
      ),
    );

    if (snapshot.empty) return 0;

    const incoming = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Tip);
    const merged = mergeById(cached?.tips ?? SEED_TIPS, incoming);

    await writeJson(storageKeys.tips, {
      tips: merged,
      cursor: maxCursor(merged),
    } satisfies TipsCache);
    await writeJson(storageKeys.tipsSyncedAt, new Date().toISOString());

    memoryCache = onlyPublished(merged);
    return incoming.length;
  } catch {
    // Sin red, reglas restrictivas o índice faltante: seguimos con el cache.
    return 0;
  }
}

export async function getLastSyncedAt(): Promise<string | null> {
  return readJson<string>(storageKeys.tipsSyncedAt);
}

// --- Consultas locales -----------------------------------------------------

export interface TipFilters {
  categoria?: TipCategory;
  subcategoria?: string;
  nivel?: TipLevel;
  zona?: CourtZoneId;
  /** Texto libre sobre título, resumen, subcategoría y cuerpo. */
  busqueda?: string;
}

const COMBINING_START = 0x300;
const COMBINING_END = 0x36f;

/** Minusculas y sin acentos, para que "mecanica" encuentre "mecanica". */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code < COMBINING_START || code > COMBINING_END;
    })
    .join('');
}

export function filterTips(tips: Tip[], filters: TipFilters): Tip[] {
  const needle = filters.busqueda ? normalize(filters.busqueda.trim()) : '';

  return tips.filter((tip) => {
    if (filters.categoria && tip.categoria !== filters.categoria) return false;
    if (filters.subcategoria && tip.subcategoria !== filters.subcategoria) return false;
    if (filters.nivel && tip.nivel !== filters.nivel) return false;
    if (filters.zona && !tip.zonas.includes(filters.zona)) return false;

    if (needle) {
      const haystack = normalize(
        [tip.titulo, tip.resumen, tip.subcategoria, ...tip.texto].join(' '),
      );
      if (!haystack.includes(needle)) return false;
    }

    return true;
  });
}

/** Subcategorías presentes en una categoría, en orden de aparición. */
export function subcategoriesOf(tips: Tip[], categoria: TipCategory): string[] {
  const seen = new Set<string>();
  for (const tip of tips) {
    if (tip.categoria === categoria) seen.add(tip.subcategoria);
  }
  return [...seen];
}

/** Solo para tests y para la pantalla de ajustes ("borrar datos locales"). */
export function __resetMemoryCache(): void {
  memoryCache = null;
}
