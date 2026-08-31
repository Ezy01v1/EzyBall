/** Caja normalizada (0..1) sobre el frame. Origen arriba-izquierda. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Confianza del detector 0..1. */
  score: number;
}

/** Salida del modelo para un frame. Cualquiera de los dos puede faltar. */
export interface FrameDetection {
  /** Milisegundos monótonos desde el inicio de la grabación. */
  timestamp: number;
  aro: Box | null;
  balon: Box | null;
}

/** Evento de tiro ya interpretado por el reductor. */
export interface ShotEvent {
  resultado: 'canasta' | 'fallo';
  timestamp: number;
  confianza: number;
}

export const centerX = (box: Box): number => box.x + box.width / 2;
export const centerY = (box: Box): number => box.y + box.height / 2;
