---
name: wappy-cards
description: Instrucciones y estructura JSON estricta para generar tarjetas interactivas de vidrio (glassmorphism) wappy-card para planes de acción, listas de verificación o resúmenes de riesgos.
scope: agents
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

## 🎨 REGLAS OBLIGATORIAS DE DISEÑO VISUAL Y COLORES (VITAL)

Para evitar que las tarjetas se vean planas o aburridas, DEBES aplicar las siguientes propiedades en CADA elemento:

1. **Insignias de Estado (`badge`) y Colores (`color`) OBLIGATORIOS por Ítem:**
   Cada elemento del arreglo `"items"` DEBE tener asignada una insignia y un color que destaque visualmente en la pantalla:
   - `"color": "success"`, `"badge": "✅ Completado"` → Verde brillante para tareas finalizadas.
   - `"color": "warning"`, `"badge": "⏳ En Proceso"` → Naranja para tareas en curso.
   - `"color": "danger"`, `"badge": "🚨 Pendiente Crítico"` → Rojo para tareas pendientes o riesgos.
   - `"color": "primary"`, `"badge": "📌 Requisito"` → Azul índigo para normas o condiciones.

2. **Botones de Acción Integrados (`links`):**
   Puedes incluir botones de acción al pie de la tarjeta para ejecutar Canvas o Envíos:
   ```json
   "links": [
     { "label": "📄 Redactar Citación a Descargos en Canvas", "url": "#", "icon": "FileText" },
     { "label": "📧 Enviar Notificación por Correo", "url": "#", "icon": "Mail" }
   ]
   ```

---

## ⚙️ EJEMPLO JSON DE TARJETA INTERACTIVA DE ALTO IMPACTO

```wappy-card
{
  "title": "Ruta de Aplicación Sancionatoria por No Uso de EPP",
  "subtitle": "Procedimiento Disciplinario en SST - SERVICONSTRUCCIONES JM S.A.S.",
  "type": "warning",
  "icon": "ShieldAlert",
  "description": "Debido proceso laboral según Decreto 1072 de 2015 y Código Sustantivo del Trabajo.",
  "layout": "checklist",
  "items": [
    {
      "title": "1. Reporte de Incumplimiento y Registro Fotográfico",
      "description": "Evidencia visual del hallazgo de no uso de EPP y acta de amonestación inicial",
      "badge": "✅ Completado",
      "color": "success",
      "checked": true
    },
    {
      "title": "2. Citación Formal a Diligencia de Descargos",
      "description": "Garantía del debido proceso laboral al trabajador (Art. 2.2.1.1.7 Dec. 1072/15)",
      "badge": "⏳ En Proceso",
      "color": "warning",
      "checked": false
    },
    {
      "title": "3. Realización de Audiencia de Descargos y Pruebas",
      "description": "Escuchar los descargos del trabajador y evaluar testimonios o justificaciones",
      "badge": "🚨 Pendiente Crítico",
      "color": "danger",
      "checked": false
    },
    {
      "title": "4. Imposición de Sanción Disciplinaria",
      "description": "Llamado de atención escrito o suspensión laboral de 1 a 3 días según el RIT",
      "badge": "📌 Pendiente",
      "color": "primary",
      "checked": false
    }
  ],
  "links": [
    { "label": "📄 Redactar Citación a Descargos en Canvas", "url": "#", "icon": "FileText" },
    { "label": "📧 Enviar Citación por Correo", "url": "#", "icon": "Mail" }
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
- **Ejecución Automática:** Cuando el usuario haga clic en una sugerencia de correo o pida enviar información por correo, DEBES ejecutar inmediatamente la herramienta `google_gmail` con la acción `send_email`.
- **Cuerpo del Correo:** Pasa en el parámetro `body` el código HTML estructurado o el documento de Canvas para que el destinatario reciba el diseño visual completo.

---

## 🎨 REGLAS DE LAYOUTS VÁLIDOS

* `layout`: `"checklist"` (para casillas interactivas) | `"list"` (para lista simple con iconos) | `"grid"` (para tarjetas en rejilla) | `"metrics"` (para cuadros de métricas/números).
* `type` / `color`: `"primary"` | `"success"` | `"warning"` | `"danger"` | `"info"`.
* Iconos válidos a utilizar (`icon`): "HelpCircle", "AlertTriangle", "CheckCircle2", "ShieldAlert", "Info", "ExternalLink", "AlertOctagon", "ChevronUp", "ChevronDown", "ArrowUpRight", "Activity", "TrendingUp", "Coins", "Users", "Target", "Award", "Zap", "BarChart2", "Settings", "Code", "FileText", "Lock", "MessageSquare", "Bell", "Calendar", "Heart", "Star", "Mail", "Send".
