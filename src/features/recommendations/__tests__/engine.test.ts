import { SEED_TIPS } from '@/features/library/data/seedTips';
import { computeSessionSummary } from '@/features/tracker/logic/sessionSummary';
import type { CourtZoneId } from '@/types/court';
import type { Shot } from '@/types/session';

import { recommendTips, topRecommendation } from '../engine';

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

describe('recommendTips', () => {
  it('sin datos devuelve fundamentos de arranque en vez de una lista vacía', () => {
    const recomendaciones = recommendTips(null, SEED_TIPS, { nivel: 'principiante' });

    expect(recomendaciones.length).toBeGreaterThan(0);
    expect(recomendaciones[0]?.motivo).toMatch(/empezar/i);
    expect(recomendaciones[0]?.tip.categoria).toBe('tiro');
  });

  it('prioriza tips etiquetados para la zona en la que el usuario falla', () => {
    const resumen = computeSessionSummary([
      ...tiros('right_corner', 2, 12),
      ...tiros('free_throw', 9, 1),
    ]);

    const recomendaciones = recommendTips(resumen, SEED_TIPS, { limite: 3 });
    const primera = recomendaciones[0];

    expect(primera).toBeDefined();
    expect(primera!.zona).toBe('right_corner');
    expect(primera!.tip.zonas).toContain('right_corner');
  });

  it('explica el motivo con el porcentaje real de la zona', () => {
    const resumen = computeSessionSummary(tiros('left_corner', 3, 7));
    const recomendacion = topRecommendation(resumen, SEED_TIPS);

    expect(recomendacion?.motivo).toContain('30%');
    expect(recomendacion?.motivo).toContain('esquina izquierda');
  });

  it('ordena la zona más urgente por delante de la menos urgente', () => {
    const resumen = computeSessionSummary([
      ...tiros('paint', 1, 9), // 10%
      ...tiros('top_key', 5, 5), // 50%
    ]);

    const recomendaciones = recommendTips(resumen, SEED_TIPS, { limite: 5 });
    expect(recomendaciones[0]?.zona).toBe('paint');
  });

  it('baja de prioridad lo que el usuario ya tiene en favoritos', () => {
    const resumen = computeSessionSummary(tiros('free_throw', 2, 8));

    const sinFavoritos = recommendTips(resumen, SEED_TIPS, { limite: 5 });
    const primeroSinFavoritos = sinFavoritos[0]!.tip.id;

    const conFavorito = recommendTips(resumen, SEED_TIPS, {
      limite: 5,
      favoritos: [primeroSinFavoritos],
    });

    expect(conFavorito[0]?.tip.id).not.toBe(primeroSinFavoritos);
  });

  it('nunca devuelve menos tips de los pedidos si hay contenido disponible', () => {
    // La pintura tiene poco contenido etiquetado: debe rellenar con generales.
    const resumen = computeSessionSummary(tiros('paint', 1, 9));
    const recomendaciones = recommendTips(resumen, SEED_TIPS, { limite: 5 });

    expect(recomendaciones).toHaveLength(5);
    expect(new Set(recomendaciones.map((rec) => rec.tip.id)).size).toBe(5);
  });
});
