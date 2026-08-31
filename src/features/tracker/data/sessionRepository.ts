import { collection, doc, setDoc } from 'firebase/firestore';

import { COLLECTIONS, getDb } from '@/services/firebase';
import { readJson, storageKeys, writeJson } from '@/services/storage';
import type { SessionSummary, TrainingSession } from '@/types/session';
import { computeSessionSummary } from '../logic/sessionSummary';

/**
 * Historial de sesiones: local primero, Firestore después.
 *
 * Privacidad (ver PRIVACIDAD.md): a Firestore solo suben eventos derivados
 * —zona, resultado, timestamp relativo y el resumen agregado—. El video jamás
 * se graba a disco ni se sube: los frames se analizan y se descartan.
 */

const MAX_SESIONES_LOCALES = 200;

export async function listSessions(): Promise<TrainingSession[]> {
  const guardadas = (await readJson<TrainingSession[]>(storageKeys.sesiones)) ?? [];
  // Más reciente primero.
  return [...guardadas].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function getSession(id: string): Promise<TrainingSession | null> {
  const sesiones = await listSessions();
  return sesiones.find((sesion) => sesion.id === id) ?? null;
}

/** Guarda en local y devuelve la sesión. La subida va aparte, y puede fallar. */
export async function saveSession(sesion: TrainingSession): Promise<TrainingSession> {
  const actuales = (await readJson<TrainingSession[]>(storageKeys.sesiones)) ?? [];
  const sinDuplicado = actuales.filter((item) => item.id !== sesion.id);
  const siguientes = [sesion, ...sinDuplicado].slice(0, MAX_SESIONES_LOCALES);

  await writeJson(storageKeys.sesiones, siguientes);
  return sesion;
}

/**
 * Sube a Firestore las sesiones pendientes. Idempotente: usa el id local como
 * id de documento, así reintentar no duplica.
 */
export async function syncPendingSessions(usuarioId: string): Promise<number> {
  const db = getDb();
  if (!db || !usuarioId) return 0;

  const sesiones = (await readJson<TrainingSession[]>(storageKeys.sesiones)) ?? [];
  const pendientes = sesiones.filter((sesion) => !sesion.sincronizada);
  if (pendientes.length === 0) return 0;

  let subidas = 0;

  for (const sesion of pendientes) {
    try {
      const ref = doc(
        collection(db, COLLECTIONS.usuarios, usuarioId, COLLECTIONS.sesiones),
        sesion.id,
      );
      await setDoc(ref, { ...sesion, usuarioId, sincronizada: true });
      subidas += 1;
    } catch {
      // Sin red o permisos: la sesión sigue marcada como pendiente y se
      // reintenta en la próxima apertura. Nada se pierde.
      break;
    }
  }

  if (subidas > 0) {
    const idsSubidos = new Set(pendientes.slice(0, subidas).map((sesion) => sesion.id));
    await writeJson(
      storageKeys.sesiones,
      sesiones.map((sesion) =>
        idsSubidos.has(sesion.id) ? { ...sesion, sincronizada: true } : sesion,
      ),
    );
  }

  return subidas;
}

/**
 * Resumen agregado de las últimas N sesiones. Es lo que alimenta el estado
 * "zonas débiles" del usuario, no solo la última sesión: una mala tarde no
 * debería reescribir sus recomendaciones.
 */
export async function aggregateRecentSummary(ultimasN = 10): Promise<SessionSummary> {
  const sesiones = (await listSessions()).slice(0, ultimasN);
  const tiros = sesiones.flatMap((sesion) => sesion.tiros);
  return computeSessionSummary(tiros);
}

/** Serie de porcentajes por sesión (más antigua primero) para el gráfico. */
export async function fgPercentSeries(ultimasN = 7): Promise<number[]> {
  const sesiones = (await listSessions()).slice(0, ultimasN).reverse();
  return sesiones
    .map((sesion) => sesion.resumen.fgPercentTotal)
    .filter((valor): valor is number => valor != null);
}
