import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

interface CardProps {
  children: ReactNode;
  /** Barra superior de color que codifica la métrica (caliente / fría). */
  acentoSuperior?: string;
  onPress?: () => void;
  padded?: boolean;
  style?: ViewStyle;
}

/**
 * Superficie contenedora. El design system evita sombras y define la
 * profundidad con un borde duro de 1px sobre un charcoal elevado
 * (DESIGN.md > Elevation & Depth).
 */
export function Card({ children, acentoSuperior, onPress, padded = true, style }: CardProps) {
  const contenido = (
    <View
      style={[
        styles.base,
        padded && { padding: spacing.md },
        acentoSuperior ? { borderTopColor: acentoSuperior, borderTopWidth: 3 } : null,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return contenido;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
    >
      {contenido}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hardBorder,
    overflow: 'hidden',
  },
});
