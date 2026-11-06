---
name: skill-admin-metricas-sistema
description: Habilidad exclusiva de Super-Administrador (Rol ADMIN) para que Tenshi consulte todos los módulos de Métricas del sistema (Actividad y Adopción SST, Embajadores y Comisiones, Embudo de Pagos/Checkout, Telemetría Matriz IPEVR, Wappy Studio, Radar ARL Colmena, Comunidad, Tickets, Leads, Planes y Promocodes) y ejecute cualquier acción administrativa global.
scope: tenshi
adminOnly: true
tools:
  - wappy_consultar_metricas_admin
  - wappy_admin_sistema
  - wappy_ejecutar_accion_usuario
triggers:
  - metricas
  - métricas
  - admin
  - administrador
  - embajadores
  - comisiones
  - referidos
  - adopcion
  - adopción
  - semaforo
  - semáforo
  - power user
  - checkout
  - pagos
  - ingresos
  - facturacion
  - facturación
  - telemetria
  - telemetría
  - matrizipvr
  - wappystudio
  - colmena
  - radar colmena
  - promocode
  - codigo promocional
  - código promocional
  - cupon
  - cupón
  - leads
  - prospectos
  - tickets de soporte
  - usuarios registrados
  - cambiar plan
  - activar cuenta
  - renovar periodo
---

# Skill Exclusiva de Super-Administrador: Métricas Globales y Control Total del Sistema (`skill-admin-metricas-sistema`)

> **Verificación de Rol Obligatoria:** Esta habilidad está reservada única y exclusivamente para usuarios autenticados con rol **`ADMIN`**. Si el usuario conectado NO tiene rol `ADMIN`, jamás ejecutes ni expongas métricas globales de otros usuarios.

---

## 📊 1. Consulta de Todos los Módulos de Métricas (`wappy_consultar_metricas_admin`)

Cuando el administrador te pida revisar métricas, estadísticas globales, embajadores, pagos, actividad de usuarios o telemetría de aplicativos, invoca **`wappy_consultar_metricas_admin`** seleccionando el `modulo` correspondiente:

1. **`modulo: "resumen_global"`**: Panorama 360° de toda la plataforma en tiempo real (usuarios totales, activos del mes, tasa de adopción, top usuarios, KPIs de embajadores y comisiones, embudo de pagos/checkout, telemetría de Matriz IPEVR, Wappy Studio, Radar ARL Colmena, Comunidad, tickets pendientes, leads, planes y códigos promocionales).
2. **`modulo: "actividad_usuarios"`**: Métricas de Actividad y Adopción SST (`/api/referrals/users-activity-metrics`):
   - Resumen global: `totalUsers`, `activeThisMonth`, `totalCompanies`, `totalWorkers`, `totalMatrices`, `totalConversations`, `totalMessages`, `avgAdoptionRate`, `powerUsersCount`.
   - Distribución por niveles de adopción (`power_user`, `avanzado`, `intermedio`, `explorador`, `sin_inicio`) y semáforo (`green`, `yellow`, `red`, `gray`).
   - Detalle por usuario de los hitos usados (empresas, trabajadores, GTC-45, PESV, diagnóstico 0312, químicos, vehículos, EPP, cursos LMS).
3. **`modulo: "embajadores"`**: Dashboard Comercial, Red de Embajadores, Comisiones y CRM (`/api/referrals/dashboard`):
   - KPIs: registrados, referidos, crecimiento últimos 7 días, Pro activos, próximos a vencer, comisiones generadas/pendientes/pagadas, mejor embajador.
   - Red de embajadores (`networkStats`), lista de comisiones y estado en el CRM.
4. **`modulo: "pagos"`**: Analítica de Pagos y Embudo de Checkout (`/api/admin/checkout/summary` y `/events`):
   - Embudo completo (`page_view`, `plan_selected`, `payment_started`, `payment_approved`, `payment_failed`, `payment_cancelled`), ingresos totales en COP (`totalRevenueCOP`), tasa de conversión (`conversionRate`), ingresos por plan y eventos recientes.
5. **`modulo: "matrizipvr"`**: Telemetría de empresas, trabajadores y peligros registrados en `/matrizipvr`.
6. **`modulo: "wappystudio"`**: Telemetría de empresas, audios y videos creados en `/wappystudio`.
7. **`modulo: "colmena"`**: Radar de intermediación ARL Colmena y negocios en pipeline (`/api/comunidad/wappycolmena/radar` y `/deals`).
8. **`modulo: "comunidad"`**: Estadísticas de ventas Comunidad, compras y auditoría forense.
9. **`modulo: "usuarios"`**: Listado y búsqueda de usuarios del sistema (`/api/admin/users`), incluyendo detalle de referidos y auditoría de conversaciones si se indica `userId` o `busqueda` puntual.
10. **`modulo: "empresas"`**: Todas las empresas registradas en Somos SST a nivel global (`/api/admin/company-info`).
11. **`modulo: "tickets"`**: Todos los tickets de soporte técnico (`/api/tickets/all`).
12. **`modulo: "planes_y_promos"`**: Planes, visibilidad de planes, códigos promocionales, leads y permisos por rol.
13. **`modulo: "marketplace_admin"`**: Órdenes de compra, productos y cupones de la tienda.

---

## ⚙️ 2. Ejecución de Acciones Administrativas (`wappy_admin_sistema`)

Cuando el administrador te ordene ejecutar una acción administrativa sobre cualquier módulo del sistema, invoca **`wappy_admin_sistema`**:

- **Gestión de Usuarios (`modulo: "usuarios"`)**:
  - `accion: "crear_usuario"`, `accion: "actualizar_usuario"` (cambiar plan, rol `USER`/`ADMIN`, estado `active`/`inactive`, fecha de vencimiento `inactiveAt`, límites `companyLimit`/`automationLimit`/`subUserLimit`, ajuste de puntos `pointsAdjustment`, contraseña), `accion: "eliminar_usuario"`, `accion: "actualizacion_masiva"`, `accion: "ver_conversaciones_usuario"`.
- **Embajadores, Comisiones y CRM (`modulo: "embajadores" | "comisiones" | "crm"`)**:
  - `accion: "atribuir_embajador"`, `accion: "actualizar_comision"` (`status`: `pending`, `approved`, `paid`, `cancelled`), `accion: "eliminar_comision"`, `accion: "renovar_periodo"`, `accion: "actualizar_etapa_crm"`, `accion: "agregar_nota_crm"`, `accion: "generar_propuesta"`, `accion: "enviar_propuesta"`, `accion: "generar_email"`, `accion: "enviar_email"`.
- **Planes y Códigos Promocionales (`modulo: "planes" | "promocodes"`)**:
  - `accion: "actualizar_plan"`, `accion: "visibilidad_planes"`, `accion: "crear_promocode"`, `accion: "toggle_promocode"`, `accion: "eliminar_promocode"`.
- **Marketing, Push, Leads y Tickets (`modulo: "marketing" | "push" | "leads" | "tickets"`)**:
  - `accion: "generar_campana"`, `accion: "enviar_campana"`, `accion: "enviar_notificacion_push"`, `accion: "crear_lead"`, `accion: "eliminar_lead"`, `accion: "responder_ticket"`, `accion: "sugerir_respuesta_ticket"`, `accion: "eliminar_ticket"`.
- **Ruta Directa Universal**:
  - Envía `ruta` (ej. `"/api/admin/users/update"`), `metodo` (`"GET"`, `"POST"`, `"PUT"`, `"PATCH"`, `"DELETE"`) y `datos`.
