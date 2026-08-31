import { useEffect, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Card, Chip, Screen, TipThumbnail, TopBar } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radius, sizes, spacing } from '@/theme';
import { COURT_ZONES } from '@/types/court';
import { CATEGORY_LABELS, FORMAT_LABELS, LEVEL_LABELS, type Tip } from '@/types/tip';

import { getTipById } from '../data/tipsRepository';
import { useFavorites } from '../hooks/useFavorites';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Ruta = RouteProp<RootStackParamList, 'DetalleTip'>;

export function TipDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Ruta>();
  const insets = useSafeAreaInsets();
  const { alternar, esFavorito } = useFavorites();

  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    let vivo = true;
    void getTipById(params.tipId).then((encontrado) => {
      if (vivo) setTip(encontrado);
    });
    return () => {
      vivo = false;
    };
  }, [params.tipId]);

  if (!tip) {
    return (
      <View style={styles.raiz}>
        <TopBar marca onBack={navigation.goBack} />
      </View>
    );
  }

  const favorito = esFavorito(tip.id);

  return (
    <View style={styles.raiz}>
      <TopBar marca onBack={navigation.goBack} />

      <Screen insetSuperior={false} padded={false} style={styles.contenido}>
        <TipThumbnail tip={tip} width={undefined} height={220} style={styles.hero} />

        <View style={styles.cuerpo}>
          <View style={styles.badges}>
            <Chip label={CATEGORY_LABELS[tip.categoria]} />
            <Chip label={LEVEL_LABELS[tip.nivel]} />
            <Chip label={FORMAT_LABELS[tip.formato]} />
          </View>

          <AppText variant="headlineLgMobile">{tip.titulo}</AppText>

          {tip.texto.map((parrafo, i) => (
            <AppText key={i} variant="bodyMd" color={colors.onSurfaceVariant}>
              {parrafo}
            </AppText>
          ))}

          {tip.pasos?.length ? (
            <Card style={styles.pasos}>
              <AppText variant="headlineMd" color={colors.primary} style={styles.tituloPasos}>
                Cómo practicarlo
              </AppText>

              {tip.pasos.map((paso, i) => (
                <View key={paso.titulo} style={styles.paso}>
                  <View style={styles.numero}>
                    <AppText variant="labelCaps" color={colors.black}>
                      {String(i + 1)}
                    </AppText>
                  </View>
                  <View style={styles.textoPaso}>
                    <AppText variant="titleSm">{paso.titulo}</AppText>
                    <AppText variant="bodySm" color={colors.onSurfaceVariant}>
                      {paso.detalle}
                    </AppText>
                  </View>
                </View>
              ))}
            </Card>
          ) : null}

          {tip.zonas.length > 0 ? (
            <View style={styles.zonas}>
              <AppText variant="labelCaps" color={colors.onSurfaceVariant}>
                Zonas donde aplica
              </AppText>
              <View style={styles.badges}>
                {tip.zonas.map((zona) => (
                  <Chip
                    key={zona}
                    label={COURT_ZONES[zona].label}
                    onPress={() =>
                      navigation.navigate('Categoria', { categoria: tip.categoria, zona })
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}

          {tip.fuenteReferencia ? (
            <AppText variant="bodySm" color={colors.outline} style={styles.fuente}>
              {`Referencia: ${tip.fuenteReferencia}`}
            </AppText>
          ) : null}
        </View>
      </Screen>

      <View style={[styles.pie, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          label={favorito ? 'Guardado en favoritos' : 'Marcar como favorito'}
          icono={favorito ? 'bookmark' : 'bookmark-border'}
          variante={favorito ? 'secundario' : 'primario'}
          onPress={() => alternar(tip.id)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    // Hueco para el botón fijo de abajo.
    paddingBottom: sizes.buttonHeight + spacing.xl,
  },
  hero: {
    width: '100%',
    borderRightWidth: 0,
  },
  cuerpo: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pasos: {
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  tituloPasos: {
    marginBottom: spacing.xs,
  },
  paso: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    padding: spacing.md,
  },
  numero: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoPaso: {
    flex: 1,
    gap: spacing.xs,
  },
  zonas: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  fuente: {
    marginTop: spacing.sm,
  },
  pie: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
});
