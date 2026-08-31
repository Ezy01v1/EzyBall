import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, TopBar } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radius, sizes, spacing } from '@/theme';
import { COURT_ZONES } from '@/types/court';

import { getCameraPreview } from '../vision/cameraModule';
import { useEstadoDetector } from '../vision/hoopDetector';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Ruta = RouteProp<RootStackParamList, 'Calibracion'>;

/**
 * Paso 2: encuadre.
 *
 * Existe porque el teléfono va sobre un palo selfie con patitas, no sobre un
 * trípode de estudio: la posición cambia entre sesiones y entre canchas. Sin un
 * encuadre verificado antes de empezar, el detector arranca ciego y el usuario
 * descubre el problema al final, con la sesión ya perdida.
 */
export function CalibrationScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Ruta>();
  const insets = useSafeAreaInsets();

  const CameraPreview = getCameraPreview();
  const estadoDetector = useEstadoDetector();
  const [camaraLista, setCamaraLista] = useState(false);

  const modo: 'auto' | 'manual' =
    CameraPreview && camaraLista && estadoDetector === 'listo' ? 'auto' : 'manual';

  return (
    <View style={styles.raiz}>
      <TopBar titulo="Encuadre" onBack={navigation.goBack} />

      <View style={styles.visor}>
        {CameraPreview ? (
          <CameraPreview activa onListo={setCamaraLista} />
        ) : (
          <View style={styles.sinCamara}>
            <MaterialIcons name="videocam-off" size={48} color={colors.outlineVariant} />
            <AppText variant="titleSm" center>
              Cámara no disponible en esta build
            </AppText>
            <AppText variant="bodySm" color={colors.onSurfaceVariant} center>
              Necesitas un dev client compilado con react-native-vision-camera. Mientras tanto
              puedes registrar los tiros a mano.
            </AppText>
          </View>
        )}

        {/* Guía de encuadre: el aro debe quedar dentro del recuadro. */}
        <View pointerEvents="none" style={styles.guia}>
          <View style={styles.marco}>
            <View style={[styles.esquina, styles.esquinaSupIzq]} />
            <View style={[styles.esquina, styles.esquinaSupDer]} />
            <View style={[styles.esquina, styles.esquinaInfIzq]} />
            <View style={[styles.esquina, styles.esquinaInfDer]} />
          </View>
          <AppText variant="labelCaps" color={colors.primary} center style={styles.textoGuia}>
            Encuadra el aro aquí
          </AppText>
        </View>
      </View>

      <View style={[styles.pie, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.instrucciones}>
          <Instruccion texto="Apoya el teléfono en el palo selfie con las patitas abiertas." />
          <Instruccion texto="El aro debe caber dentro del recuadro y verse completo." />
          <Instruccion texto="Deja espacio por encima del aro para ver el vuelo del balón." />
        </View>

        <View style={styles.estado}>
          <MaterialIcons
            name={modo === 'auto' ? 'auto-awesome' : 'touch-app'}
            size={sizes.iconMd}
            color={modo === 'auto' ? colors.primaryContainer : colors.tertiary}
          />
          <AppText variant="bodySm" color={colors.onSurfaceVariant} style={styles.estadoTexto}>
            {modo === 'auto'
              ? 'Detección automática activa: la app marcará canasta o fallo sola.'
              : 'Modo manual: marcarás canasta o fallo con un toque. La detección automática se activará cuando el modelo esté disponible.'}
          </AppText>
        </View>

        <Button
          label="Comenzar a grabar"
          icono="videocam"
          grande
          onPress={() =>
            navigation.replace('Grabacion', {
              zona: params.zona,
              etiqueta: params.etiqueta,
              modo,
            })
          }
        />

        <AppText variant="labelCapsSm" color={colors.outline} center style={styles.zona}>
          {`Zona inicial: ${COURT_ZONES[params.zona].label}`}
        </AppText>
      </View>
    </View>
  );
}

function Instruccion({ texto }: { texto: string }) {
  return (
    <View style={styles.instruccion}>
      <MaterialIcons name="check-circle-outline" size={18} color={colors.primary} />
      <AppText variant="bodySm" color={colors.onSurfaceVariant} style={styles.instruccionTexto}>
        {texto}
      </AppText>
    </View>
  );
}

/** Equivalente a StyleSheet.absoluteFillObject, retirado de los tipos en RN 0.86. */
const RELLENO_ABSOLUTO = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.background,
  },
  visor: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    overflow: 'hidden',
  },
  sinCamara: {
    ...RELLENO_ABSOLUTO,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  guia: {
    ...RELLENO_ABSOLUTO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marco: {
    width: '55%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: 'rgba(169, 138, 125, 0.35)',
  },
  esquina: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.primaryContainer,
  },
  esquinaSupIzq: { top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3 },
  esquinaSupDer: { top: -1, right: -1, borderTopWidth: 3, borderRightWidth: 3 },
  esquinaInfIzq: { bottom: -1, left: -1, borderBottomWidth: 3, borderLeftWidth: 3 },
  esquinaInfDer: { bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3 },
  textoGuia: {
    marginTop: spacing.md,
  },
  pie: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  instrucciones: {
    gap: spacing.sm,
  },
  instruccion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  instruccionTexto: {
    flex: 1,
  },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
  },
  estadoTexto: {
    flex: 1,
  },
  zona: {
    marginTop: spacing.xs,
  },
});
