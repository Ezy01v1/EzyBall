import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Chip, CourtDiagram, Screen, TopBar } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { COURT_ZONES, type CourtZoneId } from '@/types/court';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Etiquetas frecuentes de drill. El usuario puede quedarse con "Mixto". */
const ETIQUETAS = ['Catch & Shoot', 'Tiro libre', 'Media distancia', 'Triples', 'Mixto'];

/**
 * Paso 1 del tracker: elegir zona y tipo de sesión.
 *
 * La zona se selecciona a mano en el MVP. La detección automática de la
 * posición del tirador (Fase 4) exige calibrar la cancha reconociendo líneas,
 * que es un problema de visión mucho más duro que detectar canasta/fallo. Con
 * selección manual el bucle completo ya es validable con usuarios reales.
 */
export function NewSessionScreen() {
  const navigation = useNavigation<Nav>();
  const [zona, setZona] = useState<CourtZoneId>('right_wing');
  const [etiqueta, setEtiqueta] = useState<string>(ETIQUETAS[0]!);

  return (
    <View style={styles.raiz}>
      <TopBar marca onClose={navigation.goBack} />

      <Screen insetSuperior={false}>
        <View style={styles.encabezado}>
          <AppText variant="headlineLgMobile" center>
            Elige tu zona
          </AppText>
          <AppText variant="bodyMd" color={colors.onSurfaceVariant} center>
            Toca el área de la cancha desde la que vas a tirar.
          </AppText>
        </View>

        <CourtDiagram modo="seleccion" seleccionada={zona} onSelect={setZona} />

        <View style={styles.zonaActual}>
          <AppText variant="labelCaps" color={colors.onSurfaceVariant}>
            Zona seleccionada
          </AppText>
          <AppText variant="titleSm" color={colors.primary}>
            {COURT_ZONES[zona].label}
          </AppText>
        </View>

        <AppText variant="labelCaps" color={colors.onSurfaceVariant} style={styles.subtitulo}>
          Tipo de sesión
        </AppText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsScroll}
        >
          {ETIQUETAS.map((item) => (
            <Chip
              key={item}
              label={item}
              activo={etiqueta === item}
              onPress={() => setEtiqueta(item)}
            />
          ))}
        </ScrollView>

        <Button
          label="Continuar"
          icono="videocam"
          grande
          style={styles.boton}
          onPress={() => navigation.navigate('Calibracion', { zona, etiqueta })}
        />

        <AppText variant="bodySm" color={colors.outline} center style={styles.nota}>
          Podrás cambiar de zona en cualquier momento sin cortar la sesión.
        </AppText>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.background,
  },
  encabezado: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  zonaActual: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  subtitulo: {
    marginTop: spacing.lg,
  },
  chipsScroll: {
    marginTop: spacing.sm,
    marginHorizontal: -spacing.screen,
  },
  chips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
  },
  boton: {
    marginTop: spacing.xl,
  },
  nota: {
    marginTop: spacing.md,
  },
});
