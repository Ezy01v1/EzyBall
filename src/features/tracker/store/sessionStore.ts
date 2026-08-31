import { create } from 'zustand';

import type { CourtZoneId } from '@/types/court';
import type { Shot, ShotResult, ShotSource, TrainingSession } from '@/types/session';
import { createId } from '@/utils/id';

import { computeSessionSummary } from '../logic/sessionSummary';

/** Cómo se están registrando los tiros en la sesión en curso. */
export type ModoRegistro = 'auto' | 'manual';

interface SessionState {
  activa: boolean;
  /** Epoch ms del inicio. Todos los timestamps de tiro son relativos a esto. */
  iniciadaEn: number | null;
  zonaActual: CourtZoneId;
  etiqueta: string;
  modo: ModoRegistro;
  tiros: Shot[];

  iniciar: (zona: CourtZoneId, modo: ModoRegistro, etiqueta: string) => void;
  cambiarZona: (zona: CourtZoneId) => void;
  registrarTiro: (resultado: ShotResult, fuente: ShotSource, confianza?: number) => void;
  /** Deshace el último tiro. Imprescindible cuando el detector se equivoca. */
  deshacerUltimo: () => void;
  finalizar: (usuarioId: string) => TrainingSession | null;
  descartar: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activa: false,
  iniciadaEn: null,
  zonaActual: 'right_wing',
  etiqueta: 'Sesión de tiro',
  modo: 'manual',
  tiros: [],

  iniciar: (zona, modo, etiqueta) =>
    set({
      activa: true,
      iniciadaEn: Date.now(),
      zonaActual: zona,
      modo,
      etiqueta,
      tiros: [],
    }),

  cambiarZona: (zona) => set({ zonaActual: zona }),

  registrarTiro: (resultado, fuente, confianza) => {
    const { activa, iniciadaEn, zonaActual, tiros } = get();
    if (!activa || iniciadaEn == null) return;

    const tiro: Shot = {
      id: createId('tiro'),
      zona: zonaActual,
      resultado,
      timestamp: Date.now() - iniciadaEn,
      fuente,
      ...(confianza != null ? { confianza } : {}),
    };

    set({ tiros: [...tiros, tiro] });
  },

  deshacerUltimo: () => {
    const { tiros } = get();
    if (tiros.length === 0) return;
    set({ tiros: tiros.slice(0, -1) });
  },

  finalizar: (usuarioId) => {
    const { activa, iniciadaEn, tiros, etiqueta } = get();
    if (!activa || iniciadaEn == null) return null;

    const sesion: TrainingSession = {
      id: createId('ses'),
      usuarioId,
      fecha: new Date(iniciadaEn).toISOString(),
      duracion: Math.round((Date.now() - iniciadaEn) / 1000),
      etiqueta,
      tiros,
      resumen: computeSessionSummary(tiros),
      sincronizada: false,
    };

    set({ activa: false, iniciadaEn: null, tiros: [] });
    return sesion;
  },

  descartar: () => set({ activa: false, iniciadaEn: null, tiros: [] }),
}));

/** Contador en vivo de la zona actual, para el HUD de grabación. */
export function useZoneCounters(): { aciertos: number; intentos: number } {
  const tiros = useSessionStore((state) => state.tiros);
  const zona = useSessionStore((state) => state.zonaActual);

  const deLaZona = tiros.filter((tiro) => tiro.zona === zona);
  return {
    aciertos: deLaZona.filter((tiro) => tiro.resultado === 'canasta').length,
    intentos: deLaZona.length,
  };
}
