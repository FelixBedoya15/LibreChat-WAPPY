export interface MatrizLegalItem {
    id: string;
    norma: string; // e.g. "Resolución 0312 de 2019"
    articulo: string; // e.g. "E1.1.1" or "2.2.4.6.15"
    descripcion: string;
    evidencia: string;
    categoria: string; // To group them in the UI (e.g. "Recursos", "Identificación de Peligros")
}

export const MATRIZ_LEGAL_ITEMS: MatrizLegalItem[] = [
    // RESOLUCIÓN 0312 DE 2019 - ESTÁNDARES MÍNIMOS
    // --- PLANEAR (RECURSOS) ---
    {
        id: 'ml_0312_1_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.1',
        descripcion: 'Asignación de una persona que diseñe e implemente el Sistema de Gestión de SST.',
        evidencia: 'Documento de designación con firmas, licencia en SST y certificado del curso de 50 horas.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.2',
        descripcion: 'Asignación de responsabilidades en SST en todos los niveles de la organización.',
        evidencia: 'Manual de funciones o documento de asignación de responsabilidades firmado.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_1_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.3',
        descripcion: 'Asignación de recursos (financieros, técnicos, humanos) para el SG-SST.',
        evidencia: 'Presupuesto aprobado y evidencia de ejecución para el SG-SST.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_1_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.4',
        descripcion: 'Afiliación al Sistema General de Riesgos Laborales de todos los trabajadores.',
        evidencia: 'Soportes de pago a Riesgos Laborales (PILA).',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_1_5',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.5',
        descripcion: 'Identificación y pago de pensión especial de trabajadores de alto riesgo (Si aplica).',
        evidencia: 'Soportes de pago especial a pensión en la PILA.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_1_6',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.6',
        descripcion: 'Conformación y funcionamiento del COPASST o Vigía de SST.',
        evidencia: 'Actas de conformación y reuniones mensuales del COPASST/Actas de gestión del Vigía.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_1_7',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.7',
        descripcion: 'Capacitación a los integrantes del COPASST o Vigía de SST.',
        evidencia: 'Certificados de capacitación en funciones, identificación de peligros y normatividad.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_1_8',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.8',
        descripcion: 'Conformación y funcionamiento del Comité de Convivencia Laboral.',
        evidencia: 'Actas de conformación y actas de reuniones trimestrales.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    // --- PLANEAR (CAPACITACIÓN) ---
    {
        id: 'ml_0312_1_2_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.2.1',
        descripcion: 'Programa de Capacitación anual enfocado a los riesgos prioritarios.',
        evidencia: 'Documento del plan de capacitación estructurado alineado a peligros.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_2_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.2.2',
        descripcion: 'Inducción y reinducción en SST para todos los trabajadores nuevos y antiguos.',
        evidencia: 'Registros de asistencia a inducción de nuevos empleados y reinducción anual.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_2_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.2.3',
        descripcion: 'Responsables del Sistema de Gestión Seguridad y Salud en el Trabajo con Curso Virtual de 50 horas.',
        evidencia: 'Certificado vigente del curso de 50 horas del Ministerio de Trabajo.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    // --- PLANEAR (GESTIÓN INTEGRAL) ---
    {
        id: 'ml_0312_2_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.1.1',
        descripcion: 'Política de Seguridad y Salud en el Trabajo firmada, fechada y comunicada.',
        evidencia: 'Documento de Política SST firmado y registros de socialización.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_2_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.2.1',
        descripcion: 'Objetivos del SG-SST comunicados a todos los niveles.',
        evidencia: 'Documento de objetivos alineados con la política y evidencias de divulgación.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_3_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.3.1',
        descripcion: 'Evaluación Inicial del SG-SST documentada.',
        evidencia: 'Documento de evaluación inicial o autoevaluación Res 0312.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_4_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.4.1',
        descripcion: 'Plan Anual de Trabajo firmado por empleador y responsable SST.',
        evidencia: 'Cronograma o Plan de Trabajo anual estructurado, fechado y firmado.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_5_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.5.1',
        descripcion: 'Archivo y retención documental del Sistema de Gestión.',
        evidencia: 'Listado maestro de documentos estructurado para garantizar acceso y retención (min 20 años para registros médicos).',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_6_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.6.1',
        descripcion: 'Rendición de cuentas anual de los responsables.',
        evidencia: 'Formato de rendición de cuentas anual para todos los niveles de la empresa.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_7_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.7.1',
        descripcion: 'Matriz Legal actualizada acorde con la empresa.',
        evidencia: 'Matriz de requisitos legales aplicable al sector, actualizada.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_8_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.8.1',
        descripcion: 'Mecanismos de comunicación interna y externa (Peticiones, Quejas).',
        evidencia: 'Procedimiento de comunicación interna y registro de participación de empleados.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_9_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.9.1',
        descripcion: 'Identificación y evaluación para adquisición de bienes y servicios.',
        evidencia: 'Procedimiento de compras con criterios de Seguridad y Salud en el Trabajo.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_10_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.10.1',
        descripcion: 'Evaluación y selección de proveedores y contratistas.',
        evidencia: 'Criterios definidos para evaluación de contratistas frente a cumplimiento SST (Planillas de proveedores).',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_11_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.11.1',
        descripcion: 'Procedimiento de gestión del cambio (tecnológico, procesos).',
        evidencia: 'Procedimiento documentado para evaluar impacto en SST antes de implementar cambios estructurales.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    // --- HACER (GESTIÓN DE LA SALUD) ---
    {
        id: 'ml_0312_3_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.1',
        descripcion: 'Descripción sociodemográfica y diagnóstico de condiciones de salud.',
        evidencia: 'Perfil demográfico vigente e informe consolidado de condiciones de salud anual.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.2',
        descripcion: 'Actividades de promoción y prevención en salud.',
        evidencia: 'Cronograma ejecutado de actividades lúdicas, deportivas, higiene (SVE).',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.3',
        descripcion: 'Información y realización de exámenes médicos ocupacionales.',
        evidencia: 'Profesiograma documentado y soportes de exámenes de ingreso, periódicos y retiro.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.4',
        descripcion: 'Restricciones y recomendaciones médicas.',
        evidencia: 'Firmas de notificación de restricciones y seguimientos a puestos de trabajo (Reubicación).',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_5',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.5',
        descripcion: 'Conservación y custodia de historias clínicas.',
        evidencia: 'Certificado que la IPS o médico especialista conserva exclusivamente y preserva la HC (Privacidad).',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_6',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.6',
        descripcion: 'Ausentismo laboral: registro e índice por causas de salud.',
        evidencia: 'Reporte documentado y cuadro estadístico de ATEL vs ausentismo común/incapacidades.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_7',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.7',
        descripcion: 'Estilo de vida y entorno saludable.',
        evidencia: 'Programas anti-tabaquismo, alcohol, drogas; programas pausas activas nutrición.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_8',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.8',
        descripcion: 'Servicios de agua limpia abastecimiento (Sanitarios y vestuarios).',
        evidencia: 'Inspecciones higiénico locativas, dispensadores de agua potabilizada operando y limpios baños.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_9',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.9',
        descripcion: 'Manejo adecuado y disposición de residuos sólidos / peligrosos.',
        evidencia: 'PGIRS o política de manejo ambiental, puntos ecológicos en sede con disposición adecuada (actas recolección bio / peligrosos).',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    // --- HACER (REPORTE E INVESTIGACIÓN ATEL) ---
    {
        id: 'ml_0312_3_2_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.2.1',
        descripcion: 'Reporte a ARL y EPS de Accidentes y Enfermedades de Trabajo.',
        evidencia: 'Reporte FURAT y FUREL en físico enviados en las 48 hrs o 2 días hábiles (Radicados a ARL).',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_2_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.2.2',
        descripcion: 'Investigación de Accidentes, Incidentes y Enfermedades Laborales.',
        evidencia: 'Actas y plantillas de investigación de TODO evento AT / EL bajo metodología en 15 días tras suceso (Con participación del COPASST).',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_2_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.2.3',
        descripcion: 'Registro y análisis de estadísticas de ATEL.',
        evidencia: 'Tabla de severidad, frecuencia y letalidad consolidada en ficha técnica SG-SST (Estadísticas Anuales).',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    // --- HACER (GESTIÓN DE PELIGROS) ---
    {
        id: 'ml_0312_3_3_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.1',
        descripcion: 'Metodología para Identificación de Peligros, Evaluación y Valoración de Riesgos.',
        evidencia: 'Metodología oficial adoptada (ej. GTC 45) explicada y ajustada a contexto de empresa.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_3_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.2',
        descripcion: 'Identificación de peligros anual con participación de todos los niveles de la empresa.',
        evidencia: 'Matriz de peligros documentada (actualizada anualmente) / Socializaciones al personal / Tareas rutinarias y no rutinarias catalogadas.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_3_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.3',
        descripcion: 'Mediciones ambientales priorizadas (higiene industrial químicos, físicos, biológicos).',
        evidencia: 'Estudios luz, ruido, material articulado, vibración aplicados SI el riesgo resulta ALTO/CRITICO en Matriz GTC 45.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_3_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.4',
        descripcion: 'Ejecución priorizada de controles derivados de la Matriz de Peligros.',
        evidencia: 'Comprobantes de Eliminación, Ingeniería, o EPP ejecutados del "Plan de Acción GTC 45" real / Cronograma operando.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_3_5',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.5',
        descripcion: 'Inspecciones periódicas de instalaciones, máquinas y equipos.',
        evidencia: 'Formatos documentados: Inspecciones de orden y aseo, maquinaria crítica, vehículos y extintores / Ejecución cumpliendo lo planificado.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_3_6',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.6',
        descripcion: 'Mantenimientos preventivos / correctivos periódicos.',
        evidencia: 'Cronograma y Bitácoramantenimiento de instalaciones físicas operando.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_4_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.1.1',
        descripcion: 'Entrega de Elementos de Protección Personal (EPP) sin costo.',
        evidencia: 'Registros o Kardex firmado por los trabajadores con Dotación y Entrega. Sustitución documentada de elementos deteriorados.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_4_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.1.2',
        descripcion: 'Plan de Prevención, Preparación y Respuesta ante Emergencias documentado y aprobado.',
        evidencia: 'Documento base Plan de Emergencia y PONs alineados a amenaza regional vigente socializados.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_4_1_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.1.3',
        descripcion: 'Conformación, capacitación y dotación de Brigada de Emergencia.',
        evidencia: 'Actas comité. Equipos dotación de respuesta. Constancias Curso básico de brigadas cruz roja / bomberos / ARL.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_4_1_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.1.4',
        descripcion: 'Realización de Simulacros (Mínimo uno al año).',
        evidencia: 'Registro escrito, fotográfico y acta evaluativa de participación simulacro regional/nacional. Fallas evaluadas.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },

    // --- VERIFICAR Y ACTUAR ---
    {
        id: 'ml_0312_5_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E5.1.1',
        descripcion: 'Indicadores de Estructura, Proceso y Resultado definidos.',
        evidencia: 'Fichas técnicas de los 3 rangos tabuladas midiendo gestión de actividades clave del SG-SST (Dec 1072 - Arts 20,21,22).',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_5_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E5.1.2',
        descripcion: 'Auditoría Anual Obligatoria estructurada y programada con participación del COPASST.',
        evidencia: 'Plan Auditoría / Informe Cierre de Hallazgos y Participantes, firmado y divulgado internamente.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_6_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E6.1.1',
        descripcion: 'Revisión por la Alta Dirección de los resultados del SG-SST.',
        evidencia: 'Acta Gerencial Anual firmada por representante legal revisando políticas, indicadores y hallazgos auditoria.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_6_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E6.1.2',
        descripcion: 'Plan de mejoramiento con base a acciones Preventivas / Correctivas (PHVA).',
        evidencia: 'Formato diligenciado con correcciones sobre hallazgos provenientes de Alta dirección, ARL o Incidentes ATEL.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_6_1_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E6.1.3',
        descripcion: 'Ejecución del plan de mejoramiento del Fondo de Riesgos.',
        evidencia: 'Reporte documentado y cierre efectivo documentado de la fase final ante Autoevaluaciones formales MinTrabajo (Dic).',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_6_1_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E6.1.4',
        descripcion: 'Plan de mejoramiento ante Inspecciones ARL y el MinTrabajo ejecutado.',
        evidencia: 'Planes de remediación que contestan a objeciones reportadas externamente evidenciando total cobertura de solicitudes extra-sistemas.',
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },

    // DECRETO 1072 DE 2015 (Capítulo 6: Sistema de Gestión de la Seguridad y Salud en el Trabajo SG-SST)
    { id: 'ml_1072_2_2_4_6_1', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.1', descripcion: 'Objeto y Campo de Aplicación del SG-SST.', evidencia: 'Documento que defina el alcance del SG-SST a todos los trabajadores y centros de trabajo.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_2', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.2', descripcion: 'Definiciones. Manejo conceptual del SG-SST (acción preventiva, correctiva, mejora continua, etc).', evidencia: 'Glosario del SG-SST o manual del sistema documentado.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_3', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.3', descripcion: 'Gestión de la seguridad y salud en el trabajo alineada al ciclo PHVA.', evidencia: 'Estructura del manual SG-SST demostrando el ciclo Planear, Hacer, Verificar, Actuar.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_4', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.4', descripcion: 'Obligaciones del sistema de gestión aplicable a todo tipo de empresa.', evidencia: 'El propio sistema implementado y coherente con el tamaño de la empresa.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_5', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.5', descripcion: 'Política de SST escrita, visible, fechada, firmada y compromiso gerencial.', evidencia: 'Política firmada por el representante legal y fijada en carteleras/intranet.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_6', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.6', descripcion: 'Requisitos de la Política de SST (Identificación de peligros, cumplimiento normativo, compromiso de mejora).', evidencia: 'El documento de la política incluye los compromisos normativos, de peligros y mejora.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_7', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.7', descripcion: 'Objetivos de la política de SST: identificar, evaluar, valorar los riesgos, cumplimiento normativo.', evidencia: 'Documento de objetivos alineados con la política y comunicados.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_8', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.8', descripcion: 'Obligaciones de los empleadores: protección de la seguridad, definir recursos, promover SST, integrar SST a la empresa.', evidencia: 'Presupuestos, matriz legal, planes del COPASST, matriz roles y responsabilidades.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_9', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.9', descripcion: 'Obligaciones de las ARL. Brindar asesoría técnica.', evidencia: 'Planes de trabajo conjunto con ARL y registros de visitas de acompañamiento.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_10', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.10', descripcion: 'Responsabilidades de los trabajadores: autocuidado, cumplimiento de normas y reporte de peligros.', evidencia: 'Inclusión de responsabilidades en contrato laboral, evaluaciones de desempeño o inducciones.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_11', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.11', descripcion: 'Capacitación en SST anual, inducción a nuevos trabajadores.', evidencia: 'Plan de capacitación del año en curso, registros de asistencia de todos los niveles.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_12', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.12', descripcion: 'Documentación del SG-SST (Política, Matriz Legal, Plan anual, informes de salud).', evidencia: 'Archivo propio del SG-SST físico o digital estructurado con firmas legibles.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_13', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.13', descripcion: 'Conservación de documentos 20 años: perfil demográfico, salud ocupacional, monitoreos y capacitaciones.', evidencia: 'Política o listado maestro de retención documental de talento humano y SST.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_14', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.14', descripcion: 'Comunicación pertinente de inquietudes SST. Recepción de requerimientos de entes y trabajadores.', evidencia: 'Mecanismo de PQR interno, correos, buzón de sugerencias SST.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_15', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.15', descripcion: 'Metodología sistemática, documentada y actualizada para la Identificación de peligros anual en cada centro.', evidencia: 'Matriz GTC 45 o similar cubriendo todos los cargos, incluyendo riesgo psicosocial.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_16', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.16', descripcion: 'Evaluación inicial (Línea base) del SG-SST documentada para priorizar necesidades.', evidencia: 'Formato diligenciado de estándares de requisitos legales y condiciones salud inicial.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_17', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.17', descripcion: 'Planificación coherente a la evaluación. Crear objetivos metas e indicadores.', evidencia: 'Estructura de planificación cronograma plan de acción según autoevaluación.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_18', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.18', descripcion: 'Objetivos del SG-SST: Claros, medibles, documentados, comunicados.', evidencia: 'Documento objetivo metas e indicadores revisado por alta gerencia.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_19', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.19', descripcion: 'Indicadores de SG-SST medibles sistemáticamente.', evidencia: 'Fichas técnicas que valoren avance del plan, condiciones y accidentalidad.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_20', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.20', descripcion: 'Indicadores de ESTRUCTURA. Evalúa si hay política, plan y matriz de peligros definidos.', evidencia: 'Reporte del indicador de la formación del SG-SST (Recursos físicos, humanos).', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_21', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.21', descripcion: 'Indicadores de PROCESO. Mide el grado de desarrollo del SG (Porcentaje ejecución plan, intervenciones).', evidencia: 'Reporte de ejecución de inspecciones, reporte condiciones AT, mantenimientos equipos.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_22', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.22', descripcion: 'Indicadores de RESULTADO. Mide resultados consolidados (mortalidad, índice accidentes, eficacia de acciones).', evidencia: 'Resultados anuales de ausentismo, incidentes y enfermedades cerradas.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_23', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.23', descripcion: 'Gestión efectiva de peligros y riegos. Evidencia de aplicación de medidas de prevención y control.', evidencia: 'Aplicación de jerarquización: Eliminación, Sustitución, Ingeniería, Administración y EPP.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_24', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.24', descripcion: 'Medidas de protección personal complementarias solo si controles superiores no reducen el riesgo.', evidencia: 'Matriz de EPP, constancias de entrega individual sin costo al trabajador.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_25', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.25', descripcion: 'Prevención, Preparación y Respuesta ante Emergencias documentada simulADA e informada.', evidencia: 'Plan de Emergencia, actas de la brigada y de simulacros anuales.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_26', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.26', descripcion: 'Gestión del cambio. Procedimiento para avalar o prohibir ingresos tecnológicos internos o de procesos.', evidencia: 'Documento o formato de autorización en SST por modificaciones locativas o operativas.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_27', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.27', descripcion: 'Adquisiciones enfocadas a SST. Compras asumiendo criterios técnicos de seguridad.', evidencia: 'Manual o formato de compras considerando especificaciones de SST o fichas toxicológicas.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_28', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.28', descripcion: 'Contratación de servicios considerando lineamientos SST a los contratistas y cooperativas.', evidencia: 'Reglamentos y formatos de inducción aplicados a contratistas / Obligación PILA.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_29', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.29', descripcion: 'Auditoría de cumplimiento anual del sistema, con alcance a la eficacia integral y planeada por COPASST.', evidencia: 'Plan anual de auditoria y constancia de su cierre objetivo.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_30', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.30', descripcion: 'Alcance metodológico preciso de la auditoría de cumplimiento.', evidencia: 'Evaluación del avance de metas y revisión de las acciones preventivas/correctivas del ciclo anterior.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_31', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.31', descripcion: 'Revisión por la Alta Dirección de los resultados directos del plan estratégico y salud.', evidencia: 'Acta de informe entregada a Gerencia y documentada revisando los objetivos SST.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_32', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.32', descripcion: 'Investigación de Incidentes, Accidentes y Enfermedades en máximo 15 días posteriores al suceso.', evidencia: 'Reporte del evento, árbol de causas o espina pescado, acta final firmada.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_33', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.33', descripcion: 'Acciones Correctivas y Preventivas documentadas por las investigaciones y auditorías.', evidencia: 'Documento o formato maestro Acción / Causa raíz y Seguimiento.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_34', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.34', descripcion: 'Garantía del programa de mejora continua. Identidad organizacional a no repetir fallas sistémicas.', evidencia: 'Planes de remediación verificados para evaluar que la mejora fue objetiva (PHVA cerrado).', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_35', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.35', descripcion: 'Implementación progresiva del sistema en función de cronogramas formales transitorios.', evidencia: 'Cronograma ajustado evidenciando avance fase a fase del SST corporativo.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_36', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.36', descripcion: 'Sanciones. Multas y suspensiones por la no implementación de este capítulo y su falsedad.', evidencia: 'Mantenimiento del certificado de conformidad. Control contra evasión legal de obligaciones.', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
    { id: 'ml_1072_2_2_4_6_37', norma: 'Decreto 1072 de 2015', articulo: 'Art 2.2.4.6.37', descripcion: 'Transición perentoria (Derogado o ampliado según las Resoluciones de estándares mínimos).', evidencia: 'Cumplimiento regido por plazos vigentes sin caducación (Res 0312).', categoria: 'II. Decreto 1072 de 2015 - Capítulo 6 SG-SST' },
];
