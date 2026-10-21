import type { Frame } from 'react-native-vision-camera';

import { DEFAULT_CONFIG, type ReducerConfig } from './shotEventReducer';
import { ANCHORS_HOOP_BALL, type ConfigAnchorsSsd } from './ssdCrudo';
import type { Box, FrameDetection } from './types';

/**
 * Puente entre el modelo de visión y el resto de la app.
 *
 * ESTADO ACTUAL (camino B)
 * ------------------------
 * - Modelo propio `assets/models/hoop-ball.tflite` (MobileNet-MultiAVG 384x384
 *   de MediaPipe Model Maker, float16) que detecta ARO y BALÓN. La calibración
 *   propone el aro detectado y el usuario lo confirma o lo corrige con un toque.
 * - Respaldo: SSD-MobileNet v1 de COCO (`balon-coco.tflite`), solo balón; el
 *   aro se marca a mano. Se usa si el modelo propio no está en el bundle.
 *
 * Cada modelo se describe con un `PerfilModelo`; ni el reductor ni la UI se
 * enteran de cuál está activo.
 *
 * DECISIONES DE ARQUITECTURA
 * --------------------------
 * - Todo el procesamiento es on-device. El frame nunca sale del teléfono ni se
 *   escribe a disco: del worklet solo salen las cajas de aro y balón por frame.
 * - La interpretación (¿esto fue canasta?) vive en el hilo de JS, no en el
 *   worklet, porque es lógica de negocio que queremos testear sin cámara.
 * - El frame output usa `dropFramesWhileBusy`: si el modelo tarda más que un
 *   frame, se saltan frames en vez de acumular retraso.
 */

/**
 * Perfil de un modelo: todo lo que cambia entre el SSD genérico de COCO y el
 * modelo propio `hoop-ball`. El resto del código solo lee el perfil.
 */
export interface PerfilModelo {
  nombre: 'hoop-ball' | 'balon-coco';
  /** Resolución de entrada del modelo (cuadrada). */
  inputSize: number;
  /** Índice de clase del aro, o null si el modelo no lo detecta. */
  claseAro: number | null;
  claseBalon: number;
  /**
   * Score mínimo para dar una detección por buena. El SSD genérico da scores
   * más bajos que un modelo entrenado, sobre todo con el balón pequeño y movido
   * en el aire; con 0.4 se perdían demasiados frames.
   */
  scoreMinimo: number;
  /** Formato y posición de cada tensor en la salida de runSync. */
  salidas: SalidasModelo;
}

/**
 * - `postprocesado`: el .tflite incluye el postprocesado de detección (cajas
 *   `[ymin, xmin, ymax, xmax]`, clases y scores ya filtrados). Ver `parseOutput`.
 * - `crudo`: cajas codificadas y un score por clase para cada anchor, sin NMS
 *   (exportación de MediaPipe Model Maker). Ver `parseOutputCrudo`.
 */
export type SalidasModelo =
  | { formato: 'postprocesado'; cajas: number; clases: number; scores: number }
  | { formato: 'crudo'; cajas: number; scores: number; numClases: number; anchors: ConfigAnchorsSsd };

/** SSD-MobileNet v1 de COCO: 300x300, "sports ball" es el índice 36. Sin aro. */
export const PERFIL_COCO: PerfilModelo = {
  nombre: 'balon-coco',
  inputSize: 300,
  claseAro: null,
  claseBalon: 36,
  scoreMinimo: 0.3,
  salidas: { formato: 'postprocesado', cajas: 0, clases: 1, scores: 2 },
};

/**
 * Modelo propio aro + balón. Valores leídos del .tflite exportado: entrada
 * float32 384x384 normalizada a [-1, 1]; salida 0 = cajas [1, 27621, 4],
 * salida 1 = scores [1, 27621, 3] con etiquetas `background, aro, balon`.
 */
export const PERFIL_HOOP_BALL: PerfilModelo = {
  nombre: 'hoop-ball',
  inputSize: 384,
  claseAro: 1,
  claseBalon: 2,
  scoreMinimo: 0.4,
  salidas: { formato: 'crudo', cajas: 0, scores: 1, numClases: 3, anchors: ANCHORS_HOOP_BALL },
};

export interface ModeloEmpaquetado {
  /** Id de asset de Metro (resultado de require). */
  asset: number;
  perfil: PerfilModelo;
}

/**
 * Carga del modelo: el propio si está, y si no el de COCO. Se hace con
 * require() dentro de try/catch a propósito: si el .tflite no está en el
 * bundle, la app debe seguir abriendo.
 */
export function cargarModeloEmpaquetado(): ModeloEmpaquetado | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const asset = require('../../../../assets/models/hoop-ball.tflite') as number;
    return { asset, perfil: PERFIL_HOOP_BALL };
  } catch {
    // sigue con el respaldo
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const asset = require('../../../../assets/models/balon-coco.tflite') as number;
    return { asset, perfil: PERFIL_COCO };
  } catch {
    return null;
  }
}

export function perfilActivo(): PerfilModelo | null {
  return cargarModeloEmpaquetado()?.perfil ?? null;
}

export function detectorDisponible(): boolean {
  return cargarModeloEmpaquetado() != null;
}

/** Configuración del reductor para detección automática con ese perfil. */
export function configAuto(perfil: PerfilModelo): ReducerConfig {
  return { ...DEFAULT_CONFIG, scoreMinimo: perfil.scoreMinimo };
}

/**
 * Frame de la cámara -> tensor de entrada del modelo.
 *
 * El frame llega en RGB de 8 bits (BGRA, RGBA o RGBX según plataforma) y ya
 * reducido por `targetResolution`. Aquí se escala al cuadrado del modelo por
 * vecino más cercano, estirando sin recortar: así las cajas de salida quedan
 * normalizadas sobre el frame completo, que es el sistema de coordenadas en
 * el que se calibró el aro. SSD tolera bien esa deformación.
 */
export function prepareInput(
  frame: Frame,
  tipo: 'uint8' | 'float32',
  inputSize: number,
): ArrayBuffer | null {
  'worklet';
  if (!frame.hasPixelBuffer) return null;

  let r = 0;
  let b = 2;
  const formato = frame.pixelFormat;
  if (formato === 'rgb-bgra-8-bit') {
    r = 2;
    b = 0;
  } else if (formato !== 'rgb-rgba-8-bit' && formato !== 'rgb-rgb-8-bit') {
    return null;
  }

  const ancho = frame.width;
  const alto = frame.height;
  const bytesFila = frame.bytesPerRow;
  const bpp = bytesFila >= ancho * 4 ? 4 : 3;
  const origen = new Uint8Array(frame.getPixelBuffer());

  const n = inputSize;
  const u8 = tipo === 'uint8' ? new Uint8Array(n * n * 3) : null;
  const f32 = tipo === 'float32' ? new Float32Array(n * n * 3) : null;

  let k = 0;
  for (let y = 0; y < n; y += 1) {
    const fila = Math.floor((y * alto) / n) * bytesFila;
    for (let x = 0; x < n; x += 1) {
      const i = fila + Math.floor((x * ancho) / n) * bpp;
      const vr = origen[i + r] ?? 0;
      const vg = origen[i + 1] ?? 0;
      const vb = origen[i + b] ?? 0;
      if (u8) {
        u8[k] = vr;
        u8[k + 1] = vg;
        u8[k + 2] = vb;
      } else if (f32) {
        f32[k] = (vr - 127.5) / 127.5;
        f32[k + 1] = (vg - 127.5) / 127.5;
        f32[k + 2] = (vb - 127.5) / 127.5;
      }
      k += 3;
    }
  }

  return (u8 ?? f32)!.buffer as ArrayBuffer;
}

/** Aro y balón detectados en un frame (cajas normalizadas, o null si no hay). */
export interface Detecciones {
  aro: Box | null;
  balon: Box | null;
}

/**
 * Salida cruda del SSD -> caja del aro y del balón con más score de cada clase.
 *
 * Formato del postprocesado TFLite de detección: cajas `[ymin, xmin, ymax,
 * xmax]` normalizadas, un array de clases y otro de scores.
 */
export function parseOutput(
  cajas: Float32Array | number[],
  clases: Float32Array | number[],
  scores: Float32Array | number[],
  perfil: PerfilModelo,
): Detecciones {
  'worklet';

  let aro: Box | null = null;
  let balon: Box | null = null;
  const total = Math.min(scores.length, clases.length, Math.floor(cajas.length / 4));

  for (let i = 0; i < total; i += 1) {
    const score = scores[i] ?? 0;
    if (score <= 0) continue;
    const clase = Math.round(clases[i] ?? -1);
    const esAro = perfil.claseAro != null && clase === perfil.claseAro;
    const esBalon = clase === perfil.claseBalon;
    if (!esAro && !esBalon) continue;
    if (esAro && aro && score <= aro.score) continue;
    if (esBalon && balon && score <= balon.score) continue;

    const ymin = cajas[i * 4] ?? 0;
    const xmin = cajas[i * 4 + 1] ?? 0;
    const ymax = cajas[i * 4 + 2] ?? 0;
    const xmax = cajas[i * 4 + 3] ?? 0;

    const caja: Box = {
      x: xmin,
      y: ymin,
      width: Math.max(0, xmax - xmin),
      height: Math.max(0, ymax - ymin),
      score,
    };
    if (esAro) aro = caja;
    else balon = caja;
  }

  return { aro, balon };
}

/** Detección vacía: el reductor la ignora sin romper su estado. */
export function frameVacio(timestamp: number): FrameDetection {
  return { timestamp, aro: null, balon: null };
}
