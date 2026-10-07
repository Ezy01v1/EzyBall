import { configAuto, parseOutput, PERFIL_COCO, PERFIL_HOOP_BALL, type PerfilModelo } from '../hoopDetector';

/** Cajas `[ymin, xmin, ymax, xmax]` -> Float32Array plano, como lo entrega el modelo. */
function cajas(...lista: number[][]): Float32Array {
  return new Float32Array(lista.flat());
}

const A = [0.1, 0.2, 0.3, 0.4];
const B = [0.5, 0.5, 0.6, 0.6];

describe('parseOutput', () => {
  const hoop: PerfilModelo = { ...PERFIL_HOOP_BALL, claseAro: 1, claseBalon: 2 };

  it('devuelve aro y balón con el perfil de dos clases', () => {
    const r = parseOutput(cajas([0.1, 0.4, 0.2, 0.5], [0.5, 0.5, 0.55, 0.55]), [1, 2], [0.9, 0.8], hoop);
    expect(r.aro).toEqual({ x: expect.closeTo(0.4), y: expect.closeTo(0.1), width: expect.closeTo(0.1), height: expect.closeTo(0.1), score: 0.9 });
    expect(r.balon?.score).toBe(0.8);
  });

  it('se queda con el de mayor score por clase', () => {
    const r = parseOutput(cajas(A, B), [1, 1], [0.5, 0.7], hoop);
    expect(r.aro?.score).toBe(0.7);
    expect(r.balon).toBeNull();
  });

  it('tolera clases con ruido de coma flotante', () => {
    expect(parseOutput(cajas(A), [1.0000001], [0.9], hoop).aro).not.toBeNull();
  });

  it('perfil COCO: aro siempre null, solo clase 36', () => {
    const r = parseOutput(cajas(A, B), [36, 0], [0.6, 0.9], PERFIL_COCO);
    expect(r.aro).toBeNull();
    expect(r.balon?.score).toBe(0.6);
  });

  it('sin detecciones devuelve ambos null', () => {
    expect(parseOutput(new Float32Array(0), [], [], hoop)).toEqual({ aro: null, balon: null });
  });
});

describe('configAuto', () => {
  it('toma el scoreMinimo del perfil', () => {
    expect(configAuto(PERFIL_COCO).scoreMinimo).toBe(0.3);
    expect(configAuto({ ...PERFIL_HOOP_BALL, scoreMinimo: 0.45 }).scoreMinimo).toBe(0.45);
  });
});
