# Modelos on-device

## hoop-ball.tflite (en uso, camino B)

Detector propio de **aro** y **balon**, entrenado con `training/entrenar_hoop_ball.ipynb`
(MediaPipe Model Maker 0.2.1.4, MobileNet-MultiAVG 384x384, exportado en float16,
~7 MB).

- Entrada: float32 `[1, 384, 384, 3]`, RGB normalizado a `[-1, 1]`.
- Salidas crudas (sin NMS): 0 = cajas codificadas `[1, 27621, 4]` en orden YXHW
  relativas a cada anchor; 1 = scores `[1, 27621, 3]` en `[0, 1]` con etiquetas
  `background, aro, balon`.
- La app decodifica con `parseOutputCrudo()` (`src/features/tracker/vision/ssdCrudo.ts`),
  que genera los anchors por formula. `training/verificar_decodificacion.py`
  comprueba esa decodificacion contra el ObjectDetector de MediaPipe.
- mAP en el split de test con la primera version (MobileNetV2 320): 0.70.

### Dataset y licencia

Entrenado con el dataset **"cv"** de Roboflow Universe (workspace `cv-8scak`,
proyecto `cv-cnfd4`, version 1), autor **CV**, licencia
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/):
https://universe.roboflow.com/cv-8scak/cv-cnfd4

Las clases originales `rim` y `basketball` se unificaron a `aro` y `balon`
(`training/unificar_etiquetas.py`); `people` se descarto.

## balon-coco.tflite (respaldo, camino A)

SSD-MobileNet v1 cuantizado sobre COCO, 300x300 uint8, de
https://storage.googleapis.com/download.tensorflow.org/models/tflite/coco_ssd_mobilenet_v1_1.0_quant_2018_06_29.zip
(`detect.tflite` renombrado). Solo se usa la clase 36, "sports ball"; el aro lo
marca el usuario. Se usa solo si `hoop-ball.tflite` no esta en el bundle.

Metro ya resuelve `.tflite` como asset binario (ver `metro.config.js`).
