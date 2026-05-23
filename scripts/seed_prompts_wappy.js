const mongoose = require('mongoose');
require('dotenv').config();

// Using the local or container MongoDB URI
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/LibreChat";

const promptsToSeed = [
  // ==================== 1. WORD (text) ====================
  {
    name: "📝 Política de Seguridad y Salud en el Trabajo (SST)",
    category: "Word",
    type: "text",
    prompt: "Redacta un documento en Word con la política de seguridad y salud en el trabajo para la empresa {{nombre_empresa}}, dedicada a {{actividad_economica}}, con {{numero_trabajadores}} trabajadores y clase de riesgo ARL {{clase_riesgo}}. Asegúrate de que incluya los compromisos legales del Decreto 1072 de 2015, los objetivos estratégicos de prevención de accidentes, y que esté firmado por el representante legal {{representante_legal}}."
  },
  {
    name: "📝 Manual del Sistema de Gestión de SST",
    category: "Word",
    type: "text",
    prompt: "Escribe un manual en Word para el Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) de {{nombre_empresa}}. Estructura el documento con la introducción, justificación, alcance para {{alcance_sedes}}, responsabilidades del empleador, el COPASST y los trabajadores bajo el Decreto 1072 de 2015."
  },
  {
    name: "📝 Reglamento de Higiene y Seguridad Industrial",
    category: "Word",
    type: "text",
    prompt: "Genera un documento en Word redactando el Reglamento de Higiene y Seguridad Industrial de {{nombre_empresa}}, NIT {{nit}}, con centros de trabajo en {{ciudades}}. Incluye los riesgos identificados como {{riesgos_principales}}, las obligaciones de la empresa, los deberes de los trabajadores y el compromiso con la ARL {{nombre_arl}}."
  },
  {
    name: "📝 Plan de Prevención y Respuesta ante Emergencias",
    category: "Word",
    type: "text",
    prompt: "Crea un plan de emergencias en Word para la sede {{nombre_sede}} de la empresa {{nombre_empresa}}. Redacta el documento con los análisis de vulnerabilidad física y social, la estructura de la brigada de emergencias liderada por {{lider_brigada}}, los puntos de encuentro y los de evacuación ante {{amenazas_principales}}."
  },
  {
    name: "📝 Acta de Constitución del COPASST",
    category: "Word",
    type: "text",
    prompt: "Redacta una acta en Word de constitución del Comité Paritario de Seguridad y Salud en el Trabajo (COPASST) para la empresa {{nombre_empresa}} para el periodo {{periodo}}. Incluye los representantes del empleador designados por {{representante_legal}} y los representantes de los trabajadores elegidos por votación. Nombra como presidente a {{nombre_presidente}} y como secretario a {{nombre_secretaria}}."
  },
  {
    name: "📝 Procedimiento de Trabajo Seguro en Alturas (TSA)",
    category: "Word",
    type: "text",
    prompt: "Escribe una guía y procedimiento en Word para trabajo seguro en alturas en la empresa {{nombre_empresa}}. El documento debe alinearse con la Resolución 4272 de 2021, detallar los sistemas de protección contra caídas requeridos para la tarea de {{tarea_especifica}}, los roles de coordinador de alturas {{coordinador_alturas}} y el plan de rescate."
  },
  {
    name: "📝 Convocatoria a Elecciones COPASST / Vigía",
    category: "Word",
    type: "text",
    prompt: "Genera una circular en Word para convocar a todos los colaboradores de {{nombre_empresa}} a participar en la elección del {{comite_o_vigia}} para el periodo {{periodo}}. Indica las fechas límites de inscripción, los requisitos para postularse y el cronograma de votación que iniciará el {{fecha_inicio}}."
  },
  {
    name: "📝 Informe de Investigación de Accidente de Trabajo",
    category: "Word",
    type: "text",
    prompt: "Redacta un informe en Word sobre la investigación del accidente de trabajo ocurrido el {{fecha_accidente}} en la empresa {{nombre_empresa}}. Describe la tarea ejecutada por {{nombre_accidentado}}, las causas básicas e inmediatas analizadas con la metodología {{metodologia}} y el plan de acción con los responsables {{responsables}}."
  },
  {
    name: "📝 Llamado de Atención por Incumplimiento de SST",
    category: "Word",
    type: "text",
    prompt: "Crea una carta formal en Word de llamado de atención para el trabajador {{nombre_trabajador}} por no utilizar los elementos de protección personal (EPP) obligatorios, específicamente {{epp_faltante}}, durante la labor de {{labor_realizada}} en la fecha {{fecha_incumplimiento}}, violando el reglamento interno."
  },
  {
    name: "📝 Acta de Rendición de Cuentas Anual en SST",
    category: "Word",
    type: "text",
    prompt: "Redacta un documento en Word con el acta de rendición de cuentas anual en seguridad y salud en el trabajo del responsable de SST {{nombre_responsable}} ante la alta dirección de {{nombre_empresa}}. Detalla el cumplimiento de objetivos del periodo {{periodo}}, el presupuesto ejecutado de {{presupuesto}} y los indicadores clave del SG-SST."
  },

  // ==================== 2. EXCEL (excel) ====================
  {
    name: "📊 Matriz de Riesgos GTC-45 (Excel)",
    category: "Excel",
    type: "excel",
    prompt: "Crea una hoja de cálculo en Excel simulando la Matriz de Peligros y Valoración de Riesgos bajo la metodología GTC-45 para {{nombre_empresa}}. Diseña la grilla con columnas de Proceso, Zona, Actividad, Peligro (Descripción y Clasificación), Efectos Posibles, Controles Existentes, Evaluación del Riesgo (Deficiencia, Exposición, Probabilidad, Consecuencia, Nivel de Riesgo, Aceptabilidad) y Medidas de Intervención."
  },
  {
    name: "📊 Cronograma de Actividades SG-SST (Excel)",
    category: "Excel",
    type: "excel",
    prompt: "Genera un cronograma de actividades en Excel para el plan de trabajo anual de SST de {{nombre_empresa}} en el periodo {{año}}. Crea una tabla de filas con actividades de medicina preventiva, higiene y seguridad industrial, capacitaciones, simulacros y auditorías, cruzadas con columnas mensuales de planeado vs. ejecutado."
  },
  {
    name: "📊 Indicadores de Accidentalidad Res 0312 (Excel)",
    category: "Excel",
    type: "excel",
    prompt: "Diseña una hoja de cálculo en Excel para consolidar los indicadores mínimos de accidentalidad y enfermedad laboral bajo la Resolución 0312 de 2019 para {{nombre_empresa}}. Incluye fórmulas automáticas para calcular la Frecuencia de Accidentes, Severidad de Accidentes, Proporción de Accidentes Mortales, Prevalencia e Incidencia de Enfermedad Laboral y Tasa de Ausentismo de {{meses}}."
  },
  {
    name: "📊 Matriz de Control de Entrega de EPP (Excel)",
    category: "Excel",
    type: "excel",
    prompt: "Crea una matriz en Excel para el control y registro de entrega de Elementos de Protección Personal (EPP) en la empresa {{nombre_empresa}}. La tabla debe incluir columnas de Cargo, Área, Nombre del Trabajador, Tipo de EPP (Casco, Botas, etc.), Fecha de Entrega, Fecha de Cambio sugerida, Estado de Uso y firma de recibido."
  },
  {
    name: "📊 Historial de 10 Accidentes y Gráficos (Excel)",
    category: "Excel",
    type: "excel",
    prompt: "Genera una hoja de cálculo en Excel simulando un registro histórico de 10 accidentes de trabajo en {{nombre_empresa}}. La tabla debe detallar Fecha, Nombre, Cargo, Tipo de Lesión, Días de Incapacidad, Parte del Cuerpo Afectada y Costos Asociados, con una sección de resumen de indicadores clave automatizada mediante fórmulas."
  },
  {
    name: "📊 Presupuesto Anual del SG-SST (Excel)",
    category: "Excel",
    type: "excel",
    prompt: "Diseña un presupuesto en Excel para el SG-SST de {{nombre_empresa}} del periodo {{año}}. La hoja de cálculo debe desglosar los rubros de Recursos Humanos (asesorías, capacitadores), Recursos Técnicos (mediciones ambientales, mantenimiento de equipos, recarga de extintores), Elementos de Protección (EPP, botiquines) y Exámenes Médicos Ocupacionales."
  },
  {
    name: "📊 Matriz de Requisitos Legales en SST (Excel)",
    category: "Excel",
    type: "excel",
    prompt: "Crea una matriz legal en Excel de SST para la empresa {{nombre_empresa}}. Diseña columnas que incluyan Norma (Decreto, Ley, Resolución), Año de Emisión, Artículo Aplicable, Descripción del Requisito, Evidencia de Cumplimiento actual, Responsable del Control {{responsable}} y Estado de Cumplimiento (Cumple, No Cumple, En Proceso)."
  },
  {
    name: "📊 Plan de Capacitaciones y Cobertura (Excel)",
    category: "Excel",
    type: "excel",
    prompt: "Genera una hoja de cálculo en Excel para controlar el plan de capacitación en SST de {{nombre_empresa}}. Diseña la tabla de seguimiento con columnas de Nombre del Curso, Facilitador, Fecha Programada, Fecha Ejecutada, Número de Asistentes, Porcentaje de Cobertura y Promedio de Evaluación de los participantes."
  },
  {
    name: "📊 Inventario y Recarga de Extintores (Excel)",
    category: "Excel",
    type: "excel",
    prompt: "Crea una hoja de cálculo en Excel con el inventario de extintores de la sede {{sede}} de {{nombre_empresa}}. Configura la grilla con columnas de ID del Extintor, Ubicación Exacta, Tipo de Agente (PQS, CO2, Agua Sol), Capacidad (Lbs), Fecha de Recarga, Fecha de Vencimiento, Estado del Manómetro y Responsable de Inspección {{inspector}}."
  },
  {
    name: "📊 Control de Recomendaciones Médicas (Excel)",
    category: "Excel",
    type: "excel",
    prompt: "Diseña una matriz en Excel para el control de restricciones y recomendaciones médicas ocupacionales en la empresa {{nombre_empresa}}. La tabla debe incluir columnas con ID de Trabajador, Nombre, Cargo, Tipo de Examen (Ingreso, Periódico, Retiro), Fecha del Examen, Recomendaciones/Restricciones del médico, Fecha de Seguimiento, Estado (Vigente, Cerrado) y observaciones."
  },

  // ==================== 3. SLIDES (presentation) ====================
  {
    name: "📢 Inducción General de SST (Diapositivas)",
    category: "Presentacion",
    type: "presentation",
    prompt: "Genera una presentación de diapositivas en PowerPoint para la inducción general en SST de los nuevos trabajadores de {{nombre_empresa}}. Crea diapositivas sobre la Bienvenida, Política de SST, Objetivos del SG-SST, Derechos y Deberes de los trabajadores, Identificación de Peligros en la actividad de {{actividad_economica}}, Reporte de Accidentes y Plan de Emergencia."
  },
  {
    name: "📢 Investigación de Accidentes para COPASST (Diapositivas)",
    category: "Presentacion",
    type: "presentation",
    prompt: "Diseña una presentación de diapositivas sobre reporte e investigación de incidentes y accidentes de trabajo para el COPASST y supervisores de {{nombre_empresa}}. Estructura la presentación explicando la diferencia entre Incidente y Accidente, el tiempo límite de reporte, la metodología de las 5 M's / Árbol de causas y la importancia de las acciones correctivas."
  },
  {
    name: "📢 Resultados Estándares Mínimos Res 0312 (Diapositivas)",
    category: "Presentacion",
    type: "presentation",
    prompt: "Crea una presentación de diapositivas para socializar el cumplimiento de los Estándares Mínimos de la Resolución 0312 de 2019 ante la Junta Directiva de la empresa {{nombre_empresa}}. Incluye diapositivas que resuman el porcentaje de avance, fortalezas encontradas, oportunidades de mejora, planes de acción prioritarios y el presupuesto requerido."
  },
  {
    name: "📢 Charla de 5 Minutos sobre EPP (Diapositivas)",
    category: "Presentacion",
    type: "presentation",
    prompt: "Genera una presentación corta de diapositivas para la charla de 5 minutos sobre elementos de protección personal (EPP) orientada a operarios de {{nombre_empresa}}. Incluye diapositivas dinámicas explicando la importancia del uso diario, técnica de inspección previa, almacenamiento correcto, reporte de daños y el EPP específico para la labor de {{tarea_critica}}."
  },
  {
    name: "📢 Prevención de Incendios para Brigadistas (Diapositivas)",
    category: "Presentacion",
    type: "presentation",
    prompt: "Diseña una presentación de diapositivas de capacitación para la brigada de emergencias de {{nombre_empresa}}. Las láminas deben explicar la química del fuego (triángulo del fuego), clases de incendios (A, B, C, D, K), uso correcto de extintores portátiles según el agente y normas de seguridad de los brigadistas en evacuación."
  },
  {
    name: "📢 Riesgo Ergonómico y Pausas Activas (Diapositivas)",
    category: "Presentacion",
    type: "presentation",
    prompt: "Crea una presentación de diapositivas sobre ergonomía laboral y prevención de desórdenes musculoesqueléticos para el personal administrativo y operativo de {{nombre_empresa}}. Diseña diapositivas con posturas correctas (sentado/de pie), manipulación manual de cargas de máximo {{peso_limite}} kg, y una rutina gráfica de pausas activas."
  },
  {
    name: "📢 Socialización de Comité de Convivencia COCOLA (Diapositivas)",
    category: "Presentacion",
    type: "presentation",
    prompt: "Genera una presentación de diapositivas para socializar las funciones y alcance del Comité de Convivencia Laboral (COCOLA) en la empresa {{nombre_empresa}}. Explica la definición de Acoso Laboral bajo la Ley 1010 de 2006, las conductas que constituyen acoso, las funciones del comité, el canal de denuncias y el procedimiento confidencial."
  },
  {
    name: "📢 Riesgo Eléctrico y 5 Reglas de Oro (Diapositivas)",
    category: "Presentacion",
    type: "presentation",
    prompt: "Diseña una presentación de diapositivas de seguridad eléctrica para técnicos de mantenimiento de {{nombre_empresa}}. Estructura la presentación explicando los efectos de la corriente en el cuerpo humano, los arcos eléctricos, y detalla paso a paso las 5 Reglas de Oro de la electricidad (Corte visible, Bloqueo, Verificar ausencia de tensión, Puesta a tierra y Señalización)."
  },
  {
    name: "📢 Hábitos de Estilo de Vida Saludable (Diapositivas)",
    category: "Presentacion",
    type: "presentation",
    prompt: "Genera una presentación de diapositivas sobre estilos de vida y trabajo saludable para los colaboradores de {{nombre_empresa}}. Incluye láminas sobre alimentación balanceada, importancia del ejercicio diario, higiene del sueño, prevención del consumo de alcohol, tabaco y sustancias psychoactivas."
  },
  {
    name: "📢 Seguridad Vial y Manejo Defensivo PESV (Diapositivas)",
    category: "Presentacion",
    type: "presentation",
    prompt: "Crea una presentación de diapositivas sobre el Plan Estratégico de Seguridad Vial (PESV) y técnicas de manejo defensivo para conductores y motociclistas de {{nombre_empresa}}. Explica el factor humano (fatiga, velocidad, celular), la inspección preoperacional del vehículo y las normas de comportamiento vial."
  },

  // ==================== 4. HTML (html) ====================
  {
    name: "⚡ Permiso de Trabajo en Alturas (Formulario HTML)",
    category: "Codigo",
    type: "html",
    prompt: "Programa una aplicación y formulario interactivo en HTML para la solicitud y control de Permisos de Trabajo en Alturas (TSA) en la empresa {{nombre_empresa}}. El formulario debe tener un diseño premium con variables HSL, campos de fecha, ejecutor de la tarea, altura aproximada, un checklist interactivo táctil de condiciones de seguridad (puntos de anclaje, arnés, línea de vida), un canvas para firmas digitales del emisor y ejecutor, y un botón funcional de descarga de reporte."
  },
  {
    name: "⚡ Reporte de Actos y Condiciones Inseguras (Formulario HTML)",
    category: "Codigo",
    type: "html",
    prompt: "Diseña una página y aplicación web interactiva en HTML para reportar Actos y Condiciones Inseguras en {{nombre_empresa}}. Debe incluir campos interactivos de Fecha, Sede, Descripción detallada, fotos o carga de archivos, nivel de riesgo dinámico (Bajo, Medio, Alto) con colores cambiantes, campos interactivos para sugerir medidas correctivas, y un botón para exportar o enviar el reporte generado."
  },
  {
    name: "⚡ Inspección de EPP con Validación Visual (Formulario HTML)",
    category: "Codigo",
    type: "html",
    prompt: "Programa un formulario interactivo premium en HTML para realizar la inspección de EPP de los operarios en {{nombre_empresa}}. El diseño interactivo debe permitir seleccionar el nombre del trabajador, marcar con botones (Sí/No/Requiere Cambio) el estado de casco, goggles, botas y guantes, incluir lógica interactiva que resalte en rojo los campos marcados como 'Requiere Cambio', y permitir la firma del supervisor {{inspector}}."
  },
  {
    name: "⚡ Calculadora de Carga Límite GINSHT / NTC (App HTML)",
    category: "Codigo",
    type: "html",
    prompt: "Desarrolla una aplicación interactiva en HTML con una calculadora de levantamiento manual de cargas basada en la ecuación de NTC / GINSHT para la empresa {{nombre_empresa}}. El usuario podrá ingresar interactivamente variables como peso de la carga (kg), distancia horizontal, distancia vertical, frecuencia y duración del levantamiento, y la aplicación calculará en tiempo real el Índice de Riesgo coloreando de verde (Aceptable) o rojo (Riesgo Crítico)."
  },
  {
    name: "⚡ Inspección Mensual de Botiquín (Formulario HTML)",
    category: "Codigo",
    type: "html",
    prompt: "Programa una aplicación e inspección interactiva en HTML para la revisión mensual de botiquines en la sede {{sede}} de {{nombre_empresa}}. El formulario debe listar los elementos mínimos obligatorios (gasa, vendas, alcohol, tijeras, etc.), permitir ingresar interactivamente las fechas de vencimiento de cada insumo, alertar automáticamente en rojo si un elemento está vencido o por vencerse, y exportar la lista de chequeo firmada por el inspector {{inspector}}."
  },
  {
    name: "⚡ Permiso de Trabajo en Espacios Confinados (Formulario HTML)",
    category: "Codigo",
    type: "html",
    prompt: "Programa un prototipo interactivo en HTML para un Permiso de Trabajo en Espacios Confinados en la empresa {{nombre_empresa}}. Debe contar con secciones dinámicas para registrar la atmósfera medida en tiempo real (Oxígeno %, LEL %, CO ppm, H2S ppm) con alarmas visuales si los niveles no son óptimos, checklist de bloqueo de energía (LOTO), ingreso de personal autorizado, firma táctil interactiva y descarga."
  },
  {
    name: "⚡ Inspección Preoperacional Diaria de Vehículos (Formulario HTML)",
    category: "Codigo",
    type: "html",
    prompt: "Desarrolla una aplicación y formulario web interactivo en HTML para la inspección preoperacional diaria de vehículos de {{nombre_empresa}}. Debe permitir marcar con casillas interactivas el estado de luces, frenos, llantas, niveles de aceite, dirección, kit de carretera, ingresar el kilometraje actual, y mostrar un veredicto dinámico de 'Vehículo Apto' o 'Vehículo No Apto para Circular' basado en los hallazgos críticos."
  },
  {
    name: "⚡ Cuestionario confidencial de Estrés Laboral (Test HTML)",
    category: "Codigo",
    type: "html",
    prompt: "Programa una aplicación web interactiva en HTML para realizar un test o cuestionario confidencial de autoevaluación de estrés laboral para colaboradores de {{nombre_empresa}}. Diseña 15 preguntas con opciones múltiples (Nunca, A veces, Frecuentemente, Siempre), calcula la puntuación final automáticamente al finalizar el test, y ofrece recomendaciones personalizadas e inmediatas basadas en el nivel de estrés obtenido."
  },
  {
    name: "⚡ Acta Digital de Entrega e Inducción SST (Formulario HTML)",
    category: "Codigo",
    type: "html",
    prompt: "Programa una aplicación interactiva en HTML para registrar de forma digital el Acta de Inducción y Entrega del SG-SST a un nuevo colaborador de {{nombre_empresa}}. El formulario interactivo debe recolectar Nombre, Cédula, Cargo, marcar casillas de los temas de inducción impartidos, contar con un lienzo de firma interactiva táctil integrado, y permitir descargar el comprobante en formato limpio."
  },
  {
    name: "⚡ Dashboard de Indicadores de Accidentalidad (App HTML)",
    category: "Codigo",
    type: "html",
    prompt: "Desarrolla una aplicación interactiva de panel de control (Dashboard) en HTML para calcular indicadores de SST en {{nombre_empresa}}. Permite al usuario ingresar dinámicamente en cajas de texto el Número de trabajadores, Horas Hombre Trabajadas (HHT), número de accidentes en el mes, y días de incapacidad; y calculará en tiempo real y con gráficos interactivos CSS el Índice de Frecuencia (IF) y el Índice de Severidad (IS)."
  }
];

async function seed() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully!');

    // Find first User
    const User = mongoose.connection.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const user = await User.findOne({}).lean();
    if (!user) {
      console.error('No users found in database.');
      process.exit(1);
    }
    console.log(`Author detected: ${user.name} (${user._id})`);

    // Find Global Project
    const Project = mongoose.connection.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');
    let project = await Project.findOne({ name: 'Global' });
    if (!project) {
      project = await Project.findOne({});
    }
    if (project) {
      console.log(`Project found: ${project.name} (${project._id})`);
    }

    // Register schemas
    const PromptGroup = mongoose.connection.model('PromptGroup', new mongoose.Schema({
      name: String,
      category: String,
      author: mongoose.Schema.Types.ObjectId,
      authorName: String,
      productionId: mongoose.Schema.Types.ObjectId,
      projectIds: [String]
    }, { timestamps: true, strict: false }), 'promptgroups');

    const Prompt = mongoose.connection.model('Prompt', new mongoose.Schema({
      prompt: String,
      name: String,
      author: mongoose.Schema.Types.ObjectId,
      groupId: mongoose.Schema.Types.ObjectId,
      type: String
    }, { timestamps: true, strict: false }), 'prompts');

    const AclEntry = mongoose.connection.model('AclEntry', new mongoose.Schema({
      resourceType: String,
      resourceId: mongoose.Schema.Types.ObjectId,
      principalType: String,
      principalId: mongoose.Schema.Types.ObjectId,
      permBits: Number,
      grantedBy: mongoose.Schema.Types.ObjectId
    }, { timestamps: true, strict: false }), 'aclentries');

    console.log(`Seeding ${promptsToSeed.length} prompt groups...`);

    let seededCount = 0;
    for (const item of promptsToSeed) {
      // Avoid duplicate seeding
      const existingGroup = await PromptGroup.findOne({ name: item.name });
      if (existingGroup) {
        console.log(`[SKIPPED] Prompt "${item.name}" already exists.`);
        continue;
      }

      // 1. Create PromptGroup
      const groupDoc = new PromptGroup({
        name: item.name,
        category: item.category,
        author: user._id,
        authorName: user.name,
        productionId: null,
        projectIds: project ? [project._id.toString()] : []
      });
      await groupDoc.save();

      // 2. Create Prompt
      const promptDoc = new Prompt({
        prompt: item.prompt,
        name: item.name,
        author: user._id,
        groupId: groupDoc._id,
        type: item.type
      });
      await promptDoc.save();

      // 3. Update PromptGroup productionId
      groupDoc.productionId = promptDoc._id;
      await groupDoc.save();

      // 4. Create AclEntry
      const aclDoc = new AclEntry({
        resourceType: 'promptGroup',
        resourceId: groupDoc._id,
        principalType: 'user',
        principalId: user._id,
        permBits: 15, // VIEW | EDIT | DELETE | SHARE
        grantedBy: user._id
      });
      await aclDoc.save();

      // 5. Link in global project
      if (project) {
        await Project.findByIdAndUpdate(project._id, {
          $addToSet: { promptGroupIds: groupDoc._id }
        });
      }

      console.log(`[SEEDED] Successfully created prompt: "${item.name}"`);
      seededCount++;
    }

    console.log(`\nSeed completed! Seeded ${seededCount} new prompts into LibreChat.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding critical error:', err);
    process.exit(1);
  }
}

seed();
