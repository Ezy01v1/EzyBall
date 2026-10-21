import type { Box } from './types';

/**
 * Decodificación de la salida "cruda" de un SSD de MediaPipe Model Maker.
 *
 * `hoop-ball.tflite` no trae el postprocesado TFLite de detección: devuelve,
 * para cada anchor, 4 números de caja codificados y un score por clase (con el
 * fondo en la columna 0). MediaPipe los decodifica con los anchors incrustados
 * en los metadatos; aquí se hace lo mismo pero sin guardar los 27 621 anchors:
 * siguen una rejilla regular y se calcula solo el del anchor ganador de cada
 * clase. `training/verificar_decodificacion.py` comprobó contra el
 * ObjectDetector de MediaPipe que el orden de caja es YXHW (IoU medio 0.96).
 *
 * Como el reductor solo quiere el mejor aro y el mejor balón del frame, no hace
 * falta NMS: basta el anchor de mayor score por clase.
 */

/** Rejilla de anchors multinivel (generador de anchors de TF Model Garden). */
export interface ConfigAnchorsSsd {
  /** Lado de la entrada del modelo en píxeles. */
  inputSize: number;
  nivelMin: number;
  nivelMax: number;
  /** Escalas por octava: tamaños base * 2^(k / escalasPorOctava). */
  escalasPorOctava: number;
  /** Relaciones de aspecto (ancho / alto), en el orden en que salen. */
  aspectos: number[];
  /** Tamaño del anchor en múltiplos del stride del nivel. */
  tamanoAnchor: number;
}

/** MobileNet-MultiAVG 384x384 de Model Maker: niveles 3-7, 3 escalas, 3 aspectos. */
export const ANCHORS_HOOP_BALL: ConfigAnchorsSsd = {
  inputSize: 384,
  nivelMin: 3,
  nivelMax: 7,
  escalasPorOctava: 3,
  aspectos: [0.5, 1, 2],
  tamanoAnchor: 3,
};

export function totalAnchors(cfg: ConfigAnchorsSsd): number {
  let total = 0;
  for (let nivel = cfg.nivelMin; nivel <= cfg.nivelMax; nivel += 1) {
    const lado = Math.ceil(cfg.inputSize / 2 ** nivel);
    total += lado * lado * cfg.escalasPorOctava * cfg.aspectos.length;
  }
  return total;
}

/**
 * Anchor `i` como `[xCentro, yCentro, ancho, alto]` normalizados, en el mismo
 * orden que el modelo: nivel, fila, columna, escala, aspecto.
 */
export function anchorDeIndice(i: number, cfg: ConfigAnchorsSsd): [number, number, number, number] | null {
  'worklet';
  if (i < 0) return null;
  const porCelda = cfg.escalasPorOctava * cfg.aspectos.length;
  let resto = i;
  for (let nivel = cfg.nivelMin; nivel <= cfg.nivelMax; nivel += 1) {
    const stride = 2 ** nivel;
    const lado = Math.ceil(cfg.inputSize / stride);
    const enNivel = lado * lado * porCelda;
    if (resto < enNivel) {
      const celda = Math.floor(resto / porCelda);
      const k = resto % porCelda;
      const fila = Math.floor(celda / lado);
      const columna = celda % lado;
      const escala = Math.floor(k / cfg.aspectos.length);
      const aspecto = cfg.aspectos[k % cfg.aspectos.length] ?? 1;
      const base = cfg.tamanoAnchor * stride * 2 ** (escala / cfg.escalasPorOctava);
      const raiz = Math.sqrt(aspecto);
      return [
        ((columna + 0.5) * stride) / cfg.inputSize,
        ((fila + 0.5) * stride) / cfg.inputSize,
        (base * raiz) / cfg.inputSize,
        base / raiz / cfg.inputSize,
      ];
    }
    resto -= enNivel;
  }
  return null;
}

function decodificar(
  cajas: Float32Array | number[],
  i: number,
  score: number,
  cfg: ConfigAnchorsSsd,
): Box | null {
  'worklet';
  const a = anchorDeIndice(i, cfg);
  if (!a) return null;
  const [ax, ay, aw, ah] = a;
  // Escalas de decodificación a 1 y exponencial en el tamaño (metadatos del modelo).
  const cy = (cajas[i * 4] ?? 0) * ah + ay;
  const cx = (cajas[i * 4 + 1] ?? 0) * aw + ax;
  const h = Math.exp(cajas[i * 4 + 2] ?? 0) * ah;
  const w = Math.exp(cajas[i * 4 + 3] ?? 0) * aw;
  const xmin = Math.max(0, cx - w / 2);
  const ymin = Math.max(0, cy - h / 2);
  const xmax = Math.min(1, cx + w / 2);
  const ymax = Math.min(1, cy + h / 2);
  return { x: xmin, y: ymin, width: Math.max(0, xmax - xmin), height: Math.max(0, ymax - ymin), score };
}

/**
 * Salida cruda -> caja del aro y del balón con más score. Los scores ya vienen
 * en [0, 1] (no hay que aplicar sigmoide).
 */
export function parseOutputCrudo(
  cajas: Float32Array | number[],
  scores: Float32Array | number[],
  numClases: number,
  cfg: ConfigAnchorsSsd,
  perfil: { claseAro: number | null; claseBalon: number },
): { aro: Box | null; balon: Box | null } {
  'worklet';
  const total = Math.min(Math.floor(scores.length / numClases), Math.floor(cajas.length / 4));
  let mejorAro = -1;
  let scoreAro = 0;
  let mejorBalon = -1;
  let scoreBalon = 0;

  for (let i = 0; i < total; i += 1) {
    const fila = i * numClases;
    if (perfil.claseAro != null) {
      const s = scores[fila + perfil.claseAro] ?? 0;
      if (s > scoreAro) {
        scoreAro = s;
        mejorAro = i;
      }
    }
    const s = scores[fila + perfil.claseBalon] ?? 0;
    if (s > scoreBalon) {
      scoreBalon = s;
      mejorBalon = i;
    }
  }

  return {
    aro: mejorAro >= 0 ? decodificar(cajas, mejorAro, scoreAro, cfg) : null,
    balon: mejorBalon >= 0 ? decodificar(cajas, mejorBalon, scoreBalon, cfg) : null,
  };
}
