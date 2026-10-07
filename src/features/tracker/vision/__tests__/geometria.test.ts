import { aroDesdeToque, frameAVista, vistaAFrame } from '../geometria';

describe('geometria cover', () => {
  // Vista vertical 400x800 mostrando un frame 360x640 (16:9 vertical):
  // escala = max(400/360, 800/640) = 1.25 -> mostrado 450x800, recorte 25px por lado.
  const vista = { width: 400, height: 800 };
  const frame = { width: 360, height: 640 };

  it('el centro de la vista es el centro del frame', () => {
    const p = vistaAFrame({ x: 200, y: 400 }, vista, frame);
    expect(p.x).toBeCloseTo(0.5);
    expect(p.y).toBeCloseTo(0.5);
  });

  it('deshace el recorte horizontal', () => {
    const p = vistaAFrame({ x: 0, y: 0 }, vista, frame);
    expect(p.x).toBeCloseTo(25 / 450);
    expect(p.y).toBeCloseTo(0);
  });

  it('frameAVista es la inversa', () => {
    const ida = vistaAFrame({ x: 123, y: 456 }, vista, frame);
    const vuelta = frameAVista(ida, vista, frame);
    expect(vuelta.x).toBeCloseTo(123);
    expect(vuelta.y).toBeCloseTo(456);
  });

  it('aroDesdeToque centra la caja en el toque', () => {
    const aro = aroDesdeToque({ x: 200, y: 200 }, 90, vista, frame);
    expect(aro.x + aro.width / 2).toBeCloseTo(0.5);
    expect(aro.width).toBeCloseTo(90 / 450);
    expect(aro.score).toBe(1);
  });
});
