import { useMemo, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Chip, EmptyState, Screen, TipCard, TopBar } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { COURT_ZONES } from '@/types/court';
import { CATEGORY_LABELS } from '@/types/tip';

import { useFavorites } from '../hooks/useFavorites';
import { useTips } from '../hooks/useTips';
import { subcategoriesOf } from '../data/tipsRepository';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Ruta = RouteProp<RootStackParamList, 'Categoria'>;

/**
 * Listado de una categoría, con filtro por subcategoría.
 *
 * Acepta también un parámetro `zona`: es la puerta de entrada desde el resumen
 * de sesión ("ver todos los tips para esquina derecha"), y por eso el filtro se
 * anuncia arriba con un chip, para que quede claro por qué la lista está
 * recortada.
 */
export function CategoryScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Ruta>();
  const { categoria, zona } = params;

  const [subcategoria, setSubcategoria] = useState<string | undefined>(params.subcategoria);
  const { alternar, esFavorito } = useFavorites();

  const filtros = useMemo(
    () => ({ categoria, subcategoria, zona }),
    [categoria, subcategoria, zona],
  );

  const { tips, cargando } = useTips(filtros);
  const { tips: deLaCategoria } = useTips(useMemo(() => ({ categoria }), [categoria]));

  const subcategorias = useMemo(
    () => subcategoriesOf(deLaCategoria, categoria),
    [deLaCategoria, categoria],
  );

  return (
    <View style={styles.raiz}>
      <TopBar titulo={CATEGORY_LABELS[categoria]} onBack={navigation.goBack} />

      <Screen insetSuperior={false}>
        {zona ? (
          <View style={styles.avisoZona}>
            <Chip label={`Zona: ${COURT_ZONES[zona].label}`} activo />
            <AppText variant="bodySm" color={colors.onSurfaceVariant}>
              Contenido etiquetado para la zona que estás trabajando.
            </AppText>
          </View>
        ) : null}

        {subcategorias.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            style={styles.chipsScroll}
          >
            <Chip
              label="Todo"
              activo={!subcategoria}
              onPress={() => setSubcategoria(undefined)}
            />
            {subcategorias.map((item) => (
              <Chip
                key={item}
                label={item}
                activo={subcategoria === item}
                onPress={() => setSubcategoria((actual) => (actual === item ? undefined : item))}
              />
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.lista}>
          {tips.map((tip) => (
            <TipCard
              key={tip.id}
              tip={tip}
              esFavorito={esFavorito(tip.id)}
              onToggleFavorito={() => alternar(tip.id)}
              onPress={() => navigation.navigate('DetalleTip', { tipId: tip.id })}
            />
          ))}

          {!cargando && tips.length === 0 ? (
            <EmptyState
              icono="search-off"
              titulo="Sin contenido para este filtro"
              descripcion="Todavía no hay tips publicados que cumplan estas condiciones."
              accion={
                subcategoria || zona
                  ? { label: 'Quitar filtros', onPress: () => setSubcategoria(undefined) }
                  : undefined
              }
            />
          ) : null}
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
  avisoZona: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  chipsScroll: {
    marginTop: spacing.md,
    marginHorizontal: -spacing.screen,
  },
  chips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
  },
  lista: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
