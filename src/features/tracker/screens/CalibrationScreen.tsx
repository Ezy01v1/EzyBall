import { useCallback, useRef, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, TopBar } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radius, sizes, spacing } from '@/theme';
import { COURT_ZONES } from '@/types/court';

import type { Box } from '../vision/types';
import { acumularAro, crearEstadoAroEstable, type EstadoAroEstable } from '../vision/aroEstable';
import { getCameraPreview } from '../vision/cameraModule';
import {
  aroDesdeToque,
  frameAVista,
  PROPORCION_ARO,
  type Punto,
  type Tamano,
} from '../vision/geometria';
import {
  configAuto,
  detectorDisponible,
  perfilActivo,
  PERFIL_COCO,
  type Detecciones,
} from '../vision/hoopDetector';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Ruta = RouteProp<RootStackParamList, 'Calibracion'>;

/** Ancho inicial del anillo, en píxeles de pantalla. */
const ANCHO_ARO_INICIAL = 90;
const ANCHO_ARO_MIN = 30;
const ANCHO_ARO_MAX = 260;
const PASO_ANCHO = 15;

/**
 * Paso 2: encuadre.
 *
 * Existe porque el teléfono va sobre un palo selfie con patitas, no sobre un
 * trípode de estudio: la posición cambia entre sesiones y entre canchas. Sin un
 * encuadre verificado antes de empezar, el detector arranca ciego y el usuario
 * descubre el problema al final, con la sesión ya perdida.
 *
 * Aquí también se marca el aro: el usuario lo toca en el preview y ajusta el
 * anillo a su tamaño. El detector solo busca el balón; el aro queda fijo.
 */
export function CalibrationScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Ruta>();
  const insets = useSafeAreaInsets();

  const CameraPreview = getCameraPreview();
  const [camaraLista, setCamaraLista] = useState(false);

  const [vista, setVista] = useState<Tamano | null>(null);
  const [frame, setFrame] = useState<Tamano | null>(null);
  const [toque, setToque] = useState<Punto | null>(null);
  const [anchoAro, setAnchoAro] = useState(ANCHO_ARO_INICIAL);
  const [balon, setBalon] = useState<Punto | null>(null);

  const estadoAro = useRef<EstadoAroEstable>(crearEstadoAroEstable());
  const [aroPropuesto, setAroPropuesto] = useState<Box | null>(null);
  const [aroConfirmado, setAroConfirmado] = useState<Box | null>(null);

  const puedeDetectar = CameraPreview != null && detectorDisponible();
  // El toque manual siempre gana sobre el aro confirmado.
  const aroToque = toque && vista && frame ? aroDesdeToque(toque, anchoAro, vista, frame) : null;
  const aro = toque ? aroToque : aroConfirmado;
  const aroSugerido = toque ? null : (aroConfirmado ?? aroPropuesto);
  const aroSugeridoVista =
    aroSugerido && vista && frame
      ? (() => {
          const a = frameAVista({ x: aroSugerido.x, y: aroSugerido.y }, vista, frame);
          const b = frameAVista(
            {
              x: aroSugerido.x + aroSugerido.width,
              y: aroSugerido.y + aroSugerido.height,
            },
            vista,
            frame,
          );
          return { left: a.x, top: a.y, width: b.x - a.x, height: b.y - a.y };
        })()
      : null;
  const claseAroActiva = perfilActivo()?.claseAro != null;

  const modo: 'auto' | 'manual' = puedeDetectar && camaraLista && aro ? 'auto' : 'manual';

  const buscandoAro = toque == null && aroConfirmado == null;

  const onDeteccion = useCallback(
    (det: Detecciones, _ts: number, ancho: number, alto: number) => {
      if (buscandoAro) {
        const r = acumularAro(estadoAro.current, det.aro);
        estadoAro.current = r.estado;
        setAroPropuesto((previo) =>
          (previo == null) === (r.estable == null) ? previo : r.estable,
        );
      }
      const caja = det.balon;
      setFrame((previo) =>
        previo && previo.width === ancho && previo.height === alto
          ? previo
          : { width: ancho, height: alto },
      );
      // Feedback de que el modelo ve el balón: un punto sobre él.
      setBalon(
        caja && caja.score >= configAuto(perfilActivo() ?? PERFIL_COCO).scoreMinimo
          ? { x: caja.x + caja.width / 2, y: caja.y + caja.height / 2 }
          : null,
      );
    },
    [buscandoAro],
  );

  const onLayoutVisor = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setVista({ width, height });
  };

  const balonVista = balon && vista && frame ? frameAVista(balon, vista, frame) : null;
  const altoAro = anchoAro * PROPORCION_ARO;

  return (
    <View style={styles.raiz}>
      <TopBar titulo="Encuadre" onBack={navigation.goBack} />

      <View style={styles.visor} onLayout={onLayoutVisor}>
        {CameraPreview ? (
          <CameraPreview
            activa
            onListo={setCamaraLista}
            onDeteccion={puedeDetectar ? onDeteccion : undefined}
          />
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

        {puedeDetectar ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Marcar el aro"
            style={styles.capaToque}
            onPress={(e) =>
              setToque({
                x: e.nativeEvent.locationX,
                y: e.nativeEvent.locationY,
              })
            }
          >
            {toque ? (
              <View
                pointerEvents="none"
                style={[
                  styles.anillo,
                  {
                    width: anchoAro,
                    height: altoAro,
                    left: toque.x - anchoAro / 2,
                    top: toque.y - altoAro / 2,
                  },
                ]}
              />
            ) : aroSugeridoVista ? (
              <View
                pointerEvents="none"
                style={[
                  styles.anillo,
                  { borderColor: colors.primaryContainer, ...aroSugeridoVista },
                ]}
              />
            ) : (
              <View pointerEvents="none" style={styles.guia}>
                <MaterialIcons name="touch-app" size={40} color={colors.primary} />
                <AppText variant="labelCaps" color={colors.primary} center style={styles.textoGuia}>
                  {claseAroActiva
                    ? 'Apunta al aro… o tócalo en la pantalla.'
                    : 'Toca el aro en la pantalla'}
                </AppText>
              </View>
            )}

            {balonVista ? (
              <View
                pointerEvents="none"
                style={[styles.puntoBalon, { left: balonVista.x - 8, top: balonVista.y - 8 }]}
              />
            ) : null}
          </Pressable>
        ) : null}

        {toque ? (
          <View style={styles.controlesAro}>
            <BotonTamano
              icono="remove"
              etiqueta="Anillo más pequeño"
              onPress={() => setAnchoAro((a) => Math.max(ANCHO_ARO_MIN, a - PASO_ANCHO))}
            />
            <BotonTamano
              icono="add"
              etiqueta="Anillo más grande"
              onPress={() => setAnchoAro((a) => Math.min(ANCHO_ARO_MAX, a + PASO_ANCHO))}
            />
          </View>
        ) : null}
      </View>

      <View style={[styles.pie, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.instrucciones}>
          <Instruccion texto="Apoya el teléfono en el palo selfie con las patitas abiertas." />
          <Instruccion texto="Toca el aro y ajusta el anillo con + / − para que cubra aro y red." />
          <Instruccion texto="Deja espacio por encima y por debajo del aro, mejor de lado o en diagonal." />
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
              : puedeDetectar
                ? 'Marca el aro para activar la detección automática. Si no, marcarás canasta o fallo con un toque.'
                : 'Modo manual: marcarás canasta o fallo con un toque.'}
          </AppText>
        </View>

        {aroPropuesto && !toque && !aroConfirmado ? (
          <>
            <AppText variant="bodySm" color={colors.primaryContainer} center>
              Aro detectado. Confírmalo o tócalo para ajustarlo.
            </AppText>
            <Button
              label="Confirmar aro"
              icono="check"
              onPress={() => setAroConfirmado(aroPropuesto)}
            />
          </>
        ) : null}

        <Button
          label="Comenzar a grabar"
          icono="videocam"
          grande
          onPress={() =>
            navigation.replace('Grabacion', {
              zona: params.zona,
              etiqueta: params.etiqueta,
              modo,
              aro: modo === 'auto' && aro ? aro : undefined,
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

function BotonTamano({
  icono,
  etiqueta,
  onPress,
}: {
  icono: keyof typeof MaterialIcons.glyphMap;
  etiqueta: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={styles.botonTamano}
    >
      <MaterialIcons name={icono} size={sizes.iconMd} color={colors.onSurface} />
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
  capaToque: {
    ...RELLENO_ABSOLUTO,
  },
  guia: {
    ...RELLENO_ABSOLUTO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anillo: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.primaryContainer,
    borderRadius: radius.pill,
  },
  puntoBalon: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.black,
    backgroundColor: colors.tertiary,
  },
  controlesAro: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  botonTamano: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
