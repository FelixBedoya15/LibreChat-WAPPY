# 📚 Enciclopedia Oficial SmartDown de Nodos — Constructor de Automatizaciones & Flujos Tenshi WAPPY IA

> **Fuente Canónica Determinista:** Generada desde `client/src/components/SGSST/workflowNodesCatalog.ts` + `api/server/services/workflowNodesDocumentationService.js`.
> **Cobertura Total:** **177 Nodos Oficiales** (**162 Activos en Producción** · **15 En Construcción con Guardia Segura**) distribuidos en las **8 Familias del Lienzo Causal estilo `n8n` (`AI Agent` + `Tools`)**.

---

## 🧭 Arquitectura Causal de Izquierda a Derecha (`AI Agent` + `Herramienta +`)

```
[1. Disparadores] ──▶ [2. Extractores / Hitos source_read] ──▶ [8. Merge / Condición Si/No pre_agent] ──▶ [✨ Extractor IA Docs] ──▶ [3. Agente IA] ──▶ [8. IF post_agent / Visto Bueno] ──▶ [7. Salidas]
                                                                                                                                         ▲   ▲   ▲
                                                                                                                               [Modelo IA] [Memoria ◆] [Herramienta + (Conectores, Scrapers, Forense & Hitos agent_tool)]
```

### Tabla Resumen de las 8 Familias de Nodos

| # | Familia Oficial (`familyId`) | Ubicación en el Lienzo | Total | ✅ Activos | 🚧 En Construcción |
| :---: | :--- | :--- | :---: | :---: | :---: |
| 1 | **1. Disparadores de Inicio (Triggers)** (`triggers`) | Etapa 1 — Inicio del Flujo (Columna Izquierda) | **9** | 8 | 1 |
| 2 | **2. Extractores Documentales, OCR y Scrapers OSINT** (`extractors`) | Etapa 2 — Lectura Externa / OCR / Portales Oficiales (o Puerto Herramienta +) | **16** | 13 | 3 |
| 3 | **3. Cerebro Agente IA y Motores LLM** (`ai_models`) | Etapa 4 — Clúster Central del Agente IA y Rombo ◆ Modelo IA | **6** | 6 | 0 |
| 4 | **4. Memorias Contextuales, Anti-Duplicados y RAG** (`memories`) | Puerto Inferior ◆ Memoria (Debajo del Agente IA) | **4** | 4 | 0 |
| 5 | **5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes** (`input_connectors`) | Puerto Inferior ◆ Herramienta + / Pases Multi-Agente | **75** | 72 | 3 |
| 6 | **6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos)** (`hitos_sgsst`) | Etapa 2 (source_read) o Puerto Inferior ◆ Herramienta + (agent_tool) | **50** | 42 | 8 |
| 7 | **7. Bitácora, Informes Oficiales y Salidas** (`outputs`) | Etapa 6 — Cierre y Despacho Multicanal (Columna Derecha) | **11** | 11 | 0 |
| 8 | **8. Control Lógico DAG y Compuertas de Gobernanza** (`logic_dag`) | Etapa 3 (Pre-IA) o Etapa 5 (Post-IA / Visto Bueno Humano) | **6** | 6 | 0 |
| — | **TOTAL ECOSISTEMA WAPPY IA** | **8 Familias Completas** | **177** | **162** | **15** |

---

## 📑 Índice Maestro de Nodos por Familia

### 1. Disparadores de Inicio (Triggers) (9 nodos)

| ID (`id`) | Nombre en Lienzo | Forma | Antigravity | Estado |
| :--- | :--- | :---: | :---: | :---: |
| `schedule_cron` | **Reloj / Cron Programado (Por Horario)** | `square` | ☁️ Nativo | ✅ Activo |
| `trigger_tenshi` | **Tenshi IA (Orden por Voz o Chat)** | `square` | ☁️ Nativo | ✅ Activo |
| `trigger_antigravity` | **Google Antigravity Local (Puente MCP / Mac / PC)** | `square` | 🛰️ Sí | ✅ Activo |
| `trigger_antigravity_cloud` | **Google Antigravity Cloud 24/7 (antigravity.google.com)** | `square` | 🛰️ Sí | ✅ Activo |
| `trigger_email` | **Correo Electrónico Entrante (Gmail)** | `square` | ☁️ Nativo | ✅ Activo |
| `trigger_agent` | **Otro Agente Especialista IA (Delegación)** | `square` | ☁️ Nativo | ✅ Activo |
| `trigger_qr_worker` | **Reporte QR de Trabajador en Campo** | `square` | ☁️ Nativo | ✅ Activo |
| `trigger_webhook` | **Webhook / Evento Externo API (Buk RRHH / ERP)** | `square` | ☁️ Nativo | ✅ Activo |
| `trigger_whatsapp` | **WhatsApp Entrante (Bot Oficial / Audio / Fotos en Campo)** | `square` | ☁️ Nativo | 🚧 En Construcción |

### 2. Extractores Documentales, OCR y Scrapers OSINT (16 nodos)

| ID (`id`) | Nombre en Lienzo | Forma | Antigravity | Estado |
| :--- | :--- | :---: | :---: | :---: |
| `extract_gmail` | **Leer Bandeja de Gmail (Extraer Correos y Reportes)** | `square` | ☁️ Nativo | ✅ Activo |
| `extract_drive` | **Extraer de Google Drive (Carpetas / Excel / PDF)** | `square` | ☁️ Nativo | ✅ Activo |
| `extract_onedrive` | **Extraer de Microsoft OneDrive / SharePoint (En Construcción)** | `square` | ☁️ Nativo | 🚧 En Construcción |
| `extract_pc_folder` | **Extraer de Carpeta en mi Computador (vía Antigravity)** | `square` | 🛰️ Sí | ✅ Activo |
| `extract_ai_doc_ocr` | **✨ Extractor IA de Documentos (PDF / OCR -> Datos Exactos)** | `square` | ☁️ Nativo | ✅ Activo |
| `extract_sst_workers` | **Extraer Trabajadores y Expedientes (Somos SST)** | `square` | ☁️ Nativo | ✅ Activo |
| `extract_sst_app` | **Extraer Datos de Aplicativo / Matriz (Somos SST)** | `square` | ☁️ Nativo | ✅ Activo |
| `extract_web_scraping_agy` | **Web Scraping Inteligente (Hasta 5 URLs · Auto DOM / Navegador Nativo AGY / Script)** | `square` | 🛰️ Sí | ✅ Activo |
| `scraper_agy_alto_riesgo` | **🪖 Certificados Alto Riesgo y SENA por Cédula (vía Antigravity)** | `square` | 🛰️ Sí | ✅ Activo |
| `scraper_agy_arl_directo` | **🛡️ Certificados de ARL Directos por Cédula (vía Antigravity)** | `square` | 🛰️ Sí | ✅ Activo |
| `scraper_agy_pensiones_directo` | **🏦 Fondos de Pensiones Directos — Sin RUAF (En Construcción)** | `square` | 🛰️ Sí | 🚧 En Construcción |
| `scraper_agy_salud_rethus` | **🏥 Salud EPS (ADRES) y ReTHUS por Cédula (En Construcción)** | `square` | 🛰️ Sí | 🚧 En Construcción |
| `scraper_agy_vial_pesv` | **🚗 Seguridad Vial PESV: SIMIT y RUNT por Cédula o Placa (vía Antigravity)** | `square` | 🛰️ Sí | ✅ Activo |
| `scraper_agy_antecedentes` | **⚖️ Antecedentes y Procesos Judiciales por Cédula (vía Antigravity)** | `square` | 🛰️ Sí | ✅ Activo |
| `forensic_doc_verifier` | **🔬 Auditoría Forense de Incapacidades y Documentos (EXIF/PDF + Visión IA + Dec. 1427)** | `square` | ☁️ Nativo | ✅ Activo |
| `extract_web_search` | **Búsqueda en la Web en Tiempo Real (MinTrabajo / SUIN / ARL)** | `square` | ☁️ Nativo | ✅ Activo |

### 3. Cerebro Agente IA y Motores LLM (6 nodos)

| ID (`id`) | Nombre en Lienzo | Forma | Antigravity | Estado |
| :--- | :--- | :---: | :---: | :---: |
| `agent_root` | **🤖 Agente IA Principal (Orquestador Cognitivo estilo n8n AI Agent)** | `agent_cluster` | 🛰️ Sí | ✅ Activo |
| `wappy_gemini_3_6_flash` | **WAPPY IA · Gemini 3.6 Flash (Key Rotation)** | `circle` | ☁️ Nativo | ✅ Activo |
| `wappy_gemini_3_5_flash_lite` | **WAPPY IA · Gemini 3.5 Flash Lite (Ultra Rápido)** | `circle` | ☁️ Nativo | ✅ Activo |
| `wappy_gemini_3_8_flash` | **WAPPY IA · Gemini 3.8 Flash (Análisis Profundo)** | `circle` | ☁️ Nativo | ✅ Activo |
| `antigravity_mcp_engine` | **Google Antigravity Local (Mac/PC) + MCP WAPPY (110+ Tools)** | `circle` | 🛰️ Sí | ✅ Activo |
| `antigravity_cloud_mcp_engine` | **Google Antigravity Cloud 24/7 (antigravity.google.com) + MCP WAPPY** | `circle` | 🛰️ Sí | ✅ Activo |

### 4. Memorias Contextuales, Anti-Duplicados y RAG (4 nodos)

| ID (`id`) | Nombre en Lienzo | Forma | Antigravity | Estado |
| :--- | :--- | :---: | :---: | :---: |
| `wappy_memory_company` | **Memoria de Empresa Activa (Somos SST)** | `circle` | ☁️ Nativo | ✅ Activo |
| `wappy_memory_antiduplicate` | **Memoria de Bitácora Previa (Anti-Duplicados)** | `circle` | ☁️ Nativo | ✅ Activo |
| `wappy_rag_documental` | **Memoria Documental RAG (NotebookLM + Docs Vivo)** | `circle` | 🛰️ Sí | ✅ Activo |
| `wappy_memory_procedural` | **Memoria Normativa del Especialista (Reglas SST)** | `circle` | ☁️ Nativo | ✅ Activo |

### 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes (75 nodos)

| ID (`id`) | Nombre en Lienzo | Forma | Antigravity | Estado |
| :--- | :--- | :---: | :---: | :---: |
| `somos_sst_empresa` | **Contexto Empresa Activa (Somos SST)** | `circle` | ☁️ Nativo | ✅ Activo |
| `somos_sst_trabajadores` | **Bio-Motor Trabajadores y Expedientes 360°** | `circle` | ☁️ Nativo | ✅ Activo |
| `somos_sst_perfiles_cargo` | **Perfiles de Cargo y Funciones (Somos SST)** | `circle` | ☁️ Nativo | ✅ Activo |
| `somos_sst_epp` | **Control y Entregas de EPP por Trabajador (Somos SST)** | `circle` | ☁️ Nativo | ✅ Activo |
| `somos_sst_examenes` | **Evaluaciones Médicas Ocupacionales EMO (Res. 1843)** | `circle` | ☁️ Nativo | ✅ Activo |
| `matriz_ipevar` | **Motor Matriz IPEVAR / GTC-45** | `circle` | ☁️ Nativo | ✅ Activo |
| `matriz_pesv` | **Motor Matriz Vial PESV (Res. 40595)** | `circle` | ☁️ Nativo | ✅ Activo |
| `matriz_compatibilidad` | **Motor Químico SGA (Dec. 1496 / ONU)** | `circle` | ☁️ Nativo | ✅ Activo |
| `consultar_analitica_psicosocial` | **Analítica Psicosocial y Clima Laboral** | `circle` | ☁️ Nativo | ✅ Activo |
| `consultar_analitica_actos_condiciones` | **Analítica de Actos y Condiciones Inseguras** | `circle` | ☁️ Nativo | ✅ Activo |
| `canvas_doc` | **Editor Vivo / Canvas Documental WAPPY (Word/PDF)** | `circle` | ☁️ Nativo | ✅ Activo |
| `cursos_lms` | **Academia WAPPY LMS (Cursos y Progreso)** | `circle` | ☁️ Nativo | ✅ Activo |
| `google_drive` | **Google Drive (Carpetas/PDF/Excel/FURAT)** | `circle` | ☁️ Nativo | ✅ Activo |
| `google_sheets` | **Google Sheets (Hojas de Cálculo)** | `circle` | ☁️ Nativo | ✅ Activo |
| `google_docs` | **Google Docs (Documentos e Informes)** | `circle` | ☁️ Nativo | ✅ Activo |
| `google_slides` | **Google Slides (Presentaciones Ejecutivas)** | `circle` | ☁️ Nativo | ✅ Activo |
| `google_gmail` | **Google Gmail (Bandeja de Correo)** | `circle` | ☁️ Nativo | ✅ Activo |
| `google_calendar` | **Google Calendar (Agenda y Citaciones)** | `circle` | ☁️ Nativo | ✅ Activo |
| `notebooklm` | **Google NotebookLM (Cuadernos RAG y Studio)** | `circle` | 🛰️ Sí | ✅ Activo |
| `google_flow` | **Google Flow Studio (Imágenes y Video Veo)** | `circle` | 🛰️ Sí | ✅ Activo |
| `web_search` | **Búsqueda Web Legal en Vivo (MinTrabajo/SUIN)** | `circle` | ☁️ Nativo | ✅ Activo |
| `pronostico_clima_sst` | **OpenWeather API (Clima y Alertas SST)** | `circle` | ☁️ Nativo | ✅ Activo |
| `consultar_pubchem_quimico` | **PubChem NIH (Fichas Químicas y GHS)** | `circle` | ☁️ Nativo | ✅ Activo |
| `consultar_medlineplus_rehabilitacion` | **MedlinePlus NIH (Guías CIE-10 / Rehab)** | `circle` | ☁️ Nativo | ✅ Activo |
| `buscar_centros_emergencia` | **OpenStreetMap API (Hospitales / Bomberos)** | `circle` | ☁️ Nativo | ✅ Activo |
| `webhook_api` | **Webhook API / Integración Buk RRHH** | `circle` | ☁️ Nativo | ✅ Activo |
| `google_antigravity` | **Google Antigravity Local (Navegador Nativo + Puente MCP Mac/PC)** | `circle` | 🛰️ Sí | ✅ Activo |
| `google_antigravity_cloud` | **Google Antigravity Cloud 24/7 (MCP Cloud)** | `circle` | 🛰️ Sí | ✅ Activo |
| `tool_web_scraping_agy` | **Web Scraping en Vivo (Auto DOM / Navegador Nativo Antigravity)** | `circle` | 🛰️ Sí | ✅ Activo |
| `one_drive` | **Microsoft OneDrive / SharePoint (En Construcción)** | `circle` | ☁️ Nativo | 🚧 En Construcción |
| `skill_sgsst_tools` | **Skill: Herramientas Operativas SG-SST (GTC-45, PESV y SGA)** | `circle` | ☁️ Nativo | ✅ Activo |
| `skill_google_connectors` | **Skill: Conectores Google Workspace, NotebookLM & Antigravity** | `circle` | ☁️ Nativo | ✅ Activo |
| `skill_web_scraper_script` | **Skill: Web Scraping & Extracción Estructurada (Antigravity)** | `circle` | ☁️ Nativo | ✅ Activo |
| `skill_auditoria_normativa` | **Skill: Auditoría Jurídica SST Colombia (Dec. 1072 / Res. 0312)** | `circle` | ☁️ Nativo | ✅ Activo |
| `subagent_editable_custom` | **✏️ Sub-Agente Editable (Personalizable a tu Medida)** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_consultor_sgsst` | **Sub-Agente de Chat: Consultor SG-SST** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_tenshi` | **Sub-Agente de Chat: Tenshi (Copiloto Inteligente 3D)** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_abogado_laboral` | **Sub-Agente de Chat: Abogado Laboral SST** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_medico_laboral` | **Sub-Agente de Chat: Médico Laboral & EMO** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_fisioterapeuta` | **Sub-Agente de Chat: Fisioterapeuta Laboral & Ergonomía** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_psicologo_sst` | **Sub-Agente de Chat: Psicólogo Especialista SST** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_terapeuta_mental` | **Sub-Agente de Chat: Terapeuta en Salud Mental** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_nutricionista` | **Sub-Agente de Chat: Nutricionista Laboral** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_primer_respondiente` | **Sub-Agente de Chat: Primer Respondiente & Primeros Auxilios** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_emergencias` | **Sub-Agente de Chat: Coordinador de Emergencias** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_bioseguridad` | **Sub-Agente de Chat: Especialista en Bioseguridad** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_electricista` | **Sub-Agente de Chat: Ingeniero Electricista SST (RETIE)** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_quimico` | **Sub-Agente de Chat: Ingeniero Químico SST (SGA)** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_seguridad_vial` | **Sub-Agente de Chat: Coordinador de Seguridad Vial (PESV)** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_tareas_criticas` | **Sub-Agente de Chat: Coordinador de Tareas de Alto Riesgo (TAR)** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_minas` | **Sub-Agente de Chat: Ingeniero de Minas SST** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_auditor_calidad` | **Sub-Agente de Chat: Auditor SG-SST (Res. 0312 / ISO 45001)** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_ambiental` | **Sub-Agente de Chat: Ingeniero Ambiental & SGA** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_redactor` | **Sub-Agente de Chat: Redactor Creativo & Comunicaciones SST** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_profesional_sst` | **Sub-Agente de Chat: Profesional SST en Campo** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_capacitaciones` | **Sub-Agente de Chat: Coordinador de Capacitaciones & LMS** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_climatico` | **Sub-Agente de Chat: Especialista en Riesgo Climático & Térmico** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_chat_simulador_atel` | **Sub-Agente de Chat: Simulador & Investigador de Accidentes ATEL** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_researcher` | **Sub-Agente: Investigador Web & Vigencia Normativa** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_scraper_agy` | **Sub-Agente: Ingeniero de Web Scraping (Antigravity)** | `agent_cluster` | 🛰️ Sí | ✅ Activo |
| `subagent_analista_ausentismo` | **Sub-Agente: Analista de Ausentismo, Incapacidades y Siniestralidad** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_validador_seguridad_social` | **Sub-Agente: Validador de Seguridad Social (ARL, EPS, AFP y Planilla PILA)** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_redactor_actas` | **Sub-Agente: Secretario Redactor de Actas COPASST y Convivencia (CCL)** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `subagent_sintetizador_gerencia` | **Sub-Agente: Sintetizador Ejecutivo para Alta Dirección y Gerencia** | `agent_cluster` | ☁️ Nativo | ✅ Activo |
| `rule_veracidad_estricta` | **Regla: Veracidad Estricta (Prohibido Inventar Datos)** | `circle` | ☁️ Nativo | ✅ Activo |
| `rule_solo_criticos` | **Regla: Filtrar Solo Hallazgos Críticos o Próximos a Vencer** | `circle` | ☁️ Nativo | ✅ Activo |
| `rule_reserva_legal` | **Regla: Reserva de Historia Clínica y Datos Sensibles (Res. 2346)** | `circle` | ☁️ Nativo | ✅ Activo |
| `scraper_node_antigravity` | **Nodo: Web Scraping Inteligente (Auto DOM / Navegador Nativo AGY / Script)** | `circle` | 🛰️ Sí | ✅ Activo |
| `custom_scraper_agy_alto_riesgo` | **🪖 Nodo AGY: Certificados Alto Riesgo (MinTrabajo Alturas/Confinados) y SENA** | `circle` | 🛰️ Sí | ✅ Activo |
| `custom_scraper_agy_arl_directo` | **🛡️ Nodo AGY: Certificados de ARL Directos (SURA, Positiva, Colmena, AXA, Bolívar)** | `circle` | 🛰️ Sí | ✅ Activo |
| `custom_scraper_agy_pensiones_directo` | **🏦 Nodo AGY: Fondos de Pensiones Directos — Sin RUAF (En Construcción)** | `circle` | 🛰️ Sí | 🚧 En Construcción |
| `custom_scraper_agy_salud_rethus` | **🏥 Nodo AGY: Salud EPS (ADRES) y Talento Humano en Salud ReTHUS (En Construcción)** | `circle` | 🛰️ Sí | 🚧 En Construcción |
| `custom_scraper_agy_vial_pesv` | **🚗 Nodo AGY: Seguridad Vial PESV (SIMIT y RUNT por Cédula o Placa)** | `circle` | 🛰️ Sí | ✅ Activo |
| `custom_scraper_agy_antecedentes` | **⚖️ Nodo AGY: Antecedentes y Procesos Judiciales (Rama, Contraloría, Procuraduría, Policía)** | `circle` | 🛰️ Sí | ✅ Activo |
| `search_node_live_web` | **Nodo: Búsqueda en la Web en Vivo (Consultas y Normas)** | `circle` | ☁️ Nativo | ✅ Activo |

### 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) (50 nodos)

| ID (`id`) | Nombre en Lienzo | Forma | Antigravity | Estado |
| :--- | :--- | :---: | :---: | :---: |
| `hito1_dofa` | **Hito 1 · Contexto y Partes Interesadas (DOFA / Stakeholders)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito1_diagnostico_0312` | **Hito 1 · Diagnóstico Inicial Estándares Mínimos (Res. 0312)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito1_responsable` | **Hito 1 · Responsable SG-SST (Licencia e Idoneidad)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito1_politica_objetivos` | **Hito 1 · Política de SST** | `square` | ☁️ Nativo | ✅ Activo |
| `hito1_objetivos` | **Hito 1 · Objetivos de SST (Indicadores)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito1_matriz_legal` | **Hito 1 · Matriz Legal** | `square` | ☁️ Nativo | 🚧 En Construcción |
| `hito1_rhs` | **Hito 1 · Reglamento de Higiene (RHS)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito1_rit` | **Hito 1 · Reglamento Interno (RIT)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito1_participacion_ipevar` | **Hito 1 · Participación IPEVR Comunitaria** | `square` | ☁️ Nativo | ✅ Activo |
| `hito2_matriz_ipevar` | **Hito 1 · Matriz IPEVR (GTC 45)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito3_matriz_pesv` | **Hito 1 · Matriz de Riesgos Viales (PESV)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito3_quimicos_sga` | **Hito 1 · Matriz de Compatibilidad Química (SGA)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito1_oportunidades_sst` | **Hito 1 · Riesgos del Sistema y Oportunidades SST** | `square` | ☁️ Nativo | ✅ Activo |
| `hito6_vulnerabilidad` | **Hito 1 · Análisis de Vulnerabilidad** | `square` | ☁️ Nativo | ✅ Activo |
| `hito1_plan_emergencias` | **Hito 1 · Plan de Emergencias y Contingencias (PPRE)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito2_perfiles_cargo` | **Hito 2 · Perfiles de Cargo (Roles)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito2_perfil_socio` | **Hito 2 · Perfil Sociodemográfico** | `square` | ☁️ Nativo | ✅ Activo |
| `hito2_condiciones_salud` | **Hito 2 · Informe Condiciones de Salud** | `square` | ☁️ Nativo | ✅ Activo |
| `hito2_oraculo_predictivo` | **Hito 2 · Dictamen de Compatibilidad Cargo-Persona** | `square` | ☁️ Nativo | ✅ Activo |
| `hito4_comites` | **Hito 3 · COPASST / Vigía de SST** | `square` | ☁️ Nativo | ✅ Activo |
| `hito3_cocolab` | **Hito 3 · Comité de Convivencia Laboral** | `square` | ☁️ Nativo | ✅ Activo |
| `hito3_comite_pesv` | **Hito 3 · Comité de Seguridad Vial (CSV - PESV)** | `square` | ☁️ Nativo | 🚧 En Construcción |
| `hito3_brigada_emergencias` | **Hito 3 · Brigada de Emergencias & Comité de Crisis (SCI)** | `square` | ☁️ Nativo | 🚧 En Construcción |
| `hito4_bio_ipevar` | **Hito 4 · Matriz Bio-IPEVR** | `square` | ☁️ Nativo | ✅ Activo |
| `hito3_owas` | **Hito 4 · Método OWAS (Evaluación Ergonómica)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito3_estudio_puesto` | **Hito 4 · Estudio de Puesto de Trabajo (EPT)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito4_psicosocial` | **Hito 4 · Termómetro Psicosocial** | `square` | ☁️ Nativo | ✅ Activo |
| `hito5_compras_sst` | **Hito 5 · Compras y Adquisiciones en SST** | `square` | ☁️ Nativo | ✅ Activo |
| `hito5_contratistas` | **Hito 5 · Control y Gestión de Contratistas** | `square` | ☁️ Nativo | ✅ Activo |
| `hito5_gestion_cambio` | **Hito 5 · Gestión del Cambio en SST (MOC)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito3_ats` | **Hito 5 · Análisis de Trabajo Seguro (ATS)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito3_alturas` | **Hito 5 · Permiso de Trabajo en Alturas** | `square` | ☁️ Nativo | ✅ Activo |
| `hito5_equipos_alturas` | **Hito 5 · Hoja de Vida de Equipos de Alturas** | `square` | ☁️ Nativo | ✅ Activo |
| `hito3_epp` | **Hito 5 · Entrega y Seguimiento de EPP** | `square` | ☁️ Nativo | ✅ Activo |
| `hito5_registro_quimico` | **Hito 5 · Registro y Rótulo de Productos Químicos** | `square` | ☁️ Nativo | ✅ Activo |
| `hito3_vehiculos` | **Hito 5 · Hoja de Vida Automotores (PESV)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito5_equipos_emergencia` | **Hito 5 · Inventario e Inspección de Equipos de Emergencia** | `square` | ☁️ Nativo | 🚧 En Construcción |
| `hito6_comunicaciones_sst` | **Hito 6 · Plan y Matriz de Comunicaciones SST** | `square` | ☁️ Nativo | 🚧 En Construcción |
| `hito5_capacitaciones` | **Hito 6 · Programa de Capacitación SG-SST** | `square` | ☁️ Nativo | ✅ Activo |
| `hito6_ruta_aprendizaje` | **Hito 6 · Rutas de Aprendizaje (LMS)** | `square` | ☁️ Nativo | ✅ Activo |
| `hito4_actos_condiciones` | **Hito 6 · Reporte de Actos y Condiciones** | `square` | ☁️ Nativo | ✅ Activo |
| `hito6_simulacros_emergencia` | **Hito 6 · Gestión y Evaluación de Simulacros de Emergencia** | `square` | ☁️ Nativo | 🚧 En Construcción |
| `hito6_app_builder` | **Hito 6 · Creador de Aplicativos (App Builder)** | `square` | ☁️ Nativo | 🚧 En Construcción |
| `hito7_estadisticas_atel` | **Hito 7 · Gestión Integral de Ausentismo & ATEL** | `square` | ☁️ Nativo | ✅ Activo |
| `hito7_investigacion_atel` | **Hito 7 · Investigación ATEL** | `square` | ☁️ Nativo | ✅ Activo |
| `hito7_acpm` | **Hito 7 · Tablero Kanban ACPM** | `square` | ☁️ Nativo | ✅ Activo |
| `hito7_auditoria` | **Hito 7 · Informe de Auditoría SG-SST** | `square` | ☁️ Nativo | ✅ Activo |
| `hito7_alta_direccion` | **Hito 7 · Revisión por la Alta Dirección** | `square` | ☁️ Nativo | ✅ Activo |
| `hito7_investigacion_profunda` | **Hito 7 · Investigación Profunda SST** | `square` | ☁️ Nativo | 🚧 En Construcción |
| `hito8_predictivo` | **Hito 8 · Centro de Inteligencia Predictiva** | `square` | ☁️ Nativo | ✅ Activo |

### 7. Bitácora, Informes Oficiales y Salidas (11 nodos)

| ID (`id`) | Nombre en Lienzo | Forma | Antigravity | Estado |
| :--- | :--- | :---: | :---: | :---: |
| `email_report` | **Enviar Bitácora Completa a Gmail / Correo Electrónico** | `square` | ☁️ Nativo | ✅ Activo |
| `wappy_notification` | **Enviar Notificación Directa en WAPPY + Chat de Tenshi** | `square` | ☁️ Nativo | ✅ Activo |
| `antigravity_local_report` | **Enviar Resultado / Bitácora a Google Antigravity (Mi PC)** | `square` | 🛰️ Sí | ✅ Activo |
| `antigravity_cloud_report` | **Enviar Resultado / Bitácora a Google Antigravity Cloud 24/7** | `square` | 🛰️ Sí | ✅ Activo |
| `somos_sst_update` | **Alimentar / Guardar Cambios en Aplicativo Somos SST** | `square` | ☁️ Nativo | ✅ Activo |
| `acpm_task` | **Crear Actividad en el Centro de Control (en Cualquiera de sus Etapas)** | `square` | ☁️ Nativo | ✅ Activo |
| `out_canvas_doc` | **Crear Documento Formal en Editor en Vivo WAPPY (LiveEditor)** | `square` | ☁️ Nativo | ✅ Activo |
| `out_google_docs` | **Crear / Actualizar Informe en Google Docs** | `square` | ☁️ Nativo | ✅ Activo |
| `out_google_sheets` | **Registrar / Actualizar Filas en Google Sheets** | `square` | ☁️ Nativo | ✅ Activo |
| `out_google_calendar` | **Agendar Recordatorio / Auditoría en Google Calendar** | `square` | ☁️ Nativo | ✅ Activo |
| `out_google_slides` | **Generar Presentación en Google Slides** | `square` | ☁️ Nativo | ✅ Activo |

### 8. Control Lógico DAG y Compuertas de Gobernanza (6 nodos)

| ID (`id`) | Nombre en Lienzo | Forma | Antigravity | Estado |
| :--- | :--- | :---: | :---: | :---: |
| `if_router` | **🔀 Condición Si/No (Enrutador Causal pre_source / pre_agent / post_agent)** | `square` | ☁️ Nativo | ✅ Activo |
| `merge` | **🔗 Unir Ramas (Merge de Fuentes Paralelas en Etapa 2)** | `square` | ☁️ Nativo | ✅ Activo |
| `loop` | **🔁 Iterar Lotes (Loop Controlado para Nóminas o Archivos Grandes)** | `square` | ☁️ Nativo | ✅ Activo |
| `human_approval` | **🛑 Aprobación Humana (Compuerta de Visto Bueno antes de Despachar)** | `square` | ☁️ Nativo | ✅ Activo |
| `filter` | **🧹 Filtro Quirúrgico de Registros (Filter)** | `square` | ☁️ Nativo | ✅ Activo |
| `switch` | **🧭 Enrutador Multi-Caso (Switch por Nivel de Riesgo / Origen)** | `square` | ☁️ Nativo | ✅ Activo |

---

## 📖 Fichas Técnicas Completas SmartDown (Nodo por Nodo)

## 1. Disparadores de Inicio (Triggers)

> Inician la ejecución del flujo con semántica OR por horario programado (Cron), voz/chat en Tenshi, correo entrante, formulario QR en campo, delegación multi-agente, Webhook REST o Google Antigravity.

### Reloj / Cron Programado (Por Horario)
- **ID Técnico (`id`):** `schedule_cron` · **Etiqueta Corta:** `Cron Programado`
- **Familia:** 1. Disparadores de Inicio (Triggers) · **Categoría:** `trigger`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Dispara la tarea automáticamente según la frecuencia y hora programada.

**Operación Técnica:** `Ejecución periódica programada según calendario (Cron)` · Módulo: *⚡ Disparador · Reloj / Cron Programado (Por Horario)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 1 (Extremo Izquierdo) — Inicio del Flujo con semántica OR
- **Puertos de Conexión:** ● Salida Derecha (dispara Etapa 2 o Enrutador pre_source)
- **Canales de Invocación:** Motor automático `automationScheduler.js` según horario Cron configurado en `/tareas` o botón manual **▶ Ejecutar Ahora**.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Programación (`scheduleType` + `scheduleConfig`):** Elige `"daily"`, `"weekly"`, `"monthly"` o `"hourly"`, indicando `hour`, `minute` y `daysOfWeek` (expresión Cron sincronizada).
- **Casillas / Campos Reales Disponibles (9):** `Frecuencia de Ejecución (Diaria / Semanal / Quincenal / Mensual)`, `Hora Exacta de Disparo y Zona Horaria (America/Bogota)`, `Ventana Horaria Laboral Permitida (Lunes a Sábado)`, `Horizonte de Barrido Preventivo (Vencimientos a 30, 15 y 7 Días)`, `Filtro de Novedades desde la Última Corrida Exitosa`, `Omitir Ejecución si No Hay Cambios ni Alertas Nuevas`, `Reintento Automático en Caso de Timeout de Red`, `Registro de Marca de Tiempo en Bitácora de Auditoría`, `Contexto de Empresa Activa Vinculada al Cron`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Barrido Preventivo de Vencimientos (30/15/7 Días) + Solo Novedades** — Configuración ideal para vigilancia periódica sin correos repetidos (4 campos)
  * **⚡ Corte Ejecutivo Programado + Bitácora de Auditoría** — Ejecución puntual en horario Bogotá con trazabilidad completa (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Evento disparador externo o temporal (reloj Cron, instrucción de voz/texto en Tenshi con `attachedMedia` opcional, payload JSON de Webhook o formulario QR).
- **Salida (`OUTPUT`):** Contexto inicial de corrida (`triggerSource`, `eventPayload`, `userInstruction`, `companyId` aislado) que activa los extractores o el enrutador condicional.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Perfil Sociodemográfico (Hito 2)] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Condiciones de Salud] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, explícame cómo configurar el disparador Cron Programado en mis automatizaciones de /tareas.»

---

### Tenshi IA (Orden por Voz o Chat)
- **ID Técnico (`id`):** `trigger_tenshi` · **Etiqueta Corta:** `Tenshi IA`
- **Familia:** 1. Disparadores de Inicio (Triggers) · **Categoría:** `trigger`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Tenshi dispara esta tarea al instante cuando se lo ordenas por voz o en el chat.

**Operación Técnica:** `Disparo bajo demanda ordenado a Tenshi IA por voz o chat` · Módulo: *⚡ Disparador · Tenshi IA (Orden por Voz o Chat)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 1 (Extremo Izquierdo) — Inicio del Flujo con semántica OR
- **Puertos de Conexión:** ● Salida Derecha (dispara Etapa 2 o Enrutador pre_source)
- **Canales de Invocación:** Voz en vivo con Tenshi (`Gemini Live`) o mensaje directo en el chat de Tenshi (`gestor_automatizaciones` ➔ `ejecutar_tenshi`).

#### 3. ¿Cómo se Configura Paso a Paso?
- **Comandos de Voz y Canal (`voiceCommands` + `triggerChannel`):** Define de 3 a 5 frases naturales sin tildes en `nodeConfigs.trigger_tenshi` y `triggerChannel: "both"` (voz + chat).
- **Casillas / Campos Reales Disponibles (9):** `Comando de Voz o Instrucción en Lenguaje Natural del Usuario`, `Transcripción Verificada de Gemini Live Voice`, `Parámetros Extraídos de la Orden (Cédula, Trabajador, Sede o Hito)`, `Identidad del Usuario Solicitante y Rol en Somos SST`, `Empresa Activa en la Sesión de Tenshi IA`, `Continuidad del Hilo de Conversación Actual`, `Confirmación Acústica y Visual en el Chat al Finalizar`, `Prioridad de Ejecución Inmediata en Tiempo Real`, `Adjuntos o Documentos Enviados en el Chat`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Comando de Voz/Chat + Parámetros Extraídos (Cédula/Hito) + Respuesta en Vivo** — Captura la orden hablada o escrita a Tenshi y responde en el mismo chat (5 campos)
  * **⚡ Ejecución con Adjuntos del Chat + Prioridad Tiempo Real** — Procesa archivos o reportes subidos directamente a Tenshi IA (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Evento disparador externo o temporal (reloj Cron, instrucción de voz/texto en Tenshi con `attachedMedia` opcional, payload JSON de Webhook o formulario QR).
- **Salida (`OUTPUT`):** Contexto inicial de corrida (`triggerSource`, `eventPayload`, `userInstruction`, `companyId` aislado) que activa los extractores o el enrutador condicional.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Tenshi IA] ──▶ [Perfil Sociodemográfico (Hito 2)] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Condiciones de Salud] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, explícame cómo configurar el disparador Tenshi IA en mis automatizaciones de /tareas.»

---

### Google Antigravity Local (Puente MCP / Mac / PC)
- **ID Técnico (`id`):** `trigger_antigravity` · **Etiqueta Corta:** `Antigravity Local`
- **Familia:** 1. Disparadores de Inicio (Triggers) · **Categoría:** `trigger`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Google Antigravity dispara esta tarea desde tu Mac/PC conectado vía Push SSE + MCP.

**Operación Técnica:** `Disparo desde Google Antigravity Local (Mac/PC) / Servidor MCP WAPPY` · Módulo: *⚡ Disparador · Google Antigravity Local (Puente MCP Mac / PC)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 1 (Extremo Izquierdo) — Inicio del Flujo con semántica OR
- **Puertos de Conexión:** ● Salida Derecha (dispara Etapa 2 o Enrutador pre_source)
- **Canales de Invocación:** Puente Reactivo Push SSE (`/api/mcp-bridge/antigravity/stream`) desde Google Antigravity Local o Cloud 24/7.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Filtros de Evento:** Configura en `nodeConfigs["trigger_antigravity"]` los filtros de seguridad (`webhookSecret`, `emailSubjectFilter`, `qrSeverityFilter` o `antigravityMode`).
- **Casillas / Campos Reales Disponibles (8):** `Orden Delegada vía Puente Reactivo Push SSE (wappy-push-daemon.js)`, `Herramienta MCP Invocada desde el IDE Local (110+ Tools WAPPY)`, `Ruta de Carpeta o Archivos Locales Adjuntos desde Mac/PC`, `Clave Personal de Autenticación (wpy_live_... Verificada)`, `Contexto de Empresa Activa Sincronizado`, `Retorno de Bitácora en Vivo hacia la Consola Local de Antigravity`, `Fallback Automático a WAPPY Cloud si el PC Entra en Reposo`, `Variables y Argumentos JSON del Comando MCP`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Orden Push SSE + Carpeta Local Mac/PC + Retorno de Bitácora** — Ejecuta órdenes lanzadas desde Antigravity en tu Mac/PC con lectura local (4 campos)
  * **⚡ Invocación MCP 110+ Tools + Fallback Cloud Automático** — Garantiza continuidad del flujo aunque el equipo local se desconecte (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Evento disparador externo o temporal (reloj Cron, instrucción de voz/texto en Tenshi con `attachedMedia` opcional, payload JSON de Webhook o formulario QR).
- **Salida (`OUTPUT`):** Contexto inicial de corrida (`triggerSource`, `eventPayload`, `userInstruction`, `companyId` aislado) que activa los extractores o el enrutador condicional.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Antigravity Local] ──▶ [Perfil Sociodemográfico (Hito 2)] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Condiciones de Salud] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, explícame cómo configurar el disparador Antigravity Local en mis automatizaciones de /tareas.»

---

### Google Antigravity Cloud 24/7 (antigravity.google.com)
- **ID Técnico (`id`):** `trigger_antigravity_cloud` · **Etiqueta Corta:** `Antigravity Cloud`
- **Familia:** 1. Disparadores de Inicio (Triggers) · **Categoría:** `trigger`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Google Antigravity Cloud (antigravity.google.com) dispara o ejecuta esta tarea 24/7 en la nube sin tu PC prendido.

**Operación Técnica:** `Disparo desde Google Antigravity Cloud 24/7 (antigravity.google.com) / Servidor MCP WAPPY` · Módulo: *⚡ Disparador · Google Antigravity Cloud 24/7 (antigravity.google.com)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 1 (Extremo Izquierdo) — Inicio del Flujo con semántica OR
- **Puertos de Conexión:** ● Salida Derecha (dispara Etapa 2 o Enrutador pre_source)
- **Canales de Invocación:** Puente Reactivo Push SSE (`/api/mcp-bridge/antigravity/stream`) desde Google Antigravity Local o Cloud 24/7.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Filtros de Evento:** Configura en `nodeConfigs["trigger_antigravity_cloud"]` los filtros de seguridad (`webhookSecret`, `emailSubjectFilter`, `qrSeverityFilter` o `antigravityMode`).
- **Casillas / Campos Reales Disponibles (8):** `Evento / Orden Disparada desde Instancia Cloud 24/7 (antigravity.google.com)`, `Ejecución Autónoma sin Necesidad de Computador Encendido`, `Conexión Directa al Servidor MCP WAPPY Cloud`, `Workspace y Proyecto Cloud Vinculado`, `Parámetros de Entrada y Objetivo del Agente Cloud`, `Sincronización con Empresa Activa en Somos SST`, `Entrega de Bitácora Final en Antigravity Cloud + WAPPY`, `Control de Cuota y Reintentos Cloud 24/7`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Disparo Cloud 24/7 + MCP WAPPY + Sincronización Somos SST** — Orquestación 100% en la nube desde antigravity.google.com sin PC prendido (4 campos)
  * **⚡ Parámetros del Agente Cloud + Bitácora Dual (Cloud + WAPPY)** — Reporta resultados tanto en la instancia Cloud como en Somos SST (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Evento disparador externo o temporal (reloj Cron, instrucción de voz/texto en Tenshi con `attachedMedia` opcional, payload JSON de Webhook o formulario QR).
- **Salida (`OUTPUT`):** Contexto inicial de corrida (`triggerSource`, `eventPayload`, `userInstruction`, `companyId` aislado) que activa los extractores o el enrutador condicional.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Antigravity Cloud] ──▶ [Perfil Sociodemográfico (Hito 2)] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Condiciones de Salud] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, explícame cómo configurar el disparador Antigravity Cloud en mis automatizaciones de /tareas.»

---

### Correo Electrónico Entrante (Gmail)
- **ID Técnico (`id`):** `trigger_email` · **Etiqueta Corta:** `Correo Entrante`
- **Familia:** 1. Disparadores de Inicio (Triggers) · **Categoría:** `trigger`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Se activa por recepción de correo electrónico (reporte ATEL, incapacidad, solicitud ARL).

**Operación Técnica:** `Disparo por recepción de correo electrónico entrante en Gmail (google_gmail)` · Módulo: *⚡ Disparador · Correo Electrónico Entrante (Gmail)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1401 de 2007 (Investigación de Incidentes y Accidentes de Trabajo) y NTC 3701.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 1 (Extremo Izquierdo) — Inicio del Flujo con semántica OR
- **Puertos de Conexión:** ● Salida Derecha (dispara Etapa 2 o Enrutador pre_source)
- **Canales de Invocación:** Evento reactivo automático en segundo plano o prueba controlada en Escenario Sandbox (`/tareas`).

#### 3. ¿Cómo se Configura Paso a Paso?
- **Filtros de Evento:** Configura en `nodeConfigs["trigger_email"]` los filtros de seguridad (`webhookSecret`, `emailSubjectFilter`, `qrSeverityFilter` o `antigravityMode`).
- **Casillas / Campos Reales Disponibles (9):** `Filtro por Palabras Clave en el Asunto (Incapacidad, FURAT, ARL, EMO, Citación, MinTrabajo)`, `Filtro por Remitente o Dominio Autorizado (ARL, EPS, IPS Ocupacional, Trabajadores)`, `Detección Obligatoria de Archivos Adjuntos (PDF, Excel, Word, Imágenes)`, `Extracción de Cédula y Nombre del Trabajador en el Cuerpo o Asunto`, `Procesar Únicamente Correos No Leídos Nuevos`, `Clasificación Automática de Prioridad / Urgencia Legal`, `Verificación Anti-Duplicados por Message-ID del Correo`, `Fecha y Hora Exacta de Recepción del Mensaje`, `Etiquetado / Marcado como Procesado en la Bandeja de Entrada`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Filtro de Asunto (Incapacidad/FURAT/EMO) + Adjuntos PDF + Cédula/Nombre** — Dispara el flujo al recibir soportes médicos o reportes de accidentes por email (4 campos)
  * **⚡ Requerimientos de ARL / MinTrabajo + Prioridad Legal + Anti-Duplicados** — Ideal para vigilancia de notificaciones oficiales y jurídicas entrantes (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Evento disparador externo o temporal (reloj Cron, instrucción de voz/texto en Tenshi con `attachedMedia` opcional, payload JSON de Webhook o formulario QR).
- **Salida (`OUTPUT`):** Contexto inicial de corrida (`triggerSource`, `eventPayload`, `userInstruction`, `companyId` aislado) que activa los extractores o el enrutador condicional.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Correo Entrante] ──▶ [Perfil Sociodemográfico (Hito 2)] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Condiciones de Salud] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, explícame cómo configurar el disparador Correo Entrante en mis automatizaciones de /tareas.»

---

### Otro Agente Especialista IA (Delegación)
- **ID Técnico (`id`):** `trigger_agent` · **Etiqueta Corta:** `Agente IA`
- **Familia:** 1. Disparadores de Inicio (Triggers) · **Categoría:** `trigger`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Un Agente Especialista de WAPPY invoca o encadena esta tarea al detectar un hallazgo.

**Operación Técnica:** `Disparo por delegación o encadenamiento desde otro Agente Especialista IA de WAPPY` · Módulo: *⚡ Disparador · Otro Agente Especialista IA (Por Delegación)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 1 (Extremo Izquierdo) — Inicio del Flujo con semántica OR
- **Puertos de Conexión:** ● Salida Derecha (dispara Etapa 2 o Enrutador pre_source)
- **Canales de Invocación:** Evento reactivo automático en segundo plano o prueba controlada en Escenario Sandbox (`/tareas`).

#### 3. ¿Cómo se Configura Paso a Paso?
- **Filtros de Evento:** Configura en `nodeConfigs["trigger_agent"]` los filtros de seguridad (`webhookSecret`, `emailSubjectFilter`, `qrSeverityFilter` o `antigravityMode`).
- **Casillas / Campos Reales Disponibles (8):** `Nombre y Rol del Agente Especialista Emisor (Orquestador / Auditor / Médico / Ergonómico)`, `Motivo del Escalamiento o Hallazgo Crítico Detectado`, `Payload Estructurado de Datos Heredados del Flujo Anterior`, `Listado de Cédulas y Trabajadores Afectados en el Hallazgo`, `Hito y Aplicativo de Somos SST Relacionado`, `Nivel de Severidad del Evento Delegado (Crítico / Alto / Moderado)`, `Instrucción Específica de Continuación para este Agente`, `Trazabilidad de Cadena Multi-Agente en Bitácora`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Agente Emisor + Hallazgo Crítico + Cédulas Afectadas + Payload Heredado** — Recibe el contexto exacto filtrado por otro agente especialista de WAPPY (4 campos)
  * **⚡ Hito SST Relacionado + Nivel de Severidad + Trazabilidad Multi-Agente** — Encadena acciones correctivas entre módulos de los 8 Hitos (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Evento disparador externo o temporal (reloj Cron, instrucción de voz/texto en Tenshi con `attachedMedia` opcional, payload JSON de Webhook o formulario QR).
- **Salida (`OUTPUT`):** Contexto inicial de corrida (`triggerSource`, `eventPayload`, `userInstruction`, `companyId` aislado) que activa los extractores o el enrutador condicional.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Agente IA] ──▶ [Perfil Sociodemográfico (Hito 2)] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Condiciones de Salud] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, explícame cómo configurar el disparador Agente IA en mis automatizaciones de /tareas.»

---

### Reporte QR de Trabajador en Campo
- **ID Técnico (`id`):** `trigger_qr_worker` · **Etiqueta Corta:** `Reporte QR`
- **Familia:** 1. Disparadores de Inicio (Triggers) · **Categoría:** `trigger`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Se dispara cuando un trabajador reporta un acto/condición insegura, inspección o encuesta vía QR.

**Operación Técnica:** `Disparo por envío de reporte QR / formulario de trabajador en campo` · Módulo: *⚡ Disparador · Reporte QR de Trabajador en Campo*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 1 (Extremo Izquierdo) — Inicio del Flujo con semántica OR
- **Puertos de Conexión:** ● Salida Derecha (dispara Etapa 2 o Enrutador pre_source)
- **Canales de Invocación:** Envío de formulario público/QR por un colaborador desde su celular en planta u obra.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Filtros de Evento:** Configura en `nodeConfigs["trigger_qr_worker"]` los filtros de seguridad (`webhookSecret`, `emailSubjectFilter`, `qrSeverityFilter` o `antigravityMode`).
- **Casillas / Campos Reales Disponibles (9):** `Cédula / Documento y Nombre Completo del Trabajador Reportante`, `Cargo, Área / Proceso y Sede o Frente de Obra`, `Tipo de Reporte QR (Acto Inseguro, Condición Insegura, Inspección Preoperacional, Síntoma/Fatiga, Participación IPEVR)`, `Descripción del Hallazgo o Novedad Reportada en Terreno`, `Nivel de Gravedad Percibida por el Trabajador (Bajo / Medio / Alto / Peligro Inminente)`, `Evidencia Fotográfica Adjunta desde el Celular`, `Ubicación / Zona Exacta del Hallazgo`, `Fecha y Hora Exacta del Escaneo QR`, `Validación de Identidad contra Nómina Activa de Somos SST`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cédula/Nombre + Tipo de Reporte QR + Gravedad + Foto en Campo** — Procesa al instante reportes de actos/condiciones inseguras enviados por QR (5 campos)
  * **⚡ Ubicación en Obra + Validación de Nómina SST + Hora del Escaneo** — Cruza quién reportó con su cargo y sede en Somos SST (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Evento disparador externo o temporal (reloj Cron, instrucción de voz/texto en Tenshi con `attachedMedia` opcional, payload JSON de Webhook o formulario QR).
- **Salida (`OUTPUT`):** Contexto inicial de corrida (`triggerSource`, `eventPayload`, `userInstruction`, `companyId` aislado) que activa los extractores o el enrutador condicional.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Reporte QR] ──▶ [Perfil Sociodemográfico (Hito 2)] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Condiciones de Salud] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, explícame cómo configurar el disparador Reporte QR en mis automatizaciones de /tareas.»

---

### Webhook / Evento Externo API (Buk RRHH / ERP)
- **ID Técnico (`id`):** `trigger_webhook` · **Etiqueta Corta:** `Webhook API`
- **Familia:** 1. Disparadores de Inicio (Triggers) · **Categoría:** `trigger`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Se dispara cuando un sistema externo (Buk RRHH, nómina o formulario web) notifica un evento.

**Operación Técnica:** `Disparo por evento externo vía Webhook / API REST` · Módulo: *⚡ Disparador · Webhook / Evento Externo API (Buk RRHH / ERP)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 1 (Extremo Izquierdo) — Inicio del Flujo con semántica OR
- **Puertos de Conexión:** ● Salida Derecha (dispara Etapa 2 o Enrutador pre_source)
- **Canales de Invocación:** Petición HTTP `POST /api/sgsst/automatizaciones/webhook/:automationId` autenticada con `x-wappy-secret`.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Filtros de Evento:** Configura en `nodeConfigs["trigger_webhook"]` los filtros de seguridad (`webhookSecret`, `emailSubjectFilter`, `qrSeverityFilter` o `antigravityMode`).
- **Casillas / Campos Reales Disponibles (8):** `Tipo de Evento Recibido (Nuevo Ingreso, Retiro, Cambio de Cargo, Incapacidad, Siniestro Vial)`, `Sistema de Origen (Buk RRHH, SAP, Siigo, Nómina Electrónica, Formulario Web)`, `Cédula / Documento y Nombre Completo del Colaborador en el Payload`, `Cargo, Centro de Costos, Sede y Fecha de Ingreso/Novedad`, `Datos de Seguridad Social en el Payload (EPS, ARL, AFP, Caja de Compensación)`, `Validación de Firma HMAC / Token de Seguridad del Webhook`, `Mapeo Automático de Campos JSON hacia Somos SST`, `Código de Respuesta HTTP 200 y Registro de Auditoría API`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Novedad de Personal (Ingreso/Retiro/Cargo) + Cédula/Nombre + EPS/ARL/AFP** — Sincroniza altas, bajas o cambios de cargo desde Buk RRHH o Nómina (4 campos)
  * **⚡ Validación de Seguridad Webhook + Mapeo JSON a Somos SST** — Asegura integridad del payload externo antes de escribir en base de datos (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Evento disparador externo o temporal (reloj Cron, instrucción de voz/texto en Tenshi con `attachedMedia` opcional, payload JSON de Webhook o formulario QR).
- **Salida (`OUTPUT`):** Contexto inicial de corrida (`triggerSource`, `eventPayload`, `userInstruction`, `companyId` aislado) que activa los extractores o el enrutador condicional.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Webhook API] ──▶ [Perfil Sociodemográfico (Hito 2)] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Condiciones de Salud] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, explícame cómo configurar el disparador Webhook API en mis automatizaciones de /tareas.»

---

### WhatsApp Entrante (Bot Oficial / Audio / Fotos en Campo)
- **ID Técnico (`id`):** `trigger_whatsapp` · **Etiqueta Corta:** `WhatsApp Bot`
- **Familia:** 1. Disparadores de Inicio (Triggers) · **Categoría:** `trigger`
- **Estado:** **🚧 En Construcción (Protegido)** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Se dispara cuando un trabajador o líder envía un reporte, foto o nota de voz por WhatsApp.

**Operación Técnica:** `Disparo por mensaje o reporte entrante vía WhatsApp Business API` · Módulo: *⚡ Disparador · WhatsApp Bot SST (En Construcción)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

🚧 **Nodo en Construcción:** Requiere la homologación de plantillas y webhooks entrantes verificados sobre Meta WhatsApp Business Cloud API corporativa. **Alternativa activa hoy:** usa `trigger_tenshi` (Voz/Chat en Tenshi), `trigger_qr_worker` (Reporte QR desde celular en campo sin login) o `trigger_email` (Correo Entrante).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 1 (Extremo Izquierdo) — Inicio del Flujo con semántica OR
- **Puertos de Conexión:** ● Salida Derecha (dispara Etapa 2 o Enrutador pre_source)
- **Canales de Invocación:** Evento reactivo automático en segundo plano o prueba controlada en Escenario Sandbox (`/tareas`).

#### 3. ¿Cómo se Configura Paso a Paso?
- **Estado de Guardia Preventiva:** Este nodo está marcado con `defaultConstruction: true`. Tanto el validador estático (`validate-workflow-logic.js`) como el planificador (`automationScheduler.js`) lo omiten en `< 10ms` con estado `skipped` para impedir bloqueos o fallos en producción.
- **Filtros de Evento:** Configura en `nodeConfigs["trigger_whatsapp"]` los filtros de seguridad (`webhookSecret`, `emailSubjectFilter`, `qrSeverityFilter` o `antigravityMode`).
- **Casillas / Campos Reales Disponibles (6):** `Mensaje de Texto o Nota de Voz del Trabajador por WhatsApp`, `Fotografía de Acto o Condición Insegura Enviada desde Terreno`, `Reporte Inmediato de Accidente / Incidente o Adjunto FURAT en PDF`, `Incapacidad Médica o Certificado Enviado por WhatsApp`, `Identificación Automática del Colaborador por Número de Celular y Cédula`, `Confirmación de Recibido por WhatsApp con Código de Radicado SST`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Reporte de Actos/Condiciones con Foto + Nota de Voz por WhatsApp** — Captura reportes de campo enviados al bot oficial de WhatsApp (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Evento disparador externo o temporal (reloj Cron, instrucción de voz/texto en Tenshi con `attachedMedia` opcional, payload JSON de Webhook o formulario QR).
- **Salida (`OUTPUT`):** Contexto inicial de corrida (`triggerSource`, `eventPayload`, `userInstruction`, `companyId` aislado) que activa los extractores o el enrutador condicional.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[WhatsApp Bot] ──▶ [Perfil Sociodemográfico (Hito 2)] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Condiciones de Salud] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, explícame cómo configurar el disparador WhatsApp Bot en mis automatizaciones de /tareas.»

---

## 2. Extractores Documentales, OCR y Scrapers OSINT

> Obtienen correos de Gmail, carpetas de Google Drive o PC local, extraen tablas exactas con Visión OCR Multimodal, verifican portales estatales de Colombia (ARL, Alturas MinTrabajo, SIMIT, Contraloría/Rama Judicial) y ejecutan auditoría forense de incapacidades.

### Leer Bandeja de Gmail (Extraer Correos y Reportes)
- **ID Técnico (`id`):** `extract_gmail` · **Etiqueta Corta:** `Leer Gmail`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Lee correos entrantes en Gmail (incapacidades, reportes FURAT/ATEL, conceptos médicos o requerimientos ARL) y envía su contenido al Agente.

**Operación Técnica:** `Extraer información de correos entrantes en Gmail usando google_gmail` · Módulo: *📥 Extractor · Leer Bandeja de Gmail (Extraer Correos y Reportes)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1843 de 2025 / Resolución 2346 de 2007 (Evaluaciones Médicas Ocupacionales), Decreto 1427 de 2022 y Ley 23 de 1981 (Reserva de Historia Clínica).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 2 (Etapa de Ingesta y Transporte de Datos Crudos, a la izquierda de `Condición Si/No` y del `Agente IA`).
- **Puertos de Conexión:** ● Entrada Izquierda (desde Disparador) · ● Salida Derecha (hacia Merge, Condición Si/No o Extractor IA Docs)
- **Canales de Invocación:** Ejecutado automáticamente por `automationScheduler.js`, `workflowNodeInspectorService.js` (botón Inspeccionar Datos en Vivo) y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (10):** `Asunto del Correo y Etiqueta de Clasificación`, `Remitente, Dirección de Correo y Entidad (ARL, EPS, IPS, Trabajador)`, `Fecha y Hora de Recepción del Correo`, `Cédula / Documento y Nombre Completo del Trabajador Mencionado`, `Archivos Adjuntos PDF / Excel (Incapacidades, Certificados EPS/ARL/AFP, Conceptos EMO, FURAT)`, `Código Diagnóstico CIE-10 y Días de Incapacidad en el Adjunto`, `Requerimientos Oficiales, Plazos Legales y Citaciones de ARL / MinTrabajo`, `Cuerpo del Mensaje Limpio y Tablas HTML Extraídas`, `Filtro de Correos No Leídos de las Últimas 24 / 72 Horas`, `ID Único del Mensaje (Anti-Duplicados)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Correos No Leídos + Cédula/Nombre + Adjuntos PDF (EMO/EPS/ARL)** — Extrae soportes de trabajadores recibidos por correo sin saturar el flujo (4 campos)
  * **⚡ Incapacidades Médicas (CIE-10 + Días) y Reportes FURAT por Email** — Para alimentar Ausentismo e Investigación ATEL en el Hito 7 (4 campos)
  * **⚡ Notificaciones Oficiales de ARL / MinTrabajo y Plazos de Respuesta** — Prioriza comunicaciones jurídicas o auditorías externas entrantes (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Parámetros de búsqueda (`driveFolderName`, `gmailSearchQuery`, `watchFolderPath`, `targetUrl` o archivos listados por el paso previo).
- **Salida (`OUTPUT`):** Arreglo homogéneo `records[]` (hasta 300 registros sin truncar nómina), metadatos de conexión (`connected`, `resolvedFolder`, hash `SHA-256`) y llaves candidatas para `wappy_memory_antiduplicate`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Leer Gmail] ──▶ [Condición Si/No: ¿Archivos nuevos?] ──(SÍ)──▶ [✨ Extractor IA Docs] ──▶ [Agente IA + ◆ Hito Somos SST] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, quiero usar Leer Gmail para revisar documentos nuevos y actualizar automáticamente mi SG-SST.»

---

### Extraer de Google Drive (Carpetas / Excel / PDF)
- **ID Técnico (`id`):** `extract_drive` · **Etiqueta Corta:** `Extraer de Drive`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Revisa carpetas de Google Drive, lee hojas de cálculo, documentos o PDFs nuevos y le envía los datos extraídos al Agente IA.

**Operación Técnica:** `Extraer información de carpetas y archivos recientes en Google Drive (google_drive: list_files_and_folders, read_document_content)` · Módulo: *📥 Extractor · Extraer de Google Drive (Carpetas / Excel / PDF)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 2 (Etapa de Ingesta y Transporte de Datos Crudos, a la izquierda de `Condición Si/No` y del `Agente IA`).
- **Puertos de Conexión:** ● Entrada Izquierda (desde Disparador) · ● Salida Derecha (hacia Merge, Condición Si/No o Extractor IA Docs)
- **Canales de Invocación:** Ejecutado automáticamente por `automationScheduler.js`, `workflowNodeInspectorService.js` (botón Inspeccionar Datos en Vivo) y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (11):** `Cédula / Identificación y Nombre del Trabajador en el Documento`, `Certificados de Afiliación a Seguridad Social (EPS, ARL, AFP, CCF y Planilla PILA)`, `Concepto de Aptitud Médica Ocupacional (EMO), Restricciones y Fecha de Examen`, `Certificados Vigentes de Trabajo en Alturas y Capacitaciones`, `Incapacidades Médicas, Diagnóstico CIE-10 y Días Otorgados`, `Reportes FURAT / Investigación de Accidentes en PDF`, `Fichas de Datos de Seguridad (FDS 16 Secciones) y Certificados de Equipos`, `Tablas y Filas de Hojas de Cálculo (.xlsx / Google Sheets / CSV)`, `Documentos Normativos del Hito 1 (Política, RHS, RIT, Matriz Legal, Actas)`, `Nombre del Archivo, Ruta de Carpeta y Fecha de Última Modificación` *(+1 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Cédula + Nombre + Certificados de Afiliación (EPS/ARL/AFP)** — Audita carpetas de seguridad social por número de cédula sin saturar (3 campos)
  * **⚡ Cédula + Nombre + Concepto Médico EMO + Curso de Alturas** — Valida soportes clínicos y de trabajo en alturas en carpetas de Drive (4 campos)
  * **⚡ Hojas de Cálculo Excel/Sheets + Soportes del Hito 1 y FDS** — Lee matrices en Excel y documentos del sistema alojados en Drive (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Parámetros de búsqueda (`driveFolderName`, `gmailSearchQuery`, `watchFolderPath`, `targetUrl` o archivos listados por el paso previo).
- **Salida (`OUTPUT`):** Arreglo homogéneo `records[]` (hasta 300 registros sin truncar nómina), metadatos de conexión (`connected`, `resolvedFolder`, hash `SHA-256`) y llaves candidatas para `wappy_memory_antiduplicate`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Extraer de Drive] ──▶ [Condición Si/No: ¿Archivos nuevos?] ──(SÍ)──▶ [✨ Extractor IA Docs] ──▶ [Agente IA + ◆ Hito Somos SST] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, quiero usar Extraer de Drive para revisar documentos nuevos y actualizar automáticamente mi SG-SST.»

---

### Extraer de Microsoft OneDrive / SharePoint (En Construcción)
- **ID Técnico (`id`):** `extract_onedrive` · **Etiqueta Corta:** `Extraer OneDrive`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **🚧 En Construcción (Protegido)** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Lee carpetas y documentos corporativos alojados en Microsoft OneDrive / SharePoint y entrega los datos al Agente IA.

**Operación Técnica:** `Extraer información de carpetas y archivos en Microsoft OneDrive (one_drive)` · Módulo: *📥 Extractor · Extraer de Microsoft OneDrive / SharePoint*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

🚧 **Nodo en Construcción:** El conector corporativo Microsoft Graph OAuth2 para lectura desatendida de bibliotecas OneDrive / SharePoint se encuentra en fase de habilitación empresarial. **Alternativa activa hoy:** usa `extract_drive` (Google Drive) o `extract_pc_folder` (Carpeta sincronizada en tu Mac/PC vía Google Antigravity Local).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 2 (Etapa de Ingesta y Transporte de Datos Crudos, a la izquierda de `Condición Si/No` y del `Agente IA`).
- **Puertos de Conexión:** ● Entrada Izquierda (desde Disparador) · ● Salida Derecha (hacia Merge, Condición Si/No o Extractor IA Docs)
- **Canales de Invocación:** Ejecutado automáticamente por `automationScheduler.js`, `workflowNodeInspectorService.js` (botón Inspeccionar Datos en Vivo) y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Estado de Guardia Preventiva:** Este nodo está marcado con `defaultConstruction: true`. Tanto el validador estático (`validate-workflow-logic.js`) como el planificador (`automationScheduler.js`) lo omiten en `< 10ms` con estado `skipped` para impedir bloqueos o fallos en producción.
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (9):** `Cédula / Identificación y Nombre Completo del Colaborador`, `Certificados de Afiliación (EPS, ARL, AFP, Caja de Compensación y PILA)`, `Conceptos de Aptitud Médica (EMO), Recomendaciones y Restricciones`, `Libros de Excel Corporativos (.xlsx) de Nómina, Ausentismo e Indicadores`, `Documentos Word (.docx) y PDFs de Procedimientos, Políticas y Actas`, `Certificados de Trabajo en Alturas, Conducción PESV y Brigadas`, `Soportes de Contratistas y Proveedores en SharePoint`, `Ruta de Biblioteca SharePoint / OneDrive y Fecha de Modificación`, `Estado de Vigencia y Firmas del Documento`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cédula + Nombre + Certificados EPS/ARL/AFP y EMO en OneDrive** — Verifica expedientes laborales alojados en Microsoft 365 (3 campos)
  * **⚡ Libros Excel (.xlsx) de Nómina/Ausentismo + Soportes de Contratistas** — Extrae tablas operativas desde bibliotecas corporativas de SharePoint (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Parámetros de búsqueda (`driveFolderName`, `gmailSearchQuery`, `watchFolderPath`, `targetUrl` o archivos listados por el paso previo).
- **Salida (`OUTPUT`):** Arreglo homogéneo `records[]` (hasta 300 registros sin truncar nómina), metadatos de conexión (`connected`, `resolvedFolder`, hash `SHA-256`) y llaves candidatas para `wappy_memory_antiduplicate`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Extraer OneDrive] ──▶ [Condición Si/No: ¿Archivos nuevos?] ──(SÍ)──▶ [✨ Extractor IA Docs] ──▶ [Agente IA + ◆ Hito Somos SST] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, quiero usar Extraer OneDrive para revisar documentos nuevos y actualizar automáticamente mi SG-SST.»

---

### Extraer de Carpeta en mi Computador (vía Antigravity)
- **ID Técnico (`id`):** `extract_pc_folder` · **Etiqueta Corta:** `Carpeta en mi PC`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Lee archivos o carpetas alojados directamente en tu computador (Mac/PC) a través del puente local de Google Antigravity.

**Operación Técnica:** `Extraer información de una carpeta local en el computador del usuario mediante Google Antigravity Local (google_antigravity)` · Módulo: *📥 Extractor · Extraer de Carpeta en mi Computador (vía Antigravity Local)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 2 (Etapa de Ingesta y Transporte de Datos Crudos, a la izquierda de `Condición Si/No` y del `Agente IA`).
- **Puertos de Conexión:** ● Entrada Izquierda (desde Disparador) · ● Salida Derecha (hacia Merge, Condición Si/No o Extractor IA Docs)
- **Canales de Invocación:** Ejecutado automáticamente por `automationScheduler.js`, `workflowNodeInspectorService.js` (botón Inspeccionar Datos en Vivo) y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (9):** `Ruta de la Carpeta Local en Mac / Windows Inspeccionada`, `Cédula / Documento y Nombre del Trabajador en Archivos Locales`, `Certificados PDF de Afiliación (EPS, ARL, AFP y Planilla PILA)`, `Certificados de Aptitud Médica (EMO) y Cursos de Alturas en PDF`, `Hojas de Cálculo Excel (.xlsx / .csv) Guardadas en el Computador`, `Documentos Word (.docx) de Actas, Informes e Inspecciones`, `Fichas de Seguridad Química (FDS) y Manuales Técnicos en Disco`, `Evidencias Fotográficas de Inspecciones de Campo en Carpeta Local`, `Fecha de Creación/Modificación y Tamaño del Archivo Local`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cédula + Nombre + PDFs de Afiliación (EPS/ARL/AFP) y EMO en mi PC** — Cruza carpetas de trabajadores en tu disco duro contra Somos SST (4 campos)
  * **⚡ Archivos Excel (.xlsx) + Documentos Word (.docx) en Carpeta Local** — Importa matrices y actas desde el computador vía Antigravity Local (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Parámetros de búsqueda (`driveFolderName`, `gmailSearchQuery`, `watchFolderPath`, `targetUrl` o archivos listados por el paso previo).
- **Salida (`OUTPUT`):** Arreglo homogéneo `records[]` (hasta 300 registros sin truncar nómina), metadatos de conexión (`connected`, `resolvedFolder`, hash `SHA-256`) y llaves candidatas para `wappy_memory_antiduplicate`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Carpeta en mi PC] ──▶ [Condición Si/No: ¿Archivos nuevos?] ──(SÍ)──▶ [✨ Extractor IA Docs] ──▶ [Agente IA + ◆ Hito Somos SST] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, quiero usar Carpeta en mi PC para revisar documentos nuevos y actualizar automáticamente mi SG-SST.»

---

### ✨ Extractor IA de Documentos (PDF / OCR -> Datos Exactos)
- **ID Técnico (`id`):** `extract_ai_doc_ocr` · **Etiqueta Corta:** `Extractor IA Docs`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Usa IA + Visión OCR Multimodal para leer PDFs digitales o escaneados, imágenes, Word o correos del paso anterior y devolver una tabla exacta con los campos que escribas (ej. Cédula, Diagnóstico, Fecha).

**Arquitectura Interna en Backend:**
Ejecuta `extractStructuredFieldsFromDocuments` (`automationScheduler.js`) inspirado en el `Information Extractor` de `n8n`: se ubica estrictamente después de `extract_drive`, `extract_gmail` o `extract_pc_folder` (y después de `if_router` `pre_agent` para gastar `0` tokens cuando no hay archivos nuevos), leyendo PDFs digitales o escaneados e imágenes con Gemini Vision para producir una tabla homogénea con las 4 a 7 columnas exactas definidas en `aiExtractionSchema`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Art. 2.2.4.6.12 — Conservación y estructuración documental SG-SST), Resolución 1401 de 2007 (FURAT) y Resolución 1843 de 2025 (Conceptos EMO).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 2B / 3B — En serie detrás de `Extraer de Drive`, `Leer Gmail` o `Carpeta en mi PC` (y después de `Condición Si/No pre_agent` para gastar 0 tokens si no hay archivos nuevos).
- **Puertos de Conexión:** ● Entrada Izquierda (desde Disparador) · ● Salida Derecha (hacia Merge, Condición Si/No o Extractor IA Docs)
- **Canales de Invocación:** Ejecutado automáticamente por `automationScheduler.js`, `workflowNodeInspectorService.js` (botón Inspeccionar Datos en Vivo) y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Conectar Fuente Previa:** Ubícalo después de `extract_drive`, `extract_gmail` o `extract_pc_folder`.
- **2. Modelo Multimodal (`aiModel`):** Elige `gemini-3.6-flash` (balance óptimo), `gemini-3.5-flash-lite` (alta velocidad) o `gemini-3.8-flash` (formularios densos/manuscritos como FURAT).
- **3. Esquema Exacto (`aiExtractionSchema`):** Define de 4 a 7 columnas tipadas (`{ key, label, type: "string"|"date"|"number"|"boolean", required, hint }`) tanto en `nodeConfigs.extractor_extract_ai_doc_ocr` como en `nodeConfigs.extract_ai_doc_ocr`.
- **Casillas / Campos Reales Disponibles (4):** `Archivo Origen`, `Cédula`, `Diagnóstico`, `Fecha`.

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Parámetros de búsqueda (`driveFolderName`, `gmailSearchQuery`, `watchFolderPath`, `targetUrl` o archivos listados por el paso previo).
- **Salida (`OUTPUT`):** Arreglo homogéneo `records[]` (hasta 300 registros sin truncar nómina), metadatos de conexión (`connected`, `resolvedFolder`, hash `SHA-256`) y llaves candidatas para `wappy_memory_antiduplicate`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Extractor IA Docs] ──▶ [Condición Si/No: ¿Archivos nuevos?] ──(SÍ)──▶ [✨ Extractor IA Docs] ──▶ [Agente IA + ◆ Hito Somos SST] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, crea un flujo que lea los conceptos médicos nuevos de mi carpeta de Google Drive con el Extractor IA de Documentos y actualice el Perfil Sociodemográfico.»

---

### Extraer Trabajadores y Expedientes (Somos SST)
- **ID Técnico (`id`):** `extract_sst_workers` · **Etiqueta Corta:** `Extraer Trabajadores`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Extrae la lista de colaboradores, cargos, exámenes médicos (EMO), cursos de alturas y entregas de EPP desde Somos SST.

**Operación Técnica:** `Extraer expedientes de trabajadores, exámenes médicos, alturas y EPP desde Somos SST (somos_sst: listar_trabajadores, consultar_expediente_integral)` · Módulo: *📥 Extractor · Extraer Trabajadores y Expedientes (Somos SST)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1843 de 2025 / Resolución 2346 de 2007 (Evaluaciones Médicas Ocupacionales), Decreto 1427 de 2022 y Ley 23 de 1981 (Reserva de Historia Clínica).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 2 (Etapa de Ingesta y Transporte de Datos Crudos, a la izquierda de `Condición Si/No` y del `Agente IA`).
- **Puertos de Conexión:** ● Entrada Izquierda (desde Disparador) · ● Salida Derecha (hacia Merge, Condición Si/No o Extractor IA Docs)
- **Canales de Invocación:** Ejecutado automáticamente por `automationScheduler.js`, `workflowNodeInspectorService.js` (botón Inspeccionar Datos en Vivo) y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (13):** `Cédula / Documento`, `Nombre Completo`, `Cargo`, `Área / Proceso y Sede`, `Estado Laboral (Activo / Retirado)`, `Fecha de Ingreso y Antigüedad`, `EPS, ARL, AFP y Caja de Compensación`, `Grupo Sanguíneo RH y Contacto de Emergencia`, `Concepto de Aptitud Médica (EMO) y Fecha de Próximo Examen`, `Diagnósticos Clínicos CIE-10, Restricciones y Recomendaciones` *(+3 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Cédula, Nombre, Cargo y Seguridad Social (EPS/ARL/AFP)** — Extracción rápida de nómina y afiliaciones sin saturar (4 campos)
  * **⚡ Cédula + Nombre + Concepto EMO + Curso Alturas + EPP** — Audita vencimientos operativos de cada colaborador activo (6 campos)
  * **⚡ Restricciones Médicas, Patologías CIE-10 y Tarjetas Preventivas FIT** — Cruza salud ocupacional con compatibilidad cargo-persona (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Parámetros de búsqueda (`driveFolderName`, `gmailSearchQuery`, `watchFolderPath`, `targetUrl` o archivos listados por el paso previo).
- **Salida (`OUTPUT`):** Arreglo homogéneo `records[]` (hasta 300 registros sin truncar nómina), metadatos de conexión (`connected`, `resolvedFolder`, hash `SHA-256`) y llaves candidatas para `wappy_memory_antiduplicate`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Extraer Trabajadores] ──▶ [Condición Si/No: ¿Archivos nuevos?] ──(SÍ)──▶ [✨ Extractor IA Docs] ──▶ [Agente IA + ◆ Hito Somos SST] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, quiero usar Extraer Trabajadores para revisar documentos nuevos y actualizar automáticamente mi SG-SST.»

---

### Extraer Datos de Aplicativo / Matriz (Somos SST)
- **ID Técnico (`id`):** `extract_sst_app` · **Etiqueta Corta:** `Extraer Aplicativo SST`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Extrae los datos actuales de cualquier aplicativo o matriz de los 8 Hitos de Somos SST (0312, GTC-45, PESV, Químicos, Comités, ATEL, ACPM, Predictivo).

**Operación Técnica:** `Extraer información actual de los aplicativos y matrices de Somos SST (somos_sst: resumen_empresa, consultar_informacion_empresa)` · Módulo: *📥 Extractor · Extraer Datos de Aplicativo / Matriz (Somos SST)*.
- **Marco Legal y Normativo SG-SST:** Resolución 20223040040595 de 2022 (Plan Estratégico de Seguridad Vial — PESV) e ISO 39001.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 2 (Etapa de Ingesta y Transporte de Datos Crudos, a la izquierda de `Condición Si/No` y del `Agente IA`).
- **Puertos de Conexión:** ● Entrada Izquierda (desde Disparador) · ● Salida Derecha (hacia Merge, Condición Si/No o Extractor IA Docs)
- **Canales de Invocación:** Ejecutado automáticamente por `automationScheduler.js`, `workflowNodeInspectorService.js` (botón Inspeccionar Datos en Vivo) y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (16):** `Puntaje Diagnóstico Res. 0312 (%) y Brechas No Cumple`, `Listado de Trabajadores (Cédula, Nombre Completo y Cargo)`, `Certificados de Afiliación (EPS, ARL, AFP y Planilla PILA)`, `Vencimiento de Exámenes Médicos (EMO) y Restricciones Activas`, `Tarjetas Preventivas y FIT Score de Compatibilidad Cargo-Persona`, `Peligros Críticos (Nivel I y II) de Matriz IPEVR GTC-45`, `Hallazgos Viales PESV y Documentos Vehiculares (SOAT/RTM)`, `Inventario Químico e Incompatibilidades SGA`, `Actas y Compromisos Pendientes del COPASST / Convivencia`, `Equipos de Alturas y Extintores Próximos a Vencer` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Cédula + Nombre + Certificados Afiliación (EPS/ARL/AFP)** — Extracción ligera de trabajadores y seguridad social (2 campos)
  * **⚡ Resumen de Vencimientos Críticos (EMO + SOAT/RTM + Extintores + ACPM)** — Solo alertas próximas a vencer en la empresa (4 campos)
  * **⚡ Diagnóstico 360° de Brechas (0312 + IPEVR + ATEL + Oráculo IA)** — Panorama gerencial de riesgos prioritarios y cumplimiento (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Parámetros de búsqueda (`driveFolderName`, `gmailSearchQuery`, `watchFolderPath`, `targetUrl` o archivos listados por el paso previo).
- **Salida (`OUTPUT`):** Arreglo homogéneo `records[]` (hasta 300 registros sin truncar nómina), metadatos de conexión (`connected`, `resolvedFolder`, hash `SHA-256`) y llaves candidatas para `wappy_memory_antiduplicate`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Extraer Aplicativo SST] ──▶ [Condición Si/No: ¿Archivos nuevos?] ──(SÍ)──▶ [✨ Extractor IA Docs] ──▶ [Agente IA + ◆ Hito Somos SST] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, quiero usar Extraer Aplicativo SST para revisar documentos nuevos y actualizar automáticamente mi SG-SST.»

---

### Web Scraping Inteligente (Hasta 5 URLs · Auto DOM / Navegador Nativo AGY / Script)
- **ID Técnico (`id`):** `extract_web_scraping_agy` · **Etiqueta Corta:** `Web Scraping`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Extrae contenido, tablas y normativa de hasta 5 URLs públicas de forma autónoma en servidor (HTML + DOM JS / Fetch Cheerio) o mediante el Navegador Nativo Integrado de Antigravity (1° Local ➔ 2° Cloud ➔ 3° Respaldo HTTP Seguro sin Chromium en VPS), con selectores CSS y detección de cambios SHA-256.

**Operación Técnica:** `web_scraper_live (extracción web autónoma multi-URL HTML+DOM JS, selectores CSS, detección real de cambios SHA-256 o Navegador Nativo Integrado de Antigravity)` · Módulo: *📥 Extractor · Web Scraping con Antigravity (Script Python / Node / Playwright)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 2 (Etapa de Ingesta y Transporte de Datos Crudos, a la izquierda de `Condición Si/No` y del `Agente IA`).
- **Puertos de Conexión:** ● Entrada Izquierda (desde Disparador) · ● Salida Derecha (hacia Merge, Condición Si/No o Extractor IA Docs)
- **Canales de Invocación:** Ejecutado automáticamente por `automationScheduler.js`, `workflowNodeInspectorService.js` (botón Inspeccionar Datos en Vivo) y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (9):** `Tablas de Datos HTML Convertidas a Markdown / JSON`, `Enlaces Directos a Documentos PDF, Resoluciones y Anexos`, `Títulos, Encabezados (H1/H2/H3) y Epígrafes Normativos`, `Número de Norma, Fecha de Expedición y Estado de Vigencia`, `Consulta de Estado por Número de Cédula / NIT / Placa`, `Indicadores, Tarifas, UVT o SMLMV Actualizados`, `Texto Principal Limpio (Sin Menús ni Publicidad)`, `Selectores CSS / XPath Personalizados del Script`, `Captura de Pantalla de Evidencia (Navegador Nativo Antigravity)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Tablas de Datos + Enlaces PDF + Fecha de Vigencia** — Extrae datos tabulares limpios y documentos oficiales descargables (3 campos)
  * **⚡ Verificación por Cédula / NIT / Placa + Evidencia Captura** — Consulta estructurada de registros en portales externos con soporte (3 campos)
  * **⚡ Monitoreo de Nuevas Resoluciones y Textos Normativos** — Extrae articulado limpio y encabezados de portales jurídicos (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Parámetros de búsqueda (`driveFolderName`, `gmailSearchQuery`, `watchFolderPath`, `targetUrl` o archivos listados por el paso previo).
- **Salida (`OUTPUT`):** Arreglo homogéneo `records[]` (hasta 300 registros sin truncar nómina), metadatos de conexión (`connected`, `resolvedFolder`, hash `SHA-256`) y llaves candidatas para `wappy_memory_antiduplicate`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Web Scraping] ──▶ [Condición Si/No: ¿Archivos nuevos?] ──(SÍ)──▶ [✨ Extractor IA Docs] ──▶ [Agente IA + ◆ Hito Somos SST] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, quiero usar Web Scraping para revisar documentos nuevos y actualizar automáticamente mi SG-SST.»

---

### 🪖 Certificados Alto Riesgo y SENA por Cédula (vía Antigravity)
- **ID Técnico (`id`):** `scraper_agy_alto_riesgo` · **Etiqueta Corta:** `Alto Riesgo & SENA`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Consulta por Cédula vía Google Antigravity los certificados vigentes de Trabajo en Alturas (Res. 4272/2021) y Espacios Confinados (Res. 0491/2020) en MinTrabajo y Certificados SENA (Sofia Plus), descargando el PDF oficial.

**Arquitectura Interna en Backend:**
Ejecuta sesión ASP.NET WebForms (`consulta_ext.aspx` ➔ `consulta_lista.aspx`) en el Registro Oficial de Centros de Entrenamiento del Ministerio del Trabajo y consulta SENA Sofia Plus vía Google Antigravity, extrayendo nivel, centro entrenador, fecha de terminación, vigencia y descargando la constancia oficial `%PDF` y `.PNG`.
- **Marco Legal y Normativo SG-SST:** Resolución 4272 de 2021 (Trabajo Seguro en Alturas — vigencia y reentrenamiento) y Resolución 0491 de 2020 (Trabajo en Espacios Confinados).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Doble ubicación soportada: **Puerto Inferior `◆ Herramienta +`** debajo del Agente IA (`inputs[]`, recomendado en Flujos Tenshi estilo `n8n` AI Agent Tool) o **Columna 2 (`extractors[]`)** en barridos programados.
- **Puertos de Conexión:** ◆ Conexión Superior hacia puerto `Herramienta +` del Agente IA (`tool_inputs_scraper_agy_alto_riesgo`) · ● Entrada Izquierda / ● Salida Derecha cuando opera en Etapa 2 (`extractor_scraper_agy_alto_riesgo`)
- **Canales de Invocación:** Invocable al instante por Voz/Chat en Tenshi (6 Flujos Globales Oficiales), por Cron programado en `/tareas`, o en prueba en vivo en el Inspector de 3 Paneles.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Modo de Conexión (`antigravityMode`):** `"auto"` (cascada `1° Local ➔ 2° Cloud ➔ 3° Respaldo Seguro sin navegador pesado en VPS`), `"local"` o `"cloud"`.
- **2. Motor (`scriptEngine` / `engine`):** `"antigravity_native_browser"` con configuración espejo en `nodeConfigs["scraper_agy_alto_riesgo"]` y `nodeConfigs["tool_inputs_scraper_agy_alto_riesgo"]`.
- **3. Consulta Puntual sin Escanear Nómina:** En Flujos Tenshi usa `ifPlacement: "pre_source"` (`has_explicit_cedula` o `has_explicit_cedula_or_placa`) para consultar directo cuando el usuario da el documento o visitante externo.
- **Casillas / Campos Reales Disponibles (7):** `MinTrabajo — Consulta Real sin CAPTCHA en Centros de Entrenamiento (Trabajo en Alturas Res. 4272/2021 y Espacios Confinados Res. 0491/2020): https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_ext.aspx`, `MinTrabajo — Nivel del Curso Verificado (Trabajador Autorizado, Reentrenamiento Sectorial, Coordinador, Administrativo)`, `MinTrabajo — Centro de Entrenamiento Autorizado, NIT, Entrenador y Fechas Exactas de Inicio/Finalización`, `SENA — Sofia Plus / Certificados Digitales Oficiales por Cédula: https://certificados.sena.edu.co/CertificadoDigital/com.sena.consultacer`, `SENA — Títulos Técnicos/Tecnólogos, Curso de 50 Horas / 20 Horas SG-SST y Competencias Laborales Vigentes`, `Descarga Automática de Constancia Oficial (.PDF) y Captura de Verificación (.PNG) en Bandeja de Evidencias`, `Alerta Automática si el Reentrenamiento Anual de Alturas supera los 12 meses o no registra certificado`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ MinTrabajo Alturas/Confinados + SENA + Descarga de Certificados (.PDF / .PNG)** — Consulta ambos portales oficiales en vivo por Cédula y deposita los soportes PDF/PNG en bandeja aparte (5 campos)
  * **⚡ Solo MinTrabajo Centros de Entrenamiento (Alturas Res. 4272 y Confinados Res. 0491)** — Verificación directa en app2.mintrabajo.gov.co con constancia oficial PDF/PNG (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** `cedula` (5–12 dígitos), `tipoDoc` (`CC`/`CE`/`PPT`), `nombre` completo o `placa` vehicular (desde mensaje de Tenshi o desde `upstreamInputItems` del nodo previo).
- **Salida (`OUTPUT`):** Filas homogéneas verificadas (`outputItems`: titular real recuperado, documento, estado oficial, entidad detectada, detalle técnico) + certificados oficiales `%PDF` e imagen `.PNG` persistidos en la bandeja dedicada `evidenceFiles` (en `scraper_agy_antecedentes` incluye el **Tablero Completo de los 5 Entes Oficiales** + SECOP Datos Abiertos).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Tenshi IA] ──▶ [Condición Si/No: ¿Entregó Cédula?] ──(SÍ)──▶ [Agente IA Tenshi + ◆ Alto Riesgo & SENA] ──▶ [Notificar en WAPPY + Certificado PDF/PNG]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, consulta en el Ministerio del Trabajo si la cédula 71234567 tiene certificado vigente de Trabajo Seguro en Alturas bajo la Resolución 4272.»

---

### 🛡️ Certificados de ARL Directos por Cédula (vía Antigravity)
- **ID Técnico (`id`):** `scraper_agy_arl_directo` · **Etiqueta Corta:** `Web Scraping ARL`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Verifica por Cédula en los portales oficiales de ARL SURA, ARL Positiva, ARL Colmena, ARL AXA Colpatria y ARL Seguros Bolívar (sin RUAF) con cascada de protección: 1° Antigravity Local · Navegador Nativo ➔ 2° Antigravity Cloud ➔ 3° Respaldo HTTP Seguro sin Chromium en VPS.

**Arquitectura Interna en Backend:**
Ejecuta `consultarArlRealPorCedula` (`api/server/services/osintWorkerService.js`) mediante cascada segura de 3 niveles: 1° Navegador Nativo Google Antigravity Local (IP Colombia) ➔ 2° Google Antigravity Cloud 24/7 ➔ 3° Respaldo HTTP ligero en servidor sin abrir navegador pesado en el VPS. Consulta ARL SURA y ARL Positiva directamente por cédula; si se aporta fecha de nacimiento consulta también ARL Seguros Bolívar y ARL AXA Colpatria (portales públicos ciudadanos sin clave empresarial; si AXA activa control `reCAPTCHA` se detiene sin tocarlo) e informa con exactitud que ARL Colmena (`colmenaseguros.com/certificados-de-afiliacion`) también es público con fecha de nacimiento pero exige casilla `reCAPTCHA` ("No soy un robot") humana, descargando certificados oficiales `%PDF` y `.PNG` en `evidenceFiles`.
- **Marco Legal y Normativo SG-SST:** Ley 1562 de 2012, Decreto 1295 de 1994 y Decreto 1072 de 2015 (Verificación obligatoria de afiliación activa a Riesgos Laborales antes de ingreso o tareas operativas).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Doble ubicación soportada: **Puerto Inferior `◆ Herramienta +`** debajo del Agente IA (`inputs[]`, recomendado en Flujos Tenshi estilo `n8n` AI Agent Tool) o **Columna 2 (`extractors[]`)** en barridos programados.
- **Puertos de Conexión:** ◆ Conexión Superior hacia puerto `Herramienta +` del Agente IA (`tool_inputs_scraper_agy_arl_directo`) · ● Entrada Izquierda / ● Salida Derecha cuando opera en Etapa 2 (`extractor_scraper_agy_arl_directo`)
- **Canales de Invocación:** Invocable al instante por Voz/Chat en Tenshi (6 Flujos Globales Oficiales), por Cron programado en `/tareas`, o en prueba en vivo en el Inspector de 3 Paneles.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Modo de Conexión (`antigravityMode`):** `"auto"` (cascada `1° Local ➔ 2° Cloud ➔ 3° Respaldo Seguro sin navegador pesado en VPS`), `"local"` o `"cloud"`.
- **2. Motor (`scriptEngine` / `engine`):** `"antigravity_native_browser"` con configuración espejo en `nodeConfigs["scraper_agy_arl_directo"]` y `nodeConfigs["tool_inputs_scraper_agy_arl_directo"]`.
- **3. Consulta Puntual sin Escanear Nómina:** En Flujos Tenshi usa `ifPlacement: "pre_source"` (`has_explicit_cedula` o `has_explicit_cedula_or_placa`) para consultar directo cuando el usuario da el documento o visitante externo.
- **Casillas / Campos Reales Disponibles (7):** `ARL SURA — Verificación Pública de Afiliación y Certificado: https://www.arlsura.com/afiliacion/verificar.php`, `ARL Positiva — Consulta y Certificado de Afiliación en Línea: https://www.positivaenlinea.gov.co/nuevo/`, `ARL Colmena Seguros — Consulta de Afiliación ARL por Cédula: https://afiliacionarl.colmenaseguros.com/`, `ARL AXA Colpatria — Certificados de Afiliación ESST: https://asesoriavirtual.axacolpatria.co/prod_esst/certificados/`, `ARL Seguros Bolívar / La Equidad — Verificación de Cobertura en Riesgos Laborales`, `Validación de Estado Activo / Inactivo, Clase de Riesgo (I a V) y Coherencia con el Expediente SST`, `Descarga Automática de Certificado / Constancia ARL (.PDF) y Captura (.PNG) en Bandeja de Evidencias`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Barrido en Vivo de ARL Directas (SURA, Positiva, Colmena, AXA y Bolívar) + PDF/PNG** — 1° Antigravity Local · Navegador Nativo ➔ 2° Antigravity Cloud ➔ 3° Respaldo HTTP Seguro sin Chromium en VPS (6 campos)
  * **⚡ Solo ARL SURA + ARL Positiva + ARL Colmena + Soporte Descargable** — Consulta rápida en las 3 ARL de mayor volumen de trabajadores y contratistas (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** `cedula` (5–12 dígitos), `tipoDoc` (`CC`/`CE`/`PPT`), `nombre` completo o `placa` vehicular (desde mensaje de Tenshi o desde `upstreamInputItems` del nodo previo).
- **Salida (`OUTPUT`):** Filas homogéneas verificadas (`outputItems`: titular real recuperado, documento, estado oficial, entidad detectada, detalle técnico) + certificados oficiales `%PDF` e imagen `.PNG` persistidos en la bandeja dedicada `evidenceFiles` (en `scraper_agy_antecedentes` incluye el **Tablero Completo de los 5 Entes Oficiales** + SECOP Datos Abiertos).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Tenshi IA] ──▶ [Condición Si/No: ¿Entregó Cédula?] ──(SÍ)──▶ [Agente IA Tenshi + ◆ Web Scraping ARL] ──▶ [Notificar en WAPPY + Certificado PDF/PNG]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, verifica el certificado de afiliación ARL para la cédula 1037654321 y descárgame el soporte oficial aquí en el chat.»

---

### 🏦 Fondos de Pensiones Directos — Sin RUAF (En Construcción)
- **ID Técnico (`id`):** `scraper_agy_pensiones_directo` · **Etiqueta Corta:** `Pensiones Directo`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **🚧 En Construcción (Protegido)** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Consulta por Cédula directamente en los 5 fondos de pensiones de Colombia (Porvenir, Protección Certifácil, Colfondos, Skandia y Colpensiones, sin pasar por RUAF) vía Google Antigravity.

**Operación Técnica:** `Consultar afiliación pensional por Cédula directamente en Porvenir, Protección, Colfondos, Skandia y Colpensiones vía Google Antigravity (sin RUAF)` · Módulo: *🏦 Scraper Antigravity · Fondos de Pensiones Directos (En Construcción)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

🚧 **Nodo en Construcción:** Los portales transaccionales de los fondos de pensiones en Colombia (Porvenir, Protección Certifácil, Colfondos, Skandia y Colpensiones) exigen tokens antifraude dinámicos, claves privadas del afiliado y desafíos CAPTCHA visuales que, por política inquebrantable de seguridad de WAPPY IA, jamás se evaden ni automatizan de forma intrusiva. **Alternativa activa hoy:** registra y audita la AFP declarada y el estado PILA desde `hito2_perfil_socio` (Perfil Sociodemográfico).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Doble ubicación soportada: **Puerto Inferior `◆ Herramienta +`** debajo del Agente IA (`inputs[]`, recomendado en Flujos Tenshi estilo `n8n` AI Agent Tool) o **Columna 2 (`extractors[]`)** en barridos programados.
- **Puertos de Conexión:** ◆ Conexión Superior hacia puerto `Herramienta +` del Agente IA (`tool_inputs_scraper_agy_pensiones_directo`) · ● Entrada Izquierda / ● Salida Derecha cuando opera en Etapa 2 (`extractor_scraper_agy_pensiones_directo`)
- **Canales de Invocación:** Invocable al instante por Voz/Chat en Tenshi (6 Flujos Globales Oficiales), por Cron programado en `/tareas`, o en prueba en vivo en el Inspector de 3 Paneles.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Estado de Guardia Preventiva:** Este nodo está marcado con `defaultConstruction: true`. Tanto el validador estático (`validate-workflow-logic.js`) como el planificador (`automationScheduler.js`) lo omiten en `< 10ms` con estado `skipped` para impedir bloqueos o fallos en producción.
- **1. Modo de Conexión (`antigravityMode`):** `"auto"` (cascada `1° Local ➔ 2° Cloud ➔ 3° Respaldo Seguro sin navegador pesado en VPS`), `"local"` o `"cloud"`.
- **2. Motor (`scriptEngine` / `engine`):** `"antigravity_native_browser"` con configuración espejo en `nodeConfigs["scraper_agy_pensiones_directo"]` y `nodeConfigs["tool_inputs_scraper_agy_pensiones_directo"]`.
- **3. Consulta Puntual sin Escanear Nómina:** En Flujos Tenshi usa `ifPlacement: "pre_source"` (`has_explicit_cedula` o `has_explicit_cedula_or_placa`) para consultar directo cuando el usuario da el documento o visitante externo.
- **Casillas / Campos Reales Disponibles (7):** `Porvenir (Certificado de Afiliación Directo): https://www.porvenir.com.co/web/certificados-y-extractos/certificado-de-afiliacion`, `Protección — Certifácil (Pensión y Cesantías por Cédula): https://www.proteccion.com/portalafiliados/certifacil`, `Colfondos (Certificado de Afiliación Pensión Obligatoria): https://www.colfondos.com.co/dxp/personas/pensiones-obligatorias/certificado-afiliacion`, `Skandia (Consulta de Certificados de Afiliación): https://www.skandia.co/consulta-extractos-y-certificados`, `Colpensiones (Certificado de Afiliación / No Pensión RPM): https://sede.colpensiones.gov.co/tramite/updInfo/72/`, `Detección Exacta del Fondo Activo (RAIS vs. Colpensiones RPM) y Fecha de Afiliación`, `Descarga del Certificado Oficial de Pensión en PDF`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Barrido en los 5 Fondos Directos Sin RUAF (Porvenir, Protección, Colfondos, Skandia y Colpensiones)** — Recorre los 5 portales oficiales hasta hallar el fondo activo y descargar su PDF (7 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** `cedula` (5–12 dígitos), `tipoDoc` (`CC`/`CE`/`PPT`), `nombre` completo o `placa` vehicular (desde mensaje de Tenshi o desde `upstreamInputItems` del nodo previo).
- **Salida (`OUTPUT`):** Filas homogéneas verificadas (`outputItems`: titular real recuperado, documento, estado oficial, entidad detectada, detalle técnico) + certificados oficiales `%PDF` e imagen `.PNG` persistidos en la bandeja dedicada `evidenceFiles` (en `scraper_agy_antecedentes` incluye el **Tablero Completo de los 5 Entes Oficiales** + SECOP Datos Abiertos).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Tenshi IA] ──▶ [Condición Si/No: ¿Entregó Cédula?] ──(SÍ)──▶ [Agente IA Tenshi + ◆ Pensiones Directo] ──▶ [Notificar en WAPPY + Certificado PDF/PNG]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, ejecuta el nodo Pensiones Directo para verificar por cédula y entrégame el soporte oficial en el chat.»

---

### 🏥 Salud EPS (ADRES) y ReTHUS por Cédula (En Construcción)
- **ID Técnico (`id`):** `scraper_agy_salud_rethus` · **Etiqueta Corta:** `ADRES EPS & ReTHUS`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **🚧 En Construcción (Protegido)** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Verifica por Cédula la EPS activa en ADRES (BDUA) y el registro profesional en Salud / SST en ReTHUS (SISPRO) vía Google Antigravity.

**Operación Técnica:** `Consultar por Cédula vía Google Antigravity la afiliación EPS en ADRES (https://www.adres.gov.co/consulte-su-eps) y el registro en ReTHUS SISPRO (https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx)` · Módulo: *🏥 Scraper Antigravity · Salud EPS (ADRES) y ReTHUS (En Construcción)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1843 de 2025 / Resolución 2346 de 2007 (Evaluaciones Médicas Ocupacionales), Decreto 1427 de 2022 y Ley 23 de 1981 (Reserva de Historia Clínica).

🚧 **Nodo en Construcción:** El portal público de **ADRES BDUA** (`adres.gov.co`) implementa `RadCaptcha` visual/auditivo y el portal oficial de **MinSalud SISPRO ReTHUS** (`ConsultaPublicaDeTHxIdentificacion.aspx`) exige un `imgCaptcha` visual humano obligatorio en cada consulta. Cumpliendo estrictamente la regla de seguridad de WAPPY IA, **está prohibido resolver, computar o saltar CAPTCHAs gubernamentales**. **Alternativa activa hoy:** para verificar soportes médicos e incapacidades usa **`forensic_doc_verifier` (`🔬 Forense Incapacidad`)**, el cual verifica automáticamente **0 CAPTCHA** la habilitación de la IPS en la API Abierta Socrata de MinSalud REPS y la identidad civil real del médico en la Contraloría General, entregando el enlace oficial de SISPRO ReTHUS para validación humana del título académico.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Doble ubicación soportada: **Puerto Inferior `◆ Herramienta +`** debajo del Agente IA (`inputs[]`, recomendado en Flujos Tenshi estilo `n8n` AI Agent Tool) o **Columna 2 (`extractors[]`)** en barridos programados.
- **Puertos de Conexión:** ◆ Conexión Superior hacia puerto `Herramienta +` del Agente IA (`tool_inputs_scraper_agy_salud_rethus`) · ● Entrada Izquierda / ● Salida Derecha cuando opera en Etapa 2 (`extractor_scraper_agy_salud_rethus`)
- **Canales de Invocación:** Invocable al instante por Voz/Chat en Tenshi (6 Flujos Globales Oficiales), por Cron programado en `/tareas`, o en prueba en vivo en el Inspector de 3 Paneles.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Estado de Guardia Preventiva:** Este nodo está marcado con `defaultConstruction: true`. Tanto el validador estático (`validate-workflow-logic.js`) como el planificador (`automationScheduler.js`) lo omiten en `< 10ms` con estado `skipped` para impedir bloqueos o fallos en producción.
- **1. Modo de Conexión (`antigravityMode`):** `"auto"` (cascada `1° Local ➔ 2° Cloud ➔ 3° Respaldo Seguro sin navegador pesado en VPS`), `"local"` o `"cloud"`.
- **2. Motor (`scriptEngine` / `engine`):** `"antigravity_native_browser"` con configuración espejo en `nodeConfigs["scraper_agy_salud_rethus"]` y `nodeConfigs["tool_inputs_scraper_agy_salud_rethus"]`.
- **3. Consulta Puntual sin Escanear Nómina:** En Flujos Tenshi usa `ifPlacement: "pre_source"` (`has_explicit_cedula` o `has_explicit_cedula_or_placa`) para consultar directo cuando el usuario da el documento o visitante externo.
- **Casillas / Campos Reales Disponibles (5):** `ADRES — BDUA (Consulta de EPS Activa por Cédula): https://www.adres.gov.co/consulte-su-eps`, `ADRES — Entidad EPS, Régimen (Contributivo / Subsidiado), Estado de Afiliación y Tipo de Afiliado`, `ReTHUS — SISPRO MinSalud (Talento Humano en Salud): https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx`, `ReTHUS — Profesión/Ocupación Autorizada (Médico, Enfermero, Psicólogo, Fisioterapeuta, Profesional SST en Salud)`, `ReTHUS — Acto Administrativo / Autorización de Ejercicio, Entidad Reportadora y Estado Vigente`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Consulta Completa: EPS en ADRES (BDUA) + Registro Profesional en ReTHUS (SISPRO)** — Verifica afiliación a salud e idoneidad profesional en salud/SST (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** `cedula` (5–12 dígitos), `tipoDoc` (`CC`/`CE`/`PPT`), `nombre` completo o `placa` vehicular (desde mensaje de Tenshi o desde `upstreamInputItems` del nodo previo).
- **Salida (`OUTPUT`):** Filas homogéneas verificadas (`outputItems`: titular real recuperado, documento, estado oficial, entidad detectada, detalle técnico) + certificados oficiales `%PDF` e imagen `.PNG` persistidos en la bandeja dedicada `evidenceFiles` (en `scraper_agy_antecedentes` incluye el **Tablero Completo de los 5 Entes Oficiales** + SECOP Datos Abiertos).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Tenshi IA] ──▶ [Condición Si/No: ¿Entregó Cédula?] ──(SÍ)──▶ [Agente IA Tenshi + ◆ ADRES EPS & ReTHUS] ──▶ [Notificar en WAPPY + Certificado PDF/PNG]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, ejecuta el nodo ADRES EPS & ReTHUS para verificar por cédula y entrégame el soporte oficial en el chat.»

---

### 🚗 Seguridad Vial PESV: SIMIT y RUNT por Cédula o Placa (vía Antigravity)
- **ID Técnico (`id`):** `scraper_agy_vial_pesv` · **Etiqueta Corta:** `SIMIT & RUNT Vial`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Audita por Cédula (Conductor) o por Placa (Vehículo) comparendos en SIMIT, licencia de conducción en RUNT Persona y SOAT/Tecnomecánica en RUNT Vehículo vía Google Antigravity.

**Arquitectura Interna en Backend:**
Ejecuta `consultarSimitPesvRealPorCedula` (`osintWorkerService.js`) para trabajadores, visitantes o contratistas externos por número de cédula o placa vehicular (`waitUntil: "commit"` con `timeout: 22000ms` y `waitForSelector("#txtBusqueda", { timeout: 18000 })`). Respeta al 100% la prohibición de computar o aguardar desafíos anti-bot/CAPTCHA: si SIMIT activa `#whcModal.show` / `codigo === 6`, detiene al instante y entrega estado limpio con los enlaces directos oficiales de SIMIT (`fcm.org.co/simit`) y Consulta Ciudadana RUNT (`runt.gov.co`, indicando que RUNT requiere CAPTCHA humano por documento).
- **Marco Legal y Normativo SG-SST:** Resolución 20223040040595 de 2022 (Plan Estratégico de Seguridad Vial — PESV, Fase de Control de Conductores e Infracciones) y Ley 769 de 2002.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Doble ubicación soportada: **Puerto Inferior `◆ Herramienta +`** debajo del Agente IA (`inputs[]`, recomendado en Flujos Tenshi estilo `n8n` AI Agent Tool) o **Columna 2 (`extractors[]`)** en barridos programados.
- **Puertos de Conexión:** ◆ Conexión Superior hacia puerto `Herramienta +` del Agente IA (`tool_inputs_scraper_agy_vial_pesv`) · ● Entrada Izquierda / ● Salida Derecha cuando opera en Etapa 2 (`extractor_scraper_agy_vial_pesv`)
- **Canales de Invocación:** Invocable al instante por Voz/Chat en Tenshi (6 Flujos Globales Oficiales), por Cron programado en `/tareas`, o en prueba en vivo en el Inspector de 3 Paneles.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Modo de Conexión (`antigravityMode`):** `"auto"` (cascada `1° Local ➔ 2° Cloud ➔ 3° Respaldo Seguro sin navegador pesado en VPS`), `"local"` o `"cloud"`.
- **2. Motor (`scriptEngine` / `engine`):** `"antigravity_native_browser"` con configuración espejo en `nodeConfigs["scraper_agy_vial_pesv"]` y `nodeConfigs["tool_inputs_scraper_agy_vial_pesv"]`.
- **3. Consulta Puntual sin Escanear Nómina:** En Flujos Tenshi usa `ifPlacement: "pre_source"` (`has_explicit_cedula` o `has_explicit_cedula_or_placa`) para consultar directo cuando el usuario da el documento o visitante externo.
- **Casillas / Campos Reales Disponibles (5):** `SIMIT Nacional por Cédula o Placa (Comparendos, Multas, Paz y Salvo y Acuerdos de Pago): https://www.fcm.org.co/simit/#/home-public`, `RUNT Ciudadano por Cédula (Conductor — Vigencia, Estado y Categoría de Licencia A2, B1, C1, C2, C3): https://www.runt.gov.co/consultaCiudadana/#/consultaPersona`, `RUNT Ciudadano por Placa (Vehículo — Vigencia Exacta de Póliza SOAT y Revisión Técnico-Mecánica RTM): https://www.runt.gov.co/consultaCiudadana/#/consultaVehiculo`, `Descarga Automática de Constancia Vial (.PDF) y Captura de Evidencia (.PNG) en Bandeja de Soportes`, `Alerta Automática PESV (Res. 20223040040595) por Licencia Suspendida/Vencida, Comparendos o SOAT/RTM ≤ 30 días`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Auditoría PESV en Vivo: SIMIT + RUNT Conductor/Placa + Constancias (.PDF / .PNG)** — Cruza conductores y flota vehicular bajo Res. 20223040040595 descargando soportes oficiales en bandeja aparte (5 campos)
  * **⚡ Solo Conductor por Cédula (RUNT Licencia + SIMIT Comparendos + Soporte PDF/PNG)** — Verificación inmediata de idoneidad vial antes de ingreso o asignación de vehículo (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** `cedula` (5–12 dígitos), `tipoDoc` (`CC`/`CE`/`PPT`), `nombre` completo o `placa` vehicular (desde mensaje de Tenshi o desde `upstreamInputItems` del nodo previo).
- **Salida (`OUTPUT`):** Filas homogéneas verificadas (`outputItems`: titular real recuperado, documento, estado oficial, entidad detectada, detalle técnico) + certificados oficiales `%PDF` e imagen `.PNG` persistidos en la bandeja dedicada `evidenceFiles` (en `scraper_agy_antecedentes` incluye el **Tablero Completo de los 5 Entes Oficiales** + SECOP Datos Abiertos).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Tenshi IA] ──▶ [Condición Si/No: ¿Entregó Cédula?] ──(SÍ)──▶ [Agente IA Tenshi + ◆ SIMIT & RUNT Vial] ──▶ [Notificar en WAPPY + Certificado PDF/PNG]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, verifica comparendos y Paz y Salvo en SIMIT para el contratista con cédula 80123456 o para la placa KLM45D.»

---

### ⚖️ Antecedentes y Procesos Judiciales por Cédula (vía Antigravity)
- **ID Técnico (`id`):** `scraper_agy_antecedentes` · **Etiqueta Corta:** `Antecedentes & Rama`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Consulta por Cédula vía Google Antigravity en Rama Judicial, Contraloría (SIBOR), Procuraduría (SIRI), Policía Antecedentes Judiciales, Policía RNMC y Delitos Sexuales (Ley 1918).

**Arquitectura Interna en Backend:**
Ejecuta `consultarRamaJudicial` (`osintWorkerService.js`) entregando el **Tablero Completo de los 5 Entes Oficiales en Colombia**:
  1. ✅ **Rama Judicial / Juzgados Penales y Ordinarios (API v2 Oficial — 0 CAPTCHA):** separa causas de Juzgados Penales/Garantías/Conocimiento/Ejecución de Penas frente a procesos Laborales, Civiles, Administrativos y Familia.
  2. ✅ **Contraloría General — Responsabilidad Fiscal SIBOR (0 CAPTCHA):** descarga el certificado `%PDF` oficial (`Certificado_Contraloria_<cedula>.pdf`), extrae el nombre legal real del titular y cruza además **Multas y Sanciones Contractuales en SECOP Datos Abiertos** (`datos.gov.co/resource/4n4q-k399.json`).
  3. 🔒 **Policía Nacional & RNMC Medidas Correctivas:** entrega enlaces oficiales directos indicando con transparencia que exigen `reCAPTCHA` humano ("No soy un robot").
  4. 🔒 **Procuraduría General — Antecedentes Disciplinarios SIRI:** enlace oficial directo indicando que exige pregunta aleatoria de seguridad humana.
  5. 🔒 **Fiscalía General — SPOA Denuncias:** informa que las causas penales judicializadas ya fueron medidas en Rama Judicial y que indagaciones reservadas SPOA requieren validación humana/CAPTCHA.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015, Ley 610 de 2000 (Responsabilidad Fiscal SIBOR), Ley 1952 de 2019 (Código General Disciplinario) y debida diligencia laboral pre-ingreso.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Doble ubicación soportada: **Puerto Inferior `◆ Herramienta +`** debajo del Agente IA (`inputs[]`, recomendado en Flujos Tenshi estilo `n8n` AI Agent Tool) o **Columna 2 (`extractors[]`)** en barridos programados.
- **Puertos de Conexión:** ◆ Conexión Superior hacia puerto `Herramienta +` del Agente IA (`tool_inputs_scraper_agy_antecedentes`) · ● Entrada Izquierda / ● Salida Derecha cuando opera en Etapa 2 (`extractor_scraper_agy_antecedentes`)
- **Canales de Invocación:** Invocable al instante por Voz/Chat en Tenshi (6 Flujos Globales Oficiales), por Cron programado en `/tareas`, o en prueba en vivo en el Inspector de 3 Paneles.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Modo de Conexión (`antigravityMode`):** `"auto"` (cascada `1° Local ➔ 2° Cloud ➔ 3° Respaldo Seguro sin navegador pesado en VPS`), `"local"` o `"cloud"`.
- **2. Motor (`scriptEngine` / `engine`):** `"antigravity_native_browser"` con configuración espejo en `nodeConfigs["scraper_agy_antecedentes"]` y `nodeConfigs["tool_inputs_scraper_agy_antecedentes"]`.
- **3. Consulta Puntual sin Escanear Nómina:** En Flujos Tenshi usa `ifPlacement: "pre_source"` (`has_explicit_cedula` o `has_explicit_cedula_or_placa`) para consultar directo cuando el usuario da el documento o visitante externo.
- **Casillas / Campos Reales Disponibles (7):** `Rama Judicial — API Oficial v2 Consulta Nacional Unificada de Procesos Judiciales: https://consultaprocesos.ramajudicial.gov.co/Procesos/Index`, `Contraloría General de la República — Certificado de Antecedentes Fiscales (SIBOR): https://cfiscal.contraloria.gov.co/Certificados/CertificadoPersonaNatural.aspx`, `Procuraduría General de la Nación — Certificado de Antecedentes Disciplinarios (SIRI): https://apps.procuraduria.gov.co/webcert/Certificado.aspx`, `Policía Nacional — Antecedentes Judiciales: https://antecedentes.policia.gov.co:7005/WebJudicial/`, `Policía Nacional — RNMC (Medidas Correctivas Código de Policía) e Inhabilidades Ley 1918 de 2018`, `Descarga Automática de Constancia Oficial (.PDF) y Captura (.PNG) en Bandeja Aparte sin Ruido en el Mensaje`, `Dictamen Consolidado de Debida Diligencia (Sin Novedades vs. Procesos / Alertas Activas por Despacho)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Barrido Completo en Vivo (Rama Judicial API v2 + Contraloría + Procuraduría + Policía + PDF/PNG)** — Debida diligencia integral por Cédula y Nombre con certificados descargados en bandeja dedicada (6 campos)
  * **⚡ Contratación Estándar (Rama Judicial + Policía + Procuraduría SIRI + Contraloría SIBOR)** — Certificados esenciales exigidos en selección y control de contratistas (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** `cedula` (5–12 dígitos), `tipoDoc` (`CC`/`CE`/`PPT`), `nombre` completo o `placa` vehicular (desde mensaje de Tenshi o desde `upstreamInputItems` del nodo previo).
- **Salida (`OUTPUT`):** Filas homogéneas verificadas (`outputItems`: titular real recuperado, documento, estado oficial, entidad detectada, detalle técnico) + certificados oficiales `%PDF` e imagen `.PNG` persistidos en la bandeja dedicada `evidenceFiles` (en `scraper_agy_antecedentes` incluye el **Tablero Completo de los 5 Entes Oficiales** + SECOP Datos Abiertos).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Tenshi IA] ──▶ [Condición Si/No: ¿Entregó Cédula?] ──(SÍ)──▶ [Agente IA Tenshi + ◆ Antecedentes & Rama] ──▶ [Notificar en WAPPY + Certificado PDF/PNG]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, verifica los antecedentes judiciales, penales y fiscales para la cédula 79456123 y descárgame el certificado oficial de la Contraloría.»

---

### 🔬 Auditoría Forense de Incapacidades y Documentos (EXIF/PDF + Visión IA + Dec. 1427)
- **ID Técnico (`id`):** `forensic_doc_verifier` · **Etiqueta Corta:** `Forense Incapacidad`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Analiza si una imagen o PDF de incapacidad o soporte médico fue alterado digitalmente: inspecciona metadatos binarios EXIF/XMP/PDF (ediciones en Canva, Photoshop, iLovePDF, múltiples %%EOF), anomalías visuales de tipografía/sellos con Visión IA, cuadre matemático de fechas/días, CIE-10 y NIT DIAN (Decreto 1427 de 2022), entregando enlace oficial de ReTHUS SISPRO para validación humana del médico tratante.

**Arquitectura Interna en Backend:**
Ejecuta `analyzeDisabilityCertificateForensics` (`api/server/services/forensicDocumentService.js`) en **4 capas reales**:
  - **Capa 1 (Forense Binaria Determinista):** Huella SHA-256, validación de Magic Bytes reales vs MIME declarado, inspección de diccionarios `/Info`, XMP, múltiples marcadores `%%EOF`/`xref` y detección de editores gráficos/PDF (`Canva`, `iLovePDF`, `Photoshop`, `Sejda`, `CorelDRAW`) o metadatos EXIF/PNG/WEBP.
  - **Capa 2 (Visión Multimodal IA):** Inspección visual con Gemini (`gemini-3.5-flash-lite` / `gemini-3.6-flash` / `gemini-3.8-flash`) detectando parches blancos, desalineaciones de renglón, tipografías superpuestas, sellos pixelados y plausibilidad clínica CIE-10 vs días.
  - **Capa 3 (Matemática, DIAN y Censo Hito 2):** Cuadre inclusivo `fechaFin - fechaInicio + 1 === diasNumero`, concordancia entre días en cifras y letras en español (`parseSpanishDaysWords`), validación Módulo 11 DIAN del NIT emisor y cruce aislado por `companyId` contra `SgsstWorker` / `PerfilSociodemograficoData`.
  - **Capa 4 (Verificación Institucional Automática 100% SIN CAPTCHA):** Consulta la API Abierta Socrata de **MinSalud REPS** (`datos.gov.co/resource/c36g-9fc2.json`, timeout `5500ms`, 0 CAPTCHA) para validar si el NIT de la IPS/Clínica y/o la cédula del profesional independiente están **HABILITADOS EN REPS**, y cruza la cédula del médico en **Contraloría General** (`consultarContraloriaFiscalPorCedula`, timeout `9000ms`) comparando tokens sin tildes del titular real del Estado contra el nombre impreso (disparando bandera de fraude `HIGH` si la cédula pertenece a otra persona). Además, cuando se conecta junto a `scraper_agy_antecedentes`, le transfiere automáticamente `medicoCedula` y `medicoNombre` para adjuntar el PDF oficial de Contraloría del médico firmante. Informa con total precisión que la consulta puntual del título académico en `SISPRO ReTHUS` exige resolver manualmente el CAPTCHA visual humano (`imgCaptcha`).
- **Marco Legal y Normativo SG-SST:** Decreto 1427 de 2022 (Art. 2.2.3.3.1 — requisitos mínimos de certificados de incapacidad y prohibición de retroactividad ambulatoria), Ley 1164 de 2007 (ReTHUS), Resolución 3100 de 2019 (Habilitación REPS MinSalud) y Decreto 1072 de 2015.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Doble ubicación soportada: **Puerto Inferior `◆ Herramienta +`** debajo del Agente IA (`inputs[]`, recomendado en Flujos Tenshi estilo `n8n` AI Agent Tool) o **Columna 2 (`extractors[]`)** en barridos programados.
- **Puertos de Conexión:** ◆ Conexión Superior hacia puerto `Herramienta +` del Agente IA (`tool_inputs_forensic_doc_verifier`) · ● Entrada Izquierda / ● Salida Derecha cuando opera en Etapa 2 (`extractor_forensic_doc_verifier`)
- **Canales de Invocación:** Invocable al instante por Voz/Chat en Tenshi (6 Flujos Globales Oficiales), por Cron programado en `/tareas`, o en prueba en vivo en el Inspector de 3 Paneles.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Ubicación Recomendada:** Conéctalo en `inputs: ["forensic_doc_verifier"]` (junto con `"scraper_agy_antecedentes"` si deseas descargar además el PDF oficial de Contraloría del médico firmante) con configuración espejo en `nodeConfigs.forensic_doc_verifier` y `nodeConfigs.tool_inputs_forensic_doc_verifier`.
- **2. Compuerta Previa Cero Tokens:** Combínalo con `if_router` (`ifPlacement: "pre_source"`, `ifConditionType: "has_attached_document"`) para solicitar amablemente el archivo en `0` tokens si el usuario olvidó adjuntarlo.
- **3. Capas Activas:** `checkExifAndPdfBinary: true`, `checkVisualTampering: true`, `checkDecree1427Compliance: true`, `checkOfficialRegistriesNoCaptcha: true` (REPS MinSalud Socrata + Contraloría General) e `includeManualRethusLink: true`.
- **Casillas / Campos Reales Disponibles (7):** `Metadatos Binarios EXIF / XMP / PDF (/Producer, /Creator, /ModDate y múltiples %%EOF)`, `Detección de Software de Edición Digital (Canva, Photoshop, iLovePDF, Sejda)`, `Análisis Visual Multimodal de Tipografía, Interlineado, Halos y Sellos Superpuestos`, `Cuadre Matemático de Fecha Inicio, Fecha Fin y Días Otorgados`, `Validación Normativa Decreto 1427 de 2022 (Art. 2.2.3.3.1), CIE-10 y NIT DIAN`, `Datos del Médico Tratante y Enlace Oficial ReTHUS SISPRO para Validación Humana`, `Índice de Riesgo Forense y Veredicto Técnico de Autenticidad Documental`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Auditoría Integral 3 Capas (EXIF/PDF + Visión IA + Decreto 1427)** — Activa inspección binaria, visual y legal completa con enlace ReTHUS (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Archivo binario adjunto en el chat o flujo (`attachedMedia` / `fileBuffer` en `.pdf`, `.jpg`, `.png` o `.webp`, máx. 25 MB) + `companyId` activo.
- **Salida (`OUTPUT`):** Objeto JSON estructurado `{ ok, riskScore (0-100), riskLevel (BAJO|MEDIO|ALTO), verdictLabel, fileMeta (SHA-256, EXIF, %%EOF), extractedFields (con medicoCedula e ipsNit), arithmeticCheck, nitCheck, workerMatch, officialRegistryVerification (repsIps, repsMedicoIndependiente, contraloriaDoctorIdentity), rethusVerification, redFlags, markdownReport }` y transferencia automática de `medicoCedula`/`medicoNombre` hacia `scraper_agy_antecedentes`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Tenshi IA (Voz/Chat)] ──▶ [Condición Si/No: ¿Adjuntó PDF/Imagen?] ──(SÍ)──▶ [Agente IA Tenshi + ◆ Forense Incapacidad (4 Capas: EXIF/PDF + Visión IA + Dec. 1427 + REPS/Contraloría) + ◆ Antecedentes Médico] ──▶ [Notificar en WAPPY + PDF Contraloría]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita forensemente este certificado de incapacidad médica adjunto y verifica bajo el Decreto 1427 de 2022 si presenta alteraciones digitales, si la IPS está habilitada en REPS y si la cédula del médico firmante coincide con su identidad real.»

---

### Búsqueda en la Web en Tiempo Real (MinTrabajo / SUIN / ARL)
- **ID Técnico (`id`):** `extract_web_search` · **Etiqueta Corta:** `Búsqueda Web`
- **Familia:** 2. Extractores Documentales, OCR y Scrapers OSINT · **Categoría:** `extractor`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Realiza una búsqueda en vivo en la web (portales oficiales, decretos, resoluciones, guías técnicas o noticias) y entrega los hallazgos al Agente IA.

**Operación Técnica:** `Búsqueda en tiempo real en internet y portales oficiales (web_search)` · Módulo: *📥 Extractor · Búsqueda en la Web en Tiempo Real (MinTrabajo / SUIN / ARL)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna 2 (Etapa de Ingesta y Transporte de Datos Crudos, a la izquierda de `Condición Si/No` y del `Agente IA`).
- **Puertos de Conexión:** ● Entrada Izquierda (desde Disparador) · ● Salida Derecha (hacia Merge, Condición Si/No o Extractor IA Docs)
- **Canales de Invocación:** Ejecutado automáticamente por `automationScheduler.js`, `workflowNodeInspectorService.js` (botón Inspeccionar Datos en Vivo) y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Portales Oficiales del Estado Colombiano (.gov.co / MinTrabajo / MinSalud / SUIN-Juriscol)`, `Últimas Resoluciones, Decretos y Circulares SST Vigentes`, `Sentencias de Corte Constitucional y Corte Suprema (Sala Laboral)`, `Guías Técnicas Colombianas (GTC / NTC) y Protocolos ARL`, `Alertas Sanitarias, Epidemiológicas o Climáticas Recientes`, `Citas Textuales Verificadas con URL y Fecha de Publicación`, `Tabla Comparativa de Requisitos Legales Encontrados`, `Verificación de Vigencia (Vigente vs. Derogada)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Normativa Vigente (.gov.co / MinTrabajo) + URL Verificada + Tabla Resumen** — Busca únicamente en fuentes oficiales colombianas con cita verificable (4 campos)
  * **⚡ Jurisprudencia Laboral (Corte Constitucional / CSJ) y Doctrina ARL** — Fundamentación jurídica para casos complejos de estabilidad o ATEL (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Parámetros de búsqueda (`driveFolderName`, `gmailSearchQuery`, `watchFolderPath`, `targetUrl` o archivos listados por el paso previo).
- **Salida (`OUTPUT`):** Arreglo homogéneo `records[]` (hasta 300 registros sin truncar nómina), metadatos de conexión (`connected`, `resolvedFolder`, hash `SHA-256`) y llaves candidatas para `wappy_memory_antiduplicate`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Búsqueda Web] ──▶ [Condición Si/No: ¿Archivos nuevos?] ──(SÍ)──▶ [✨ Extractor IA Docs] ──▶ [Agente IA + ◆ Hito Somos SST] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, quiero usar Búsqueda Web para revisar documentos nuevos y actualizar automáticamente mi SG-SST.»

---

## 3. Cerebro Agente IA y Motores LLM

> Núcleo cognitivo estilo n8n (AI Agent) impulsado por la escalera oficial de modelos Gemini con rotación automática de claves WAPPY o por delegación MCP hacia Google Antigravity Local / Cloud 24/7.

### 🤖 Agente IA Principal (Orquestador Cognitivo estilo n8n AI Agent)
- **ID Técnico (`id`):** `agent_root` · **Etiqueta Corta:** `Agente IA Principal`
- **Familia:** 3. Cerebro Agente IA y Motores LLM · **Categoría:** `agent_core`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Nodo central del lienzo estilo n8n AI Agent: recibe el contexto depurado de Etapa 2/3, razona con el Modelo IA conectado (◆ Modelo IA), consulta la Memoria empresarial/anti-duplicados (◆ Memoria), invoca herramientas reales o aplicativos Somos SST (◆ Herramienta +) y entrega un dictamen ejecutivo verificable hacia las salidas.

**Operación Técnica:** `Agente Especialista SG-SST (23 especialistas disponibles + Tenshi Orquestador)` · Módulo: *🧠 Agente IA Principal del Flujo (Orquestador SG-SST)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1843 de 2025 / Resolución 2346 de 2007 (Evaluaciones Médicas Ocupacionales), Decreto 1427 de 2022 y Ley 23 de 1981 (Reserva de Historia Clínica).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna Central (Etapa 4) — Clúster Principal `Agente IA` estilo `n8n`
- **Puertos de Conexión:** ● Entrada Principal Izquierda (recibe registros filtrados / OCR) · ● Salida Principal Derecha (entrega dictamen hacia IF post_agent, Visto Bueno o Salidas) · ◆ Rombo Inferior 1: `Modelo IA` (`sub_model`) · ◆ Rombo Inferior 2: `Memoria ◆` (`sub_memory`) · ◆ Rombo Inferior 3: `Herramienta +` (`tool_inputs_*` / `tool_hitos_*`, obligatorio >= 1 herramienta visible)
- **Canales de Invocación:** Orquestado en `/tareas`, Sandbox de Desarrollo sin efectos secundarios y Flujos Instantáneos de Tenshi Voz/Chat.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (9):** `Cruzar Datos Estrictamente por Número de Cédula y Nombre Completo`, `Procesar Únicamente los Campos Seleccionados en los Nodos de Entrada`, `Prohibido Inventar o Simular Trabajadores, Soportes o Fechas`, `Clasificar Hallazgos por Prioridad (Crítico / Alto / Medio / Bajo)`, `Citar Artículos Exactos de la Normativa Colombiana (Dec. 1072 / Res. 0312)`, `Actualizar Registros Reales en los Aplicativos Conectados de Somos SST`, `Incluir Tabla Comparativa en Markdown (Estado Actual vs. Brecha Detectada)`, `Generar Recomendaciones Técnicas con Responsable y Plazo de Cierre`, `Emitir Resumen Ejecutivo en Tarjeta wappy-card`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cruce por Cédula + Cero Invención + Tabla de Brechas + wappy-card** — Directiva quirúrgica para cruces de trabajadores, Drive y vencimientos (5 campos)
  * **⚡ Auditoría Normativa (Dec. 1072 / 0312) + Actualizar Somos SST + Plan de Acción** — Directiva completa de auditoría, alimentación de Hitos y recomendaciones (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Agente IA Principal] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Agente IA Principal a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### WAPPY IA · Gemini 3.6 Flash (Key Rotation)
- **ID Técnico (`id`):** `wappy_gemini_3_6_flash` · **Etiqueta Corta:** `Gemini 3.6 Flash`
- **Familia:** 3. Cerebro Agente IA y Motores LLM · **Categoría:** `ai_model`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Motor en la nube 24/7 con rotación automática de claves WAPPY y balance óptimo de razonamiento.

**Operación Técnica:** `wappy · gemini-3.6-flash` · Módulo: *🧠 Motor IA · WAPPY IA · Gemini 3.6 Flash (Key Rotation)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Modelo IA`** debajo del `Agente IA`
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Modelo IA` del Agente Principal o Sub-Agente
- **Canales de Invocación:** Seleccionable en el Constructor Visual `/tareas` (con rotación automática de claves Gemini en WAPPY Cloud o delegación Push SSE a Antigravity).

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (9):** `Rotación Automática de Claves API en la Nube WAPPY 24/7`, `Razonamiento Estructurado Paso a Paso (Chain-of-Thought SST)`, `Invocación Automática de Herramientas Nativas Somos SST`, `Cruce Estricto por Número de Cédula y Nombre Completo`, `Veracidad Estricta (Prohibido Inventar o Simular Registros)`, `Salida en Tablas Markdown Limpias + Tarjeta Ejecutiva wappy-card`, `Citación de Artículos Exactos (Dec. 1072, Res. 0312, GTC-45)`, `Priorización de Hallazgos por Criticidad (Nivel I Crítico a Nivel IV)`, `Generación de Plan de Acción con Responsables y Fechas`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Razonamiento SST + Cruce por Cédula + Cero Invención + Tablas Markdown** — Configuración estándar de alta precisión para auditorías y cruces SST (4 campos)
  * **⚡ Invocación de Herramientas SST + Cita Legal + Plan de Acción** — Ejecuta herramientas en Somos SST y fundamenta cada recomendación (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Gemini 3.6 Flash] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Gemini 3.6 Flash a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### WAPPY IA · Gemini 3.5 Flash Lite (Ultra Rápido)
- **ID Técnico (`id`):** `wappy_gemini_3_5_flash_lite` · **Etiqueta Corta:** `Gemini 3.5 Lite`
- **Familia:** 3. Cerebro Agente IA y Motores LLM · **Categoría:** `ai_model`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Ideal para barridos frecuentes de Drive, vencimientos y alertas rápidas con rotación de claves.

**Operación Técnica:** `wappy · gemini-3.5-flash-lite` · Módulo: *🧠 Motor IA · WAPPY IA · Gemini 3.5 Flash Lite (Ultra Rápido)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Modelo IA`** debajo del `Agente IA`
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Modelo IA` del Agente Principal o Sub-Agente
- **Canales de Invocación:** Seleccionable en el Constructor Visual `/tareas` (con rotación automática de claves Gemini en WAPPY Cloud o delegación Push SSE a Antigravity).

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Modo Ultra Rápido de Baja Latencia con Rotación de Claves WAPPY`, `Barrido Ágil de Vencimientos (EMO, Alturas, SOAT, RTM, Extintores)`, `Extracción Quirúrgica de Campos Seleccionados (Ahorro de Tokens)`, `Cruce Rápido de Nómina por Cédula y Estado de Afiliación`, `Filtro Directo de Solo Registros Vencidos o Próximos a Vencer`, `Síntesis Ejecutiva en Tabla Compacta de Alertas`, `Veracidad Estricta sin Alucinaciones`, `Despacho Inmediato a Notificaciones WAPPY y Correo`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Barrido Rápido de Vencimientos + Solo Alertas + Tabla Compacta** — Ideal para ejecuciones diarias o frecuentes de monitoreo SST (4 campos)
  * **⚡ Cruce Ágil por Cédula + Ahorro de Tokens + Cero Invención** — Optimiza velocidad en validaciones masivas de Drive o trabajadores (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Gemini 3.5 Lite] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Gemini 3.5 Lite a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### WAPPY IA · Gemini 3.8 Flash (Análisis Profundo)
- **ID Técnico (`id`):** `wappy_gemini_3_8_flash` · **Etiqueta Corta:** `Gemini 3.8 Flash`
- **Familia:** 3. Cerebro Agente IA y Motores LLM · **Categoría:** `ai_model`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Máxima capacidad analítica para auditorías Res. 0312, investigación ATEL, Matriz Legal y DOFA.

**Operación Técnica:** `wappy · gemini-3.8-flash` · Módulo: *🧠 Motor IA · WAPPY IA · Gemini 3.8 Flash (Análisis Profundo)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1401 de 2007 (Investigación de Incidentes y Accidentes de Trabajo) y NTC 3701.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Modelo IA`** debajo del `Agente IA`
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Modelo IA` del Agente Principal o Sub-Agente
- **Canales de Invocación:** Seleccionable en el Constructor Visual `/tareas` (con rotación automática de claves Gemini en WAPPY Cloud o delegación Push SSE a Antigravity).

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Análisis Profundo Multi-Documento y Razonamiento Extendido`, `Auditoría Exhaustiva de los 60 Estándares Mínimos (Res. 0312)`, `Análisis Causal Profundo ATEL (Árbol de Causas, 5 Porqués, Ishikawa)`, `Valoración Cuantitativa Completa GTC-45, PESV Res. 40595 y SGA Dec. 1496`, `Correlación Epidemiológica y Biocéntrica (Salud, OWAS, EPT y Psicosocial)`, `Fundamentación Jurídica (Dec. 1072, Sentencias Corte Constitucional y CSJ)`, `Redacción de Informes Técnicos Formales Listos para Firma y Exportación`, `Veracidad Estricta y Trazabilidad de Evidencias`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Auditoría Profunda 0312 + Causalidad ATEL + Fundamentación Jurídica** — Máxima profundidad analítica para informes gerenciales y legales (4 campos)
  * **⚡ Cruce Epidemiológico Biocéntrico + GTC-45/PESV/SGA + Informe Formal** — Integra múltiples matrices técnicas en un dictamen especializado (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Gemini 3.8 Flash] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Gemini 3.8 Flash a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Google Antigravity Local (Mac/PC) + MCP WAPPY (110+ Tools)
- **ID Técnico (`id`):** `antigravity_mcp_engine` · **Etiqueta Corta:** `Antigravity Local + MCP`
- **Familia:** 3. Cerebro Agente IA y Motores LLM · **Categoría:** `ai_model`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Delega el procesamiento a tu Antigravity en Mac/PC vía Push SSE con las 110+ herramientas MCP y respaldo automático.

**Operación Técnica:** `antigravity · gemini-3.6-flash` · Módulo: *🧠 Motor IA · Google Antigravity Local (Mac/PC) + Servidor MCP WAPPY (110+ Tools)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Modelo IA`** debajo del `Agente IA`
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Modelo IA` del Agente Principal o Sub-Agente
- **Canales de Invocación:** Seleccionable en el Constructor Visual `/tareas` (con rotación automática de claves Gemini en WAPPY Cloud o delegación Push SSE a Antigravity).

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Delegación Reactiva por Puente Push SSE hacia tu Mac/PC`, `Acceso Completo a las 110+ Herramientas del Servidor MCP WAPPY`, `Lectura y Escritura Directa en Carpetas Locales del Computador`, `Navegador Nativo Integrado de Antigravity y Ejecución de Scripts Locales (Python / Node.js)`, `Sincronización Bidireccional en Vivo con los 8 Hitos de Somos SST`, `Cascada de Protección: 1° Antigravity Local ➔ 2° Antigravity Cloud ➔ 3° Respaldo HTTP Seguro sin Chromium en VPS`, `Cero Invención de Datos (Validación contra Base de Datos Real)`, `Entrega de Bitácora Detallada en Consola Antigravity y WAPPY`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Puente Push SSE + 110+ Tools MCP + Lectura de Carpeta Local PC** — Aprovecha toda la potencia de Antigravity en tu equipo local (4 campos)
  * **⚡ Navegador Nativo Antigravity + Cascada Local ➔ Cloud ➔ HTTP Seguro** — Ideal para flujos con Web Scraping o automatización avanzada sin Chromium en VPS (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Antigravity Local + MCP] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Antigravity Local + MCP a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Google Antigravity Cloud 24/7 (antigravity.google.com) + MCP WAPPY
- **ID Técnico (`id`):** `antigravity_cloud_mcp_engine` · **Etiqueta Corta:** `Antigravity Cloud 24/7`
- **Familia:** 3. Cerebro Agente IA y Motores LLM · **Categoría:** `ai_model`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Delega el procesamiento a tu instancia conectada en Google Antigravity Cloud (antigravity.google.com) 24/7 sin depender de tu PC encendido.

**Operación Técnica:** `antigravity_cloud · gemini-3.6-flash` · Módulo: *🧠 Motor IA · Google Antigravity Cloud 24/7 (antigravity.google.com) + MCP WAPPY*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Modelo IA`** debajo del `Agente IA`
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Modelo IA` del Agente Principal o Sub-Agente
- **Canales de Invocación:** Seleccionable en el Constructor Visual `/tareas` (con rotación automática de claves Gemini en WAPPY Cloud o delegación Push SSE a Antigravity).

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Ejecución Autónoma 24/7 en Google Antigravity Cloud (Sin PC Prendido)`, `Conexión Permanente al Servidor MCP WAPPY (110+ Herramientas SST)`, `Ejecución de Scripts y Sandbox en la Nube de Antigravity`, `Orquestación de Conectores Google Workspace, Drive, Gmail y NotebookLM`, `Actualización Directa de Matrices y Expedientes en Somos SST`, `Veracidad Estricta y Control Anti-Duplicados`, `Reporte Consolidado en Antigravity Cloud y Campana WAPPY`, `Alta Disponibilidad para Tareas Programadas Nocturnas o Semanales`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cloud 24/7 sin PC Prendido + 110+ Tools MCP + Actualización Somos SST** — Ejecución continua en antigravity.google.com conectada a tu empresa (4 campos)
  * **⚡ Sandbox de Scripts Cloud + Conectores Google + Bitácora Consolidada** — Combina herramientas de Google Workspace y scripts en la nube (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Antigravity Cloud 24/7] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Antigravity Cloud 24/7 a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

## 4. Memorias Contextuales, Anti-Duplicados y RAG

> Inyectan el perfil legal de la empresa activa (NIT, CIIU, Riesgo ARL), filtran registros ya procesados (processedEntityKeys) para gastar 0 tokens repetidos, conectan cuadernos RAG y aplican reglas normativas SST.

### Memoria de Empresa Activa (Somos SST)
- **ID Técnico (`id`):** `wappy_memory_company` · **Etiqueta Corta:** `Memoria Empresa SST`
- **Familia:** 4. Memorias Contextuales, Anti-Duplicados y RAG · **Categoría:** `memory`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Inyecta automáticamente Razón Social, NIT, CIIU, Nivel de Riesgo ARL, número de trabajadores, sedes y Responsable SST de la empresa seleccionada.

**Operación Técnica:** `Memoria de Empresa Activa en Somos SST (NIT, CIIU, Nivel de Riesgo ARL, sedes y trabajadores)` · Módulo: *💾 Memoria · Contexto de la Empresa Activa (Somos SST)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1843 de 2025 / Resolución 2346 de 2007 (Evaluaciones Médicas Ocupacionales), Decreto 1427 de 2022 y Ley 23 de 1981 (Reserva de Historia Clínica).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Memoria`** debajo del `Agente IA` (`memories[]`)
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Memoria` del Agente IA (`sub_memory_wappy_memory_company`)
- **Canales de Invocación:** Hidratado automáticamente antes del razonamiento del Agente IA asegurando aislamiento estricto multi-empresa (`companyId`).

#### 3. ¿Cómo se Configura Paso a Paso?
- **Activación Automática por Empresa:** Agrégalo en `workflowNodes.memories` (`["wappy_memory_company"]`); el planificador inyecta únicamente los datos del `companyId` activo sin mezclar otras empresas.
- **Casillas / Campos Reales Disponibles (10):** `Razón Social y NIT de la Empresa Activa`, `Código CIIU y Descripción de la Actividad Económica`, `Clase de Riesgo ARL (Nivel I a V) y Nombre de la ARL Afiliada`, `Número Total de Trabajadores y Distribución por Sede`, `Sedes / Centros de Trabajo, Dirección, Ciudad y Departamento`, `Nombre Completo y Cédula del Representante Legal`, `Nombre, Cédula y Licencia Vigente del Responsable del SG-SST`, `Tamaño de Empresa y Capítulo Aplicable Res. 0312 (7, 21 o 60 Estándares)`, `Puntaje Actual de Autoevaluación Res. 0312 (%)`, `Peligros Prioritarios y Resumen Ejecutivo de los 8 Hitos`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Razón Social + NIT + CIIU + Riesgo ARL + Total Trabajadores** — Contexto corporativo esencial para encabezados e informes SST (4 campos)
  * **⚡ Representante Legal + Responsable SST con Licencia + Sedes** — Datos oficiales de firma para políticas, reglamentos y actas (4 campos)
  * **⚡ Capítulo Aplicable Res. 0312 (7/21/60) + Puntaje % + Peligros Prioritarios** — Enfoca al agente en el estándar legal exacto según tamaño y riesgo (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Identificador aislado de empresa activa (`companyId`) e historial previo en `AutomationLog`.
- **Salida (`OUTPUT`):** Bloque de contexto verificado inyectado al prompt del sistema del Agente IA y conjunto `dedupLedger.keysSet` para omitir ítems repetidos.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Memoria Empresa SST] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Memoria Empresa SST a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Memoria de Bitácora Previa (Anti-Duplicados)
- **ID Técnico (`id`):** `wappy_memory_antiduplicate` · **Etiqueta Corta:** `Memoria Bitácora`
- **Familia:** 4. Memorias Contextuales, Anti-Duplicados y RAG · **Categoría:** `memory`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Recuerda qué correos de Gmail, archivos de Google Drive o registros ya fueron procesados en corridas anteriores para no duplicar información.

**Operación Técnica:** `Memoria de Historial de Ejecuciones Anteriores (AutomationLog) para procesar únicamente novedades reales sin duplicar registros` · Módulo: *💾 Memoria · Bitácora Previa Anti-Duplicados (AutomationLog)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1843 de 2025 / Resolución 2346 de 2007 (Evaluaciones Médicas Ocupacionales), Decreto 1427 de 2022 y Ley 23 de 1981 (Reserva de Historia Clínica).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Memoria`** debajo del `Agente IA` (`memories[]`)
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Memoria` del Agente IA (`sub_memory_wappy_memory_antiduplicate`)
- **Canales de Invocación:** Hidratado automáticamente antes del razonamiento del Agente IA asegurando aislamiento estricto multi-empresa (`companyId`).

#### 3. ¿Cómo se Configura Paso a Paso?
- **Ventana Anti-Duplicados (`dedupWindow`):** Obligatorio declarar `"24h"`, `"7d"`, `"30d"` o `"all"` en `nodeConfigs.sub_memory_wappy_memory_antiduplicate` junto con `dedupKey` (`"cedula"`, `"standard_id"` o `"filename"`).
- **Casillas / Campos Reales Disponibles (8):** `IDs y Fechas de las Últimas Ejecuciones Exitosas de esta Tarea`, `Hash / ID de Correos de Gmail ya Procesados en Corridas Anteriores`, `IDs y Nombres de Archivos de Google Drive / OneDrive ya Analizados`, `Cédulas de Trabajadores ya Notificados por el Mismo Vencimiento`, `IDs de Acciones ACPM o Casos ATEL ya Creados Previamente`, `Detectar Únicamente Diferencias / Delta (Nuevos Hallazgos o Cambios de Estado)`, `Evitar Reenvío de Alertas Idénticas dentro de la Misma Semana`, `Trazabilidad Comparativa (Corrida Anterior vs. Corrida Actual)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Omitir Correos, Archivos Drive y Cédulas ya Procesados (Solo Novedades)** — Garantiza que el flujo procese únicamente registros nuevos sin duplicar (4 campos)
  * **⚡ No Duplicar Tareas ACPM + Comparativa Corrida Anterior vs. Actual** — Evita abrir tareas repetidas en el Kanban ACPM y muestra evolución (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Identificador aislado de empresa activa (`companyId`) e historial previo en `AutomationLog`.
- **Salida (`OUTPUT`):** Bloque de contexto verificado inyectado al prompt del sistema del Agente IA y conjunto `dedupLedger.keysSet` para omitir ítems repetidos.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Memoria Bitácora] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Memoria Bitácora a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Memoria Documental RAG (NotebookLM + Docs Vivo)
- **ID Técnico (`id`):** `wappy_rag_documental` · **Etiqueta Corta:** `RAG Documental`
- **Familia:** 4. Memorias Contextuales, Anti-Duplicados y RAG · **Categoría:** `memory`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Consulta los manuales, protocolos internos, reglamentos y cuadernos de Google NotebookLM vinculados a la empresa.

**Operación Técnica:** `Memoria RAG Documental (Cuadernos de Google NotebookLM y Documentos Vivo de la empresa)` · Módulo: *💾 Memoria · RAG Documental (Google NotebookLM + Documentos Vivo)*.
- **Marco Legal y Normativo SG-SST:** Resolución 2764 de 2022 (Batería de Riesgo Psicosocial), Ley 1010 de 2006 y Resolución 3461 de 2025.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Memoria`** debajo del `Agente IA` (`memories[]`)
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Memoria` del Agente IA (`sub_memory_wappy_rag_documental`)
- **Canales de Invocación:** Hidratado automáticamente antes del razonamiento del Agente IA asegurando aislamiento estricto multi-empresa (`companyId`).

#### 3. ¿Cómo se Configura Paso a Paso?
- **Activación Automática por Empresa:** Agrégalo en `workflowNodes.memories` (`["wappy_rag_documental"]`); el planificador inyecta únicamente los datos del `companyId` activo sin mezclar otras empresas.
- **Casillas / Campos Reales Disponibles (8):** `Cuadernos Activos de Google NotebookLM Vinculados a la Empresa`, `Documentos Vivo Guardados en el Editor Oficial de Somos SST`, `Manuales, Procedimientos Operativos Estándar (POE) y Protocolos Internos`, `Reglamento Interno de Trabajo (RIT) y Reglamento de Higiene (RHS) Vigentes`, `Programas de Vigilancia Epidemiológica (PVE) y Planes de Emergencia`, `Citas Textuales con Fuente Documental y Página / Sección Exacta`, `Cruce entre Procedimiento Documentado y Realidad Operativa`, `Detección de Documentos Desactualizados o sin Firma`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Consultar Cuadernos NotebookLM + Documentos Vivo + Citas Exactas** — Fundamenta el análisis en la biblioteca documental propia de la empresa (3 campos)
  * **⚡ Cruzar Manuales/POE/PVE contra Hallazgos Operativos** — Verifica si se están cumpliendo los protocolos internos de la empresa (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Identificador aislado de empresa activa (`companyId`) e historial previo en `AutomationLog`.
- **Salida (`OUTPUT`):** Bloque de contexto verificado inyectado al prompt del sistema del Agente IA y conjunto `dedupLedger.keysSet` para omitir ítems repetidos.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ RAG Documental] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta RAG Documental a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Memoria Normativa del Especialista (Reglas SST)
- **ID Técnico (`id`):** `wappy_memory_procedural` · **Etiqueta Corta:** `Memoria Normativa`
- **Familia:** 4. Memorias Contextuales, Anti-Duplicados y RAG · **Categoría:** `memory`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Aplica las reglas técnicas del especialista SST en Colombia (Decreto 1072, Res. 0312, GTC-45, Res. 2764, PESV Res. 40595 y SGA Dec. 1496).

**Operación Técnica:** `Memoria Procedural y Normativa SG-SST Colombia (Dec. 1072, Res. 0312, GTC-45, Res. 2764, PESV y SGA)` · Módulo: *💾 Memoria · Normativa del Especialista SG-SST Colombia*.
- **Marco Legal y Normativo SG-SST:** Resolución 20223040040595 de 2022 (Plan Estratégico de Seguridad Vial — PESV) e ISO 39001.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Memoria`** debajo del `Agente IA` (`memories[]`)
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Memoria` del Agente IA (`sub_memory_wappy_memory_procedural`)
- **Canales de Invocación:** Hidratado automáticamente antes del razonamiento del Agente IA asegurando aislamiento estricto multi-empresa (`companyId`).

#### 3. ¿Cómo se Configura Paso a Paso?
- **Activación Automática por Empresa:** Agrégalo en `workflowNodes.memories` (`["wappy_memory_procedural"]`); el planificador inyecta únicamente los datos del `companyId` activo sin mezclar otras empresas.
- **Casillas / Campos Reales Disponibles (8):** `Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST)`, `Resolución 0312 de 2019 (Estándares Mínimos según Tamaño y Riesgo ARL)`, `Guía Técnica Colombiana GTC-45 (Metodología ND x NE = NP; NP x NC = NR)`, `Resolución 2764 de 2022 y Ley 1010 de 2006 (Riesgo Psicosocial y Convivencia)`, `Resolución 20223040040595 de 2022 (Metodología de 24 Pasos del PESV)`, `Decreto 1496 de 2018 y Resolución 773 de 2021 (Químicos SGA y FDS)`, `Resolución 4272 de 2021 (Trabajo Seguro en Alturas) y Res. 1401 de 2007 (ATEL)`, `Resolución 2346 de 2007 y Ley 1581 de 2012 (Reserva de Historia Clínica y Habeas Data)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Núcleo Legal SST (Dec. 1072 + Res. 0312 + GTC-45 + Res. 1401 ATEL)** — Inyecta las normas troncales de auditoría y riesgos laborales en Colombia (4 campos)
  * **⚡ Normas Especiales (PESV Res. 40595 + Químicos SGA + Psicosocial + Reserva Médica)** — Ideal para flujos viales, químicos, psicosociales o de exámenes médicos (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Identificador aislado de empresa activa (`companyId`) e historial previo en `AutomationLog`.
- **Salida (`OUTPUT`):** Bloque de contexto verificado inyectado al prompt del sistema del Agente IA y conjunto `dedupLedger.keysSet` para omitir ítems repetidos.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Memoria Normativa] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Memoria Normativa a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

## 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes

> Herramientas invocables bajo demanda por el Agente IA: motores GTC-45/PESV/SGA, Google Workspace, NotebookLM, Google Flow Veo, APIs científicas (PubChem, MedlinePlus, OpenWeather, OSM), Skills, Reglas y 29 Sub-Agentes especialistas.

### Contexto Empresa Activa (Somos SST)
- **ID Técnico (`id`):** `somos_sst_empresa` · **Etiqueta Corta:** `Empresa SST`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `wappy_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Oficiales del Perfil de la Empresa Activa a Inyectar

**Operación Técnica:** `somos_sst (consultar_informacion_empresa y resumen_empresa)` · Módulo: *🏢 Conector WAPPY · Contexto y Ficha Técnica de la Empresa Activa (Somos SST)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_somos_sst_empresa`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (6):** `Razón Social, NIT y Actividad Económica (Código CIIU)`, `Clase de Riesgo ARL (Nivel I a V) y Entidad ARL Afiliada`, `Número Total de Trabajadores Activos y Distribución por Sedes`, `Ciudad, Dirección Principal y Centros de Trabajo`, `Representante Legal y Responsable del SG-SST con Licencia Vigente`, `Tamaño de Empresa y Estándares Aplicables Res. 0312 (7, 21 o 60)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Encabezado Normativo (Razón Social + NIT + CIIU + ARL + Trabajadores)** — Contexto corporativo esencial para cualquier dictamen o auditoría (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Empresa SST] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Empresa SST a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Bio-Motor Trabajadores y Expedientes 360°
- **ID Técnico (`id`):** `somos_sst_trabajadores` · **Etiqueta Corta:** `Trabajadores 360°`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `wappy_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Columnas del Expediente Integral 360° por Trabajador

**Operación Técnica:** `somos_sst (listar_trabajadores, consultar_expediente_integral)` · Módulo: *👥 Conector WAPPY · Bio-Motor de Trabajadores y Expedientes 360°*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_somos_sst_trabajadores`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (6):** `Cédula / Documento de Identidad y Nombre Completo`, `Cargo, Área / Proceso, Sede y Fecha de Ingreso`, `Seguridad Social Registrada (EPS, ARL, Fondo de Pensión AFP y CCF)`, `Estado de Examen Médico Ocupacional (EMO), Concepto y Restricciones Vigentes`, `Vigencia de Certificados de Trabajo en Alturas, Capacitaciones y Entregas EPP`, `Alertas Preventivas Activas en el Expediente 360°`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Nómina Activa + Seguridad Social + Vencimientos EMO/Alturas/EPP** — Cruce integral 360° por cédula sin datos superfluos (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Trabajadores 360°] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Trabajadores 360° a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Perfiles de Cargo y Funciones (Somos SST)
- **ID Técnico (`id`):** `somos_sst_perfiles_cargo` · **Etiqueta Corta:** `Perfiles de Cargo`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `wappy_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Elementos del Perfil de Cargo a Consultar

**Operación Técnica:** `wappy_consultar_perfiles_cargo (funciones, competencias, riesgos y requisitos del cargo del trabajador)` · Módulo: *💼 Conector WAPPY · Perfiles de Cargo, Funciones y Competencias SST*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_somos_sst_perfiles_cargo`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Nombre del Cargo, Área y Propósito Principal`, `Funciones Esenciales y Responsabilidades Específicas en SG-SST`, `Educación, Formación, Licencia o Certificación Exigida (Alturas, PESV, RETIE)`, `Peligros Asociados al Cargo, EPP Obligatorios y Exámenes del Profesiograma`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Funciones SST + Certificaciones Exigidas + EPP y Profesiograma** — Valida idoneidad del trabajador frente a las exigencias de su cargo (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Perfiles de Cargo] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Perfiles de Cargo a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Control y Entregas de EPP por Trabajador (Somos SST)
- **ID Técnico (`id`):** `somos_sst_epp` · **Etiqueta Corta:** `Entregas EPP`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `wappy_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos del Registro de Entrega y Reposición de EPP

**Operación Técnica:** `wappy_consultar_epp (verificar entregas de Elementos de Protección Personal firmadas por el trabajador)` · Módulo: *🦺 Conector WAPPY · Control y Entregas de EPP por Trabajador*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_somos_sst_epp`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Cédula, Nombre del Trabajador y Cargo`, `Elemento de Protección Personal Entregado y Norma Técnica (ANSI / NIOSH / EN)`, `Fecha de Entrega, Vida Útil Estimada y Fecha de Próxima Reposición`, `Estado de Firma / Constancia de Recepción por el Trabajador`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Trabajador + EPP Entregado + Fecha de Reposición + Firma** — Detecta dotaciones vencidas o entregas sin soporte firmado (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Entregas EPP] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Entregas EPP a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Evaluaciones Médicas Ocupacionales EMO (Res. 1843)
- **ID Técnico (`id`):** `somos_sst_examenes` · **Etiqueta Corta:** `Exámenes EMO`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `wappy_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Clínico-Ocupacionales (Bajo Reserva Legal Res. 2346 / Res. 1843)

**Operación Técnica:** `somos_sst (consultar exámenes médicos ocupacionales, concepto de aptitud y restricciones del trabajador)` · Módulo: *🩺 Conector WAPPY · Evaluaciones Médicas Ocupacionales (EMO) y Restricciones*.
- **Marco Legal y Normativo SG-SST:** Resolución 1843 de 2025 / Resolución 2346 de 2007 (Evaluaciones Médicas Ocupacionales), Decreto 1427 de 2022 y Ley 23 de 1981 (Reserva de Historia Clínica).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_somos_sst_examenes`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Cédula, Nombre del Trabajador y Cargo Evaluado`, `Tipo de Evaluación (Ingreso, Periódico, Egreso, Post-Incapacidad, Cambio de Ocupación)`, `Concepto de Aptitud Médica, Fecha de Examen y Fecha de Próximo Control`, `Restricciones Laborales, Recomendaciones Ocupacionales y Remisión a SVE`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Concepto EMO + Vencimientos + Restricciones Activas por Cédula** — Control médico preventivo respetando la reserva de historia clínica (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Exámenes EMO] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Exámenes EMO a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Motor Matriz IPEVAR / GTC-45
- **ID Técnico (`id`):** `matriz_ipevar` · **Etiqueta Corta:** `Motor GTC-45`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `wappy_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Columnas de Valoración Matemática GTC-45 a Consultar o Alimentar

**Operación Técnica:** `matriz_ipevar (leer y evaluar peligros GTC-45 y controles existentes en fuente, medio e individuo)` · Módulo: *⚠️ Motor WAPPY · Matriz de Peligros y Valoración de Riesgos IPEVR (GTC-45)*.
- **Marco Legal y Normativo SG-SST:** Guía Técnica Colombiana GTC-45 (2.ª Actualización) y Decreto 1072 de 2015 Art. 2.2.4.6.15.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_matriz_ipevar`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (5):** `Proceso, Zona / Lugar, Actividad y Tarea (Rutinaria / No Rutinaria)`, `Clasificación y Descripción del Peligro y Efectos Posibles`, `Evaluación del Riesgo: ND, NE, NP, NC, NR e Interpretación (Nivel I a IV)`, `Aceptabilidad del Riesgo y Número de Expuestos`, `Jerarquía de Controles (Eliminación, Sustitución, Ingeniería, Administrativos y EPP)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Peligros Nivel I y II (Críticos/Altos) + Valoración NR + Controles** — Prioriza peligros no aceptables para planes de intervención (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Motor GTC-45] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Motor GTC-45 a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Motor Matriz Vial PESV (Res. 40595)
- **ID Técnico (`id`):** `matriz_pesv` · **Etiqueta Corta:** `Motor PESV`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `wappy_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Variables de Evaluación de Riesgo Vial por Actor de la Vía

**Operación Técnica:** `matriz_pesv (leer y evaluar riesgos viales)` · Módulo: *🚗 Motor WAPPY · Matriz de Riesgos Viales PESV (Res. 20223040040595)*.
- **Marco Legal y Normativo SG-SST:** Resolución 20223040040595 de 2022 (Plan Estratégico de Seguridad Vial — PESV) e ISO 39001.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_matriz_pesv`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Actor Vial Evaluado (Conductor, Motociclista, Ciclista, Peatón, Pasajero)`, `Factor de Riesgo Vial (Humano, Vehículo, Infraestructura, Entorno)`, `Valoración de Probabilidad x Severidad y Nivel de Riesgo Vial`, `Controles Preventivos y Articulación con las 24 Fases del PESV`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Riesgos Viales Críticos por Actor Vial + Controles PESV** — Alineado con la Fase 1 y Fase 2 de la Resolución 20223040040595 (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Motor PESV] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Motor PESV a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Motor Químico SGA (Dec. 1496 / ONU)
- **ID Técnico (`id`):** `matriz_compatibilidad` · **Etiqueta Corta:** `Motor Químico SGA`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `wappy_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Parámetros de Almacenamiento Seguro y Segregación Química SGA

**Operación Técnica:** `matriz_compatibilidad (inventario químico y FDS)` · Módulo: *🧪 Motor WAPPY · Matriz de Compatibilidad Química SGA (Decreto 1496 de 2018)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1496 de 2018 (Sistema Globalmente Armonizado — SGA), Ley 55 de 1993 y NTC 1692.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_matriz_compatibilidad`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Sustancia Química, Número CAS, Número ONU y Clase de Peligro SGA (1 a 9)`, `Pictogramas SGA, Palabra de Advertencia e Indicaciones de Peligro (Frases H y P)`, `Resultado de Compatibilidad Cruzada (Compatible / Precaución / Incompatible)`, `Vigencia de Ficha de Datos de Seguridad FDS (< 5 Años) y Kit de Derrames`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Choques Químicos Incompatibles + Vigencia FDS + Pictogramas SGA** — Previene reacciones peligrosas en bodegas y cuartos químicos (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Motor Químico SGA] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Motor Químico SGA a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Analítica Psicosocial y Clima Laboral
- **ID Técnico (`id`):** `consultar_analitica_psicosocial` · **Etiqueta Corta:** `Analítica Psicosocial`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `wappy_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Indicadores Grupales y Confidenciales de Bienestar y Riesgo Psicosocial

**Operación Técnica:** `consultar_analitica_psicosocial` · Módulo: *🧠 Conector WAPPY · Analítica Psicosocial y Clima Emocional (Res. 2764)*.
- **Marco Legal y Normativo SG-SST:** Resolución 2764 de 2022 (Batería de Riesgo Psicosocial), Ley 1010 de 2006 y Resolución 3461 de 2025.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_consultar_analitica_psicosocial`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Tendencia Grupal de Estado de Ánimo, Estrés y Fatiga por Área / Sede`, `Dimensiones Intralaborales y Extralaborales Prioritarias (Res. 2764 de 2022)`, `Alertas Tempranas de Sobrecarga o Burnout (Anonimizadas bajo Reserva Legal)`, `Acciones de Promoción de Salud Mental y Protocolos Sectoriales sugeridos`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Tendencia por Área + Alertas Anonimizadas + Plan Salud Mental** — Cumple estrictamente la reserva de la Resolución 2346 y Ley 1090 (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Analítica Psicosocial] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Analítica Psicosocial a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Analítica de Actos y Condiciones Inseguras
- **ID Técnico (`id`):** `consultar_analitica_actos_condiciones` · **Etiqueta Corta:** `Analítica Actos`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `wappy_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Métricas y Hallazgos de Seguridad en Campo

**Operación Técnica:** `consultar_analitica_actos_condiciones` · Módulo: *🔍 Conector WAPPY · Analítica de Reportes de Actos y Condiciones Inseguras*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_consultar_analitica_actos_condiciones`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Fecha del Reporte, Área / Sede y Tipo (Acto Inseguro vs. Condición Peligrosa)`, `Descripción del Peligro Detectado, Evidencia y Nivel de Severidad`, `Estado de Cierre (Abierto, En Gestión, Cerrado) y Responsable Asignado`, `Zonas con Reincidencia de Hallazgos para Inspección COPASST`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Hallazgos Abiertos de Severidad Alta + Zonas Reincidentes** — Prioriza el cierre inmediato de peligros reportados en planta (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Analítica Actos] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Analítica Actos a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Editor Vivo / Canvas Documental WAPPY (Word/PDF)
- **ID Técnico (`id`):** `canvas_doc` · **Etiqueta Corta:** `Editor Vivo WAPPY`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `wappy_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Estructura del Documento Formal Exportable a Word/PDF en LiveEditor

**Operación Técnica:** `wappy_guardar_documento_vivo (redactar y guardar informe o acta oficial en el Editor Vivo de Somos SST)` · Módulo: *📤 Salida · Crear Documento Formal en Editor en Vivo WAPPY (LiveEditor)*.
- **Marco Legal y Normativo SG-SST:** Resolución 2764 de 2022 (Batería de Riesgo Psicosocial), Ley 1010 de 2006 y Resolución 3461 de 2025.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_canvas_doc`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (9):** `Cabezote Oficial de Control Documental (Logo, Razón Social, NIT, Código, Versión y Fecha)`, `Título Oficial del Informe, Acta, Procedimiento o Programa SST`, `Marco Normativo y Alcance Aplicable a la Empresa`, `Tablas Comparativas con Bordes Sólidos Exportables a Word (.docx) y PDF`, `Listado Nominal de Trabajadores, Cédulas y Hallazgos Evaluados`, `Análisis Técnico, Conclusiones y Recomendaciones del Especialista`, `Plan de Acción con Responsables y Fechas de Cumplimiento`, `Bloque de Firmas Oficiales (Representante Legal y Responsable SG-SST con Licencia)`, `Guardado Automático en el Historial de Informes del Aplicativo`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cabezote Oficial + Tablas Exportables Word/PDF + Bloque de Firmas** — Genera un documento listo para imprimir o descargar en Word/PDF con 1 clic (4 campos)
  * **⚡ Informe Técnico Completo (Marco Legal + Cédulas + Plan de Acción)** — Estructura formal de auditoría o inspección para presentar a gerencia o ARL (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Editor Vivo WAPPY] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Editor Vivo WAPPY a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Academia WAPPY LMS (Cursos y Progreso)
- **ID Técnico (`id`):** `cursos_lms` · **Etiqueta Corta:** `Academia LMS`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `wappy_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Métricas de Formación, Evaluaciones y Certificados LMS

**Operación Técnica:** `cursos formativos y avance en Academia WAPPY LMS` · Módulo: *🎓 Conector WAPPY · Escuela Virtual SST (Cursos LMS y Avance por Trabajador)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_cursos_lms`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Catálogo de Cursos Activos de Inducción, Reinducción y Riesgos Críticos`, `Progreso Individual por Cédula y Nombre del Trabajador (%)`, `Puntaje de Evaluaciones de Conocimiento y Fecha de Aprobación`, `Trabajadores Pendientes por Completar Formación Obligatoria`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Trabajadores con Inducción/Cursos Pendientes + Puntajes de Evaluación** — Controla cobertura real del Programa Anual de Capacitación SST (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Academia LMS] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Academia LMS a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Google Drive (Carpetas/PDF/Excel/FURAT)
- **ID Técnico (`id`):** `google_drive` · **Etiqueta Corta:** `Google Drive`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `google_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Archivos y Metadatos a Consultar o Guardar en Google Drive

**Operación Técnica:** `google_drive (list_files_and_folders, read_document_content)` · Módulo: *🔧 Conector · Google Drive (Exploración de Carpetas, PDF y Hojas de Cálculo)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1401 de 2007 (Investigación de Incidentes y Accidentes de Trabajo) y NTC 3701.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_google_drive`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Exploración de Carpetas de Trabajadores y Soportes SG-SST en Google Drive`, `Cédula y Nombre del Trabajador Detectado en el Documento o Carpeta`, `Certificados PDF (EPS, ARL, AFP, Alturas, Conceptos EMO e Incapacidades)`, `Nombre del Archivo, Enlace en Google Drive y Fecha de Última Modificación`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Carpetas por Cédula + Certificados PDF + Fecha de Modificación** — Audita soportes documentales directamente en Google Drive (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Google Drive] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Google Drive a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Google Sheets (Hojas de Cálculo)
- **ID Técnico (`id`):** `google_sheets` · **Etiqueta Corta:** `Google Sheets`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `google_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Columnas y Hojas de Cálculo a Leer o Actualizar en Google Sheets

**Operación Técnica:** `google_sheets (read_spreadsheet, update_spreadsheet_values)` · Módulo: *🔧📤 Conector · Registrar / Leer Filas en Google Sheets (Hojas de Cálculo)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_google_sheets`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `ID o Nombre del Libro de Google Sheets y Pestaña Objetivo`, `Columnas de Identificación: Cédula / Documento, Nombre Completo y Cargo`, `Columnas de Seguridad Social: EPS, ARL, AFP y Estado PILA`, `Columnas de Vencimientos: Fecha EMO, Curso Alturas, SOAT, RTM o Extintores`, `Columnas de Valoración de Riesgos: Peligro, ND, NE, NP, NC, NR y Controles`, `Columnas de Seguimiento ACPM: Hallazgo, Responsable, Fecha Límite y Estado`, `Actualizar Filas Existentes por Cédula / Código sin Duplicar`, `Fecha y Hora de Sincronización Automática desde WAPPY`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Registrar Cédula + Nombre + Cargo + Vencimientos (EMO/Alturas/EPS/ARL)** — Mantiene sincronizada tu matriz de control de personal en Google Sheets (5 campos)
  * **⚡ Sincronizar Matriz de Riesgos (GTC-45/PESV) y Seguimiento ACPM en Sheets** — Exporta peligros valorados y acciones abiertas hacia hojas de cálculo (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Google Sheets] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Google Sheets a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Google Docs (Documentos e Informes)
- **ID Técnico (`id`):** `google_docs` · **Etiqueta Corta:** `Google Docs`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `google_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Elementos del Documento en Google Docs a Leer o Generar

**Operación Técnica:** `google_docs` · Módulo: *🔧📤 Conector · Crear / Leer Informe Formal en Google Docs*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_google_docs`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Título del Documento en Google Docs con Fecha y Razón Social`, `Encabezado Normativo (NIT, CIIU, Nivel de Riesgo ARL y Responsable SST)`, `Resumen Ejecutivo de Hallazgos y Cumplimiento Legal`, `Tablas Estructuradas de Trabajadores (Cédula, Nombre, Cargo y Estado)`, `Desarrollo de Capítulos, Actas o Procedimientos Técnicos SST`, `Conclusiones, Plan de Acción ACPM y Bloque de Firmas`, `Carpeta de Destino en Google Drive y Enlace Compartible`, `Preservar Historial de Versiones en Google Workspace`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Crear Informe en Google Docs + Tablas por Cédula + Enlace Drive** — Exporta el dictamen formal directamente a la cuenta de Google Docs vinculada (4 campos)
  * **⚡ Acta / Procedimiento SST + Plan de Acción + Bloque de Firmas** — Ideal para actas de COPASST, CCL, PESV o informes de auditoría (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Google Docs] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Google Docs a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Google Slides (Presentaciones Ejecutivas)
- **ID Técnico (`id`):** `google_slides` · **Etiqueta Corta:** `Google Slides`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `google_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Diapositivas y Gráficos Ejecutivos a Estructurar en Google Slides

**Operación Técnica:** `google_slides` · Módulo: *📤 Salida · Generar Presentación Ejecutiva en Google Slides*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_google_slides`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Diapositiva 1: Portada Corporativa (Razón Social, NIT, Período y Responsable SST)`, `Diapositiva 2: Cuadro de Mando de Cumplimiento Res. 0312 (%) y Ciclo PHVA`, `Diapositiva 3: Indicadores Mínimos ATEL y Ausentismo (Art. 30 Res. 0312)`, `Diapositiva 4: Top Peligros Críticos (GTC-45, PESV y Químicos SGA)`, `Diapositiva 5: Estado de Exámenes Médicos (EMO), Alturas y Capacitaciones`, `Diapositiva 6: Alertas del Oráculo Predictivo IA y Gemelo Digital SST`, `Diapositiva 7: Avance del Tablero Kanban ACPM y Compromisos de Comités`, `Diapositiva 8: Decisiones y Presupuesto para Revisión por la Alta Dirección`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Presentación para Alta Dirección (0312 + Indicadores ATEL + Presupuesto)** — Genera la presentación gerencial de rendición de cuentas del SG-SST (4 campos)
  * **⚡ Presentación Técnica (Peligros Críticos + EMO/Alturas + Oráculo IA + ACPM)** — Ideal para reuniones mensuales del COPASST, Comité Vial o capacitaciones (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Google Slides] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Google Slides a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Google Gmail (Bandeja de Correo)
- **ID Técnico (`id`):** `google_gmail` · **Etiqueta Corta:** `Gmail`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `google_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Elementos del Correo Electrónico a Consultar con el Agente

**Operación Técnica:** `google_gmail` · Módulo: *🔧 Conector · Google Gmail (Lectura de Bandeja, Filtros y Adjuntos SST)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_google_gmail`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Asunto, Remitente y Fecha/Hora Exacta del Correo`, `Cédula y Nombre del Colaborador o Contratista Mencionado`, `Archivos Adjuntos (FURAT, Incapacidades, Conceptos EMO, Certificados ARL)`, `Filtrado Quirúrgico de Correos No Leídos o por Etiqueta SST`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Correos No Leídos + Cédula/Nombre + Adjuntos PDF SST** — Extrae novedades médicas y reportes ARL entrantes desde Gmail (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Gmail] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Gmail a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Google Calendar (Agenda y Citaciones)
- **ID Técnico (`id`):** `google_calendar` · **Etiqueta Corta:** `Google Calendar`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `google_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Eventos, Recordatorios y Citaciones SST en Google Calendar

**Operación Técnica:** `google_calendar` · Módulo: *🔧📤 Conector · Google Calendar (Agenda, Vencimientos y Auditorías SST)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_google_calendar`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Título del Evento SST (Vencimiento EMO, Reunión COPASST/CCL, Simulacro, Auditoría, Recarga Extintor)`, `Fecha y Hora de Inicio y Finalización del Evento`, `Descripción Técnica con Listado de Cédulas, Nombres o Placas en Alerta`, `Invitados y Correos de Responsables Convocados`, `Recordatorios Automáticos Previos (7 días, 1 día y 1 hora antes)`, `Ubicación / Sede o Enlace de Reunión Virtual (Google Meet)`, `Frecuencia de Recurrencia (Mensual COPASST / Trimestral CCL y PESV / Anual)`, `Verificación de Conflictos en Agenda y Confirmación del Evento Creado`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Agendar Alerta de Vencimientos (EMO / Alturas / SOAT / Extintores)** — Crea eventos de recordatorio en Google Calendar para que ningún soporte venza (4 campos)
  * **⚡ Programar Reunión de Comité (COPASST / CCL / PESV) o Auditoría con Invitados** — Agenda sesiones obligatorias de comités e invita a los integrantes (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Google Calendar] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Google Calendar a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Google NotebookLM (Cuadernos RAG y Studio)
- **ID Técnico (`id`):** `notebooklm` · **Etiqueta Corta:** `NotebookLM`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `google_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Consulta cuadernos reales de Google NotebookLM con citas exactas, indexa fuentes del flujo y genera infografías, diapositivas, reportes, audio, video, mapas mentales o tablas adjuntables al informe.

**Operación Técnica:** `wappy_notebooklm (consultar cuadernos RAG con citas, indexar fuentes y generar artefactos Studio)` · Módulo: *🔧 Herramienta · Google NotebookLM (Cuadernos RAG Documentales)*.
- **Marco Legal y Normativo SG-SST:** Resolución 2764 de 2022 (Batería de Riesgo Psicosocial), Ley 1010 de 2006 y Resolución 3461 de 2025.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_notebooklm`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Acción (`notebookAction`):** `"consultar"` (respuestas con citas verificadas), `"agregar_fuente"` (indexar hallazgos en cuaderno) o `"generar_estudio"`.
- **2. Tipo de Artefacto (`notebookArtifactType`):** Cuando `notebookAction === "generar_estudio"`, elige `"infographic"`, `"slide_deck"`, `"report"`, `"audio"`, `"video"`, `"mind_map"` o `"data_table"`.
- **3. Instrucción (`notebookPrompt`):** Mínimo 10 caracteres describiendo el enfoque técnico SST.
- **Casillas / Campos Reales Disponibles (8):** `Listado de Cuadernos Activos en Google NotebookLM`, `Fuentes Documentales Cargadas en el Cuaderno (PDFs, Normas, Manuales, URLs)`, `Consulta Semántica con Citas Exactas del Documento Origen`, `Extracción de Tablas Comparativas desde las Fuentes del Cuaderno`, `Guía de Estudio / Resumen Ejecutivo del Cuaderno`, `Preguntas Frecuentes (FAQ) y Glosario Técnico Generado`, `Guion de Audio / Podcast Educativo SST Basado en el Cuaderno`, `Verificación de Brechas entre el Cuaderno y Somos SST`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Consulta RAG con Citas Exactas + Tablas Comparativas** — Interroga los cuadernos de NotebookLM citando cada fuente oficial (4 campos)
  * **⚡ Guía de Estudio + FAQ + Cruce de Brechas con Somos SST** — Convierte cuadernos documentales en material de capacitación o auditoría (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ NotebookLM] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta NotebookLM a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Google Flow Studio (Imágenes y Video Veo)
- **ID Técnico (`id`):** `google_flow` · **Etiqueta Corta:** `Google Flow`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `google_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Genera afiches, infografías y videos Veo SST (9:16, 16:9, 1:1) con estilo visual y movimiento de cámara configurables, adjuntando el recurso al correo e informe.

**Operación Técnica:** `google_flow (generación visual SST de imágenes y video Veo con relación de aspecto, estilo y movimiento de cámara)` · Módulo: *🔧 Herramienta · Google Flow Studio (Generación Visual Veo / Imagen SST)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_google_flow`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Acción Visual (`flowAction`):** `"generar_imagen"` o `"generar_video"` (Veo).
- **2. Formato y Estilo:** Configura `flowAspectRatio` (`"9:16"`, `"16:9"` o `"1:1"`), `flowStyle` (`"corporativo_sst"`, `"infografia_editorial"`, `"fotorealista"`, `"isometrico_3d"`, `"minimalista"`) y, para video, `flowCameraMotion` (`"estatico"`, `"paneo_suave"`, `"zoom_acercamiento"`, `"orbital"`).
- **3. Prompt Visual (`flowPrompt`):** Describe la escena preventiva SST y activa `attachMedia: true` para adjuntarla al informe.
- **Casillas / Campos Reales Disponibles (8):** `Afiche / Póster Preventivo de Seguridad y Salud en el Trabajo`, `Infografía Visual de Uso Correcto de EPP por Cargo`, `Señalización e Ilustración de Peligros Críticos y Rutas de Evacuación`, `Pieza Gráfica para Campaña de Convivencia Laboral o Seguridad Vial PESV`, `Escena de Video Educativo / Reel SST (Google Veo 9:16 o 16:9)`, `Tarjeta Visual de Lección Aprendida ATEL (Antes vs. Práctica Segura)`, `Portada Ilustrada para Curso de Academia WAPPY LMS`, `Prompt Visual Técnico Optimizado y Enlace de Descarga HD`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Afiche Preventivo SST + Infografía de EPP + Lección Aprendida Visual** — Genera piezas gráficas listas para publicar en carteleras o enviar por correo (4 campos)
  * **⚡ Video Educativo SST (Google Veo) + Campaña Vial/Convivencia** — Produce material audiovisual para capacitaciones y sensibilización (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Google Flow] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Google Flow a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Búsqueda Web Legal en Vivo (MinTrabajo/SUIN)
- **ID Técnico (`id`):** `web_search` · **Etiqueta Corta:** `Búsqueda Web Legal`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `api_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Criterios de Investigación en Portales Oficiales (.gov.co / Jurisprudencia)

**Operación Técnica:** `web_search (consulta en tiempo real de leyes, resoluciones y sentencias en Colombia)` · Módulo: *🌐 Herramienta · Búsqueda Web Oficial y Jurídica en Tiempo Real*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_web_search`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Consulta Prioritaria en Portales Oficiales (MinTrabajo, MinSalud, INS, SUIN-Juriscol)`, `Verificación de Vigencia de Leyes, Decretos, Resoluciones y Circulares SST`, `Citas Verificadas con URL Exacta y Fecha de Publicación Oficial`, `Tabla Comparativa de Nuevas Obligaciones Aplicables a la Empresa`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Portales .gov.co + Vigencia Normativa + Citas con URL Exacta** — Búsqueda jurídica sin alucinaciones ni fuentes no verificadas (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Búsqueda Web Legal] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Búsqueda Web Legal a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### OpenWeather API (Clima y Alertas SST)
- **ID Técnico (`id`):** `pronostico_clima_sst` · **Etiqueta Corta:** `OpenWeather Clima`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `api_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Variables Meteorológicas y Alertas Operativas SST a Consultar

**Operación Técnica:** `pronóstico climático SST (lluvia, tormentas, viento, UV, estrés térmico)` · Módulo: *🔧 Herramienta · OpenWeather API (Clima, UV y Alertas SST en Terreno)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_pronostico_clima_sst`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Ciudad, Coordenadas y Sede / Frente de Obra Consultado`, `Temperatura Actual (°C), Sensación Térmica e Índice de Calor (Estrés Térmico)`, `Probabilidad de Lluvia, Precipitación (mm) y Tormenta Eléctrica`, `Velocidad del Viento (km/h) y Ráfagas Máximas (Crítico para Trabajo en Alturas e Izajes)`, `Índice de Radiación Ultravioleta (UV) y Recomendación de Protección Solar`, `Humedad Relativa (%) y Visibilidad en Ruta (Crítico para Seguridad Vial PESV)`, `Pronóstico Extendido por Horas para la Jornada Laboral`, `Concepto Operativo Automático (Autorizar o Suspender Trabajo en Alturas / Intemperie)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Viento (km/h) + Tormenta Eléctrica + Lluvia (Suspensión Trabajo en Alturas)** — Verifica condiciones atmosféricas antes de autorizar permisos de alturas o izajes (4 campos)
  * **⚡ Estrés Térmico + Radiación UV + Visibilidad Vial PESV** — Recomendaciones de hidratación, protección solar y conducción segura bajo lluvia (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ OpenWeather Clima] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta OpenWeather Clima a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### PubChem NIH (Fichas Químicas y GHS)
- **ID Técnico (`id`):** `consultar_pubchem_quimico` · **Etiqueta Corta:** `PubChem NIH`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `api_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Datos Toxicológicos y SGA a Consultar en la Base Oficial PubChem (NIH)

**Operación Técnica:** `base de datos química PubChem NIH` · Módulo: *🔧 Herramienta · PubChem NIH (Fichas Químicas, CAS y Clasificación GHS/SGA)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1496 de 2018 (Sistema Globalmente Armonizado — SGA), Ley 55 de 1993 y NTC 1692.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_consultar_pubchem_quimico`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (10):** `Nombre Químico Oficial IUPAC, Sinónimos y Fórmula Molecular`, `Número CAS Verificado y CID de PubChem NIH`, `Clasificación Oficial del Sistema Globalmente Armonizado (Pictogramas GHS01 a GHS09)`, `Palabra de Advertencia Oficial (Peligro / Atención)`, `Indicaciones de Peligro Estandarizadas (Códigos y Frases H)`, `Consejos de Prudencia Estandarizados (Códigos y Frases P)`, `Propiedades Fisicoquímicas (Punto de Inflamación, pH, Presión de Vapor, Solubilidad)`, `Incompatibilidades Químicas Reactivas y Productos de Descomposición Peligrosos`, `Límites de Exposición Ocupacional (TLV / PEL / NIOSH REL) y Toxicidad Aguda`, `Medidas de Primeros Auxilios, Control de Derrames y Agente Extintor`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Número CAS + Pictogramas GHS/SGA + Frases H y P Oficiales** — Completa automáticamente el rótulo SGA Decreto 1496 y el inventario químico (6 campos)
  * **⚡ Incompatibilidades Reactivas + Límites TLV/NIOSH + Primeros Auxilios** — Cruza compatibilidad de almacenamiento y emergencia química (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ PubChem NIH] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta PubChem NIH a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### MedlinePlus NIH (Guías CIE-10 / Rehab)
- **ID Técnico (`id`):** `consultar_medlineplus_rehabilitacion` · **Etiqueta Corta:** `MedlinePlus NIH`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `api_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Información Médica Basada en Evidencia (NIH) por Diagnóstico CIE-10

**Operación Técnica:** `guías médicas MedlinePlus NIH por código CIE-10` · Módulo: *🔧 Herramienta · MedlinePlus NIH (Guías Clínicas CIE-10 y Rehabilitación Laboral)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1843 de 2025 / Resolución 2346 de 2007 (Evaluaciones Médicas Ocupacionales), Decreto 1427 de 2022 y Ley 23 de 1981 (Reserva de Historia Clínica).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_consultar_medlineplus_rehabilitacion`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Código Diagnóstico CIE-10 y Nombre Clínico de la Patología`, `Definición Médica Oficial y Sistema Anatómico Comprometido (MedlinePlus NIH)`, `Factores de Riesgo Ocupacionales y Biomecánicos que Agravan la Patología`, `Sintomatología de Alerta Temprana y Signos de Bandera Roja`, `Pautas de Rehabilitación Funcional, Higiene Postural y Autocuidado`, `Recomendaciones de Restricción o Adaptación Temporal de Tareas`, `Criterios de Inclusión en Programa de Vigilancia Epidemiológica (PVE)`, `Referencias Clínicas Oficiales (National Library of Medicine — NIH)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Código CIE-10 + Factores que Agravan + Adaptación de Puesto y PVE** — Traduce diagnósticos médicos de incapacidades o EMO en controles preventivos SST (4 campos)
  * **⚡ Guía de Rehabilitación Funcional + Signos de Alerta + Fuente NIH** — Soporte clínico para Estudios de Puesto de Trabajo (EPT) y reintegro laboral (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ MedlinePlus NIH] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta MedlinePlus NIH a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### OpenStreetMap API (Hospitales / Bomberos)
- **ID Técnico (`id`):** `buscar_centros_emergencia` · **Etiqueta Corta:** `Centros Emergencia`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `api_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Datos Geoespaciales de Socorro y Red Asistencial para el MEDEVAC

**Operación Técnica:** `geolocalización de clínicas, hospitales y bomberos cercanos` · Módulo: *🔧 Herramienta · OpenStreetMap (Hospitales, Clínicas ARL y Bomberos Cercanos)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_buscar_centros_emergencia`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Dirección y Coordenadas GPS de la Sede o Frente de Obra`, `Hospitales, Clínicas de Trauma y Centros de Urgencias en Radio de 5 a 10 km`, `Nivel de Complejidad Hospitalaria y Atención de Urgencias ARL`, `Estaciones de Cuerpo Oficial de Bomberos y Defensa Civil Cercanas`, `Comandos de Policía Nacional y Centros de Atención Inmediata (CAI)`, `Distancia en Kilómetros y Tiempo Estimado de Traslado en Ambulancia`, `Dirección Exacta, Teléfonos de Urgencias y Coordenadas del Centro Médico`, `Ruta Principal y Ruta Alterna para el Plan de Evacuación Médica (MEDEVAC)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Clínicas/Hospitales Cercanos + Distancia/Tiempo + Ruta MEDEVAC** — Actualiza el directorio médico de urgencias y MEDEVAC del Plan de Emergencias (5 campos)
  * **⚡ Estaciones de Bomberos + Defensa Civil + Policía Cercana a la Sede** — Directorio completo de entidades de socorro externo por sede (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Centros Emergencia] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Centros Emergencia a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Webhook API / Integración Buk RRHH
- **ID Técnico (`id`):** `webhook_api` · **Etiqueta Corta:** `API / Buk`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `api_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Datos de Nómina, Altas/Bajas y Novedades a Consultar vía API / Buk RRHH

**Operación Técnica:** `webhook externo / sincronización API RRHH` · Módulo: *🔧 Herramienta · Webhook API / Integración Buk RRHH & ERP*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_webhook_api`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Listado de Trabajadores Activos y Nuevos Ingresos en Buk RRHH / ERP`, `Retiros y Liquidaciones de Personal en el Período`, `Cédula / Documento, Nombre Completo, Cargo y Centro de Costos`, `Afiliaciones Vigentes a EPS, ARL, Fondo de Pensiones (AFP) y Caja`, `Novedades de Ausentismo, Licencias e Incapacidades Reportadas en Nómina`, `Cambios de Cargo, Salario o Traslados de Sede`, `Sincronización Bidireccional con el Perfil Sociodemográfico de Somos SST`, `Estado de Respuesta del Endpoint REST y Fecha de Corte`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Altas y Retiros en Buk RRHH + Cédula/Nombre/Cargo + EPS/ARL/AFP** — Cruza la nómina de Recursos Humanos contra los expedientes de Somos SST (4 campos)
  * **⚡ Novedades de Ausentismo/Incapacidades y Cambios de Cargo en Nómina** — Detecta incapacidades registradas en RRHH que falten en el Hito 7 (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ API / Buk] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta API / Buk a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Google Antigravity Local (Navegador Nativo + Puente MCP Mac/PC)
- **ID Técnico (`id`):** `google_antigravity` · **Etiqueta Corta:** `Antigravity Local`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `mcp_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Conecta tu Mac/PC vía Push SSE con el Navegador Nativo Integrado de Antigravity en cascada de protección: 1° Antigravity Local · Navegador Nativo ➔ 2° Antigravity Cloud ➔ 3° Respaldo HTTP Seguro sin Chromium en VPS.

**Operación Técnica:** `google_antigravity (1° Antigravity Local · Navegador Nativo ➔ 2° Antigravity Cloud ➔ 3° Respaldo HTTP Seguro sin Chromium en VPS)` · Módulo: *🛰️ Conector MCP · Google Antigravity Local (Navegador Nativo + Puente Reactivo Mac/PC)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_google_antigravity`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (5):** `Ejecución de Herramientas MCP y Scripts Locales vía Puente Push SSE`, `Inspección de Portales Oficiales con Navegador Nativo Integrado de Antigravity (sin abrir Chrome externo)`, `Cascada de Protección: 1° Antigravity Local ➔ 2° Antigravity Cloud ➔ 3° Respaldo HTTP Seguro sin Chromium en VPS`, `Lectura de Carpetas Locales autorizadas y Generación de Soportes PDF/PNG`, `Retorno de Evidencias Descargadas a la Bandeja Aparte de WAPPY`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Navegador Nativo Antigravity + Cascada Local/Cloud + Soportes PDF/PNG** — 1° Antigravity Local · Navegador Nativo ➔ 2° Antigravity Cloud ➔ 3° Respaldo HTTP Seguro sin Chromium en VPS (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Antigravity Local] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Antigravity Local a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Google Antigravity Cloud 24/7 (MCP Cloud)
- **ID Técnico (`id`):** `google_antigravity_cloud` · **Etiqueta Corta:** `Antigravity Cloud`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `mcp_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Capacidades Delegadas a Google Antigravity Cloud 24/7

**Operación Técnica:** `google_antigravity (entorno Cloud 24/7 en antigravity.google.com sin PC prendido)` · Módulo: *☁️ Conector MCP · Google Antigravity Cloud 24/7 (antigravity.google.com)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_google_antigravity_cloud`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (3):** `Ejecución Autónoma 24/7 en la Nube sin requerir tu computador encendido`, `Orquestación de Agentes y Scripts de Verificación en Entorno Cloud`, `Sincronización Directa con Herramientas MCP de WAPPY y Somos SST`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Ejecución Autónoma Cloud 24/7 + Sincronización MCP WAPPY** — Continuidad operativa 24/7 para flujos nocturnos o programados (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Antigravity Cloud] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Antigravity Cloud a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Web Scraping en Vivo (Auto DOM / Navegador Nativo Antigravity)
- **ID Técnico (`id`):** `tool_web_scraping_agy` · **Etiqueta Corta:** `Web Scraping Live`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `mcp_tools`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Permite al Agente IA consultar hasta 5 URLs públicas de forma autónoma en servidor (HTML + DOM JS / Fetch Cheerio) o mediante el Navegador Nativo Integrado de Antigravity (1° Local ➔ 2° Cloud ➔ 3° Respaldo HTTP Seguro sin Chromium en VPS), con selectores CSS y detección de cambios SHA-256.

**Operación Técnica:** `web_scraper_live / google_antigravity (extracción web autónoma multi-URL HTML+DOM JS, selectores CSS, detección SHA-256 o Navegador Nativo Antigravity)` · Módulo: *🕷️ Herramienta · Web Scraping Estructurado con Google Antigravity*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_tool_web_scraping_agy`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Tablas de Datos HTML convertidas a Markdown / JSON estructurado`, `Consulta por Cédula, NIT o Placa en Portales Públicos`, `Descarga de Certificados PDF y Capturas de Verificación PNG en Bandeja Aparte`, `Limpieza de Ruido Visual y Validación de Columnas Extraídas`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Extraer Tablas + Consultar Cédula/Placa + Descargar PDF/PNG** — Extracción estructurada limpia con soportes verificables (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Web Scraping Live] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Web Scraping Live a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Microsoft OneDrive / SharePoint (En Construcción)
- **ID Técnico (`id`):** `one_drive` · **Etiqueta Corta:** `OneDrive`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `mcp_tools`
- **Estado:** **🚧 En Construcción (Protegido)** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Elementos Documentales de OneDrive / SharePoint

**Operación Técnica:** `one_drive` · Módulo: *🔧 Conector · Microsoft OneDrive / SharePoint Corporativo (En Construcción)*.
- **Marco Legal y Normativo SG-SST:** Resolución 2764 de 2022 (Batería de Riesgo Psicosocial), Ley 1010 de 2006 y Resolución 3461 de 2025.

🚧 **Nodo en Construcción:** La herramienta MCP de Microsoft OneDrive / SharePoint requiere autorización de aplicación multi-tenant en Azure Entra ID. **Alternativa activa hoy:** usa `google_drive`, `google_docs` o `google_sheets`.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_one_drive`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Estado de Guardia Preventiva:** Este nodo está marcado con `defaultConstruction: true`. Tanto el validador estático (`validate-workflow-logic.js`) como el planificador (`automationScheduler.js`) lo omiten en `< 10ms` con estado `skipped` para impedir bloqueos o fallos en producción.
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (2):** `Carpetas Corporativas y Soportes PDF/Excel en Microsoft OneDrive`, `Metadatos de Archivo y Control de Versiones Documentales`.

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ OneDrive] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta OneDrive a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Skill: Herramientas Operativas SG-SST (GTC-45, PESV y SGA)
- **ID Técnico (`id`):** `skill_sgsst_tools` · **Etiqueta Corta:** `Skill: Motores SST`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `skill`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Aplica la metodología oficial de la GTC-45 (ND x NE = NP; NP x NC = NR), el Plan Estratégico de Seguridad Vial Res. 20223040040595 y el Sistema Globalmente Armonizado SGA Dec. 1496 de 2018.

**Operación Técnica:** `SKILL.md · GTC-45 & PESV` · Módulo: *🧩 Skill · Herramientas Operativas SG-SST (GTC-45, PESV y SGA)*.
- **Marco Legal y Normativo SG-SST:** Resolución 20223040040595 de 2022 (Plan Estratégico de Seguridad Vial — PESV) e ISO 39001.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_skill_sgsst_tools`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Cálculo Matemático GTC-45: ND x NE = NP; NP x NC = NR (Niveles I a IV)`, `Jerarquía de Controles SST: Eliminación, Sustitución, Ingeniería, Administrativos y EPP`, `Metodología PESV Res. 20223040040595: Probabilidad x Severidad por Actor Vial`, `Matriz de Compatibilidad Química SGA Dec. 1496 (Clases ONU 1 a 9 y Ácido vs. Base)`, `Validación de Vigencia de FDS (< 5 Años) y Etiquetado de Trasvase`, `Cruce de Peligros del Cargo con Profesiograma y Exámenes EMO`, `Activación Automática de Acciones en Tablero Kanban ACPM`, `Plantilla de Tablas Técnicas Exportables a Word/PDF`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cálculo GTC-45 (ND, NE, NP, NC, NR) + Jerarquía de Controles** — Aplica rigor matemático en la valoración de peligros IPEVR (3 campos)
  * **⚡ Motor Vial PESV (Res. 40595) + Compatibilidad Química SGA (Dec. 1496)** — Activa reglas especializadas para seguridad vial y riesgo químico (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Skill: Motores SST] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Skill: Motores SST a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Skill: Conectores Google Workspace, NotebookLM & Antigravity
- **ID Técnico (`id`):** `skill_google_connectors` · **Etiqueta Corta:** `Skill: Google & AGY`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `skill`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Orquesta lecturas y escrituras entre Google Drive, Google Sheets, Google Docs, Gmail, cuadernos RAG de NotebookLM y el puente reactivo Push SSE de Google Antigravity.

**Operación Técnica:** `SKILL.md · Drive & MCP` · Módulo: *🧩 Skill · Conectores Google Workspace, NotebookLM & Antigravity*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_skill_google_connectors`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Exploración Recursiva de Carpetas de Trabajadores en Google Drive`, `Lectura de Certificados PDF/Excel por Número de Cédula`, `Sincronización Bidireccional con Hojas de Google Sheets`, `Consulta RAG con Citas Verificadas en Cuadernos de Google NotebookLM`, `Delegación al Puente Reactivo Push SSE de Google Antigravity (Mac/PC o Cloud)`, `Generación de Informes en Google Docs y Eventos en Google Calendar`, `Control Anti-Duplicados al Importar desde Drive o Gmail`, `Manejo Transparente de Permisos y Cuentas Vinculadas`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Auditar Carpetas de Drive por Cédula + Actualizar Google Sheets** — Orquesta lectura de soportes en Drive y registro en hojas de cálculo (4 campos)
  * **⚡ Consultar NotebookLM + Puente Antigravity + Exportar a Google Docs** — Combina investigación RAG con ejecución MCP y documento formal (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Skill: Google & AGY] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Skill: Google & AGY a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Skill: Web Scraping & Extracción Estructurada (Antigravity)
- **ID Técnico (`id`):** `skill_web_scraper_script` · **Etiqueta Corta:** `Skill: Web Scraping`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `skill`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Construye y ejecuta scripts de Web Scraping en la instancia de Google Antigravity (Python BeautifulSoup/Playwright o Node.js Cheerio), limpia el HTML y convierte los datos extraídos en tablas Markdown o JSON.

**Operación Técnica:** `SKILL.md · Script & Tablas` · Módulo: *🧩 Skill · Web Scraping & Extracción Estructurada (Antigravity)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_skill_web_scraper_script`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Ejecución en Instancia de Google Antigravity (Python BS4/Playwright o Node Cheerio)`, `Extracción Limpia de Tablas HTML hacia Formato Markdown y JSON`, `Captura de Enlaces a Resoluciones, Decretos y Documentos PDF Oficiales`, `Limpieza de DOM (Eliminar Menús, Scripts, Banners y Ruido Visual)`, `Manejo de Paginación y Renderizado Dinámico (Navegador Nativo Antigravity)`, `Validación de Estructura de Columnas Antes de Entregar al Agente`, `Respeto de Tiempos de Respuesta y Reporte Transparente de Errores HTTP`, `Cruce de Datos Extraídos con la Matriz Legal o Expedientes SST`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Extraer Tablas HTML a Markdown/JSON + Enlaces PDF Oficiales** — Convierte cualquier página web normativa o técnica en tablas estructuradas (4 campos)
  * **⚡ Renderizado Dinámico Navegador Nativo Antigravity + Cruce con Somos SST** — Ideal para portales interactivos mediante el Navegador Nativo Integrado de Antigravity (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Skill: Web Scraping] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Skill: Web Scraping a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Skill: Auditoría Jurídica SST Colombia (Dec. 1072 / Res. 0312)
- **ID Técnico (`id`):** `skill_auditoria_normativa` · **Etiqueta Corta:** `Skill: Auditoría Legal`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `skill`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Verifica cada hallazgo contra los artículos exactos del Decreto 1072 de 2015, Resolución 0312 de 2019, Resolución 2764 de 2022 y Resolución 4272 de 2021.

**Operación Técnica:** `SKILL.md · Ley Colombiana` · Módulo: *🧩 Skill · Auditoría Jurídica SST Colombia (Dec. 1072 / Res. 0312)*.
- **Marco Legal y Normativo SG-SST:** Resolución 0312 de 2019 (Estándares Mínimos del SG-SST) y Decreto 1072 de 2015 Art. 2.2.4.6.29.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_skill_auditoria_normativa`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Verificación de los Estándares Mínimos Res. 0312 según Tamaño y Riesgo ARL`, `Auditoría de los 22 Numerales de Alcance Legal (Art. 2.2.4.6.30 Dec. 1072)`, `Revisión de los 24 Aspectos de Revisión por la Alta Dirección (Art. 2.2.4.6.31)`, `Auditoría de Investigación de Accidentes dentro de los 15 Días (Res. 1401 de 2007)`, `Verificación de Licencia SST Vigente, Curso 50h/20h y Actas COPASST/CCL`, `Evaluación de Riesgo de Multas MinTrabajo (Ley 1562 de 2012 y Dec. 1072)`, `Análisis de Culpa Patronal (Art. 216 CST) y Carga Probatoria Documental`, `Redacción de No Conformidades con Evidencia Objetiva y Numeral Exacto`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Auditar Estándares Res. 0312 + No Conformidades + Riesgo de Multa** — Revisión legal rigurosa con cita de artículos e impacto sancionatorio (4 campos)
  * **⚡ Alcance Legal Dec. 1072 (Art. 30 y 31) + Res. 1401 ATEL + Culpa Patronal** — Blindaje probatorio para auditorías anuales e investigaciones de accidentes (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Skill: Auditoría Legal] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Skill: Auditoría Legal a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### ✏️ Sub-Agente Editable (Personalizable a tu Medida)
- **ID Técnico (`id`):** `subagent_editable_custom` · **Etiqueta Corta:** `✏️ Sub-Agente Editable`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Sub-Agente Especialista Personalizado dentro del flujo: procesa la información recibida del paso anterior según las instrucciones que configures en este nodo y entrega el resultado estructurado al siguiente paso.

**Operación Técnica:** `Editable · Personaliza Rol y Prompt` · Módulo: *🤖 Sub-Agente · Especialista Personalizable WAPPY IA*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_editable_custom`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Análisis Especializado según el Rol e Instrucción Definidos en el Nodo`, `Cruce de Datos Reales por Cédula, Cargo o Proceso de la Empresa Activa`, `Tabla Estructurada de Hallazgos, Brechas y Prioridad de Intervención`, `Recomendaciones Accionables Alineadas con Decreto 1072 y Resolución 0312`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Análisis por Cédula/Proceso + Tabla de Hallazgos + Plan de Acción** — Estructura limpia lista para encadenar con el Agente Principal (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ ✏️ Sub-Agente Editable] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta ✏️ Sub-Agente Editable a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Consultor SG-SST
- **ID Técnico (`id`):** `subagent_chat_consultor_sgsst` · **Etiqueta Corta:** `Consultor SG-SST`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como el Consultor SG-SST de WAPPY IA: evalúa identificación de peligros, control de riesgos, cumplimiento del Decreto 1072 de 2015 y Resolución 0312 de 2019, y entrega planes de acción preventivos.

**Operación Técnica:** `Agente Chat · Asesoría Integral SST` · Módulo: *🤖 Sub-Agente · Consultor Maestro SG-SST (Dec. 1072 / Res. 0312)*.
- **Marco Legal y Normativo SG-SST:** Guía Técnica Colombiana GTC-45 (2.ª Actualización) y Decreto 1072 de 2015 Art. 2.2.4.6.15.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_consultor_sgsst`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Evaluación Integral del Ciclo PHVA (Planear, Hacer, Verificar, Actuar)`, `Verificación de Estándares Mínimos Res. 0312 de 2019 según Tamaño y Riesgo ARL`, `Articulación entre Matriz GTC-45, Plan de Trabajo Anual e Indicadores Art. 30`, `Plan de Mejoramiento Priorizado con Responsables y Evidencias Documentales`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Ciclo PHVA + Brechas Res. 0312 + Plan de Mejoramiento** — Diagnóstico integral de consultoría senior SG-SST (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Consultor SG-SST] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Consultor SG-SST a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Tenshi (Copiloto Inteligente 3D)
- **ID Técnico (`id`):** `subagent_chat_tenshi` · **Etiqueta Corta:** `Tenshi Copiloto IA`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Tenshi, copiloto inteligente de WAPPY IA: coordina los hallazgos de los conectores, sintetiza respuestas directas y ejecuta acciones sobre los aplicativos SG-SST.

**Operación Técnica:** `Agente Chat · Orquestador WAPPY` · Módulo: *🤖 Sub-Agente · Tenshi IA Orquestadora Central WAPPY*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_tenshi`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Consolidación Ejecutiva 360° de todos los Nodos y Sub-Agentes del Flujo`, `Priorización de Alertas Críticas por Trabajador, Vehículo o Sede`, `Redacción Clara, Directa y Accionable sin Ruido Técnico ni Enlaces Crudos`, `Resumen de Acciones Inmediatas para Gerencia y Responsable SG-SST`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Briefing Ejecutivo 360° + Alertas Críticas + Acciones Inmediatas** — Síntesis ejecutiva impecable firmada por Tenshi IA (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Tenshi Copiloto IA] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Tenshi Copiloto IA a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Abogado Laboral SST
- **ID Técnico (`id`):** `subagent_chat_abogado_laboral` · **Etiqueta Corta:** `Abogado Laboral`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Abogado Laboralista experto en derecho laboral colombiano, Código Sustantivo del Trabajo, Decreto 1072 de 2015, descargos, estabilidad laboral reforzada y responsabilidad patronal en ATEL.

**Operación Técnica:** `Agente Chat · Jurídico & CST` · Módulo: *🤖 Sub-Agente · Abogado Laboralista y de Seguridad Social Colombia*.
- **Marco Legal y Normativo SG-SST:** Resolución 1401 de 2007 (Investigación de Incidentes y Accidentes de Trabajo) y NTC 3701.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_abogado_laboral`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Fundamentación en Código Sustantivo del Trabajo (CST), Ley 1562 y Decreto 1072 de 2015`, `Análisis de Culpa Patronal (Art. 216 CST) y Responsabilidad Administrativa/Civil en ATEL`, `Revisión de Estabilidad Laboral Reforzada, Debido Proceso y Reglamento Interno (RIT)`, `Tasación Preventiva de Riesgo Sancionatorio MinTrabajo y Blindaje Probatorio`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Blindaje CST / Dec. 1072 + Culpa Patronal + Debido Proceso** — Concepto jurídico preventivo laboral y de riesgos laborales (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Abogado Laboral] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Abogado Laboral a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Médico Laboral & EMO
- **ID Técnico (`id`):** `subagent_medico_laboral` · **Etiqueta Corta:** `Médico Laboral`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Médico Laboral especialista en evaluaciones médicas ocupacionales (Res. 2346 de 2007), profesiograma, restricciones médicas, calificación de origen y vigilancia epidemiológica.

**Operación Técnica:** `Agente Chat · EMO, SVE y Reintegro` · Módulo: *🤖 Sub-Agente · Médico Especialista en Medicina del Trabajo (Res. 1843 / 2346)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1843 de 2025 / Resolución 2346 de 2007 (Evaluaciones Médicas Ocupacionales), Decreto 1427 de 2022 y Ley 23 de 1981 (Reserva de Historia Clínica).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_medico_laboral`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Auditoría de Evaluaciones Médicas Ocupacionales (Resolución 1843 de 2025 y Res. 2346 de 2007)`, `Seguimiento de Restricciones, Recomendaciones Médicas y Reubicación Laboral por Cédula`, `Cruce de Morbilidad CIE-10 y Sistemas de Vigilancia Epidemiológica (SVE)`, `Custodia y Reserva Estricta de la Historia Clínica Ocupacional`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Conceptos EMO (Res. 1843) + Restricciones + SVE con Reserva Clínica** — Dictamen médico-ocupacional preventivo por cargo y trabajador (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Médico Laboral] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Médico Laboral a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Fisioterapeuta Laboral & Ergonomía
- **ID Técnico (`id`):** `subagent_chat_fisioterapeuta` · **Etiqueta Corta:** `Fisioterapeuta SST`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Fisioterapeuta Laboral: analiza exigencias biomecánicas, posturas forzadas, manipulación de cargas, pausas activas y prevención de desórdenes musculoesqueléticos (DME).

**Operación Técnica:** `Agente Chat · Biomecánico & OWAS` · Módulo: *🤖 Sub-Agente · Fisioterapeuta Especialista en Ergonomía y Biomecánica*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_fisioterapeuta`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Evaluación Postural OWAS (Espalda, Brazos, Piernas, Fuerza y Categoría de Acción 1 a 4)`, `Análisis de Estudios de Puesto de Trabajo (EPT) y Manipulación Manual de Cargas`, `Prevención de Desórdenes Musculoesqueléticos (DME: Lumbago, Túnel Carpiano, Manguito Rotador)`, `Diseño de Pausas Activas Específicas y Rediseño Ergonómico de Puestos`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Evaluación OWAS + Estudio de Puesto (EPT) + Controles DME** — Intervención biomecánica para SVE Osteomuscular (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Fisioterapeuta SST] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Fisioterapeuta SST a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Psicólogo Especialista SST
- **ID Técnico (`id`):** `subagent_chat_psicologo_sst` · **Etiqueta Corta:** `Psicólogo SST`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Psicólogo Especialista en SST: evalúa factores de riesgo psicosocial intralaboral y extralaboral (Res. 2764 de 2022 y Ley 1010 de 2006), clima laboral y convivencia.

**Operación Técnica:** `Agente Chat · Batería Res. 2764` · Módulo: *🤖 Sub-Agente · Psicólogo Especialista en Riesgo Psicosocial (Res. 2764)*.
- **Marco Legal y Normativo SG-SST:** Resolución 2764 de 2022 (Batería de Riesgo Psicosocial), Ley 1010 de 2006 y Resolución 3461 de 2025.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_psicologo_sst`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Análisis de Factores Intralaborales, Extralaborales e Individuales (Res. 2764 de 2022)`, `Gestión Preventiva de Convivencia Laboral (Ley 1010 de 2006 y Res. 3461 de 2025)`, `Aplicación de los 14 Protocolos de Intervención Psicosocial del Ministerio del Trabajo`, `Anonimización y Reserva Ética de Resultados Individuales (Ley 1090 de 2006)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Batería Res. 2764 + Convivencia Res. 3461 + Protocolos MinTrabajo** — Vigilancia psicosocial ética y accionable (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Psicólogo SST] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Psicólogo SST a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Terapeuta en Salud Mental
- **ID Técnico (`id`):** `subagent_chat_terapeuta_mental` · **Etiqueta Corta:** `Terapeuta Mental`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Terapeuta en Salud Mental: brinda contención emocional, primeros auxilios psicológicos, manejo de estrés agudo, burnout y bienestar emocional de los trabajadores.

**Operación Técnica:** `Agente Chat · Primeros Auxilios Psicol.` · Módulo: *🤖 Sub-Agente · Especialista en Salud Mental, Burnout y Primeros Auxilios Psicológicos*.
- **Marco Legal y Normativo SG-SST:** Resolución 2764 de 2022 (Batería de Riesgo Psicosocial), Ley 1010 de 2006 y Resolución 3461 de 2025.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_terapeuta_mental`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Detección Grupal de Fatiga Mental, Estrés Agudo y Síndrome de Burnout`, `Guías de Primeros Auxilios Psicológicos (PAP) y Rutas de Atención EPS/ARL`, `Equilibrio Vida-Trabajo, Desconexión Laboral (Ley 2191) y Clima Saludable`, `Recomendaciones Confidenciales sin Exponer Datos Clínicos Individuales`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Prevención Burnout + Primeros Auxilios Psicológicos + Desconexión Ley 2191** — Plan preventivo de bienestar emocional corporativo (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Terapeuta Mental] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Terapeuta Mental a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Nutricionista Laboral
- **ID Técnico (`id`):** `subagent_chat_nutricionista` · **Etiqueta Corta:** `Nutricionista SST`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Nutricionista Laboral: diseña pautas de alimentación saludable, prevención de riesgo cardiovascular y metabólico según los hallazgos de los exámenes médicos.

**Operación Técnica:** `Agente Chat · Vida Saludable & SVE` · Módulo: *🤖 Sub-Agente · Nutricionista Ocupacional y Estilos de Vida Saludable*.
- **Marco Legal y Normativo SG-SST:** Resolución 1843 de 2025 / Resolución 2346 de 2007 (Evaluaciones Médicas Ocupacionales), Decreto 1427 de 2022 y Ley 23 de 1981 (Reserva de Historia Clínica).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_nutricionista`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Prevención de Riesgo Cardiovascular y Metabólico (IMC, Dislipidemias, Hipertensión)`, `Pautas de Alimentación para Trabajadores por Turnos Nocturnos o Trabajo Pesado`, `Protocolos de Hidratación por Estrés Térmico y Trabajo a la Intemperie`, `Campañas de Estilos de Vida y Trabajo Saludable para el Plan Anual SST`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Riesgo Cardiovascular + Hidratación Térmica + Nutrición por Turnos** — Programa de promoción y prevención en salud nutricional laboral (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Nutricionista SST] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Nutricionista SST a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Primer Respondiente & Primeros Auxilios
- **ID Técnico (`id`):** `subagent_chat_primer_respondiente` · **Etiqueta Corta:** `Primer Respondiente`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Primer Respondiente: guía la respuesta inmediata ante accidentes de trabajo, protocolo PAS, RCP básica, control de hemorragias, inmovilización y uso de botiquín.

**Operación Técnica:** `Agente Chat · Atención Primaria AT` · Módulo: *🤖 Sub-Agente · Instructor de Primeros Auxilios, MEDEVAC y Atención Prehospitalaria*.
- **Marco Legal y Normativo SG-SST:** Resolución 1843 de 2025 / Resolución 2346 de 2007 (Evaluaciones Médicas Ocupacionales), Decreto 1427 de 2022 y Ley 23 de 1981 (Reserva de Historia Clínica).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_primer_respondiente`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Protocolo PAS (Proteger, Avisar, Socorrer) y Valoración Primaria ABCDE en Planta`, `Activación de Cadena de Llamadas y Plan de Evacuación Médica (MEDEVAC)`, `Dotación Reglamentaria de Botiquines (Tipo A, B, C), Camillas y DEA (Ley 1831)`, `Georreferenciación de Clínicas y Centros de Urgencias ARL Cercanos a la Sede`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Protocolo MEDEVAC + Botiquines/DEA + Clínicas de Urgencia Cercanas** — Respuesta inmediata ante emergencias médicas en centros de trabajo (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Primer Respondiente] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Primer Respondiente a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Coordinador de Emergencias
- **ID Técnico (`id`):** `subagent_chat_emergencias` · **Etiqueta Corta:** `Coord. Emergencias`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Coordinador de Emergencias: estructura análisis de vulnerabilidad, Procedimientos Operativos Normalizados (PON), planes de evacuación, brigadas y simulacros.

**Operación Técnica:** `Agente Chat · PONs, Brigada y Amenazas` · Módulo: *🤖 Sub-Agente · Comandante SCI, Plan de Emergencias y Vulnerabilidad*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_emergencias`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Análisis de Amenazas (Naturales, Tecnológicas, Sociales) y Vulnerabilidad por Diamante de Riesgo`, `Procedimientos Operativos Normalizados (PON: Incendio, Sismo, Fuga Química, Evacuación)`, `Inspección de Extintores (NTC 2885 / NFPA 10), Rutas de Evacuación y Puntos de Encuentro`, `Estructura del Sistema Comando de Incidentes (SCI) y Plan de Ayuda Mutua`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Análisis de Vulnerabilidad + PON de Emergencia + Inspección Extintores** — Cumplimiento del Art. 2.2.4.6.25 del Decreto 1072 de 2015 (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Coord. Emergencias] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Coord. Emergencias a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Especialista en Bioseguridad
- **ID Técnico (`id`):** `subagent_chat_bioseguridad` · **Etiqueta Corta:** `Esp. Bioseguridad`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Especialista en Bioseguridad: evalúa exposición a agentes biológicos, protocolos de esterilización, manejo de cortopunzantes, esquemas de vacunación y EPP biológicos.

**Operación Técnica:** `Agente Chat · Riesgo Biológico & EPP` · Módulo: *🤖 Sub-Agente · Especialista en Riesgo Biológico, Bioseguridad y PGIRASA*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_bioseguridad`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Identificación de Peligros Biológicos (Virus, Bacterias, Hongos, Fluidos, Vectores)`, `Protocolos de Bioseguridad, Asepsia, Antisepsia y Manejo de Accidentes Percutáneos`, `Control de Esquemas de Vacunación Ocupacional (Hepatitis B, Tétanos, Fiebre Amarilla)`, `Segregación de Residuos Peligrosos Biosanitarios y Cortopunzantes (Código de Colores)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Protocolo Bioseguridad + Esquema Vacunación + Residuos Biosanitarios** — Vigilancia de riesgo biológico para salud, alimentos, aseo y agroindustria (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Esp. Bioseguridad] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Esp. Bioseguridad a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Ingeniero Electricista SST (RETIE)
- **ID Técnico (`id`):** `subagent_chat_electricista` · **Etiqueta Corta:** `Ing. Electricista SST`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Ingeniero Electricista SST: verifica cumplimiento del RETIE, las 5 reglas de oro en riesgo eléctrico, bloqueo y etiquetado (LOTO) y mantenimiento seguro de tableros.

**Operación Técnica:** `Agente Chat · RETIE & LOTO Eléctrico` · Módulo: *🤖 Sub-Agente · Ingeniero de Seguridad Eléctrica RETIE y Bloqueo LOTO*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_electricista`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Aplicación Estricta de las 5 Reglas de Oro para Trabajos Eléctricos Sin Tensión`, `Cumplimiento RETIE y Distancias Mínimas de Seguridad en Redes Energizadas`, `Procedimiento de Bloqueo y Etiquetado de Energías Peligrosas (LOTO)`, `Selección de EPP Dieléctrico e Ignífugo (Categoría Cal/cm² NFPA 70E) y Matrícula CONTE/COPNIA`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ 5 Reglas de Oro + Bloqueo LOTO + EPP Dieléctrico RETIE / NFPA 70E** — Validación técnica para mantenimiento eléctrico e industrial (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Ing. Electricista SST] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Ing. Electricista SST a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Ingeniero Químico SST (SGA)
- **ID Técnico (`id`):** `subagent_chat_quimico` · **Etiqueta Corta:** `Ing. Químico SGA`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Ingeniero Químico SST: analiza Fichas de Datos de Seguridad (FDS), matriz de compatibilidad química bajo el Sistema Globalmente Armonizado (Decreto 1496 de 2018) y almacenamiento seguro.

**Operación Técnica:** `Agente Chat · FDS & Decreto 1496` · Módulo: *🤖 Sub-Agente · Higienista Químico SGA (Decreto 1496 de 2018 y TLV ACGIH)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1496 de 2018 (Sistema Globalmente Armonizado — SGA), Ley 55 de 1993 y NTC 1692.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_quimico`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Revisión de Fichas de Datos de Seguridad (FDS de 16 Secciones vigentes < 5 años) y Etiquetado SGA`, `Matriz de Compatibilidad de Almacenamiento Químico (Clases ONU, Ácidos, Bases, Inflamables)`, `Límites Permisibles de Exposición Ocupacional (TLV-TWA / STEL ACGIH) y Ventilación`, `Selección de Protección Respiratoria (Cartuchos Vapores Orgánicos / Ácidos) y Duchas Lavaojos`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ FDS 16 Secciones + Compatibilidad SGA + Protección Respiratoria** — Control integral del Programa de Riesgo Químico Decreto 1496 (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Ing. Químico SGA] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Ing. Químico SGA a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Coordinador de Seguridad Vial (PESV)
- **ID Técnico (`id`):** `subagent_chat_seguridad_vial` · **Etiqueta Corta:** `Coord. Seguridad Vial`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Coordinador de Seguridad Vial: audita las 24 fases del PESV (Res. 20223040040595), inspecciones preoperacionales, control de fatiga, velocidad y parque automotor.

**Operación Técnica:** `Agente Chat · PESV Res. 40595` · Módulo: *🤖 Sub-Agente · Auditor Líder PESV (Resolución 20223040040595)*.
- **Marco Legal y Normativo SG-SST:** Resolución 20223040040595 de 2022 (Plan Estratégico de Seguridad Vial — PESV) e ISO 39001.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_seguridad_vial`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Evaluación de las 24 Fases del PESV según Nivel Básico, Estándar o Avanzado (Res. 40595)`, `Auditoría de Licencias de Conducción (RUNT), Comparendos (SIMIT), SOAT y RTM de Flota`, `Inspecciones Preoperacionales Diarias y Plan de Mantenimiento Preventivo Vehicular`, `Programas de Gestión de Velocidad Segura, Cero Alcohol, Prevención de Fatiga y Distracción`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ PESV 24 Fases + Control RUNT/SIMIT/SOAT/RTM + Programas Críticos** — Auditoría especializada de movilidad segura y flota corporativa (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Coord. Seguridad Vial] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Coord. Seguridad Vial a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Coordinador de Tareas de Alto Riesgo (TAR)
- **ID Técnico (`id`):** `subagent_chat_tareas_criticas` · **Etiqueta Corta:** `Coord. Tareas Críticas`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Coordinador de Tareas Críticas: valida permisos de trabajo en alturas (Res. 4272 de 2021), espacios confinados (Res. 0491 de 2020), trabajo en caliente, izaje y ATS.

**Operación Técnica:** `Agente Chat · Alturas, Confinados, Caliente` · Módulo: *🤖 Sub-Agente · Supervisor de Tareas de Alto Riesgo (Alturas, Confinados, Izaje, Caliente)*.
- **Marco Legal y Normativo SG-SST:** Resolución 4272 de 2021 (Trabajo Seguro en Alturas) y Resolución 0491 de 2020 (Espacios Confinados).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_tareas_criticas`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Trabajo Seguro en Alturas (Res. 4272 de 2021): Certificados MinTrabajo, Sistemas de Acceso y Rescate`, `Espacios Confinados (Res. 0491 de 2020): Medición de Atmósferas (O2, LEL, CO, H2S) y Vigía`, `Trabajos en Caliente (Soldadura/Corte) e Izaje Mecánico de Cargas (Aparejos y Grúas)`, `Validación de ATS, Permiso de Trabajo Firmado e Inspección Preuso de Arneses y Eslingas`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Alturas Res. 4272 + Confinados Res. 0491 + ATS y Permisos TAR** — Bloqueo preventivo de accidentes graves y mortales en campo (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Coord. Tareas Críticas] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Coord. Tareas Críticas a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Ingeniero de Minas SST
- **ID Técnico (`id`):** `subagent_chat_minas` · **Etiqueta Corta:** `Ing. de Minas SST`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Ingeniero de Minas SST: asesora en ventilación subterránea, monitoreo de gases, sostenimiento, explosivos y cumplimiento del reglamento de seguridad en labores mineras.

**Operación Técnica:** `Agente Chat · Seguridad Minera Dec. 1886` · Módulo: *🤖 Sub-Agente · Ingeniero de Seguridad Minera, Excavaciones y Geotecnia (Dec. 1886 / 539)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_minas`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Cumplimiento del Reglamento de Seguridad en Labores Mineras Subterráneas (Dec. 1886) y Cielo Abierto (Dec. 539)`, `Control de Ventilación, Monitoreo de Gases, Polvo de Carbón / Sílice y Sostenimiento de Taludes`, `Seguridad en Excavaciones, Zanjas, Maquinaria Amarilla y Voladuras Controladas`, `Planes de Salvamento Minero, Autorrescatadores y Refugios Señalizados`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Seguridad Minera (Dec. 1886/539) + Gases/Taludes + Salvamento** — Especializado para minería, túneles, canteras e infraestructura civil (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Ing. de Minas SST] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Ing. de Minas SST a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Auditor SG-SST (Res. 0312 / ISO 45001)
- **ID Técnico (`id`):** `subagent_auditor_calidad` · **Etiqueta Corta:** `Auditor SG-SST`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Auditor SG-SST: evalúa el cumplimiento de los Estándares Mínimos de la Resolución 0312 de 2019 e ISO 45001, detecta no conformidades y redacta planes de mejora ACPM.

**Operación Técnica:** `Agente Chat · Auditoría 0312 & ISO 45001` · Módulo: *🤖 Sub-Agente · Auditor de Calidad y Cumplimiento Res. 0312*.
- **Marco Legal y Normativo SG-SST:** Resolución 0312 de 2019 (Estándares Mínimos del SG-SST) y Decreto 1072 de 2015 Art. 2.2.4.6.29.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_auditor_calidad`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Verificación de Exactitud de Cédulas, Nombres y Fechas antes de Guardar`, `Revisión de Fórmulas Matemáticas (GTC-45, Indicadores Art. 30 Res. 0312, PESV)`, `Auditoría de Citas Legales (Confirmar que el Artículo Exista y Esté Vigente)`, `Bloqueo de Datos Simulados, Inventados o Incompletos`, `Verificación de Coherencia entre Hallazgo Detectado y Acción ACPM Propuesta`, `Validación de Formato de Tablas Markdown y Tarjeta wappy-card`, `Revisión de Protección de Datos Sensibles (Reserva Médica Res. 2346)`, `Sello de Aprobación de Calidad antes de Enviar Correo o Actualizar BD`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Validar Cédulas/Fechas + Cero Datos Inventados + Aprobar Salida** — Doble filtro de calidad antes de actualizar Somos SST o enviar email (4 campos)
  * **⚡ Auditar Cálculos (GTC-45 / 0312) + Citas Legales + Coherencia ACPM** — Revisión técnica de ingeniería y derecho laboral sobre el informe (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Auditor SG-SST] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Auditor SG-SST a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Ingeniero Ambiental & SGA
- **ID Técnico (`id`):** `subagent_chat_ambiental` · **Etiqueta Corta:** `Ingeniero Ambiental`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Ingeniero Ambiental: analiza gestión integral de residuos peligrosos (RESPEL), matriz de aspectos e impactos ambientales, huella de carbono y cumplimiento ambiental.

**Operación Técnica:** `Agente Chat · PGIRS, Vertimientos & ISO 14001` · Módulo: *🤖 Sub-Agente · Ingeniero Ambiental HSEQ (ISO 14001 y Gestión de Residuos)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1496 de 2018 (Sistema Globalmente Armonizado — SGA), Ley 55 de 1993 y NTC 1692.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_ambiental`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Identificación de Aspectos e Impactos Ambientales (ISO 14001) en Procesos Operativos`, `Gestión Integral de Residuos Sólidos y Peligrosos RESPEL (Decreto 1076 y Código de Colores)`, `Control de Vertimientos, Emisiones Atmosféricas, Ruido Ambiental y Consumo Hídrico/Energético`, `Planes de Contingencia ante Derrames de Hidrocarburos o Sustancias Químicas`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Aspectos ISO 14001 + Gestión RESPEL + Plan Anti-Derrames** — Integración HSEQ entre Seguridad y Salud en el Trabajo y Medio Ambiente (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Ingeniero Ambiental] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Ingeniero Ambiental a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Redactor Creativo & Comunicaciones SST
- **ID Técnico (`id`):** `subagent_chat_redactor` · **Etiqueta Corta:** `Redactor Creativo`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Redactor Creativo SST: transforma informes técnicos en comunicados claros, boletines preventivos, guiones de sensibilización, actas ejecutivas y campañas de cultura segura.

**Operación Técnica:** `Agente Chat · Boletines, Campañas y Actas` · Módulo: *🤖 Sub-Agente · Redactor Documental ISO 45001 / SG-SST (Procedimientos, Programas y Actas)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_redactor`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Encabezado de Control Documental (Código, Versión, Fecha, Alcance y Definiciones)`, `Redacción Técnica Formal de Políticas, Reglamentos, Programas PVE y Procedimientos PON`, `Tablas Limpias con Bordes Sólidos Listas para Exportar a Word (.docx) y PDF`, `Bloque Oficial de Elaboración, Revisión y Aprobación con Firmas`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Control Documental + Tablas Exportables Word/PDF + Bloque de Firmas** — Entrega documentos formales listos para auditoría o firma gerencial (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Redactor Creativo] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Redactor Creativo a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Profesional SST en Campo
- **ID Técnico (`id`):** `subagent_chat_profesional_sst` · **Etiqueta Corta:** `Profesional SST`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Profesional SST Operativo: realiza seguimiento de inspecciones planeadas, entrega de EPP, cierre de condiciones inseguras y control operativo diario en obra o planta.

**Operación Técnica:** `Agente Chat · Inspecciones & Operación` · Módulo: *🤖 Sub-Agente · Coordinador Operativo SG-SST en Campo (Inspecciones y Controles)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_profesional_sst`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Verificación de Condiciones de Orden y Aseo (5S), Señalización y Resguardos de Maquinaria`, `Supervisión de Uso Real de EPP y Charlas Preoperacionales de 5 Minutos`, `Seguimiento en Terreno a Contratistas, Visitantes y Permisos de Trabajo`, `Conversión de Hallazgos de Inspección en Acciones Correctivas Concretas`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Inspección 5S/Maquinaria + Charla 5 Min + Cierre de Hallazgos** — Gestión práctica de prevención operativa en planta u obra (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Profesional SST] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Profesional SST a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Coordinador de Capacitaciones & LMS
- **ID Técnico (`id`):** `subagent_chat_capacitaciones` · **Etiqueta Corta:** `Coord. Capacitaciones`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Coordinador de Capacitaciones: estructura el programa anual de capacitación, inducciones, reinducciones, evaluaciones de eficacia y mallas curriculares por cargo.

**Operación Técnica:** `Agente Chat · Plan Anual & Evaluaciones` · Módulo: *🤖 Sub-Agente · Diseñador Instruccional y Pedagogo SST (Capacitaciones y Evaluaciones)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_capacitaciones`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Diseño del Programa Anual de Capacitación SST por Peligros Prioritarios del Cargo`, `Guiones de Charlas de 5 Minutos, Talleres Andragógicos y Material Didáctico`, `Construcción de Evaluaciones de Eficacia y Conocimiento (Preguntas de Selección Múltiple)`, `Indicadores de Cobertura, Cumplimiento y Eficacia de Capacitación (Res. 0312)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Guion de Capacitación + Evaluación de Conocimiento + Indicadores 0312** — Material formativo listo para dictar o cargar en el LMS de WAPPY (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Coord. Capacitaciones] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Coord. Capacitaciones a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Especialista en Riesgo Climático & Térmico
- **ID Técnico (`id`):** `subagent_chat_climatico` · **Etiqueta Corta:** `Esp. Riesgo Climático`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Especialista en Riesgo Climático: cruza el pronóstico meteorológico con las tareas a cielo abierto, radiación UV, estrés térmico, tormentas eléctricas e hidratación.

**Operación Técnica:** `Agente Chat · Estrés Térmico, UV y Lluvias` · Módulo: *🤖 Sub-Agente · Analista de Riesgo Climático, Estrés Térmico y Trabajo a la Intemperie*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_climatico`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Evaluación de Lluvia, Tormenta Eléctrica y Velocidad de Viento para Suspensión de Alturas / Izaje`, `Control de Índice UV, Radiación Solar, Calor (WBGT) y Pausas de Hidratación/Sombra`, `Alertas Preventivas Viales por Piso Húmedo, Neblina o Deslizamientos en Ruta`, `Recomendaciones Operativas por Sede según Pronóstico en Tiempo Real`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Umbral Suspensión Alturas (Lluvia/Viento) + Estrés Térmico UV + Alerta Vial** — Cruza meteorología en vivo con operaciones de alto riesgo (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Esp. Riesgo Climático] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Esp. Riesgo Climático a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente de Chat: Simulador & Investigador de Accidentes ATEL
- **ID Técnico (`id`):** `subagent_chat_simulador_atel` · **Etiqueta Corta:** `Investigador ATEL`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Investigador y Simulador de Accidentes SST (Res. 1401 de 2007): aplica metodología de los 5 Porqués, Espina de Pescado (Ishikawa) y Árbol de Causas para determinar causas básicas e inmediatas.

**Operación Técnica:** `Agente Chat · Res. 1401, Árbol de Causas y 5 Porqués` · Módulo: *🤖 Sub-Agente · Investigador Forense ATEL (Resolución 1401 de 2007)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1401 de 2007 (Investigación de Incidentes y Accidentes de Trabajo) y NTC 3701.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_chat_simulador_atel`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Reconstrucción Cronológica del Evento y Revisión del FURAT / FUREL (Plazo Legal ≤ 15 Días)`, `Análisis Causal con 5 Porqués, Árbol de Causas e Ishikawa`, `Clasificación Técnica NTC 3701: Causas Inmediatas y Causas Básicas`, `Plan de Acción en Fuente, Medio e Individuo con Lección Aprendida Divulgable`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ 5 Porqués + NTC 3701 (Causas Básicas/Inmediatas) + Plan Fuente/Medio/Individuo** — Investigación completa conforme a la Resolución 1401 de 2007 (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Investigador ATEL] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Investigador ATEL a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente: Investigador Web & Vigencia Normativa
- **ID Técnico (`id`):** `subagent_researcher` · **Etiqueta Corta:** `Sub-Agente: Investigador`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Sub-Agente Investigador: explora las fuentes documentales y páginas web indicadas, verifica la vigencia normativa y entrega un dossier técnico verificado al Agente Principal.

**Operación Técnica:** `Sub-Agente · Búsqueda y Síntesis Legal` · Módulo: *🤖 Sub-Agente · Investigador Web & Documental SST*.
- **Marco Legal y Normativo SG-SST:** Resolución 2764 de 2022 (Batería de Riesgo Psicosocial), Ley 1010 de 2006 y Resolución 3461 de 2025.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_researcher`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Exploración Profunda de Fuentes Documentales y Portales Oficiales`, `Verificación de Vigencia de Leyes, Decretos y Resoluciones en Colombia`, `Extracción de Datos Científicos (PubChem NIH, MedlinePlus CIE-10, INS, OIT)`, `Síntesis de Dossier Técnico con Citas y Enlaces Verificados`, `Tabla Resumen de Hallazgos Documentales por Cédula o Proceso`, `Detección de Documentos Faltantes o Vencidos en el Expediente`, `Entrega de Contexto Depurado al Agente Principal sin Ruido`, `Validación Cruzada entre Fuentes Externas y Base de Datos Somos SST`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Dossier Normativo Verificado + Tabla de Hallazgos + Citas Oficiales** — Investiga y entrega un resumen verificado listo para el Agente Principal (4 campos)
  * **⚡ Investigación Científica (NIH/CIE-10/Químicos) + Cruce con Somos SST** — Ideal para enriquecer matrices químicas, médicas o ergonómicas (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Sub-Agente: Investigador] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Sub-Agente: Investigador a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente: Ingeniero de Web Scraping (Antigravity)
- **ID Técnico (`id`):** `subagent_scraper_agy` · **Etiqueta Corta:** `Sub-Agente: Scraper AGY`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Actúa como Sub-Agente Ingeniero de Scraping en Google Antigravity: ejecuta el script de extracción sobre la URL objetivo, extrae tablas/enlaces/textos y devuelve la data limpia al flujo.

**Operación Técnica:** `Sub-Agente · Script en tu PC/Cloud` · Módulo: *🤖 Sub-Agente · Ingeniero de Web Scraping (Google Antigravity)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_scraper_agy`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Ejecución de Script Python (BeautifulSoup / Playwright) o Node.js (Cheerio)`, `Navegación e Inspección DOM en Vivo con Navegador Nativo Integrado de Antigravity`, `Extracción de Tablas Completas y Conversión a Markdown / JSON`, `Descarga y Listado de Documentos PDF, Circulares y Anexos`, `Consulta Automatizada de Registros por Cédula, NIT o Placa`, `Limpieza de HTML y Normalización de Fechas y Campos`, `Captura de Evidencia Visual de la Página Consultada`, `Entrega de Payload Estructurado al Agente Principal`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Script Python/Playwright + Tablas a Markdown/JSON + Enlaces PDF** — Delega la extracción técnica web en tu instancia de Antigravity (4 campos)
  * **⚡ Consulta por Cédula/NIT/Placa + Navegador Nativo AGY + Captura de Evidencia** — Inspección automatizada de portales con el Navegador Nativo Integrado de Antigravity (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Sub-Agente: Scraper AGY] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Sub-Agente: Scraper AGY a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente: Analista de Ausentismo, Incapacidades y Siniestralidad
- **ID Técnico (`id`):** `subagent_analista_ausentismo` · **Etiqueta Corta:** `Analista Ausentismo`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Sub-Agente Analista de Ausentismo: calcula indicadores de Frecuencia (IF), Severidad (IS) y Lesiones Incapacitantes (ILI) bajo Res. 0312, agrupa diagnósticos CIE-10 y detecta casos recurrentes.

**Operación Técnica:** `Sub-Agente · IF, IS, ILI y CIE-10` · Módulo: *🤖 Sub-Agente · Analista Estadístico de Ausentismo e Indicadores Art. 30 Res. 0312*.
- **Marco Legal y Normativo SG-SST:** Resolución 0312 de 2019 (Estándares Mínimos del SG-SST) y Decreto 1072 de 2015 Art. 2.2.4.6.29.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_analista_ausentismo`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Cálculo de los 6 Indicadores Mínimos del Art. 30 Res. 0312 (IF, IS, PAM, Prevalencia, Incidencia, Ausentismo)`, `Análisis de Incapacidades por Origen (Enfermedad Común, Accidente de Trabajo, Enfermedad Laboral)`, `Identificación de Casos de Incapacidad Prolongada (> 90 / > 120 / > 180 días — Concepto Rehabilitación)`, `Pareto de Causas CIE-10 y Costo Oculto del Ausentismo por Área`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ 6 Indicadores Art. 30 Res. 0312 + Incapacidades Prolongadas + Pareto CIE-10** — Analítica exacta de ausentismo y siniestralidad laboral (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Analista Ausentismo] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Analista Ausentismo a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente: Validador de Seguridad Social (ARL, EPS, AFP y Planilla PILA)
- **ID Técnico (`id`):** `subagent_validador_seguridad_social` · **Etiqueta Corta:** `Validador ARL/EPS/AFP`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Sub-Agente Validador de Seguridad Social: cruza la nómina de trabajadores y contratistas para detectar quiénes no tienen ARL, EPS o Fondo de Pensiones activo antes de autorizar ingreso.

**Operación Técnica:** `Sub-Agente · Control de Afiliaciones` · Módulo: *🤖 Sub-Agente · Validador de Seguridad Social, PILA y Contratistas*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_validador_seguridad_social`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Verificación por Cédula de Cobertura Activa en EPS, ARL, Fondo de Pensión (AFP) y CCF`, `Validación de Clase de Riesgo ARL Cotizada (Nivel I a V) acorde a la Tarea Crítica`, `Control de Vigencia de Planilla Integrada PILA en Contratistas e Independientes (Dec. 1072)`, `Listado Nominal de Personal Habilitado vs. Personal Bloqueado para Ingreso`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cobertura EPS/ARL/AFP + Riesgo ARL Correcto + Habilitados vs. Bloqueados** — Filtro estricto de seguridad social para nómina y contratistas (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Validador ARL/EPS/AFP] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Validador ARL/EPS/AFP a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente: Secretario Redactor de Actas COPASST y Convivencia (CCL)
- **ID Técnico (`id`):** `subagent_redactor_actas` · **Etiqueta Corta:** `Redactor Actas Comité`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Secretario Técnico del COPASST y Comité de Convivencia Laboral: redacta el acta mensual oficial con orden del día, verificación de quórum, seguimiento de compromisos y bloque de firmas.

**Operación Técnica:** `Sub-Agente · Actas Oficiales Firmables` · Módulo: *🤖 Sub-Agente · Secretario Técnico y Redactor de Actas (COPASST, CCL, PESV y Brigada)*.
- **Marco Legal y Normativo SG-SST:** Resolución 2764 de 2022 (Batería de Riesgo Psicosocial), Ley 1010 de 2006 y Resolución 3461 de 2025.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_redactor_actas`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Verificación de Quórum, Orden del Día, Fecha, Hora y Número Consecutivo de Acta`, `Desarrollo de Temas Obligatorios (Inspecciones, ATEL, Indicadores, Seguimiento de Compromisos)`, `Tabla de Compromisos con Responsable, Fecha Límite y Estado de Avance`, `Espacio Formal de Firmas de Representantes del Empleador y de los Trabajadores`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Acta Formal Completa (Quórum + Desarrollo + Tabla Compromisos + Firmas)** — Lista para exportar a PDF/Word y firmar mensualmente o trimestralmente (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Redactor Actas Comité] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Redactor Actas Comité a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Sub-Agente: Sintetizador Ejecutivo para Alta Dirección y Gerencia
- **ID Técnico (`id`):** `subagent_sintetizador_gerencia` · **Etiqueta Corta:** `Sintetizador Gerencia`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `subagent`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Clúster Central `agent_cluster` · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Actúa como Sub-Agente Sintetizador para la Alta Dirección: resume todos los pasos previos del flujo en un briefing gerencial de 1 página con KPIs críticos, nivel de riesgo legal y decisiones requeridas.

**Operación Técnica:** `Sub-Agente · Resumen Gerencial & ROI` · Módulo: *🤖 Sub-Agente · Sintetizador Ejecutivo para Gerencia y Alta Dirección (Art. 2.2.4.6.31)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo especialista en **`◆ Herramienta +`** o **Pase Multi-Agente Secuencial** (`extraAgents` / `customNodes` a la derecha del Agente #1).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_subagent_sintetizador_gerencia`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Resumen Ejecutivo de 1 Página: % Cumplimiento Res. 0312, Siniestralidad y Riesgos Críticos`, `Evaluación de los 24 Aspectos de Revisión por la Alta Dirección (Art. 2.2.4.6.31 Dec. 1072)`, `Estado de Ejecución del Presupuesto SST y Retorno Preventivo (Evitación de Multas/ATEL)`, `Decisiones Estratégicas y Recursos Solicitados a la Gerencia General`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Resumen Gerencial 1 Página + Revisión Art. 31 + Presupuesto y Decisiones** — Lenguaje directivo orientado a toma de decisiones y gobierno corporativo (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Sintetizador Gerencia] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Sintetizador Gerencia a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Regla: Veracidad Estricta (Prohibido Inventar Datos)
- **ID Técnico (`id`):** `rule_veracidad_estricta` · **Etiqueta Corta:** `Regla: Cero Invención`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `rule`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
REGLA OBLIGATORIA: Jamás inventes ni simules trabajadores, accidentes, archivos o resultados de scraping. Si una fuente no devuelve datos reales, repórtalo con total transparencia.

**Operación Técnica:** `Regla · Integridad de Datos` · Módulo: *📏 Regla Obligatoria · Veracidad Estricta (Prohibido Inventar Datos)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1401 de 2007 (Investigación de Incidentes y Accidentes de Trabajo) y NTC 3701.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_rule_veracidad_estricta`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Prohibido Inventar o Simular Trabajadores, Cédulas, Nombres o Cargos`, `Prohibido Asumir Certificados, Exámenes EMO o Afiliaciones No Encontradas`, `Si una Carpeta de Drive o Correo está Vacío, Reportarlo con Transparencia`, `Cruzar Registros Únicamente contra la Base de Datos Real de la Empresa Activa`, `Incluir el Origen Exacto de Cada Dato (Archivo, Correo o Aplicativo SST)`, `Separar Claramente Datos Reales Verificados de Recomendaciones Preventivas`, `Bloquear Escritura en Base de Datos si el Dato de Origen es Ambiguo`, `Trazabilidad Auditable al 100% en la Bitácora Final`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cero Invención de Cédulas/Soportes + Transparencia si Falta Información** — Blindaje absoluto contra alucinaciones en auditorías SST (4 campos)
  * **⚡ Citar Origen de Cada Dato + Bloquear Escritura Ambigua** — Garantiza que solo datos verificables alimenten Somos SST (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Regla: Cero Invención] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Regla: Cero Invención a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Regla: Filtrar Solo Hallazgos Críticos o Próximos a Vencer
- **ID Técnico (`id`):** `rule_solo_criticos` · **Etiqueta Corta:** `Regla: Solo Críticos`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `rule`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
REGLA OBLIGATORIA: Reporta y escala únicamente hallazgos de riesgo Crítico/Alto (Nivel I o II en GTC-45) o documentos/exámenes vencidos o próximos a vencer en los siguientes 30 días.

**Operación Técnica:** `Regla · Filtro de Prioridad` · Módulo: *📏 Regla Obligatoria · Filtrar Solo Hallazgos Críticos o Próximos a Vencer*.
- **Marco Legal y Normativo SG-SST:** Guía Técnica Colombiana GTC-45 (2.ª Actualización) y Decreto 1072 de 2015 Art. 2.2.4.6.15.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_rule_solo_criticos`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Incluir Únicamente Peligros Nivel I (Crítico) y Nivel II (Alto) en GTC-45 / PESV`, `Incluir Únicamente Estándares en Brecha (No Cumple) en Resolución 0312`, `Incluir Únicamente Exámenes EMO, Cursos de Alturas y EPP Vencidos o a ≤ 30 Días`, `Incluir Únicamente Vehículos con SOAT, RTM o Preoperacional Vencido / Con Fallas`, `Incluir Únicamente Extintores Vencidos y Químicos con Choque SGA Incompatible`, `Omitir del Reporte los Registros que Están 100% Al Día y Cumplidos`, `Priorizar Trabajadores con Alertas Letales o Restricciones Médicas Activas`, `Resumir en 1 Sola Línea el Total de Registros Conformes Omitidos`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Vencidos o a ≤ 30 Días (EMO, Alturas, SOAT, Extintores) + Omitir Al Día** — Evita reportes extensos mostrando únicamente lo que requiere acción urgente (4 campos)
  * **⚡ Solo Riesgos Nivel I/II (GTC-45) + Estándares No Cumple (0312) + Alertas Letales** — Enfoca el flujo exclusivamente en brechas normativas y peligros críticos (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Regla: Solo Críticos] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Regla: Solo Críticos a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Regla: Reserva de Historia Clínica y Datos Sensibles (Res. 2346)
- **ID Técnico (`id`):** `rule_reserva_legal` · **Etiqueta Corta:** `Regla: Reserva Médica`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `rule`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
REGLA OBLIGATORIA: Protege la confidencialidad de diagnósticos médicos e historias clínicas conforme a la Resolución 2346 de 2007 y Ley 1581 de Habeas Data.

**Operación Técnica:** `Regla · Protección de Datos` · Módulo: *📏 Regla Obligatoria · Reserva de Historia Clínica y Habeas Data (Res. 2346 / Ley 1581)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1843 de 2025 / Resolución 2346 de 2007 (Evaluaciones Médicas Ocupacionales), Decreto 1427 de 2022 y Ley 23 de 1981 (Reserva de Historia Clínica).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_rule_reserva_legal`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (8):** `Cumplimiento Estricto de la Resolución 2346 de 2007 (Custodia de Historia Clínica Ocupacional)`, `Cumplimiento de la Ley 1581 de 2012 (Protección de Datos Personales Sensibles)`, `Reportar a Jefes o Comités Únicamente el Concepto de Aptitud, Restricciones y Recomendaciones`, `No Divulgar Historias Clínicas Completas ni Resultados Crudos de Laboratorio en Correos Masivos`, `Anonimizar Resultados Individuales de Batería Psicosocial (Res. 2764 de 2022)`, `Reserva Estricta de Quejas de Acoso Laboral en Comité de Convivencia (Ley 1010 de 2006)`, `Incluir Leyenda Legal de Confidencialidad en el Pie del Documento o Correo`, `Autorizar Acceso Clínico Detallado Solo al Médico Laboral y Responsable SST con Licencia`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Mostrar Solo Concepto de Aptitud y Restricciones (Proteger Historia Clínica Res. 2346)** — Permite gestionar reubicaciones y EMO sin violar la reserva médica legal (4 campos)
  * **⚡ Reserva en Riesgo Psicosocial (Res. 2764) y Casos Ley 1010 (Convivencia)** — Garantiza manejo estadístico y confidencial en flujos psicosociales y CCL (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Regla: Reserva Médica] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Regla: Reserva Médica a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### Nodo: Web Scraping Inteligente (Auto DOM / Navegador Nativo AGY / Script)
- **ID Técnico (`id`):** `scraper_node_antigravity` · **Etiqueta Corta:** `Web Scraping`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `web_scraper`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Extrae contenido estructurado, tablas y documentos de hasta 5 URLs públicas de forma autónoma en servidor (HTML + DOM JS / Fetch Cheerio) o mediante el Navegador Nativo Integrado de Antigravity (1° Local ➔ 2° Cloud ➔ 3° Respaldo HTTP Seguro sin Chromium en VPS), con selectores CSS y detección de cambios SHA-256.

**Operación Técnica:** `Auto DOM · Hasta 5 URLs + SHA-256` · Módulo: *🕷️ Nodo Scraper Personalizado · Navegador Nativo / Script en Antigravity*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_scraper_node_antigravity`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (4):** `Ejecución mediante Navegador Nativo Integrado de Antigravity, Python (BS4 / Playwright) o Node.js (Cheerio)`, `Tablas y Registros Normalizados en Formato JSON / Markdown`, `Descarga de Archivos Oficiales (.PDF / .PNG) en la Bandeja de Certificados`, `Control de Tiempos de Espera y Reporte Transparente de Estado HTTP`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Navegador Nativo Antigravity / Script + Tablas JSON/Markdown + Soportes PDF/PNG** — Configuración lista para portales web personalizados sin Chromium en VPS (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Web Scraping] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Web Scraping a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

### 🪖 Nodo AGY: Certificados Alto Riesgo (MinTrabajo Alturas/Confinados) y SENA
- **ID Técnico (`id`):** `custom_scraper_agy_alto_riesgo` *(Catálogo base: `scraper_agy_alto_riesgo`)* · **Etiqueta Corta:** `Alto Riesgo & SENA`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `web_scraper`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Consulta por Cédula vía Google Antigravity en MinTrabajo Centros de Entrenamiento (Trabajo en Alturas Res. 4272/2021 y Espacios Confinados Res. 0491/2020) y en SENA Sofia Plus, extrayendo tabla histórica y descargando PDFs vigentes.

**Arquitectura Interna en Backend:**
Ejecuta sesión ASP.NET WebForms (`consulta_ext.aspx` ➔ `consulta_lista.aspx`) en el Registro Oficial de Centros de Entrenamiento del Ministerio del Trabajo y consulta SENA Sofia Plus vía Google Antigravity, extrayendo nivel, centro entrenador, fecha de terminación, vigencia y descargando la constancia oficial `%PDF` y `.PNG`.
- **Marco Legal y Normativo SG-SST:** Resolución 4272 de 2021 (Trabajo Seguro en Alturas — vigencia y reentrenamiento) y Resolución 0491 de 2020 (Trabajo en Espacios Confinados).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_scraper_agy_alto_riesgo`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Modo de Conexión (`antigravityMode`):** `"auto"` (cascada `1° Local ➔ 2° Cloud ➔ 3° Respaldo Seguro sin navegador pesado en VPS`), `"local"` o `"cloud"`.
- **2. Motor (`scriptEngine` / `engine`):** `"antigravity_native_browser"` con configuración espejo en `nodeConfigs["scraper_agy_alto_riesgo"]` y `nodeConfigs["tool_inputs_scraper_agy_alto_riesgo"]`.
- **3. Consulta Puntual sin Escanear Nómina:** En Flujos Tenshi usa `ifPlacement: "pre_source"` (`has_explicit_cedula` o `has_explicit_cedula_or_placa`) para consultar directo cuando el usuario da el documento o visitante externo.
- **Casillas / Campos Reales Disponibles (7):** `MinTrabajo — Consulta Real sin CAPTCHA en Centros de Entrenamiento (Trabajo en Alturas Res. 4272/2021 y Espacios Confinados Res. 0491/2020): https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_ext.aspx`, `MinTrabajo — Nivel del Curso Verificado (Trabajador Autorizado, Reentrenamiento Sectorial, Coordinador, Administrativo)`, `MinTrabajo — Centro de Entrenamiento Autorizado, NIT, Entrenador y Fechas Exactas de Inicio/Finalización`, `SENA — Sofia Plus / Certificados Digitales Oficiales por Cédula: https://certificados.sena.edu.co/CertificadoDigital/com.sena.consultacer`, `SENA — Títulos Técnicos/Tecnólogos, Curso de 50 Horas / 20 Horas SG-SST y Competencias Laborales Vigentes`, `Descarga Automática de Constancia Oficial (.PDF) y Captura de Verificación (.PNG) en Bandeja de Evidencias`, `Alerta Automática si el Reentrenamiento Anual de Alturas supera los 12 meses o no registra certificado`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ MinTrabajo Alturas/Confinados + SENA + Descarga de Certificados (.PDF / .PNG)** — Consulta ambos portales oficiales en vivo por Cédula y deposita los soportes PDF/PNG en bandeja aparte (5 campos)
  * **⚡ Solo MinTrabajo Centros de Entrenamiento (Alturas Res. 4272 y Confinados Res. 0491)** — Verificación directa en app2.mintrabajo.gov.co con constancia oficial PDF/PNG (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** `cedula` (5–12 dígitos), `tipoDoc` (`CC`/`CE`/`PPT`), `nombre` completo o `placa` vehicular (desde mensaje de Tenshi o desde `upstreamInputItems` del nodo previo).
- **Salida (`OUTPUT`):** Filas homogéneas verificadas (`outputItems`: titular real recuperado, documento, estado oficial, entidad detectada, detalle técnico) + certificados oficiales `%PDF` e imagen `.PNG` persistidos en la bandeja dedicada `evidenceFiles` (en `scraper_agy_antecedentes` incluye el **Tablero Completo de los 5 Entes Oficiales** + SECOP Datos Abiertos).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Tenshi IA] ──▶ [Condición Si/No: ¿Entregó Cédula?] ──(SÍ)──▶ [Agente IA Tenshi + ◆ Alto Riesgo & SENA] ──▶ [Notificar en WAPPY + Certificado PDF/PNG]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, consulta en el Ministerio del Trabajo si la cédula 71234567 tiene certificado vigente de Trabajo Seguro en Alturas bajo la Resolución 4272.»

---

### 🛡️ Nodo AGY: Certificados de ARL Directos (SURA, Positiva, Colmena, AXA, Bolívar)
- **ID Técnico (`id`):** `custom_scraper_agy_arl_directo` *(Catálogo base: `scraper_agy_arl_directo`)* · **Etiqueta Corta:** `Web Scraping ARL`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `web_scraper`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Verifica afiliación activa y descarga certificados de ARL por Cédula directamente en los 5 portales oficiales (ARL SURA, Positiva, Colmena, AXA Colpatria y Seguros Bolívar, sin pasar por RUAF) con cascada de protección: 1° Antigravity Local · Navegador Nativo ➔ 2° Antigravity Cloud ➔ 3° Respaldo HTTP Seguro sin Chromium en VPS.

**Arquitectura Interna en Backend:**
Ejecuta `consultarArlRealPorCedula` (`api/server/services/osintWorkerService.js`) mediante cascada segura de 3 niveles: 1° Navegador Nativo Google Antigravity Local (IP Colombia) ➔ 2° Google Antigravity Cloud 24/7 ➔ 3° Respaldo HTTP ligero en servidor sin abrir navegador pesado en el VPS. Consulta ARL SURA y ARL Positiva directamente por cédula; si se aporta fecha de nacimiento consulta también ARL Seguros Bolívar y ARL AXA Colpatria (portales públicos ciudadanos sin clave empresarial; si AXA activa control `reCAPTCHA` se detiene sin tocarlo) e informa con exactitud que ARL Colmena (`colmenaseguros.com/certificados-de-afiliacion`) también es público con fecha de nacimiento pero exige casilla `reCAPTCHA` ("No soy un robot") humana, descargando certificados oficiales `%PDF` y `.PNG` en `evidenceFiles`.
- **Marco Legal y Normativo SG-SST:** Ley 1562 de 2012, Decreto 1295 de 1994 y Decreto 1072 de 2015 (Verificación obligatoria de afiliación activa a Riesgos Laborales antes de ingreso o tareas operativas).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_scraper_agy_arl_directo`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Modo de Conexión (`antigravityMode`):** `"auto"` (cascada `1° Local ➔ 2° Cloud ➔ 3° Respaldo Seguro sin navegador pesado en VPS`), `"local"` o `"cloud"`.
- **2. Motor (`scriptEngine` / `engine`):** `"antigravity_native_browser"` con configuración espejo en `nodeConfigs["scraper_agy_arl_directo"]` y `nodeConfigs["tool_inputs_scraper_agy_arl_directo"]`.
- **3. Consulta Puntual sin Escanear Nómina:** En Flujos Tenshi usa `ifPlacement: "pre_source"` (`has_explicit_cedula` o `has_explicit_cedula_or_placa`) para consultar directo cuando el usuario da el documento o visitante externo.
- **Casillas / Campos Reales Disponibles (7):** `ARL SURA — Verificación Pública de Afiliación y Certificado: https://www.arlsura.com/afiliacion/verificar.php`, `ARL Positiva — Consulta y Certificado de Afiliación en Línea: https://www.positivaenlinea.gov.co/nuevo/`, `ARL Colmena Seguros — Consulta de Afiliación ARL por Cédula: https://afiliacionarl.colmenaseguros.com/`, `ARL AXA Colpatria — Certificados de Afiliación ESST: https://asesoriavirtual.axacolpatria.co/prod_esst/certificados/`, `ARL Seguros Bolívar / La Equidad — Verificación de Cobertura en Riesgos Laborales`, `Validación de Estado Activo / Inactivo, Clase de Riesgo (I a V) y Coherencia con el Expediente SST`, `Descarga Automática de Certificado / Constancia ARL (.PDF) y Captura (.PNG) en Bandeja de Evidencias`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Barrido en Vivo de ARL Directas (SURA, Positiva, Colmena, AXA y Bolívar) + PDF/PNG** — 1° Antigravity Local · Navegador Nativo ➔ 2° Antigravity Cloud ➔ 3° Respaldo HTTP Seguro sin Chromium en VPS (6 campos)
  * **⚡ Solo ARL SURA + ARL Positiva + ARL Colmena + Soporte Descargable** — Consulta rápida en las 3 ARL de mayor volumen de trabajadores y contratistas (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** `cedula` (5–12 dígitos), `tipoDoc` (`CC`/`CE`/`PPT`), `nombre` completo o `placa` vehicular (desde mensaje de Tenshi o desde `upstreamInputItems` del nodo previo).
- **Salida (`OUTPUT`):** Filas homogéneas verificadas (`outputItems`: titular real recuperado, documento, estado oficial, entidad detectada, detalle técnico) + certificados oficiales `%PDF` e imagen `.PNG` persistidos en la bandeja dedicada `evidenceFiles` (en `scraper_agy_antecedentes` incluye el **Tablero Completo de los 5 Entes Oficiales** + SECOP Datos Abiertos).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Tenshi IA] ──▶ [Condición Si/No: ¿Entregó Cédula?] ──(SÍ)──▶ [Agente IA Tenshi + ◆ Web Scraping ARL] ──▶ [Notificar en WAPPY + Certificado PDF/PNG]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, verifica el certificado de afiliación ARL para la cédula 1037654321 y descárgame el soporte oficial aquí en el chat.»

---

### 🏦 Nodo AGY: Fondos de Pensiones Directos — Sin RUAF (En Construcción)
- **ID Técnico (`id`):** `custom_scraper_agy_pensiones_directo` *(Catálogo base: `scraper_agy_pensiones_directo`)* · **Etiqueta Corta:** `Pensiones Directo`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `web_scraper`
- **Estado:** **🚧 En Construcción (Protegido)** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Consulta afiliación pensional por Cédula directamente en los 5 fondos de pensiones de Colombia (Porvenir, Protección Certifácil, Colfondos, Skandia y Colpensiones, sin usar RUAF) vía Google Antigravity.

**Operación Técnica:** `En Construcción` · Módulo: *🏦 Scraper Antigravity · Fondos de Pensiones Directos (En Construcción)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

🚧 **Nodo en Construcción:** Variante personalizada de consulta AFP bloqueada preventivamente porque los portales pensionales colombianos emplean CAPTCHAs visuales y autenticación privada del cotizante que WAPPY jamás salta ni resuelve automáticamente. **Alternativa activa hoy:** usa `hito2_perfil_socio` para control de AFP y planilla PILA.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_scraper_agy_pensiones_directo`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Estado de Guardia Preventiva:** Este nodo está marcado con `defaultConstruction: true`. Tanto el validador estático (`validate-workflow-logic.js`) como el planificador (`automationScheduler.js`) lo omiten en `< 10ms` con estado `skipped` para impedir bloqueos o fallos en producción.
- **1. Modo de Conexión (`antigravityMode`):** `"auto"` (cascada `1° Local ➔ 2° Cloud ➔ 3° Respaldo Seguro sin navegador pesado en VPS`), `"local"` o `"cloud"`.
- **2. Motor (`scriptEngine` / `engine`):** `"antigravity_native_browser"` con configuración espejo en `nodeConfigs["scraper_agy_pensiones_directo"]` y `nodeConfigs["tool_inputs_scraper_agy_pensiones_directo"]`.
- **3. Consulta Puntual sin Escanear Nómina:** En Flujos Tenshi usa `ifPlacement: "pre_source"` (`has_explicit_cedula` o `has_explicit_cedula_or_placa`) para consultar directo cuando el usuario da el documento o visitante externo.
- **Casillas / Campos Reales Disponibles (7):** `Porvenir (Certificado de Afiliación Directo): https://www.porvenir.com.co/web/certificados-y-extractos/certificado-de-afiliacion`, `Protección — Certifácil (Pensión y Cesantías por Cédula): https://www.proteccion.com/portalafiliados/certifacil`, `Colfondos (Certificado de Afiliación Pensión Obligatoria): https://www.colfondos.com.co/dxp/personas/pensiones-obligatorias/certificado-afiliacion`, `Skandia (Consulta de Certificados de Afiliación): https://www.skandia.co/consulta-extractos-y-certificados`, `Colpensiones (Certificado de Afiliación / No Pensión RPM): https://sede.colpensiones.gov.co/tramite/updInfo/72/`, `Detección Exacta del Fondo Activo (RAIS vs. Colpensiones RPM) y Fecha de Afiliación`, `Descarga del Certificado Oficial de Pensión en PDF`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Barrido en los 5 Fondos Directos Sin RUAF (Porvenir, Protección, Colfondos, Skandia y Colpensiones)** — Recorre los 5 portales oficiales hasta hallar el fondo activo y descargar su PDF (7 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** `cedula` (5–12 dígitos), `tipoDoc` (`CC`/`CE`/`PPT`), `nombre` completo o `placa` vehicular (desde mensaje de Tenshi o desde `upstreamInputItems` del nodo previo).
- **Salida (`OUTPUT`):** Filas homogéneas verificadas (`outputItems`: titular real recuperado, documento, estado oficial, entidad detectada, detalle técnico) + certificados oficiales `%PDF` e imagen `.PNG` persistidos en la bandeja dedicada `evidenceFiles` (en `scraper_agy_antecedentes` incluye el **Tablero Completo de los 5 Entes Oficiales** + SECOP Datos Abiertos).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Tenshi IA] ──▶ [Condición Si/No: ¿Entregó Cédula?] ──(SÍ)──▶ [Agente IA Tenshi + ◆ Pensiones Directo] ──▶ [Notificar en WAPPY + Certificado PDF/PNG]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, ejecuta el nodo Pensiones Directo para verificar por cédula y entrégame el soporte oficial en el chat.»

---

### 🏥 Nodo AGY: Salud EPS (ADRES) y Talento Humano en Salud ReTHUS (En Construcción)
- **ID Técnico (`id`):** `custom_scraper_agy_salud_rethus` *(Catálogo base: `scraper_agy_salud_rethus`)* · **Etiqueta Corta:** `ADRES EPS & ReTHUS`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `web_scraper`
- **Estado:** **🚧 En Construcción (Protegido)** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Consulta por Cédula vía Google Antigravity la afiliación EPS activa en ADRES (BDUA) y la inscripción/vigencia profesional en ReTHUS (SISPRO MinSalud).

**Operación Técnica:** `En Construcción` · Módulo: *🏥 Scraper Antigravity · Salud EPS (ADRES) y ReTHUS (En Construcción)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1843 de 2025 / Resolución 2346 de 2007 (Evaluaciones Médicas Ocupacionales), Decreto 1427 de 2022 y Ley 23 de 1981 (Reserva de Historia Clínica).

🚧 **Nodo en Construcción:** Variante de script para ADRES y SISPRO ReTHUS deshabilitada por protección estricta de seguridad (ambos portales estatales exigen validación humana de `RadCaptcha` / `imgCaptcha`). **Alternativa activa hoy:** usa **`forensic_doc_verifier`** para auditoría institucional sin CAPTCHA en REPS MinSalud + Contraloría General y cruce de EPS en `hito2_perfil_socio`.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_scraper_agy_salud_rethus`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Estado de Guardia Preventiva:** Este nodo está marcado con `defaultConstruction: true`. Tanto el validador estático (`validate-workflow-logic.js`) como el planificador (`automationScheduler.js`) lo omiten en `< 10ms` con estado `skipped` para impedir bloqueos o fallos en producción.
- **1. Modo de Conexión (`antigravityMode`):** `"auto"` (cascada `1° Local ➔ 2° Cloud ➔ 3° Respaldo Seguro sin navegador pesado en VPS`), `"local"` o `"cloud"`.
- **2. Motor (`scriptEngine` / `engine`):** `"antigravity_native_browser"` con configuración espejo en `nodeConfigs["scraper_agy_salud_rethus"]` y `nodeConfigs["tool_inputs_scraper_agy_salud_rethus"]`.
- **3. Consulta Puntual sin Escanear Nómina:** En Flujos Tenshi usa `ifPlacement: "pre_source"` (`has_explicit_cedula` o `has_explicit_cedula_or_placa`) para consultar directo cuando el usuario da el documento o visitante externo.
- **Casillas / Campos Reales Disponibles (5):** `ADRES — BDUA (Consulta de EPS Activa por Cédula): https://www.adres.gov.co/consulte-su-eps`, `ADRES — Entidad EPS, Régimen (Contributivo / Subsidiado), Estado de Afiliación y Tipo de Afiliado`, `ReTHUS — SISPRO MinSalud (Talento Humano en Salud): https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx`, `ReTHUS — Profesión/Ocupación Autorizada (Médico, Enfermero, Psicólogo, Fisioterapeuta, Profesional SST en Salud)`, `ReTHUS — Acto Administrativo / Autorización de Ejercicio, Entidad Reportadora y Estado Vigente`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Consulta Completa: EPS en ADRES (BDUA) + Registro Profesional en ReTHUS (SISPRO)** — Verifica afiliación a salud e idoneidad profesional en salud/SST (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** `cedula` (5–12 dígitos), `tipoDoc` (`CC`/`CE`/`PPT`), `nombre` completo o `placa` vehicular (desde mensaje de Tenshi o desde `upstreamInputItems` del nodo previo).
- **Salida (`OUTPUT`):** Filas homogéneas verificadas (`outputItems`: titular real recuperado, documento, estado oficial, entidad detectada, detalle técnico) + certificados oficiales `%PDF` e imagen `.PNG` persistidos en la bandeja dedicada `evidenceFiles` (en `scraper_agy_antecedentes` incluye el **Tablero Completo de los 5 Entes Oficiales** + SECOP Datos Abiertos).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Tenshi IA] ──▶ [Condición Si/No: ¿Entregó Cédula?] ──(SÍ)──▶ [Agente IA Tenshi + ◆ ADRES EPS & ReTHUS] ──▶ [Notificar en WAPPY + Certificado PDF/PNG]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, ejecuta el nodo ADRES EPS & ReTHUS para verificar por cédula y entrégame el soporte oficial en el chat.»

---

### 🚗 Nodo AGY: Seguridad Vial PESV (SIMIT y RUNT por Cédula o Placa)
- **ID Técnico (`id`):** `custom_scraper_agy_vial_pesv` *(Catálogo base: `scraper_agy_vial_pesv`)* · **Etiqueta Corta:** `SIMIT & RUNT Vial`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `web_scraper`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Audita por Cédula (Conductor) y/o por Placa (Vehículo) comparendos y multas en SIMIT, licencias de conducción en RUNT Persona y vigencia de SOAT y Revisión Técnico-Mecánica en RUNT Vehículo vía Google Antigravity.

**Arquitectura Interna en Backend:**
Ejecuta `consultarSimitPesvRealPorCedula` (`osintWorkerService.js`) para trabajadores, visitantes o contratistas externos por número de cédula o placa vehicular (`waitUntil: "commit"` con `timeout: 22000ms` y `waitForSelector("#txtBusqueda", { timeout: 18000 })`). Respeta al 100% la prohibición de computar o aguardar desafíos anti-bot/CAPTCHA: si SIMIT activa `#whcModal.show` / `codigo === 6`, detiene al instante y entrega estado limpio con los enlaces directos oficiales de SIMIT (`fcm.org.co/simit`) y Consulta Ciudadana RUNT (`runt.gov.co`, indicando que RUNT requiere CAPTCHA humano por documento).
- **Marco Legal y Normativo SG-SST:** Resolución 20223040040595 de 2022 (Plan Estratégico de Seguridad Vial — PESV, Fase de Control de Conductores e Infracciones) y Ley 769 de 2002.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_scraper_agy_vial_pesv`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Modo de Conexión (`antigravityMode`):** `"auto"` (cascada `1° Local ➔ 2° Cloud ➔ 3° Respaldo Seguro sin navegador pesado en VPS`), `"local"` o `"cloud"`.
- **2. Motor (`scriptEngine` / `engine`):** `"antigravity_native_browser"` con configuración espejo en `nodeConfigs["scraper_agy_vial_pesv"]` y `nodeConfigs["tool_inputs_scraper_agy_vial_pesv"]`.
- **3. Consulta Puntual sin Escanear Nómina:** En Flujos Tenshi usa `ifPlacement: "pre_source"` (`has_explicit_cedula` o `has_explicit_cedula_or_placa`) para consultar directo cuando el usuario da el documento o visitante externo.
- **Casillas / Campos Reales Disponibles (5):** `SIMIT Nacional por Cédula o Placa (Comparendos, Multas, Paz y Salvo y Acuerdos de Pago): https://www.fcm.org.co/simit/#/home-public`, `RUNT Ciudadano por Cédula (Conductor — Vigencia, Estado y Categoría de Licencia A2, B1, C1, C2, C3): https://www.runt.gov.co/consultaCiudadana/#/consultaPersona`, `RUNT Ciudadano por Placa (Vehículo — Vigencia Exacta de Póliza SOAT y Revisión Técnico-Mecánica RTM): https://www.runt.gov.co/consultaCiudadana/#/consultaVehiculo`, `Descarga Automática de Constancia Vial (.PDF) y Captura de Evidencia (.PNG) en Bandeja de Soportes`, `Alerta Automática PESV (Res. 20223040040595) por Licencia Suspendida/Vencida, Comparendos o SOAT/RTM ≤ 30 días`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Auditoría PESV en Vivo: SIMIT + RUNT Conductor/Placa + Constancias (.PDF / .PNG)** — Cruza conductores y flota vehicular bajo Res. 20223040040595 descargando soportes oficiales en bandeja aparte (5 campos)
  * **⚡ Solo Conductor por Cédula (RUNT Licencia + SIMIT Comparendos + Soporte PDF/PNG)** — Verificación inmediata de idoneidad vial antes de ingreso o asignación de vehículo (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** `cedula` (5–12 dígitos), `tipoDoc` (`CC`/`CE`/`PPT`), `nombre` completo o `placa` vehicular (desde mensaje de Tenshi o desde `upstreamInputItems` del nodo previo).
- **Salida (`OUTPUT`):** Filas homogéneas verificadas (`outputItems`: titular real recuperado, documento, estado oficial, entidad detectada, detalle técnico) + certificados oficiales `%PDF` e imagen `.PNG` persistidos en la bandeja dedicada `evidenceFiles` (en `scraper_agy_antecedentes` incluye el **Tablero Completo de los 5 Entes Oficiales** + SECOP Datos Abiertos).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Tenshi IA] ──▶ [Condición Si/No: ¿Entregó Cédula?] ──(SÍ)──▶ [Agente IA Tenshi + ◆ SIMIT & RUNT Vial] ──▶ [Notificar en WAPPY + Certificado PDF/PNG]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, verifica comparendos y Paz y Salvo en SIMIT para el contratista con cédula 80123456 o para la placa KLM45D.»

---

### ⚖️ Nodo AGY: Antecedentes y Procesos Judiciales (Rama, Contraloría, Procuraduría, Policía)
- **ID Técnico (`id`):** `custom_scraper_agy_antecedentes` *(Catálogo base: `scraper_agy_antecedentes`)* · **Etiqueta Corta:** `Antecedentes & Rama`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `web_scraper`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Ejecuta debida diligencia por Cédula vía Google Antigravity en Rama Judicial (Procesos), Contraloría (SIBOR), Procuraduría (SIRI), Policía Antecedentes Judiciales, Policía RNMC (Medidas Correctivas) y Delitos Sexuales (Ley 1918).

**Arquitectura Interna en Backend:**
Ejecuta `consultarRamaJudicial` (`osintWorkerService.js`) entregando el **Tablero Completo de los 5 Entes Oficiales en Colombia**:
  1. ✅ **Rama Judicial / Juzgados Penales y Ordinarios (API v2 Oficial — 0 CAPTCHA):** separa causas de Juzgados Penales/Garantías/Conocimiento/Ejecución de Penas frente a procesos Laborales, Civiles, Administrativos y Familia.
  2. ✅ **Contraloría General — Responsabilidad Fiscal SIBOR (0 CAPTCHA):** descarga el certificado `%PDF` oficial (`Certificado_Contraloria_<cedula>.pdf`), extrae el nombre legal real del titular y cruza además **Multas y Sanciones Contractuales en SECOP Datos Abiertos** (`datos.gov.co/resource/4n4q-k399.json`).
  3. 🔒 **Policía Nacional & RNMC Medidas Correctivas:** entrega enlaces oficiales directos indicando con transparencia que exigen `reCAPTCHA` humano ("No soy un robot").
  4. 🔒 **Procuraduría General — Antecedentes Disciplinarios SIRI:** enlace oficial directo indicando que exige pregunta aleatoria de seguridad humana.
  5. 🔒 **Fiscalía General — SPOA Denuncias:** informa que las causas penales judicializadas ya fueron medidas en Rama Judicial y que indagaciones reservadas SPOA requieren validación humana/CAPTCHA.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015, Ley 610 de 2000 (Responsabilidad Fiscal SIBOR), Ley 1952 de 2019 (Código General Disciplinario) y debida diligencia laboral pre-ingreso.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_scraper_agy_antecedentes`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Modo de Conexión (`antigravityMode`):** `"auto"` (cascada `1° Local ➔ 2° Cloud ➔ 3° Respaldo Seguro sin navegador pesado en VPS`), `"local"` o `"cloud"`.
- **2. Motor (`scriptEngine` / `engine`):** `"antigravity_native_browser"` con configuración espejo en `nodeConfigs["scraper_agy_antecedentes"]` y `nodeConfigs["tool_inputs_scraper_agy_antecedentes"]`.
- **3. Consulta Puntual sin Escanear Nómina:** En Flujos Tenshi usa `ifPlacement: "pre_source"` (`has_explicit_cedula` o `has_explicit_cedula_or_placa`) para consultar directo cuando el usuario da el documento o visitante externo.
- **Casillas / Campos Reales Disponibles (7):** `Rama Judicial — API Oficial v2 Consulta Nacional Unificada de Procesos Judiciales: https://consultaprocesos.ramajudicial.gov.co/Procesos/Index`, `Contraloría General de la República — Certificado de Antecedentes Fiscales (SIBOR): https://cfiscal.contraloria.gov.co/Certificados/CertificadoPersonaNatural.aspx`, `Procuraduría General de la Nación — Certificado de Antecedentes Disciplinarios (SIRI): https://apps.procuraduria.gov.co/webcert/Certificado.aspx`, `Policía Nacional — Antecedentes Judiciales: https://antecedentes.policia.gov.co:7005/WebJudicial/`, `Policía Nacional — RNMC (Medidas Correctivas Código de Policía) e Inhabilidades Ley 1918 de 2018`, `Descarga Automática de Constancia Oficial (.PDF) y Captura (.PNG) en Bandeja Aparte sin Ruido en el Mensaje`, `Dictamen Consolidado de Debida Diligencia (Sin Novedades vs. Procesos / Alertas Activas por Despacho)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Barrido Completo en Vivo (Rama Judicial API v2 + Contraloría + Procuraduría + Policía + PDF/PNG)** — Debida diligencia integral por Cédula y Nombre con certificados descargados en bandeja dedicada (6 campos)
  * **⚡ Contratación Estándar (Rama Judicial + Policía + Procuraduría SIRI + Contraloría SIBOR)** — Certificados esenciales exigidos en selección y control de contratistas (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** `cedula` (5–12 dígitos), `tipoDoc` (`CC`/`CE`/`PPT`), `nombre` completo o `placa` vehicular (desde mensaje de Tenshi o desde `upstreamInputItems` del nodo previo).
- **Salida (`OUTPUT`):** Filas homogéneas verificadas (`outputItems`: titular real recuperado, documento, estado oficial, entidad detectada, detalle técnico) + certificados oficiales `%PDF` e imagen `.PNG` persistidos en la bandeja dedicada `evidenceFiles` (en `scraper_agy_antecedentes` incluye el **Tablero Completo de los 5 Entes Oficiales** + SECOP Datos Abiertos).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Tenshi IA] ──▶ [Condición Si/No: ¿Entregó Cédula?] ──(SÍ)──▶ [Agente IA Tenshi + ◆ Antecedentes & Rama] ──▶ [Notificar en WAPPY + Certificado PDF/PNG]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, verifica los antecedentes judiciales, penales y fiscales para la cédula 79456123 y descárgame el certificado oficial de la Contraloría.»

---

### Nodo: Búsqueda en la Web en Vivo (Consultas y Normas)
- **ID Técnico (`id`):** `search_node_live_web` · **Etiqueta Corta:** `Búsqueda Web Viva`
- **Familia:** 5. Herramienta +: Conectores, APIs, Skills, Reglas y Sub-Agentes · **Categoría:** `web_search`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Sub-nodo Circular `circle` (Puerto Inferior `◆`) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Realiza búsquedas en vivo en la web sobre los términos y dominios configurados en este nodo.

**Operación Técnica:** `Motor Web en Tiempo Real` · Módulo: *🌐 Nodo de Búsqueda en Vivo · Radar Web Oficial y Normativo*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Sub-nodo circular conectado al rombo inferior **`◆ Herramienta +`** debajo del `Agente IA` (`inputs[]` o `customNodes[]`).
- **Puertos de Conexión:** ◆ Puerto Superior hacia `◆ Herramienta +` del Agente IA (`tool_inputs_search_node_live_web`)
- **Canales de Invocación:** Invocado dinámicamente por el Agente IA durante la corrida en `/tareas`, por voz/chat desde Tenshi o en simulación Sandbox.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (3):** `Dominios Oficiales Prioritarios (mintrabajo.gov.co, suin-juriscol.gov.co, minsalud.gov.co)`, `Resoluciones, Decretos y Guías Técnicas Recientes de SST`, `Enlaces Oficiales Verificados y Síntesis Ejecutiva en Tabla Markdown`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Radar Normativo .gov.co + Enlaces Verificados + Tabla Resumen** — Monitoreo automático de novedades normativas laborales (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Solicitud estructurada de llamada a herramienta (Tool Call) emitida por el Agente IA con los datos del flujo.
- **Salida (`OUTPUT`):** Respuesta JSON/Markdown verificada (guías clínicas, fichas GHS, clima en tiempo real, artefactos de NotebookLM/Flow o dictamen de Sub-Agente) integrada al razonamiento final.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron / Tenshi IA] ──▶ [Fuente Etapa 2] ──▶ [Agente IA Principal + ◆ Búsqueda Web Viva] ──▶ [Documento LiveEditor + Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, conecta Búsqueda Web Viva a nuestro flujo del SG-SST y dime qué datos podemos obtener.»

---

## 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos)

> Los 50 aplicativos operativos de Somos SST organizados en los 8 Hitos del Sistema de Gestión: Gobernanza, Huella Biocéntrica, Comités, Evaluación Dinámica, Terreno, Escuela LMS, Auditoría/ATEL e IA Predictiva.

### Hito 1 · Contexto y Partes Interesadas (DOFA / Stakeholders)
- **ID Técnico (`id`):** `hito1_dofa` · **Etiqueta Corta:** `H1: Contexto DOFA`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 1: Gobernanza y Cimiento Legal` · **Hito Oficial:** `HITO1`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos, Estrategias CAME y Partes Interesadas de «Contexto DOFA»

**Operación Técnica:** `Contexto y Partes Interesadas DOFA / Stakeholders (somos_sst: contexto)` · Módulo: *Hito 1 · Contexto y Partes Interesadas (DOFA / Stakeholders)* · App ID Somos SST: `contexto_organizacion`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.4–2.2.4.6.25), Resolución 0312 de 2019, GTC-45, Res. 20223040040595 (PESV) y Decreto 1496 de 2018 (SGA).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito1_dofa`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito1_dofa"]` y `nodeConfigs["tool_hitos_hito1_dofa"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (18):** `Fortalezas Internas SST (F)`, `Debilidades Internas SST (D)`, `Oportunidades Externas SST (O)`, `Amenazas Externas SST (A)`, `Estrategias Ofensivas (FO)`, `Estrategias Reorientación (DO)`, `Estrategias Defensivas (FA)`, `Estrategias Supervivencia (DA)`, `Partes Interesadas Internas (Trabajadores, COPASST, CCL, Brigada, Alta Dirección)`, `Partes Interesadas Externas (ARL, EPS, AFP, MinTrabajo, Contratistas, Clientes, Comunidad)` *(+8 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Matriz DOFA (F, D, O, A)** — Extrae únicamente las 4 variables DOFA sin el resto del documento (4 campos)
  * **⚡ Estrategias Cruzadas CAME (FO, DO, FA, DA)** — Extrae las estrategias cruzadas derivadas del análisis DOFA (4 campos)
  * **⚡ Partes Interesadas + Necesidades y Requisitos Legales** — Extrae la matriz de Stakeholders internos/externos y sus expectativas SST (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H1: Contexto DOFA (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 1 · Contexto y Partes Interesadas (DOFA / Stakeholders) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 1 · Diagnóstico Inicial Estándares Mínimos (Res. 0312)
- **ID Técnico (`id`):** `hito1_diagnostico_0312` · **Etiqueta Corta:** `H1: Diagnóstico 0312`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 1: Gobernanza y Cimiento Legal` · **Hito Oficial:** `HITO1`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos, Calificaciones y Resultados Propios de «Diagnóstico Res. 0312»

**Operación Técnica:** `Diagnóstico Inicial de Estándares Mínimos Res. 0312 (somos_sst: diagnostico)` · Módulo: *Hito 1 · Diagnóstico Inicial Estándares Mínimos (Res. 0312)* · App ID Somos SST: `diagnostico`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.4–2.2.4.6.25), Resolución 0312 de 2019, GTC-45, Res. 20223040040595 (PESV) y Decreto 1496 de 2018 (SGA).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito1_diagnostico_0312`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito1_diagnostico_0312"]` y `nodeConfigs["tool_hitos_hito1_diagnostico_0312"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (18):** `Código Estándar`, `Nombre del Estándar`, `Estado (Cumple / No Cumple / Parcial / No Aplica)`, `Puntaje del Ítem`, `Puntos del Estándar`, `Ciclo PHVA`, `Observación / Hallazgo`, `Puntaje Total 0312 (%)`, `Valoración Global (Crítico / Moderado / Aceptable)`, `Total Estándares Cumplidos` *(+8 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Estándares No Cumple y Brechas** — Extrae únicamente los estándares en brecha (No Cumple), hallazgos y plan ACPM (5 campos)
  * **⚡ Puntaje Total %, Valoración y Resumen PHVA** — Extrae calificación porcentual global, valoración y totales por ciclo PHVA (5 campos)
  * **⚡ Matriz Completa de Estándares y Puntajes** — Extrae código, estándar, ciclo PHVA, puntos, estado y observación técnica (6 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H1: Diagnóstico 0312 (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 1 · Diagnóstico Inicial Estándares Mínimos (Res. 0312) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 1 · Responsable SG-SST (Licencia e Idoneidad)
- **ID Técnico (`id`):** `hito1_responsable` · **Etiqueta Corta:** `H1: Responsable SST`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 1: Gobernanza y Cimiento Legal` · **Hito Oficial:** `HITO1`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de Asignación y Licencia del Responsable SG-SST

**Operación Técnica:** `Asignación y Licencia del Responsable SG-SST (somos_sst: responsable)` · Módulo: *Hito 1 · Responsable SG-SST (Licencia e Idoneidad)* · App ID Somos SST: `responsable`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.4–2.2.4.6.25), Resolución 0312 de 2019, GTC-45, Res. 20223040040595 (PESV) y Decreto 1496 de 2018 (SGA).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito1_responsable`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito1_responsable"]` y `nodeConfigs["tool_hitos_hito1_responsable"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (18):** `Nombre Completo del Responsable SG-SST`, `Cédula / Documento del Responsable`, `Perfil Académico (Profesional / Especialista / Tecnólogo / Técnico SST)`, `Título Profesional y Universidad / Institución`, `Número de Resolución de Licencia SST`, `Secretaría de Salud Emisora de la Licencia`, `Fecha de Expedición de la Licencia SST`, `Fecha de Vencimiento de la Licencia SST`, `Estado de Vigencia de la Licencia SST (Vigente / Próxima a Vencer / Vencida)`, `Campos de Acción Autorizados en la Licencia SST` *(+8 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Nombre, Cédula, Licencia SST y Vigencia Curso 50h/20h** — Verifica la idoneidad legal completa del responsable del SG-SST (6 campos)
  * **⚡ Alerta de Vencimientos (Licencia SST y Curso 50h/20h)** — Extrae solo el estado de vigencia y fechas de vencimiento del responsable (4 campos)
  * **⚡ Carta de Asignación, Perfil e Idoneidad Res. 0312** — Valida cumplimiento del estándar 1.1.1 de la Resolución 0312 (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H1: Responsable SST (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 1 · Responsable SG-SST (Licencia e Idoneidad) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 1 · Política de SST
- **ID Técnico (`id`):** `hito1_politica_objetivos` · **Etiqueta Corta:** `H1: Política SST`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 1: Gobernanza y Cimiento Legal` · **Hito Oficial:** `HITO1`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos y Componentes Propios de la Política del SG-SST

**Operación Técnica:** `Política del SG-SST (somos_sst: politica)` · Módulo: *Hito 1 · Política de SST (Dec. 1072 Art. 2.2.4.6.5)* · App ID Somos SST: `politica`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.4–2.2.4.6.25), Resolución 0312 de 2019, GTC-45, Res. 20223040040595 (PESV) y Decreto 1496 de 2018 (SGA).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito1_politica_objetivos`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito1_politica_objetivos"]` y `nodeConfigs["tool_hitos_hito1_politica_objetivos"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Declaración Oficial de la Política de SST`, `Alcance de Cobertura (Todos los Centros de Trabajo, Trabajadores, Contratistas y Subcontratistas)`, `Compromiso de Identificación de Peligros, Evaluación y Valoración de Riesgos`, `Compromiso de Mejora Continua del SG-SST`, `Compromiso de Cumplimiento de la Normatividad Nacional Vigente en Riegos Laborales`, `Compromiso de Promoción y Protección de la Salud de los Trabajadores`, `Peligros Prioritarios de la Empresa Integrados en la Política`, `Políticas Complementarias (Prevención de Acoso Laboral, Alcohol y Drogas, Seguridad Vial PESV)`, `Código Documental y Número de Versión`, `Fecha de Emisión y Fecha de Última Revisión Anual` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Compromisos Legales (Art. 2.2.4.6.6), Vigencia y Firma** — Verifica los requisitos obligatorios de la Política SST del Decreto 1072 (6 campos)
  * **⚡ Alcance, Peligros Prioritarios y Políticas Complementarias** — Extrae el enfoque técnico y políticas asociadas (Acoso, Alcohol, Vial) (3 campos)
  * **⚡ Socialización, COPASST y Evidencia de Publicación** — Audita la divulgación efectiva de la política a trabajadores y COPASST (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H1: Política SST (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 1 · Política de SST de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 1 · Objetivos de SST (Indicadores)
- **ID Técnico (`id`):** `hito1_objetivos` · **Etiqueta Corta:** `H1: Objetivos SST`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 1: Gobernanza y Cimiento Legal` · **Hito Oficial:** `HITO1`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos, Fórmulas y Resultados Propios de Objetivos e Indicadores SST

**Operación Técnica:** `Objetivos y Metas Cuantificables del SG-SST (somos_sst: objetivos)` · Módulo: *Hito 1 · Objetivos e Indicadores de SST* · App ID Somos SST: `objetivos`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.4–2.2.4.6.25), Resolución 0312 de 2019, GTC-45, Res. 20223040040595 (PESV) y Decreto 1496 de 2018 (SGA).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito1_objetivos`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito1_objetivos"]` y `nodeConfigs["tool_hitos_hito1_objetivos"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (17):** `Código / ID del Objetivo SST`, `Objetivo Estratégico del SG-SST`, `Directriz de la Política SST con la que se Alinea`, `Nombre del Indicador Asociado`, `Tipo de Indicador (Estructura / Proceso / Resultado — Art. 2.2.4.6.19)`, `Definición e Interpretación del Indicador`, `Fórmula Matemática de Cálculo`, `Unidad de Medida (%, Tasa, Número, Días)`, `Fuente de Información para el Cálculo`, `Línea Base / Resultado Período Anterior` *(+7 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Objetivos, Indicador, Meta (%) y Resultado Actual** — Cuadro de mando ejecutivo de cumplimiento de objetivos SST (6 campos)
  * **⚡ Solo Indicadores en Brecha (No Cumplen Meta) y Plan de Acción** — Filtra desviaciones de metas para abrir acciones correctivas (6 campos)
  * **⚡ Ficha Técnica de Indicadores (Fórmula, Periodicidad y Fuente)** — Audita las fichas técnicas de Estructura, Proceso y Resultado (6 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H1: Objetivos SST (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 1 · Objetivos de SST (Indicadores) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 1 · Matriz Legal
- **ID Técnico (`id`):** `hito1_matriz_legal` · **Etiqueta Corta:** `H1: Matriz Legal`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 1: Gobernanza y Cimiento Legal` · **Hito Oficial:** `HITO1`
- **Estado:** **🚧 En Construcción (Protegido)** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de la Matriz Legal y Normograma SG-SST

**Operación Técnica:** `Matriz Legal SG-SST (somos_sst: matriz_legal)` · Módulo: *Hito 1 · Matriz Legal SG-SST* · App ID Somos SST: `legal`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.4–2.2.4.6.25), Resolución 0312 de 2019, GTC-45, Res. 20223040040595 (PESV) y Decreto 1496 de 2018 (SGA).

🚧 **Aplicativo en Construcción en Producción:** El rediseño normativo interactivo de Matriz Legal automática se encuentra en actualización. **Alternativa activa hoy en flujos:** combina `extract_web_scraping_agy` o `web_search` (SUIN-Juriscol / MinTrabajo) con `hito1_politica_objetivos` y `hito7_acpm`.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito1_matriz_legal`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Estado de Guardia Preventiva:** Este nodo está marcado con `defaultConstruction: true`. Tanto el validador estático (`validate-workflow-logic.js`) como el planificador (`automationScheduler.js`) lo omiten en `< 10ms` con estado `skipped` para impedir bloqueos o fallos en producción.
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito1_matriz_legal"]` y `nodeConfigs["tool_hitos_hito1_matriz_legal"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (17):** `Jerarquía / Tipo de Norma (Constitución, Ley, Decreto, Resolución, Circular, NTC)`, `Número de la Norma y Año de Expedición`, `Entidad Emisora (MinTrabajo, MinSalud, MinTransporte, Congreso, Presidencia)`, `Título / Epígrafe Oficial de la Norma`, `Artículos Específicos Aplicables a la Empresa`, `Tema / Peligro o Proceso Regulado`, `Sector Económico / CIIU Aplicable`, `Descripción de la Obligación Legal Específica`, `Evidencia Documental u Operativa Requerida`, `Evidencia Existente Registrada en la Empresa` *(+7 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Normas Pendientes / En Brecha y Evidencia Requerida** — Extrae únicamente los requisitos legales que aún no cumplen al 100% (7 campos)
  * **⚡ Normograma Completo (Norma, Artículos, Obligación y Estado)** — Resumen estructurado de todas las normas aplicables a la empresa (6 campos)
  * **⚡ KPIs de Cumplimiento Legal (%) y Última Actualización** — Indicadores ejecutivos de cumplimiento normativo para auditoría 0312 (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H1: Matriz Legal (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 1 · Matriz Legal de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 1 · Reglamento de Higiene (RHS)
- **ID Técnico (`id`):** `hito1_rhs` · **Etiqueta Corta:** `H1: Reglamento RHS`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 1: Gobernanza y Cimiento Legal` · **Hito Oficial:** `HITO1`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios del Reglamento de Higiene y Seguridad Industrial (RHS)

**Operación Técnica:** `Reglamento de Higiene y Seguridad Industrial RHS (somos_sst: rhs)` · Módulo: *Hito 1 · Reglamento de Higiene y Seguridad Industrial (RHS)* · App ID Somos SST: `rhs`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.4–2.2.4.6.25), Resolución 0312 de 2019, GTC-45, Res. 20223040040595 (PESV) y Decreto 1496 de 2018 (SGA).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito1_rhs`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito1_rhs"]` y `nodeConfigs["tool_hitos_hito1_rhs"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (17):** `Razón Social, NIT y Domicilio Principal de la Empresa`, `Ciudad, Departamento, Dirección y Teléfono de las Sedes`, `Nombre de la ARL Afiliada`, `Clase o Nivel de Riesgo ARL (I, II, III, IV o V)`, `Código CIIU y Descripción de la Actividad Económica`, `Peligros Físicos Declarados en el RHS`, `Peligros Químicos Declarados en el RHS`, `Peligros Biológicos Declarados en el RHS`, `Peligros Biomecánicos / Ergonómicos Declarados en el RHS`, `Peligros Psicosociales Declarados en el RHS` *(+7 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ CIIU, Riesgo ARL y Todos los Peligros Declarados en el RHS** — Cruza los peligros declarados en el RHS con la Matriz IPEVR GTC-45 (8 campos)
  * **⚡ Datos de Empresa, ARL, Firma y Publicación Visible** — Verifica validez formal y publicación del RHS en sedes (5 campos)
  * **⚡ Compromisos del Empleador (CST Art. 349) y Prevención** — Extrae el articulado de compromisos legales del RHS (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H1: Reglamento RHS (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 1 · Reglamento de Higiene (RHS) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 1 · Reglamento Interno (RIT)
- **ID Técnico (`id`):** `hito1_rit` · **Etiqueta Corta:** `H1: Reglamento RIT`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 1: Gobernanza y Cimiento Legal` · **Hito Oficial:** `HITO1`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Capítulos y Artículos Propios del Reglamento Interno de Trabajo (RIT)

**Operación Técnica:** `Reglamento Interno de Trabajo RIT (somos_sst: rit)` · Módulo: *Hito 1 · Reglamento Interno de Trabajo (RIT)* · App ID Somos SST: `rit`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.4–2.2.4.6.25), Resolución 0312 de 2019, GTC-45, Res. 20223040040595 (PESV) y Decreto 1496 de 2018 (SGA).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito1_rit`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito1_rit"]` y `nodeConfigs["tool_hitos_hito1_rit"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (19):** `Identificación del Empleador, NIT y Sedes Cubiertas`, `Condiciones de Admisión y Requisitos de Ingreso`, `Contrato de Aprendizaje y Período de Prueba`, `Trabajadores Accidentales o Transitorios`, `Horario de Trabajo, Turnos y Jornada Ordinaria Legal (Ley 2101 de 2021)`, `Horas Extras, Trabajo Nocturno, Dominical y Festivo`, `Días de Descanso Legalmente Obligatorios, Vacaciones y Permisos`, `Salario, Lugar, Día, Hora de Pagos y Períodos que lo Regulan`, `Servicio Médico, Medidas de Seguridad, Riesgos Laborales y Primeros Auxilios`, `Prescripciones de Orden y Seguridad en el Trabajo` *(+9 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Prescripciones SST, Obligaciones y Escala de Faltas/Sanciones** — Extrae las normas de seguridad laboral y régimen disciplinario del RIT (5 campos)
  * **⚡ Prevención de Acoso Laboral (Ley 1010) y Desconexión Laboral** — Cruza con el Comité de Convivencia Laboral y Riesgo Psicosocial (3 campos)
  * **⚡ Jornada Laboral (Ley 2101), Horarios, Permisos y Vacaciones** — Extrae la regulación de tiempos, turnos y descansos del RIT (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H1: Reglamento RIT (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 1 · Reglamento Interno (RIT) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 1 · Participación IPEVR Comunitaria
- **ID Técnico (`id`):** `hito1_participacion_ipevar` · **Etiqueta Corta:** `H1: Participación IPEVR`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 1: Gobernanza y Cimiento Legal` · **Hito Oficial:** `HITO1`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos y Reportes del Portal de Participación IPEVR Comunitaria

**Operación Técnica:** `Participación IPEVR Comunitaria de Trabajadores (somos_sst: participacion_ipevar)` · Módulo: *Hito 1 · Participación IPEVR Comunitaria de Trabajadores* · App ID Somos SST: `participacion_ipevar`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.4–2.2.4.6.25), Resolución 0312 de 2019, GTC-45, Res. 20223040040595 (PESV) y Decreto 1496 de 2018 (SGA).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito1_participacion_ipevar`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito1_participacion_ipevar"]` y `nodeConfigs["tool_hitos_hito1_participacion_ipevar"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Cédula / Documento del Trabajador`, `Nombre Completo del Trabajador`, `Cargo / Rol del Trabajador`, `Área / Proceso y Sede`, `Fecha del Reporte Participativo`, `Peligros Percibidos en su Puesto de Trabajo`, `Familia del Peligro Reportado (Biomecánico, Físico, Químico, Psicosocial, Condiciones de Seguridad, etc.)`, `Fuente o Causa del Peligro Según el Trabajador`, `Mapa Corporal: Segmento Anatómico con Dolor o Molestia (Cuello, Hombros, Espalda, Manos, Piernas)`, `Intensidad de Molestia o Fatiga Reportada (Escala 1 a 10)` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cédula, Nombre, Peligros Percibidos y Mapa Corporal de Dolor** — Extrae el autorreporte participativo de peligros y sintomatología corporal (6 campos)
  * **⚡ Solo Reportes de Riesgo Alto/Crítico y Mejoras Propuestas** — Filtra las percepciones críticas pendientes de incorporar a la Matriz GTC-45 (7 campos)
  * **⚡ Cruce de Percepción del Riesgo (pts) por Cargo y Área** — Para alimentar el Oráculo de Compatibilidad y la Matriz Bio-IPEVR (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H1: Participación IPEVR (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 1 · Participación IPEVR Comunitaria de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 1 · Matriz IPEVR (GTC 45)
- **ID Técnico (`id`):** `hito2_matriz_ipevar` · **Etiqueta Corta:** `H1: Matriz GTC 45`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 1: Gobernanza y Cimiento Legal` · **Hito Oficial:** `HITO1`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Columnas, Valoraciones y Controles Propios de la Matriz de Peligros IPEVR GTC-45

**Operación Técnica:** `Matriz Oficial de Peligros IPEVR GTC 45 (matriz_ipevar)` · Módulo: *Hito 1 · Matriz Oficial de Peligros IPEVR (GTC-45)* · App ID Somos SST: `matriz_ipevar_oficial`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.4–2.2.4.6.25), Resolución 0312 de 2019, GTC-45, Res. 20223040040595 (PESV) y Decreto 1496 de 2018 (SGA).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito2_matriz_ipevar`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito2_matriz_ipevar"]` y `nodeConfigs["tool_hitos_hito2_matriz_ipevar"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (26):** `Proceso / Macroproceso`, `Zona o Lugar / Sede`, `Actividad y Tarea`, `Cargo(s) Expuesto(s)`, `Rutinario (Sí / No)`, `Clasificación / Familia del Peligro (Biológico, Físico, Químico, Psicosocial, Biomecánico, Condiciones de Seguridad, Fenómenos Naturales)`, `Descripción del Peligro y Fuente Generadora`, `Efectos Posibles en la Salud / Peor Consecuencia`, `Control Existente en la Fuente`, `Control Existente en el Medio` *(+16 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Peligros Críticos (Nivel I y II) + Medidas de Intervención** — Prioriza los peligros No Aceptables y sus controles obligatorios (10 campos)
  * **⚡ Proceso, Cargo, Peligro, Controles Existentes y EPP** — Resumen operativo por cargo sin las columnas matemáticas intermedias (8 campos)
  * **⚡ Valoración Matemática Completa GTC-45 (ND, NE, NP, NC, NR)** — Extrae la calificación cuantitativa completa de cada peligro (8 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H1: Matriz GTC 45 (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 1 · Matriz IPEVR (GTC 45) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 1 · Matriz de Riesgos Viales (PESV)
- **ID Técnico (`id`):** `hito3_matriz_pesv` · **Etiqueta Corta:** `H1: Matriz PESV`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 1: Gobernanza y Cimiento Legal` · **Hito Oficial:** `HITO1`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Columnas y Resultados Propios de la Matriz de Riesgos Viales PESV (Res. 20223040040595)

**Operación Técnica:** `Matriz Oficial de Riesgos Viales PESV Res. 40595 (matriz_pesv)` · Módulo: *Hito 1 · Matriz de Riesgos Viales (PESV Res. 40595)* · App ID Somos SST: `matriz_pesv_oficial`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.4–2.2.4.6.25), Resolución 0312 de 2019, GTC-45, Res. 20223040040595 (PESV) y Decreto 1496 de 2018 (SGA).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito3_matriz_pesv`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito3_matriz_pesv"]` y `nodeConfigs["tool_hitos_hito3_matriz_pesv"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (17):** `Actor Vial Evaluado (Conductor, Motociclista, Ciclista, Peatón, Pasajero)`, `Factor de Riesgo Vial (Comportamiento Humano, Vehículo Seguro, Infraestructura Segura, Atención a Víctimas, Gestión Institucional)`, `Proceso / Ruta / Desplazamiento (Misional vs. In Itinere Casa-Trabajo)`, `Peligro Vial Identificado y Fuente Generadora`, `Efectos Posibles / Siniestro Vial Potencial`, `Controles Viales Existentes (Vehículo, Vía, Conductor)`, `Nivel de Exposición Vial (Frecuencia de Desplazamiento)`, `Nivel de Probabilidad Vial (1 a 4)`, `Nivel de Consecuencia / Severidad Vial (1 a 4)`, `Valoración Cuantitativa del Riesgo Vial (NP x NC)` *(+7 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Riesgos Viales Críticos/Altos y Controles PESV** — Extrae los peligros viales prioritarios por actor vial y sus controles (7 campos)
  * **⚡ Actor Vial, Ruta (Misional/In Itinere) y Expuestos** — Caracterización de desplazamientos por rol vial (5 campos)
  * **⚡ Matriz Cuantitativa PESV Completa (Probabilidad, Severidad y Nivel)** — Extrae la calificación técnica conforme a la Metodología Res. 40595 (7 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H1: Matriz PESV (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 1 · Matriz de Riesgos Viales (PESV) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 1 · Matriz de Compatibilidad Química (SGA)
- **ID Técnico (`id`):** `hito3_quimicos_sga` · **Etiqueta Corta:** `H1: Compatibilidad SGA`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 1: Gobernanza y Cimiento Legal` · **Hito Oficial:** `HITO1`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos, Cruces SGA/ONU y Resultados Propios de la Matriz de Compatibilidad Química

**Operación Técnica:** `Matriz Oficial de Compatibilidad Química SGA Dec. 1496 (matriz_compatibilidad)` · Módulo: *Hito 1 · Matriz de Compatibilidad Química (SGA Dec. 1496)* · App ID Somos SST: `matriz_compatibilidad_oficial`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.4–2.2.4.6.25), Resolución 0312 de 2019, GTC-45, Res. 20223040040595 (PESV) y Decreto 1496 de 2018 (SGA).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito3_quimicos_sga`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito3_quimicos_sga"]` y `nodeConfigs["tool_hitos_hito3_quimicos_sga"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (17):** `Nombre Comercial del Producto Químico`, `Sustancia Activa / Componente Peligroso Principal`, `Número CAS (Chemical Abstracts Service)`, `Número ONU (UN)`, `Clase de Peligro ONU (Clases 1 a 9 — Inflamable, Corrosivo, Tóxico, Comburente, etc.)`, `Subclase Química (Ácido vs. Base / Alcalino / Hipoclorito)`, `Pictogramas SGA / GHS Aplicables (GHS01 a GHS09)`, `Palabra de Advertencia SGA (Peligro / Atención)`, `Indicaciones de Peligro (Frases H)`, `Consejos de Prudencia (Frases P)` *(+7 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Choques e Incompatibilidades Químicas (Rojo/Amarillo)** — Detecta mezclas peligrosas (ej. Ácido vs. Hipoclorito o Inflamable vs. Comburente) (6 campos)
  * **⚡ Sustancia, CAS/ONU, Pictogramas SGA y Vigencia de FDS** — Audita etiquetado SGA Decreto 1496 y Fichas de Datos de Seguridad (6 campos)
  * **⚡ Frases H/P, EPP Químico y Atención de Derrames** — Ficha operativa de seguridad química para trabajadores y brigada (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H1: Compatibilidad SGA (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 1 · Matriz de Compatibilidad Química (SGA) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 1 · Riesgos del Sistema y Oportunidades SST
- **ID Técnico (`id`):** `hito1_oportunidades_sst` · **Etiqueta Corta:** `H1: Oportunidades SST`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 1: Gobernanza y Cimiento Legal` · **Hito Oficial:** `HITO1`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de Riesgos Estratégicos y Oportunidades del SG-SST (ISO 45001 Cap. 6.1)

**Operación Técnica:** `Riesgos Estratégicos del Sistema y Oportunidades SST ISO 45001 (somos_sst: oportunidades)` · Módulo: *Hito 1 · Riesgos del Sistema y Oportunidades SST (ISO 45001)* · App ID Somos SST: `oportunidades_sst`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.4–2.2.4.6.25), Resolución 0312 de 2019, GTC-45, Res. 20223040040595 (PESV) y Decreto 1496 de 2018 (SGA).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito1_oportunidades_sst`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito1_oportunidades_sst"]` y `nodeConfigs["tool_hitos_hito1_oportunidades_sst"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Código / ID del Registro`, `Tipo de Ítem (Riesgo Estratégico del Sistema / Oportunidad de Mejora SST)`, `Proceso o Elemento del SG-SST Asociado`, `Origen (Contexto DOFA, Partes Interesadas, Auditoría, Cambio Normativo o Tecnológico)`, `Descripción Detallada del Riesgo del Sistema o de la Oportunidad SST`, `Causa Raíz o Factor Impulsor`, `Efecto Potencial sobre el Desempeño del SG-SST`, `Probabilidad de Ocurrencia / Factibilidad (Alta, Media, Baja)`, `Impacto Estratégico, Legal o Financiero (Alto, Medio, Bajo)`, `Calificación de Prioridad (Crítica, Alta, Moderada, Baja)` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Riesgos Estratégicos Críticos + Plan de Acción** — Extrae los riesgos de gestión del sistema con prioridad crítica o alta (6 campos)
  * **⚡ Oportunidades de Mejora SST + Factibilidad e Impacto** — Extrae las oportunidades estratégicas ISO 45001 para el Plan Anual (5 campos)
  * **⚡ Seguimiento de Acciones, Responsables y Estado de Cierre** — Audita el avance de los planes de riesgos y oportunidades del sistema (6 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H1: Oportunidades SST (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 1 · Riesgos del Sistema y Oportunidades SST de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 1 · Análisis de Vulnerabilidad
- **ID Técnico (`id`):** `hito6_vulnerabilidad` · **Etiqueta Corta:** `H1: Vulnerabilidad`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 1: Gobernanza y Cimiento Legal` · **Hito Oficial:** `HITO1`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos y Resultados Propios del Análisis de Vulnerabilidad por Diamante de Colores

**Operación Técnica:** `Análisis de Amenazas y Vulnerabilidad Diamante de Colores (somos_sst: vulnerabilidad)` · Módulo: *Hito 1 · Análisis de Amenazas y Vulnerabilidad (Diamante de Riesgo)* · App ID Somos SST: `vulnerabilidad`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.4–2.2.4.6.25), Resolución 0312 de 2019, GTC-45, Res. 20223040040595 (PESV) y Decreto 1496 de 2018 (SGA).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito6_vulnerabilidad`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito6_vulnerabilidad"]` y `nodeConfigs["tool_hitos_hito6_vulnerabilidad"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (19):** `Amenaza Identificada`, `Categoría de la Amenaza (Natural, Tecnológica / Antrópica o Social)`, `Origen de la Amenaza (Interno / Externo)`, `Descripción de la Fuente Generadora y Escenario de Emergencia`, `Calificación de la Amenaza (Posible = Verde / Probable = Amarillo / Inminente = Rojo)`, `Vulnerabilidad en Personas: Gestión Organizacional`, `Vulnerabilidad en Personas: Capacitación y Entrenamiento`, `Vulnerabilidad en Personas: Características de Seguridad y Dotación`, `Subtotal y Color de Vulnerabilidad en Personas (Baja / Media / Alta)`, `Vulnerabilidad en Recursos: Suministros y Equipos de Emergencia` *(+9 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Amenaza, Calificación, Nivel de Riesgo Diamante y Mitigación** — Extrae el resultado ejecutivo del Diamante de Colores por amenaza (5 campos)
  * **⚡ Desglose de los 4 Rombos (Amenaza, Personas, Recursos y Sistemas)** — Detalle completo de vulnerabilidad en Personas, Recursos y Sistemas (6 campos)
  * **⚡ Solo Amenazas de Riesgo Alto/Medio y Plan de Intervención** — Ideal para alimentar el Plan de Emergencias (PPRE) y Simulacros (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H1: Vulnerabilidad (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 1 · Análisis de Vulnerabilidad de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 1 · Plan de Emergencias y Contingencias (PPRE)
- **ID Técnico (`id`):** `hito1_plan_emergencias` · **Etiqueta Corta:** `H1: Plan Emergencias`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 1: Gobernanza y Cimiento Legal` · **Hito Oficial:** `HITO1`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Componentes Propios del Plan de Prevención, Preparación y Respuesta ante Emergencias (PPRE)

**Operación Técnica:** `Plan de Prevención, Preparación y Respuesta ante Emergencias PPRE, MEDEVAC y PONs (somos_sst: plan_emergencias)` · Módulo: *Hito 1 · Plan de Emergencias y Contingencias (PPRE)* · App ID Somos SST: `plan_emergencias`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.4–2.2.4.6.25), Resolución 0312 de 2019, GTC-45, Res. 20223040040595 (PESV) y Decreto 1496 de 2018 (SGA).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito1_plan_emergencias`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito1_plan_emergencias"]` y `nodeConfigs["tool_hitos_hito1_plan_emergencias"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (17):** `Sede / Centro de Trabajo, Dirección y Georreferenciación`, `Descripción de Instalaciones, Número de Pisos y Elementos Constructivos`, `Carga Ocupacional Fija y Flotante (Trabajadores, Contratistas, Visitantes) y Horarios`, `Inventario de Recursos Internos de Emergencia (Extintores, Botiquines, Camillas, Gabinetes, DEA)`, `Sistemas de Detección, Alerta y Alarma (Códigos Sonoros y Lumínicos)`, `Rutas de Evacuación, Salidas de Emergencia e Iluminación de Emergencia`, `Punto(s) de Encuentro Principal y Alterno`, `Estructura del Sistema Comando de Incidentes (SCI) y Comité de Emergencias`, `Organización de la Brigada de Emergencias (Evacuación, Primeros Auxilios, Contraincendios)`, `Procedimiento Operativo Normalizado (PON) — Sismo / Terremoto` *(+7 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ PONs Operativos + Rutas de Evacuación + Puntos de Encuentro** — Extrae los protocolos de respuesta inmediata y evacuación de la sede (6 campos)
  * **⚡ MEDEVAC, Centros Hospitalarios y Directorio de Emergencias** — Protocolo médico de urgencias y traslado asistencial (4 campos)
  * **⚡ Carga Ocupacional, Recursos de Emergencia y Sistemas de Alarma** — Caracterización técnica de la sede para inspecciones y simulacros (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H1: Plan Emergencias (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 1 · Plan de Emergencias y Contingencias (PPRE) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 2 · Perfiles de Cargo (Roles)
- **ID Técnico (`id`):** `hito2_perfiles_cargo` · **Etiqueta Corta:** `H2: Perfiles de Cargo`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 2: Huella Biocéntrica` · **Hito Oficial:** `HITO2`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de Perfiles de Cargo, Exigencias Biomecánicas y Profesiograma

**Operación Técnica:** `Perfiles de Cargo y Profesiograma (somos_sst: cargos)` · Módulo: *Hito 2 · Perfiles de Cargo y Profesiograma* · App ID Somos SST: `perfil_cargo`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Art. 2.2.4.6.12), Resolución 2346 de 2007 / Resolución 1843 de 2025 (Evaluaciones Médicas Ocupacionales e Historia Clínica) y Ley 1581 de 2012.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito2_perfiles_cargo`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito2_perfiles_cargo"]` y `nodeConfigs["tool_hitos_hito2_perfiles_cargo"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (20):** `Nombre del Cargo / Rol`, `Código del Cargo y Nivel Jerárquico`, `Área / Proceso y Sede`, `Cargo del Jefe Inmediato`, `Objetivo General / Misión del Cargo`, `Funciones Esenciales y Responsabilidades Operativas`, `Responsabilidades Específicas en el SG-SST (Dec. 1072 Art. 2.2.4.6.8)`, `Autoridad y Rendición de Cuentas en SST`, `Nivel Educativo y Título Requerido`, `Experiencia Mínima y Competencias Técnicas` *(+10 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cargo + Profesiograma Completo (Ingreso/Periódico) + EPP** — Cruza los exámenes médicos exigidos y la dotación de EPP por cada cargo (6 campos)
  * **⚡ Cargo + Funciones + Responsabilidades SST + Certificaciones** — Para cartas de asignación de responsabilidades SST e inducción de ingreso (5 campos)
  * **⚡ Exigencias Biomecánicas, Peligros Expuestos y Contraindicaciones** — Ideal para evaluar compatibilidad cargo-persona y reubicaciones (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H2: Perfiles de Cargo (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 2 · Perfiles de Cargo (Roles) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 2 · Perfil Sociodemográfico
- **ID Técnico (`id`):** `hito2_perfil_socio` · **Etiqueta Corta:** `H2: Sociodemográfico`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 2: Huella Biocéntrica` · **Hito Oficial:** `HITO2`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Lista Completa de Campos del Perfil Sociodemográfico (Elige solo los que necesites para no saturar)

**Operación Técnica:** `Perfil Sociodemográfico y Expedientes de Trabajadores (somos_sst: alimentar_sociodemografico_masivo)` · Módulo: *Hito 2 · Perfil Sociodemográfico y Expedientes de Trabajadores* · App ID Somos SST: `perfil_socio`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Art. 2.2.4.6.12), Resolución 2346 de 2007 / Resolución 1843 de 2025 (Evaluaciones Médicas Ocupacionales e Historia Clínica) y Ley 1581 de 2012.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito2_perfil_socio`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito2_perfil_socio"]` y `nodeConfigs["tool_hitos_hito2_perfil_socio"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (32):** `Cédula / Documento`, `Nombre Completo`, `Cargo`, `Edad`, `Género`, `Estado Civil`, `Nivel de Escolaridad`, `Fecha de Nacimiento`, `Correo Electrónico`, `Teléfono / Celular` *(+22 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Cédula y Nombre Completo** — Extrae únicamente Cédula y Nombre Completo para cruces rápidos sin saturar el flujo (2 campos)
  * **⚡ Certificados de Afiliación (Cédula, Nombre, EPS, ARL y AFP)** — Directo para auditar certificados de afiliación a seguridad social por número de cédula (7 campos)
  * **⚡ Cédula, Nombre, Cargo y Edad** — Identificación básica operativa del trabajador con cargo, edad y fecha de ingreso (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H2: Sociodemográfico (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 2 · Perfil Sociodemográfico de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 2 · Informe Condiciones de Salud
- **ID Técnico (`id`):** `hito2_condiciones_salud` · **Etiqueta Corta:** `H2: Condiciones Salud`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 2: Huella Biocéntrica` · **Hito Oficial:** `HITO2`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Lista Completa de Campos de Condiciones de Salud y Exámenes Médicos Ocupacionales (EMO)

**Operación Técnica:** `Informe de Condiciones de Salud y Exámenes Médicos Ocupacionales EMO (somos_sst: actualizar_examen_medico)` · Módulo: *Hito 2 · Informe de Condiciones de Salud y Exámenes Médicos (EMO)* · App ID Somos SST: `condiciones_salud`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Art. 2.2.4.6.12), Resolución 2346 de 2007 / Resolución 1843 de 2025 (Evaluaciones Médicas Ocupacionales e Historia Clínica) y Ley 1581 de 2012.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito2_condiciones_salud`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito2_condiciones_salud"]` y `nodeConfigs["tool_hitos_hito2_condiciones_salud"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (22):** `Cédula / Documento`, `Nombre Completo`, `Cargo`, `Edad`, `Grupo Sanguíneo y RH`, `Concepto de Aptitud Médica`, `Fecha Último Examen Médico (EMO)`, `Fecha Próximo Examen Médico`, `Diagnósticos Clínicos / CIE-10`, `Enfermedades Preexistentes` *(+12 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Cédula, Nombre y Concepto de Aptitud EMO** — Extrae solo el estado de aptitud médica y fechas de examen sin saturar (6 campos)
  * **⚡ Restricciones, Recomendaciones y Patologías** — Para seguimiento de vigilancia epidemiológica, diagnósticos CIE-10 y restricciones (7 campos)
  * **⚡ Signos Vitales, IMC y Biometría Clínica** — Extrae tensión arterial, frecuencia cardíaca, peso, talla, IMC y clasificación (9 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H2: Condiciones Salud (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 2 · Informe Condiciones de Salud de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 2 · Dictamen de Compatibilidad Cargo-Persona
- **ID Técnico (`id`):** `hito2_oraculo_predictivo` · **Etiqueta Corta:** `H2: Compatibilidad Cargo`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 2: Huella Biocéntrica` · **Hito Oficial:** `HITO2`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos, Tarjetas Preventivas, FIT Score y Brechas de «Compatibilidad Cargo-Persona»

**Operación Técnica:** `Dictamen de Compatibilidad Cargo-Persona y Aptitud Bioindividual (somos_sst: oraculo_predictivo)` · Módulo: *Hito 2 · Dictamen de Compatibilidad Cargo-Persona (Bio-Individuo)* · App ID Somos SST: `oraculo_predictivo`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Art. 2.2.4.6.12), Resolución 2346 de 2007 / Resolución 1843 de 2025 (Evaluaciones Médicas Ocupacionales e Historia Clínica) y Ley 1581 de 2012.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito2_oraculo_predictivo`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito2_oraculo_predictivo"]` y `nodeConfigs["tool_hitos_hito2_oraculo_predictivo"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (18):** `Cédula / Documento`, `Nombre Completo`, `Cargo`, `Área / Sede`, `Puntaje FIT Biocéntrico (%)`, `Estado de Compatibilidad (Óptimo / Moderado / Crítico)`, `Brechas de Compatibilidad Cargo-Persona Detectadas`, `Tarjetas Preventivas / Alertas FIT`, `Puntaje Percepción del Riesgo (pts)`, `Factor de Reducción por Cultura (%)` *(+8 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cédula, Nombre, Tarjetas Preventivas, FIT Score y Brechas** — Extrae Cédula, Nombre, Cargo, Puntaje FIT, Brechas de Compatibilidad y Tarjetas Preventivas (6 campos)
  * **⚡ FIT Score %, Compatibilidad y Restricciones por Cargo** — Cruza el puntaje FIT % con el estado de compatibilidad, limitaciones y recomendaciones (7 campos)
  * **⚡ Percepción del Riesgo y Atenuación Cultural** — Evalúa puntaje de percepción del riesgo, factor de reducción por cultura y total de riesgos (6 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H2: Compatibilidad Cargo (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 2 · Dictamen de Compatibilidad Cargo-Persona de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 3 · COPASST / Vigía de SST
- **ID Técnico (`id`):** `hito4_comites` · **Etiqueta Corta:** `H3: COPASST / Vigía`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 3: Comités, Brigadas y Gobernanza` · **Hito Oficial:** `HITO3`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos, Actas y Resultados Propios del COPASST / Vigía SST

**Operación Técnica:** `Comité Paritario de Seguridad y Salud en el Trabajo COPASST / Vigía y Actas (somos_sst: copasst)` · Módulo: *Hito 3 · COPASST / Vigía de SST (Dec. 614 y Res. 2013 de 1986)* · App ID Somos SST: `copasst`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015, Resolución 2013 de 1986 (COPASST), Ley 1010 de 2006 y Resolución 3461 de 2025 / 652 y 1356 de 2012 (Comité de Convivencia Laboral).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito4_comites`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito4_comites"]` y `nodeConfigs["tool_hitos_hito4_comites"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (19):** `Modalidad del Órgano (COPASST / Vigía de SST según N° Trabajadores)`, `Período de Vigencia del Comité (2 Años)`, `Cédula / Documento del Integrante`, `Nombre Completo y Cargo del Integrante`, `Representación (Empleador / Trabajadores)`, `Calidad del Miembro (Principal / Suplente)`, `Rol en el Comité (Presidente / Secretario / Integrante)`, `Certificado Curso Virtual 50 Horas / 20 Horas SG-SST`, `Acta de Convocatoria, Inscripción de Candidatos y Votación`, `Acta de Escrutinio y Conformación Oficial del COPASST` *(+9 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Integrantes COPASST (Cédula, Nombre, Rol y Curso 50h)** — Nómina oficial de miembros principales y suplentes del COPASST (6 campos)
  * **⚡ Última Acta Mensual + Compromisos Pendientes + Responsables** — Extrae compromisos abiertos del COPASST para seguimiento o correo (4 campos)
  * **⚡ Seguimiento de Inspecciones, ATEL y Plan Anual en COPASST** — Audita las funciones legales del Art. 11 de la Resolución 2013 de 1986 (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H3: COPASST / Vigía (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 3 · COPASST / Vigía de SST de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 3 · Comité de Convivencia Laboral
- **ID Técnico (`id`):** `hito3_cocolab` · **Etiqueta Corta:** `H3: Convivencia CCL`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 3: Comités, Brigadas y Gobernanza` · **Hito Oficial:** `HITO3`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos y Actas Propios del Comité de Convivencia Laboral (CCL)

**Operación Técnica:** `Comité de Convivencia Laboral CCL y Prevención de Acoso (somos_sst: convivencia)` · Módulo: *Hito 3 · Comité de Convivencia Laboral (CCL — Res. 652 y 1356 de 2012)* · App ID Somos SST: `cocolab`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015, Resolución 2013 de 1986 (COPASST), Ley 1010 de 2006 y Resolución 3461 de 2025 / 652 y 1356 de 2012 (Comité de Convivencia Laboral).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito3_cocolab`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito3_cocolab"]` y `nodeConfigs["tool_hitos_hito3_cocolab"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (17):** `Período de Vigencia del Comité de Convivencia (2 Años)`, `Cédula / Documento del Integrante CCL`, `Nombre Completo y Cargo del Integrante CCL`, `Representación (Empleador / Trabajadores) y Calidad (Principal / Suplente)`, `Rol en el CCL (Presidente / Secretario / Miembro)`, `Competencias Actitudinales y Comportamentales Verificadas`, `Acta de Convocatoria, Votación y Conformación del CCL`, `Reglamento Interno de Funcionamiento y Acuerdo de Confidencialidad`, `Número y Fecha de Acta de Reunión Trimestral Ordinaria / Extraordinaria`, `Verificación de Quórum y Asistencia` *(+7 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Integrantes del Comité de Convivencia (Cédula, Nombre y Rol)** — Directorio de miembros principales y suplentes del CCL y confidencialidad (5 campos)
  * **⚡ Actas Trimestrales CCL + Compromisos de Convivencia** — Extrae los acuerdos y planes preventivos del Comité de Convivencia (4 campos)
  * **⚡ Estadística de Casos Ley 1010 (Reserva Legal) y Seguimiento** — Indicadores estadísticos anonimizados de quejas y acuerdos conciliatorios (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H3: Convivencia CCL (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 3 · Comité de Convivencia Laboral de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 3 · Comité de Seguridad Vial (CSV - PESV)
- **ID Técnico (`id`):** `hito3_comite_pesv` · **Etiqueta Corta:** `H3: Comité Vial CSV`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 3: Comités, Brigadas y Gobernanza` · **Hito Oficial:** `HITO3`
- **Estado:** **🚧 En Construcción (Protegido)** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos y Actas Propios del Comité de Seguridad Vial (CSV)

**Operación Técnica:** `Comité de Seguridad Vial CSV - PESV (somos_sst: comite_pesv)` · Módulo: *Hito 3 · Comité de Seguridad Vial (CSV - PESV Res. 40595)* · App ID Somos SST: `comite_pesv`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015, Resolución 2013 de 1986 (COPASST), Ley 1010 de 2006 y Resolución 3461 de 2025 / 652 y 1356 de 2012 (Comité de Convivencia Laboral).

🚧 **Aplicativo en Construcción:** El módulo dedicado de actas del Comité de Seguridad Vial (CSV) está en despliegue. **Alternativa activa hoy:** usa `hito3_matriz_pesv` (Matriz Vial PESV), `hito3_vehiculos` (Automotores PESV) y `hito4_comites` (COPASST).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito3_comite_pesv`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Estado de Guardia Preventiva:** Este nodo está marcado con `defaultConstruction: true`. Tanto el validador estático (`validate-workflow-logic.js`) como el planificador (`automationScheduler.js`) lo omiten en `< 10ms` con estado `skipped` para impedir bloqueos o fallos en producción.
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito3_comite_pesv"]` y `nodeConfigs["tool_hitos_hito3_comite_pesv"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Nivel de Diseño e Implementación del PESV (Básico / Estándar / Avanzado)`, `Acto Administrativo de Designación del Líder del PESV y del CSV`, `Cédula / Documento del Integrante del CSV`, `Nombre Completo, Cargo y Rol en el Comité Vial`, `Número y Fecha de Acta de Reunión Trimestral del CSV`, `Verificación de Quórum y Asistencia del CSV`, `Análisis de Indicadores de Siniestralidad Vial (Tasa, Costos, Severidad)`, `Seguimiento a Comparendos, Infracciones de Tránsito y Excesos de Velocidad`, `Resultados de Inspecciones Preoperacionales Diarias y Mantenimiento de Flota`, `Estado de Vencimientos de SOAT, Revisión Técnico-Mecánica y Licencias` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Integrantes del Comité Vial y Líder del PESV (Cédula, Nombre y Rol)** — Conformación oficial de la gobernanza vial (Paso 1 y 2 Res. 40595) (4 campos)
  * **⚡ Indicadores PESV + Siniestralidad + Compromisos del Comité Vial** — Síntesis ejecutiva trimestral de seguridad vial (4 campos)
  * **⚡ Control de Flota, Preoperacionales, SOAT/RTM e Infracciones** — Seguimiento operativo de vehículos y comportamiento de conductores (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H3: Comité Vial CSV (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 3 · Comité de Seguridad Vial (CSV - PESV) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 3 · Brigada de Emergencias & Comité de Crisis (SCI)
- **ID Técnico (`id`):** `hito3_brigada_emergencias` · **Etiqueta Corta:** `H3: Brigada SCI`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 3: Comités, Brigadas y Gobernanza` · **Hito Oficial:** `HITO3`
- **Estado:** **🚧 En Construcción (Protegido)** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de la Brigada de Emergencias y Sistema Comando de Incidentes

**Operación Técnica:** `Brigada de Emergencias y Sistema Comando de Incidentes SCI (somos_sst: brigada)` · Módulo: *Hito 3 · Brigada de Emergencias & Comité de Crisis (SCI)* · App ID Somos SST: `brigada_emergencias`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015, Resolución 2013 de 1986 (COPASST), Ley 1010 de 2006 y Resolución 3461 de 2025 / 652 y 1356 de 2012 (Comité de Convivencia Laboral).

🚧 **Aplicativo en Construcción:** El gestor específico de hojas de vida de brigadistas y SCI está en actualización. **Alternativa activa hoy:** usa `hito1_plan_emergencias` (Plan de Emergencias PPRE) y el campo `esBrigadista` en `hito2_perfil_socio`.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito3_brigada_emergencias`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Estado de Guardia Preventiva:** Este nodo está marcado con `defaultConstruction: true`. Tanto el validador estático (`validate-workflow-logic.js`) como el planificador (`automationScheduler.js`) lo omiten en `< 10ms` con estado `skipped` para impedir bloqueos o fallos en producción.
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito3_brigada_emergencias"]` y `nodeConfigs["tool_hitos_hito3_brigada_emergencias"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Cédula / Documento del Brigadista`, `Nombre Completo del Brigadista`, `Cargo, Área y Sede / Centro de Trabajo`, `Teléfono / Celular de Contacto Inmediato y Grupo Sanguíneo RH`, `Unidad Operativa Asignada (Primeros Auxilios / Control de Incendios / Evacuación y Rescate)`, `Rol en el Sistema Comando de Incidentes SCI (Comandante, Oficial de Seguridad, Enlace, Información Pública, Operaciones, Logística)`, `Nivel de Formación de Brigadista (Básica / Intermedia / Especializada)`, `Certificaciones Vigentes (RCP/DEA, Manejo de Extintores, Rescate Vertical, MATPEL, SCI)`, `Aptitud Médica para Brigadista y Fecha de Último EMO`, `Turno / Horario de Cobertura en Planta o Sede` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cédula + Nombre de Brigadistas + Unidad Asignada + RH y Teléfono** — Extrae el directorio operativo de brigadistas por sede y especialidad (5 campos)
  * **⚡ Organigrama SCI (Comandante, Oficiales y Cadena de Llamadas)** — Estructura de mando del Comité de Crisis y líderes de evacuación (4 campos)
  * **⚡ Certificaciones Vigentes, Aptitud Médica y Entrenamiento** — Audita la idoneidad médica y técnica de los brigadistas activos (6 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H3: Brigada SCI (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 3 · Brigada de Emergencias & Comité de Crisis (SCI) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 4 · Matriz Bio-IPEVR
- **ID Técnico (`id`):** `hito4_bio_ipevar` · **Etiqueta Corta:** `H4: Matriz Bio-IPEVR`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 4: Evaluación Dinámica de Riesgos` · **Hito Oficial:** `HITO4`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de la Matriz Bio-IPEVR Individual

**Operación Técnica:** `Matriz Bio-IPEVR por Trabajador y Percepción Anatómica (somos_sst: peligros)` · Módulo: *Hito 4 · Matriz Bio-IPEVR (Evaluación Individual por Trabajador)* · App ID Somos SST: `peligros`.
- **Marco Legal y Normativo SG-SST:** GTC-45 (2.ª Actualización), Método Ergonómico OWAS, Estudios de Puesto de Trabajo (EPT) y Resolución 2764 de 2022 (Batería de Riesgo Psicosocial).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito4_bio_ipevar`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito4_bio_ipevar"]` y `nodeConfigs["tool_hitos_hito4_bio_ipevar"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (18):** `Cédula / Documento del Trabajador`, `Nombre Completo del Trabajador`, `Cargo, Proceso y Sede / Centro de Trabajo`, `Edad, Género y Antigüedad en el Cargo`, `Puntaje FIT Biocéntrico Individual (%)`, `Peligro Identificado en el Puesto Individual (Clasificación y Descripción)`, `Fuente Generadora y Tiempo de Exposición Diaria (Horas)`, `Efectos Posibles Cruzados con Condiciones de Salud Preexistentes`, `Sintomatología Osteomuscular, Visual o Auditiva Reportada`, `Restricciones y Recomendaciones Médicas Activas del Trabajador` *(+8 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cédula + Nombre + Peligros Bio-Individuales Críticos + Controles** — Extrae la matriz de peligros personalizada por colaborador (6 campos)
  * **⚡ Cruce Clínico: Patologías, Sintomatología y Nivel de Riesgo Amplificado** — Identifica colaboradores cuya condición de salud agrava el peligro del cargo (6 campos)
  * **⚡ Valoración Matemática Bio-GTC45 (ND, NE, NP, NC, NR y Atenuación)** — Detalle numérico del cálculo biocéntrico e inclusión en PVE (7 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H4: Matriz Bio-IPEVR (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 4 · Matriz Bio-IPEVR de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 4 · Método OWAS (Evaluación Ergonómica)
- **ID Técnico (`id`):** `hito3_owas` · **Etiqueta Corta:** `H4: Método OWAS`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 4: Evaluación Dinámica de Riesgos` · **Hito Oficial:** `HITO4`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos, Códigos Posturales y Resultados Propios del Método OWAS

**Operación Técnica:** `Evaluación Ergonómica Postural Método OWAS (somos_sst: owas)` · Módulo: *Hito 4 · Método OWAS (Evaluación Ergonómica Postural)* · App ID Somos SST: `metodo_owas`.
- **Marco Legal y Normativo SG-SST:** GTC-45 (2.ª Actualización), Método Ergonómico OWAS, Estudios de Puesto de Trabajo (EPT) y Resolución 2764 de 2022 (Batería de Riesgo Psicosocial).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito3_owas`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito3_owas"]` y `nodeConfigs["tool_hitos_hito3_owas"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (17):** `Cédula / Documento del Trabajador Evaluado`, `Nombre Completo del Trabajador Evaluado`, `Cargo, Área / Proceso y Sede`, `Fecha de Evaluación y Evaluador SST / Ergónomo`, `Tarea / Actividad Operativa y Fase de Trabajo Analizada`, `Duración del Ciclo de Trabajo y Frecuencia de Muestreo`, `Código de Posición de Espalda (1 Recta, 2 Inclinada, 3 Con Giro, 4 Inclinada con Giro)`, `Código de Posición de Brazos (1 Ambos Abajo, 2 Uno Arriba, 3 Ambos Arriba del Hombro)`, `Código de Posición de Piernas (1 Sentado, 2 De Pie, 3 Una Pierna, 4-5 Flexionadas, 6 Arrodillado, 7 Caminando)`, `Código de Carga o Fuerza Manipulada (1 ≤10 kg, 2 Entre 10-20 kg, 3 >20 kg)` *(+7 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Trabajador (Cédula/Nombre) + Código OWAS + Categoría de Riesgo (1-4)** — Extrae solo los resultados posturales críticos y nivel de acción ergonómica (6 campos)
  * **⚡ Desglose Biomecánico (Espalda, Brazos, Piernas y Carga Manipulada)** — Detalle técnico de los 4 dígitos posturales y frecuencias relativas (7 campos)
  * **⚡ Posturas Nivel 3 y 4 (Dañino/Urgente) + Rediseño de Puesto** — Filtra hallazgos ergonómicos severos y medidas correctivas inmediatas (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H4: Método OWAS (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 4 · Método OWAS (Evaluación Ergonómica) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 4 · Estudio de Puesto de Trabajo (EPT)
- **ID Técnico (`id`):** `hito3_estudio_puesto` · **Etiqueta Corta:** `H4: Estudio Puesto EPT`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 4: Evaluación Dinámica de Riesgos` · **Hito Oficial:** `HITO4`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos y Resultados Propios del Estudio de Puesto de Trabajo (EPT)

**Operación Técnica:** `Estudio de Puesto de Trabajo EPT Biomecánico con IA (somos_sst: estudio_puesto)` · Módulo: *Hito 4 · Estudio de Puesto de Trabajo (EPT Biomecánico)* · App ID Somos SST: `estudio_puesto`.
- **Marco Legal y Normativo SG-SST:** GTC-45 (2.ª Actualización), Método Ergonómico OWAS, Estudios de Puesto de Trabajo (EPT) y Resolución 2764 de 2022 (Batería de Riesgo Psicosocial).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito3_estudio_puesto`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito3_estudio_puesto"]` y `nodeConfigs["tool_hitos_hito3_estudio_puesto"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (18):** `Cédula / Documento del Trabajador Evaluado`, `Nombre Completo del Trabajador Evaluado`, `Edad, Género, Dominancia Lateral y Antigüedad en el Cargo`, `Cargo, Área / Proceso, Sede y Turno / Jornada Laboral`, `EPS, ARL y AFP del Trabajador`, `Motivo del Estudio (Calificación de Origen, Reintegro Laboral, Seguimiento a Recomendaciones, Preventivo)`, `Diagnóstico Clínico Asociado (Código CIE-10 y Descripción)`, `Restricciones y Recomendaciones Médicas Vigentes`, `Descripción del Proceso Productivo y Tareas Principales / Secundarias`, `Dimensiones del Puesto, Mobiliario, Silla, Superficie de Trabajo y Ayudas Mecánicas` *(+8 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cédula + Nombre + Diagnóstico CIE-10 + Demandas Biomecánicas + Ajustes** — Síntesis del EPT para ARL, EPS, Junta de Calificación o reubicación laboral (6 campos)
  * **⚡ Evaluación de Posturas, Repetitividad y Manipulación de Cargas** — Detalle biomecánico completo por segmento corporal y mobiliario (6 campos)
  * **⚡ Seguimiento a Reintegro Laboral y Restricciones Médicas** — Verifica la compatibilidad del puesto frente a las restricciones del EMO (6 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H4: Estudio Puesto EPT (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 4 · Estudio de Puesto de Trabajo (EPT) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 4 · Termómetro Psicosocial
- **ID Técnico (`id`):** `hito4_psicosocial` · **Etiqueta Corta:** `H4: Termómetro Psicosocial`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 4: Evaluación Dinámica de Riesgos` · **Hito Oficial:** `HITO4`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Casillas Reales MoodTelemetry e Indicadores del Termómetro Psicosocial (Res. 2764)

**Operación Técnica:** `Termómetro Psicosocial y Clima Emocional (consultar_analitica_psicosocial)` · Módulo: *Hito 4 · Termómetro Psicosocial y Clima Emocional (Res. 2764)* · App ID Somos SST: `animo`.
- **Marco Legal y Normativo SG-SST:** GTC-45 (2.ª Actualización), Método Ergonómico OWAS, Estudios de Puesto de Trabajo (EPT) y Resolución 2764 de 2022 (Batería de Riesgo Psicosocial).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito4_psicosocial`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito4_psicosocial"]` y `nodeConfigs["tool_hitos_hito4_psicosocial"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (22):** `Estado de Ánimo`, `Factores Estresores`, `Área / Departamento`, `Comentarios / Detalles`, `Canal de Reporte`, `Fecha de Registro`, `Índice Global de Bienestar y Clima Emocional (%)`, `Nivel de Riesgo Psicosocial Global (Sin Riesgo / Bajo / Medio / Alto / Muy Alto)`, `Total de Reportes Emocionales y Cobertura de Participación (%)`, `Distribución de Estados de Ánimo (Motivado, Tranquilo, Cansado, Estresado, Agotado)` *(+12 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Telemetría en Vivo (MoodTelemetry: Ánimo, Estresores, Área y Comentarios)** — Casillas exactas registradas en el Termómetro Psicosocial en tiempo real (6 campos)
  * **⚡ Índice de Bienestar + Áreas Críticas + Alertas Burnout + Plan de Intervención** — Resumen psicosocial ejecutivo respetando la reserva legal (Res. 2764) (5 campos)
  * **⚡ Los 4 Dominios Intralaborales y Factores Extralaborales (Res. 2764)** — Diagnóstico estructurado según la Batería del Ministerio del Trabajo (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H4: Termómetro Psicosocial (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 4 · Termómetro Psicosocial de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 5 · Compras y Adquisiciones en SST
- **ID Técnico (`id`):** `hito5_compras_sst` · **Etiqueta Corta:** `H5: Compras SST`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 5: Dinámica Operativa y Terreno` · **Hito Oficial:** `HITO5`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de Compras y Adquisiciones en SST

**Operación Técnica:** `Compras y Adquisiciones en SST Dec. 1072 Art. 2.2.4.6.27 (somos_sst: compras)` · Módulo: *Hito 5 · Compras y Adquisiciones con Criterio SST (Art. 2.2.4.6.27)* · App ID Somos SST: `compras_sst`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.24–2.2.4.6.28), Resolución 4272 de 2021 (Trabajo en Alturas), Decreto 1496 de 2018 (Químicos SGA) y Res. 20223040040595 (PESV).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito5_compras_sst`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito5_compras_sst"]` y `nodeConfigs["tool_hitos_hito5_compras_sst"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Código / ID de la Requisición o Ficha Técnica de Compra`, `Bien, Producto, Maquinaria, Sustancia Química o Servicio a Adquirir`, `Categoría de Adquisición (EPP, Equipos de Alturas, Sustancias Químicas, Maquinaria, Mobiliario Ergonómico, Servicios Críticos)`, `Área Solicitante y Proceso Operativo Destino`, `Peligros Asociados al Uso del Producto o Servicio`, `Especificaciones y Requisitos Técnicos de SST Exigidos`, `Normas y Certificaciones Técnicas Requeridas (ANSI, NIOSH, EN, RETIE, NTC, NFPA)`, `Exigencia de Ficha de Datos de Seguridad (FDS 16 Secciones) y Etiqueta SGA`, `Exigencia de Manual en Español, Guardas de Seguridad y Dispositivos de Parada de Emergencia`, `Criterios Ergonómicos y Límites de Emisión de Ruido / Vibración` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Producto + Requisitos Técnicos SST + Certificación Exigida** — Matriz de especificaciones SST de compra para el área de adquisiciones (4 campos)
  * **⚡ Verificación al Recibo en Almacén y Evaluación de Proveedor** — Audita qué compras cumplen o incumplen criterios SST al ingreso (5 campos)
  * **⚡ Compras de Químicos (FDS/SGA) y Maquinaria (Guardas/RETIE)** — Requisitos de seguridad industrial para insumos y equipos críticos (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H5: Compras SST (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 5 · Compras y Adquisiciones en SST de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 5 · Control y Gestión de Contratistas
- **ID Técnico (`id`):** `hito5_contratistas` · **Etiqueta Corta:** `H5: Contratistas`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 5: Dinámica Operativa y Terreno` · **Hito Oficial:** `HITO5`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de Control de Contratistas y Seguridad Social PILA

**Operación Técnica:** `Control y Gestión de Contratistas y Proveedores PILA (somos_sst: contratistas)` · Módulo: *Hito 5 · Control y Gestión de Contratistas y Proveedores* · App ID Somos SST: `contratistas_proveedores`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.24–2.2.4.6.28), Resolución 4272 de 2021 (Trabajo en Alturas), Decreto 1496 de 2018 (Químicos SGA) y Res. 20223040040595 (PESV).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito5_contratistas`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito5_contratistas"]` y `nodeConfigs["tool_hitos_hito5_contratistas"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Razón Social de la Empresa Contratista o Proveedor`, `NIT y Actividad Económica / Clase de Riesgo ARL`, `Representante Legal, Coordinador SST y Datos de Contacto`, `Objeto del Contrato, Sede de Ejecución y Vigencia Contractual`, `Nivel de Riesgo de la Actividad Contratada (TAR: Alturas, Eléctrico, Caliente, Confinados, Izaje)`, `Certificado de Autoevaluación de Estándares Mínimos Res. 0312 Emitido por ARL (%)`, `Verificación de Planilla PILA Vigente (Pago de EPS, ARL y AFP del Mes en Curso)`, `Listado Nominal de Trabajadores Destacados (Cédula, Nombre Completo y Cargo)`, `Conceptos de Aptitud Médica Ocupacional (EMO) Vigentes del Personal Contratista`, `Certificados Vigentes de Trabajo en Alturas / Tareas de Alto Riesgo` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Contratista + NIT + Planilla PILA + Certificado 0312 ARL + Estado Ingreso** — Auditoría rápida de requisitos legales antes de autorizar ingreso a sede (5 campos)
  * **⚡ Trabajadores del Contratista (Cédula, Nombre, EMO, Curso Alturas e Inducción)** — Control individual de seguridad social y competencias por trabajador externo (5 campos)
  * **⚡ Tareas de Alto Riesgo (TAR), EPP y Permisos de Trabajo del Contratista** — Supervisión operativa en campo de contratistas críticos (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H5: Contratistas (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 5 · Control y Gestión de Contratistas de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 5 · Gestión del Cambio en SST (MOC)
- **ID Técnico (`id`):** `hito5_gestion_cambio` · **Etiqueta Corta:** `H5: Gestión del Cambio`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 5: Dinámica Operativa y Terreno` · **Hito Oficial:** `HITO5`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de Gestión del Cambio (MOC)

**Operación Técnica:** `Gestión del Cambio en SST MOC Dec. 1072 Art. 2.2.4.6.26 (somos_sst: gestion_cambio)` · Módulo: *Hito 5 · Gestión del Cambio en SST (MOC — Art. 2.2.4.6.26)* · App ID Somos SST: `gestion_cambio`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.24–2.2.4.6.28), Resolución 4272 de 2021 (Trabajo en Alturas), Decreto 1496 de 2018 (Químicos SGA) y Res. 20223040040595 (PESV).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito5_gestion_cambio`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito5_gestion_cambio"]` y `nodeConfigs["tool_hitos_hito5_gestion_cambio"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Código / ID del Proceso de Gestión del Cambio (MOC)`, `Título del Cambio y Fecha de Solicitud`, `Origen y Categoría del Cambio (Interno: Infraestructura, Maquinaria, Proceso, Químicos, Estructura Organizacional / Externo: Nueva Legislación, Evolución del Conocimiento)`, `Carácter del Cambio (Permanente / Temporal / De Emergencia)`, `Área, Sede y Puestos de Trabajo Impactados`, `Descripción Detallada de la Situación Actual vs. Cambio Propuesto`, `Identificación de Nuevos Peligros y Aspectos de SST Generados por el Cambio`, `Evaluación del Nivel de Riesgo del Cambio (Alto / Medio / Bajo)`, `Impacto sobre la Matriz IPEVR GTC-45 y Procedimientos Operativos Estándar`, `Impacto sobre el Plan de Emergencias, Señalización y Equipos de Protección (EPP)` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cambio Propuesto + Nuevos Peligros + Controles Previos a Puesta en Marcha** — Extrae el análisis de impacto SST antes de autorizar el cambio (Art. 2.2.4.6.26) (5 campos)
  * **⚡ Actualización de Matriz IPEVR, Procedimientos y Capacitación por Cambio** — Verifica qué documentos y entrenamientos deben actualizarse por el MOC (5 campos)
  * **⚡ Estado de Aprobación, Responsables y Cierre de Eficacia MOC** — Seguimiento gerencial a cambios abiertos o en fase de verificación (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H5: Gestión del Cambio (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 5 · Gestión del Cambio en SST (MOC) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 5 · Análisis de Trabajo Seguro (ATS)
- **ID Técnico (`id`):** `hito3_ats` · **Etiqueta Corta:** `H5: Análisis ATS`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 5: Dinámica Operativa y Terreno` · **Hito Oficial:** `HITO5`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios del Análisis de Trabajo Seguro (ATS)

**Operación Técnica:** `Análisis de Trabajo Seguro ATS Paso a Paso (somos_sst: ats)` · Módulo: *Hito 5 · Análisis de Trabajo Seguro (ATS Paso a Paso)* · App ID Somos SST: `analisis_trabajo_seguro`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.24–2.2.4.6.28), Resolución 4272 de 2021 (Trabajo en Alturas), Decreto 1496 de 2018 (Químicos SGA) y Res. 20223040040595 (PESV).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito3_ats`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito3_ats"]` y `nodeConfigs["tool_hitos_hito3_ats"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Código / Consecutivo del ATS y Fecha de Elaboración`, `Nombre de la Tarea Crítica o No Rutinaria a Ejecutar`, `Sede, Área, Planta o Frente de Obra Exacto`, `Horario de Inicio y Finalización Autorizada`, `Permisos de Trabajo Complementarios Asociados (Alturas, Caliente, Confinados, Eléctrico, Izaje)`, `Herramientas Manuales, Eléctricas, Neumáticas y Maquinaria a Utilizar`, `Inspección Preoperacional de Herramientas y Área de Trabajo`, `Trabajadores Ejecutores (Cédula, Nombre Completo, Cargo y ARL)`, `Secuencia Ordenada de Pasos de la Tarea (Paso a Paso Operativo)`, `Peligros Identificados en Cada Paso (Físico, Mecánico, Eléctrico, Locativo, Químico, Biomecánico)` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Tarea + Trabajadores (Cédula/Nombre) + Pasos + Peligros + Controles** — Extrae el ATS operativo completo listo para validación en campo (6 campos)
  * **⚡ Herramientas, EPP Específicos y Permisos de Alto Riesgo Asociados** — Lista de chequeo de equipos y elementos de protección antes de iniciar tarea (5 campos)
  * **⚡ Nómina de Ejecutores, Supervisor SST y Plan de Emergencia en Sitio** — Verifica firmas de autorización y respuesta ante emergencias de la cuadrilla (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H5: Análisis ATS (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 5 · Análisis de Trabajo Seguro (ATS) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 5 · Permiso de Trabajo en Alturas
- **ID Técnico (`id`):** `hito3_alturas` · **Etiqueta Corta:** `H5: Permiso Alturas`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 5: Dinámica Operativa y Terreno` · **Hito Oficial:** `HITO5`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios del Permiso de Trabajo en Alturas

**Operación Técnica:** `Permiso de Trabajo en Alturas Res. 4272 (somos_sst: permiso_alturas)` · Módulo: *Hito 5 · Permiso de Trabajo en Alturas (Res. 4272 de 2021)* · App ID Somos SST: `permiso_alturas`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.24–2.2.4.6.28), Resolución 4272 de 2021 (Trabajo en Alturas), Decreto 1496 de 2018 (Químicos SGA) y Res. 20223040040595 (PESV).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito3_alturas`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito3_alturas"]` y `nodeConfigs["tool_hitos_hito3_alturas"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (17):** `Consecutivo del Permiso de Trabajo en Alturas y Fecha`, `Vigencia Horaria del Permiso (Hora Inicio y Hora Cierre)`, `Sede, Área, Estructura y Descripción Exacta de la Actividad en Alturas`, `Altura Aproximada de Trabajo (metros ≥ 2.0 m)`, `Trabajadores Autorizados (Cédula, Nombre Completo y Cargo)`, `Verificación de Vigencia de Curso de Trabajo en Alturas (Trabajador Autorizado / Reentrenamiento)`, `Verificación de Concepto de Aptitud Médica sin Restricciones para Alturas y Afiliación ARL/EPS`, `Chequeo de Condiciones de Salud Pre-Ascenso (Sin Vértigo, Consumo de Medicamentos o Alcohol)`, `Coordinador de Trabajo en Alturas (Nombre, Cédula y Certificado) y Ayudante de Seguridad`, `Sistema de Acceso Utilizado (Andamio Certificado, Escalera, Plataforma Elevadora, Cuerdas)` *(+7 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Trabajadores (Cédula/Nombre) + Curso Alturas + Aptitud Médica + Equipos** — Verifica habilitación legal de cada trabajador antes de subir a alturas (Res. 4272) (5 campos)
  * **⚡ Cálculo de Claridad, Punto de Anclaje (5000 lb), Sistema de Acceso y Rescate** — Revisión de ingeniería contra caídas y plan de rescate activo en el sitio (6 campos)
  * **⚡ Condiciones Climáticas, Riesgo Eléctrico RETIE y Estado del Permiso** — Control ambiental en vivo para autorizar o suspender labores en alturas (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H5: Permiso Alturas (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 5 · Permiso de Trabajo en Alturas de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 5 · Hoja de Vida de Equipos de Alturas
- **ID Técnico (`id`):** `hito5_equipos_alturas` · **Etiqueta Corta:** `H5: Equipos Alturas`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 5: Dinámica Operativa y Terreno` · **Hito Oficial:** `HITO5`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de Hoja de Vida de Equipos contra Caídas

**Operación Técnica:** `Hoja de Vida e Inspección de Equipos de Alturas (somos_sst: alturas)` · Módulo: *Hito 5 · Hoja de Vida e Inspección de Equipos de Alturas* · App ID Somos SST: `heights_lifecycle`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.24–2.2.4.6.28), Resolución 4272 de 2021 (Trabajo en Alturas), Decreto 1496 de 2018 (Químicos SGA) y Res. 20223040040595 (PESV).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito5_equipos_alturas`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito5_equipos_alturas"]` y `nodeConfigs["tool_hitos_hito5_equipos_alturas"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Código Interno del Equipo y Número de Serie / Lote`, `Tipo de Equipo (Arnés Multipropósito, Eslinga con Absorbedor, Eslinga de Posicionamiento, Línea de Vida, Arrestador / Freno, Mosquetón, Polea, Trípode)`, `Marca, Referencia / Modelo y Fabricante`, `Norma Técnica de Certificación (ANSI Z359 / EN 361 / CSA / OSHA)`, `Capacidad / Resistencia Nominal (kN / lb)`, `Fecha de Fabricación y Fecha de Compra / Puesta en Servicio`, `Trabajador o Cuadrilla Asignada (Cédula, Nombre Completo y Cargo)`, `Ubicación / Bodega de Almacenamiento`, `Fecha de Última Inspección Preuso y por Coordinador de Alturas`, `Fecha de Última Inspección Anual por Persona Competente / Avalada por Fabricante` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Serial + Tipo de Equipo + Próxima Inspección Anual + Estado (Apto/Baja)** — Control de vencimientos de inspección anual de equipos contra caídas (Res. 4272) (5 campos)
  * **⚡ Equipos Asignados por Trabajador (Cédula, Nombre, Serial y Norma ANSI/EN)** — Kardex de asignación de arneses y eslingas por colaborador (5 campos)
  * **⚡ Hallazgos en Reatas, Costuras, Herrajes, Etiqueta y Equipos de Baja** — Audita criterios de descarte físico o activación de indicador de impacto (6 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H5: Equipos Alturas (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 5 · Hoja de Vida de Equipos de Alturas de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 5 · Entrega y Seguimiento de EPP
- **ID Técnico (`id`):** `hito3_epp` · **Etiqueta Corta:** `H5: Entrega de EPP`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 5: Dinámica Operativa y Terreno` · **Hito Oficial:** `HITO5`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios del Kardex y Entrega de EPP por Trabajador

**Operación Técnica:** `Entrega y Seguimiento de Elementos de Protección Personal EPP (somos_sst: epp)` · Módulo: *Hito 5 · Entrega, Reposición y Seguimiento de EPP* · App ID Somos SST: `epp_delivery`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.24–2.2.4.6.28), Resolución 4272 de 2021 (Trabajo en Alturas), Decreto 1496 de 2018 (Químicos SGA) y Res. 20223040040595 (PESV).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito3_epp`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito3_epp"]` y `nodeConfigs["tool_hitos_hito3_epp"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Cédula / Documento del Trabajador`, `Nombre Completo del Trabajador`, `Cargo, Área / Proceso y Sede`, `Elemento de Protección Personal (EPP) o Dotación Entregada`, `Zona Anatómica Protegida (Cabeza, Visual/Facial, Auditiva, Respiratoria, Manos, Pies, Corporal, Caídas)`, `Peligro Asociado que Controla el EPP`, `Marca, Referencia y Norma Técnica de Certificación (ANSI / NIOSH / EN / NTC / ASTM)`, `Talla y Cantidad Entregada`, `Fecha de Entrega al Trabajador`, `Motivo de Entrega (Dotación Inicial / Reposición por Desgaste / Daño / Cambio de Cargo)` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cédula + Nombre + EPP Entregado + Fecha de Reposición y Estado** — Audita qué trabajadores tienen EPP vencidos o próximos a reposición (7 campos)
  * **⚡ Matriz Técnica de EPP por Cargo (Zona Protegida, Norma ANSI/NIOSH y Talla)** — Especificaciones técnicas y tallaje del kardex de protección personal (5 campos)
  * **⚡ Constancia de Entrega Firmada e Inspección de Uso en Campo** — Soportes legales de entrega de EPP (Ley 9 de 1979 / Dec. 1072) (6 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H5: Entrega de EPP (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 5 · Entrega y Seguimiento de EPP de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 5 · Registro y Rótulo de Productos Químicos
- **ID Técnico (`id`):** `hito5_registro_quimico` · **Etiqueta Corta:** `H5: Registro Químico`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 5: Dinámica Operativa y Terreno` · **Hito Oficial:** `HITO5`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios del Inventario y Etiquetado SGA de Químicos

**Operación Técnica:** `Inventario, FDS y Rótulo SGA de Productos Químicos (somos_sst: chemicals)` · Módulo: *Hito 5 · Inventario, FDS y Rótulo SGA de Productos Químicos* · App ID Somos SST: `chemical_registry`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.24–2.2.4.6.28), Resolución 4272 de 2021 (Trabajo en Alturas), Decreto 1496 de 2018 (Químicos SGA) y Res. 20223040040595 (PESV).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito5_registro_quimico`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito5_registro_quimico"]` y `nodeConfigs["tool_hitos_hito5_registro_quimico"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Código / ID del Producto Químico en Inventario`, `Nombre Comercial de la Sustancia o Mezcla Química`, `Nombre Químico / IUPAC y Fabricante o Proveedor`, `Número CAS y Número ONU (UN)`, `Estado Físico (Líquido, Sólido, Gas, Aerosol) y Cantidad Máxima Almacenada`, `Sede, Área Operativa de Uso y Bodega de Almacenamiento`, `Clasificación de Peligros SGA / GHS (Físicos, para la Salud y para el Medio Ambiente)`, `Pictogramas de Peligro SGA (SGA01 a SGA09) y Palabra de Advertencia (Peligro / Atención)`, `Indicaciones de Peligro (Frases H) y Consejos de Prudencia (Frases P)`, `Disponibilidad de Ficha de Datos de Seguridad (FDS de 16 Secciones en Español)` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Producto Químico + CAS + Pictogramas SGA + Vigencia FDS (<5 años) + EPP** — Revisa qué productos químicos tienen FDS vencida, sin rótulo SGA o alto riesgo (6 campos)
  * **⚡ Frases H/P, Límites TLV-TWA y Etiquetado de Envases Trasvasados** — Auditoría de higiene industrial y cumplimiento de la Resolución 773 de 2021 (5 campos)
  * **⚡ Almacenamiento Seguro, Kit de Derrames y Primeros Auxilios Químicos** — Tarjetas de emergencia química para brigadas y bodegas (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H5: Registro Químico (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 5 · Registro y Rótulo de Productos Químicos de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 5 · Hoja de Vida Automotores (PESV)
- **ID Técnico (`id`):** `hito3_vehiculos` · **Etiqueta Corta:** `H5: Automotores PESV`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 5: Dinámica Operativa y Terreno` · **Hito Oficial:** `HITO5`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios del Parque Automotor e Inspección Preoperacional PESV

**Operación Técnica:** `Hoja de Vida de Automotores e Inspección Preoperacional PESV (somos_sst: vehiculos)` · Módulo: *Hito 5 · Hoja de Vida de Automotores e Inspección PESV* · App ID Somos SST: `vehicles_pesv`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.24–2.2.4.6.28), Resolución 4272 de 2021 (Trabajo en Alturas), Decreto 1496 de 2018 (Químicos SGA) y Res. 20223040040595 (PESV).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito3_vehiculos`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito3_vehiculos"]` y `nodeConfigs["tool_hitos_hito3_vehiculos"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Placa del Vehículo o Código de Maquinaria`, `Clase de Vehículo (Automóvil, Camioneta, Camión, Motocicleta, Montacargas, Maquinaria Amarilla)`, `Vínculo con la Empresa (Propio, Leasing, Contratista, Tercero Puesto al Servicio)`, `Marca, Línea, Modelo, Color y Cilindraje`, `Conductor Asignado (Cédula, Nombre Completo y Teléfono)`, `Categoría y Fecha de Vencimiento de la Licencia de Conducción`, `Estado de Comparendos SIMIT y Exámenes Psicosensométricos del Conductor`, `Fecha de Vencimiento del SOAT`, `Fecha de Vencimiento de la Revisión Técnico-Mecánica y de Emisiones (RTM)`, `Vigencia de Póliza de Responsabilidad Civil Extracontractual / Todo Riesgo` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Placa + Conductor (Cédula/Licencia) + Vencimiento SOAT y RTM** — Alerta inmediata de documentos vehiculares o licencias vencidas (6 campos)
  * **⚡ Inspección Preoperacional Diaria, Sistemas Críticos y Vehículos Inmovilizados** — Control diario del Paso 16 y 17 del PESV (Res. 40595) (5 campos)
  * **⚡ Kilometraje, Mantenimiento Preventivo y Kit de Carretera** — Seguimiento a planes de mantenimiento preventivo y correctivo de la flota (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H5: Automotores PESV (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 5 · Hoja de Vida Automotores (PESV) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 5 · Inventario e Inspección de Equipos de Emergencia
- **ID Técnico (`id`):** `hito5_equipos_emergencia` · **Etiqueta Corta:** `H5: Equipos Emergencia`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 5: Dinámica Operativa y Terreno` · **Hito Oficial:** `HITO5`
- **Estado:** **🚧 En Construcción (Protegido)** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de Extintores, Botiquines, Camillas y Gabinetes

**Operación Técnica:** `Inventario e Inspección de Extintores, Botiquines y Camillas (somos_sst: equipos_emergencia)` · Módulo: *Hito 5 · Inventario e Inspección de Equipos de Emergencia* · App ID Somos SST: `equipos_emergencia`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Arts. 2.2.4.6.24–2.2.4.6.28), Resolución 4272 de 2021 (Trabajo en Alturas), Decreto 1496 de 2018 (Químicos SGA) y Res. 20223040040595 (PESV).

🚧 **Aplicativo en Construcción:** El inventario dedicado de extintores, gabinetes, botiquines y camillas está en consolidación. **Alternativa activa hoy:** usa `hito1_plan_emergencias` + `hito4_actos_condiciones` (Inspecciones QR en campo).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito5_equipos_emergencia`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Estado de Guardia Preventiva:** Este nodo está marcado con `defaultConstruction: true`. Tanto el validador estático (`validate-workflow-logic.js`) como el planificador (`automationScheduler.js`) lo omiten en `< 10ms` con estado `skipped` para impedir bloqueos o fallos en producción.
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito5_equipos_emergencia"]` y `nodeConfigs["tool_hitos_hito5_equipos_emergencia"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (15):** `Código / ID del Equipo de Emergencia`, `Categoría del Equipo (Extintor Portátil/Rodante, Botiquín, Camilla Rígida, DEA, Gabinete Contra Incendio, Alarma, Ducha/Lavaojos, Kit Antiderrames)`, `Clase y Agente Extintor (Multipropósito ABC, Solkaflam / Agente Limpio, CO2, Agua a Presión, Clase K)`, `Capacidad Nominal (Libras / Litros / Tipo de Botiquín A-B-C)`, `Sede, Edificio, Piso y Ubicación Exacta`, `Fecha de Última Recarga o Mantenimiento Anual`, `Fecha de Vencimiento de Recarga / Próxima Prueba Hidrostática`, `Estado de Vigencia (Vigente / Próximo a Vencer / Vencido)`, `Inspección Física de Extintor (Manómetro en Zona Verde, Pin y Sello de Seguridad, Manguera, Boquilla, Cilindro sin Golpes/Corrosión)`, `Inspección de Ubicación (Altura Reglamentaria, Señalización Visible, Acceso Libre de Obstáculos)` *(+5 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Código + Tipo (Extintor/Botiquín) + Ubicación + Fecha Vencimiento Recarga** — Detecta extintores o insumos de botiquín vencidos o próximos a vencer por sede (6 campos)
  * **⚡ Inspección Física de Extintores (Manómetro, Pin, Señalización y Acceso)** — Checklist técnico NTC 2885 / NFPA 10 de extintores en planta (5 campos)
  * **⚡ Inspección de Botiquines, Camillas, DEA y Kits Antiderrames** — Verifica insumos médicos de primeros auxilios y equipos de rescate (6 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H5: Equipos Emergencia (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 5 · Inventario e Inspección de Equipos de Emergencia de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 6 · Plan y Matriz de Comunicaciones SST
- **ID Técnico (`id`):** `hito6_comunicaciones_sst` · **Etiqueta Corta:** `H6: Comunicaciones SST`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 6: Cultura, Escuela e Innovación` · **Hito Oficial:** `HITO6`
- **Estado:** **🚧 En Construcción (Protegido)** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de la Matriz de Comunicaciones Internas y Externas SST

**Operación Técnica:** `Plan y Matriz de Comunicaciones Internas y Externas SST (somos_sst: comunicaciones)` · Módulo: *Hito 6 · Plan y Matriz de Comunicaciones SST (Art. 2.2.4.6.14)* · App ID Somos SST: `comunicaciones_sst`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Art. 2.2.4.6.11 — Capacitación SST, Art. 2.2.4.6.25 — Simulacros) y Resolución 0312 de 2019 (Eje Cultura y Formación).

🚧 **Aplicativo en Construcción:** La matriz dedicada de comunicaciones internas/externas SST está en construcción. **Alternativa activa hoy:** usa `hito5_capacitaciones` + `google_flow` + `email_report`.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito6_comunicaciones_sst`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Estado de Guardia Preventiva:** Este nodo está marcado con `defaultConstruction: true`. Tanto el validador estático (`validate-workflow-logic.js`) como el planificador (`automationScheduler.js`) lo omiten en `< 10ms` con estado `skipped` para impedir bloqueos o fallos en producción.
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito6_comunicaciones_sst"]` y `nodeConfigs["tool_hitos_hito6_comunicaciones_sst"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Código / ID del Registro de Comunicación SST`, `Tema, Campaña o Información de SST a Comunicar`, `Tipo de Comunicación (Interna / Externa / Autorreporte de Condiciones de Trabajo y Salud)`, `Dirección del Flujo (Ascendente / Descendente / Horizontal / Partes Interesadas Externas)`, `Emisor / Responsable de la Comunicación`, `Público Objetivo (Trabajadores, Contratistas, Visitantes, COPASST, Alta Dirección, ARL, MinTrabajo)`, `Canal y Medio Utilizado (Correo Electrónico, Cartelera SST, Charla de 5 Minutos, Boletín Digital, Código QR, WAPPY)`, `Frecuencia Programada y Fecha de Divulgación`, `Mecanismo de Recepción de Inquietudes, Ideas y Aportes de los Trabajadores (Art. 2.2.4.6.14 Parágrafo)`, `Aporte o Inquietud Recibida del Trabajador (Cédula, Nombre y Descripción)` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Tema SST + Público Objetivo + Canal + Fecha y Evidencia** — Resumen del plan y matriz de comunicaciones ejecutado (Art. 2.2.4.6.14) (6 campos)
  * **⚡ Recepción de Inquietudes, Autorreportes y Aportes de Trabajadores** — Audita la participación ascendente de los trabajadores y su respuesta (4 campos)
  * **⚡ Divulgación Obligatoria (Política, Peligros, RIT/RHS y Lecciones ATEL)** — Verifica la socialización de los documentos rectores del SG-SST (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H6: Comunicaciones SST (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 6 · Plan y Matriz de Comunicaciones SST de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 6 · Programa de Capacitación SG-SST
- **ID Técnico (`id`):** `hito5_capacitaciones` · **Etiqueta Corta:** `H6: Capacitaciones`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 6: Cultura, Escuela e Innovación` · **Hito Oficial:** `HITO6`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos y Resultados Propios del Programa de Capacitación SG-SST

**Operación Técnica:** `Programa Anual de Capacitación e Inducción SG-SST (somos_sst: capacitaciones)` · Módulo: *Hito 6 · Programa Anual de Capacitación, Inducción y Reinducción SG-SST* · App ID Somos SST: `capacitaciones`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Art. 2.2.4.6.11 — Capacitación SST, Art. 2.2.4.6.25 — Simulacros) y Resolución 0312 de 2019 (Eje Cultura y Formación).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito5_capacitaciones`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito5_capacitaciones"]` y `nodeConfigs["tool_hitos_hito5_capacitaciones"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Código / ID de la Actividad Formativa`, `Tema de la Capacitación, Entrenamiento, Inducción o Reinducción`, `Tipo de Formación (Inducción de Ingreso / Reinducción Anual / Capacitación Técnica / Entrenamiento Práctico)`, `Eje Temático Asociado a Peligros Prioritarios (Alturas, Vial PESV, Ergonomía, Químicos SGA, Emergencias, Psicosocial)`, `Objetivo de Aprendizaje y Contenido Temático`, `Modalidad (Presencial / Virtual Sincrónica / E-Learning LMS / En Puesto de Trabajo)`, `Duración (Horas) y Fecha Programada vs. Fecha Ejecutada`, `Capacitador, Instructor o Entidad Facilitadora (ARL, Profesional SST con Licencia, Entidad Externa)`, `Población Objetivo (Cargos / Áreas Convocadas) y Número de Convocados`, `Listado Nominal de Asistentes (Cédula, Nombre Completo, Cargo y Firma)` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Capacitaciones Pendientes + Cobertura (%) + Trabajadores Faltantes** — Identifica qué capacitaciones, inducciones o reinducciones faltan por ejecutar (6 campos)
  * **⚡ Listado de Asistentes (Cédula, Nombre y Cargo) + Evaluación de Eficacia** — Registro de asistencia y calificaciones obtenidas por sesión (4 campos)
  * **⚡ Indicadores Anuales de Capacitación (Cumplimiento, Cobertura y Aval COPASST)** — Resumen gerencial para el estándar 1.2.1 y 1.2.2 de la Resolución 0312 (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H6: Capacitaciones (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 6 · Programa de Capacitación SG-SST de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 6 · Rutas de Aprendizaje (LMS)
- **ID Técnico (`id`):** `hito6_ruta_aprendizaje` · **Etiqueta Corta:** `H6: Rutas LMS`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 6: Cultura, Escuela e Innovación` · **Hito Oficial:** `HITO6`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de Avance y Certificados en Academia WAPPY LMS

**Operación Técnica:** `Rutas de Aprendizaje y Certificación en Academia WAPPY LMS (cursos_lms)` · Módulo: *Hito 6 · Rutas de Aprendizaje y Certificación (Academia WAPPY LMS)* · App ID Somos SST: `ruta_aprendizaje`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Art. 2.2.4.6.11 — Capacitación SST, Art. 2.2.4.6.25 — Simulacros) y Resolución 0312 de 2019 (Eje Cultura y Formación).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito6_ruta_aprendizaje`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito6_ruta_aprendizaje"]` y `nodeConfigs["tool_hitos_hito6_ruta_aprendizaje"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Código / ID del Curso o Ruta de Aprendizaje LMS`, `Nombre del Curso / Ruta Formativa en Academia WAPPY`, `Categoría Técnica (Inducción SG-SST, COPASST, Convivencia, Seguridad Vial, Químicos SGA, Ergonomía, Emergencias)`, `Nivel y Duración Certificada (Horas)`, `Cédula / Documento del Trabajador Inscrito`, `Nombre Completo del Trabajador Inscrito`, `Cargo, Área / Proceso y Sede del Trabajador`, `Fecha de Inscripción y Fecha de Último Acceso`, `Módulos y Lecciones Completadas vs. Lecciones Pendientes`, `Porcentaje de Avance del Curso (%)` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cédula + Nombre + Curso LMS + % Avance + Estado de Certificación** — Verifica quiénes ya aprobaron sus cursos obligatorios en el LMS (6 campos)
  * **⚡ Trabajadores Sin Iniciar o con Cursos LMS Pendientes** — Lista de colaboradores que requieren recordatorio de formación virtual (6 campos)
  * **⚡ Calificaciones de Quizzes, Certificados Emitidos y Vigencia** — Soportes de evaluación de eficacia y certificados digitales para auditoría (6 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H6: Rutas LMS (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 6 · Rutas de Aprendizaje (LMS) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 6 · Reporte de Actos y Condiciones
- **ID Técnico (`id`):** `hito4_actos_condiciones` · **Etiqueta Corta:** `H6: Actos y Condiciones`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 6: Cultura, Escuela e Innovación` · **Hito Oficial:** `HITO6`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de Reportes de Actos y Condiciones Inseguras

**Operación Técnica:** `Reporte de Actos y Condiciones Inseguras en Campo (somos_sst: actos)` · Módulo: *Hito 6 · Reporte de Actos y Condiciones Inseguras en Campo* · App ID Somos SST: `reporte_actos`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Art. 2.2.4.6.11 — Capacitación SST, Art. 2.2.4.6.25 — Simulacros) y Resolución 0312 de 2019 (Eje Cultura y Formación).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito4_actos_condiciones`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito4_actos_condiciones"]` y `nodeConfigs["tool_hitos_hito4_actos_condiciones"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Código / ID del Reporte y Fecha/Hora de Registro`, `Canal de Captura (Código QR en Campo / Portal Trabajador / Inspección COPASST / Recorrido SST)`, `Clasificación del Hallazgo (Acto Inseguro / Condición Insegura / Casi-Accidente / Condición de Salud)`, `Peligro Asociado (Locativo, Mecánico, Eléctrico, Físico, Químico, Biomecánico, Vial, Alturas)`, `Cédula / Documento del Trabajador que Reporta`, `Nombre Completo y Cargo de Quien Reporta`, `Sede, Área, Proceso y Ubicación Exacta del Hallazgo`, `Descripción Detallada del Acto o Condición Insegura Observada`, `Evidencia Fotográfica Inicial Adjunta`, `Potencial de Severidad / Prioridad de Intervención (Crítica / Alta / Media / Baja)` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Reportes Abiertos (Prioridad Crítica/Alta) + Ubicación + Acción** — Filtra hallazgos de campo sin cerrar para gestión inmediata (7 campos)
  * **⚡ Participación de Trabajadores (Quién Reporta + Cédula + Canal QR)** — Mide la cultura de autorreporte de condiciones inseguras (Estándar 2.5.1 / 4.2.4) (5 campos)
  * **⚡ Seguimiento de Cierre, Responsables y Evidencia Antes/Después** — Verifica la eficacia de cierre de condiciones subestándar reportadas (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H6: Actos y Condiciones (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 6 · Reporte de Actos y Condiciones de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 6 · Gestión y Evaluación de Simulacros de Emergencia
- **ID Técnico (`id`):** `hito6_simulacros_emergencia` · **Etiqueta Corta:** `H6: Simulacros`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 6: Cultura, Escuela e Innovación` · **Hito Oficial:** `HITO6`
- **Estado:** **🚧 En Construcción (Protegido)** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de Planeación y Evaluación de Simulacros

**Operación Técnica:** `Planeación y Evaluación de Simulacros de Emergencia (somos_sst: simulacros)` · Módulo: *Hito 6 · Gestión y Evaluación de Simulacros de Emergencia* · App ID Somos SST: `simulacros_emergencia`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Art. 2.2.4.6.11 — Capacitación SST, Art. 2.2.4.6.25 — Simulacros) y Resolución 0312 de 2019 (Eje Cultura y Formación).

🚧 **Aplicativo en Construcción:** El evaluador cronometrado de simulacros está en habilitación. **Alternativa activa hoy:** usa `hito1_plan_emergencias` (PPRE) y `hito6_vulnerabilidad` (Análisis de Vulnerabilidad).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito6_simulacros_emergencia`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Estado de Guardia Preventiva:** Este nodo está marcado con `defaultConstruction: true`. Tanto el validador estático (`validate-workflow-logic.js`) como el planificador (`automationScheduler.js`) lo omiten en `< 10ms` con estado `skipped` para impedir bloqueos o fallos en producción.
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito6_simulacros_emergencia"]` y `nodeConfigs["tool_hitos_hito6_simulacros_emergencia"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (17):** `Código / Consecutivo del Simulacro y Fecha / Hora de Ejecución`, `Tipo de Simulacro (Avisado / No Avisado — Escritorio / Parcial / Evacuación Total)`, `Escenario de Amenaza Simulado (Sismo, Incendio, Fuga Química, Explosión, Atención de Lesionado)`, `Sede, Edificio y Áreas Participantes`, `Guion Técnico y Objetivos Específicos del Simulacro`, `Total de Personas Evacuadas (Trabajadores, Contratistas y Visitantes)`, `Personas que No Evacuaron y Causa Identificada`, `Tiempo de Detección y Activación de la Alarma`, `Tiempo de Salida del Primer y Último Evacuado`, `Tiempo Total de Llegada y Conteo en el Punto de Encuentro (Minutos y Segundos)` *(+7 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Escenario + Evacuados + Tiempo de Respuesta + Oportunidades de Mejora** — Síntesis del informe anual de simulacro (Art. 2.2.4.6.25 Num. 10) (6 campos)
  * **⚡ Tiempos de Evacuación, Alarma, Rutas y Desempeño de la Brigada** — Métricas operativas de respuesta y tiempos por fase del ejercicio (5 campos)
  * **⚡ Plan de Acción Post-Simulacro y Acta Oficial Firmada** — Compromisos de mejora continua del Plan de Emergencias tras el simulacro (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H6: Simulacros (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 6 · Gestión y Evaluación de Simulacros de Emergencia de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 6 · Creador de Aplicativos (App Builder)
- **ID Técnico (`id`):** `hito6_app_builder` · **Etiqueta Corta:** `H6: App Builder`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 6: Cultura, Escuela e Innovación` · **Hito Oficial:** `HITO6`
- **Estado:** **🚧 En Construcción (Protegido)** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos del Micro-Aplicativo Personalizado SST

**Operación Técnica:** `Creador de Micro-Aplicativos y Formularios SST (somos_sst: app_builder)` · Módulo: *Hito 6 · Creador de Aplicativos y Formularios SST (App Builder)* · App ID Somos SST: `app_builder`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Art. 2.2.4.6.11 — Capacitación SST, Art. 2.2.4.6.25 — Simulacros) y Resolución 0312 de 2019 (Eje Cultura y Formación).

🚧 **Aplicativo en Construcción:** El generador visual de micro-aplicativos personalizados está en fase beta cerrada. **Alternativa activa hoy:** usa `canvas_doc` (LiveEditor) y `hito7_acpm`.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito6_app_builder`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Estado de Guardia Preventiva:** Este nodo está marcado con `defaultConstruction: true`. Tanto el validador estático (`validate-workflow-logic.js`) como el planificador (`automationScheduler.js`) lo omiten en `< 10ms` con estado `skipped` para impedir bloqueos o fallos en producción.
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito6_app_builder"]` y `nodeConfigs["tool_hitos_hito6_app_builder"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Código / ID del Micro-Aplicativo o Formulario Personalizado`, `Nombre del Micro-Aplicativo / Inspección Digital Creada`, `Categoría Operativa (Inspección Locativa, Maquinaria, Herramientas, Orden y Aseo 5S, Pausas Activas, Encuesta SST)`, `Sede y Proceso al que Aplica`, `Estructura de Campos y Preguntas Configuradas en el Formulario`, `Criterios de Calificación y Ponderación de Cumplimiento (%)`, `Enlace Público / Código QR de Captura en Terreno`, `Total de Registros e Inspecciones Recibidas`, `Fecha y Usuario / Trabajador del Último Registro (Cédula y Nombre)`, `Tabulación de Respuestas y Puntaje Promedio de Cumplimiento (%)` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Aplicativo Personalizado + Registros Recibidos + Hallazgos Críticos** — Extrae los resultados y hallazgos de las inspecciones personalizadas creadas (5 campos)
  * **⚡ Ítems No Conformes, Evidencias y Acciones Correctivas hacia ACPM** — Conecta los formularios personalizados con planes de acción correctiva (5 campos)
  * **⚡ Diseño del Formulario, Campos Capturados y Últimos Reportantes** — Detalle de estructura y trazabilidad de usuarios que diligencian la app (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H6: App Builder (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 6 · Creador de Aplicativos (App Builder) de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 7 · Gestión Integral de Ausentismo & ATEL
- **ID Técnico (`id`):** `hito7_estadisticas_atel` · **Etiqueta Corta:** `H7: Ausentismo y ATEL`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 7: Auditoría, Causalidad y Mejora` · **Hito Oficial:** `HITO7`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Indicadores Oficiales Res. 0312 Art. 30 y Registros de Ausentismo

**Operación Técnica:** `Estadísticas de Ausentismo e Indicadores ATEL Res. 0312 Art. 30 (somos_sst: estadisticas)` · Módulo: *Hito 7 · Gestión Integral de Ausentismo e Indicadores ATEL (Res. 0312 Art. 30)* · App ID Somos SST: `estadisticas`.
- **Marco Legal y Normativo SG-SST:** Resolución 1401 de 2007 (Investigación ATEL), Decreto 1072 de 2015 (Arts. 2.2.4.6.29–2.2.4.6.34 — Auditoría, Revisión Alta Dirección y ACPM) y Res. 0312 Art. 30.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito7_estadisticas_atel`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito7_estadisticas_atel"]` y `nodeConfigs["tool_hitos_hito7_estadisticas_atel"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (17):** `Período / Mes y Año Analizado`, `Número Promedio de Trabajadores en el Período y Horas Hombre Trabajadas (HHT)`, `Número de Accidentes de Trabajo (AT) en el Período y Acumulado Anual`, `Días de Incapacidad por Accidente de Trabajo + Días Cargados`, `Frecuencia de Accidentalidad (N° AT en el mes / N° Trabajadores x 100)`, `Severidad de Accidentalidad (Días de incapacidad por AT + días cargados / N° Trabajadores x 100)`, `Proporción de Accidentes de Trabajo Mortales (%)`, `Prevalencia de la Enfermedad Laboral (Casos nuevos y antiguos EL / Trabajadores x 100.000)`, `Incidencia de la Enfermedad Laboral (Casos nuevos EL / Trabajadores x 100.000)`, `Ausentismo por Causa Médica (Días de ausencia por incapacidad laboral o común / Días programados x 100)` *(+7 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Los 6 Indicadores Mínimos Obligatorios Res. 0312 Art. 30** — Frecuencia, Severidad, Mortalidad, Prevalencia, Incidencia y Ausentismo (7 campos)
  * **⚡ Cédula + Nombre + Diagnóstico CIE-10 + Días de Incapacidad y Prórrogas** — Listado nominal de trabajadores con incapacidades o ausentismo prolongado (5 campos)
  * **⚡ Análisis Epidemiológico, HHT, ILI y Plan de Control de Ausentismo** — Tendencias por sistema corporal, costos y acciones preventivas (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H7: Ausentismo y ATEL (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 7 · Gestión Integral de Ausentismo & ATEL de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 7 · Investigación ATEL
- **ID Técnico (`id`):** `hito7_investigacion_atel` · **Etiqueta Corta:** `H7: Investigación ATEL`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 7: Auditoría, Causalidad y Mejora` · **Hito Oficial:** `HITO7`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos, Causalidad y Plan de Acción Propios de Investigación ATEL

**Operación Técnica:** `Investigación de Accidentes e Incidentes ATEL Árbol de Causas / Ishikawa (somos_sst: registrar_accidente_atel)` · Módulo: *Hito 7 · Investigación de Accidentes e Incidentes de Trabajo (Res. 1401 de 2007)* · App ID Somos SST: `investigacion_atel`.
- **Marco Legal y Normativo SG-SST:** Resolución 1401 de 2007 (Investigación ATEL), Decreto 1072 de 2015 (Arts. 2.2.4.6.29–2.2.4.6.34 — Auditoría, Revisión Alta Dirección y ACPM) y Res. 0312 Art. 30.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito7_investigacion_atel`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito7_investigacion_atel"]` y `nodeConfigs["tool_hitos_hito7_investigacion_atel"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (18):** `Código / ID del Caso y Número de Radicado FURAT / FUREL`, `Clasificación del Evento (Incidente / Accidente Leve / Accidente Grave Res. 1401 / Mortal)`, `Fecha del Evento,Fecha de Investigación (Plazo Legal ≤ 15 Días Calendario)`, `Cédula / Documento del Trabajador Accidentado`, `Nombre Completo, Edad, Cargo, Antigüedad, EPS y ARL del Trabajador`, `Sede, Área, Turno, Hora Exacta y Lugar del Evento`, `Descripción Detallada y Relato Cronológico del Evento`, `Naturaleza de la Lesión y Parte del Cuerpo Afectada (Codificación ANSI Z16.2)`, `Agente del Accidente y Mecanismo o Forma del Accidente`, `Días de Incapacidad Iniciales y Prórrogas Generadas` *(+8 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Trabajador (Cédula/Nombre) + Evento + Causas Básicas/Inmediatas + Plan de Acción** — Síntesis completa de la investigación conforme a la Resolución 1401 de 2007 (6 campos)
  * **⚡ Caracterización Técnica ANSI Z16.2 (Lesión, Parte Afectada, Agente y Mecanismo)** — Variables clínicas y operativas del FURAT e incapacidades generadas (6 campos)
  * **⚡ Cumplimiento Legal Res. 1401 (Plazo 15 Días, Equipo Investigador y Lección Aprendida)** — Audita la firma del equipo investigador, remisión a ARL y cierre de medidas (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H7: Investigación ATEL (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 7 · Investigación ATEL de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 7 · Tablero Kanban ACPM
- **ID Técnico (`id`):** `hito7_acpm` · **Etiqueta Corta:** `H7: Tablero ACPM`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 7: Auditoría, Causalidad y Mejora` · **Hito Oficial:** `HITO7`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios del Centro de Control Kanban ACPM

**Operación Técnica:** `Tablero Kanban de Acciones Correctivas, Preventivas y de Mejora ACPM (somos_sst: crear_actividad_acpm)` · Módulo: *Hito 7 · Tablero Kanban de Acciones Correctivas, Preventivas y de Mejora (ACPM)* · App ID Somos SST: `control_acpm`.
- **Marco Legal y Normativo SG-SST:** Resolución 1401 de 2007 (Investigación ATEL), Decreto 1072 de 2015 (Arts. 2.2.4.6.29–2.2.4.6.34 — Auditoría, Revisión Alta Dirección y ACPM) y Res. 0312 Art. 30.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito7_acpm`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito7_acpm"]` y `nodeConfigs["tool_hitos_hito7_acpm"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Código / ID de la Acción ACPM y Fecha de Apertura`, `Fuente del Hallazgo (Auditoría Anual, Diagnóstico 0312, Investigación ATEL, COPASST, Inspección de Campo, Revisión Alta Dirección, PVE)`, `Hito y Aplicativo de Origen Vinculado`, `Tipo de Acción (Acción Correctiva / Acción Preventiva / Acción de Mejora)`, `Prioridad / Criticidad del Hallazgo (Crítica / Alta / Media / Baja)`, `Descripción Detallada del Hallazgo o No Conformidad Detectada`, `Metodología y Análisis de Causa Raíz (5 Porqués / Ishikawa)`, `Descripción del Plan de Acción y Actividades Específicas a Ejecutar`, `Responsable de Ejecución (Nombre y Cargo)`, `Recursos Humanos, Técnicos y Financieros Asignados` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Solo Acciones ACPM Abiertas o Vencidas + Responsable + Fecha Límite** — Ideal para recordatorios automáticos de tareas pendientes por correo (7 campos)
  * **⚡ Análisis de Causa Raíz, Tipo de Acción (AC/AP/AM) y Recursos** — Detalle metodológico del artículo 2.2.4.6.33 y 2.2.4.6.34 del Decreto 1072 (6 campos)
  * **⚡ Verificación de Cierre, Evidencias y Eficacia de Acciones ACPM** — Audita las acciones cerradas y su efectividad real en el SG-SST (6 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H7: Tablero ACPM (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 7 · Tablero Kanban ACPM de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 7 · Informe de Auditoría SG-SST
- **ID Técnico (`id`):** `hito7_auditoria` · **Etiqueta Corta:** `H7: Auditoría SG-SST`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 7: Auditoría, Causalidad y Mejora` · **Hito Oficial:** `HITO7`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos, Hallazgos y No Conformidades del Informe de Auditoría SG-SST

**Operación Técnica:** `Informe de Auditoría Anual del SG-SST (somos_sst: auditoria)` · Módulo: *Hito 7 · Informe de Auditoría Anual del SG-SST (Art. 2.2.4.6.29 y 2.2.4.6.30)* · App ID Somos SST: `auditoria`.
- **Marco Legal y Normativo SG-SST:** Resolución 1401 de 2007 (Investigación ATEL), Decreto 1072 de 2015 (Arts. 2.2.4.6.29–2.2.4.6.34 — Auditoría, Revisión Alta Dirección y ACPM) y Res. 0312 Art. 30.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito7_auditoria`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito7_auditoria"]` y `nodeConfigs["tool_hitos_hito7_auditoria"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (17):** `Código / Ciclo Anual de Auditoría y Fecha de Ejecución`, `Programa y Plan de Auditoría Anual Aprobado`, `Equipo Auditor (Auditor Líder, Idoneidad/Licencia y Participación Obligatoria del COPASST / Vigía)`, `Alcance de la Auditoría: Evaluación de los 22 Numerales del Art. 2.2.4.6.30 (Decreto 1072)`, `Verificación de Cumplimiento de la Política de SST y Objetivos`, `Resultado de los Indicadores de Estructura, Proceso y Resultado`, `Evaluación de la Participación de los Trabajadores y Funcionamiento del COPASST / CCL`, `Evaluación de la Gestión de Peligros, Riesgos y Medidas de Prevención y Control`, `Evaluación del Plan de Emergencias, Capacitación, Contratistas y Gestión del Cambio`, `Evaluación de Investigaciones ATEL y Cierre de Auditorías Anteriores` *(+7 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ No Conformidades (Mayores/Menores) + Observaciones + Plan de Cierre ACPM** — Extrae únicamente los hallazgos abiertos de la auditoría anual (5 campos)
  * **⚡ Evaluación de los 22 Puntos de Alcance Legal (Art. 2.2.4.6.30 Dec. 1072)** — Revisión sistemática de todos los elementos obligatorios de auditoría (5 campos)
  * **⚡ Resumen Ejecutivo de Auditoría, Equipo Auditor, COPASST y % Conformidad** — Síntesis del dictamen de auditoría para la Revisión por la Alta Dirección (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H7: Auditoría SG-SST (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 7 · Informe de Auditoría SG-SST de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 7 · Revisión por la Alta Dirección
- **ID Técnico (`id`):** `hito7_alta_direccion` · **Etiqueta Corta:** `H7: Alta Dirección`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 7: Auditoría, Causalidad y Mejora` · **Hito Oficial:** `HITO7`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos y Decisiones Gerenciales de la Revisión por la Alta Dirección

**Operación Técnica:** `Revisión Anual por la Alta Dirección de 22 Puntos (somos_sst: alta_direccion)` · Módulo: *Hito 7 · Revisión por la Alta Dirección (24 Ítems Dec. 1072 Art. 2.2.4.6.31)* · App ID Somos SST: `alta_direccion`.
- **Marco Legal y Normativo SG-SST:** Resolución 1401 de 2007 (Investigación ATEL), Decreto 1072 de 2015 (Arts. 2.2.4.6.29–2.2.4.6.34 — Auditoría, Revisión Alta Dirección y ACPM) y Res. 0312 Art. 30.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito7_alta_direccion`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito7_alta_direccion"]` y `nodeConfigs["tool_hitos_hito7_alta_direccion"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (17):** `Fecha de la Revisión Anual y Período Evaluado`, `Representante Legal y Directivos Participantes en la Revisión`, `Verificación de los 24 Aspectos Obligatorios del Art. 2.2.4.6.31 (Decreto 1072 de 2015)`, `Cumplimiento de la Política y los Objetivos del SG-SST`, `Cumplimiento del Plan de Trabajo Anual en SST y su Cronograma (%)`, `Ejecución del Presupuesto y Suficiencia de Recursos Financieros, Técnicos y Humanos`, `Resultado de los Indicadores de Estructura, Proceso y Resultado (Art. 30 Res. 0312)`, `Adecuación de la Identificación de Peligros, Evaluación de Riesgos y Controles (IPEVR)`, `Gestiones y Resultados del COPASST / Vigía y del Comité de Convivencia Laboral (CCL)`, `Investigación de Incidentes, Accidentes de Trabajo y Enfermedades Laborales (ATEL)` *(+7 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Evaluación de los 24 Ítems + Decisiones Gerenciales + Presupuesto Aprobado** — Resumen gerencial para el Representante Legal y COPASST (Art. 2.2.4.6.31) (5 campos)
  * **⚡ Balance de Indicadores ATEL, Ausentismo, PVE, Auditorías y ACPM** — Desempeño técnico y epidemiológico presentado a la gerencia (5 campos)
  * **⚡ Acta Firmada por Representante Legal y Comunicación al COPASST** — Soporte documental de cierre del ciclo PHVA (Estándar 1.1.1 / 3.1.1) (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H7: Alta Dirección (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 7 · Revisión por la Alta Dirección de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 7 · Investigación Profunda SST
- **ID Técnico (`id`):** `hito7_investigacion_profunda` · **Etiqueta Corta:** `H7: Investigación Profunda`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 7: Auditoría, Causalidad y Mejora` · **Hito Oficial:** `HITO7`
- **Estado:** **🚧 En Construcción (Protegido)** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos Propios de Investigación Jurídica y Técnica Profunda SST

**Operación Técnica:** `Investigación Profunda de Doctrina y Jurisprudencia SST (somos_sst: investigacion_profunda)` · Módulo: *Hito 7 · Investigación Profunda de Doctrina y Jurisprudencia SST* · App ID Somos SST: `investigacion_profunda`.
- **Marco Legal y Normativo SG-SST:** Resolución 1401 de 2007 (Investigación ATEL), Decreto 1072 de 2015 (Arts. 2.2.4.6.29–2.2.4.6.34 — Auditoría, Revisión Alta Dirección y ACPM) y Res. 0312 Art. 30.

🚧 **Aplicativo en Construcción:** El motor doctrinal de jurisprudencia profunda SST está en integración con cuadernos RAG. **Alternativa activa hoy:** usa `notebooklm` + `web_search` + `hito7_auditoria`.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito7_investigacion_profunda`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Estado de Guardia Preventiva:** Este nodo está marcado con `defaultConstruction: true`. Tanto el validador estático (`validate-workflow-logic.js`) como el planificador (`automationScheduler.js`) lo omiten en `< 10ms` con estado `skipped` para impedir bloqueos o fallos en producción.
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito7_investigacion_profunda"]` y `nodeConfigs["tool_hitos_hito7_investigacion_profunda"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Código / ID del Expediente o Consulta Jurídico-Técnica`, `Título y Problema Jurídico / Técnico Investigado en SST`, `Contexto Fáctico del Caso en la Empresa (Trabajador, Cargo, Evento o Hallazgo)`, `Normativa Colombiana Vigente Aplicable (Leyes, Decretos, Resoluciones y Circulares MinTrabajo)`, `Jurisprudencia de la Corte Constitucional (Estabilidad Laboral Reforzada, Debilidad Manifiesta, Reubicación)`, `Jurisprudencia de la Corte Suprema de Justicia — Sala Laboral (Culpa Patronal Art. 216 CST, Carga de la Prueba)`, `Conceptos Técnicos y Doctrina Oficial del Ministerio del Trabajo y ARL`, `Estándares Técnicos Internacionales de Referencia (OIT, ISO 45001, NIOSH, OSHA, NFPA)`, `Análisis de Responsabilidad Laboral (Prestaciones Tarifadas ARL)`, `Análisis de Responsabilidad Civil y Culpa Patronal (Indemnización Total y Ordinaria de Perjuicios)` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Caso Investigado + Normativa y Sentencias (Corte Constitucional/CSJ) + Dictamen** — Concepto jurídico-técnico fundamentado en jurisprudencia colombiana (5 campos)
  * **⚡ Matriz deLas 4 Responsabilidades en SST (Laboral, Civil, Administrativa y Penal)** — Evaluación del nivel de exposición legal del empleador y representante legal (5 campos)
  * **⚡ Auditoría Probatoria, Brechas de Defensa y Plan de Blindaje Documental** — Identifica qué soportes faltan para defender a la empresa ante MinTrabajo o jueces (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H7: Investigación Profunda (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 7 · Investigación Profunda SST de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

### Hito 8 · Centro de Inteligencia Predictiva
- **ID Técnico (`id`):** `hito8_predictivo` · **Etiqueta Corta:** `H8: Oráculo Predictivo`
- **Familia:** 6. Aplicativos de los 8 Hitos de Somos SST (50 Módulos) · **Categoría:** `Hito 8: Inteligencia Artificial & Oráculo Predictivo` · **Hito Oficial:** `HITO8`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Indicadores, Gemelo Digital, Radares y Alertas del Centro de Inteligencia Predictiva

**Operación Técnica:** `Centro de Inteligencia Predictiva, Gemelo Digital y Radar de 9 Dominios (somos_sst: predictivo)` · Módulo: *Hito 8 · Centro de Inteligencia Predictiva y Gemelo Digital SST* · App ID Somos SST: `predictivo`.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Mejora Continua y Vigilancia Epidemiológica Predictiva) e ISO 45001:2018 (§6.1 / §9.1).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Opera en **2 posiciones causales oficiales** según `hitoRole` (prohibido `target_write_report` post-agente):
  1. **Etapa 2 (`hitoRole: "source_read"`, caja cuadrada a la izquierda del IF):** cuando lee brechas, vencimientos o censos estructurados de la empresa activa.
  2. **Puerto `◆ Herramienta +` (`hitoRole: "agent_tool"`, nodo circular debajo del Agente IA):** cuando el Agente IA consulta contexto cruzado, registra/actualiza expedientes o emite el Informe Oficial HTML del aplicativo.
- **Puertos de Conexión:** En `source_read`: ● Entrada Izquierda (Disparador) y ● Salida Derecha (hacia Merge / Condición Si/No) · En `agent_tool`: ◆ Conexión Superior hacia el rombo `Herramienta +` del Agente IA (`tool_hitos_hito8_predictivo`)
- **Canales de Invocación:** Sincronizado bidireccionalmente con **Somos SST** (empresa activa `companyId`), ejecutable desde `/tareas`, Inspector en Vivo de 3 Paneles y órdenes de Tenshi.

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Elegir Rol en el Lienzo (`hitoRole`):** Configura espejo en `nodeConfigs["hito8_predictivo"]` y `nodeConfigs["tool_hitos_hito8_predictivo"]`:
  * `"source_read"` + `appActionMode: "read_only"` para auditar registros en Etapa 2.
  * `"agent_tool"` + `appActionMode: "read_only" | "write_and_update" | "write_and_report" | "generate_report"` para conectarlo en `◆ Herramienta +`.
- **2. Filtro de Registros (`recordFilterMode`):** Usa `"critical_only"` (solo brechas/alertas), `"expiry_only"` (vencimientos `<= 30` días), `"name_lookup_only"` (búsqueda puntual por nombre sin escanear toda la nómina) o `"all"`.
- **3. Selección Quirúrgica de Campos (`selectedFields` / `strictFieldFilter`):** Marca únicamente las columnas necesarias para ahorrar tokens y mantener tablas homogéneas.
- **Casillas / Campos Reales Disponibles (16):** `Score Global de Salud y Blindaje Predictivo del SG-SST (0-100%)`, `Estado del Gemelo Digital SST en Vivo y Nivel de Madurez Global (Óptimo / Preventivo / Alerta / Crítico)`, `Radar de los 9 Dominios del SG-SST (Gobernanza 0312, Salud/EMO, Ergonómico, Psicosocial, Seguridad Vial PESV, Químico SGA, Trabajo en Alturas, Emergencias, Auditoría/ACPM)`, `Dominios con Mayor Vulnerabilidad o Deterioro Detectado`, `Cédula y Nombre Completo de Trabajadores en Alerta Predictiva`, `Cargo, Área y Puntaje FIT Biocéntrico del Trabajador en Alerta (%)`, `Alertas de Riesgo Letal / Crítico por Cruce Clínico-Operativo (Ej. Vértigo/HTA en Alturas o Conducción)`, `Alertas de Choque Osteomuscular por Cruce entre Restricciones Médicas, OWAS y Demandas del Cargo`, `Índice de Fatiga Laboral, Riesgo Cardiovascular y Metabólico (IMC)`, `Alertas de Riesgo Psicosocial y Probabilidad de Ausentismo Recurrente` *(+6 campos adicionales en el Inspector)*.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Alertas Letales y Clínicas por Trabajador (Cédula + Nombre + Cargo + Cruce)** — Extrae los cruces predictivos de alto riesgo individual en toda la empresa (5 campos)
  * **⚡ Gemelo Digital + Score Global % + Radar de 9 Dominios + Brechas Críticas** — Diagnóstico ejecutivo 360° del Gemelo Digital SST (5 campos)
  * **⚡ Índice de Fatiga, Predicción de Siniestralidad y Vencimientos Críticos** — Consolidado predictivo de fatiga, siniestralidad ATEL y vencimientos de los 8 Hitos (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** En modo `source_read`, lee directamente la colección Mongoose del aplicativo filtrada por `companyId`. En modo `agent_tool`, recibe además los parámetros estructurados decididos por el Agente IA (ej. filas del Extractor IA Docs).
- **Salida (`OUTPUT`):** En lectura, tabla homogénea de registros y conteo de brechas críticas (`freshCriticalCount`). En escritura/reporte (`write_and_report` / `generate_report`), actualiza el expediente real en **Somos SST** y emite el **Informe Oficial HTML** con cabezote empresarial y firmas (`req._generatedAppReports`).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [H8: Oráculo Predictivo (source_read)] ──▶ [Condición Si/No (pre_agent + Anti-Duplicados)] ──(SÍ)──▶ [Agente IA + ◆ Herramienta +] ──▶ [Centro de Control ACPM + Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, audita los registros críticos y vencimientos en Hito 8 · Centro de Inteligencia Predictiva de mi empresa activa y dime qué acciones preventivas debemos ejecutar.»

---

## 7. Bitácora, Informes Oficiales y Salidas

> Despachan los hallazgos verificados y certificados adjuntos hacia correo Gmail/SMTP, campana y chat de Tenshi, tablero Kanban ACPM, LiveEditor con cabezote y firmas, Google Docs/Sheets/Slides/Calendar o Antigravity.

### Enviar Bitácora Completa a Gmail / Correo Electrónico
- **ID Técnico (`id`):** `email_report` · **Etiqueta Corta:** `Bitácora a Gmail`
- **Familia:** 7. Bitácora, Informes Oficiales y Salidas · **Categoría:** `output`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Secciones y Tablas a Incluir en la Bitácora Enviada por Correo Electrónico

**Operación Técnica:** `Envía una bitácora ejecutiva detallada en Markdown con tablas de todo lo realizado al correo electrónico (Gmail / SMTP)` · Módulo: *📤 Salida · Enviar Bitácora Completa a Gmail / Correo Electrónico*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna Final Derecha (Etapa 6) — Despacho gobernado por la rama activa (`ifBranch: "yes"` | `"no"` o flujo directo)
- **Puertos de Conexión:** ● Entrada Izquierda (desde Agente IA, Condición Si/No o Aprobación Humana)
- **Canales de Invocación:** Ejecutado por `executeDownstreamOutputs` en corridas programadas `/tareas` y entregas instantáneas en el chat de Tenshi (en modo Sandbox Play se simula con `dryRun: true` sin enviar correos reales).

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Rama de Ejecución (`ifBranch`):** En flujos con `Condición Si/No`, declara `nodeConfigs["out_email_report"] = { ifBranch: "yes" }` (o `"no"` exclusivamente para `wappy_notification`; prohibido poner `acpm_task` en `"no"`).
- **2. Adjuntos Oficiales:** Recibe e incluye automáticamente la bandeja dedicada `evidenceFiles` (certificados `%PDF`/`.PNG`) y los Informes Oficiales HTML generados por aplicativos Hito.
- **Casillas / Campos Reales Disponibles (9):** `Asunto Ejecutivo con Razón Social, NIT y Nivel de Alerta`, `Resumen Gerencial de Hallazgos y KPIs Procesados`, `Tabla Nominal de Trabajadores (Cédula, Nombre, Cargo y Novedad)`, `Tabla de Certificados o Soportes Vencidos / Faltantes`, `Detalle de Cambios Guardados en los Aplicativos de Somos SST`, `Fundamentación Normativa Aplicada (Dec. 1072 / Res. 0312)`, `Plan de Acción Recomendado con Responsables y Fechas Límite`, `Destinatarios (Responsable SST, Representante Legal, COPASST o RRHH)`, `Formato HTML Corporativo WAPPY con Tablas Estilizadas`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Resumen Ejecutivo + Tabla por Cédula/Nombre + Plan de Acción** — Correo gerencial limpio con hallazgos puntuales y responsables (4 campos)
  * **⚡ Bitácora de Auditoría Completa + Cambios en Somos SST + Base Legal** — Informe exhaustivo de todo lo leído y actualizado en la corrida (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Dictamen final en Markdown del Agente IA (`resultText`), rama activa (`yes`/`no`/`direct`), bandeja `evidenceFiles` (`%PDF`/`.PNG`) e Informes Oficiales HTML generados.
- **Salida (`OUTPUT`):** Entrega efectiva en el canal destino (correo enviado con adjuntos, tarjeta en campana/chat de Tenshi, tarea creada en `KanbanTask` con enums oficiales, documento `LiveEditor` o enlace `workspaceLinks` de Google Docs/Sheets/Slides/Calendar).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Diagnóstico Res. 0312] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Tablero ACPM] ──▶ [Bitácora a Gmail]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, configura la salida Bitácora a Gmail en la Rama SÍ para recibir los informes verificados de mi empresa.»

---

### Enviar Notificación Directa en WAPPY + Chat de Tenshi
- **ID Técnico (`id`):** `wappy_notification` · **Etiqueta Corta:** `Notificar en WAPPY`
- **Familia:** 7. Bitácora, Informes Oficiales y Salidas · **Categoría:** `output`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Elementos a Entregar en la Campana de WAPPY y en el Chat de Tenshi

**Operación Técnica:** `Envía una notificación directa a la campana de WAPPY y al chat de Tenshi IA con el resumen de la bitácora` · Módulo: *📤 Salida · Notificación Directa en WAPPY + Chat de Tenshi IA*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna Final Derecha (Etapa 6) — Despacho gobernado por la rama activa (`ifBranch: "yes"` | `"no"` o flujo directo)
- **Puertos de Conexión:** ● Entrada Izquierda (desde Agente IA, Condición Si/No o Aprobación Humana)
- **Canales de Invocación:** Ejecutado por `executeDownstreamOutputs` en corridas programadas `/tareas` y entregas instantáneas en el chat de Tenshi (en modo Sandbox Play se simula con `dryRun: true` sin enviar correos reales).

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Rama de Ejecución (`ifBranch`):** En flujos con `Condición Si/No`, declara `nodeConfigs["out_wappy_notification"] = { ifBranch: "yes" }` (o `"no"` exclusivamente para `wappy_notification`; prohibido poner `acpm_task` en `"no"`).
- **2. Adjuntos Oficiales:** Recibe e incluye automáticamente la bandeja dedicada `evidenceFiles` (certificados `%PDF`/`.PNG`) y los Informes Oficiales HTML generados por aplicativos Hito.
- **Casillas / Campos Reales Disponibles (8):** `Alerta Instantánea en la Campana de Notificaciones de WAPPY`, `Mensaje Ejecutivo en el Chat de Tenshi IA con Tarjeta Interactiva wappy-card`, `Contador de Hallazgos Críticos, Altos y Moderados Detectados`, `Listado Rápido de Cédulas y Trabajadores en Alerta`, `Resumen de Registros Actualizados en Somos SST`, `Botones de Acción Rápida hacia el Aplicativo o Hito Correspondiente`, `Nivel de Prioridad Visual (Crítica Roja / Preventiva Ámbar / Informativa Verde)`, `Registro Permanente en el Historial de Ejecuciones de la Tarea`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Alerta en Campana WAPPY + Tarjeta wappy-card en Tenshi + Cédulas Críticas** — Notificación visual inmediata dentro de la plataforma WAPPY (4 campos)
  * **⚡ Resumen de Cambios en Somos SST + Enlace Directo al Hito** — Confirma qué módulos se alimentaron y permite abrirlos en 1 clic (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Dictamen final en Markdown del Agente IA (`resultText`), rama activa (`yes`/`no`/`direct`), bandeja `evidenceFiles` (`%PDF`/`.PNG`) e Informes Oficiales HTML generados.
- **Salida (`OUTPUT`):** Entrega efectiva en el canal destino (correo enviado con adjuntos, tarjeta en campana/chat de Tenshi, tarea creada en `KanbanTask` con enums oficiales, documento `LiveEditor` o enlace `workspaceLinks` de Google Docs/Sheets/Slides/Calendar).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Diagnóstico Res. 0312] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Tablero ACPM] ──▶ [Notificar en WAPPY]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, configura la salida Notificar en WAPPY en la Rama SÍ para recibir los informes verificados de mi empresa.»

---

### Enviar Resultado / Bitácora a Google Antigravity (Mi PC)
- **ID Técnico (`id`):** `antigravity_local_report` · **Etiqueta Corta:** `Enviar a Antigravity PC`
- **Familia:** 7. Bitácora, Informes Oficiales y Salidas · **Categoría:** `output`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Datos y Artefactos a Entregar en tu Instancia Local de Google Antigravity

**Operación Técnica:** `Envía el resultado y bitácora directamente a Google Antigravity en tu Mac/PC vía Push SSE` · Módulo: *📤 Salida · Enviar Resultado / Bitácora a Google Antigravity (Mi PC)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna Final Derecha (Etapa 6) — Despacho gobernado por la rama activa (`ifBranch: "yes"` | `"no"` o flujo directo)
- **Puertos de Conexión:** ● Entrada Izquierda (desde Agente IA, Condición Si/No o Aprobación Humana)
- **Canales de Invocación:** Ejecutado por `executeDownstreamOutputs` en corridas programadas `/tareas` y entregas instantáneas en el chat de Tenshi (en modo Sandbox Play se simula con `dryRun: true` sin enviar correos reales).

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Rama de Ejecución (`ifBranch`):** En flujos con `Condición Si/No`, declara `nodeConfigs["out_antigravity_local_report"] = { ifBranch: "yes" }` (o `"no"` exclusivamente para `wappy_notification`; prohibido poner `acpm_task` en `"no"`).
- **2. Adjuntos Oficiales:** Recibe e incluye automáticamente la bandeja dedicada `evidenceFiles` (certificados `%PDF`/`.PNG`) y los Informes Oficiales HTML generados por aplicativos Hito.
- **Casillas / Campos Reales Disponibles (8):** `Bitácora Completa en Markdown Enviada por Puente Push SSE a tu Mac/PC`, `Tablas Estructuradas y JSON de Hallazgos para Procesamiento Local`, `Guardado Automático de Reporte en Carpeta Local del Computador`, `Listado de Trabajadores, Cédulas y Brechas Detectadas`, `Estado de Sincronización con los 8 Hitos de Somos SST`, `Logs de Herramientas MCP Invocadas Durante la Corrida`, `Notificación en Vivo en la Terminal del Daemon Local`, `Recomendaciones Técnicas Siguientes para el Especialista`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Bitácora Markdown por Push SSE + Guardado en Carpeta Local PC** — Recibe el informe directamente en tu computador conectado con Antigravity (4 campos)
  * **⚡ Payload JSON + Logs MCP + Terminal en Vivo** — Entrega técnica detallada para flujos de ingeniería y automatización local (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Dictamen final en Markdown del Agente IA (`resultText`), rama activa (`yes`/`no`/`direct`), bandeja `evidenceFiles` (`%PDF`/`.PNG`) e Informes Oficiales HTML generados.
- **Salida (`OUTPUT`):** Entrega efectiva en el canal destino (correo enviado con adjuntos, tarjeta en campana/chat de Tenshi, tarea creada en `KanbanTask` con enums oficiales, documento `LiveEditor` o enlace `workspaceLinks` de Google Docs/Sheets/Slides/Calendar).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Diagnóstico Res. 0312] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Tablero ACPM] ──▶ [Enviar a Antigravity PC]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, configura la salida Enviar a Antigravity PC en la Rama SÍ para recibir los informes verificados de mi empresa.»

---

### Enviar Resultado / Bitácora a Google Antigravity Cloud 24/7
- **ID Técnico (`id`):** `antigravity_cloud_report` · **Etiqueta Corta:** `Enviar a AGY Cloud`
- **Familia:** 7. Bitácora, Informes Oficiales y Salidas · **Categoría:** `output`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** 🛰️ Compatible con Puente Google Antigravity (Local / Cloud 24/7)

#### 1. Descripción Total y Propósito Normativo
Datos y Artefactos a Entregar en Google Antigravity Cloud (antigravity.google.com)

**Operación Técnica:** `Envía el resultado y bitácora directamente a tu instancia de Google Antigravity Cloud 24/7 (antigravity.google.com)` · Módulo: *📤 Salida · Enviar Resultado / Bitácora a Google Antigravity Cloud 24/7*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna Final Derecha (Etapa 6) — Despacho gobernado por la rama activa (`ifBranch: "yes"` | `"no"` o flujo directo)
- **Puertos de Conexión:** ● Entrada Izquierda (desde Agente IA, Condición Si/No o Aprobación Humana)
- **Canales de Invocación:** Ejecutado por `executeDownstreamOutputs` en corridas programadas `/tareas` y entregas instantáneas en el chat de Tenshi (en modo Sandbox Play se simula con `dryRun: true` sin enviar correos reales).

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Rama de Ejecución (`ifBranch`):** En flujos con `Condición Si/No`, declara `nodeConfigs["out_antigravity_cloud_report"] = { ifBranch: "yes" }` (o `"no"` exclusivamente para `wappy_notification`; prohibido poner `acpm_task` en `"no"`).
- **2. Adjuntos Oficiales:** Recibe e incluye automáticamente la bandeja dedicada `evidenceFiles` (certificados `%PDF`/`.PNG`) y los Informes Oficiales HTML generados por aplicativos Hito.
- **Casillas / Campos Reales Disponibles (8):** `Bitácora Ejecutiva en tu Workspace de Google Antigravity Cloud 24/7`, ` Artefacto Markdown con Tablas de Cumplimiento y Brechas SST`, `Listado Nominal de Cédulas, Trabajadores y Vencimientos Procesados`, `Confirmación de Escritura en Base de Datos de Somos SST vía MCP`, `Resumen de Indicadores y Score Predictivo Actualizado`, `Trazabilidad de Ejecución Cloud 24/7 (Sin Dependencia de PC Local)`, `Sincronización con Historial de Automatizaciones WAPPY`, `Plan de Seguimiento para la Próxima Ejecución Programada`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Artefacto Markdown en AGY Cloud + Confirmación MCP Somos SST** — Centraliza el reporte en tu instancia de antigravity.google.com y en WAPPY (4 campos)
  * **⚡ Cédulas Procesadas + Indicadores + Plan de Seguimiento Cloud** — Resumen operativo de trabajadores e indicadores auditados en la nube (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Dictamen final en Markdown del Agente IA (`resultText`), rama activa (`yes`/`no`/`direct`), bandeja `evidenceFiles` (`%PDF`/`.PNG`) e Informes Oficiales HTML generados.
- **Salida (`OUTPUT`):** Entrega efectiva en el canal destino (correo enviado con adjuntos, tarjeta en campana/chat de Tenshi, tarea creada en `KanbanTask` con enums oficiales, documento `LiveEditor` o enlace `workspaceLinks` de Google Docs/Sheets/Slides/Calendar).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Diagnóstico Res. 0312] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Tablero ACPM] ──▶ [Enviar a AGY Cloud]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, configura la salida Enviar a AGY Cloud en la Rama SÍ para recibir los informes verificados de mi empresa.»

---

### Alimentar / Guardar Cambios en Aplicativo Somos SST
- **ID Técnico (`id`):** `somos_sst_update` · **Etiqueta Corta:** `Guardar en Somos SST`
- **Familia:** 7. Bitácora, Informes Oficiales y Salidas · **Categoría:** `output`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Operaciones de Escritura y Sincronización en Base de Datos de Somos SST

**Operación Técnica:** `Actualiza directamente los registros reales en el aplicativo o Hito de Somos SST correspondiente` · Módulo: *📤 Salida · Alimentar / Guardar Cambios en Aplicativo Somos SST*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna Final Derecha (Etapa 6) — Despacho gobernado por la rama activa (`ifBranch: "yes"` | `"no"` o flujo directo)
- **Puertos de Conexión:** ● Entrada Izquierda (desde Agente IA, Condición Si/No o Aprobación Humana)
- **Canales de Invocación:** Ejecutado por `executeDownstreamOutputs` en corridas programadas `/tareas` y entregas instantáneas en el chat de Tenshi (en modo Sandbox Play se simula con `dryRun: true` sin enviar correos reales).

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Rama de Ejecución (`ifBranch`):** En flujos con `Condición Si/No`, declara `nodeConfigs["out_somos_sst_update"] = { ifBranch: "yes" }` (o `"no"` exclusivamente para `wappy_notification`; prohibido poner `acpm_task` en `"no"`).
- **2. Adjuntos Oficiales:** Recibe e incluye automáticamente la bandeja dedicada `evidenceFiles` (certificados `%PDF`/`.PNG`) y los Informes Oficiales HTML generados por aplicativos Hito.
- **Casillas / Campos Reales Disponibles (9):** `Crear o Actualizar Expedientes de Trabajadores por Cédula (No Duplicar)`, `Actualizar Fechas y Conceptos de Exámenes Médicos Ocupacionales (EMO)`, `Actualizar Certificados de Afiliación (EPS, ARL, AFP) y Cursos de Alturas`, `Alimentar Peligros y Controles en Matriz IPEVR GTC-45 o Bio-IPEVR`, `Alimentar Riesgos Viales PESV, Parque Automotor o Inventario Químico SGA`, `Actualizar Calificaciones y Evidencias del Diagnóstico Res. 0312`, `Registrar Actas, Compromisos o Reportes de Actos y Condiciones Inseguras`, `Validación Estricta de Datos Reales Antes de Guardar en MongoDB`, `Resumen de Registros Creados vs. Registros Actualizados`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Actualizar Trabajadores por Cédula (EMO + EPS/ARL/AFP + Alturas)** — Sincroniza expedientes de colaboradores sin duplicar cédulas existentes (4 campos)
  * **⚡ Alimentar Matrices e Indicadores (0312 + GTC-45 + PESV + Químicos)** — Guarda los hallazgos analizados directamente en los aplicativos de los 8 Hitos (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Dictamen final en Markdown del Agente IA (`resultText`), rama activa (`yes`/`no`/`direct`), bandeja `evidenceFiles` (`%PDF`/`.PNG`) e Informes Oficiales HTML generados.
- **Salida (`OUTPUT`):** Entrega efectiva en el canal destino (correo enviado con adjuntos, tarjeta en campana/chat de Tenshi, tarea creada en `KanbanTask` con enums oficiales, documento `LiveEditor` o enlace `workspaceLinks` de Google Docs/Sheets/Slides/Calendar).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Diagnóstico Res. 0312] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Tablero ACPM] ──▶ [Guardar en Somos SST]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, configura la salida Guardar en Somos SST en la Rama SÍ para recibir los informes verificados de mi empresa.»

---

### Crear Actividad en el Centro de Control (en Cualquiera de sus Etapas)
- **ID Técnico (`id`):** `acpm_task` · **Etiqueta Corta:** `Centro de Control`
- **Familia:** 7. Bitácora, Informes Oficiales y Salidas · **Categoría:** `output`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Campos de la Acción Correctiva, Preventiva o de Mejora a Registrar

**Operación Técnica:** `Registra automáticamente el resultado como una actividad en el Centro de Control en la etapa elegida (Pendientes, En Ejecución, Próximas a Vencer, Vencidas o Completadas)` · Módulo: *📤 Salida · Crear Actividad / Acción Correctiva en Tablero Kanban ACPM*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna Final Derecha (Etapa 6) — Despacho gobernado por la rama activa (`ifBranch: "yes"` | `"no"` o flujo directo)
- **Puertos de Conexión:** ● Entrada Izquierda (desde Agente IA, Condición Si/No o Aprobación Humana)
- **Canales de Invocación:** Ejecutado por `executeDownstreamOutputs` en corridas programadas `/tareas` y entregas instantáneas en el chat de Tenshi (en modo Sandbox Play se simula con `dryRun: true` sin enviar correos reales).

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Rama de Ejecución (`ifBranch`):** En flujos con `Condición Si/No`, declara `nodeConfigs["out_acpm_task"] = { ifBranch: "yes" }` (o `"no"` exclusivamente para `wappy_notification`; prohibido poner `acpm_task` en `"no"`).
- **2. Adjuntos Oficiales:** Recibe e incluye automáticamente la bandeja dedicada `evidenceFiles` (certificados `%PDF`/`.PNG`) y los Informes Oficiales HTML generados por aplicativos Hito.
- **Casillas / Campos Reales Disponibles (5):** `Título Claro de la Acción ACPM y Origen del Hallazgo (Auditoría, Inspección, ATEL, Vencimiento)`, `Tipo de Acción (Correctiva, Preventiva o de Mejora Continua)`, `Prioridad / Etapa Kanban (Pendiente, En Ejecución, Próxima a Vencer, Urgente)`, `Responsable Sugerido, Plazo de Cierre y Evidencia Esperada`, `Control Anti-Duplicados para no repetir tareas ya abiertas sobre el mismo hallazgo`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Crear Acción ACPM Priorizada + Responsable + Plazo + Anti-Duplicados** — Convierte brechas reales en tareas trazables dentro del Hito 7 (5 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Dictamen final en Markdown del Agente IA (`resultText`), rama activa (`yes`/`no`/`direct`), bandeja `evidenceFiles` (`%PDF`/`.PNG`) e Informes Oficiales HTML generados.
- **Salida (`OUTPUT`):** Entrega efectiva en el canal destino (correo enviado con adjuntos, tarjeta en campana/chat de Tenshi, tarea creada en `KanbanTask` con enums oficiales, documento `LiveEditor` o enlace `workspaceLinks` de Google Docs/Sheets/Slides/Calendar).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Diagnóstico Res. 0312] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Tablero ACPM] ──▶ [Centro de Control]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, configura la salida Centro de Control en la Rama SÍ para recibir los informes verificados de mi empresa.»

---

### Crear Documento Formal en Editor en Vivo WAPPY (LiveEditor)
- **ID Técnico (`id`):** `out_canvas_doc` *(Catálogo base: `canvas_doc`)* · **Etiqueta Corta:** `Documento LiveEditor`
- **Familia:** 7. Bitácora, Informes Oficiales y Salidas · **Categoría:** `output`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Estructura del Documento Formal Exportable a Word/PDF en LiveEditor

**Operación Técnica:** `Presenta tablas comparativas en Markdown, documento formal y resumen ejecutivo wappy-card` · Módulo: *📤 Salida · Crear Documento Formal en Editor en Vivo WAPPY (LiveEditor)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna Final Derecha (Etapa 6) — Despacho gobernado por la rama activa (`ifBranch: "yes"` | `"no"` o flujo directo)
- **Puertos de Conexión:** ● Entrada Izquierda (desde Agente IA, Condición Si/No o Aprobación Humana)
- **Canales de Invocación:** Ejecutado por `executeDownstreamOutputs` en corridas programadas `/tareas` y entregas instantáneas en el chat de Tenshi (en modo Sandbox Play se simula con `dryRun: true` sin enviar correos reales).

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Rama de Ejecución (`ifBranch`):** En flujos con `Condición Si/No`, declara `nodeConfigs["out_canvas_doc"] = { ifBranch: "yes" }` (o `"no"` exclusivamente para `wappy_notification`; prohibido poner `acpm_task` en `"no"`).
- **2. Adjuntos Oficiales:** Recibe e incluye automáticamente la bandeja dedicada `evidenceFiles` (certificados `%PDF`/`.PNG`) y los Informes Oficiales HTML generados por aplicativos Hito.
- **Casillas / Campos Reales Disponibles (9):** `Cabezote Oficial de Control Documental (Logo, Razón Social, NIT, Código, Versión y Fecha)`, `Título Oficial del Informe, Acta, Procedimiento o Programa SST`, `Marco Normativo y Alcance Aplicable a la Empresa`, `Tablas Comparativas con Bordes Sólidos Exportables a Word (.docx) y PDF`, `Listado Nominal de Trabajadores, Cédulas y Hallazgos Evaluados`, `Análisis Técnico, Conclusiones y Recomendaciones del Especialista`, `Plan de Acción con Responsables y Fechas de Cumplimiento`, `Bloque de Firmas Oficiales (Representante Legal y Responsable SG-SST con Licencia)`, `Guardado Automático en el Historial de Informes del Aplicativo`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Cabezote Oficial + Tablas Exportables Word/PDF + Bloque de Firmas** — Genera un documento listo para imprimir o descargar en Word/PDF con 1 clic (4 campos)
  * **⚡ Informe Técnico Completo (Marco Legal + Cédulas + Plan de Acción)** — Estructura formal de auditoría o inspección para presentar a gerencia o ARL (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Dictamen final en Markdown del Agente IA (`resultText`), rama activa (`yes`/`no`/`direct`), bandeja `evidenceFiles` (`%PDF`/`.PNG`) e Informes Oficiales HTML generados.
- **Salida (`OUTPUT`):** Entrega efectiva en el canal destino (correo enviado con adjuntos, tarjeta en campana/chat de Tenshi, tarea creada en `KanbanTask` con enums oficiales, documento `LiveEditor` o enlace `workspaceLinks` de Google Docs/Sheets/Slides/Calendar).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Diagnóstico Res. 0312] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Tablero ACPM] ──▶ [Documento LiveEditor]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, configura la salida Documento LiveEditor en la Rama SÍ para recibir los informes verificados de mi empresa.»

---

### Crear / Actualizar Informe en Google Docs
- **ID Técnico (`id`):** `out_google_docs` *(Catálogo base: `google_docs`)* · **Etiqueta Corta:** `Exportar Google Docs`
- **Familia:** 7. Bitácora, Informes Oficiales y Salidas · **Categoría:** `output`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Elementos del Documento en Google Docs a Leer o Generar

**Operación Técnica:** `Crea un documento formal en Google Docs (google_docs) si la cuenta está vinculada` · Módulo: *🔧📤 Conector · Crear / Leer Informe Formal en Google Docs*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna Final Derecha (Etapa 6) — Despacho gobernado por la rama activa (`ifBranch: "yes"` | `"no"` o flujo directo)
- **Puertos de Conexión:** ● Entrada Izquierda (desde Agente IA, Condición Si/No o Aprobación Humana)
- **Canales de Invocación:** Ejecutado por `executeDownstreamOutputs` en corridas programadas `/tareas` y entregas instantáneas en el chat de Tenshi (en modo Sandbox Play se simula con `dryRun: true` sin enviar correos reales).

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Rama de Ejecución (`ifBranch`):** En flujos con `Condición Si/No`, declara `nodeConfigs["out_google_docs"] = { ifBranch: "yes" }` (o `"no"` exclusivamente para `wappy_notification`; prohibido poner `acpm_task` en `"no"`).
- **2. Adjuntos Oficiales:** Recibe e incluye automáticamente la bandeja dedicada `evidenceFiles` (certificados `%PDF`/`.PNG`) y los Informes Oficiales HTML generados por aplicativos Hito.
- **Casillas / Campos Reales Disponibles (8):** `Título del Documento en Google Docs con Fecha y Razón Social`, `Encabezado Normativo (NIT, CIIU, Nivel de Riesgo ARL y Responsable SST)`, `Resumen Ejecutivo de Hallazgos y Cumplimiento Legal`, `Tablas Estructuradas de Trabajadores (Cédula, Nombre, Cargo y Estado)`, `Desarrollo de Capítulos, Actas o Procedimientos Técnicos SST`, `Conclusiones, Plan de Acción ACPM y Bloque de Firmas`, `Carpeta de Destino en Google Drive y Enlace Compartible`, `Preservar Historial de Versiones en Google Workspace`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Crear Informe en Google Docs + Tablas por Cédula + Enlace Drive** — Exporta el dictamen formal directamente a la cuenta de Google Docs vinculada (4 campos)
  * **⚡ Acta / Procedimiento SST + Plan de Acción + Bloque de Firmas** — Ideal para actas de COPASST, CCL, PESV o informes de auditoría (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Dictamen final en Markdown del Agente IA (`resultText`), rama activa (`yes`/`no`/`direct`), bandeja `evidenceFiles` (`%PDF`/`.PNG`) e Informes Oficiales HTML generados.
- **Salida (`OUTPUT`):** Entrega efectiva en el canal destino (correo enviado con adjuntos, tarjeta en campana/chat de Tenshi, tarea creada en `KanbanTask` con enums oficiales, documento `LiveEditor` o enlace `workspaceLinks` de Google Docs/Sheets/Slides/Calendar).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Diagnóstico Res. 0312] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Tablero ACPM] ──▶ [Exportar Google Docs]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, configura la salida Exportar Google Docs en la Rama SÍ para recibir los informes verificados de mi empresa.»

---

### Registrar / Actualizar Filas en Google Sheets
- **ID Técnico (`id`):** `out_google_sheets` *(Catálogo base: `google_sheets`)* · **Etiqueta Corta:** `Exportar Google Sheets`
- **Familia:** 7. Bitácora, Informes Oficiales y Salidas · **Categoría:** `output`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Columnas y Hojas de Cálculo a Leer o Actualizar en Google Sheets

**Operación Técnica:** `Añade o actualiza filas de control en Google Sheets (google_sheets)` · Módulo: *🔧📤 Conector · Registrar / Leer Filas en Google Sheets (Hojas de Cálculo)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna Final Derecha (Etapa 6) — Despacho gobernado por la rama activa (`ifBranch: "yes"` | `"no"` o flujo directo)
- **Puertos de Conexión:** ● Entrada Izquierda (desde Agente IA, Condición Si/No o Aprobación Humana)
- **Canales de Invocación:** Ejecutado por `executeDownstreamOutputs` en corridas programadas `/tareas` y entregas instantáneas en el chat de Tenshi (en modo Sandbox Play se simula con `dryRun: true` sin enviar correos reales).

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Rama de Ejecución (`ifBranch`):** En flujos con `Condición Si/No`, declara `nodeConfigs["out_google_sheets"] = { ifBranch: "yes" }` (o `"no"` exclusivamente para `wappy_notification`; prohibido poner `acpm_task` en `"no"`).
- **2. Adjuntos Oficiales:** Recibe e incluye automáticamente la bandeja dedicada `evidenceFiles` (certificados `%PDF`/`.PNG`) y los Informes Oficiales HTML generados por aplicativos Hito.
- **Casillas / Campos Reales Disponibles (8):** `ID o Nombre del Libro de Google Sheets y Pestaña Objetivo`, `Columnas de Identificación: Cédula / Documento, Nombre Completo y Cargo`, `Columnas de Seguridad Social: EPS, ARL, AFP y Estado PILA`, `Columnas de Vencimientos: Fecha EMO, Curso Alturas, SOAT, RTM o Extintores`, `Columnas de Valoración de Riesgos: Peligro, ND, NE, NP, NC, NR y Controles`, `Columnas de Seguimiento ACPM: Hallazgo, Responsable, Fecha Límite y Estado`, `Actualizar Filas Existentes por Cédula / Código sin Duplicar`, `Fecha y Hora de Sincronización Automática desde WAPPY`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Registrar Cédula + Nombre + Cargo + Vencimientos (EMO/Alturas/EPS/ARL)** — Mantiene sincronizada tu matriz de control de personal en Google Sheets (5 campos)
  * **⚡ Sincronizar Matriz de Riesgos (GTC-45/PESV) y Seguimiento ACPM en Sheets** — Exporta peligros valorados y acciones abiertas hacia hojas de cálculo (3 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Dictamen final en Markdown del Agente IA (`resultText`), rama activa (`yes`/`no`/`direct`), bandeja `evidenceFiles` (`%PDF`/`.PNG`) e Informes Oficiales HTML generados.
- **Salida (`OUTPUT`):** Entrega efectiva en el canal destino (correo enviado con adjuntos, tarjeta en campana/chat de Tenshi, tarea creada en `KanbanTask` con enums oficiales, documento `LiveEditor` o enlace `workspaceLinks` de Google Docs/Sheets/Slides/Calendar).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Diagnóstico Res. 0312] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Tablero ACPM] ──▶ [Exportar Google Sheets]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, configura la salida Exportar Google Sheets en la Rama SÍ para recibir los informes verificados de mi empresa.»

---

### Agendar Recordatorio / Auditoría en Google Calendar
- **ID Técnico (`id`):** `out_google_calendar` *(Catálogo base: `google_calendar`)* · **Etiqueta Corta:** `Agendar Calendar`
- **Familia:** 7. Bitácora, Informes Oficiales y Salidas · **Categoría:** `output`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Eventos, Recordatorios y Citaciones SST en Google Calendar

**Operación Técnica:** `Programa el evento o fecha límite de seguimiento en Google Calendar (google_calendar)` · Módulo: *🔧📤 Conector · Google Calendar (Agenda, Vencimientos y Auditorías SST)*.
- **Marco Legal y Normativo SG-SST:** Resolución 0312 de 2019 (Estándares Mínimos del SG-SST) y Decreto 1072 de 2015 Art. 2.2.4.6.29.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna Final Derecha (Etapa 6) — Despacho gobernado por la rama activa (`ifBranch: "yes"` | `"no"` o flujo directo)
- **Puertos de Conexión:** ● Entrada Izquierda (desde Agente IA, Condición Si/No o Aprobación Humana)
- **Canales de Invocación:** Ejecutado por `executeDownstreamOutputs` en corridas programadas `/tareas` y entregas instantáneas en el chat de Tenshi (en modo Sandbox Play se simula con `dryRun: true` sin enviar correos reales).

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Rama de Ejecución (`ifBranch`):** En flujos con `Condición Si/No`, declara `nodeConfigs["out_google_calendar"] = { ifBranch: "yes" }` (o `"no"` exclusivamente para `wappy_notification`; prohibido poner `acpm_task` en `"no"`).
- **2. Adjuntos Oficiales:** Recibe e incluye automáticamente la bandeja dedicada `evidenceFiles` (certificados `%PDF`/`.PNG`) y los Informes Oficiales HTML generados por aplicativos Hito.
- **Casillas / Campos Reales Disponibles (8):** `Título del Evento SST (Vencimiento EMO, Reunión COPASST/CCL, Simulacro, Auditoría, Recarga Extintor)`, `Fecha y Hora de Inicio y Finalización del Evento`, `Descripción Técnica con Listado de Cédulas, Nombres o Placas en Alerta`, `Invitados y Correos de Responsables Convocados`, `Recordatorios Automáticos Previos (7 días, 1 día y 1 hora antes)`, `Ubicación / Sede o Enlace de Reunión Virtual (Google Meet)`, `Frecuencia de Recurrencia (Mensual COPASST / Trimestral CCL y PESV / Anual)`, `Verificación de Conflictos en Agenda y Confirmación del Evento Creado`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Agendar Alerta de Vencimientos (EMO / Alturas / SOAT / Extintores)** — Crea eventos de recordatorio en Google Calendar para que ningún soporte venza (4 campos)
  * **⚡ Programar Reunión de Comité (COPASST / CCL / PESV) o Auditoría con Invitados** — Agenda sesiones obligatorias de comités e invita a los integrantes (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Dictamen final en Markdown del Agente IA (`resultText`), rama activa (`yes`/`no`/`direct`), bandeja `evidenceFiles` (`%PDF`/`.PNG`) e Informes Oficiales HTML generados.
- **Salida (`OUTPUT`):** Entrega efectiva en el canal destino (correo enviado con adjuntos, tarjeta en campana/chat de Tenshi, tarea creada en `KanbanTask` con enums oficiales, documento `LiveEditor` o enlace `workspaceLinks` de Google Docs/Sheets/Slides/Calendar).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Diagnóstico Res. 0312] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Tablero ACPM] ──▶ [Agendar Calendar]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, configura la salida Agendar Calendar en la Rama SÍ para recibir los informes verificados de mi empresa.»

---

### Generar Presentación en Google Slides
- **ID Técnico (`id`):** `out_google_slides` *(Catálogo base: `google_slides`)* · **Etiqueta Corta:** `Crear Google Slides`
- **Familia:** 7. Bitácora, Informes Oficiales y Salidas · **Categoría:** `output`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Diapositivas y Gráficos Ejecutivos a Estructurar en Google Slides

**Operación Técnica:** `Estructura diapositivas ejecutivas en Google Slides (google_slides)` · Módulo: *📤 Salida · Generar Presentación Ejecutiva en Google Slides*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Columna Final Derecha (Etapa 6) — Despacho gobernado por la rama activa (`ifBranch: "yes"` | `"no"` o flujo directo)
- **Puertos de Conexión:** ● Entrada Izquierda (desde Agente IA, Condición Si/No o Aprobación Humana)
- **Canales de Invocación:** Ejecutado por `executeDownstreamOutputs` en corridas programadas `/tareas` y entregas instantáneas en el chat de Tenshi (en modo Sandbox Play se simula con `dryRun: true` sin enviar correos reales).

#### 3. ¿Cómo se Configura Paso a Paso?
- **1. Rama de Ejecución (`ifBranch`):** En flujos con `Condición Si/No`, declara `nodeConfigs["out_google_slides"] = { ifBranch: "yes" }` (o `"no"` exclusivamente para `wappy_notification`; prohibido poner `acpm_task` en `"no"`).
- **2. Adjuntos Oficiales:** Recibe e incluye automáticamente la bandeja dedicada `evidenceFiles` (certificados `%PDF`/`.PNG`) y los Informes Oficiales HTML generados por aplicativos Hito.
- **Casillas / Campos Reales Disponibles (8):** `Diapositiva 1: Portada Corporativa (Razón Social, NIT, Período y Responsable SST)`, `Diapositiva 2: Cuadro de Mando de Cumplimiento Res. 0312 (%) y Ciclo PHVA`, `Diapositiva 3: Indicadores Mínimos ATEL y Ausentismo (Art. 30 Res. 0312)`, `Diapositiva 4: Top Peligros Críticos (GTC-45, PESV y Químicos SGA)`, `Diapositiva 5: Estado de Exámenes Médicos (EMO), Alturas y Capacitaciones`, `Diapositiva 6: Alertas del Oráculo Predictivo IA y Gemelo Digital SST`, `Diapositiva 7: Avance del Tablero Kanban ACPM y Compromisos de Comités`, `Diapositiva 8: Decisiones y Presupuesto para Revisión por la Alta Dirección`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Presentación para Alta Dirección (0312 + Indicadores ATEL + Presupuesto)** — Genera la presentación gerencial de rendición de cuentas del SG-SST (4 campos)
  * **⚡ Presentación Técnica (Peligros Críticos + EMO/Alturas + Oráculo IA + ACPM)** — Ideal para reuniones mensuales del COPASST, Comité Vial o capacitaciones (4 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Dictamen final en Markdown del Agente IA (`resultText`), rama activa (`yes`/`no`/`direct`), bandeja `evidenceFiles` (`%PDF`/`.PNG`) e Informes Oficiales HTML generados.
- **Salida (`OUTPUT`):** Entrega efectiva en el canal destino (correo enviado con adjuntos, tarjeta en campana/chat de Tenshi, tarea creada en `KanbanTask` con enums oficiales, documento `LiveEditor` o enlace `workspaceLinks` de Google Docs/Sheets/Slides/Calendar).

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Diagnóstico Res. 0312] ──▶ [Condición Si/No (pre_agent)] ──(SÍ)──▶ [Agente IA + ◆ Tablero ACPM] ──▶ [Crear Google Slides]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, configura la salida Crear Google Slides en la Rama SÍ para recibir los informes verificados de mi empresa.»

---

## 8. Control Lógico DAG y Compuertas de Gobernanza

> Gobiernan el enrutamiento determinista sin gasto innecesario de tokens: Condición Si/No (pre_source, pre_agent, post_agent), Unir Ramas (Merge), Iterar Lotes (Loop), Filtro, Switch y Aprobación Humana.

### 🔀 Condición Si/No (Enrutador Causal pre_source / pre_agent / post_agent)
- **ID Técnico (`id`):** `if_router` · **Etiqueta Corta:** `Condición Si/No`
- **Familia:** 8. Control Lógico DAG y Compuertas de Gobernanza · **Categoría:** `logic`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Evalúa una condición explícita para dividir el flujo en Rama SÍ y Rama NO. Soporta tres ubicaciones estratégicas: pre_source (antes de tocar la BD en consultas por cédula/placa/adjunto de Tenshi), pre_agent (corta en Rama NO gastando 0 tokens LLM cuando no hay brechas ni archivos nuevos) y post_agent (evalúa el marcador [VEREDICTO_IF: SI/NO] emitido por el Agente IA).

**Operación Técnica:** `Compuerta condicional determinista o semántica con bifurcación Rama SÍ / Rama NO` · Módulo: *🔀 Condición Si/No (Enrutador Causal pre_source / pre_agent / post_agent)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Etapa 1.5 (`pre_source`), Etapa 3 (`pre_agent`, antes de OCR/LLM) o Etapa 5 (`post_agent`, después del Agente IA).
- **Puertos de Conexión:** ● Entrada Izquierda · ● Salida Superior Verde (`Rama SÍ`) · ● Salida Inferior Ámbar (`Rama NO`)
- **Canales de Invocación:** Evaluado de forma determinista y auditable paso a paso en `AutomationLog.liveSteps` y en el Lienzo Visual de `/tareas`.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (5):** `Ubicación de Compuerta (ifPlacement: pre_source | pre_agent | post_agent)`, `Tipo de Regla (ifConditionType: critical_findings | new_external_items | has_explicit_cedula | has_explicit_cedula_or_placa | has_attached_document | ai_verdict)`, `Pregunta Visible en el Lienzo (ifConditionLabel)`, `Expresión o Umbral (ifRuleExpression, ej. >= 1)`, `Etiqueta Rama SÍ (conditionTrueLabel) y Etiqueta Rama NO (conditionFalseLabel)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Vigilancia Recurrente 0 Tokens (pre_agent + critical_findings)** — Si hay 0 brechas nuevas, va a Notificar en WAPPY sin llamar al LLM (2 campos)
  * **⚡ Triaje Experto en Campo (post_agent + [VEREDICTO_IF: SI/NO])** — El Agente IA valora severidad GTC-45 y decide si escala a ACPM (2 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Lote de ítems provenientes de Etapa 2 (`currentPipelineItems`) o respuesta preliminar del Agente IA.
- **Salida (`OUTPUT`):** Decisión determinista de rama (`branchTaken: "yes" | "no"`), lote fusionado/filtrado sin duplicados o retención segura `awaiting_approval`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Fuentes Etapa 2] ──▶ [Condición Si/No] ──▶ [Agente IA + ◆ Herramienta +] ──▶ [Salidas Gobernadas]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, ¿cómo uso el nodo lógico Condición Si/No para optimizar mi flujo y ahorrar tokens de IA?»

---

### 🔗 Unir Ramas (Merge de Fuentes Paralelas en Etapa 2)
- **ID Técnico (`id`):** `merge` · **Etiqueta Corta:** `Unir Ramas (Merge)`
- **Familia:** 8. Control Lógico DAG y Compuertas de Gobernanza · **Categoría:** `logic`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Une de forma determinista los registros provenientes de 2 o más extractores o aplicativos Hito source_read conectados en paralelo en Etapa 2 (por ejemplo: Permisos de Alturas + Equipos de Alturas, o COPASST + Comité de Convivencia), entregando un único lote consolidado hacia la compuerta condicional o el Agente IA.

**Operación Técnica:** `Consolida y desduplica múltiples fuentes de lectura paralelas antes del IF o del Agente IA` · Módulo: *🔗 Unir Ramas (Merge de Fuentes Paralelas en Etapa 2)*.
- **Marco Legal y Normativo SG-SST:** Resolución 2764 de 2022 (Batería de Riesgo Psicosocial), Ley 1010 de 2006 y Resolución 3461 de 2025.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Etapa 2.5 / 3 — Entre las fuentes de lectura de Etapa 2 y la compuerta condicional / `Agente IA`.
- **Puertos de Conexión:** ● Entrada(s) Izquierda(s) · ● Salida Derecha consolidada
- **Canales de Invocación:** Evaluado de forma determinista y auditable paso a paso en `AutomationLog.liveSteps` y en el Lienzo Visual de `/tareas`.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (3):** `Estrategia de Unión (mergeStrategy: union_dedup | intersect_key | append_all)`, `Llave de Cruce / Desduplicación (mergeKey: cedula | id | placa | codigo)`, `Título y Subtítulo Personalizado en Lienzo`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Unión sin Duplicados por Cédula o ID (union_dedup)** — Combina múltiples módulos SG-SST evitando registros repetidos (2 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Lote de ítems provenientes de Etapa 2 (`currentPipelineItems`) o respuesta preliminar del Agente IA.
- **Salida (`OUTPUT`):** Decisión determinista de rama (`branchTaken: "yes" | "no"`), lote fusionado/filtrado sin duplicados o retención segura `awaiting_approval`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Fuentes Etapa 2] ──▶ [Unir Ramas (Merge)] ──▶ [Agente IA + ◆ Herramienta +] ──▶ [Salidas Gobernadas]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, ¿cómo uso el nodo lógico Unir Ramas (Merge) para optimizar mi flujo y ahorrar tokens de IA?»

---

### 🔁 Iterar Lotes (Loop Controlado para Nóminas o Archivos Grandes)
- **ID Técnico (`id`):** `loop` · **Etiqueta Corta:** `Iterar Lotes (Loop)`
- **Familia:** 8. Control Lógico DAG y Compuertas de Gobernanza · **Categoría:** `logic`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Divide padrones grandes de trabajadores (hasta 300 colaboradores activos), vehículos o documentos en lotes ordenados (batchSize) para procesarlos sin saturar la ventana de contexto del modelo ni disparar timeouts de red, consolidando al final un único informe o un resumen por lote.

**Operación Técnica:** `Procesa colecciones extensas por bloques controlados sin truncar nóminas` · Módulo: *🔁 Iterar Lotes (Loop Controlado para Nóminas o Archivos Grandes)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Etapa 2.5 / 3 — Entre las fuentes de lectura de Etapa 2 y la compuerta condicional / `Agente IA`.
- **Puertos de Conexión:** ● Entrada(s) Izquierda(s) · ● Salida Derecha consolidada
- **Canales de Invocación:** Evaluado de forma determinista y auditable paso a paso en `AutomationLog.liveSteps` y en el Lienzo Visual de `/tareas`.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (3):** `Tamaño de Lote (batchSize, ej. 10, 25 o 50 registros)`, `Campo de Agrupación / Iteración (iterateByField: cedula | areaTrabajo | cargo | sede)`, `Modo de Salida (loopMode: consolidado_unico | resumen_por_lote)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Barrido de Nómina Completa en Lotes de 25 (consolidado_unico)** — Ideal para auditorías masivas de EMO, EPP o capacitaciones (2 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Lote de ítems provenientes de Etapa 2 (`currentPipelineItems`) o respuesta preliminar del Agente IA.
- **Salida (`OUTPUT`):** Decisión determinista de rama (`branchTaken: "yes" | "no"`), lote fusionado/filtrado sin duplicados o retención segura `awaiting_approval`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Fuentes Etapa 2] ──▶ [Iterar Lotes (Loop)] ──▶ [Agente IA + ◆ Herramienta +] ──▶ [Salidas Gobernadas]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, ¿cómo uso el nodo lógico Iterar Lotes (Loop) para optimizar mi flujo y ahorrar tokens de IA?»

---

### 🛑 Aprobación Humana (Compuerta de Visto Bueno antes de Despachar)
- **ID Técnico (`id`):** `human_approval` · **Etiqueta Corta:** `Visto Bueno Humano`
- **Familia:** 8. Control Lógico DAG y Compuertas de Gobernanza · **Categoría:** `logic`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Pausa el despacho de las salidas posteriores (correos oficiales, tareas ACPM, actas legales) guardando la corrida en estado awaiting_approval con su borrador completo y evidencias adjuntas, notificando al Responsable SG-SST o Gerencia para que apruebe o rechace con un clic en /tareas.

**Operación Técnica:** `Retiene la ejecución de salidas críticas hasta aprobación formal en /tareas?tab=historial` · Módulo: *🛑 Aprobación Humana (Compuerta de Visto Bueno antes de Despachar)*.
- **Marco Legal y Normativo SG-SST:** Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST) y Resolución 0312 de 2019.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Etapa 5.5 — Entre el `Agente IA` y los nodos de `Salida` (`outputs[]`).
- **Puertos de Conexión:** ● Entrada(s) Izquierda(s) · ● Salida Derecha consolidada
- **Canales de Invocación:** Evaluado de forma determinista y auditable paso a paso en `AutomationLog.liveSteps` y en el Lienzo Visual de `/tareas`.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (3):** `Correo del Aprobador Responsable (approverEmail)`, `Rol Autorizador (Responsable SG-SST / Representante Legal / COPASST)`, `Vigencia de la Solicitud (7 días por defecto antes de expiración)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Visto Bueno Legal en Investigación ATEL (Res. 1401) y Alta Dirección** — Revisión humana obligatoria antes de radicar o distribuir actas oficiales (2 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Lote de ítems provenientes de Etapa 2 (`currentPipelineItems`) o respuesta preliminar del Agente IA.
- **Salida (`OUTPUT`):** Decisión determinista de rama (`branchTaken: "yes" | "no"`), lote fusionado/filtrado sin duplicados o retención segura `awaiting_approval`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Fuentes Etapa 2] ──▶ [Visto Bueno Humano] ──▶ [Agente IA + ◆ Herramienta +] ──▶ [Salidas Gobernadas]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, ¿cómo uso el nodo lógico Visto Bueno Humano para optimizar mi flujo y ahorrar tokens de IA?»

---

### 🧹 Filtro Quirúrgico de Registros (Filter)
- **ID Técnico (`id`):** `filter` · **Etiqueta Corta:** `Filtro de Datos`
- **Familia:** 8. Control Lógico DAG y Compuertas de Gobernanza · **Categoría:** `logic`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Depura en memoria los registros que viajan por la tubería del flujo sin consumir tokens de IA, conservando únicamente las filas que cumplen el criterio operativo (por ejemplo: solo trabajadores Activos, solo hallazgos Críticos/Altos o solo vencimientos <= 30 días).

**Operación Técnica:** `Filtra filas del lote activo según severidad, estado laboral, sede o vencimiento` · Módulo: *🧹 Filtro Quirúrgico de Registros (Filter)*.
- **Marco Legal y Normativo SG-SST:** Resolución 1843 de 2025 / Resolución 2346 de 2007 (Evaluaciones Médicas Ocupacionales), Decreto 1427 de 2022 y Ley 23 de 1981 (Reserva de Historia Clínica).

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Etapa 2.5 / 3 — Entre las fuentes de lectura de Etapa 2 y la compuerta condicional / `Agente IA`.
- **Puertos de Conexión:** ● Entrada(s) Izquierda(s) · ● Salida Derecha consolidada
- **Canales de Invocación:** Evaluado de forma determinista y auditable paso a paso en `AutomationLog.liveSteps` y en el Lienzo Visual de `/tareas`.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (2):** `Modo de Filtro (recordFilterMode: critical_only | expiry_only | active | with_restrictions)`, `Expresión o Campo Objetivo (ifRuleExpression / iterateByField)`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Conservar Solo Brechas Críticas y Vencimientos Próximos (<= 30 días)** — Elimina ruido operativo antes de pasar al Agente IA (1 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Lote de ítems provenientes de Etapa 2 (`currentPipelineItems`) o respuesta preliminar del Agente IA.
- **Salida (`OUTPUT`):** Decisión determinista de rama (`branchTaken: "yes" | "no"`), lote fusionado/filtrado sin duplicados o retención segura `awaiting_approval`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Fuentes Etapa 2] ──▶ [Filtro de Datos] ──▶ [Agente IA + ◆ Herramienta +] ──▶ [Salidas Gobernadas]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, ¿cómo uso el nodo lógico Filtro de Datos para optimizar mi flujo y ahorrar tokens de IA?»

---

### 🧭 Enrutador Multi-Caso (Switch por Nivel de Riesgo / Origen)
- **ID Técnico (`id`):** `switch` · **Etiqueta Corta:** `Switch Multi-Rama`
- **Familia:** 8. Control Lógico DAG y Compuertas de Gobernanza · **Categoría:** `logic`
- **Estado:** **✅ Activo en Producción** · **Geometría en Lienzo:** Caja Causal `square` (Etapa Lineal Izquierda ➔ Derecha) · **Motor:** ☁️ Ejecución Nativa Directa en Servidor WAPPY Cloud

#### 1. Descripción Total y Propósito Normativo
Permite clasificar un evento o lote entrante según múltiples categorías de negocio (por ejemplo: Nivel de Riesgo GTC-45 I/II vs III/IV, o Accidente Grave Res. 1401 vs Incidente Leve vs Condición Locativa) para orientar el tratamiento del Agente IA y sus canales de salida.

**Operación Técnica:** `Clasifica eventos entrantes según categoría, nivel de riesgo (I-IV) u origen (Común vs Laboral)` · Módulo: *🧭 Enrutador Multi-Caso (Switch por Nivel de Riesgo / Origen)*.
- **Marco Legal y Normativo SG-SST:** Guía Técnica Colombiana GTC-45 (2.ª Actualización) y Decreto 1072 de 2015 Art. 2.2.4.6.15.

#### 2. ¿Desde Dónde se Usa y Dónde Va en el Lienzo?
- **Ubicación Causal (Izquierda ➔ Derecha):** Etapa 2.5 / 3 — Entre las fuentes de lectura de Etapa 2 y la compuerta condicional / `Agente IA`.
- **Puertos de Conexión:** ● Entrada(s) Izquierda(s) · ● Salida Derecha consolidada
- **Canales de Invocación:** Evaluado de forma determinista y auditable paso a paso en `AutomationLog.liveSteps` y en el Lienzo Visual de `/tareas`.

#### 3. ¿Cómo se Configura Paso a Paso?
- **Configuración en Lienzo (`nodeConfigs`):** Personaliza `customInstruction`, `antigravityMode` (`"auto"` | `"local"` | `"cloud"`) y selecciona las casillas específicas del inspector para acotar la respuesta del nodo.
- **Casillas / Campos Reales Disponibles (2):** `Campo o Criterio de Clasificación (origen, nivel_riesgo, severidad, area)`, `Reglas de Enrutamiento por Caso`.
- **Combos Rápidos de 1 Clic (`quickCombos`):**
  * **⚡ Clasificación por Severidad ATEL / GTC-45 (Crítico, Medio, Bajo)** — Diferencia escalamiento inmediato frente a seguimiento rutinario (1 campos)

#### 4. Entradas (`INPUT`) y Salidas (`OUTPUT`)
- **Entrada (`INPUT`):** Lote de ítems provenientes de Etapa 2 (`currentPipelineItems`) o respuesta preliminar del Agente IA.
- **Salida (`OUTPUT`):** Decisión determinista de rama (`branchTaken: "yes" | "no"`), lote fusionado/filtrado sin duplicados o retención segura `awaiting_approval`.

#### 5. Ejemplos Reales y Cómo Pedírselo a Tenshi
- ** Topología Causal Recomendada:**
  `[Cron Programado] ──▶ [Fuentes Etapa 2] ──▶ [Switch Multi-Rama] ──▶ [Agente IA + ◆ Herramienta +] ──▶ [Salidas Gobernadas]`
- **Cómo Pedírselo a Tenshi (Voz o Chat):**
  > «Tenshi, ¿cómo uso el nodo lógico Switch Multi-Rama para optimizar mi flujo y ahorrar tokens de IA?»

---
