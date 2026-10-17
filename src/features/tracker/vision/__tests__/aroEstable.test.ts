import { acumularAro, crearEstadoAroEstable } from '../aroEstable';
import type { Box } from '../types';

const aro = (x = 0.4, y = 0.2, score = 0.9): Box => ({ x, y, width: 0.1, height: 0.09, score });
const alimentar = (cajas: (Box | null)[]) => cajas.reduce(
  (acc, c) => acumularAro(acc.estado, c), { estado: crearEstadoAroEstable(), estable: null as Box | null });

describe('aroEstable', () => {
  it('no es estable con 7 frames', () => expect(alimentar(Array(7).fill(aro())).estable).toBeNull());
  it('es estable con 8 frames', () => expect(alimentar(Array(8).fill(aro())).estable).toMatchObject({ x: 0.4, y: 0.2 }));
  it('devuelve el promedio', () => {
    const r = alimentar([...Array(7).fill(aro(0.4)), aro(0.408)]);
    expect(r.estable?.x).toBeCloseTo(0.401);
  });
  it('se reinicia si el aro desaparece', () =>
    expect(alimentar([...Array(7).fill(aro()), null, aro()]).estable).toBeNull());
  it('se reinicia si baja de score', () =>
    expect(alimentar([...Array(7).fill(aro()), aro(0.4, 0.2, 0.3), aro()]).estable).toBeNull());
  it('se reinicia si el aro salta a otra canasta', () => {
    // 0.4 -> 0.8: 4 anchos de aro, muy por encima del 15 %
    const r = alimentar([...Array(7).fill(aro(0.4)), ...Array(8).fill(aro(0.8))]);
    expect(r.estable?.x).toBeCloseTo(0.8);
  });
  it('tolera deriva menor al 15 %', () =>
    expect(alimentar([...Array(4).fill(aro(0.4)), ...Array(4).fill(aro(0.414))]).estable).not.toBeNull());
  it('promedia solo los últimos N frames tras un cambio gradual', () => {
    // Ancla 0.4 en los primeros 8 frames; luego 0.41 durante 8: la ventana debe ser 0.41.
    const r = alimentar([...Array(8).fill(aro(0.4)), ...Array(8).fill(aro(0.41))]);
    expect(r.estable?.x).toBeCloseTo(0.41, 4);
  });
  it('no muta el estado de entrada', () => {
    const e = crearEstadoAroEstable();
    acumularAro(e, aro());
    expect(e.racha).toHaveLength(0);
  });
});
