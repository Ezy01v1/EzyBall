/** Grid base de 4px (ver DESIGN.md > Layout & Spacing). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  /** Margen seguro lateral en mobile. */
  screen: 20,
  gutter: 12,
} as const;

export const radius = {
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  pill: 999,
} as const;

export const sizes = {
  /** Altura minima de boton primario: debe ser "thumb-ready" entrenando. */
  buttonHeight: 56,
  buttonHeightLarge: 64,
  tabBarHeight: 80,
  iconSm: 16,
  iconMd: 24,
  iconLg: 40,
  /** Area minima tactil recomendada. */
  minTouchTarget: 44,
} as const;
