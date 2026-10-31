# 📚 Bitácora Maestra y Compendio de Conversaciones — LibreChat-WAPPY

> **Propósito de este documento:** Consolidar en un único punto de verdad todas las conversaciones históricas (> 3 días), hilos de órdenes efímeras de Tenshi y sesiones de arquitectura de este proyecto en **Antigravity**, para que puedas cerrar o archivar los chats antiguos de tu barra lateral sin perder ni un solo acuerdo, hallazgo o enlace técnico.

---

## 📌 1. Hilos Principales de Arquitectura (Recomendados para mantener Anclados)

Estos son los **5 hilos maestros** donde vive el trabajo estructural reciente del proyecto:

1. **[Arquitectura Coucou / Wappy Dots & Túnel de Voz Tenshi (4 Pasos)](conversation://4ed1bab1-48e7-4267-80af-2bbf46e92e87)** *(31,344 pasos · Activo hoy)*
   - **Resumen:** Estudio profundo de `coucou`, implementación de la arquitectura de 4 pasos de transcripción y voz en Tenshi (`LibreChat-WAPPY`), continuidad multiturno y despacho limpio con signos de puntuación.
2. **[WAPPY Studio & Eliminación de Duplicados en Sidebar](conversation://d295c2a4-3f2b-4a62-b210-b224e1076f2d)** *(3,779 pasos · Activo hoy)*
   - **Resumen:** Evolución completa de `/wappystudio` (Locución TTS, Video, Imagen, Diseño), pack importable de 7 skills (`skills-bundle.json`) y limpieza del botón en [`Nav.tsx`](file:///Users/felixbedoya/Documents/GitHub/LibreChat-WAPPY/client/src/components/Nav/Nav.tsx).
3. **[Portal Móvil Tenshi ↔ Antigravity & Diagnóstico E2E](conversation://41254d34-d184-4305-90a2-1bc0022aac60)** *(5,021 pasos · Activo hoy)*
   - **Resumen:** Auditoría y refuerzo de extremo a extremo entre Tenshi, Antigravity y el portal móvil, incluyendo flujo de micrófono a texto puntuado.
4. **[Apps Portables Offline/Online (`matrizipvr`, `wappystudio`, `wappypodcast`)](conversation://50e670fe-62fa-4fcc-8bb4-011fec0add4e)** *(4,988 pasos · Hace 1 día)*
   - **Resumen:** Construcción de las apps portables HTML autónomas (`build-portable-studio.cjs`), sincronización híbrida visitante (`wpy_guest_...`) vs. cuenta registrada (`wpy_live_...`) y homologación tipográfica con `wappy.club`.
5. **[Lanzamiento de WAPPY Podcast (`/wappypodcast` — "Somos SST Daily")](conversation://ea0642c6-19f0-4706-951d-2cec8f82caf1)** *(1,189 pasos · Activo hoy)*
   - **Resumen:** Creación de la app dedicada `/wappypodcast` con reproductor `WappyCassetteWalkmanPlayer.tsx` y marca fija `"Somos SST Daily"`.

---

## 📦 2. Conversaciones de Más de 3 Días (> 72h Inactivas — Unificadas aquí)

Estas **6 conversaciones** llevan entre **4 y 8 días sin abrirse**. Su conocimiento ya quedó integrado en el repositorio y resumido a continuación (puedes cerrarlas/archivarlas de tu barra lateral con total tranquilidad):

| Antigüedad | Conversación | Tema Consolidado y Conclusiones Clave |
| :--- | :--- | :--- |
| **8.4 días** *(22 Oct)* | **[Resolución de Claves y Modelos en `voiceSession`](conversation://07041549-7443-43ac-b94e-5cbf1829ebe9)** | Investigación inicial de resolución de API keys en `voiceSession.js` y selección del modelo Live para evitar desconexiones prematuras. |
| **7.7 días** *(23 Oct)* | **[Estudio OpenBot / Wappy Dots & Puente Móvil Local](conversation://90044024-b9a5-4691-b00c-3c869de9596b)** *(4,174 pasos)* | Análisis de `CopilotKit/openbot`, creación de la experiencia tipo "Dots" en PC y celular (`/api/gemini-tunnel/mobile`) y enlace bidireccional con `Wappy Dots.app`. |
| **4.2 días** *(26 Oct)* | **[Análisis de Arquitectura OpenClaw](conversation://d1fc3972-44e3-41eb-80fb-ea27ed08fda7)** *(150 pasos)* | Subagente de investigación sobre `/Users/venta/Documents/Somos SST/openclaw`; hallazgos de orquestación y herramientas incorporados al puente de agentes. |
| **4.2 días** *(26 Oct)* | **[Análisis de Repositorio Hermes Agent](conversation://e2aeef42-00fc-4c2c-ba95-bc495e6de79e)** *(98 pasos)* | Subagente de investigación sobre arquitectura de memoria procedural y delegación multi-agente estilo Hermes. |
| **4.2 días** *(26 Oct)* | **[Sesiones Auxiliares de Investigación #1](conversation://1ea90c71-5516-4abe-87f9-90a247c848f4)** y **[#2](conversation://47f4f141-393c-4e56-84fb-f0c69c17359c)** | Hilos cortos de soporte generados durante la auditoría multi-agente del 26 de octubre. |

---

## ⚡ 3. Hilos de Ajustes Puntuales Recientes (1 a 2 días — Ya Resueltos)

Si quieres reducir aún más el ruido visual, estos hilos corresponden a tareas **100% terminadas y desplegadas**:

- **[Automatización Cron Healthcheck (7am, 2pm, 6pm L-S) + Migración iMac](conversation://01e8083c-cb84-40c8-b867-059138a61895):** Script `wappy-connectors-healthcheck.js` con alerta por correo a `grupowappy@gmail.com` y migración de estado al iMac.
- **[Instalación de GitHub Desktop en macOS Monterey 12.7.6](conversation://3f5c9fa4-2510-4fed-abe7-bea1feeab81f):** Instalación de versión compatible con macOS 12 para evitar crash `_OBJC_CLASS_$_SMAppService`.
- **[Fix de Duplicación de Tarjetas en Tenshi / Usuario Mauricio en VPS](conversation://bafe56d7-15f1-495b-b4d8-b3ef5e6e7c20):** Corrección en producción (`01854b3159`) de mensajes duplicados en `tenshimessages` y enrutamiento del puente Antigravity.
- **[Fix de Corte de Última Letra/Sílaba en Títulos de Canvas Word (`CanvasPanel.tsx`)](conversation://92eb5837-2ec7-48a0-8cde-e9ece375c22b):** Corrección de regex y CSS (`word-break` / `overflow-wrap`) en el editor de documentos en vivo.
- **[Botones Reconectar (`↻`) y Desvincular en NotebookLM, Flow y Antigravity](conversation://4627507b-fe68-4fac-b7ec-a5967c345f18):** Implementado y verificado en producción (`c70c83767e`).
- **[Configuración de Servidor MCP Stitch para Diseño](conversation://aa3d15f1-dbc0-4546-b88d-0c3294b55537):** Registro declarativo en `mcp_config.json`.

---

## 🧹 4. Hilos Efímeros (Órdenes de Tenshi y Pruebas de Conexión — Seguros de Cerrar/Eliminar)

Estos hilos se abrieron automáticamente por órdenes puntuales de voz o comandos de vinculación de 1 solo turno y **generan la mayor parte del ruido visual**:

### A. Órdenes Puntuales de Tenshi (`⚡ [ORDEN EN TIEMPO REAL DE TENSHI]`)
- [`a5f243ec-2d76-4a48-88bc-03a9fe89bd1b`](conversation://a5f243ec-2d76-4a48-88bc-03a9fe89bd1b) — Generación de imágenes de prueba (perrito en parque / primeros auxilios SST).
- [`c04a4305-05f8-407c-b792-ee8078937f06`](conversation://c04a4305-05f8-407c-b792-ee8078937f06) — Consulta conceptual Decreto 1072 de 2015.
- [`7d272419-2b2e-4378-a103-9b08c13fee57`](conversation://7d272419-2b2e-4378-a103-9b08c13fee57) — Consulta conceptual de SST entregada a Tenshi.
- [`11d0a4a9-9963-4274-8313-8d8656a78224`](conversation://11d0a4a9-9963-4274-8313-8d8656a78224) — Imagen de prueba (gato volador) y consulta SST.
- [`01a66851-1077-4722-8c07-60a7800a6580`](conversation://01a66851-1077-4722-8c07-60a7800a6580) — Consulta sobre definición de SST.

### B. Comandos de Vinculación de 1 Turno (MCP / Daemon / Flow / NotebookLM)
- [`e80c8d54-b0c0-4ce0-ba2c-fd8e3fe23a01`](conversation://e80c8d54-b0c0-4ce0-ba2c-fd8e3fe23a01) — Vinculación de Google Flow local.
- [`420c2063-c02b-48d4-9755-874ac8f997b3`](conversation://420c2063-c02b-48d4-9755-874ac8f997b3) — Vinculación de Google NotebookLM local.
- [`71b48e35-e6b8-499e-a115-376103251637`](conversation://71b48e35-e6b8-499e-a115-376103251637) — Intento antiguo de script `wappy-notebooklm-link.js`.
- [`b9bc543f-f3dc-43e6-8522-103d5809c7cf`](conversation://b9bc543f-f3dc-43e6-8522-103d5809c7cf) — Actualización y verificación de `wappy-push-daemon.js`.
- [`bc79a992-5304-4619-a0f1-11756becf149`](conversation://bc79a992-5304-4619-a0f1-11756becf149) — Prueba de `wappy_resumen_general_360`.
- [`1bf16003-ee0f-4c5f-bd8c-4ffedc0ae67d`](conversation://1bf16003-ee0f-4c5f-bd8c-4ffedc0ae67d) — Sincronización inicial de las 153 herramientas MCP `wappy`.
- [`90df7b64-573a-440f-a720-30f3c864c89d`](conversation://90df7b64-573a-440f-a720-30f3c864c89d) — Registro declarativo de `mcp_config.json`.
