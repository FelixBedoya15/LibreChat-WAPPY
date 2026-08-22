---
name: skill-automatizaciones-agentes
description: Guía experta para que los agentes utilicen la herramienta gestor_automatizaciones cuando el usuario solicite crear, programar, listar, pausar o ejecutar tareas autónomas periódicas en WAPPY (/sgsst/automatizaciones).
scope: agents
triggers:
  - automatizar
  - automatizacion
  - automatización
  - programar tarea
  - tarea periodica
  - tarea periódica
  - revision periodica
  - revisión periódica
  - monitoreo automatico
  - monitoreo automático
  - agendar revision
  - agendar revisión
  - automatizar inspeccion
  - automatizar inspección
  - automatizaciones
---

# Skill: Gestor de Automatizaciones de Agentes (`gestor_automatizaciones`)

Esta skill instruye a los agentes de WAPPY sobre cómo utilizar la herramienta `gestor_automatizaciones` para programar y ejecutar tareas 100% autónomas en segundo plano en el aplicativo `/sgsst/automatizaciones`.

---

## 🎯 ¿Cuándo invocar la herramienta?

Debes llamar a la herramienta `gestor_automatizaciones` inmediatamente cuando el usuario exprese intenciones como:
- *"Deseo que realices una automatización de revisar mi Drive la carpeta de inspecciones"*
- *"Programa una revisión diaria de actos y condiciones inseguras"*
- *"Automatiza el envío del reporte de accidentalidad todos los viernes a las 5:00 PM"*
- *"¿Qué automatizaciones tenemos programadas?"*
- *"Pausa la automatización de inspección de extintores"*
- *"Ejecuta de una vez la auditoría programada para probarla"*

---

## ⚡ Regla de Oro de Ejecución Autónoma

> [!IMPORTANT]
> **NO te limites a redactar scripts en Canvas, dar explicaciones teóricas o instrucciones manuales si la herramienta `gestor_automatizaciones` está disponible.**
> Debes invocar directamente la herramienta para que la tarea quede registrada y programada en el sistema.
> Si faltan datos secundarios (como la hora exacta o el correo de destino), asume valores óptimos por defecto (ej: diario a las 8:00 AM) y confírmalos al usuario en tu respuesta.

---

## 🛠️ Acciones y Parámetros de la Herramienta

### 1. Crear Automatización (`accion: "crear"`)
Registra una nueva tarea periódica en MongoDB y programa su próxima ejecución en hora Colombia (UTC-5):
- `nombre`: Título claro y profesional (ej. *"Revisión periódica de carpeta de Inspecciones en Google Drive"*).
- `agente_objetivo`: Nombre del agente que la ejecutará (ej. `"yo"`, `"Profesional SST"`, `"Consultor SG-SST"`, `"Médico Laboral"`).
- `prompt_a_ejecutar`: **La instrucción completa que el motor en background le pasará al agente cada vez que se dispare la tarea.**
  * *Ejemplo:* `"Conéctate a Google Drive con la herramienta google_drive, busca la carpeta 'inspecciones', lee los últimos archivos modificados de listas de chequeo y genera un reporte de hallazgos críticos de SST enviando las alertas pertinentes."`
- `tipo_frecuencia`: `"daily"` (diario), `"weekly"` (semanal), `"monthly"` (mensual), `"hourly"` (cada X horas).
- `configuracion_horario`:
  - `hora`: `0` a `23` (por defecto `8` = 8:00 AM).
  - `minuto`: `0` a `59` (por defecto `0`).
  - `dias_semana`: `[1]` (Lunes), `[1, 3, 5]` (Lunes, Miércoles, Viernes).
  - `dia_mes`: `1` a `31`.
  - `intervalo_horas`: `1` a `24`.
- `correos_notificacion`: Arreglo de correos electrónicos a los que se despachará el informe resultante.

### 2. Listar Automatizaciones (`accion: "listar"`)
Devuelve todas las tareas configuradas para la empresa del usuario con su estado, frecuencia y última corrida.

### 3. Actualizar Automatización (`accion: "actualizar"`)
- `automatizacion_id`: ID de la tarea.
- `nuevo_estado`: `"active"` (activar) o `"inactive"` (pausar).
- Modificar `nombre`, `prompt_a_ejecutar`, `configuracion_horario` o `correos_notificacion`.

### 4. Ejecutar Ahora (`accion: "ejecutar_ahora"`)
- `automatizacion_id`: ID de la tarea a disparar inmediatamente como test run.

### 5. Eliminar Automatización (`accion: "eliminar"`)
- `automatizacion_id`: ID de la tarea a dar de baja.

### 6. Ver Historial / Logs (`accion: "ver_logs"`)
- Consulta los últimos registros de ejecución con su estatus (éxito/fallo) y resumen de respuesta.

---

## 📋 Ejemplo de Respuesta tras Crear una Automatización

Tras invocar la herramienta con éxito, presenta un resumen claro en el chat y una tarjeta `wappy-card`:

```wappy-card
{
  "title": "Automatización Programada Exitosamente",
  "subtitle": "Monitoreo Autónomo de Inspecciones en Google Drive",
  "type": "success",
  "icon": "CheckCircle",
  "description": "La tarea ha sido registrada en el sistema y se ejecutará automáticamente según el calendario establecido.",
  "layout": "checklist",
  "progress": 100,
  "progressLabel": "100% Configurada y Activa",
  "items": [
    { "title": "Agente Asignado", "description": "Profesional SST", "badge": "Activo", "color": "success", "checked": true },
    { "title": "Periodicidad", "description": "Diario a las 08:00 AM (Hora Colombia)", "badge": "Programada", "color": "primary", "checked": true },
    { "title": "Objetivo de la Tarea", "description": "Escanear carpeta 'inspecciones' en Google Drive y reportar hallazgos críticos", "badge": "En Espera", "color": "warning", "checked": true }
  ],
  "suggestions": [
    "📊 Ver todas las automatizaciones de la empresa",
    "⚡ Ejecutar esta automatización ahora mismo",
    "⚙️ Modificar horario o destinatarios"
  ]
}
```
