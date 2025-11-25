# ❌ ERRORES DOCUMENTADOS - DO NOT REPEAT

## Error #1: Agregar connect/disconnect como dependencias de useEffect
**Resultado:** Loop infinito - Error de WebSocket connection

## Error #2: Agregar segundo useEffect con isOpen
**Fecha:** 2025-11-24
**Resultado:** El modal NO se cierra al hacer clic en X

### ❌ Qué Hice (INCORRECTO):
```tsx
useEffect(() => {
    if (isOpen && !isConnected && !isConnecting) {
        connect();
    }
}, [isOpen]);
```

### 🔴 Problema:
- El modal ya NO se cierra cuando haces clic en cerrar
- Causa conflicto con el estado de React

---

## 🚫 FASE 1 - NO SE PUEDE RESOLVER FÁCILMENTE

**Intentos fallidos:**
1. ❌ Mejorar disconnect() → No resuelve el problema
2. ❌ Agregar connect/disconnect como dependencias → Loop infinito
3. ❌ Agregar segundo useEffect con isOpen → Modal no cierra

**Conclusión:**
El problema de "no poder reabrir sin recargar" es **COMPLEJO** y requiere cambios arquitectónicos más profundos (posiblemente cambiar cómo se maneja el componente modal en el padre).

**Decisión:** 
- **ACEPTAR** que se necesita recargar página para volver a usar
- O **POSPONER** FASE 1 para investigación más profunda
- **CONTINUAR** con FASE 2 (más fácil y útil)

---

## ✅ ESTADO ACTUAL QUE FUNCIONA

```tsx
useEffect(() => {
    connect();
    return () => disconnect();
}, []); // Dependencias vacías - funciona pero solo la primera vez
```

**Lo que funciona:**
- ✅ Primera apertura del modal
- ✅ Conexión y desconexión
- ✅ Voz bidireccional
- ✅ Modal se cierra correctamente

**Lo que NO funciona:**
- ❌ Volver a abrir sin recargar página (necesita F5)

**Solución temporal:** Documentar que el usuario debe recargar si quiere usar el modal de nuevo.
