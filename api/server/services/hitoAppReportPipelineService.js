'use strict';

const mongoose = require('mongoose');
const { logger } = require('~/config');
const CompanyInfo = require('~/models/CompanyInfo');
const {
  callSgsstGemini,
  mapToGoogleApiTextModel,
  autoPersistGeneratedReport,
} = require('~/server/routes/sgsst/sgsstGemini');
const {
  buildStandardHeader,
  buildCompanyContextString,
  buildSignatureSection,
} = require('~/server/routes/sgsst/reportHeader');

/**
 * Registro canónico de los 42 Aplicativos Activos de Hitos 1–8 (+ nodos complementarios del ecosistema)
 * para extracción sin pérdida y generación oficial de Informes HTML Corporativos SG-SST.
 */
const HITO_APP_REPORT_SPECS = {
  // ─── HITO 1: GOBERNANZA, PLANIFICACIÓN Y EMERGENCIAS ───────────────────────
  hito1_dofa: {
    hitoNodeId: 'hito1_dofa',
    sgsstAppId: 'contexto',
    aliases: ['contexto', 'dofa', 'contexto_dofa', 'partes_interesadas', 'stakeholders', 'hito1_contexto'],
    reportTitle: 'Informe Oficial de Contexto Organizacional, Matriz DOFA y Partes Interesadas',
    docCode: 'FT-SST-001',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.8 / ISO 45001:2018 Cláusulas 4.1 y 4.2',
    reportTags: ['sgsst-contexto-organizacion', 'sgsst-contexto-partes-interesadas', 'sgsst-partes-interesadas'],
    embeddedReport: {
      modelName: 'ContextoData',
      routeRequire: '~/server/routes/sgsst/contexto',
      modelRequire: '~/models/ContextoData',
      field: 'lastGeneratedReport',
      writable: true,
    },
  },
  hito1_diagnostico_0312: {
    hitoNodeId: 'hito1_diagnostico_0312',
    sgsstAppId: 'diagnostico',
    aliases: ['diagnostico', 'diagnostico_0312', 'estandares_0312', 'autoevaluacion_0312', '0312'],
    reportTitle: 'Autoevaluación Oficial de Estándares Mínimos del SG-SST',
    docCode: 'FT-SST-002',
    normativeRef: 'Resolución 0312 de 2019 / Decreto 1072 de 2015 Art. 2.2.4.6.16',
    reportTags: ['sgsst-diagnostico'],
    strictDiagnosticTagOnly: true,
  },
  hito1_responsable: {
    hitoNodeId: 'hito1_responsable',
    sgsstAppId: 'responsable',
    aliases: ['responsable', 'asignacion_responsable', 'responsable_sst', 'carta_responsabilidades'],
    reportTitle: 'Acta Oficial de Asignación del Responsable del SG-SST y Roles',
    docCode: 'FT-SST-003',
    normativeRef: 'Resolución 0312 de 2019 Estándar 1.1.1 / Decreto 1072 de 2015 Art. 2.2.4.6.8 Num. 2 y 10',
    reportTags: ['sgsst-responsable', 'sgsst-responsabilidades', 'sgsst-carta-responsabilidades'],
  },
  hito1_politica_objetivos: {
    hitoNodeId: 'hito1_politica_objetivos',
    sgsstAppId: 'politica',
    aliases: ['politica', 'politica_sst', 'politica_sgsst', 'politicas_sst'],
    reportTitle: 'Política Oficial del Sistema de Gestión de Seguridad y Salud en el Trabajo',
    docCode: 'PL-SST-001',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.5, 2.2.4.6.6 y 2.2.4.6.7 / Res. 0312 Est. 2.1.1',
    reportTags: ['sgsst-politica'],
  },
  hito1_objetivos: {
    hitoNodeId: 'hito1_objetivos',
    sgsstAppId: 'objetivos',
    aliases: ['objetivos', 'objetivos_sst', 'objetivos_sgsst', 'matriz_objetivos'],
    reportTitle: 'Matriz Oficial de Objetivos y Metas del SG-SST',
    docCode: 'PL-SST-002',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.18 / Resolución 0312 de 2019 Estándar 2.2.1',
    reportTags: ['sgsst-objetivos'],
  },
  hito1_rhs: {
    hitoNodeId: 'hito1_rhs',
    sgsstAppId: 'rhs',
    aliases: ['rhs', 'reglamento_higiene', 'higiene_seguridad'],
    reportTitle: 'Reglamento Oficial de Higiene y Seguridad Industrial (RHS)',
    docCode: 'RG-SST-001',
    normativeRef: 'Código Sustantivo del Trabajo Art. 349 y 350 / Ley 962 de 2005 Art. 55',
    reportTags: ['sgsst-rhs', 'sgsst-reglamento-higiene'],
  },
  hito1_rit: {
    hitoNodeId: 'hito1_rit',
    sgsstAppId: 'rit',
    aliases: ['rit', 'reglamento_interno', 'reglamento_trabajo'],
    reportTitle: 'Reglamento Interno de Trabajo (RIT) — Capítulo Seguridad y Convivencia',
    docCode: 'RG-SST-002',
    normativeRef: 'Código Sustantivo del Trabajo Art. 104 a 125 / Ley 1010 de 2006 / Ley 1429 de 2010',
    reportTags: ['sgsst-rit', 'sgsst-reglamento-interno'],
  },
  hito1_participacion_ipevar: {
    hitoNodeId: 'hito1_participacion_ipevar',
    sgsstAppId: 'participacion_ipevar',
    aliases: ['participacion_ipevar', 'autorreporte_peligros', 'participacion_trabajadores'],
    reportTitle: 'Informe de Participación de Trabajadores en la Identificación de Peligros (IPEVR)',
    docCode: 'FT-SST-004',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.15 Parágrafo 1 / Resolución 0312 Est. 4.1.2',
    reportTags: ['sgsst-participacion-ipevar'],
  },
  hito2_matriz_ipevar: {
    hitoNodeId: 'hito2_matriz_ipevar',
    sgsstAppId: 'matriz_ipevar_oficial',
    aliases: [
      'matriz_ipevar_oficial',
      'matriz_ipevar',
      'matriz_peligros',
      'gtc45',
      'ipevar',
      'ipevr',
      'hito1_matriz_ipevar',
    ],
    reportTitle: 'Informe Técnico Oficial de la Matriz de Identificación de Peligros y Valoración de Riesgos (IPEVR)',
    docCode: 'MT-SST-001',
    normativeRef: 'Guía Técnica Colombiana GTC 45 (2012) / Decreto 1072 de 2015 Art. 2.2.4.6.15 / Res. 0312 Est. 4.1.1',
    reportTags: ['sgsst-matriz-ipevar', 'sgsst-matriz-peligros'],
  },
  hito3_matriz_pesv: {
    hitoNodeId: 'hito3_matriz_pesv',
    sgsstAppId: 'matriz_pesv',
    aliases: ['matriz_pesv', 'pesv', 'riesgos_viales', 'hito1_matriz_pesv'],
    reportTitle: 'Informe Técnico Oficial de la Matriz de Riesgos Viales — PESV Paso 6',
    docCode: 'MT-PESV-001',
    normativeRef: 'Resolución 20223040040595 de 2022 Ministerio de Transporte / ISO 39001 / Ley 1503 de 2011',
    reportTags: ['sgsst-matriz-pesv'],
    embeddedReport: {
      modelName: 'PESVWorkspaceSession',
      modelRequire: '~/models/PESVWorkspaceSession',
      field: 'reportHtml',
      sessionPrefix: 'official-pesv-',
      writable: true,
    },
  },
  hito3_quimicos_sga: {
    hitoNodeId: 'hito3_quimicos_sga',
    sgsstAppId: 'matriz_compatibilidad',
    aliases: ['matriz_compatibilidad', 'compatibilidad_quimica', 'quimicos_sga', 'sga'],
    reportTitle: 'Informe Técnico Oficial de Compatibilidad Química y Almacenamiento Seguro (SGA)',
    docCode: 'MT-SGA-001',
    normativeRef: 'Decreto 1496 de 2018 (SGA ONU) / Resolución 0773 de 2021 / Ley 55 de 1993',
    reportTags: ['sgsst-matriz-compatibilidad'],
    embeddedReport: {
      modelName: 'ChemicalCompatibilitySession',
      modelRequire: '~/models/ChemicalCompatibilitySession',
      field: 'reportHtml',
      sessionPrefix: 'official-chem-',
      writable: true,
    },
  },
  hito1_oportunidades_sst: {
    hitoNodeId: 'hito1_oportunidades_sst',
    sgsstAppId: 'oportunidades_sst',
    aliases: ['oportunidades_sst', 'oportunidades', 'riesgos_sistema'],
    reportTitle: 'Matriz Oficial de Oportunidades SST y Riesgos Estratégicos del Sistema',
    docCode: 'MT-SST-002',
    normativeRef: 'ISO 45001:2018 Cláusula 6.1.2.2 y 6.1.2.3 / Decreto 1072 de 2015 Art. 2.2.4.6.17',
    reportTags: ['sgsst-oportunidades', 'sgsst-oportunidades-sst'],
    embeddedReport: {
      modelName: 'OportunidadesData',
      routeRequire: '~/server/routes/sgsst/oportunidades',
      modelRequire: '~/models/OportunidadesData',
      field: 'lastGeneratedReport',
      writable: true,
    },
  },
  hito6_vulnerabilidad: {
    hitoNodeId: 'hito6_vulnerabilidad',
    sgsstAppId: 'vulnerabilidad',
    aliases: ['vulnerabilidad', 'analisis_vulnerabilidad', 'diamante_riesgo', 'hito1_vulnerabilidad'],
    reportTitle: 'Informe Técnico de Análisis de Amenazas y Vulnerabilidad (Metodología Diamante)',
    docCode: 'AN-SST-001',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.25 / Metodología IDIGER / Res. 0312 Est. 5.1.1',
    reportTags: ['sgsst-vulnerabilidad'],
  },
  hito1_plan_emergencias: {
    hitoNodeId: 'hito1_plan_emergencias',
    sgsstAppId: 'plan_emergencias',
    aliases: ['plan_emergencias', 'ppre', 'emergencias', 'medevac'],
    reportTitle: 'Plan Oficial de Prevención, Preparación y Respuesta ante Emergencias (PPRE)',
    docCode: 'PL-SST-003',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.25 / Ley 1523 de 2012 / Res. 0312 Est. 5.1.1 y 5.1.2',
    reportTags: ['sgsst-plan-emergencias'],
    embeddedReport: {
      modelName: 'PlanEmergenciasData',
      routeRequire: '~/server/routes/sgsst/planEmergencias',
      modelRequire: '~/models/PlanEmergenciasData',
      field: 'lastGeneratedReport',
      writable: true,
    },
  },

  // ─── HITO 2: GESTIÓN DE LA SALUD Y PERFIL SOCIODEMOGRÁFICO ─────────────────
  hito2_perfiles_cargo: {
    hitoNodeId: 'hito2_perfiles_cargo',
    sgsstAppId: 'perfiles_cargo',
    aliases: ['perfiles_cargo', 'perfil_cargo', 'profesiograma', 'cargos'],
    reportTitle: 'Manual Oficial de Perfiles de Cargo Biocéntricos y Profesiograma Ocupacional',
    docCode: 'PR-SST-001',
    normativeRef: 'Resolución 1843 de 2025 (ant. Res. 2346/2007) / Resolución 0312 Est. 3.1.1 y 3.1.4',
    reportTags: ['sgsst-perfil-cargo'],
    embeddedReport: {
      modelName: 'PerfilCargoData',
      routeRequire: '~/server/routes/sgsst/perfilesCargo',
      arrayField: 'perfilesList',
      subField: 'report',
      writable: false,
    },
  },
  hito2_perfil_socio: {
    hitoNodeId: 'hito2_perfil_socio',
    sgsstAppId: 'perfil_sociodemografico',
    aliases: ['perfil_sociodemografico', 'perfil_socio', 'sociodemografico', 'trabajadores', 'nomina_sst'],
    reportTitle: 'Informe Oficial de Descripción Sociodemográfica de la Población Trabajadora',
    docCode: 'DG-SST-001',
    normativeRef: 'Resolución 0312 de 2019 Estándar 3.1.1 / Decreto 1072 de 2015 Art. 2.2.4.6.12 Num. 4',
    reportTags: ['sgsst-perfil-sociodemografico'],
  },
  hito2_condiciones_salud: {
    hitoNodeId: 'hito2_condiciones_salud',
    sgsstAppId: 'condiciones_salud',
    aliases: ['condiciones_salud', 'diagnostico_salud', 'examenes_medicos', 'emo'],
    reportTitle: 'Diagnóstico Oficial de Condiciones de Salud y Vigilancia Epidemiológica',
    docCode: 'DG-SST-002',
    normativeRef: 'Resolución 1843 de 2025 / Resolución 0312 de 2019 Estándar 3.1.1 y 3.1.4',
    reportTags: ['sgsst-condiciones-salud'],
  },
  hito2_oraculo_predictivo: {
    hitoNodeId: 'hito2_oraculo_predictivo',
    sgsstAppId: 'oraculo_compatibilidad',
    aliases: ['oraculo_compatibilidad', 'compatibilidad_cargo', 'tarjetas_preventivas', 'oraculo_h1', 'fit_score'],
    reportTitle: 'Dictamen Oficial de Compatibilidad Trabajador-Cargo y Tarjetas Preventivas (FIT)',
    docCode: 'DG-SST-003',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.24 / Resolución 1843 de 2025 / Estándar 3.1.5',
    reportTags: ['sgsst-oraculo-h1', 'sgsst-compatibilidad-cargo'],
    embeddedReport: {
      modelName: 'PerfilSociodemograficoData',
      routeRequire: '~/server/routes/sgsst/perfilSociodemografico',
      modelRequire: '~/models/PerfilSociodemograficoData',
      arrayField: 'trabajadores',
      subField: 'dictamenPredictivoH1',
      writable: false,
    },
  },

  // ─── HITO 3 & 4: COMITÉS, BIO-INDIVIDUO, ERGONOMÍA Y PSICOSOCIAL ───────────
  hito4_comites: {
    hitoNodeId: 'hito4_comites',
    sgsstAppId: 'copasst',
    aliases: ['copasst', 'vigia_sst', 'comites', 'hito3_copasst'],
    reportTitle: 'Informe Oficial de Gestión y Actas del COPASST / Vigía de SST',
    docCode: 'AC-SST-001',
    normativeRef: 'Resolución 2013 de 1986 / Decreto 1295 de 1994 Art. 63 / Res. 0312 Est. 1.1.6 y 1.1.7',
    reportTags: ['sgsst-copasst'],
    embeddedReport: {
      modelName: 'SgsstCopasstActa',
      routeRequire: '~/server/routes/sgsst/copasst',
      modelRequire: '~/models/SgsstCopasst',
      field: 'reporteOficialHtml',
      multiDoc: true,
      sortField: 'fecha',
      writable: false,
    },
  },
  hito3_cocolab: {
    hitoNodeId: 'hito3_cocolab',
    sgsstAppId: 'cocolab',
    aliases: ['cocolab', 'convivencia', 'comite_convivencia', 'ccl'],
    reportTitle: 'Informe Oficial del Comité de Convivencia Laboral (CCL)',
    docCode: 'AC-CCL-001',
    normativeRef: 'Ley 1010 de 2006 / Resolución 3461 de 2025 (ant. Res. 652 y 1356 de 2012) / Est. 1.1.8',
    reportTags: ['sgsst-convivencia'],
    embeddedReport: {
      modelName: 'SgsstConvivenciaActa',
      routeRequire: '~/server/routes/sgsst/convivencia',
      modelRequire: '~/models/SgsstConvivencia',
      field: 'reporteOficialHtml',
      multiDoc: true,
      sortField: 'fecha',
      writable: false,
    },
  },
  hito4_bio_ipevar: {
    hitoNodeId: 'hito4_bio_ipevar',
    sgsstAppId: 'bio_ipevar',
    aliases: ['bio_ipevar', 'bio_individuo', 'matriz_bio_ipevar', 'riesgo_individual'],
    reportTitle: 'Informe Técnico de Matriz Bio-IPEVR (Evaluación Individual por Trabajador)',
    docCode: 'MT-SST-003',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.15 y 2.2.4.6.24 / GTC 45 / Enfoque Biocéntrico',
    reportTags: ['sgsst-bio-ipevar', 'sgsst-bio-individuo'],
    embeddedReport: {
      modelName: 'SgsstWorker',
      routeRequire: '~/server/routes/sgsst/workers',
      modelRequire: '~/models/SgsstWorker',
      field: 'bioReportContent',
      multiDoc: true,
      sortField: 'updatedAt',
      writable: false,
    },
  },
  hito3_owas: {
    hitoNodeId: 'hito3_owas',
    sgsstAppId: 'metodo_owas',
    aliases: ['metodo_owas', 'owas', 'evaluacion_owas', 'ergonomia_owas'],
    reportTitle: 'Informe Técnico de Evaluación Ergonómica Postural — Método OWAS',
    docCode: 'EV-ERG-001',
    normativeRef: 'GATISO DME / NTC 5693 / Resolución 0312 de 2019 Estándar 4.2.1',
    reportTags: ['sgsst-owas'],
  },
  hito3_estudio_puesto: {
    hitoNodeId: 'hito3_estudio_puesto',
    sgsstAppId: 'estudio_puesto',
    aliases: ['estudio_puesto', 'ept', 'estudio_puesto_trabajo', 'rula_reba'],
    reportTitle: 'Informe Técnico de Estudio de Puesto de Trabajo (EPT — RULA / REBA)',
    docCode: 'EV-ERG-002',
    normativeRef: 'Resolución 1843 de 2025 / GATISO DME / Decreto 1072 de 2015 Art. 2.2.4.6.24',
    reportTags: ['sgsst-estudio-puesto'],
  },
  hito4_psicosocial: {
    hitoNodeId: 'hito4_psicosocial',
    sgsstAppId: 'termometro_psicosocial',
    aliases: ['termometro_psicosocial', 'psicosocial', 'animo', 'clima_emocional'],
    reportTitle: 'Informe Técnico de Monitoreo Psicosocial y Clima Emocional',
    docCode: 'DG-PSI-001',
    normativeRef: 'Resolución 2764 de 2022 / Resolución 2646 de 2008 / Ley 1616 de 2013',
    reportTags: ['sgsst-animo', 'sgsst-termometro-psicosocial'],
  },

  // ─── HITO 5: CONTROL OPERACIONAL, TAREAS CRÍTICAS, EPP Y FLOTA ─────────────
  hito5_compras_sst: {
    hitoNodeId: 'hito5_compras_sst',
    sgsstAppId: 'compras_sst',
    aliases: ['compras_sst', 'compras', 'adquisiciones_sst'],
    reportTitle: 'Informe Oficial de Compras y Adquisiciones con Criterios SST',
    docCode: 'PR-SST-002',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.27 / Resolución 0312 de 2019 Estándar 2.9.1',
    reportTags: ['sgsst-compras', 'sgsst-compras-sst'],
    embeddedReport: {
      modelName: 'SgsstComprasData',
      routeRequire: '~/server/routes/sgsst/compras',
      modelRequire: '~/models/SgsstComprasData',
      field: 'lastGeneratedReport',
      writable: true,
    },
  },
  hito5_contratistas: {
    hitoNodeId: 'hito5_contratistas',
    sgsstAppId: 'contratistas',
    aliases: ['contratistas', 'proveedores', 'contratistas_proveedores', 'terceros_sst'],
    reportTitle: 'Informe Oficial de Evaluación y Control SST de Contratistas y Proveedores',
    docCode: 'PR-SST-003',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.28 / Resolución 0312 de 2019 Estándar 2.10.1',
    reportTags: ['sgsst-contratistas', 'sgsst-contratistas-proveedores'],
    embeddedReport: {
      modelName: 'SgsstContratistasData',
      routeRequire: '~/server/routes/sgsst/contratistas',
      modelRequire: '~/models/SgsstContratistasData',
      field: 'lastGeneratedReport',
      writable: true,
    },
  },
  hito5_gestion_cambio: {
    hitoNodeId: 'hito5_gestion_cambio',
    sgsstAppId: 'gestion_cambio',
    aliases: ['gestion_cambio', 'moc', 'cambio_organizacional'],
    reportTitle: 'Informe Oficial de Gestión del Cambio (MOC) e Impacto en SST',
    docCode: 'PR-SST-004',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.26 / Resolución 0312 de 2019 Estándar 2.11.1',
    reportTags: ['sgsst-gestion-cambio', 'sgsst-moc'],
    embeddedReport: {
      modelName: 'SgsstGestionCambioData',
      routeRequire: '~/server/routes/sgsst/gestionCambio',
      modelRequire: '~/models/SgsstGestionCambioData',
      field: 'lastGeneratedReport',
      writable: true,
    },
  },
  hito3_ats: {
    hitoNodeId: 'hito3_ats',
    sgsstAppId: 'ats',
    aliases: ['ats', 'analisis_trabajo_seguro', 'trabajo_seguro'],
    reportTitle: 'Formato Oficial de Análisis de Trabajo Seguro (ATS Paso a Paso)',
    docCode: 'FT-TAR-001',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.24 / Resolución 4272 de 2021 / Res. 0491 de 2020',
    reportTags: ['sgsst-ats'],
  },
  hito3_alturas: {
    hitoNodeId: 'hito3_alturas',
    sgsstAppId: 'permiso_alturas',
    aliases: ['permiso_alturas', 'alturas', 'trabajo_alturas'],
    reportTitle: 'Permiso Oficial de Trabajo Seguro en Alturas y Verificación Preoperacional',
    docCode: 'FT-TAR-002',
    normativeRef: 'Resolución 4272 de 2021 Ministerio del Trabajo / Resolución 0312 Est. 4.2.3',
    reportTags: ['sgsst-permiso-alturas'],
  },
  hito5_equipos_alturas: {
    hitoNodeId: 'hito5_equipos_alturas',
    sgsstAppId: 'equipos_alturas',
    aliases: ['equipos_alturas', 'heights', 'hoja_vida_alturas', 'inspeccion_arneses'],
    reportTitle: 'Hoja de Vida e Inspección Oficial de Equipos de Protección Contra Caídas',
    docCode: 'HV-TAR-003',
    normativeRef: 'Resolución 4272 de 2021 Art. 22 a 26 / ANSI Z359 / EN 361-365',
    reportTags: ['sgsst-heights', 'sgsst-equipos-alturas'],
  },
  hito3_epp: {
    hitoNodeId: 'hito3_epp',
    sgsstAppId: 'epp',
    aliases: ['epp', 'entrega_epp', 'inventario_epp', 'dotacion_epp'],
    reportTitle: 'Informe Oficial de Matriz, Inventario y Entrega de Elementos de Protección Personal (EPP)',
    docCode: 'FT-SST-005',
    normativeRef: 'Ley 9 de 1979 Art. 122 a 124 / Decreto 1072 de 2015 Art. 2.2.4.6.24 / Res. 0312 Est. 4.2.6',
    reportTags: ['sgsst-epp'],
  },
  hito5_registro_quimico: {
    hitoNodeId: 'hito5_registro_quimico',
    sgsstAppId: 'chemicals',
    aliases: ['chemicals', 'registro_quimico', 'inventario_quimico', 'fds_quimicos'],
    reportTitle: 'Inventario Oficial de Productos Químicos, Etiquetado SGA y FDS en Terreno',
    docCode: 'IN-SGA-002',
    normativeRef: 'Decreto 1496 de 2018 / Resolución 0773 de 2021 / Ley 55 de 1993',
    reportTags: ['sgsst-chemicals'],
  },
  hito3_vehiculos: {
    hitoNodeId: 'hito3_vehiculos',
    sgsstAppId: 'vehicles',
    aliases: ['vehicles', 'vehiculos', 'parque_automotor', 'preoperacional_vehiculos'],
    reportTitle: 'Informe Oficial de Parque Automotor, Mantenimiento e Inspección Preoperacional PESV',
    docCode: 'IN-PESV-002',
    normativeRef: 'Resolución 20223040040595 de 2022 Pasos 16 y 17 / Ley 1503 de 2011 / Res. 0312 Est. 4.2.5',
    reportTags: ['sgsst-vehicles'],
  },

  // ─── HITO 6: CULTURA, FORMACIÓN, CAPACITACIONES Y REPORTE QR ───────────────
  hito5_capacitaciones: {
    hitoNodeId: 'hito5_capacitaciones',
    sgsstAppId: 'programa_capacitaciones',
    aliases: ['programa_capacitaciones', 'capacitaciones', 'induccion_sst', 'hito6_capacitaciones'],
    reportTitle: 'Programa Anual Oficial de Capacitación, Inducción y Reinducción en SST',
    docCode: 'PG-SST-001',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.11 / Resolución 0312 de 2019 Estándares 1.2.1 a 1.2.3',
    reportTags: ['sgsst-programa-capacitaciones', 'sgsst-capacitaciones', 'sgsst-acta-capacitacion'],
  },
  hito6_ruta_aprendizaje: {
    hitoNodeId: 'hito6_ruta_aprendizaje',
    sgsstAppId: 'ruta_aprendizaje',
    aliases: ['ruta_aprendizaje', 'lms', 'escuela_virtual', 'cursos_sst'],
    reportTitle: 'Informe Oficial de Rutas de Aprendizaje, Cobertura y Certificación Virtual LMS',
    docCode: 'PG-LMS-001',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.11 / Resolución 0312 de 2019 Estándar 1.2.1',
    reportTags: ['sgsst-ruta-aprendizaje', 'sgsst-lms'],
  },
  hito4_actos_condiciones: {
    hitoNodeId: 'hito4_actos_condiciones',
    sgsstAppId: 'reporte_actos',
    aliases: ['reporte_actos', 'actos_condiciones', 'actos_inseguros', 'condiciones_inseguras', 'buzon_qr'],
    reportTitle: 'Informe Oficial de Reporte y Gestión de Actos y Condiciones Inseguras',
    docCode: 'FT-SST-006',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.10 y 2.2.4.6.12 / Resolución 0312 Est. 4.2.4',
    reportTags: ['sgsst-reporte-actos'],
  },

  // ─── HITO 7: VERIFICACIÓN, SINIESTRALIDAD ATEL, ACPM Y AUDITORÍA ───────────
  hito7_estadisticas_atel: {
    hitoNodeId: 'hito7_estadisticas_atel',
    sgsstAppId: 'estadisticas_atel',
    aliases: ['estadisticas_atel', 'estadisticas', 'indicadores_atel', 'ausentismo'],
    reportTitle: 'Informe Oficial de Estadísticas ATEL, Ausentismo y 6 Indicadores Mínimos Res. 0312',
    docCode: 'IN-SST-001',
    normativeRef: 'Resolución 0312 de 2019 Art. 30 (IF, IS, PAM, P-EL, I-EL, Ausentismo) / Dec. 1072 Art. 2.2.4.6.21',
    reportTags: ['sgsst-estadisticas-atel'],
  },
  hito7_investigacion_atel: {
    hitoNodeId: 'hito7_investigacion_atel',
    sgsstAppId: 'investigacion_atel',
    aliases: ['investigacion_atel', 'furat', 'accidente_trabajo', 'incidente_laboral'],
    reportTitle: 'Informe Oficial de Investigación de Incidentes y Accidentes de Trabajo (ATEL)',
    docCode: 'FT-ATEL-001',
    normativeRef: 'Resolución 1401 de 2007 / Decreto 1072 de 2015 Art. 2.2.4.6.32 / Res. 0312 Est. 3.2.2',
    reportTags: ['sgsst-investigacion-atel'],
  },
  hito7_acpm: {
    hitoNodeId: 'hito7_acpm',
    sgsstAppId: 'acpm',
    aliases: ['acpm', 'kanban', 'centro_control', 'acciones_correctivas', 'plan_mejoramiento'],
    reportTitle: 'Matriz Oficial de Acciones Preventivas, Correctivas y de Mejora (ACPM)',
    docCode: 'MT-SST-004',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.33 y 2.2.4.6.34 / Resolución 0312 Est. 7.1.1 a 7.1.4',
    reportTags: ['sgsst-acpm', 'sgsst-kanban'],
  },
  hito7_auditoria: {
    hitoNodeId: 'hito7_auditoria',
    sgsstAppId: 'auditoria',
    aliases: ['auditoria', 'auditoria_anual', 'auditoria_interna', 'auditoria_sgsst'],
    reportTitle: 'Informe Oficial de Auditoría Anual de Cumplimiento del SG-SST',
    docCode: 'IN-AUD-001',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.29 y 2.2.4.6.30 / Resolución 0312 Est. 6.1.2 y 6.1.3',
    reportTags: ['sgsst-auditoria'],
  },
  hito7_alta_direccion: {
    hitoNodeId: 'hito7_alta_direccion',
    sgsstAppId: 'alta_direccion',
    aliases: ['alta_direccion', 'revision_alta_direccion', 'revision_gerencial'],
    reportTitle: 'Acta Oficial de Revisión Anual por la Alta Dirección (24 Aspectos)',
    docCode: 'AC-DIR-001',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.31 / Resolución 0312 de 2019 Estándar 6.1.4',
    reportTags: ['sgsst-alta-direccion'],
  },

  // ─── HITO 8: MEJORA CONTINUA Y ANALÍTICA PREDICTIVA IA ─────────────────────
  hito8_predictivo: {
    hitoNodeId: 'hito8_predictivo',
    sgsstAppId: 'predictivo_ia',
    aliases: ['predictivo_ia', 'predictivo', 'radar_predictivo', 'siniestralidad_ia'],
    reportTitle: 'Informe Ejecutivo de Analítica Predictiva 360° de Siniestralidad y Riesgo SST',
    docCode: 'IN-IA-001',
    normativeRef: 'Decreto 1072 de 2015 Cap. 6 Mejora Continua / ISO 45001:2018 Cl. 9.1 y 10.3',
    reportTags: ['sgsst-predictivo-ia'],
  },

  // ─── NODOS COMPLEMENTARIOS DEL ECOSISTEMA SG-SST (SOPORTE EXTENDIDO) ───────
  hito3_comite_pesv: {
    hitoNodeId: 'hito3_comite_pesv',
    sgsstAppId: 'comite_pesv',
    aliases: ['comite_pesv', 'csv_pesv', 'comite_seguridad_vial'],
    reportTitle: 'Informe Oficial del Comité de Seguridad Vial (CSV — PESV)',
    docCode: 'AC-PESV-001',
    normativeRef: 'Resolución 20223040040595 de 2022 Paso 2 / Ley 1503 de 2011',
    reportTags: ['sgsst-comite-pesv'],
    embeddedReport: {
      modelName: 'SgsstPesvActa',
      routeRequire: '~/server/routes/sgsst/copasst',
      modelRequire: '~/models/SgsstCopasst',
      field: 'reporteOficialHtml',
      multiDoc: true,
      sortField: 'fecha',
      writable: false,
    },
  },
  hito3_brigada_emergencias: {
    hitoNodeId: 'hito3_brigada_emergencias',
    sgsstAppId: 'brigada_emergencias',
    aliases: ['brigada_emergencias', 'brigada', 'sci_brigada'],
    reportTitle: 'Informe Oficial de Conformación y Dotación de la Brigada de Emergencias (SCI)',
    docCode: 'BR-SST-001',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.25 Num. 11 / Res. 0312 Est. 5.1.2',
    reportTags: ['sgsst-brigada', 'sgsst-brigada-emergencias'],
  },
  hito5_equipos_emergencia: {
    hitoNodeId: 'hito5_equipos_emergencia',
    sgsstAppId: 'equipos_emergencia',
    aliases: ['equipos_emergencia', 'extintores_botiquines'],
    reportTitle: 'Informe de Inspección de Equipos de Emergencia (Extintores, Botiquines y Camillas)',
    docCode: 'IN-EME-001',
    normativeRef: 'NTC 2885 / Resolución 0705 de 2007 / Decreto 1072 de 2015 Art. 2.2.4.6.25',
    reportTags: ['sgsst-equipos-emergencia'],
  },
  hito6_comunicaciones_sst: {
    hitoNodeId: 'hito6_comunicaciones_sst',
    sgsstAppId: 'comunicaciones_sst',
    aliases: ['comunicaciones_sst', 'matriz_comunicaciones'],
    reportTitle: 'Matriz Oficial de Comunicaciones Internas y Externas en SST',
    docCode: 'MT-COM-001',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.14 / Resolución 0312 de 2019 Estándar 2.8.1',
    reportTags: ['sgsst-comunicaciones'],
  },
  hito6_simulacros_emergencia: {
    hitoNodeId: 'hito6_simulacros_emergencia',
    sgsstAppId: 'simulacros_emergencia',
    aliases: ['simulacros_emergencia', 'simulacros'],
    reportTitle: 'Informe Oficial de Programación y Evaluación de Simulacros de Emergencia',
    docCode: 'EV-SIM-001',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.25 Num. 10 / Resolución 0312 Est. 5.1.1',
    reportTags: ['sgsst-simulacros-emergencia'],
  },
  hito7_investigacion_profunda: {
    hitoNodeId: 'hito7_investigacion_profunda',
    sgsstAppId: 'investigacion_profunda',
    aliases: ['investigacion_profunda', 'peritaje_sst'],
    reportTitle: 'Dictamen Científico, Técnico y Jurídico de Investigación Profunda en SST',
    docCode: 'DC-JUR-001',
    normativeRef: 'Jurisprudencia Laboral Colombiana / Decreto 1072 de 2015 / Normas Técnicas Internacionales',
    reportTags: ['sgsst-investigacion-profunda'],
  },
  hito1_matriz_legal: {
    hitoNodeId: 'hito1_matriz_legal',
    sgsstAppId: 'matriz_legal',
    aliases: ['matriz_legal', 'normograma_sst'],
    reportTitle: 'Matriz Legal Actualizada de Seguridad y Salud en el Trabajo',
    docCode: 'MT-LEG-001',
    normativeRef: 'Decreto 1072 de 2015 Art. 2.2.4.6.8 Parágrafo / Resolución 0312 Est. 2.7.1',
    reportTags: ['sgsst-matriz-legal'],
  },
};

/** Lista exacta de los 42 nodos Hito activos oficiales */
const ACTIVE_42_HITO_NODE_IDS = [
  'hito1_dofa',
  'hito1_diagnostico_0312',
  'hito1_responsable',
  'hito1_politica_objetivos',
  'hito1_objetivos',
  'hito1_rhs',
  'hito1_rit',
  'hito1_participacion_ipevar',
  'hito2_matriz_ipevar',
  'hito3_matriz_pesv',
  'hito3_quimicos_sga',
  'hito1_oportunidades_sst',
  'hito6_vulnerabilidad',
  'hito1_plan_emergencias',
  'hito2_perfiles_cargo',
  'hito2_perfil_socio',
  'hito2_condiciones_salud',
  'hito2_oraculo_predictivo',
  'hito4_comites',
  'hito3_cocolab',
  'hito4_bio_ipevar',
  'hito3_owas',
  'hito3_estudio_puesto',
  'hito4_psicosocial',
  'hito5_compras_sst',
  'hito5_contratistas',
  'hito5_gestion_cambio',
  'hito3_ats',
  'hito3_alturas',
  'hito5_equipos_alturas',
  'hito3_epp',
  'hito5_registro_quimico',
  'hito3_vehiculos',
  'hito5_capacitaciones',
  'hito6_ruta_aprendizaje',
  'hito4_actos_condiciones',
  'hito7_estadisticas_atel',
  'hito7_investigacion_atel',
  'hito7_acpm',
  'hito7_auditoria',
  'hito7_alta_direccion',
  'hito8_predictivo',
];

function buildSlug(text) {
  return (
    String(text || 'informe_sst')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase()
      .slice(0, 72) || 'informe_sst'
  );
}

function escapeHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getSafeModel(modelName, routeRequirePath = null, modelRequirePath = null) {
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }
  if (modelRequirePath) {
    try {
      const m = require(modelRequirePath);
      if (mongoose.models[modelName]) return mongoose.models[modelName];
      if (m && m.modelName === modelName) return m;
      if (m && m[modelName]) return m[modelName];
    } catch (_) {}
  }
  if (routeRequirePath) {
    try {
      require(routeRequirePath);
      if (mongoose.models[modelName]) return mongoose.models[modelName];
    } catch (_) {}
  }
  return mongoose.models[modelName] || null;
}

/**
 * Resuelve el spec canónico de informe oficial a partir de un `hitoNodeId`, `sgsstAppId`, tag o alias.
 *
 * @param {string} nodeOrAppId
 * @returns {object|null}
 */
function resolveHitoReportSpec(nodeOrAppId) {
  if (!nodeOrAppId) return null;
  const raw = String(nodeOrAppId).trim().toLowerCase();
  if (!raw) return null;

  const clean = raw
    .replace(/^(in_|out_|app_)/, '')
    .replace(/^sgsst[-_]/, '')
    .replace(/-/g, '_')
    .trim();

  if (HITO_APP_REPORT_SPECS[raw]) return HITO_APP_REPORT_SPECS[raw];
  if (HITO_APP_REPORT_SPECS[clean]) return HITO_APP_REPORT_SPECS[clean];

  for (const spec of Object.values(HITO_APP_REPORT_SPECS)) {
    if (spec.sgsstAppId.toLowerCase() === raw || spec.sgsstAppId.toLowerCase() === clean) {
      return spec;
    }
    if (
      Array.isArray(spec.aliases) &&
      spec.aliases.some((al) => {
        const normAl = al.toLowerCase().replace(/-/g, '_');
        return normAl === raw || normAl === clean;
      })
    ) {
      return spec;
    }
    if (
      Array.isArray(spec.reportTags) &&
      spec.reportTags.some((tg) => {
        const normTg = tg.toLowerCase().replace(/^sgsst[-_]/, '').replace(/-/g, '_');
        return tg.toLowerCase() === raw || normTg === clean;
      })
    ) {
      return spec;
    }
  }

  return null;
}

async function resolveCompanyAndOwner({ userId, companyId }) {
  let companyDoc = null;
  const cleanCompanyId = companyId ? String(companyId).trim() : '';
  const cleanUserId = userId ? String(userId).trim() : '';
  const hasExplicitCompanyId = Boolean(cleanCompanyId && mongoose.Types.ObjectId.isValid(cleanCompanyId));

  if (hasExplicitCompanyId) {
    companyDoc = await CompanyInfo.findById(cleanCompanyId).lean().catch(() => null);
  } else if (cleanUserId && mongoose.Types.ObjectId.isValid(cleanUserId)) {
    companyDoc =
      (await CompanyInfo.findOne({ user: cleanUserId, isActive: true }).lean().catch(() => null)) ||
      (await CompanyInfo.findOne({ user: cleanUserId }).lean().catch(() => null));
  }

  const effectiveCompanyId = hasExplicitCompanyId
    ? cleanCompanyId
    : companyDoc?._id
      ? String(companyDoc._id)
      : '';
  const effectiveUserId = cleanUserId || (companyDoc?.user ? String(companyDoc.user) : '');

  return {
    companyDoc,
    effectiveCompanyId,
    effectiveUserId,
  };
}

function extractRawMessageHtml(msg) {
  if (!msg) return '';
  if (typeof msg.text === 'string' && msg.text.trim().length > 0) {
    return msg.text;
  }
  if (Array.isArray(msg.content)) {
    const joined = msg.content
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .join('');
    if (joined.trim().length > 0) return joined;
  }
  return '';
}

async function extractFromEmbeddedField(spec, effectiveUserId, effectiveCompanyId) {
  const emb = spec?.embeddedReport;
  if (!emb) return null;

  const Model = getSafeModel(emb.modelName, emb.routeRequire, emb.modelRequire);
  if (!Model) return null;

  try {
    // Sesiones workspace oficiales (PESV, Compatibilidad Química)
    if (emb.sessionPrefix) {
      const orConditions = [];
      if (effectiveCompanyId && mongoose.Types.ObjectId.isValid(effectiveCompanyId)) {
        orConditions.push({ companyId: effectiveCompanyId, isOfficial: true });
        orConditions.push({ conversationId: `${emb.sessionPrefix}${effectiveCompanyId}` });
        orConditions.push({ companyId: effectiveCompanyId });
      } else if (effectiveUserId) {
        orConditions.push({ user: effectiveUserId, isOfficial: true });
        orConditions.push({ conversationId: `${emb.sessionPrefix}${effectiveUserId}` });
      }
      if (orConditions.length === 0) return null;

      const sessionDoc = await Model.findOne({ $or: orConditions })
        .sort({ isOfficial: -1, updatedAt: -1 })
        .lean();
      const html = sessionDoc?.[emb.field];
      if (typeof html === 'string' && html.trim().length > 80) {
        return {
          reportHtml: html,
          reportTitle: sessionDoc.title || spec.reportTitle,
          reportConversationId: sessionDoc.conversationId || null,
          createdAt: sessionDoc.updatedAt || sessionDoc.createdAt || new Date(),
        };
      }
      return null;
    }

    const scopeQuery = {};
    if (effectiveCompanyId && mongoose.Types.ObjectId.isValid(effectiveCompanyId)) {
      scopeQuery.companyId = effectiveCompanyId;
    } else if (effectiveUserId && mongoose.Types.ObjectId.isValid(effectiveUserId)) {
      scopeQuery.user = effectiveUserId;
    } else {
      return null;
    }

    if (emb.multiDoc) {
      const sortObj = { [emb.sortField || 'updatedAt']: -1 };
      const docs = await Model.find(scopeQuery).sort(sortObj).limit(15).lean();
      for (const d of docs) {
        const html = d?.[emb.field];
        if (typeof html === 'string' && html.trim().length > 80) {
          return {
            reportHtml: html,
            reportTitle: spec.reportTitle,
            reportConversationId: d.conversationId || null,
            createdAt: d.updatedAt || d.createdAt || d.fecha || new Date(),
          };
        }
      }
      return null;
    }

    const doc = await Model.findOne(scopeQuery).sort({ updatedAt: -1 }).lean();
    if (!doc) return null;

    if (emb.arrayField && emb.subField) {
      const arr = Array.isArray(doc[emb.arrayField]) ? doc[emb.arrayField] : [];
      const chunks = arr
        .map((item) => {
          const content = item?.[emb.subField];
          if (typeof content === 'string' && content.trim().length > 80) {
            const headerLabel =
              item.nombreCargo || item.nombre || item.identificacion || item.documento || '';
            return headerLabel
              ? `<section style="margin-bottom:28px;"><h3 style="color:#0f766e;font-family:Arial,sans-serif;border-bottom:1px solid #cbd5e1;padding-bottom:6px;">${escapeHtml(headerLabel)}</h3>${content}</section>`
              : content;
          }
          return '';
        })
        .filter(Boolean);

      if (chunks.length > 0) {
        return {
          reportHtml: chunks.join('\n'),
          reportTitle: spec.reportTitle,
          reportConversationId: doc.conversationId || null,
          createdAt: doc.updatedAt || doc.createdAt || new Date(),
        };
      }
      return null;
    }

    const html = doc?.[emb.field];
    if (typeof html === 'string' && html.trim().length > 80) {
      return {
        reportHtml: html,
        reportTitle: spec.reportTitle,
        reportConversationId: doc.conversationId || null,
        createdAt: doc.updatedAt || doc.createdAt || new Date(),
      };
    }
  } catch (err) {
    logger.warn(`[HitoReportPipeline] Embedded report lookup warning (${spec.hitoNodeId}): ${err.message}`);
  }

  return null;
}

async function persistEmbeddedReportIfApplicable(spec, effectiveUserId, effectiveCompanyId, htmlContent, conversationId, messageId) {
  const emb = spec?.embeddedReport;
  if (!emb || !emb.writable || !htmlContent) return;

  const Model = getSafeModel(emb.modelName, emb.routeRequire, emb.modelRequire);
  if (!Model) return;

  try {
    if (emb.sessionPrefix) {
      const targetConvoId = `${emb.sessionPrefix}${effectiveCompanyId || effectiveUserId}`;
      const filter =
        effectiveCompanyId && mongoose.Types.ObjectId.isValid(effectiveCompanyId)
          ? { conversationId: targetConvoId }
          : { conversationId: targetConvoId };
      const updateSet = {
        [emb.field]: htmlContent,
        isOfficial: true,
        updatedAt: new Date(),
      };
      if (effectiveUserId && mongoose.Types.ObjectId.isValid(effectiveUserId)) {
        updateSet.user = effectiveUserId;
      }
      if (effectiveCompanyId && mongoose.Types.ObjectId.isValid(effectiveCompanyId)) {
        updateSet.companyId = effectiveCompanyId;
      }
      await Model.findOneAndUpdate(filter, { $set: updateSet }, { upsert: true, new: true });
      return;
    }

    if (effectiveUserId && mongoose.Types.ObjectId.isValid(effectiveUserId)) {
      const filter = {
        user: effectiveUserId,
        ...(effectiveCompanyId && mongoose.Types.ObjectId.isValid(effectiveCompanyId)
          ? { companyId: effectiveCompanyId }
          : {}),
      };
      const updateFields = {
        [emb.field]: htmlContent,
        updatedAt: new Date(),
      };
      if (conversationId) updateFields.conversationId = conversationId;
      if (messageId) updateFields.messageId = messageId;
      await Model.findOneAndUpdate(filter, { $set: updateFields }, { upsert: true, new: true });
    }
  } catch (err) {
    logger.warn(`[HitoReportPipeline] Could not sync embedded HTML (${spec.hitoNodeId}): ${err.message}`);
  }
}

/**
 * Extrae el último Informe Oficial HTML de cualquier aplicativo Hito (1–8) con aislamiento
 * estricto por `companyId` y 100% del HTML intacto (cero strip de etiquetas, cero truncado).
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} [params.companyId]
 * @param {string} params.hitoNodeId
 */
async function extractLatestOfficialAppReport({ userId, companyId, hitoNodeId }) {
  const spec = resolveHitoReportSpec(hitoNodeId);
  if (!spec) {
    return {
      found: false,
      hitoNodeId: String(hitoNodeId || ''),
      appId: null,
      reportTitle: '',
      reportHtml: '',
      reportConversationId: null,
      createdAt: null,
      charCount: 0,
      fileNameSlug: buildSlug(hitoNodeId),
    };
  }

  const { companyDoc, effectiveCompanyId, effectiveUserId } = await resolveCompanyAndOwner({
    userId,
    companyId,
  });

  const companySlug = companyDoc?.companyName ? buildSlug(companyDoc.companyName) : '';
  const defaultSlug = buildSlug(
    `${spec.docCode}_${spec.sgsstAppId}${companySlug ? `_${companySlug}` : ''}`,
  );

  // 1. Buscar primero en Conversation + Message con aislamiento ESTRICTO por company-${companyId}
  try {
    const { Conversation, Message } = require('~/db/models');
    if (Conversation && Message) {
      const andClauses = [{ tags: { $in: spec.reportTags } }];

      if (effectiveCompanyId) {
        andClauses.push({
          tags: { $in: [`company-${effectiveCompanyId}`, `company_${effectiveCompanyId}`] },
        });
      }

      if (spec.strictDiagnosticTagOnly) {
        // Evitar confundir otros módulos guardados bajo endpoint 'sgsst-diagnostico' si llegaran a compartir tag base
        andClauses.push({
          tags: {
            $nin: [
              'sgsst-politica',
              'sgsst-objetivos',
              'sgsst-rhs',
              'sgsst-rit',
              'sgsst-responsable',
              'sgsst-auditoria',
              'sgsst-alta-direccion',
            ],
          },
        });
      }

      const convoQuery = {
        ...(effectiveUserId ? { user: effectiveUserId } : {}),
        $and: andClauses,
      };

      const candidateConvos = await Conversation.find(convoQuery)
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean();

      for (const convo of candidateConvos) {
        if (!convo?.conversationId) continue;
        const msgs = await Message.find({ conversationId: convo.conversationId })
          .sort({ isCreatedByUser: 1, createdAt: -1 })
          .limit(5)
          .lean();

        const bestMsg =
          msgs.find((m) => !m.isCreatedByUser && extractRawMessageHtml(m).trim().length > 50) ||
          msgs.find((m) => extractRawMessageHtml(m).trim().length > 50);

        if (bestMsg) {
          const intactHtml = extractRawMessageHtml(bestMsg);
          return {
            found: true,
            hitoNodeId: spec.hitoNodeId,
            appId: spec.sgsstAppId,
            reportTitle: convo.title || spec.reportTitle,
            reportHtml: intactHtml,
            reportConversationId: convo.conversationId,
            createdAt: bestMsg.createdAt || convo.updatedAt || convo.createdAt || new Date(),
            charCount: intactHtml.length,
            fileNameSlug: defaultSlug,
          };
        }
      }
    }
  } catch (err) {
    logger.warn(`[HitoReportPipeline] Conversation lookup warning (${spec.hitoNodeId}): ${err.message}`);
  }

  // 2. Si no existe en Conversation, revisar campo de HTML embebido del modelo de esa empresa
  const embeddedHit = await extractFromEmbeddedField(spec, effectiveUserId, effectiveCompanyId);
  if (embeddedHit && embeddedHit.reportHtml) {
    return {
      found: true,
      hitoNodeId: spec.hitoNodeId,
      appId: spec.sgsstAppId,
      reportTitle: embeddedHit.reportTitle || spec.reportTitle,
      reportHtml: embeddedHit.reportHtml,
      reportConversationId: embeddedHit.reportConversationId || null,
      createdAt: embeddedHit.createdAt || new Date(),
      charCount: embeddedHit.reportHtml.length,
      fileNameSlug: defaultSlug,
    };
  }

  return {
    found: false,
    hitoNodeId: spec.hitoNodeId,
    appId: spec.sgsstAppId,
    reportTitle: spec.reportTitle,
    reportHtml: '',
    reportConversationId: null,
    createdAt: null,
    charCount: 0,
    fileNameSlug: defaultSlug,
  };
}

function registerGeneratedReportOnReq(req, reportPayload) {
  if (!req || typeof req !== 'object' || !reportPayload?.reportHtml) return;
  if (!Array.isArray(req._generatedAppReports)) {
    req._generatedAppReports = [];
  }
  const existingIdx = req._generatedAppReports.findIndex(
    (r) =>
      r &&
      r.hitoNodeId === reportPayload.hitoNodeId &&
      ((reportPayload.reportConversationId &&
        r.reportConversationId === reportPayload.reportConversationId) ||
        !reportPayload.reportConversationId),
  );
  if (existingIdx >= 0) {
    req._generatedAppReports[existingIdx] = reportPayload;
  } else {
    req._generatedAppReports.push(reportPayload);
  }
}

function stripCodeFencesFromHtml(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();
  // Si el modelo incluyó envoltorio <html> o <body>, extraer únicamente el interior de <body>
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    cleaned = bodyMatch[1].trim();
  }
  return cleaned;
}

function buildDeterministicBodyHtml({ spec, companyDoc, inspectionData, customInstructions }) {
  const kpis = Array.isArray(inspectionData?.kpis) ? inspectionData.kpis : [];
  const records = Array.isArray(inspectionData?.records) ? inspectionData.records : [];
  const compName = companyDoc?.companyName || 'la Organización';
  const riskLevel = companyDoc?.riskLevel || 'No registrado';
  const workerCount = companyDoc?.workerCount ?? 0;

  const kpiCells = kpis.length
    ? kpis
        .map(
          (k) =>
            `<td style="padding:10px 12px;border:1px solid #cbd5e1;background:#f8fafc;text-align:center;">` +
            `<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;">${escapeHtml(k.label)}</div>` +
            `<div style="font-size:16px;color:#0f766e;font-weight:800;margin-top:4px;">${escapeHtml(k.value)}</div>` +
            `</td>`,
        )
        .join('')
    : `<td style="padding:10px 12px;border:1px solid #cbd5e1;background:#f8fafc;text-align:center;">` +
      `<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;">Registros Estructurados en Base de Datos</div>` +
      `<div style="font-size:16px;color:#d97706;font-weight:800;margin-top:4px;">0</div>` +
      `</td>`;

  let recordsSectionHtml = '';
  if (records.length > 0) {
    const rowsHtml = records
      .slice(0, 60)
      .map((rec, idx) => {
        const fieldPairs = Object.entries(rec.fields || {})
          .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
          .slice(0, 5)
          .map(([fk, fv]) => `<strong>${escapeHtml(fk)}:</strong> ${escapeHtml(fv)}`)
          .join('<br/>');
        return (
          `<tr>` +
          `<td style="padding:8px 10px;border:1px solid #cbd5e1;font-size:11px;text-align:center;">${idx + 1}</td>` +
          `<td style="padding:8px 10px;border:1px solid #cbd5e1;font-size:11px;font-weight:700;color:#0f172a;">${escapeHtml(rec.label || rec.id || `Registro ${idx + 1}`)}<div style="font-weight:400;color:#475569;margin-top:2px;">${escapeHtml(rec.sublabel || '')}</div></td>` +
          `<td style="padding:8px 10px;border:1px solid #cbd5e1;font-size:11px;color:#1e293b;">${fieldPairs || escapeHtml(rec.sublabel || 'Registrado')}</td>` +
          `<td style="padding:8px 10px;border:1px solid #cbd5e1;font-size:11px;font-weight:700;text-align:center;color:${rec.isCritical ? '#be123c' : '#0f766e'};">${escapeHtml(rec.badge || (rec.isCritical ? 'Prioritario' : 'Vigente'))}</td>` +
          `</tr>`
        );
      })
      .join('');

    recordsSectionHtml = `
      <h2 style="font-family:Arial,sans-serif;font-size:14px;color:#0f766e;border-bottom:2px solid #0d9488;padding-bottom:6px;margin-top:22px;">2. Consolidado Técnico de Registros Verificados (${records.length})</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:10px;font-family:Arial,sans-serif;">
        <thead>
          <tr style="background-color:#0f766e;color:#ffffff;font-size:11px;text-transform:uppercase;">
            <th style="padding:8px 10px;border:1px solid #0f766e;width:6%;">#</th>
            <th style="padding:8px 10px;border:1px solid #0f766e;width:30%;">Elemento / Registro</th>
            <th style="padding:8px 10px;border:1px solid #0f766e;width:48%;">Detalle Técnico y Evidencia</th>
            <th style="padding:8px 10px;border:1px solid #0f766e;width:16%;">Estado / Nivel</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
  } else {
    recordsSectionHtml = `
      <h2 style="font-family:Arial,sans-serif;font-size:14px;color:#0f766e;border-bottom:2px solid #0d9488;padding-bottom:6px;margin-top:22px;">2. Diagnóstico Veraz de Estado Actual y Brecha Normativa</h2>
      <div style="padding:14px 16px;border:1px solid #f59e0b;background-color:#fffbeb;border-radius:10px;font-family:Arial,sans-serif;font-size:12px;color:#78350f;line-height:1.6;">
        <strong>Estado Verificado en Base de Datos (${escapeHtml(compName)}):</strong> A la fecha de corte, el módulo <strong>${escapeHtml(spec.reportTitle)} (${escapeHtml(spec.docCode)})</strong> registra <strong>0 registros estructurados cargados</strong> para la empresa (Riesgo ARL: ${escapeHtml(riskLevel)}, Trabajadores reportados en ficha: ${escapeHtml(workerCount)}).<br/>
        En estricto apego al principio de veracidad documental del SG-SST (${escapeHtml(spec.normativeRef)}), no se simulan ni inventan trabajadores, eventos ni mediciones inexistentes, estableciendo a continuación la hoja de ruta técnica obligatoria para cerrar esta brecha.
      </div>
    `;
  }

  return `
    <div style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.6;font-size:12px;">
      <h2 style="font-size:14px;color:#0f766e;border-bottom:2px solid #0d9488;padding-bottom:6px;margin-top:10px;">1. Alcance Ejecutivo e Indicadores del Módulo (${escapeHtml(spec.docCode)})</h2>
      <p>El presente documento oficial consolida la evaluación técnica y normativa correspondiente a <strong>${escapeHtml(spec.reportTitle)}</strong> para <strong>${escapeHtml(compName)}</strong>, en cumplimiento de <strong>${escapeHtml(spec.normativeRef)}</strong>.</p>
      ${customInstructions ? `<p style="background:#f0fdfa;border-left:4px solid #0d9488;padding:8px 12px;"><strong>Directriz Técnica Aplicada:</strong> ${escapeHtml(customInstructions)}</p>` : ''}
      <table style="width:100%;border-collapse:collapse;margin:12px 0;"><tr>${kpiCells}</tr></table>
      ${recordsSectionHtml}
      <h2 style="font-size:14px;color:#0f766e;border-bottom:2px solid #0d9488;padding-bottom:6px;margin-top:22px;">3. Recomendaciones Técnicas y Control de Cumplimiento</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:10px;">
        <thead>
          <tr style="background-color:#0f766e;color:#ffffff;font-size:11px;text-transform:uppercase;">
            <th style="padding:8px 10px;border:1px solid #0f766e;width:25%;">Criterio Legal</th>
            <th style="padding:8px 10px;border:1px solid #0f766e;width:50%;">Acción Técnica Requerida en el SG-SST</th>
            <th style="padding:8px 10px;border:1px solid #0f766e;width:25%;">Responsable</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:8px 10px;border:1px solid #cbd5e1;font-size:11px;font-weight:700;">${escapeHtml(spec.normativeRef)}</td>
            <td style="padding:8px 10px;border:1px solid #cbd5e1;font-size:11px;">${records.length > 0 ? 'Mantener trazabilidad mensual de evidencias, socializar resultados con el COPASST/Vigía y cerrar hallazgos críticos en el tablero ACPM.' : 'Realizar el levantamiento primario de registros en el aplicativo de Somos SST, adjuntar soportes firmados y verificar eficacia con el Responsable SG-SST.'}</td>
            <td style="padding:8px 10px;border:1px solid #cbd5e1;font-size:11px;">${escapeHtml(companyDoc?.responsibleSST || 'Responsable SG-SST')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Extrae o genera bajo demanda el Informe Oficial HTML de cualquiera de los 42 Aplicativos Hito (1–8),
 * persistiendo en el historial oficial con aislamiento estricto por `companyId` e inyectándolo en
 * `req._generatedAppReports` para integración inmediata con `canvas_doc` y `email_report`.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} [params.companyId]
 * @param {string} params.hitoNodeId
 * @param {boolean} [params.forceRegenerate=false]
 * @param {boolean} [params.generateIfMissing=true]
 * @param {string} [params.aiModel='gemini-3.6-flash']
 * @param {string} [params.customInstructions='']
 * @param {object|null} [params.req=null]
 */
async function generateOrExtractOfficialAppReport({
  userId,
  companyId,
  hitoNodeId,
  forceRegenerate = false,
  generateIfMissing = true,
  aiModel = 'gemini-3.6-flash',
  customInstructions = '',
  req = null,
}) {
  const spec = resolveHitoReportSpec(hitoNodeId);
  if (!spec) {
    throw new Error(
      `No se reconoció el aplicativo o nodo Hito "${hitoNodeId}". Verifica el identificador del módulo (ej. hito2_matriz_ipevar, hito1_dofa, hito7_investigacion_atel).`,
    );
  }

  const { companyDoc, effectiveCompanyId, effectiveUserId } = await resolveCompanyAndOwner({
    userId: userId || req?.user?.id || req?.user?._id,
    companyId: companyId || req?.companyId || req?.body?.companyId,
  });

  // 1. Reutilizar informe oficial existente si !forceRegenerate y supera 200 caracteres
  if (!forceRegenerate) {
    const existing = await extractLatestOfficialAppReport({
      userId: effectiveUserId,
      companyId: effectiveCompanyId,
      hitoNodeId: spec.hitoNodeId,
    });

    if (existing.found && existing.reportHtml && existing.reportHtml.trim().length > 200) {
      registerGeneratedReportOnReq(req, {
        appId: spec.sgsstAppId,
        hitoNodeId: spec.hitoNodeId,
        reportTitle: existing.reportTitle,
        reportHtml: existing.reportHtml,
        reportConversationId: existing.reportConversationId,
        fileNameSlug: existing.fileNameSlug,
      });
      return {
        ...existing,
        generatedNow: false,
        reusedExisting: true,
        generationMode: 'existing_official_report',
      };
    }

    if (generateIfMissing === false) {
      return {
        ...existing,
        generatedNow: false,
        generationMode: 'none',
      };
    }
  }

  // 2. Inspeccionar datos estructurados reales del aplicativo en MongoDB con aislamiento estricto por empresa
  let inspectionData = null;
  try {
    const { inspectNodeLiveData } = require('~/server/services/workflowNodeInspectorService');
    inspectionData = await inspectNodeLiveData({
      nodeId: spec.hitoNodeId,
      userId: effectiveUserId,
      companyId: effectiveCompanyId,
    });
  } catch (inspErr) {
    logger.warn(`[HitoReportPipeline] inspectNodeLiveData warning (${spec.hitoNodeId}): ${inspErr.message}`);
  }

  const realRecords = Array.isArray(inspectionData?.records)
    ? inspectionData.records.filter((r) => !String(r?.label || '').startsWith('📄 '))
    : [];
  const realKpis = Array.isArray(inspectionData?.kpis) ? inspectionData.kpis : [];

  const companyContextText = buildCompanyContextString(companyDoc || {});
  const kpisSummaryText =
    realKpis.length > 0
      ? realKpis.map((k) => `- ${k.label}: ${k.value}`).join('\n')
      : '- Sin indicadores numéricos cargados aún (0 registros en colección).';

  const recordsSummaryText =
    realRecords.length > 0
      ? realRecords
          .slice(0, 45)
          .map((rec, idx) => {
            const fieldsStr = Object.entries(rec.fields || {})
              .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
              .slice(0, 8)
              .map(([k, v]) => `${k}: ${String(v).slice(0, 240)}`)
              .join(' | ');
            return `${idx + 1}. [${rec.badge || 'Registro'}] ${rec.label || rec.id}${rec.sublabel ? ` (${rec.sublabel})` : ''}${fieldsStr ? ` -> ${fieldsStr}` : ''}`;
          })
          .join('\n')
      : 'CERO (0) REGISTROS ESTRUCTURADOS EN LA BASE DE DATOS PARA ESTA EMPRESA.';

  const headerHtml = buildStandardHeader({
    companyInfo: companyDoc || {},
    title: `${spec.reportTitle} (${spec.docCode})`,
    norma: spec.normativeRef,
  });

  const signaturesHtml = buildSignatureSection(
    companyDoc || {
      companyName: 'Organización',
      responsibleSST: 'Responsable SG-SST',
      legalRepresentative: 'Representante Legal',
    },
  );

  const effectiveModel = mapToGoogleApiTextModel(aiModel, 'gemini-3.6-flash');

  const prompt = `Eres un Auditor Líder y Especialista Senior en Seguridad y Salud en el Trabajo (SG-SST) en Colombia.
Redacta el CUERPO HTML OFICIAL, EJECUTIVO Y TÉCNICO del documento:
- Documento: "${spec.reportTitle}"
- Código Documental: ${spec.docCode}
- Marco Normativo Obligatorio: ${spec.normativeRef}

${companyContextText || `- Empresa: ${companyDoc?.companyName || 'Organización en proceso de configuración'}`}

═══ INDICADORES REALES EN BASE DE DATOS (${spec.hitoNodeId}) ═══
${kpisSummaryText}

═══ REGISTROS REALES EXTRAÍDOS DE MONGODB (${realRecords.length} registro(s)) ═══
${recordsSummaryText}

${customInstructions ? `═══ INSTRUCCIONES Y PARÁMETROS ESPECÍFICOS SOLICITADOS ═══\n${customInstructions}\n` : ''}
REGLAS ESTRICTAS E INQUEBRANTABLES DE FORMATO Y VERACIDAD:
1. VERACIDAD 100% ABSOLUTA: Usa EXCLUSIVAMENTE los datos reales de la empresa y de los registros anteriores. Si hay 0 registros estructurados (y no se suministraron textos/parámetros explícitos en las instrucciones específicas), indícalo con total transparencia ("0 registros cargados a la fecha de corte") y desarrolla el diagnóstico técnico de brecha normativa y plan de implementación adaptado al CIIU, Nivel de Riesgo y tamaño de la empresa. PROHIBIDO inventar nombres de trabajadores, cédulas, placas, mediciones o accidentes falsos.
2. NO INCLUYAS encabezado corporativo ni tabla de firmas finales (ya se inyectan automáticamente antes y después de tu HTML). Tampoco incluyas bloques \`\`\`html ni etiquetas <html>/<head>/<body>.
3. COMPATIBILIDAD TOTAL CON LIVE EDITOR, WORD Y PDF: Devuelve únicamente fragmentos HTML limpios (\`<div>\`, \`<h2>\`, \`<h3>\`, \`<p>\`, \`<table>\`, \`<thead>\`, \`<tbody>\`, \`<tr>\`, \`<th>\`, \`<td>\`, \`<ul>\`, \`<li>\`) con estilos inline sobrios y profesionales:
   - Títulos \`<h2>\` en color \`#0f766e\` con \`border-bottom: 2px solid #0d9488; padding-bottom: 6px;\`.
   - Tablas con \`width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 12px;\`, encabezados \`<th>\` con \`background-color: #0f766e; color: #ffffff; padding: 8px 10px; border: 1px solid #0f766e;\` y celdas \`<td>\` con \`padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top;\`.
4. ESTRUCTURA MÍNIMA: (1) Objeto, Alcance y Resumen Ejecutivo; (2) Desarrollo Técnico / Tablas de Evaluación e Indicadores según ${spec.normativeRef}; (3) Análisis de Cumplimiento, Hallazgos y Controles Prioritarios; (4) Plan de Acción y Seguimiento.`;

  let bodyHtml = '';
  let generationMode = 'gemini_ai';

  try {
    const rawAiHtml = await callSgsstGemini({
      userId: effectiveUserId,
      prompt,
      modelName: effectiveModel,
      generationConfig: { temperature: 0.2, maxOutputTokens: 32768 },
      timeoutMs: 35000,
    });
    bodyHtml = stripCodeFencesFromHtml(rawAiHtml);
  } catch (aiErr) {
    logger.warn(
      `[HitoReportPipeline] Gemini fallback determinista activado para ${spec.hitoNodeId}: ${aiErr.message}`,
    );
    generationMode = 'deterministic_fallback';
  }

  if (!bodyHtml || bodyHtml.length < 120) {
    generationMode = 'deterministic_fallback';
    bodyHtml = buildDeterministicBodyHtml({
      spec,
      companyDoc,
      inspectionData,
      customInstructions,
    });
  }

  const finalHtml = `<div class="wappy-official-hito-report" data-hito-node="${escapeHtml(spec.hitoNodeId)}" data-doc-code="${escapeHtml(spec.docCode)}" style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.6;">\n${headerHtml}\n${bodyHtml}\n${signaturesHtml}\n</div>`;

  const dateLabel = new Date().toLocaleDateString('es-CO');
  const compSuffix = companyDoc?.companyName ? ` - ${companyDoc.companyName}` : '';
  const fullTitle = `${spec.reportTitle} (${spec.docCode})${compSuffix} - ${dateLabel}`;
  const companySlug = companyDoc?.companyName ? buildSlug(companyDoc.companyName) : '';
  const fileNameSlug = buildSlug(
    `${spec.docCode}_${spec.sgsstAppId}${companySlug ? `_${companySlug}` : ''}`,
  );

  const persistTags = [
    ...new Set([
      ...spec.reportTags,
      ...(effectiveCompanyId ? [`company-${effectiveCompanyId}`, `company_${effectiveCompanyId}`] : []),
    ]),
  ];

  const safeReq = req
    ? Object.assign(Object.create(Object.getPrototypeOf(req)), req, {
        user: req.user || (effectiveUserId ? { id: effectiveUserId } : {}),
        companyId: effectiveCompanyId || req.companyId,
      })
    : {
        user: effectiveUserId ? { id: effectiveUserId } : {},
        companyId: effectiveCompanyId || undefined,
      };

  const persisted = await autoPersistGeneratedReport(safeReq, {
    htmlContent: finalHtml,
    title: fullTitle,
    tags: persistTags,
    model: effectiveModel,
    companyId: effectiveCompanyId,
  });

  await persistEmbeddedReportIfApplicable(
    spec,
    effectiveUserId,
    effectiveCompanyId,
    finalHtml,
    persisted?.conversationId || null,
    persisted?.messageId || null,
  );

  const reportConversationId = persisted?.conversationId || null;

  registerGeneratedReportOnReq(req, {
    appId: spec.sgsstAppId,
    hitoNodeId: spec.hitoNodeId,
    reportTitle: fullTitle,
    reportHtml: finalHtml,
    reportConversationId,
    fileNameSlug,
  });

  return {
    found: true,
    generatedNow: true,
    reusedExisting: false,
    generationMode,
    hitoNodeId: spec.hitoNodeId,
    appId: spec.sgsstAppId,
    docCode: spec.docCode,
    normativeRef: spec.normativeRef,
    reportTitle: fullTitle,
    reportHtml: finalHtml,
    reportConversationId,
    messageId: persisted?.messageId || null,
    createdAt: new Date(),
    charCount: finalHtml.length,
    fileNameSlug,
  };
}

module.exports = {
  HITO_APP_REPORT_SPECS,
  ACTIVE_42_HITO_NODE_IDS,
  resolveHitoReportSpec,
  extractLatestOfficialAppReport,
  generateOrExtractOfficialAppReport,
};
