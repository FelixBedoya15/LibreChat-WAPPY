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

---

## 2. Checklist Obligatorio Pre-Commit / Pre-Despliegue

Antes de dar por finalizada cualquier tarea relacionada con Tenshi, la voz o el chat:
1. [ ] **Verificación de Sintaxis Node:** Ejecutar `node -c api/server/routes/**/*.js` en cualquier archivo tocado.
2. [ ] **Compilación Local del Frontend:** Ejecutar obligatoriamente `npm run build:client` si se modificó `client/src`.
3. [ ] **Inclusión de Bundles en Git:** Asegurar que `git add client/src client/dist` incluya tanto el código fuente como los compilados.
4. [ ] **Verificación de Modelos de IA:** Nunca degradar ni inventar nombres de modelos; verificar siempre con `search_web` en la documentación oficial.
5. [ ] **Despliegue en VPS:** Indicar al usuario la ejecución de `git pull` y `docker exec -it LibreChat node scripts/restore-and-sync-all.js`.


