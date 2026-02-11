/**
 * Datos para el Checklist de Auditoría Interna SG-SST
 * Basado en Decreto 1072 de 2015, Resolución 0312 de 2019 e ISO 45001:2018
 */

export interface AuditoriaItem {
    id: string;
    code: string;
    name: string;
    description: string;
    evaluation: string;
    category: 'planear' | 'hacer' | 'verificar' | 'actuar';
    subcategory: string;
    criteria: string; // Norma de referencia (Ej: Dec 1072 Art 2.2.4.6.12)
}

export const AUDITORIA_ITEMS: AuditoriaItem[] = [
    // --- PLANEAR ---
    {
        id: 'aud_plan_1',
        code: '1.1',
        name: 'Política de SST',
        description: 'Verificar la existencia, divulgación y revisión de la Política de SST.',
        evaluation: '¿La política está firmada, fechada, divulgada y revisada anualmente?',
        category: 'planear',
        subcategory: 'Política y Objetivos',
        criteria: 'Dec 1072 Art 2.2.4.6.5 / ISO 45001 5.2',
    },
    {
        id: 'aud_plan_2',
        code: '1.2',
        name: 'Objetivos del SG-SST',
        description: 'Verificar que los objetivos sean medibles, coherentes con la política y comunicados.',
        evaluation: '¿Los objetivos están definidos, son medibles y se les hace seguimiento?',
        category: 'planear',
        subcategory: 'Política y Objetivos',
        criteria: 'Dec 1072 Art 2.2.4.6.18 / ISO 45001 6.2',
    },
    {
        id: 'aud_plan_3',
        code: '1.3',
        name: 'Evaluación Inicial / Diagnóstico',
        description: 'Verificar la realización de la evaluación inicial del SG-SST.',
        evaluation: '¿Se cuenta con una evaluación inicial (estándares mínimos) vigente?',
        category: 'planear',
        subcategory: 'Planificación',
        criteria: 'Dec 1072 Art 2.2.4.6.16 / Res 0312 Art 26',
    },
    {
        id: 'aud_plan_4',
        code: '1.4',
        name: 'Plan de Trabajo Anual',
        description: 'Verificar el cumplimiento del Plan de Trabajo Anual.',
        evaluation: '¿Existe un plan de trabajo firmado y se evidencia su ejecución según cronograma?',
        category: 'planear',
        subcategory: 'Planificación',
        criteria: 'Dec 1072 Art 2.2.4.6.17 / Res 0312',
    },
    {
        id: 'aud_plan_5',
        code: '1.5',
        name: 'Matriz Legal',
        description: 'Verificar la actualización de la matriz de requisitos legales.',
        evaluation: '¿La matriz legal está actualizada e incluye normas recientes (ej. Res 0312)?',
        category: 'planear',
        subcategory: 'Planificación',
        criteria: 'Dec 1072 Art 2.2.4.6.12 / ISO 45001 6.1.3',
    },
    {
        id: 'aud_plan_6',
        code: '1.6',
        name: 'Recursos (Humanos, Técnicos, Financieros)',
        description: 'Verificar la asignación y disponibilidad de recursos para el SG-SST.',
        evaluation: '¿Se han asignado y ejecutado los recursos definidos para el SG-SST?',
        category: 'planear',
        subcategory: 'Recursos',
        criteria: 'Dec 1072 Art 2.2.4.6.8 / ISO 45001 7.1',
    },

    // --- HACER ---
    {
        id: 'aud_hacer_1',
        code: '2.1',
        name: 'Identificación de Peligros (GTC 45)',
        description: 'Verificar la matriz de peligros y su actualización anual.',
        evaluation: '¿La matriz de peligros cubre todas las sedes y actividades y está actualizada?',
        category: 'hacer',
        subcategory: 'Gestión de Peligros',
        criteria: 'Dec 1072 Art 2.2.4.6.15 / ISO 45001 6.1.2',
    },
    {
        id: 'aud_hacer_2',
        code: '2.2',
        name: 'Medidas de Prevención y Control',
        description: 'Verificar la implementación de controles (jerarquía de controles).',
        evaluation: '¿Se han implementado controles para los riesgos priorizados?',
        category: 'hacer',
        subcategory: 'Gestión de Peligros',
        criteria: 'Dec 1072 Art 2.2.4.6.24 / ISO 45001 8.1',
    },
    {
        id: 'aud_hacer_3',
        code: '2.3',
        name: 'Preparación y Respuesta ante Emergencias',
        description: 'Verificar el plan de emergencias y realización de simulacros.',
        evaluation: '¿Existe plan de emergencias y se han realizado los simulacros programados?',
        category: 'hacer',
        subcategory: 'Emergencias',
        criteria: 'Dec 1072 Art 2.2.4.6.25 / ISO 45001 8.2',
    },
    {
        id: 'aud_hacer_4',
        code: '2.4',
        name: 'Gestión del Cambio',
        description: 'Verificar el procedimiento de gestión del cambio.',
        evaluation: '¿Se evalúa el impacto en SST ante cambios internos o externos?',
        category: 'hacer',
        subcategory: 'Gestión del Cambio',
        criteria: 'Dec 1072 Art 2.2.4.6.26 / ISO 45001 8.1.3',
    },
    {
        id: 'aud_hacer_5',
        code: '2.5',
        name: 'Adquisiciones y Contratación',
        description: 'Verificar criterios SST en compras y selección de contratistas.',
        evaluation: '¿Se aplican criterios SST en la selección y evaluación de proveedores/contratistas?',
        category: 'hacer',
        subcategory: 'Adquisiciones',
        criteria: 'Dec 1072 Art 2.2.4.6.27 / ISO 45001 8.1.4',
    },
    {
        id: 'aud_hacer_6',
        code: '2.6',
        name: 'Capacitación y Entrenamiento',
        description: 'Verificar el cumplimiento del cronograma de capacitación.',
        evaluation: '¿Se ha cumplido el plan de capacitación y se evalúa su eficacia?',
        category: 'hacer',
        subcategory: 'Competencia',
        criteria: 'Dec 1072 Art 2.2.4.6.11 / ISO 45001 7.2',
    },
    {
        id: 'aud_hacer_7',
        code: '2.7',
        name: 'Condiciones de Salud (Exámenes Médicos)',
        description: 'Verificar la realización de exámenes médicos ocupacionales y diagnósticos.',
        evaluation: '¿Se realizan los exámenes médicos (ingreso, periódico, retiro) y se analiza el Dx de salud?',
        category: 'hacer',
        subcategory: 'Salud',
        criteria: 'Res 2346 de 2007 / Dec 1072',
    },

    // --- VERIFICAR ---
    {
        id: 'aud_ver_1',
        code: '3.1',
        name: 'Indicadores de Gestión (Estructura, Proceso, Resultado)',
        description: 'Verificar la medición de indicadores del SG-SST.',
        evaluation: '¿Están definidos y medidos los indicadores de estructura, proceso y resultado?',
        category: 'verificar',
        subcategory: 'Medición y Control',
        criteria: 'Dec 1072 Art 2.2.4.6.20-22 / Res 0312 Art 30',
    },
    {
        id: 'aud_ver_2',
        code: '3.2',
        name: 'Investigación de Incidentes, Accidentes y EL',
        description: 'Verificar la investigación de eventos y cierre de acciones.',
        evaluation: '¿Se investigan los incidentes/accidentes dentro de los 15 días y se implementan correcciones?',
        category: 'verificar',
        subcategory: 'Investigación',
        criteria: 'Res 1401 de 2007 / Dec 1072 Art 2.2.4.6.32',
    },
    {
        id: 'aud_ver_3',
        code: '3.3',
        name: 'Auditoría Interna',
        description: 'Verificar la realización de la auditoría interna (ciclo anterior o actual).',
        evaluation: '¿Se realizó auditoría interna al menos una vez al año con alcance a todo el sistema?',
        category: 'verificar',
        subcategory: 'Auditoría',
        criteria: 'Dec 1072 Art 2.2.4.6.29 / ISO 45001 9.2',
    },
    {
        id: 'aud_ver_4',
        code: '3.4',
        name: 'Revisión por la Alta Dirección',
        description: 'Verificar el acta de revisión por la dirección.',
        evaluation: '¿Existe acta anual de revisión por la dirección con los puntos requeridos por norma?',
        category: 'verificar',
        subcategory: 'Revisión Gerencial',
        criteria: 'Dec 1072 Art 2.2.4.6.31 / ISO 45001 9.3',
    },
    {
        id: 'aud_ver_5',
        code: '3.5',
        name: 'COPASST / Vigía',
        description: 'Verificar la gestión y participación del COPASST.',
        evaluation: '¿El COPASST se reúne mensualmente, lleva actas y participa en las inspecciones e investigaciones?',
        category: 'verificar',
        subcategory: 'Participación',
        criteria: 'Res 2013 de 1986 / Dec 1072 Art 2.2.4.6.12',
    },

    // --- ACTUAR ---
    {
        id: 'aud_act_1',
        code: '4.1',
        name: 'Acciones Preventivas y Correctivas',
        description: 'Verificar la gestión de no conformidades.',
        evaluation: '¿Se documentan acciones correctivas/preventivas y se verifica el cierre eficaz de las mismas?',
        category: 'actuar',
        subcategory: 'Mejora',
        criteria: 'Dec 1072 Art 2.2.4.6.33-34 / ISO 45001 10.2',
    },
    {
        id: 'aud_act_2',
        code: '4.2',
        name: 'Mejora Continua',
        description: 'Verificar evidencias de mejora en el desempeño del SG-SST.',
        evaluation: '¿Existen evidencias objetivas de la mejora continua del sistema (ej. reducción de accidentalidad)?',
        category: 'actuar',
        subcategory: 'Mejora',
        criteria: 'Dec 1072 Art 2.2.4.6.33 / ISO 45001 10.3',
    },
];
