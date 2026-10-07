# Chrome Web Store Listing — WAPPY Connect

> Single source of truth for the Chrome Web Store listing, permissions justifications, and privacy disclosures for **WAPPY Connect - Google NotebookLM Sync**.

---

## 1. Store Metadata

- **Extension Name**: WAPPY Connect - Google NotebookLM Sync
- **Short Name**: WAPPY Connect
- **Version**: 1.0.0
- **Primary Category**: Productivity
- **Secondary Category**: Developer Tools
- **Default Language**: Español (Spanish)

---

## 2. Store Copy

### Summary (max 132 chars)
Vincula tu sesión de Google NotebookLM con WAPPY en un solo clic para consultar tus fuentes y normativas con agentes de IA.

### Detailed Description
WAPPY Connect permite conectar tu entorno de trabajo de Google NotebookLM con tu plataforma WAPPY sin configuraciones técnicas ni inspección manual de cookies.

**Características principales:**
- 🟢 **Detección Automática de Sesión:** Identifica de forma segura si tu sesión de Google NotebookLM está activa en el navegador.
- 🚀 **Vinculación en 1 Clic:** Envía tus credenciales de sesión directamente a tu cuenta de WAPPY con verificación instantánea.
- 📋 **Opción de Copiado Rápido:** Copia tu clave de sesión en formato seguro para pegarla manualmente si usas otro dispositivo o navegador.
- 🔍 **Comprobación en Vivo:** Valida en tiempo real que la conexión con Google responda correctamente.

**¿Cómo funciona?**
1. Abre tu navegador e inicia sesión en [notebooklm.google.com](https://notebooklm.google.com).
2. Haz clic en el ícono de **WAPPY Connect**.
3. Presiona **"Vincular con WAPPY en 1 Clic"** y tus agentes de IA tendrán acceso inmediato a tus cuadernos de estudio, normatividad y matrices.

---

## 3. Justificación de Permisos (Permissions Justification)

| Permiso / Host | Justificación en Lenguaje Claro |
|----------------|---------------------------------|
| `cookies` | Requerido para leer las cookies de autenticación de sesión de Google NotebookLM y permitir la vinculación con la plataforma WAPPY. |
| `storage` | Requerido para recordar la dirección URL del servidor WAPPY preferido del usuario (por ejemplo, https://wappy.club). |
| `tabs` | Requerido para verificar si el usuario tiene una pestaña abierta de WAPPY o NotebookLM y facilitar la sincronización en un solo clic. |
| `*://*.google.com/*` & `*://notebooklm.google.com/*` | Requerido para acceder a las credenciales de sesión activas de Google NotebookLM del usuario. |
| `*://*.wappy.club/*`, `http://localhost/*` | Requerido para transmitir de forma segura la sesión a la instancia de WAPPY del usuario. |

---

## 4. Política de Privacidad y Manejo de Datos (Privacy & Data Use)

- **Uso Único:** Las credenciales de sesión se utilizan exclusivamente para conectar los cuadernos de Google NotebookLM del usuario con su propia cuenta en WAPPY.
- **Sin Venta de Datos:** La extensión no recopila, vende ni transmite datos de navegación, historial ni información personal a terceros.
- **Cifrado en Tránsito:** Toda comunicación entre la extensión y WAPPY se realiza sobre canales seguros (HTTPS / localhost).
- **Control Total del Usuario:** El usuario puede desvincular o revocar su sesión en cualquier momento desde los ajustes de su cuenta en WAPPY.

---

## 5. Historial de Versiones (Version History)

### v1.0.0 (2026-10-07)
- Lanzamiento inicial de WAPPY Connect con soporte para Manifest V3.
- Vinculación en 1 clic para instancias locales y producción en `wappy.club`.
- Verificación en vivo contra Google NotebookLM.
