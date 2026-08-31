import { useFonts } from 'expo-font';
import {
  Anybody_600SemiBold,
  Anybody_700Bold,
  Anybody_800ExtraBold,
} from '@expo-google-fonts/anybody';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';

/**
 * Carga las tres familias del design system. Devuelve `true` cuando la UI
 * puede montarse sin fallback tipografico.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Anybody_600SemiBold,
    Anybody_700Bold,
    Anybody_800ExtraBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
    JetBrainsMono_600SemiBold,
  });

  // Si una fuente falla no bloqueamos la app: mejor render con la fuente del
  // sistema que una pantalla de splash infinita en la cancha.
  return loaded || error != null;
}
