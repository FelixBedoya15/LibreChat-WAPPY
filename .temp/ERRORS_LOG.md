# ❌ ERRORES DOCUMENTADOS - NO REPETIR

## Error #1: Agregar connect/disconnect como dependencias de useEffect

**Fecha:** 2025-11-24
**Archivo:** `/client/src/components/Voice/VoiceModal.tsx`
**Línea:** 54-70

### ❌ Qué Hice (INCORRECTO):
```tsx
useEffect(() => {
    if (!isOpen) return;
    connect();
    return () => {
        disconnect();
    };
}, [isOpen, connect, disconnect]); // ← ESTO CAUSÓ EL ERROR
```

### 🔴 Resultado:
- **Error en pantalla:** "Error: WebSocket connection error"
- **Causa:** Loop infinito de conexión/desconexión
- **Por qué:** `connect` y `disconnect` cambian en cada render, causando que el useEffect se ejecute infinitamente

### ✅ Código Correcto (REVERTIDO):
```tsx
useEffect(() => {
    connect();
    return () => {
        disconnect();
    };
}, []); // Dependencias vacías - solo se ejecuta una vez
```

### 📝 Lección Aprendida:
- **NO agregar funciones como dependencias** a menos que estén memorizadas con `useCallback`
- El problema original (no puede reabrir modal) **NO se puede resolver** cambiando este useEffect
- **El problema real está en otro lugar** - probablemente en cómo React maneja el desmontaje del componente

---

## ⚠️ Estado Actual del Problema

### FASE 1: Reinicio del Modal - **SIN RESOLVER**

**Problema:** No se puede volver a usar el modal sin recargar la página.

**Intentos fallidos:**
1. ❌ Mejorar `disconnect()` para limpiar más refs → No funcionó
2. ❌ Agregar `isOpen` como dependencia → **ROMPIÓ TODO**

**Hipótesis actuales:**
1. El componente `VoiceModal` no se desmonta cuando se cierra
2. React reutiliza la instancia del componente
3. El `useEffect` con `[]` solo se ejecuta al primer montaje
4. Necesitamos una forma diferente de detectar cuando el modal se abre

**Próximos pasos a investigar:**
1. Usar un `key` prop en VoiceModal para forzar remontaje
2. Crear un estado `sessionId` que cambie cada vez que se abre
3. Usar un `useEffect` separado que escuche cambios en `isOpen` explícitamente
