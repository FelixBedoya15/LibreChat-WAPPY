# 📖 Manual Completo de Usuario - WAPPY IA

Bienvenido al manual oficial, actualizado y exhaustivo de **WAPPY IA**. Esta guía contiene toda la información real y detallada sobre el funcionamiento de la plataforma, el ecosistema **Somos SST** (anteriormente conocido como Gestor SG-SST), sus dos módulos de gestión, sus herramientas de Inteligencia Artificial de última generación y los planes de suscripción.

---

## 🚀 1. Exploración y Navegación Principal

La plataforma WAPPY IA está diseñada para ofrecer una experiencia fluida y autónoma. Desde la barra lateral izquierda tienes acceso a los siguientes módulos:

* **💬 Chat Principal (`/c/new`)**: El núcleo de interacción conversacional avanzado con soporte para **Gemini 3.5 Flash** y modelos de alta velocidad. Permite realizar consultas profundas de SST, interpretación de leyes, redacción de informes corporativos y análisis documental.
    * **👥 Catálogo de Agentes Especializados**: Al iniciar un chat, puedes seleccionar entre múltiples asistentes preconfigurados expertos en áreas específicas:
        * **Expertos Clínicos y Psicosociales**: Médico Laboral, Psicólogo Especialista SST, Asistente de Salud Mental, Fisioterapeuta Laboral, Nutricionista, Primeros Auxilios.
        * **Expertos Técnicos y Tareas Críticas**: Experto en Riesgo Eléctrico, Riesgo Biológico, Riesgo Químico, Riesgo Vial (PESV), Emergencias, Tareas de Alto Riesgo, Permisos TSA.
        * **Gestión Documental y Legal**: Abogado Laboral, Profesional SST, Auditor SG-SST, Asistente ATS, Investigación ATEL/EL, Método ROSA, Capacitaciones.
    * **Multi-Modalidad Avanzada**: Soporte para subida de archivos (PDFs, Word, Excel) y análisis visual de imágenes o diagramas.
* **🏢 Somos SST (`/sgsst`)**: La plataforma central del sistema (anteriormente denominada Gestor SG-SST). Integra dos grandes módulos de gestión: el **Motor Bio-Individual (Bio Motor)** y el **Ecosistema SG-SST General**.
* **🎓 Aula de Estudio (`/training`)**: Plataforma de capacitación interactiva para trabajadores y prevencionistas.
* **📰 Blog Corporativo (`/blog`)**: Artículos técnicos, actualizaciones normativas y novedades legales.
* **📁 Archivos (`/search?type=files`)**: Nube privada para la gestión y almacenamiento de evidencias documentales.
* **💳 Planes y Suscripción (`/planes`)**: Gestión transparente de licencias e integración de pagos seguros mediante Wompi.

---

## 🏢 2. Plataforma "Somos SST": Estructura y Módulos de Gestión

La plataforma central **Somos SST** (accesible en la ruta `/sgsst`) está dividida conceptualmente en **2 Módulos Principales**:

```
                              ┌──────────────────────────────────────────┐
                              │                SOMOS SST                 │
                              │                 (/sgsst)                 │
                              └────────────────────┬─────────────────────┘
                                                   │
                         ┌─────────────────────────┴─────────────────────────┐
                         │                                                   │
      ┌──────────────────▼──────────────────┐             ┌──────────────────▼──────────────────┐
      │   MÓDULO 1: MOTOR BIO-INDIVIDUAL    │             │   MÓDULO 2: ECOSISTEMA SG-SST       │
      │             (BIO MOTOR)             │             │              GENERAL                │
      └──────────────────┬──────────────────┘             └──────────────────┬──────────────────┘
                         │                                                   │
       • Expediente y Perfil Sociodemográfico              • Configuración Empresa y Firmas
       • Captura con Código QR Público                    • Política y Objetivos SST
       • Exámenes Médicos y Restricciones                 • Diagnóstico Inicial (Res. 0312)
       • Accidentes e Investigaciones ATEL                • Matriz de Peligros GTC-45 e IPEVAR
       • Los 5 Hitos del Biomonitoreo Humano              • Matriz Legal, Reglamentos y EPP
```

---

### 🧬 MÓDULO 1: Motor Bio-Individual (Bio Motor)
Este módulo coloca al ser humano y a la fisiología celular en el centro de la prevención. En lugar de evaluar a un trabajador estándar promedio, el **Bio Motor** monitorea la huella biocéntrica y el historial de salud individual.

1. **Perfil Sociodemográfico (`/sgsst/perfiles-sociodemograficos`)**: Captura de datos paramétricos de salud mediante Código QR público para trabajadores, gráficos circulares en tiempo real e informe epidemiológico generado por IA.
2. **Exámenes Médicos y Restricciones**: Seguimiento a concepto médico ocupacional, fecha de vencimiento, diagnósticos y restricciones físicas o laborales del personal.
3. **Investigación y Registro ATEL (`/sgsst/investigacion-atel` / `/sgsst/estadisticas-atel`)**: Registro de siniestros de accidentes de trabajo y enfermedades laborales (Res. 1401), árbol de causas, cálculo de índices IF/IS e informe estadístico.
4. **Los 5 Hitos Evolutivos del Biomonitoreo**:
   - *Hito 01: Consciencia Bio-Individual* (Línea base fisiológica).
   - *Hito 02: Interacción Fisiológica y Entorno* (Exposición y ergonomía OWAS).
   - *Hito 03: Marco de Cuidado Personalizado* (Revisión y acuerdos de salud).
   - *Hito 04: Alerta Temprana y Resiliencia* (Prevención proactiva).
   - *Hito 05: Oráculo Predictivo Bio-Métrico* (Probabilidad de siniestralidad).

---

### 🏛️ MÓDULO 2: Ecosistema SG-SST General (Gestión Normativa)
Este módulo administra la estructura documental, legal y de ingeniería para dar cumplimiento al Decreto 1072 de 2015 y la Resolución 0312 de 2019.

1. **Información de la Empresa y Firmas**: Registro de Razón Social, NIT, Representante Legal, ARL, Clase de Riesgo y estampación automática de **Firmas Digitales**.
2. **Política y Objetivos SST (`/sgsst/politica` / `/sgsst/objetivos`)**: Definición del marco directivo y metas cuantitativas.
3. **Diagnóstico Inicial Res. 0312 (`/sgsst/diagnostico`)**: Autoevaluación de Estándares Mínimos con barra circular de cumplimiento.
4. **Matriz de Peligros GTC-45 (`/sgsst/matriz-peligros`)**: Evaluación de riesgos con cálculo matemático automático (ND x NE), alertas de aceptabilidad e integración con el buzón de **Participación IPEVAR** de los trabajadores.
5. **Permisos y Procedimientos de Trabajo (`/sgsst/ats` / `/sgsst/permiso-alturas`)**: Checklists de Análisis de Trabajo Seguro y Permisos a Desnivel (+1.5m / +2.0m).
6. **Normatividad y Reglamentos (`/sgsst/matriz-legal` / `/sgsst/reglamento-higiene` / `/sgsst/reglamento-interno`)**: Matriz legal, RHS y RIT.
7. **Control Operativo e Inspecciones (`/sgsst/epp` / `/sgsst/vulnerabilidad` / `/sgsst/reporte-actos` / `/sgsst/pesv`)**: Dotación de EPP, Plan de Emergencias, Reporte de Actos Inseguros y Plan Estratégico de Seguridad Vial.
8. **Auditoría y Mejoramiento (`/sgsst/auditoria` / `/sgsst/alta-direccion` / `/sgsst/acpm`)**: Escrutinio gerencial y cierre de Acciones Correctivas, Preventivas y de Mejora.

---

### 🪄 Botonera Estándar y Editor Enriquecido (LiveEditor)
Todos los aplicativos de Somos SST cuentan con la barra de herramientas unificada:
* **🪄 IA Dummy**: Autocompleta datos simulados realistas.
* **💾 Guardar Datos**: Salva el progreso localmente.
* **⏱️ Historial**: Consulta informes anteriores.
* **✨ Generar Informe con IA**: Procesa la información y redacta el documento formal en el **LiveEditor**.
* **LiveEditor & Exportación**: Edición enriquecida, *"Editar con IA"*, vista a Pantalla Completa y exportación nativa a **PDF** y **Microsoft Word (.docx)**.

---

## 🔮 3. Inteligencia Predictiva y Visión por Computador (Plan Pro)

1. **Centro de Inteligencia Predictiva (`/sgsst/dashboard-predictivo`)**: Agrupa y correlaciona métricas en tiempo real de más de 8 aplicativos de Somos SST para calcular la probabilidad porcentual de siniestralidad.
2. **Análisis en Vivo con Cámaras (`/liva`)**: Auditoría mediante visión por computador (Computer Vision). La IA analiza la escena de la cámara (uso de EPP, posturas, pasillos) y redacta informes preventivos al instante.

---

## 👼 4. Tenshi: El Orquestador IA y Guía de Somos SST

**Tenshi** es la IA estrella e integradora nativa del sistema. Opera con superpoderes conectados a la base de datos:

* **🛡️ Regla de Oro Anti-Alucinación**: Tenshi NUNCA inventa datos ficticios de empresas (como "30 trabajadores" o "ARL Colmena"). Todas sus respuestas se basan estrictamente en la información REAL de la empresa en Somos SST.
* **⚡ Superpoderes Activos de Tenshi**:
    1. **`somos_sst`**: Herramienta mutacional y de consulta directa para administrar ambos Módulos Principales (Motor Bio-Individual y Ecosistema SG-SST General), actualizando exámenes médicos, registrando accidentes ATEL, editando cualquier aplicativo (`editar_cualquier_aplicativo`) y generando informes en **HTML interactivo**.
    2. **`consultar_agente_especializado`**: Orquestación Multi-Agente para delegar consultas técnicas a especialistas. Todo queda guardado en el chat.
    3. **`canvas_tool`**: Creación de lienzos Canvas interactivos.
    4. **`consultar_planes_y_sistema`**: Consulta directa en MongoDB del plan activo de la empresa, tarifas oficiales y cupones Wompi.

---

## 💳 5. Planes, Tarifas y Facturación Wompi

WAPPY IA opera bajo modelo SaaS con pasarela de pagos oficial **Bancolombia Wompi** (PSE, Tarjetas Débito/Crédito, Nequi).

> **🚨 IMPORTANTE:** Los usuarios siempre deben verificar los precios finales y promociones vigentes ingresando a `/planes`.

1. **Plan Gratis ($0)**: Exploración básica de IA, Aula de estudio y hasta 10 conversaciones.
2. **Plan Go**: Productividad personal, acceso al Blog, hasta 30 conversaciones y múltiples claves API de Gemini.
3. **Plan Plus**: **¡Acceso total a la plataforma Somos SST (Motor Bio-Individual + Ecosistema SG-SST General)!** Conversations ilimitadas y 10 claves API de Gemini.
4. **Plan Pro (⭐ Más Popular)**: Todo lo de Plus + **Centro de Inteligencia Predictiva**, **Análisis en Vivo por Cámaras (`/liva`)** y **Creación de Agentes Personalizados**.
