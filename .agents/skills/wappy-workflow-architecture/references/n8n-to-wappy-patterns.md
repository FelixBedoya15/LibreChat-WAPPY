# Referencia Técnica: Patrones Oficiales `n8n` (`docs.n8n.io`) ➔ `WAPPY IA (/tareas)`

## 1. Contrato de Datos entre Nodos (`items[]`)
En `n8n` (`docs.n8n.io/data/data-structure/`), todo nodo consume y emite un arreglo `items`:
```json
[
  {
    "json": {
      "id": "10203040",
      "cedula": "10203040",
      "nombre": "Carlos Andrés Pérez",
      "cargo": "Técnico Liniero TSA",
      "estadoEmo": "Vencido hace 12 días",
      "isCritical": true
    }
  }
]
```
En **WAPPY IA**, `inspectNodeLiveData` y `collectStructuredWorkflowSourceData` producen exactamente esta estructura normalizada (`records[]` / `currentPipelineItems[]`) junto con una llave determinista de entidad (`entityKey`, ej. `hito2_perfil_socio:10203040`).

---

## 2. Esquema Canónico de `workflowNodes` y `canvasLayout.nodeConfigs`

### Ejemplo A — Arquetipo 1 (`pre_agent` Determinista + Hitos `source_read` + Anti-Duplicados)
```json
{
  "trigger": "schedule_cron",
  "triggers": ["schedule_cron", "trigger_tenshi"],
  "extractors": [],
  "aiEngine": "wappy",
  "aiModel": "gemini-3.5-flash-lite",
  "memoryNode": "wappy_memory_company",
  "memories": ["wappy_memory_company", "wappy_memory_antiduplicate"],
  "inputs": [],
  "includeIfNode": true,
  "hitos": ["hito2_perfil_socio", "hito3_epp", "hito3_alturas"],
  "outputs": ["acpm_task", "google_calendar", "email_report", "wappy_notification"],
  "canvasLayout": {
    "nodeConfigs": {
      "tool_hitos_hito2_perfil_socio": {
        "hitoRole": "source_read",
        "hitoOperationMode": "read_only",
        "recordFilterMode": "critical_only"
      },
      "tool_hitos_hito3_epp": {
        "hitoRole": "source_read",
        "hitoOperationMode": "read_only",
        "recordFilterMode": "critical_only"
      },
      "tool_hitos_hito3_alturas": {
        "hitoRole": "source_read",
        "hitoOperationMode": "read_only",
        "recordFilterMode": "critical_only"
      },
      "sub_memory_wappy_memory_antiduplicate": {
        "dedupWindow": "7d"
      },
      "if_router": {
        "ifPlacement": "pre_agent",
        "ifConditionLabel": "¿Nuevos vencimientos <= 30d?",
        "ifConditionType": "critical_findings",
        "ifRuleExpression": "vencido, próximo a vencer, sin soporte"
      },
      "out_acpm_task": { "ifBranch": "yes" },
      "out_google_calendar": { "ifBranch": "yes" },
      "out_email_report": { "ifBranch": "yes" },
      "out_wappy_notification": { "ifBranch": "no" }
    }
  }
}
```

### Ejemplo B — Arquetipo 2 (Ingesta Externa Drive ➔ `pre_agent` Archivos Nuevos ➔ Agente IA ➔ Hito `target_write_report` ➔ Salidas)
```json
{
  "trigger": "schedule_cron",
  "triggers": ["schedule_cron", "trigger_tenshi"],
  "extractors": ["extract_drive"],
  "aiEngine": "wappy",
  "aiModel": "gemini-3.8-flash",
  "memoryNode": "wappy_memory_company",
  "memories": ["wappy_memory_company", "wappy_memory_antiduplicate", "wappy_memory_procedural"],
  "inputs": [],
  "includeIfNode": true,
  "hitos": ["hito7_investigacion_atel"],
  "outputs": ["email_report", "acpm_task", "canvas_doc", "wappy_notification"],
  "canvasLayout": {
    "nodeConfigs": {
      "extractor_extract_drive": {
        "driveFolderName": "FURAT",
        "fileTypeFilter": "pdf"
      },
      "sub_memory_wappy_memory_antiduplicate": {
        "dedupWindow": "all"
      },
      "if_router": {
        "ifPlacement": "pre_agent",
        "ifConditionLabel": "¿Nuevo FURAT sin investigar?",
        "ifConditionType": "new_external_items",
        "ifRuleExpression": ">= 1"
      },
      "tool_hitos_hito7_investigacion_atel": {
        "hitoRole": "target_write_report",
        "hitoOperationMode": "write_register",
        "appActionMode": "write_and_report",
        "generateAppReport": true
      },
      "out_email_report": { "ifBranch": "yes" },
      "out_acpm_task": { "ifBranch": "yes" },
      "out_canvas_doc": { "ifBranch": "yes" },
      "out_wappy_notification": { "ifBranch": "no" }
    }
  }
}
```

### Ejemplo C — Arquetipo 3 (Evento QR en Campo ➔ Agente Clasificador ➔ `post_agent` `IF` ➔ Hito `target_write_report`)
```json
{
  "trigger": "trigger_qr_worker",
  "triggers": ["trigger_qr_worker"],
  "extractors": [],
  "aiEngine": "wappy",
  "aiModel": "gemini-3.6-flash",
  "memoryNode": "wappy_memory_company",
  "memories": ["wappy_memory_company", "wappy_memory_procedural"],
  "inputs": ["pronostico_clima_sst"],
  "includeIfNode": true,
  "hitos": ["hito4_actos_condiciones"],
  "outputs": ["acpm_task", "email_report", "wappy_notification"],
  "canvasLayout": {
    "nodeConfigs": {
      "trigger_root": {
        "qrPortalFilter": "condiciones"
      },
      "if_router": {
        "ifPlacement": "post_agent",
        "ifConditionLabel": "¿Peligro Crítico / Alto Riesgo?",
        "ifConditionType": "ai_verdict",
        "ifRuleExpression": "riesgo alto, peligro inminente, condición crítica"
      },
      "tool_hitos_hito4_actos_condiciones": {
        "hitoRole": "target_write_report",
        "hitoOperationMode": "write_register",
        "appActionMode": "write_and_report",
        "generateAppReport": true
      },
      "out_acpm_task": { "ifBranch": "yes" },
      "out_email_report": { "ifBranch": "yes" },
      "out_wappy_notification": { "ifBranch": "no" }
    }
  }
}
```

---

## 3. Tabla Rápida de Decisiones para el Arquitecto de Flujos

1. **¿Debo poner `extract_sst_workers` si ya tengo `hito2_perfil_socio`?**  
   **NO.** `hito2_perfil_socio` ya lee la nómina completa (`SgsstWorker` + `PerfilSociodemograficoData`), EMO, demografía y restricciones médicas.
2. **¿Debo poner `somos_sst_epp` si ya tengo `hito3_epp`?**  
   **NO.** `hito3_epp` ya inspecciona entregas firmadas, inventario de EPP y solicitudes QR pendientes.
3. **¿Debo poner `extract_sst_app` si ya tengo `hito2_matriz_ipevar` o `hito3_matriz_pesv`?**  
   **NO.** El nodo específico del aplicativo Hito es más expresivo en el lienzo, tiene sus propias casillas quirúrgicas en el inspector de 3 paneles y evita doble consulta.
4. **¿Cuándo usar `logic_merge`?**  
   Solo cuando existen **2 o más fuentes de lectura distintas** en Etapa 2 (ej. `hito2_perfil_socio` + `hito3_alturas` + `hito3_epp`, o `hito2_condiciones_salud` + `hito7_ausentismo`) que deban consolidarse por llave común (`cedula` / `area` / `placa`).
5. **¿Cuándo usar `logic_human_approval`?**  
   En flujos ejecutivos, legales o de radicación oficial (Alta Dirección, Matriz Legal, Investigación ATEL grave, Presupuesto SST) donde el Responsable SG-SST o Representante Legal debe dar Visto Bueno antes de despachar el documento final.
