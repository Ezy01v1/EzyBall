/**
 * Zonas de cancha. Son el "pegamento" entre los dos modulos: el Shot Tracker
 * produce estadisticas por zona y la Biblioteca etiqueta tips por la misma
 * zona, lo que permite recomendar contenido segun donde falla el usuario.
 */
export const COURT_ZONE_IDS = [
  'left_corner',
  'right_corner',
  'left_wing',
  'right_wing',
  'top_key',
  'mid_range',
  'free_throw',
  'paint',
] as const;

export type CourtZoneId = (typeof COURT_ZONE_IDS)[number];

export interface CourtZone {
  id: CourtZoneId;
  /** Etiqueta larga para titulares y resumenes. */
  label: string;
  /** Etiqueta corta en mayusculas para el diagrama de cancha. */
  short: string;
  isThreePoint: boolean;
  /**
   * Rectangulo normalizado (0..1) dentro del diagrama de media cancha.
   * Origen arriba-izquierda; el aro esta abajo al centro (y = 1).
   */
  rect: { x: number; y: number; width: number; height: number };
}

export const COURT_ZONES: Record<CourtZoneId, CourtZone> = {
  top_key: {
    id: 'top_key',
    label: 'Tope de la llave',
    short: 'TOPE',
    isThreePoint: true,
    rect: { x: 0.25, y: 0.0, width: 0.5, height: 0.28 },
  },
  left_wing: {
    id: 'left_wing',
    label: 'Ala izquierda',
    short: 'ALA IZQ',
    isThreePoint: true,
    rect: { x: 0.0, y: 0.25, width: 0.25, height: 0.37 },
  },
  right_wing: {
    id: 'right_wing',
    label: 'Ala derecha',
    short: 'ALA DER',
    isThreePoint: true,
    rect: { x: 0.75, y: 0.25, width: 0.25, height: 0.37 },
  },
  mid_range: {
    id: 'mid_range',
    label: 'Media distancia',
    short: 'MEDIA',
    isThreePoint: false,
    rect: { x: 0.25, y: 0.28, width: 0.5, height: 0.22 },
  },
  free_throw: {
    id: 'free_throw',
    label: 'Linea de tiro libre',
    short: 'T. LIBRE',
    isThreePoint: false,
    rect: { x: 0.34, y: 0.5, width: 0.32, height: 0.14 },
  },
  paint: {
    id: 'paint',
    label: 'Pintura',
    short: 'PINTURA',
    isThreePoint: false,
    rect: { x: 0.33, y: 0.64, width: 0.34, height: 0.36 },
  },
  left_corner: {
    id: 'left_corner',
    label: 'Esquina izquierda',
    short: 'ESQ IZQ',
    isThreePoint: true,
    rect: { x: 0.0, y: 0.62, width: 0.16, height: 0.38 },
  },
  right_corner: {
    id: 'right_corner',
    label: 'Esquina derecha',
    short: 'ESQ DER',
    isThreePoint: true,
    rect: { x: 0.84, y: 0.62, width: 0.16, height: 0.38 },
  },
};

export const COURT_ZONE_LIST: CourtZone[] = COURT_ZONE_IDS.map((id) => COURT_ZONES[id]);

export function zoneLabel(id: CourtZoneId): string {
  return COURT_ZONES[id].label;
}
