# Resumen de Cambios: Integraciones y Mejoras en Wappy

Se ha implementado con éxito la integración de Google Calendar, las conexiones multicliente independientes de Google Workspace por empresa, y las mejoras avanzadas en el Tablero Kanban (Centro de Control ACPM).

---

## 🏢 Conexión Multicliente Independiente de Google Workspace por Empresa

Se adaptó el motor de autenticación de Google Drive y Calendar para dar soporte a entornos multiempresa:

1. **Servicio Centralizado `googleAuthHelper.js`**:
   * Creado el servicio [googleAuthHelper.js](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/services/googleAuthHelper.js) para gestionar credenciales dinámicamente según la empresa activa (`CompanyInfo.findOne({ user: userId, isActive: true })`).
   * Almacena tokens en MongoDB con claves scoped especificas por empresa (ej. `GOOGLE_DRIVE_REFRESH_TOKEN_[CompanyID]`), con un fallback transparente a la clave global heredada para garantizar compatibilidad con conexiones previas.
2. **Rutas y Callback Scoped**:
   * El endpoint `GET /auth` encapsula el `companyId` activo dentro del token JWT de `state`.
   * El callback `GET /callback` verifica la solicitud y guarda las credenciales para esa empresa en específico.
   * `GET /status`, `DELETE /disconnect`, `GET /token` e `/import-file` operan únicamente sobre el contexto de la empresa activa y retornan el nombre de la empresa al cliente.
3. **Sincronización en Segundo Plano y Herramienta IA**:
   * La herramienta [GoogleDrive.js](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/app/clients/tools/structured/GoogleDrive.js) y el servicio [googleCalendar.js](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/services/googleCalendar.js) resuelven los accesos de acuerdo a la empresa actual o provista por los planificadores en segundo plano ([notificationScheduler.js](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/services/notificationScheduler.js)).
4. **Interfaz de Usuario en Configuración**:
   * Actualizada la pestaña de Configuración ([GoogleDriveConnect.tsx](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/client/src/components/Nav/SettingsTabs/Account/GoogleDriveConnect.tsx)) para reflejar de forma explícita el nombre de la empresa activa que se está conectando o gestionando en cada momento.

---

## 📅 Integración de Google Calendar
1. **OAuth Scopes**: Se agregó el scope de Google Calendar en [googleDrive.js](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/routes/googleDrive.js) para autorizar accesos de forma unificada.
2. **Servicio Centralizado**: Se creó el servicio [googleCalendar.js](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/services/googleCalendar.js) para gestionar la creación, reprogramación y eliminación inteligente de eventos usando la propiedad `wappySyncId` para evitar duplicaciones.
3. **Sincronización Automática de Alertas**: El scheduler diario de las 8:00 AM ([notificationScheduler.js](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/services/notificationScheduler.js)) ahora publica automáticamente alertas críticas de vencimiento en el calendario de Google en colores rojo y naranja.
4. **Sincronización de Capacitaciones**: El guardado de capacitaciones programadas en [programaCapacitaciones.js](file:///Users/venta/Documents/GitHub/LibreChat-WAPPY/api/server/routes/sgsst/programaCapacitaciones.js) se sincroniza directamente con el calendario de Google.
5. **Plugin del Agente IA**: Herramienta `google_calendar` añadida para que el usuario pueda agendar o consultar recordatorios mediante lenguaje natural en el chat de Wappy.
6. **Políticas de Acceso y Activación**: 
   * Las herramientas de Google inician desactivadas por defecto.
   * Se restringió la activación de estas herramientas a cuentas de tipo `ADMIN` y `USER_PRO` (Plan Pro), mostrando el modal de bloqueo interactivo (`UpgradeWall`) en otros planes.

---

## 📋 Tablero Kanban Avanzado y Cierre de Actividades
Se rediseñó el flujo de las tareas del Tablero Kanban para conectarlo de manera bidireccional con los perfiles de los trabajadores, la base de datos de vehículos y el cronograma de capacitaciones:

### 1. Sincronización y Cierre de Actividades
* **Modal de Edición Inteligente**: Para todas las actividades automatizadas (Examen médico, SOAT, RTM, Licencias, Cursos de alturas), el título, categoría y fecha límite original se muestran bloqueados para evitar inconsistencias.
* **Cierre y Renovación**: Se agregó un selector interactivo de fecha de realización/cierre dentro del modal. Al rellenar esta fecha y guardar:
  1. Se actualiza el campo del registro original en la base de datos (por ejemplo, actualiza `fechaExamenMedico` o `soatVencimiento`).
  2. Calcula el próximo vencimiento (ej. suma **365 días** en exámenes médicos y cursos de alturas).
  3. Mueve automáticamente la tarjeta Kanban a la columna de **"Completadas"**.

### 2. Sincronización de Capacitaciones Programadas al Kanban
* **Integración con Cronograma**: Las sesiones creadas en el cronograma general de capacitaciones (`ProgramaCapacitacionesData`) ahora se cargan automáticamente en el Tablero Kanban.
* **Estados Dinámicos**: Si están en fecha se marcan como pendientes (`todo`); si están a menos de 7 días se marcan en `due_soon`; si la fecha pasó sin completarse se marcan en `overdue` (Alerta); y si están completadas se mueven a `done`.
* **Cierre Bidireccional**: Al registrar el cierre de una sesión desde el Kanban con su fecha de realización, el cronograma actualiza su estado a `Completada` de forma automática.

### 3. Sincronización de Alertas Médicas (Auditoría Biocéntrica < 75)
* **Control de Vulnerabilidad**: Si el score de la **Auditoría Biocéntrica** (FIT / `biocentricScore`) de un trabajador es inferior a **75%**, Wappy genera de forma automática tarjetas individuales para cada una de las penalizaciones/alertas activas del trabajador (ej. *Tabaquismo Activo*, *Hipoacusia*, *Obesidad*).
* **Gestión de Alertas**: Estas tarjetas aparecen con una etiqueta roja de **"Alerta Médica"** y un enlace de acceso directo al módulo de salud del trabajador para facilitar la intervención y seguimiento.
* **Limpieza Reactiva**: Si el score del trabajador vuelve a ser de 75% o superior, o se resuelven las alertas clínicas en su perfil, las tarjetas pendientes en Kanban se limpian automáticamente de manera silenciosa.

### 4. Reubicación del Tablero Kanban en la Barra de Navegación
* Se modificó la ordenación del menú de navegación lateral (`Nav.tsx`) tanto en modo colapsado como expandido para colocar el **Tablero Kanban** inmediatamente después de **"Somos SST"**, mejorando la accesibilidad y el flujo lógico de los módulos.

### 5. Cambio de Nombre a "Centro de Control ACPM"
* Se renombró el módulo de **"Tablero Kanban"** a **"Centro de Control ACPM"** (Acciones Correctivas, Preventivas y de Mejora) en la barra de navegación lateral y el encabezado principal del dashboard, alineándolo con la cultura estándar de SST y Bioseguridad.

### 6. Integración en el Hito 4 (Traumatismo y Curación)
* Se integró el **Centro de Control ACPM** como un aplicativo interactivo dentro del **Hito 04: Traumatismo y Curación** (sección de retroalimentación en el mapa de Somos SST).
* Al expandir la tarjeta del aplicativo en el Hito 4, el tablero se renderiza en línea con un diseño responsivo y optimizado, permitiendo gestionar y registrar cierres directamente desde el hub preventivo.

---

## 🔍 Plan de Verificación Realizado
1. **Compilación del Cliente**: Se verificó la compilación de todos los tipos y componentes de React.
2. **Servicio y Autenticación Scoped**: Probados y validados los métodos de `googleAuthHelper.js` garantizando el aislamiento de credenciales entre distintas empresas.

---

## 👥 Duplicación de la Página de Comunidad a `/comunidadmp`

Se duplicó la página de la comunidad `/comunidad` para que también responda en `/comunidadmp`:

1. **Rutas del Frontend (`client/src/routes/index.tsx`)**:
   * Se agregó la ruta `/comunidadmp` apuntando al componente `ComunidadPage`.
2. **Identificación de la Comunidad (`client/src/components/Marketing/ComunidadPage.tsx`)**:
   * Se actualizó la lógica de detección del `funnelKey` para identificar si la ruta contiene `comunidadmp`, estableciendo dicho identificador para la carga de su propia configuración independiente y aislamiento del almacenamiento en local.
3. **Controlador del Backend (`api/server/controllers/ComunidadController.js`)**:
   * Se integró el prefijo de referencia Wompi `WAP-CMP` para transacciones y referencias manuales asociadas a la comunidad `/comunidadmp` en vez del prefijo general de comunidad.

4. **Código QR y Copiado de Enlace en Ajustes**:
   * Se integró la librería `QRCodeSVG` para renderizar el código QR de acceso público dinámicamente según la página actual.
   * Se añadió un botón para descargar el código QR generado en formato PNG de alta resolución.
   * Se agregó un campo de texto con el enlace de la página y un botón rápido de "Copiar" al portapapeles.
5. **Condicional de Acceso y Contacto de Dudas**:
   * El botón "Acceder a WAPPY" ahora se renderiza de forma condicional, mostrándose únicamente cuando el usuario ha finalizado la reproducción completa del video (`isVideoFinished`) o es un usuario administrador.
   * Se modificó el enlace de WhatsApp del botón "Escríbenos si tienes dudas" para redirigir directamente al número personal del administrador (`+573106415385`) en Colombia.
