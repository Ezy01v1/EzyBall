import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components';
import { HomeScreen } from '@/features/home/HomeScreen';
import { LibraryScreen } from '@/features/library/screens/LibraryScreen';
import { HistoryScreen } from '@/features/tracker/screens/HistoryScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { colors, radius, sizes, spacing } from '@/theme';

import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const ICONOS: Record<keyof TabParamList, keyof typeof MaterialIcons.glyphMap> = {
  Home: 'home',
  Biblioteca: 'menu-book',
  Tracker: 'query-stats',
  Perfil: 'person',
};

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.barra,
        tabBarShowLabel: false,
        // La pestaña activa se dibuja como una píldora naranja, igual que en el
        // diseño: es la única señal de estado en una barra sin etiquetas fijas.
        tabBarButton: undefined,
        tabBarIcon: ({ focused }) => (
          <ItemTab
            icono={ICONOS[route.name]}
            label={route.name}
            activo={focused}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Biblioteca" component={LibraryScreen} options={{ title: 'Biblioteca' }} />
      <Tab.Screen name="Tracker" component={HistoryScreen} options={{ title: 'Tracker' }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

function ItemTab({
  icono,
  label,
  activo,
}: {
  icono: keyof typeof MaterialIcons.glyphMap;
  label: string;
  activo: boolean;
}) {
  return (
    <View style={[styles.item, activo && styles.itemActivo]}>
      <MaterialIcons
        name={icono}
        size={sizes.iconMd}
        color={activo ? colors.onPrimaryContainer : colors.onSurfaceVariant}
      />
      <AppText
        variant="labelCapsSm"
        color={activo ? colors.onPrimaryContainer : colors.onSurfaceVariant}
        style={styles.etiqueta}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    height: sizes.tabBarHeight,
    backgroundColor: colors.surfaceContainer,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    // El design system evita sombras: la profundidad la da el borde.
    elevation: 0,
    shadowOpacity: 0,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.xl,
    minWidth: 64,
  },
  itemActivo: {
    backgroundColor: colors.primaryContainer,
  },
  etiqueta: {
    marginTop: 2,
  },
});
