/**
 * Decreto 1072 de 2015 – Artículo 2.2.4.6.31
 * 24 Aspectos que debe permitir la Revisión por la Alta Dirección del SG-SST
 */

export interface AltaDireccionItem {
    id: string;
    code: string;
    name: string;
    description: string;
    evaluation: string;
    category: 'insumos' | 'revision' | 'seguimiento';
    subcategory: string;
}

export interface AltaDireccionStatus {
    itemId: string;
    status: 'cumple' | 'no_cumple' | 'parcial' | 'no_aplica' | 'pendiente';
}

export const ALTA_DIRECCION_ITEMS: AltaDireccionItem[] = [
    // ─── GRUPO 1: Insumos de la Revisión ──────────────────────────────────────
    {
        id: 'ad_01',
        code: 'RAD-01',
        name: 'Estrategias implementadas y eficacia en el logro de objetivos',
        description: 'Revisar las estrategias implementadas y determinar si han sido eficaces para alcanzar los objetivos, metas y resultados esperados del SG-SST.',
        evaluation: 'Verificar si los objetivos del SG-SST definidos en el plan de trabajo anual fueron alcanzados. Analizar el cumplimiento de metas e indicadores establecidos.',
        category: 'insumos',
        subcategory: 'Revisión Estratégica',
    },
    {
        id: 'ad_02',
        code: 'RAD-02',
        name: 'Cumplimiento del plan de trabajo anual y cronograma',
        description: 'Revisar el cumplimiento del plan de trabajo anual en seguridad y salud en el trabajo y su cronograma.',
        evaluation: 'Comparar las actividades programadas vs ejecutadas en el plan anual. Verificar avance del cronograma y causas de posibles incumplimientos.',
        category: 'insumos',
        subcategory: 'Plan Anual',
    },
    {
        id: 'ad_03',
        code: 'RAD-03',
        name: 'Suficiencia de recursos asignados al SG-SST',
        description: 'Analizar la suficiencia de los recursos asignados para la implementación del SG-SST y el cumplimiento de los resultados esperados.',
        evaluation: 'Verificar si el presupuesto asignado fue suficiente para las actividades del SG-SST. Analizar si faltaron recursos humanos, técnicos o financieros.',
        category: 'insumos',
        subcategory: 'Recursos',
    },
    {
        id: 'ad_04',
        code: 'RAD-04',
        name: 'Capacidad del SG-SST para satisfacer necesidades globales',
        description: 'Revisar la capacidad del SG-SST para satisfacer las necesidades globales de la empresa en materia de seguridad y salud en el trabajo.',
        evaluation: 'Evaluar si el SG-SST responde a las necesidades actuales de la empresa, considerando cambios en procesos, personal, instalaciones o contexto organizacional.',
        category: 'insumos',
        subcategory: 'Capacidad del Sistema',
    },
    // ─── GRUPO 2: Revisión – Decisiones y Cambios ────────────────────────────
    {
        id: 'ad_05',
        code: 'RAD-05',
        name: 'Necesidad de cambios en el SG-SST incluida la política',
        description: 'Analizar la necesidad de realizar cambios en el SG-SST, incluida la revisión de la política y sus objetivos.',
        evaluation: 'Determinar si la política de SST y los objetivos deben actualizarse. Revisar si los cambios internos o externos de la organización requieren ajustes al sistema.',
        category: 'revision',
        subcategory: 'Mejora del Sistema',
    },
    {
        id: 'ad_06',
        code: 'RAD-06',
        name: 'Eficacia de medidas de seguimiento de revisiones anteriores',
        description: 'Evaluar la eficacia de las medidas de seguimiento con base en las revisiones anteriores de la alta dirección y realizar los ajustes necesarios.',
        evaluation: 'Comparar las decisiones de la revisión anterior con los resultados actuales. Verificar si las acciones definidas se implementaron y fueron efectivas.',
        category: 'revision',
        subcategory: 'Seguimiento Previo',
    },
    {
        id: 'ad_07',
        code: 'RAD-07',
        name: 'Resultados de indicadores y auditorías del SG-SST',
        description: 'Analizar el resultado de los indicadores y de las auditorías anteriores del SG-SST.',
        evaluation: 'Revisar los indicadores de gestión del SG-SST (frecuencia de AT, severidad, ausentismo). Analizar los hallazgos de las auditorías internas realizadas.',
        category: 'revision',
        subcategory: 'Indicadores y Auditorías',
    },
    {
        id: 'ad_08',
        code: 'RAD-08',
        name: 'Nuevas prioridades y objetivos estratégicos de la organización',
        description: 'Aportar información sobre nuevas prioridades y objetivos estratégicos de la organización que puedan ser insumos para la planificación y la mejora continua.',
        evaluation: 'Determinar si la estrategia corporativa del año/período siguiente implica nuevos riesgos o prioridades de SST que deban incorporarse al plan.',
        category: 'revision',
        subcategory: 'Planeación Estratégica',
    },
    {
        id: 'ad_09',
        code: 'RAD-09',
        name: 'Eficacia de medidas de prevención y control de peligros',
        description: 'Recolectar información para determinar si las medidas de prevención y control de peligros y riesgos se aplican y son eficaces.',
        evaluation: 'Verificar si las medidas de control implementadas están siendo utilizadas correctamente. Analizar si han reducido los accidentes, incidentes o exposiciones.',
        category: 'revision',
        subcategory: 'Control de Riesgos',
    },
    {
        id: 'ad_10',
        code: 'RAD-10',
        name: 'Desempeño en SST – Comunicación con trabajadores',
        description: 'Intercambiar información con los trabajadores sobre los resultados y su desempeño en seguridad y salud en el trabajo.',
        evaluation: 'Verificar si existe mecanismo de socialización con trabajadores sobre los resultados del SG-SST. Revisar actas de reuniones o divulgaciones realizadas.',
        category: 'revision',
        subcategory: 'Participación y Comunicación',
    },
    {
        id: 'ad_11',
        code: 'RAD-11',
        name: 'Decisiones para mejorar identificación de peligros y control de riesgos',
        description: 'Servir de base para la adopción de decisiones que tengan por objeto mejorar la identificación de peligros y el control de los riesgos.',
        evaluation: 'Determinar si se tomaron decisiones concretas para mejorar la gestión de riesgos. Verificar si la matriz de peligros está actualizada.',
        category: 'revision',
        subcategory: 'Decisiones Gerenciales',
    },
    {
        id: 'ad_12',
        code: 'RAD-12',
        name: 'Participación de trabajadores en el SG-SST',
        description: 'Determinar si promueve la participación de los trabajadores.',
        evaluation: 'Verificar mecanismos de participación activa de trabajadores: COPASST, comités, reportes de condiciones inseguras, encuestas de percepción.',
        category: 'revision',
        subcategory: 'Participación y Comunicación',
    },
    // ─── GRUPO 3: Seguimiento – Vigilancia y Cumplimiento ────────────────────
    {
        id: 'ad_13',
        code: 'RAD-13',
        name: 'Cumplimiento normatividad y estándares mínimos',
        description: 'Evidenciar que se cumpla con la normatividad nacional vigente aplicable en materia de riesgos laborales y los estándares mínimos del SG-SST.',
        evaluation: 'Verificar el resultado del diagnóstico de estándares mínimos según Resolución 0312/2019. Revisar el cumplimiento de la normatividad legal identificada en la matriz legal.',
        category: 'seguimiento',
        subcategory: 'Cumplimiento Normativo',
    },
    {
        id: 'ad_14',
        code: 'RAD-14',
        name: 'Acciones de mejora continua en SST',
        description: 'Establecer acciones que permitan la mejora continua en seguridad y salud en el trabajo.',
        evaluation: 'Revisar el plan de mejoramiento del SG-SST. Verificar que existan acciones correctivas y preventivas documentadas y con seguimiento.',
        category: 'seguimiento',
        subcategory: 'Mejora Continua',
    },
    {
        id: 'ad_15',
        code: 'RAD-15',
        name: 'Cumplimiento de planes, metas y objetivos propuestos',
        description: 'Establecer el cumplimiento de planes específicos, de las metas establecidas y de los objetivos propuestos.',
        evaluation: 'Analizar el porcentaje de cumplimiento de los objetivos y metas del SG-SST. Comparar indicadores planeados vs ejecutados.',
        category: 'seguimiento',
        subcategory: 'Plan Anual',
    },
    {
        id: 'ad_16',
        code: 'RAD-16',
        name: 'Inspección sistemática de puestos de trabajo y maquinaria',
        description: 'Inspeccionar sistemáticamente los puestos de trabajo, las máquinas y equipos y en general, las instalaciones de la empresa.',
        evaluation: 'Verificar programa de inspecciones planeadas. Revisar informes de inspecciones realizadas a puestos de trabajo, maquinaria y equipos.',
        category: 'seguimiento',
        subcategory: 'Inspecciones',
    },
    {
        id: 'ad_17',
        code: 'RAD-17',
        name: 'Vigilancia de condiciones en ambientes de trabajo',
        description: 'Vigilar las condiciones en los ambientes de trabajo.',
        evaluation: 'Revisar mediciones higiénicas realizadas (ruido, iluminación, temperatura, polvos, etc.). Verificar seguimiento a las condiciones ambientales de los puestos de trabajo.',
        category: 'seguimiento',
        subcategory: 'Higiene Industrial',
    },
    {
        id: 'ad_18',
        code: 'RAD-18',
        name: 'Vigilancia de condiciones de salud de los trabajadores',
        description: 'Vigilar las condiciones de salud de los trabajadores.',
        evaluation: 'Revisar los resultados de las evaluaciones médicas ocupacionales. Verificar el seguimiento a los trabajadores con restricciones o recomendaciones médicas.',
        category: 'seguimiento',
        subcategory: 'Salud Ocupacional',
    },
    {
        id: 'ad_19',
        code: 'RAD-19',
        name: 'Actualización de identificación de peligros y evaluación de riesgos',
        description: 'Mantener actualizada la identificación de peligros, la evaluación y valoración de los riesgos.',
        evaluation: 'Verificar la fecha de la última actualización de la matriz de peligros y riesgos. Confirmar que se han revisado ante cambios en procesos o actividades.',
        category: 'seguimiento',
        subcategory: 'Gestión de Riesgos',
    },
    {
        id: 'ad_20',
        code: 'RAD-20',
        name: 'Notificación e investigación de accidentes, incidentes y enfermedades',
        description: 'Identificar la notificación y la investigación de incidentes, accidentes de trabajo y enfermedades laborales.',
        evaluation: 'Revisar estadísticas de ATEL del período. Verificar que todos los accidentes/incidentes se investigaron y se generaron planes de acción.',
        category: 'seguimiento',
        subcategory: 'ATEL',
    },
    {
        id: 'ad_21',
        code: 'RAD-21',
        name: 'Ausentismo laboral asociado a SST',
        description: 'Identificar ausentismo laboral por causas asociadas con seguridad y salud en el trabajo.',
        evaluation: 'Analizar indicadores de ausentismo (incapacidades por AT/EL). Identificar áreas o cargos con mayor ausentismo y sus causas relacionadas con SST.',
        category: 'seguimiento',
        subcategory: 'Ausentismo',
    },
    {
        id: 'ad_22',
        code: 'RAD-22',
        name: 'Pérdidas y daños a la propiedad relacionados con SST',
        description: 'Identificar pérdidas como daños a la propiedad, máquinas y equipos entre otros, relacionados con seguridad y salud en el trabajo.',
        evaluation: 'Revisar registro de daños a maquinaria, equipos e instalaciones durante el período. Cuantificar pérdidas económicas asociadas a SST.',
        category: 'seguimiento',
        subcategory: 'Pérdidas y Daños',
    },
    {
        id: 'ad_23',
        code: 'RAD-23',
        name: 'Deficiencias en la gestión de SST',
        description: 'Identificar deficiencias en la gestión de la seguridad y salud en el trabajo.',
        evaluation: 'Analizar los hallazgos de auditorías y revisiones anteriores. Identificar brechas y áreas de mejora en la gestión del SG-SST.',
        category: 'seguimiento',
        subcategory: 'Mejora Continua',
    },
    {
        id: 'ad_24',
        code: 'RAD-24',
        name: 'Efectividad de programas de rehabilitación de trabajadores',
        description: 'Identificar la efectividad de los programas de rehabilitación de la salud de los trabajadores.',
        evaluation: 'Revisar la ejecución de programas de rehabilitación. Evaluar el reintegro laboral de trabajadores en proceso de rehabilitación o con limitaciones.',
        category: 'seguimiento',
        subcategory: 'Salud Ocupacional',
    },
];

export const CATEGORY_TITLES: Record<string, string> = {
    insumos: 'I. INSUMOS DE LA REVISIÓN',
    revision: 'II. REVISIÓN Y DECISIONES',
    seguimiento: 'III. SEGUIMIENTO Y VIGILANCIA',
};

export const CATEGORY_COLORS: Record<string, string> = {
    insumos: 'border-teal-500 text-teal-600',
    revision: 'border-indigo-500 text-indigo-600',
    seguimiento: 'border-orange-500 text-orange-600',
};

export const GERENCIA_KEYWORDS = [
    'gerente',
    'representante legal',
    'director',
    'presidente',
    'ceo',
    'vicepresidente',
    'subgerente',
    'directora',
    'gerencia',
    'junta directiva',
    'copropietario',
    'administrador',
    'socios',
];

/**
 * Check if a cargo (position) corresponds to a manager/executive level
 */
export function isGerenciaRole(cargo: string): boolean {
    if (!cargo) return false;
    const lc = cargo.toLowerCase().trim();
    return GERENCIA_KEYWORDS.some(kw => lc.includes(kw));
}
