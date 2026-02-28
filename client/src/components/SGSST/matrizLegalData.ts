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
    
    
    {
        id: 'ml_0312_1_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.1',
        descripcion: "Responsable del SG-SST. Se debe designar un responsable del SG-SST con licencia vigente en SST y curso de 50 horas.",
        evidencia: "Verificar documento de designación, licencia vigente en SST y certificado del curso de 50 horas.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.2',
        descripcion: "Responsabilidades en el SG-SST. Deben estar definidas y asignadas las responsabilidades en SST a todos los niveles.",
        evidencia: "Verificar documento con asignación de responsabilidades en SST por niveles.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_1_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.3',
        descripcion: "Asignación de recursos para el SG-SST. Se deben asignar recursos financieros, técnicos, humanos y de otra índole.",
        evidencia: "Verificar documento de asignación de recursos con presupuesto específico para SST.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_1_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.4',
        descripcion: "Afiliación al Sistema General de Riesgos Laborales. Todos los trabajadores deben estar afiliados al SGRL.",
        evidencia: "Verificar planillas de aportes y afiliación de todos los trabajadores al SGRL.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_1_5',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.5',
        descripcion: "Pago de pensión de trabajadores de alto riesgo. Se debe realizar el pago de pensión especial para trabajadores de alto riesgo.",
        evidencia: "Verificar pago de aportes adicionales de pensión para actividades de alto riesgo.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_1_6',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.6',
        descripcion: "Conformación del COPASST. Debe estar conformado el COPASST con representantes del empleador y trabajadores.",
        evidencia: "Verificar acta de conformación del COPASST con la participación paritaria.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_1_7',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.7',
        descripcion: "Capacitación del COPASST. Los integrantes del COPASST deben estar capacitados para cumplir sus funciones.",
        evidencia: "Verificar registros de capacitación de los miembros del COPASST.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_1_8',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.1.8',
        descripcion: "Conformación del Comité de Convivencia. Debe estar conformado el Comité de Convivencia Laboral.",
        evidencia: "Verificar acta de conformación y reuniones del Comité de Convivencia Laboral.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_2_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.2.1',
        descripcion: "Programa de capacitación en promoción y prevención. Debe existir un programa de capacitación anual en promoción y prevención.",
        evidencia: "Verificar programa de capacitación documentado con temas, fechas, responsables y recursos.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_2_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.2.2',
        descripcion: "Capacitación, inducción y reinducción en SG-SST. Todos los trabajadores deben recibir inducción y reinducción en SST.",
        evidencia: "Verificar registros de inducción y reinducción de todos los trabajadores.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_1_2_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E1.2.3',
        descripcion: "Responsables del SG-SST con curso virtual de 50 horas. Los responsables del SG-SST deben contar con el curso virtual de 50 horas.",
        evidencia: "Verificar certificado del curso de 50 horas de los responsables del SG-SST.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.1.1',
        descripcion: "Política del SG-SST firmada, fechada y comunicada. Debe existir una política de SST documentada, firmada y comunicada.",
        evidencia: "Verificar política firmada por el representante legal, fechada, publicada y comunicada.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_2_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.2.1',
        descripcion: "Objetivos definidos, claros, medibles y cuantificables. Los objetivos del SG-SST deben ser definidos, claros, medibles y cuantificables.",
        evidencia: "Verificar que los objetivos cumplan las características y estén alineados con las prioridades.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_3_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.3.1',
        descripcion: "Evaluación inicial del SG-SST e identificación de prioridades. Debe realizarse una evaluación inicial del SG-SST.",
        evidencia: "Verificar documento de evaluación inicial con identificación de prioridades.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_4_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.4.1',
        descripcion: "Plan de trabajo anual. Debe existir un plan de trabajo anual firmado por el empleador.",
        evidencia: "Verificar plan de trabajo con metas, responsables, recursos, cronograma y firmado.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_5_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.5.1',
        descripcion: "Archivo y retención documental del SG-SST. Deben conservarse los documentos del SG-SST de forma ordenada.",
        evidencia: "Verificar sistema de archivo y conservación de documentos del SG-SST.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_6_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.6.1',
        descripcion: "Rendición de cuentas sobre el desempeño. Debe existir rendición de cuentas anual sobre el desempeño del SG-SST.",
        evidencia: "Verificar registros de rendición de cuentas de quienes tienen responsabilidades en SST.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_7_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.7.1',
        descripcion: "Matriz legal actualizada. Debe existir una matriz legal actualizada con la normatividad aplicable.",
        evidencia: "Verificar matriz legal actualizada con normas aplicables a la empresa.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_8_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.8.1',
        descripcion: "Mecanismos de comunicación interna y externa. Deben existir mecanismos de comunicación sobre temas de SST.",
        evidencia: "Verificar mecanismos de comunicación definidos y funcionando.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_9_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.9.1',
        descripcion: "Procedimiento de adquisiciones con criterios de SST. Debe existir un procedimiento que incluya criterios de SST para adquisiciones.",
        evidencia: "Verificar procedimiento de adquisiciones que contemple aspectos de SST.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_10_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.10.1',
        descripcion: "Evaluación y selección de contratistas y proveedores. Debe existir procedimiento de evaluación de contratistas en SST.",
        evidencia: "Verificar procedimiento de evaluación de contratistas que incluya aspectos de SST.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_2_11_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E2.11.1',
        descripcion: "Evaluación del impacto de cambios internos y externos. Debe existir procedimiento para evaluar el impacto de cambios sobre SST.",
        evidencia: "Verificar procedimiento de gestión del cambio documentado.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.1',
        descripcion: "Descripción sociodemográfica y Diagnóstico de condiciones de salud. Documento consolidado con la información sociodemográfica y el diagnóstico de salud de la población trabajadora.",
        evidencia: "Verificar documento de evaluación médica ocupacional (Sociodemográfico y Diagnóstico) actualizado anualmente.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.2',
        descripcion: "Actividades de promoción y prevención en salud. Deben desarrollarse actividades de promoción y prevención.",
        evidencia: "Verificar registros y evidencias de actividades de promoción y prevención.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.3',
        descripcion: "Información al médico de perfiles de cargo. Se debe informar al médico los perfiles de cargo para evaluaciones.",
        evidencia: "Verificar suministro de **Profesiograma** (descripción de tareas y factores de riesgo) al médico especialista.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.4',
        descripcion: "Realización de evaluaciones médicas. Deben realizarse evaluaciones médicas de ingreso, periódicas y retiro.",
        evidencia: "Verificar certificados de evaluaciones médicas según profesiograma.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_5',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.5',
        descripcion: "Custodia de historias clínicas. Las historias clínicas ocupacionales deben estar custodiadas.",
        evidencia: "Verificar documento que garantice la custodia de historias clínicas.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_6',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.6',
        descripcion: "Restricciones y recomendaciones médicas. Se deben cumplir las restricciones y recomendaciones médico laborales.",
        evidencia: "Verificar seguimiento a recomendaciones y restricciones médicas.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_7',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.7',
        descripcion: "Estilos de vida y entornos de trabajo saludable. Se deben desarrollar programas de estilos de vida saludable.",
        evidencia: "Verificar programa de estilos de vida saludable documentado y ejecutado.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_8',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.8',
        descripcion: "Agua potable, servicios sanitarios y disposición de basuras. Debe garantizarse agua potable, servicios sanitarios y manejo de basuras.",
        evidencia: "Verificar condiciones de agua potable, servicios sanitarios y manejo de residuos.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_1_9',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.1.9',
        descripcion: "Eliminación adecuada de residuos. Debe existir manejo adecuado de residuos sólidos, líquidos y gaseosos.",
        evidencia: "Verificar plan de manejo de residuos según normatividad ambiental.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_2_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.2.1',
        descripcion: "Reporte de accidentes de trabajo a la ARL. Se deben reportar los accidentes de trabajo a la ARL.",
        evidencia: "Verificar reportes de accidentes de trabajo dentro de los 2 días hábiles.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_2_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.2.2',
        descripcion: "Investigación de accidentes, incidentes y enfermedades. Deben investigarse los accidentes, incidentes y enfermedades laborales.",
        evidencia: "Verificar metodología e informes de investigación de ATEL.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_2_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.2.3',
        descripcion: "Registro y análisis estadístico de ATEL. Debe llevarse registro estadístico de accidentes y enfermedades.",
        evidencia: "Verificar indicadores de accidentalidad y análisis de tendencias.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_3_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.1',
        descripcion: "Medición de la severidad de los AT. Se debe medir la severidad de los accidentes de trabajo.",
        evidencia: "Verificar cálculo del indicador de severidad de AT.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_3_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.2',
        descripcion: "Medición de la frecuencia de los AT. Se debe medir la frecuencia de los accidentes de trabajo.",
        evidencia: "Verificar cálculo del indicador de frecuencia de AT.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_3_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.3',
        descripcion: "Medición de la mortalidad por AT. Se debe medir la mortalidad por accidentes de trabajo.",
        evidencia: "Verificar cálculo del indicador de mortalidad por AT.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_3_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.4',
        descripcion: "Medición de la prevalencia de la EL. Se debe medir la prevalencia de enfermedad laboral.",
        evidencia: "Verificar cálculo del indicador de prevalencia de EL.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_3_5',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.5',
        descripcion: "Medición de la incidencia de la EL. Se debe medir la incidencia de enfermedad laboral.",
        evidencia: "Verificar cálculo del indicador de incidencia de EL.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_3_3_6',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E3.3.6',
        descripcion: "Medición del ausentismo por causa médica. Se debe medir el ausentismo por incapacidad médica.",
        evidencia: "Verificar cálculo del indicador de ausentismo.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_4_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.1.1',
        descripcion: "Metodología para identificación de peligros, evaluación y valoración de riesgos. Debe existir metodología para la identificación de peligros, evaluación y valoración de los riesgos.",
        evidencia: "Solicitar el documento donde conste la metodología.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_4_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.1.2',
        descripcion: "Identificación de peligros con participación de todos los niveles de la empresa. Realizar la identificación de peligros, evaluación y valoración de los riesgos con participación de los trabajadores.",
        evidencia: "Solicitar las evidencias de la participación de los trabajadores en la identificación de peligros.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_4_1_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.1.3',
        descripcion: "Identificación de sustancias catalogadas como carcinógenas o con toxicidad aguda. Identificar las sustancias catalogadas como carcinógenas o con toxicidad aguda.",
        evidencia: "Verificar la lista de materias primas e insumos y si existen sustancias carcinógenas (Grupo 1 IARC) o con toxicidad aguda (Cat I y II SGA).",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_4_1_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.1.4',
        descripcion: "Realización de mediciones ambientales, químicos, físicos y biológicos. Realizar mediciones ambientales de riesgos químicos, físicos y biológicos.",
        evidencia: "Solicitar los resultados de las mediciones ambientales higiénicas según los peligros identificados.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_4_2_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.2.1',
        descripcion: "Implementación de medidas de prevención y control. Implementación de medidas de prevención y control de peligros/riesgos identificados.",
        evidencia: "Verificar implementación de medidas según jerarquía de controles (Eliminación, Sustitución, Controles de Ingeniería, Administrativos, EPP).",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_4_2_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.2.2',
        descripcion: "Verificación de medidas de prevención y control. Verificación de aplicación de medidas de prevención y control por parte de los trabajadores.",
        evidencia: "Verificar evidencias de que los trabajadores aplican las medidas de prevención y control.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_4_2_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.2.3',
        descripcion: "Elaboración de procedimientos e instructivos. Elaboración de procedimientos, instructivos, fichas, protocolos.",
        evidencia: "Verificar procedimientos, instructivos, fichas y protocolos de seguridad y salud en el trabajo.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_4_2_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.2.4',
        descripcion: "Inspecciones de seguridad. Realización de inspecciones sistemáticas a las instalaciones, maquinaria o equipos con la participación del COPASST.",
        evidencia: "Verificar programa de inspecciones, formatos y registros de inspecciones realizadas con el COPASST.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_4_2_5',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.2.5',
        descripcion: "Mantenimiento de instalaciones y equipos. Mantenimiento periódico de instalaciones, equipos, máquinas, herramientas.",
        evidencia: "Verificar programa y registros de mantenimiento preventivo y correctivo de instalaciones y equipos.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_4_2_6',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E4.2.6',
        descripcion: "Entrega de EPP. Entrega de Elementos de Protección Personal EPP, se verifica con contratistas y subcontratistas.",
        evidencia: "Verificar registros de entrega de EPP a trabajadores y soportes de exigencia a contratistas.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_5_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E5.1.1',
        descripcion: "Plan de prevención, preparación y respuesta ante emergencias. Se cuenta con el Plan de Prevención, Preparación y Respuesta ante emergencias.",
        evidencia: "Verificar documento del plan de emergencias, análisis de vulnerabilidad y planes de acción.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_5_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E5.1.2',
        descripcion: "Brigada de prevención. Brigada de prevención conformada, capacitada y dotada.",
        evidencia: "Verificar conformación de la brigada, actas de capacitación y soportes de dotación.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_6_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E6.1.1',
        descripcion: "Definición de indicadores del SG-SST. Definición de indicadores del SG-SST de acuerdo condiciones de la empresa.",
        evidencia: "Verificar fichas técnicas de los indicadores (estructura, proceso y resultado) y su medición.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_6_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E6.1.2',
        descripcion: "Auditoría anual. La empresa adelanta auditoría por lo menos una vez al año.",
        evidencia: "Verificar informe de auditoría interna anual, programa de auditoría y perfil del auditor.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_6_1_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E6.1.3',
        descripcion: "Revisión por la alta dirección. Revisión anual por la alta dirección, resultados y alcance de la auditoría.",
        evidencia: "Verificar acta de la revisión por la dirección que incluya todos los elementos de entrada obligatorios.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_6_1_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E6.1.4',
        descripcion: "Planificación auditorías con el COPASST. Planificación auditorías con el COPASST.",
        evidencia: "Verificar evidencias de la participación del COPASST en la planificación de la auditoría.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_7_1_1',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E7.1.1',
        descripcion: "Acciones preventivas y correctivas. Definición de acciones preventivas y correctivas con base en resultados del SG-SST.",
        evidencia: "Verificar implementación de acciones preventivas y correctivas derivadas de no conformidades.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_7_1_2',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E7.1.2',
        descripcion: "Acciones de mejora (Dirección). Acciones de mejora conforme a revisión de la alta dirección.",
        evidencia: "Verificar plan de trabajo o acciones derivadas de la revisión por la alta dirección.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_7_1_3',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E7.1.3',
        descripcion: "Acciones de mejora (Investigación). Acciones de mejora con base en investigaciones de accidentes de trabajo y enfermedades laborales.",
        evidencia: "Verificar cierre de planes de acción generados en las investigaciones de incidentes, accidentes y EL.",
        categoria: 'I. Resolución 0312 de 2019 - Estándares Mínimos'
    },
    {
        id: 'ml_0312_7_1_4',
        norma: 'Resolución 0312 de 2019',
        articulo: 'E7.1.4',
        descripcion: "Plan de mejoramiento. Elaboración Plan de Mejoramiento e implementación de medidas y acciones correctivas solicitadas por autoridades y ARL.",
        evidencia: "Verificar el Plan de Mejoramiento Consolidado y sus avances.",
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
