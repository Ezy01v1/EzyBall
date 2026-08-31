import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

import { AppText, Button } from '@/components';
import { colors, spacing } from '@/theme';

interface CameraPreviewProps {
  /** `false` pausa la sesión de cámara (pantalla en background, sesión terminada). */
  activa: boolean;
  /** Se llama cuando el permiso está concedido y hay dispositivo disponible. */
  onListo?: (listo: boolean) => void;
}

/**
 * Vista previa de cámara (VisionCamera 5).
 *
 * Este archivo importa `react-native-vision-camera` en el nivel superior a
 * propósito, y solo se carga a través de `cameraModule.ts`, que hace el require
 * dentro de un try/catch. Así, en un entorno sin el módulo nativo (Expo Go, o
 * un dev client sin recompilar tras añadir la dependencia) la app sigue
 * abriendo y el tracker cae en modo manual en vez de crashear en el arranque.
 *
 * Privacidad: en VisionCamera 5 los outputs son explícitos. Aquí no se declara
 * ninguno, así que la cámara solo alimenta el preview: no existe output de
 * video, foto ni audio, y por tanto no hay ruta de código que escriba un
 * fichero. En Fase 2 se añadirá un `useFrameOutput` para el detector, que
 * tampoco graba: entrega fotogramas en memoria que se descartan tras analizarse.
 */
export function CameraPreview({ activa, onListo }: CameraPreviewProps) {
  const { hasPermission, requestPermission, canRequestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [pidiendo, setPidiendo] = useState(false);

  useEffect(() => {
    onListo?.(Boolean(hasPermission && device));
  }, [hasPermission, device, onListo]);

  if (!hasPermission) {
    return (
      <View style={styles.aviso}>
        <AppText variant="titleSm" center>
          Necesitamos la cámara
        </AppText>
        <AppText variant="bodySm" color={colors.onSurfaceVariant} center>
          El análisis ocurre íntegramente en tu teléfono. El video no se graba ni se sube.
        </AppText>

        {canRequestPermission ? (
          <Button
            label={pidiendo ? 'Esperando...' : 'Dar permiso'}
            deshabilitado={pidiendo}
            onPress={() => {
              setPidiendo(true);
              void requestPermission().finally(() => setPidiendo(false));
            }}
          />
        ) : (
          // Permiso denegado de forma permanente: el diálogo del sistema ya no
          // aparece, así que decirle "dar permiso" otra vez sería mentirle.
          <AppText variant="bodySm" color={colors.error} center>
            El permiso está denegado. Actívalo en los ajustes del sistema para EzyBall.
          </AppText>
        )}
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.aviso}>
        <AppText variant="titleSm" center>
          No encontramos la cámara trasera
        </AppText>
        <AppText variant="bodySm" color={colors.onSurfaceVariant} center>
          Puedes seguir registrando los tiros a mano desde la pantalla de sesión.
        </AppText>
      </View>
    );
  }

  return (
    <Camera
      style={styles.camara}
      device={device}
      isActive={activa}
      // 30 fps basta para seguir un balón y cuesta bastante menos batería y
      // calor que 60 en una sesión de 20 minutos al sol.
      constraints={[{ fps: 30 }]}
    />
  );
}

const styles = StyleSheet.create({
  camara: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  aviso: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surfaceContainerLowest,
  },
});
