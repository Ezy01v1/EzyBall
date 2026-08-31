import { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Chip,
  EmptyState,
  Screen,
  StatBlock,
  TipCard,
} from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { useFavorites } from '@/features/library/hooks/useFavorites';
import { useRecommendations } from '@/features/recommendations/useRecommendations';
import { listSessions } from '@/features/tracker/data/sessionRepository';
import type { RootStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import type { TrainingSession } from '@/types/session';
import { formatPercent, formatSessionDate } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { perfil } = useAuth();
  const { alternar, esFavorito } = useFavorites();
  const { recomendaciones } = useRecommendations(perfil.nivel, 1);
  const [ultima, setUltima] = useState<TrainingSession | null>(null);

  // useFocusEffect y no useEffect: al volver de una sesión el Home tiene que
  // mostrar ya los datos nuevos, sin remontar la tab.
  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      void listSessions().then((sesiones) => {
        if (vivo) setUltima(sesiones[0] ?? null);
      });
      return () => {
        vivo = false;
      };
    }, []),
  );

  const destacado = recomendaciones[0];

  return (
    <Screen conTabBar>
      <View style={styles.saludo}>
        <AppText variant="headlineLgMobile">{`Hola, ${perfil.nombre}`}</AppText>
        <AppText variant="bodyMd" color={colors.onSurfaceVariant}>
          Listo para dominar la cancha hoy.
        </AppText>
      </View>

      <View style={styles.seccion}>
        <View style={styles.encabezado}>
          <AppText variant="headlineMd">Última sesión</AppText>
          {ultima ? (
            <AppText variant="labelCaps" color={colors.outline}>
              {formatSessionDate(ultima.fecha)}
            </AppText>
          ) : null}
        </View>

        {ultima ? (
          <Card
            acentoSuperior={colors.primaryContainer}
            onPress={() => navigation.navigate('ResumenSesion', { sesionId: ultima.id })}
          >
            <Chip label={ultima.etiqueta} />
            <View style={styles.metricas}>
              <StatBlock
                etiqueta="Acierto"
                valor={formatPercent(ultima.resumen.fgPercentTotal)}
                color={colors.primary}
                style={styles.metrica}
              />
              <StatBlock
                etiqueta="Tiros"
                valor={`${ultima.resumen.totalAciertos}`}
                sufijo={`/${ultima.resumen.totalIntentos}`}
                style={styles.metrica}
              />
            </View>
          </Card>
        ) : (
          <EmptyState
            icono="sports-basketball"
            titulo="Todavía no hay sesiones"
            descripcion="Graba tu primera serie de tiros y la app te dirá desde qué zonas estás fallando."
          />
        )}
      </View>

      <View style={styles.acciones}>
        <Button
          label="NUEVA SESIÓN"
          icono="add-circle"
          onPress={() => navigation.navigate('NuevaSesion')}
          grande
        />
        <Button
          label="EXPLORAR TIPS"
          icono="explore"
          variante="secundario"
          onPress={() => navigation.navigate('Tabs', { screen: 'Biblioteca' })}
          grande
        />
      </View>

      {destacado ? (
        <View style={styles.seccion}>
          <AppText variant="headlineMd" style={styles.tituloSeccion}>
            Tip recomendado
          </AppText>
          <TipCard
            tip={destacado.tip}
            motivo={destacado.motivo}
            esFavorito={esFavorito(destacado.tip.id)}
            onToggleFavorito={() => alternar(destacado.tip.id)}
            onPress={() => navigation.navigate('DetalleTip', { tipId: destacado.tip.id })}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  saludo: {
    paddingTop: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  seccion: {
    marginBottom: spacing.xl,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  tituloSeccion: {
    marginBottom: spacing.sm,
  },
  metricas: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  metrica: {
    flex: 1,
  },
  acciones: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
});
