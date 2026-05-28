export const PHASE_CATEGORIES = {
    // ─── MOTOR BIO-INDIVIDUAL ───
    hito1: [
        { 
            id: 'perfil_cargo', title: 'Perfiles de Cargo (Roles)', icon: 'UserCircle',
            bioRationale: 'Identifica las exigencias biomecánicas, cognitivas y psicosociales reales a las que será expuesto el individuo.', 
            normativity: 'Hito 1: Huella Biocéntrica' 
        },
        { 
            id: 'perfil_socio', title: 'Perfil Sociodemográfico', icon: 'Users',
            bioRationale: 'Crea la huella antropológica de la comunidad trabajadora (vulnerabilidades, demografía, contexto social) para personalizar la protección.', 
            normativity: 'Hito 1: Huella Biocéntrica' 
        },
        { 
            id: 'condiciones_salud', title: 'Informe Condiciones de Salud', icon: 'Activity',
            bioRationale: 'Establece la línea base fisiológica y psíquica del individuo. No podemos prevenir daños si no conocemos el estado inicial del cuerpo.', 
            normativity: 'Hito 1: Huella Biocéntrica' 
        },
        { 
            id: 'oraculo_predictivo', title: 'Oráculo Predictivo H1', icon: 'Sparkles',
            bioRationale: 'Consolidación predictiva que cruza el diseño del trabajo con la salud humana para predecir incompatibilidades y emitir un dictamen de aptitud.', 
            normativity: 'Hito 1: Huella Biocéntrica' 
        }
    ],
    hito2: [
        { 
            id: 'peligros', title: 'Matriz Bio-IPEVAR', icon: 'AlertTriangle',
            bioRationale: 'Hub centralizado de consciencia bio-individual. Evalúa la interacción entre los peligros del cargo y el organismo único del trabajador.', 
            normativity: 'Hito 2: Núcleo Bio-Evaluativo' 
        }
    ],
    hito3: [
        { 
            id: 'participacion_ipevar', title: 'Participación IPEVAR Bio-Individual', icon: 'Users',
            bioRationale: 'Empodera la voz del empleado sobre los miedos y riesgos que percibe en su cotidianidad vital. Suma puntos de percepción.', 
            normativity: 'Hito 3: Dinámica de Exposición' 
        },
        { 
            id: 'reporte_actos', title: 'Reporte de Actos Inseguros', icon: 'AlertTriangle',
            bioRationale: 'Canal de comunicación seguro donde se activa la protección mutua comunitaria (te cuido, me cuidas) sin miedo al castigo.', 
            normativity: 'Hito 3: Dinámica de Exposición' 
        },
        { 
            id: 'capacitaciones', title: 'Programa de Capacitación SG-SST', icon: 'UserCheck',
            bioRationale: 'Entrenamiento técnico y conductual adaptativo para que el trabajador se defienda inteligentemente de su entorno.', 
            normativity: 'Hito 3: Dinámica de Exposición' 
        },
        { 
            id: 'analisis_trabajo_seguro', title: 'Análisis de Trabajo Seguro (ATS)', icon: 'ShieldAlert',
            bioRationale: 'Induce a un estado de consciencia plena antes de ejecutar una tarea riesgosa, evitando el daño inmediato.', 
            normativity: 'Hito 3: Dinámica de Exposición' 
        },
        { 
            id: 'permiso_alturas', title: 'Permiso de Trabajo en Alturas', icon: 'Briefcase',
            bioRationale: 'Protección absoluta y protocolo de rescate ante condiciones que sobrepasan las capacidades evolutivas de supervivencia.', 
            normativity: 'Hito 3: Dinámica de Exposición' 
        },
        { 
            id: 'metodo_owas', title: 'Método OWAS (Evaluación Física)', icon: 'Activity',
            bioRationale: 'Garantiza la armonía postural, protegiendo al esqueleto y musculatura humana de sobreesfuerzos crónicos.', 
            normativity: 'Hito 3: Dinámica de Exposición' 
        }
    ],
    hito4: [
        { 
            id: 'estadisticas', title: 'Estadísticas ATEL', icon: 'BarChart',
            bioRationale: 'Mapas cuantitativos y biométricos que muestran el sangrado o desequilibrio sistémico. Dónde perdimos salud.', 
            normativity: 'Hito 4: Traumatismo y Curación' 
        },
        { 
            id: 'investigacion_atel', title: 'Investigación ATEL', icon: 'Activity',
            bioRationale: 'Indagación forense de raíz para sanar y comprender verdaderamente por qué le fallamos y lastimamos a un bioindividuo.', 
            normativity: 'Hito 4: Traumatismo y Curación' 
        }
    ],
    hito5: [
        { 
            id: 'predictivo', title: 'Centro de Inteligencia Predictiva', icon: 'BrainCircuit',
            bioRationale: 'Visión superior habilitada por Inteligencia Artificial que cruza las esferas de vida del individuo detectando tendencias y salvaguardando vidas antes de la entropía.', 
            normativity: 'Hito 5: Oráculo Predictivo' 
        }
    ],

    // ─── BÓVEDA DE CUMPLIMIENTO LEGAL (PHVA) ───
    planear: [
        { 
            id: 'diagnostico', title: 'Diagnóstico Inicial', icon: 'Stethoscope',
            bioRationale: 'Evalúa el grado de madurez preventiva del ecosistema empresarial (el "cuerpo corporativo") para recibir de forma segura al ser humano.', 
            normativity: 'Resolución 0312 de 2019' 
        },
        { 
            id: 'politica', title: 'Política SST', icon: 'FileText',
            bioRationale: 'El manifiesto ético y la máxima promesa institucional de no lastimar y proteger inquebrantablemente al individuo.', 
            normativity: 'Decreto 1072 de 2015' 
        },
        { 
            id: 'objetivos', title: 'Objetivos SST', icon: 'Target',
            bioRationale: 'Metas cuantificables que certifican la inversión real de energía corporativa en cuidar el estado de bienestar.', 
            normativity: 'Decreto 1072 de 2015' 
        },
        { 
            id: 'legal', title: 'Matriz Legal', icon: 'Scale',
            bioRationale: 'La alienación de nuestros estándares internos con las promesas de bienestar exigidas por los derechos humanos y la ley.', 
            normativity: 'Resolución 0312 / Decreto 1072' 
        },
        { 
            id: 'rhs', title: 'Reglamento de Higiene', icon: 'FileText',
            bioRationale: 'Compromiso visible y protocolar frente a los riesgos tóxicos, infecciosos o mecánicos inherentes que el trabajador asume al ingresar.', 
            normativity: 'CST Art. 349 y 350' 
        },
        { 
            id: 'rit', title: 'Reglamento Interno', icon: 'Briefcase',
            bioRationale: 'Las reglas de convivencia justa, respeto inter-personal y disciplina que garantizan el equilibrio psicosocial del espacio común.', 
            normativity: 'CST' 
        },
        { 
            id: 'responsable', title: 'Responsable SG-SST', icon: 'UserCheck',
            bioRationale: 'El perfil del líder empático con la potestad moral para ser el principal guardián o avatar del bienestar dentro de la empresa.', 
            normativity: 'Resolución 0312 de 2019' 
        },
        { 
            id: 'app_builder', title: 'Creador de Aplicativos', icon: 'Blocks',
            bioRationale: 'Ensambla tus propios aplicativos a la medida usando Inteligencia Artificial y bloques de construcción estructurados.', 
            normativity: 'WAPPY No-Code' 
        }
    ],
    hacer: [
        { 
            id: 'vulnerabilidad', title: 'Análisis de Vulnerabilidad', icon: 'Target',
            bioRationale: 'Prepara psicológica y estructuralmente a la comunidad frente a la histeria colectiva o el desastre en una emergencia natural/tecnológica.', 
            normativity: 'Decreto 1072 de 2015' 
        }
    ],
    verificar: [
        { 
            id: 'auditoria', title: 'Informe de Auditoría', icon: 'ClipboardCheck',
            bioRationale: 'Meditación introspectiva de todo nuestro diseño organizativo. Un espejo para detectar fallas sistémicas a tiempo.', 
            normativity: 'Decreto 1072 de 2015' 
        },
        { 
            id: 'alta_direccion', title: 'Revisión Alta Dirección', icon: 'Target',
            bioRationale: 'Reflexión directa y responsabilidad paternal de los grandes líderes empresariales sobre la sanidad de su fuerza de trabajo.', 
            normativity: 'Decreto 1072 de 2015' 
        }
    ],
    actuar: [
        { 
            id: 'acpm', title: 'Matriz ACPM', icon: 'GitMerge',
            bioRationale: 'Acciones Correctivas y Preventivas reales. El testamento de que aprendimos de las heridas para evolucionar como un ente más seguro.', 
            normativity: 'Decreto 1072 de 2015' 
        }
    ]
};

