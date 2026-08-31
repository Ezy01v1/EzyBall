import { useCallback, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { AppText, Button, Card, CourtDiagram, EmptyState, Screen, StatBlock } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme';
import type { SessionSummary, TrainingSession } from '@/types/session';
import { formatPercent, formatSessionDate } from '@/utils/format';

import { aggregateRecentSummary, listSessions } from '../data/sessionRepository';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const [sesiones, setSesiones] = useState<TrainingSession[]>([]);
  const [agregado, setAgregado] = useState<SessionSummary | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      void (async () => {
        const [lista, resumen] = await Promise.all([listSessions(), aggregateRecentSummary()]);
        if (!vivo) return;
        setSesiones(lista);
        setAgregado(resumen.totalIntentos > 0 ? resumen : null);
      })();
      return () => {
        vivo = false;
      };
    }, []),
  );

  const serie = sesiones
    .slice(0, 10)
    .reverse()
    .map((sesion) => sesion.resumen.fgPercentTotal)
    .filter((valor): valor is number => valor != null);

  return (
    <Screen conTabBar>
      <View style={styles.cabecera}>
        <AppText variant="headlineLgMobile">Historial</AppText>
        <AppText variant="bodyMd" color={colors.onSurfaceVariant}>
          Rendimiento y evolución de aciertos.
        </AppText>
      </View>

      {sesiones.length === 0 ? (
        <EmptyState
          icono="query-stats"
          titulo="Sin datos todavía"
          descripcion="Cuando grabes tu primera sesión verás aquí tu evolución y tus zonas fuertes y débiles."
          accion={{ label: 'Nueva sesión', onPress: () => navigation.navigate('NuevaSesion') }}
        />
      ) : (
        <>
          <Card style={styles.grafico}>
            <View style={styles.filaGrafico}>
              <StatBlock
                etiqueta="Promedio reciente"
                valor={formatPercent(agregado?.fgPercentTotal ?? null)}
                color={colors.primary}
              />
              <AppText variant="labelCaps" color={colors.onSurfaceVariant}>
                {`Últimas ${Math.min(sesiones.length, 10)}`}
              </AppText>
            </View>

            <GraficoLineal valores={serie} />
          </Card>

          {agregado ? (
            <View style={styles.mapa}>
              <AppText variant="headlineMd" style={styles.tituloSeccion}>
                Mapa acumulado
              </AppText>
              <CourtDiagram modo="heatmap" stats={agregado.porZona} />
            </View>
          ) : null}

          <AppText variant="labelCaps" color={colors.onSurfaceVariant} style={styles.tituloLista}>
            Sesiones anteriores
          </AppText>

          <View style={styles.lista}>
            {sesiones.map((sesion, indice) => (
              <FilaSesion
                key={sesion.id}
                sesion={sesion}
                anterior={sesiones[indice + 1]}
                onPress={() => navigation.navigate('ResumenSesion', { sesionId: sesion.id })}
              />
            ))}
          </View>

          <Button
            label="Nueva sesión"
            icono="add-circle"
            onPress={() => navigation.navigate('NuevaSesion')}
            style={styles.boton}
          />
        </>
      )}
    </Screen>
  );
}

function FilaSesion({
  sesion,
  anterior,
  onPress,
}: {
  sesion: TrainingSession;
  anterior?: TrainingSession;
  onPress: () => void;
}) {
  const actual = sesion.resumen.fgPercentTotal;
  const previo = anterior?.resumen.fgPercentTotal;

  // Tendencia frente a la sesión inmediatamente anterior, no frente a la media:
  // es la comparación que el usuario hace mentalmente al mirar la lista.
  const tendencia =
    actual == null || previo == null
      ? 'trending-flat'
      : actual > previo + 2
        ? 'trending-up'
        : actual < previo - 2
          ? 'trending-down'
          : 'trending-flat';

  const colorTendencia =
    tendencia === 'trending-up'
      ? colors.primary
      : tendencia === 'trending-down'
        ? colors.error
        : colors.onSurfaceVariant;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${sesion.etiqueta}, ${formatPercent(actual)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.fila, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <View style={styles.filaTexto}>
        <AppText variant="bodyMd">{formatSessionDate(sesion.fecha)}</AppText>
        <AppText variant="labelCaps" color={colors.onSurfaceVariant}>
          {sesion.etiqueta}
        </AppText>
      </View>

      <View style={styles.filaMetrica}>
        <View style={styles.filaValor}>
          <AppText variant="statsNumSm">{formatPercent(actual)}</AppText>
          <AppText variant="labelCapsSm" color={colors.onSurfaceVariant}>
            Acierto
          </AppText>
        </View>
        <MaterialIcons name={tendencia} size={24} color={colorTendencia} />
        {!sesion.sincronizada ? (
          <MaterialIcons name="cloud-off" size={16} color={colors.outline} />
        ) : null}
      </View>
    </Pressable>
  );
}

/** Gráfico de línea simple. Sin librería de charts: son 10 puntos. */
function GraficoLineal({ valores }: { valores: number[] }) {
  if (valores.length < 2) {
    return (
      <View style={styles.graficoVacio}>
        <AppText variant="bodySm" color={colors.outline} center>
          Necesitas al menos dos sesiones para ver la evolución.
        </AppText>
      </View>
    );
  }

  const ancho = 300;
  const alto = 100;
  const paso = ancho / (valores.length - 1);

  // Escala fija 0-100: un eje que se reescala solo hace parecer enorme una
  // variación de dos puntos.
  const puntos = valores.map((valor, i) => ({
    x: i * paso,
    y: alto - (Math.max(0, Math.min(100, valor)) / 100) * alto,
  }));

  const d = puntos
    .map((punto, i) => `${i === 0 ? 'M' : 'L'}${punto.x.toFixed(1)},${punto.y.toFixed(1)}`)
    .join(' ');

  return (
    <Svg viewBox={`0 0 ${ancho} ${alto}`} width="100%" height={140} style={styles.svg}>
      {[20, 50, 80].map((y) => (
        <Line
          key={y}
          x1={0}
          x2={ancho}
          y1={y}
          y2={y}
          stroke={colors.surfaceContainerHighest}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ))}

      <Path d={d} fill="none" stroke={colors.primary} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />

      {puntos.map((punto, i) => (
        <Circle
          key={i}
          cx={punto.x}
          cy={punto.y}
          r={4}
          fill={i === puntos.length - 1 ? colors.primary : colors.background}
          stroke={colors.primary}
          strokeWidth={2}
        />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    paddingTop: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  grafico: {
    gap: spacing.md,
  },
  filaGrafico: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  svg: {
    marginTop: spacing.sm,
  },
  graficoVacio: {
    paddingVertical: spacing.lg,
  },
  mapa: {
    marginTop: spacing.xl,
  },
  tituloSeccion: {
    marginBottom: spacing.md,
  },
  tituloLista: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  lista: {
    gap: spacing.sm,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
  },
  filaTexto: {
    gap: spacing.xs,
  },
  filaMetrica: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  filaValor: {
    alignItems: 'flex-end',
  },
  boton: {
    marginTop: spacing.xl,
  },
});
