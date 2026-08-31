import { COURT_ZONE_IDS, type CourtZoneId } from '@/types/court';
import type { SessionSummary, Shot, ZoneStats } from '@/types/session';

/**
 * Muestra mínima para que una zona pueda declararse "caliente" o "a mejorar".
 *
 * Con menos de 5 intentos el porcentaje es ruido: un 0/2 no significa que el
 * usuario tenga un problema en esa zona, y recomendarle contenido por eso
 * destruye la confianza en el módulo. Ver el tip "Entrenar con datos sin
 * obsesionarse" de la biblioteca — la app debe cumplir su propio consejo.
 */
export const MIN_INTENTOS_PARA_DIAGNOSTICO = 5;

/** Por debajo de este porcentaje una zona entra en "a mejorar". */
export const UMBRAL_ZONA_DEBIL = 50;

/** Máximo de zonas débiles que se reportan (y que alimentan recomendaciones). */
export const MAX_ZONAS_A_MEJORAR = 2;

function percent(aciertos: number, intentos: number): number | null {
  if (intentos === 0) return null;
  return (aciertos / intentos) * 100;
}

export function computeZoneStats(tiros: Shot[]): ZoneStats[] {
  const acumulado = new Map<CourtZoneId, { intentos: number; aciertos: number }>();

  for (const zona of COURT_ZONE_IDS) {
    acumulado.set(zona, { intentos: 0, aciertos: 0 });
  }

  for (const tiro of tiros) {
    const actual = acumulado.get(tiro.zona);
    if (!actual) continue;
    actual.intentos += 1;
    if (tiro.resultado === 'canasta') actual.aciertos += 1;
  }

  return COURT_ZONE_IDS.map((zona) => {
    const { intentos, aciertos } = acumulado.get(zona) ?? { intentos: 0, aciertos: 0 };
    return { zona, intentos, aciertos, fgPercent: percent(aciertos, intentos) };
  });
}

/**
 * Resumen completo de una sesión: total, desglose por zona, zona caliente y
 * zonas a mejorar.
 *
 * Función pura a propósito — es el corazón del Módulo 2 y del puente con el
 * Módulo 1, así que debe poder testearse sin cámara, sin Firebase y sin UI.
 */
export function computeSessionSummary(tiros: Shot[]): SessionSummary {
  const porZona = computeZoneStats(tiros);
  const totalIntentos = tiros.length;
  const totalAciertos = tiros.filter((tiro) => tiro.resultado === 'canasta').length;

  const conMuestra = porZona.filter(
    (zona) => zona.intentos >= MIN_INTENTOS_PARA_DIAGNOSTICO && zona.fgPercent != null,
  );

  const ordenadas = [...conMuestra].sort(
    (a, b) => (b.fgPercent ?? 0) - (a.fgPercent ?? 0),
  );

  const zonaCaliente = ordenadas[0]?.zona ?? null;

  const zonasAMejorar = [...conMuestra]
    .filter((zona) => (zona.fgPercent ?? 100) < UMBRAL_ZONA_DEBIL)
    .sort((a, b) => (a.fgPercent ?? 0) - (b.fgPercent ?? 0))
    .slice(0, MAX_ZONAS_A_MEJORAR)
    .map((zona) => zona.zona);

  return {
    totalIntentos,
    totalAciertos,
    fgPercentTotal: percent(totalAciertos, totalIntentos),
    porZona,
    // Si la mejor zona es también una zona débil, no hay zona caliente real.
    zonaCaliente: zonaCaliente && zonasAMejorar.includes(zonaCaliente) ? null : zonaCaliente,
    zonasAMejorar,
  };
}

/** Zonas con al menos un intento, ordenadas de mejor a peor. Para el heatmap. */
export function zonasConDatos(resumen: SessionSummary): ZoneStats[] {
  return resumen.porZona
    .filter((zona) => zona.intentos > 0)
    .sort((a, b) => (b.fgPercent ?? 0) - (a.fgPercent ?? 0));
}
