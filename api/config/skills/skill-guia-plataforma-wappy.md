---
name: skill-guia-plataforma-wappy
description: Skill maestra de conocimiento de la plataforma WAPPY IA. Se activa cuando el usuario pregunta cómo hacer algo, dónde encontrar algo, cómo usar una herramienta, o solicita orientación sobre cualquier funcionalidad del ecosistema WAPPY IA y Somos SST.
scope: tenshi
triggers:
  - cómo hago
  - como hago
  - cómo puedo
  - como puedo
  - cómo se hace
  - como se hace
  - dónde puedo
  - donde puedo
  - cómo funciona
  - como funciona
  - dónde está
  - donde esta
  - cómo accedo
  - como accedo
  - me puedes explicar
  - qué es el
  - que es el
  - qué herramienta
  - que herramienta
  - qué módulo
  - que modulo
  - cómo uso
  - como uso
  - cuál es la ruta
  - cual es la ruta
  - instrucciones
  - guíame
  - guiame
  - explícame
  - explicame
  - dónde encuentro
  - donde encuentro
---

# Skill Maestra: Guía Completa de la Plataforma WAPPY IA

Cuando el usuario haga una pregunta de tipo "¿cómo hago X?", "¿dónde está Y?", "¿cómo funciona Z?", Tenshi debe orientarlo usando este mapa completo de la plataforma. NUNCA inventes rutas o módulos que no estén en esta guía.

---

## 🗺️ MAPA GENERAL DE LA PLATAFORMA

```
WAPPY IA (wappy.club)
├── 💬 Chat Principal (/c/new)
│   ├── Catálogo de Agentes Especializados (seleccionable al iniciar chat)
│   ├── Subida de archivos (PDF, Word, Excel, imágenes)
│   └── Herramientas de agentes: Canvas, Matriz IPEVAR, Editor Live
│
├── 🏢 Somos SST (/sgsst)
│   ├── MÓDULO 1: Motor Bio-Individual (Bio Motor)
│   └── MÓDULO 2: Ecosistema SG-SST General
│
├── 🎓 Aula de Estudio (/training)
├── 📰 Blog Corporativo (/blog)
├── 📁 Archivos (/search?type=files)
└── 💳 Planes y Suscripción (/planes)
```

---

## 💬 CHAT PRINCIPAL — ¿Cómo accedo a los agentes especializados?

**Ruta:** Ir al Chat Principal → Iniciar un nuevo chat → Seleccionar el agente del catálogo.

### Agentes disponibles y cuándo usarlos

| Área | Agente | Para qué sirve |
|---|---|---|
| SST General | Consultor SG-SST | Consultoría general en gestión SST |
| SST Campo | Profesional SST | Implementación y control operativo en campo |
| Auditoría | Auditor SG-SST | Auditoría interna, diagnóstico Resolución 0312 |
| Clínica y salud | Médico Laboral | Exámenes médicos, incapacidades, restricciones, profesiogramas |
| Salud mental | Psicólogo SST | Batería psicosocial, factores intralaborales/extralaborales, COPASST |
| Bienestar | Terapeuta en Salud Mental | Programas de bienestar, estrés, desconexión laboral |
| Rehabilitación | Fisioterapeuta Laboral | Lesiones musculoesqueléticas, adaptación de puesto, ROSA/OWAS |
| Nutrición | Nutricionista Laboral | Hábitos alimenticios, comedores industriales |
| Primeros auxilios | Primer Respondiente | Atención de urgencias básicas, botiquín, brigadas |
| Emergencias | Coordinador de Emergencias | Plan de emergencias, simulacros, brigadas, geolocalización de recursos |
| Riesgo eléctrico | Ingeniero Electricista SST | RETIE, trabajos eléctricos, instalaciones, 5 Reglas de Oro |
| Riesgo biológico | Especialista en Bioseguridad | Agentes biológicos, bioseguridad, EPIs, residuos peligrosos |
| Riesgo químico | Ingeniero Químico SST | HDS/FDS, derrames, almacenamiento químico, SGA |
| Riesgo vial | Coordinador de Seguridad Vial | PESV, conductores, accidentes de tránsito |
| Riesgo climático | Especialista en Riesgo Climático | Estrés térmico, UV solar, adaptación climática |
| Tareas críticas | Coordinador de Tareas Críticas | Alturas, espacios confinados, trabajos en caliente, LOTO |
| Minería | Ingeniero de Minas SST | Túneles, explosivos, ventilación en minas |
| Legal laboral | Abogado Laboral | Despidos, contratos, reforma laboral 2026, fueros |
| Capacitación | Coordinador de Capacitaciones | Diseño de programas y cronogramas de formación SST |
| Ambiental | Ingeniero Ambiental | Gestión ambiental, residuos, ISO 14001 |
| Investigación AT | Simulador de Accidentes SST | Árbol de fallas, 5 porqués, análisis de accidentalidad |
| Contenidos | Redactor Creativo | Blog SST, artículos técnicos, SEO |

### ¿Cómo se hacen los planes de emergencias y documentos largos en el Chat?
Los documentos extensos (planes de emergencias, políticas, reglamentos) se construyen dentro del chat con el agente correspondiente usando la herramienta **Canvas**. Canvas abre un editor interactivo en la pantalla dividida (derecha) donde el agente redacta el documento colaborativamente. El resultado se puede exportar a Word o PDF.

---

## 🏢 SOMOS SST — Mapa completo de módulos

### MÓDULO 1: Motor Bio-Individual (Bio Motor)
*El ser humano en el centro de la prevención.*

| Qué busca el usuario | Dónde está en Somos SST | Ruta |
|---|---|---|
| Perfil y datos del trabajador | Perfiles Sociodemográficos | `/sgsst/perfiles-sociodemograficos` |
| Exámenes médicos y vencimientos | Exámenes Médicos (dentro del perfil del trabajador) | Somos SST → Bio Motor → Exámenes |
| Accidentes registrados, estadísticas | Investigación ATEL | `/sgsst/investigacion-atel` |
| Estadísticas e indicadores ATEL | Estadísticas ATEL | `/sgsst/estadisticas-atel` |

### MÓDULO 2: Ecosistema SG-SST General
*Gestión documental y normativa.*

| Qué busca el usuario | Dónde está en Somos SST | Ruta |
|---|---|---|
| Diagnóstico Resolución 0312 | Diagnóstico Inicial | `/sgsst/diagnostico` |
| Matriz de peligros GTC-45 | Matriz IPEVAR | `/sgsst/matriz-peligros` |
| Política SST | Política SST | `/sgsst/politica` |
| Objetivos SST | Objetivos SST | `/sgsst/objetivos` |
| Permisos de trabajo en alturas | Permiso de Alturas | `/sgsst/permiso-alturas` |
| Análisis de Tarea Segura | ATS | `/sgsst/ats` |
| Dotación de EPP | EPP | `/sgsst/epp` |
| Plan de Emergencias / Análisis de Vulnerabilidad | Vulnerabilidad | `/sgsst/vulnerabilidad` |
| Reporte de actos y condiciones inseguras | Reporte de Actos | `/sgsst/reporte-actos` |
| Plan Estratégico de Seguridad Vial | PESV | `/sgsst/pesv` |
| Reglamento de Higiene y Seguridad Industrial | RHS | `/sgsst/reglamento-higiene` |
| Reglamento Interno de Trabajo | RIT | `/sgsst/reglamento-interno` |
| Normatividad y cumplimiento legal | Matriz Legal | `/sgsst/matriz-legal` |
| Auditoría interna SG-SST | Auditoría | `/sgsst/auditoria` |
| Revisión gerencial / Alta Dirección | Alta Dirección | `/sgsst/alta-direccion` |
| Acciones Correctivas, Preventivas y de Mejora | Centro ACPM | `/sgsst/acpm` |
| Inteligencia Predictiva (solo Plan Pro) | Dashboard Predictivo | `/sgsst/dashboard-predictivo` |

### ¿Cómo funciona la botonera estándar de Somos SST?
Todos los aplicativos tienen la misma barra de herramientas:
- **🪄 IA Dummy**: Autocompleta datos simulados realistas para pruebas.
- **💾 Guardar Datos**: Guarda el progreso.
- **⏱️ Historial**: Consulta documentos anteriores generados.
- **✨ Generar Informe con IA**: Procesa la información y redacta el documento en el LiveEditor.
- **LiveEditor**: Editor enriquecido con opción "Editar con IA", vista a pantalla completa y exportación a PDF y Word.

---

## 🔮 HERRAMIENTAS ESPECIALES DE IA

| Herramienta | Para qué sirve | Cómo acceder |
|---|---|---|
| **Análisis en Vivo** (`/liva`) | Análisis de documentos PDF/Word/imágenes con IA. Genera informe HTML editable. | Solo Plan Pro → `/liva` |
| **Editor de Archivos con IA** | Editar documentos Word/PDF con asistencia de IA, firmas digitales | Solo Plan Pro → `/archivos` |
| **Centro de Inteligencia Predictiva** | Dashboard predictivo de siniestralidad cruzando 8+ aplicativos | Solo Plan Pro → `/sgsst/dashboard-predictivo` |
| **Aula de Estudio** | Cursos de SST y de cómo usar WAPPY IA | Todos los planes → `/training` |
| **Blog WAPPY** | Artículos técnicos, normatividad actualizada | Plan Go en adelante → `/blog` |

---

## 💳 PLANES — ¿Qué incluye cada plan?

| Plan | Precio aprox. | Qué incluye |
|---|---|---|
| **Gratis** | $0 | Chat IA básico, hasta 10 conversaciones, Aula de Estudio |
| **Go** | ~$49.200 COP/mes | Más conversaciones, Blog, hasta 30 conversaciones, claves API propias |
| **Plus** | ~$57.800 COP/mes | Todo + **Acceso completo a Somos SST** (Bio Motor + Ecosistema), conversaciones ilimitadas |
| **Pro** | ~$66.300 COP/mes | Todo lo de Plus + Centro Predictivo + Análisis en Vivo + Editor de Archivos + Agentes personalizados |

> ⚠️ Siempre recomienda al usuario verificar precios actualizados en `/planes` ya que pueden existir promociones vigentes.

---

## 📋 FORMULARIOS PÚBLICOS (sin necesidad de cuenta)

Algunos procesos tienen formularios que los trabajadores pueden completar desde su celular sin login:
- **Perfil sociodemográfico**: El trabajador llena sus datos desde un enlace QR
- **Participación IPEVAR**: Identificar peligros por enlace público
- **Reporte de actos inseguros**: Reportar condiciones peligrosas sin cuenta
- **Testimonio de accidente**: El trabajador accidentado da su versión por enlace
- **Revisión gerencial**: El gerente firma el documento desde un enlace externo
- **Reglamento de Higiene e Interno**: Publicación pública compartible para carteleras

---

## 🔑 REGLA DE USO DE ESTA SKILL

Cuando el usuario pregunte "¿cómo hago X?" o "¿dónde está Y?", consulta esta guía y entrega la ruta exacta dentro de WAPPY IA. Si el usuario además necesita que Tenshi **ejecute la acción directamente** (editar, registrar, llamar agente), activa la skill de acción correspondiente. Nunca inventes módulos, rutas o herramientas que no estén en este documento.
