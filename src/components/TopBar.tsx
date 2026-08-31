import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, sizes, spacing } from '@/theme';

import { AppText } from './AppText';

interface TopBarProps {
  titulo?: string;
  onBack?: () => void;
  onClose?: () => void;
  /** Acción a la derecha, ej. buscar o ayuda. */
  accion?: { icono: keyof typeof MaterialIcons.glyphMap; onPress: () => void; label: string };
  /** Muestra el wordmark EzyBall en vez del título. */
  marca?: boolean;
}

export function TopBar({ titulo, onBack, onClose, accion, marca = false }: TopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top }]}>
      <View style={styles.fila}>
        <View style={styles.lateral}>
          {onBack || onClose ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={onClose ? 'Cerrar' : 'Volver'}
              hitSlop={12}
              onPress={onClose ?? onBack}
              style={styles.boton}
            >
              <MaterialIcons
                name={onClose ? 'close' : 'arrow-back'}
                size={sizes.iconMd}
                color={colors.onSurface}
              />
            </Pressable>
          ) : null}
        </View>

        <AppText
          variant={marca ? 'headlineMd' : 'titleSm'}
          color={marca ? colors.primary : colors.onSurface}
          numberOfLines={1}
          center
          style={styles.titulo}
        >
          {marca ? 'EzyBall' : titulo}
        </AppText>

        <View style={styles.lateral}>
          {accion ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={accion.label}
              hitSlop={12}
              onPress={accion.onPress}
              style={styles.boton}
            >
              <MaterialIcons name={accion.icono} size={sizes.iconMd} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  lateral: {
    width: sizes.minTouchTarget,
    alignItems: 'center',
  },
  boton: {
    padding: spacing.xs,
  },
  titulo: {
    flex: 1,
  },
});
