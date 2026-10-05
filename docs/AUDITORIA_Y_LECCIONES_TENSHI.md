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

### Error 7: Texto retenido en el textarea sin enviar (Falsa finalización del Watchdog / Radix Tooltip)
- **Síntoma:** Tenshi formula la consulta en pantalla (ej: `/c/new`), escribe el texto en el textarea, pero el mensaje nunca se envía y permanece pegado en la caja de texto.
- **Causa Raíz:**
  1. `dispatchSend` dependía de `sendBtn && !sendBtn.disabled` y hacía un `sendBtn.click()` sintético. Al estar envuelto en un `TooltipAnchor` de Radix UI, el evento `.click()` del DOM era interceptado/detenido por la capa de Radix sin disparar el submit del formulario de React.
  2. Si `sendBtn && !sendBtn.disabled` era verdadero, `dispatchSend` retornaba `true` inmediatamente, **impidiendo que se ejecutara `submitMessage`**.
  3. El watchdog, tras 25 intentos (2.5s), limpiaba la URL silenciosamente creyendo erróneamente que el mensaje había sido procesado, dejando el texto huérfano en el textarea.
- **Regla y Solución Obligatoria:**
  1. **Despacho Multicanal Simultáneo:** No confiar únicamente en `.click()`. Se debe invocar:
     - `methods.handleSubmit((data) => submitMessage({ text: data.text || textToSend }))()` (React Hook Form directo).
     - `submitMessage({ text: textToSend })` (hook directo de envío).
     - `form.requestSubmit()` (API nativa HTML5 de envío de formularios).
  2. **Watchdog con Reintento de Emergencia:** Si tras 30 intentos (3 segundos) el textarea aún retiene el texto (`val === textToSend`), ejecutar un `submitMessage` de emergencia y liberar el guard `releaseAutoSubmit`.

---

### Error 8: Degradación de la consulta a una frase telegráfica ("Qué es medicina laboral")
- **Síntoma:** Tenshi enviaba frases crudas y telegráficas sin estructuración técnica, degradando la calidad de la respuesta del especialista.
- **Causa Raíz:** Una directiva previa ("formula exactamente lo que pidió el usuario") fue sobre-interpretada por el modelo de IA como la prohibición de estructurar el prompt.
- **Regla y Solución Obligatoria:**
  1. **Estructuración técnica en 2 capas:**
     - **Capa 1 (Gemini Live):** La directiva de sistema y el esquema de `wappy_abrir_chat_agente` ordenan estructurar la consulta técnica incluyendo planteamiento, solicitud de fundamentación normativa colombiana (Decretos, Resoluciones) y recomendaciones prácticas para el SG-SST.
     - **Capa 2 (Frontend `cleanDelegatedPrompt`):** Si llega una consulta corta (< 130 caracteres) sin contexto normativo, el frontend la enriquece automáticamente antes de inyectarla en el chat.

---

### Error 9: Botón de envío no renderizado y `ask()` abortando silenciosamente por `endpoint: null` al inicializar chat de agente
- **Síntoma:** Al abrir `/c/new?agent_id=...&endpoint=agents&prompt=...`, el prompt se escribe en el textarea pero el botón de envío no aparece en pantalla (ausente en el DOM), el auto-envío no se ejecuta y el mensaje queda atascado sin enviarse jamás.
- **Causa Raíz:**
  1. **Omisión de `agent_id` en `useNewConvo.ts`:** La condición `paramEndpoint === true && templateConvoId === Constants.NEW_CONVO` reconstruía `template = { endpoint: _template.endpoint }`, eliminando `agent_id` del objeto `template`.
  2. **Botón SendButton no renderizado en `ChatForm.tsx`:** `endpoint` solo evaluaba `conversation?.endpointType ?? conversation?.endpoint`. Al ser ambos null, la condición `{endpoint && <SendButton />}` era falsa y el botón desaparecía completamente del DOM.
  3. **Aborto silencioso en `useChatFunctions.ts`:** La función central `ask()` ejecutaba `if (endpoint === null) return;`. Al estar `conversation.endpoint` en null/undefined al momento del despacho, abortaba silenciosamente sin procesar el mensaje.
  4. **Fallo de concordancia en `useQueryParams.ts`:** `areSettingsApplied()` fallaba al validar la igualdad estricta de `endpoint` y `agent_id` cuando la conversación aún no había hidratado el tipo `agents`.
- **Regla y Solución Obligatoria:**
  1. En `useNewConvo.ts`: preservar siempre `agent_id` en el template: `{ endpoint: _template.endpoint, agent_id: _template.agent_id }`.
  2. En `useChatFunctions.ts`: fallback obligatorio que garantiza que si existe `agent_id`, el endpoint es `EModelEndpoint.agents` y se asienta en `conversation.endpoint`.
  3. En `ChatForm.tsx`: renderizar siempre el botón de envío con `{(endpoint || conversation?.agent_id) && <SendButton ... />}`.
  4. En `TenshiChat.tsx`: disparo dual diferido (350ms) del evento `tenshi-submit-agent-prompt` como salvaguarda en caso de que la navegación URL demore en aplicar los parámetros.

---

### Error 10: Doble sumisión concurrente (bifurcación de rutas `< 1 / 2 >`), retención de texto en el textarea y timeout en Tool Call de continuidad
- **Síntoma:** Al delegar una consulta, en pantalla se creaban dos ramas de mensaje del usuario (`< 1 / 2 >` y `< 2 / 2 >`), el texto permanecía visible en el textarea tras enviarse, Tenshi hablaba por voz antes de que el especialista respondiera y soltaba una frase en inglés al final.
- **Causa Raíz:**
  1. **Doble despacho en el mismo tick:** `dispatchSend` en `useQueryParams.ts` y `dispatchClickOrSubmit` en `ChatForm.tsx` invocaban simultáneamente `methods.handleSubmit(...)()` Y `submitMessage(...)` sin exclusión mutua, generando dos mensajes paralelos bajo el mismo ID padre (bifurcación `< 1 / 2 >`).
  2. **Re-inyección en watchdog:** El watchdog de verificación comprobaba `if (currentArea) currentArea.value = textToSend`, reinyectando el texto en el textarea en cada ciclo en lugar de asegurar su vaciado.
  3. **Falso positivo en detección normativa:** `cleanDelegatedPrompt` incluía la palabra `colombia` dentro de `hasNormativeContext`. Cualquier pregunta básica que mencionara "en Colombia" era tratada como completamente fundamentada y se enviaba plana sin estructurar.
  4. **Retorno prematuro en `onWappyAction`:** En `TenshiChat.tsx`, el bloque CASO A terminaba con `return;`, impidiendo que `sendWappyActionResult` se enviara al backend. El backend emitía timeout (`warn: Tool call timed out waiting for client`), provocando que Gemini Live respondiera por su cuenta antes del especialista.
  5. **Alucinación de cierre en inglés:** Tras completar un turno, Gemini Live emitía comentarios de relleno en inglés ("I've already conveyed...").
- **Regla y Solución Obligatoria:**
  1. **Despacho canónico único:** Invocar `submitMessage({ text: prompt })` exactamente una vez por consulta delegada.
  2. **Vaciado inmediato del DOM:** Limpiar inmediatamente `textArea.value = ''` y `methods.setValue('text', '')`. El watchdog solo vigila que el input permanezca limpio sin reinyectar texto.
  3. **Exclusión de `colombia` en el test normativo:** Toda pregunta sin cita formal de decretos o resoluciones se enriquece profesionalmente.
  4. **Garantía de `sendWappyActionResult`:** Eliminar returns prematuros en `onWappyAction` para que el servidor reciba siempre la confirmación del tool call.
  5. **Directiva estricta de idioma:** Prohibir terminantemente cualquier locución en inglés en `systemInstruction` de Gemini Live.

### Error 11: Auto-envío bloqueado en el textarea (Cierre de guard prematuro, ciclo de dependencias en `useQueryParams` y Tenshi pensando tras apagar voz)
- **Síntoma:** Al delegar la consulta al especialista en `/c/new`, la pregunta aparece estructurada profesionalmente en el textarea, el botón de envío está verde/activo, pero el mensaje nunca se envía. La URL se limpia a `/c/new` y el texto queda estancado. Adicionalmente, si el usuario apagaba Tenshi por voz, Tenshi continuaba en segundo plano "pensando" y esperando la respuesta del especialista.
- **Causa Raíz:**
  1. **Bloqueo mutuo por `claimAutoSubmit`:** `claimAutoSubmit` mantenía un candado de 2500ms a nivel de módulo sobre el texto normalizado. Si un re-render previo o un intento inicial registraba el prompt, cualquier invocación de `useQueryParams` retornaba `false`. Al retornar `false`, el hook limpiaba la URL con `window.history.replaceState` y hacía `return;` silenciosamente sin despachar `submitMessage` y dejando el texto huérfano en el textarea.
  2. **Ciclo de dependencias en `useQueryParams.ts`:** `processSubmission` incluía `conversation` en su array de dependencias (solo para un log de consola). Al llamar a `newQueryConvo`, `conversation` se actualizaba, cambiando la referencia de `processSubmission` y provocando que el `useEffect` principal se re-ejecutara en bucle, reseteando `submissionHandledRef.current` y `pendingSubmitRef.current` a `false`.
  3. **Falta de limpieza en `stopVoiceMode`:** Al apagar el interruptor de voz, `stopVoiceMode` desconectaba el audio pero no desactivaba `pendingAgentConsultationRef.current.active = false` ni limpiaba `consultationTimerRef.current`, dejando vivo el listener que seguía vigilando el chat y procesando respuestas del especialista.
- **Regla y Solución Obligatoria:**
  1. **Desacoplamiento de `processSubmission`:** Eliminar `conversation` de las dependencias de `processSubmission` y rastrear la cadena de parámetros URL mediante `lastProcessedQueryRef.current`. El hook solo procesa una nueva consulta cuando `searchParams.toString()` cambia físicamente.
  2. **Despacho canónico garantizado sin lockout:** `processSubmission` y `sendDelegatedPrompt` utilizan un guard local `let sent = false` que ejecuta `methods.handleSubmit(...)()` y, si este no dispara el callback, ejecuta `submitMessage({ text })`. Se garantiza exactamente un envío sin depender de candados globales de texto.
  3. **Manejo defensivo de `isSubmitting`:** Si hay una respuesta generándose previamente, llamar a `handleStopGenerating()` y postergar el envío 200ms para asegurar que el canal esté libre.
  4. **Desactivación total en `stopVoiceMode`:** Apagar inmediatamente `pendingAgentConsultationRef.current.active = false` y limpiar `consultationTimerRef.current` para detener todo procesamiento en segundo plano.

---

## 2. Checklist Obligatorio Pre-Commit / Pre-Despliegue

Antes de dar por finalizada cualquier tarea relacionada con Tenshi, la voz o el chat:
1. [ ] **Verificación de Sintaxis Node:** Ejecutar `node -c api/server/routes/**/*.js` en cualquier archivo tocado.
2. [ ] **Compilación Local del Frontend:** Ejecutar obligatoriamente `npm run build:client` si se modificó `client/src`.
3. [ ] **Inclusión de Bundles en Git:** Asegurar que `git add client/src client/dist` incluya tanto el código fuente como los compilados.
4. [ ] **Verificación de Modelos de IA:** Nunca degradar ni inventar nombres de modelos; verificar siempre con `search_web` en la documentación oficial.
5. [ ] **Despliegue en VPS:** Indicar al usuario la ejecución de `git pull` y `docker exec -it LibreChat node scripts/restore-and-sync-all.js`.
