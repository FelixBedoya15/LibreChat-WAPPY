# Opciones para Transcripción Automática de Audio de IA

## Problema Actual
- ✅ La transcripción del USUARIO funciona (usa `outputAudioTranscription` de Gemini)
- ❌ La IA solo envía AUDIO, NO texto (con `responseModalities: ['AUDIO']`)
- ❌ Agregar `'TEXT'` rompe completamente la IA (deja de responder)

## Opciones Disponibles

### Opción 1: Google Cloud Speech-to-Text API
**Pros:**
- ✅ Alta precisión
- ✅ Soporta español nativamente
- ✅ Se integra bien con Gemini (mismo proveedor)

**Contras:**
- ❌ Requiere configurar API key de Google Cloud
- ❌ Costo por uso (aunque minimal)

**Implementación:**  
Backend transcribe el audio antes de enviarlo al cliente.

---

### Opción 2: Web Speech API (Navegador)
**Pros:**
- ✅ Gratis
- ✅ No requiere configuración
- ✅ Funciona inmediatamente

**Contras:**
- ❌ Solo Chrome/Edge
- ❌ Menos precisa que APIs dedicadas
- ❌ NO funciona con audio grabado, solo micrófono en vivo
- ❌ Requiere workarounds complejos

**Implementación:**
Cliente intenta transcribir el audio recibido (complicado).

---

### Opción 3: Whisper API (OpenAI)
**Pros:**
- ✅ Muy buena precisión
- ✅ Soporta español excelentemente
- ✅ API simple de usar

**Contras:**
- ❌ Requiere API key de OpenAI
- ❌ Costo por uso

**Implementación:**
Backend envía audio a Whisper para transcribir.

---

### Opción 4: NO Transcribir (Solo indicador)
**Pros:**
- ✅ Implementación inmediata
- ✅ Sin dependencias externas
- ✅ Sin costos

**Contras:**
- ❌ No se guarda el texto de la respuesta
- ❌ Solo se muestra "🎤 Respondido con voz"

**Implementación:**
Guardar solo que la IA respondió, sin texto.

---

## Recomendación

**Opción 1 o 3** son las mejores para producción.

¿Cuál prefieres implementar?
