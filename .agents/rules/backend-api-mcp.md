---
trigger: glob
globs: "**/api/**/*.js, **/packages/api/**/*.js, **/bin/wappy-*.js"
description: "Estándares de backend Node.js/Express, jerarquía de autenticación, cero fallos silenciosos, validación sintáctica y modelos de IA verificados."
---

# Reglas Contextuales — Backend API, MCP & Daemons (`api/**`, `bin/**`)

1. **Verificación Sintáctica Obligatoria:**
   - Validar siempre cualquier `.js` modificado con `node -c <archivo.js>` antes de reportar o hacer commit.
2. **Jerarquía Estricta de Autenticación (`requireApiKeyOrJwt` / `mcpBridge.js`):**
   - Respetar el orden: `1) wpy_live_...` -> `2) JWT (Authorization / ?token=)` -> `3) Cookie refreshToken` -> `4) wpy_guest_...`.
   - Una clave `wpy_guest_...` jamás debe sobrescribir ni degradar a un usuario registrado.
3. **Cero Fallos Silenciosos (`Silent Failure Prevention`):**
   - Prohibido escribir `catch {}` vacíos o `.catch(() => [])` / `.catch(() => null)` que oculten fallos reales de red, MongoDB, subprocesos o autenticación sin log estructurado con contexto.
   - Toda llamada externa HTTP, CDP/Chrome o subproceso (`spawn`/`execFile`) debe llevar timeout explícito y limpieza de recursos/hijos.
4. **Gobernanza de Modelos de IA (`verify-ai-models`):**
   - Usar exclusivamente los IDs activos configurados en `.env` (`GOOGLE_MODELS`). Prohibido introducir modelos obsoletos o ausentes (`gemini-1.5-*`, `gemini-2.0-*`, `gemini-2.5-flash` bare).
5. **Seguridad y Aislamiento Multi-Empresa:**
   - Verificar `req.user` y aislamiento por `companyId` en consultas/escrituras sensibles. No exponer credenciales, cookies ni tokens en logs o respuestas HTTP.
   - Si modificas `bin/wappy-antigravity-daemon.js`, recuerda sincronizar también `~/.gemini/antigravity/wappy-push-daemon.js` si aplica al entorno local.
