import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import {
  initializeFirestore,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/**
 * La app tiene que arrancar y ser usable ANTES de que exista un proyecto de
 * Firebase: la Biblioteca trae contenido semilla empaquetado y las sesiones se
 * guardan en el dispositivo. Cuando faltan credenciales entramos en "modo
 * local" en vez de reventar en el arranque.
 */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

function getApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (!app) {
    app = getApps()[0] ?? initializeApp(config as Required<typeof config>);
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const instance = getApp();
  if (!instance) return null;
  if (!authInstance) {
    // La persistencia por defecto del SDK web usa APIs de navegador que no
    // existen en React Native: hay que cablear AsyncStorage a mano para que la
    // sesion sobreviva al cierre de la app.
    const withPersistence = (
      FirebaseAuth as unknown as {
        getReactNativePersistence?: (storage: unknown) => unknown;
      }
    ).getReactNativePersistence;

    try {
      authInstance = withPersistence
        ? FirebaseAuth.initializeAuth(instance, {
            persistence: withPersistence(AsyncStorage) as never,
          })
        : FirebaseAuth.initializeAuth(instance);
    } catch {
      // initializeAuth lanza si ya se inicializo (p. ej. tras un fast refresh).
      authInstance = FirebaseAuth.getAuth(instance);
    }
  }
  return authInstance;
}

export function getDb(): Firestore | null {
  const instance = getApp();
  if (!instance) return null;
  if (!dbInstance) {
    // Cache en memoria a proposito: la persistencia offline del SDK web depende
    // de IndexedDB. Nuestro offline-first lo resuelve tipsRepository /
    // sessionRepository sobre AsyncStorage, que si funciona en RN.
    dbInstance = initializeFirestore(instance, { localCache: memoryLocalCache() });
  }
  return dbInstance;
}

export const COLLECTIONS = {
  tips: 'tips',
  usuarios: 'usuarios',
  /** Subcoleccion: usuarios/{uid}/sesiones/{sessionId} */
  sesiones: 'sesiones',
} as const;
