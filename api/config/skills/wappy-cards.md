---
name: wappy-cards
description: Instrucciones y estructura JSON estricta para generar tarjetas interactivas de vidrio (glassmorphism) wappy-card para planes de acción, listas de verificación o resúmenes de riesgos.
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
---

# Tarjetas Interactivas en el Chat (WAPPY CARDS INTERACTIVAS)

Cuando presentes listas de chequeo, planes de acción, resúmenes de riesgos, conjuntos de métricas o información estructurada en bloques, debes formatearlos estrictamente dentro de un bloque de código `wappy-card` con el JSON de la tarjeta. NUNCA uses texto plano simple si puedes estructurarlo en una tarjeta interactiva premium de vidrio (glassmorphism).

## ⚙️ ESTRUCTURA JSON COMPLETA Y VALIDA (ESTRICTA)

Ejemplo de bloque de código a generar en tu respuesta:

```wappy-card
{
  "title": "Ruta de Aplicación Sancionatoria por No Uso de EPP",
  "subtitle": "Procedimiento Disciplinario en SST",
  "type": "primary",
  "icon": "ShieldAlert",
  "description": "Lista de verificación interactiva para el debido proceso laboral según Decreto 1072 de 2015.",
  "layout": "checklist",
  "items": [
    {
      "title": "1. Inspección y Reporte de Condición",
      "description": "Evidencia fotográfica o acta de no uso de EPP cargada",
      "badge": "Completado",
      "color": "success",
      "checked": true
    },
    {
      "title": "2. Citación a Descargos",
      "description": "Garantizar el debido proceso al trabajador (Art. 2.2.1.1.7 Dec. 1072/15)",
      "badge": "En Proceso",
      "color": "warning",
      "checked": false
    },
    {
      "title": "3. Aplicación de Sanción (1.ª Vez)",
      "description": "Llamado de atención escrito con compromiso de uso firmado",
      "badge": "Pendiente",
      "color": "danger",
      "checked": false
    },
    {
      "title": "4. Reincidencia (2.ª Vez)",
      "description": "Suspensión laboral de 1 a 3 días sin sueldo según RIT",
      "badge": "Pendiente",
      "color": "danger",
      "checked": false
    }
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

- **Sugerencias Interactivas al pie (`suggestions`):** Los elementos del arreglo `"suggestions"` se renderizan como **botones/chips clickeables al pie del chat**.
- **Ejecución Automática:** Cuando el usuario haga clic en una sugerencia de correo (ej. `"📧 Enviar citación a descargos por correo electrónico"`) o te pida enviar información por correo, DEBES ejecutar inmediatamente la herramienta `google_gmail` con la acción `send_email`.
- **Cuerpo del Correo:** Pasa en el parámetro `body` el código HTML estructurado o el documento de Canvas para que el destinatario reciba el diseño visual completo.

---

## 🎨 REGLAS DE PROPIEDADES VÁLIDAS

* `layout`: `"checklist"` (para casillas interactivas) | `"list"` (para lista simple con iconos) | `"grid"` (para tarjetas en rejilla) | `"metrics"` (para cuadros de métricas/números).
* `type` / `color`: `"primary"` | `"success"` | `"warning"` | `"danger"` | `"info"`.
* En cada elemento dentro del arreglo `"items"`, debes definir siempre `title`, `description`, `badge`, `color` y `checked` (boolean true/false para checklist).
* Iconos válidos a utilizar (`icon`): "HelpCircle", "AlertTriangle", "CheckCircle2", "ShieldAlert", "Info", "ExternalLink", "AlertOctagon", "ChevronUp", "ChevronDown", "ArrowUpRight", "Activity", "TrendingUp", "Coins", "Users", "Target", "Award", "Zap", "BarChart2", "Settings", "Code", "FileText", "Lock", "MessageSquare", "Bell", "Calendar", "Heart", "Star".
