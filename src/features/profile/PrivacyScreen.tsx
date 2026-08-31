import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, Screen, TopBar } from '@/components';
import { colors, spacing } from '@/theme';

interface Punto {
  icono: keyof typeof MaterialIcons.glyphMap;
  titulo: string;
  texto: string;
  color: string;
}

const PUNTOS: Punto[] = [
  {
    icono: 'phone-android',
    titulo: 'El video se queda en tu teléfono',
    texto:
      'Durante una sesión la cámara está encendida, pero el video no se graba a un archivo ni se envía a ningún servidor. Cada fotograma se analiza y se descarta inmediatamente.',
    color: colors.primaryContainer,
  },
  {
    icono: 'cloud-upload',
    titulo: 'Qué se guarda en el servidor',
    texto:
      'Solo los resultados: la zona desde la que tiraste, si fue canasta o fallo, el momento del tiro dentro de la sesión y el resumen agregado. Nada de eso permite reconstruir una imagen.',
    color: colors.tertiaryContainer,
  },
  {
    icono: 'mic-off',
    titulo: 'Sin micrófono',
    texto:
      'La app no pide ni usa permiso de micrófono. El permiso de audio está bloqueado explícitamente en la configuración de la build.',
    color: colors.secondary,
  },
  {
    icono: 'wifi-off',
    titulo: 'Funciona sin conexión',
    texto:
      'La biblioteca de tips y tus sesiones se guardan en el dispositivo. Si no hay red, todo sigue funcionando y la sincronización se reintenta sola más tarde.',
    color: colors.primary,
  },
  {
    icono: 'delete-outline',
    titulo: 'Borrar tus datos',
    texto:
      'Desinstalar la app elimina todo lo que está guardado en el dispositivo. Para borrar también lo sincronizado en el servidor, escríbenos desde la dirección de contacto de la ficha de la tienda.',
    color: colors.error,
  },
];

/**
 * Pantalla de privacidad.
 *
 * Está enlazada desde el perfil y resumida en el onboarding porque una app que
 * enciende la cámara en una cancha tiene que decir qué hace con ella antes de
 * pedir el permiso, no en un PDF.
 */
export function PrivacyScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.raiz}>
      <TopBar titulo="Privacidad" onBack={navigation.goBack} />

      <Screen insetSuperior={false}>
        <AppText variant="headlineLgMobile" style={styles.titulo}>
          Qué hacemos con tus datos
        </AppText>

        <View style={styles.lista}>
          {PUNTOS.map((punto) => (
            <Card key={punto.titulo} acentoSuperior={punto.color}>
              <View style={styles.fila}>
                <MaterialIcons name={punto.icono} size={24} color={punto.color} />
                <AppText variant="titleSm" style={styles.tituloPunto}>
                  {punto.titulo}
                </AppText>
              </View>
              <AppText variant="bodySm" color={colors.onSurfaceVariant}>
                {punto.texto}
              </AppText>
            </Card>
          ))}
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titulo: {
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  lista: {
    gap: spacing.md,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tituloPunto: {
    flex: 1,
  },
});
