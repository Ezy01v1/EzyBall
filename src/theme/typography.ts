import { Platform, type TextStyle } from 'react-native';

/**
 * Familias tipograficas. Los nombres coinciden con las claves que
 * `useAppFonts()` registra en expo-font (ver src/theme/fonts.ts).
 */
export const fontFamily = {
  /** Anybody — titulares "stadium-scale". */
  display: 'Anybody_800ExtraBold',
  headlineBold: 'Anybody_700Bold',
  headline: 'Anybody_600SemiBold',
  /** Manrope — texto instruccional. */
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodyBold: 'Manrope_700Bold',
  /** JetBrains Mono — datos, porcentajes y cronometros. */
  mono: 'JetBrainsMono_600SemiBold',
} as const;

export const typography = {
  displayLg: {
    fontFamily: fontFamily.display,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -1.92,
  },
  headlineLg: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.64,
  },
  /** Variante mobile de headlineLg: es la que se usa en casi todas las pantallas. */
  headlineLgMobile: {
    fontFamily: fontFamily.headlineBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.56,
  },
  headlineMd: {
    fontFamily: fontFamily.headline,
    fontSize: 24,
    lineHeight: 30,
  },
  /** Titulo de tarjeta / item de lista. */
  titleSm: {
    fontFamily: fontFamily.headline,
    fontSize: 18,
    lineHeight: 24,
  },
  bodyLg: {
    fontFamily: fontFamily.body,
    fontSize: 18,
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySm: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  labelCaps: {
    fontFamily: fontFamily.mono,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  labelCapsSm: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statsNum: {
    fontFamily: fontFamily.display,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.72,
    // Evita que los digitos "bailen" al actualizar contadores en vivo.
    ...Platform.select({ ios: { fontVariant: ['tabular-nums'] as const }, default: {} }),
  },
  statsNumSm: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.48,
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
