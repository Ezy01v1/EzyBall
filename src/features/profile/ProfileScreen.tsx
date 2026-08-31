import { useCallback, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Card, Chip, EmptyState, Screen, StatBlock, TipCard } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { useFavorites } from '@/features/library/hooks/useFavorites';
import { useTips } from '@/features/library/hooks/useTips';
import { getLastSyncedAt } from '@/features/library/data/tipsRepository';
import { aggregateRecentSummary, listSessions } from '@/features/tracker/data/sessionRepository';
import type { RootStackParamList } from '@/navigation/types';
import { isFirebaseConfigured } from '@/services/firebase';
import { colors, radius, spacing, typography } from '@/theme';
import { LEVEL_LABELS, TIP_LEVELS, type TipLevel } from '@/types/tip';
import { formatPercent } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { perfil, actualizarPerfil, conCuenta, usuarioId } = useAuth();
  const { ids: favoritos, alternar } = useFavorites();
  const { tips } = useTips();

  const [totalSesiones, setTotalSesiones] = useState(0);
  const [fgGlobal, setFgGlobal] = useState<number | null>(null);
  const [pendientes, setPendientes] = useState(0);
  const [ultimaSync, setUltimaSync] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      void (async () => {
        const [sesiones, resumen, sincronizado] = await Promise.all([
          listSessions(),
          aggregateRecentSummary(50),
          getLastSyncedAt(),
        ]);
        if (!vivo) return;
        setTotalSesiones(sesiones.length);
        setFgGlobal(resumen.fgPercentTotal);
        setPendientes(sesiones.filter((sesion) => !sesion.sincronizada).length);
        setUltimaSync(sincronizado);
      })();
      return () => {
        vivo = false;
      };
    }, []),
  );

  const tipsFavoritos = tips.filter((tip) => favoritos.includes(tip.id));

  return (
    <Screen conTabBar>
      <AppText variant="headlineLgMobile" style={styles.titulo}>
        Perfil
      </AppText>

      <Card>
        <AppText variant="labelCaps" color={colors.onSurfaceVariant}>
          Nombre
        </AppText>
        <TextInput
          value={perfil.nombre}
          onChangeText={(nombre) => actualizarPerfil({ nombre })}
          placeholder="Tu nombre"
          placeholderTextColor={colors.outline}
          accessibilityLabel="Tu nombre"
          style={styles.input}
        />

        <AppText variant="labelCaps" color={colors.onSurfaceVariant} style={styles.etiquetaNivel}>
          Nivel
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
      </Card>

      <View style={styles.metricas}>
        <Card style={styles.metrica}>
          <StatBlock etiqueta="Sesiones" valor={String(totalSesiones)} compacto />
        </Card>
        <Card style={styles.metrica}>
          <StatBlock
            etiqueta="Acierto global"
            valor={formatPercent(fgGlobal)}
            color={colors.primary}
            compacto
          />
        </Card>
      </View>

      <AppText variant="headlineMd" style={styles.seccion}>
        Datos y sincronización
      </AppText>

      <Card>
        <Fila
          icono={conCuenta ? 'cloud-done' : 'cloud-off'}
          titulo={conCuenta ? 'Cuenta sincronizada' : 'Solo en este dispositivo'}
          detalle={
            conCuenta
              ? `ID: ${usuarioId.slice(0, 10)}…`
              : isFirebaseConfigured
                ? 'Sin conexión con el servidor. Se reintentará solo.'
                : 'Firebase no está configurado. Todo se guarda localmente.'
          }
        />
        <Fila
          icono="sync"
          titulo={pendientes > 0 ? `${pendientes} sesiones pendientes de subir` : 'Todo sincronizado'}
          detalle={
            ultimaSync
              ? `Biblioteca actualizada: ${new Date(ultimaSync).toLocaleDateString()}`
              : 'Biblioteca usando el contenido empaquetado.'
          }
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Privacidad')}
          style={styles.enlace}
        >
          <Fila
            icono="privacy-tip"
            titulo="Privacidad"
            detalle="Qué se procesa en tu teléfono y qué se sube."
          />
          <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
      </Card>

      <AppText variant="headlineMd" style={styles.seccion}>
        {`Favoritos (${tipsFavoritos.length})`}
      </AppText>

      {tipsFavoritos.length > 0 ? (
        <View style={styles.favoritos}>
          {tipsFavoritos.map((tip) => (
            <TipCard
              key={tip.id}
              tip={tip}
              esFavorito
              onToggleFavorito={() => alternar(tip.id)}
              onPress={() => navigation.navigate('DetalleTip', { tipId: tip.id })}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icono="star-border"
          titulo="Sin favoritos"
          descripcion="Guarda los tips que quieras repasar en la cancha; quedan disponibles sin conexión."
          accion={{
            label: 'Ir a la biblioteca',
            onPress: () => navigation.navigate('Tabs', { screen: 'Biblioteca' }),
          }}
        />
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          Alert.alert(
            'Restablecer nivel y nombre',
            'Tus sesiones y favoritos se mantienen. Solo se borran los datos de perfil.',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Restablecer',
                style: 'destructive',
                onPress: () => actualizarPerfil({ nombre: 'Jugador', nivel: 'principiante' }),
              },
            ],
          )
        }
        style={styles.restablecer}
      >
        <AppText variant="bodySm" color={colors.error} center>
          Restablecer datos de perfil
        </AppText>
      </Pressable>
    </Screen>
  );
}

function Fila({
  icono,
  titulo,
  detalle,
}: {
  icono: keyof typeof MaterialIcons.glyphMap;
  titulo: string;
  detalle: string;
}) {
  return (
    <View style={styles.fila}>
      <MaterialIcons name={icono} size={20} color={colors.primary} />
      <View style={styles.filaTexto}>
        <AppText variant="bodyMd">{titulo}</AppText>
        <AppText variant="bodySm" color={colors.onSurfaceVariant}>
          {detalle}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: {
    paddingTop: spacing.lg,
    marginBottom: spacing.md,
  },
  input: {
    color: colors.onSurface,
    fontFamily: typography.titleSm.fontFamily,
    fontSize: typography.titleSm.fontSize,
    borderBottomWidth: 2,
    borderBottomColor: colors.outlineVariant,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  etiquetaNivel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricas: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  metrica: {
    flex: 1,
  },
  seccion: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  filaTexto: {
    flex: 1,
    gap: 2,
  },
  enlace: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  favoritos: {
    gap: spacing.sm,
  },
  restablecer: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.errorContainer,
  },
});
