# EzyBall — Arquitectura (Fase 0)

Propuesta de arquitectura sobre las decisiones ya confirmadas (React Native + Expo, Firebase Spark, diseños de Stitch). Documento vivo: si una decisión cambia, se actualiza aquí.

---

## 1. Stack

| Capa | Elección | Por qué |
|---|---|---|
| Runtime | Expo SDK 57 · React Native 0.86 · React 19.2 | Un código base para iOS y Android; TypeScript, que ya dominas |
| Build | **Dev client** (`expo-dev-client`) + EAS | VisionCamera y TFLite son módulos nativos: Expo Go no basta |
| Navegación | React Navigation v7 (native-stack + bottom-tabs) | Navegación explícita y tipada; las pantallas de cámara necesitan control fino del gesto de "atrás" |
| Estado | Zustand + hooks locales | El estado global real es pequeño (sesión en curso, favoritos). Redux sería sobreingeniería |
| Backend | Firebase Auth (anónimo) + Firestore | Plan Spark, $0. Contenido actualizable sin republicar la app |
| Cámara | `react-native-vision-camera` v5 | Único camino serio a frame processors en RN |
| Inferencia | `react-native-fast-tflite` | On-device, sin coste de servidor y sin subir video |
| Gráficos | `react-native-svg` | Cancha, heatmap y línea de evolución sin librería de charts |

**No usamos** una librería de charts, `expo-router` ni una capa de query remota: en un MVP con estos volúmenes, cada una añadiría dependencia sin resolver un problema real.

---

## 2. Estructura de carpetas

```
src/
├─ theme/          tokens del design system (colores, tipografía, espaciado)
├─ types/          modelos de dominio (Tip, TrainingSession, CourtZone)
├─ components/     UI compartida y agnóstica de feature
├─ navigation/     navegadores y tipos de rutas
├─ services/       Firebase y almacenamiento local
└─ features/
   ├─ auth/            sesión y perfil
   ├─ home/            portada
   ├─ library/         MÓDULO 1 — biblioteca de tips
   │  ├─ data/           seed + repositorio offline-first
   │  ├─ hooks/          useTips, useFavorites
   │  └─ screens/
   ├─ tracker/         MÓDULO 2 — shot tracker
   │  ├─ vision/         cámara, detector y máquina de estados
   │  ├─ logic/          cálculo de resúmenes (puro, testeado)
   │  ├─ data/           repositorio de sesiones
   │  ├─ store/          sesión en curso
   │  └─ screens/
   ├─ recommendations/ EL PUENTE entre los dos módulos
   └─ profile/
```

Regla: `components/` y `theme/` no importan nada de `features/`. Las features solo se importan entre sí a través de módulos explícitos (`recommendations` sí conoce a los dos, ese es su trabajo).

---

## 3. Modelo de datos

### `CourtZone` — el pegamento

Ocho zonas (`left_corner`, `right_corner`, `left_wing`, `right_wing`, `top_key`, `mid_range`, `free_throw`, `paint`). Es el vocabulario compartido: el tracker produce estadísticas por zona, los tips se etiquetan por zona, y el motor de recomendaciones cruza las dos cosas. Sin este enum común no hay diferenciador.

### Firestore

```
tips/{tipId}                      → contenido publicado, lectura pública
usuarios/{uid}
  └─ sesiones/{sesionId}          → eventos derivados, nunca video
```

Reglas en [`firestore.rules`](../firestore.rules). Las claves del cliente son públicas por diseño; la seguridad vive en las reglas.

---

## 4. Offline-first

### Biblioteca

Tres niveles, en este orden:

1. **Contenido semilla empaquetado** (`seedTips.ts`) — la app funciona en la primera apertura, sin red y sin Firebase configurado.
2. **Cache en AsyncStorage** — lo último sincronizado.
3. **Firestore** — sincronización incremental por cursor `actualizadoEn`, en segundo plano.

`getTips()` nunca espera a la red. La sync corre en paralelo y re-renderiza solo si trajo algo nuevo.

> Nota: la persistencia offline del SDK web de Firebase depende de IndexedDB, que no existe en React Native. Por eso el cache es propio (AsyncStorage) y Firestore usa `memoryLocalCache()`.

### Sesiones

Se guardan primero en local y se suben después (`syncPendingSessions`). Es idempotente: el id local es el id del documento, así que reintentar no duplica. El usuario nunca espera por la red al terminar de entrenar.

---

## 5. Módulo 2 — pipeline de visión

```
Cámara (VisionCamera)
   ↓ frame output (worklet, 30 fps de captura, 1 de cada 2 frames)
prepareInput()  →  modelo TFLite  →  parseOutput()
   ↓ dos cajas normalizadas por frame
─────────── cruce al hilo de JS ───────────
reduceFrame()  →  máquina de estados  →  ShotEvent { canasta | fallo }
   ↓
sessionStore  →  sessionRepository  →  computeSessionSummary()
```

Tres decisiones que conviene defender:

1. **La interpretación no vive en el worklet.** El worklet solo detecta y envía dos cajas; decidir "esto fue canasta" es lógica de negocio y vive en JS, donde se puede testear con trayectorias sintéticas sin cámara ni modelo. Ver `shotEventReducer.test.ts`.
2. **30 fps de captura y `FRAME_SKIP = 2`.** ~15 fps analizados: suficiente para seguir un balón, y bastante más barato en batería y calor que analizarlo todo a 60.
3. **El modo manual no es un plan B temporal.** Los botones de canasta/fallo están siempre presentes, incluso con el detector activo. Un detector se equivoca; sin corrección a mano el usuario pierde la confianza en el dato y con ella todo el valor del módulo.

### Estado actual del detector

El modelo TFLite **todavía no existe**. `detectorDisponible()` devuelve `false`, y la app cae en modo manual: el bucle completo (zona → sesión → resumen → recomendaciones) ya es usable y validable con usuarios reales hoy.

Lo que falta para Fase 2 está aislado en dos funciones de `hoopDetector.ts`:

- `prepareInput()` — recorte + resize + normalización del frame.
- `parseOutput()` — ya escrita para el formato habitual de detección; ajustar al exportar el modelo.

**Cómo se cablea** (VisionCamera 5 rehízo la API sobre Nitro; ya no hay `useFrameProcessor` ni `format`):

1. `npx expo install react-native-vision-camera-worklets` — lo requiere `useFrameOutput`. No está instalado todavía para no meter un módulo nativo sin uso en el dev client.
2. `useFrameOutput({ targetResolution, onFrame })` y pasar el output a `<Camera outputs={[...]}>`. El `onFrame` es un worklet y **debe** llamar a `frame.dispose()` o el pipeline se estanca.
3. `targetResolution` hace el downscale dentro del propio pipeline de cámara, así que no hace falta ningún plugin de resize externo. Lo que queda en `prepareInput()` es el recorte cuadrado y la normalización a tensor.

El paso a paso concreto está en el bloque de comentarios de `hoopDetector.ts`.

### Configuración nativa

VisionCamera 5 **ya no publica config plugin de Expo** (no hay `app.plugin.js`): se autolinkea a través de Nitro. Los permisos se declaran a mano en `app.json`:

- iOS → `ios.infoPlist.NSCameraUsageDescription`
- Android → `android.permissions: ["android.permission.CAMERA"]`
- Y `android.blockedPermissions` bloquea micrófono y acceso a la galería, que ninguna parte de la app necesita.

`react-native-fast-tflite` sí trae plugin, y está en `plugins` con los delegados de CoreML y GPU activados.

`eas-cli` **no** es dependencia del proyecto: `expo-doctor` lo marca como error y Expo pide instalarlo en global o invocarlo con `npx`. Ojo con el nombre: el paquete es `eas-cli` y el binario `eas`, así que `npx eas` no resuelve nada — hay que escribir `npx eas-cli build ...` (o `npm run build:dev`, que ya lo hace).

`npx expo-doctor` pasa los 21 checks; `npx tsc --noEmit` está limpio y los 23 tests de lógica pasan.

### Calibración

Existe porque el teléfono va sobre un palo selfie con patitas, no sobre un trípode: la posición cambia entre sesiones y entre canchas. `validarEncuadre()` comprueba tamaño y posición del aro antes de habilitar la grabación, para que el usuario no descubra el problema al final con la sesión perdida.

---

## 6. El puente entre módulos

`features/recommendations/engine.ts`. Función pura:

```
recommendTips(resumen, tips, { nivel, favoritos, limite }) → Recommendation[]
```

Puntúa cada tip por: severidad de la zona débil (peso dominante), categoría tiro, coincidencia de nivel, formato accionable (drill), penalización si ya es favorito.

Dos reglas de producto codificadas:

- **Muestra mínima de 5 tiros por zona.** Un 0/2 no significa que falles desde ahí; recomendar contenido por eso destruye la confianza. La app cumple su propio consejo (ver el tip "Entrenar con datos sin obsesionarse").
- **Toda recomendación muestra su motivo** ("32% desde la esquina derecha (2/12)"). Una recomendación sin motivo visible se siente aleatoria.

Las recomendaciones del Home usan el **agregado de las últimas 10 sesiones**, no solo la última: una mala tarde no debería reescribir el plan de entrenamiento. Las del resumen de sesión sí usan esa sesión concreta, que es lo que el usuario acaba de vivir.

---

## 7. Privacidad

- El video no se graba a fichero ni se sube. En VisionCamera 5 los outputs son explícitos: `<Camera>` sin `outputs` solo alimenta el preview, así que no existe output de video, foto ni audio.
- A Firestore solo suben eventos derivados: zona, resultado, timestamp relativo, resumen.
- El permiso de micrófono está bloqueado explícitamente en `app.json`.
- Se explica en el onboarding (antes del diálogo del sistema) y en una pantalla dedicada.

Ver [PRIVACIDAD.md](./PRIVACIDAD.md).

---

## 8. Rendimiento

| Objetivo | Cómo |
|---|---|
| Arranque < 3 s | Sin llamadas de red bloqueantes; la biblioteca sale del cache local |
| Batería en sesión | `constraints={[{ fps: 30 }]}`, `FRAME_SKIP`, sin grabación a disco, sin micrófono |
| Sin bloqueos de UI | Sync y subidas siempre fire-and-forget |
| Pantalla activa | `useKeepAwake()` solo durante la grabación |

---

## 9. Roadmap

- **Fase 1 — Biblioteca.** ✅ Navegación por categoría/subcategoría/nivel, búsqueda, favoritos, offline-first.
- **Fase 2 — Tracker MVP.** ✅ UI, calibración, zona manual, sesión, resumen, historial. ⏳ Falta el modelo TFLite; hoy funciona en modo manual.
- **Fase 3 — Conexión entre módulos.** ✅ Motor de recomendaciones cableado en Home y resumen de sesión.
- **Fase 4 — Detección automática de zona, análisis de forma de tiro, gamificación.** Pendiente.
