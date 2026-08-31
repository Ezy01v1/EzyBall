import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing } from '@/theme';
import { LEVEL_LABELS, type Tip } from '@/types/tip';

import { AppText } from './AppText';
import { Chip } from './Chip';
import { TipThumbnail } from './TipThumbnail';

interface TipCardProps {
  tip: Tip;
  onPress: () => void;
  esFavorito?: boolean;
  onToggleFavorito?: () => void;
  /** Línea que explica por qué se recomienda este tip. */
  motivo?: string;
}

const COLOR_NIVEL: Record<Tip['nivel'], string> = {
  principiante: colors.onSurfaceVariant,
  intermedio: colors.primaryContainer,
  avanzado: colors.secondary,
};

/** Fila de la biblioteca: miniatura + metadatos + favorito. */
export function TipCard({ tip, onPress, esFavorito, onToggleFavorito, motivo }: TipCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tip.titulo}
      onPress={onPress}
      style={({ pressed }) => [styles.contenedor, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <TipThumbnail tip={tip} width={100} />

      <View style={styles.cuerpo}>
        <View style={styles.cabecera}>
          <Chip label={LEVEL_LABELS[tip.nivel]} acento={COLOR_NIVEL[tip.nivel]} />

          {onToggleFavorito ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              hitSlop={12}
              onPress={onToggleFavorito}
            >
              <MaterialIcons
                name={esFavorito ? 'star' : 'star-border'}
                size={20}
                color={esFavorito ? colors.primaryContainer : colors.onSurfaceVariant}
              />
            </Pressable>
          ) : null}
        </View>

        <AppText variant="titleSm" numberOfLines={2} style={styles.titulo}>
          {tip.titulo}
        </AppText>

        <AppText variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={2}>
          {tip.resumen}
        </AppText>

        {motivo ? (
          <View style={styles.motivo}>
            <MaterialIcons name="insights" size={sizes.iconSm} color={colors.primaryContainer} />
            <AppText variant="labelCapsSm" color={colors.primaryContainer} style={styles.motivoTexto}>
              {motivo}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    overflow: 'hidden',
  },
  cuerpo: {
    flex: 1,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titulo: {
    marginTop: 2,
  },
  motivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  motivoTexto: {
    flex: 1,
  },
});
