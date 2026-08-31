# Privacidad — EzyBall

Documento técnico. La versión para el usuario está en la app (`PrivacyScreen`) y resumida en el onboarding, **antes** del diálogo de permiso de cámara.

---

## Qué se procesa y dónde

| Dato | Dónde se procesa | Dónde se guarda |
|---|---|---|
| Fotogramas de la cámara | En el teléfono, en memoria | **En ningún sitio.** Se analizan y se descartan |
| Resultado del tiro (canasta/fallo) | Teléfono | AsyncStorage + Firestore |
| Zona de cancha | Teléfono | AsyncStorage + Firestore |
| Timestamp del tiro | Teléfono | AsyncStorage + Firestore (relativo al inicio de la sesión, no absoluto) |
| Resumen agregado | Teléfono | AsyncStorage + Firestore |
| Nombre y nivel | Teléfono | Solo AsyncStorage |
| Favoritos | Teléfono | Solo AsyncStorage |

**El video nunca sale del teléfono ni se escribe a disco.**

## Cómo se garantiza

- En VisionCamera 5 los outputs de la cámara son explícitos. `CameraPreview` monta `<Camera>` **sin ningún `outputs`**, así que la única salida es el preview en pantalla: no hay output de video, foto ni audio, y por tanto no existe ruta de código que produzca un fichero.
- El frame output de Fase 2 tampoco graba: entrega fotogramas en memoria que se descartan (`frame.dispose()`) en cuanto se analizan.
- `android.blockedPermissions` en `app.json` bloquea `RECORD_AUDIO`, `READ_MEDIA_IMAGES` y `READ_MEDIA_VIDEO`: la app no puede pedirlos aunque una dependencia los declare.
- Los frame processors devuelven dos cajas de coordenadas normalizadas. Nada más cruza del worklet al hilo de JS.
- `sessionRepository` solo serializa el tipo `TrainingSession`, que no tiene campos de imagen.

## Datos personales

- Autenticación **anónima**: no se pide email, teléfono ni nombre real para usar la app. El campo "nombre" del perfil es una etiqueta local que el usuario elige y que no se sube.
- No se recogen identificadores de publicidad, contactos, ubicación ni analítica de terceros.
- El `uid` de Firebase es un identificador opaco generado por Firebase, sin relación con la identidad del usuario.

## Sin conexión

La app funciona entera sin red. La sincronización con Firestore es un extra para tener el historial en varios dispositivos, no un requisito de funcionamiento.

## Borrado

- Desinstalar la app elimina todo lo local.
- Para lo sincronizado en Firestore hace falta un canal de contacto. **Pendiente antes de publicar en tiendas**: dirección de contacto en la ficha y un flujo de borrado de cuenta dentro de la app (Apple lo exige para apps con creación de cuenta; conviene tenerlo aunque la cuenta sea anónima).

## Pendiente antes de publicar

- [ ] Política de privacidad publicada en una URL, enlazada desde la ficha de la tienda y desde `PrivacyScreen`.
- [ ] Flujo de borrado de cuenta y datos dentro de la app.
- [ ] Cuestionario de privacidad de App Store y sección de seguridad de datos de Google Play. Declarar: cámara usada solo en el dispositivo, sin recogida de datos de imagen.
- [ ] Revisar si el público objetivo incluye menores de 13/16 años — cambia los requisitos (COPPA / GDPR-K) de forma sustancial.
