# Modelos on-device

## balon-coco.tflite (en uso, camino A)

SSD-MobileNet v1 cuantizado sobre COCO, 300x300 uint8, de
https://storage.googleapis.com/download.tensorflow.org/models/tflite/coco_ssd_mobilenet_v1_1.0_quant_2018_06_29.zip
(`detect.tflite` renombrado). Solo se usa la clase 36, "sports ball". El aro
no lo detecta ningun modelo: lo marca el usuario en la pantalla de calibracion.

## hoop-ball.tflite (camino B, pendiente)

**Todavia no existe.** Cuando exista, sustituira a `balon-coco.tflite` en
`cargarModeloEmpaquetado()` y el aro dejara de marcarse a mano.

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
