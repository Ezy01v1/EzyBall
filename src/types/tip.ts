import type { CourtZoneId } from './court';

export const TIP_CATEGORIES = [
  'tiro',
  'dribleo',
  'defensa',
  'pase',
  'footwork',
  'rebote',
  'atletismo',
  'iq_juego',
  'mentalidad',
] as const;

export type TipCategory = (typeof TIP_CATEGORIES)[number];

export const TIP_LEVELS = ['principiante', 'intermedio', 'avanzado'] as const;
export type TipLevel = (typeof TIP_LEVELS)[number];

export const TIP_FORMATS = ['tip_rapido', 'drill', 'concepto'] as const;
export type TipFormat = (typeof TIP_FORMATS)[number];

/** Un paso numerado dentro de un drill. */
export interface TipStep {
  titulo: string;
  detalle: string;
}

/**
 * Contenido educativo de la Biblioteca.
 *
 * Reglas de contenido (ver docs/CONTENIDO.md):
 * - `texto` y `pasos` deben ser redaccion original. Las fuentes externas se
 *   citan en `fuenteReferencia` como atribucion conceptual, nunca como cita literal.
 * - `imagenUrl` apunta a ilustraciones genericas (siluetas / diagramas).
 *   Nunca a representaciones de jugadores reales identificables.
 * - `revisadoPor` + `revisadoEn` deben estar presentes para que el tip se publique.
 */
export interface Tip {
  id: string;
  titulo: string;
  /** Frase de una linea que se muestra en las tarjetas de listado. */
  resumen: string;
  categoria: TipCategory;
  subcategoria: string;
  nivel: TipLevel;
  formato: TipFormat;
  /** Zonas de cancha a las que aplica. Vacio = no aplica a una zona concreta. */
  zonas: CourtZoneId[];
  /** Cuerpo del tip en parrafos. Redaccion original. */
  texto: string[];
  pasos?: TipStep[];
  imagenUrl?: string;
  fuenteReferencia?: string;
  autorRevisor?: string;
  /** ISO 8601. Se usa como cursor de sincronizacion incremental con Firestore. */
  fechaCreacion: string;
  actualizadoEn: string;
  /** Solo los tips revisados llegan al usuario final. */
  publicado: boolean;
}

export const CATEGORY_LABELS: Record<TipCategory, string> = {
  tiro: 'Tiro',
  dribleo: 'Dribleo',
  defensa: 'Defensa',
  pase: 'Pase',
  footwork: 'Footwork',
  rebote: 'Rebote',
  atletismo: 'Atletismo',
  iq_juego: 'IQ de Juego',
  mentalidad: 'Mentalidad',
};

export const LEVEL_LABELS: Record<TipLevel, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export const FORMAT_LABELS: Record<TipFormat, string> = {
  tip_rapido: 'Tip rapido',
  drill: 'Drill',
  concepto: 'Concepto',
};
