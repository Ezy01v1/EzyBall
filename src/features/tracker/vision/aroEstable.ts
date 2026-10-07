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
   * Racha actual. `racha[0]` es el ancla (primer aro de la racha) y no se
   * desplaza, para que la deriva se mida siempre contra el mismo punto.
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
      // Acotar manteniendo el ancla en índice 0 y los últimos N-1 frames.
      if (racha.length > framesNecesarios) {
        racha = framesNecesarios > 1
          ? [ancla, ...racha.slice(-(framesNecesarios - 1))]
          : racha.slice(-1);
      }
    }
  }

  const estable = racha.length >= framesNecesarios
    ? promedio(racha.slice(-framesNecesarios))
    : null;
  return { estado: { racha }, estable };
}
