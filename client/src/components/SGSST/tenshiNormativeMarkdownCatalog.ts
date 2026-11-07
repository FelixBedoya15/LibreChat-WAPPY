// Catálogo Oficial de las 100 Normas en Markdown (.md) de la Base de Datos Normativa de Tenshi IA
export interface TenshiNormativeMarkdownDoc {
  id: string;
  fileName: string;
  title: string;
  category:
    | "vademecum_2026"
    | "resoluciones"
    | "decretos"
    | "leyes"
    | "sentencias_circulares"
    | "psicosocial_protocolos"
    | "codigo_sustantivo"
    | "normas_iso";
  categoryLabel: string;
  badge: string;
  summary: string;
  sizeKb: number;
}

export const TENSHI_NORMATIVE_CATEGORIES = [
  { id: "all", label: "📚 Todas las Normas .md (100)" },
  { id: "vademecum_2026", label: "🌟 Vademécum & 2024–2026" },
  { id: "resoluciones", label: "📋 Resoluciones SST" },
  { id: "decretos", label: "⚖️ Decretos" },
  { id: "leyes", label: "📜 Leyes" },
  { id: "sentencias_circulares", label: "🏛️ Sentencias & Circulares" },
  { id: "psicosocial_protocolos", label: "🧠 Batería y Protocolos Psicosociales" },
  { id: "codigo_sustantivo", label: "📘 Código Sustantivo del Trabajo" },
  { id: "normas_iso", label: "🌐 Normas ISO" },
] as const;

export const TENSHI_NORMATIVE_MARKDOWN_DOCS: TenshiNormativeMarkdownDoc[] = [
  {
    "id": "CODIGO_SUSTENTIVO_DE_TRABAJO_parte_13",
    "fileName": "CODIGO_SUSTENTIVO_DE_TRABAJO_parte_13.md",
    "title": "Código Sustantivo DE TRABAJO parte 13",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CODIGO SUSTENTIVO DE TRABAJO parte 13",
    "sizeKb": 35
  },
  {
    "id": "Ley_2365_de_2024_Por_medio_de_la_cual_se_adoptan_medidas_de_prevenci_n__protecci_n_y_atenci_n_del_acoso_sexual_en_el__mbito_laboral",
    "fileName": "Ley_2365_de_2024_Por_medio_de_la_cual_se_adoptan_medidas_de_prevenci_n__protecci_n_y_atenci_n_del_acoso_sexual_en_el__mbito_laboral.md",
    "title": "Ley 2365 de 2024 Por medio de la cual se adoptan medidas de prevención protección y atención del acoso sexual en el mbito laboral",
    "category": "vademecum_2026",
    "categoryLabel": "🌟 Vademécum & Normas 2024–2026",
    "badge": "VIGENTE 2024-2026",
    "summary": "Ley 2365 de 2024 Por medio de la cual se adoptan medidas de prevención, protección y atención del acoso sexual en el ámbito laboral",
    "sizeKb": 31
  },
  {
    "id": "14-Protocolo-actuacion-situaciones-de-duelo-1",
    "fileName": "14-Protocolo-actuacion-situaciones-de-duelo-1.md",
    "title": "14 Protocolo actuacion situaciones de duelo 1",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "14-Protocolo-actuacion-situaciones-de-duelo-1",
    "sizeKb": 35
  },
  {
    "id": "Ley_2209_de_2022_Por_medio_de_la_cual_se_modifica_el_Articulo_18_de_la_Ley_1010_de_2006",
    "fileName": "Ley_2209_de_2022_Por_medio_de_la_cual_se_modifica_el_Articulo_18_de_la_Ley_1010_de_2006.md",
    "title": "Ley 2209 de 2022 Por medio de la cual se modifica el Articulo 18 de la Ley 1010 de 2006",
    "category": "leyes",
    "categoryLabel": "📜 Leyes de la República",
    "badge": "LEY",
    "summary": "Ley 2209 de 2022 Por medio de la cual se modifica el Articulo 18 de la Ley 1010 de 2006",
    "sizeKb": 2
  },
  {
    "id": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_11",
    "fileName": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_11.md",
    "title": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 11",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 11",
    "sizeKb": 20
  },
  {
    "id": "Sentencia_CSJ_SL2303-2025_y_SL2527-2025_Mutuo_Acuerdo_y_Fuero_de_Salud",
    "fileName": "Sentencia_CSJ_SL2303-2025_y_SL2527-2025_Mutuo_Acuerdo_y_Fuero_de_Salud.md",
    "title": "Sentencia CSJ SL2303 2025 y SL2527 2025 Mutuo Acuerdo y Fuero de Salud",
    "category": "sentencias_circulares",
    "categoryLabel": "🏛️ Sentencias & Circulares 2024–2026",
    "badge": "SENTENCIA",
    "summary": "Sentencias CSJ SL2303-2025 y SL2527-2025 - Sala de Casación Laboral",
    "sizeKb": 2
  },
  {
    "id": "Ley_100_de_1993_Por_la_cual_se_crea_el_sistema_de_seguridad_social_integral_y_se_dictan_otras_disposiciones",
    "fileName": "Ley_100_de_1993_Por_la_cual_se_crea_el_sistema_de_seguridad_social_integral_y_se_dictan_otras_disposiciones.md",
    "title": "Ley 100 de 1993 Por la cual se crea el sistema de seguridad social integral y se dictan otras disposiciones",
    "category": "leyes",
    "categoryLabel": "📜 Leyes de la República",
    "badge": "LEY",
    "summary": "Ley 100 de 1993 Por la cual se crea el sistema de seguridad social integral y se dictan otras disposiciones",
    "sizeKb": 322
  },
  {
    "id": "12-Protocolo-prevencion-y-actuacion-estres-postraumatico",
    "fileName": "12-Protocolo-prevencion-y-actuacion-estres-postraumatico.md",
    "title": "12 Protocolo prevencion y actuacion estres postraumatico",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "12-Protocolo-prevencion-y-actuacion-estres-postraumatico",
    "sizeKb": 65
  },
  {
    "id": "Bateria-riesgo-psicosocial-1",
    "fileName": "Bateria-riesgo-psicosocial-1.md",
    "title": "Bateria riesgo psicosocial 1",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "Bateria-riesgo-psicosocial-1",
    "sizeKb": 187
  },
  {
    "id": "Resolucion_0773_de_2021_Por_la_cual_se_definen_las",
    "fileName": "Resolucion_0773_de_2021_Por_la_cual_se_definen_las.md",
    "title": "Resolucion 0773 de 2021 Por la cual se definen las",
    "category": "resoluciones",
    "categoryLabel": "📋 Resoluciones Técnicas SST",
    "badge": "RESOLUCIÓN",
    "summary": "Resolucion 0773 de 2021 Por la cual se definen las acciones que deben desarrollar los empleadores para la aplicación del Sistema Globalmente Armonizado (SGA)",
    "sizeKb": 28
  },
  {
    "id": "Sentencias_CSJ_SL1015-2026_y_SL1139-2026_Salud_Mental_y_Estabilidad_Laboral_Reforzada",
    "fileName": "Sentencias_CSJ_SL1015-2026_y_SL1139-2026_Salud_Mental_y_Estabilidad_Laboral_Reforzada.md",
    "title": "Sentencias CSJ SL1015 2026 y SL1139 2026 Salud Mental y Estabilidad Laboral Reforzada",
    "category": "sentencias_circulares",
    "categoryLabel": "🏛️ Sentencias & Circulares 2024–2026",
    "badge": "SENTENCIA",
    "summary": "Sentencias CSJ SL1015-2026 y SL1139-2026 - Corte Suprema de Justicia",
    "sizeKb": 1
  },
  {
    "id": "Ley_2251_de_2022_Por_el_cual_se_dictan_normas_para",
    "fileName": "Ley_2251_de_2022_Por_el_cual_se_dictan_normas_para.md",
    "title": "Ley 2251 de 2022 Por el cual se dictan normas para",
    "category": "leyes",
    "categoryLabel": "📜 Leyes de la República",
    "badge": "LEY",
    "summary": "Ley 2251 de 2022 Por el cual se dictan normas para el diseño e implementacion de la politica de seguridad vial",
    "sizeKb": 32
  },
  {
    "id": "ISO_19011_2018_Directrices_para_la_auditor_a_de_lo",
    "fileName": "ISO_19011_2018_Directrices_para_la_auditor_a_de_lo.md",
    "title": "ISO 19011 2018 Directrices para la auditoría de lo",
    "category": "normas_iso",
    "categoryLabel": "🌐 Normas Internacionales ISO",
    "badge": "ISO SST",
    "summary": "ISO 19011 2018 Directrices para la auditoría de los sistemas de gestión",
    "sizeKb": 161
  },
  {
    "id": "Decreto_1496_de_2018_Por_el_cual_se_adopta_el_Sist",
    "fileName": "Decreto_1496_de_2018_Por_el_cual_se_adopta_el_Sist.md",
    "title": "Decreto 1496 de 2018 Por el cual se adopta el Sist",
    "category": "decretos",
    "categoryLabel": "⚖️ Decretos Reglamentarios SST",
    "badge": "DECRETO",
    "summary": "Decreto 1496 de 2018 Por el cual se adopta el Sistema Globalmente Armonizado de Clasificación y etiquetado de Productos Químicos",
    "sizeKb": 21
  },
  {
    "id": "Ley_1616_de_2013_Por_medio_del_cual_se_expide_la_Ley_de_salud_mental",
    "fileName": "Ley_1616_de_2013_Por_medio_del_cual_se_expide_la_Ley_de_salud_mental.md",
    "title": "Ley 1616 de 2013 Por medio del cual se expide la Ley de salud mental",
    "category": "leyes",
    "categoryLabel": "📜 Leyes de la República",
    "badge": "LEY",
    "summary": "Ley 1616 de 2013 Por medio del cual se expide la Ley de salud mental",
    "sizeKb": 46
  },
  {
    "id": "Codigo_sustantivo_de_Trabajo",
    "fileName": "Codigo_sustantivo_de_Trabajo.md",
    "title": "Codigo sustantivo de Trabajo",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "Codigo sustantivo de Trabajo",
    "sizeKb": 416
  },
  {
    "id": "Resoluci_n_1401_de_2007_Por_la_cual_se_reglamenta_la_investigaci_n_de_incidentes_y_accidentes_de_trabajo",
    "fileName": "Resoluci_n_1401_de_2007_Por_la_cual_se_reglamenta_la_investigaci_n_de_incidentes_y_accidentes_de_trabajo.md",
    "title": "Resolución 1401 de 2007 Por la cual se reglamenta la investigación de incidentes y accidentes de trabajo",
    "category": "resoluciones",
    "categoryLabel": "📋 Resoluciones Técnicas SST",
    "badge": "RESOLUCIÓN",
    "summary": "Resolución 1401 de 2007 Por la cual se reglamenta la investigación de incidentes y accidentes de trabajo",
    "sizeKb": 19
  },
  {
    "id": "Decreto_1072_de_2015_Por_medio_del_cual_se_expide_el_Decreto__nico_Reglamentario_del_Sector_Trabajo",
    "fileName": "Decreto_1072_de_2015_Por_medio_del_cual_se_expide_el_Decreto__nico_Reglamentario_del_Sector_Trabajo.md",
    "title": "Decreto 1072 de 2015 Por medio del cual se expide el Decreto nico Reglamentario del Sector Trabajo",
    "category": "decretos",
    "categoryLabel": "⚖️ Decretos Reglamentarios SST",
    "badge": "DECRETO",
    "summary": "Decreto 1072 de 2015 Por medio del cual se expide el Decreto Único Reglamentario del Sector Trabajo",
    "sizeKb": 1368
  },
  {
    "id": "CODIGO_SUSTENTIVO_DE_TRABAJO_parte_15",
    "fileName": "CODIGO_SUSTENTIVO_DE_TRABAJO_parte_15.md",
    "title": "Código Sustantivo DE TRABAJO parte 15",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CODIGO SUSTENTIVO DE TRABAJO parte 15",
    "sizeKb": 19
  },
  {
    "id": "Resoluci_n_1857_de_2024_Por_la_cual_se_establecen_",
    "fileName": "Resoluci_n_1857_de_2024_Por_la_cual_se_establecen_.md",
    "title": "Resolución 1857 de 2024 Por la cual se establecen",
    "category": "vademecum_2026",
    "categoryLabel": "🌟 Vademécum & Normas 2024–2026",
    "badge": "VIGENTE 2024-2026",
    "summary": "Resolución 1857 de 2024 Por la cual se establecen los requisitos mínimos de seguridad y salud para el desarrollo de trabajo en calderas y se dictan otras disposiciones",
    "sizeKb": 1
  },
  {
    "id": "03-Protocolo-intervencion-sector-administracion-publica",
    "fileName": "03-Protocolo-intervencion-sector-administracion-publica.md",
    "title": "03 Protocolo intervencion sector administracion publica",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "03-Protocolo-intervencion-sector-administracion-publica",
    "sizeKb": 60
  },
  {
    "id": "10-Protocolo-prevencion-y-actuacion-burnout",
    "fileName": "10-Protocolo-prevencion-y-actuacion-burnout.md",
    "title": "10 Protocolo prevencion y actuacion burnout",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "10-Protocolo-prevencion-y-actuacion-burnout",
    "sizeKb": 72
  },
  {
    "id": "06-Protocolo-intervencion-sector-transporte",
    "fileName": "06-Protocolo-intervencion-sector-transporte.md",
    "title": "06 Protocolo intervencion sector transporte",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "06-Protocolo-intervencion-sector-transporte",
    "sizeKb": 85
  },
  {
    "id": "Ley_100_de_1993._Por_la_cual_se_crea_el_sistema_de_seguridad_social_integral_y_se_dictan_otras_disposiciones",
    "fileName": "Ley_100_de_1993._Por_la_cual_se_crea_el_sistema_de_seguridad_social_integral_y_se_dictan_otras_disposiciones.md",
    "title": "Ley 100 de 1993. Por la cual se crea el sistema de seguridad social integral y se dictan otras disposiciones",
    "category": "leyes",
    "categoryLabel": "📜 Leyes de la República",
    "badge": "LEY",
    "summary": "Ley 100 de 1993. Por la cual se crea el sistema de seguridad social integral y se dictan otras disposiciones",
    "sizeKb": 322
  },
  {
    "id": "Ley_2466_de_2025_Congreso_de_la_Rep_blica_de_Colombia",
    "fileName": "Ley_2466_de_2025_Congreso_de_la_Rep_blica_de_Colombia.md",
    "title": "Ley 2466 de 2025 Congreso de la Rep blica de Colombia",
    "category": "vademecum_2026",
    "categoryLabel": "🌟 Vademécum & Normas 2024–2026",
    "badge": "VIGENTE 2024-2026",
    "summary": "Ley 2466 de 2025 Congreso de la República de Colombia",
    "sizeKb": 119
  },
  {
    "id": "Sentencia_SU-111_de_2025_Corte_Constitucional_Unificacion_Estabilidad_Laboral_Reforzada_Salud",
    "fileName": "Sentencia_SU-111_de_2025_Corte_Constitucional_Unificacion_Estabilidad_Laboral_Reforzada_Salud.md",
    "title": "Sentencia SU 111 de 2025 Corte Constitucional Unificacion Estabilidad Laboral Reforzada Salud",
    "category": "sentencias_circulares",
    "categoryLabel": "🏛️ Sentencias & Circulares 2024–2026",
    "badge": "SENTENCIA",
    "summary": "Sentencia SU-111 de 2025 - Corte Constitucional",
    "sizeKb": 2
  },
  {
    "id": "Circular_0110_de_2026_Ministerio_del_Trabajo_Facultad_Preventiva_de_Advertir_y_Aconsejar",
    "fileName": "Circular_0110_de_2026_Ministerio_del_Trabajo_Facultad_Preventiva_de_Advertir_y_Aconsejar.md",
    "title": "Circular 0110 de 2026 Ministerio del Trabajo Facultad Preventiva de Advertir y Aconsejar",
    "category": "sentencias_circulares",
    "categoryLabel": "🏛️ Sentencias & Circulares 2024–2026",
    "badge": "CIRCULAR 2026",
    "summary": "Circular 0110 de 2026 — Ministerio del Trabajo (Facultad Discrecional Preventiva de Advertir y Aconsejar en la Inspección del Trabajo y Seguridad Social)",
    "sizeKb": 11
  },
  {
    "id": "Resoluci_n_40117_de_2024_RETIE",
    "fileName": "Resoluci_n_40117_de_2024_RETIE.md",
    "title": "Resolución 40117 de 2024 RETIE",
    "category": "vademecum_2026",
    "categoryLabel": "🌟 Vademécum & Normas 2024–2026",
    "badge": "VIGENTE 2024-2026",
    "summary": "Resolución 40117 de 2024 RETIE",
    "sizeKb": 1176
  },
  {
    "id": "Sentencia_CSJ_SL2480-2025_Exoneracion_Culpa_Patronal_por_Imprudencia_Temeraria_del_Trabajador",
    "fileName": "Sentencia_CSJ_SL2480-2025_Exoneracion_Culpa_Patronal_por_Imprudencia_Temeraria_del_Trabajador.md",
    "title": "Sentencia CSJ SL2480 2025 Exoneracion Culpa Patronal por Imprudencia Temeraria del Trabajador",
    "category": "sentencias_circulares",
    "categoryLabel": "🏛️ Sentencias & Circulares 2024–2026",
    "badge": "SENTENCIA",
    "summary": "Sentencia CSJ SL2480-2025 - Corte Suprema de Justicia",
    "sizeKb": 1
  },
  {
    "id": "Resoluci_n_5018_de_2019_Por_la_cual_se_establecen_",
    "fileName": "Resoluci_n_5018_de_2019_Por_la_cual_se_establecen_.md",
    "title": "Resolución 5018 de 2019 Por la cual se establecen",
    "category": "resoluciones",
    "categoryLabel": "📋 Resoluciones Técnicas SST",
    "badge": "RESOLUCIÓN",
    "summary": "Resolución 5018 de 2019 Por la cual se establecen lineamientos en Seguridad y Salud en el trabajo en los Procesos de Generación, Transmisión, Distribución y Comercialización d",
    "sizeKb": 10
  },
  {
    "id": "Guia_promocion__prevencion_e_intervenci_n.",
    "fileName": "Guia_promocion__prevencion_e_intervenci_n..md",
    "title": "Guia promocion prevencion e intervención.",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "Guia promocion, prevencion e intervención.",
    "sizeKb": 217
  },
  {
    "id": "Bateria-riesgo-psicosocial-4",
    "fileName": "Bateria-riesgo-psicosocial-4.md",
    "title": "Bateria riesgo psicosocial 4",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "Bateria-riesgo-psicosocial-4",
    "sizeKb": 192
  },
  {
    "id": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_10",
    "fileName": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_10.md",
    "title": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 10",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 10",
    "sizeKb": 22
  },
  {
    "id": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_7",
    "fileName": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_7.md",
    "title": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 7",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 7",
    "sizeKb": 22
  },
  {
    "id": "Resoluci_n_1888_de_2025_Ministerio_de_Salud_y_Protecci_n_Social",
    "fileName": "Resoluci_n_1888_de_2025_Ministerio_de_Salud_y_Protecci_n_Social.md",
    "title": "Resolución 1888 de 2025 Ministerio de Salud y protección Social",
    "category": "vademecum_2026",
    "categoryLabel": "🌟 Vademécum & Normas 2024–2026",
    "badge": "VIGENTE 2024-2026",
    "summary": "Resolución 1888 de 2025 Ministerio de Salud y Protección Social",
    "sizeKb": 20
  },
  {
    "id": "CODIGO_SUSTENTIVO_DE_TRABAJO_parte_14",
    "fileName": "CODIGO_SUSTENTIVO_DE_TRABAJO_parte_14.md",
    "title": "Código Sustantivo DE TRABAJO parte 14",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CODIGO SUSTENTIVO DE TRABAJO parte 14",
    "sizeKb": 23
  },
  {
    "id": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_2",
    "fileName": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_2.md",
    "title": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 2",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 2",
    "sizeKb": 56
  },
  {
    "id": "Resoluci_n_908_DE_2025_Por_la_cual_se_establecen_los_requisitos_y_el_procedimiento_para_la_expedici_n__renovaci_n_y_cambios_de_la_licencia_de_seguridad_y_salud_en_el_trabajo",
    "fileName": "Resoluci_n_908_DE_2025_Por_la_cual_se_establecen_los_requisitos_y_el_procedimiento_para_la_expedici_n__renovaci_n_y_cambios_de_la_licencia_de_seguridad_y_salud_en_el_trabajo.md",
    "title": "Resolución 908 DE 2025 Por la cual se establecen los requisitos y el procedimiento para la expedici n renovaci n y cambios de la licencia de seguridad y salud en el trabajo",
    "category": "vademecum_2026",
    "categoryLabel": "🌟 Vademécum & Normas 2024–2026",
    "badge": "VIGENTE 2024-2026",
    "summary": "Resolución 908 DE 2025 Por la cual se establecen los requisitos y el procedimiento para la expedición, renovación y cambios de la licencia de seguridad y salud en el trabajo",
    "sizeKb": 47
  },
  {
    "id": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_6",
    "fileName": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_6.md",
    "title": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 6",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 6",
    "sizeKb": 23
  },
  {
    "id": "Resoluci_n_491_de_2020_Por_la_cual_se_establecen_l",
    "fileName": "Resoluci_n_491_de_2020_Por_la_cual_se_establecen_l.md",
    "title": "Resolución 491 de 2020 Por la cual se establecen l",
    "category": "resoluciones",
    "categoryLabel": "📋 Resoluciones Técnicas SST",
    "badge": "RESOLUCIÓN",
    "summary": "Resolución 491 de 2020 Por la cual se establecen los requisitos mínimos de seguridad para el desarrollo de trabajos en espacios confinados y se dictan otras disposiciones",
    "sizeKb": 1
  },
  {
    "id": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_9",
    "fileName": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_9.md",
    "title": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 9",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 9",
    "sizeKb": 28
  },
  {
    "id": "Sentencia_CSJ_SL852-2026_Accidente_de_Trabajo_Actos_Preparatorios_y_Llegada_Anticipada",
    "fileName": "Sentencia_CSJ_SL852-2026_Accidente_de_Trabajo_Actos_Preparatorios_y_Llegada_Anticipada.md",
    "title": "Sentencia CSJ SL852 2026 Accidente de Trabajo Actos Preparatorios y Llegada Anticipada",
    "category": "sentencias_circulares",
    "categoryLabel": "🏛️ Sentencias & Circulares 2024–2026",
    "badge": "SENTENCIA",
    "summary": "Sentencia CSJ SL852-2026 - Accidente de Trabajo en Actos Preparatorios y Llegada Anticipada",
    "sizeKb": 4
  },
  {
    "id": "Resoluci_n_2051_DE_2022_Por_la_cual_se_definen_los_Est_ndares_M_nimos_del_Sistema",
    "fileName": "Resoluci_n_2051_DE_2022_Por_la_cual_se_definen_los_Est_ndares_M_nimos_del_Sistema.md",
    "title": "Resolución 2051 DE 2022 Por la cual se definen los Estándares Mínimos del Sistema",
    "category": "resoluciones",
    "categoryLabel": "📋 Resoluciones Técnicas SST",
    "badge": "RESOLUCIÓN",
    "summary": "Resolución 2051 DE 2022 Por la cual se definen los Estándares Mínimos del Sistema",
    "sizeKb": 12
  },
  {
    "id": "RESOLUCION_1197_DE_2024_Certificacion_de_Incapacidad",
    "fileName": "RESOLUCION_1197_DE_2024_Certificacion_de_Incapacidad.md",
    "title": "RESOLUCION 1197 DE 2024 Certificacion de Incapacidad",
    "category": "vademecum_2026",
    "categoryLabel": "🌟 Vademécum & Normas 2024–2026",
    "badge": "VIGENTE 2024-2026",
    "summary": "RESOLUCION 1197 DE 2024 Certificacion de Incapacidad",
    "sizeKb": 53
  },
  {
    "id": "Bateria-riesgo-psicosocial-3",
    "fileName": "Bateria-riesgo-psicosocial-3.md",
    "title": "Bateria riesgo psicosocial 3",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "Bateria-riesgo-psicosocial-3",
    "sizeKb": 118
  },
  {
    "id": "Resoluci_n_312_de_2019_Estandares_minimos_en_Seguridad_y_Salud_en_el_Trabajo",
    "fileName": "Resoluci_n_312_de_2019_Estandares_minimos_en_Seguridad_y_Salud_en_el_Trabajo.md",
    "title": "Resolución 312 de 2019 Estandares minimos en Seguridad y Salud en el Trabajo",
    "category": "resoluciones",
    "categoryLabel": "📋 Resoluciones Técnicas SST",
    "badge": "RESOLUCIÓN",
    "summary": "Resolución 312 de 2019 Estandares minimos en Seguridad y Salud en el Trabajo",
    "sizeKb": 125
  },
  {
    "id": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_8",
    "fileName": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_8.md",
    "title": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 8",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 8",
    "sizeKb": 33
  },
  {
    "id": "Resoluci_n_2764_de_2022_Por_la_cual_se_adopta_la_Bater_a_de_instrumentos_para_la_evaluaci_n_de_factores_de_Riesgo_Psicosocial",
    "fileName": "Resoluci_n_2764_de_2022_Por_la_cual_se_adopta_la_Bater_a_de_instrumentos_para_la_evaluaci_n_de_factores_de_Riesgo_Psicosocial.md",
    "title": "Resolución 2764 de 2022 Por la cual se adopta la Batería de instrumentos para la evaluación de factores de Riesgo Psicosocial",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "Resolución 2764 de 2022 Por la cual se adopta la Batería de instrumentos para la evaluación de factores de Riesgo Psicosocial",
    "sizeKb": 30
  },
  {
    "id": "Resoluci_n_2646_de_2008_Por_la_cual_se_establecen_disposiciones_para_la_identificaci_n__evaluaci_n__prevenci_n__intervenci_n_y_monitoreo_permanente_de_la_exposici_n_a_factores_de_riesgo_psicosocial",
    "fileName": "Resoluci_n_2646_de_2008_Por_la_cual_se_establecen_disposiciones_para_la_identificaci_n__evaluaci_n__prevenci_n__intervenci_n_y_monitoreo_permanente_de_la_exposici_n_a_factores_de_riesgo_psicosocial.md",
    "title": "Resolución 2646 de 2008 Por la cual se establecen disposiciones para la identificación evaluación prevención intervención y monitoreo permanente de la exposici n a factores de riesgo psicosocial",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "Resolución 2646 de 2008 Por la cual se establecen disposiciones para la identificación, evaluación, prevención, intervención y monitoreo permanente de la exposición a factores",
    "sizeKb": 30
  },
  {
    "id": "Codigo_Sustantivo_del_Trabajo",
    "fileName": "Codigo_Sustantivo_del_Trabajo.md",
    "title": "Codigo Sustantivo del Trabajo",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "Codigo Sustantivo del Trabajo",
    "sizeKb": 416
  },
  {
    "id": "11-Protocolo-prevencion-y-actuacion-depresion",
    "fileName": "11-Protocolo-prevencion-y-actuacion-depresion.md",
    "title": "11 Protocolo prevencion y actuacion depresion",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "11-Protocolo-prevencion-y-actuacion-depresion",
    "sizeKb": 52
  },
  {
    "id": "Sentencia_T-262_de_2025_Corte_Constitucional_Debido_Proceso_Comites_de_Convivencia",
    "fileName": "Sentencia_T-262_de_2025_Corte_Constitucional_Debido_Proceso_Comites_de_Convivencia.md",
    "title": "Sentencia T 262 de 2025 Corte Constitucional Debido Proceso Comites de Convivencia",
    "category": "sentencias_circulares",
    "categoryLabel": "🏛️ Sentencias & Circulares 2024–2026",
    "badge": "SENTENCIA",
    "summary": "Sentencia T-262 de 2025 - Corte Constitucional",
    "sizeKb": 1
  },
  {
    "id": "Resoluci_n_1401_de_2007_Ministerio_de_la_Protecci_n_Social",
    "fileName": "Resoluci_n_1401_de_2007_Ministerio_de_la_Protecci_n_Social.md",
    "title": "Resolución 1401 de 2007 Ministerio de la protección Social",
    "category": "resoluciones",
    "categoryLabel": "📋 Resoluciones Técnicas SST",
    "badge": "RESOLUCIÓN",
    "summary": "Resolución 1401 de 2007 Ministerio de la Protección Social",
    "sizeKb": 22
  },
  {
    "id": "Resoluci_n_350_de_2022_Por_medio_de_la_cual_se_ado",
    "fileName": "Resoluci_n_350_de_2022_Por_medio_de_la_cual_se_ado.md",
    "title": "Resolución 350 de 2022 Por medio de la cual se ado",
    "category": "resoluciones",
    "categoryLabel": "📋 Resoluciones Técnicas SST",
    "badge": "RESOLUCIÓN",
    "summary": "Resoluciòn 350 de 2022 Por medio de la cual se adopta el protocolo general de bioseguridad para el desarrollo de las actividades económicas, sociales, culturales y del Estado",
    "sizeKb": 8
  },
  {
    "id": "Decreto_676_DE_2020_Por_el_cual_se_incorpora_una_enfermedad_directa_a_la_tabla_de_enfermedades_laborales",
    "fileName": "Decreto_676_DE_2020_Por_el_cual_se_incorpora_una_enfermedad_directa_a_la_tabla_de_enfermedades_laborales.md",
    "title": "Decreto 676 DE 2020 Por el cual se incorpora una enfermedad directa a la tabla de enfermedades laborales",
    "category": "decretos",
    "categoryLabel": "⚖️ Decretos Reglamentarios SST",
    "badge": "DECRETO",
    "summary": "Decreto 676 DE 2020 Por el cual se incorpora una enfermedad directa a la tabla de enfermedades laborales",
    "sizeKb": 17
  },
  {
    "id": "Decreto_356_de_1994_Por_el_cual_se_expide_el_Estat",
    "fileName": "Decreto_356_de_1994_Por_el_cual_se_expide_el_Estat.md",
    "title": "Decreto 356 de 1994 Por el cual se expide el Estat",
    "category": "decretos",
    "categoryLabel": "⚖️ Decretos Reglamentarios SST",
    "badge": "DECRETO",
    "summary": "Decreto 356 de 1994 Por el cual se expide el Estatuto de Vigilancia y Seguridad Privada",
    "sizeKb": 84
  },
  {
    "id": "CODIGO_SUSTENTIVO_DE_TRABAJO_parte_16",
    "fileName": "CODIGO_SUSTENTIVO_DE_TRABAJO_parte_16.md",
    "title": "Código Sustantivo DE TRABAJO parte 16",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CODIGO SUSTENTIVO DE TRABAJO parte 16",
    "sizeKb": 24
  },
  {
    "id": "13-Protocolo-prevencion-y-actuacion-estres-agudo",
    "fileName": "13-Protocolo-prevencion-y-actuacion-estres-agudo.md",
    "title": "13 Protocolo prevencion y actuacion estres agudo",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "13-Protocolo-prevencion-y-actuacion-estres-agudo",
    "sizeKb": 54
  },
  {
    "id": "Ley_1010_de_2006_Por_medio_de_la_cual_se_adoptan_medidas_para_prevenir__corregir_y_sancionar_el_acoso_laboral_y_otros_hostigamientos_en_el_marco_de_las_relaciones_de_trabajo",
    "fileName": "Ley_1010_de_2006_Por_medio_de_la_cual_se_adoptan_medidas_para_prevenir__corregir_y_sancionar_el_acoso_laboral_y_otros_hostigamientos_en_el_marco_de_las_relaciones_de_trabajo.md",
    "title": "Ley 1010 de 2006 Por medio de la cual se adoptan medidas para prevenir corregir y sancionar el acoso laboral y otros hostigamientos en el marco de las relaciones de trabajo",
    "category": "leyes",
    "categoryLabel": "📜 Leyes de la República",
    "badge": "LEY",
    "summary": "Ley 1010 de 2006 Por medio de la cual se adoptan medidas para prevenir, corregir y sancionar el acoso laboral y otros hostigamientos en el marco de las relaciones de trabajo",
    "sizeKb": 26
  },
  {
    "id": "Decreto_1477_de_2014_Por_el_cual_se_expide_la_Tabla_de_Enfermedades_Laborales.",
    "fileName": "Decreto_1477_de_2014_Por_el_cual_se_expide_la_Tabla_de_Enfermedades_Laborales..md",
    "title": "Decreto 1477 de 2014 Por el cual se expide la Tabla de Enfermedades Laborales.",
    "category": "decretos",
    "categoryLabel": "⚖️ Decretos Reglamentarios SST",
    "badge": "DECRETO",
    "summary": "Decreto 1477 de 2014 Por el cual se expide la Tabla de Enfermedades Laborales.",
    "sizeKb": 6
  },
  {
    "id": "entorno-laboral-saludable-2018",
    "fileName": "entorno-laboral-saludable-2018.md",
    "title": "entorno laboral saludable 2018",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "entorno-laboral-saludable-2018",
    "sizeKb": 103
  },
  {
    "id": "04-Protocolo-intervencion-sector-defensa",
    "fileName": "04-Protocolo-intervencion-sector-defensa.md",
    "title": "04 Protocolo intervencion sector defensa",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "04-Protocolo-intervencion-sector-defensa",
    "sizeKb": 74
  },
  {
    "id": "Ley_1920_de_2018_Cooperativas_especializadas_en_vi",
    "fileName": "Ley_1920_de_2018_Cooperativas_especializadas_en_vi.md",
    "title": "Ley 1920 de 2018 Cooperativas especializadas en vi",
    "category": "leyes",
    "categoryLabel": "📜 Leyes de la República",
    "badge": "LEY",
    "summary": "Ley 1920 de 2018 Cooperativas especializadas en vigilancia y seguridad privada",
    "sizeKb": 12
  },
  {
    "id": "Manual__nico_para_la_Calificaci_n_de_la_P_rdida_de_la_Capacidad_Laboral_y_Ocupacional_Decreto_1507_de_2014",
    "fileName": "Manual__nico_para_la_Calificaci_n_de_la_P_rdida_de_la_Capacidad_Laboral_y_Ocupacional_Decreto_1507_de_2014.md",
    "title": "Manual nico para la Calificación de la Pérdida de la Capacidad Laboral y Ocupacional Decreto 1507 de 2014",
    "category": "decretos",
    "categoryLabel": "⚖️ Decretos Reglamentarios SST",
    "badge": "DECRETO",
    "summary": "Manual Único para la Calificación de la Pérdida de la Capacidad Laboral y Ocupacional Decreto 1507 de 2014",
    "sizeKb": 566
  },
  {
    "id": "ISO_45001_Directrices_para_la_auditor_a_de_los_sis",
    "fileName": "ISO_45001_Directrices_para_la_auditor_a_de_los_sis.md",
    "title": "ISO 45001 Directrices para la auditoría de los sis",
    "category": "normas_iso",
    "categoryLabel": "🌐 Normas Internacionales ISO",
    "badge": "ISO SST",
    "summary": "ISO 45001 Directrices para la auditoría de los sistemas de gestión",
    "sizeKb": 156
  },
  {
    "id": "Decreto_539_de_2022_Por_el_cual_se_expide_el_Regla",
    "fileName": "Decreto_539_de_2022_Por_el_cual_se_expide_el_Regla.md",
    "title": "Decreto 539 de 2022 Por el cual se expide el Regla",
    "category": "decretos",
    "categoryLabel": "⚖️ Decretos Reglamentarios SST",
    "badge": "DECRETO",
    "summary": "Decreto 539 de 2022 Por el cual se expide el Reglamento de Higiene y Seguridad en las Labores Mineras a Cielo Abierto",
    "sizeKb": 1
  },
  {
    "id": "Resoluci_n_3461_de_2025_Por_el_cual_se_derroga_las_Resoluciones_652_y_1356_de_2012._Comit__de_Convivencia_Laboral",
    "fileName": "Resoluci_n_3461_de_2025_Por_el_cual_se_derroga_las_Resoluciones_652_y_1356_de_2012._Comit__de_Convivencia_Laboral.md",
    "title": "Resolución 3461 de 2025 Por el cual se derroga las Resoluciones 652 y 1356 de 2012. Comité de Convivencia Laboral",
    "category": "vademecum_2026",
    "categoryLabel": "🌟 Vademécum & Normas 2024–2026",
    "badge": "VIGENTE 2024-2026",
    "summary": "Resolución 3461 de 2025 Por el cual se derroga las Resoluciones 652 y 1356 de 2012. Comité de Convivencia Laboral",
    "sizeKb": 35
  },
  {
    "id": "Resoluci_n_2607_de_2024_Por_la_cual_se_modifica_el",
    "fileName": "Resoluci_n_2607_de_2024_Por_la_cual_se_modifica_el.md",
    "title": "Resolución 2607 de 2024 Por la cual se modifica el",
    "category": "vademecum_2026",
    "categoryLabel": "🌟 Vademécum & Normas 2024–2026",
    "badge": "VIGENTE 2024-2026",
    "summary": "Resolución 2607 de 2024 Por la cual se modifica el artículo 2 de la Resolución 1905 de 2017 en relación con la Política de Seguridad y Salud en el Trabajo y sus objetivos",
    "sizeKb": 7
  },
  {
    "id": "Decreto_1295_de_1994_Por_el_cual_se_determina_la_organizaci_n_y_administraci_n_del_Sistema_General_de_Riesgos_Profesionales",
    "fileName": "Decreto_1295_de_1994_Por_el_cual_se_determina_la_organizaci_n_y_administraci_n_del_Sistema_General_de_Riesgos_Profesionales.md",
    "title": "Decreto 1295 de 1994 Por el cual se determina la organizaci n y administraci n del Sistema General de Riesgos Profesionales",
    "category": "decretos",
    "categoryLabel": "⚖️ Decretos Reglamentarios SST",
    "badge": "DECRETO",
    "summary": "Decreto 1295 de 1994 Por el cual se determina la organización y administración del Sistema General de Riesgos Profesionales",
    "sizeKb": 112
  },
  {
    "id": "CODIGO_SUSTENTIVO_DE_TRABAJO_parte_17",
    "fileName": "CODIGO_SUSTENTIVO_DE_TRABAJO_parte_17.md",
    "title": "Código Sustantivo DE TRABAJO parte 17",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CODIGO SUSTENTIVO DE TRABAJO parte 17",
    "sizeKb": 18
  },
  {
    "id": "08-Protocolo-intervencion-sector-financiero",
    "fileName": "08-Protocolo-intervencion-sector-financiero.md",
    "title": "08 Protocolo intervencion sector financiero",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "08-Protocolo-intervencion-sector-financiero",
    "sizeKb": 64
  },
  {
    "id": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_5",
    "fileName": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_5.md",
    "title": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 5",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 5",
    "sizeKb": 21
  },
  {
    "id": "RESOLUCI_N_N_MERO_2764_DE_2022",
    "fileName": "RESOLUCI_N_N_MERO_2764_DE_2022.md",
    "title": "Resolución NÚMERO 2764 DE 2022",
    "category": "resoluciones",
    "categoryLabel": "📋 Resoluciones Técnicas SST",
    "badge": "RESOLUCIÓN",
    "summary": "RESOLUCIÓN NÚMERO 2764 DE 2022",
    "sizeKb": 28
  },
  {
    "id": "09-Protocolo-prevencion-y-actuacion-acoso-laboral",
    "fileName": "09-Protocolo-prevencion-y-actuacion-acoso-laboral.md",
    "title": "09 Protocolo prevencion y actuacion acoso laboral",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "09-Protocolo-prevencion-y-actuacion-acoso-laboral",
    "sizeKb": 68
  },
  {
    "id": "su213-24_Corte_Constitucional_de_Colombia",
    "fileName": "su213-24_Corte_Constitucional_de_Colombia.md",
    "title": "su213 24 Corte Constitucional de Colombia",
    "category": "sentencias_circulares",
    "categoryLabel": "🏛️ Sentencias & Circulares 2024–2026",
    "badge": "JURISPRUDENCIA",
    "summary": "su213-24 Corte Constitucional de Colombia",
    "sizeKb": 170
  },
  {
    "id": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_4",
    "fileName": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_4.md",
    "title": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 4",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 4",
    "sizeKb": 22
  },
  {
    "id": "Resoluci_n_2605_de_2020_Establece_los_requisitos_m",
    "fileName": "Resoluci_n_2605_de_2020_Establece_los_requisitos_m.md",
    "title": "Resolución 2605 de 2020 Establece los requisitos m",
    "category": "resoluciones",
    "categoryLabel": "📋 Resoluciones Técnicas SST",
    "badge": "RESOLUCIÓN",
    "summary": "Resolución 2605 de 2020 Establece los requisitos mínimos de seguridad para el desarrollo del trabajo en espacios confinados",
    "sizeKb": 9
  },
  {
    "id": "Resoluci_n_4272_de_2021_Por_la_cual_se_establecen_",
    "fileName": "Resoluci_n_4272_de_2021_Por_la_cual_se_establecen_.md",
    "title": "Resolución 4272 de 2021 Por la cual se establecen",
    "category": "resoluciones",
    "categoryLabel": "📋 Resoluciones Técnicas SST",
    "badge": "RESOLUCIÓN",
    "summary": "Resolución 4272 de 2021 Por la cual se establecen los requisitos mínimos de seguridad para el desarrollo de trabajo en alturas",
    "sizeKb": 172
  },
  {
    "id": "Bateria-riesgo-psicosocial-2",
    "fileName": "Bateria-riesgo-psicosocial-2.md",
    "title": "Bateria riesgo psicosocial 2",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "Bateria-riesgo-psicosocial-2",
    "sizeKb": 81
  },
  {
    "id": "ABECE_Resoluci_n_0312_de_2019-290921",
    "fileName": "ABECE_Resoluci_n_0312_de_2019-290921.md",
    "title": "ABECE Resolución 0312 de 2019 290921",
    "category": "resoluciones",
    "categoryLabel": "📋 Resoluciones Técnicas SST",
    "badge": "RESOLUCIÓN",
    "summary": "ABECE Resolución 0312 de 2019-290921",
    "sizeKb": 32
  },
  {
    "id": "Resoluci_n_1843_DE_2025_Por_la_cual_se_regula_la_pr_ctica_de_evaluaciones_m_dicas_ocupacionales__y_se_dictan_otras_disposiciones",
    "fileName": "Resoluci_n_1843_DE_2025_Por_la_cual_se_regula_la_pr_ctica_de_evaluaciones_m_dicas_ocupacionales__y_se_dictan_otras_disposiciones.md",
    "title": "Resolución 1843 DE 2025 Por la cual se regula la práctica de evaluaciones médicas ocupacionales y se dictan otras disposiciones",
    "category": "vademecum_2026",
    "categoryLabel": "🌟 Vademécum & Normas 2024–2026",
    "badge": "VIGENTE 2024-2026",
    "summary": "Resolución 1843 DE 2025 Por la cual se regula la práctica de evaluaciones médicas ocupacionales, y se dictan otras disposiciones",
    "sizeKb": 75
  },
  {
    "id": "Decreto_2157_de_2017_Por_medio_del_cual_se_adoptan",
    "fileName": "Decreto_2157_de_2017_Por_medio_del_cual_se_adoptan.md",
    "title": "Decreto 2157 de 2017 Por medio del cual se adoptan",
    "category": "decretos",
    "categoryLabel": "⚖️ Decretos Reglamentarios SST",
    "badge": "DECRETO",
    "summary": "Decreto 2157 de 2017 Por medio del cual se adoptan directrices generales para la elaboración del plan de gestión del riesgo de desastres de las entidades públicas y privadas e",
    "sizeKb": 53
  },
  {
    "id": "ISO_45001-2018_SISTEMA_DE_GESTION_EN_SEGURIDAD_Y_S",
    "fileName": "ISO_45001-2018_SISTEMA_DE_GESTION_EN_SEGURIDAD_Y_S.md",
    "title": "ISO 45001 2018 SISTEMA DE GESTION EN SEGURIDAD Y S",
    "category": "normas_iso",
    "categoryLabel": "🌐 Normas Internacionales ISO",
    "badge": "ISO SST",
    "summary": "ISO 45001-2018 SISTEMA DE GESTION EN SEGURIDAD Y SALUD EN EL TRABAJO",
    "sizeKb": 156
  },
  {
    "id": "CODIGO_SUSTENTIVO_DE_TRABAJO_parte_12",
    "fileName": "CODIGO_SUSTENTIVO_DE_TRABAJO_parte_12.md",
    "title": "Código Sustantivo DE TRABAJO parte 12",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CODIGO SUSTENTIVO DE TRABAJO parte 12",
    "sizeKb": 15
  },
  {
    "id": "Resoluci_n_40595_de_2022_Implementacion_PESV",
    "fileName": "Resoluci_n_40595_de_2022_Implementacion_PESV.md",
    "title": "Resolución 40595 de 2022 Implementacion PESV",
    "category": "resoluciones",
    "categoryLabel": "📋 Resoluciones Técnicas SST",
    "badge": "RESOLUCIÓN",
    "summary": "Resolución 40595 de 2022 Implementacion PESV",
    "sizeKb": 160
  },
  {
    "id": "Ley_2460_de_2025._Por_medio_del_cual_se_modifica_la_Ley_1616_de_2013_en_materia_de_prevenci_n_y_atenci_n_de_trastornos_y_enfermedades_mentales",
    "fileName": "Ley_2460_de_2025._Por_medio_del_cual_se_modifica_la_Ley_1616_de_2013_en_materia_de_prevenci_n_y_atenci_n_de_trastornos_y_enfermedades_mentales.md",
    "title": "Ley 2460 de 2025. Por medio del cual se modifica la Ley 1616 de 2013 en materia de prevención y atención de trastornos y enfermedades mentales",
    "category": "vademecum_2026",
    "categoryLabel": "🌟 Vademécum & Normas 2024–2026",
    "badge": "VIGENTE 2024-2026",
    "summary": "Ley 2460 de 2025. Por medio del cual se modifica la Ley 1616 de 2013 en materia de prevención y atención de trastornos y enfermedades mentales",
    "sizeKb": 59
  },
  {
    "id": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_1",
    "fileName": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_1.md",
    "title": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 1",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 1",
    "sizeKb": 14
  },
  {
    "id": "Ley_9_de_1979_Por_la_cual_se_dictan_Medidas_Sanitarias",
    "fileName": "Ley_9_de_1979_Por_la_cual_se_dictan_Medidas_Sanitarias.md",
    "title": "Ley 9 de 1979 Por la cual se dictan Medidas Sanitarias",
    "category": "leyes",
    "categoryLabel": "📜 Leyes de la República",
    "badge": "LEY",
    "summary": "Ley 9 de 1979 Por la cual se dictan Medidas Sanitarias",
    "sizeKb": 192
  },
  {
    "id": "Resoluci_n__02013_de_1986_Por_la_cual_se_reglamenta_la_organizaci_n_Y_funcionamiento_de_los_comites_de_medicina__higiene_Y_seguridad_industrial_en_los_lugares_de_trabajo",
    "fileName": "Resoluci_n__02013_de_1986_Por_la_cual_se_reglamenta_la_organizaci_n_Y_funcionamiento_de_los_comites_de_medicina__higiene_Y_seguridad_industrial_en_los_lugares_de_trabajo.md",
    "title": "Resolución 02013 de 1986 Por la cual se reglamenta la organizaci n Y funcionamiento de los comites de medicina higiene Y seguridad industrial en los lugares de trabajo",
    "category": "resoluciones",
    "categoryLabel": "📋 Resoluciones Técnicas SST",
    "badge": "RESOLUCIÓN",
    "summary": "Resolución  02013 de 1986 Por la cual se reglamenta la organización Y funcionamiento de los comites de medicina, higiene Y seguridad industrial en los lugares de trabajo",
    "sizeKb": 11
  },
  {
    "id": "Decreto_768_DE_2022_Por_el_cual_se_actualiza_la_Ta",
    "fileName": "Decreto_768_DE_2022_Por_el_cual_se_actualiza_la_Ta.md",
    "title": "Decreto 768 DE 2022 Por el cual se actualiza la Ta",
    "category": "decretos",
    "categoryLabel": "⚖️ Decretos Reglamentarios SST",
    "badge": "DECRETO",
    "summary": "Decreto 768 DE 2022 Por el cual se actualiza la Tabla de Clasificación de Actividades Económicas para el Sistema General de Riesgos Laborales y se dictan otras disposiciones",
    "sizeKb": 10
  },
  {
    "id": "05-Protocolo-intervencion-sector-salud-y-asistencia-social",
    "fileName": "05-Protocolo-intervencion-sector-salud-y-asistencia-social.md",
    "title": "05 Protocolo intervencion sector salud y asistencia social",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "05-Protocolo-intervencion-sector-salud-y-asistencia-social",
    "sizeKb": 81
  },
  {
    "id": "Decreto_1072_de_2015_Sector_Trabajo",
    "fileName": "Decreto_1072_de_2015_Sector_Trabajo.md",
    "title": "Decreto 1072 de 2015 Sector Trabajo",
    "category": "decretos",
    "categoryLabel": "⚖️ Decretos Reglamentarios SST",
    "badge": "DECRETO",
    "summary": "Decreto 1072 de 2015 Sector Trabajo",
    "sizeKb": 1455
  },
  {
    "id": "Sentencia_Consejo_de_Estado_Nulidad_Parcial_Resolucion_3461_de_2025_Comites_de_Convivencia",
    "fileName": "Sentencia_Consejo_de_Estado_Nulidad_Parcial_Resolucion_3461_de_2025_Comites_de_Convivencia.md",
    "title": "Sentencia Consejo de Estado Nulidad Parcial Resolucion 3461 de 2025 Comites de Convivencia",
    "category": "sentencias_circulares",
    "categoryLabel": "🏛️ Sentencias & Circulares 2024–2026",
    "badge": "SENTENCIA",
    "summary": "Sentencia Consejo de Estado - Nulidad Parcial Resolución 3461 de 2025 (Comités de Convivencia y Acoso Laboral)",
    "sizeKb": 4
  },
  {
    "id": "Protocolo-Estr_s-Febrero-2019",
    "fileName": "Protocolo-Estr_s-Febrero-2019.md",
    "title": "Protocolo Estrés Febrero 2019",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "Protocolo-Estrés-Febrero-2019",
    "sizeKb": 155
  },
  {
    "id": "Resoluci_n_2400_de_1979_Por_la_cual_se_establecen_algunas_disposiciones_sobre_vivienda__higiene_y_seguridad",
    "fileName": "Resoluci_n_2400_de_1979_Por_la_cual_se_establecen_algunas_disposiciones_sobre_vivienda__higiene_y_seguridad.md",
    "title": "Resolución 2400 de 1979 Por la cual se establecen algunas disposiciones sobre vivienda higiene y seguridad",
    "category": "resoluciones",
    "categoryLabel": "📋 Resoluciones Técnicas SST",
    "badge": "RESOLUCIÓN",
    "summary": "Resolución 2400 de 1979 Por la cual se establecen algunas disposiciones sobre vivienda, higiene y seguridad",
    "sizeKb": 321
  },
  {
    "id": "VADEMECUM_MAESTRO_SST_COLOMBIA_2026",
    "fileName": "VADEMECUM_MAESTRO_SST_COLOMBIA_2026.md",
    "title": "VADEMECUM MAESTRO SST COLOMBIA 2026",
    "category": "vademecum_2026",
    "categoryLabel": "🌟 Vademécum & Normas 2024–2026",
    "badge": "VIGENTE 2024-2026",
    "summary": "VADEMÉCUM MAESTRO NORMATIVO DE SG-SST COLOMBIA (EDICIÓN 2026)",
    "sizeKb": 12
  },
  {
    "id": "07-Protocolo-intervencion-sector-educativo",
    "fileName": "07-Protocolo-intervencion-sector-educativo.md",
    "title": "07 Protocolo intervencion sector educativo",
    "category": "psicosocial_protocolos",
    "categoryLabel": "🧠 Batería y Protocolos Psicosociales",
    "badge": "PSICOSOCIAL",
    "summary": "07-Protocolo-intervencion-sector-educativo",
    "sizeKb": 71
  },
  {
    "id": "Ley_776_de_2002_Por_la_cual_se_dictan_normas_sobre_la_organizaci_n__administraci_n_y_prestaciones_del_Sistema_General_de_Riesgos_Profesionales",
    "fileName": "Ley_776_de_2002_Por_la_cual_se_dictan_normas_sobre_la_organizaci_n__administraci_n_y_prestaciones_del_Sistema_General_de_Riesgos_Profesionales.md",
    "title": "Ley 776 de 2002 Por la cual se dictan normas sobre la organizaci n administraci n y prestaciones del Sistema General de Riesgos Profesionales",
    "category": "leyes",
    "categoryLabel": "📜 Leyes de la República",
    "badge": "LEY",
    "summary": "Ley 776 de 2002 Por la cual se dictan normas sobre la organización, administración y prestaciones del Sistema General de Riesgos Profesionales",
    "sizeKb": 24
  },
  {
    "id": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_3",
    "fileName": "C_DIGO_SUSTANTIVO_DEL_TRABAJO_parte_3.md",
    "title": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 3",
    "category": "codigo_sustantivo",
    "categoryLabel": "📘 Código Sustantivo del Trabajo",
    "badge": "CST LABORAL",
    "summary": "CÓDIGO SUSTANTIVO DEL TRABAJO parte 3",
    "sizeKb": 22
  },
  {
    "id": "Ley_2121_de_2021_Por_el_cual_se_crea_el_regimen_de",
    "fileName": "Ley_2121_de_2021_Por_el_cual_se_crea_el_regimen_de.md",
    "title": "Ley 2121 de 2021 Por el cual se crea el regimen de",
    "category": "leyes",
    "categoryLabel": "📜 Leyes de la República",
    "badge": "LEY",
    "summary": "Ley 2121 de 2021 Por el cual se crea el regimen de trabajo remoto",
    "sizeKb": 28
  }
];
