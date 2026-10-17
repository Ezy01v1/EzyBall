# Modelo propio hoop-ball.tflite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entrenar un detector propio de dos clases (aro + balón) en Colab y conectarlo a la app para que la calibración proponga el aro sola y el balón se siga mejor.

**Architecture:** Un notebook de Colab (`training/`) produce `hoop-ball.tflite` (EfficientDet-Lite0, int8). En la app, `hoopDetector.ts` pasa a trabajar con *perfiles de modelo* (archivo, tamaño de entrada, índices de clase y de salidas), de modo que el mismo código sirve para COCO y para el modelo propio. Un módulo puro nuevo (`aroEstable.ts`) decide cuándo un aro detectado es fiable, y la calibración lo propone para que el usuario lo confirme.

**Tech Stack:** Python (Colab, `mediapipe-model-maker`, `roboflow`, `unittest`), TypeScript, React Native 0.86, `react-native-vision-camera` 5, `react-native-fast-tflite`, Jest (`jest-expo`).

**Spec:** `docs/superpowers/specs/2026-10-07-modelo-hoop-ball-design.md`

## Global Constraints

- Arquitectura: EfficientDet-Lite0 vía MediaPipe Model Maker (Apache 2.0). No YOLO.
- Entrada del modelo propio: 320×320. Cuantización int8. Archivo < 5 MB.
- Clases de la app: solo `aro` y `balon`.
- La clave de Roboflow nunca se escribe en el notebook ni en el repo.
- Todo el procesamiento on-device; del worklet solo salen cajas, nunca píxeles.
- Aro estable: 8 frames consecutivos, deriva del centro ≤ 15 % del ancho del aro.
- El aro confirmado en calibración queda fijo toda la sesión; `shotEventReducer` no cambia.
- Sin `hoop-ball.tflite`, la app se comporta exactamente como hoy (COCO + aro manual).
- `balon-coco.tflite` se queda en el repo.
- Comandos de verificación de la app: `npm test`, `npm run typecheck`, `npm run lint`.

## Review Focus

- **Aro del fondo / segunda canasta en el encuadre:** `parseOutput` se queda con el aro de mayor score; `aroEstable` debe reiniciarse si el aro "salta" de una canasta a otra (test en Task 4).
- **Model Maker exporta las salidas en otro orden que COCO** (p. ej. scores antes que cajas): los índices de salida viven en el perfil, no en `CameraPreview` (test en Task 3 con un perfil de orden distinto).
- **Índices de clase con fondo en 0:** el notebook imprime el orden de etiquetas; Task 6 copia esos índices al perfil. `parseOutput` compara con `Math.round` (test en Task 3 con clase `1.0000001`).
- **El usuario toca la pantalla después de que se propuso un aro:** el toque manual gana sobre la propuesta (Task 5).
- **Dataset sin cajas de alguna clase tras unificar:** el script debe fallar con un mensaje claro, no entrenar un modelo de una sola clase (test en Task 1).

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `training/unificar_etiquetas.py` (nuevo) | Funciones puras: reescribir un COCO JSON a las clases `aro`/`balon`. |
| `training/test_unificar_etiquetas.py` (nuevo) | Tests `unittest` del script anterior. |
| `training/entrenar_hoop_ball.ipynb` (nuevo) | Notebook de Colab: descarga, unifica, entrena, evalúa, exporta. |
| `training/README.md` (nuevo) | Pasos para el usuario. |
| `src/features/tracker/vision/hoopDetector.ts` | Perfiles de modelo, carga, `prepareInput`, `parseOutput`, `configAuto`. |
| `src/features/tracker/vision/__tests__/hoopDetector.test.ts` (nuevo) | Tests de `parseOutput` y `configAuto`. |
| `src/features/tracker/vision/aroEstable.ts` (nuevo) | Estabilización del aro detectado. |
| `src/features/tracker/vision/__tests__/aroEstable.test.ts` (nuevo) | Tests de `aroEstable`. |
| `src/features/tracker/vision/CameraPreview.tsx`, `cameraModule.ts` | Pasar `{ aro, balon }` al callback. |
| `src/features/tracker/screens/CalibrationScreen.tsx` | Proponer y confirmar aro. |
| `src/features/tracker/screens/LiveRecordingScreen.tsx` | Usar `configAuto(perfil)`. |
| `assets/models/README.md`, `assets/models/hoop-ball.tflite` | Documentación y modelo final (Task 6). |

---

### Task 1: Script de unificación de etiquetas

**Files:**
- Create: `training/unificar_etiquetas.py`
- Test: `training/test_unificar_etiquetas.py`

**Interfaces:**
- Produces:
  - `MAPA_CLASES: dict[str, str]` — nombre de origen en minúsculas → `"aro"` | `"balon"`. Valores: `rim, hoop, basket, basketball-hoop, net` → `aro`; `ball, basketball, sports ball, sports-ball` → `balon`.
  - `CLASES_SALIDA = ["aro", "balon"]` (ids 1 y 2 en el COCO resultante; Model Maker reserva 0 para fondo).
  - `unificar_coco(coco: dict, mapa: dict[str, str] = MAPA_CLASES) -> dict` — devuelve un COCO nuevo con solo esas dos categorías, anotaciones remapeadas, anotaciones de otras clases descartadas e imágenes sin anotaciones descartadas. Los nombres de origen se comparan con `.strip().lower()`.
  - `resumen(coco: dict) -> dict[str, int]` — `{"imagenes": n, "aro": n, "balon": n}`.
  - `ErrorDataset(Exception)` — se lanza si tras unificar alguna de las dos clases tiene 0 cajas; el mensaje nombra la clase y lista las categorías de origen que se encontraron.
  - CLI: `python unificar_etiquetas.py <entrada.json> <salida.json>` imprime el resumen.

- [ ] **Step 1: Write the failing tests** (`unittest`, sin dependencias externas)

```python
class TestUnificar(unittest.TestCase):
    def test_remapea_y_descarta(self):
        # categorías: 1 rim, 2 Basketball, 3 person; 3 imágenes:
        # img1 con rim+Basketball, img2 solo person, img3 con rim
        out = unificar_coco(coco_ejemplo)
        self.assertEqual([c["name"] for c in out["categories"]], ["aro", "balon"])
        self.assertEqual({i["id"] for i in out["images"]}, {1, 3})
        self.assertEqual(resumen(out), {"imagenes": 2, "aro": 2, "balon": 1})

    def test_ids_de_salida(self):
        out = unificar_coco(coco_ejemplo)
        self.assertEqual({c["name"]: c["id"] for c in out["categories"]}, {"aro": 1, "balon": 2})

    def test_falla_si_falta_una_clase(self):
        with self.assertRaises(ErrorDataset) as ctx:
            unificar_coco(coco_solo_aros)
        self.assertIn("balon", str(ctx.exception))
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd training && python -m unittest test_unificar_etiquetas -v`
Expected: FAIL (`ModuleNotFoundError: unificar_etiquetas`)

- [ ] **Step 3: Implement `unificar_coco`, `resumen`, `ErrorDataset`, CLI in `training/unificar_etiquetas.py`**

Solo biblioteca estándar (`json`, `sys`). Reindexar ids de anotación desde 1.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd training && python -m unittest test_unificar_etiquetas -v`
Expected: 3 tests OK

- [ ] **Step 5: Commit**

```bash
git add training/unificar_etiquetas.py training/test_unificar_etiquetas.py
git commit -m "training: unificación de etiquetas a aro/balon"
```

---

### Task 2: Notebook de Colab y README de entrenamiento

**Files:**
- Create: `training/entrenar_hoop_ball.ipynb`
- Create: `training/README.md`

**Interfaces:**
- Consumes: `unificar_coco`, `resumen`, `ErrorDataset` de Task 1.
- Produces: archivos descargables `hoop-ball.tflite` y `labels.txt`, y una celda final que imprime (para Task 6): tipo de entrada, forma de entrada, para cada salida su índice + nombre + forma, y el orden de etiquetas del modelo.

Celdas, en orden (markdown breve en español antes de cada una):

1. **Configuración:** `DATASETS = [{"workspace": ..., "project": ..., "version": ...}]` (rellenar por el usuario), `EPOCAS = 50`, `BATCH = 16`, `LR = 0.3`, `MAX_MB = 5`.
2. **Entorno:** comprobar GPU (`nvidia-smi`; si no hay, imprimir cómo activarla en Colab y detener). `pip install mediapipe-model-maker roboflow`. Obtener `unificar_etiquetas.py`: `git clone https://github.com/Ezy01v1/EzyBall` y, si falla (repo privado), `google.colab.files.upload()` pidiendo ese archivo.
3. **Clave:** `userdata.get("ROBOFLOW_API_KEY")` con fallback a `getpass`.
4. **Descarga:** cada dataset en formato `coco`.
5. **Unificación:** para cada split (`train`, `valid`, `test`) de cada dataset, `unificar_coco`, fusionar datasets (reindexando ids de imagen y anotación), copiar imágenes a `datos/<split>/images/` + `datos/<split>/labels.json` (formato COCO que pide Model Maker). Imprimir `resumen` por split.
6. **Entrenamiento:** `object_detector.ObjectDetector.create` con `SupportedModels.EFFICIENTDET_LITE0`, `HParams(epochs=EPOCAS, batch_size=BATCH, learning_rate=LR, export_dir="export")`.
7. **Evaluación:** `model.evaluate(test_data)`; imprimir mAP general y AP por clase.
8. **Export int8:** `QuantizationConfig.for_int8(representative_data=train_data)`, `model.export_model("hoop-ball.tflite", quantization_config=...)`. Assert tamaño < `MAX_MB`.
9. **Inspección:** `tf.lite.Interpreter` sobre el archivo exportado; imprimir lo descrito en *Produces*; ejecutar una inferencia con una imagen de test y mostrar las cajas dibujadas.
10. **Descarga:** `files.download` de `hoop-ball.tflite` y `labels.txt`.

`training/README.md`: crear cuenta en Roboflow, copiar API key, guardarla como secreto `ROBOFLOW_API_KEY` en Colab, elegir datasets en Roboflow Universe (buscar "basketball hoop ball"; elegir uno con clases de aro y balón y ≥ 1 000 imágenes) y copiar workspace/project/version a la celda 1, Entorno de ejecución → GPU T4, Ejecutar todo, copiar `hoop-ball.tflite` a `assets/models/` y pegar la salida de la celda 9 en la conversación para la Task 6.

- [ ] **Step 1: Escribir `training/entrenar_hoop_ball.ipynb` y `training/README.md`**

- [ ] **Step 2: Validar el notebook**

Run: `python -c "import json; nb=json.load(open('training/entrenar_hoop_ball.ipynb', encoding='utf-8')); print(nb['nbformat'], len(nb['cells']))"`
Expected: `4 <n>` sin excepción, con al menos 10 celdas de código.

- [ ] **Step 3: Comprobar que no hay claves ni outputs en el notebook**

Run: `grep -niE "api_key\s*=\s*['\"][A-Za-z0-9]" training/entrenar_hoop_ball.ipynb; grep -c '"outputs": \[\]' training/entrenar_hoop_ball.ipynb`
Expected: el primer grep sin resultados; el conteo igual al número de celdas de código.

- [ ] **Step 4: Commit**

```bash
git add training/entrenar_hoop_ball.ipynb training/README.md
git commit -m "training: notebook de Colab para hoop-ball.tflite"
```

---

### Task 3: Perfiles de modelo en `hoopDetector` y propagación de `{ aro, balon }`

**Files:**
- Modify: `src/features/tracker/vision/hoopDetector.ts`
- Modify: `src/features/tracker/vision/CameraPreview.tsx`
- Modify: `src/features/tracker/vision/cameraModule.ts`
- Modify: `src/features/tracker/screens/CalibrationScreen.tsx:15,59-70` (solo adaptar a la nueva firma)
- Modify: `src/features/tracker/screens/LiveRecordingScreen.tsx:20,81-95` (solo adaptar)
- Test: `src/features/tracker/vision/__tests__/hoopDetector.test.ts`

**Interfaces:**
- Produces (en `hoopDetector.ts`):

```ts
export interface PerfilModelo {
  nombre: 'hoop-ball' | 'balon-coco';
  inputSize: number;
  claseAro: number | null;
  claseBalon: number;
  scoreMinimo: number;
  /** Posición de cada tensor en la salida de runSync. */
  salidas: { cajas: number; clases: number; scores: number };
}
export const PERFIL_COCO: PerfilModelo; // 'balon-coco', 300, null, 36, 0.3, {cajas:0, clases:1, scores:2}
export const PERFIL_HOOP_BALL: PerfilModelo; // 'hoop-ball', 320, 1, 2, 0.4, {cajas:0, clases:1, scores:2} — provisional, Task 6 lo fija
export interface ModeloEmpaquetado { asset: number; perfil: PerfilModelo }
export function cargarModeloEmpaquetado(): ModeloEmpaquetado | null;
export function perfilActivo(): PerfilModelo | null;
export function detectorDisponible(): boolean;
export function configAuto(perfil: PerfilModelo): ReducerConfig; // { ...DEFAULT_CONFIG, scoreMinimo: perfil.scoreMinimo }
export function prepareInput(frame: Frame, tipo: 'uint8' | 'float32', inputSize: number): ArrayBuffer | null;
export interface Detecciones { aro: Box | null; balon: Box | null }
export function parseOutput(cajas, clases, scores, perfil: PerfilModelo): Detecciones; // worklet
```

- `CONFIG_AUTO`, `MODEL_INPUT_SIZE` y `CLASE_BALON` se eliminan; los llamadores usan `configAuto(perfil)`.
- `cargarModeloEmpaquetado()` en esta task solo conoce COCO (require literal de `balon-coco.tflite` en try/catch). **No** se añade todavía el require de `hoop-ball.tflite`: Metro resuelve los `require` al empaquetar y un archivo inexistente rompe el bundle aunque esté en try/catch. Task 6 lo añade cuando el archivo exista.
- `OnDeteccion` en `CameraPreview.tsx` pasa a `(det: Detecciones, timestamp: number, ancho: number, alto: number) => void`; `cameraModule.ts` igual. `scheduleOnRN` recibe `aro` y `balon` por separado y el callback reconstruye el objeto.
- `CameraPreview` lee las salidas por `perfil.salidas.*` e `inputSize` del perfil.
- Calibración y sesión en vivo: comportamiento idéntico al actual, usando `det.balon` y `configAuto(perfilActivo() ?? PERFIL_COCO)`.

- [ ] **Step 1: Write the failing tests**

```ts
// Helper: cajas(...[ymin,xmin,ymax,xmax]) -> Float32Array plano
describe('parseOutput', () => {
  const hoop: PerfilModelo = { ...PERFIL_HOOP_BALL, claseAro: 1, claseBalon: 2 };

  it('devuelve aro y balón con el perfil de dos clases', () => {
    const r = parseOutput(cajas([0.1,0.4,0.2,0.5],[0.5,0.5,0.55,0.55]), [1,2], [0.9,0.8], hoop);
    expect(r.aro).toEqual({ x: 0.4, y: 0.1, width: expect.closeTo(0.1), height: expect.closeTo(0.1), score: 0.9 });
    expect(r.balon?.score).toBe(0.8);
  });
  it('se queda con el de mayor score por clase', () => {
    const r = parseOutput(cajas(A, B), [1, 1], [0.5, 0.7], hoop);
    expect(r.aro?.score).toBe(0.7);
    expect(r.balon).toBeNull();
  });
  it('tolera clases con ruido de coma flotante', () => {
    expect(parseOutput(cajas(A), [1.0000001], [0.9], hoop).aro).not.toBeNull();
  });
  it('perfil COCO: aro siempre null, solo clase 36', () => {
    const r = parseOutput(cajas(A, B), [36, 0], [0.6, 0.9], PERFIL_COCO);
    expect(r.aro).toBeNull();
    expect(r.balon?.score).toBe(0.6);
  });
  it('sin detecciones devuelve ambos null', () => {
    expect(parseOutput(new Float32Array(0), [], [], hoop)).toEqual({ aro: null, balon: null });
  });
});

describe('configAuto', () => {
  it('toma el scoreMinimo del perfil', () => {
    expect(configAuto(PERFIL_COCO).scoreMinimo).toBe(0.3);
    expect(configAuto({ ...PERFIL_HOOP_BALL, scoreMinimo: 0.45 }).scoreMinimo).toBe(0.45);
  });
});
```

(El orden de salidas se prueba en `CameraPreview` indirectamente; `parseOutput` recibe ya los tres arrays separados.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/features/tracker/vision/__tests__/hoopDetector.test.ts`
Expected: FAIL (`PERFIL_HOOP_BALL` / `configAuto` no exportados)

- [ ] **Step 3: Implementar los cambios de *Interfaces* en `hoopDetector.ts`**

- [ ] **Step 4: Adaptar `CameraPreview.tsx`, `cameraModule.ts`, `CalibrationScreen.tsx`, `LiveRecordingScreen.tsx` a la nueva firma**

- [ ] **Step 5: Run full verification**

Run: `npm test && npm run typecheck && npm run lint`
Expected: todos los tests pasan (incluidos `shotEventReducer` y `geometria`), 0 errores de tipos, 0 errores de lint.

- [ ] **Step 6: Commit**

```bash
git add src/features/tracker
git commit -m "tracker: perfiles de modelo y detección de aro + balón"
```

---

### Task 4: `aroEstable`

**Files:**
- Create: `src/features/tracker/vision/aroEstable.ts`
- Test: `src/features/tracker/vision/__tests__/aroEstable.test.ts`

**Interfaces:**
- Consumes: `Box`, `centerX`, `centerY` de `types.ts`.
- Produces:

```ts
export interface ConfigAroEstable { framesNecesarios: number; toleranciaCentro: number; scoreMinimo: number }
export const CONFIG_ARO_ESTABLE: ConfigAroEstable; // { framesNecesarios: 8, toleranciaCentro: 0.15, scoreMinimo: 0.5 }
export interface EstadoAroEstable { racha: Box[] }
export function crearEstadoAroEstable(): EstadoAroEstable;
export function acumularAro(
  estado: EstadoAroEstable, aro: Box | null, config?: ConfigAroEstable,
): { estado: EstadoAroEstable; estable: Box | null };
```

Reglas: un aro `null` o con `score < scoreMinimo` vacía la racha. Si el centro del aro nuevo está a más de `toleranciaCentro × ancho del primer aro de la racha` del centro de ese primero (en x o y), la racha se reinicia **con el aro nuevo** como primer elemento. Con `racha.length >= framesNecesarios`, `estable` es el promedio componente a componente (x, y, width, height, score) de los últimos `framesNecesarios`. Función pura: no muta `estado`.

- [ ] **Step 1: Write the failing tests**

```ts
const aro = (x = 0.4, y = 0.2, score = 0.9): Box => ({ x, y, width: 0.1, height: 0.09, score });
const alimentar = (cajas: (Box | null)[]) => cajas.reduce(
  (acc, c) => acumularAro(acc.estado, c), { estado: crearEstadoAroEstable(), estable: null as Box | null });

it('no es estable con 7 frames', () => expect(alimentar(Array(7).fill(aro())).estable).toBeNull());
it('es estable con 8 frames', () => expect(alimentar(Array(8).fill(aro())).estable).toMatchObject({ x: 0.4, y: 0.2 }));
it('devuelve el promedio', () => {
  const r = alimentar([...Array(7).fill(aro(0.4)), aro(0.408)]);
  expect(r.estable?.x).toBeCloseTo(0.401);
});
it('se reinicia si el aro desaparece', () =>
  expect(alimentar([...Array(7).fill(aro()), null, aro()]).estable).toBeNull());
it('se reinicia si baja de score', () =>
  expect(alimentar([...Array(7).fill(aro()), aro(0.4, 0.2, 0.3), aro()]).estable).toBeNull());
it('se reinicia si el aro salta a otra canasta', () => {
  // 0.4 -> 0.8: 4 anchos de aro, muy por encima del 15 %
  const r = alimentar([...Array(7).fill(aro(0.4)), ...Array(8).fill(aro(0.8))]);
  expect(r.estable?.x).toBeCloseTo(0.8);
});
it('tolera deriva menor al 15 %', () =>
  expect(alimentar([...Array(4).fill(aro(0.4)), ...Array(4).fill(aro(0.414))]).estable).not.toBeNull());
it('no muta el estado de entrada', () => {
  const e = crearEstadoAroEstable();
  acumularAro(e, aro());
  expect(e.racha).toHaveLength(0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/features/tracker/vision/__tests__/aroEstable.test.ts`
Expected: FAIL (módulo no existe)

- [ ] **Step 3: Implementar `aroEstable.ts` según *Interfaces***

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/features/tracker/vision/__tests__/aroEstable.test.ts`
Expected: 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/tracker/vision/aroEstable.ts src/features/tracker/vision/__tests__/aroEstable.test.ts
git commit -m "tracker: estabilización del aro detectado"
```

---

### Task 5: Calibración que propone y confirma el aro

**Files:**
- Modify: `src/features/tracker/screens/CalibrationScreen.tsx`

**Interfaces:**
- Consumes: `Detecciones`, `perfilActivo` (Task 3); `crearEstadoAroEstable`, `acumularAro` (Task 4); `frameAVista` de `geometria.ts`.
- Produces: el mismo parámetro de navegación que hoy (`aro` en coordenadas de frame); `LiveRecordingScreen` no cambia.

Comportamiento:
- Estado nuevo: `estadoAro` (ref, `EstadoAroEstable`), `aroPropuesto: Box | null`, `aroConfirmado: Box | null`.
- `onDeteccion` alimenta `acumularAro` con `det.aro` mientras no haya `aroConfirmado` ni `toque`; guarda el `estable` en `aroPropuesto` (solo hace `setState` cuando pasa de null a valor o al revés, para no re-renderizar en cada frame).
- **Aro final** = el derivado del toque si `toque != null`; si no, `aroConfirmado`. El toque manual siempre gana.
- Con `aroPropuesto` y sin `toque`: dibujar el anillo propuesto (convertido con `frameAVista` a coordenadas de vista, borde con `colors.primaryContainer`) y un botón **"Confirmar aro"** que fija `aroConfirmado = aroPropuesto`. El texto guía cambia a "Aro detectado. Confírmalo o tócalo para ajustarlo." Mientras no hay propuesta y el perfil tiene `claseAro != null`: "Apunta al aro… o tócalo en la pantalla."
- Tras confirmar, tocar la pantalla vuelve al flujo manual actual (toque + / −).
- Con `perfilActivo()?.claseAro == null` (COCO) la pantalla es idéntica a la actual.

- [ ] **Step 1: Implementar el comportamiento en `CalibrationScreen.tsx`**

- [ ] **Step 2: Run full verification**

Run: `npm test && npm run typecheck && npm run lint`
Expected: todo pasa, 0 errores.

- [ ] **Step 3: Verificación manual con COCO (sin modelo nuevo)**

Ejecutar el dev client en el A56 y abrir Encuadre: la pantalla y el flujo de tocar el aro funcionan igual que antes de esta task; no aparece "Confirmar aro".

- [ ] **Step 4: Commit**

```bash
git add src/features/tracker/screens/CalibrationScreen.tsx
git commit -m "tracker: la calibración propone el aro detectado"
```

---

### Task 6: Activar `hoop-ball.tflite` (requiere que el usuario haya entrenado)

**Gate:** el usuario ejecutó el notebook (Task 2), copió `hoop-ball.tflite` a `assets/models/` y pegó la salida de la celda 9.

**Files:**
- Add: `assets/models/hoop-ball.tflite`
- Modify: `src/features/tracker/vision/hoopDetector.ts` (`PERFIL_HOOP_BALL`, `cargarModeloEmpaquetado`)
- Modify: `assets/models/README.md`

- [ ] **Step 1: Comprobar la salida de la celda 9**

Debe haber 4 salidas (cajas `[1,N,4]`, clases `[1,N]`, scores `[1,N]`, conteo `[1]`). Si el formato es otro (p. ej. salidas crudas sin postprocesado), **parar** y volver a diseño: `parseOutput` no sirve tal cual.

- [ ] **Step 2: Fijar `PERFIL_HOOP_BALL`** con los índices de `salidas`, `claseAro`, `claseBalon` e `inputSize` que imprimió la celda 9.

- [ ] **Step 3: Añadir el require de `hoop-ball.tflite`** en `cargarModeloEmpaquetado()`, antes del de COCO, devolviendo `PERFIL_HOOP_BALL`.

- [ ] **Step 4: Actualizar `assets/models/README.md`**: `hoop-ball.tflite` en uso (camino B), origen (datasets usados, mAP por clase del notebook), `balon-coco.tflite` como respaldo.

- [ ] **Step 5: Run full verification**

Run: `npm test && npm run typecheck && npm run lint`
Expected: todo pasa.

- [ ] **Step 6: Commit**

```bash
git add assets/models src/features/tracker/vision/hoopDetector.ts
git commit -m "tracker: activar el modelo propio hoop-ball"
```

---

### Task 7: Prueba en cancha (manual, usuario)

- [ ] **Step 1:** Recompilar el dev client (`npm run build:dev`) e instalarlo en el A56.
- [ ] **Step 2:** En una cancha interior y una exterior: la calibración propone el aro sin tocar la pantalla.
- [ ] **Step 3:** 20 tiros mezclando canastas y fallos, anotando a mano el resultado real. Éxito: ≥ 18 contados bien.
- [ ] **Step 4:** Si < 18: anotar en qué falla (pierde el balón, cuenta rebotes, aro mal colocado) y volver a diseño (afinar con datos propios o plan B).
