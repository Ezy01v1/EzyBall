import type { Frame } from 'react-native-vision-camera';

import { DEFAULT_CONFIG, type ReducerConfig } from './shotEventReducer';
import type { Box, FrameDetection } from './types';

/**
 * Puente entre el modelo de visión y el resto de la app.
 *
 * ESTADO ACTUAL (Fase 2, camino A)
 * --------------------------------
 * - El BALÓN lo detecta un modelo genérico ya entrenado: SSD-MobileNet v1
 *   cuantizado sobre COCO (`assets/models/balon-coco.tflite`), clase
 *   "sports ball". No hay que entrenar nada.
 * - El ARO no se detecta: el usuario lo marca con un toque en la pantalla de
 *   calibración. El aro no se mueve durante la sesión, así que una posición
 *   fija es tan buena como una detección y bastante más estable.
 *
 * Camino B (más adelante): entrenar `hoop-ball.tflite` con las dos clases.
 * Solo cambiarían `cargarModeloEmpaquetado()`, las clases y `parseOutput()`; ni el reductor ni
 * la UI se enteran.
 *
 * DECISIONES DE ARQUITECTURA
 * --------------------------
 * - Todo el procesamiento es on-device. El frame nunca sale del teléfono ni se
 *   escribe a disco: solo sale del worklet una caja por frame.
 * - La interpretación (¿esto fue canasta?) vive en el hilo de JS, no en el
 *   worklet, porque es lógica de negocio que queremos testear sin cámara.
 * - El frame output usa `dropFramesWhileBusy`: si el modelo tarda más que un
 *   frame, se saltan frames en vez de acumular retraso.
 */

/** Resolución de entrada del modelo (cuadrada). SSD-MobileNet v1: 300x300. */
export const MODEL_INPUT_SIZE = 300;

/** Índice de "sports ball" en la salida del SSD de COCO (labelmap sin "???"). */
export const CLASE_BALON = 36;

/**
 * Configuración del reductor para detección automática. El SSD genérico da
 * scores más bajos que un modelo entrenado para balones, sobre todo con el
 * balón pequeño y movido en el aire; con 0.4 se perdían demasiados frames.
 */
export const CONFIG_AUTO: ReducerConfig = { ...DEFAULT_CONFIG, scoreMinimo: 0.3 };

/**
 * Carga del modelo. Se hace con require() dentro de try/catch a propósito:
 * si el .tflite no está en el bundle, la app debe seguir abriendo.
 */
export function cargarModeloEmpaquetado(): number | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../../../../assets/models/balon-coco.tflite') as number;
  } catch {
    return null;
  }
}

export function detectorDisponible(): boolean {
  return cargarModeloEmpaquetado() != null;
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
export function prepareInput(frame: Frame, tipo: 'uint8' | 'float32'): ArrayBuffer | null {
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

  const n = MODEL_INPUT_SIZE;
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

/**
 * Salida cruda del SSD -> caja del balón con más score.
 *
 * Formato del postprocesado TFLite de detección: cajas `[ymin, xmin, ymax,
 * xmax]` normalizadas, un array de clases y otro de scores.
 */
export function parseOutput(
  cajas: Float32Array | number[],
  clases: Float32Array | number[],
  scores: Float32Array | number[],
): Box | null {
  'worklet';

  let balon: Box | null = null;
  const total = Math.min(scores.length, clases.length, Math.floor(cajas.length / 4));

  for (let i = 0; i < total; i += 1) {
    const score = scores[i] ?? 0;
    if (score <= 0) continue;
    if (Math.round(clases[i] ?? -1) !== CLASE_BALON) continue;
    if (balon && score <= balon.score) continue;

    const ymin = cajas[i * 4] ?? 0;
    const xmin = cajas[i * 4 + 1] ?? 0;
    const ymax = cajas[i * 4 + 2] ?? 0;
    const xmax = cajas[i * 4 + 3] ?? 0;

    balon = {
      x: xmin,
      y: ymin,
      width: Math.max(0, xmax - xmin),
      height: Math.max(0, ymax - ymin),
      score,
    };
  }

  return balon;
}

/** Detección vacía: el reductor la ignora sin romper su estado. */
export function frameVacio(timestamp: number): FrameDetection {
  return { timestamp, aro: null, balon: null };
}
