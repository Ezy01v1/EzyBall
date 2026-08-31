import type { Shot } from '@/types/session';
import type { CourtZoneId } from '@/types/court';

import { computeSessionSummary, MIN_INTENTOS_PARA_DIAGNOSTICO } from '../sessionSummary';

let contador = 0;

function tiros(zona: CourtZoneId, aciertos: number, fallos: number): Shot[] {
  const lista: Shot[] = [];
  for (let i = 0; i < aciertos; i += 1) {
    lista.push({ id: `t${contador++}`, zona, resultado: 'canasta', timestamp: contador, fuente: 'manual' });
  }
  for (let i = 0; i < fallos; i += 1) {
    lista.push({ id: `t${contador++}`, zona, resultado: 'fallo', timestamp: contador, fuente: 'manual' });
  }
  return lista;
}

describe('computeSessionSummary', () => {
  it('devuelve porcentajes nulos cuando no hay tiros', () => {
    const resumen = computeSessionSummary([]);

    expect(resumen.totalIntentos).toBe(0);
    expect(resumen.fgPercentTotal).toBeNull();
    expect(resumen.zonaCaliente).toBeNull();
    expect(resumen.zonasAMejorar).toEqual([]);
  });

  it('calcula el total y el desglose por zona', () => {
    const resumen = computeSessionSummary([
      ...tiros('right_corner', 6, 4),
      ...tiros('top_key', 2, 8),
    ]);

    expect(resumen.totalIntentos).toBe(20);
    expect(resumen.totalAciertos).toBe(8);
    expect(resumen.fgPercentTotal).toBe(40);

    const esquina = resumen.porZona.find((zona) => zona.zona === 'right_corner');
    expect(esquina?.fgPercent).toBe(60);
  });

  it('ignora zonas sin muestra suficiente para el diagnóstico', () => {
    // 0/2 en la pintura es ruido: no debe declararse zona débil.
    const resumen = computeSessionSummary([
      ...tiros('paint', 0, MIN_INTENTOS_PARA_DIAGNOSTICO - 3),
      ...tiros('right_wing', 8, 2),
    ]);

    expect(resumen.zonasAMejorar).toEqual([]);
    expect(resumen.zonaCaliente).toBe('right_wing');
  });

  it('marca como zona a mejorar la que baja del 50% con muestra suficiente', () => {
    const resumen = computeSessionSummary([
      ...tiros('left_corner', 2, 8),
      ...tiros('right_wing', 8, 2),
    ]);

    expect(resumen.zonasAMejorar).toEqual(['left_corner']);
    expect(resumen.zonaCaliente).toBe('right_wing');
  });

  it('reporta como máximo dos zonas a mejorar, de peor a mejor', () => {
    const resumen = computeSessionSummary([
      ...tiros('left_corner', 1, 9),
      ...tiros('top_key', 3, 7),
      ...tiros('mid_range', 4, 6),
    ]);

    expect(resumen.zonasAMejorar).toEqual(['left_corner', 'top_key']);
  });

  it('no declara zona caliente si la mejor zona también es débil', () => {
    const resumen = computeSessionSummary([...tiros('paint', 3, 7), ...tiros('top_key', 2, 8)]);

    expect(resumen.zonaCaliente).toBeNull();
    expect(resumen.zonasAMejorar).toContain('paint');
  });
});
