import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme';
import type { Tip, TipCategory } from '@/types/tip';

/**
 * Iconografía por categoría. Se eligen glifos de trazo abierto para respetar
 * el criterio del design system (DESIGN.md > Iconography).
 */
export const ICONO_CATEGORIA: Record<
  TipCategory,
  { set: 'material' | 'community'; name: string }
> = {
  tiro: { set: 'material', name: 'sports-basketball' },
  dribleo: { set: 'community', name: 'gesture' },
  defensa: { set: 'material', name: 'shield' },
  pase: { set: 'material', name: 'swap-horiz' },
  footwork: { set: 'community', name: 'shoe-print' },
  rebote: { set: 'material', name: 'vertical-align-top' },
  atletismo: { set: 'material', name: 'fitness-center' },
  iq_juego: { set: 'material', name: 'psychology' },
  mentalidad: { set: 'material', name: 'self-improvement' },
};

export function IconoCategoria({
  categoria,
  size = 24,
  color = colors.onSurfaceVariant,
}: {
  categoria: TipCategory;
  size?: number;
  color?: string;
}) {
  const icono = ICONO_CATEGORIA[categoria];
  if (icono.set === 'community') {
    return <MaterialCommunityIcons name={icono.name as never} size={size} color={color} />;
  }
  return <MaterialIcons name={icono.name as never} size={size} color={color} />;
}

interface TipThumbnailProps {
  tip: Tip;
  width?: number;
  height?: number;
  style?: ViewStyle;
}

/**
 * Miniatura del tip.
 *
 * Cuando todavía no hay ilustración generada, en vez de una imagen rota se
 * muestra un bloque tipográfico con el glifo de la categoría. Es deliberado:
 * las ilustraciones deben ser genéricas (siluetas y diagramas) y nunca
 * representar jugadores reales identificables, así que el hueco vacío se
 * rellena con el lenguaje visual de la marca, no con una foto cualquiera.
 */
export function TipThumbnail({ tip, width = 100, height, style }: TipThumbnailProps) {
  if (tip.imagenUrl) {
    return (
      <Image
        source={{ uri: tip.imagenUrl }}
        // `ImageStyle` y `ViewStyle` divergen en `overflow`; el estilo que
        // recibimos aquí solo usa la parte común (tamaño y márgenes).
        style={[
          { width, height: height ?? undefined },
          !height && styles.autoAlto,
          style as StyleProp<ImageStyle>,
        ]}
        contentFit="cover"
        transition={150}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View style={[styles.placeholder, { width, height: height ?? undefined }, style]}>
      <IconoCategoria categoria={tip.categoria} size={Math.min(40, width * 0.4)} />
    </View>
  );
}

const styles = StyleSheet.create({
  autoAlto: {
    alignSelf: 'stretch',
  },
  placeholder: {
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.surfaceVariant,
  },
});
