# ⚠️ DOCUMENTO CRÍTICO - Lo Que NO Se Debe Cambiar

## ❌ Cambios Que ROMPEN La Funcionalidad

### 1. **responseModalities**
```javascript
// ❌ NUNCA CAMBIAR ESTO:
responseModalities: ['AUDIO']

// ❌ SI AGREGAS TEXT, LA IA DEJA DE RESPONDER COMPLETAMENTE:
responseModalities: ['AUDIO', 'TEXT']  // ← ROMPE TODO
```

**Resultado si cambias:** La IA se conecta pero nunca responde (ni audio ni texto).

---

### 2. **VAD / automaticActivityDetection**
```javascript
// ❌ INTENTADO Y RECHAZADO POR GEMINI:
realtimeInputConfig: {
    automaticActivityDetection: {
        enabled: true  // ← API lo rechaza con error 1007
    }
}
```

**Resultado:** WebSocket cierra con error "Unknown name 'enabled'".

**Nota:** VAD parece estar HABILITADO POR DEFECTO sin necesidad de configuración.

---

### 3. **Transcripción de Audio**

#### Estado Actual del Problema:
- `outputAudioTranscription: {}`  → Transcribe lo que la IA dice (NO lo que queremos)
- `inputAudioTranscription: {}`   → **NO funciona** (debería transcribir al usuario pero no lo hace)

**Intentos realizados:**
- ✅ `outputAudioTranscription` funcionaba (pero transcribía a la IA)
- ❌ `inputAudioTranscription` NO transcribe nada

**Pendiente:** Investigar por qué `inputAudioTranscription` no funciona.

---

## ✅ Lo Que SÍ Funciona Actualmente

### Configuración Base que Funciona:
```javascript
const setupMessage = {
    setup: {
        model: `models/${this.config.model}`,
        generationConfig: {
            responseModalities: ['AUDIO'],  // NO CAMBIAR
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: 'Kore',
                    },
                },
            },
        },
        systemInstruction: {
            parts: [{
                text: 'SOLO responde cuando el usuario te hable...'
            }],
        },
        // PROBLEMA: inputAudioTranscription no funciona
        // outputAudioTranscription sí funcionaba pero transcribe a la IA
    },
};
```

### Funcionalidades que Funcionan:
1. ✅ **Conexión WebSocket** - Cliente ↔ Servidor ↔ Gemini
2. ✅ **Captura de audio** - El micrófono captura voz del usuario
3. ✅ **Reproducción de audio** - La IA responde con voz
4. ✅ **Guardado de mensajes** - Se guardan al completar turno
5. ✅ **Filtro de pensamientos** - Los "thinking" en inglés se filtran
6. ✅ **Indicador de voz** - "🎤 [Respuesta de voz]" se guarda
7. ✅ **Con audífonos** - NO hay feedback de audio

---

## 🔴 Problemas Persistentes

### 1. **Transcripción del Usuario NO Funciona**
**Síntoma:** Se envía audio, la IA responde, pero NO se transcribe lo que el usuario dice.

**Logs:**
```
[VoiceSession] Accumulated user text length: 0
[VoiceSession] No user transcription to save
```

**Causa:** `inputAudioTranscription: {}` no está funcionando (razón desconocida).

### 2. **IA Se Inicia Sola**
**Síntoma:** Al abrir el modal, la IA empieza a hablar sin que el usuario diga nada.

**Posible causa:** System instruction o falta de configuración de inicio de turno.

### 3. **Modal No Se Cierra**
**Síntoma:** Al dar click en el botón X, el modal no se cierra.

**Código actual:** `handleClose` → `disconnect()` → `onClose()` (se ve correcto).

**Posible causa:** Componente padre no actualiza estado `isOpen`.

### 4. **Mensajes No Aparecen en Chat**
**Síntoma:** Los mensajes se guardan en la base de datos pero NO aparecen en la UI.

**Causa:** El `queryClient.invalidateQueries` no se está disparando correctamente.

---

## 📝 Configuraciones que Rompí

### Lo Que Funcionaba ANTES y Rompí:

1. **outputAudioTranscription funcionaba** (transcribía la IA, pero al menos funcionaba)
   - Lo cambié a `inputAudioTranscription`
   - Ahora NO transcribe NADA

2. **System instruction menos restrictivo**
   - Antes: "Identifica riesgos... analiza..."
   - Ahora: "SOLO responde cuando el usuario te hable"
   - Efecto: IA sigue hablando sola igualmente

---

## 🎯 Próximos Pasos Sugeridos

### Opción 1: REVERTIR a Configuración Anterior
Volver a `outputAudioTranscription` para que al menos transcriba algo (aunque sea la IA).

### Opción 2: Investigar Documentación Oficial
Buscar EJEMPLOS COMPLETOS de configuración de Gemini Live API con transcripción de usuario.

### Opción 3: Usar el Código del Repositorio de Referencia
Copiar la configuración EXACTA del repositorio `google-gemini/live-api-web-console`.

---

## 🚫 Reglas de Oro

1. **NO cambiar `responseModalities`** sin confirmar que funciona
2. **NO agregar configuraciones** sin verificar en documentación oficial
3. **DOCUMENTAR cada cambio** antes de hacerlo
4. **PROBAR cada cambio** individualmente antes de hacer otro
5. **REVERTIR inmediatamente** si algo se rompe

---

## 📊 Estado Actual (2025-11-24 18:37)

**Lo que funciona:**
- Conexión WebSocket ✅
- Audio del usuario se captura ✅
- IA responde con voz ✅
- Con audífonos, no hay feedback ✅
- Filtro de pensamientos funciona ✅

**Lo que NO funciona:**
- Transcripción del usuario ❌
- IA habla sola ❌
- Modal no cierra ❌
- Mensajes no aparecen en UI ❌
- Conversación no se muestra como texto ❌

**Configuración actual:**
- `responseModalities: ['AUDIO']`
- `inputAudioTranscription: {}` (NO funciona)
- System instruction: "SOLO responde cuando..."
