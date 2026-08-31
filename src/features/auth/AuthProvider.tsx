import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';

import { getFirebaseAuth, isFirebaseConfigured } from '@/services/firebase';
import { readJson, remove, storageKeys, writeJson } from '@/services/storage';
import type { TipLevel } from '@/types/tip';

/** Id que se usa cuando no hay Firebase: todo queda en el dispositivo. */
export const USUARIO_LOCAL = 'local';

export interface Perfil {
  nombre: string;
  nivel: TipLevel;
  onboardingVisto: boolean;
}

const PERFIL_INICIAL: Perfil = {
  nombre: 'Jugador',
  nivel: 'principiante',
  onboardingVisto: false,
};

interface AuthContextValue {
  usuarioId: string;
  perfil: Perfil;
  cargando: boolean;
  /** `false` cuando la app corre sin backend: la UI lo dice explícitamente. */
  conCuenta: boolean;
  actualizarPerfil: (cambios: Partial<Perfil>) => void;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Sesión y perfil.
 *
 * Decisión: el MVP entra con autenticación anónima de Firebase. El objetivo es
 * validar rápido con usuarios reales, y una pantalla de registro antes de ver
 * nada de valor es la forma más eficaz de perderlos. La cuenta con email se
 * puede vincular después sin perder el historial, porque `linkWithCredential`
 * conserva el mismo uid.
 *
 * Si no hay Firebase configurado, la app funciona igual con un usuario local.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuarioId, setUsuarioId] = useState<string>(USUARIO_LOCAL);
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_INICIAL);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;

    (async () => {
      const guardado = await readJson<Perfil>(storageKeys.perfil);
      if (vivo && guardado) setPerfil({ ...PERFIL_INICIAL, ...guardado });

      const auth = getFirebaseAuth();
      if (!auth) {
        if (vivo) setCargando(false);
        return;
      }

      const desuscribir = onAuthStateChanged(auth, async (usuario) => {
        if (!vivo) return;

        if (usuario) {
          setUsuarioId(usuario.uid);
          setCargando(false);
          return;
        }

        try {
          const credencial = await signInAnonymously(auth);
          if (vivo) setUsuarioId(credencial.user.uid);
        } catch {
          // Sin red en el primer arranque: seguimos en local y se reintenta
          // en la próxima apertura. Los datos locales se suben cuando haya uid.
          if (vivo) setUsuarioId(USUARIO_LOCAL);
        } finally {
          if (vivo) setCargando(false);
        }
      });

      return desuscribir;
    })();

    return () => {
      vivo = false;
    };
  }, []);

  const actualizarPerfil = useCallback((cambios: Partial<Perfil>) => {
    setPerfil((actual) => {
      const siguiente = { ...actual, ...cambios };
      void writeJson(storageKeys.perfil, siguiente);
      return siguiente;
    });
  }, []);

  const cerrarSesion = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
    await remove(storageKeys.perfil);
    setPerfil(PERFIL_INICIAL);
    setUsuarioId(USUARIO_LOCAL);
  }, []);

  const valor = useMemo<AuthContextValue>(
    () => ({
      usuarioId,
      perfil,
      cargando,
      conCuenta: isFirebaseConfigured && usuarioId !== USUARIO_LOCAL,
      actualizarPerfil,
      cerrarSesion,
    }),
    [usuarioId, perfil, cargando, actualizarPerfil, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return contexto;
}
