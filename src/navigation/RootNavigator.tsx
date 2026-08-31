import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OnboardingScreen } from '@/features/auth/OnboardingScreen';
import { useAuth } from '@/features/auth/AuthProvider';
import { CategoryScreen } from '@/features/library/screens/CategoryScreen';
import { TipDetailScreen } from '@/features/library/screens/TipDetailScreen';
import { PrivacyScreen } from '@/features/profile/PrivacyScreen';
import { CalibrationScreen } from '@/features/tracker/screens/CalibrationScreen';
import { LiveRecordingScreen } from '@/features/tracker/screens/LiveRecordingScreen';
import { NewSessionScreen } from '@/features/tracker/screens/NewSessionScreen';
import { SessionSummaryScreen } from '@/features/tracker/screens/SessionSummaryScreen';
import { colors } from '@/theme';

import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const tema: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primaryContainer,
    background: colors.background,
    card: colors.surfaceContainer,
    text: colors.onSurface,
    border: colors.outlineVariant,
    notification: colors.secondaryContainer,
  },
};

export function RootNavigator() {
  const { perfil } = useAuth();

  return (
    <NavigationContainer theme={tema}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        {!perfil.onboardingVisto ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} />

            <Stack.Screen name="Categoria" component={CategoryScreen} />
            <Stack.Screen name="DetalleTip" component={TipDetailScreen} />

            {/* Flujo del tracker. La grabación entra como modal a pantalla
                completa: es un contexto del que se sale deteniendo la sesión,
                no deslizando hacia atrás por accidente. */}
            <Stack.Screen name="NuevaSesion" component={NewSessionScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Calibracion" component={CalibrationScreen} />
            <Stack.Screen
              name="Grabacion"
              component={LiveRecordingScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="ResumenSesion" component={SessionSummaryScreen} />

            <Stack.Screen name="Privacidad" component={PrivacyScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
