import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Tip, TipCategory } from '@/types/tip';

import {
  filterTips,
  getTips,
  subcategoriesOf,
  syncTips,
  type TipFilters,
} from '../data/tipsRepository';

interface UseTipsResult {
  tips: Tip[];
  cargando: boolean;
  /** Fuerza una sincronización con Firestore y refresca la lista. */
  refrescar: () => Promise<void>;
}

/**
 * Carga la biblioteca completa desde el cache local y dispara la sync con
 * Firestore en segundo plano. La UI nunca queda bloqueada esperando red.
 */
export function useTips(filters: TipFilters = {}): UseTipsResult {
  const [todos, setTodos] = useState<Tip[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    const locales = await getTips();
    setTodos(locales);
    setCargando(false);
  }, []);

  const refrescar = useCallback(async () => {
    const nuevos = await syncTips();
    if (nuevos > 0) await cargar();
  }, [cargar]);

  useEffect(() => {
    let vivo = true;

    (async () => {
      const locales = await getTips();
      if (!vivo) return;
      setTodos(locales);
      setCargando(false);

      // Sync en segundo plano: si trae contenido nuevo, re-renderiza.
      const nuevos = await syncTips();
      if (vivo && nuevos > 0) {
        setTodos(await getTips());
      }
    })();

    return () => {
      vivo = false;
    };
  }, []);

  // Los filtros se aplican en memoria: la biblioteca cabe holgadamente y así
  // buscar y filtrar funciona sin conexión.
  const tips = useMemo(() => filterTips(todos, filters), [todos, filters]);

  return { tips, cargando, refrescar };
}

/** Conteo de tips publicados por categoría, para las tarjetas de la Biblioteca. */
export function useTipCountByCategory(): Record<string, number> {
  const { tips } = useTips();

  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tip of tips) {
      counts[tip.categoria] = (counts[tip.categoria] ?? 0) + 1;
    }
    return counts;
  }, [tips]);
}

export function useSubcategories(categoria: TipCategory): string[] {
  const { tips } = useTips();
  return useMemo(() => subcategoriesOf(tips, categoria), [tips, categoria]);
}
