
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
    // --- I. RECURSOS (PLANEAR) ---
    {
        id: 'aud_1',
        code: '1',
        name: 'Responsable del SG-SST',
        description: 'Designación del responsable del SG-SST con licencia y curso de 50 horas.',
        evaluation: '¿Existe documento de designación? ¿Tiene licencia vigente y curso de 50h?',
        category: 'planear',
        subcategory: 'Recursos',
        criteria: 'Res 0312: E1.1.1 | Dec 1072: 2.2.4.6.8'
    },
    {
        id: 'aud_2',
        code: '2',
        name: 'Responsabilidades en el SG-SST',
        description: 'Asignación y comunicación de responsabilidades en SST.',
        evaluation: '¿Están definidas y comunicadas las responsabilidades a todos los niveles?',
        category: 'planear',
        subcategory: 'Recursos',
        criteria: 'Res 0312: E1.1.2 | ISO 45001: 5.3'
    },
    {
        id: 'aud_3',
        code: '3',
        name: 'Afiliación al Sistema de Seguridad Social',
        description: 'Afiliación a EPS, AFP, y ARL.',
        evaluation: '¿Todos los trabajadores están afiliados y activos en el sistema?',
        category: 'hacer',
        subcategory: 'Recursos',
        criteria: 'Res 0312: E1.1.3 | Ley 100/93'
    },
    {
        id: 'aud_4',
        code: '4',
        name: 'Pago de Aportes a Seguridad Social',
        description: 'Pago oportuno de los aportes.',
        evaluation: '¿Se evidencia el pago de aportes sin mora (PILA)?',
        category: 'hacer',
        subcategory: 'Recursos',
        criteria: 'Res 0312: E1.1.4'
    },
    {
        id: 'aud_5',
        code: '5',
        name: 'Pago de prestaciones económicas',
        description: 'Reconocimiento y pago de incapacidades.',
        evaluation: '¿Se reconocen y pagan las prestaciones económicas a los trabajadores?',
        category: 'hacer',
        subcategory: 'Recursos',
        criteria: 'Res 0312: E1.1.5'
    },
    {
        id: 'aud_6',
        code: '6',
        name: 'Conformación COPASST / Vigía',
        description: 'Conformación del Comité Paritario de SST.',
        evaluation: '¿Acta de conformación vigente? ¿Paridad en la elección?',
        category: 'planear',
        subcategory: 'Recursos',
        criteria: 'Res 0312: E1.1.6 | ISO 45001: 5.4'
    },
    {
        id: 'aud_7',
        code: '7',
        name: 'Capacitación COPASST / Vigía',
        description: 'Capacitación para el cumplimiento de funciones.',
        evaluation: '¿Los miembros del comité están capacitados?',
        category: 'hacer',
        subcategory: 'Recursos',
        criteria: 'Res 0312: E1.1.7'
    },
    {
        id: 'aud_8',
        code: '8',
        name: 'Conformación Comité de Convivencia',
        description: 'Conformación y funcionamiento para prevenir acoso laboral.',
        evaluation: '¿Comité conformado y operando (reuniones trimestrales)?',
        category: 'planear',
        subcategory: 'Recursos',
        criteria: 'Res 0312: E1.1.8 | Res 652/12'
    },
    {
        id: 'aud_9',
        code: '9',
        name: 'Programa de Capacitación',
        description: 'Programa anual de capacitación en SST.',
        evaluation: '¿Programa documentado y ejecutado? ¿Cubre los riesgos prioritarios?',
        category: 'planear',
        subcategory: 'Capacitación',
        criteria: 'Res 0312: E1.2.1 | ISO 45001: 7.2'
    },
    {
        id: 'aud_10',
        code: '10',
        name: 'Inducción y Reinducción',
        description: 'Inducción (ingreso) y Reinducción (anual).',
        evaluation: '¿Registros de inducción a nuevos y reinducción a antiguos?',
        category: 'hacer',
        subcategory: 'Capacitación',
        criteria: 'Res 0312: E1.2.2'
    },
    {
        id: 'aud_11',
        code: '11',
        name: 'Curso Virtual 50 Horas',
        description: 'Certificación del curso de 50 horas para responsables.',
        evaluation: '¿Certificados vigentes del responsable del SG-SST?',
        category: 'verificar',
        subcategory: 'Capacitación',
        criteria: 'Res 0312: E1.2.3'
    },

    // --- II. GESTIÓN INTEGRAL (PLANEAR) ---
    {
        id: 'aud_12',
        code: '12',
        name: 'Política de SST',
        description: 'Política documentada, firmada y divulgada.',
        evaluation: '¿Política firmada (año vigente) y divulgada a todo nivel?',
        category: 'planear',
        subcategory: 'Gestión Integral',
        criteria: 'Res 0312: E2.1.1 | ISO 45001: 5.2'
    },
    {
        id: 'aud_13',
        code: '13',
        name: 'Objetivos del SG-SST',
        description: 'Objetivos definidos, claros y medibles.',
        evaluation: '¿Objetivos firmados con metas e indicadores?',
        category: 'planear',
        subcategory: 'Gestión Integral',
        criteria: 'Res 0312: E2.2.1 | ISO 45001: 6.2'
    },
    {
        id: 'aud_14',
        code: '14',
        name: 'Evaluación Inicial',
        description: 'Evaluación del estado del SG-SST.',
        evaluation: '¿Evaluación inicial o autoevaluación realizada anualmente?',
        category: 'planear',
        subcategory: 'Gestión Integral',
        criteria: 'Res 0312: E2.3.1'
    },
    {
        id: 'aud_15',
        code: '15',
        name: 'Plan de Trabajo Anual',
        description: 'Plan anual con cronograma, recursos y responsables.',
        evaluation: '¿Plan de trabajo firmado y en ejecución?',
        category: 'planear',
        subcategory: 'Gestión Integral',
        criteria: 'Res 0312: E2.4.1 | ISO 45001: 6.2.2'
    },
    {
        id: 'aud_16',
        code: '16',
        name: 'Archivo y Retención',
        description: 'Sistema de archivo de documentos (20 años para registros).',
        evaluation: '¿Sistema de archivo organizado? ¿Garantiza conservación 20 años?',
        category: 'hacer',
        subcategory: 'Gestión Integral',
        criteria: 'Res 0312: E2.5.1 | ISO 45001: 7.5'
    },
    {
        id: 'aud_17',
        code: '17',
        name: 'Rendición de Cuentas',
        description: 'Rendición de cuentas anual de todos los niveles.',
        evaluation: '¿Actas de rendición de cuentas anuales (Gerencia, Responsable SST)?',
        category: 'verificar',
        subcategory: 'Gestión Integral',
        criteria: 'Res 0312: E2.6.1'
    },
    {
        id: 'aud_18',
        code: '18',
        name: 'Matriz Legal',
        description: 'Identificación y evaluación de requisitos legales.',
        evaluation: '¿Matriz legal actualizada y evaluada periódicamente?',
        category: 'planear',
        subcategory: 'Gestión Integral',
        criteria: 'Res 0312: E2.7.1 | ISO 45001: 6.1.3'
    },
    {
        id: 'aud_19',
        code: '19',
        name: 'Mecanismos de Comunicación',
        description: 'Canales de comunicación interna y externa.',
        evaluation: '¿Evidencia de comunicación con trabajadores y partes interesadas?',
        category: 'hacer',
        subcategory: 'Gestión Integral',
        criteria: 'Res 0312: E2.8.1 | ISO 45001: 7.4'
    },
    {
        id: 'aud_20',
        code: '20',
        name: 'Identificación y Evaluación (Adquisiciones)',
        description: 'Criterios de SST para compras y contratistas.',
        evaluation: '¿Se aplican criterios SST en selección de proveedores y contratistas?',
        category: 'hacer',
        subcategory: 'Gestión Integral',
        criteria: 'Res 0312: E2.9.1 | ISO 45001: 8.1.4'
    },
    {
        id: 'aud_21',
        code: '21',
        name: 'Evaluación de proveedores y contratistas',
        description: 'Evaluación del cumplimiento de SST de proveedores.',
        evaluation: '¿Se evalúa el desempeño SST de los contratistas?',
        category: 'verificar',
        subcategory: 'Gestión Integral',
        criteria: 'Res 0312: E2.10.1'
    },
    {
        id: 'aud_22',
        code: '22',
        name: 'Gestión del Cambio',
        description: 'Evaluación del impacto de cambios internos y externos.',
        evaluation: '¿Análisis de riesgo previo a cambios significativos?',
        category: 'hacer',
        subcategory: 'Gestión Integral',
        criteria: 'Res 0312: E2.11.1 | ISO 45001: 8.1.3'
    },

    // --- III. GESTIÓN DE SALUD (HACER) ---
    {
        id: 'aud_23',
        code: '23',
        name: 'Condiciones de Salud (Perfil)',
        description: 'Diagnóstico de condiciones de salud y perfil sociodemográfico.',
        evaluation: '¿Perfil sociodemográfico actualizado anualmente?',
        category: 'planear',
        subcategory: 'Salud',
        criteria: 'Res 0312: E3.1.1'
    },
    {
        id: 'aud_24',
        code: '24',
        name: 'Actividades de Promoción y Prevención',
        description: 'Actividades de medicina del trabajo y prevención.',
        evaluation: '¿Se ejecutan actividades de promoción de la salud según el diagnóstico?',
        category: 'hacer',
        subcategory: 'Salud',
        criteria: 'Res 0312: E3.1.2'
    },
    {
        id: 'aud_25',
        code: '25',
        name: 'Exámenes Médicos Ocupacionales',
        description: 'Evaluaciones médicas de ingreso, periódicas y retiro.',
        evaluation: '¿Conceptos de aptitud laboral archivados? ¿Profesiograma actualizado?',
        category: 'hacer',
        subcategory: 'Salud',
        criteria: 'Res 0312: E3.1.3'
    },
    {
        id: 'aud_26',
        code: '26',
        name: 'Custodia de Historias Clínicas',
        description: 'Garantía de confidencialidad y custodia por IPS.',
        evaluation: '¿Las historias clínicas están en custodia de la IPS (no de la empresa)?',
        category: 'hacer',
        subcategory: 'Salud',
        criteria: 'Res 0312: E3.1.4'
    },
    {
        id: 'aud_27',
        code: '27',
        name: 'Restricciones y Recomendaciones',
        description: 'Seguimiento a restricciones y recomendaciones médico laborales.',
        evaluation: '¿Hay registros de seguimiento a recomendaciones médicas? ¿Se acatan?',
        category: 'hacer',
        subcategory: 'Salud',
        criteria: 'Res 0312: E3.1.5'
    },
    {
        id: 'aud_28',
        code: '28',
        name: 'Estilos de Vida Saludables',
        description: 'Programa de estilos de vida y entorno saludable.',
        evaluation: '¿Existen campañas de no fumadores, alimentación, deporte?',
        category: 'hacer',
        subcategory: 'Salud',
        criteria: 'Res 0312: E3.1.6'
    },
    {
        id: 'aud_29',
        code: '29',
        name: 'Servicios de Higiene',
        description: 'Suministro de agua potable y servicios sanitarios.',
        evaluation: '¿Agua potable y baños higiénicos disponibles?',
        category: 'hacer',
        subcategory: 'Salud',
        criteria: 'Res 0312: E3.1.7'
    },
    {
        id: 'aud_30',
        code: '30',
        name: 'Manejo de Residuos',
        description: 'Clasificación y disposición de residuos.',
        evaluation: '¿Disposición adecuada de residuos sólidos y peligrosos?',
        category: 'hacer',
        subcategory: 'Salud',
        criteria: 'Res 0312: E3.1.8'
    },
    {
        id: 'aud_31',
        code: '31',
        name: 'Reporte de Accidentes (ATEL)',
        description: 'Reporte a ARL y EPS de accidentes y enfermedades.',
        evaluation: '¿Reportes (FURAT/FUREL) radicados a tiempo (2 días)?',
        category: 'actuar',
        subcategory: 'Salud',
        criteria: 'Res 0312: E3.2.1'
    },
    {
        id: 'aud_32',
        code: '32',
        name: 'Investigación de Incidentes y AT',
        description: 'Investigación de incidentes y accidentes de trabajo.',
        evaluation: '¿Investigaciones realizadas con participación del COPASST? ¿Causas raíz?',
        category: 'actuar',
        subcategory: 'Salud',
        criteria: 'Res 0312: E3.2.2 | ISO 45001: 10.2'
    },
    {
        id: 'aud_33',
        code: '33',
        name: 'Registro y Análisis de ATEL',
        description: 'Estadísticas de accidentalidad y enfermedad laboral.',
        evaluation: '¿Registro histórico de ATEL y análisis de tendencias?',
        category: 'verificar',
        subcategory: 'Salud',
        criteria: 'Res 0312: E3.2.3'
    },

    // --- IV. GESTIÓN DE PELIGROS (HACER/PLANEAR) ---
    {
        id: 'aud_34',
        code: '34',
        name: 'Metodología Identificación Peligros',
        description: 'Definición de metodología para identificación y valoración.',
        evaluation: '¿Metodología (GTC 45 u otra) documentada?',
        category: 'planear',
        subcategory: 'Peligros',
        criteria: 'Res 0312: E4.1.1 | ISO 45001: 6.1.2'
    },
    {
        id: 'aud_35',
        code: '35',
        name: 'Identificación de Peligros (Matriz)',
        description: 'Identificación de peligros y valoración de riesgos anual.',
        evaluation: '¿Matriz de riesgos actualizada en el último año? ¿Cubre todas las sedes?',
        category: 'planear',
        subcategory: 'Peligros',
        criteria: 'Res 0312: E4.1.2'
    },
    {
        id: 'aud_36',
        code: '36',
        name: 'Medidas de Prevención y Control',
        description: 'Definición de controles para riesgos identificados.',
        evaluation: '¿Controles definidos para riesgos prioritarios (Jerarquía)?',
        category: 'planear',
        subcategory: 'Peligros',
        criteria: 'Res 0312: E4.1.3 | ISO 45001: 8.1.2'
    },
    {
        id: 'aud_37',
        code: '37',
        name: 'Mediciones Ambientales',
        description: 'Evaluaciones higiénicas (físicos, químicos, biológicos).',
        evaluation: '¿Mediciones de ruido, luz, etc., realizadas si aplica?',
        category: 'verificar',
        subcategory: 'Peligros',
        criteria: 'Res 0312: E4.1.4'
    },
    {
        id: 'aud_38',
        code: '38',
        name: 'Medidas de Prevención (Aplicación)',
        description: 'Ejecución de las medidas de prevención y control.',
        evaluation: '¿Evidencia de implementación de los controles definidos?',
        category: 'hacer',
        subcategory: 'Peligros',
        criteria: 'Res 0312: E4.2.1'
    },
    {
        id: 'aud_39',
        code: '39',
        name: 'Procedimientos e Instructivos (PTS)',
        description: 'Procedimientos de trabajo seguro para tareas críticas.',
        evaluation: '¿Existen PTS para alturas, caliente, espacios confinados?',
        category: 'hacer',
        subcategory: 'Peligros',
        criteria: 'Res 0312: E4.2.2'
    },
    {
        id: 'aud_40',
        code: '40',
        name: 'Inspecciones de Seguridad',
        description: 'Inspecciones a instalaciones, maquinaria y equipos.',
        evaluation: '¿Programa de inspecciones ejecutado? ¿Listas de chequeo?',
        category: 'hacer',
        subcategory: 'Peligros',
        criteria: 'Res 0312: E4.2.3'
    },
    {
        id: 'aud_41',
        code: '41',
        name: 'Mantenimiento Periódico',
        description: 'Mantenimiento preventivo y correctivo.',
        evaluation: '¿Plan de mantenimiento de equipos ejecutado? ¿Hojas de vida?',
        category: 'hacer',
        subcategory: 'Peligros',
        criteria: 'Res 0312: E4.2.4'
    },
    {
        id: 'aud_42',
        code: '42',
        name: 'Entrega de EPP',
        description: 'Suministro de Elementos de Protección Personal.',
        evaluation: '¿Registros de entrega de EPP adecuados al riesgo?',
        category: 'hacer',
        subcategory: 'Peligros',
        criteria: 'Res 0312: E4.2.5'
    },
    {
        id: 'aud_43',
        code: '43',
        name: 'Plan de Emergencias',
        description: 'Plan de prevención y respuesta ante emergencias.',
        evaluation: '¿Plan escrito con análisis de vulnerabilidad?',
        category: 'planear',
        subcategory: 'Amenazas',
        criteria: 'Res 0312: E5.1.1 | ISO 45001: 8.2'
    },
    {
        id: 'aud_44',
        code: '44',
        name: 'Brigada de Emergencias',
        description: 'Conformación y dotación de la brigada.',
        evaluation: '¿Brigada conformada, capacitada y dotada?',
        category: 'hacer',
        subcategory: 'Amenazas',
        criteria: 'Res 0312: E5.1.2'
    },

    // --- V. VERIFICACIÓN (VERIFICAR) ---
    {
        id: 'aud_45',
        code: '45',
        name: 'Indicadores: Frecuencia de Accidentalidad',
        description: 'Medición de la frecuencia de accidentes laborales.',
        evaluation: '¿Cálculo mensual del indicador de frecuencia de AT?',
        category: 'verificar',
        subcategory: 'Indicadores',
        criteria: 'Res 0312: E6.1.1 (Art 30)'
    },
    {
        id: 'aud_46',
        code: '46',
        name: 'Indicadores: Severidad de Accidentalidad',
        description: 'Medición de la severidad de accidentes laborales.',
        evaluation: '¿Cálculo mensual del indicador de severidad de AT?',
        category: 'verificar',
        subcategory: 'Indicadores',
        criteria: 'Res 0312: E6.1.1 (Art 30)'
    },
    {
        id: 'aud_47',
        code: '47',
        name: 'Indicadores: Mortalidad',
        description: 'Medición de la mortalidad por accidentes laborales.',
        evaluation: '¿Cálculo anual del indicador de mortalidad?',
        category: 'verificar',
        subcategory: 'Indicadores',
        criteria: 'Res 0312: E6.1.1 (Art 30)'
    },
    {
        id: 'aud_48',
        code: '48',
        name: 'Indicadores: Prevalencia Incidencia EL',
        description: 'Medición de prevalencia e incidencia de enfermedad laboral.',
        evaluation: '¿Cálculo anual de indicadores de EL?',
        category: 'verificar',
        subcategory: 'Indicadores',
        criteria: 'Res 0312: E6.1.1 (Art 30)'
    },
    {
        id: 'aud_49',
        code: '49',
        name: 'Indicadores: Ausentismo',
        description: 'Medición del ausentismo por causa médica.',
        evaluation: '¿Cálculo mensual de ausentismo general?',
        category: 'verificar',
        subcategory: 'Indicadores',
        criteria: 'Res 0312: E6.1.1 (Art 30)'
    },
    {
        id: 'aud_50',
        code: '50',
        name: 'Auditoría Interna',
        description: 'Realización de auditoría anual.',
        evaluation: '¿Informe de auditoría interna firmado? ¿Planificada con COPASST?',
        category: 'verificar',
        subcategory: 'Verificación',
        criteria: 'Res 0312: E6.1.2 | ISO 45001: 9.2'
    },
    {
        id: 'aud_51',
        code: '51',
        name: 'Revisión por la Dirección',
        description: 'Revisión anual por la alta gerencia.',
        evaluation: '¿Acta de revisión gerencial con resultados y decisiones?',
        category: 'verificar',
        subcategory: 'Verificación',
        criteria: 'Res 0312: E6.1.3 | ISO 45001: 9.3'
    },
    {
        id: 'aud_52',
        code: '52',
        name: 'Planificación Auditoría COPASST',
        description: 'Participación COPASST en auditoría.',
        evaluation: '¿Evidencia de participación del COPASST en alcance de auditoría?',
        category: 'planear',
        subcategory: 'Verificación',
        criteria: 'Res 0312: E6.1.4'
    },

    // --- VI. MEJORAMIENTO (ACTUAR) ---
    {
        id: 'aud_53',
        code: '53',
        name: 'Acciones Preventivas y Correctivas',
        description: 'Definición de acciones ante no conformidades.',
        evaluation: '¿Acciones definidas para hallazgos de auditoría e inspecciones?',
        category: 'actuar',
        subcategory: 'Mejoramiento',
        criteria: 'Res 0312: E7.1.1 | ISO 45001: 10.2'
    },
    {
        id: 'aud_54',
        code: '54',
        name: 'Acciones de Mejora',
        description: 'Acciones para mejora continua del sistema.',
        evaluation: '¿Acciones proactivas implementadas por recomendaciones?',
        category: 'actuar',
        subcategory: 'Mejoramiento',
        criteria: 'Res 0312: E7.1.2 | ISO 45001: 10.3'
    },
    {
        id: 'aud_55',
        code: '55',
        name: 'Plan de Mejoramiento',
        description: 'Plan derivado de autoevaluación de estándares.',
        evaluation: '¿Plan de mejoramiento reportado a ARL y MinTrabajo?',
        category: 'actuar',
        subcategory: 'Mejoramiento',
        criteria: 'Res 0312: E7.1.3'
    },
    {
        id: 'aud_56',
        code: '56',
        name: 'Seguimiento y Reporte de Mejoras',
        description: 'Seguimiento al cumplimiento del plan de mejoramiento.',
        evaluation: '¿Seguimiento semestral al plan de mejora? ¿Aprobación por gerencia?',
        category: 'actuar',
        subcategory: 'Mejoramiento',
        criteria: 'Res 0312: E7.1.4'
    },

    // --- VII. REQUISITOS ADICIONALES ISO 45001 Y DEC 1072 ---
    {
        id: 'aud_57',
        code: '57',
        name: 'Contexto de la Organización',
        description: 'Análisis de cuestiones externas e internas (DOFA).',
        evaluation: '¿Análisis de contexto (DOFA) documentado y revisado?',
        category: 'planear',
        subcategory: 'ISO 45001',
        criteria: 'ISO 45001: 4.1'
    },
    {
        id: 'aud_58',
        code: '58',
        name: 'Necesidades de Partes Interesadas',
        description: 'Determinación de partes interesadas y sus requisitos.',
        evaluation: '¿Matriz de partes interesadas y sus expectativas?',
        category: 'planear',
        subcategory: 'ISO 45001',
        criteria: 'ISO 45001: 4.2'
    },
    {
        id: 'aud_59',
        code: '59',
        name: 'Consulta y Participación de Trabajadores',
        description: 'Consulta a trabajadores no directivos.',
        evaluation: '¿Mecanismos de consulta (además de COPASST) para cambios?',
        category: 'planear',
        subcategory: 'ISO 45001',
        criteria: 'ISO 45001: 5.4'
    },
    {
        id: 'aud_60',
        code: '60',
        name: 'Toma de Conciencia',
        description: 'Sensibilización sobre política y consecuencias.',
        evaluation: '¿Trabajadores conscientes de riesgos y de su impacto en el SG-SST?',
        category: 'hacer',
        subcategory: 'ISO 45001',
        criteria: 'ISO 45001: 7.3'
    },
    {
        id: 'aud_61',
        code: '61',
        name: 'Mejora Continua (Desempeño)',
        description: 'Mejora del desempeño y la cultura de SST.',
        evaluation: '¿Evidencia de mejora progresiva del sistema y reducción de riesgos?',
        category: 'actuar',
        subcategory: 'ISO 45001',
        criteria: 'ISO 45001: 10.3 | Dec 1072: 2.2.4.6.30'
    }
];
