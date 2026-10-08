import { centerX, centerY, type Box } from './types';

/**
 * Decide cuándo un aro detectado es lo bastante estable como para proponerlo
 * durante la calibración.
 *
 * Función pura: `acumularAro` nunca muta el estado de entrada.
 */

export interface ConfigAroEstable {
  /** Frames consecutivos compatibles necesarios antes de proponer el aro. */
  framesNecesarios: number;
  /** Deriva máxima del centro, en anchos del primer aro de la racha. */
  toleranciaCentro: number;
  /** Confianza mínima del detector para contar un frame. */
  scoreMinimo: number;
}

export const CONFIG_ARO_ESTABLE: ConfigAroEstable = {
  framesNecesarios: 8,
  toleranciaCentro: 0.15,
  scoreMinimo: 0.5,
};

export interface EstadoAroEstable {
  /**
   * Racha actual: `racha[0]` es el ancla (primer aro de la racha, solo para
   * medir la deriva) y el resto son los frames recientes contiguos. Tras
   * acotar, la longitud es como máximo N+1; los N últimos son la ventana
   * que se promedia.
   */
  racha: Box[];
}

export function crearEstadoAroEstable(): EstadoAroEstable {
  return { racha: [] };
}

function promedio(cajas: Box[]): Box {
  const n = cajas.length;
  // Media como desviación respecto al primero: exacta cuando todos coinciden
  // (evita ruido de coma flotante en 0.4 -> 0.39999...).
  const primero = cajas[0];
  if (primero === undefined) throw new Error('promedio: lista vacía');
  const media = (f: (b: Box) => number) => {
    const ref = f(primero);
    return ref + cajas.reduce((s, b) => s + (f(b) - ref), 0) / n;
  };
  return {
    x: media((b) => b.x),
    y: media((b) => b.y),
    width: media((b) => b.width),
    height: media((b) => b.height),
    score: media((b) => b.score),
  };
}

/**
 * Añade un frame a la racha. Devuelve el nuevo estado y, si ya hay
 * `framesNecesarios` frames compatibles, el aro promediado sobre ellos.
 */
export function acumularAro(
  estado: EstadoAroEstable,
  aro: Box | null,
  config: ConfigAroEstable = CONFIG_ARO_ESTABLE,
): { estado: EstadoAroEstable; estable: Box | null } {
  const { framesNecesarios, toleranciaCentro, scoreMinimo } = config;

  if (aro === null || aro.score < scoreMinimo) {
    return { estado: crearEstadoAroEstable(), estable: null };
  }

  const ancla = estado.racha[0];
  let racha: Box[];
  if (ancla === undefined) {
    racha = [aro];
  } else {
    const tolerancia = toleranciaCentro * ancla.width;
    const derivo =
      Math.abs(centerX(aro) - centerX(ancla)) > tolerancia ||
      Math.abs(centerY(aro) - centerY(ancla)) > tolerancia;
    if (derivo) {
      racha = [aro];
    } else {
      racha = [...estado.racha, aro];
      // Acotar: ancla en índice 0 (solo para la deriva) + los últimos N frames
      // contiguos, que son los que se promedian. Longitud máxima N+1.
      if (racha.length > framesNecesarios + 1) {
        racha = [ancla, ...racha.slice(-framesNecesarios)];
      }
    }
  }

  const estable = racha.length >= framesNecesarios
    ? promedio(racha.slice(-framesNecesarios)) // últimos N frames contiguos
    : null;
  return { estado: { racha }, estable };
}
