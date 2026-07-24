---
name: wappy-cards
description: Instrucciones y estructura JSON avanzada para generar tarjetas interactivas de vidrio (glassmorphism) wappy-card para planes de acción, listas de verificación, barras de progreso, formularios e integración con correo Gmail.
triggers:
  - tarjeta
  - wappy-card
  - checklist
  - lista
  - grilla
  - métricas
  - items
  - interactiva
  - plan de acción
  - lista de verificación
  - progreso
  - formulario
---

# Tarjetas Interactivas Avanzadas en el Chat (WAPPY CARDS INTERACTIVAS)

Cuando presentes listas de chequeo, planes de acción, resúmenes de riesgos, conjuntos de métricas o información estructurada en bloques, debes formatearlos estrictamente dentro de un bloque de código `wappy-card` con el JSON de la tarjeta. NUNCA uses texto plano simple si puedes estructurarlo en una tarjeta interactiva premium de vidrio (glassmorphism).

## ⚙️ ESTRUCTURA JSON COMPLETA Y CAPACIDADES AVANZADAS

Ejemplo de bloque de código completo a generar en tu respuesta:

```wappy-card
{
  "title": "Ruta de Aplicación Sancionatoria por No Uso de EPP",
  "subtitle": "Gestión del debido proceso según Art. 2.2.1.1.7 Dec. 1072/15",
  "type": "primary",
  "icon": "ShieldAlert",
  "description": "Lista de control operativa con acciones directas para redactar documentos y notificar por correo.",
  "layout": "checklist",
  "progress": 40,
  "progressLabel": "40% de avance en el debido proceso (2 de 5 pasos completados)",
  "items": [
    {
      "title": "1. Inspección y Registro de Evidencia",
      "description": "Evidencia fotográfica o acta de hallazgo en campo de no uso de EPP",
      "badge": "Completado",
      "color": "success",
      "checked": true,
      "image": "https://wappy.club/public/images/evidencia_epp.jpg",
      "actions": [
        { "label": "Ver Foto", "trigger": "mostrar evidencia fotográfica", "icon": "ExternalLink" }
      ]
    },
    {
      "title": "2. Citación a Descargos",
      "description": "Garantizar el debido proceso al trabajador antes de sancionar",
      "badge": "En Proceso",
      "color": "warning",
      "checked": false,
      "actions": [
        { "label": "📄 Redactar Citación en Canvas", "trigger": "redactar citación a descargos en canvas", "icon": "FileText" },
        { "label": "📧 Enviar Citación por Correo", "trigger": "enviar citación a descargos por correo", "icon": "Mail" }
      ]
    },
    {
      "title": "3. Aplicación de Sanción Escrita",
      "description": "Llamado de atención escrito con copia a hoja de vida",
      "badge": "Pendiente",
      "color": "danger",
      "checked": false,
      "actions": [
        { "label": "📧 Enviar Sanción por Correo", "trigger": "enviar llamado de atencion escrito por correo", "icon": "Send" }
      ]
    }
  ],
  "inputs": [
    { "key": "nombre_empleado", "label": "Nombre del Trabajador", "type": "text", "placeholder": "Ej: Juan Pérez" },
    { "key": "correo_empleado", "label": "Correo del Trabajador", "type": "text", "placeholder": "ejemplo@empresa.com" }
  ],
  "suggestions": [
    "📧 Enviar citación a descargos por correo electrónico",
    "📄 Redactar documento de descargos en Canvas",
    "📊 Ver historial de sanciones de este trabajador"
  ]
}
```

---

## 📧 ACCIONES DE CORREO ELECTRÓNICO (HERRAMIENTA `google_gmail`)

- **Integración Nativa:** Todos los agentes cuentan con la herramienta `google_gmail` (acciones `send_email` y `create_draft`).
- **Disparador:** Cuando el usuario haga clic en una acción de correo dentro de la tarjeta (`actions` o `suggestions`) o le pida al agente enviar descargos, notificaciones o informes, DEBES ejecutar inmediatamente la herramienta `google_gmail`.
- **Formato Visual Estilizado:** Pasa en el parámetro `body` el contenido HTML estructurado o el documento de Canvas completo para que el destinatario reciba la versión oficial maquetada.

---

## 🎨 ESPECIFICACIONES DE PROPIEDADES

* `layout`: `"checklist"` | `"list"` | `"grid"` | `"metrics"`
* `type` / `color`: `"primary"` | `"success"` | `"warning"` | `"danger"` | `"info"`
* `progress` *(Opcional)*: Número del 0 al 100 para pintar la barra de avance.
* `progressLabel` *(Opcional)*: Texto explicativo del avance.
* `actions` *(Opcional en cada item)*: Botones de acción rápida por elemento con `label`, `trigger` (prompt a ejecutar) e `icon`.
* `inputs` *(Opcional)*: Formulario integrado con `key`, `label`, `type` (`"text"` | `"select"` | `"date"`) y `placeholder`.
* `image` *(Opcional en items)*: URL de imagen o miniatura de evidencia.
* `icon`: "HelpCircle", "AlertTriangle", "CheckCircle2", "ShieldAlert", "Info", "ExternalLink", "AlertOctagon", "ChevronUp", "ChevronDown", "ArrowUpRight", "Activity", "TrendingUp", "Coins", "Users", "Target", "Award", "Zap", "BarChart2", "Settings", "Code", "FileText", "Lock", "MessageSquare", "Bell", "Calendar", "Heart", "Star", "Mail", "Send".
