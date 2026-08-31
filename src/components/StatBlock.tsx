import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, spacing } from '@/theme';

import { AppText } from './AppText';

interface StatBlockProps {
  etiqueta: string;
  valor: string;
  /** Sufijo pequeño junto al número, ej. "%" o "/66". */
  sufijo?: string;
  color?: string;
  compacto?: boolean;
  style?: ViewStyle;
}

/**
 * Métrica grande con su etiqueta mono en mayúsculas. La cifra usa Anybody
 * ExtraBold para leerse a un metro de distancia, con el teléfono en el suelo.
 */
export function StatBlock({
  etiqueta,
  valor,
  sufijo,
  color = colors.onSurface,
  compacto = false,
  style,
}: StatBlockProps) {
  return (
    <View style={style}>
      <AppText variant="labelCaps" color={colors.onSurfaceVariant} style={styles.etiqueta}>
        {etiqueta}
      </AppText>
      <View style={styles.fila}>
        <AppText variant={compacto ? 'statsNumSm' : 'statsNum'} color={color}>
          {valor}
        </AppText>
        {sufijo ? (
          <AppText variant="titleSm" color={colors.onSurfaceVariant} style={styles.sufijo}>
            {sufijo}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  etiqueta: {
    marginBottom: spacing.xs,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sufijo: {
    marginLeft: 2,
  },
});
