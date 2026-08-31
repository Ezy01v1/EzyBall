import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Envoltorio tipado sobre AsyncStorage. Toda la persistencia local pasa por
 * aqui para poder cambiar el motor (p. ej. a expo-sqlite) en un solo sitio.
 */
export const storageKeys = {
  tips: 'ezyball:tips:v1',
  tipsSyncedAt: 'ezyball:tips:syncedAt:v1',
  favoritos: 'ezyball:favoritos:v1',
  sesiones: 'ezyball:sesiones:v1',
  onboardingVisto: 'ezyball:onboarding:v1',
  perfil: 'ezyball:perfil:v1',
} as const;

export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    // Un cache corrupto no debe impedir que la app abra: se trata como vacio.
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin espacio o storage bloqueado: se pierde el cache, no los datos en vuelo.
  }
}

export async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    /* no-op */
  }
}
