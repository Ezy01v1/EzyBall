import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';

import { readJson, storageKeys, writeJson } from '@/services/storage';

interface FavoritesState {
  ids: string[];
  hidratado: boolean;
  hidratar: () => Promise<void>;
  alternar: (tipId: string) => void;
  esFavorito: (tipId: string) => boolean;
}

/**
 * Favoritos: estado local puro.
 *
 * Vive solo en el dispositivo por ahora. Cuando el usuario tenga cuenta, este
 * mismo array se sube a `usuarios/{uid}` para sincronizar entre dispositivos
 * (ver docs/ARQUITECTURA.md > Sincronización).
 */
export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: [],
  hidratado: false,

  hidratar: async () => {
    if (get().hidratado) return;
    const guardados = (await readJson<string[]>(storageKeys.favoritos)) ?? [];
    set({ ids: guardados, hidratado: true });
  },

  alternar: (tipId) => {
    const actuales = get().ids;
    const siguientes = actuales.includes(tipId)
      ? actuales.filter((id) => id !== tipId)
      : [tipId, ...actuales];

    set({ ids: siguientes });
    // Fire-and-forget: la UI ya reaccionó, la persistencia no debe bloquearla.
    void writeJson(storageKeys.favoritos, siguientes);
  },

  esFavorito: (tipId) => get().ids.includes(tipId),
}));

/** Hook de conveniencia que garantiza la hidratación desde AsyncStorage. */
export function useFavorites() {
  const ids = useFavoritesStore((state) => state.ids);
  const hidratado = useFavoritesStore((state) => state.hidratado);
  const hidratar = useFavoritesStore((state) => state.hidratar);
  const alternar = useFavoritesStore((state) => state.alternar);
  const [listo, setListo] = useState(hidratado);

  useEffect(() => {
    if (hidratado) {
      setListo(true);
      return;
    }
    void hidratar().then(() => setListo(true));
  }, [hidratado, hidratar]);

  const esFavorito = useCallback((tipId: string) => ids.includes(tipId), [ids]);

  return { ids, alternar, esFavorito, listo };
}
