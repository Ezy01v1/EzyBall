import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, sizes, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /** `false` para pantallas de pantalla completa como la cámara. */
  scroll?: boolean;
  /** Deja hueco inferior para la tab bar. */
  conTabBar?: boolean;
  /** Padding horizontal estándar de 20px. */
  padded?: boolean;
  /** `false` cuando la pantalla ya tiene un <TopBar>, que respeta el notch él mismo. */
  insetSuperior?: boolean;
  style?: ViewStyle;
  refreshControl?: React.ComponentProps<typeof ScrollView>['refreshControl'];
}

export function Screen({
  children,
  scroll = true,
  conTabBar = false,
  padded = true,
  insetSuperior = true,
  style,
  refreshControl,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const contenido: ViewStyle = {
    paddingHorizontal: padded ? spacing.screen : 0,
    paddingTop: insetSuperior ? insets.top : 0,
    paddingBottom: (conTabBar ? sizes.tabBarHeight : 0) + insets.bottom + spacing.lg,
  };

  if (!scroll) {
    return <View style={[styles.root, contenido, style]}>{children}</View>;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[contenido, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
