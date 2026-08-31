import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { syncPendingSessions } from '@/features/tracker/data/sessionRepository';
import { RootNavigator } from '@/navigation/RootNavigator';
import { colors, useAppFonts } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export default function App() {
  const fuentesListas = useAppFonts();

  return (
    <GestureHandlerRootView style={styles.raiz}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthProvider>
          <Contenido fuentesListas={fuentesListas} />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Contenido({ fuentesListas }: { fuentesListas: boolean }) {
  const { cargando, usuarioId } = useAuth();
  const listo = fuentesListas && !cargando;

  useEffect(() => {
    if (listo) void SplashScreen.hideAsync();
  }, [listo]);

  // Al arrancar con sesión, sube lo que quedó pendiente de la última vez.
  useEffect(() => {
    if (listo && usuarioId) void syncPendingSessions(usuarioId);
  }, [listo, usuarioId]);

  if (!listo) return <View style={styles.raiz} />;

  return <RootNavigator />;
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
