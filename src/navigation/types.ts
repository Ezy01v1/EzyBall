import type { NavigatorScreenParams } from '@react-navigation/native';

import type { Box } from '@/features/tracker/vision/types';
import type { CourtZoneId } from '@/types/court';
import type { TipCategory } from '@/types/tip';

export type TabParamList = {
  Home: undefined;
  Biblioteca: undefined;
  Tracker: undefined;
  Perfil: undefined;
};

/**
 * Las pantallas de detalle cuelgan del stack raíz, no de las tabs, porque
 * ninguna de ellas debe mostrar la barra inferior: son flujos focalizados
 * (lectura de un tip, grabación de una sesión) de los que se sale con "atrás".
 */
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;

  Categoria: { categoria: TipCategory; subcategoria?: string; zona?: CourtZoneId };
  DetalleTip: { tipId: string };
  Busqueda: undefined;

  NuevaSesion: undefined;
  Calibracion: { zona: CourtZoneId; etiqueta: string };
  /** `aro`: caja del aro marcada en calibración, normalizada al frame. Solo en modo auto. */
  Grabacion: { zona: CourtZoneId; etiqueta: string; modo: 'auto' | 'manual'; aro?: Box };
  ResumenSesion: { sesionId: string };
  Privacidad: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
