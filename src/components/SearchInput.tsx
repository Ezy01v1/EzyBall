import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, radius, sizes, spacing, typography } from '@/theme';

interface SearchInputProps {
  value: string;
  onChangeText: (texto: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Buscar ejercicios...',
  autoFocus = false,
}: SearchInputProps) {
  return (
    <View style={styles.contenedor}>
      <MaterialIcons
        name="search"
        size={sizes.iconMd}
        color={colors.onSurfaceVariant}
        style={styles.icono}
      />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Buscar en la biblioteca"
        style={styles.input}
      />

      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Borrar búsqueda"
          hitSlop={12}
          onPress={() => onChangeText('')}
          style={styles.limpiar}
        >
          <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    minHeight: sizes.buttonHeight,
  },
  icono: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.onSurface,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    paddingVertical: spacing.md,
  },
  limpiar: {
    marginLeft: spacing.sm,
  },
});
