# Puesta en marcha — lo que tienes que hacer tú

Guía de tareas **manuales**. Todo lo que no está aquí ya está hecho en el código.

Cada bloque es independiente. El **Bloque A es el único obligatorio** para ver la app funcionando en tu teléfono.

---

## Bloque A · Ver la app en tu teléfono

Los módulos de cámara son nativos, así que **Expo Go no sirve**: hay que compilar una vez tu propia "app contenedora" (el *dev client*). Después de eso, el día a día ya es solo `npm start`.

### A1. Crear cuenta de Expo — 2 min

Entra en <https://expo.dev/signup>. Es gratis. Apunta el usuario y la contraseña.

### A2. Iniciar sesión desde el terminal — 1 min

```bash
npx eas-cli login
```

Te pedirá el usuario y la contraseña del paso anterior.

> Si escribes `npx eas login` te dará *"could not determine executable to run"*. El paquete se llama `eas-cli` aunque el comando sea `eas`. Escribe siempre `npx eas-cli`.

### A3. Vincular el proyecto — 1 min

```bash
npx eas-cli init
```

Te pregunta si quieres crear el proyecto en tu cuenta → **sí**. Esto escribe un `extra.eas.projectId` en `app.json` automáticamente. **No lo edites tú a mano.**

### A4. Compilar el dev client — 15-25 min de espera

```bash
npm run build:dev
```

Tarda porque compila en los servidores de Expo y la cola gratuita va lenta. Puedes cerrar el terminal: el progreso se ve en <https://expo.dev> → tu proyecto → Builds.

Cuando termine te da un enlace de descarga y un QR.

### A5. Instalar el APK en el Android — 5 min

1. Abre el enlace del build **desde el propio teléfono** (o escanea el QR).
2. Descarga el `.apk`.
3. Android te dirá *"Por seguridad, tu teléfono no puede instalar apps de esta fuente"* → **Configuración** → activa **Permitir de esta fuente** → **Instalar**.

Esta app se llama EzyBall y ya lleva la cámara dentro. Solo hay que instalarla una vez; solo tendrás que repetir el build si añades una librería nativa nueva.

### A6. Arrancar y conectar — 1 min

En el PC:

```bash
npm start
```

Sale un QR. Ábrelo con la app EzyBall que acabas de instalar (el teléfono y el PC tienen que estar **en el mismo WiFi**).

A partir de aquí, cada vez que guardes un archivo la app se recarga sola.

### ⚠️ Sobre iOS

El bloque A es para Android. Para instalarlo en un iPhone real hace falta una **cuenta de Apple Developer, 99 USD/año**, sin excepción — Apple no permite instalar en un dispositivo físico sin ella.

**Recomendación:** valida el MVP solo en Android. Si no tienes Android a mano, el simulador de iOS sí funciona gratis, pero necesitas un Mac con Xcode y **no tiene cámara real**, así que el tracker no se puede probar de verdad ahí.

---

## Bloque B · Firebase (opcional)

**Puedes saltarte esto entero de momento.** Sin Firebase la app funciona igual: la biblioteca usa los 16 tips que van dentro de la app y las sesiones se guardan en el teléfono.

Hazlo cuando quieras (a) editar tips sin republicar la app, o (b) que el historial se sincronice entre dispositivos.

### B1. Crear el proyecto — 5 min

<https://console.firebase.google.com> → **Crear un proyecto**. Puedes desactivar Google Analytics, no lo usamos.

### B2. Registrar la app — 3 min

Dentro del proyecto → icono **`</>` (Web)**.

> **Importante:** elige **Web**, NO Android ni iOS. Usamos el SDK de JavaScript, así que la app de tipo Web es la correcta aunque esto sea una app móvil. Es el error más habitual en este paso.

Te muestra un bloque `firebaseConfig` con seis valores.

### B3. Rellenar el `.env` — 3 min

En la carpeta del proyecto:

```bash
cp .env.example .env
```

Abre `.env` y pega cada valor del paso anterior:

| Del `firebaseConfig` | Va en |
|---|---|
| `apiKey` | `EXPO_PUBLIC_FIREBASE_API_KEY` |
| `authDomain` | `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `EXPO_PUBLIC_FIREBASE_PROJECT_ID` |
| `storageBucket` | `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `EXPO_PUBLIC_FIREBASE_APP_ID` |

Sin comillas, sin espacios alrededor del `=`. Después reinicia `npm start`.

`.env` está en `.gitignore`, así que no se sube a git.

### B4. Activar login anónimo — 1 min

Firebase Console → **Authentication** → **Comenzar** → pestaña **Sign-in method** → **Anónimo** → activar.

Si te saltas esto, la app seguirá funcionando pero en modo local: nada se sincroniza.

### B5. Crear Firestore — 2 min

Firebase Console → **Firestore Database** → **Crear base de datos** → **modo de producción** → elige la región más cercana.

Modo producción bloquea todo por defecto; las reglas correctas las pones en el paso siguiente.

### B6. Publicar las reglas de seguridad — 3 min

Lo más fácil, sin instalar nada: Firestore → pestaña **Reglas** → borra lo que haya, pega el contenido completo del archivo [`firestore.rules`](../firestore.rules) del proyecto → **Publicar**.

> Sin este paso la app no podrá leer ni escribir nada y verás errores de permisos.

### B7. Subir los tips a Firestore — 10 min

Solo si quieres poder editar el contenido desde Firebase sin republicar la app.

1. Firebase Console → ⚙️ **Configuración del proyecto** → **Cuentas de servicio** → **Generar nueva clave privada**. Descarga el `.json`.
2. **Guárdalo FUERA de la carpeta del proyecto** (por ejemplo en `C:\Users\Ezy01v1\claves\`). Esa clave da acceso total a tu base de datos; si acaba en git, se acabó.
3. En PowerShell:

```powershell
npm install --no-save firebase-admin
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\Ezy01v1\claves\serviceAccount.json"
$env:FIREBASE_PROJECT_ID="el-id-de-tu-proyecto"
npm run seed:firestore -- --dry-run
```

El `--dry-run` no escribe nada, solo comprueba. Si el resumen se ve bien, repite sin él:

```powershell
npm run seed:firestore
```

---

## Bloque C · Contenido (tu trabajo, no del código)

Esto no es programación, es criterio de baloncesto. Las reglas completas están en [CONTENIDO.md](./CONTENIDO.md).

- [ ] **Revisar los 16 tips** que escribí en `src/features/library/data/seedTips.ts`. Los redacté como fundamentos genéricos y correctos, pero **no soy entrenador**: repásalos por precisión técnica antes de enseñárselos a nadie. Un consejo mal explicado crea un vicio difícil de corregir.
- [ ] **Generar las ilustraciones.** Ahora mismo ningún tip tiene imagen y la app muestra un recuadro con el icono de la categoría. Cuando las tengas, súbelas a un hosting y pon la URL en el campo `imagenUrl` de cada tip.
  - Solo siluetas y diagramas. **Nunca jugadores reales identificables** (es la regla que te protege legalmente).
- [ ] **Etiquetar bien las `zonas`** de cada tip nuevo. Es lo que hace funcionar las recomendaciones automáticas: un tip sin zonas no se le recomendará nunca a nadie.

---

## Bloque D · El modelo de visión (Fase 2)

Es la parte grande que queda. Hoy el tracker funciona en **modo manual** (dos botones de canasta/fallo), y eso ya te permite validar el producto con gente real.

Detalle técnico en [`assets/models/README.md`](../assets/models/README.md). En resumen:

- [ ] **Grabar dataset** con tu montaje real (palo selfie con patitas), en cancha cubierta y al aire libre, a distintas horas.
- [ ] **Etiquetar** las cajas en dos clases: aro y balón.
- [ ] **Entrenar y exportar** a TFLite (entrada 320×320).
- [ ] Dejar el archivo en `assets/models/hoop-ball.tflite` y rellenar `prepareInput()` en `hoopDetector.ts`.

En cuanto ese archivo exista, la app lo detecta sola y pasa a modo automático. No hay que tocar nada más.

**Consejo:** no empieces por aquí. Valida antes con 10 usuarios en modo manual que el bucle "mido → veo mis zonas flojas → me recomienda tips" les aporta algo. Si no les aporta, el modelo no lo va a arreglar.

---

## Bloque E · Antes de publicar en las tiendas

No hace falta para probar. Es la lista para el día que publiques.

- [ ] **Icono y splash.** Quité las referencias de `app.json` porque los archivos no existían y rompían el build. Cuando tengas los PNG, hay que volver a añadirlas.
- [ ] **Política de privacidad en una URL pública.** Apple y Google la exigen. El contenido ya está redactado en [PRIVACIDAD.md](./PRIVACIDAD.md), solo hay que publicarlo en una web.
- [ ] **Flujo de borrado de cuenta dentro de la app.** Apple lo exige.
- [ ] **Cuestionarios de privacidad** de App Store y Google Play. Declarar: cámara usada solo en el dispositivo, sin recogida de datos de imagen.
- [ ] **Decidir si el público incluye menores de 13/16 años.** Cambia bastante los requisitos legales (COPPA / RGPD). Si el target son chavales de club, esto no es un detalle.

---

## Resumen rápido

| Quiero... | Tengo que hacer | Tiempo |
|---|---|---|
| Ver la app en mi móvil | Bloque A completo | ~45 min (25 de espera) |
| Editar tips sin republicar | Bloque B | ~25 min |
| Contenido de verdad | Bloque C | continuo |
| Detección automática de tiros | Bloque D | semanas |
| Publicar en tiendas | Bloque E | — |
