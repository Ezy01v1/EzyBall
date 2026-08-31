import type { CourtZoneId } from './court';

export type ShotResult = 'canasta' | 'fallo';

/** Como se registro el tiro: util para medir la precision del detector. */
export type ShotSource = 'auto' | 'manual' | 'correccion';

export interface Shot {
  id: string;
  zona: CourtZoneId;
  resultado: ShotResult;
  /** Milisegundos desde el inicio de la sesion. */
  timestamp: number;
  fuente: ShotSource;
  /** Confianza del detector 0..1. Solo presente cuando `fuente === 'auto'`. */
  confianza?: number;
}

export interface ZoneStats {
  zona: CourtZoneId;
  intentos: number;
  aciertos: number;
  /** 0..100. `null` cuando no hubo intentos en la zona. */
  fgPercent: number | null;
}

export interface SessionSummary {
  totalIntentos: number;
  totalAciertos: number;
  fgPercentTotal: number | null;
  porZona: ZoneStats[];
  /** Zona con mejor porcentaje por encima del umbral de muestra minima. */
  zonaCaliente: CourtZoneId | null;
  /** Hasta 2 zonas con peor porcentaje. Alimentan las recomendaciones. */
  zonasAMejorar: CourtZoneId[];
}

export interface TrainingSession {
  id: string;
  usuarioId: string;
  /** ISO 8601. */
  fecha: string;
  /** Duracion en segundos. */
  duracion: number;
  /** Etiqueta libre del drill, ej. "Catch & Shoot". */
  etiqueta: string;
  tiros: Shot[];
  resumen: SessionSummary;
  /**
   * `false` mientras la sesion vive solo en el dispositivo. El sincronizador
   * la sube a Firestore cuando hay conexion. El video nunca se sube.
   */
  sincronizada: boolean;
}
