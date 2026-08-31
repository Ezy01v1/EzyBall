import { useEffect, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, CourtDiagram, EmptyState, Screen, TipCard, TopBar } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { useFavorites } from '@/features/library/hooks/useFavorites';
import { useRecommendationsForSummary } from '@/features/recommendations/useRecommendations';
import type { RootStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { COURT_ZONES } from '@/types/court';
import type { TrainingSession } from '@/types/session';
import { formatDuration, formatLongDate, formatPercent } from '@/utils/format';

import { getSession } from '../data/sessionRepository';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Ruta = RouteProp<RootStackParamList, 'ResumenSesion'>;

/**
 * Cierre de la sesión y, a la vez, el punto donde los dos módulos se tocan:
 * las zonas flojas de ESTA sesión eligen los tips que se muestran abajo.
 */
export function SessionSummaryScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Ruta>();
  const { perfil } = useAuth();
  const { alternar, esFavorito } = useFavorites();

  const [sesion, setSesion] = useState<TrainingSession | null>(null);

  useEffect(() => {
    let vivo = true;
    void getSession(params.sesionId).then((encontrada) => {
      if (vivo) setSesion(encontrada);
    });
    return () => {
      vivo = false;
    };
  }, [params.sesionId]);

  const recomendaciones = useRecommendationsForSummary(sesion?.resumen ?? null, perfil.nivel, 3);

  const volverAlInicio = () => navigation.navigate('Tabs', { screen: 'Home' });

  if (!sesion) {
    return (
      <View style={styles.raiz}>
        <TopBar titulo="Resumen" onBack={volverAlInicio} />
      </View>
    );
  }

  const { resumen } = sesion;
  const zonaCaliente = resumen.zonaCaliente ? COURT_ZONES[resumen.zonaCaliente] : null;

  return (
    <View style={styles.raiz}>
      <TopBar titulo="Resumen de sesión" onBack={volverAlInicio} />

      <Screen insetSuperior={false}>
        <View style={styles.cabecera}>
          <AppText variant="labelCaps" color={colors.onSurfaceVariant} center>
            {`${formatLongDate(sesion.fecha)} · ${formatDuration(sesion.duracion)} · ${sesion.etiqueta}`}
          </AppText>

          <Card style={styles.total}>
            <AppText variant="statsNum" color={colors.primaryContainer} center>
              {`${formatPercent(resumen.fgPercentTotal)} FG`}
            </AppText>
            <AppText variant="bodyMd" color={colors.onSurfaceVariant} center>
              {`Tiros de campo (${resumen.totalAciertos}/${resumen.totalIntentos})`}
            </AppText>
          </Card>
        </View>

        <AppText variant="headlineMd" style={styles.tituloSeccion}>
          Mapa de tiro
        </AppText>

        <CourtDiagram modo="heatmap" stats={resumen.porZona} />

        <View style={styles.analisis}>
          <Card acentoSuperior={colors.primaryContainer}>
            <View style={styles.filaTitulo}>
              <MaterialIcons name="local-fire-department" size={20} color={colors.primaryContainer} />
              <AppText variant="titleSm">Zona caliente</AppText>
            </View>
            <AppText variant="bodySm" color={colors.onSurfaceVariant}>
              {zonaCaliente
                ? `${zonaCaliente.label}. Es tu mejor porcentaje de la sesión: mantén la mecánica que estás usando ahí.`
                : 'Todavía no hay muestra suficiente en ninguna zona. Necesitas al menos 5 tiros por zona para que el dato signifique algo.'}
            </AppText>
          </Card>

          <Card acentoSuperior={colors.tertiaryContainer}>
            <View style={styles.filaTitulo}>
              <MaterialIcons name="ac-unit" size={20} color={colors.tertiaryContainer} />
              <AppText variant="titleSm">Zonas a mejorar</AppText>
            </View>
            {resumen.zonasAMejorar.length > 0 ? (
              <AppText variant="bodySm" color={colors.onSurfaceVariant}>
                {resumen.zonasAMejorar.map((zona) => COURT_ZONES[zona].label).join(' y ')}
                {'. Abajo tienes contenido específico para esas zonas.'}
              </AppText>
            ) : (
              <AppText variant="bodySm" color={colors.onSurfaceVariant}>
                Ninguna zona con muestra suficiente cae por debajo del 50%. Buena sesión.
              </AppText>
            )}
          </Card>
        </View>

        <AppText variant="headlineMd" style={styles.tituloSeccion}>
          Recomendado para ti
        </AppText>

        {recomendaciones.length > 0 ? (
          <View style={styles.recomendaciones}>
            {recomendaciones.map((rec) => (
              <TipCard
                key={rec.tip.id}
                tip={rec.tip}
                motivo={rec.motivo}
                esFavorito={esFavorito(rec.tip.id)}
                onToggleFavorito={() => alternar(rec.tip.id)}
                onPress={() => navigation.navigate('DetalleTip', { tipId: rec.tip.id })}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icono="menu-book"
            titulo="Sin recomendaciones todavía"
            descripcion="Registra más tiros por zona y la app empezará a sugerirte contenido concreto."
          />
        )}

        <Button
          label="Volver al inicio"
          variante="secundario"
          onPress={volverAlInicio}
          style={styles.volver}
        />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cabecera: {
    paddingTop: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  total: {
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  tituloSeccion: {
    marginBottom: spacing.md,
  },
  analisis: {
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  recomendaciones: {
    gap: spacing.sm,
  },
  volver: {
    marginTop: spacing.xl,
  },
});
