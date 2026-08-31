import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';

interface EmptyStateProps {
  icono?: keyof typeof MaterialIcons.glyphMap;
  titulo: string;
  descripcion?: string;
  accion?: { label: string; onPress: () => void };
}

export function EmptyState({ icono = 'inbox', titulo, descripcion, accion }: EmptyStateProps) {
  return (
    <View style={styles.contenedor}>
      <MaterialIcons name={icono} size={48} color={colors.outlineVariant} />

      <AppText variant="titleSm" center style={styles.titulo}>
        {titulo}
      </AppText>

      {descripcion ? (
        <AppText variant="bodyMd" color={colors.onSurfaceVariant} center>
          {descripcion}
        </AppText>
      ) : null}

      {accion ? (
        <Button
          label={accion.label}
          onPress={accion.onPress}
          variante="secundario"
          style={styles.accion}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  titulo: {
    marginTop: spacing.sm,
  },
  accion: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
