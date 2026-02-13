
import { NORMATIVE_FRAGMENTS } from './normativeTexts';

export interface AuditoriaItem {
    id: string;
    code: string;
    name: string;
    description: string;
    evaluation: string;
    category: 'planear' | 'hacer' | 'verificar' | 'actuar';
    subcategory: string;
    criteria: string;
    normativeText?: string;
}

export const AUDITORIA_ITEMS: AuditoriaItem[] = [
    // --- I. PLANEAR (Recursos) ---
    {
        id: 'aud_1_1_1',
        code: '1.1.1',
        name: 'Responsable del SG-SST',
        description: 'Se debe designar un responsable del SG-SST con licencia vigente en SST y curso de 50 horas.',
        evaluation: 'Verificar:\n1. Carta de Designación y Aceptación (Dec 1072).\n2. Licencia SST vigente y Certificado Res 4927.\n3. Curso 50h o Actualización 20h (Res 908 - Habilitante).\n4. Consulta Antecedentes (RUES/Mi Seguridad Social - Circ 0047).\n5. Vinculación real (Cruce DIAN/PILA).\n\nIdoneidad (Res 0312):\n- <10 (I-III): Técnico + 1 año.\n- 11-50 (I-III): Tecnólogo + 2 años.\n- >50/IV-V: Profesional/Esp.',
        category: 'planear',
        subcategory: 'Recursos',
        criteria: 'Res 0312/19: E1.1.1 | Dec 1072/15: 2.2.4.6.8 (Obligaciones) | Circ 0047/25 | Res 908/25',
        normativeText: NORMATIVE_FRAGMENTS.RESPONSABLE_SST_2025
    },
    {
        id: 'aud_1_1_2',
        code: '1.1.2',
        name: 'Responsabilidades en el SG-SST',
        description: 'Deben estar definidas y asignadas las responsabilidades en SST a todos los niveles.',
        evaluation: 'Verificar:\n1. Manual de Funciones/Matriz SST (Soporte Documental).\n2. Cartas de Asignación Individual.\n3. Registros de Socialización (Res 3461 - Verificable).\n4. Acta de Rendición de Cuentas Anual.\n\nNiveles:\n- Alta Dirección: Recursos, Revisión, Rendición Cuentas.\n- Resp SST: Diseño, Ejecución, Reporte.\n- Jefes: Reporte Actos/Condiciones, EPP.\n- Trabajadores: Autocuidado, Informar Salud.\n- COPASST: Vigilancia.',
        category: 'planear',
        subcategory: 'Recursos',
        criteria: 'Res 0312/19: E1.1.2 | Dec 1072/15: 2.2.4.6.8 (Num 2 - Responsabilidades) | Res 3461/25 | Ley 2050/20',
        normativeText: NORMATIVE_FRAGMENTS.RESPONSABILIDADES_SST_2025
    },
    {
        id: 'aud_1_1_3',
        code: '1.1.3',
        name: 'Asignación de recursos para el SG-SST',
        description: 'Se deben asignar recursos financieros, técnicos, humanos y de otra índole.',
        evaluation: 'Verificar:\n1. Presupuesto Firmado (Rep Legal).\n2. Ejecución Presupuestal (Facturas/Soportes).\n3. Rubro Exámenes Médicos (Crítico).\n4. Cruce con Rendición de Cuentas (Asignado vs Ejecutado).\n\nRecursos:\n- Financieros: Presupuesto desglosado.\n- Humanos: Resp SST, Comités.\n- Técnicos: Software, Equipos, Emergencias.\n- Físicos: Espacios reunión/capacitación.',
        category: 'planear',
        subcategory: 'Recursos',
        criteria: 'Res 0312/19: E1.1.3 | Dec 1072/15: 2.2.4.6.8 (Num 4 - Presupuesto y Ejecución)',
        normativeText: NORMATIVE_FRAGMENTS.RECURSOS_SST_DETALLE
    },
    {
        id: 'aud_1_1_4',
        code: '1.1.4',
        name: 'Afiliación al Sistema General de Riesgos Laborales',
        description: 'Todos los trabajadores deben estar afiliados al SGRL.',
        evaluation: 'Verificar:\n1. Soportes de Afiliación (Formularios).\n2. Planilla PILA (Cruce Nómina vs PILA - IBC/Riesgo).\n3. Certificado de Vigencia (Activos).\n\nAlcance (Binario: Todo/Nada):\n- Dependientes.\n- Contratistas (>1 mes).\n- Estudiantes (Dec 055).\n- Misión.\n\nNota: Afiliación min 1 día antes inicio labores.',
        category: 'planear',
        subcategory: 'Recursos',
        criteria: 'Res 0312/19: E1.1.4 | Dec 1072/15: 2.2.4.2.2 (Afiliación) | Ley 1562/12 | Cobertura Total',
        normativeText: NORMATIVE_FRAGMENTS.AFILIACION_SGRL_DETALLE
    },
    {
        id: 'aud_1_1_5',
        code: '1.1.5',
        name: 'Pago de pensión de trabajadores de alto riesgo',
        description: 'Se debe realizar el pago de pensión especial para trabajadores de alto riesgo.',
        evaluation: 'Verificar:\n1. Identificación de cargos.\n2. PILA con cotización especial (+10 pts).\n3. Historial pagos.\n\nActividades (Dec 2090):\n- Minería socavón.\n- Altas temperaturas.\n- Radiaciones.\n- Cancerígenos.\n- Control Aéreo.\n- Bomberos.\n- INPEC.',
        category: 'planear',
        subcategory: 'Recursos',
        criteria: 'Res 0312/19: E1.1.5 | Dec 2090/03 (Alto Riesgo)',
        normativeText: NORMATIVE_FRAGMENTS.PENSION_ALTO_RIESGO
    },
    {
        id: 'aud_1_1_6',
        code: '1.1.6',
        name: 'Conformación del COPASST',
        description: 'Debe estar conformado el COPASST con representantes del empleador y trabajadores.',
        evaluation: 'Verificar:\n1. Actas convocatoria/elección.\n2. Acta constitución.\n3. Registro votación.\n4. Designación vigía.\n\nTabla Res 2013:\n- 10-49: 1 Rep.\n- 50-499: 2 Rep.\n- 500-999: 3 Rep.\n- 1000+: 4 Rep.',
        category: 'planear',
        subcategory: 'Recursos',
        criteria: 'Res 0312/19: E1.1.6 | Dec 1072/15: 2.2.4.6.2 (Parágrafo 2) | Res 2013/86 | Dec 1295/94 (Vigía)',
        normativeText: NORMATIVE_FRAGMENTS.CONFORMACION_COPASST
    },
    {
        id: 'aud_1_1_6_riesgos',
        code: '1.1.6.1',
        name: ' > Validación Matriz de Riesgos',
        description: 'El COPASST debe participar en la actualización de la Matriz de Peligros (GTC 45) y conocerla a fondo para validar si los controles propuestos son reales y efectivos.',
        evaluation: 'Verificar actas donde conste la revisión y validación de la matriz.',
        category: 'planear',
        subcategory: 'Conformación del COPASST (Detalle)',
        criteria: 'Dec 1072/15: 2.2.4.6.15 (Identificación de Peligros)',
        normativeText: NORMATIVE_FRAGMENTS.COPASST_MATRIZ_PELIGROS
    },
    {
        id: 'aud_1_1_6_at',
        code: '1.1.6.2',
        name: ' > Investigación de Accidentes',
        description: 'Participación obligatoria de un representante del COPASST en el equipo investigador de todos los incidentes y accidentes, dentro de los 15 días siguientes (Res 1401).',
        evaluation: 'Verificar firmas del COPASST en los informes de investigación de AT.',
        category: 'planear',
        subcategory: 'Conformación del COPASST (Detalle)',
        criteria: 'Res 1401/07 (Art 4 - Equipo Investigador)',
        normativeText: NORMATIVE_FRAGMENTS.COPASST_INVESTIGACION_AT
    },
    {
        id: 'aud_1_1_6_inspecciones',
        code: '1.1.6.3',
        name: ' > Informes de Inspección',
        description: 'El COPASST debe realizar inspecciones y conocer los informes para vigilar la gestión de hallazgos y acciones preventivas/correctivas.',
        evaluation: 'Verificar informes de inspección realizados o revisados por el COPASST.',
        category: 'planear',
        subcategory: 'Conformación del COPASST (Detalle)',
        criteria: 'Res 2013/86 (Art 11)',
        normativeText: NORMATIVE_FRAGMENTS.COPASST_INSPECCIONES
    },
    {
        id: 'aud_1_1_6_cambio',
        code: '1.1.6.4',
        name: ' > Gestión del Cambio',
        description: 'El empleador debe comunicar cambios en procesos o maquinaria antes de su implementación para que el COPASST evalúe los nuevos riesgos.',
        evaluation: 'Verificar actas de socialización de cambios proyectados y su evaluación.',
        category: 'planear',
        subcategory: 'Conformación del COPASST (Detalle)',
        criteria: 'Dec 1072/15: 2.2.4.6.26 (Gestión del Cambio)',
        normativeText: NORMATIVE_FRAGMENTS.COPASST_GESTION_CAMBIO
    },
    {
        id: 'aud_1_1_6_auditoria',
        code: '1.1.6.5',
        name: ' > Auditoría Anual',
        description: 'El COPASST debe participar en la planificación de la auditoría y conocer los resultados (no conformidades) para apoyar el plan de mejoramiento.',
        evaluation: 'Verificar participación en planificación y socialización de resultados de auditoría.',
        category: 'planear',
        subcategory: 'Conformación del COPASST (Detalle)',
        criteria: 'Dec 1072/15: 2.2.4.6.29 (Auditoría)',
        normativeText: NORMATIVE_FRAGMENTS.COPASST_AUDITORIA
    },
    {
        id: 'aud_1_1_7',
        code: '1.1.7',
        name: 'Capacitación del COPASST',
        description: 'Los integrantes del COPASST deben estar capacitados para cumplir sus funciones.',
        evaluation: 'Verificar:\n1. Plan de capacitación (temas específicos).\n2. Registros asistencia.\n3. Certificados ARL.\n\nTemas Clave:\n- GTC 45 (Peligros).\n- Res 1401 (Investigación).\n- Inspecciones.\n- Curso 50h.',
        category: 'planear',
        subcategory: 'Recursos',
        criteria: 'Res 0312/19: E1.1.7 | Dec 1072/15: 2.2.4.6.11 (Capacitación) | Res 2013/86 | Dec 1295/94 (ARL)',
        normativeText: NORMATIVE_FRAGMENTS.CAPACITACION_COPASST
    },
    {
        id: 'aud_1_1_7_investigacion',
        code: '1.1.7.1',
        name: ' > Inv. Accidentes (Metodología)',
        description: 'Capacitación obligatoria en metodología de investigación de accidentes (árbol de causas, 5 por qués) bajo Res 1401/07.',
        evaluation: 'Verificar certificados de capacitación en Investigación de AT para el COPASST.',
        category: 'planear',
        subcategory: 'Capacitación COPASST (Detalle)',
        criteria: 'Res 1401/07 (Art 4 - Metodología)',
        normativeText: NORMATIVE_FRAGMENTS.CAP_COPASST_INVESTIGACION
    },
    {
        id: 'aud_1_1_7_inspecciones',
        code: '1.1.7.2',
        name: ' > Inspecciones de Seguridad',
        description: 'Formación en técnicas para la identificación de actos y condiciones inseguras en los puestos de trabajo.',
        evaluation: 'Verificar entrenamiento en realización de inspecciones y uso de listas de chequeo.',
        category: 'planear',
        subcategory: 'Capacitación COPASST (Detalle)',
        criteria: 'Res 2013/86 (Art 11 - Lit b)',
        normativeText: NORMATIVE_FRAGMENTS.CAP_COPASST_INSPECCIONES
    },
    {
        id: 'aud_1_1_7_peligros',
        code: '1.1.7.3',
        name: ' > Identificación de Peligros',
        description: 'Conocimiento de metodologías como la GTC 45 para validar los controles propuestos por la empresa.',
        evaluation: 'Verificar capacitación en identificación de peligros y valoración de riesgos.',
        category: 'planear',
        subcategory: 'Capacitación COPASST (Detalle)',
        criteria: 'Dec 1072/15: 2.2.4.6.15 (Identificación de Peligros)',
        normativeText: NORMATIVE_FRAGMENTS.CAP_COPASST_PELIGROS
    },
    {
        id: 'aud_1_1_7_funciones',
        code: '1.1.7.4',
        name: ' > Funciones y Responsabilidades',
        description: 'Taller sobre los alcances legales, rol de veeduría y funcionamiento definido en la Resolución 2013 de 1986.',
        evaluation: 'Verificar registro de capacitación en funciones del COPASST.',
        category: 'planear',
        subcategory: 'Capacitación COPASST (Detalle)',
        criteria: 'Res 2013/86 (Art 11 - Funciones)',
        normativeText: NORMATIVE_FRAGMENTS.CAP_COPASST_FUNCIONES
    },
    {
        id: 'aud_1_1_8',
        code: '1.1.8',
        name: 'Conformación del Comité de Convivencia (Actualizado 2025)',
        description: 'Debe estar conformado el Comité de Convivencia Laboral según nueva normativa.',
        evaluation: 'Verificar:\n1. Acta conformación (paritaria).\n2. Acta designación empleador / elección trab.\n3. Reuniones trimestrales (Res 652/1356).\n4. Confidencialidad.\n\nFunciones:\n- Recibir quejas.\n- Escuchar partes.\n- Espacios diálogo.\n- Seguimiento.',
        category: 'planear',
        subcategory: 'Recursos',
        criteria: 'Res 0312/19: E1.1.8 | Res 3461/25 (Conformación y Funcionamiento)',
        normativeText: NORMATIVE_FRAGMENTS.RES_3461_2025_CONVIVENCIA
    },
    {
        id: 'aud_1_1_8_normativa',
        code: '1.1.8.1',
        name: ' > Nuevo Marco Normativo',
        description: 'Capacitación obligatoria sobre el funcionamiento del comité según Res 3461/25 y la derogación de la Res 652.',
        evaluation: 'Verificar socialización de la nueva norma de convivencia laboral.',
        category: 'planear',
        subcategory: 'Comité Convivencia (Detalle)',
        criteria: 'Res 3461/25 (Art 8 - Capacitación)',
        normativeText: NORMATIVE_FRAGMENTS.CAP_CCL_NORMATIVA
    },
    {
        id: 'aud_1_1_8_acoso',
        code: '1.1.8.2',
        name: ' > Acoso Laboral',
        description: 'Definición clara de conductas que constituyen acoso y aquellas que no, para evitar trámites innecesarios.',
        evaluation: 'Verificar capacitación en Ley 1010 de 2006.',
        category: 'planear',
        subcategory: 'Comité Convivencia (Detalle)',
        criteria: 'Ley 1010/06 (Art 2 y 7 - Definición y Modalidades)',
        normativeText: NORMATIVE_FRAGMENTS.CAP_CCL_ACOSO_LABORAL
    },
    {
        id: 'aud_1_1_8_conflictos',
        code: '1.1.8.3',
        name: ' > Resolución de Conflictos',
        description: 'Herramientas de comunicación asertiva, negociación y mediación para manejar las quejas internas.',
        evaluation: 'Verificar taller de habilidades blandas/resolución de conflictos para el comité.',
        category: 'planear',
        subcategory: 'Comité Convivencia (Detalle)',
        criteria: 'Res 3461/25 (Art 9 - Resolución Conflictos)',
        normativeText: NORMATIVE_FRAGMENTS.CAP_CCL_CONFLICTOS
    },
    {
        id: 'aud_1_1_8_sexual',
        code: '1.1.8.4',
        name: ' > Acoso Sexual',
        description: 'Formación específica para entender que el comité NO tiene competencia en acoso sexual y debe remitir a la ruta legal.',
        evaluation: 'Verificar capacitación sobre protocolo de acoso sexual y límites del CCL.',
        category: 'planear',
        subcategory: 'Comité Convivencia (Detalle)',
        criteria: 'Ley 2365/24',
        normativeText: NORMATIVE_FRAGMENTS.CAP_CCL_ACOSO_SEXUAL
    },
    {
        id: 'aud_1_1_8_psicosocial',
        code: '1.1.8.5',
        name: ' > Sensibilización Riesgo Psicosocial',
        description: 'Entender los factores intralaborales y extralaborales que afectan el clima laboral y la salud mental.',
        evaluation: 'Verificar formación en factores de riesgo psicosocial.',
        category: 'planear',
        subcategory: 'Comité Convivencia (Detalle)',
        criteria: 'Res 2764/22 (Art 4 - Batería Instrumentos)',
        normativeText: NORMATIVE_FRAGMENTS.CAP_CCL_RIESGO_PSICOSOCIAL
    },
    {
        id: 'aud_1_1_8_etica',
        code: '1.1.8.6',
        name: ' > Ética y Confidencialidad',
        description: 'Taller sobre el manejo de información sensible, protección de datos y garantías del debido proceso.',
        evaluation: 'Verificar compromisos de confidencialidad y capacitación ética.',
        category: 'planear',
        subcategory: 'Comité Convivencia (Detalle)',
        criteria: 'Ley 1010/06',
        normativeText: NORMATIVE_FRAGMENTS.CAP_CCL_ETICA
    },
    {
        id: 'aud_ley_2365', // ADICIONAL
        code: 'Norma Adicional',
        name: 'Prevención Acoso Sexual',
        description: 'Implementación de medidas de prevención del acoso sexual laboral (Ley 2365/24).',
        evaluation: 'Verificar protocolos del Comité de Convivencia específicos para acoso sexual y divulgación de la Ley 2365.',
        category: 'planear',
        subcategory: 'Recursos',
        criteria: 'Ley 2365/24 | Res 3461/25',
        normativeText: NORMATIVE_FRAGMENTS.LEY_2365_ACOSO_SEXUAL
    },
    // Capacitación
    {
        id: 'aud_1_2_1',
        code: '1.2.1',
        name: 'Programa de capacitación en promoción y prevención',
        description: 'Debe existir un programa de capacitación anual en promoción y prevención.',
        evaluation: 'Verificar programa de capacitación documentado con temas, fechas, responsables y recursos.',
        category: 'planear',
        subcategory: 'Capacitación en el SG-SST',
        criteria: 'Res 0312/19: E1.2.1 | Dec 1072/15: 2.2.4.6.11 (Capacitación)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_11_CAPACITACION
    },
    {
        id: 'aud_1_2_2',
        code: '1.2.2',
        name: 'Capacitación, inducción y reinducción en SG-SST',
        description: 'Todos los trabajadores deben recibir inducción y reinducción en SST.',
        evaluation: 'Verificar registros de inducción y reinducción de todos los trabajadores.',
        category: 'planear',
        subcategory: 'Capacitación en el SG-SST',
        criteria: 'Res 0312/19: E1.2.2 | Dec 1072/15: 2.2.4.6.11 (Capacitación)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_11_CAPACITACION
    },
    {
        id: 'aud_1_2_3',
        code: '1.2.3',
        name: 'Responsables del SG-SST con curso virtual de 50 horas',
        description: 'Los responsables del SG-SST deben contar con el curso virtual de 50 horas.',
        evaluation: 'Verificar certificado del curso de 50 horas de los responsables del SG-SST.',
        category: 'planear',
        subcategory: 'Capacitación en el SG-SST',
        criteria: 'Res 0312/19: E1.2.3 | Res 4927/16 | Circ 0047/25 (Actualización)',
        normativeText: NORMATIVE_FRAGMENTS.RES_4927_2016_CURSO + '\n\n' + NORMATIVE_FRAGMENTS.CIRCULAR_0047_2025_ACTUALIZACION
    },

    // --- GESTIÓN INTEGRAL ---
    // Política
    {
        id: 'aud_2_1_1',
        code: '2.1.1',
        name: 'Política del SG-SST firmada, fechada y comunicada',
        description: 'Debe existir una política de SST documentada, firmada y comunicada.',
        evaluation: 'Verificar política firmada por el representante legal, fechada, publicada y comunicada.',
        category: 'planear',
        subcategory: 'Política de SST',
        criteria: 'Res 0312/19: E2.1.1 | Dec 1072/15: 2.2.4.6.5, .6 y .7 (Política)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_5_POLITICA
    },
    {
        id: 'aud_pol_spa', // ADICIONAL SPA (1986/2009/2016)
        code: 'Norma Adicional',
        name: 'Política de Prevención de Consumo de SPA',
        description: 'Política de prevención de alcohol, drogas y tabaquismo (Res 1016/86, Ley 1335/09).',
        evaluation: 'Verificar política escrita. Debe incluir prohibición consumo (Ley 1335) y enfoque preventivo (Sent C-636/16).',
        category: 'planear',
        subcategory: 'Política de SST',
        criteria: 'Res 1016/86 (Art 10) | Ley 1335/09 (Art 19) | CST Art 60 | Sent C-636/16',
        normativeText: NORMATIVE_FRAGMENTS.POLITICA_CONSUMO_SPA
    },
    {
        id: 'aud_pol_acoso', // ADICIONAL ACOSO (2006)
        code: 'Norma Adicional',
        name: 'Política de Prevención del Acoso Laboral',
        description: 'Política para prevenir y corregir el acoso laboral (Ley 1010/06).',
        evaluation: 'Verificar existencia de la política y coherencia con el Comité de Convivencia.',
        category: 'planear',
        subcategory: 'Política de SST',
        criteria: 'Ley 1010/06 (Art 9) | Res 2646/08 (Art 14)',
        normativeText: NORMATIVE_FRAGMENTS.POLITICA_ACOSO_LABORAL
    },
    {
        id: 'aud_pol_vial', // ADICIONAL VIAL (2011)
        code: 'Norma Adicional',
        name: 'Política de Seguridad Vial',
        description: 'Política de seguridad vial para prevenir siniestros (Ley 1503/11).',
        evaluation: 'Verificar política de seguridad vial alineada al PESV (si aplica).',
        category: 'planear',
        subcategory: 'Política de SST',
        criteria: 'Ley 1503/11 | Res 20223040040595/22',
        normativeText: NORMATIVE_FRAGMENTS.POLITICA_SEGURIDAD_VIAL
    },
    {
        id: 'aud_pol_datos', // ADICIONAL DATOS (2012)
        code: 'Norma Adicional',
        name: 'Política de Tratamiento de Datos Personales',
        description: 'Política de protección de datos personales (Ley 1581/12).',
        evaluation: 'Verificar política de privacidad y autorizaciones de tratamiento de datos manuscritas/digitales.',
        category: 'planear',
        subcategory: 'Política de SST',
        criteria: 'Ley 1581/12 (Art 9) | Dec 1377/13 (Art 10)',
        normativeText: NORMATIVE_FRAGMENTS.POLITICA_DATOS_PERSONALES
    },
    {
        id: 'aud_ley_2191', // ADICIONAL DESCONEXION (2022)
        code: 'Norma Adicional',
        name: 'Política de Desconexión Laboral',
        description: 'Política y regulación de la desconexión laboral (Ley 2191/22).',
        evaluation: 'Verificar existencia de la política de desconexión laboral aprobada y divulgada.',
        category: 'planear',
        subcategory: 'Política de SST',
        criteria: 'Ley 2191/22 (Art 3 - Derecho Desconexión)',
        normativeText: NORMATIVE_FRAGMENTS.LEY_2191_DESCONEXION
    },
    {
        id: 'aud_pol_mental', // ADICIONAL SALUD MENTAL (2025)
        code: 'Norma Adicional',
        name: 'Política de Salud Mental y Bienestar',
        description: 'Política de promoción de la salud mental y bienestar integral (Ley 2460/25).',
        evaluation: 'Verificar inclusión de principios de salud mental y prevención de trastornos en las políticas.',
        category: 'planear',
        subcategory: 'Política de SST',
        criteria: 'Ley 2460/25',
        normativeText: NORMATIVE_FRAGMENTS.POLITICA_SALUD_MENTAL_2025
    },
    // Objetivos
    {
        id: 'aud_2_2_1',
        code: '2.2.1',
        name: 'Objetivos definidos, claros, medibles y cuantificables',
        description: 'Los objetivos del SG-SST deben ser definidos, claros, medibles y cuantificables.',
        evaluation: 'Verificar que los objetivos cumplan las características y estén alineados con las prioridades.',
        category: 'planear',
        subcategory: 'Objetivos de la política de SST',
        criteria: 'Res 0312/19: E2.2.1 | Dec 1072/15: 2.2.4.6.18 (Objetivos)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_18_OBJETIVOS
    },
    // Evaluación Inicial
    {
        id: 'aud_2_3_1',
        code: '2.3.1',
        name: 'Evaluación inicial del SG-SST e identificación de prioridades',
        description: 'Debe realizarse una evaluación inicial del SG-SST.',
        evaluation: 'Verificar documento de evaluación inicial con identificación de prioridades.',
        category: 'planear',
        subcategory: 'Evaluación inicial del SG-SST',
        criteria: 'Res 0312/19: E2.3.1 | Dec 1072/15: 2.2.4.6.16 (Evaluación Inicial)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_16_EVAL_INICIAL
    },
    // Plan Anual
    {
        id: 'aud_2_4_1',
        code: '2.4.1',
        name: 'Plan de trabajo anual',
        description: 'Debe existir un plan de trabajo anual firmado por el empleador.',
        evaluation: 'Verificar plan de trabajo con metas, responsables, recursos, cronograma y firmado.',
        category: 'planear',
        subcategory: 'Plan anual de trabajo',
        criteria: 'Res 0312/19: E2.4.1 | Dec 1072/15: 2.2.4.6.8 (Obligación 7)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_8_OBLIGACIONES
    },
    // Archivo
    {
        id: 'aud_2_5_1',
        code: '2.5.1',
        name: 'Archivo y retención documental del SG-SST',
        description: 'Deben conservarse los documentos del SG-SST de forma ordenada.',
        evaluation: 'Verificar sistema de archivo y conservación de documentos del SG-SST.',
        category: 'planear',
        subcategory: 'Conservación de la documentación',
        criteria: 'Res 0312/19: E2.5.1 | Dec 1072/15: Arts 12 y 13 (Doc. y Conservación)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_12_DOCUMENTACION
    },
    // Rendición Cuentas
    {
        id: 'aud_2_6_1',
        code: '2.6.1',
        name: 'Rendición de cuentas sobre el desempeño',
        description: 'Debe existir rendición de cuentas anual sobre el desempeño del SG-SST.',
        evaluation: 'Verificar registros de rendición de cuentas de quienes tienen responsabilidades en SST.',
        category: 'planear',
        subcategory: 'Rendición de cuentas',
        criteria: 'Res 0312/19: E2.6.1 | Dec 1072/15: Arts 8, 12 y 31 (Rendición y Revisión)',
        normativeText: NORMATIVE_FRAGMENTS.RENDICION_CUENTAS_DETALLE
    },
    // Matriz Legal
    {
        id: 'aud_2_7_1',
        code: '2.7.1',
        name: 'Matriz legal actualizada',
        description: 'Debe existir una matriz legal actualizada con la normatividad aplicable.',
        evaluation: 'Verificar matriz legal actualizada con normas aplicables a la empresa.',
        category: 'planear',
        subcategory: 'Normatividad vigente',
        criteria: 'Res 0312/19: E2.7.1 | Dec 1072/15: 2.2.4.6.12 (Documentación)',
        normativeText: NORMATIVE_FRAGMENTS.MATRIZ_LEGAL_DETALLE
    },
    // Comunicación
    {
        id: 'aud_2_8_1',
        code: '2.8.1',
        name: 'Mecanismos de comunicación interna y externa',
        description: 'Deben existir mecanismos de comunicación sobre temas de SST.',
        evaluation: 'Verificar mecanismos de comunicación definidos y funcionando.',
        category: 'planear',
        subcategory: 'Comunicación',
        criteria: 'Res 0312/19: E2.8.1 | Dec 1072/15: 2.2.4.6.14 (Comunicación)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_14_COMUNICACION
    },
    // Adquisiciones
    {
        id: 'aud_2_9_1',
        code: '2.9.1',
        name: 'Procedimiento de adquisiciones con criterios de SST',
        description: 'Debe existir un procedimiento que incluya criterios de SST para adquisiciones.',
        evaluation: 'Verificar procedimiento de adquisiciones que contemple aspectos de SST.',
        category: 'planear',
        subcategory: 'Adquisiciones',
        criteria: 'Res 0312/19: E2.9.1 | Dec 1072/15: 2.2.4.6.27 (Adquisiciones)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_27_ADQUISICIONES
    },
    // Contratación
    {
        id: 'aud_2_10_1',
        code: '2.10.1',
        name: 'Evaluación y selección de contratistas y proveedores',
        description: 'Debe existir procedimiento de evaluación de contratistas en SST.',
        evaluation: 'Verificar procedimiento de evaluación de contratistas que incluya aspectos de SST.',
        category: 'planear',
        subcategory: 'Contratación',
        criteria: 'Res 0312/19: E2.10.1 | Dec 1072/15: 2.2.4.6.28 (Contratación)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_28_CONTRATACION
    },
    // Gestión Cambio
    {
        id: 'aud_2_11_1',
        code: '2.11.1',
        name: 'Evaluación del impacto de cambios internos y externos',
        description: 'Debe existir procedimiento para evaluar el impacto de cambios sobre SST.',
        evaluation: 'Verificar procedimiento de gestión del cambio documentado.',
        category: 'planear',
        subcategory: 'Gestión del cambio',
        criteria: 'Res 0312/19: E2.11.1 | Dec 1072/15: 2.2.4.6.26 (Gestión Cambio)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_26_CAMBIO
    },
    {
        id: 'aud_reg_higiene',
        code: 'Norma Adicional',
        name: 'Reglamento de Higiene y Seguridad Industrial',
        description: 'Obligación de elaborar y publicar el reglamento de higiene y seguridad (CST Art 349).',
        evaluation: 'Verificar reglamento publicado en dos lugares visibles (10 o más trabajadores).',
        category: 'planear',
        subcategory: 'Reglamentos y Normativa Adicional',
        criteria: 'CST Art 349 (Obligación) | CST Art 350 (Publicación)',
        normativeText: NORMATIVE_FRAGMENTS.REGLAMENTO_HIGIENE_DETALLE
    },
    {
        id: 'aud_reg_rit',
        code: 'Norma Adicional',
        name: 'Reglamento Interno de Trabajo (RIT)',
        description: 'Obligación de adoptar el RIT según número de trabajadores (CST Art 105).',
        evaluation: 'Verificar existencia y publicacion del RIT con contenido mínimo de ley.',
        category: 'planear',
        subcategory: 'Reglamentos y Normativa Adicional',
        criteria: 'CST Art 105 (Obligados) | CST Art 108 (Contenido)',
        normativeText: NORMATIVE_FRAGMENTS.REGLAMENTO_INTERNO_DETALLE
    },


    // --- II. HACER ---
    // Condiciones Salud
    {
        id: 'aud_3_1_1',
        code: '3.1.1',
        name: 'Descripción sociodemográfica y Diagnóstico de condiciones de salud',
        description: 'Documento consolidado con la información sociodemográfica y el diagnóstico de salud de la población trabajadora.',
        evaluation: 'Verificar documento de evaluación médica ocupacional (Sociodemográfico y Diagnóstico).',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        criteria: 'Res 0312/19: E3.1.1 | Dec 1072/15: 2.2.4.6.16 (Evaluación Inicial) | Res 1843/25',
        normativeText: NORMATIVE_FRAGMENTS.DIAGNOSTICO_CONDICIONES_SALUD
    },
    {
        id: 'aud_3_1_1_desc',
        code: '3.1.1.1',
        name: ' > Descripción Sociodemográfica',
        description: 'Documento con la información sociodemográfica actualizada de la población trabajadora (Edad, Sexo, Escolaridad, Estado Civil, etc.).',
        evaluation: 'Verificar documento de perfil sociodemográfico actualizado anualmente.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        criteria: 'Res 0312/19: E3.1.1 | Dec 1072/15: 2.2.4.6.16 (Num 7 - Sociodemográfica) | Res 1843/25',
        normativeText: NORMATIVE_FRAGMENTS.DX_SOCIODEMOGRAFICO
    },
    {
        id: 'aud_3_1_1_diag',
        code: '3.1.1.2',
        name: ' > Diagnóstico de condiciones de salud',
        description: 'Diagnóstico de salud de la población trabajadora (morbimortalidad sentida y biológica).',
        evaluation: 'Verificar documento de diagnóstico de condiciones de salud actualizado anualmente.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        criteria: 'Res 0312/19: E3.1.1 | Dec 1072/15: 2.2.4.6.16 (Diagnóstico) | Res 1843/25',
        normativeText: NORMATIVE_FRAGMENTS.DX_CONDICIONES_SALUD
    },
    {
        id: 'aud_3_1_2',
        code: '3.1.2',
        name: 'Actividades de promoción y prevención en salud',
        description: 'Deben desarrollarse actividades de promoción y prevención.',
        evaluation: 'Verificar registros y evidencias de actividades de promoción y prevención.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        criteria: 'Res 0312/19: E3.1.2 | Dec 1072/15: 2.2.4.6.24 (Medidas de Prevención) | Res 1843/25',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_24_MEDIDAS + '\n\n' + NORMATIVE_FRAGMENTS.RES_1843_2025_MEDICAS
    },
    {
        id: 'aud_3_1_3',
        code: '3.1.3',
        name: 'Información al médico de perfiles de cargo',
        description: 'Se debe informar al médico los perfiles de cargo para evaluaciones.',
        evaluation: 'Verificar suministro de **Profesiograma** (descripción de tareas y factores de riesgo) al médico especialista.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        criteria: 'Res 0312/19: E3.1.3 | Res 1843/25 (Profesiograma)',
        normativeText: NORMATIVE_FRAGMENTS.RES_1843_2025_MEDICAS
    },
    {
        id: 'aud_3_1_4',
        code: '3.1.4',
        name: 'Realización de evaluaciones médicas',
        description: 'Deben realizarse evaluaciones médicas (Preingreso, Periódicas, Egreso, Post-incapacidad).',
        evaluation: 'Verificar certificados de evaluaciones médicas según profesiograma y Res 1843.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        criteria: 'Res 0312/19: E3.1.4 | Res 1843/25 (Deroga Res 2346)',
        normativeText: NORMATIVE_FRAGMENTS.RES_1843_2025_MEDICAS
    },
    {
        id: 'aud_3_1_5',
        code: '3.1.5',
        name: 'Custodia de historias clínicas',
        description: 'Las historias clínicas ocupacionales deben estar custodiadas por IPS (Res 1843/25).',
        evaluation: 'Verificar documento que garantice la custodia de historias clínicas.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        criteria: 'Res 0312/19: E3.1.5 | Dec 1072/15: Arts 12 y 13 (Conservación) | Res 1843/25',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_12_DOCUMENTACION + '\n\n' + NORMATIVE_FRAGMENTS.RES_1843_2025_MEDICAS
    },
    {
        id: 'aud_3_1_6',
        code: '3.1.6',
        name: 'Restricciones y recomendaciones médicas',
        description: 'Se deben cumplir las restricciones y recomendaciones médico laborales.',
        evaluation: 'Verificar seguimiento a recomendaciones y restricciones médicas.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        criteria: 'Res 0312/19: E3.1.6 | Res 1843/25 (Art 5 lit f)',
        normativeText: NORMATIVE_FRAGMENTS.RES_1843_RESTRICCIONES
    },
    {
        id: 'aud_3_1_7',
        code: '3.1.7',
        name: 'Estilos de vida y entornos de trabajo saludable',
        description: 'Se deben desarrollar programas de estilos de vida saludable.',
        evaluation: 'Verificar programa de estilos de vida saludable documentado y ejecutado.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        criteria: 'Res 0312/19: E3.1.7 | Dec 1072/15: 2.2.4.6.24 (Medidas de Prevención) | Ley 1355/09 | Res 3461/25',
        normativeText: NORMATIVE_FRAGMENTS.ESTILOS_VIDA_SALUDABLE
    },
    {
        id: 'aud_3_1_8',
        code: '3.1.8',
        name: 'Agua potable, servicios sanitarios y disposición de basuras',
        description: 'Debe garantizarse agua potable, servicios sanitarios y manejo de basuras.',
        evaluation: 'Verificar condiciones de agua potable, servicios sanitarios y manejo de residuos.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        criteria: 'Res 0312/19: E3.1.8 | Dec 1072/15: 2.2.4.6.24 (Medidas de Prevención) | Res 2400/79',
        normativeText: NORMATIVE_FRAGMENTS.SERVICIOS_BASICOS_DETALLE
    },
    {
        id: 'aud_3_1_9',
        code: '3.1.9',
        name: 'Eliminación adecuada de residuos',
        description: 'Debe existir manejo adecuado de residuos sólidos, líquidos y gaseosos.',
        evaluation: 'Verificar plan de manejo de residuos según normatividad ambiental.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        criteria: 'Res 0312/19: E3.1.9 | Dec 1072/15: 2.2.4.6.24 (Medidas de Prevención) | Res 2184/19 | Dec 4741/05',
        normativeText: NORMATIVE_FRAGMENTS.GESTION_RESIDUOS_DETALLE + '\n\n' + NORMATIVE_FRAGMENTS.DEC_1072_ART_8_OBLIGACIONES
    },
    {
        id: 'aud_reporte_min',
        code: '3.1.10',
        name: 'Reporte de accidentes de trabajo y hostigamientos al MinTrabajo',
        description: 'Se deben reportar al Ministerio del Trabajo los accidentes graves y mortales, así como las enfermedades laborales.',
        evaluation: 'Verificar reportes realizados a la Dirección Territorial del Ministerio del Trabajo.',
        category: 'hacer',
        subcategory: 'Condiciones de salud en el trabajo',
        criteria: 'Res 1401/07 (Graves/Mortales) | Dec 1072/15',
        normativeText: NORMATIVE_FRAGMENTS.REPORTE_MINTRABAJO_DETALLE
    },

    // Registro Reporte ATEL
    {
        id: 'aud_3_2_1',
        code: '3.2.1',
        name: 'Reporte de accidentes de trabajo a la ARL',
        description: 'Se deben reportar los accidentes de trabajo a la ARL dentro de 2 días hábiles.',
        evaluation: 'Verificar reportes de accidentes de trabajo dentro de los 2 días hábiles.',
        category: 'hacer',
        subcategory: 'Registro, reporte e investigación de ATEL',
        criteria: 'Res 0312/19: E3.2.1 | Dec 1072/15: 2.2.4.6.32 (Investigación y Reporte)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_32_REPORTE
    },
    {
        id: 'aud_3_2_2',
        code: '3.2.2',
        name: 'Investigación de accidentes, incidentes y enfermedades',
        description: 'Deben investigarse los accidentes, incidentes y enfermedades laborales.',
        evaluation: 'Verificar metodología e informes de investigación de ATEL.',
        category: 'hacer',
        subcategory: 'Registro, reporte e investigación de ATEL',
        criteria: 'Res 0312/19: E3.2.2 | Dec 1072/15: 2.2.4.6.32 (Investigación) | Res 1401/07',
        normativeText: NORMATIVE_FRAGMENTS.INVESTIGACION_ACCIDENTES_DETALLE
    },
    {
        id: 'aud_3_2_3',
        code: '3.2.3',
        name: 'Registro y análisis estadístico de ATEL',
        description: 'Debe llevarse registro estadístico de accidentes y enfermedades.',
        evaluation: 'Verificar indicadores de accidentalidad y análisis de tendencias.',
        category: 'hacer',
        subcategory: 'Registro, reporte e investigación de ATEL',
        criteria: 'Res 0312/19: E3.2.3 | Dec 1072/15: 2.2.4.6.22 (Diagnóstico)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_22_INDICADORES
    },

    // Mecanismos Vigilancia
    {
        id: 'aud_3_3_1',
        code: '3.3.1',
        name: 'Medición de la severidad de los AT',
        description: 'Se debe medir la severidad de los accidentes de trabajo.',
        evaluation: 'Verificar cálculo del indicador de severidad de AT.',
        category: 'hacer',
        subcategory: 'Mecanismos de vigilancia de las condiciones de salud',
        criteria: 'Res 0312/19: E3.3.1 | Dec 1072/15: 2.2.4.6.21 (Indicadores)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_22_INDICADORES
    },
    {
        id: 'aud_3_3_2',
        code: '3.3.2',
        name: 'Medición de la frecuencia de los AT',
        description: 'Se debe medir la frecuencia de los accidentes de trabajo.',
        evaluation: 'Verificar cálculo del indicador de frecuencia de AT.',
        category: 'hacer',
        subcategory: 'Mecanismos de vigilancia de las condiciones de salud',
        criteria: 'Res 0312/19: E3.3.2 | Dec 1072/15: 2.2.4.6.21 (Indicadores)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_22_INDICADORES
    },
    {
        id: 'aud_3_3_3',
        code: '3.3.3',
        name: 'Medición de la mortalidad por AT',
        description: 'Se debe medir la mortalidad por accidentes de trabajo.',
        evaluation: 'Verificar cálculo del indicador de mortalidad por AT.',
        category: 'hacer',
        subcategory: 'Mecanismos de vigilancia de las condiciones de salud',
        criteria: 'Res 0312/19: E3.3.3 | Dec 1072/15: 2.2.4.6.21 (Indicadores)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_22_INDICADORES
    },
    {
        id: 'aud_3_3_4',
        code: '3.3.4',
        name: 'Medición de la prevalencia de la EL',
        description: 'Se debe medir la prevalencia de enfermedad laboral.',
        evaluation: 'Verificar cálculo del indicador de prevalencia de EL.',
        category: 'hacer',
        subcategory: 'Mecanismos de vigilancia de las condiciones de salud',
        criteria: 'Res 0312/19: E3.3.4 | Dec 1072/15: 2.2.4.6.21 (Indicadores)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_22_INDICADORES
    },
    {
        id: 'aud_3_3_5',
        code: '3.3.5',
        name: 'Medición de la incidencia de la EL',
        description: 'Se debe medir la incidencia de enfermedad laboral.',
        evaluation: 'Verificar cálculo del indicador de incidencia de EL.',
        category: 'hacer',
        subcategory: 'Mecanismos de vigilancia de las condiciones de salud',
        criteria: 'Res 0312/19: E3.3.5 | Dec 1072/15: 2.2.4.6.21 (Indicadores)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_22_INDICADORES
    },
    {
        id: 'aud_3_3_6',
        code: '3.3.6',
        name: 'Medición del ausentismo por causa médica',
        description: 'Se debe medir el ausentismo por incapacidad médica.',
        evaluation: 'Verificar cálculo del indicador de ausentismo.',
        category: 'hacer',
        subcategory: 'Mecanismos de vigilancia de las condiciones de salud',
        criteria: 'Res 0312/19: E3.3.6 | Dec 1072/15: 2.2.4.6.21 (Indicadores)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_22_INDICADORES
    },

    // Identificación Peligros
    {
        id: 'aud_4_1_1',
        code: '4.1.1',
        name: 'Metodología para identificación de peligros y evaluación de riesgos',
        description: 'Debe existir metodología para identificar peligros y evaluar riesgos.',
        evaluation: 'Verificar metodología documentada y matriz de peligros y riesgos.',
        category: 'hacer',
        subcategory: 'Identificación de peligros',
        criteria: 'Res 0312/19: E4.1.1 | Dec 1072/15: 2.2.4.6.15 (Identificación Peligros)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_15_PELIGROS
    },
    {
        id: 'aud_4_1_2',
        code: '4.1.2',
        name: 'Identificación de peligros con participación de trabajadores',
        description: 'Los trabajadores deben participar en la identificación de peligros.',
        evaluation: 'Verificar registros de participación de trabajadores en identificación de peligros.',
        category: 'hacer',
        subcategory: 'Identificación de peligros',
        criteria: 'Res 0312/19: E4.1.2 | Dec 1072/15: 2.2.4.6.15 (Identificación Peligros)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_15_PELIGROS
    },
    {
        id: 'aud_4_1_3',
        code: '4.1.3',
        name: 'Identificación y priorización de la naturaleza de los peligros',
        description: 'Se deben identificar y priorizar los peligros químicos, físicos, biológicos, etc.',
        evaluation: 'Verificar que la matriz incluya todos los tipos de peligros priorizados.',
        category: 'hacer',
        subcategory: 'Identificación de peligros',
        criteria: 'Res 0312/19: E4.1.3 | Dec 1072/15: 2.2.4.6.15 (Identificación Peligros)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_15_PELIGROS
    },
    {
        id: 'aud_4_1_4',
        code: '4.1.4',
        name: 'Realización de mediciones ambientales',
        description: 'Deben realizarse mediciones ambientales cuando se requiera.',
        evaluation: 'Verificar informes de mediciones ambientales y su análisis.',
        category: 'hacer',
        subcategory: 'Identificación de peligros',
        criteria: 'Res 0312/19: E4.1.4 | Dec 1072/15: 2.2.4.6.15 (Identificación Peligros)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_15_PELIGROS
    },

    // Medidas Prevención
    {
        id: 'aud_4_2_1',
        code: '4.2.1',
        name: 'Implementación de medidas de prevención y control',
        description: 'Se deben implementar medidas de prevención y control según jerarquía.',
        evaluation: 'Verificar implementación de medidas según jerarquía de controles.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        criteria: 'Res 0312/19: E4.2.1 | Dec 1072/15: 2.2.4.6.24 (Medidas de Prevención y Control)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_24_MEDIDAS
    },
    // PELIGROS ESPECÍFICOS (Reubicados bajo 4.2.1)
    {
        id: 'aud_res_2764',
        code: 'Norma Adicional',
        name: 'Riesgo Psicosocial',
        description: 'Aplicación de la batería de riesgo psicosocial e intervención.',
        evaluation: 'Verificar informe de batería, análisis e implementación de programa de vigilancia.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        criteria: 'Res 2764/22 | Dec 1072/15: 2.2.4.6.24 (Medidas de Prevención)',
        normativeText: NORMATIVE_FRAGMENTS.RES_2764_PSICOSOCIAL
    },
    {
        id: 'aud_ley_2050',
        code: 'Norma Adicional',
        name: 'Seguridad Vial (PESV)',
        description: 'Diseño e implementación del Plan Estratégico de Seguridad Vial.',
        evaluation: 'Verificar PESV documentado y adoptado (Ley 2050).',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        criteria: 'Ley 2050/20 | Dec 1072/15: 2.2.4.6.24 (Medidas de Prevención)',
        normativeText: NORMATIVE_FRAGMENTS.LEY_2050_PESV
    },
    {
        id: 'aud_sga',
        code: 'Norma Adicional',
        name: 'SGA - Productos Químicos',
        description: 'Sistema Globalmente Armonizado de Clasificación y Etiquetado.',
        evaluation: 'Verificar etiquetado, fichas de seguridad y matriz de compatibilidad.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        criteria: 'Dec 1496/18 | Dec 1072/15: 2.2.4.6.24 (Medidas de Prevención)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1496_SGA
    },
    {
        id: 'aud_alturas',
        code: 'Norma Adicional',
        name: 'Trabajo en Alturas',
        description: 'Programa de protección contra caídas.',
        evaluation: 'Verificar programa, procedimientos, permisos de trabajo, certificados y equipos certificados.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        criteria: 'Res 4272/21 | Dec 1072/15: 2.2.4.6.24 (Medidas de Prevención)',
        normativeText: NORMATIVE_FRAGMENTS.RES_4272_ALTURAS
    },
    {
        id: 'aud_confinados',
        code: 'Norma Adicional',
        name: 'Espacios Confinados',
        description: 'Programa de gestión para trabajo en espacios confinados.',
        evaluation: 'Verificar identificación, evaluación, permisos y monitoreo de atmósferas.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        criteria: 'Res 0491/20 | Dec 1072/15: 2.2.4.6.24 (Medidas de Prevención)',
        normativeText: NORMATIVE_FRAGMENTS.RES_0491_CONFINADOS
    },

    {
        id: 'aud_4_2_2',
        code: '4.2.2',
        name: 'Procedimientos, instructivos y fichas técnicas',
        description: 'Deben existir procedimientos e instructivos para trabajos de alto riesgo.',
        evaluation: 'Verificar procedimientos de trabajo seguro para tareas críticas.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        criteria: 'Res 0312/19: E4.2.2 | Dec 1072/15: 2.2.4.6.24 (Medidas de Prevención)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_24_MEDIDAS
    },
    {
        id: 'aud_4_2_3',
        code: '4.2.3',
        name: 'Inspecciones de seguridad',
        description: 'Deben realizarse inspecciones sistemáticas de seguridad.',
        evaluation: 'Verificar programa de inspecciones, formatos y registros.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        criteria: 'Res 0312/19: E4.2.3 | Dec 1072/15: 2.2.4.6.24 (Inspecciones)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_24_MEDIDAS
    },
    {
        id: 'aud_4_2_4',
        code: '4.2.4',
        name: 'Mantenimiento periódico de instalaciones y equipos',
        description: 'Debe existir programa de mantenimiento de instalaciones y equipos.',
        evaluation: 'Verificar programa y registros de mantenimiento preventivo y correctivo.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        criteria: 'Res 0312/19: E4.2.4 | Dec 1072/15: 2.2.4.6.24 (Mantenimiento)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_24_MEDIDAS
    },
    {
        id: 'aud_4_2_5',
        code: '4.2.5',
        name: 'Entrega de EPP y capacitación en uso',
        description: 'Se deben entregar EPP y capacitar en su uso.',
        evaluation: 'Verificar matriz de EPP, registros de entrega y capacitación.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        criteria: 'Res 0312/19: E4.2.5 | Dec 1072/15: 2.2.4.6.24 (Medidas de Prevención)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_24_MEDIDAS
    },
    {
        id: 'aud_4_2_6',
        code: '4.2.6',
        name: 'Plan de prevención y preparación ante emergencias',
        description: 'Debe existir plan de emergencias documentado.',
        evaluation: 'Verificar plan de emergencias, brigadas y simulacros.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        criteria: 'Res 0312/19: E4.2.6 | Dec 1072/15: 2.2.4.6.25 (Emergencias)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_25_EMERGENCIAS
    },
    {
        id: 'aud_4_2_7',
        code: '4.2.7',
        name: 'Brigada de prevención, preparación y respuesta ante emergencias',
        description: 'Debe existir brigada de emergencias conformada, capacitada y dotada.',
        evaluation: 'Verificar conformación de brigada, actas de capacitación, dotación y simulacros realizados.',
        category: 'hacer',
        subcategory: 'Medidas de prevención y control',
        criteria: 'Res 0312/19: E5.1.2 | Dec 1072/15: 2.2.4.6.25 (Emergencias)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_25_EMERGENCIAS
    },

    // --- III. VERIFICAR ---
    {
        id: 'aud_5_1_1',
        code: '5.1.1',
        name: 'Indicadores de estructura, proceso y resultado',
        description: 'Se deben definir indicadores para evaluar el SG-SST.',
        evaluation: 'Verificar fichas técnicas de indicadores y su medición.',
        category: 'verificar',
        subcategory: 'Gestión y resultados del SG-SST',
        criteria: 'Res 0312/19: E6.1.1 | Dec 1072/15: 2.2.4.6.20/21/22 (Indicadores)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_22_INDICADORES
    },
    {
        id: 'aud_5_1_2',
        code: '5.1.2',
        name: 'Auditoría anual',
        description: 'Debe realizarse auditoría anual del SG-SST.',
        evaluation: 'Verificar programa de auditoría, informe y plan de mejora.',
        category: 'verificar',
        subcategory: 'Gestión y resultados del SG-SST',
        criteria: 'Res 0312/19: E6.1.2 | Dec 1072/15: 2.2.4.6.29 (Auditoría)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_29_AUDITORIA
    },
    {
        id: 'aud_5_1_3',
        code: '5.1.3',
        name: 'Revisión por la alta dirección',
        description: 'La alta dirección debe revisar el SG-SST al menos una vez al año.',
        evaluation: 'Verificar acta de revisión por la dirección con decisiones tomadas.',
        category: 'verificar',
        subcategory: 'Gestión y resultados del SG-SST',
        criteria: 'Res 0312/19: E6.1.3 | Dec 1072/15: 2.2.4.6.31 (Revisión Dirección)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_31_DIRECCION
    },
    {
        id: 'aud_5_1_4',
        code: '5.1.4',
        name: 'Planificación de auditoría con el COPASST',
        description: 'La auditoría debe planificarse con participación del COPASST.',
        evaluation: 'Verificar participación del COPASST en la planificación de auditoría.',
        category: 'verificar',
        subcategory: 'Gestión y resultados del SG-SST',
        criteria: 'Res 0312/19: E6.1.4 | Dec 1072/15: 2.2.4.6.29 (Participación COPASST)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_29_AUDITORIA
    },

    // --- IV. ACTUAR ---
    {
        id: 'aud_6_1_1',
        code: '6.1.1',
        name: 'Acciones preventivas y correctivas con base en resultados',
        description: 'Se deben definir acciones preventivas y correctivas.',
        evaluation: 'Verificar plan de acciones correctivas, preventivas y de mejora.',
        category: 'actuar',
        subcategory: 'Acciones preventivas y correctivas',
        criteria: 'Res 0312/19: E7.1.1 | Dec 1072/15: 2.2.4.6.33 (Acciones P/C)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_33_MEJORA
    },
    {
        id: 'aud_6_1_2',
        code: '6.1.2',
        name: 'Acciones de mejora según revisión de la alta dirección',
        description: 'Se deben implementar acciones de mejora de la revisión por la dirección.',
        evaluation: 'Verificar seguimiento a acciones derivadas de la revisión por dirección.',
        category: 'actuar',
        subcategory: 'Acciones preventivas y correctivas',
        criteria: 'Res 0312/19: E7.1.2 | Dec 1072/15: 2.2.4.6.33 (Acciones Mejora)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_33_MEJORA
    },
    {
        id: 'aud_6_1_3',
        code: '6.1.3',
        name: 'Acciones de mejora basadas en investigaciones de ATEL',
        description: 'Se deben implementar acciones de las investigaciones de ATEL.',
        evaluation: 'Verificar seguimiento a recomendaciones de investigaciones de ATEL.',
        category: 'actuar',
        subcategory: 'Acciones preventivas y correctivas',
        criteria: 'Res 0312/19: E7.1.3 | Dec 1072/15: 2.2.4.6.33 (Acciones Mejora)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_33_MEJORA
    },
    {
        id: 'aud_6_1_4',
        code: '6.1.4',
        name: 'Plan de mejoramiento continuo',
        description: 'Debe existir un plan de mejoramiento continuo del SG-SST.',
        evaluation: 'Verificar plan de mejoramiento basado en evaluación de estándares.',
        category: 'actuar',
        subcategory: 'Acciones preventivas y correctivas',
        criteria: 'Res 0312/19: E7.1.4 | Dec 1072/15: 2.2.4.6.33 (Mejora Continua)',
        normativeText: NORMATIVE_FRAGMENTS.DEC_1072_ART_33_MEJORA
    },

];
