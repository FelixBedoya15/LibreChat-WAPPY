
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
    // --- ESTÁNDAR 1: RECURSOS (PLANEAR) ---
    {
        id: 'std_1_1',
        code: '1.1.1',
        name: 'Responsable del SG-SST',
        description: 'Designación del responsable del SG-SST.',
        evaluation: '¿Documento de designación, licencia y curso de 50h vigentes?',
        category: 'planear',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.1'
    },
    {
        id: 'std_1_2',
        code: '1.1.2',
        name: 'Responsabilidades',
        description: 'Asignación de responsabilidades en SST.',
        evaluation: '¿Responsabilidades definidas y comunicadas a todos los niveles?',
        category: 'planear',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.2'
    },
    {
        id: 'std_1_3',
        code: '1.1.3',
        name: 'Afiliación a Seguridad Social',
        description: 'Afiliación a EPS, AFP, y ARL.',
        evaluation: '¿Todos los trabajadores afiliados según riesgo?',
        category: 'hacer',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.3'
    },
    {
        id: 'std_1_4',
        code: '1.1.4',
        name: 'Pago de Aportes',
        description: 'Pago de aportes a seguridad social.',
        evaluation: '¿Pago oportuno de aportes (Planilla PILA)?',
        category: 'hacer',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.4'
    },
    {
        id: 'std_1_5',
        code: '1.1.5',
        name: 'Pago de Prestaciones',
        description: 'Pago de incapacidades.',
        evaluation: '¿Reconocimiento y pago de prestaciones económicas?',
        category: 'hacer',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.5'
    },
    {
        id: 'std_1_6',
        code: '1.1.6',
        name: 'Conformación COPASST',
        description: 'Comité Paritario de Seguridad y Salud en el Trabajo.',
        evaluation: '¿Acta de conformación vigente y paritaria?',
        category: 'planear',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.6'
    },
    {
        id: 'std_1_7',
        code: '1.1.7',
        name: 'Capacitación COPASST',
        description: 'Capacitación a miembros del COPASST.',
        evaluation: '¿Evidencia de capacitación a los miembros?',
        category: 'hacer',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.7'
    },
    {
        id: 'std_1_8',
        code: '1.1.8',
        name: 'Conformación Comité Convivencia',
        description: 'Comité de Convivencia Laboral (Acoso Laboral).',
        evaluation: '¿Acta de conformación y reuniones trimestrales?',
        category: 'planear',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.8 | Res 652/12'
    },
    {
        id: 'std_ley_2365', // ADICIONAL OBLIGATORIO - LEY 2365
        code: '1.1.8 (Adicional)',
        name: 'Prevención Acoso Sexual (Ley 2365)',
        description: 'Medidas de prevención del acoso sexual laboral (Ley 2365 de 2024).',
        evaluation: '¿El Comité de Convivencia tiene protocolos específicos para acoso sexual? ¿Se divulga la Ley 2365?',
        category: 'planear',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Ley 2365 de 2024'
    },
    {
        id: 'std_1_9',
        code: '1.2.1',
        name: 'Programa de Capacitación',
        description: 'Programa de capacitación anual.',
        evaluation: '¿Programa documentado y ejecutado?',
        category: 'planear',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.2.1'
    },
    {
        id: 'std_1_10',
        code: '1.2.2',
        name: 'Inducción y Reinducción',
        description: 'Inducción y reinducción en SST.',
        evaluation: '¿Registros de inducción a todos los trabajadores?',
        category: 'hacer',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.2.2'
    },
    {
        id: 'std_1_11',
        code: '1.2.3',
        name: 'Curso Virtual 50 Horas',
        description: 'Responsable con curso de 50 horas.',
        evaluation: '¿Certificado vigente del responsable?',
        category: 'verificar',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.2.3'
    },

    // --- ESTÁNDAR 2: GESTIÓN INTEGRAL (PLANEAR) ---
    {
        id: 'std_2_1',
        code: '2.1.1',
        name: 'Política SST',
        description: 'Política escrita y divulgada.',
        evaluation: '¿Política firmada y fechada hace menos de un año?',
        category: 'planear',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.1.1'
    },
    {
        id: 'std_ley_2191', // ADICIONAL OBLIGATORIO - DESCONEXIÓN
        code: '2.1.1 (Adicional)',
        name: 'Política de Desconexión Laboral',
        description: 'Política y regulación de la desconexión laboral.',
        evaluation: '¿Existe política de desconexión laboral aprobada y divulgada?',
        category: 'planear',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Ley 2191 de 2022'
    },
    {
        id: 'std_ley_2101', // ADICIONAL OBLIGATORIO - JORNADA
        code: '2.1.1 (Adicional II)',
        name: 'Reducción Jornada Laboral',
        description: 'Implementación gradual de la reducción de jornada.',
        evaluation: '¿Se está aplicando la reducción de jornada laboral según Ley 2101?',
        category: 'hacer',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Ley 2101 de 2021'
    },
    {
        id: 'std_2_2',
        code: '2.2.1',
        name: 'Objetivos SST',
        description: 'Objetivos definidos y medibles.',
        evaluation: '¿Objetivos con metas e indicadores claros?',
        category: 'planear',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.2.1'
    },
    {
        id: 'std_2_3',
        code: '2.3.1',
        name: 'Evaluación Inicial',
        description: 'Evaluación inicial del SG-SST.',
        evaluation: '¿Evaluación realizada anualmente?',
        category: 'planear',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.3.1'
    },
    {
        id: 'std_2_4',
        code: '2.4.1',
        name: 'Plan de Trabajo Anual',
        description: 'Plan de trabajo anual.',
        evaluation: '¿Plan firmado y con cumplimiento de cronograma?',
        category: 'planear',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.4.1'
    },
    {
        id: 'std_2_5',
        code: '2.5.1',
        name: 'Archivo y Retención',
        description: 'Sistema de archivo.',
        evaluation: '¿Archivo organizado y custodia de 20 años?',
        category: 'hacer',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.5.1'
    },
    {
        id: 'std_2_6',
        code: '2.6.1',
        name: 'Rendición de Cuentas',
        description: 'Rendición de cuentas anual.',
        evaluation: '¿Actas de rendición de cuentas de todos los niveles?',
        category: 'verificar',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.6.1'
    },
    {
        id: 'std_2_7',
        code: '2.7.1',
        name: 'Matriz Legal',
        description: 'Matriz de requisitos legales.',
        evaluation: '¿Matriz legal actualizada a normas 2024-2025?',
        category: 'planear',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.7.1'
    },
    {
        id: 'std_2_8',
        code: '2.8.1',
        name: 'Mecanismos de Comunicación',
        description: 'Comunicación interna y externa.',
        evaluation: '¿Evidencia de comunicaciones eficaces?',
        category: 'hacer',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.8.1'
    },
    {
        id: 'std_2_9',
        code: '2.9.1',
        name: 'Adquisiciones',
        description: 'SST en compras y adquisiciones.',
        evaluation: '¿Requisitos de SST en compras?',
        category: 'planear',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.9.1'
    },
    {
        id: 'std_2_10',
        code: '2.10.1',
        name: 'Contratista y Proveedores',
        description: 'Evaluación de proveedores.',
        evaluation: '¿Evaluación y selección de proveedores con criterios SST?',
        category: 'hacer',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.10.1'
    },
    {
        id: 'std_2_11',
        code: '2.11.1',
        name: 'Gestión del Cambio',
        description: 'Procedimiento de gestión del cambio.',
        evaluation: '¿Evaluación de impacto de cambios internos/externos?',
        category: 'hacer',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.11.1'
    },

    // --- ESTÁNDAR 3: GESTIÓN DE LA SALUD (HACER) ---
    {
        id: 'std_3_1',
        code: '3.1.1',
        name: 'Perfil Sociodemográfico',
        description: 'Diagnóstico de condiciones de salud.',
        evaluation: '¿Perfil actualizado con diagnóstico de salud?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.1'
    },
    {
        id: 'std_res_2764', // ADICIONAL OBLIGATORIO - PSICOSOCIAL
        code: '3.1.1 (Adicional)',
        name: 'Batería Riesgo Psicosocial',
        description: 'Aplicación de batería de riesgo psicosocial (Res 2764).',
        evaluation: '¿Batería aplicada en los últimos 1 o 2 años según riesgo? ¿Informe y plan de intervención?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 2764 de 2022'
    },
    {
        id: 'std_3_2',
        code: '3.1.2',
        name: 'Actividades P&P',
        description: 'Medicina preventiva y del trabajo.',
        evaluation: '¿Actividades de promoción y prevención ejecutadas?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.2'
    },
    {
        id: 'std_3_3',
        code: '3.1.3',
        name: 'Exámenes Médicos',
        description: 'Evaluaciones médicas ocupacionales.',
        evaluation: '¿Conceptos de aptitud (ingreso/periódicos/retiro)?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.3'
    },
    {
        id: 'std_3_4',
        code: '3.1.4',
        name: 'Custodia Historias Clínicas',
        description: 'Custodia por IPS.',
        evaluation: '¿Certificado de custodia de HC por la IPS?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.4'
    },
    {
        id: 'std_3_5',
        code: '3.1.5',
        name: 'Restricciones Médicas',
        description: 'Seguimiento a restricciones.',
        evaluation: '¿Seguimiento a recomendaciones médico laborales?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.5'
    },
    {
        id: 'std_3_6',
        code: '3.1.6',
        name: 'Estilos de Vida',
        description: 'Estilos de vida y entorno saludable.',
        evaluation: '¿Programa de estilos de vida saludable?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.6'
    },
    {
        id: 'std_3_7',
        code: '3.1.7',
        name: 'Servicios de Higiene',
        description: 'Agua potable y servicios sanitarios.',
        evaluation: '¿Disponibilidad de agua y baños?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.7'
    },
    {
        id: 'std_3_8',
        code: '3.1.8',
        name: 'Manejo de Residuos',
        description: 'Manejo de residuos.',
        evaluation: '¿Disposición adecuada de residuos sólidos/peligrosos?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.8'
    },
    {
        id: 'std_3_9',
        code: '3.1.9',
        name: 'Reporte ATEL',
        description: 'Reporte de Accidentes y Enfermedades.',
        evaluation: '¿Reporte a tiempo (2 días) a ARL/EPS?',
        category: 'actuar',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.2.1'
    },
    {
        id: 'std_3_10',
        code: '3.2.2',
        name: 'Investigación Incidentes/AT',
        description: 'Investigación de eventos.',
        evaluation: '¿Investigaciones realizadas con equipo investigador completo?',
        category: 'actuar',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.2.2'
    },
    {
        id: 'std_3_11',
        code: '3.2.3',
        name: 'Registro Estadístico',
        description: 'Estadísticas de accidentalidad.',
        evaluation: '¿Registro y análisis de estadísticas ATEL?',
        category: 'verificar',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.2.3'
    },

    // --- ESTÁNDAR 4: GESTIÓN DE PELIGROS (HACER/PLANEAR) ---
    {
        id: 'std_4_1',
        code: '4.1.1',
        name: 'Metodología Peligros',
        description: 'Metodología de identificación.',
        evaluation: '¿Documento de metodología de identificación de peligros?',
        category: 'planear',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.1.1'
    },
    {
        id: 'std_4_2',
        code: '4.1.2',
        name: 'Matriz de Peligros',
        description: 'Identificación y valoración.',
        evaluation: '¿Matriz de peligros actualizada (anual)?',
        category: 'planear',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.1.2'
    },
    {
        id: 'std_4_3',
        code: '4.1.3',
        name: 'Medidas de Control',
        description: 'Definición de controles.',
        evaluation: '¿Controles definidos para peligros prioritarios?',
        category: 'hacer',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.1.3'
    },
    {
        id: 'std_4_4',
        code: '4.1.4',
        name: 'Mediciones Ambientales',
        description: 'Evaluaciones higiénicas.',
        evaluation: '¿Mediciones realizadas si aplican (ruido, luz, químicos)?',
        category: 'verificar',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.1.4'
    },
    {
        id: 'std_ley_2050', // ADICIONAL OBLIGATORIO - PESV
        code: '4.1.4 (Adicional)',
        name: 'Plan Estratégico Seguridad Vial (PESV)',
        description: 'Gestión del riesgo vial (Ley 2050).',
        evaluation: '¿Diseño e implementación del PESV si la empresa tiene >10 vehículos o conductores?',
        category: 'planear',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Ley 2050 de 2020'
    },
    {
        id: 'std_4_5',
        code: '4.2.1',
        name: 'Ejecución Medidas Control',
        description: 'Implementación de controles.',
        evaluation: '¿Evidencia de ejecución de las medidas de control?',
        category: 'hacer',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.2.1'
    },
    {
        id: 'std_4_6',
        code: '4.2.2',
        name: 'Procedimientos SST',
        description: 'Procedimientos de trabajo seguro.',
        evaluation: '¿Procedimientos/Instructivos para tareas críticas?',
        category: 'hacer',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.2.2'
    },
    {
        id: 'std_4_7',
        code: '4.2.3',
        name: 'Inspecciones',
        description: 'Inspecciones de seguridad.',
        evaluation: '¿Inspecciones preoperacionales y de seguridad ejecutadas?',
        category: 'hacer',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.2.3'
    },
    {
        id: 'std_4_8',
        code: '4.2.4',
        name: 'Mantenimiento',
        description: 'Mantenimiento de equipos.',
        evaluation: '¿Plan de mantenimiento preventivo y correctivo ejecutado?',
        category: 'hacer',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.2.4'
    },
    {
        id: 'std_4_9',
        code: '4.2.5',
        name: 'Entrega EPP',
        description: 'Elementos de Protección Personal.',
        evaluation: '¿Registros de entrega de EPP adecuados?',
        category: 'hacer',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.2.5'
    },

    // --- ESTÁNDAR 5: AMENAZAS (PLANEAR/HACER) ---
    {
        id: 'std_5_1',
        code: '5.1.1',
        name: 'Plan de Emergencias',
        description: 'Prevención y respuesta ante emergencias.',
        evaluation: '¿Plan de emergencias con análisis de vulnerabilidad?',
        category: 'planear',
        subcategory: 'V. AMENAZAS (10%)',
        criteria: 'Res 0312: E5.1.1'
    },
    {
        id: 'std_5_2',
        code: '5.1.2',
        name: 'Brigada de Emergencia',
        description: 'Conformación y capacitación.',
        evaluation: '¿Brigada conformada, capacitada y dotada?',
        category: 'hacer',
        subcategory: 'V. AMENAZAS (10%)',
        criteria: 'Res 0312: E5.1.2'
    },

    // --- ESTÁNDAR 6: VERIFICACIÓN ---
    {
        id: 'std_6_1',
        code: '6.1.1',
        name: 'Indicadores SG-SST',
        description: 'Medición de indicadores.',
        evaluation: '¿Ficha técnica y medición de indicadores según Art 30?',
        category: 'verificar',
        subcategory: 'VI. VERIFICACIÓN (5%)',
        criteria: 'Res 0312: E6.1.1'
    },
    {
        id: 'std_6_2',
        code: '6.1.2',
        name: 'Auditoría Interna',
        description: 'Auditoría anual.',
        evaluation: '¿Auditoría interna realizada al SG-SST?',
        category: 'verificar',
        subcategory: 'VI. VERIFICACIÓN (5%)',
        criteria: 'Res 0312: E6.1.2'
    },
    {
        id: 'std_6_3',
        code: '6.1.3',
        name: 'Revisión Gerencial',
        description: 'Revisión por la alta dirección.',
        evaluation: '¿Revisión gerencial anual con acta?',
        category: 'verificar',
        subcategory: 'VI. VERIFICACIÓN (5%)',
        criteria: 'Res 0312: E6.1.3'
    },
    {
        id: 'std_6_4',
        code: '6.1.4',
        name: 'Auditoría COPASST',
        description: 'Participación COPASST.',
        evaluation: '¿COPASST participó en la planificación de la auditoría?',
        category: 'planear',
        subcategory: 'VI. VERIFICACIÓN (5%)',
        criteria: 'Res 0312: E6.1.4'
    },

    // --- ESTÁNDAR 7: MEJORAMIENTO ---
    {
        id: 'std_7_1',
        code: '7.1.1',
        name: 'Acciones Preventivas/Correctivas',
        description: 'Gestión de no conformidades.',
        evaluation: '¿Acciones cerradas eficazmente?',
        category: 'actuar',
        subcategory: 'VII. MEJORAMIENTO (10%)',
        criteria: 'Res 0312: E7.1.1'
    },
    {
        id: 'std_7_2',
        code: '7.1.2',
        name: 'Acciones de Mejora',
        description: 'Mejora continua.',
        evaluation: '¿Acciones de mejora proactivas implementadas?',
        category: 'actuar',
        subcategory: 'VII. MEJORAMIENTO (10%)',
        criteria: 'Res 0312: E7.1.2'
    },
    {
        id: 'std_7_3',
        code: '7.1.3',
        name: 'Plan de Mejoramiento',
        description: 'Plan por autoevaluación.',
        evaluation: '¿Plan de mejoramiento reportado a ARL y MinTrabajo?',
        category: 'actuar',
        subcategory: 'VII. MEJORAMIENTO (10%)',
        criteria: 'Res 0312: E7.1.3'
    },
    {
        id: 'std_7_4',
        code: '7.1.4',
        name: 'Seguimiento Mejoras',
        description: 'Seguimiento al plan.',
        evaluation: '¿Seguimiento semestral al cumplimiento del plan?',
        category: 'actuar',
        subcategory: 'VII. MEJORAMIENTO (10%)',
        criteria: 'Res 0312: E7.1.4'
    }
];
