import type { ComponentType } from 'react';

import type { Detecciones } from './hoopDetector';

type PreviewProps = {
  activa: boolean;
  onListo?: (listo: boolean) => void;
  onDeteccion?: (det: Detecciones, timestamp: number, ancho: number, alto: number) => void;
};

/**
 * Carga condicional de la cámara.
 *
 * `react-native-vision-camera` es un módulo nativo: no existe en Expo Go ni en
 * un dev client compilado antes de añadir la dependencia. Importarlo de forma
 * estática desde una pantalla haría que la app reventase al abrir, incluso en
 * las partes que no usan cámara (toda la Biblioteca).
 *
 * Con este require perezoso, la ausencia del módulo degrada el tracker a modo
 * manual en vez de tumbar la app entera.
 */
let cache: ComponentType<PreviewProps> | null | undefined;

export function getCameraPreview(): ComponentType<PreviewProps> | null {
  if (cache !== undefined) return cache;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const modulo = require('./CameraPreview') as { CameraPreview: ComponentType<PreviewProps> };
    cache = modulo.CameraPreview;
  } catch {
    cache = null;
  }

  return cache;
}

export function camaraDisponible(): boolean {
  return getCameraPreview() != null;
}
