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
        categoria: 'I. Planear - Recursos'
    },
    {
        id: 'ml_0312_1_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.2',
        descripcion: 'Asignación de responsabilidades en SST en todos los niveles de la organización.',
        evidencia: 'Manual de funciones o documento de asignación de responsabilidades firmado.',
        categoria: 'I. Planear - Recursos'
    },
    {
        id: 'ml_0312_1_1_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.3',
        descripcion: 'Asignación de recursos (financieros, técnicos, humanos) para el SG-SST.',
        evidencia: 'Presupuesto aprobado y evidencia de ejecución para el SG-SST.',
        categoria: 'I. Planear - Recursos'
    },
    {
        id: 'ml_0312_1_1_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.4',
        descripcion: 'Afiliación al Sistema General de Riesgos Laborales de todos los trabajadores.',
        evidencia: 'Soportes de pago a Riesgos Laborales (PILA).',
        categoria: 'I. Planear - Recursos'
    },
    {
        id: 'ml_0312_1_1_5',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.5',
        descripcion: 'Identificación y pago de pensión especial de trabajadores de alto riesgo (Si aplica).',
        evidencia: 'Soportes de pago especial a pensión en la PILA.',
        categoria: 'I. Planear - Recursos'
    },
    {
        id: 'ml_0312_1_1_6',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.6',
        descripcion: 'Conformación y funcionamiento del COPASST o Vigía de SST.',
        evidencia: 'Actas de conformación y reuniones mensuales del COPASST/Actas de gestión del Vigía.',
        categoria: 'I. Planear - Recursos'
    },
    {
        id: 'ml_0312_1_1_7',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.7',
        descripcion: 'Capacitación a los integrantes del COPASST o Vigía de SST.',
        evidencia: 'Certificados de capacitación en funciones, identificación de peligros y normatividad.',
        categoria: 'I. Planear - Recursos'
    },
    {
        id: 'ml_0312_1_1_8',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.8',
        descripcion: 'Conformación y funcionamiento del Comité de Convivencia Laboral.',
        evidencia: 'Actas de conformación y actas de reuniones trimestrales.',
        categoria: 'I. Planear - Recursos'
    },
    // --- PLANEAR (CAPACITACIÓN) ---
    {
        id: 'ml_0312_1_2_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.2.1',
        descripcion: 'Programa de Capacitación anual enfocado a los riesgos prioritarios.',
        evidencia: 'Documento del plan de capacitación estructurado alineado a peligros.',
        categoria: 'I. Planear - Capacitación'
    },
    {
        id: 'ml_0312_1_2_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.2.2',
        descripcion: 'Inducción y reinducción en SST para todos los trabajadores nuevos y antiguos.',
        evidencia: 'Registros de asistencia a inducción de nuevos empleados y reinducción anual.',
        categoria: 'I. Planear - Capacitación'
    },
    {
        id: 'ml_0312_1_2_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.2.3',
        descripcion: 'Responsables del Sistema de Gestión Seguridad y Salud en el Trabajo con Curso Virtual de 50 horas.',
        evidencia: 'Certificado vigente del curso de 50 horas del Ministerio de Trabajo.',
        categoria: 'I. Planear - Capacitación'
    },
    // --- PLANEAR (GESTIÓN INTEGRAL) ---
    {
        id: 'ml_0312_2_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.1.1',
        descripcion: 'Política de Seguridad y Salud en el Trabajo firmada, fechada y comunicada.',
        evidencia: 'Documento de Política SST firmado y registros de socialización.',
        categoria: 'I. Planear - Gestión Integral'
    },
    {
        id: 'ml_0312_2_2_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.2.1',
        descripcion: 'Objetivos del SG-SST comunicados a todos los niveles.',
        evidencia: 'Documento de objetivos alineados con la política y evidencias de divulgación.',
        categoria: 'I. Planear - Gestión Integral'
    },
    {
        id: 'ml_0312_2_3_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.3.1',
        descripcion: 'Evaluación Inicial del SG-SST documentada.',
        evidencia: 'Documento de evaluación inicial o autoevaluación Res 0312.',
        categoria: 'I. Planear - Gestión Integral'
    },
    {
        id: 'ml_0312_2_4_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.4.1',
        descripcion: 'Plan Anual de Trabajo firmado por empleador y responsable SST.',
        evidencia: 'Cronograma o Plan de Trabajo anual estructurado, fechado y firmado.',
        categoria: 'I. Planear - Gestión Integral'
    },
    {
        id: 'ml_0312_2_5_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.5.1',
        descripcion: 'Archivo y retención documental del Sistema de Gestión.',
        evidencia: 'Listado maestro de documentos estructurado para garantizar acceso y retención (min 20 años para registros médicos).',
        categoria: 'I. Planear - Gestión Integral'
    },
    {
        id: 'ml_0312_2_6_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.6.1',
        descripcion: 'Rendición de cuentas anual de los responsables.',
        evidencia: 'Formato de rendición de cuentas anual para todos los niveles de la empresa.',
        categoria: 'I. Planear - Gestión Integral'
    },
    {
        id: 'ml_0312_2_7_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.7.1',
        descripcion: 'Matriz Legal actualizada acorde con la empresa.',
        evidencia: 'Matriz de requisitos legales aplicable al sector, actualizada.',
        categoria: 'I. Planear - Gestión Integral'
    },
    {
        id: 'ml_0312_2_8_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.8.1',
        descripcion: 'Mecanismos de comunicación interna y externa (Peticiones, Quejas).',
        evidencia: 'Procedimiento de comunicación interna y registro de participación de empleados.',
        categoria: 'I. Planear - Gestión Integral'
    },
    {
        id: 'ml_0312_2_9_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.9.1',
        descripcion: 'Identificación y evaluación para adquisición de bienes y servicios.',
        evidencia: 'Procedimiento de compras con criterios de Seguridad y Salud en el Trabajo.',
        categoria: 'I. Planear - Gestión Integral'
    },
    {
        id: 'ml_0312_2_10_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.10.1',
        descripcion: 'Evaluación y selección de proveedores y contratistas.',
        evidencia: 'Criterios definidos para evaluación de contratistas frente a cumplimiento SST (Planillas de proveedores).',
        categoria: 'I. Planear - Gestión Integral'
    },
    {
        id: 'ml_0312_2_11_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.11.1',
        descripcion: 'Procedimiento de gestión del cambio (tecnológico, procesos).',
        evidencia: 'Procedimiento documentado para evaluar impacto en SST antes de implementar cambios estructurales.',
        categoria: 'I. Planear - Gestión Integral'
    },
    // --- HACER (GESTIÓN DE LA SALUD) ---
    {
        id: 'ml_0312_3_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.1',
        descripcion: 'Descripción sociodemográfica y diagnóstico de condiciones de salud.',
        evidencia: 'Perfil demográfico vigente e informe consolidado de condiciones de salud anual.',
        categoria: 'II. Hacer - Condiciones de Salud'
    },
    {
        id: 'ml_0312_3_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.2',
        descripcion: 'Actividades de promoción y prevención en salud.',
        evidencia: 'Cronograma ejecutado de actividades lúdicas, deportivas, higiene (SVE).',
        categoria: 'II. Hacer - Condiciones de Salud'
    },
    {
        id: 'ml_0312_3_1_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.3',
        descripcion: 'Información y realización de exámenes médicos ocupacionales.',
        evidencia: 'Profesiograma documentado y soportes de exámenes de ingreso, periódicos y retiro.',
        categoria: 'II. Hacer - Condiciones de Salud'
    },
    {
        id: 'ml_0312_3_1_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.4',
        descripcion: 'Restricciones y recomendaciones médicas.',
        evidencia: 'Firmas de notificación de restricciones y seguimientos a puestos de trabajo (Reubicación).',
        categoria: 'II. Hacer - Condiciones de Salud'
    },
    {
        id: 'ml_0312_3_1_5',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.5',
        descripcion: 'Conservación y custodia de historias clínicas.',
        evidencia: 'Certificado que la IPS o médico especialista conserva exclusivamente y preserva la HC (Privacidad).',
        categoria: 'II. Hacer - Condiciones de Salud'
    },
    {
        id: 'ml_0312_3_1_6',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.6',
        descripcion: 'Ausentismo laboral: registro e índice por causas de salud.',
        evidencia: 'Reporte documentado y cuadro estadístico de ATEL vs ausentismo común/incapacidades.',
        categoria: 'II. Hacer - Condiciones de Salud'
    },
    {
        id: 'ml_0312_3_1_7',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.7',
        descripcion: 'Estilo de vida y entorno saludable.',
        evidencia: 'Programas anti-tabaquismo, alcohol, drogas; programas pausas activas nutrición.',
        categoria: 'II. Hacer - Condiciones de Salud'
    },
    {
        id: 'ml_0312_3_1_8',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.8',
        descripcion: 'Servicios de agua limpia abastecimiento (Sanitarios y vestuarios).',
        evidencia: 'Inspecciones higiénico locativas, dispensadores de agua potabilizada operando y limpios baños.',
        categoria: 'II. Hacer - Condiciones de Salud'
    },
    {
        id: 'ml_0312_3_1_9',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.9',
        descripcion: 'Manejo adecuado y disposición de residuos sólidos / peligrosos.',
        evidencia: 'PGIRS o política de manejo ambiental, puntos ecológicos en sede con disposición adecuada (actas recolección bio / peligrosos).',
        categoria: 'II. Hacer - Condiciones de Salud'
    },
    // --- HACER (REPORTE E INVESTIGACIÓN ATEL) ---
    {
        id: 'ml_0312_3_2_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.2.1',
        descripcion: 'Reporte a ARL y EPS de Accidentes y Enfermedades de Trabajo.',
        evidencia: 'Reporte FURAT y FUREL en físico enviados en las 48 hrs o 2 días hábiles (Radicados a ARL).',
        categoria: 'II. Hacer - ATEL'
    },
    {
        id: 'ml_0312_3_2_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.2.2',
        descripcion: 'Investigación de Accidentes, Incidentes y Enfermedades Laborales.',
        evidencia: 'Actas y plantillas de investigación de TODO evento AT / EL bajo metodología en 15 días tras suceso (Con participación del COPASST).',
        categoria: 'II. Hacer - ATEL'
    },
    {
        id: 'ml_0312_3_2_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.2.3',
        descripcion: 'Registro y análisis de estadísticas de ATEL.',
        evidencia: 'Tabla de severidad, frecuencia y letalidad consolidada en ficha técnica SG-SST (Estadísticas Anuales).',
        categoria: 'II. Hacer - ATEL'
    },
    // --- HACER (GESTIÓN DE PELIGROS) ---
    {
        id: 'ml_0312_3_3_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.1',
        descripcion: 'Metodología para Identificación de Peligros, Evaluación y Valoración de Riesgos.',
        evidencia: 'Metodología oficial adoptada (ej. GTC 45) explicada y ajustada a contexto de empresa.',
        categoria: 'II. Hacer - Control Peligros'
    },
    {
        id: 'ml_0312_3_3_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.2',
        descripcion: 'Identificación de peligros anual con participación de todos los niveles de la empresa.',
        evidencia: 'Matriz de peligros documentada (actualizada anualmente) / Socializaciones al personal / Tareas rutinarias y no rutinarias catalogadas.',
        categoria: 'II. Hacer - Control Peligros'
    },
    {
        id: 'ml_0312_3_3_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.3',
        descripcion: 'Mediciones ambientales priorizadas (higiene industrial químicos, físicos, biológicos).',
        evidencia: 'Estudios luz, ruido, material articulado, vibración aplicados SI el riesgo resulta ALTO/CRITICO en Matriz GTC 45.',
        categoria: 'II. Hacer - Control Peligros'
    },
    {
        id: 'ml_0312_3_3_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.4',
        descripcion: 'Ejecución priorizada de controles derivados de la Matriz de Peligros.',
        evidencia: 'Comprobantes de Eliminación, Ingeniería, o EPP ejecutados del "Plan de Acción GTC 45" real / Cronograma operando.',
        categoria: 'II. Hacer - Control Peligros'
    },
    {
        id: 'ml_0312_3_3_5',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.5',
        descripcion: 'Inspecciones periódicas de instalaciones, máquinas y equipos.',
        evidencia: 'Formatos documentados: Inspecciones de orden y aseo, maquinaria crítica, vehículos y extintores / Ejecución cumpliendo lo planificado.',
        categoria: 'II. Hacer - Control Peligros'
    },
    {
        id: 'ml_0312_3_3_6',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.6',
        descripcion: 'Mantenimientos preventivos / correctivos periódicos.',
        evidencia: 'Cronograma y Bitácoramantenimiento de instalaciones físicas operando.',
        categoria: 'II. Hacer - Control Peligros'
    },
    {
        id: 'ml_0312_4_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.1.1',
        descripcion: 'Entrega de Elementos de Protección Personal (EPP) sin costo.',
        evidencia: 'Registros o Kardex firmado por los trabajadores con Dotación y Entrega. Sustitución documentada de elementos deteriorados.',
        categoria: 'II. Hacer - Amenazas'
    },
    {
        id: 'ml_0312_4_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.1.2',
        descripcion: 'Plan de Prevención, Preparación y Respuesta ante Emergencias documentado y aprobado.',
        evidencia: 'Documento base Plan de Emergencia y PONs alineados a amenaza regional vigente socializados.',
        categoria: 'II. Hacer - Amenazas'
    },
    {
        id: 'ml_0312_4_1_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.1.3',
        descripcion: 'Conformación, capacitación y dotación de Brigada de Emergencia.',
        evidencia: 'Actas comité. Equipos dotación de respuesta. Constancias Curso básico de brigadas cruz roja / bomberos / ARL.',
        categoria: 'II. Hacer - Amenazas'
    },
    {
        id: 'ml_0312_4_1_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.1.4',
        descripcion: 'Realización de Simulacros (Mínimo uno al año).',
        evidencia: 'Registro escrito, fotográfico y acta evaluativa de participación simulacro regional/nacional. Fallas evaluadas.',
        categoria: 'II. Hacer - Amenazas'
    },

    // --- VERIFICAR Y ACTUAR ---
    {
        id: 'ml_0312_5_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E5.1.1',
        descripcion: 'Indicadores de Estructura, Proceso y Resultado definidos.',
        evidencia: 'Fichas técnicas de los 3 rangos tabuladas midiendo gestión de actividades clave del SG-SST (Dec 1072 - Arts 20,21,22).',
        categoria: 'III. Verificar'
    },
    {
        id: 'ml_0312_5_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E5.1.2',
        descripcion: 'Auditoría Anual Obligatoria estructurada y programada con participación del COPASST.',
        evidencia: 'Plan Auditoría / Informe Cierre de Hallazgos y Participantes, firmado y divulgado internamente.',
        categoria: 'III. Verificar'
    },
    {
        id: 'ml_0312_6_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E6.1.1',
        descripcion: 'Revisión por la Alta Dirección de los resultados del SG-SST.',
        evidencia: 'Acta Gerencial Anual firmada por representante legal revisando políticas, indicadores y hallazgos auditoria.',
        categoria: 'III. Verificar'
    },
    {
        id: 'ml_0312_6_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E6.1.2',
        descripcion: 'Plan de mejoramiento con base a acciones Preventivas / Correctivas (PHVA).',
        evidencia: 'Formato diligenciado con correcciones sobre hallazgos provenientes de Alta dirección, ARL o Incidentes ATEL.',
        categoria: 'IV. Actuar'
    },
    {
        id: 'ml_0312_6_1_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E6.1.3',
        descripcion: 'Ejecución del plan de mejoramiento del Fondo de Riesgos.',
        evidencia: 'Reporte documentado y cierre efectivo documentado de la fase final ante Autoevaluaciones formales MinTrabajo (Dic).',
        categoria: 'IV. Actuar'
    },
    {
        id: 'ml_0312_6_1_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E6.1.4',
        descripcion: 'Plan de mejoramiento ante Inspecciones ARL y el MinTrabajo ejecutado.',
        evidencia: 'Planes de remediación que contestan a objeciones reportadas externamente evidenciando total cobertura de solicitudes extra-sistemas.',
        categoria: 'IV. Actuar'
    },

    // DECRETO 1072 DE 2015 (Artículos Clave Adicionales / SG-SST)
    {
        id: 'ml_1072_2_2_4_6_5',
        norma: 'Decreto 1072 de 2015',
        articulo: 'Art 2.2.4.6.5',
        descripcion: 'La política SST debe ser un documento escrito, publicado en lugares visibles, firmado por quien represente la organización y refrendado anualmente.',
        evidencia: 'Exhibición mural o Intranet de la política y firma original refrendada reciente.',
        categoria: 'V. Dec 1072 (Generalidades)'
    },
    {
        id: 'ml_1072_2_2_4_6_15',
        norma: 'Decreto 1072 de 2015',
        articulo: 'Art 2.2.4.6.15',
        descripcion: 'Metodología integral participativa de peligros en cada puesto de trabajo (No sólo global) para trabajadores regulares, temporales y contratistas.',
        evidencia: 'Matriz GTC 45 incluyendo todas resoluciones de riesgos / Censo completo.',
        categoria: 'V. Dec 1072 (Generalidades)'
    },
    {
        id: 'ml_1072_2_2_4_6_25',
        norma: 'Decreto 1072 de 2015',
        articulo: 'Art 2.2.4.6.25',
        descripcion: 'Implementación estructurada del Plan de Emergencia (incluyendo amenaza por vulnerabilidades en sitio compartidos).',
        evidencia: 'Soporte plan mutuo de emergencias si aplica a sector o centro comercial/obra compartida.',
        categoria: 'V. Dec 1072 (Generalidades)'
    },
    {
        id: 'ml_1072_2_2_4_6_26',
        norma: 'Decreto 1072 de 2015',
        articulo: 'Art 2.2.4.6.26',
        descripcion: 'Gestión del Cambio. Obligación de documentar y valorar en SST cualquier innovación de procesos, química o estructural antes de la compra.',
        evidencia: 'Plantilla MOOC operando con VoBo del especialista SST antes de implementación de maquinaria nueva.',
        categoria: 'V. Dec 1072 (Generalidades)'
    }
];
