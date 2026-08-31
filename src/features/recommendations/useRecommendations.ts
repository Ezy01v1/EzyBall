import { useEffect, useState } from 'react';

import { useTips } from '@/features/library/hooks/useTips';
import { useFavorites } from '@/features/library/hooks/useFavorites';
import { aggregateRecentSummary } from '@/features/tracker/data/sessionRepository';
import type { SessionSummary } from '@/types/session';
import type { TipLevel } from '@/types/tip';

import { recommendTips, type Recommendation } from './engine';

/**
 * Recomendaciones basadas en el histórico reciente del usuario (últimas 10
 * sesiones agregadas, no solo la última). Se recalcula al montar cada pantalla
 * que las use; el coste es despreciable porque todo está en memoria.
 */
export function useRecommendations(nivel?: TipLevel, limite = 5): {
  recomendaciones: Recommendation[];
  resumen: SessionSummary | null;
  cargando: boolean;
} {
  const { tips, cargando: cargandoTips } = useTips();
  const { ids: favoritos } = useFavorites();
  const [resumen, setResumen] = useState<SessionSummary | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(true);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const agregado = await aggregateRecentSummary();
      if (!vivo) return;
      setResumen(agregado.totalIntentos > 0 ? agregado : null);
      setCargandoResumen(false);
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const recomendaciones =
    tips.length > 0 ? recommendTips(resumen, tips, { nivel, favoritos, limite }) : [];

  return { recomendaciones, resumen, cargando: cargandoTips || cargandoResumen };
}

/**
 * Variante para la pantalla de resumen: recomienda a partir de UNA sesión
 * concreta, que es lo que el usuario acaba de vivir y espera ver reflejado.
 */
export function useRecommendationsForSummary(
  resumen: SessionSummary | null,
  nivel?: TipLevel,
  limite = 3,
): Recommendation[] {
  const { tips } = useTips();
  const { ids: favoritos } = useFavorites();

  if (tips.length === 0) return [];
  return recommendTips(resumen, tips, { nivel, favoritos, limite });
}
