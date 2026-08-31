import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Chip, IconoCategoria } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { LEVEL_LABELS, TIP_LEVELS, type TipLevel } from '@/types/tip';

import { useAuth } from './AuthProvider';

interface Slide {
  titulo: string;
  descripcion: string;
  categoria: 'tiro' | 'iq_juego' | 'mentalidad';
}

const SLIDES: Slide[] = [
  {
    titulo: 'Entrena con fundamento',
    descripcion:
      'Tips y drills organizados por área del juego, nivel y zona de la cancha. Disponibles sin conexión, en la cancha donde entrenes.',
    categoria: 'tiro',
  },
  {
    titulo: 'Mide tus tiros',
    descripcion:
      'Apoya el teléfono apuntando al aro, elige la zona y entrena. Al terminar ves tu porcentaje total, tu zona caliente y las que hay que trabajar.',
    categoria: 'iq_juego',
  },
  {
    titulo: 'Todo el análisis ocurre en tu teléfono',
    descripcion:
      'El video no se graba ni se sube a ningún servidor. Solo se guardan los resultados: zona, canasta o fallo, y el momento del tiro.',
    categoria: 'mentalidad',
  },
];

/**
 * Tres pantallas de entrada. La tercera es de privacidad a propósito: la app
 * pide cámara y conviene explicar antes qué se hace con ella, no después del
 * diálogo del sistema.
 */
export function OnboardingScreen() {
  const { perfil, actualizarPerfil } = useAuth();
  const insets = useSafeAreaInsets();
  const [indice, setIndice] = useState(0);

  const slide = SLIDES[indice]!;
  const esUltima = indice === SLIDES.length - 1;

  const avanzar = () => {
    if (esUltima) {
      actualizarPerfil({ onboardingVisto: true });
      return;
    }
    setIndice((actual) => actual + 1);
  };

  return (
    <View style={[styles.raiz, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.contenido}>
        <View style={styles.glifo}>
          <IconoCategoria categoria={slide.categoria} size={64} color={colors.primaryContainer} />
        </View>

        <AppText variant="headlineLgMobile" style={styles.titulo}>
          {slide.titulo}
        </AppText>

        <AppText variant="bodyLg" color={colors.onSurfaceVariant}>
          {slide.descripcion}
        </AppText>

        {esUltima ? (
          <View style={styles.nivel}>
            <AppText variant="labelCaps" color={colors.onSurfaceVariant}>
              Tu nivel
            </AppText>
            <View style={styles.chips}>
              {TIP_LEVELS.map((nivel: TipLevel) => (
                <Chip
                  key={nivel}
                  label={LEVEL_LABELS[nivel]}
                  activo={perfil.nivel === nivel}
                  onPress={() => actualizarPerfil({ nivel })}
                />
              ))}
            </View>
            <AppText variant="bodySm" color={colors.onSurfaceVariant}>
              Se usa para ordenar las recomendaciones. Puedes cambiarlo cuando quieras.
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.pie}>
        <View style={styles.puntos}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.punto, i === indice && styles.puntoActivo]} />
          ))}
        </View>

        <Button label={esUltima ? 'Empezar' : 'Siguiente'} onPress={avanzar} grande />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.screen,
    justifyContent: 'space-between',
  },
  contenido: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  glifo: {
    width: 112,
    height: 112,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hardBorder,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  titulo: {
    marginBottom: spacing.xs,
  },
  nivel: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pie: {
    gap: spacing.lg,
  },
  puntos: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainerHighest,
  },
  puntoActivo: {
    width: 24,
    backgroundColor: colors.primaryContainer,
  },
});
