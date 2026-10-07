import { useCallback, useEffect, useRef, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, CourtDiagram } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radius, sizes, spacing } from '@/theme';
import { COURT_ZONES, type CourtZoneId } from '@/types/court';
import { formatDuration } from '@/utils/format';

import { saveSession, syncPendingSessions } from '../data/sessionRepository';
import { useSessionStore, useZoneCounters } from '../store/sessionStore';
import { getCameraPreview } from '../vision/cameraModule';
import { configAuto, perfilActivo, PERFIL_COCO, type Detecciones } from '../vision/hoopDetector';
import { createReducerState, reduceFrame } from '../vision/shotEventReducer';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Ruta = RouteProp<RootStackParamList, 'Grabacion'>;

/**
 * Pantalla de sesión en vivo.
 *
 * Diseñada para usarse a un metro de distancia, con el teléfono apoyado y el
 * usuario en movimiento: cifras enormes, dos botones que ocupan media pantalla
 * y separación generosa para no fallar el toque.
 *
 * Los botones de canasta/fallo están presentes SIEMPRE, incluso en modo
 * automático: el detector se va a equivocar, y sin una corrección a mano el
 * usuario pierde la confianza en el dato y con ella todo el valor del módulo.
 */
export function LiveRecordingScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Ruta>();
  const { usuarioId } = useAuth();
  const insets = useSafeAreaInsets();

  // La pantalla no debe apagarse en mitad de una sesión de 20 minutos.
  useKeepAwake();

  const CameraPreview = getCameraPreview();

  const iniciar = useSessionStore((estado) => estado.iniciar);
  const registrarTiro = useSessionStore((estado) => estado.registrarTiro);
  const deshacerUltimo = useSessionStore((estado) => estado.deshacerUltimo);
  const cambiarZona = useSessionStore((estado) => estado.cambiarZona);
  const finalizar = useSessionStore((estado) => estado.finalizar);
  const zonaActual = useSessionStore((estado) => estado.zonaActual);
  const totalTiros = useSessionStore((estado) => estado.tiros.length);

  const { aciertos, intentos } = useZoneCounters();
  const [segundos, setSegundos] = useState(0);
  const [selectorZona, setSelectorZona] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    iniciar(params.zona, params.modo, params.etiqueta);
  }, [iniciar, params.zona, params.modo, params.etiqueta]);

  useEffect(() => {
    const intervalo = setInterval(() => setSegundos((valor) => valor + 1), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const marcar = (resultado: 'canasta' | 'fallo') => {
    vibrar(resultado);
    registrarTiro(resultado, 'manual');
  };

  // Detección automática: el aro viene fijo de la calibración y el modelo
  // aporta el balón en cada frame analizado. El reductor decide el resultado.
  const aro = params.modo === 'auto' ? params.aro : undefined;
  const estadoReductor = useRef(createReducerState());

  const onDeteccion = useCallback(
    (det: Detecciones, timestamp: number) => {
      if (!aro) return;
      const { state, event } = reduceFrame(
        estadoReductor.current,
        { timestamp, aro, balon: det.balon },
        configAuto(perfilActivo() ?? PERFIL_COCO),
      );
      estadoReductor.current = state;
      if (event) {
        vibrar(event.resultado);
        registrarTiro(event.resultado, 'auto', event.confianza);
      }
    },
    [aro, registrarTiro],
  );

  const detener = async () => {
    if (guardando) return;
    setGuardando(true);

    const sesion = finalizar(usuarioId);
    if (!sesion) {
      navigation.goBack();
      return;
    }

    await saveSession(sesion);
    // La subida es best-effort: si falla, la sesión queda pendiente y se
    // reintenta sola. El usuario nunca espera por la red aquí.
    void syncPendingSessions(usuarioId);

    navigation.replace('ResumenSesion', { sesionId: sesion.id });
  };

  return (
    <View style={styles.raiz}>
      {CameraPreview ? (
        <CameraPreview activa onDeteccion={aro ? onDeteccion : undefined} />
      ) : null}
      <View style={styles.velo} />

      <View style={[styles.contenido, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md }]}>
        {/* --- HUD superior --- */}
        <View style={styles.hud}>
          <View style={styles.indicadorRec}>
            <View style={styles.puntoRec} />
            <AppText variant="labelCaps" color={colors.onSurface}>
              {`REC ${formatDuration(segundos)}`}
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Deshacer último tiro"
            onPress={deshacerUltimo}
            disabled={totalTiros === 0}
            style={[styles.botonIcono, totalTiros === 0 && styles.deshabilitado]}
          >
            <MaterialIcons name="undo" size={sizes.iconMd} color={colors.onSurface} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cambiar de zona"
          onPress={() => setSelectorZona(true)}
          style={styles.tarjetaZona}
        >
          <View style={styles.filaZona}>
            <MaterialIcons name="location-on" size={18} color={colors.primary} />
            <AppText variant="labelCaps" color={colors.onSurfaceVariant}>
              {`Zona: ${COURT_ZONES[zonaActual].label}`}
            </AppText>
            <MaterialIcons name="expand-more" size={18} color={colors.onSurfaceVariant} />
          </View>

          <View style={styles.marcador}>
            <AppText variant="statsNum">{String(aciertos)}</AppText>
            <AppText variant="headlineMd" color={colors.outline}>
              /
            </AppText>
            <AppText variant="headlineMd" color={colors.onSurfaceVariant}>
              {String(intentos)}
            </AppText>
            <AppText variant="labelCaps" color={colors.primary} style={styles.marcadorEtiqueta}>
              Aciertos / Intentos
            </AppText>
          </View>
        </Pressable>

        <View style={styles.espaciador} />

        {/* --- Registro de tiros --- */}
        <View style={styles.botonesTiro}>
          <BotonTiro
            label="CANASTA"
            icono="check"
            color={colors.primaryContainer}
            colorTexto={colors.black}
            onPress={() => marcar('canasta')}
          />
          <BotonTiro
            label="FALLO"
            icono="close"
            color={colors.surfaceContainerHigh}
            colorTexto={colors.onSurface}
            onPress={() => marcar('fallo')}
          />
        </View>

        <Button
          label={guardando ? 'Guardando...' : 'Detener sesión'}
          icono="stop-circle"
          variante="peligro"
          deshabilitado={guardando}
          onPress={() => void detener()}
          style={styles.detener}
        />
      </View>

      <Modal visible={selectorZona} animationType="slide" transparent onRequestClose={() => setSelectorZona(false)}>
        <View style={styles.modalFondo}>
          <View style={[styles.modal, { paddingBottom: insets.bottom + spacing.lg }]}>
            <AppText variant="headlineMd" center style={styles.modalTitulo}>
              Cambiar de zona
            </AppText>
            <AppText variant="bodySm" color={colors.onSurfaceVariant} center>
              Los tiros ya registrados se quedan en su zona.
            </AppText>

            <CourtDiagram
              modo="seleccion"
              seleccionada={zonaActual}
              onSelect={(zona: CourtZoneId) => {
                cambiarZona(zona);
                setSelectorZona(false);
              }}
              style={styles.modalCancha}
            />

            <Button label="Cerrar" variante="secundario" onPress={() => setSelectorZona(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function vibrar(resultado: 'canasta' | 'fallo') {
  void Haptics.notificationAsync(
    resultado === 'canasta'
      ? Haptics.NotificationFeedbackType.Success
      : Haptics.NotificationFeedbackType.Warning,
  );
}

function BotonTiro({
  label,
  icono,
  color,
  colorTexto,
  onPress,
}: {
  label: string;
  icono: keyof typeof MaterialIcons.glyphMap;
  color: string;
  colorTexto: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.botonTiro,
        { backgroundColor: color, transform: [{ scale: pressed ? 0.95 : 1 }] },
      ]}
    >
      <MaterialIcons name={icono} size={40} color={colorTexto} />
      <AppText variant="labelCaps" color={colorTexto}>
        {label}
      </AppText>
    </Pressable>
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
  velo: {
    ...RELLENO_ABSOLUTO,
    backgroundColor: 'rgba(19, 19, 19, 0.72)',
  },
  contenido: {
    flex: 1,
    paddingHorizontal: spacing.screen,
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicadorRec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  puntoRec: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.error,
  },
  botonIcono: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deshabilitado: {
    opacity: 0.35,
  },
  tarjetaZona: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    gap: spacing.sm,
  },
  filaZona: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  marcador: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  marcadorEtiqueta: {
    marginLeft: spacing.sm,
  },
  espaciador: {
    flex: 1,
  },
  botonesTiro: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  botonTiro: {
    flex: 1,
    height: 132,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  detener: {
    marginTop: spacing.md,
  },
  modalFondo: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modal: {
    backgroundColor: colors.surfaceContainerLow,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.screen,
    gap: spacing.md,
  },
  modalTitulo: {
    marginBottom: spacing.xs,
  },
  modalCancha: {
    marginVertical: spacing.sm,
  },
});
