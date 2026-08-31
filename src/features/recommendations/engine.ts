import { COURT_ZONES, type CourtZoneId } from '@/types/court';
import type { SessionSummary, ZoneStats } from '@/types/session';
import type { Tip, TipLevel } from '@/types/tip';
import { MIN_INTENTOS_PARA_DIAGNOSTICO } from '@/features/tracker/logic/sessionSummary';

/**
 * Motor de recomendaciones: el puente entre el Módulo 2 y el Módulo 1.
 *
 * Es el diferenciador del producto — ninguna de las apps de tracking existentes
 * cierra el ciclo "medí que fallas desde la esquina" -> "aquí está el contenido
 * para arreglarlo". Por eso vive en su propio módulo, es una función pura y
 * explica siempre POR QUÉ recomienda cada tip: una recomendación sin motivo
 * visible se siente aleatoria y el usuario deja de confiar en ella.
 */

export interface Recommendation {
  tip: Tip;
  /** Puntuación interna. Solo para ordenar; no se muestra. */
  score: number;
  /** Texto que se enseña al usuario, ej. "32% desde la esquina derecha". */
  motivo: string;
  zona: CourtZoneId | null;
}

interface Opciones {
  /** Nivel declarado por el usuario. Se usa para desempatar, no para filtrar. */
  nivel?: TipLevel;
  /** Ids ya marcados como favoritos: bajan de prioridad, no desaparecen. */
  favoritos?: string[];
  limite?: number;
}

const PESO_ZONA_DEBIL = 100;
const PESO_CATEGORIA_TIRO = 25;
const PESO_NIVEL_COINCIDE = 12;
const PESO_FORMATO_ACCIONABLE = 8;
const PENALIZACION_FAVORITO = 30;

/** Cuánto pesa una zona: cuanto peor el %, más urgente. */
function severidad(zona: ZoneStats): number {
  if (zona.fgPercent == null) return 0;
  // 0% -> 1.0 ; 50% -> 0.5 ; 100% -> 0
  return Math.max(0, (100 - zona.fgPercent) / 100);
}

function motivoZona(zona: ZoneStats): string {
  const nombre = COURT_ZONES[zona.zona].label.toLowerCase();
  return `${Math.round(zona.fgPercent ?? 0)}% desde ${nombre} (${zona.aciertos}/${zona.intentos})`;
}

/**
 * Recomienda tips a partir del resumen de tiro del usuario.
 *
 * Si todavía no hay muestra suficiente, devuelve una selección de arranque en
 * vez de una lista vacía: un usuario nuevo también necesita por dónde empezar.
 */
export function recommendTips(
  resumen: SessionSummary | null,
  tips: Tip[],
  opciones: Opciones = {},
): Recommendation[] {
  const { nivel, favoritos = [], limite = 5 } = opciones;

  const zonasDebiles = (resumen?.porZona ?? [])
    .filter(
      (zona) =>
        zona.intentos >= MIN_INTENTOS_PARA_DIAGNOSTICO &&
        zona.fgPercent != null &&
        zona.fgPercent < 60,
    )
    .sort((a, b) => (a.fgPercent ?? 0) - (b.fgPercent ?? 0));

  if (zonasDebiles.length === 0) {
    return recomendacionesDeArranque(tips, nivel, limite);
  }

  const puntuadas = new Map<string, Recommendation>();

  for (const zona of zonasDebiles) {
    const peso = severidad(zona);

    for (const tip of tips) {
      if (!tip.zonas.includes(zona.zona)) continue;

      let score = PESO_ZONA_DEBIL * peso;
      if (tip.categoria === 'tiro') score += PESO_CATEGORIA_TIRO;
      if (nivel && tip.nivel === nivel) score += PESO_NIVEL_COINCIDE;
      if (tip.formato === 'drill') score += PESO_FORMATO_ACCIONABLE;
      if (favoritos.includes(tip.id)) score -= PENALIZACION_FAVORITO;

      const previo = puntuadas.get(tip.id);
      if (!previo || score > previo.score) {
        puntuadas.set(tip.id, {
          tip,
          score,
          motivo: motivoZona(zona),
          zona: zona.zona,
        });
      }
    }
  }

  const resultado = [...puntuadas.values()].sort((a, b) => b.score - a.score).slice(0, limite);

  // Puede pasar que la zona débil no tenga contenido etiquetado todavía.
  // Antes que devolver nada, completamos con contenido de tiro general.
  if (resultado.length < limite) {
    const yaIncluidos = new Set(resultado.map((rec) => rec.tip.id));
    const relleno = recomendacionesDeArranque(tips, nivel, limite - resultado.length).filter(
      (rec) => !yaIncluidos.has(rec.tip.id),
    );
    resultado.push(...relleno);
  }

  return resultado;
}

/**
 * Sin datos de tiro suficientes: fundamentos de tiro primero, del nivel del
 * usuario, priorizando drills sobre conceptos porque son accionables hoy.
 */
function recomendacionesDeArranque(
  tips: Tip[],
  nivel: TipLevel | undefined,
  limite: number,
): Recommendation[] {
  return tips
    .map((tip) => {
      let score = 0;
      if (tip.categoria === 'tiro') score += PESO_CATEGORIA_TIRO;
      if (tip.nivel === (nivel ?? 'principiante')) score += PESO_NIVEL_COINCIDE;
      if (tip.formato === 'drill') score += PESO_FORMATO_ACCIONABLE;
      return {
        tip,
        score,
        motivo: 'Fundamento recomendado para empezar',
        zona: null as CourtZoneId | null,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limite);
}

/** Un único tip destacado para el Home. */
export function topRecommendation(
  resumen: SessionSummary | null,
  tips: Tip[],
  opciones: Opciones = {},
): Recommendation | null {
  return recommendTips(resumen, tips, { ...opciones, limite: 1 })[0] ?? null;
}
