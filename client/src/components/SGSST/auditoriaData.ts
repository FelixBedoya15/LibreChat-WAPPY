
export interface AuditoriaItem {
    id: string;
    code: string;
    name: string;
    description: string;
    evaluation: string;
    category: 'planear' | 'hacer' | 'verificar' | 'actuar';
    subcategory: string;
    criteria: string;
}

export const AUDITORIA_ITEMS: AuditoriaItem[] = [
    // --- 1. PLANEAR ---
    {
        id: 'aud_p_1',
        code: '1',
        name: 'RESPONSABLE DEL SG-SST',
        description: 'Designación del responsable del SG-SST.',
        evaluation: '¿Documento de designación, licencia y curso de 50h vigentes?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E1.1.1 | Dec 1072 | ISO 45001'
    },
    {
        id: 'aud_p_2',
        code: '2',
        name: 'RESPONSABILIDADES DEL SG-SST',
        description: 'Asignación de responsabilidades a todos los niveles.',
        evaluation: '¿Responsabilidades definidas y comunicadas por escrito?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E1.1.2 | ISO 45001: 5.3'
    },
    {
        id: 'aud_p_3',
        code: '3',
        name: 'RECURSOS',
        description: 'Asignación de recursos financieros, técnicos y humanos.',
        evaluation: '¿Presupuesto asignado y recursos disponibles para el año?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E1.1.4 | ISO 45001: 7.1'
    },
    {
        id: 'aud_p_6',
        code: '6',
        name: 'COPASST',
        description: 'Conformación y funcionamiento del COPASST.',
        evaluation: '¿Acta de conformación y actas de reunión mensuales?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E1.1.6 | Dec 1072: 2.2.4.6.12'
    },
    {
        id: 'aud_p_7',
        code: '7',
        name: 'COMITÉ DE CONVIVENCIA',
        description: 'Conformación y funcionamiento del CCL.',
        evaluation: '¿Acta de conformación y reuniones trimestrales?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E1.1.8 | Res 652/12'
    },
    {
        id: 'aud_p_8',
        code: '8',
        name: 'PROGRAMA DE CAPACITACIÓN',
        description: 'Plan de capacitación en SST.',
        evaluation: '¿Programa anual documentado y cronograma de actividades?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E1.2.1 | Dec 1072: 2.2.4.6.11'
    },
    {
        id: 'aud_p_9',
        code: '9',
        name: 'INDUCCIÓN-REINDUCCIÓN SST',
        description: 'Inducción a nuevos y reinducción anual.',
        evaluation: '¿Registros de inducción y reinducción firmados?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E1.2.2 | Dec 1072: 2.2.4.6.11'
    },
    {
        id: 'aud_p_10',
        code: '10',
        name: 'POLÍTICA',
        description: 'Política del SG-SST.',
        evaluation: '¿Política firmada, fechada (<1 año) y divulgada?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E2.1.1 | ISO 45001: 5.2'
    },
    {
        id: 'aud_p_11',
        code: '11',
        name: 'OBJETIVOS Y METAS',
        description: 'Objetivos del SG-SST.',
        evaluation: '¿Objetivos medibles, firmados y divulgados?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E2.2.1 | ISO 45001: 6.2'
    },
    {
        id: 'aud_p_12',
        code: '12',
        name: 'DIAGNÓSTICO INICIAL',
        description: 'Evaluación inicial del sistema.',
        evaluation: '¿Auto-evaluación o diagnóstico inicial realizado?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E2.3.1 | Dec 1072'
    },
    {
        id: 'aud_p_13',
        code: '13',
        name: 'PLAN DE TRABAJO',
        description: 'Plan de Trabajo Anual.',
        evaluation: '¿Plan firmado con cronograma y responsables?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E2.4.1 | ISO 45001: 6.2.2'
    },
    {
        id: 'aud_p_14',
        code: '14',
        name: 'CREACIÓN, CONTROL Y CONSERVACIÓN DE DOCUMENTOS',
        description: 'Gestión documental y archivo.',
        evaluation: '¿Listado maestro y archivo de registros (20 años)?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E2.5.1 | ISO 45001: 7.5'
    },
    {
        id: 'aud_p_15',
        code: '15',
        name: 'RENDICIÓN DE CUENTAS',
        description: 'Rendición de cuentas anual.',
        evaluation: '¿Actas de rendición de cuentas de todos los niveles?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E2.6.1 | Dec 1072'
    },
    {
        id: 'aud_p_16',
        code: '16',
        name: 'MATRIZ LEGAL',
        description: 'Matriz de requisitos legales.',
        evaluation: '¿Matriz actualizada con evaluación de cumplimiento?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E2.7.1 | ISO 45001: 6.1.3'
    },
    {
        id: 'aud_p_17',
        code: '17',
        name: 'COMUNICACIÓN, PARTICIPACIÓN Y CONSULTA',
        description: 'Mecanismos de comunicaciones.',
        evaluation: '¿Canales de comunicación y consulta evidenciados?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E2.8.1 | ISO 45001: 7.4/5.4'
    },
    {
        id: 'aud_p_18',
        code: '18',
        name: 'ADQUISICIONES',
        description: 'Gestión de compras.',
        evaluation: '¿Requisitos SST en compras de bienes y servicios?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'ISO 45001: 8.1.4'
    },
    {
        id: 'aud_p_19',
        code: '19',
        name: 'EVALUACIÓN Y SELECCIÓN DE PROVEEDORES Y CONTRATISTAS',
        description: 'Gestión de contratistas.',
        evaluation: '¿Evaluación de contratistas en SST?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E2.9.1 | ISO 45001: 8.1.4.2'
    },
    {
        id: 'aud_p_20',
        code: '20',
        name: 'GESTIÓN DEL CAMBIO',
        description: 'Procedimiento de gestión del cambio.',
        evaluation: '¿Análisis de impacto de cambios internos/externos?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'Res 0312: E2.11.1 | ISO 45001: 8.1.3'
    },
    {
        id: 'aud_p_21',
        code: '21',
        name: 'REGLAMENTO DE HIGIENE Y S.I',
        description: 'Reglamento de Higiene y Seguridad Industrial.',
        evaluation: '¿Reglamento actualizado y publicado?',
        category: 'planear',
        subcategory: '1. PLANEAR',
        criteria: 'CST Art 349'
    },

    // --- 2. HACER ---
    // 2.1 GESTIÓN DE LA SALUD
    {
        id: 'aud_h_salud_1',
        code: '2.1.1',
        name: 'PERFIL SOCIODEMOGRÁFICO',
        description: 'Diagnóstico de perfil sociodemográfico.',
        evaluation: '¿Perfil actualizado anualmente?',
        category: 'hacer',
        subcategory: '2.1 GESTIÓN DE LA SALUD',
        criteria: 'Res 0312: E3.1.1'
    },
    {
        id: 'aud_h_salud_2',
        code: '2.1.2',
        name: 'ACTIVIDADES DE MEDICINA DEL TRABAJO Y P&P',
        description: 'Actividades de promoción y prevención en salud.',
        evaluation: '¿Evidencia de actividades de medicina preventiva ejecutadas?',
        category: 'hacer',
        subcategory: '2.1 GESTIÓN DE LA SALUD',
        criteria: 'Res 0312: E3.1.2'
    },
    {
        id: 'aud_h_salud_3',
        code: '2.1.4',
        name: 'PERFILES DE CARGO',
        description: 'Requisitos de aptitud médica por cargo (Profesiograma).',
        evaluation: '¿Profesiograma validado por médico especialista?',
        category: 'hacer',
        subcategory: '2.1 GESTIÓN DE LA SALUD',
        criteria: 'Res 2346/07'
    },
    {
        id: 'aud_h_salud_4',
        code: '2.1.5',
        name: 'EXÁMENES MÉDICOS OCUPACIONALES',
        description: 'Conceptos de aptitud médica.',
        evaluation: '¿Conceptos médicos de ingreso, periódicos y retiro?',
        category: 'hacer',
        subcategory: '2.1 GESTIÓN DE LA SALUD',
        criteria: 'Res 0312: E3.1.3'
    },
    {
        id: 'aud_h_salud_5',
        code: '2.1.7',
        name: 'RESTRICCIONES Y RECOMENDACIONES',
        description: 'Seguimiento a recomendaciones médicas.',
        evaluation: '¿Registros de seguimiento a restricciones laborales?',
        category: 'hacer',
        subcategory: '2.1 GESTIÓN DE LA SALUD',
        criteria: 'Res 0312: E3.1.5'
    },
    {
        id: 'aud_h_salud_6',
        code: '2.1.8',
        name: 'ESTILOS DE VIDA SALUDABLES',
        description: 'Programa de estilos de vida saludable.',
        evaluation: '¿Campañas de prevención (tabaquismo, alcohol, deporte)?',
        category: 'hacer',
        subcategory: '2.1 GESTIÓN DE LA SALUD',
        criteria: 'Res 0312: E3.1.6'
    },
    {
        id: 'aud_h_salud_7',
        code: '2.1.9',
        name: 'MANEJO DE RESIDUOS',
        description: 'Gestión integral de residuos.',
        evaluation: '¿Clasificación y disposición adecuada de residuos?',
        category: 'hacer',
        subcategory: '2.1 GESTIÓN DE LA SALUD',
        criteria: 'Res 0312: E3.1.8'
    },
    {
        id: 'aud_h_salud_8',
        code: '2.1.10',
        name: 'INVESTIGACIÓN DE ATEL',
        description: 'Investigación de incidentes y accidentes.',
        evaluation: '¿Investigaciones realizadas a todos los eventos ATEL?',
        category: 'hacer',
        subcategory: '2.1 GESTIÓN DE LA SALUD',
        criteria: 'Res 0312: E3.2.2'
    },
    {
        id: 'aud_h_salud_9',
        code: '2.1.12',
        name: 'ESTADÍSTICAS ATEL',
        description: 'Registro estadístico de accidentalidad y enfermedad.',
        evaluation: '¿Estadísticas mensuales de ATEL al día?',
        category: 'hacer',
        subcategory: '2.1 GESTIÓN DE LA SALUD',
        criteria: 'Res 0312: E3.2.3'
    },

    // 2.2 GESTIÓN DE PELIGROS Y RIESGOS
    {
        id: 'aud_h_pel_1',
        code: '2.2.1',
        name: 'IDENTIFICACIÓN DE PELIGROS',
        description: 'Matriz de Peligros y Valoración de Riesgos.',
        evaluation: '¿Matriz actualizada con participación de trabajadores?',
        category: 'hacer',
        subcategory: '2.2 GESTIÓN DE PELIGROS',
        criteria: 'Res 0312: E4.1.2 | ISO 45001: 6.1.2'
    },
    {
        id: 'aud_h_pel_2',
        code: '2.2.3',
        name: 'IYP CANCERÍGENO',
        description: 'Identificación y priorización de riesgo cancerígeno.',
        evaluation: '¿Inventario de sustancias cancerígenas (si aplica)?',
        category: 'hacer',
        subcategory: '2.2 GESTIÓN DE PELIGROS',
        criteria: 'Res 0312: E4.1.5'
    },
    {
        id: 'aud_h_pel_3',
        code: '2.2.4',
        name: 'MEDIDAS DE PREVENCIÓN Y CONTROL',
        description: 'Implementación de controles.',
        evaluation: '¿Evidencia de controles implementados según matriz?',
        category: 'hacer',
        subcategory: '2.2 GESTIÓN DE PELIGROS',
        criteria: 'Res 0312: E4.2.1 | ISO 45001: 8.1.2'
    },
    {
        id: 'aud_h_pel_4',
        code: '2.2.5',
        name: 'PROGRAMA DE INSPECCIONES',
        description: 'Inspecciones de seguridad.',
        evaluation: '¿Inspecciones ejecutadas según cronograma?',
        category: 'hacer',
        subcategory: '2.2 GESTIÓN DE PELIGROS',
        criteria: 'Res 0312: E4.2.3'
    },
    {
        id: 'aud_h_pel_5',
        code: '2.2.6',
        name: 'PROGRAMA DE MANTENIMIENTO',
        description: 'Mantenimiento de equipos e instalaciones.',
        evaluation: '¿Intervenciones de mantenimiento registradas?',
        category: 'hacer',
        subcategory: '2.2 GESTIÓN DE PELIGROS',
        criteria: 'Res 0312: E4.2.4'
    },
    {
        id: 'aud_h_pel_6',
        code: '2.2.7',
        name: 'EPP',
        description: 'Elementos de Protección Personal.',
        evaluation: '¿Registros de entrega y capacitación en uso de EPP?',
        category: 'hacer',
        subcategory: '2.2 GESTIÓN DE PELIGROS',
        criteria: 'Res 0312: E4.2.5'
    },
    {
        id: 'aud_h_pel_7',
        code: '2.2.8',
        name: 'PROCEDIMIENTOS E INSTRUCTIVOS SST',
        description: 'Estándares de seguridad.',
        evaluation: '¿Procedimientos documentados para tareas críticas?',
        category: 'hacer',
        subcategory: '2.2 GESTIÓN DE PELIGROS',
        criteria: 'Res 0312: E4.2.2'
    },
    {
        id: 'aud_h_pel_8',
        code: '2.2.9',
        name: 'ORDEN Y ASEO',
        description: 'Programa de orden y aseo.',
        evaluation: '¿Evidencia de condiciones de orden y aseo?',
        category: 'hacer',
        subcategory: '2.2 GESTIÓN DE PELIGROS',
        criteria: 'Dec 1072'
    },

    // 2.3 GESTIÓN DE AMENAZAS
    {
        id: 'aud_h_ame_1',
        code: '2.3.1',
        name: 'PG_ PREPARACIÓN, ATENCIÓN Y RESPUESTA ANTE EMERGENCIA',
        description: 'Plan de Emergencias y Contingencias.',
        evaluation: '¿Plan escrito, actualizado y divulgado?',
        category: 'hacer',
        subcategory: '2.3 GESTIÓN DE AMENAZAS',
        criteria: 'Res 0312: E5.1.1 | ISO 45001: 8.2'
    },
    {
        id: 'aud_h_ame_2',
        code: '2.3.1.b',
        name: 'BRIGADA DE EMERGENCIAS',
        description: 'Conformación de brigada.',
        evaluation: '¿Brigada conformada, capacitada y dotada?',
        category: 'hacer',
        subcategory: '2.3 GESTIÓN DE AMENAZAS',
        criteria: 'Res 0312: E5.1.2'
    },

    // --- 3. VERIFICAR ---
    {
        id: 'aud_v_1',
        code: '3.1.1',
        name: 'PROGRAMA DE AUDITORÍA',
        description: 'Auditoría interna del sistema.',
        evaluation: '¿Informe de auditoría interna firmado?',
        category: 'verificar',
        subcategory: '3. VERIFICAR',
        criteria: 'Res 0312: E6.1.2 | ISO 45001: 9.2'
    },
    {
        id: 'aud_v_2',
        code: '3.1.2',
        name: 'REVISIÓN GERENCIAL',
        description: 'Revisión por la alta dirección.',
        evaluation: '¿Acta de revisión por la dirección anual?',
        category: 'verificar',
        subcategory: '3. VERIFICAR',
        criteria: 'Res 0312: E6.1.3 | ISO 45001: 9.3'
    },

    // --- 4. ACTUAR ---
    {
        id: 'aud_a_1',
        code: '4.1',
        name: 'ACCIONES CORRECTIVAS, PREVENTIVAS Y DE MEJORA',
        description: 'Matriz de ACPM.',
        evaluation: '¿Acciones cerradas eficazmente para no conformidades?',
        category: 'actuar',
        subcategory: '4. ACTUAR',
        criteria: 'Res 0312: E7.1.1 | ISO 45001: 10.2'
    }
];
