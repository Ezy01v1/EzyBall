import { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Chip, IconoCategoria, Screen, SearchInput } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radius, spacing } from '@/theme';
import { CATEGORY_LABELS, LEVEL_LABELS, TIP_CATEGORIES, TIP_LEVELS, type TipCategory, type TipLevel } from '@/types/tip';

import { useTips } from '../hooks/useTips';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Portada de la Biblioteca: buscador, filtro por nivel y rejilla de categorías.
 * La búsqueda no navega a otra pantalla mientras se escribe — muestra los
 * resultados debajo, que es lo que espera alguien con el móvil en una mano.
 */
export function LibraryScreen() {
  const navigation = useNavigation<Nav>();
  const [busqueda, setBusqueda] = useState('');
  const [nivel, setNivel] = useState<TipLevel | undefined>();

  const filtros = useMemo(() => ({ nivel, busqueda }), [nivel, busqueda]);
  const { tips, refrescar } = useTips(filtros);
  const { tips: todos } = useTips();

  const [refrescando, setRefrescando] = useState(false);
  const onRefresh = async () => {
    setRefrescando(true);
    await refrescar();
    setRefrescando(false);
  };

  const conteos = useMemo(() => {
    const mapa: Partial<Record<TipCategory, number>> = {};
    for (const tip of todos) {
      mapa[tip.categoria] = (mapa[tip.categoria] ?? 0) + 1;
    }
    return mapa;
  }, [todos]);

  const buscando = busqueda.trim().length > 0;

  return (
    <Screen
      conTabBar
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primaryContainer]}
        />
      }
    >
      <AppText variant="headlineLgMobile" style={styles.titulo}>
        Biblioteca
      </AppText>

      <SearchInput value={busqueda} onChangeText={setBusqueda} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipsScroll}
      >
        {TIP_LEVELS.map((item) => (
          <Chip
            key={item}
            label={LEVEL_LABELS[item]}
            activo={nivel === item}
            // Volver a tocar el nivel activo lo deselecciona: es un filtro, no
            // una pestaña, y el usuario debe poder volver a "todos".
            onPress={() => setNivel((actual) => (actual === item ? undefined : item))}
          />
        ))}
      </ScrollView>

      {buscando ? (
        <ResultadosBusqueda
          total={tips.length}
          onAbrir={(tipId) => navigation.navigate('DetalleTip', { tipId })}
          items={tips.map((tip) => ({ id: tip.id, titulo: tip.titulo, resumen: tip.resumen }))}
        />
      ) : (
        <View style={styles.rejilla}>
          {TIP_CATEGORIES.map((categoria) => (
            <Pressable
              key={categoria}
              accessibilityRole="button"
              accessibilityLabel={CATEGORY_LABELS[categoria]}
              onPress={() => navigation.navigate('Categoria', { categoria })}
              style={({ pressed }) => [
                styles.tarjeta,
                categoria === 'tiro' && styles.tarjetaDestacada,
                { transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
            >
              <IconoCategoria
                categoria={categoria}
                size={40}
                color={categoria === 'tiro' ? colors.primary : colors.onSurfaceVariant}
              />
              <AppText variant="titleSm" center>
                {CATEGORY_LABELS[categoria]}
              </AppText>
              <AppText variant="labelCapsSm" color={colors.outline}>
                {`${conteos[categoria] ?? 0} tips`}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

function ResultadosBusqueda({
  items,
  total,
  onAbrir,
}: {
  items: { id: string; titulo: string; resumen: string }[];
  total: number;
  onAbrir: (id: string) => void;
}) {
  return (
    <View style={styles.resultados}>
      <AppText variant="labelCaps" color={colors.onSurfaceVariant}>
        {total === 1 ? '1 resultado' : `${total} resultados`}
      </AppText>

      {items.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          onPress={() => onAbrir(item.id)}
          style={({ pressed }) => [styles.resultado, { opacity: pressed ? 0.6 : 1 }]}
        >
          <AppText variant="titleSm">{item.titulo}</AppText>
          <AppText variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={2}>
            {item.resumen}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: {
    paddingTop: spacing.lg,
    marginBottom: spacing.md,
  },
  chipsScroll: {
    marginTop: spacing.md,
    // Deja que los chips sangren hasta el borde de la pantalla al hacer scroll.
    marginHorizontal: -spacing.screen,
  },
  chips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
  },
  rejilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  tarjeta: {
    // Dos columnas con 16px de separación.
    width: '47.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hardBorder,
  },
  tarjetaDestacada: {
    borderTopWidth: 3,
    borderTopColor: colors.primaryContainer,
  },
  resultados: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  resultado: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
});
