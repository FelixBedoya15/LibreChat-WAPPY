# ⚠️ ADVERTENCIA CRÍTICA - NO MODIFICAR

## responseModalities en Gemini Live

**NUNCA cambiar `responseModalities: ['AUDIO']` a `['AUDIO', 'TEXT']`**

### ❌ Problema Documentado

Cuando se agrega `'TEXT'` a `responseModalities`:
- ✅ La IA se conecta correctamente
- ✅ Gemini recibe el audio del usuario
- ❌ **La IA NUNCA responde** (ni audio ni texto)
- ❌ Los eventos `modelTurn` nunca se disparan
- ❌ El sistema queda completamente mudo

### ✅ Configuración que FUNCIONA

```javascript
generationConfig: {
    responseModalities: ['AUDIO'],  // ← SOLO AUDIO
    speechConfig: { ... }
}
```

### 🔧 Soluciones Alternativas para Obtener Texto de la IA

1. **Speech-to-Text del audio de la IA** (mejor opción)
   - Usar Google Speech-to-Text API
   - Transcribir el audio que se envía al cliente
   
2. **Extraer del markdown del "pensamiento"**
   - La IA envía "thoughts" en texto
   - Podría usarse como fallback

3. **No guardar texto de la IA**
   - Solo guardar transcripción del usuario
   - Usar indicador de "mensaje de voz" en la UI

## Historial de Intentos

- **2025-11-24**: Intentado y confirmado que rompe la IA
- **Anterior**: Múltiples intentos, siempre con el mismo resultado

## Documentación Oficial

Gemini Live API parece estar diseñado para:
- `responseModalities: ['AUDIO']` → Modo voz pura
- `responseModalities: ['TEXT']` → Modo texto puro
- **NO soporta ambos simultáneamente en modo Live**
