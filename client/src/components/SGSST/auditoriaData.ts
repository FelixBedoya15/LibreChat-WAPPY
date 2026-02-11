
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
    // --- I. RECURSOS (PLANEAR 10%) ---
    {
        id: 'std_1_1_1',
        code: '1.1.1',
        name: 'Responsable del SG-SST',
        description: 'Designación del responsable del SG-SST.',
        evaluation: '¿Documento de designación, licencia vigente y curso de 50h?',
        category: 'planear',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.1'
    },
    {
        id: 'std_1_1_2',
        code: '1.1.2',
        name: 'Responsabilidades',
        description: 'Asignación de responsabilidades en SST.',
        evaluation: '¿Responsabilidades definidas y comunicadas a todos los niveles?',
        category: 'planear',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.2'
    },
    {
        id: 'std_1_1_3',
        code: '1.1.3',
        name: 'Afiliación Seguridad Social',
        description: 'Afiliación a EPS, AFP, y ARL.',
        evaluation: '¿Todos los trabajadores afiliados al sistema según riesgo?',
        category: 'hacer', // Ejecución
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.3'
    },
    {
        id: 'std_1_1_4',
        code: '1.1.4',
        name: 'Aportes Seguridad Social',
        description: 'Pago de aportes a seguridad social.',
        evaluation: '¿Pago oportuno de aportes (Planilla PILA)?',
        category: 'hacer',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.4'
    },
    {
        id: 'std_1_1_5',
        code: '1.1.5',
        name: 'Pago Prestaciones',
        description: 'Pago de pensión alto riesgo / prestaciones.',
        evaluation: '¿Pago de incapacidades y pensión especial (si aplica)?',
        category: 'hacer',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.5'
    },
    {
        id: 'std_1_1_6',
        code: '1.1.6',
        name: 'Conformación COPASST',
        description: 'Comité Paritario de Seguridad y Salud.',
        evaluation: '¿Acta de conformación vigente y paritaria?',
        category: 'planear',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.6'
    },
    {
        id: 'std_1_1_7',
        code: '1.1.7',
        name: 'Capacitación COPASST',
        description: 'Capacitación a miembros del COPASST.',
        evaluation: '¿Certificados de capacitación de los miembros?',
        category: 'planear',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.7'
    },
    {
        id: 'std_1_1_8',
        code: '1.1.8',
        name: 'Conformación Comité Convivencia',
        description: 'Comité de Convivencia Laboral.',
        evaluation: '¿Acta de conformación y reuniones trimestrales?',
        category: 'planear',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.1.8'
    },
    {
        id: 'std_ley_2365', // ADICIONAL OBLIGATORIO
        code: '1.1.8 (Adicional)',
        name: 'Prevención Acoso Sexual (Ley 2365)',
        description: 'Protocolos contra acoso sexual laboral.',
        evaluation: '¿Protocolos específicos del CCL para acoso sexual (Ley 2365)?',
        category: 'planear',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Ley 2365 de 2024'
    },
    {
        id: 'std_1_2_1',
        code: '1.2.1',
        name: 'Programa Capacitación',
        description: 'Programa de capacitación anual.',
        evaluation: '¿Programa documentado, cronograma y ejecución?',
        category: 'planear',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.2.1'
    },
    {
        id: 'std_1_2_2',
        code: '1.2.2',
        name: 'Inducción y Reinducción',
        description: 'Inducción y reinducción SST.',
        evaluation: '¿Registros de inducción a todos los trabajadores?',
        category: 'hacer',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.2.2'
    },
    {
        id: 'std_1_2_3',
        code: '1.2.3',
        name: 'Curso 50 Horas',
        description: 'Responsable con curso de 50 horas.',
        evaluation: '¿Certificado vigente del curso de 50h del responsable?',
        category: 'planear',
        subcategory: 'I. RECURSOS (10%)',
        criteria: 'Res 0312: E1.2.3'
    },

    // --- II. GESTIÓN INTEGRAL (PLANEAR 15%) ---
    {
        id: 'std_2_1_1',
        code: '2.1.1',
        name: 'Política SST',
        description: 'Política escrita, firmada y divulgada.',
        evaluation: '¿Política actualizada (<1 año) y firmada?',
        category: 'planear',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.1.1'
    },
    {
        id: 'std_ley_2191', // ADICIONAL
        code: '2.1.1 (Adicional)',
        name: 'Política Desconexión Laboral',
        description: 'Política de desconexión laboral.',
        evaluation: '¿Política de desconexión laboral aprobada?',
        category: 'planear',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Ley 2191 de 2022'
    },
    {
        id: 'std_2_2_1',
        code: '2.2.1',
        name: 'Objetivos SST',
        description: 'Objetivos definidos y medibles.',
        evaluation: '¿Objetivos con metas e indicadores documentados?',
        category: 'planear',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.2.1'
    },
    {
        id: 'std_2_3_1',
        code: '2.3.1',
        name: 'Evaluación Inicial',
        description: 'Evaluación inicial del SG-SST.',
        evaluation: '¿Evaluación inicial o autoevaluación anual realizada?',
        category: 'planear',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.3.1'
    },
    {
        id: 'std_2_4_1',
        code: '2.4.1',
        name: 'Plan de Trabajo Anual',
        description: 'Plan anual con cronograma y recursos.',
        evaluation: '¿Plan de trabajo firmado y cumplido?',
        category: 'planear',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.4.1'
    },
    {
        id: 'std_2_5_1',
        code: '2.5.1',
        name: 'Archivo y Retención',
        description: 'Sistema de archivo documental.',
        evaluation: '¿Sistema de archivo (20 años de custodia)?',
        category: 'hacer',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.5.1'
    },
    {
        id: 'std_2_6_1',
        code: '2.6.1',
        name: 'Rendición de Cuentas',
        description: 'Rendición de cuentas anual.',
        evaluation: '¿Actas de rendición de cuentas (todos los niveles)?',
        category: 'verificar',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.6.1'
    },
    {
        id: 'std_2_7_1',
        code: '2.7.1',
        name: 'Matriz Legal',
        description: 'Matriz de requisitos legales.',
        evaluation: '¿Matriz legal actualizada y evaluada?',
        category: 'planear',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.7.1'
    },
    {
        id: 'std_2_8_1',
        code: '2.8.1',
        name: 'Mecanismos Comunicación',
        description: 'Comunicación interna y externa.',
        evaluation: '¿Mecanismos de comunicación con trabajadores y partes interesadas?',
        category: 'hacer',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.8.1'
    },
    {
        id: 'std_2_9_1',
        code: '2.9.1',
        name: 'Adquisiciones',
        description: 'SST en adquisiciones.',
        evaluation: '¿Criterios SST incluidos en compras?',
        category: 'planear',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.9.1'
    },
    {
        id: 'std_2_10_1',
        code: '2.10.1',
        name: 'Contratistas y Proveedores',
        description: 'Evaluación de proveedores.',
        evaluation: '¿Evaluación y selección de contratistas con criterios SST?',
        category: 'hacer',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.10.1'
    },
    {
        id: 'std_2_11_1',
        code: '2.11.1',
        name: 'Gestión del Cambio',
        description: 'Procedimiento de gestión del cambio.',
        evaluation: '¿Análisis de impacto de cambios (internos/externos)?',
        category: 'planear',
        subcategory: 'II. GESTIÓN INTEGRAL (15%)',
        criteria: 'Res 0312: E2.11.1'
    },

    // --- III. GESTIÓN DE LA SALUD (HACER 20%) ---
    {
        id: 'std_3_1_1',
        code: '3.1.1',
        name: 'Perfil Sociodemográfico',
        description: 'Diagnóstico de condiciones de salud.',
        evaluation: '¿Perfil actualizado? ¿Diagnóstico de salud?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.1'
    },
    {
        id: 'std_res_2764', // ADICIONAL
        code: '3.1.1 (Adicional)',
        name: 'Batería Riesgo Psicosocial',
        description: 'Evaluación riesgo psicosocial (Res 2764).',
        evaluation: '¿Aplicación de batería e informe de resultados?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 2764 de 2022'
    },
    {
        id: 'std_3_1_2',
        code: '3.1.2',
        name: 'Actividades P&P',
        description: 'Actividades de medicina preventiva.',
        evaluation: '¿Ejecución de actividades de P&P según diagnóstico?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.2'
    },
    {
        id: 'std_3_1_3',
        code: '3.1.3',
        name: 'Exámenes Médicos',
        description: 'Evaluaciones ocupacionales.',
        evaluation: '¿Conceptos médicos de ingreso, periódicos y retiro?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.3'
    },
    {
        id: 'std_3_1_4',
        code: '3.1.4',
        name: 'Custodia Historias Clínicas',
        description: 'Custodia por IPS.',
        evaluation: '¿Garantía de custodia de HC por entidad médica?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.4'
    },
    {
        id: 'std_3_1_5',
        code: '3.1.5',
        name: 'Restricciones Médicas',
        description: 'Seguimiento a restricciones.',
        evaluation: '¿Seguimiento a recomendaciones médicas laborales?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.5'
    },
    {
        id: 'std_3_1_6',
        code: '3.1.6',
        name: 'Estilos de Vida',
        description: 'Programa de estilos de vida saludables.',
        evaluation: '¿Programa ejecutado (no fumadores, deporte)?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.6'
    },
    {
        id: 'std_3_1_7',
        code: '3.1.7',
        name: 'Servicios Higiene',
        description: 'Agua potable y servicios sanitarios.',
        evaluation: '¿Suministro de agua potable y baños?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.7'
    },
    {
        id: 'std_3_1_8',
        code: '3.1.8',
        name: 'Residuos',
        description: 'Manejo de residuos.',
        evaluation: '¿Eliminación adecuada de residuos sólidos/líquidos?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.1.8'
    },
    {
        id: 'std_3_1_9',
        code: '3.1.9',
        name: 'Reporte MinTrabajo',
        description: 'Reporte de accidentes graves/mortales.',
        evaluation: '¿Reporte a Dirección Territorial (Graves/Mortales)?',
        category: 'actuar',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312 / Dec 1072'
    },
    {
        id: 'std_3_2_1',
        code: '3.2.1',
        name: 'Reporte ARL/EPS',
        description: 'Reporte de ATEL.',
        evaluation: '¿Reporte de ATEL a ARL y EPS (2 días)?',
        category: 'actuar',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.2.1'
    },
    {
        id: 'std_3_2_2',
        code: '3.2.2',
        name: 'Investigación ATEL',
        description: 'Investigación de incidentes y accidentes.',
        evaluation: '¿Investigaciones realizadas con equipo investigador?',
        category: 'actuar',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.2.2'
    },
    {
        id: 'std_3_2_3',
        code: '3.2.3',
        name: 'Registro Estadístico',
        description: 'Registro de accidentalidad.',
        evaluation: '¿Registro y análisis estadístico de ATEL?',
        category: 'verificar',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.2.3'
    },
    // MECANISMOS DE VIGILANCIA (INDICADORES DE SALUD)
    {
        id: 'std_3_3_1',
        code: '3.3.1',
        name: 'Medición Frecuencia AT',
        description: 'Indicador frecuencia de accidentes.',
        evaluation: '¿Cálculo mensual de frecuencia de AT?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.3.1 (Art 30)'
    },
    {
        id: 'std_3_3_2',
        code: '3.3.2',
        name: 'Medición Severidad AT',
        description: 'Indicador severidad de accidentes.',
        evaluation: '¿Cálculo mensual de severidad de AT?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.3.2 (Art 30)'
    },
    {
        id: 'std_3_3_3',
        code: '3.3.3',
        name: 'Medición Mortalidad AT',
        description: 'Indicador mortalidad accidentes.',
        evaluation: '¿Cálculo anual de mortalidad por AT?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.3.3 (Art 30)'
    },
    {
        id: 'std_3_3_4',
        code: '3.3.4',
        name: 'Medición Prevalencia EL',
        description: 'Indicador prevalencia enfermedad.',
        evaluation: '¿Cálculo anual de prevalencia de EL?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.3.4 (Art 30)'
    },
    {
        id: 'std_3_3_5',
        code: '3.3.5',
        name: 'Medición Incidencia EL',
        description: 'Indicador incidencia enfermedad.',
        evaluation: '¿Cálculo anual de incidencia de EL?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.3.5 (Art 30)'
    },
    {
        id: 'std_3_3_6',
        code: '3.3.6',
        name: 'Medición Ausentismo',
        description: 'Indicador ausentismo médica.',
        evaluation: '¿Cálculo mensual de ausentismo?',
        category: 'hacer',
        subcategory: 'III. GESTIÓN SALUD (20%)',
        criteria: 'Res 0312: E3.3.6 (Art 30)'
    },

    // --- IV. GESTIÓN PELIGROS (HACER/PLANEAR 30%) ---
    {
        id: 'std_4_1_1',
        code: '4.1.1',
        name: 'Metodología Peligros',
        description: 'Metodología identificación peligros.',
        evaluation: '¿Metodología documentada para IPEVR?',
        category: 'planear',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.1.1'
    },
    {
        id: 'std_4_1_2',
        code: '4.1.2',
        name: 'Matriz de Peligros',
        description: 'Identificación y valoración.',
        evaluation: '¿Matriz de peligros con participación de trabajadores?',
        category: 'planear',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.1.2'
    },
    {
        id: 'std_4_1_3',
        code: '4.1.3',
        name: 'Priorización Peligros',
        description: 'Identificación y priorización de peligros.',
        evaluation: '¿Matriz identifica y prioriza peligros (físicos, químicos, etc.)?',
        category: 'planear',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.1.3'
    },
    {
        id: 'std_4_1_4',
        code: '4.1.4',
        name: 'Mediciones Ambientales',
        description: 'Evaluaciones higiénicas.',
        evaluation: '¿Informes de mediciones ambientales (si aplica)?',
        category: 'hacer',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.1.4'
    },
    {
        id: 'std_ley_2050', // ADICIONAL
        code: '4.1.4 (Adicional)',
        name: 'PESV',
        description: 'Plan Estratégico de Seguridad Vial.',
        evaluation: '¿PESV diseñado e implementado (Ley 2050)?',
        category: 'planear',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Ley 2050 de 2020'
    },
    {
        id: 'std_4_2_1',
        code: '4.2.1',
        name: 'Medidas de Control',
        description: 'Implementación medidas prevención.',
        evaluation: '¿Ejecución de controles según jerarquía?',
        category: 'hacer',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.2.1'
    },
    {
        id: 'std_4_2_2',
        code: '4.2.2',
        name: 'Procedimientos SST',
        description: 'Instructivos y fichas técnicas.',
        evaluation: '¿Procedimientos para trabajo seguro (críticos)?',
        category: 'hacer',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.2.2'
    },
    {
        id: 'std_4_2_3',
        code: '4.2.3',
        name: 'Inspecciones',
        description: 'Inspecciones de seguridad.',
        evaluation: '¿Programa de inspecciones y registros?',
        category: 'hacer',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.2.3'
    },
    {
        id: 'std_4_2_4',
        code: '4.2.4',
        name: 'Mantenimiento',
        description: 'Mantenimiento instalaciones/equipos.',
        evaluation: '¿Programa de mantenimiento preventivo/correctivo?',
        category: 'hacer',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.2.4'
    },
    {
        id: 'std_4_2_5',
        code: '4.2.5',
        name: 'EPP',
        description: 'Entrega y capacitación EPP.',
        evaluation: '¿Registros de entrega de EPP y capacitación?',
        category: 'hacer',
        subcategory: 'IV. GESTIÓN PELIGROS (30%)',
        criteria: 'Res 0312: E4.2.5'
    },
    {
        id: 'std_4_2_6',
        code: '4.2.6',
        name: 'Plan Emergencias',
        description: 'Preparación ante emergencias.',
        evaluation: '¿Plan de emergencias documentado y divulgado?',
        category: 'planear',
        subcategory: 'IV. GESTIÓN PELIGROS (V. Amenazas)',
        criteria: 'Res 0312: E4.2.6 / E5.1.1'
    },
    {
        id: 'std_5_1_2',
        code: '5.1.2',
        name: 'Brigada Emergencias',
        description: 'Conformación brigada.',
        evaluation: '¿Brigada conformada, capacitada y dotada?',
        category: 'hacer',
        subcategory: 'V. GESTIÓN AMENAZAS (10%)',
        criteria: 'Res 0312: E5.1.2'
    },

    // --- VI. VERIFICACIÓN (5%) ---
    {
        id: 'std_6_1_1',
        code: '6.1.1',
        name: 'Indicadores SG-SST',
        description: 'Definición de indicadores.',
        evaluation: '¿Ficha técnica de indicadores (Estructura/Proceso/Resultado)?',
        category: 'verificar',
        subcategory: 'VI. VERIFICACIÓN (5%)',
        criteria: 'Res 0312: E6.1.1'
    },
    {
        id: 'std_6_1_2',
        code: '6.1.2',
        name: 'Auditoría Interna',
        description: 'Auditoría anual.',
        evaluation: '¿Informe de auditoría interna anual?',
        category: 'verificar',
        subcategory: 'VI. VERIFICACIÓN (5%)',
        criteria: 'Res 0312: E6.1.2'
    },
    {
        id: 'std_6_1_3',
        code: '6.1.3',
        name: 'Revisión Gerencial',
        description: 'Revisión alta dirección.',
        evaluation: '¿Acta de revisión por la dirección?',
        category: 'verificar',
        subcategory: 'VI. VERIFICACIÓN (5%)',
        criteria: 'Res 0312: E6.1.3'
    },
    {
        id: 'std_6_1_4',
        code: '6.1.4',
        name: 'Auditoría COPASST',
        description: 'Participación COPASST.',
        evaluation: '¿Participación del COPASST en planificación auditoría?',
        category: 'planear',
        subcategory: 'VI. VERIFICACIÓN (5%)',
        criteria: 'Res 0312: E6.1.4'
    },

    // --- VII. MEJORAMIENTO (ACTUAR 10%) ---
    {
        id: 'std_7_1_1',
        code: '7.1.1',
        name: 'Acciones Preventivas/Correctivas',
        description: 'Acciones P/C.',
        evaluation: '¿Acciones cerradas de auditorías/inspecciones?',
        category: 'actuar',
        subcategory: 'VII. MEJORAMIENTO (10%)',
        criteria: 'Res 0312: E7.1.1'
    },
    {
        id: 'std_7_1_2',
        code: '7.1.2',
        name: 'Acciones Mejora (Revisión)',
        description: 'Mejora por revisión dirección.',
        evaluation: '¿Acciones derivadas de la revisión gerencial?',
        category: 'actuar',
        subcategory: 'VII. MEJORAMIENTO (10%)',
        criteria: 'Res 0312: E7.1.2'
    },
    {
        id: 'std_7_1_3',
        code: '7.1.3',
        name: 'Acciones Mejora (Investigaciones)',
        description: 'Mejora por investigaciones.',
        evaluation: '¿Acciones derivadas de investigaciones ATEL?',
        category: 'actuar',
        subcategory: 'VII. MEJORAMIENTO (10%)',
        criteria: 'Res 0312: E7.1.3'
    },
    {
        id: 'std_7_1_4',
        code: '7.1.4',
        name: 'Plan Mejoramiento',
        description: 'Plan de mejora estándar.',
        evaluation: '¿Plan de mejora reportado a ARL y MinTrabajo?',
        category: 'actuar',
        subcategory: 'VII. MEJORAMIENTO (10%)',
        criteria: 'Res 0312: E7.1.4'
    }
];
