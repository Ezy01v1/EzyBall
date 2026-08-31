/**
 * Paleta "Pro-Level Velocity" — exportada 1:1 desde el design system de Stitch
 * (ver docs/design/DESIGN.md). No inventar colores nuevos: si falta un tono,
 * elegir el rol semantico mas cercano de esta lista.
 */
export const colors = {
  background: '#131313',
  onBackground: '#e5e2e1',

  surface: '#131313',
  surfaceDim: '#131313',
  surfaceBright: '#393939',
  surfaceContainerLowest: '#0e0e0e',
  surfaceContainerLow: '#1c1b1b',
  surfaceContainer: '#201f1f',
  surfaceContainerHigh: '#2a2a2a',
  surfaceContainerHighest: '#353534',
  surfaceVariant: '#353534',
  onSurface: '#e5e2e1',
  onSurfaceVariant: '#e2bfb0',

  inverseSurface: '#e5e2e1',
  inverseOnSurface: '#313030',

  outline: '#a98a7d',
  outlineVariant: '#5a4136',
  /** Borde "hard-surface" de 1px que define las tarjetas (ver DESIGN.md). */
  hardBorder: '#333333',

  /** Naranja marca. `primaryContainer` es el naranja saturado de accion. */
  primary: '#ffb693',
  onPrimary: '#561f00',
  primaryContainer: '#ff6b00',
  onPrimaryContainer: '#572000',
  inversePrimary: '#a04100',
  primaryFixed: '#ffdbcc',
  primaryFixedDim: '#ffb693',
  onPrimaryFixed: '#351000',
  onPrimaryFixedVariant: '#7a3000',

  /** "Heatmap hot": zonas calientes y alertas criticas. */
  secondary: '#ffb4aa',
  onSecondary: '#690003',
  secondaryContainer: '#c5020b',
  onSecondaryContainer: '#ffd2cc',
  secondaryFixed: '#ffdad5',
  secondaryFixedDim: '#ffb4aa',
  onSecondaryFixed: '#410001',
  onSecondaryFixedVariant: '#930005',

  /** "Improvement blue": zonas frias y contenido educativo. */
  tertiary: '#acc7ff',
  onTertiary: '#002f67',
  tertiaryContainer: '#5a98ff',
  onTertiaryContainer: '#003068',
  tertiaryFixed: '#d7e2ff',
  tertiaryFixedDim: '#acc7ff',
  onTertiaryFixed: '#001a40',
  onTertiaryFixedVariant: '#004591',

  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  black: '#000000',
  white: '#ffffff',
} as const;

export type ColorName = keyof typeof colors;
