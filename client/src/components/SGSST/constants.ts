export const PHASE_CATEGORIES = {
    plan: [
        { 
            id: 'perfil_cargo', title: 'Perfiles de Cargo (Roles)', icon: 'UserCircle',
            bioRationale: 'Identifica las exigencias biomecánicas, cognitivas y psicosociales reales a las que será expuesto el individuo.', 
            normativity: 'Decreto 1072 de 2015 (Art. 2.2.4.6.12)' 
        },
        { 
            id: 'perfil_socio', title: 'Perfil Sociodemográfico', icon: 'Users',
            bioRationale: 'Crea la huella antropológica de la comunidad trabajadora (vulnerabilidades, demografía, contexto social) para personalizar la protección.', 
            normativity: 'Resolución 0312 de 2019 / Decreto 1072 de 2015' 
        },
        { 
            id: 'condiciones_salud', title: 'Informe Condiciones de Salud', icon: 'Activity',
            bioRationale: 'Establece la línea base fisiológica y psíquica del individuo. No podemos prevenir daños si no conocemos el estado inicial del cuerpo.', 
            normativity: 'Resolución 2346 de 2007 (Evaluaciones Médico Ocupacionales)' 
        },
        { 
            id: 'diagnostico', title: 'Diagnóstico Inicial', icon: 'Stethoscope',
            bioRationale: 'Evalúa el grado de madurez preventiva del ecosistema empresarial (el "cuerpo corporativo") para recibir de forma segura al ser humano.', 
            normativity: 'Resolución 0312 de 2019 (Estándares Mínimos)' 
        },
    ],
    do: [
        { 
            id: 'participacion_ipevar', title: 'Participación IPEVAR Bio-Individual', icon: 'Users',
            bioRationale: 'Empodera la voz del empleado sobre los miedos y riesgos que percibe en su cotidianidad vital. Cada participación genera puntos que reducen el índice bio-riesgo efectivo.', 
            normativity: 'Decreto 1072 de 2015 (Art. 2.2.4.6.15)' 
        },
        { 
            id: 'peligros', title: 'IPEVAR Bio-Individual', icon: 'AlertTriangle',
            bioRationale: 'Hub centralizado de consciencia bio-individual. Evalúa la interacción entre los peligros del cargo y el organismo único del trabajador bajo la metodología Bio-Individual WAPPY.', 
            normativity: 'Metodología Bio-Individual WAPPY / Decreto 1072 de 2015' 
        },
        { 
            id: 'metodo_owas', title: 'Método OWAS (Evaluación Física)', icon: 'Activity',
            bioRationale: 'Garantiza la armonía postural, protegiendo al esqueleto y musculatura humana de sobreesfuerzos crónicos.', 
            normativity: 'Resolución 2400 de 1979 / GTC 45' 
        },
        { 
            id: 'analisis_trabajo_seguro', title: 'Análisis de Trabajo Seguro (ATS)', icon: 'ShieldAlert',
            bioRationale: 'Induce a un estado de consciencia plena antes de ejecutar una tarea riesgosa, evitando el daño inmediato.', 
            normativity: 'Decreto 1072 de 2015' 
        },
        { 
            id: 'permiso_alturas', title: 'Permiso de Trabajo en Alturas', icon: 'Briefcase',
            bioRationale: 'Protección absoluta y protocolo de rescate ante condiciones que sobrepasan las capacidades evolutivas de supervivencia del individuo (alturas mortales).', 
            normativity: 'Resolución 4272 de 2021' 
        },
        { 
            id: 'vulnerabilidad', title: 'Análisis de Vulnerabilidad', icon: 'Target',
            bioRationale: 'Prepara psicológicamente y estructuralmente a la comunidad frente a la histeria colectiva o el desastre en una emergencia natural/tecnológica.', 
            normativity: 'Decreto 1072 de 2015 (Plan de Prevención, Preparación y Respuesta)' 
        },
        { 
            id: 'capacitaciones', title: 'Programa de Capacitación SG-SST', icon: 'UserCheck',
            bioRationale: 'Entrenamiento técnico y conductual adaptativo para que el trabajador se defienda inteligentemente de su entorno.', 
            normativity: 'Decreto 1072 de 2015 (Art. 2.2.4.6.11)' 
        },
    ],
    check: [
        { 
            id: 'politica', title: 'Política SST', icon: 'FileText',
            bioRationale: 'El manifiesto ético y la máxima promesa institucional de no lastimar y proteger inquebrantablemente al individuo.', 
            normativity: 'Decreto 1072 de 2015 (Art. 2.2.4.6.5)' 
        },
        { 
            id: 'objetivos', title: 'Objetivos SST', icon: 'Target',
            bioRationale: 'Metas cuantificables que certifican la inversión real de energía corporativa en cuidar el estado de bienestar.', 
            normativity: 'Decreto 1072 de 2015 (Art. 2.2.4.6.17/18)' 
        },
        { 
            id: 'rit', title: 'Reglamento Interno de Trabajo', icon: 'Briefcase',
            bioRationale: 'Las reglas de convivencia justa, respeto inter-personal y disciplina que garantizan el equilibrio psicosocial del espacio común.', 
            normativity: 'Código Sustantivo del Trabajo (CST)' 
        },
        { 
            id: 'rhs', title: 'Reglamento de Higiene', icon: 'FileText',
            bioRationale: 'Compromiso visible y protocolar frente a los riesgos tóxicos, infecciosos o mecánicos inherentes que el trabajador asume al ingresar.', 
            normativity: 'Código Sustantivo del Trabajo (Art. 349 y 350)' 
        },
        { 
            id: 'legal', title: 'Matriz Legal', icon: 'Scale',
            bioRationale: 'La alienación de nuestros estándares internos con las promesas de bienestar exigidas por los derechos humanos y la ley.', 
            normativity: 'Resolución 0312 de 2019 / Decreto 1072 de 2015' 
        },
        { 
            id: 'responsable', title: 'Responsable SG-SST', icon: 'UserCheck',
            bioRationale: 'El perfil del líder empático con la potestad moral para ser el principal guardián o avatar del bienestar dentro de la empresa.', 
            normativity: 'Resolución 0312 de 2019' 
        },
    ],
    act: [
        { 
            id: 'reporte_actos', title: 'Reporte de Actos Inseguros', icon: 'AlertTriangle',
            bioRationale: 'Canal de comunicación seguro donde se activa la protección mutua comunitaria (te cuido, me cuidas) sin miedo al castigo.', 
            normativity: 'Decreto 1072 de 2015' 
        },
        { 
            id: 'estadisticas', title: 'Estadísticas ATEL', icon: 'BarChart',
            bioRationale: 'Mapas cuantitativos y biométricos que muestran el sangrado o desequilibrio sistémico. Dónde perdimos salud.', 
            normativity: 'Resolución 0312 de 2019' 
        },
        { 
            id: 'investigacion_atel', title: 'Investigación ATEL', icon: 'Activity',
            bioRationale: 'Indagación forense de raíz para sanar y comprender verdaderamente por qué le fallamos y lastimamos a un bioindividuo.', 
            normativity: 'Resolución 1401 de 2007' 
        },
        { 
            id: 'auditoria', title: 'Informe de Auditoría', icon: 'ClipboardCheck',
            bioRationale: 'Meditación introspectiva de todo nuestro diseño organizativo. Un espejo para detectar fallas sistémicas a tiempo.', 
            normativity: 'Decreto 1072 de 2015 (Art. 2.2.4.6.29)' 
        },
        { 
            id: 'alta_direccion', title: 'Revisión por Alta Dirección', icon: 'Target',
            bioRationale: 'Reflexión directa y responsabilidad paternal de los grandes líderes empresariales sobre la sanidad de su fuerza de trabajo.', 
            normativity: 'Decreto 1072 de 2015 (Art. 2.2.4.6.31)' 
        },
        { 
            id: 'acpm', title: 'Matriz ACPM (Sanación)', icon: 'GitMerge',
            bioRationale: 'Acciones Correctivas y Preventivas reales. El testamento de que aprendimos de las heridas para evolucionar como un ente más seguro.', 
            normativity: 'Decreto 1072 de 2015 (Art. 2.2.4.6.33)' 
        },
    ],
    predict: [
        { 
            id: 'predictivo', title: 'Centro de Inteligencia Predictiva', icon: 'BrainCircuit',
            bioRationale: 'Visión superior habilitada por Inteligencia Artificial que cruza las esferas de vida del individuo detectando tendencias y salvaguardando vidas antes de la entropía.', 
            normativity: 'Cumplimiento Avanzado del Ciclo Estratégico (OIT / ISO 45001)' 
        }
    ]
};

