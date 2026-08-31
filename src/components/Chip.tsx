import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

interface ChipProps {
  label: string;
  activo?: boolean;
  onPress?: () => void;
  /** Color de acento del borde cuando no está activo (ej. nivel del tip). */
  acento?: string;
  style?: ViewStyle;
}

/** Píldora de filtro/etiqueta. Ver DESIGN.md > Training Chips. */
export function Chip({ label, activo = false, onPress, acento, style }: ChipProps) {
  const contenido = (
    <View
      style={[
        styles.base,
        {
          backgroundColor: activo ? colors.primaryContainer : colors.surfaceContainerLow,
          borderColor: activo ? colors.hardBorder : (acento ?? colors.outlineVariant),
        },
        style,
      ]}
    >
      <AppText
        variant="labelCaps"
        color={activo ? colors.black : (acento ?? colors.onSurfaceVariant)}
      >
        {label}
      </AppText>
    </View>
  );

  if (!onPress) return contenido;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.95 : 1 }] })}
    >
      {contenido}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
});
