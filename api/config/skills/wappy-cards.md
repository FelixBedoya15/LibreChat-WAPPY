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

Para que las tarjetas tengan el máximo nivel de interactividad y atractivo visual, DEBES aplicar las siguientes propiedades en CADA tarjeta:

1. **Barra de Progreso (`progress` y `progressLabel`) OBLIGATORIA:**
   Muestra siempre el porcentaje de avance (0 a 100) en el proceso o plan de acción.
   - `"progress": 40`
   - `"progressLabel": "40% de avance en el debido proceso (2 de 4 pasos)"`

2. **Insignias de Estado (`badge`) y Colores (`color`) por Ítem:**
   Cada elemento del arreglo `"items"` DEBE llevar una insignia y un color llamativo:
   - `"color": "success"`, `"badge": "✅ Completado"` → Verde para finalizados.
   - `"color": "warning"`, `"badge": "⏳ En Proceso"` → Naranja para en curso.
   - `"color": "danger"`, `"badge": "🚨 Pendiente Crítico"` → Rojo para urgentes/sanciones.
   - `"color": "primary"`, `"badge": "📌 Requisito"` → Azul para normas.

3. **Botones de Acción por Ítem Individual (`actions`):**
   Agrega botones de acción clickeables dentro de cada fila para ejecutar tareas instantáneas:
   ```json
   "actions": [
     { "label": "📄 Redactar en Canvas", "trigger": "redactar citación a descargos en canvas", "icon": "FileText" },
     { "label": "📧 Enviar por Correo", "trigger": "enviar citación a descargos por correo", "icon": "Mail" }
   ]
   ```

4. **Botones Clickeables al Pie (`suggestions`):**
   Ofrece siempre 2 o 3 sugerencias de acciones rápidas al pie de la tarjeta.

---

## ⚙️ EJEMPLO JSON DE TARJETA INTERACTIVA COMPLETA DE ALTO IMPACTO

```wappy-card
{
  "title": "Ruta de Aplicación Sancionatoria por No Uso de EPP",
  "subtitle": "Procedimiento Disciplinario en SST - SERVICONSTRUCCIONES JM S.A.S.",
  "type": "warning",
  "icon": "ShieldAlert",
  "description": "Debido proceso laboral según Decreto 1072 de 2015 y Código Sustantivo del Trabajo.",
  "layout": "checklist",
  "progress": 40,
  "progressLabel": "40% de avance en el debido proceso (2 de 4 pasos)",
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
      "checked": false,
      "actions": [
        { "label": "📄 Redactar en Canvas", "trigger": "redactar citación a descargos en canvas", "icon": "FileText" },
        { "label": "📧 Enviar por Correo", "trigger": "enviar citación a descargos por correo", "icon": "Mail" }
      ]
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
      "checked": false,
      "actions": [
        { "label": "📧 Enviar Sanción por Correo", "trigger": "enviar llamado de atencion escrito por correo", "icon": "Send" }
      ]
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

- **Ejecución Automática:** Cuando el usuario haga clic en un botón de acción (`actions`) o en una sugerencia (`suggestions`), DEBES ejecutar inmediatamente la herramienta `google_gmail` con la acción `send_email`.
- **Cuerpo del Correo:** Pasa en el parámetro `body` el código HTML estructurado o el documento de Canvas para que el destinatario reciba el diseño visual completo.
