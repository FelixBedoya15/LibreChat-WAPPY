# Bitácora Permanente de Auditoría, Causa Raíz y Lecciones Aprendidas: Tenshi Voice & Orquestación de Agentes

> **Propósito:** Este documento es la memoria histórica y técnica obligatoria de fallos, causas raíz y soluciones arquitectónicas para la interacción por voz (Tenshi), la apertura y continuidad de chats, el despacho de mensajes en el frontend y la integración con Google Gemini Live API.
> **Regla de Oro:** Ningún agente de codificación o desarrollador debe modificar los módulos de voz o despacho sin revisar previamente este documento para evitar regresiones o ciclos repetitivos.

---

## 1. Catálogo de Errores Críticos y Soluciones Arquitectónicas

### Error 1: Apertura compulsiva de un nuevo chat en cada turno
- **Síntoma:** El usuario conversaba con un especialista o con Tenshi, y en cada pregunta subsecuente Tenshi abría una conversación nueva (`/c/new`), fragmentando el hilo, perdiendo el contexto previo y obligando al usuario a repetir la información.
- **Causa Raíz:** En `useVoiceAgentDispatcher.ts`, la variable `isSameAgent` se evaluaba únicamente contra `conversation?.agent_id`. Si la URL estaba en `/c/new?...` o el estado del chat aún no había sincronizado el objeto `conversation`, `isSameAgent` resultaba `false`, forzando `shouldCreateNew = true`.
- **Regla y Solución Obligatoria:**
  1. **Detección en cascada del agente actual:**
     ```typescript
     const currentAgentId =
       conversation?.agent_id ||
       new URLSearchParams(window.location.search).get('agent_id') ||
       activeScreenAgentRef.current?.id ||
       document.querySelector('[data-agent-id]')?.getAttribute('data-agent-id');
     ```
  2. **Continuidad por defecto:** Si el usuario no pide explícitamente *"abrir nuevo chat"*, *"otro chat"* o *"empezar de cero"*, y se dirige al mismo especialista, **SE DEBE MANTENER EL CHAT ACTUAL** disparando el evento de envío local `tenshi-submit-agent-prompt`.
  3. **Solo abrir nuevo chat cuando:**
     - El usuario solicita explícitamente cambiar de agente (ej: *"pásame al abogado laboral"*).
     - El usuario pide explícitamente *"abre un nuevo chat"* o *"desde cero"*.

---

### Error 2: El segundo mensaje nunca se envía (Texto pegado en textarea sin enviar)
- **Síntoma:** Tenshi notificaba que ya le había pasado la consulta al especialista, pero en la pantalla el mensaje quedaba pegado en el textarea sin enviarse, o se abría un chat vacío sin enviar nada.
- **Causa Raíz:**
  1. Dependencia exclusiva de funciones asíncronas de Recoil (`submitMessage`) que fallaban silenciosamente si el estado de la conversación estaba cargando o el endpoint no estaba listo.
  2. Condición de carrera donde la URL se limpiaba antes de que el formulario de envío (`ChatForm`) consumiera los parámetros `prompt` y `submit=true`.
- **Regla y Solución Obligatoria:**
  1. **Envío Físico Asistido por DOM:**
     - Establecer el valor en React Hook Form: `methods.setValue('text', prompt, { shouldValidate: true })`.
     - Establecer el valor físico en el textarea: `textArea.value = prompt` + disparar eventos `input` y `change`.
     - Hacer clic físico en el botón de envío: `sendBtn.click()`.
  2. **Watchdog Activo de Verificación:**
     - Un bucle de verificación de hasta 2.5 segundos (intervalos de 100 ms).
     - Si el textarea aún contiene el texto, reintentar el clic.
     - Solo cuando el mensaje se haya despachado o el textarea esté limpio, se limpian los query parameters de la URL.

---

### Error 3: Google Multimodal Live API Error 1011 (Internal error encountered)
- **Síntoma:** Al conectarse por voz, en cuanto el usuario decía la primera palabra (ej: *"Hola,"*), la conexión se cerraba inmediatamente con el log:
  ```log
  [GeminiLive] User transcription (input): "Hola,"
  [GeminiLive] WebSocket closed. Code: 1011, Reason: Internal error encountered.
  [VoiceSession] Gemini connection closed: Code 1011, Reason: Internal error encountered.
  ```
- **Causa Raíz:** En `api/server/routes/voice/geminiLive.js`, se estaba configurando:
  ```javascript
  inputAudioTranscription: {
      languageCodes: ['es-CO', 'es-ES', 'es-419'], // ❌ PROHIBIDO
  }
  ```
  Según la **documentación oficial de Google Multimodal Live API (`ai.google.dev`)**, el objeto `inputAudioTranscription` **no admite parámetros internos ni códigos de idioma**. Pasar cualquier clave hace que el worker de inferencia de Google lance una violación de validación de Protobuf y mate el WebSocket con código 1011.
- **Regla y Solución Obligatoria:**
  1. Enviar siempre objetos vacíos en la configuración de la sesión Live:
     ```javascript
     inputAudioTranscription: {},
     outputAudioTranscription: {},
     ```
  2. El idioma español se fija y garantiza exclusivamente a través de la directiva de sistema `spanishAudioLock` en el prompt.

---

### Error 4: Esquema de herramientas sin propiedades en Protobuf OpenAPI
- **Síntoma:** Advertencias en el validador de OpenAPI de Google y posibles fallos al serializar llamadas a herramientas en Gemini Live.
- **Causa Raíz:** Herramientas con parámetros de tipo objeto como `campos: { type: "object" }` sin `properties` explícitas.
- **Regla y Solución Obligatoria:**
  - Todas las herramientas declaradas en `voiceSession.js` para Gemini Live **deben incluir siempre el subárbol `properties`** con los tipos primitivos esperados (`string`, `number`, `boolean`), aun cuando sean opcionales.

---

### Error 5: Muerte de la sesión de voz ante hipos o cortes temporales de red
- **Síntoma:** Ante cualquier error temporal del servidor de Google (1011, 1006, 1001), el servidor llamaba inmediatamente a `this.stop()`, cerrando el WebSocket del cliente y dejando al usuario sin voz.
- **Regla y Solución Obligatoria:**
  - Se implementó `reconnectGemini(triggerReason)`:
    1. Si el cliente sigue conectado en el navegador, el servidor intenta hasta 3 reconexiones automáticas en caliente.
    2. Rota de modelo automáticamente: `gemini-3.8-live` -> `gemini-3.1-flash-live-preview` -> `gemini-2.5-flash-native-audio-preview-12-2025`.
    3. Rota entre las API keys disponibles.
    4. Reanuda la escucha y reenvía la última orden de voz del usuario para que no se pierda.

---

### Error 6: Tenshi se niega a responder directamente y delega tozudamente
- **Síntoma:** El usuario pide *"hazlo tú"*, *"respóndeme tú"*, y Tenshi insiste tozudamente en que no puede y que debe abrir el chat con el especialista.
- **Causa Raíz:** Directivas de sistema demasiado restrictivas que impedían a Tenshi emitir conceptos de SG-SST en vivo.
- **Regla y Solución Obligatoria:**
  - Se añadió la **Cláusula de Obediencia Directa**: si el usuario indica *"hazlo tú"*, *"contéstame tú"*, *"no abras el chat"* o muestra frustración con la delegación, Tenshi **TIENE PERMISO TOTAL Y OBLIGATORIO** para responder directamente con su base de conocimientos en normativa colombiana (Decreto 1072 de 2015, Resolución 0312 de 2019, etc.), sin insistir en delegar.

---

## 2. Checklist Obligatorio Pre-Commit / Pre-Despliegue

Antes de dar por finalizada cualquier tarea relacionada con Tenshi, la voz o el chat:
1. [ ] **Verificación de Sintaxis Node:** Ejecutar `node -c api/server/routes/**/*.js` en cualquier archivo tocado.
2. [ ] **Compilación Local del Frontend:** Ejecutar obligatoriamente `npm run build:client` si se modificó `client/src`.
3. [ ] **Inclusión de Bundles en Git:** Asegurar que `git add client/src client/dist` incluya tanto el código fuente como los compilados.
4. [ ] **Verificación de Modelos de IA:** Nunca degradar ni inventar nombres de modelos; verificar siempre con `search_web` en la documentación oficial.
5. [ ] **Despliegue en VPS:** Indicar al usuario la ejecución de `git pull` y `docker exec -it LibreChat node scripts/restore-and-sync-all.js`.
