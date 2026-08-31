# Modelos on-device

Aqui va el modelo TensorFlow Lite de deteccion aro/balon:

    hoop-ball.tflite

**Todavia no existe.** Mientras falte, `detectorDisponible()` devuelve `false`
y el tracker funciona en modo manual (el usuario marca canasta/fallo con el
pulgar). La app no se rompe por su ausencia: el require esta envuelto en
try/catch en `src/features/tracker/vision/hoopDetector.ts`.

## Que hace falta para entrenarlo

- **Dataset**: video de canchas indoor y outdoor, distintas horas y alturas de
  camara, con las cajas etiquetadas en dos clases: `0 = aro`, `1 = balon`.
  Grabar con el mismo montaje real (palo selfie con patitas), no con tripode:
  el modelo tiene que ver los angulos que va a ver en produccion.
- **Arquitectura**: un detector ligero tipo SSD-MobileNet o YOLO-nano,
  entrada 320x320.
- **Export**: TFLite cuantizado a int8 si es posible. Objetivo de tamano
  < 5 MB para no inflar el bundle.
- **Salidas esperadas** por `parseOutput()`: cajas `[ymin, xmin, ymax, xmax]`
  normalizadas, array de clases y array de scores. Si el export usa otro
  formato, se ajusta ahi y nada mas.

Metro ya resuelve `.tflite` como asset binario (ver `metro.config.js`).
