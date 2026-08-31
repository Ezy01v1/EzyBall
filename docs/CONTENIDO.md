# Guía de contenido — Biblioteca de tips

Reglas para escribir, ilustrar y publicar tips. Aplican a todo lo que entra en `seedTips.ts` y a todo lo que se sube a la colección `tips` de Firestore.

---

## 1. Redacción

**Todo el texto es original.** Las fuentes externas (foros, artículos, entrevistas, vídeos de entrenadores) se usan como investigación, nunca como banco de texto. Si al escribir un párrafo estás mirando la fuente, ciérrala, escribe de memoria y luego comprueba que el dato técnico es correcto.

- `fuenteReferencia` es **atribución conceptual**, no una cita. Correcto: `"Principios generales de biomecánica del tiro en baloncesto formativo."` Incorrecto: pegar una frase entrecomillada de un artículo.
- Nunca reproducir texto literal de una fuente, ni siquiera "adaptado" cambiando cuatro palabras.
- Sin nombres de jugadores profesionales reales asociados a técnicas concretas. Un tip es un fundamento, no una biografía.

## 2. Estilo

Escribe como un entrenador explicando en la cancha, no como un manual:

- **Frases cortas.** El usuario lee esto entre series, sudando.
- **Explica el porqué antes del cómo.** "Bajar el bote reduce el tiempo de reacción del defensor" antes de "bota a la altura de la rodilla".
- **Da un indicador comprobable.** "Si necesitas girar el balón en las manos después de recibirlo, la preparación llegó tarde." El usuario tiene que poder saber solo si lo está haciendo bien.
- Sin superlativos ni promesas ("el secreto de los profesionales", "mejora un 40% en una semana").
- Tuteo, español neutro.

**Longitud objetivo**

| Campo | Extensión |
|---|---|
| `resumen` | Una línea, máx. ~80 caracteres |
| `texto` | 1–3 párrafos de 2–4 frases |
| `pasos[].detalle` | 1–2 frases |

## 3. Ilustraciones

- **Genéricas siempre**: siluetas, diagramas de cancha, esquemas de trayectoria.
- **Nunca representaciones de jugadores reales identificables**, ni fotos reales de personas, ni imágenes generadas que imiten a un jugador concreto.
- Si un tip no tiene ilustración, se deja `imagenUrl` sin definir. La app dibuja un bloque de marca con el glifo de la categoría; es preferible a rellenar con una foto cualquiera.
- Las ilustraciones definitivas se suben a Firebase Storage o a un CDN y se referencian por URL absoluta.

## 4. Etiquetado

| Campo | Regla |
|---|---|
| `categoria` | Una de las nueve del enum. Sin categorías nuevas sin decidirlo antes |
| `subcategoria` | Texto libre, pero **reutiliza las existentes** antes de inventar una: cada subcategoría nueva crea un chip nuevo en la UI |
| `nivel` | Dónde aporta más, no dónde "también sirve" |
| `formato` | `tip_rapido` (sin pasos), `drill` (con pasos), `concepto` (explicativo) |
| `zonas` | **Lo más importante para el producto** |

### Sobre `zonas`

Es lo que alimenta las recomendaciones automáticas. Dos errores a evitar:

- **Etiquetar de menos** — un tip de mecánica de tiro sin zonas nunca se recomendará a nadie que falle desde ningún sitio.
- **Etiquetar de más** — poner las ocho zonas en todo hace que las recomendaciones dejen de ser específicas y se conviertan en ruido.

Criterio: incluye una zona si el tip cambia algo concreto de cómo se tira **desde ahí**. Un tip sobre el triple de esquina lleva `left_corner` y `right_corner`, no `paint`. Un tip de mentalidad no lleva ninguna.

Cada zona debería tener al menos dos tips etiquetados; si no, las recomendaciones para esa zona caen en el relleno genérico.

## 5. Revisión antes de publicar

Ningún tip se publica sin pasar los dos filtros:

1. **Precisión técnica** — lo revisa alguien con criterio de baloncesto. Un consejo mal explicado en un fundamento puede crear un vicio difícil de corregir.
2. **Cumplimiento de esta guía** — originalidad, estilo, ilustración e etiquetado.

Se registra en `autorRevisor` y se marca `publicado: true`. El script `seed-firestore.mjs` **rechaza el lote entero** si algún tip no tiene `autorRevisor`.

## 6. Publicar

```bash
npm run seed:firestore -- --dry-run
```

```bash
npm run seed:firestore
```

Idempotente: el id del tip es el id del documento, así que reejecutar actualiza en vez de duplicar. Los clientes lo reciben en su siguiente sincronización, sin republicar la app.

Al editar un tip ya publicado, sube `actualizadoEn` — es el cursor de sincronización incremental. Si no cambia, los clientes no verán la edición.
