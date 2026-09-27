export const PHASE_CATEGORIES = {
    // ─── HITO 01: GOBERNANZA Y CIMIENTO LEGAL ───
    hito1: [
        { 
            id: 'diagnostico', title: 'Diagnóstico Inicial', icon: 'Stethoscope',
            bioRationale: 'Evalúa el grado de madurez preventiva y el nivel de cumplimiento legal de los estándares mínimos para recibir de forma segura al ser humano.', 
            normativity: 'Hito 1: Gobernanza y Cimiento Legal' 
        },
        { 
            id: 'participacion_ipevar', title: 'Participación IPEVAR Comunitaria', icon: 'Users',
            bioRationale: 'Empodera la voz del colaborador sobre los peligros que percibe en su cotidianidad vital para alimentar y actualizar la Matriz IPEVAR.', 
            normativity: 'Hito 1: Gobernanza y Cimiento Legal' 
        },
        { 
            id: 'matriz_ipevar_oficial', title: 'Matriz IPEVAR (GTC 45)', icon: 'AlertTriangle',
            bioRationale: 'Columna vertebral preventiva del SG-SST. Identifica peligros, evalúa y valora riesgos bajo GTC 45:2012 para proteger la integridad de los colaboradores.', 
            normativity: 'Hito 1: Gobernanza y Cimiento Legal (GTC 45:2012 / Dec. 1072 / Res. 0312)' 
        },
        { 
            id: 'responsable', title: 'Responsable SG-SST', icon: 'UserCheck',
            bioRationale: 'Custodia de la idoneidad técnica, licencia vigente y asignación del líder empático como principal guardián del bienestar.', 
            normativity: 'Hito 1: Gobernanza y Cimiento Legal' 
        },
        { 
            id: 'politica', title: 'Política de SST', icon: 'FileText',
            bioRationale: 'El manifiesto ético y la máxima promesa institucional de proteger inquebrantablemente al individuo y cumplir la ley.', 
            normativity: 'Hito 1: Gobernanza y Cimiento Legal' 
        },
        { 
            id: 'objetivos', title: 'Objetivos de SST', icon: 'Target',
            bioRationale: 'Metas cuantificables con indicadores de estructura, proceso y resultado para evaluar la inversión real en bienestar.', 
            normativity: 'Hito 1: Gobernanza y Cimiento Legal' 
        },
        { 
            id: 'legal', title: 'Matriz Legal', icon: 'Scale',
            bioRationale: 'Alineación sistemática de los estándares internos con los requisitos jurídicos de la legislación colombiana.', 
            normativity: 'Hito 1: Gobernanza y Cimiento Legal' 
        },
        { 
            id: 'rhs', title: 'Reglamento de Higiene (RHS)', icon: 'FileText',
            bioRationale: 'Protocolo formal frente a los factores de riesgo inherentes a la actividad económica de la organización.', 
            normativity: 'Hito 1: Gobernanza y Cimiento Legal' 
        },
        { 
            id: 'rit', title: 'Reglamento Interno (RIT)', icon: 'Briefcase',
            bioRationale: 'Marco de convivencia justa, orden, respeto interpersonal y régimen disciplinario con debido proceso.', 
            normativity: 'Hito 1: Gobernanza y Cimiento Legal' 
        },
        { 
            id: 'vulnerabilidad', title: 'Análisis de Vulnerabilidad', icon: 'Target',
            bioRationale: 'Prepara a la comunidad y sus brigadas frente a contingencias o emergencias naturales, tecnológicas y sociales.', 
            normativity: 'Hito 1: Gobernanza y Cimiento Legal' 
        }
    ],

    // ─── HITO 02: HUELLA BIOCÉNTRICA ───
    hito2: [
        { 
            id: 'perfil_cargo', title: 'Perfiles de Cargo (Roles)', icon: 'UserCircle',
            bioRationale: 'Identifica las exigencias biomecánicas, cognitivas y psicosociales reales a las que será expuesto el individuo.', 
            normativity: 'Hito 2: Huella Biocéntrica' 
        },
        { 
            id: 'perfil_socio', title: 'Perfil Sociodemográfico', icon: 'Users',
            bioRationale: 'Crea la huella antropológica de la comunidad trabajadora (vulnerabilidades, demografía, contexto social) para personalizar la protección.', 
            normativity: 'Hito 2: Huella Biocéntrica' 
        },
        { 
            id: 'condiciones_salud', title: 'Informe Condiciones de Salud', icon: 'Activity',
            bioRationale: 'Establece la línea base fisiológica y psíquica del individuo mediante exámenes médicos ocupacionales y aptitudes.', 
            normativity: 'Hito 2: Huella Biocéntrica' 
        },
        { 
            id: 'oraculo_predictivo', title: 'Dictamen de Compatibilidad Cargo-Persona', icon: 'Sparkles',
            bioRationale: 'Consolidación analítica que cruza el diseño del trabajo con la salud humana para certificar la compatibilidad y prevenir enfermedades laborales.', 
            normativity: 'Hito 2: Huella Biocéntrica' 
        }
    ],

    // ─── HITO 03: COMITÉS PARITARIOS & CONVIVENCIA LABORAL ───
    hito3: [
        { 
            id: 'copasst', title: 'COPASST / Vigía SST (Gestor Paritario y Actas)', icon: 'Award',
            bioRationale: 'Órgano paritario de vigilancia, inspección y consulta elegido por la comunidad trabajadora para la protección de la vida (Res. 2013/86, Dec. 1072/15).', 
            normativity: 'Hito 3: Comités Paritarios (Res. 2013/86 / Dec. 1072 / Res. 0312)' 
        },
        { 
            id: 'cocolab', title: 'Comité de Convivencia Laboral (Res. 3461 / Ley 2365)', icon: 'HeartHandshake',
            bioRationale: 'Protección del clima psicosocial, prevención del acoso laboral (término 65 días) y ruta prioritaria no conciliable contra el acoso sexual (Ley 2365/2024).', 
            normativity: 'Hito 3: Convivencia Laboral (Res. 3461/2025 / Ley 2365/2024 / Ley 1010/2006)' 
        }
    ],

    // ─── HITO 04: EVALUACIÓN DINÁMICA DE RIESGOS ───
    hito4: [
        { 
            id: 'animo', title: 'Termómetro Psicosocial', icon: 'Heart',
            bioRationale: 'Monitorea en tiempo real y de forma 100% anónima el bienestar psicosocial, estrés y fatiga con pulsos periódicos (7, 30 y 90 días) mediante código QR.', 
            normativity: 'Hito 4: Evaluación Dinámica de Riesgos' 
        },
        { 
            id: 'metodo_owas', title: 'Método OWAS (Evaluación Ergonómica)', icon: 'Activity',
            bioRationale: 'Garantiza la armonía postural, protegiendo al esqueleto y musculatura humana de sobreesfuerzos crónicos.', 
            normativity: 'Hito 4: Evaluación Dinámica de Riesgos' 
        },
        { 
            id: 'estudio_puesto', title: 'Estudio de Puesto de Trabajo (EPT)', icon: 'Activity',
            bioRationale: 'Evaluación postural y biomecánica en vivo con inteligencia artificial para armonizar la anatomía con la tarea.', 
            normativity: 'Hito 4: Evaluación Dinámica de Riesgos (Res. 2400 / ISO 11226)' 
        },
        { 
            id: 'peligros', title: 'Matriz Bio-IPEVAR', icon: 'AlertTriangle',
            bioRationale: 'Hub centralizado de consciencia bio-individual. Síntesis y culminación evaluativa: cruza los peligros del puesto con la anatomía y percepción del trabajador.', 
            normativity: 'Hito 4: Evaluación Dinámica de Riesgos' 
        }
    ],

    // ─── HITO 05: DINÁMICA OPERATIVA Y TERRENO ───
    hito5: [
        { 
            id: 'permiso_alturas', title: 'Permiso de Trabajo en Alturas', icon: 'Briefcase',
            bioRationale: 'Protección absoluta, validación de listas y protocolos de rescate ante trabajos en alturas (Res. 4272/2021).', 
            normativity: 'Hito 5: Dinámica Operativa y Terreno' 
        },
        { 
            id: 'analisis_trabajo_seguro', title: 'Análisis de Trabajo Seguro (ATS)', icon: 'ShieldAlert',
            bioRationale: 'Induce a un estado de consciencia plena paso a paso antes de ejecutar una tarea riesgosa o no rutinaria.', 
            normativity: 'Hito 5: Dinámica Operativa y Terreno' 
        },
        { 
            id: 'epp_delivery', title: 'Entrega y Seguimiento de EPP', icon: 'Shield',
            bioRationale: 'Asegura la entrega oportuna, control de caducidad y firmas de conformidad de elementos de protección personal.', 
            normativity: 'Hito 5: Dinámica Operativa y Terreno' 
        },
        { 
            id: 'vehicles_pesv', title: 'Hoja de Vida Automotores (PESV)', icon: 'Car',
            bioRationale: 'Controla el ciclo de mantenimiento, SOAT, Técnico-Mecánica e inspecciones diarias pre-operacionales firmadas (Res. 20223040040595).',
            normativity: 'Hito 5: Dinámica Operativa y Terreno'
        },
        { 
            id: 'heights_lifecycle', title: 'Hoja de Vida de Equipos de Alturas', icon: 'Wrench',
            bioRationale: 'Administra y certifica la vida útil de arneses, eslingas e inspecciones anuales reglamentarias contra caídas.',
            normativity: 'Hito 5: Dinámica Operativa y Terreno'
        },
        { 
            id: 'chemical_registry', title: 'Registro y Rótulo de Productos Químicos', icon: 'FlaskConical',
            bioRationale: 'Inventario de sustancias químicas, compatibilidad de almacenamiento, control de FDS y pictogramas SGA.',
            normativity: 'Hito 5: Dinámica Operativa y Terreno'
        }
    ],

    // ─── HITO 06: CULTURA, ESCUELA E INNOVACIÓN ───
    hito6: [
        { 
            id: 'reporte_actos', title: 'Reporte de Actos y Condiciones', icon: 'AlertTriangle',
            bioRationale: 'Canal seguro para reportar actos y condiciones inseguras con foto, activando la protección comunitaria antes del daño.', 
            normativity: 'Hito 6: Cultura, Escuela e Innovación' 
        },
        { 
            id: 'capacitaciones', title: 'Programa de Capacitación SG-SST', icon: 'UserCheck',
            bioRationale: 'Entrenamiento técnico y conductual adaptativo para que el trabajador se defienda inteligentemente de su entorno.', 
            normativity: 'Hito 6: Cultura, Escuela e Innovación' 
        },
        { 
            id: 'ruta_aprendizaje', title: 'Rutas de Aprendizaje (LMS)', icon: 'GraduationCap',
            bioRationale: 'Aula virtual interactiva con cursos personalizados, evaluaciones asistidas por IA y certificación de competencias.', 
            normativity: 'Hito 6: Cultura, Escuela e Innovación' 
        },
        { 
            id: 'app_builder', title: 'Creador de Aplicativos (App Builder)', icon: 'Blocks',
            bioRationale: 'Ensambla tus propios micro-aplicativos y formularios a la medida para captura e inspección en campo sin código.', 
            normativity: 'Hito 6: Cultura, Escuela e Innovación' 
        }
    ],

    // ─── HITO 07: AUDITORÍA, CAUSALIDAD Y MEJORA CONTINUA ───
    hito7: [
        { 
            id: 'estadisticas', title: 'Gestión Integral de Ausentismo & ATEL', icon: 'BarChart',
            bioRationale: 'Control de ausentismo médico y laboral, indicadores ATEL (Res. 0312 Art. 30), y balance financiero de pérdidas por IBC y recobros.', 
            normativity: 'Hito 7: Auditoría, Causalidad y Mejora Continua' 
        },
        { 
            id: 'investigacion_atel', title: 'Investigación Forense ATEL', icon: 'Activity',
            bioRationale: 'Indagación forense de causa raíz (Árbol de Causas e Ishikawa) asistida por IA para restaurar la salud del sistema.', 
            normativity: 'Hito 7: Auditoría, Causalidad y Mejora Continua' 
        },
        { 
            id: 'control_acpm', title: 'Tablero Kanban ACPM', icon: 'Trello',
            bioRationale: 'Control ágil e integral de las Acciones Correctivas, Preventivas y de Mejora generadas en el sistema.',
            normativity: 'Hito 7: Auditoría, Causalidad y Mejora Continua'
        },
        { 
            id: 'auditoria', title: 'Informe de Auditoría SG-SST', icon: 'ClipboardCheck',
            bioRationale: 'Examen anual introspectivo de la eficacia del sistema de gestión con participación del COPASST o Vigía.', 
            normativity: 'Hito 7: Auditoría, Causalidad y Mejora Continua' 
        },
        { 
            id: 'alta_direccion', title: 'Revisión por la Alta Dirección', icon: 'Target',
            bioRationale: 'Evaluación anual de 22 puntos y rendición de cuentas de los líderes sobre la salud y recursos de la empresa.', 
            normativity: 'Hito 7: Auditoría, Causalidad y Mejora Continua' 
        },
        { 
            id: 'investigacion_profunda', title: 'Investigación Profunda SST', icon: 'Search',
            bioRationale: 'Consultas avanzadas de doctrina, normatividad colombiana y análisis sistémico profundo.', 
            normativity: 'Hito 7: Auditoría, Causalidad y Mejora Continua' 
        }
    ],

    // ─── HITO 08: INTELIGENCIA ARTIFICIAL & ORÁCULO PREDICTIVO ───
    hito8: [
        { 
            id: 'predictivo', title: 'Centro de Inteligencia Predictiva', icon: 'BrainCircuit',
            bioRationale: 'Cúspide de analítica avanzada y machine learning: pronóstico estocástico de siniestralidad, radar de 9 dominios bioindividuales y prescripción proactiva de controles.', 
            normativity: 'Hito 8: Inteligencia Artificial & Oráculo Predictivo' 
        }
    ],

    // ─── ALIAS PARA RETROCOMPATIBILIDAD ───
    get fase1() { return this.hito1; },
    get fase2() { return this.hito7; }
};

export const SGSST_MODULE_PHASE_MAP: Record<string, string> = {
    // Hito 1: Gobernanza y Cimiento Legal
    diagnostico: 'hito1',
    participacion_ipevar: 'hito1',
    matriz_ipevar_oficial: 'hito1',
    responsable: 'hito1',
    politica: 'hito1',
    objetivos: 'hito1',
    legal: 'hito1',
    rhs: 'hito1',
    rit: 'hito1',
    vulnerabilidad: 'hito1',

    // Hito 2: Huella Biocéntrica
    perfil_socio: 'hito2',
    perfil_sociodemografico: 'hito2',
    condiciones_salud: 'hito2',
    perfil_cargo: 'hito2',
    oraculo_predictivo: 'hito2',

    // Hito 3: Comités Paritarios & Convivencia Laboral
    copasst: 'hito3',
    cocolab: 'hito3',
    convivencia: 'hito3',
    comites: 'hito3',

    // Hito 4: Evaluación Dinámica de Riesgos
    animo: 'hito4',
    metodo_owas: 'hito4',
    estudio_puesto: 'hito4',
    peligros: 'hito4',

    // Hito 5: Dinámica Operativa y Terreno
    permiso_alturas: 'hito5',
    analisis_trabajo_seguro: 'hito5',
    epp_delivery: 'hito5',
    vehicles_pesv: 'hito5',
    heights_lifecycle: 'hito5',
    chemical_registry: 'hito5',

    // Hito 6: Cultura, Escuela e Innovación
    reporte_actos: 'hito6',
    capacitaciones: 'hito6',
    ruta_aprendizaje: 'hito6',
    app_builder: 'hito6',
    custom_html_sandbox: 'hito6',

    // Hito 7: Auditoría, Causalidad & Cierre de Ciclo
    estadisticas: 'hito7',
    investigacion_atel: 'hito7',
    control_acpm: 'hito7',
    acpm: 'hito7',
    auditoria: 'hito7',
    alta_direccion: 'hito7',
    investigacion_profunda: 'hito7',

    // Hito 8: Inteligencia Artificial & Oráculo Predictivo
    predictivo: 'hito8',
};

