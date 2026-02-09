/**
 * Resolución 0312 de 2019 - Estándares Mínimos SG-SST
 * Checklist data structured by company size and risk level
 */

export enum CompanySize {
    SMALL = 'small', // ≤10 trabajadores
    MEDIUM = 'medium', // 11-50 trabajadores
    LARGE = 'large', // >50 trabajadores
}

export enum RiskLevel {
    I = 1,
    II = 2,
    III = 3,
    IV = 4,
    V = 5,
}

export interface ChecklistItem {
    id: string;
    code: string;
    name: string;
    description: string;
    evaluation: string;
    category: 'planear' | 'hacer' | 'verificar' | 'actuar';
    subcategory: string;
    points: number;
    article: number; // 3, 9, or 16
}

export interface ComplianceStatus {
    itemId: string;
    status: 'cumple' | 'no_cumple' | 'parcial' | 'no_aplica' | 'pendiente';
    observations?: string;
    evidence?: string[];
}

/**
 * Determines which standards apply based on company size and risk level
 */
export function getApplicableArticle(size: CompanySize, riskLevel: RiskLevel): number {
    // Small companies (≤10) with risk I-III: Article 3
    if (size === CompanySize.SMALL && riskLevel <= RiskLevel.III) {
        return 3;
    }
    // Medium companies (11-50) with risk I-III: Article 9
    if (size === CompanySize.MEDIUM && riskLevel <= RiskLevel.III) {
        return 9;
    }
    // All others (>50 workers OR risk IV-V): Article 16
    return 16;
}

/**
 * Artículo 3: Estándares Mínimos para empresas con ≤10 trabajadores, riesgo I-III
 * 7 estándares - Total: 100 puntos
 */
export const ARTICLE_3_STANDARDS: ChecklistItem[] = [
    {
        id: 'art3_1',
        code: '1.1.1',
        name: 'Asignación de una persona que diseñe el SG-SST',
        description: 'La empresa debe asignar una persona con contrato laboral que se encargue del diseño del Sistema de Gestión de Seguridad y Salud en el Trabajo.',
        evaluation: 'Verificar que exista documento de asignación de responsabilidades o contrato donde se evidencie la asignación del responsable del SG-SST.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 3,
    },
    {
        id: 'art3_2',
        code: '1.1.4',
        name: 'Afiliación al Sistema de Seguridad Social Integral',
        description: 'Todos los trabajadores deben estar afiliados al Sistema General de Seguridad Social en Salud, Pensiones y Riesgos Laborales.',
        evaluation: 'Verificar planillas de pago de aportes al Sistema de Seguridad Social Integral de todos los trabajadores.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 3,
    },
    {
        id: 'art3_3',
        code: '1.2.1',
        name: 'Capacitación en SST',
        description: 'La persona asignada debe tener o realizar capacitación virtual de 50 horas en SST.',
        evaluation: 'Verificar certificado del curso de capacitación virtual de 50 horas en SST definido por el Ministerio del Trabajo.',
        category: 'planear',
        subcategory: 'Capacitación en el SG-SST',
        points: 6,
        article: 3,
    },
    {
        id: 'art3_4',
        code: '2.1.1',
        name: 'Política de SST',
        description: 'Debe existir una Política de Seguridad y Salud en el Trabajo firmada, fechada y comunicada.',
        evaluation: 'Verificar que la política esté firmada por el representante legal, fechada y divulgada a todos los trabajadores.',
        category: 'planear',
        subcategory: 'Política de SST',
        points: 1,
        article: 3,
    },
    {
        id: 'art3_5',
        code: '2.4.1',
        name: 'Plan anual de trabajo',
        description: 'Debe existir un plan anual de trabajo del SG-SST con asignación de recursos.',
        evaluation: 'Verificar que el plan anual esté documentado, incluya metas, responsables, recursos y cronograma.',
        category: 'planear',
        subcategory: 'Plan anual de trabajo',
        points: 2,
        article: 3,
    },
    {
        id: 'art3_6',
        code: '4.1.1',
        name: 'Evaluación médica ocupacional',
        description: 'Se deben realizar evaluaciones médicas ocupacionales de ingreso.',
        evaluation: 'Verificar certificados de aptitud laboral de las evaluaciones médicas ocupacionales de ingreso de los trabajadores.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        points: 1,
        article: 3,
    },
    {
        id: 'art3_7',
        code: '4.2.1',
        name: 'Identificación de peligros y evaluación de riesgos',
        description: 'Debe existir identificación de peligros, evaluación y valoración de riesgos con participación de los trabajadores.',
        evaluation: 'Verificar documento de identificación de peligros y evaluación de riesgos actualizado y con participación de los trabajadores.',
        category: 'hacer',
        subcategory: 'Identificación de peligros',
        points: 4,
        article: 3,
    },
];

/**
 * Artículo 9: Estándares para empresas de 11-50 trabajadores, riesgo I-III
 * 21 estándares - Total: 100 puntos
 */
export const ARTICLE_9_STANDARDS: ChecklistItem[] = [
    // PLANEAR
    {
        id: 'art9_1',
        code: '1.1.1',
        name: 'Asignación de persona para diseño del SG-SST',
        description: 'La empresa debe asignar una persona con responsabilidades específicas para el diseño e implementación del SG-SST.',
        evaluation: 'Verificar documento de asignación de responsabilidades donde se designe al responsable del SG-SST.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 9,
    },
    {
        id: 'art9_2',
        code: '1.1.2',
        name: 'Asignación de responsabilidades en SST',
        description: 'Deben estar asignadas las responsabilidades en SST a todos los niveles de la organización.',
        evaluation: 'Verificar documento donde consten las responsabilidades en SST de todos los niveles.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 9,
    },
    {
        id: 'art9_3',
        code: '1.1.3',
        name: 'Asignación de recursos para el SG-SST',
        description: 'Debe existir asignación de recursos financieros, humanos, técnicos y físicos para el SG-SST.',
        evaluation: 'Verificar que exista documento de asignación de recursos con presupuesto definido para el SG-SST.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 9,
    },
    {
        id: 'art9_4',
        code: '1.1.4',
        name: 'Afiliación al Sistema de Seguridad Social Integral',
        description: 'Todos los trabajadores independientes y dependientes deben estar afiliados al SSSI.',
        evaluation: 'Verificar planillas de aportes al Sistema de Seguridad Social Integral.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 9,
    },
    {
        id: 'art9_5',
        code: '1.1.6',
        name: 'Conformación y funcionamiento del COPASST',
        description: 'Debe estar conformado el COPASST o Vigía de SST según número de trabajadores.',
        evaluation: 'Verificar actas de conformación, reuniones mensuales y funcionamiento del COPASST/Vigía.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 9,
    },
    {
        id: 'art9_6',
        code: '1.1.7',
        name: 'Capacitación de los integrantes del COPASST',
        description: 'Los integrantes del COPASST deben estar capacitados.',
        evaluation: 'Verificar certificados de capacitación de los miembros del COPASST.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 9,
    },
    {
        id: 'art9_7',
        code: '1.1.8',
        name: 'Conformación del Comité de Convivencia Laboral',
        description: 'Debe estar conformado el Comité de Convivencia Laboral.',
        evaluation: 'Verificar actas de conformación y reuniones del Comité de Convivencia Laboral.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 9,
    },
    {
        id: 'art9_8',
        code: '1.2.1',
        name: 'Programa de capacitación anual en SST',
        description: 'Debe existir programa de capacitación anual en promoción y prevención, incluyendo inducción.',
        evaluation: 'Verificar programa de capacitación anual documentado y registros de ejecución.',
        category: 'planear',
        subcategory: 'Capacitación en el SG-SST',
        points: 2,
        article: 9,
    },
    {
        id: 'art9_9',
        code: '1.2.2',
        name: 'Inducción y reinducción en SST',
        description: 'Todos los trabajadores deben recibir inducción y reinducción en SST.',
        evaluation: 'Verificar registros de inducción y reinducción en SST de todos los trabajadores.',
        category: 'planear',
        subcategory: 'Capacitación en el SG-SST',
        points: 2,
        article: 9,
    },
    {
        id: 'art9_10',
        code: '1.2.3',
        name: 'Curso virtual de 50 horas en SST',
        description: 'El responsable del SG-SST debe contar con el curso de 50 horas.',
        evaluation: 'Verificar certificado del curso virtual de 50 horas en SST del Ministerio del Trabajo.',
        category: 'planear',
        subcategory: 'Capacitación en el SG-SST',
        points: 2,
        article: 9,
    },
    {
        id: 'art9_11',
        code: '2.1.1',
        name: 'Política del SG-SST',
        description: 'Debe existir política del SG-SST firmada, fechada y comunicada.',
        evaluation: 'Verificar política documentada, firmada por el representante legal, fechada y comunicada.',
        category: 'planear',
        subcategory: 'Política de SST',
        points: 1,
        article: 9,
    },
    {
        id: 'art9_12',
        code: '2.2.1',
        name: 'Objetivos del SG-SST',
        description: 'Deben estar definidos los objetivos del SG-SST y ser medibles.',
        evaluation: 'Verificar que los objetivos estén documentados, sean claros, medibles y coherentes con la política.',
        category: 'planear',
        subcategory: 'Objetivos de la política de SST',
        points: 1,
        article: 9,
    },
    {
        id: 'art9_13',
        code: '2.3.1',
        name: 'Evaluación inicial del SG-SST',
        description: 'Debe existir una evaluación inicial del SG-SST.',
        evaluation: 'Verificar documento de evaluación inicial del SG-SST realizado.',
        category: 'planear',
        subcategory: 'Evaluación inicial del SG-SST',
        points: 1,
        article: 9,
    },
    {
        id: 'art9_14',
        code: '2.4.1',
        name: 'Plan anual de trabajo',
        description: 'Debe existir plan anual de trabajo firmado con objetivos, metas, responsables y recursos.',
        evaluation: 'Verificar plan anual de trabajo documentado y firmado con todos los elementos requeridos.',
        category: 'planear',
        subcategory: 'Plan anual de trabajo',
        points: 2,
        article: 9,
    },
    // HACER
    {
        id: 'art9_15',
        code: '3.1.1',
        name: 'Descripción sociodemográfica y diagnóstico de condiciones de salud',
        description: 'Debe existir descripción sociodemográfica de los trabajadores y diagnóstico de condiciones de salud.',
        evaluation: 'Verificar perfil sociodemográfico actualizado y diagnóstico de condiciones de salud.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        points: 1,
        article: 9,
    },
    {
        id: 'art9_16',
        code: '3.1.2',
        name: 'Actividades de promoción y prevención',
        description: 'Deben desarrollarse actividades de promoción y prevención en salud.',
        evaluation: 'Verificar registro de actividades de promoción y prevención desarrolladas.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        points: 1,
        article: 9,
    },
    {
        id: 'art9_17',
        code: '3.1.3',
        name: 'Información al médico de evaluaciones',
        description: 'Debe informarse al médico los perfiles de cargo para las evaluaciones médicas.',
        evaluation: 'Verificar que se remitan los perfiles de cargo y riesgos al médico evaluador.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        points: 1,
        article: 9,
    },
    {
        id: 'art9_18',
        code: '3.1.4',
        name: 'Realización de evaluaciones médicas ocupacionales',
        description: 'Deben realizarse evaluaciones médicas de ingreso, periódicas y de retiro.',
        evaluation: 'Verificar certificados de aptitud de evaluaciones médicas ocupacionales.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        points: 1,
        article: 9,
    },
    {
        id: 'art9_19',
        code: '3.1.5',
        name: 'Custodia de historias clínicas',
        description: 'Las historias clínicas ocupacionales deben estar bajo custodia del médico.',
        evaluation: 'Verificar documento que evidencie la custodia de historias clínicas por el médico o IPS.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        points: 1,
        article: 9,
    },
    {
        id: 'art9_20',
        code: '4.1.1',
        name: 'Identificación de peligros y evaluación de riesgos',
        description: 'Debe existir metodología para identificación de peligros, evaluación y valoración de riesgos.',
        evaluation: 'Verificar matriz de identificación de peligros y evaluación de riesgos actualizada.',
        category: 'hacer',
        subcategory: 'Identificación de peligros',
        points: 4,
        article: 9,
    },
    {
        id: 'art9_21',
        code: '4.2.1',
        name: 'Medidas de prevención y control',
        description: 'Deben implementarse medidas de prevención y control basadas en la identificación de peligros.',
        evaluation: 'Verificar que existan medidas de prevención y control implementadas según la matriz de riesgos.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        points: 2.5,
        article: 9,
    },
];

/**
 * Artículo 16: Estándares para empresas >50 trabajadores o riesgo IV-V
 * 60 estándares completos - Total: 100 puntos
 * (Se incluyen los principales, el listado completo está en las subcategorías)
 */
export const ARTICLE_16_STANDARDS: ChecklistItem[] = [
    // I. PLANEAR
    // 1. Recursos (10%)
    {
        id: 'art16_1',
        code: '1.1.1',
        name: 'Responsable del SG-SST',
        description: 'Se debe designar un responsable del SG-SST con licencia vigente en SST y curso de 50 horas.',
        evaluation: 'Verificar documento de designación, licencia vigente en SST y certificado del curso de 50 horas.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 16,
    },
    {
        id: 'art16_2',
        code: '1.1.2',
        name: 'Responsabilidades en el SG-SST',
        description: 'Deben estar definidas y asignadas las responsabilidades en SST a todos los niveles.',
        evaluation: 'Verificar documento con asignación de responsabilidades en SST por niveles.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 16,
    },
    {
        id: 'art16_3',
        code: '1.1.3',
        name: 'Asignación de recursos para el SG-SST',
        description: 'Se deben asignar recursos financieros, técnicos, humanos y de otra índole.',
        evaluation: 'Verificar documento de asignación de recursos con presupuesto específico para SST.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 16,
    },
    {
        id: 'art16_4',
        code: '1.1.4',
        name: 'Afiliación al Sistema General de Riesgos Laborales',
        description: 'Todos los trabajadores deben estar afiliados al SGRL.',
        evaluation: 'Verificar planillas de aportes y afiliación de todos los trabajadores al SGRL.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 16,
    },
    {
        id: 'art16_5',
        code: '1.1.5',
        name: 'Pago de pensión de trabajadores de alto riesgo',
        description: 'Se debe realizar el pago de pensión especial para trabajadores de alto riesgo.',
        evaluation: 'Verificar pago de aportes adicionales de pensión para actividades de alto riesgo.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 16,
    },
    {
        id: 'art16_6',
        code: '1.1.6',
        name: 'Conformación del COPASST',
        description: 'Debe estar conformado el COPASST con representantes del empleador y trabajadores.',
        evaluation: 'Verificar acta de conformación del COPASST con la participación paritaria.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 16,
    },
    {
        id: 'art16_7',
        code: '1.1.7',
        name: 'Capacitación del COPASST',
        description: 'Los integrantes del COPASST deben estar capacitados para cumplir sus funciones.',
        evaluation: 'Verificar registros de capacitación de los miembros del COPASST.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 16,
    },
    {
        id: 'art16_8',
        code: '1.1.8',
        name: 'Conformación del Comité de Convivencia',
        description: 'Debe estar conformado el Comité de Convivencia Laboral.',
        evaluation: 'Verificar acta de conformación y reuniones del Comité de Convivencia Laboral.',
        category: 'planear',
        subcategory: 'Recursos',
        points: 0.5,
        article: 16,
    },
    // 2. Capacitación en el SG-SST (6%)
    {
        id: 'art16_9',
        code: '1.2.1',
        name: 'Programa de capacitación en promoción y prevención',
        description: 'Debe existir un programa de capacitación anual en promoción y prevención.',
        evaluation: 'Verificar programa de capacitación documentado con temas, fechas, responsables y recursos.',
        category: 'planear',
        subcategory: 'Capacitación en el SG-SST',
        points: 2,
        article: 16,
    },
    {
        id: 'art16_10',
        code: '1.2.2',
        name: 'Capacitación, inducción y reinducción en SG-SST',
        description: 'Todos los trabajadores deben recibir inducción y reinducción en SST.',
        evaluation: 'Verificar registros de inducción y reinducción de todos los trabajadores.',
        category: 'planear',
        subcategory: 'Capacitación en el SG-SST',
        points: 2,
        article: 16,
    },
    {
        id: 'art16_11',
        code: '1.2.3',
        name: 'Responsables del SG-SST con curso virtual de 50 horas',
        description: 'Los responsables del SG-SST deben contar con el curso virtual de 50 horas.',
        evaluation: 'Verificar certificado del curso de 50 horas de los responsables del SG-SST.',
        category: 'planear',
        subcategory: 'Capacitación en el SG-SST',
        points: 2,
        article: 16,
    },
    // 3. Política de SST (1%)
    {
        id: 'art16_12',
        code: '2.1.1',
        name: 'Política del SG-SST firmada, fechada y comunicada',
        description: 'Debe existir una política de SST documentada, firmada y comunicada.',
        evaluation: 'Verificar política firmada por el representante legal, fechada, publicada y comunicada.',
        category: 'planear',
        subcategory: 'Política de SST',
        points: 1,
        article: 16,
    },
    // 4. Objetivos del SG-SST (1%)
    {
        id: 'art16_13',
        code: '2.2.1',
        name: 'Objetivos definidos, claros, medibles y cuantificables',
        description: 'Los objetivos del SG-SST deben ser definidos, claros, medibles y cuantificables.',
        evaluation: 'Verificar que los objetivos cumplan las características y estén alineados con las prioridades.',
        category: 'planear',
        subcategory: 'Objetivos de la política de SST',
        points: 1,
        article: 16,
    },
    // 5. Evaluación inicial del SG-SST (1%)
    {
        id: 'art16_14',
        code: '2.3.1',
        name: 'Evaluación inicial del SG-SST e identificación de prioridades',
        description: 'Debe realizarse una evaluación inicial del SG-SST.',
        evaluation: 'Verificar documento de evaluación inicial con identificación de prioridades.',
        category: 'planear',
        subcategory: 'Evaluación inicial del SG-SST',
        points: 1,
        article: 16,
    },
    // 6. Plan anual de trabajo (2%)
    {
        id: 'art16_15',
        code: '2.4.1',
        name: 'Plan de trabajo anual',
        description: 'Debe existir un plan de trabajo anual firmado por el empleador.',
        evaluation: 'Verificar plan de trabajo con metas, responsables, recursos, cronograma y firmado.',
        category: 'planear',
        subcategory: 'Plan anual de trabajo',
        points: 2,
        article: 16,
    },
    // 7. Conservación de documentación (2%)
    {
        id: 'art16_16',
        code: '2.5.1',
        name: 'Archivo y retención documental del SG-SST',
        description: 'Deben conservarse los documentos del SG-SST de forma ordenada.',
        evaluation: 'Verificar sistema de archivo y conservación de documentos del SG-SST.',
        category: 'planear',
        subcategory: 'Conservación de la documentación',
        points: 2,
        article: 16,
    },
    // 8. Rendición de cuentas (1%)
    {
        id: 'art16_17',
        code: '2.6.1',
        name: 'Rendición de cuentas sobre el desempeño',
        description: 'Debe existir rendición de cuentas anual sobre el desempeño del SG-SST.',
        evaluation: 'Verificar registros de rendición de cuentas de quienes tienen responsabilidades en SST.',
        category: 'planear',
        subcategory: 'Rendición de cuentas',
        points: 1,
        article: 16,
    },
    // 9. Normatividad vigente (2%)
    {
        id: 'art16_18',
        code: '2.7.1',
        name: 'Matriz legal actualizada',
        description: 'Debe existir una matriz legal actualizada con la normatividad aplicable.',
        evaluation: 'Verificar matriz legal actualizada con normas aplicables a la empresa.',
        category: 'planear',
        subcategory: 'Normatividad vigente',
        points: 2,
        article: 16,
    },
    // 10. Comunicación (1%)
    {
        id: 'art16_19',
        code: '2.8.1',
        name: 'Mecanismos de comunicación interna y externa',
        description: 'Deben existir mecanismos de comunicación sobre temas de SST.',
        evaluation: 'Verificar mecanismos de comunicación definidos y funcionando.',
        category: 'planear',
        subcategory: 'Comunicación',
        points: 1,
        article: 16,
    },
    // 11. Adquisiciones (1%)
    {
        id: 'art16_20',
        code: '2.9.1',
        name: 'Procedimiento de adquisiciones con criterios de SST',
        description: 'Debe existir un procedimiento que incluya criterios de SST para adquisiciones.',
        evaluation: 'Verificar procedimiento de adquisiciones que contemple aspectos de SST.',
        category: 'planear',
        subcategory: 'Adquisiciones',
        points: 1,
        article: 16,
    },
    // 12. Contratación (2%)
    {
        id: 'art16_21',
        code: '2.10.1',
        name: 'Evaluación y selección de contratistas y proveedores',
        description: 'Debe existir procedimiento de evaluación de contratistas en SST.',
        evaluation: 'Verificar procedimiento de evaluación de contratistas que incluya aspectos de SST.',
        category: 'planear',
        subcategory: 'Contratación',
        points: 2,
        article: 16,
    },
    // 13. Gestión del cambio (1%)
    {
        id: 'art16_22',
        code: '2.11.1',
        name: 'Evaluación del impacto de cambios internos y externos',
        description: 'Debe existir procedimiento para evaluar el impacto de cambios sobre SST.',
        evaluation: 'Verificar procedimiento de gestión del cambio documentado.',
        category: 'planear',
        subcategory: 'Gestión del cambio',
        points: 1,
        article: 16,
    },
    // II. HACER (60%)
    // Condiciones de salud (9%)
    {
        id: 'art16_23',
        code: '3.1.1',
        name: 'Evaluación médica ocupacional',
        description: 'Deben realizarse evaluaciones médicas ocupacionales según normatividad.',
        evaluation: 'Verificar programa de vigilancia epidemiológica y certificados médicos.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        points: 1,
        article: 16,
    },
    {
        id: 'art16_24',
        code: '3.1.2',
        name: 'Actividades de promoción y prevención en salud',
        description: 'Deben desarrollarse actividades de promoción y prevención.',
        evaluation: 'Verificar registros y evidencias de actividades de promoción y prevención.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        points: 1,
        article: 16,
    },
    {
        id: 'art16_25',
        code: '3.1.3',
        name: 'Información al médico de perfiles de cargo',
        description: 'Se debe informar al médico los perfiles de cargo para evaluaciones.',
        evaluation: 'Verificar que se remitan perfiles de cargo y factores de riesgo al médico.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        points: 1,
        article: 16,
    },
    {
        id: 'art16_26',
        code: '3.1.4',
        name: 'Realización de evaluaciones médicas',
        description: 'Deben realizarse evaluaciones médicas de ingreso, periódicas y retiro.',
        evaluation: 'Verificar certificados de evaluaciones médicas según profesiograma.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        points: 1,
        article: 16,
    },
    {
        id: 'art16_27',
        code: '3.1.5',
        name: 'Custodia de historias clínicas',
        description: 'Las historias clínicas ocupacionales deben estar custodiadas.',
        evaluation: 'Verificar documento que garantice la custodia de historias clínicas.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        points: 1,
        article: 16,
    },
    {
        id: 'art16_28',
        code: '3.1.6',
        name: 'Restricciones y recomendaciones médicas',
        description: 'Se deben cumplir las restricciones y recomendaciones médico laborales.',
        evaluation: 'Verificar seguimiento a recomendaciones y restricciones médicas.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        points: 1,
        article: 16,
    },
    {
        id: 'art16_29',
        code: '3.1.7',
        name: 'Estilos de vida y entornos de trabajo saludable',
        description: 'Se deben desarrollar programas de estilos de vida saludable.',
        evaluation: 'Verificar programa de estilos de vida saludable documentado y ejecutado.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        points: 1,
        article: 16,
    },
    {
        id: 'art16_30',
        code: '3.1.8',
        name: 'Agua potable, servicios sanitarios y disposición de basuras',
        description: 'Debe garantizarse agua potable, servicios sanitarios y manejo de basuras.',
        evaluation: 'Verificar condiciones de agua potable, servicios sanitarios y manejo de residuos.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        points: 1,
        article: 16,
    },
    {
        id: 'art16_31',
        code: '3.1.9',
        name: 'Eliminación adecuada de residuos',
        description: 'Debe existir manejo adecuado de residuos sólidos, líquidos y gaseosos.',
        evaluation: 'Verificar plan de manejo de residuos según normatividad ambiental.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        points: 1,
        article: 16,
    },
    // Registro y reporte de ATEL (5%)
    {
        id: 'art16_32',
        code: '3.2.1',
        name: 'Reporte de accidentes de trabajo a la ARL',
        description: 'Se deben reportar los accidentes de trabajo a la ARL.',
        evaluation: 'Verificar reportes de accidentes de trabajo dentro de los 2 días hábiles.',
        category: 'hacer',
        subcategory: 'Registro, reporte e investigación de ATEL',
        points: 2,
        article: 16,
    },
    {
        id: 'art16_33',
        code: '3.2.2',
        name: 'Investigación de accidentes, incidentes y enfermedades',
        description: 'Deben investigarse los accidentes, incidentes y enfermedades laborales.',
        evaluation: 'Verificar metodología e informes de investigación de ATEL.',
        category: 'hacer',
        subcategory: 'Registro, reporte e investigación de ATEL',
        points: 2,
        article: 16,
    },
    {
        id: 'art16_34',
        code: '3.2.3',
        name: 'Registro y análisis estadístico de ATEL',
        description: 'Debe llevarse registro estadístico de accidentes y enfermedades.',
        evaluation: 'Verificar indicadores de accidentalidad y análisis de tendencias.',
        category: 'hacer',
        subcategory: 'Registro, reporte e investigación de ATEL',
        points: 1,
        article: 16,
    },
    // Mecanismos de vigilancia (6%)
    {
        id: 'art16_35',
        code: '3.3.1',
        name: 'Medición de la severidad de los AT',
        description: 'Se debe medir la severidad de los accidentes de trabajo.',
        evaluation: 'Verificar cálculo del indicador de severidad de AT.',
        category: 'hacer',
        subcategory: 'Mecanismos de vigilancia de las condiciones de salud',
        points: 1,
        article: 16,
    },
    {
        id: 'art16_36',
        code: '3.3.2',
        name: 'Medición de la frecuencia de los AT',
        description: 'Se debe medir la frecuencia de los accidentes de trabajo.',
        evaluation: 'Verificar cálculo del indicador de frecuencia de AT.',
        category: 'hacer',
        subcategory: 'Mecanismos de vigilancia de las condiciones de salud',
        points: 1,
        article: 16,
    },
    {
        id: 'art16_37',
        code: '3.3.3',
        name: 'Medición de la mortalidad por AT',
        description: 'Se debe medir la mortalidad por accidentes de trabajo.',
        evaluation: 'Verificar cálculo del indicador de mortalidad por AT.',
        category: 'hacer',
        subcategory: 'Mecanismos de vigilancia de las condiciones de salud',
        points: 1,
        article: 16,
    },
    {
        id: 'art16_38',
        code: '3.3.4',
        name: 'Medición de la prevalencia de la EL',
        description: 'Se debe medir la prevalencia de enfermedad laboral.',
        evaluation: 'Verificar cálculo del indicador de prevalencia de EL.',
        category: 'hacer',
        subcategory: 'Mecanismos de vigilancia de las condiciones de salud',
        points: 1,
        article: 16,
    },
    {
        id: 'art16_39',
        code: '3.3.5',
        name: 'Medición de la incidencia de la EL',
        description: 'Se debe medir la incidencia de enfermedad laboral.',
        evaluation: 'Verificar cálculo del indicador de incidencia de EL.',
        category: 'hacer',
        subcategory: 'Mecanismos de vigilancia de las condiciones de salud',
        points: 1,
        article: 16,
    },
    {
        id: 'art16_40',
        code: '3.3.6',
        name: 'Medición del ausentismo por causa médica',
        description: 'Se debe medir el ausentismo por incapacidad médica.',
        evaluation: 'Verificar cálculo del indicador de ausentismo.',
        category: 'hacer',
        subcategory: 'Mecanismos de vigilancia de las condiciones de salud',
        points: 1,
        article: 16,
    },
    // Identificación de peligros (15%)
    {
        id: 'art16_41',
        code: '4.1.1',
        name: 'Metodología para identificación de peligros y evaluación de riesgos',
        description: 'Debe existir metodología para identificar peligros y evaluar riesgos.',
        evaluation: 'Verificar metodología documentada y matriz de peligros y riesgos.',
        category: 'hacer',
        subcategory: 'Identificación de peligros',
        points: 4,
        article: 16,
    },
    {
        id: 'art16_42',
        code: '4.1.2',
        name: 'Identificación de peligros con participación de trabajadores',
        description: 'Los trabajadores deben participar en la identificación de peligros.',
        evaluation: 'Verificar registros de participación de trabajadores en identificación de peligros.',
        category: 'hacer',
        subcategory: 'Identificación de peligros',
        points: 4,
        article: 16,
    },
    {
        id: 'art16_43',
        code: '4.1.3',
        name: 'Identificación y priorización de la naturaleza de los peligros',
        description: 'Se deben identificar y priorizar los peligros químicos, físicos, biológicos, etc.',
        evaluation: 'Verificar que la matriz incluya todos los tipos de peligros priorizados.',
        category: 'hacer',
        subcategory: 'Identificación de peligros',
        points: 3,
        article: 16,
    },
    {
        id: 'art16_44',
        code: '4.1.4',
        name: 'Realización de mediciones ambientales',
        description: 'Deben realizarse mediciones ambientales cuando se requiera.',
        evaluation: 'Verificar informes de mediciones ambientales y su análisis.',
        category: 'hacer',
        subcategory: 'Identificación de peligros',
        points: 4,
        article: 16,
    },
    // Medidas de prevención y control (15%)
    {
        id: 'art16_45',
        code: '4.2.1',
        name: 'Implementación de medidas de prevención y control',
        description: 'Se deben implementar medidas de prevención y control según jerarquía.',
        evaluation: 'Verificar implementación de medidas según jerarquía de controles.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        points: 2.5,
        article: 16,
    },
    {
        id: 'art16_46',
        code: '4.2.2',
        name: 'Procedimientos, instructivos y fichas técnicas',
        description: 'Deben existir procedimientos e instructivos para trabajos de alto riesgo.',
        evaluation: 'Verificar procedimientos de trabajo seguro para tareas críticas.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        points: 2.5,
        article: 16,
    },
    {
        id: 'art16_47',
        code: '4.2.3',
        name: 'Inspecciones de seguridad',
        description: 'Deben realizarse inspecciones sistemáticas de seguridad.',
        evaluation: 'Verificar programa de inspecciones, formatos y registros.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        points: 2.5,
        article: 16,
    },
    {
        id: 'art16_48',
        code: '4.2.4',
        name: 'Mantenimiento periódico de instalaciones y equipos',
        description: 'Debe existir programa de mantenimiento de instalaciones y equipos.',
        evaluation: 'Verificar programa y registros de mantenimiento preventivo y correctivo.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        points: 2.5,
        article: 16,
    },
    {
        id: 'art16_49',
        code: '4.2.5',
        name: 'Entrega de EPP y capacitación en uso',
        description: 'Se deben entregar EPP y capacitar en su uso.',
        evaluation: 'Verificar matriz de EPP, registros de entrega y capacitación.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        points: 2.5,
        article: 16,
    },
    {
        id: 'art16_50',
        code: '4.2.6',
        name: 'Plan de prevención y preparación ante emergencias',
        description: 'Debe existir plan de emergencias documentado.',
        evaluation: 'Verificar plan de emergencias, brigadas y simulacros.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        points: 2.5,
        article: 16,
    },
    // III. VERIFICAR (5%)
    {
        id: 'art16_51',
        code: '5.1.1',
        name: 'Indicadores de estructura, proceso y resultado',
        description: 'Se deben definir indicadores para evaluar el SG-SST.',
        evaluation: 'Verificar fichas técnicas de indicadores y su medición.',
        category: 'verificar',
        subcategory: 'Gestión y resultados del SG-SST',
        points: 1.25,
        article: 16,
    },
    {
        id: 'art16_52',
        code: '5.1.2',
        name: 'Auditoría anual',
        description: 'Debe realizarse auditoría anual del SG-SST.',
        evaluation: 'Verificar programa de auditoría, informe y plan de mejora.',
        category: 'verificar',
        subcategory: 'Gestión y resultados del SG-SST',
        points: 1.25,
        article: 16,
    },
    {
        id: 'art16_53',
        code: '5.1.3',
        name: 'Revisión por la alta dirección',
        description: 'La alta dirección debe revisar el SG-SST al menos una vez al año.',
        evaluation: 'Verificar acta de revisión por la dirección con decisiones tomadas.',
        category: 'verificar',
        subcategory: 'Gestión y resultados del SG-SST',
        points: 1.25,
        article: 16,
    },
    {
        id: 'art16_54',
        code: '5.1.4',
        name: 'Planificación de auditoría con el COPASST',
        description: 'La auditoría debe planificarse con participación del COPASST.',
        evaluation: 'Verificar participación del COPASST en la planificación de auditoría.',
        category: 'verificar',
        subcategory: 'Gestión y resultados del SG-SST',
        points: 1.25,
        article: 16,
    },
    // IV. ACTUAR (10%)
    {
        id: 'art16_55',
        code: '6.1.1',
        name: 'Acciones preventivas y correctivas con base en resultados',
        description: 'Se deben definir acciones preventivas y correctivas.',
        evaluation: 'Verificar plan de acciones correctivas, preventivas y de mejora.',
        category: 'actuar',
        subcategory: 'Acciones preventivas y correctivas',
        points: 2.5,
        article: 16,
    },
    {
        id: 'art16_56',
        code: '6.1.2',
        name: 'Acciones de mejora según revisión de la alta dirección',
        description: 'Se deben implementar acciones de mejora de la revisión por la dirección.',
        evaluation: 'Verificar seguimiento a acciones derivadas de la revisión por dirección.',
        category: 'actuar',
        subcategory: 'Acciones preventivas y correctivas',
        points: 2.5,
        article: 16,
    },
    {
        id: 'art16_57',
        code: '6.1.3',
        name: 'Acciones de mejora basadas en investigaciones de ATEL',
        description: 'Se deben implementar acciones de las investigaciones de ATEL.',
        evaluation: 'Verificar seguimiento a recomendaciones de investigaciones de ATEL.',
        category: 'actuar',
        subcategory: 'Acciones preventivas y correctivas',
        points: 2.5,
        article: 16,
    },
    {
        id: 'art16_58',
        code: '6.1.4',
        name: 'Plan de mejoramiento continuo',
        description: 'Debe existir un plan de mejoramiento continuo del SG-SST.',
        evaluation: 'Verificar plan de mejoramiento basado en evaluación de estándares.',
        category: 'actuar',
        subcategory: 'Acciones preventivas y correctivas',
        points: 2.5,
        article: 16,
    },
];

/**
 * Get applicable checklist based on company size and risk level
 */
export function getApplicableChecklist(size: CompanySize, riskLevel: RiskLevel): ChecklistItem[] {
    const article = getApplicableArticle(size, riskLevel);

    switch (article) {
        case 3:
            return ARTICLE_3_STANDARDS;
        case 9:
            return ARTICLE_9_STANDARDS;
        case 16:
        default:
            return ARTICLE_16_STANDARDS;
    }
}

/**
 * Calculate total possible points for a checklist
 */
export function getTotalPoints(items: ChecklistItem[]): number {
    return items.reduce((sum, item) => sum + item.points, 0);
}

/**
 * Calculate compliance score based on status
 */
export function calculateScore(items: ChecklistItem[], statuses: ComplianceStatus[]): number {
    let score = 0;

    for (const item of items) {
        const status = statuses.find(s => s.itemId === item.id);
        if (status) {
            switch (status.status) {
                case 'cumple':
                    score += item.points;
                    break;
                case 'parcial':
                    score += item.points * 0.5;
                    break;
                // 'no_cumple', 'no_aplica', 'pendiente' = 0
            }
        }
    }

    return score;
}

/**
 * Get compliance level based on score percentage
 */
export function getComplianceLevel(score: number, total: number): {
    level: 'crítico' | 'bajo' | 'moderado' | 'aceptable';
    color: string;
    description: string;
} {
    const percentage = (score / total) * 100;

    if (percentage < 60) {
        return {
            level: 'crítico',
            color: 'red',
            description: 'Estado crítico. Requiere plan de mejoramiento inmediato.',
        };
    } else if (percentage < 85) {
        return {
            level: 'moderado',
            color: 'yellow',
            description: 'Moderadamente aceptable. Requiere plan de mejoramiento.',
        };
    } else if (percentage < 100) {
        return {
            level: 'aceptable',
            color: 'green',
            description: 'Aceptable. Mantener la calificación y evidencias.',
        };
    }

    return {
        level: 'aceptable',
        color: 'green',
        description: 'Cumplimiento total de estándares.',
    };
}
