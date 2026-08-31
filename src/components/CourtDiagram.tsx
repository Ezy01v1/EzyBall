import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { colors, fontFamily, radius } from '@/theme';
import { COURT_ZONE_LIST, type CourtZone, type CourtZoneId } from '@/types/court';
import type { ZoneStats } from '@/types/session';

type Modo = 'seleccion' | 'heatmap';

interface CourtDiagramProps {
  modo?: Modo;
  seleccionada?: CourtZoneId;
  onSelect?: (zona: CourtZoneId) => void;
  /** Solo en modo heatmap: pinta cada zona según su porcentaje. */
  stats?: ZoneStats[];
  style?: ViewStyle;
}

/** El SVG trabaja en un lienzo 100x100 y las zonas están normalizadas 0..1. */
const LIENZO = 100;

/**
 * Media cancha con el aro abajo al centro.
 *
 * Es el mismo componente en los dos modos porque la correspondencia visual
 * importa: el usuario elige "esquina derecha" en un diagrama y después ve su
 * porcentaje pintado exactamente en el mismo sitio. Si fueran dos dibujos
 * distintos, el mapa de calor no se leería como "mi cancha".
 */
export function CourtDiagram({
  modo = 'seleccion',
  seleccionada,
  onSelect,
  stats,
  style,
}: CourtDiagramProps) {
  const porZona = new Map((stats ?? []).map((zona) => [zona.zona, zona]));

  return (
    <View style={[styles.contenedor, style]}>
      <Svg viewBox={`0 0 ${LIENZO} ${LIENZO}`} width="100%" height="100%">
        {/* --- Líneas de cancha (decorativas) --- */}
        <G opacity={0.35}>
          {/* Línea de tres: tramos rectos en las esquinas + arco. */}
          <Path
            d="M 5 100 L 5 72 A 45 45 0 0 1 95 72 L 95 100"
            stroke={colors.outline}
            strokeWidth={1}
            fill="none"
          />
          {/* Zona / pintura. */}
          <Rect
            x={35}
            y={62}
            width={30}
            height={38}
            stroke={colors.outline}
            strokeWidth={1}
            fill={colors.outlineVariant}
            fillOpacity={0.15}
          />
          {/* Círculo de tiros libres. */}
          <Circle cx={50} cy={62} r={13} stroke={colors.outline} strokeWidth={1} fill="none" />
          {/* Tablero. */}
          <Line x1={41} y1={97} x2={59} y2={97} stroke={colors.outline} strokeWidth={1.2} />
        </G>

        {/* Aro: siempre en naranja, es la referencia de orientación. */}
        <Circle cx={50} cy={93} r={3.2} stroke={colors.primaryContainer} strokeWidth={1.6} fill="none" />

        {/* --- Zonas --- */}
        {COURT_ZONE_LIST.map((zona) => (
          <ZonaSvg
            key={zona.id}
            zona={zona}
            modo={modo}
            activa={seleccionada === zona.id}
            stats={porZona.get(zona.id)}
            onPress={onSelect ? () => onSelect(zona.id) : undefined}
          />
        ))}
      </Svg>
    </View>
  );
}

interface ZonaSvgProps {
  zona: CourtZone;
  modo: Modo;
  activa: boolean;
  stats?: ZoneStats;
  onPress?: () => void;
}

function ZonaSvg({ zona, modo, activa, stats, onPress }: ZonaSvgProps) {
  const x = zona.rect.x * LIENZO;
  const y = zona.rect.y * LIENZO;
  const width = zona.rect.width * LIENZO;
  const height = zona.rect.height * LIENZO;

  const heat = modo === 'heatmap' ? colorDeCalor(stats) : null;
  const relleno = modo === 'heatmap' ? (heat ?? colors.surfaceContainerLow) : colors.surfaceContainerLow;
  const opacidadRelleno = modo === 'heatmap' ? (heat ? 0.55 : 0.2) : activa ? 0.35 : 0.18;

  const borde = activa ? colors.primaryContainer : colors.outlineVariant;

  return (
    <G onPress={onPress}>
      <Rect
        x={x + 0.6}
        y={y + 0.6}
        width={Math.max(0, width - 1.2)}
        height={Math.max(0, height - 1.2)}
        rx={1.5}
        fill={activa ? colors.primaryContainer : relleno}
        fillOpacity={opacidadRelleno}
        stroke={borde}
        strokeWidth={activa ? 1.4 : 0.6}
        strokeDasharray={activa || modo === 'heatmap' ? undefined : '2 1.5'}
      />
      <SvgText
        x={x + width / 2}
        y={y + height / 2 + (modo === 'heatmap' && stats?.intentos ? -2 : 1.5)}
        fill={activa ? colors.primary : colors.onSurfaceVariant}
        fontSize={3.6}
        fontFamily={fontFamily.mono}
        textAnchor="middle"
        opacity={activa ? 1 : 0.75}
      >
        {zona.short}
      </SvgText>

      {modo === 'heatmap' && stats && stats.intentos > 0 ? (
        <SvgText
          x={x + width / 2}
          y={y + height / 2 + 5}
          fill={colors.onSurface}
          fontSize={6}
          fontFamily={fontFamily.display}
          textAnchor="middle"
        >
          {`${Math.round(stats.fgPercent ?? 0)}%`}
        </SvgText>
      ) : null}
    </G>
  );
}

/**
 * Escala de calor del design system: naranja = zona caliente, salmón =
 * intermedia, azul = zona fría / a mejorar.
 */
function colorDeCalor(stats?: ZoneStats): string | null {
  if (!stats || stats.intentos === 0 || stats.fgPercent == null) return null;
  if (stats.fgPercent >= 60) return colors.primaryContainer;
  if (stats.fgPercent >= 40) return colors.secondaryFixedDim;
  return colors.tertiaryContainer;
}

const styles = StyleSheet.create({
  contenedor: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
});
