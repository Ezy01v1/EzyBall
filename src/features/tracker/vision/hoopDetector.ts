import { useMemo } from 'react';

import type { Box, FrameDetection } from './types';

/**
 * Puente entre el modelo de visión y el resto de la app.
 *
 * ESTADO ACTUAL (Fase 2 del roadmap)
 * ----------------------------------
 * El modelo TFLite de detección aro/balón todavía no existe: hay que
 * entrenarlo y exportarlo a `assets/models/hoop-ball.tflite`. Mientras no
 * esté, `detectorDisponible()` devuelve false y la pantalla de grabación cae
 * en modo manual (el usuario marca canasta/fallo con el pulgar), de modo que
 * el bucle completo —zona, sesión, resumen, recomendaciones— ya es usable y
 * validable con usuarios reales.
 *
 * Cuando el modelo esté listo, lo único que hay que rellenar es
 * `prepareInput()` y ajustar `parseOutput()` al formato exportado. Ni la
 * máquina de estados (shotEventReducer) ni la UI cambian.
 *
 * QUÉ FALTA PARA CABLEARLO (VisionCamera 5)
 * -----------------------------------------
 * 1. `npx expo install react-native-vision-camera-worklets` — los frame
 *    outputs con `onFrame` lo requieren; no se instala todavía para no meter
 *    un módulo nativo sin uso en el dev client.
 * 2. En `CameraPreview`, crear el output y pasarlo a `<Camera outputs={[...]}>`:
 *
 *      const frameOutput = useFrameOutput({
 *        targetResolution: CommonResolutions.VGA_16_9,
 *        onFrame(frame) {
 *          'worklet'
 *          const entrada = prepareInput(frame)
 *          if (entrada != null) {
 *            const salida = modelo.runSync([entrada])
 *            enviarDeteccion(parseOutput(salida[0], salida[1], salida[2]))
 *          }
 *          frame.dispose()   // obligatorio: si no, se estanca el pipeline
 *        },
 *      })
 *
 *    `targetResolution` hace el downscale en el propio pipeline de cámara, así
 *    que no hace falta un plugin de resize externo. Lo que queda en
 *    `prepareInput()` es recortar al cuadrado y normalizar a tensor.
 * 3. Cruzar a JS con `createRunOnJS` y alimentar `reduceFrame`.
 *
 * DECISIONES DE ARQUITECTURA
 * --------------------------
 * - Todo el procesamiento es on-device. El frame nunca sale del teléfono ni se
 *   escribe a disco: solo salen del worklet dos cajas por frame.
 * - La interpretación (¿esto fue canasta?) vive en el hilo de JS, no en el
 *   worklet, porque es lógica de negocio que queremos testear sin cámara.
 * - `FRAME_SKIP` limita el trabajo a ~15 fps efectivos: suficiente para seguir
 *   un balón y bastante más barato en batería que analizar todos los frames.
 */

/** Analizamos 1 de cada N frames. Ver nota de batería arriba. */
export const FRAME_SKIP = 2;

/** Resolución de entrada esperada por el modelo (cuadrada, estilo YOLO/SSD). */
export const MODEL_INPUT_SIZE = 320;

/** Índices de clase del modelo entrenado. */
export const CLASE_ARO = 0;
export const CLASE_BALON = 1;

export type EstadoDetector = 'listo' | 'sin_modelo' | 'error';

/**
 * Carga perezosa del modelo. Se hace con require() dentro de try/catch a
 * propósito: si el .tflite no está en el bundle, la app debe seguir abriendo.
 */
export function cargarModeloEmpaquetado(): number | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../../../../assets/models/hoop-ball.tflite') as number;
  } catch {
    return null;
  }
}

export function detectorDisponible(): boolean {
  return cargarModeloEmpaquetado() != null;
}

export function useEstadoDetector(): EstadoDetector {
  return useMemo(() => (detectorDisponible() ? 'listo' : 'sin_modelo'), []);
}

/**
 * Frame de la cámara -> tensor de entrada del modelo.
 *
 * PENDIENTE (Fase 2): recortar al centro en cuadrado, escalar a
 * MODEL_INPUT_SIZE y normalizar a Float32 [0,1] o uint8 según el modelo
 * exportado. El downscale grueso ya lo hace `targetResolution` del frame output.
 */
export function prepareInput(_frame: unknown): Float32Array | null {
  'worklet';
  return null;
}

/**
 * Salida cruda del modelo -> cajas normalizadas.
 *
 * Asume el formato habitual de detección: [ymin, xmin, ymax, xmax] por caja,
 * más un array de clases y otro de scores. Ajustar al exportar el modelo real.
 */
export function parseOutput(
  cajas: Float32Array | number[],
  clases: Float32Array | number[],
  scores: Float32Array | number[],
): { aro: Box | null; balon: Box | null } {
  'worklet';

  let aro: Box | null = null;
  let balon: Box | null = null;

  const total = Math.min(scores.length, Math.floor(cajas.length / 4));

  for (let i = 0; i < total; i += 1) {
    const score = scores[i] ?? 0;
    if (score <= 0) continue;

    const ymin = cajas[i * 4] ?? 0;
    const xmin = cajas[i * 4 + 1] ?? 0;
    const ymax = cajas[i * 4 + 2] ?? 0;
    const xmax = cajas[i * 4 + 3] ?? 0;

    const box: Box = {
      x: xmin,
      y: ymin,
      width: Math.max(0, xmax - xmin),
      height: Math.max(0, ymax - ymin),
      score,
    };

    const clase = clases[i] ?? -1;
    // Nos quedamos con la detección de mayor score por clase.
    if (clase === CLASE_ARO && (!aro || score > aro.score)) aro = box;
    if (clase === CLASE_BALON && (!balon || score > balon.score)) balon = box;
  }

  return { aro, balon };
}

/** Detección vacía: el reductor la ignora sin romper su estado. */
export function frameVacio(timestamp: number): FrameDetection {
  return { timestamp, aro: null, balon: null };
}
