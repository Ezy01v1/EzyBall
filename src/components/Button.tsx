import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, sizes, spacing, typography } from '@/theme';

import { AppText } from './AppText';

type Variante = 'primario' | 'secundario' | 'peligro';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variante?: Variante;
  icono?: keyof typeof MaterialIcons.glyphMap;
  deshabilitado?: boolean;
  grande?: boolean;
  style?: ViewStyle;
}

/**
 * Botón principal de la app.
 *
 * Altura mínima 56px (64 en la variante grande) porque el usuario lo pulsa
 * entrenando, con el pulgar y en movimiento — ver DESIGN.md > Components.
 * El háptico da confirmación cuando la pantalla está a un metro de distancia.
 */
export function Button({
  label,
  onPress,
  variante = 'primario',
  icono,
  deshabilitado = false,
  grande = false,
  style,
}: ButtonProps) {
  const paleta = PALETAS[variante];

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: paleta.fondo,
          borderColor: paleta.borde,
          minHeight: grande ? sizes.buttonHeightLarge : sizes.buttonHeight,
          opacity: deshabilitado ? 0.4 : 1,
          transform: [{ scale: pressed && !deshabilitado ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      <View style={styles.contenido}>
        {icono ? (
          <MaterialIcons name={icono} size={sizes.iconMd} color={paleta.texto} />
        ) : null}
        <AppText variant="headlineMd" color={paleta.texto} style={styles.label}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const PALETAS: Record<Variante, { fondo: string; borde: string; texto: string }> = {
  primario: {
    fondo: colors.primaryContainer,
    borde: colors.inversePrimary,
    texto: colors.black,
  },
  secundario: {
    fondo: colors.surfaceContainerLow,
    borde: colors.hardBorder,
    texto: colors.onSurface,
  },
  peligro: {
    fondo: colors.secondaryContainer,
    borde: colors.errorContainer,
    texto: colors.onSecondaryContainer,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: typography.headlineMd.fontFamily,
  },
});
