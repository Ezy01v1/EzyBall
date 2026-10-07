import type { Box } from './types';

export interface Tamano {
  width: number;
  height: number;
}

export interface Punto {
  x: number;
  y: number;
}

/**
 * Conversión entre coordenadas de la vista (píxeles del preview en pantalla) y
 * coordenadas normalizadas 0..1 del frame que analiza el modelo.
 *
 * El preview se pinta en modo `cover`: el frame se escala hasta llenar la vista
 * y lo que sobra se recorta por igual a ambos lados. Si no se deshace ese
 * recorte, el aro que el usuario toca en pantalla queda desplazado respecto al
 * aro real del frame y el reductor mide distancias contra un punto erróneo.
 */
function ajusteCover(vista: Tamano, frame: Tamano) {
  const escala = Math.max(vista.width / frame.width, vista.height / frame.height);
  const anchoMostrado = frame.width * escala;
  const altoMostrado = frame.height * escala;
  return {
    anchoMostrado,
    altoMostrado,
    offsetX: (anchoMostrado - vista.width) / 2,
    offsetY: (altoMostrado - vista.height) / 2,
  };
}

export function vistaAFrame(p: Punto, vista: Tamano, frame: Tamano): Punto {
  const a = ajusteCover(vista, frame);
  return {
    x: (p.x + a.offsetX) / a.anchoMostrado,
    y: (p.y + a.offsetY) / a.altoMostrado,
  };
}

export function frameAVista(p: Punto, vista: Tamano, frame: Tamano): Punto {
  const a = ajusteCover(vista, frame);
  return {
    x: p.x * a.anchoMostrado - a.offsetX,
    y: p.y * a.altoMostrado - a.offsetY,
  };
}

/**
 * Proporción alto/ancho de la caja del aro. Incluye la red, que es lo que un
 * detector entrenado marcaría como "aro" y contra lo que están calibradas las
 * tolerancias de `DEFAULT_CONFIG`.
 */
export const PROPORCION_ARO = 0.9;

/**
 * Caja del aro (normalizada al frame) a partir del punto que tocó el usuario y
 * el ancho del anillo que ajustó en pantalla, ambos en píxeles de la vista.
 */
export function aroDesdeToque(centro: Punto, anchoVista: number, vista: Tamano, frame: Tamano): Box {
  const altoVista = anchoVista * PROPORCION_ARO;
  const supIzq = vistaAFrame(
    { x: centro.x - anchoVista / 2, y: centro.y - altoVista / 2 },
    vista,
    frame,
  );
  const infDer = vistaAFrame(
    { x: centro.x + anchoVista / 2, y: centro.y + altoVista / 2 },
    vista,
    frame,
  );
  return {
    x: supIzq.x,
    y: supIzq.y,
    width: infDer.x - supIzq.x,
    height: infDer.y - supIzq.y,
    score: 1,
  };
}
