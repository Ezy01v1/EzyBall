import { centerX, centerY, type Box, type FrameDetection, type ShotEvent } from './types';

/**
 * Máquina de estados que convierte detecciones crudas (aro + balón por frame)
 * en eventos de canasta / fallo.
 *
 * Está deliberadamente separada del modelo de visión y de la cámara:
 *
 * - Es una función pura sobre un estado explícito, así que se puede testear
 *   con secuencias sintéticas de frames sin cámara ni modelo entrenado.
 * - El modelo se puede cambiar (TFLite, ExecuTorch, otro dataset) sin tocar
 *   la lógica de "esto fue canasta".
 * - Corre en el hilo de JS, no en el worklet: el frame processor solo envía
 *   dos cajas por frame, que es un payload minúsculo.
 *
 * Geometría: todas las coordenadas están normalizadas 0..1 sobre el frame, con
 * el origen arriba-izquierda (y crece hacia abajo).
 */

export interface ReducerConfig {
  /**
   * Cuántos anchos de aro a los lados cuentan como "el balón viene hacia el
   * aro". Ancho porque la cámara está en un selfie stick, no en un trípode
   * calibrado, y el encuadre varía entre sesiones.
   */
  anchoAproximacion: number;
  /** Tolerancia horizontal (en anchos de aro) para considerar que entró. */
  toleranciaEntrada: number;
  /** Altura (en altos de aro) por debajo del aro donde se confirma el paso. */
  profundidadConfirmacion: number;
  /** Si el balón se pierde este tiempo tras armar el tiro, se resuelve como fallo. */
  timeoutMs: number;
  /** Tiempo mínimo entre dos eventos consecutivos, para no contar rebotes. */
  debounceMs: number;
  /** Confianza mínima del detector para tener en cuenta una caja. */
  scoreMinimo: number;
}

export const DEFAULT_CONFIG: ReducerConfig = {
  anchoAproximacion: 2.0,
  toleranciaEntrada: 0.6,
  profundidadConfirmacion: 2.5,
  timeoutMs: 2500,
  debounceMs: 900,
  scoreMinimo: 0.4,
};

type Fase = 'esperando' | 'armado';

export interface ReducerState {
  fase: Fase;
  /** Último aro válido visto. Se conserva: el aro no se mueve, el balón sí. */
  aro: Box | null;
  /** Timestamp en el que el balón entró en la zona de aproximación. */
  armadoEn: number;
  /** Y del balón en el frame anterior, para saber si baja o sube. */
  ultimaBalonY: number | null;
  /** Mejor (menor) distancia horizontal al centro del aro durante el vuelo. */
  mejorDx: number;
  /** Confianza acumulada de las detecciones del vuelo actual. */
  sumaScore: number;
  framesVuelo: number;
  /** Timestamp del último evento emitido, para el debounce. */
  ultimoEventoEn: number;
}

export function createReducerState(): ReducerState {
  return {
    fase: 'esperando',
    aro: null,
    armadoEn: 0,
    ultimaBalonY: null,
    mejorDx: Number.POSITIVE_INFINITY,
    sumaScore: 0,
    framesVuelo: 0,
    ultimoEventoEn: -Infinity,
  };
}

function resetVuelo(state: ReducerState): ReducerState {
  return {
    ...state,
    fase: 'esperando',
    armadoEn: 0,
    ultimaBalonY: null,
    mejorDx: Number.POSITIVE_INFINITY,
    sumaScore: 0,
    framesVuelo: 0,
  };
}

function emitir(
  state: ReducerState,
  resultado: ShotEvent['resultado'],
  timestamp: number,
  config: ReducerConfig,
): { state: ReducerState; event: ShotEvent | null } {
  // Debounce: un balón que rebota en el aro y vuelve a entrar en la zona no
  // debe contar como dos tiros.
  if (timestamp - state.ultimoEventoEn < config.debounceMs) {
    return { state: resetVuelo(state), event: null };
  }

  const confianzaMedia = state.framesVuelo > 0 ? state.sumaScore / state.framesVuelo : 0;

  return {
    state: resetVuelo({ ...state, ultimoEventoEn: timestamp }),
    event: {
      resultado,
      timestamp,
      confianza: Number(confianzaMedia.toFixed(3)),
    },
  };
}

/**
 * Procesa un frame. Devuelve el nuevo estado y, si el frame cerró un tiro,
 * el evento correspondiente.
 */
export function reduceFrame(
  state: ReducerState,
  frame: FrameDetection,
  config: ReducerConfig = DEFAULT_CONFIG,
): { state: ReducerState; event: ShotEvent | null } {
  let next: ReducerState = { ...state };

  // El aro es estático: nos quedamos con la última detección buena y seguimos
  // trabajando con ella aunque el jugador lo tape durante el vuelo.
  if (frame.aro && frame.aro.score >= config.scoreMinimo) {
    next.aro = frame.aro;
  }

  const aro = next.aro;
  if (!aro) return { state: next, event: null };

  const aroX = centerX(aro);
  const aroY = centerY(aro);

  const balon = frame.balon && frame.balon.score >= config.scoreMinimo ? frame.balon : null;

  if (!balon) {
    // Balón perdido con el tiro armado: si pasó el timeout, lo damos por fallo.
    // Es la decisión conservadora — un tiro que entra casi siempre deja frames
    // del balón cruzando el aro, mientras que uno que se va largo desaparece.
    if (next.fase === 'armado' && frame.timestamp - next.armadoEn > config.timeoutMs) {
      return emitir(next, 'fallo', frame.timestamp, config);
    }
    return { state: next, event: null };
  }

  const bx = centerX(balon);
  const by = centerY(balon);
  const dx = Math.abs(bx - aroX);
  const dxRelativo = dx / aro.width;

  const enBandaAproximacion = dxRelativo <= config.anchoAproximacion;
  const porEncimaDelAro = by < aroY - aro.height * 0.5;
  const bajando = next.ultimaBalonY != null && by > next.ultimaBalonY;

  if (next.fase === 'esperando') {
    // Se arma cuando el balón aparece por encima del aro y dentro de la banda:
    // es el patrón de un tiro en vuelo, no de alguien botando bajo la canasta.
    if (enBandaAproximacion && porEncimaDelAro) {
      next = {
        ...next,
        fase: 'armado',
        armadoEn: frame.timestamp,
        mejorDx: dxRelativo,
        sumaScore: balon.score,
        framesVuelo: 1,
      };
    }
    next.ultimaBalonY = by;
    return { state: next, event: null };
  }

  // --- fase 'armado' -------------------------------------------------------

  next.sumaScore += balon.score;
  next.framesVuelo += 1;
  next.mejorDx = Math.min(next.mejorDx, dxRelativo);

  const profundidad = (by - aroY) / aro.height;

  if (profundidad >= config.profundidadConfirmacion) {
    // El balón ya está claramente por debajo del aro: hay que decidir.
    // Entró si en algún momento del vuelo pasó por dentro del cilindro y
    // venía bajando.
    const paso = next.mejorDx <= config.toleranciaEntrada && (bajando || next.ultimaBalonY == null);
    next.ultimaBalonY = by;
    return emitir(next, paso ? 'canasta' : 'fallo', frame.timestamp, config);
  }

  if (frame.timestamp - next.armadoEn > config.timeoutMs) {
    next.ultimaBalonY = by;
    return emitir(next, 'fallo', frame.timestamp, config);
  }

  next.ultimaBalonY = by;
  return { state: next, event: null };
}

/**
 * Ayuda a decidir si el encuadre sirve antes de grabar (pantalla de
 * calibración). Devuelve `null` si el encuadre es válido, o el motivo del
 * problema para mostrárselo al usuario.
 */
export function validarEncuadre(aro: Box | null): string | null {
  if (!aro) return 'No veo el aro. Apunta el teléfono hacia la canasta.';
  if (aro.score < 0.5) return 'Veo el aro pero con poca claridad. Mejora la luz o acércate.';
  if (aro.width < 0.04) return 'El aro se ve muy pequeño. Acerca el teléfono a la canasta.';
  if (aro.width > 0.45) return 'Estás demasiado cerca. Aleja el teléfono para ver el vuelo del balón.';
  if (centerY(aro) > 0.6) return 'Inclina el teléfono hacia arriba: el aro debe quedar en la mitad superior.';
  return null;
}
