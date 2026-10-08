# Modelo propio `hoop-ball.tflite` (aro + balón) — Diseño

Fecha: 2026-10-07 · Estado: pendiente de revisión

## Objetivo

Sustituir el detector genérico de COCO (solo "sports ball") por un detector
propio de dos clases, **aro** y **balón**, para que:

1. El aro se detecte solo en la calibración (el marcado manual pasa a ser respaldo).
2. El balón se siga mejor en el aire, que es donde COCO pierde frames.

**Criterio de éxito:** en una prueba de 20 tiros con el Galaxy A56, la app
cuenta bien al menos 18 (canasta/fallo correcto). Los errores se corrigen con
los controles que ya existen (deshacer, botones manuales).

## Contexto y restricciones

- No hay datos propios (ni videos ni etiquetas). La primera versión se entrena
  solo con datasets públicos.
- El usuario entrena en varias canchas (interior/exterior, día/noche).
- Dispositivo objetivo: Samsung Galaxy A56 (Android gama media-alta).
- No hay GPU local: el entrenamiento se hace en Google Colab (gratis).
- Todo el procesamiento sigue siendo on-device (ver `docs/PRIVACIDAD.md`).
- Modelo < 5 MB.
- Licencia permisiva: la app debe poder publicarse sin obligaciones. Por eso
  se descarta YOLO de Ultralytics (AGPL-3.0).

## Decisión: EfficientDet-Lite0 con MediaPipe Model Maker

- Licencia Apache 2.0.
- Entrada 320×320, ~4–5 MB cuantizado a int8.
- La salida exportada es el postprocesado de detección estándar de TFLite
  (cajas `[ymin, xmin, ymax, xmax]` normalizadas, clases, scores, conteo):
  mismo formato que ya consume `parseOutput()`.

Plan B si en cancha pierde demasiado el balón: probar YOLO asumiendo su
licencia. Fuera del alcance de este spec.

## Parte 1 — Pipeline de entrenamiento (`training/`)

Archivos nuevos:

- `training/entrenar_hoop_ball.ipynb` — notebook de Colab, ejecutable de
  principio a fin con "Ejecutar todo".
- `training/README.md` — pasos para el usuario: cuenta de Roboflow, abrir en
  Colab, pegar la clave, ejecutar, descargar, copiar a `assets/models/`.

Pasos del notebook:

1. **Entorno:** instalar `mediapipe-model-maker` y `roboflow`. Comprobar que
   hay GPU y avisar si no.
2. **Descarga:** uno o dos datasets públicos de Roboflow Universe con aro y
   balón etiquetados, en formato COCO JSON. La clave de Roboflow se pide con
   `getpass` / secretos de Colab; nunca se escribe en el notebook ni en el repo.
   Los identificadores de los datasets van en una celda de configuración
   arriba del todo, para poder cambiarlos sin tocar el resto.
3. **Unificación de etiquetas:** un mapa explícito de nombres de clase de
   origen a `aro` / `balon` (p. ej. `rim`, `hoop`, `basket` → `aro`;
   `ball`, `basketball`, `sports ball` → `balon`). Las anotaciones de otras
   clases se descartan. Las imágenes que se quedan sin ninguna caja también.
   Se imprime un resumen: imágenes y cajas por clase en train/validation/test.
4. **Entrenamiento:** `object_detector` de Model Maker con
   `SupportedModels.EFFICIENTDET_LITE0`. Hiperparámetros en la celda de
   configuración (épocas, batch size, learning rate).
5. **Evaluación:** sobre el split de test (imágenes no vistas). Se imprime
   COCO mAP general y AP por clase (aro y balón por separado).
6. **Export:** cuantización int8 post-entrenamiento con
   `QuantizationConfig.for_int8()` y un subconjunto de train como datos
   representativos. Se comprueba que el archivo pesa < 5 MB, se ejecuta una
   inferencia de prueba con el intérprete de TFLite y se imprimen el orden y
   la forma de las salidas, el tipo de entrada y el orden de las clases
   (para fijar los índices en el perfil de la app).
7. **Descarga** de `hoop-ball.tflite` y de un `labels.txt`.

`balon-coco.tflite` se queda en el repo hasta que el modelo nuevo pase la
prueba de cancha.

## Parte 2 — Integración en la app

### 2.1 `hoopDetector.ts`: perfiles de modelo

```ts
interface PerfilModelo {
  nombre: 'hoop-ball' | 'balon-coco';
  inputSize: number;            // 320 | 300
  claseAro: number | null;      // null en COCO: no detecta aros
  claseBalon: number;
  scoreMinimo: number;
}
```

- `cargarModeloEmpaquetado()` intenta `hoop-ball.tflite`; si el require falla,
  cae a `balon-coco.tflite`; si tampoco existe, `null` (modo manual, como hoy).
  Devuelve el asset junto con su perfil.
- `prepareInput()` recibe el tamaño de entrada del perfil en vez de la
  constante `MODEL_INPUT_SIZE`.
- `parseOutput()` vuelve a devolver `{ aro, balon }`, la caja de mayor score
  de cada clase según el perfil. Con el perfil COCO, `aro` es siempre `null`.
- El índice de salida de cajas/clases/scores se valida contra lo que imprimió
  el notebook; si Model Maker exporta otro orden, se ajusta aquí y en ningún
  otro sitio.

### 2.2 `CameraPreview.tsx` y `cameraModule.ts`

`onDeteccion` pasa a recibir también el aro:
`(deteccion: { aro: Box | null; balon: Box | null }, timestamp, ancho, alto)`.

### 2.3 Calibración: el modelo propone, el usuario confirma

- Nuevo módulo puro `vision/aroEstable.ts`: acumula las detecciones de aro
  y declara un aro "estable" cuando aparece en N frames consecutivos
  (por defecto 8) con score ≥ umbral y el centro no se ha movido más de un
  porcentaje del ancho del aro (por defecto 15 %). Devuelve la caja promedio.
  Si el aro desaparece o salta, el contador se reinicia.
- `CalibrationScreen` muestra el anillo propuesto en cuanto hay aro estable y
  un botón **Confirmar aro**. El usuario puede, en lugar de confirmar, tocar
  la pantalla y ajustar con + / −: es el flujo actual, que se mantiene tal cual
  como respaldo.
- Con el perfil COCO (sin clase aro) la pantalla se comporta exactamente
  como hoy.

### 2.4 Sesión en vivo

- El aro confirmado en la calibración queda **fijo** durante toda la sesión.
  Las detecciones de aro en vivo se ignoran: así un aro del fondo no puede
  desplazar el aro de referencia. El reductor (`shotEventReducer`) no cambia.
- El balón se toma del modelo nuevo con el `scoreMinimo` de su perfil.
- Corrección: los controles existentes (deshacer último tiro, botones de
  canasta/fallo) no cambian.

## Pruebas

Automáticas (Jest):

- `parseOutput`: perfil hoop-ball con ambas clases presentes, solo una, ninguna;
  se queda con la de mayor score por clase; perfil COCO devuelve `aro: null`
  e ignora otras clases.
- `aroEstable`: se estabiliza tras N frames; se reinicia si el aro desaparece,
  si salta más de la tolerancia o si baja de score; la caja devuelta es el
  promedio.
- Tests existentes de `shotEventReducer` y `geometria` siguen pasando.

Manuales:

- Notebook: AP por clase impreso; archivo < 5 MB; inferencia de prueba OK.
- Cancha (A56): calibración detecta el aro sin tocar la pantalla en
  interior y exterior; 20 tiros, ≥ 18 contados bien.

## Fuera de alcance

- Grabar o etiquetar datos propios (se hará si la prueba de cancha falla).
- YOLO u otras arquitecturas.
- Fase 4 (zona automática, forma de tiro, gamificación): spec aparte.
