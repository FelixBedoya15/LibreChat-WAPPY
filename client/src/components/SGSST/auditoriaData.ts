
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
    // --- I. PLANEAR (PLANIFICACIÓN) ---
    // 1. Contexto de la Organización
    {
        id: 'aud_p_context_1',
        code: '4.1',
        name: 'Comprensión de la Organización y su Contexto',
        description: 'Determinar cuestiones externas e internas pertinentes para el propósito y dirección estratégica que afectan la capacidad del SG-SST.',
        evaluation: '¿Se han determinado las cuestiones internas y externas (DOFA/PESTEL) que afectan al SG-SST? ¿Existe un análisis de contexto actualizado?',
        category: 'planear',
        subcategory: '1. Contexto',
        criteria: 'ISO 45001: 4.1'
    },
    {
        id: 'aud_p_context_2',
        code: '4.2',
        name: 'Necesidades y Expectativas de Partes Interesadas',
        description: 'Determinar las partes interesadas (trabajadores, clientes, autoridades) y sus requisitos pertinentes.',
        evaluation: '¿Se han identificado las partes interesadas y sus necesidades? ¿Se hace seguimiento a estos requisitos?',
        category: 'planear',
        subcategory: '1. Contexto',
        criteria: 'ISO 45001: 4.2'
    },
    {
        id: 'aud_p_context_3',
        code: '4.3',
        name: 'Alcance del SG-SST',
        description: 'Determinar los límites y la aplicabilidad del SG-SST.',
        evaluation: '¿El alcance está documentado? ¿Incluye todas las sedes y centros de trabajo? ¿Considera actividades bajo control o influencia?',
        category: 'planear',
        subcategory: '1. Contexto',
        criteria: 'ISO 45001: 4.3 / Dec 1072 Art 2.2.4.6.4'
    },

    // 2. Liderazgo y Participación
    {
        id: 'aud_p_lid_1',
        code: '5.1',
        name: 'Liderazgo y Compromiso',
        description: 'La alta dirección debe demostrar liderazgo y compromiso con respecto al SG-SST.',
        evaluation: '¿La gerencia rinde cuentas sobre el SG-SST? ¿Participa en las revisiones gerenciales? ¿Asigna recursos financierons suficientes?',
        category: 'planear',
        subcategory: '2. Liderazgo',
        criteria: 'ISO 45001: 5.1 / Dec 1072 Art 2.2.4.6.8'
    },
    {
        id: 'aud_p_lid_2',
        code: '5.2',
        name: 'Política de SST',
        description: 'Establecer, implementar y mantener una política de SST.',
        evaluation: '¿La política está firmada y fechada (menos de 1 año)? ¿Incluye compromiso de prevención de lesiones y enfermedades? ¿Es específica para la empresa?',
        category: 'planear',
        subcategory: '2. Liderazgo',
        criteria: 'ISO 45001: 5.2 / Dec 1072 Art 2.2.4.6.5-7'
    },
    {
        id: 'aud_p_lid_3',
        code: '5.2.b',
        name: 'Divulgación de la Política',
        description: 'La política debe ser comunicada dentro de la organización.',
        evaluation: '¿La política está publicada visiblemente? ¿Los trabajadores la conocen y entienden? ¿Se evidencia su divulgación en inducciones?',
        category: 'planear',
        subcategory: '2. Liderazgo',
        criteria: 'Dec 1072 Art 2.2.4.6.6'
    },
    {
        id: 'aud_p_roles_1',
        code: '5.3',
        name: 'Roles y Responsabilidades',
        description: 'Asignación de responsabilidades y autoridades en SST a todos los niveles.',
        evaluation: '¿Están definidos los roles y responsabilidades en SST en los perfiles de cargo? ¿Han sido comunicados y aceptados por escrito por los trabajadores?',
        category: 'planear',
        subcategory: '2. Roles y Resp.',
        criteria: 'ISO 45001: 5.3 / Dec 1072 Art 2.2.4.6.8 (2)'
    },
    {
        id: 'aud_p_roles_2',
        code: 'Res 0312',
        name: 'Responsable del SG-SST',
        description: 'Designación de una persona responsable del SG-SST.',
        evaluation: '¿Existe carta de designación del responsable del SG-SST? ¿Tiene la licencia vigente y el curso de 50 horas actualizado?',
        category: 'planear',
        subcategory: '2. Roles y Resp.',
        criteria: 'Res 0312 Art 4-10'
    },
    {
        id: 'aud_p_part_1',
        code: '5.4',
        name: 'Consulta y Participación (COPASST)',
        description: 'Conformación y funcionamiento del COPASST o Vigía.',
        evaluation: '¿El COPASST/Vigía está conformado legalmente (votos, actas)? ¿Se reúne mensualmente? ¿Tine actas de reunión al día?',
        category: 'planear',
        subcategory: '2. Participación',
        criteria: 'Dec 1072 Art 2.2.4.6.12 (9) / Res 2013 de 1986'
    },
    {
        id: 'aud_p_part_2',
        code: 'Ley 1010',
        name: 'Comité de Convivencia Laboral',
        description: 'Funcionamiento del Comité de Convivencia para prevención de acoso laboral.',
        evaluation: '¿Está conformado el Comité de Convivencia? ¿Se reúne trimestralmente? ¿Gestiona quejas de acoso laboral?',
        category: 'planear',
        subcategory: '2. Participación',
        criteria: 'Ley 1010 de 2006 / Res 652 de 2012'
    },

    // 3. Planificación
    {
        id: 'aud_p_ippvr_1',
        code: '6.1.2.1',
        name: 'Matriz de Identificación de Peligros (GTC 45)',
        description: 'Metodología para identificación de peligros, evaluación y valoración de riesgos.',
        evaluation: '¿Existe una matriz de peligros actualizada (último año o tras cambios)? ¿Cubre todos los procesos, turnos y tipos de actividades (rutinarias y no rutinarias)?',
        category: 'planear',
        subcategory: '3. Riesgos',
        criteria: 'ISO 45001: 6.1.2 / Dec 1072 Art 2.2.4.6.15'
    },
    {
        id: 'aud_p_ippvr_2',
        code: '6.1.2.2',
        name: 'Valoración de Riesgos y Controles',
        description: 'Evaluación de riesgos y determinación de controles.',
        evaluation: '¿Se han valorado los riesgos (ej. Alto, Medio, Bajo)? ¿Se han definido controles para los riesgos no aceptables? ¿Se aplica jerarquía de controles?',
        category: 'planear',
        subcategory: '3. Riesgos',
        criteria: 'ISO 45001: 6.1.2 / Dec 1072 Art 2.2.4.6.24'
    },
    {
        id: 'aud_p_req_1',
        code: '6.1.3',
        name: 'Matriz Legal',
        description: 'Determinación de requisitos legales y otros requisitos.',
        evaluation: '¿Existe una matriz de requisitos legales actualizada? ¿Incluye normas recientes (ej. Res 0312, Circulares)? ¿Hay evidencia de evaluación de cumplimiento de cada norma?',
        category: 'planear',
        subcategory: '3. Requisitos Legales',
        criteria: 'ISO 45001: 6.1.3 / Dec 1072 Art 2.2.4.6.8 (5)'
    },
    {
        id: 'aud_p_obj_1',
        code: '6.2.1',
        name: 'Objetivos de SST',
        description: 'Establecimiento de objetivos medibles y coherentes.',
        evaluation: '¿Están definidos los objetivos del SST firmados? ¿Son claros, medibles y tienen metas definidas? ¿Son coherentes con la política?',
        category: 'planear',
        subcategory: '3. Planificación',
        criteria: 'ISO 45001: 6.2.1 / Dec 1072 Art 2.2.4.6.18'
    },
    {
        id: 'aud_p_obj_2',
        code: '6.2.2',
        name: 'Indicadores de Gestión',
        description: 'Definición de indicadores para evaluar el SG-SST.',
        evaluation: '¿Se han definido fichas técnicas para los indicadores? ¿Cubren estructura, proceso y resultado? ¿Tienen línea base y meta?',
        category: 'planear',
        subcategory: '3. Planificación',
        criteria: 'ISO 45001: 9.1.1 / Dec 1072 Art 2.2.4.6.20-22'
    },
    {
        id: 'aud_p_plan_1',
        code: '6.2.2',
        name: 'Plan de Trabajo Anual',
        description: 'Planificación de actividades para el año vigente.',
        evaluation: '¿Existe un Plan de Trabajo Anual firmado por gerencia y responsable SG-SST? ¿Incluye objetivos, metas, actividades, responsables, recursos y cronograma?',
        category: 'planear',
        subcategory: '3. Planificación',
        criteria: 'Dec 1072 Art 2.2.4.6.17'
    },

    // --- II. HACER (APOYO Y OPERACIÓN) ---
    // 4. Apoyo
    {
        id: 'aud_h_rec_1',
        code: '7.1',
        name: 'Presupuesto y Recursos',
        description: 'Asignación de recursos financieros, técnicos y humanos.',
        evaluation: '¿Existe un presupuesto asignado para SST? ¿Se evidencia la ejecución del presupuesto? ¿Hay recursos adecuados para las actividades planeadas?',
        category: 'hacer',
        subcategory: '4. Recursos',
        criteria: 'ISO 45001: 7.1 / Dec 1072 Art 2.2.4.6.8 (4)'
    },
    {
        id: 'aud_h_comp_1',
        code: '7.2',
        name: 'Perfiles de Cargo y Competencia',
        description: 'Definición de requisitos de competencia en SST.',
        evaluation: '¿Los perfiles de cargo incluyen requisitos físicos y de SST? ¿Se verifican las competencias del personal?',
        category: 'hacer',
        subcategory: '4. Competencia',
        criteria: 'ISO 45001: 7.2 / Dec 1072 Art 2.2.4.6.11'
    },
    {
        id: 'aud_h_comp_2',
        code: '7.2',
        name: 'Plan de Capacitación',
        description: 'Programa anual de capacitación en SST.',
        evaluation: '¿Existe un Plan de Capacitación en SST ejecutado? ¿Cubre los riesgos prioritarios? ¿Se evalúa la eficacia de la capacitación?',
        category: 'hacer',
        subcategory: '4. Competencia',
        criteria: 'Dec 1072 Art 2.2.4.6.11 (2)'
    },
    {
        id: 'aud_h_comp_3',
        code: '7.2',
        name: 'Inducción y Reinducción',
        description: 'Procesos de inducción para personal nuevo y reinducción anual.',
        evaluation: '¿Se realiza inducción completa a todo trabajador nuevo antes de iniciar labores? ¿Se realiza reinducción anual? ¿Hay registros firmados?',
        category: 'hacer',
        subcategory: '4. Competencia',
        criteria: 'Dec 1072 Art 2.2.4.6.11 (1)'
    },
    {
        id: 'aud_h_com_1',
        code: '7.4',
        name: 'Comunicación Interna y Externa',
        description: 'Mecanismos de comunicación del SG-SST.',
        evaluation: '¿Existen canales de comunicación eficaces? ¿Se comunican los riesgos a los trabajadores? ¿Se gestionan las comunicaciones externas?',
        category: 'hacer',
        subcategory: '4. Comunicación',
        criteria: 'ISO 45001: 7.4 / Dec 1072 Art 2.2.4.6.14'
    },
    {
        id: 'aud_h_doc_1',
        code: '7.5',
        name: 'Control de Documentos',
        description: 'Gestión de la información documentada del sistema.',
        evaluation: '¿Existe un listado maestro de documentos? ¿Los documentos están codificados, vigentes y aprobados? ¿Se controlan versiones obsoletas?',
        category: 'hacer',
        subcategory: '4. Documentación',
        criteria: 'ISO 45001: 7.5 / Dec 1072 Art 2.2.4.6.12'
    },
    {
        id: 'aud_h_doc_2',
        code: '7.5',
        name: 'Control de Registros y Archivo',
        description: 'Conservación de registros del SG-SST.',
        evaluation: '¿Los registros son legibles y recuperables? ¿Se cumple la retención documental (20 años para HC y otros)? ¿Hay copias de seguridad?',
        category: 'hacer',
        subcategory: '4. Documentación',
        criteria: 'Dec 1072 Art 2.2.4.6.13'
    },

    // 5. Operación
    {
        id: 'aud_h_oper_1',
        code: '8.1.1',
        name: 'Controles Operacionales (PTS)',
        description: 'Procedimientos de Trabajo Seguro para actividades críticas.',
        evaluation: '¿Existen estándares o procedimientos para tareas de alto riesgo (alturas, confinados, izaje)? ¿Se divulgan y aplican en campo?',
        category: 'hacer',
        subcategory: '5. Operación',
        criteria: 'ISO 45001: 8.1.1'
    },
    {
        id: 'aud_h_oper_2',
        code: '8.1.1',
        name: 'Inspecciones de Seguridad',
        description: 'Programa de inspecciones planeadas y no planeadas.',
        evaluation: '¿Existe cronograma de inspecciones (locativas, EPP, extintores, botiquines)? ¿Se ejecutan y generan planes de acción? ¿Participa el COPASST?',
        category: 'hacer',
        subcategory: '5. Operación',
        criteria: 'Res 2013 de 1986'
    },
    {
        id: 'aud_h_oper_3',
        code: '8.1.1',
        name: 'Mantenimiento Preventivo y Correctivo',
        description: 'Mantenimiento de instalaciones y equipos críticos.',
        evaluation: '¿Existe programa de mantenimiento de maquinaria y equipo? ¿Se tiene hoja de vida de equipos? ¿Se realizan inspecciones pre-uso?',
        category: 'hacer',
        subcategory: '5. Operación',
        criteria: 'Dec 1072 Art 2.2.4.6.24 (3)'
    },
    {
        id: 'aud_h_oper_4',
        code: '8.1.1',
        name: 'Elementos de Protección Personal (EPP)',
        description: 'Suministro y control de EPP.',
        evaluation: '¿Existe matriz de EPP por cargo? ¿Se entrega EPP sin costo y con registro? ¿Se capacita en su uso? ¿Se inspecciona su estado?',
        category: 'hacer',
        subcategory: '5. Operación',
        criteria: 'Dec 1072 Art 2.2.4.6.24'
    },
    {
        id: 'aud_h_oper_5',
        code: '8.1.1',
        name: 'Señalización y Demarcación',
        description: 'Señalización de áreas y advertrencia de peligros.',
        evaluation: '¿Las áreas están señalizadas y demarcadas? ¿Existen planos de evacuación visibles? ¿Se señalizan áreas de riesgo eléctrico/químico?',
        category: 'hacer',
        subcategory: '5. Operación',
        criteria: 'Res 2400 de 1979'
    },
    {
        id: 'aud_h_cambio_1',
        code: '8.1.3',
        name: 'Gestión del Cambio',
        description: 'Control de cambios en la organización.',
        evaluation: '¿Existe procedimiento para gestión del cambio? ¿Se analizan riesgos antes de cambios tecnológicos, de infraestructura o personal?',
        category: 'hacer',
        subcategory: '5. Gestión Cambio',
        criteria: 'ISO 45001: 8.1.3 / Dec 1072 Art 2.2.4.6.26'
    },
    {
        id: 'aud_h_adq_1',
        code: '8.1.4',
        name: 'Compras y Adquisiciones',
        description: 'Control de compras con impacto en SST.',
        evaluation: '¿Se definen criterios de SST para compras de productos químicos o maquinaria? ¿Se solicitan fichas de seguridad (FDS)?',
        category: 'hacer',
        subcategory: '5. Compras',
        criteria: 'ISO 45001: 8.1.4.1 / Dec 1072 Art 2.2.4.6.24'
    },
    {
        id: 'aud_h_contra_1',
        code: '8.1.4',
        name: 'Gestión de Contratistas',
        description: 'Control de proveedores y contratistas.',
        evaluation: '¿Se solicita el pago de seguridad social a contratistas? ¿Se les exige cumplimiento del manual de seguridad? ¿Se hace inducción a contratistas?',
        category: 'hacer',
        subcategory: '5. Contratistas',
        criteria: 'ISO 45001: 8.1.4.2 / Dec 1072 Art 2.2.4.6.28'
    },
    {
        id: 'aud_h_emer_1',
        code: '8.2',
        name: 'Plan de Emergencias',
        description: 'Preparación y respuesta ante emergencias.',
        evaluation: '¿Existe Plan de Emergencias actualizado? ¿Incluye análisis de vulnerabilidad? ¿Hay planos de evacuación?',
        category: 'hacer',
        subcategory: '5. Emergencias',
        criteria: 'ISO 45001: 8.2 / Dec 1072 Art 2.2.4.6.25'
    },
    {
        id: 'aud_h_emer_2',
        code: '8.2',
        name: 'Brigada de Emergencias',
        description: 'Conformación y dotación de brigadas.',
        evaluation: '¿La brigada está conformada, capacitada y dotada (chalecos, distintivos)? ¿Tienen claro su rol en primeros auxilios y evacuación?',
        category: 'hacer',
        subcategory: '5. Emergencias',
        criteria: 'Dec 1072 Art 2.2.4.6.25'
    },
    {
        id: 'aud_h_emer_3',
        code: '8.2',
        name: 'Equipos de Emergencias',
        description: 'Inspección de equipos de respuesta.',
        evaluation: '¿Los extintores están vigentes y señalizados? ¿El botiquín tiene dotación al día? ¿La alarma funciona?',
        category: 'hacer',
        subcategory: '5. Emergencias',
        criteria: 'Dec 1072 Art 2.2.4.6.25'
    },
    {
        id: 'aud_h_emer_4',
        code: '8.2',
        name: 'Simulacros de Evacuación',
        description: 'Práctica de respuesta a emergencias.',
        evaluation: '¿Se realizó el simulacro anual? ¿Hubo participación total? ¿Se generó informe de evaluación y mejora?',
        category: 'hacer',
        subcategory: '5. Emergencias',
        criteria: 'Dec 1072 Art 2.2.4.6.25 (13)'
    },

    // --- III. VERIFICAR (EVALUACIÓN) ---
    // 6. Seguimiento y Medición
    {
        id: 'aud_v_ind_1',
        code: '9.1.1',
        name: 'Medición de Indicadores',
        description: 'Seguimiento al desempeño del sistema.',
        evaluation: '¿Se miden los indicadores según la periodicidad definida? ¿Se analiza el cumplimiento de metas? (Verificar registros de medición)',
        category: 'verificar',
        subcategory: '6. Indicadores',
        criteria: 'ISO 45001: 9.1.1 / Dec 1072 Art 2.2.4.6.21'
    },
    {
        id: 'aud_v_ind_2',
        code: 'Res 0312',
        name: 'Indicadores de Accidentalidad',
        description: 'Cálculo de frecuencia y severidad de AT.',
        evaluation: '¿Se calculan los índices de Frecuencia, Severidad, Mortalidad de AT? ¿Se llevan estadísticas mensuales?',
        category: 'verificar',
        subcategory: '6. Indicadores',
        criteria: 'Res 0312 Art 30'
    },
    {
        id: 'aud_v_ind_3',
        code: 'Res 0312',
        name: 'Indicadores de Enfermedad Laboral',
        description: 'Cálculo de prevalencia e incidencia de EL.',
        evaluation: '¿Se calculan incidencia y prevalencia de Enfermedad Laboral? ¿Se analizan las causas de ausentismo médico?',
        category: 'verificar',
        subcategory: '6. Indicadores',
        criteria: 'Res 0312 Art 30'
    },
    {
        id: 'aud_v_higiene_1',
        code: '9.1.1',
        name: 'Mediciones Ambientales (Higiene)',
        description: 'Medición de agentes higiénicos (Ruido, Iluminación, etc.).',
        evaluation: '¿Se han realizado estudios de ruido, iluminación, material particulado según los riesgos? ¿Están vigentes? ¿Se aplicaron recomendaciones?',
        category: 'verificar',
        subcategory: '6. Monitoreo',
        criteria: 'Res 2400 de 1979'
    },
    {
        id: 'aud_v_salud_1',
        code: '9.1.1',
        name: 'Diagnóstico de Salud',
        description: 'Informe de condiciones de salud de la población.',
        evaluation: '¿Se cuenta con el informe de condiciones de salud actualizado (anual)? ¿Incluye análisis sociodemográfico y de morbilidad?',
        category: 'verificar',
        subcategory: '6. Salud',
        criteria: 'Dec 1072 Art 2.2.4.6.22'
    },
    {
        id: 'aud_v_aud_1',
        code: '9.2',
        name: 'Plan y Programa de Auditoría',
        description: 'Planificación de la auditoría interna.',
        evaluation: '¿Existe programa de auditoría anual? ¿Se cumplió el plan de auditoría? ¿Se auditó el COPASST y todos los procesos?',
        category: 'verificar',
        subcategory: '7. Auditoría',
        criteria: 'ISO 45001: 9.2 / Dec 1072 Art 2.2.4.6.29'
    },
    {
        id: 'aud_v_aud_2',
        code: '9.2',
        name: 'Informe de Auditoría Anterior',
        description: 'Seguimiento a auditorías previas.',
        evaluation: '¿El informe de auditoría anterior fue divulgado? ¿Se cerraron los hallazgos de la auditoría anterior?',
        category: 'verificar',
        subcategory: '7. Auditoría',
        criteria: 'Dec 1072 Art 2.2.4.6.29'
    },
    {
        id: 'aud_v_rev_1',
        code: '9.3',
        name: 'Revisión por la Dirección',
        description: 'Evaluación del sistema por la alta gerencia.',
        evaluation: '¿Existe acta de revisión por la dirección anual? ¿Incluye decisiones sobre recursos y objetivos? ¿Se trataron todos los puntos de la norma?',
        category: 'verificar',
        subcategory: '8. Rev. Gerencial',
        criteria: 'ISO 45001: 9.3 / Dec 1072 Art 2.2.4.6.31'
    },

    // --- IV. ACTUAR (MEJORA) ---
    // 9. Mejora
    {
        id: 'aud_a_inv_1',
        code: '10.2',
        name: 'Investigación de Incidentes y Accidentes',
        description: 'Análisis de causas de eventos.',
        evaluation: '¿Se investigan los AT dentro de los 15 días siguientes? ¿Se identifican causas raíz (Árbol de causas, 5 porqués)? ¿Participa el COPASST?',
        category: 'actuar',
        subcategory: '9. Incidentes',
        criteria: 'Res 1401 de 2007'
    },
    {
        id: 'aud_a_inv_2',
        code: '10.2',
        name: 'Lecciones Aprendidas',
        description: 'Divulgación de resultados de investigaciones.',
        evaluation: '¿Se generan y divulgan lecciones aprendidas de los accidentes? ¿Se implementan acciones para evitar repetición?',
        category: 'actuar',
        subcategory: '9. Incidentes',
        criteria: 'Res 1401 de 2007'
    },
    {
        id: 'aud_a_acc_1',
        code: '10.2',
        name: 'No Conformidades',
        description: 'Gestión de hallazgos e incumplimientos.',
        evaluation: '¿Se registran las no conformidades detectadas en inspecciones o auditorías? ¿Se analizan sus causas?',
        category: 'actuar',
        subcategory: '9. Acciones CyP',
        criteria: 'ISO 45001: 10.2 / Dec 1072 Art 2.2.4.6.33'
    },
    {
        id: 'aud_a_acc_2',
        code: '10.2',
        name: 'Plan de Acción Correctiva y Preventiva',
        description: 'Planes para el cierre de hallazgos.',
        evaluation: '¿Existen planes de acción para cada no conformidad con responsables y fechas? ¿Se hace seguimiento al cierre de las acciones?',
        category: 'actuar',
        subcategory: '9. Acciones CyP',
        criteria: 'Dec 1072 Art 2.2.4.6.33-34'
    },
    {
        id: 'aud_a_acc_3',
        code: '10.2',
        name: 'Eficacia de las Acciones',
        description: 'Verificación del impacto de las acciones tomadas.',
        evaluation: '¿Se verifica la eficacia de las acciones correctivas implementadas (evitó la recurrencia)?',
        category: 'actuar',
        subcategory: '9. Acciones CyP',
        criteria: 'ISO 45001: 10.2'
    },
    {
        id: 'aud_a_mej_1',
        code: '10.3',
        name: 'Mejora Continua',
        description: 'Optimización del desempeño del SG-SST.',
        evaluation: '¿Se evidencia mejora progresiva en los indicadores? ¿El sistema es dinámico y se actualiza? ¿La gerencia promueve la cultura de prevención?',
        category: 'actuar',
        subcategory: '9. Mejora',
        criteria: 'ISO 45001: 10.3 / Dec 1072 Art 2.2.4.6.30'
    }
];
