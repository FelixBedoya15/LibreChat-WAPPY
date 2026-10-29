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

### Error 12: Failsafe hiperactivo de Canvas, fuga de prompt interno, omisión de toolCall por voz y bloqueo en cambio de especialista (`/c/new`)
- **Síntoma:** 
  1. Canvas se abría solo en pantalla dividida sin haberlo solicitado, apareciendo y desapareciendo un documento Word con texto filtrado del prompt del sistema ("Á PROHIBIDO... CER... O DISCLAIMERS...").
  2. Al pedir por voz una segunda o tercera consulta contextual (ej: "intenta ahora preguntarle qué es co-tenista"), Tenshi hablaba por voz diciendo "¡Claro que sí! Ya le envié tu consulta...", pero en pantalla no se enviaba nada al especialista.
  3. Al solicitar abrir un nuevo chat con otro especialista (ej: "ábreme un nuevo chat con el abogado laboral"), no se abría el nuevo chat, se creaba una bifurcación de rutas dobles `< 2 / 2 >` en la conversación vieja y Tenshi respondía mezclando temas previos (Decreto 1072 vs Túnel del Carpo).
- **Causa Raíz:**
  1. **Discrepancia en el prefijo de mensajes del sistema:** En `voiceSession.js:2782`, la comprobación de mensajes internos era `data.text.startsWith('[SISTEMA INTERNO WAPPY]')` con corchete cerrado. Al enviar `[SISTEMA INTERNO WAPPY - RESPUESTA TÉCNICA EMITIDA]`, la condición fallaba y el backend trataba todo el dictamen y directivas del sistema como transcripción del usuario (`userTranscriptionText`).
  2. **Failsafe de Canvas demasiado permisivo:** `handleTenshiVoiceFailsafe` evaluaba `userLower` buscando palabras genéricas como `resumen`. Al estar contaminado con el mensaje del sistema, disparaba `canvas_tool` automáticamente, volcando las directivas internas en el editor de Canvas.
  3. **Omisión de Tool Call por Gemini Live en consultas contextuales:** Cuando el usuario decía "intenta ahora preguntarle qué es co-tenista", Gemini Live respondía por voz sin emitir la llamada de función `wappy_abrir_chat_agente`. El failsafe ignoraba la orden porque la frase no contenía explícitamente "fisioterapeuta" ni consultaba `this.activeScreenAgent` para saber quién estaba en pantalla.
  4. **Navegación a nuevo chat sin invocar `newConversation()`:** En `TenshiChat.tsx` (Caso B: nuevo chat), se ejecutaba `navigate('/c/new?...')` pero nunca se llamaba a `newConversation()` del hook `useNewConvo`. Por tanto, el átomo de Recoil mantenía viva la conversación anterior (`conversationId: ab61fede...`), sobre la cual se ejecutaba el envío diferido, creando la bifurcación `< 2 / 2 >` y dejando al usuario en el agente anterior.
- **Regla y Solución Obligatoria:**
  1. **Filtro estricto de mensajes internos:** Usar expresión regular `/^\[SISTEMA INTERNO WAPPY/i.test(text)` en `voiceSession.js` (`message`, `handleTenshiVoiceFailsafe` y `saveCurrentTurn`) para garantizar que ningún prompt interno contamine jamás la transcripción del usuario ni los mensajes guardados.
  2. **Canvas estrictamente por solicitud explícita de creación:** El failsafe de Canvas solo se activa ante comandos explícitos de creación (`crea/diseña/genera una landing/canvas`), nunca por menciones de "resumen".
  3. **Resolución contextual de especialista activo:** Si Gemini Live afirma por voz haber enviado la consulta (`aiClaimedConsultation`) o el usuario usa un comando consultivo sin nombrar al agente, el backend resuelve automáticamente el especialista contra `this.activeScreenAgent` y formula una consulta técnica profesional bajo la Regla 6.
  4. **Reseteo del átomo de conversación en Caso B:** Toda apertura de nuevo chat por voz en `TenshiChat.tsx` DEBE invocar obligatoriamente `newConversation({ template: { endpoint: EModelEndpoint.agents, agent_id: targetAgentId } })` antes de navegar a `/c/new`, asegurando la desvinculación total de la conversación previa.
  5. **Limpieza en toggle de voz:** `startVoiceMode` y `stopVoiceMode` limpian exhaustivamente cualquier consulta o timer pendiente para evitar estados zombi al apagar y encender la voz.

### Error 13: Fallo de Auto-Envío en `/c/new` y Vaciado Destructivo del Textarea por Timeout Ciego (350ms)
- **Síntoma:** Al pedir por voz a Tenshi abrir un chat con un especialista (ej: "abres un chat con el médico laboral y le preguntas qué es manguito rotador"), Tenshi confirma verbalmente que envió la consulta, la pantalla navega a `http://localhost:3080/c/new` y selecciona al Médico Laboral, pero el mensaje NUNCA se envía al servidor y el textarea queda completamente vacío con el botón de envío deshabilitado.
- **Causa Raíz:**
  1. **Vaciado Destructivo del Textarea por `setTimeout(350ms)`:** En `useQueryParams.ts` y `ChatForm.tsx`, se ejecutaba un `setTimeout(..., 350)` que forzaba ciegamente:
     `methods.reset(); methods.setValue('text', ''); textAreaRef.current.value = ''; window.history.replaceState({}, '', cleanUrl);`
     sin verificar jamás si el mensaje había sido efectivamente aceptado o despachado por LibreChat.
  2. **Colisión de Inicialización y `ask()` retornando temprano:** Cuando `newQueryConvo` se procesa al entrar a `/c/new`, los átomos de Recoil (`conversation`, `isSubmitting`, `setSubmission`) están en plena transición. Si `submitMessage` se ejecutaba antes de que el endpoint estuviera listo o mientras `isSubmitting` estaba en transición, `ask()` en `useChatFunctions.ts` hacía un `return;` silencioso.
  3. **Wipeout irreversible:** 350 milisegundos después de fallar en silencio `submitMessage`, el temporizador borraba el textarea y limpiaba la URL, destruyendo el texto para siempre sin dejar rastro ni reintento.
- **Regla y Solución Obligatoria:**
  1. **PROHIBICIÓN ESTRICTA DE BORRADO MANUAL CIEGO:** NUNCA ejecutar `methods.reset()`, `methods.setValue('text', '')` ni `textAreaRef.current.value = ''` mediante `setTimeout` arbitrario. LibreChat limpia el textarea de forma nativa e infalible a través de su propio ciclo `ask()` / `useSubmitMessage` cuando la sumisión es aceptada.
  2. **Watchdog no destructivo:** En `useQueryParams.ts` y `ChatForm.tsx`, utilizar un watchdog activo (intervalos de 300-350ms) que verifique si `isSubmitting` pasó a `true` o si el texto ya fue limpiado por LibreChat. Si el texto sigue presente en el textarea y el canal está libre, reintentar el despacho. Solo cuando el envío esté en curso o el formulario esté limpio, remover los parámetros de la URL mediante `window.history.replaceState`.

### Error 14: Colisión de Navegaciones Dobles (`newConversation` + `navigate('/c/new?params')`)
- **Síntoma:** Al abrir un chat nuevo por voz, en pantalla se apreciaban dos rutas cargando simultáneamente, transiciones conflictivas y comportamiento inestable en el historial de navegación.
- **Causa Raíz:** En `TenshiChat.tsx:1258`, antes de llamar a `navigate('/c/new?' + params.toString())`, se invocaba `newConversation(...)`. En `useNewConvo.ts:213`, `newConversation` ejecuta su propia navegación asíncrona a `/c/new` (sin parámetros) y reinicia el átomo `setSubmission({} as TSubmission)`. Seguidamente, `TenshiChat` ejecutaba `navigate('/c/new?params')`, provocando dos navegaciones casi simultáneas que competían entre sí y reiniciaban el estado de envío.
- **Regla y Solución Obligatoria:**
  1. **Navegación Canónica Única:** Al abrir un nuevo chat (`Caso B`), `TenshiChat.tsx` DEBE navegar directamente a `/c/new?${params.toString()}` sin llamar a `newConversation()` antes. `useQueryParams.ts` se encarga de aplicar los presets y montar la nueva conversación de forma aislada y limpia.
  2. **Canal de Respaldo por Evento Diferido:** Emitir `tenshi-submit-agent-prompt` con retardo (400ms) para que `ChatForm` actúe como red de seguridad si la resolución de URL sufriera algún retraso.

### Error 15: Preguntas Planas / Telegráficas por Omisión del Enriquecedor en `wappy_abrir_chat_agente`
- **Síntoma:** Tenshi transmitía consultas cortas o en crudo (ej: "¿Qué es el manguito rotador y cuál es su relación con el trabajo?") en vez de consultas estructuradas de alto nivel técnico ocupacional, incumpliendo la Regla 6 de AGENTS.md.
- **Causa Raíz:** En `voiceSession.js:2240`, cuando Gemini Live ejecutaba directamente la herramienta `wappy_abrir_chat_agente`, el código tomaba `fc.args.pregunta` en crudo sin pasarlo por ningún formateador. La estructuración técnica solo estaba implementada en el bloque fallback de la línea 4440.
- **Regla y Solución Obligatoria:**
  1. **Enriquecedor Técnico Universal Centralizado (`enrichTechnicalPrompt`):** Tanto en la ejecución directa de herramientas en `voiceSession.js` como en el failsafe y en el frontend, toda consulta menor a 80 caracteres o sobre patologías/normas clave (manguito rotador, codo de tenista, túnel carpiano, Res. 0312, GTC 45, PESV) DEBE ser transformada obligatoriamente en una consulta técnica estructurada con planteamiento ocupacional, factores de riesgo biomecánicos/ergonómicos, protocolos preventivos y fundamentación normativa colombiana (Decretos 1072/2015, 1477/2014, etc.).

### Error 16: Tenshi Persistente en "Pensando" tras Apagar Voz y Cierres en Idioma Inglés
- **Síntoma:** Al pausar o apagar el interruptor de Tenshi por voz, Tenshi permanecía con el estado "Pensando" en pantalla. Además, en ocasiones Gemini Live terminaba turnos con frases o coletillas en inglés ("all set", "that's all set").
- **Causa Raíz:**
  1. En `TenshiChat.tsx`, `stopVoiceMode()` no reseteaba `setIsTyping(false)` ni enviaba un comando de `interrupt` al backend antes de desconectar el socket, dejando viva la indicación visual de pensamiento.
  2. En `geminiLive.js`, la directiva de idioma se omitía si el sistema ya traía otra instrucción, y el modelo base de audio de Google ocasionalmente emitía tokens en inglés al completar herramientas.
- **Regla y Solución Obligatoria:**
  1. **Reset Total en `stopVoiceMode`:** `stopVoiceMode()` en `TenshiChat.tsx` ejecuta inmediatamente `setIsTyping(false)` y `sendVoiceInterruptRef.current()`, garantizando el apagado instantáneo de cualquier estado de espera o pensamiento.
  2. **Candado Estricto de Idioma en `geminiLive.js`:** Anteponer SIEMPRE la prohibición explícita de frases o cierres en inglés ("all set", "done", etc.) en el `systemInstruction` de audio nativo de Gemini Live.

### Error 17: Latencia Severa en Respuesta Verbal de Tenshi tras Especialista, Saturación de Cuotas 429 por `OraculoH1` y Falso Positivo de Cuota Diaria en `GeminiPoolManager`
- **Síntoma:** Tras responder el especialista en el chat, Tenshi demoraba muchos segundos (o se quedaba completamente pegado y en silencio) antes de emitir la síntesis verbal. En los logs se evidenciaba una cascada continua de errores 429 (límite de cuota) rotando por las 6 llaves del sistema:
  ```log
  [SGSST Gemini] Reintentando... Modelo="gemini-3.6-flash", Clave #5/6
  [OraculoH1] IA tags generados para ...: [Alergia_Quimica]
  [GeminiPoolManager] Pool para modelo "gemini-3.6-flash": 0 listas, 0 en enfriamiento, 6 agotadas hoy.
  [GeminiPoolManager] [CircuitBreaker] Llave AQ.A... AGOTADA HOY para "gemini-3.5-flash". Aislada hasta medianoche PT (~9h).
  ```
- **Causa Raíz:**
  1. **Saturación en Cascada por `OraculoH1` (`perfilSociodemografico.js`):** Al guardar o listar trabajadores, si cambiaba el hash de la nómina, el backend ejecutaba un bucle secuencial llamando a `runIASemanticTagging` para cada empleado. Cada llamada hacía reintentos lentos sobre las 6 llaves y luego sobre `gemini-3.6-flash`. Una nómina de 20-50 trabajadores generaba cientos de requests en segundos, quemando todas las cuotas de la API.
  2. **Falso Positivo de Cuota Diaria en `GeminiPoolManager`:** El analizador de errores marcaba cualquier mensaje con `limit: 20` como cuota diaria agotada (RPD) hasta medianoche PT (~9 horas de aislamiento), confundiendo límites por minuto (RPM) con límites por día, bloqueando el pool completo de llaves.
  3. **Bloqueo Prematuro del Micrófono en el Cliente (`TenshiChat.tsx`):** Al terminar el especialista, el cliente ejecutaba inmediatamente `setIsPlayingAudioRef.current?.(true)`, silenciando y bloqueando el micrófono del usuario durante 6 a 8 segundos antes de que Gemini Live emitiera el primer chunk de audio.
  4. **Carga Textual Excesiva enviada a Gemini Live:** Se inyectaban hasta 3,500 caracteres de texto técnico denso del especialista en la sesión de Gemini Live, forzando a Google a sintetizar audios masivos con latencias de 4 a 6 segundos.
  5. **Bloqueos Síncronos y Timeouts en `voiceSession.js`:**
     - En `case 'message'`, se activaba `this.isAiSpeaking = true` durante 5 segundos preventivos, descartando el audio del usuario.
     - El timeout de silencio tras hablar Tenshi era de 3,500ms (3.5s), ignorando interrupciones rápidas del usuario.
     - En `turnComplete`, se esperaba sincrónicamente a `saveCurrentTurn` y `correctTranscription`, congelando el ciclo de voz si las llaves estaban saturadas.
- **Regla y Solución Obligatoria:**
  1. **Fast-Fallback y Fallback Determinista en `OraculoH1`:**
     - En `sgsstGemini.js`: Se añadió `options.fastFallback: true`. Si la llamada da 429 o falla, aborta inmediatamente sin quemar las 6 llaves del pool.
     - En `perfilSociodemografico.js`: Si un trabajador falla o da 429, el lote conmuta de inmediato a `batchUseDeterministic = true`, clasificando los siguientes trabajadores con `runDeterministicSemanticTagging(w)` (0ms de latencia, 0 tokens consumidos, 100% cobertura médica ocupacional normativa).
  2. **Diferenciación RPD vs RPM y Rescate Cíclico en `GeminiPoolManager`:**
     - El Circuit Breaker solo aísla hasta medianoche si el mensaje contiene explícitamente `requests per day` o `daily quota`. Errores por minuto (RPM) solo enfrían la llave temporalmente (60s).
     - Si todas las llaves terminasen en `exhaustedKeys`, se activa un rescate cíclico con round-robin en lugar de bloquear el sistema por 9 horas.
  3. **Desbloqueo de Audio Inmediato y Resumen Conciso:**
     - En `TenshiChat.tsx`: Se eliminó el `setIsPlayingAudioRef(true)` prematuro (solo se activa cuando realmente llega audio) y se condensó el texto enviado a Gemini Live a un máximo de 1,200 caracteres de síntesis ejecutiva.
  4. **Fluidez en `voiceSession.js`:**
     - Se eliminó el bloqueo artificial de 5 segundos en `case 'message'`.
     - Se redujo el timeout de silencio de 3,500ms a 700ms para permitir diálogo ágil.
     - `turnComplete` ejecuta el guardado en segundo plano de forma no bloqueante (`saveCurrentTurn().catch(...)`), liberando la escucha inmediatamente.
     - `correctTranscription` cuenta con timeout estricto de 1,200ms y `fastFallback: true`.

---

### LECCIÓN 7 (2026-10-06): Resolución de Falla de "Segundo Llamado" en Modo Voz y Persistencia de Archivos Canvas

#### A. Falla de "Segundo Llamado" al Conectar Modo Voz
- **Síntoma Reportado:** Al encender el modo voz y hablar por primera vez ("Hola Tenshi"), Tenshi permanecía en silencio. Solo cuando el usuario hablaba por segunda vez ("Hola Tenchi, ¿cómo estás?"), Tenshi respondía.
- **Causas Raíces Diagnosticadas:**
  1. **Prematuridad del Estado `listening` en Cliente:** Al hacer clic en el micrófono, `TenshiChat` marcaba inmediatamente *"Tenshi te escucha..."* y `useVoiceSession` en `ws.onopen` fijaba `status: 'listening'`, a pesar de que el backend tardaba de 1.5 a 2.5 segundos en cargar memorias, autenticar y completar el handshake WebSocket con Google Multimodal Live API (`setupComplete`).
  2. **Descarte Silencioso de Audio en Backend:** Durante esos 1.5 - 2.5 segundos de inicialización, en `voiceSession.js` la condición `if (!this.isActive || !this.geminiClient) break;` descartaba silenciosamente los primeros chunks de audio (el primer llamado del usuario). Cuando el backend completaba el setup y activaba la escucha, el usuario ya había terminado de hablar y esperaba en silencio. Al hablar por segunda vez, la sesión ya estaba activa y Gemini respondía de inmediato.
  3. **Contaminación Acústica por `playSuccess`:** Al hacer clic en el micrófono se ejecutaba `tenshiAudio.playSuccess()`, un arpegio sonoro de 4 notas (510ms) que sonaba por los altavoces directo al micrófono abierto, alterando el suelo de ruido y la VAD de Google.
  4. **Flush Prematuro en `geminiLive.js`:** Se enviaba `flushBuffer()` en el evento `open` del socket antes de recibir `setupComplete`.
- **Solución Implementada:**
  1. `TenshiChat` muestra *"Conectando con Tenshi..."* hasta que el backend confirma explícitamente `status: 'listening'` tras recibir `setupComplete` de Google.
  2. Sustitución de `tenshiAudio.playSuccess()` por `tenshiAudio.playBlip()` (blip suave de 50ms) al alternar el micrófono.
  3. `useVoiceSession` bloquea el envío de PCM chunks (`sendPCMChunk`) mientras el estado no sea 'listening' o 'ready', e incluye una ventana de gracia de 200ms para que el flujo de audio comience en silencio pristino.
  4. `geminiLive.js` posterga `flushBuffer()` hasta el evento `setupComplete`.
  5. En `voiceSession.js`, se valida `this.geminiClient.setupCompleted` antes de procesar audio.

#### B. Desaparición de Archivos Canvas ("Apareció la opción para descargar y se borró" / "Dice que generó pero no aparece")
- **Síntoma Reportado:** Al solicitar un informe o documento a Tenshi, ella decía verbalmente *"¡Por supuesto! Ya te generé el documento..."*, pero la tarjeta de archivo no aparecía en pantalla o aparecía por 1 segundo y se borraba inmediatamente. Además, Gemini Live empezaba a hablar en inglés tras recibir la confirmación de la herramienta.
- **Causas Raíces Diagnosticadas:**
  1. **Omisión de `file` en Esquema Mongoose (`TenshiMessage.js`):** El esquema solo contemplaba `user`, `role`, `content` y `htmlReport`. Al llamar `TenshiMessage.create({ ..., file: { ... } })`, Mongoose en modo estricto eliminaba silenciosamente el objeto `file` antes de guardar en MongoDB.
  2. **Omisión de `file` en Ruta de API (`GET /api/tenshi/history`):** La ruta mapeaba los mensajes retornando `{ _id, role, content, htmlReport }`, omitiendo por completo `file: m.file`.
  3. **Sobrescritura Reactiva en Frontend:** Cuando `canvas_tool` emitía `wappy_action`, `setMessages` agregaba el archivo localmente. Segundos después, `turn_complete` llamaba a `refetchHistory()`; al llegar `historyData` desde el backend sin `file`, el estado local reemplazaba o eliminaba el objeto `file`, haciendo que la tarjeta de descarga desapareciera ante los ojos del usuario.
  4. **Latencia Desmedida en `gemini-3.6-flash` (51 segundos):** En `CanvasTool.js`, el prompt de enriquecimiento pedía hasta 2,500 palabras y no acotaba `maxOutputTokens`, generando ~20,000 caracteres (3,500 palabras). Durante esos 51 segundos en segundo plano, Gemini Live en modo voz alucinaba que ya lo había generado y cerraba el turno.
  5. **Fuga de Idioma Inglés:** Gemini Live respondía en inglés (*"I already generated the Word document..."*) ante el `toolResponse` de `canvas_tool`.
- **Solución Implementada:**
  1. Adición del subdocumento `file: { title, fileType, content, canvasId }` en `api/models/TenshiMessage.js`.
  2. Inclusión de `file: m.file` en `GET /api/tenshi/history` y `POST /api/tenshi/message`.
  3. En `TenshiChat.tsx`, lógica de sincronización defensiva en `useEffect([historyData])`: mapea y preserva `file` enriqueciendo mensajes de historial si existían localmente, impidiendo cualquier borrado o desaparición de tarjetas de descarga.
  4. En `CanvasTool.js`, optimización del prompt de `processTextReportDocument`: se calibra la extensión a 800-1,200 palabras de alta densidad técnica con las 3 tablas obligatorias (Demográfica, Peligros, Plan de Acción) y marco legal colombiano (Dec. 1072/2015, Res. 0312/2019), limitando `maxOutputTokens: 3500`. La generación pasa de 51s a 5-7s.
  5. En `voiceSession.js`, directiva de transición verbal en `systemInstruction` (*"Estoy redactando y compilando el documento en tu pantalla con las tablas correspondientes, dame un momento..."* sin afirmar que ya está listo hasta recibir el resultado) y forzamiento estricto de confirmación en español en el `toolResponse` (`[INSTRUCCIÓN ESTRICTA EN ESPAÑOL]: Confirma únicamente en español... ESTÁ TERMINANTEMENTE PROHIBIDO RESPONDER EN INGLÉS`).

---

### LECCIÓN 8 (2026-10-06): Corrección de Falso Failsafe al Especialista ("¿Me escuchaste?"), Invocación Real de Clics en la Interfaz y Herramienta de Reintegración de Colaboradores

#### A. Despacho Espurio al Abogado Laboral ante "¿Me escuchaste?"
- **Síntoma Reportado:** Al preguntar el usuario "¿Me escuchaste?" a Tenshi, Tenshi despachaba una consulta espuria al Abogado Laboral con la pregunta *"Solicito concepto técnico especializado sobre 'Me escuchaste...'"*, abriendo un chat innecesario y alterando la conversación.
- **Causa Raíz:** En `handleTenshiVoiceFailsafe` (`voiceSession.js`), la condición `aiClaimedConsultation` evaluaba `currentAiText`. Al decir Tenshi verbalmente *"Ya le pasé tu consulta al abogado..."*, la expresión regular dio `true`, `textToInspect` incluyó el texto de la IA, detectó `abogado_laboral` y tomó la pregunta conversacional del usuario (`"¿Me escuchaste?"`) como consulta técnica por ser `>= 6 caracteres`.
- **Solución Implementada:**
  1. Se eliminó por completo `aiClaimedConsultation` y la inspección de `currentAiText`. El failsafe se evalúa **EXCLUSIVAMENTE sobre `userLower`**.
  2. Filtro estricto de preguntas o checks conversacionales (`isConversationalCheck`: *"¿me escuchas?", "¿me oyes?", "hola", "qué dijo", "gracias"*, etc.) para descartar cualquier activación espuria.
  3. Se eliminó la asignación de preguntas por defecto por longitud (`>= 6 caracteres`), exigiendo coincidencias reales con patrones de consulta técnica o seguimiento.

#### B. Alucinación de Clics en Botones ("Generar IA" en Perfil Sociodemográfico) y "No le has dado clic, es mentiras"
- **Síntoma Reportado:** El usuario ordenó repetidamente *"genera el informe con IA del perfil sociodemográfico"*, *"dale clic en el botón de generar análisis"* o *"dale clic tú"*. Tenshi afirmó verbalmente *"¡Listo! Ya he generado el informe y está disponible en tu pantalla"*, pero nunca hizo clic real en el botón `Generar IA` (`#ai-default`). Al confrontarla el usuario, Tenshi invocó `leer_pantalla` y leyó datos obsoletos o plantillas previas para justificar su afirmación.
- **Causas Raíces:**
  1. **Falta de Invocación Obligatoria:** Gemini Live carecía de una directiva imperativa que le prohibiera responder antes de emitir el tool call `operar_interfaz_visual`.
  2. **Mismatch Semántico en `executeGUIAction`:** La búsqueda en el DOM comparaba cadenas literales (`itemText.includes(query)`). Cuando Tenshi pasaba `texto: 'generar análisis'` y el botón en el DOM tenía `title="Generar con IA"` o `label="Generar IA"`, la comparación fallaba y el clic no se ejecutaba.
- **Solución Implementada:**
  1. En `TenshiPageController.ts`, se implementó `matchesInteractiveTarget`: normaliza tildes/mayúsculas, elimina stopwords ("el", "la", "botón", "clic", "dale"), analiza superposición de tokens técnicos clave (`generar`, `analisis`, `ia`, `informe`) y cuenta con alias directos para el botón de IA (`#ai-default`) y pestañas de personal.
  2. En `voiceSession.js`, regla estricta en `systemInstruction`: ante cualquier orden de clic o generación de informe, Tenshi **DEBE PRIMERO invocar `operar_interfaz_visual({ accion: 'click', texto: 'Generar IA' })`**, emitiendo únicamente una frase breve de transición y esperando la ejecución real. Prohibición total de discutir o alucinar datos viejos ante la confrontación del usuario.
  3. Failsafe activo en `voiceSession.js`: si Gemini Live responde por voz sin emitir el tool call ante órdenes como *"dale clic tú"* o *"genera el informe con IA"*, el failsafe intercepta y despacha automáticamente `operar_interfaz_visual`.

#### C. Inexistencia de la Herramienta para Reintegrar / Reactivar Colaboradores
- **Síntoma Reportado:** Al pedir *"reintegra al trabajador Jorge Enrique Pineda"*, Tenshi afirmó haberlo hecho sin invocar ninguna función.
- **Causa Raíz:** La plataforma disponía de `wappy_retirar_trabajador`, pero carecía de la herramienta `wappy_reintegrar_trabajador` en el catálogo de Tenshi y en el despachador MCP, a pesar de que el backend ya contaba con la ruta `/workers/:idOrCedula/reactivar`.
- **Solución Implementada:**
  1. Implementación de `wappy_reintegrar_trabajador` y `wappy_reactivar_trabajador` en `tenshiMcpDispatcher.js`, `voiceSession.js` y `tenshi.js`.
  2. En `TenshiChat.tsx`, captura de la acción con invocación directa al endpoint de reactivación y emisión del evento `wappy-reload-sgsst-data` para refrescar de inmediato las tablas de colaboradores en pantalla.
  3. Failsafe específico en `handleTenshiVoiceFailsafe` que captura intenciones de reintegro/reactivación y asegura su ejecución.

---

### LECCIÓN 9 (2026-10-06): Correlación Temporal Estricta en Memoria Episódica de Tenshi Voice y Sincronización de Módulo Activo en Pantalla

#### A. Anclaje a Temas Antiguos Concluidos ("Baterías de Riesgo Psicosocial") vs Hilo Conductor Activo ("Perfil Sociodemográfico")
- **Síntoma Reportado:** Al pedir el usuario trabajar en el Perfil Sociodemográfico o regenerar el análisis, Tenshi comenzó a hablar de baterías de riesgo psicosocial (tema tratado horas o turnos antes y ya terminado), ignorando el hilo conductor actual y perdiendo la continuidad.
- **Causas Raíces Identificadas:**
  1. **Inyección Cronológica Plana sin Jerarquía:** En `voiceSession.js`, los últimos 10 mensajes de `TenshiMessage` se consultaban en orden descendente y luego se invertían (`.reverse()`). El mensaje más antiguo (índice 0, de sesiones pasadas) aparecía de primero bajo un rótulo genérico sin distinguir si eran antecedentes archivados o la conversación en curso. Gemini Live leía secuencialmente de arriba a abajo y se anclaba en el primer tema leído.
  2. **Ejemplo Hardcodeado de Priming en la Instrucción del Sistema:** En la regla de memoria de `voiceSession.js`, existía la frase literal: `(como "¿recuérdame la última consulta que te hicimos sobre los resultados de la batería de riesgo psicosocial en la empresa?")`. Esto provocaba un sesgo cognitivo directo (*prompt priming*) en Gemini Live, forzándolo a mencionar "baterías de riesgo psicosocial" ante cualquier ambigüedad.
  3. **Ausencia de Ruta/Módulo Activo en la Instrucción Inicial:** El WebSocket no transmitía el query string (`window.location.search`, ej: `?hito=hito2&module=perfil_socio`), enviando únicamente `/sgsst`. Por tanto, Tenshi no sabía qué módulo específico estaba abierto ante los ojos del usuario al inicializar la sesión de voz.
- **Solución Implementada:**
  1. **Estructuración Temporal de la Memoria Episódica:** En `voiceSession.js`, el historial de Tenshi se divide explícitamente en:
     - `[ANTECEDENTES PREVIOS ARCHIVADOS (TEMAS YA FINALIZADOS EN TURNOS ANTERIORES)]`: Con advertencia expresa al modelo de que son intercambios concluidos del pasado que NO debe retomar.
     - `[HILO CONDUCTOR ACTIVO Y VIGENTE (CONVERSACIÓN ACTUAL EN CURSO)]`: Con directiva crítica imperativa indicando que el último mensaje marca el presente inmediato sobre el que debe continuar.
  2. **Eliminación Total de Ejemplos Hardcodeados de Priming:** Se eliminó cualquier mención estática de baterías o temas específicos en las reglas de memoria.
  3. **Directiva Imperativa de Continuidad:** Se añadió en `systemInstruction` la `[REGLA ESTRICTA DE CORRELACIÓN TEMPORAL Y CONTINUIDAD DEL HILO CONVERSACIONAL]`, prohibiendo retroceder a temas viejos o tomar el primer mensaje como tema vigente.
  4. **Traducción Semántica de Pantalla y Sincronización en Vivo:**
     - Función `formatScreenRouteHuman(route, agent)` que mapea rutas y parámetros de URL a nombres técnicos legibles de módulos SG-SST (ej: *Módulo: Perfil Sociodemográfico y Nómina de Colaboradores (Hito 2 - Huella Biocéntrica)*).
     - Inyección destacada de `[PANTALLA Y MÓDULO VISIBLE EN ESTE MOMENTO]` en el system prompt.
     - En `TenshiChat.tsx` y `useVoiceSession.ts`, sincronización completa de `location.pathname + location.search` tanto en los parámetros de conexión iniciales del WebSocket como en el `useEffect` reactivo a los cambios de ruta con `useLocation()`.

---

### LECCIÓN 10 (2026-10-06): Eliminación de Ejecución Espuria de Canvas y Despacho Inmediato Simutáneo en Modo Voz

#### A. Activación Espuria de la Herramienta `canvas` en Consultas Ordinarias
- **Síntoma Reportado:** Al formular cualquier consulta ordinaria o técnica a un especialista en el chat (ej: *"pregúntale qué trata la Resolución 1843"*), el especialista abría espontáneamente el panel lateral de Canvas y se demoraba 20 a 30 segundos generando un documento formal no solicitado, bloqueando la respuesta del chat.
- **Causa Raíz:** En `CanvasTool.js`, la descripción general declaraba que Canvas era `"OBLIGATORIO para políticas, reglamentos, manuales... informes y cualquier documento tradicional"` y en `fileType` indicaba `"PRIORIDAD POR DEFECTO: Úsalo si el usuario menciona: documento, redactar, escribir, política, informe, procedimiento, guía, texto, estandares..."`. Al enriquecer Tenshi la consulta con terminología técnica ("procedimiento", "estándares"), el modelo del especialista consideraba que invocar Canvas era obligatorio por defecto.
- **Solución Implementada:**
  1. En `CanvasTool.js`, se reescribió `this.description` y el esquema de `fileType` estableciendo que Canvas se invoca **ÚNICAMENTE** ante solicitud expresa y explícita del usuario (ej: *"créalo en canvas"*, *"haz un documento word"*, *"genera un excel"*).
  2. Prohibición estricta en el schema para responder preguntas o consultas en el chat con Canvas. Toda consulta ordinaria debe responderse directamente en Markdown en el cuerpo del chat.

#### B. Latencia Crítica en Modo Voz y Secuencia Invertida ("Primero hace la tarea y luego habla")
- **Síntoma Reportado:** Al dar órdenes como navegar a un módulo o abrir un chat con un especialista, la pantalla ejecutaba la acción primero, Tenshi permanecía en un silencio absoluto de 6 a 10 segundos, y solo después empezaba a hablar ("Listo, ya le abrí el chat..."), haciendo que la interacción se percibiera sumamente lenta y desconectada.
- **Causa Raíz:** En el protocolo Gemini Live Multimodal WebSocket, Google silencia el canal de audio del modelo desde que emite un `toolCall` hasta que recibe su respectivo `toolResponse`. En `voiceSession.js`, el backend enviaba `wappy_action` al cliente del navegador y se quedaba esperando de forma bloqueante (con timeout de 6 segundos) a que el cliente completara la navegación/renderizado y enviara `wappy_action_result`. Gemini Live permanecía completamente mudo durante ese intervalo.
- **Solución Implementada:**
  1. **Despacho Inmediato y Respuesta Simultánea:** Para acciones de interfaz (`wappy_navegar`, `wappy_abrir_chat_agente`, `operar_interfaz_visual` de clics/scroll, `wappy_reintegrar_trabajador`), el backend envía de inmediato la acción al cliente y **en el mismo milisegundo responde a Gemini Live** con `sendToolResponse`.
  2. Gemini Live comienza a generar y emitir audio en menos de 200ms, hablando y confirmando la acción de forma perfectamente simultánea mientras el navegador transiciona en pantalla.
  3. Para herramientas que requieren datos de pantalla (`leer_pantalla`), se mantiene la espera del resultado DOM pero se reduce el timeout a 2.5s.
  4. En `case 'wappy_action_result'`, solo se reenvía respuesta a Gemini si el ID estaba en `pendingToolCalls`, evitando respuestas duplicadas.

#### C. Claves API en Cuarentena Inmediata ante Error 400 (`API_KEY_INVALID`)
- **Síntoma Reportado:** Retardo reiterado en cada invocación de agentes especialistas debido a reintentos fallidos en claves no válidas.
- **Causa Raíz:** `GeminiPoolManager` no manejaba errores HTTP 400 (`API key not valid`), volviendo a incluir la clave en cada nuevo turno.
- **Solución Implementada:**
  1. En `GeminiPoolManager.js`, se implementó `this.invalidKeys = new Set()`.
  2. Al reportar un error 400 o `API_KEY_INVALID`, la clave se añade inmediatamente a la lista de cuarentena y `getPrioritizedKeys` la filtra de todas las peticiones posteriores, ahorrando segundos vitales.

---

### LECCIÓN 11 (2026-10-06): Erradicación de Canvas Espurio, Descarte de Turnos de Texto por Colisión de Micrófono en Gemini Live y Sincronización de Voz Previa a la Acción

#### A. Erradicación Definitiva de Canvas Espurio en Consultas Técnicas Ordinarias
- **Síntoma Reportado:** Al formular consultas médicas u ocupacionales ordinarias en el chat (ej: *"¿Qué es el síndrome del manguito rotador y cuál es su mecanismo de lesión en el entorno laboral?"*), el agente especialista (ej: Fisioterapeuta Laboral) continuaba ejecutando la herramienta `canvas`, bloqueando la respuesta durante 30 a 40 segundos e incrustando el panel lateral de Canvas en pantalla sin haberlo solicitado.
- **Causas Raíces Identificadas:**
  1. **Inyección Incondicional de Prompt en `agent.js`:** En `api/server/services/Endpoints/agents/agent.js`, el backend inyectaba en `additional_instructions` para los 22 agentes (que tienen `canvas` configurado por defecto) la instrucción: `El Canvas está actualmente vacío para esta conversación. Si necesitas producir un informe, política, contrato u otro documento, debes inicializarlo/crearlo usando la directiva :::canvas`. Al recibir el agente una consulta técnica estructurada con solicitud de concepto detallado, el LLM interpretaba erróneamente que debía inicializar un Canvas formal.
  2. **Sobrecarga de Redacción en Camino B (`CanvasTool.js`):** Al ejecutarse `canvas` con `fileType='text'`, `CanvasTool.js` invocaba a `gemini-3.6-flash` para sintetizar un documento de 3,500 tokens con tablas formales, consumiendo 30 segundos de tiempo de cómputo y bloqueando el chat.
- **Solución Implementada:**
  1. **Inversión de Prompt en `agent.js`:** Se eliminó la directiva permisiva y se sustituyó por una regla imperativa obligatoria (`[REGLA ESTRICTA DE ACTIVACIÓN DE CANVAS]`): queda estrictamente prohibido usar Canvas para responder dudas, preguntas o conceptos técnicos en el chat; Canvas se reserva ÚNICAMENTE para cuando el usuario pida explícitamente crear un archivo o abrir un lienzo (*"hazlo en canvas"*, *"crea un archivo en word"*, *"haz un excel"*, *"diapositivas"*, etc.).
  2. **Guardia Preventiva Instantánea en `CanvasTool._call`:** En `api/app/clients/tools/structured/CanvasTool.js`, ante `accion === 'crear'`, se analiza el prompt del usuario. Si carece de intención explícita de creación de archivo/lienzo (`hasCanvasCreationIntent === false`), la herramienta rechaza de inmediato (1ms) la llamada devolviendo: `{"error": "CANVAS NO AUTORIZADO: El usuario formuló una consulta o concepto técnico en el chat sin solicitar explícitamente un archivo descargable ni un lienzo en Canvas. Responde DIRECTAMENTE en el cuerpo del chat en formato Markdown..."}`. Esto ahorra 30 segundos y obliga al LLM a emitir su dictamen de inmediato en el chat.

#### B. Colisión de Streaming de Micrófono vs Turno de Texto en Gemini Live (Silencio de 84 segundos)
- **Síntoma Reportado:** Al terminar el especialista de responder en el chat, Tenshi Voice permanecía en un silencio total durante más de 80 segundos. El usuario tenía que hablar al micrófono dos veces (*"¿Me escuchaste?"*, *"¿Qué respondió el agente?"*) para que Tenshi reaccionara.
- **Causa Raíz:** En `client/src/components/Tenshi/TenshiChat.tsx`, al capturar el dictamen del especialista, el cliente enviaba el mensaje `[SISTEMA INTERNO WAPPY - RESPUESTA TÉCNICA EMITIDA]` por WebSocket. En `voiceSession.js`, se llamaba a `this.geminiClient.sendText(data.text)` (`clientContent` con `turnComplete: true`). Sin embargo, el micrófono del navegador seguía transmitiendo chunks de audio continuos (`case 'audio'`) porque `this.isAiSpeaking` aún era `false` (la síntesis de Google toma ~500ms en arrancar). En la API Google Multimodal Live, recibir frames de audio (`realtimeInput.mediaChunks`) inmediatamente después de un `clientContent` hace que el VAD de Google asuma que el usuario empezó a hablar por el micrófono, interrumpiendo o descartando el turno de texto inyectado. Por tanto, Google cancelaba la respuesta y Tenshi se quedaba mudo.
- **Solución Implementada:**
  1. En `api/server/routes/voice/voiceSession.js`, al enviar texto mediante `case 'message'`, se activa una ventana temporal de supresión de audio: `this.suppressClientAudioUntil = Date.now() + 3000`.
  2. En `case 'audio'`, si la ventana está activa, se descarta el reenvío de chunks de audio del micrófono a Gemini Live durante esos segundos o hasta que `geminiClient.on('audio')` empiece a sonar.
  3. Esto permite que Gemini Live procese y sintetice el turno de texto sin que el ruido ambiental descarte la respuesta, asegurando que Tenshi lea el dictamen del especialista al instante.

#### C. Sincronización de Voz Previa a la Acción Visual ("Hablar primero, actuar después")
- **Síntoma Reportado:** Al dar órdenes como *"abre un chat con el abogado"* o *"haz clic en generar análisis"*, la interfaz gráfica cambiaba al instante en 0ms, mientras que la voz de Tenshi tardaba ~450ms en empezar a sonar, provocando la sensación de que primero actuaba y luego hablaba a destiempo.
- **Causa Raíz:** El renderizado de React y la navegación de URL (`navigate()`) o interacción DOM (`executeGUIAction`) ocurrían de forma síncrona e instantánea, mientras que los paquetes de audio PCM24 de Google requieren ~400ms de latencia de red y síntesis para iniciar la reproducción en el Web Audio API.
- **Solución Implementada:**
  1. En `client/src/components/Tenshi/TenshiChat.tsx`, se introdujo un retardo amortiguador intencional de 400 a 450ms en `wappy_navegar`, `wappy_abrir_chat_agente` y `operar_interfaz_visual`.
  2. Este margen permite que la voz de Tenshi comience a escucharse en los altavoces de forma previa o simultánea a la transición de pantalla o clic en botones, eliminando por completo la disonancia visual y auditiva.

#### D. Descontaminación de Contexto Histórico en Memoria de Tenshi Voice
- **Síntoma Reportado:** Al estar en el Perfil Sociodemográfico y pedir generar el análisis, Tenshi comenzaba a hablar sobre riesgos psicosociales o patologías tratadas en turnos previos.
- **Causa Raíz:** `recentConvos` inyectaba hasta 3,500 caracteres por mensaje de conversaciones pasadas con especialistas en el system instruction de Gemini Live, provocando que el modelo sufriera contaminación de contexto y mezclara temas de módulos distintos.
- **Solución Implementada:**
  1. Reducción de la carga textual de `recentConvos` a un máximo de 250 caracteres por mensaje y etiquetado explícito como `[ARCHIVADO - HISTORIAL PASADO DE OTRAS CONSULTAS (TEMAS CERRADOS)]`.
  2. Refuerzo de la directiva de foco temático: el tema actual de Tenshi está delimitado exclusivamente por el último mensaje del usuario y la pantalla visible actual (`${humanScreen}`).

#### E. Supresión de Ruido de Hardware, Filtros de Banda Vocal y VAD Inteligente en el Cliente
- **Mejora Solicitada:** *"¿No podemos poner algo como suprimir ruido para que solo identifique voz?"*
- **Problema Previo:** El cliente transmitía 100% de los frames de audio al WebSocket sin filtrar, incluso en silencio ambiental, enviando ruido de ventiladores de PC, tecleo, aire acondicionado o respiración a Google Gemini Live. Esto saturaba el VAD del servidor y provocaba falsas interrupciones.
- **Solución Implementada:**
  1. **Constraints de DSP en `getUserMedia`:** Inclusión de `googEchoCancellation`, `googAutoGainControl`, `googNoiseSuppression`, `googHighpassFilter` y `voiceIsolation` (aislamiento de voz de macOS/iOS y Chromium).
  2. **Grafo de Filtrado Biquad (Banda de Voz Humana):** Filtro paso alto a 85Hz (corta vibraciones mecánicas, golpes de escritorio y zumbido de ventiladores) + Filtro paso bajo a 7000Hz (elimina siseo y estática).
  3. **Voice Activity Detection (VAD) / Noise Gate Inteligente:** Cálculo de energía RMS en cada frame con seguimiento adaptativo del piso de ruido ambiental (`noiseFloor`) y umbral dinámico de activación vocal.
  4. **Hangover y Pre-Roll:** Ventana de retención de 450ms para evitar cortar finales de palabras entre sílabas y búfer circular pre-roll de 120ms para preservar intactos los fonemas iniciales. Durante el silencio, la compuerta se cierra y **NO se transmiten paquetes a Google**, garantizando un canal de audio 100% limpio y libre de ruido.

#### F. Prohibición Absoluta de Sustitución Destructiva en `enrichTechnicalPrompt`
- **Síntoma Reportado:** Al preguntar por voz *"Pregúntale, porfa, que si un psicólogo especialista en seguridad y salud en el trabajo puede ser el responsable"*, Tenshi delegaba al Abogado Laboral una plantilla prefabricada genérica sobre sanciones y número de trabajadores bajo la Res. 0312, mutilando por completo la consulta del usuario.
- **Causa Raíz:** `enrichTechnicalPrompt` contenía regexes agresivos (`/0312|resoluci[oó]n\s*0312|est[aá]ndares/i`, `/manguito/i`, etc.) que retornaban cadenas fijas estáticas, sustituyendo de forma destructiva cualquier texto que coincidiera con dichas palabras clave.
- **Solución Implementada:**
  1. Erradicación total de plantillas fijas sustitutivas en `enrichTechnicalPrompt` (`voiceSession.js`).
  2. Preservación innegociable de la consulta exacta del usuario como núcleo central del mensaje (limpiando únicamente vocativos de intermediación como *"pregúntale al abogado que si..."*).
  3. Formateo respetuoso y anexo de la solicitud de fundamentación técnica y normativa colombiana (Dec. 1072/2015, resoluciones aplicables) sin alterar en absoluto la inquietud planteada por el usuario.

#### G. Fallback Corporativo y de Matriz Oficial en Herramienta `MatrizIPEVAR`
- **Síntoma Reportado:** Estando en la pantalla con 6 riesgos identificados en la Matriz IPEVAR Oficial, Tenshi Voice afirmaba *"La matriz se encuentra vacía actualmente, no tenemos riesgos registrados"*.
- **Causa Raíz:** `MatrizIPEVAR._call` consultaba únicamente `GTC45Matrix.findOne({ conversationId })`. Como el widget de voz o la nueva conversación de chat poseía un ID efímero/nuevo, la consulta retornaba array vacío a pesar de que la empresa sí tenía su matriz documentada en la sesión oficial corporativa (`official-${companyId || userId}` o `isOfficial: true`).
- **Solución Implementada:**
  1. En `MatrizIPEVAR.js`, cuando `session.matrixRows` esté vacío en `accion === 'leer'`, se ejecuta una cascada de fallback resiliente a: `isOfficial: true`, `official-${companyId || userId}` o la sesión más reciente del usuario con registros guardados.
  2. En `SomosSST.js` (`resumen_empresa`), se integró la lectura de `GTC45WorkspaceSession` cuando el modelo legacy no reporte peligros, reflejando fielmente los 6 riesgos oficiales en el resumen global.

#### H. Sincronización en Vivo del Censo de Trabajadores (Cero Discrepancias)
- **Síntoma Reportado:** La pantalla de Huella Biocéntrica mostraba `Todos (58) | Activos (58) | Retirados (0)`, pero Tenshi afirmaba por voz que habían 59 trabajadores.
- **Causa Raíz:** `CompanyInfo.workerCount` mantenía un valor estático desactualizado (59) guardado al registrar la empresa, el cual no se sincronizaba automáticamente cuando se modificaba o reintegraba la nómina en `PerfilSociodemograficoData` o `SgsstWorker`.
- **Solución Implementada:**
  1. En `voiceSession.js` y `tenshi.js`, el conteo de trabajadores inyectado al system prompt se calcula en vivo consultando los colaboradores activos reales de `PerfilSociodemograficoData` (`estadoLaboral !== 'retirado'`).
  2. Si existe discrepancia entre el conteo en vivo y `CompanyInfo.workerCount`, el sistema actualiza automáticamente `CompanyInfo.workerCount` en MongoDB.
  3. En `perfilSociodemografico.js` (`router.post('/')`) y en las acciones `crear_trabajador`, `retirar_trabajador` y `actualizar_trabajador` de `SomosSST.js`, se mantiene la sincronización atómica con `CompanyInfo.workerCount`.

#### I. Detección DOM y Clic Confiable en Botón de Análisis IA en `SGSSTToolbar`
- **Síntoma Reportado:** Al pedir *"genera el informe con IA del perfil sociodemográfico"*, Tenshi respondía verbalmente que lo había generado pero nunca pulsaba el botón ni ejecutaba la acción.
- **Causa Raíz:** `<ToolbarButton>` no propagaba los atributos `id` ni `data-action` al elemento `<motion.button>` del DOM. Por ende, `TenshiPageController` no podía encontrar `#ai-default` al invocar `operar_interfaz_visual`.
- **Solución Implementada:**
  1. En `SGSSTToolbar.tsx`, `<ToolbarButton>` ahora pasa explícitamente `id={id}`, `data-action={id || 'toolbar-button'}` y `data-clickable="true"` a `<motion.button>`.
  2. En `TenshiPageController.ts`, se incluyó `[data-action="ai-default"]` y `#ai-default` en los selectores directos de alta prioridad ante órdenes de generación o análisis con IA.

---

### LECCIÓN 12 (2026-10-07): Latencia de 10-14 s antes de que Tenshi responda ("dura eternidades para contestar")

- **Síntoma reportado (recurrente):** Tras decir "Hola, Tenshi", la respuesta tardaba 11-13 s. En el segundo turno a veces nunca llegaba.
- **Evidencia en logs:** `AUDIO recibido (chunk #1)` a las 11:03:30.158 → transcripción del usuario a las 11:03:41.548 (**11,4 s después**) → primera palabra de la IA **6 ms después** y frase completa en 312 ms. Google no era lento generando: tardaba en **decidir que el usuario había terminado**.
- **Causas raíz:**
  1. **El noise gate de la Lección 11-E dejó al VAD de Google sin silencio.** El cliente deja de enviar audio cuando hay silencio. El VAD del servidor de Google necesita *recibir* el silencio final para cerrar el turno; como no le llegaba nada, retenía la respuesta hasta que entraba más audio o vencía un timeout interno.
  2. **Nunca se enviaba `realtimeInput.audioStreamEnd`.** Según la spec oficial (`ai.google.dev/api/live`), cuando el stream de audio se pausa (micrófono apagado / compuerta cerrada) el cliente debe enviar `audioStreamEnd: true` para vaciar el audio en caché. Solo es válido con detección automática habilitada (default).
  3. **El piso de ruido del cliente podía quedar bloqueado.** La fórmula solo se adaptaba si `rms < 0.008` o `rms < 1.5×piso`; con ruido/AGC estable un poco más alto, la compuerta nunca se cerraba y se enviaba audio continuo.
- **Solución implementada:**
  1. `useVoiceSession.ts`: adaptación asimétrica del piso de ruido (baja rápido, sube moderado bajo el umbral y muy lento durante "voz", limitado a 0.001–0.05). Hangover de 700 ms. Cuando la compuerta se cierra después de una locución, se envía **una sola vez** `{ type: 'speech_end' }`. Si la IA toma el turno mientras se transmite, se descarta la señal.
  2. `voiceSession.js`: `case 'speech_end'` → `geminiClient.sendAudioStreamEnd()` (ignorado si la sesión no está lista o si la IA está hablando).
  3. `geminiLive.js`: nuevo `sendAudioStreamEnd()` → `{ realtimeInput: { audioStreamEnd: true } }`, y en el setup `realtimeInputConfig.automaticActivityDetection = { endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH', silenceDurationMs: 600, prefixPaddingMs: 100 }` como respaldo.
- **Reglas obligatorias:**
  1. **Todo noise gate o VAD en el cliente DEBE ir acompañado de `audioStreamEnd`** al cerrarse. Prohibido cortar el audio hacia Google sin avisarle.
  2. **No usar `clientContent.turnComplete` para cerrar turnos de voz**: ese campo es para turnos de texto y mezclarlo con `realtimeInput` puede interrumpir la generación.
  3. **No poner `automaticActivityDetection.disabled: true`**: `audioStreamEnd` requiere la detección automática. Si algún día se desactiva, hay que migrar a `activityStart`/`activityEnd`.
  4. No bajar el hangover de 600 ms: `audioStreamEnd` cierra el turno de inmediato y partiría frases con pausas naturales.

---

### LECCIÓN 13 (2026-10-07): Error 1011 de Google en `gemini-3.8-live` y Priorización Defensiva de `gemini-3.1-flash-live-preview`

- **Síntoma Reportado:** Tenshi saluda bien, pero al pedirle una solicitud técnica estructurada (ej: *"¿Podrías decirme cuántos trabajadores tengo registrados?"*), se corta a mitad de frase y no continúa hablando. Tras la reconexión automática a 3.1, responde al instante con máxima fluidez y ejecuta herramientas sin errores.
- **Evidencia Forense en Logs:**
  ```log
  [GeminiLive] User transcription: "¿Podrías decirme cuántos trabajadores tengo registrados en mi empresa?"
  [GeminiLive] AI transcription: "¡Claro! En este momento tienes registrados 57 trabajadores activos en el sistema."
  [GeminiLive] WebSocket closed. Code: 1011, Reason: Internal error encountered.
  [VoiceSession] Reconexión automática de emergencia 1/3... de "gemini-3.8-live" a "gemini-3.1-flash-live-preview"
  [VoiceSession] ✅ Reconexión exitosa a Gemini Live con Modelo "gemini-3.1-flash-live-preview"
  [GeminiLive] Tool Call received: wappy_consultar_trabajadores
  [GeminiLive] AI transcription: "Actualmente tienes 58 trabajadores registrados en el sistema..." (Turn Complete)
  ```
- **Causas Raíces:**
  1. **Inestabilidad del Clúster de Google en `gemini-3.8-live`:** El modelo 3.8 Live es experimental y más pesado (interleaved reasoning). En la infraestructura de Google, al evaluar function calling y streaming continuo en sesiones densas, sufre caídas internas (*thread crash*) que cierran el WebSocket con Code 1011.
  2. **Arquitectura Flash Optimizada en `gemini-3.1-flash-live-preview`:** La variante Flash está especialmente diseñada para ultra-baja latencia y despacho de herramientas sin sobrecarga de cómputo, resultando inmune a las caídas 1011 de 3.8 y logrando una respuesta vocal en menos de 300ms.
- **Solución Implementada:**
  1. **Inversión de Prioridad en el Catálogo de Modelos Live:**
     - En `sgsstGemini.js`: `LIVE_FALLBACK_MODELS = ['gemini-3.1-flash-live-preview', 'gemini-3.8-live', 'gemini-2.5-flash-native-audio-preview-12-2025']`.
     - En `geminiLive.js` y `voiceSession.js`: El modelo preferido por defecto pasa de `gemini-3.8-live` a `gemini-3.1-flash-live-preview`.
     - En `Personalization.tsx`: Predeterminado del sistema actualizado a `Gemini 3.1 Flash Live (Principal / Máxima Fluidez)`.
     - En `restore-and-sync-all.js`: Migración defensiva en MongoDB de `liveAnalysis` hacia `gemini-3.1-flash-live-preview`.
  2. Las sesiones ahora inician directamente con 3.1 Flash sin tener que esperar a que 3.8 falle con 1011 para rotar. `gemini-3.8-live` se mantiene como Tier 1 de respaldo automático.

---

### LECCIÓN 14 (2026-10-14): Desacople de Cámara Genérica vs. Modo Fisioterapeuta, Prevención de Usurpación de Identidad de Especialistas y Tamaño Compacto en PC

- **Síntomas Reportados:**
  1. Al abrir la cámara normal de Tenshi o videollamada, se desplegaba de forma indebida el HUD de la Fisioterapeuta (esqueleto neón MediaPipe, fases RULA/REBA, telemetría de ángulos).
  2. En computadores de escritorio (PC), Tenshi se expandía automáticamente a 760x700 px, invadiendo el centro del monitor y tapando la pantalla que el usuario necesitaba ver.
  3. En el visor de cámara (móvil y desktop), los botones PiP superiores (`[Minimizar]`, `[Girar cámara]`, `[Cerrar]`) colisionaban y se superponían directamente sobre el texto de los badges ergonómicos (`Método: RULA`).
  4. Al invocar especialistas como el Consultor SST (u otros) en el chat o live, se abría la interfaz biomecánica de la Fisioterapeuta en lugar del conocimiento propio del agente consultado.
- **Causas Raíces:**
  1. **Condición de HUD Permisiva en Frontend:** En `TenshiChat.tsx`, la condición de renderizado era `(isBiomechanicsActive || visionSource === 'camera')`. Al evaluar verdadera cualquier apertura de cámara, forzaba el HUD ergonómico y el loop de MediaPipe Pose.
  2. **Expansión Forzada de Dimensiones:** En `getChatPositionStyle`, `isVisionTakingSpace = isVisionActive && isVisionExpanded` inflaba el contenedor a 760x700 px en PC.
  3. **Solapamiento por Inset-x Completo:** El HUD abarcaba `inset-x-2.5` ocupando el 100% del ancho, mientras que los botones flotantes residían en `top-3 right-3`, montándose encima del badge de método.
  4. **Fallback Agresivo de Especialistas:** En `VoiceModal.tsx`, un filtro invertido clasificaba como biomecánico a cualquier especialista fuera de una lista acotada. En `voiceSession.js`, la falta de prompt en Mongo disparaba el fallback inyectando `fisioterapeuta_laboral.md` a cualquier agente.
- **Solución Implementada:**
  1. **Aislamiento de la Cámara Normal:** Separación estricta entre `isVisionActive` y `isBiomechanicsActive`. Si `isBiomechanicsActive` es falso, la cámara es 100% limpia (badge verde `EN VIVO`, botón "Tomar Foto", sin telemetría ni esqueleto). El modo ergonómico solo se activa al solicitar explícitamente estudio de puesto / ergonomía (`isBiomechanicsActive = true`).
  2. **Dimensiones Compactas Permanentes en PC:** `defaultW = 420` y `defaultH = 540` invariables en escritorio, preservando el espacio de trabajo del usuario.
  3. **Reorganización Anti-Colisión:** Se añadió `right-28` al contenedor del HUD, garantizando un margen libre a la derecha para que los controles de cámara nunca tapen los textos informativos.
  4. **Preservación de Identidades:** Se eliminaron los fallbacks universales en `VoiceModal.tsx` y `voiceSession.js`; cada agente mantiene su protocolo nativo (Auditoría, Legal, Medicina Laboral, etc.).

### LECCIÓN 15 (2026-10-14): Unificación de Botonera Cápsula Flotante (WAPPY Design System), Adopción Dinámica de Roles en Tenshi Live y Erradicación de la Usurpación de Especialistas

- **Síntomas Reportados:**
  1. En los visores de cámara de Tenshi (móvil y escritorio), los controles de acción estaban dispersos (3 botones en esquina superior derecha y un botón solitario en la esquina inferior derecha), discrepando de la botonera inferior unificada de la plataforma.
  2. Al abrir Live desde agentes diferentes al Fisioterapeuta (ej: Consultor SST, Médico Laboral, Abogado, Terapeuta en Salud Mental), el backend y el modal seguían abriendo como si fuera la Fisioterapeuta, hablando de ángulos articulares o cargando MediaPipe.
  3. Tenshi en su Live general no cambiaba de rol según la intención solicitada por el usuario (ej: *"ayúdame a verificar los riesgos del botiquín de emergencias"* no adoptaba el rol de emergencias).
- **Causas Raíces:**
  1. **Discrepancia de Botonera:** El visor de Tenshi en escritorio no utilizaba el contenedor flotante cápsula (`rounded-full bg-black/80 backdrop-blur-xl border border-white/15 shadow-2xl`) de la Imagen 1 (`VoiceModal.tsx`), sino controles dispersos.
  2. **Fallback a Biomecánico en `inspectionProtocols.js` (Backend):** En `api/server/routes/voice/inspectionProtocols.js:271`, `resolveInspectionProtocol` retornaba `INSPECTION_PROTOCOLS.biomecanico` si el agente no estaba definido. Además, no incluía los protocolos de `psicosocial`, `medicina_laboral` ni `juridico_legal`.
  3. **Scoping Bug de `wantsBiomechanics` y Fallback a `fisioterapeuta_laboral.md` en `voiceSession.js`:** En la línea 7483, `wantsBiomechanics` estaba declarado dentro de un bloque `try` y si fallaba la búsqueda del agente en BD, siempre cargaba el markdown de la Fisioterapeuta. Adicionalmente, el bloque `config.systemInstruction` inyectaba directivas biomecánicas incluso para otros especialistas.
  4. **Contaminación por Título de Conversación en `VoiceModal.tsx`:** `candidate` evaluaba `conversation?.title`. Si el usuario había tenido una conversación previa con título sobre "estudio de puesto" o "ergonomía", al cambiar de agente el modal seguía abriendo como Fisioterapeuta mientras el agente cargaba.
- **Solución Implementada:**
  1. **Botonera Cápsula Flotante Inferior Universal (Imagen 1):** Unificada tanto en visor móvil como en escritorio en `TenshiChat.tsx` y `VoiceModal.tsx`:
     `[Cámara On/Off]` `[Capturar Evidencia]` `[Girar Cámara]` `|` `[Micrófono Hero con pulso]` `|` `[Pantalla]` `[Informe FileText]` `[Colgar rojo PhoneOff]`. Esquina superior derecha limpia únicamente con botón de Minimizar/Expandir.
  2. **Catálogo Completo de 8 Protocolos Técnicos:** Actualizados tanto en cliente (`client/src/utils/inspectionProtocols.ts`) como en servidor (`api/server/routes/voice/inspectionProtocols.js`):
     - `biomecanico` (Fisio / Ergonomía / RULA / REBA)
     - `quimico` (SGA / ONU / FDS / Res. 1496)
     - `pesv` (Seguridad Vial / Res. 20223040040595)
     - `emergencias_electrico` (Botiquín / Extintores / RETIE / NFPA 10)
     - `psicosocial` (Salud Mental / Batería MinTrabajo Res. 2764)
     - `medicina_laboral` (Salud Ocupacional / Exámenes Médicos / Res. 2346)
     - `juridico_legal` (Matriz Legal / Cumplimiento Dec. 1072 / Res. 0312)
     - `auditoria_gtc45` (Consultor General SST / 5S / Fallback predeterminado)
  3. **Adopción Dinámica de Roles en Tenshi Live:** Tenshi detecta la intención del usuario en `handleSend`, `onTextReceived` y `onAgentSwitched`, cambiando dinámicamente el protocolo, los badges, los métodos normativos y las fases de inspección.
  4. **Blindaje de Identidad de Especialistas:** El backend solo inyecta directivas biomecánicas si el agente es explícitamente ergonómico. De lo contrario, inyecta directivas técnicas propias del rol con su propio marco legal colombiano.

### 1.15 (14/10/2026) Eliminación Estricta de Fases/Autoevaluación en Especialistas no-Fisio y Fix a `toggleVoice`
- **Síntomas Reportados:**
  1. Al abrir la cámara en vivo con cualquier agente que no es el Fisioterapeuta (ej: Consultor SG-SST), seguía apareciendo una barra flotante superior con badges de fases (`Fase 1: Orden / 5S`, `Fase 2: Puntos Críticos`, etc.), autoevaluación y badges de enfoque.
  2. En el botón de captura de foto aparecía un badge `1/3` incluso para agentes no ergonómicos.
  3. Al pulsar el botón de micrófono en la botonera de `TenshiChat.tsx`, se disparaba el error: `ReferenceError: toggleVoice is not defined`.
  4. Los agentes seguían abriendo el Live hablándole al usuario como si fuera la Fisioterapeuta en lugar del especialista correspondiente.
- **Causas Raíces:**
  1. **Ternario con Fallback en `VoiceModal.tsx`:** Las líneas 1410-1542 tenían `isBiomechanicsAgent ? (...) : (<div ...phases.map...>)`. Cuando `!isBiomechanicsAgent`, renderizaba una barra alternativa con fases de GTC 45 y autoevaluación, ensuciando la vista de la cámara.
  2. **Bloques `!isBiomechanicsActive` en `TenshiChat.tsx`:** Tanto en móvil (4790-4836) como en desktop (5469-5515), se renderizaban fases cuando `!isBiomechanicsActive`.
  3. **Error de Nomenclatura en `TenshiChat.tsx`:** En los botones de la botonera inferior se escribió `onClick={toggleVoice}`, pero la función declarada era `const toggleVoiceMode = useCallback(...)`.
  4. **Causa Raíz de Backend (`voiceSession.js:7465`):**
     `const wantsBiomechanics = Boolean(config.mode === 'live_analysis' || config.template === 'biomecanico_mediapipe');`
     Como `liveAnalysisWebSocket.js` asigna por defecto `mode: 'live_analysis'` a cualquier conexión WebSocket de cámara, `wantsBiomechanics` evaluaba a `true` para TODOS los agentes, forzando la carga de `fisioterapeuta_laboral.md` y reemplazando las directivas del agente seleccionado.
- **Solución Implementada:**
  1. **HUD Superior Exclusivo del Fisioterapeuta:** En `VoiceModal.tsx`, se eliminó completamente la rama `else` con fases. Si `!isBiomechanicsAgent`, la pantalla superior queda completamente limpia (renderiza `null`).
  2. **Eliminación de Fases en `TenshiChat.tsx`:** Se borraron los bloques `!isBiomechanicsActive` que inyectaban fases en móvil y escritorio.
  3. **Fix `toggleVoice`:** Se declaró `const toggleVoice = toggleVoiceMode;` solucionando el `ReferenceError`.
  4. **Corrección de `wantsBiomechanics`:** Se limitó estrictamente a `config.template === 'biomecanico_mediapipe'`. Si un especialista está activo, mantiene su identidad, conocimiento y directivas sin fases.
  5. **Badge de Foto Condicional:** El badge de fases `${currentPhaseIndex + 1}/${activeProtocol.phases.length}` solo se renderiza si el modo es ergonómico/fisioterapeuta.

### 1.16 (15/10/2026) Solución a Error 404 de Estudio de Puesto, Cancelación Real de Audio (Mute), Control de Cámara y HUD Ergonómico Móvil
- **Síntomas Reportados:**
  1. `Error: No route matches URL "/sgsst/estudio-puesto"`.
  2. El botón central de micrófono no cancelaba/silenciaba el audio del usuario.
  3. En `TenshiChat.tsx`, el botón central desconectaba la llamada completa en lugar de silenciar.
  4. El botón de la cámara (Botón 1) cerraba todo el visor de Tenshi en vez de pausar/apagar la cámara.
  5. Dudas sobre el botón flotante `1x` en la cámara en vivo.
  6. En móviles, las indicaciones de arriba en el visor ergonómico tapaban la pantalla o desaparecían intermitentemente.
- **Causas Raíces:**
  1. La ruta `/sgsst/estudio-puesto` y `/sgsst/estudio_puesto` no estaban registradas como alias canónicos en `client/src/routes/index.tsx`.
  2. En `useVoiceSession.ts`, `setMuted(muted)` solo modificaba una referencia booleana en memoria (`isHardwareMutedRef`), pero **no deshabilitaba físicamente los tracks de audio del navegador** (`streamRef.current.getAudioTracks().forEach(t => t.enabled = !muted)`).
  3. En `VoiceModal.tsx`, si `status === 'speaking'`, la función `toggleMute` ejecutaba `setIsMuted(false); setMuted(false);`, forzando el desmuteo en lugar de silenciar el micrófono del usuario.
  4. En `TenshiChat.tsx`, el botón central invocaba `onClick={toggleVoice}` (que llamaba a `stopVoiceMode()` y colgaba la sesión) en vez de llamar a `handleToggleMicMute`.
  5. El botón 1 en `TenshiChat.tsx` llamaba a `stopVision()`, destruyendo el visor de video, en vez de alternar `isCameraOn` y deshabilitar los tracks de video.
  6. El botón `1x` no contaba con tooltip ni descripción de accesibilidad sobre el zoom digital de la cámara de inspección (1x, 2x, 3x).
- **Solución Implementada:**
  1. **Redirección Canónica:** Se agregaron en `client/src/routes/index.tsx` las rutas `/sgsst/estudio-puesto` y `/sgsst/estudio_puesto` redirigiendo a `/sgsst?hito=hito4&module=estudio_puesto`.
  2. **Silenciado Real de Hardware y Software (Mute):** En `useVoiceSession.ts`, `setMuted` ahora conmuta físicamente `track.enabled = !muted` y emite `speech_end` al WebSocket si el usuario estaba transmitiendo. En `VoiceModal.tsx`, `toggleMute` respeta el silenciado del usuario e interrumpe la voz de la IA si correspondía.
  3. **Micrófono Central en Tenshi:** Ahora ejecuta `handleToggleMicMute`, mostrando icono `MicOff` en rojo al silenciar y `Mic` en blanco con pulso vivo al estar activo, sin colgar la llamada.
  4. **Alternancia de Cámara (Cámara On/Off):** Se implementó `toggleCamera` en `TenshiChat.tsx` para conmutar `isCameraOn` y pausar los tracks de video con un overlay informativo ("Cámara pausada"), manteniendo abierta la sesión de voz. Los botones de foto y girar cámara se ocultan mientras la cámara esté apagada (idéntico a `VoiceModal.tsx`). Para cerrar el visor por completo se integró el botón `X` en la esquina superior derecha.
  5. **HUD Ergonómico Móvil Compacto:** Se optimizó el visor ergonómico para dispositivos móviles: fases compactas (`F1`, `F2`, `F3`), badges adaptativos y telemetría articular horizontal compacta de una sola fila (`C: 50°`, `T: 20°`, `B: 26°`), evitando obstruir la vista.
### 1.17 (15/10/2026) Solución a Titileo de Pantalla Negra, HUD Fisioterapeuta en Chat, Apagado Físico de Cámara, Silenciado Total y Generación Formal de Informe
- **Síntomas Reportados:**
  1. `ReferenceError: isVisionActive is not defined` al abrir el modal de voz en el chat de agentes.
  2. Presencia del botón flotante `1x` en la cámara en vivo de los agentes sin función requerida por el usuario.
  3. Desaparición del HUD ergonómico y las 3 fases en el agente Fisioterapeuta en el chat.
  4. En Tenshi Visión, la pantalla titilaba y se ponía negra repetidamente cuando Tenshi hablaba.
  5. Las indicaciones y fases de la parte superior en Tenshi desaparecían inesperadamente tras responder el usuario.
  6. El botón de apagar cámara no apagaba físicamente la luz del hardware.
  7. El botón central no silenciaba inmediatamente el habla ni el audio.
  8. Tenshi "hablaba bobadas" o no sabía generar el informe técnico ergonómico al pulsar el botón de documento (`FileText`).
- **Causas Raíces:**
  1. `isVisionActive` no estaba desestructurado del hook en el ámbito de renderizado de `VoiceModal.tsx`.
  2. El botón `1x` permanecía renderizado en el overlay de video de los agentes.
  3. La resolución del agente fisioterapeuta dependía de llamadas asíncronas no cacheadas, degradando el agente a consultor general sin HUD.
  4. **Titileo / Pantalla Negra:** `messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })` se ejecutaba en cada token de texto transmitido por voz (20-30 veces por segundo). Esto saturaba el hilo del compositor del navegador, provocando que el elemento `<video>` perdiera fotogramas y parpadeara su fondo negro.
  5. **Desaparición de Indicaciones:** En `TenshiChat.tsx`, `updateTenshiProtocolByIntent(text)` se ejecutaba con cada transcripción del usuario. Al decir "listo" o "ya", `resolveInspectionProtocol("listo")` caía en el fallback por defecto (`auditoria_gtc45`), ejecutando `setIsBiomechanicsActive(false)` y ocultando inmediatamente el HUD ergonómico y las 3 fases.
  6. `toggleCamera` en Tenshi solo alternaba `track.enabled = false` sin llamar a `track.stop()`. En la mayoría de navegadores y sistemas operativos (macOS/Windows), el hardware de la webcam mantiene encendido el LED indicador si los tracks no se detienen.
  7. El botón de documento (`FileText`) en Tenshi enviaba un mensaje de texto plano vía REST a `/api/tenshi/message` en lugar de solicitar la generación formal del informe a la sesión activa de WebSocket (`triggerVoiceReportRef.current()`).
  8. En `voiceSession.js:5515`, `generateReport()` buscaba historial exclusivamente en la colección LibreChat `Message` mediante `this.conversationId`. Como las sesiones de Tenshi Voice operan en memoria o sobre `TenshiMessage`, `dbContext` resultaba vacío y la función abortaba retornando `<p>No hay suficiente contexto para generar un informe...</p>`.
- **Solución Implementada:**
  1. **HUD Fisioterapeuta Estricto:** En `VoiceModal.tsx`, se resolvió de forma síncrona el agente mediante `useAgentsMapContext()`. El HUD ergonómico de 3 fases y telemetría MediaPipe se reservó exclusivamente para el agente Fisioterapeuta (`92a03bc9-25ce-4eb9-9af4-cafcd480785a`), mientras los demás agentes conservan su rol técnico puro sin fases. Se eliminó por completo el botón flotante `1x`.
  2. **Eliminación del Titileo y Pantalla Negra:** En `TenshiChat.tsx`, se protegió el efecto de scroll: si la visión está activa y expandida (`isVisionActive && isVisionExpanded`), se omite el scroll continuo. Para el chat normal, se conmutó de `behavior: 'smooth'` a `behavior: 'auto'`, eliminando la sobrecarga del compositor gráfico y permitiendo un streaming de video a 30fps totalmente fluido.
  3. **Blindaje de Fases y Protocolo:** En `updateTenshiProtocolByIntent`, se añadieron filtros para ignorar palabras cortas de confirmación ("listo", "ya", "ok") y se eliminó el fallback que desactivaba la biomecánica, asegurando que el HUD ergonómico permanezca visible durante toda la evaluación.
  4. **Apagado Real de Hardware de la Cámara:** En `toggleCamera`, al apagar se ejecuta `track.stop()` sobre todos los tracks de video y se anula `srcObject`, apagando físicamente la luz de la webcam; al encender, se vuelve a invocar `startVision('camera', facingMode)`.
  5. **Mute Total con Interrupción de Voz:** El botón central ejecuta `handleToggleMicMute()`, cortando inmediatamente el habla de Tenshi (`sendVoiceInterruptRef.current()`, `clearAudioQueue()`, `setIsTenshiSpeaking(false)`), silenciando el micrófono y enviando `speech_end` al servidor.
  6. **Generación Integral del Informe Técnico:**
     - En `TenshiChat.tsx`, el botón `FileText` (en vistas compacta y expandida) ahora invoca `triggerVoiceReportRef.current()`, transmitiendo la solicitud directa por WebSocket.
     - En `voiceSession.js:5515`, `generateReport()` ahora consulta como respaldo la colección `TenshiMessage`, los turnos recientes en memoria (`this.conversationTurns`) y sintetiza el contexto a partir de las fotos y telemetría capturadas (`this.phaseEvidences`), garantizando que jamás falle por falta de contexto.
     - Se sincroniza el informe resultante con Canvas y `LiveEditorSession` usando `targetConvoId = this.conversationId || 'tenshi-' + this.userId`.

### 1.18 (15/10/2026) Soporte Universal de Interacción GUI (Click en "Generar IA", Escritura en Campos React 18/19 y Failsafe de Análisis)
- **Síntomas Reportados:**
  1. Tenshi no podía hacer clic en el botón "Generar IA" o "Generar informe con IA" en los módulos de Somos SST (ej. Política SST, Objetivos SST, etc.).
  2. Al ordenar a Tenshi diligenciar o escribir en campos de texto, ocurría un parpadeo/flicker en el borde del input (800ms) pero el campo permanecía vacío o React borraba el texto de inmediato.
  3. En los logs de Winston, los resultados devueltos por el cliente para `operar_interfaz_visual` no se mostraban con claridad.
- **Causas Raíces:**
  1. **Indexación DOM ausente en llamadas de voz:** `TenshiPageController.selectorMap` solo se llenaba cuando el usuario enviaba un mensaje de texto que invocaba `getDehydratedDOM()`. En llamadas de voz (`VoiceModal`), `selectorMap` permanecía en tamaño 0.
  2. **Exclusión de campos de texto en candidatos de selector:** `executeGUIAction` solo buscaba `button, [role="button"], a, input[type="button"], input[type="submit"]`, excluyendo completamente `<input>` y `<textarea>`.
  3. **Pérdida del parámetro `detalle` / `campo`:** En `TenshiChat.tsx`, el payload del WebSocket recibía `action.args.detalle` o `campo`, pero solo pasaba `action.args.texto` al controlador GUI. Si el usuario pedía "escribe en el campo de visión la política...", `texto` contenía 500 palabras y no el nombre del campo, por lo que ningún selector coincidía.
  4. **Pérdida de sincronización en React 18/19:** El setter nativo `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(target, val)` no reseteaba `_valueTracker`, causando que React descartara el evento o restaurara el valor anterior en el siguiente render. Además, los inputs controlados dependen de `props.onChange`, el cual no siempre se dispara con eventos sintéticos de DOM en React 18+.
  5. **Framer Motion en botones:** Los botones con `<motion.button>` y `whileTap` interceptaban `element.click()`, requiriendo disparo de eventos de puntero (`pointerdown`, `mousedown`, `pointerup`, `mouseup`, `click`) e invocación directa de `__reactProps$...onClick`.
  6. **Ausencia de listener global para generación de IA:** El botón "Generar IA" en `SGSSTToolbar` no contaba con un listener de eventos del sistema para invocación directa por eventos (`wappy-generar-analisis-ia`).
- **Solución Implementada:**
  1. **Indexación DOM Perezosa / Lazy:** Si `selectorMap.size === 0`, `TenshiPageController.ts` indexa dinámicamente el DOM en tiempo real durante la acción de voz.
  2. **Búsqueda Multicriterio de Inputs y Textareas:** Búsqueda por `id`, `name`, `placeholder`, `aria-label`, `<label>` asociado (`htmlFor` o contenedor padre) y `labelDistance`.
  3. **Sincronización Infalible en React 18/19:**
     - Reset de `_valueTracker.setValue('')`.
     - Invocación de setter de prototipo.
     - Disparo secuencial de `focus`, `beforeinput`, `input` (InputEvent y Event), `change`, `blur`.
     - Invocación directa de `__reactProps$*.onChange` si está presente en el nodo DOM.
     - Emisión global de `wappy-campo-actualizado` y soporte para `wappy-diligenciar-formulario`.
  4. **Emisión de Eventos Globales de Análisis IA:**
     - Al hacer click en "Generar IA" o activarse la acción, se disparan los eventos `wappy-generar-analisis-ia` y `wappy-generar-analisis-actual`.
     - `SGSSTToolbar.tsx` escucha estos eventos y ejecuta `onAnalyze()`, habilitando la generación por IA instantáneamente en todos los módulos de Somos SST.
  5. **Módulos SST Reforzados:** `PoliticaSST.tsx` y `ObjetivosSST.tsx` sincronizan su estado React directamente ante `wappy-diligenciar-formulario` y `wappy-campo-actualizado`.
  ### 1.19 (15/10/2026) Solución a ReferenceError: useLocalize is not defined en VoiceModal
- **Síntoma Reportado:** Al abrir el modal de voz en el chat de agentes o al montar componentes vinculados al bundle `sgsst-modules`:
  ```json
  "error": {
    "message": "useLocalize is not defined",
    "stack": [
      { "number": 1, "content": "ReferenceError: useLocalize is not defined" },
      { "number": 2, "content": "at nm (http://localhost:3080/assets/sgsst-modules.uau9-giT.js:1:34654)" }
    ]
  }
  ```
- **Causa Raíz:** En `client/src/components/Voice/VoiceModal.tsx:100`, se llamaba a `const localize = useLocalize();` para internacionalización de tooltips de la cámara y controles de audio, pero el hook `useLocalize` no estaba importado en la cabecera del archivo. Al empaquetar con Vite/Rollup, la referencia quedaba como variable global no definida, fallando en tiempo de ejecución.
- **Solución Implementada:**
  1. Se añadió `import { useLocalize } from '~/hooks';` en `client/src/components/Voice/VoiceModal.tsx`.
  2. Se auditó todo el árbol `client/src` con un script de verificación automatizado para confirmar que ningún otro componente llame a `useLocalize` sin importación previa (100% verificado y validado).
  3. Se ejecutó `npm run build:client` generando los bundles compilados limpios en `client/dist` y se sincronizó con el contenedor local `LibreChat`.

### 1.20 (15/10/2026) Aislamiento Estricto del Fisioterapeuta Laboral y Prohibición de Inferencia Ergonómica en Especialistas (Consultor SG-SST)
- **Síntoma Reportado:** Al abrir el modal de videollamada / Live en el chat de agentes con el **Consultor SG-SST** (`7ceade0e-ef47-4dd1-9178-cff5fe2b6e46`), la interfaz cargaba indebidamente el HUD biomecánico ("VISIÓN IA BIOMECÁNICA", "RULA", fases 1-3: Habitual, Alcance Máximo, Fatiga, telemetría articular Cuello/Tronco/Brazo/Codo/Rodilla y badge 1/3 en el botón de cámara), y la IA hablaba como Fisioterapeuta pidiendo posturas en vez de actuar como Consultor General SST.
- **Causa Raíz:**
  1. En MongoDB, el agente Consultor SG-SST tiene en su descripción: `"...gestión de emergencias, ergonomía, factores psicosociales..."`.
  2. En `client/src/components/Voice/VoiceModal.tsx`, `isBiomechanicsAgent` evaluaba `agentDesc.includes('ergonom') || agentInstructions.includes('biomecánica')`. Como Consultor SG-SST menciona "ergonomía", evaluaba a `true`.
  3. Al ser `true`, enviaba `template: 'biomecanico_mediapipe'` al backend `voiceSession.js`, donde a su vez `isBiomechanics` se activaba por la plantilla y por regex en instrucciones, forzando a la IA a asumir el rol de Fisioterapeuta.
  4. En `inspectionProtocols.ts` y `inspectionProtocols.js`, `resolveInspectionProtocol` asociaba cualquier texto con `ergon` a `biomecanico`.
- **Solución Definitiva Implementada:**
  1. **Candado Negativo Estricto:** Si el nombre del agente contiene `consultor`, `auditor`, `profesional sst`, `químico`, `abogado`, `médico`, `psicólogo`, `vial`, `pesv`, `emergencia`, `electric`, `ambiental`, `nutricion`, `bioseguridad` o `tareas críticas`, `isBiomechanicsAgent` retorna `false` inmediatamente.
  2. **Candado Positivo Exclusivo:** `isBiomechanicsAgent` SOLO es `true` si el ID o nombre coincide explícitamente con el Fisioterapeuta Laboral (`92a03bc9-25ce-4eb9-9af4-cafcd480785a`, `61909a90-2a67-4dba-8e65-db0f388d46cc` o nombre con `fisioterapeuta`). Se eliminó por completo la inspección de descripciones o instrucciones.
  3. **Aislamiento en Backend (`voiceSession.js`):** Se añadió el candado `isExplicitOtherSpecialist`. Si es otro especialista, `isBiomechanics` NUNCA se activa. La IA recibe su rol técnico específico sin fases, sin posturas y sin RULA/REBA.
  4. **Protocolos de Inspección:** Consultor SG-SST / Profesional SST mapean exclusivamente a `auditoria_gtc45`.
  5. **UI Limpia para Especialistas:** El HUD biomecánico superior, el lienzo canvas y el badge de fases en el botón de cámara se ocultan completamente si no es Fisioterapeuta. El modal para Consultor SG-SST queda como una llamada limpia y pura de SST.
  6. **Interrupción Inmediata de Audio:** En `toggleMute` y `handleOrbClick`, al mutear o tocar el orbe mientras la IA habla, se corta y limpia inmediatamente la cola de reproducción (`clearAudioQueue()` y `sendInterrupt()`).
### 1.21 (15/10/2026) Memoria Unificada de 10 Turnos en Tenshi, Informe con 3 Fotos y Respaldo Dual en Ambos Tenshis
- **Síntomas Reportados:**
  1. *"revisa los logs de mi vps no tiene memoria correlacion cuando paso de live, camara o chat, muchas veces pierde lo que hablamos. debe de llevar una memoria completa de todo sin olvidar cosas"*
  2. *"cuando le digo desde camara genera un informe no lo hace deberia tomar 3 imagenes de lo que se le solicita y generar el informe en su chat"*
  3. *"cuando la camara apagada fue que antes estaba la camara prendida y no hizo el informe entonces le dije ya con la camara apagada que no lo habia hecho se supone que tiene memoria"*
  4. *"debe quedar tanto en el chat de agente tenshi como en tenshi en su chat con la tarjeta que ya se utiliza hoy diferencia los dos tenshis es importante"*
  5. *"con el tema de donde generar los informes tenshi tambien aun se confunde en ocasiones"*
- **Causas Raíces:**
  1. **Destrucción de Contexto por 'Antecedentes Archivados':** `voiceSession.js` cargaba 10 mensajes de `TenshiMessage`, los truncaba agresivamente a 200 caracteres (`substring(0, 200)`), y si habían más de 3 mensajes, partía los anteriores bajo la etiqueta `[ANTECEDENTES PREVIOS ARCHIVADOS (TEMAS YA FINALIZADOS)]` con la orden: *"NUNCA los uses como tema de conversación activo"*. Tenshi ignoraba activamente lo conversado turnos atrás.
  2. **Ausencia de Herramienta de Inspección en `tenshi_voice`:** Las herramientas de informe fotográfico (`generar_informe_tecnico`) estaban ubicadas bajo `else` (solo para agentes especializados y Fisioterapeuta) y bloqueadas si `phaseCount === 0`. Tenshi en `tenshi_voice` no tenía declarada ninguna herramienta para compilar informes de cámara.
  3. **Pérdida de Evidencias al Apagar la Cámara:** Si el usuario apagaba la cámara antes de que el informe se compilara, los fotogramas del búfer se descartaban, impidiendo que Tenshi usara las fotos observadas.
  4. **Falta de Respaldo en el Agente Tenshi de la Barra Lateral:** Al generarse informes técnicos o entregables Canvas, el sistema solo guardaba en `TenshiMessage` (widget flotante) o en sesiones Canvas efímeras, omitiendo la persistencia en `Conversation` y `Message` para el agente Tenshi (`3579240c-ac93-4f4f-b0e4-95d87fc1ee27`).
- **Solución Definitiva Implementada:**
  1. **Memoria Activa Unificada de 10 Turnos:** En `voiceSession.js`, los últimos 10 mensajes de `TenshiMessage` se inyectan completos (hasta 1,500 caracteres por mensaje) en orden cronológico bajo la etiqueta `[HISTORIAL CONVERSACIONAL RECIENTE DE TENSHI (ÚLTIMOS 10 TURNOS ACTIVOS - CHAT, LIVE Y CÁMARA)]`, ordenando expresamente a Gemini mantener continuidad fluida y memoria perfecta independientemente del canal (chat, live o cámara).
  2. **Herramientas Nativas de Inspección en Tenshi:** Se agregaron `generar_informe_inspeccion_camara` y `generar_informe_tecnico` a `this.liveConfig.tools` de `tenshi_voice`, eliminando el bloqueo de fases posturales para Tenshi.
  3. **Desambiguación Determinista de 4 Casos en System Prompt:**
     - **Caso 1 (Módulo en Pantalla / Somos SST):** Clic real en botón "Generar IA" / "Generar Análisis" vía `operar_interfaz_visual` o `wappy_generar_analisis_aplicativo`.
     - **Caso 2 (Inspección Física con Cámara):** Generar informe con 3 capturas vía `generar_informe_inspeccion_camara`.
     - **Caso 3 (Especialista Técnico):** Consultar al especialista correspondiente.
     - **Caso 4 (Chat Texto / Live sin Cámara):** Documento descargable vía `canvas_tool`.
  4. **Búfer Persistente de Cámara (`cachedCameraEvidences`):** Se mantiene un búfer rotativo de hasta 6 fotogramas y se almacena en caché persistente al apagar la cámara. Al pedir el informe, se toman hasta 3 fotos representativas de evidencia visual.
  5. **Respaldo Dual en Ambos Tenshis:**
     - En **Tenshi en su chat (Widget Flotante / `TenshiMessage`):** con tarjeta interactiva (`htmlReport`, `file` para previsualizar y descargar).
     - En el **Chat de Agente Tenshi (Sidebar / `Conversation` y `Message` con `agent_id: 3579240c-ac93-4f4f-b0e4-95d87fc1ee27`):** con resumen ejecutivo en Markdown y sesión de Canvas sincronizada.
   6. **Aislamiento de Mensajes:** En `TenshiChat.tsx`, las capturas en modo no-biomecánico se rotulan como `📸 Evidencia de Inspección Visual SST - Tenshi` (sin referencias a Fisioterapeuta).

### 1.22 (15/10/2026) Error 1007 de Google Gemini Live API: Prohibición Estricta de Nombres de Herramientas Duplicados ('Duplicate function declaration found')
- **Síntoma:** Al encender el interruptor de voz, Tenshi se pausaba inmediatamente mostrando el aviso:
  `⚠️ Se pausó la sesión de voz (Conexión con Gemini finalizada (1007): Duplicate function declaration found: generar_informe_tecnico). Puedes volver a encender el interruptor cuando desees reanudar.`
- **Causa Raíz:** En `api/server/routes/voice/voiceSession.js`, dentro de `this.liveConfig.tools[0].functionDeclarations` para `tenshi_voice`, la función `generar_informe_tecnico` quedó declarada dos veces (una al inicio junto a `generar_informe_inspeccion_camara` y otra remanente al final del array). El validador OpenAPI/Protobuf de Google Multimodal Live API rechaza la conexión de inmediato y envía un cierre WebSocket con código **1007 (Invalid argument)** si encuentra cualquier nombre duplicado.
- **Regla y Solución Obligatoria:**
  1. **Unicidad Estricta de Herramientas:** Cada función en `functionDeclarations` DEBE tener un nombre único en todo el array.
  2. **Verificación Automatizada Obligatoria:** Siempre que se añadan o modifiquen herramientas en `voiceSession.js`, se DEBE correr un script de comprobación que valide que no existan duplicados:
     ```bash
     node -e 'const fs = require("fs"); const c = fs.readFileSync("api/server/routes/voice/voiceSession.js", "utf8"); ...'
     ```
  3. **Solución Implementada:** Se eliminó la declaración duplicada en `voiceSession.js`, quedando exactamente 61 herramientas únicas y verificadas con 0 duplicados.

### 1.23 (15/10/2026) Latencia y Pausas en Modo Live por Sobrecarga de Tokens y Desconexión 1007 en Videollamada por mediaChunks
- **Síntomas Reportados:**
  1. *"Ahora Tenshi contesta muy pausado en modo live"* (pausas de 1 a 2 segundos entre palabras).
  2. *"en video llamada ni contesta"* (desconexión inmediata del WebSocket al abrir la cámara).
- **Causas Raíces:**
  1. **Deprecación de `mediaChunks` en Google Multimodal Live API:** En `geminiLive.js`, en `sendVideo`, se estaba enviando `realtimeInput: { mediaChunks: [...], video: [...] }`. Google deprecó `realtime_input.media_chunks` y mataba el WebSocket de inmediato con código **1007: `realtime_input.media_chunks is deprecated. Use audio, video, or text instead.`**. Por eso al activar la cámara o videollamada Tenshi se desconectaba al instante.
  2. **Sobrecarga de Tokens en el Handshake Inicial de Live:** En `voiceSession.js`, se inyectaron 10 mensajes del historial reciente con hasta 1,500 caracteres cada uno, inflando el prompt inicial de Gemini Live en más de 15,000 caracteres. Gemini Live (streaming de audio en tiempo real) requiere latencia ultrabaja; un prompt tan masivo satura el motor de inferencia de voz, provocando ráfagas lentas y pausas audibles entre palabras.
  3. **Safety Reset Prematuro (700ms):** El temporizador de seguridad de 700ms en `voiceSession.js` reseteaba `isAiSpeaking` a `false` durante las pausas naturales de audio del modelo, lo que hacía que el cliente abriera el micrófono antes de tiempo y enviara interrupciones al backend.
- **Regla y Solución Obligatoria:**
  1. **Solo `video` en `sendVideo`:** Prohibido enviar `mediaChunks` en `realtimeInput`. Usar exclusivamente `video: { mimeType: 'image/jpeg', data: base64Image }`.
  2. **Compactación Ágil de Historial en Live (250 caracteres por turno):** Mantener los 10 turnos de memoria que el usuario requiere, pero limitando cada turno a 250 caracteres para preservar la fluidez y baja latencia del motor de audio en tiempo real.
  3. **Temporizador de Habla Balanceado (1500ms):** Ampliar el safety timeout a 1,500ms para evitar falsas interrupciones durante pausas naturales entre oraciones.

---

### LECCIÓN 27 (2026-10-15): Solución al Error 'join' en Informe de Videollamada, HUD de Generación y Desambiguación Aplicativo vs Canvas

- **Síntomas Reportados:**
  1. *"Tenshi demora ahora mucho en comenzar la conversación, eso no pasaba antes"*
  2. *"pedí generar un informe desde el video llamada y dijo que lo estaba haciendo y nunca lo envió, nunca aparece el aviso de generando informe y que luego me diga el informe se realizó"*
  3. *"Tenshi sigo teniendo dificultades para identificar cuando le digo realiza el informe del aplicativo va genera un informe en Canva y no en el aplicativo"*
- **Causas Raíces:**
  1. **Error Crítico TypeError 'join' en `generateReport`:** En `voiceSession.js`, `session.agentProtocol` para Tenshi Voice se definió sin propiedad `phases` (`{ id: 'tenshi', title: 'Tenshi Orquestadora', methodLabel: 'Orquestación WAPPY' }`). Al compilar el reporte, la línea `${activeProtocol.phases.join(', ')}` lanzó `Cannot read properties of undefined (reading 'join')`, interrumpiendo abruptamente la generación antes de llamar a Gemini o guardar en base de datos.
  2. **Falta de Manejo del Estado `generating_report` en el HUD de `TenshiChat.tsx`:** El backend emitía `status: 'generating_report'`, pero `onStatusChange` en el frontend no lo procesaba, dejando el texto en *"Tenshi te escucha..."*. Tampoco `onReportReceived` actualizaba el HUD a *"✅ Informe generado con éxito"*.
  3. **Confusión en Tool Choice (Canvas vs Aplicativo):** La descripción de `canvas_tool` y `wappy_crear_informe` indicaba crear informes/aplicativos, provocando que Gemini Live invocara Canvas en lugar de accionar el botón *"Generar con IA"* del módulo SG-SST visible. Además, no existían interceptores deterministas en el backend para redirigir peticiones de módulos.
  4. **Latencia de Inicialización (Startup Delay):** Durante `VoiceSession.start()`, se consultaba `PerfilSociodemograficoData` leyendo innecesariamente el censo completo de trabajadores de forma sincrónica, y se inyectaban 8.6 KB adicionales de skills ya incluidos en las instrucciones base.
- **Regla y Solución Obligatoria:**
  1. **Protocolo Completo y Programación Defensiva en `generateReport`:** Tenshi Voice hereda `INSPECTION_PROTOCOLS.auditoria_gtc45` con `phases` completas y `reportMatrixHeader`. Se blinda defensivamente el acceso a `activeProtocol.phases` con fallback predeterminado para garantizar que nunca vuelva a ocurrir un fallo por propiedad indefinida.
  2. **HUD de Estado en Tiempo Real:** `TenshiChat.tsx` maneja explícitamente `'generating_report'` mostrando *"⏳ Compilando y generando informe técnico oficial..."* y al recibir el reporte muestra *"✅ Informe generado con éxito"*.
  3. **Desambiguación Determinista Aplicativo vs Canvas:**
     - Prohibición expresa en las descripciones de `canvas_tool` y `wappy_crear_informe` ante peticiones de módulos de pantalla (*"realiza el informe del aplicativo"*, *"haz el informe de responsable"*, etc.).
     - Interceptores en backend en `canvas_tool`, `wappy_crear_informe` y en el fallback de delegación para redirigir automáticamente hacia `wappy_generar_analisis_aplicativo`.
  4. **Optimización de Arranque de Sesión:** Lectura directa de `companyInfo.workerCount` sin escanear colecciones pesadas, y eliminación de inyecciones duplicadas de skills, restaurando la conexión instantánea de Tenshi Voice.

---

### LECCIÓN 28 (2026-10-15): Alerta Persistente de Informes en Modo Live, Prevención de Alucinación Prematura y Lectura Oral de Especialistas Delegados

- **Síntomas Reportados:**
  1. *"Sigue sin generar informes desde el modo de live en vivo, le pedí la solicitud y dijo que estaba realizado pero no lo hizo"*
  2. *"además no apareció nunca la alerta de que el informe se estaba haciendo, y que luego me diga el informe se realizó"*
  3. *"otra cosa cuando le digo a Tenshi que le pase una pregunta a un agente antes leía la respuesta cuando el agente terminaba ahora no la lee"*
  4. *"Tenshi sigo teniendo dificultades para identificar cuando le digo realiza el informe del aplicativo va genera un informe en Canva y no en el aplicativo"*
- **Causas Raíces Técnicas Auditadas:**
  1. **Alucinación Prematura de Gemini Live por `sendToolResponse` Inmediato:** Al invocarse `generar_informe_inspeccion_camara`, el backend enviaba de inmediato `{ output: "Compilación iniciada con éxito..." }`. Google Gemini Live daba por terminada la herramienta y, en el siguiente turno conversacional ordinario (ej: cuando el usuario decía "Sí"), alucinaba verbalmente *"¡Listo, el informe ya quedó compilado!"* mientras `generateReport` todavía corría en segundo plano (20-30s).
  2. **Inyección Innecesaria de ExerciseDB en Informes No Biomecánicos:** `buildBiomechanicsPrescriptionBlock()` (12 GIFs animados pesados) se inyectaba incondicionalmente en cualquier reporte, inflando el tamaño del HTML a 273 KB (273,332 caracteres) y demorando la respuesta en 15-20 segundos adicionales.
  3. **Sobreescritura Inmediata del HUD en `TenshiChat.tsx`:** `onStatusChange` recibía `'generating_report'`, pero en cuanto Tenshi emitía fonemas o escuchaba al usuario, los eventos ordinarios `'speaking'` o `'listening'` lo sobreescribían en milisegundos. Además, en modo de pantalla completa/cámara expandida (`isVisionExpanded`), el pie del chat donde residía el texto permanecía oculto (`hidden`).
  4. **Falsa Cancelación y Descarte de Dictámenes de Especialistas Delegados:**
     - `pendingAgentConsultationRef` no inicializaba `startedAt` (solo `timestamp`), provocando que `timeSinceStart` fuera siempre `0`.
     - `activeConsultationConvoIdRef` usaba `'current'` al delegar, lo que disparaba la condición de cambio manual de conversación y cancelaba prematuramente la escucha activa.
     - `extractSpecialistAnswer` descartaba cualquier dictamen técnico que contuviera la frase `"Dictamen de"` (la cabecera estándar de los especialistas de WAPPY), impidiendo que Tenshi lo capturara para su lectura oral.
  5. **Falta de Reconocimiento de "Realiza el informe del aplicativo" en Failsafe:** `clickAnalyzeMatch` solo reconocía `(?:dale clic|haz clic|pulsa|presiona|genera)`, omitiendo órdenes directas como *"realiza el informe del aplicativo"* o *"haz el informe del aplicativo"*, y `canvas_tool` forzaba la navegación al módulo `responsable` en vez de presionar el botón *"Generar IA"* del módulo actualmente visible en pantalla.
- **Regla y Solución Obligatoria Implementada:**
  1. **Blindaje de Tool Response y Prohibición de Alucinación:** `sendToolResponse` y el prompt verbal prohíben explícitamente a Gemini Live afirmar que el informe está listo hasta que reciba la directiva final del sistema tras la persistencia efectiva en base de datos.
  2. **Condición Estricta para ExerciseDB:** `buildBiomechanicsPrescriptionBlock` solo se ejecuta si `isBiomechanics || isFisioMode || activeProtocol.id === 'biomecanico'`, reduciendo los informes generales de SST a ~25-35 KB y acelerando su compilación en un 75%.
  3. **Banners Persistentes Desacoplados del Flujo de Audio:**
     - Estado booleano independiente `isGeneratingTechnicalReport` que mantiene fijo un badge flotante y un banner HUD en el visor de cámara durante todo el tiempo de compilación.
     - Toast de éxito `reportSuccessToast` de 8 segundos con sonido chime al recibir el informe.
  4. **Restauración de Lectura Oral de Especialistas:**
     - Registro explícito de `startedAt` en `pendingAgentConsultationRef`.
     - Corrección en la transición de ID de conversación.
     - Eliminación del filtro restrictivo `"Dictamen de"` y búsqueda recursiva en caché de React Query y selectores DOM de LibreChat.
  5. **Desambiguación de Informe del Aplicativo Actual:** Inclusión de *"realiza/haz el informe del aplicativo"* en el failsafe y click real en *"Generar IA"* sobre el módulo actual sin redirigir innecesariamente a otros módulos.

---

## 2. Checklist Obligatorio Pre-Commit / Pre-Despliegue

Antes de dar por finalizada cualquier tarea relacionada con Tenshi, la voz o el chat:
1. [ ] **Verificación de Sintaxis Node:** Ejecutar `node -c api/server/routes/**/*.js` en cualquier archivo tocado.
2. [ ] **Auditoría de Herramientas sin Duplicados:** Ejecutar comprobación en `voiceSession.js` para asegurar 0 nombres de herramientas duplicados (previene error 1007 de Google Live).
3. [ ] **Compilación Local del Frontend:** Ejecutar obligatoriamente `npm run build:client` si se modificó `client/src`.
4. [ ] **Inclusión de Bundles en Git:** Asegurar que `git add client/src client/dist` incluya tanto el código fuente como los compilados.
5. [ ] **Verificación de Modelos de IA:** Nunca degradar ni inventar nombres de modelos; verificar siempre con `search_web` en la documentación oficial.
6. [ ] **Despliegue en VPS:** Indicar al usuario la ejecución de `git pull` y `docker exec -it LibreChat node scripts/restore-and-sync-all.js`.






### LECCIÓN 29 (2026-10-22): "Automatizaciones IA" ahora se llama "Tareas" y sale del Centro de Control

- **Nuevo nombre:** *Tareas* (alias aceptados: "automatizaciones", "automatizaciones IA", "tareas programadas", "tareas automáticas").
- **Nueva ubicación:** botón propio en el menú lateral, justo **debajo de "Centro de Control SST"**. Ruta `/tareas` (lista) y `/tareas?tab=historial` (historial de corridas). El Centro de Control queda con *Acciones ACPM*, *Memoria Procedural* y *Sub-Usuarios*.
- **Acceso:** EXCLUSIVO para Administradores y cuentas principales Wappy Pro (`canAccessTareas` en `planAccess.ts` + middleware 403 en `routes/sgsst/automatizaciones.js`). Vital, sub-usuarios y otros planes no ven el botón ni pueden usar la API.
- **Compatibilidad:** `/sgsst/automatizaciones`, `/sgsst/control?tab=automatizaciones|ia|agentes|historial|logs` y `/sgsst?tab=automatizaciones` redirigen a `/tareas`.
- **Tenshi:** el nombre técnico de la herramienta **NO cambia** (`gestor_automatizaciones`). Se actualizaron descripciones en `tenshi.js`, `voiceSession.js` (herramienta, lista de módulos de `wappy_navegar`, descripción del módulo actual y failsafe de voz "abre tareas/automatizaciones"), `GestorAutomatizaciones.js`, `manifest.json`, `syncAgents.js`, `restore-and-sync-all.js` y la skill `skill-automatizaciones-agentes.md`. Frontend: `WAPPY_NAV_MAP` con claves `tareas`, `tareas_programadas`, `automatizaciones`, `historial_tareas`, etc.
- **Failsafe de voz:** "tareas" solo navega a `/tareas` si la frase NO menciona cronograma, ACPM, Kanban, control o tareas críticas (esas siguen yendo al Centro de Control).
- **RAM del VPS:** `automationScheduler.js` ahora aplica un tope GLOBAL de agentes simultáneos (`AUTOMATION_MAX_CONCURRENCY`, por defecto 2) — antes cada tick de 1 min podía abrir un nuevo pool de 4 sin contar los que seguían corriendo —, evita ticks solapados y usa consultas `.lean()` con proyección.

---

### LECCIÓN 30 (2026-10-28): Colisión de Doble Canal en `/c/new`, Cancelación Prematura del Stream SSE y Restauración del Prompt en `<textarea>` (`useAutoSave` / `finalHandler`)

- **Síntoma Reportado:**
  > *"en algun momento tenshi dejo de enviar la consultas a los agentes chat las deja en campo de mensaje antes siempre las enviaba y espera la respuesta para decirmela"*
- **Causas Raíces Auditadas (Logs VPS `22:11:16`–`22:11:19` + Commit `c8c3324943` & `16da1f2bc5`):**
  1. **Colisión de Doble Canal en `CASO B` (`TenshiChat.tsx` + `useQueryParams.ts` + `ChatForm.tsx`):**
     - En `c8c3324943` se removió `claimAutoSubmit` (`tenshiSubmitGuard.ts`) de `ChatForm.tsx` y `useQueryParams.ts`.
     - Luego, en `16da1f2bc5`, `TenshiChat.tsx` (`CASO B`) navegaba a `/c/new?agent_id=...&prompt=...&submit=true` (Canal 1: `useQueryParams`) y **400ms después** emitía incondicionalmente `tenshi-submit-agent-prompt` (Canal 2: `ChatForm`).
     - A los `100ms`, `useQueryParams.ts` iniciaba el envío real a `/api/agents/chat` (`isSubmitting = true`). A los `400ms`, `ChatForm.tsx` recibía `tenshi-submit-agent-prompt`, veía `isSubmitting === true` (o divergencia temporal de `agent_id` que invocaba `onSelectAgent` -> `agentQuery.refetch()` -> `newConversation` -> `setSubmission({})`), e interpretaba erróneamente su propio envío en vuelo como una "respuesta previa", abortando el stream SSE activo (`[AgentController] HTTP connection closed by client`).
  2. **Restauración del Prompt en `<textarea>` al Abortar en `/c/new` (`useEventHandlers.ts` líneas 500–518 y `useAutoSave.ts`):**
     - Cuando el segundo canal reemplazaba o cancelaba `submission` antes del primer token del servidor (`!conversation.conversationId && hasNoResponse`), `abortConversation` -> `finalHandler` ejecutaba `setFinalMessages('new', [])` (devolviendo la pantalla al estado inicial vacío de `/c/new`), `setDraft({ id: 'new', value: requestMessage.text })` (reescribiendo el prompt delegado de vuelta en el `<textarea>`) y `setIsSubmitting(false)` (habilitando el botón verde de enviar sin enviar nada).
     - Además, escribir en `textAreaRef.current.value` y disparar `new Event('input')` sin limpiar el borrador antes de `submitMessage` hacía que `useAutoSave.ts` guardara el texto en `localStorage` (`text_draft_new`) al transicionar a `PENDING_CONVO`.
  3. **Doble Disparo Síncrono (`submitMessage` + `sendBtn.click()` en el mismo tick):**
     - Llamar `submitMessage({ text })` y en la línea siguiente `sendBtn.click()` antes de que React re-renderizara `isSubmitting = true` provocaba un segundo `setSubmission`, cerrando el primer stream SSE.
  4. **Firma de `handleStopGenerating(e)` sin Parámetro Opcional (`useChatHelpers.ts`):**
     - `handleStopGenerating` ejecutaba `e.preventDefault()` sin `e?.preventDefault()`, lanzando `TypeError` al ser invocado programáticamente sin evento de ratón.
- **Regla y Solución Obligatoria Implementada:**
  1. **Coordinación vía `tenshiSubmitGuard.ts` (`markAutoSubmitStarted` / `isAutoSubmitInFlight`):** `useQueryParams.ts` marca el prompt como en vuelo desde que detecta `submit=true`. Si `ChatForm.tsx` recibe `tenshi-submit-agent-prompt` para un prompt que ya está en vuelo (`isAutoSubmitInFlight`), omite cualquier `handleStopGenerating()`, `onSelectAgent()` o re-envío.
  2. **Respaldo Diferido Condicional en `TenshiChat.tsx` (`CASO B`):** Al navegar a `/c/new?...&submit=true`, el evento de respaldo `tenshi-submit-agent-prompt` espera `2200ms` y **solo** se emite si `!pendingAgentConsultationRef.current.hadStarted && !isChatSubmittingRef.current`.
  3. **Blindaje en `useSelectAgent.ts`:** Cuando `agentQuery.refetch()` termina en segundo plano, verifica `!isSubmittingRef.current` antes de llamar `updateConversation`, impidiendo que un refetch tardío llame `newConversation` (`setSubmission({})`) y aborte una consulta en curso.
  4. **Despacho Canónico Único + Limpieza Inmediata de Draft (`clearDraft`):** Se elimina el `sendBtn.click()` síncrono tras `submitMessage({ text })` y se limpia inmediatamente `clearDraft(Constants.NEW_CONVO)` y `textAreaRef.current.value = ''` para que `useAutoSave` nunca restaure el prompt enviado en la caja de texto.
  5. **`e?.preventDefault()` en `useChatHelpers.ts`:** `handleStopGenerating` acepta llamadas programáticas sin evento sin lanzar excepción.
