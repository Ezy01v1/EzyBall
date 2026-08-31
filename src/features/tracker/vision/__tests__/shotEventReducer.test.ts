import {
  createReducerState,
  DEFAULT_CONFIG,
  reduceFrame,
  validarEncuadre,
  type ReducerState,
} from '../shotEventReducer';
import type { Box, FrameDetection, ShotEvent } from '../types';

/** Aro fijo en el centro-alto del frame, tamaño típico a media cancha. */
const ARO: Box = { x: 0.45, y: 0.28, width: 0.1, height: 0.05, score: 0.9 };

function balon(x: number, y: number, score = 0.8): Box {
  return { x: x - 0.03, y: y - 0.03, width: 0.06, height: 0.06, score };
}

/** Reproduce una trayectoria y devuelve los eventos emitidos. */
function reproducir(frames: FrameDetection[]): { eventos: ShotEvent[]; estado: ReducerState } {
  let estado = createReducerState();
  const eventos: ShotEvent[] = [];

  for (const frame of frames) {
    const resultado = reduceFrame(estado, frame, DEFAULT_CONFIG);
    estado = resultado.state;
    if (resultado.event) eventos.push(resultado.event);
  }

  return { eventos, estado };
}

/** Trayectoria descendente desde `desdeY` hasta `hastaY` en la columna `x`. */
function caida(x: number, desdeY: number, hastaY: number, inicioMs = 0, pasoMs = 33): FrameDetection[] {
  const frames: FrameDetection[] = [];
  const pasos = 12;

  for (let i = 0; i <= pasos; i += 1) {
    const y = desdeY + ((hastaY - desdeY) * i) / pasos;
    frames.push({ timestamp: inicioMs + i * pasoMs, aro: ARO, balon: balon(x, y) });
  }

  return frames;
}

describe('reduceFrame', () => {
  it('no emite nada sin aro detectado', () => {
    const { eventos } = reproducir([{ timestamp: 0, aro: null, balon: balon(0.5, 0.1) }]);
    expect(eventos).toEqual([]);
  });

  it('cuenta canasta cuando el balón cae por el centro del aro', () => {
    // x = 0.5 es el centro exacto del aro.
    const { eventos } = reproducir(caida(0.5, 0.05, 0.55));

    expect(eventos).toHaveLength(1);
    expect(eventos[0]?.resultado).toBe('canasta');
    expect(eventos[0]?.confianza).toBeGreaterThan(0.5);
  });

  it('cuenta fallo cuando el balón pasa claramente al lado del aro', () => {
    // Dentro de la banda de aproximación (2 anchos de aro) pero muy lejos del
    // cilindro: es el tiro que se va largo por un lado.
    const { eventos } = reproducir(caida(0.66, 0.05, 0.55));

    expect(eventos).toHaveLength(1);
    expect(eventos[0]?.resultado).toBe('fallo');
  });

  it('ignora al jugador botando por debajo del aro', () => {
    // El balón nunca aparece por encima del aro: no se arma ningún tiro.
    const frames: FrameDetection[] = [];
    for (let i = 0; i < 30; i += 1) {
      const y = 0.7 + (i % 2) * 0.05;
      frames.push({ timestamp: i * 33, aro: ARO, balon: balon(0.5, y) });
    }

    expect(reproducir(frames).eventos).toEqual([]);
  });

  it('resuelve como fallo si el balón desaparece tras armar el tiro', () => {
    const frames: FrameDetection[] = [
      { timestamp: 0, aro: ARO, balon: balon(0.5, 0.1) },
      { timestamp: 100, aro: ARO, balon: balon(0.5, 0.15) },
      // El balón sale de cuadro y no vuelve.
      { timestamp: 3000, aro: ARO, balon: null },
    ];

    const { eventos } = reproducir(frames);
    expect(eventos).toHaveLength(1);
    expect(eventos[0]?.resultado).toBe('fallo');
  });

  it('no cuenta dos veces un rebote inmediato', () => {
    // Dos pasadas seguidas dentro de la ventana de debounce (900 ms).
    const frames = [...caida(0.5, 0.05, 0.55, 0), ...caida(0.5, 0.05, 0.55, 500)];

    const { eventos } = reproducir(frames);
    expect(eventos).toHaveLength(1);
  });

  it('conserva el último aro visto aunque se tape durante el vuelo', () => {
    const frames = caida(0.5, 0.05, 0.55).map((frame, i) => ({
      ...frame,
      // El jugador tapa el aro a mitad de la trayectoria.
      aro: i > 3 ? null : frame.aro,
    }));

    const { eventos } = reproducir(frames);
    expect(eventos).toHaveLength(1);
    expect(eventos[0]?.resultado).toBe('canasta');
  });
});

describe('validarEncuadre', () => {
  it('acepta un aro bien encuadrado', () => {
    expect(validarEncuadre(ARO)).toBeNull();
  });

  it('avisa cuando no hay aro', () => {
    expect(validarEncuadre(null)).toMatch(/aro/i);
  });

  it('avisa cuando el aro se ve demasiado pequeño', () => {
    expect(validarEncuadre({ ...ARO, width: 0.02 })).toMatch(/pequeño/i);
  });

  it('avisa cuando el aro queda demasiado abajo en el encuadre', () => {
    expect(validarEncuadre({ ...ARO, y: 0.8 })).toMatch(/arriba/i);
  });
});
