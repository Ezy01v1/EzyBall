import { anchorDeIndice, ANCHORS_HOOP_BALL, parseOutputCrudo, totalAnchors } from '../ssdCrudo';

/**
 * Anchors reales (x, y, w, h) leídos de los metadatos de hoop-ball.tflite con
 * training/verificar_decodificacion.py: uno de cada 997 más el último.
 */
const MUESTRA: [number, [number, number, number, number]][] = [
  [0, [0.010417, 0.010417, 0.044194, 0.088388]],
  [997, [0.302083, 0.052083, 0.099213, 0.099213]],
  [1994, [0.614583, 0.09375, 0.111362, 0.055681]],
  [2991, [0.927083, 0.135417, 0.055681, 0.111362]],
  [3988, [0.239583, 0.197917, 0.0625, 0.0625]],
  [4985, [0.53125, 0.239583, 0.140308, 0.070154]],
  [5982, [0.84375, 0.28125, 0.070154, 0.140308]],
  [6979, [0.15625, 0.34375, 0.078745, 0.078745]],
  [7976, [0.46875, 0.385417, 0.088388, 0.044194]],
  [8973, [0.78125, 0.427083, 0.044194, 0.088388]],
  [9970, [0.072917, 0.489583, 0.099213, 0.099213]],
  [10967, [0.385417, 0.53125, 0.111362, 0.055681]],
  [11964, [0.697917, 0.572917, 0.055681, 0.111362]],
  [12961, [0.010417, 0.635417, 0.0625, 0.0625]],
  [13958, [0.302083, 0.677083, 0.140308, 0.070154]],
  [14955, [0.614583, 0.71875, 0.070154, 0.140308]],
  [15952, [0.927083, 0.760417, 0.078745, 0.078745]],
  [16949, [0.239583, 0.822917, 0.088388, 0.044194]],
  [17946, [0.552083, 0.864583, 0.044194, 0.088388]],
  [18943, [0.84375, 0.90625, 0.099213, 0.099213]],
  [19940, [0.15625, 0.96875, 0.111362, 0.055681]],
  [20937, [0.9375, 0.020833, 0.111362, 0.222725]],
  [21934, [0.5625, 0.229167, 0.125, 0.125]],
  [22931, [0.145833, 0.4375, 0.280615, 0.140308]],
  [23928, [0.770833, 0.604167, 0.140308, 0.280615]],
  [24925, [0.395833, 0.8125, 0.15749, 0.15749]],
  [25922, [0.041667, 0.041667, 0.353553, 0.176777]],
  [26919, [0.291667, 0.791667, 0.176777, 0.353553]],
  [27620, [0.833333, 0.833333, 2.244924, 1.122462]],
];

describe('anchorDeIndice', () => {
  it('hay tantos anchors como cajas devuelve el modelo', () => {
    expect(totalAnchors(ANCHORS_HOOP_BALL)).toBe(27621);
  });

  it.each(MUESTRA)('reproduce el anchor %i de los metadatos', (i, esperado) => {
    const a = anchorDeIndice(i, ANCHORS_HOOP_BALL)!;
    esperado.forEach((v, j) => expect(a[j]).toBeCloseTo(v, 5));
  });

  it('fuera de rango devuelve null', () => {
    expect(anchorDeIndice(-1, ANCHORS_HOOP_BALL)).toBeNull();
    expect(anchorDeIndice(27621, ANCHORS_HOOP_BALL)).toBeNull();
  });
});

describe('parseOutputCrudo', () => {
  const N = totalAnchors(ANCHORS_HOOP_BALL);
  const perfil = { claseAro: 1 as number | null, claseBalon: 2 };

  function salidas() {
    return { cajas: new Float32Array(N * 4), scores: new Float32Array(N * 3) };
  }

  it('con codificación cero la caja es el propio anchor (orden YXHW)', () => {
    const { cajas, scores } = salidas();
    scores[3988 * 3 + 2] = 0.9; // balón en el anchor 3988: centro (0.2396, 0.1979), 0.0625 x 0.0625
    const r = parseOutputCrudo(cajas, scores, 3, ANCHORS_HOOP_BALL, perfil);
    expect(r.aro).toBeNull();
    expect(r.balon).toEqual({
      x: expect.closeTo(0.239583 - 0.03125, 5),
      y: expect.closeTo(0.197917 - 0.03125, 5),
      width: expect.closeTo(0.0625, 5),
      height: expect.closeTo(0.0625, 5),
      score: expect.closeTo(0.9, 5),
    });
  });

  it('aplica desplazamiento y exponencial: [ty, tx, th, tw]', () => {
    const { cajas, scores } = salidas();
    const i = 3988;
    scores[i * 3 + 1] = 0.8;
    cajas.set([1, -1, 0, Math.log(2)], i * 4); // y += 1*h, x -= 1*w, h igual, w doble
    const r = parseOutputCrudo(cajas, scores, 3, ANCHORS_HOOP_BALL, perfil);
    const cx = 0.239583 - 0.0625;
    const cy = 0.197917 + 0.0625;
    expect(r.aro!.x).toBeCloseTo(cx - 0.0625, 5);
    expect(r.aro!.y).toBeCloseTo(cy - 0.03125, 5);
    expect(r.aro!.width).toBeCloseTo(0.125, 5);
    expect(r.aro!.height).toBeCloseTo(0.0625, 5);
  });

  it('se queda con el anchor de mayor score de cada clase e ignora el fondo', () => {
    const { cajas, scores } = salidas();
    scores[10 * 3 + 0] = 0.99; // fondo: nunca cuenta
    scores[20 * 3 + 1] = 0.6;
    scores[30 * 3 + 1] = 0.7;
    scores[40 * 3 + 2] = 0.5;
    const r = parseOutputCrudo(cajas, scores, 3, ANCHORS_HOOP_BALL, perfil);
    expect(r.aro!.score).toBeCloseTo(0.7, 5);
    expect(r.balon!.score).toBeCloseTo(0.5, 5);
  });

  it('recorta la caja al frame', () => {
    const { cajas, scores } = salidas();
    scores[27620 * 3 + 2] = 0.9; // anchor más grande que la imagen
    const b = parseOutputCrudo(cajas, scores, 3, ANCHORS_HOOP_BALL, perfil).balon!;
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(1);
    expect(b.y + b.height).toBeLessThanOrEqual(1);
  });

  it('sin scores positivos devuelve ambos null', () => {
    const { cajas, scores } = salidas();
    expect(parseOutputCrudo(cajas, scores, 3, ANCHORS_HOOP_BALL, perfil)).toEqual({ aro: null, balon: null });
  });
});
