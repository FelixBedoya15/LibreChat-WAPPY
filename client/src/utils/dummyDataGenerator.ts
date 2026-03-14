export const generateDummyData = {
    // 0. Perfil Sociodemografico
    perfilSociodemografico: () => {
        const d = new Date();
        const past = (months: number) => new Date(d.setMonth(d.getMonth() - months)).toISOString().split('T')[0];
        
        return [
            {
                id: crypto.randomUUID(),
                nombre: 'Carlos Alberto Ramírez Torres',
                identificacion: '79845123',
                edad: 45,
                genero: 'Masculino',
                estadoCivil: 'Casado/a',
                nivelEscolaridad: 'Profesional',
                direccion: 'Carrera 7 # 156-20, Bogotá',
                telefono: '3104567890',
                cargo: 'Gerente General',
                fechaExamenMedico: past(6),
                fechaCursoAlturasAutorizado: past(12),
                fechaCursoAlturasCoordinador: past(12),
                diagnosticoMedico: 'Sano',
                recomendacionesMedicas: 'Pausas activas visuales cada 2 horas.',
                fechaSeguimiento: past(-6), // in 6 months
                completedByAI: false,
                consentimientoFirmaDigital: 'Sí',
                firmaDigital: null
            },
            {
                id: crypto.randomUUID(),
                nombre: 'Ana María Gómez Pérez',
                identificacion: '52418790',
                edad: 32,
                genero: 'Femenino',
                estadoCivil: 'Soltero/a',
                nivelEscolaridad: 'Tecnólogo',
                direccion: 'Calle 100 # 15-40, Bogotá',
                telefono: '3209876543',
                cargo: 'Analista SST',
                fechaExamenMedico: past(2),
                fechaCursoAlturasAutorizado: past(5),
                fechaCursoAlturasCoordinador: '',
                diagnosticoMedico: 'Miopía leve',
                recomendacionesMedicas: 'Uso de lentes de descanso en pantalla.',
                fechaSeguimiento: past(-10),
                completedByAI: false,
                consentimientoFirmaDigital: 'No',
                firmaDigital: null
            },
            {
                id: crypto.randomUUID(),
                nombre: 'Luis Fernando Rodríguez',
                identificacion: '1098765432',
                edad: 28,
                genero: 'Masculino',
                estadoCivil: 'Unión Libre',
                nivelEscolaridad: 'Bachiller',
                direccion: 'Transversal 91 # 120-10, Bogotá',
                telefono: '3001234567',
                cargo: 'Operario de Producción',
                fechaExamenMedico: past(1),
                fechaCursoAlturasAutorizado: past(1),
                fechaCursoAlturasCoordinador: '',
                diagnosticoMedico: 'Lumbalgia mecánica',
                recomendacionesMedicas: 'Evitar levantamiento de cargas mayores a 15kg. Terapia física.',
                fechaSeguimiento: past(-1),
                completedByAI: false,
                consentimientoFirmaDigital: 'Sí',
                firmaDigital: null
            }
        ];
    },

    // 1. Analisis de Trabajo Seguro (ATS)
    ats: () => ({
        fecha: new Date().toISOString().split('T')[0],
        horaInicio: "08:00",
        horaFin: "17:00",
        lugar: "Planta de Producción Módulo 3",
        descripcionTarea: "Mantenimiento preventivo y correctivo de banda transportadora principal, incluye cambio de rodillos y tensado de banda.",
        herramientas: "Juego de llaves, polipasto manual, multímetro, bloqueador de energías (LOTO), taladro inalámbrico.",
        equipos: "Banda transportadora, motorreductor trifásico.",
        responsableEjecutante: "Técnico Mecánico",
        supervisor: "Ingeniero de Mantenimiento",
        pasos: [
            {
                id: crypto.randomUUID(),
                paso: "1. Aislamiento de energías (LOTO)",
                peligros: ["Riesgo eléctrico por contacto directo", "Atrapamiento mecánico"],
                consecuencias: ["Electrocución", "Amputación"],
                controles: ["Desenergizar tablero principal", "Aplicar candado y tarjeta (LOTO)", "Verificar ausencia de tensión con multímetro"]
            },
            {
                id: crypto.randomUUID(),
                paso: "2. Desmontaje de rodillos dañados",
                peligros: ["Sobreesfuerzo", "Caída de objetos pesados"],
                consecuencias: ["Lumbalgia", "Fracturas en extremidades inferiores"],
                controles: ["Uso de polipasto para levantar rodillos", "Botas con puntera de acero", "Ayuda mecánica o trabajo en equipo"]
            },
            {
                id: crypto.randomUUID(),
                paso: "3. Instalación de componentes nuevos y pruebas",
                peligros: ["Atrapamiento por partes móviles"],
                consecuencias: ["Machucones, cortes, amputación"],
                controles: ["Mantener distancia segura", "Instalar guardas antes de la prueba con energía", "Uso de guantes ajustados anticorte"]
            }
        ],
        epp: {
            casco: true,
            gafas: true,
            guantes: true,
            botas: true,
            auditiva: true,
            respiratoria: false,
            arnes: false,
            ropa: true
        }
    }),

    // 2. Analisis de Vulnerabilidad
    vulnerabilidad: () => ({
        amenazasList: [
            {
                id: crypto.randomUUID(),
                amenaza: 'Sismo / Terremoto',
                origenAmenaza: 'Natural',
                descripcionGlobal: 'La instalación se encuentra en una zona de amenaza sísmica intermedia según la NSR-10.',
                nivelAmenaza: 'Probable',
                puntajePersonas: 2.0, // Amarillo
                puntajeRecursos: 1.0, // Verde
                puntajeSistemas: 2.1, // Rojo (Ej. No hay planta eléctrica redundante)
            },
            {
                id: crypto.randomUUID(),
                amenaza: 'Incendio Estructural',
                origenAmenaza: 'Tecnológico',
                descripcionGlobal: 'Presencia de material combustible en archivo central y fallas eléctricas. Red contra incendio limitada.',
                nivelAmenaza: 'Problable',
                puntajePersonas: 1.0, // Verde (rutas de evacuación claras)
                puntajeRecursos: 2.2, // Rojo (extintores vencidos)
                puntajeSistemas: 1.0, 
            },
            {
                id: crypto.randomUUID(),
                amenaza: 'Hurto / Robo a Mano Armada',
                origenAmenaza: 'Social',
                descripcionGlobal: 'Zona reporta incremento delincuencial. Posible ingreso violento a caja/bodega.',
                nivelAmenaza: 'Posible',
                puntajePersonas: 2.0, 
                puntajeRecursos: 1.5, 
                puntajeSistemas: 1.0, 
            }
        ],
        evaluadoresList: [
            { id: crypto.randomUUID(), nombre: 'Carlos Andrés Ruiz', cedula: '1023456789', rol: 'Jefe de Brigada' },
            { id: crypto.randomUUID(), nombre: 'Diana Marcela Gómez', cedula: '1122334455', rol: 'Analista SST' }
        ]
    }),

    // 3. Auditoria Checklist & Diagnostico
    checklist: (items: any[]) => {
        // Receives current items, returns items with random values & findings
        const statuses = ['Cumple', 'No Cumple', 'No Aplica'];
        return items.map(item => {
            const status = statuses[Math.floor(Math.random() * (item.isCritico ? 2 : 3))]; // Favor Comple/No Cumple for criticals
            return {
                ...item,
                estado: status,
                evidencia: status === 'No Cumple' 
                    ? `Hallazgo simulado: En la revisión documental no se encontró ${item.pregunta.split(' ').slice(0,5).join(' ')} actualizado.`
                    : status === 'Cumple' 
                        ? 'Se verificó en archivo magnético el documento firmado y socializado.'
                        : 'Condición no verificable por el tamaño actual de la organización.',
                planAccion: status === 'No Cumple' ? 'Actualizar documento, firmar por representante legal y divulgar.' : ''
            };
        });
    },

    // 4. Estadisticas ATEL (función legacy - meses globales)
    estadisticas: () => {
        const stats: Record<string, any> = {};
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        let accumulatedHours = 0;
        
        months.forEach((m, i) => {
            // Simulated variation
            const baseWorkers = 50 + Math.floor(Math.random() * 5);
            const hours = baseWorkers * 240 * (1 - (Math.random() * 0.05)); // 240hrs/month approx
            accumulatedHours += hours;
            
            stats[m] = {
                horasTrabajadas: Math.round(hours),
                accidentesTotales: i % 4 === 0 ? 1 : 0, // 1 accident every 4 months
                accidentesFatales: 0,
                diasPerdidos: i % 4 === 0 ? Math.floor(Math.random() * 5) + 1 : 0,
                casosEnfermedad: i === 6 ? 1 : 0, // 1 disease in july
                numTrabajadores: baseWorkers
            };
        });
        return stats;
    },

    // 4b. Estadisticas ATEL — estructura que usa EstadisticasATEL.tsx (MonthData)
    estadisticasATEL: () => ({
        numTrabajadores: 52,
        diasProgramados: 22,
        events: [
            {
                id: crypto.randomUUID(),
                tipo: 'AT' as const,
                fecha: new Date().toISOString().split('T')[0],
                peligro: 'Locativo – piso resbaloso',
                causaInmediata: 'Mancha de aceite no señalizada en zona de despachos',
                consecuencia: 'Trauma contuso en rodilla derecha y esguince muñeca',
                diasIncapacidad: 3,
                diasCargados: 3,
                parteCuerpo: 'Rodilla derecha',
            },
            {
                id: crypto.randomUUID(),
                tipo: 'Ausentismo' as const,
                fecha: new Date().toISOString().split('T')[0],
                peligro: 'Biológico',
                causaInmediata: 'Enfermedad general – infección respiratoria aguda',
                consecuencia: 'Incapacidad por gripe con complicaciones',
                diasIncapacidad: 5,
                diasCargados: 0,
            }
        ]
    }),

    // 5. Investigacion ATEL
    investigacion: () => ({
        tipoEvento: 'Accidente de Trabajo',
        novedad: 'Reporte Inicial',
        // Trabajador
        nombreAccidentado: 'Luis Fernando Rodríguez',
        cedula: '1098765432',
        cargo: 'Operario de Producción',
        edad: 34,
        genero: 'Masculino',
        fechaIngreso: '2021-03-15',
        tiempoCargo: '3 años',
        salario: '$1.500.000',
        jornadaNormal: 'Diurna',
        diasLaborados: 5,
        // Evento
        fechaEvento: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], // 2 days ago
        horaEvento: '14:30',
        diaSemana: 'Miércoles',
        diferenciaTiempo: '6:30 hrs',
        jornadaEvento: 'Normal',
        laborHabitual: 'Sí',
        lugarEvento: 'Bodega Principal - Área de Despachos',
        sitioContexto: 'Empresa',
        gravedadEvento: 'Incapacitante Leve',
        // Detalles
        descripcionDetallada: `El trabajador se encontraba trasladando una caja de 18kg desde la zona de paletizado hacia la rampa de despacho. Al caminar por el pasillo central, pisó una mancha de aceite hidráulico proveniente del montacargas M-02 que no había sido demarcada ni limpiada. El trabajador pierde el equilibrio, sufre una caída a nivel y apoya bruscamente su rodilla derecha y mano derecha contra el suelo, resultando en trauma contuso en rodilla y esguince grado 1 en muñeca derecha.`,
        agenteLesion: 'Superficie de trabajo (piso resbaloso)',
        mecanismoLesion: 'Caída de personas a nivel',
        naturalezaLesion: 'Esguince y trauma contuso',
        parteCuerpo: 'Rodilla derecha y muñeca derecha',
        // Equipo Inv
        equipoList: [
            { id: crypto.randomUUID(), nombre: 'Dra. María Fernández', cargo: 'Jefe Inmediato', cedula: '52555666' },
            { id: crypto.randomUUID(), nombre: 'Pedro Alzate', cargo: 'Representante COPASST', cedula: '71111222' },
            { id: crypto.randomUUID(), nombre: 'Andrea Solano', cargo: 'Responsable SST', cedula: '10304050' },
            { id: crypto.randomUUID(), nombre: 'Juan Carlos Yepes', cargo: 'Representante Legal', cedula: '99000888' }
        ],
        // Testigos
        testigosList: [
            { id: crypto.randomUUID(), nombre: 'Carlos Medina', cedula: '10203040', cargo: 'Operario Montacargas', version: 'Yo estaba a unos 10 metros, escuché el golpe y vi cuando Luis cayó. Vi que el piso estaba manchado.' }
        ]
    }),

    // 6. Matriz Legal
    matrizLegal: () => ({
        normasAnadidas: [
            { id: crypto.randomUUID(), num: 'Decreto 1072', title: 'Decreto 1072 de 2015', year: 2015, entity: 'MinTrabajo', status: 'Vigente', info: 'Decreto Único Reglamentario del Sector Trabajo.', article: 'Art. 2.2.4.6.15. Identificación de Peligros', applyContext: 'Identificación de peligros, evaluación y valoración de riesgos.', hasCumplimiento: 'Sí', hasEvidencia: 'Sí' },
            { id: crypto.randomUUID(), num: 'Res. 0312', title: 'Resolución 0312 de 2019', year: 2019, entity: 'MinTrabajo', status: 'Vigente', info: 'Estándares Mínimos del SG-SST.', article: 'Capítulo 3', applyContext: 'Plan Anual de Trabajo y Capacitación.', hasCumplimiento: 'Sí', hasEvidencia: 'Parcial' },
            { id: crypto.randomUUID(), num: 'Ley 1562', title: 'Ley 1562 de 2012', year: 2012, entity: 'Congreso', status: 'Vigente', info: 'Modifica el sistema de riesgos laborales.', article: 'Art. 3. Accidente de Trabajo', applyContext: 'Reporte e investigación de ATEL.', hasCumplimiento: 'Sí', hasEvidencia: 'Sí' },
            { id: crypto.randomUUID(), num: 'Res. 1401', title: 'Resolución 1401 de 2007', year: 2007, entity: 'MinTrabajo', status: 'Vigente', info: 'Reglamenta la investigación de ATEL.', article: 'Toda la resolución', applyContext: 'Conformación del equipo investigador y metodología.', hasCumplimiento: 'No', hasEvidencia: 'No' },
            { id: crypto.randomUUID(), num: 'Res. 4272', title: 'Resolución 4272 de 2021', year: 2021, entity: 'MinTrabajo', status: 'Vigente', info: 'Requisitos mínimos para trabajo en alturas.', article: 'Art. 4. Programa de prevención.', applyContext: 'Actividades de mantenimiento en cubiertas (>2m).', hasCumplimiento: 'Sí', hasEvidencia: 'Sí' }
        ]
    }),

    // 8. Metodo OWAS
    owas: () => ({
        cargosEvaluados: [
            {
                id: crypto.randomUUID(),
                cargoAnalizado: "Operario de Empaque Manual",
                fechaEvaluacion: new Date().toISOString().split('T')[0],
                tarea: "Estibado de cajas en nivel bajo (nivel de piso a 1m)",
                espalda: "2", // Doblada
                brazos: "1", // Ambos brazos bajo el hombro
                piernas: "4", // De rodillas o agachado
                carga: "2", // Entre 10kg y 20kg
                calculado: true,
                categoria: "3",
                accionRequerida: "Efectos perjudiciales. Es necesaria la acción correctiva lo antes posible."
            },
            {
                id: crypto.randomUUID(),
                cargoAnalizado: "Analista de Laboratorio",
                fechaEvaluacion: new Date().toISOString().split('T')[0],
                tarea: "Titulación en mesa de trabajo (microscopio/bureta)",
                espalda: "2", // Doblada (inclinación cuello/tronco)
                brazos: "2", // Un brazo elevado
                piernas: "1", // Sentado cómodamente
                carga: "1", // Menos de 10kg
                calculado: true,
                categoria: "2",
                accionRequerida: "Tensión leve. Se requieren acciones correctivas a corto plazo."
            }
        ]
    }),

    // 8b. Metodo OWAS (componente MetodoOwas — estructura con registros[])
    metodoOwas: () => ({
        registros: [
            { cargoAnalizado: 'Operario de Embalaje', tarea: 'Levantamiento de caja desde el piso (peso ~12kg)', espalda: '2', brazos: '1', piernas: '4', carga: '2' },
            { cargoAnalizado: 'Operario de Embalaje', tarea: 'Colocación de caja en banda transportadora (altura media)', espalda: '1', brazos: '1', piernas: '2', carga: '2' },
            { cargoAnalizado: 'Operario de Embalaje', tarea: 'Flexión de tronco para alcanzar caja en nivel inferior', espalda: '3', brazos: '1', piernas: '2', carga: '2' },
            { cargoAnalizado: 'Operario de Embalaje', tarea: 'Paletizado con carga en altura de hombro', espalda: '2', brazos: '2', piernas: '2', carga: '2' },
            { cargoAnalizado: 'Operario de Embalaje', tarea: 'Caminar cargando paquete entre zonas', espalda: '1', brazos: '1', piernas: '7', carga: '2' },
        ]
    }),

    // 9. Objetivos SST
    objetivos: () => ({
        yearPlan: new Date().getFullYear().toString(),
        objectivesList: [
            { id: crypto.randomUUID(), objective: "Reducir la frecuencia de incidentes y accidentes de trabajo", goal: "Disminuir en un 10% el Índice de Frecuencia de AT respecto al año anterior.", kpi: "Índice de Frecuencia AT", resources: "Presupuesto capacitación, tiempo de brigadistas" },
            { id: crypto.randomUUID(), objective: "Garantizar el cumplimiento del Plan de Capacitación SG-SST", goal: "Ejecutar el 90% de las actividades programadas en el plan anual.", kpi: "Porcentaje de cobertura de capacitación", resources: "Plataforma e-learning, instructores externos" },
            { id: crypto.randomUUID(), objective: "Evaluar e intervenir el Riesgo Psicosocial", goal: "Aplicar la batería de riesgo psicosocial (Mintrabajo) al 100% del personal operativo.", kpi: "Cobertura evaluación psicosocial", resources: "Psicólogo especialista SST, software recolección" },
            { id: crypto.randomUUID(), objective: "Mejorar las condiciones de orden y aseo (5S)", goal: "Alcanzar calificación promedio >85% en las inspecciones mensuales de O&A.", kpi: "Puntaje promedio inspecciones", resources: "Kits de limpieza, estanterías, etiquetas" }
        ]
    }),

    // 11. Permiso Alturas
    permisoAlturas: () => ({
        fecha: new Date().toISOString().split('T')[0],
        horaInicio: "08:30",
        horaFin: "12:00",
        lugar: "Fachada Norte - Edificio Administrativo",
        labor: "Limpieza de ventanales y mantenimiento de sellos en silicona (Piso 3, altura approx 12m).",
        // Trabajadores Autorizados
        trabajadoresAut: [
            { id: crypto.randomUUID(), nombre: 'Andrés Felipe Cardona', cedula: '10203040', cargo: 'Técnico Fachadista', firmaDigital: null },
            { id: crypto.randomUUID(), nombre: 'Camilo Ernesto Ruiz', cedula: '11223344', cargo: 'Auxiliar Operativo', firmaDigital: null }
        ],
        // Responsables
        coordinadorAlturas: 'Diana Martínez (Lic. 1530)',
        rescatista: 'Carlos Brigadista',
        // Checklists Completados
        clTrabador: { c1: 'Cumple', c2: 'Cumple', c3: 'Cumple' },
        clEpp: { e1: 'Cumple', e2: 'Cumple', e3: 'Cumple', e4: 'Cumple', e5: 'Cumple' },
        clEq: { eq1: 'Cumple', eq2: 'Cumple', eq3: 'N/A', eq4: 'Cumple', eq5: 'Cumple', eq6: 'N/A' },
        clEntorno: { en1: 'Cumple', en2: 'Cumple', en3: 'Cumple', en4: 'Cumple' },
        // Tipos de Equipos
        equipoTipo: {
            andamio: true,
            elevador: false,
            escalera: false,
            cuerda: true // Suspensión
        },
        medidasSeguridad: "Demarcación del área inferior con cinta perimetral, línea de vida vertical con arrestador, arnés multipropósito dieléctrico."
    }),

    // 12. Políticas y Reglamentos Extensos (Base format)
    textExtenso: () => ({
        hazards: "1. Físico: Ruido de maquinaria pesada (>85 dB).\n2. Químico: Exposición a solventes industriales y material particulado.\n3. Biomecánico: Manipulación manual de cargas (hasta 25kg) y posturas prolongadas.\n4. Seguridad: Riesgo mecánico por partes en movimiento y riesgo eléctrico en tableros.\n5. Psicosocial: Estrés por carga laboral excesiva.",
        scope: "Esta política aplica obligatoriamente a todos los colaboradores directos, trabajadores en misión (temporales), contratistas, subcontratistas y visitantes que se encuentren en las instalaciones principales, bodegas de almacenamiento o en ejecución de labores externas a nombre de la compañía.",
        commitments: "1. Identificar, evaluar e intervenir proactivamente todos los peligros laborales.\n2. Garantizar recursos financieros, técnicos y humanos para el SG-SST.\n3. Fomentar una cultura de prevención y autocuidado.\n4. Cumplir estrictamente la normativa nacional en riesgos laborales.\n5. Prevenir accidentes y enfermedades laborales mediante programas focalizados."
    }),
    
    // 13. Reporte Actos
    reporteActos: () => ({
        fecha: new Date().toISOString().split('T')[0],
        horaInicio: "10:15",
        actividadGlobal: "Durante el recorrido rutinario de inspección del Comité Paritario, se observó en el Área de Mantenimiento Eléctrico que el tablero principal (T-01) se encontraba con su puerta abierta, sin candado de seguridad y con exposición de barrajes de cobre energizados (440V) al paso peatonal. Adicionalmente, el técnico en turno no portaba guantes dieléctricos ni careta protectora mientras tomaba mediciones.\n\nSe clasifica como:\n- CONDICIÓN INSEGURA: Tablero abierto exponiendo puntos vivos.\n- ACTO INSEGURO: Omisión de uso de EPP dieléctrico obligatorio.",
        // Checks
        seguridadSocial: "Sí", // Check SG-SST
        aptitudMedica: "Sí",   // Suspensión Tarea
        certificacionAlturas: "Sí", // Prioridad Alta
        // Personas
        trabajadoresList: [
            { id: crypto.randomUUID(), nombre: 'Marino Orozco', cedula: '1543210', firmaDigital: null }
        ],
        responsablesList: [
            { id: crypto.randomUUID(), nombre: 'Ing. David Henao', rol: 'Supervisor Eléctrico', cedula: '88776655', firmaDigital: null },
            { id: crypto.randomUUID(), nombre: 'Gloria Pineda', rol: 'Vigía/COPASST', cedula: '10203040', firmaDigital: null }
        ],
        // Fotos desc (simulate)
        foto1Desc: 'Fotografía panorámica del pasillo con el tablero eléctrico T-01 abierto.',
        foto2Desc: 'Acercamiento a barrajes expuestos sin protección acrílica y multímetro colgando.',
        foto3Desc: 'Guantes dieléctricos sobre la mesa, a 3 metros del punto de trabajo.'
    }),

    // 14. Responsable SG-SST
    responsableSGSST: () => ({
        name: "Ing. Andrea Marcela Cardona",
        idNumber: "1.020.333.444",
        profile: "Ingeniera Industrial, Especialista en HSE. Licencia SST N. 4567-2021",
        budgetSummary: "Presupuesto anual aprobado: $45.000.000 COP, destinados a EPP ($15M), Capacitación ($10M), Evaluaciones Médicas ($5M) e Intervención de Riesgos Críticos ($15M).",
        responsibilitiesList: [
            { id: crypto.randomUUID(), text: "Planificar, organizar, dirigir, desarrollar y aplicar el Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST)." },
            { id: crypto.randomUUID(), text: "Informar a la alta dirección sobre el funcionamiento y los resultados del SG-SST, preparando reportes ejecutivos bimensuales." },
            { id: crypto.randomUUID(), text: "Promover la participación de todos los miembros de la empresa en la implementación del SG-SST." },
            { id: crypto.randomUUID(), text: "Coordinar y asegurar la realización de auditorías internas para verificar la efectividad del SG-SST." },
            { id: crypto.randomUUID(), text: "Representar a la empresa ante las entidades de control (Mintrabajo, ARL) en materia de riesgos laborales." }
        ]
    })
};
