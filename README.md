# EzyBall

App móvil de entrenamiento de baloncesto (iOS + Android) con dos módulos conectados:

1. **Biblioteca de tips** — contenido educativo por área del juego, nivel y zona de la cancha. Offline-first.
2. **Shot Tracker** — grabas tu serie apuntando el teléfono al aro y al terminar obtienes % de acierto, zona caliente y zonas a mejorar.

El diferenciador es el puente entre ambos: si fallas desde la esquina derecha, la app te recomienda automáticamente los tips y drills etiquetados para esa zona, y te dice por qué.

---

## Estado

| Fase | Estado |
|---|---|
| 0 · Arquitectura | ✅ [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) |
| 1 · Biblioteca | ✅ Categorías, subcategorías, niveles, búsqueda, favoritos, sync incremental |
| 2 · Tracker MVP | ✅ UI y bucle completo · ⏳ modelo de visión pendiente → **funciona en modo manual** |
| 3 · Conexión entre módulos | ✅ Motor de recomendaciones en Home y resumen de sesión |
| 4 · Zona automática, forma de tiro | ⬜ Pendiente |

**Sobre la Fase 2:** el modelo TFLite de detección aro/balón todavía no existe (hay que entrenarlo y exportarlo). Toda la arquitectura está montada y testeada alrededor de él —cámara, calibración, máquina de estados, sesión, resumen—, y mientras tanto los tiros se marcan con dos botones grandes. Eso ya permite validar el producto con usuarios reales, que es el objetivo del MVP. Detalle en [docs/ARQUITECTURA.md § 5](docs/ARQUITECTURA.md).

---

## Puesta en marcha

👉 **[docs/PUESTA-EN-MARCHA.md](docs/PUESTA-EN-MARCHA.md) — guía paso a paso de todo lo que hay que hacer a mano.**

Lo mínimo para verla funcionando en tu teléfono (Bloque A de esa guía):

```bash
npm install
npx eas-cli login          # crea antes tu cuenta gratis en expo.dev
npx eas-cli init           # vincula el proyecto y escribe el projectId
npm run build:dev          # compila el dev client (~15-25 min de espera)
```

Cuando termine, instala el `.apk` que te da en el Android y arranca el servidor:

```bash
npm start
```

Expo Go **no sirve**: la cámara y el modelo son módulos nativos y necesitan un dev client propio.

Firebase es **opcional**. Sin configurarlo la app funciona igual, con los tips empaquetados y el historial guardado en el teléfono (Bloque B de la guía).

---

## Comandos

```bash
npm start                      # servidor de desarrollo (dev client)
npm run build:dev              # build del dev client con EAS (Android)
npm run typecheck              # TypeScript en modo estricto
npm test                       # tests de la lógica pura
npm run seed:firestore -- --dry-run   # comprueba el contenido sin subirlo
npm run seed:firestore         # sube la biblioteca a Firestore
```

---

## Estructura

```
src/
├─ theme/          design system "Pro-Level Velocity" (de Stitch)
├─ types/          Tip, TrainingSession, CourtZone
├─ components/     UI compartida
├─ navigation/     stack raíz + tabs
├─ services/       Firebase, AsyncStorage
└─ features/
   ├─ auth/  home/  library/  tracker/  recommendations/  profile/
docs/
├─ PUESTA-EN-MARCHA.md  qué tienes que hacer tú, paso a paso
├─ ARQUITECTURA.md   decisiones técnicas y por qué
├─ CONTENIDO.md      cómo escribir y publicar tips
├─ PRIVACIDAD.md     qué se procesa y dónde
└─ design/           export original de Stitch (referencia visual)
```

---

## Diseño

El design system sale del export de Stitch, en [`docs/design/DESIGN.md`](docs/design/DESIGN.md), y está traducido a tokens en `src/theme/`. Fondo `#131313`, acento `#FF6B00`, tipografías Anybody / Manrope / JetBrains Mono.

Los HTML originales de cada pantalla están en `docs/design/` como referencia. **No se copian a la app**: sirven de fuente de verdad para colores, jerarquía y layout, que se reimplementan con componentes nativos.

Las pantallas que Stitch no cubría (calibración, grabación en vivo, privacidad) siguen la misma paleta y el mismo lenguaje visual.

---

## Privacidad

El video **no se graba ni se sube**. Los fotogramas se analizan en el teléfono y se descartan. A Firestore solo suben eventos derivados: zona, resultado, timestamp y resumen. Ver [docs/PRIVACIDAD.md](docs/PRIVACIDAD.md).
