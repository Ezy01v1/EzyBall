import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, typography, type TypographyVariant } from '@/theme';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
}

/**
 * Único punto de entrada para texto en la app.
 *
 * Usar `<Text>` de React Native directamente está desaconsejado: se pierde la
 * fuente del design system y el texto cae al sistema, que en Android rompe la
 * jerarquía visual de la pantalla entera.
 */
export function AppText({
  variant = 'bodyMd',
  color = colors.onSurface,
  center = false,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        typography[variant] as TextStyle,
        { color },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
