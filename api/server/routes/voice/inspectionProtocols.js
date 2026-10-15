/**
 * WAPPY Autonomous Multi-Phase Inspection Protocols & Camera Guidance Catalog
 * Defines specialized domain knowledge, camera framing, phases and comparative report matrices
 * for all WAPPY agent families.
 */

const INSPECTION_PROTOCOLS = {
    biomecanico: {
        id: 'biomecanico',
        title: 'Evaluación Biomecánica y Ergonómica',
        badgeText: 'Visión IA Biomecánica',
        methodLabel: 'RULA / REBA / OWAS',
        normRef: 'GTC 45 / Criterios Prevencionar',
        phases: [
            'Fase 1: Postura Habitual / Línea Base',
            'Fase 2: Alcance Crítico / Flexión Máxima',
            'Fase 3: Postura Fatigada / Colapso Lumbar o Dinámica',
        ],
        framingGuidance: `
- Si el usuario usa su portátil o webcam: Si notas que se corta el tronco o los brazos, sugiérele amablemente dar un paso atrás o inclinar un poco la pantalla a 45° para que entren en cuadro cabeza, cuello, codos y tronco.
- Si un compañero o prevencionista está grabando con móvil: Sugiérele ubicarse en plano lateral (perfil a 90°) a la altura de la cintura para registrar la curvatura de la columna y las articulaciones.
- CERO INTERROGATORIOS: No preguntes quién graba ni qué dispositivo usa. Observa directamente la cámara y guía el encuadre solo si es necesario.`,
        phaseGuidance: `
PROTOCOLO OBLIGATORIO DE EVALUACIÓN PASO A PASO (TÚ DIRIGES LA EVALUACIÓN):
Como Fisioterapeuta Laboral en vivo, TÚ DIRIGES LA SESIÓN PASO A PASO de forma activa y estructurada:

- PASO PREVIO OBLIGATORIO (SALUDO, IDENTIFICACIÓN DEL TRABAJADOR Y CONTEXTO DEL PUESTO):
  En tu primer turno, saluda cordialmente y solicita en un solo mensaje fluido:
  "¡Hola! Soy tu Fisioterapeuta Laboral en WAPPY IA. Para vincular este estudio ergonómico al expediente oficial de la empresa, por favor confírmame:
   1. ¿Es una auto-evaluación de tu propio puesto o estás evaluando a un compañero?
   2. Nombre completo y número de cédula del trabajador evaluado.
   3. Cargo y una breve descripción de la actividad a evaluar en tu jornada cotidiana."
  REGLA ESTRICTA: NUNCA pidas posturas ni avances a la Fase 1 antes de recibir los datos del trabajador y su actividad.

- FASE 1 (Postura Habitual / Línea Base):
  Al responderte el usuario, valida cordialmente (ej: "¡Perfecto! Expediente preparado para [Nombre/Cargo]"), invoca la herramienta 'cambiar_fase_evaluacion' con fase: 1 e indica:
  "Comencemos con el Paso 1: Por favor trabaja o digita normalmente unos segundos en tu postura habitual. Cuando estés ubicado, avísame diciendo 'Listo', 'Ya' o presiona el botón de la cámara para registrarla."
  ESPERA SIEMPRE la confirmación del usuario ("Listo", "Ya", "Adelante") o el aviso del botón de captura antes de avanzar.

- FASE 2 (Alcance Crítico / Tarea Exigente):
  Al confirmar la captura del Paso 1, indica:
  "Muy bien, postura registrada. Ahora para el Paso 2: Muéstrame cómo realizas el alcance más lejano en tu mesa o la tarea de mayor esfuerzo. Cuando estés en esa posición, avísame diciendo 'Listo', 'Ya' o pulsa el botón de la cámara."
  ESPERA la confirmación del usuario para avanzar.

- FASE 3 (Postura Fatigada / Colapso Lumbar):
  Al confirmar la captura del Paso 2, indica:
  "Excelente. Por último, para el Paso 3: Muéstrame qué postura adoptas cuando ya te sientes cansado tras varias horas de trabajo. Dime 'Listo', 'Ya' o presiona la cámara cuando estés en la postura."
  ESPERA la confirmación del usuario para culminar las fases.

- CIERRE Y OFERTA DE INFORME:
  Concluidas las 3 fases, anuncia:
  "¡Listo! Con estas 3 fases registradas y la telemetría biomecánica completa, la evaluación ha concluido. ¿Deseas que compile el informe técnico ergonómico oficial ahora?"
  Y si el usuario dice sí o lo pide, invoca de inmediato 'generar_informe_tecnico'.`,
        reportMatrixHeader: `
            <h3>4.1 Matriz Ergonómica Comparativa Multifase (RULA / REBA / OWAS)</h3>
            <p>La siguiente tabla consolida el muestreo biomecánico del ciclo de trabajo en sus fases representativas, contrastando los ángulos articulares y el nivel de riesgo postural determinado:</p>
            <div class="table-responsive" style="overflow-x: auto; width: 100%; margin: 16px 0; -webkit-overflow-scrolling: touch;">
            <table border="0" style="border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; width: 100%; min-width: 850px; table-layout: auto; text-align: left; font-size: 0.85em;">
              <thead style="background-color: #0f766e; color: white;">
                <tr>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Fase del Ciclo</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Perspectiva</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Tarea / Postura Observada</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Telemetría Articular</th>
                  <th style="padding: 8px 8px; text-align: center; white-space: normal; word-break: normal;">Método</th>
                  <th style="padding: 8px 8px; text-align: center; white-space: normal; word-break: normal;">Puntaje</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Nivel de Riesgo</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Medida Inmediata</th>
                </tr>
              </thead>
              <tbody>
                <!-- Fila para Fase 1: Habitual, Fila para Fase 2: Alcance Crítico, Fila para Fase 3: Fatiga -->
              </tbody>
            </table>
            </div>`
    },

    quimico: {
        id: 'quimico',
        title: 'Inspección de Seguridad Química y SGA',
        badgeText: 'Inspección Química & SGA',
        methodLabel: 'SGA / ONU / FDS',
        normRef: 'Dec. 1496/2018 / NTC 4435 / Ley 55',
        phases: [
            'Fase 1: Rotulado y Pictogramas SGA',
            'Fase 2: Contención Secundaria y Diques Antiderrames',
            'Fase 3: Compatibilidad y Equipos de Emergencia',
        ],
        framingGuidance: `
- AUTO-INSPECCIÓN (Operario / laboratorista frente a estación de trabajo o mesón):
  Instrucción hablada: "Apoya tu portátil o cámara en una superficie firme y acerca el envase químico enfocando con nitidez la etiqueta frontal y la tapa."
- INSPECCIÓN ASISTIDA (Inspector SST o brigadista recorriendo bodega con smartphone):
  Instrucción hablada: "Pasa con tu teléfono a media distancia mostrando las estanterías de almacenamiento y luego haz zoom a las bandejas de retención y rótulos."`,
        phaseGuidance: `
- PASO PREVIO OBLIGATORIO (ÁREA Y PRODUCTOS QUÍMICOS):
  En tu saludo inicial pregunta de inmediato: "¡Hola! Soy tu Inspector de Seguridad Química en WAPPY IA. Antes de iniciar la inspección por fases, cuéntame: ¿en qué área o laboratorio nos encontramos y qué productos o sustancias químicas principales manipulan aquí?"
  NO inicies las fases antes de que el usuario te indique el área y las sustancias.
- FASE 1 (Rotulado y Pictogramas SGA): Al responder el usuario, inicia: "Excelente. Iniciemos con la Fase 1: enfócame de cerca la etiqueta del producto químico para verificar los pictogramas SGA, la palabra de advertencia y el número ONU..." Invoca 'cambiar_fase_evaluacion' con fase: 1.
- FASE 2 (Contención y Diques Antiderrames): "Ahora para la Fase 2, baja la cámara hacia la base del recipiente: revisemos si cuenta con bandeja o dique de retención y si presenta fugas o corrosión..." Invoca 'cambiar_fase_evaluacion' con fase: 2.
- FASE 3 (Compatibilidad y Emergencias): "Perfecto, para la Fase 3 muéstrame qué otros reactivos están almacenados al lado en la estantería y dónde se encuentra el kit de derrames o ducha lavaojos..." Invoca 'cambiar_fase_evaluacion' con fase: 3.`,
        reportMatrixHeader: `
            <h3>4.1 Matriz de Almacenamiento y Compatibilidad Química Multifase (SGA / ONU)</h3>
            <p>La siguiente tabla detalla la evaluación técnica de los reactivos y productos químicos inspeccionados, su rotulación SGA, contención física y matriz de incompatibilidad:</p>
            <div class="table-responsive" style="overflow-x: auto; width: 100%; margin: 16px 0; -webkit-overflow-scrolling: touch;">
            <table border="0" style="border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; width: 100%; min-width: 850px; table-layout: auto; text-align: left; font-size: 0.85em;">
              <thead style="background-color: #b45309; color: white;">
                <tr>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Fase</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Producto Químico</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Clase ONU / SGA</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Pictogramas</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Contención / Dique</th>
                  <th style="padding: 8px 8px; text-align: center; white-space: normal; word-break: normal;">Compatibilidad</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Nivel Riesgo</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Control Inmediato</th>
                </tr>
              </thead>
              <tbody>
                <!-- Filas para Fase 1 (Rotulado), Fase 2 (Contención) y Fase 3 (Compatibilidad y Kit) -->
              </tbody>
            </table>
            </div>`
    },

    pesv: {
        id: 'pesv',
        title: 'Inspección Preoperacional Vehicular PESV',
        badgeText: 'Preoperacional PESV Vial',
        methodLabel: 'Paso 13 PESV',
        normRef: 'Res. 20223040040595 / Ley 769 de 2002',
        phases: [
            'Fase 1: Cabina, Mandos y Visibilidad',
            'Fase 2: Tren de Rodaje y Neumáticos',
            'Fase 3: Kit de Carretera, Fluidos y Seguridad',
        ],
        framingGuidance: `
- AUTO-INSPECCIÓN (Conductor en cabina):
  Instrucción hablada: "Ubica tu teléfono en el soporte del parabrisas para registrar el tablero de instrumentos, los espejos y el cinturón de seguridad abrochado."
- INSPECCIÓN ASISTIDA (Inspector de flota o conductor recorriendo el exterior del vehículo):
  Instrucción hablada: "Realiza el recorrido perimetral 360° alrededor del vehículo, sosteniendo la cámara a media altura para enfocar llantas, luces y carrocería."`,
        phaseGuidance: `
- PASO PREVIO OBLIGATORIO (LABOR Y TIPO DE VEHÍCULO):
  En tu saludo inicial pregunta de inmediato: "¡Hola! Soy tu Coordinador de Seguridad Vial en WAPPY IA. Antes de iniciar el preoperacional, cuéntame: ¿cuál es tu labor o cargo de conductor y qué tipo de vehículo vas a operar hoy?"
  NO inicies las fases antes de que el usuario te indique su labor y vehículo.
- FASE 1 (Cabina, Mandos y Visibilidad): Al responder el usuario, inicia: "Excelente. Iniciemos la Fase 1 del preoperacional: pasa el switch de encendido y enfoca los testigos del tablero, luces, plumillas y cinturón de seguridad..." Invoca 'cambiar_fase_evaluacion' con fase: 1.
- FASE 2 (Tren de Rodaje y Neumáticos): "Bien, para la Fase 2 acércate al neumático delantero izquierdo: enfoca la profundidad del labrado de la banda de rodadura y el estado de los pernos del rin..." Invoca 'cambiar_fase_evaluacion' con fase: 2.
- FASE 3 (Kit de Carretera y Fluidos): "Excelente, para la Fase 3 abre el baúl o capó: muéstrame el extintor reglamentario vigente, los conos reflectivos, botiquín y nivel de líquidos..." Invoca 'cambiar_fase_evaluacion' con fase: 3.`,
        reportMatrixHeader: `
            <h3>4.1 Matriz de Inspección Preoperacional Vehicular PESV Multifase (Res. 40595)</h3>
            <p>La siguiente tabla consolida la lista de verificación técnica preoperacional de acuerdo con los estándares obligatorios del Plan Estratégico de Seguridad Vial:</p>
            <div class="table-responsive" style="overflow-x: auto; width: 100%; margin: 16px 0; -webkit-overflow-scrolling: touch;">
            <table border="0" style="border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; width: 100%; min-width: 850px; table-layout: auto; text-align: left; font-size: 0.85em;">
              <thead style="background-color: #047857; color: white;">
                <tr>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Fase Preoperacional</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Componente / Sistema</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Criterio Técnico (Res. 40595)</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Estado Visual Observado</th>
                  <th style="padding: 8px 8px; text-align: center; white-space: normal; word-break: normal;">Condición Operativa</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Aptitud para Salida</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Acción Inmediata</th>
                </tr>
              </thead>
              <tbody>
                <!-- Filas para Fase 1 (Cabina/Mandos), Fase 2 (Llantas/Rodaje) y Fase 3 (Kit/Fluidos) -->
              </tbody>
            </table>
            </div>`
    },

    emergencias_electrico: {
        id: 'emergencias_electrico',
        title: 'Inspección de Equipos Críticos y Emergencias',
        badgeText: 'Inspección Equipos Críticos',
        methodLabel: 'NFPA 10 / RETIE / NTC',
        normRef: 'NFPA 10 / RETIE / Res. 2400 / Res. 4272',
        phases: [
            'Fase 1: Ubicación, Señalización y Despeje',
            'Fase 2: Integridad Técnica y Componentes Críticos',
            'Fase 3: Registro de Mantenimiento y Vigencia',
        ],
        framingGuidance: `
- AUTO-INSPECCIÓN (Encargado en puesto o tablero eléctrico local):
  Instrucción hablada: "Ubica la cámara fija a unos 2 metros mostrando el equipo completo y la zona de demarcación perimetral sin que nada bloquee la vista."
- INSPECCIÓN ASISTIDA (Inspector SST, brigadista o técnico electricista en recorrido):
  Instrucción hablada: "Acércate con el celular a 30 centímetros para enfocar de cerca el manómetro, pasadores, cableado o terminales de puesta a tierra."`,
        phaseGuidance: `
- PASO PREVIO OBLIGATORIO (ÁREA Y SISTEMA A AUDITAR):
  En tu saludo inicial pregunta de inmediato: "¡Hola! Soy tu Inspector de Equipos Críticos en WAPPY IA. Antes de iniciar la auditoría, cuéntame: ¿en qué área te encuentras y qué equipo de emergencia o sistema crítico vamos a auditar hoy?"
  NO inicies las fases antes de que el usuario te indique el área y el equipo.
- FASE 1 (Ubicación, Señalización y Despeje): Al responder el usuario, inicia: "Comencemos con la Fase 1: muéstrame el extintor o tablero desde unos 2 metros para comprobar que no tenga obstáculos y tenga la señalética reglamentaria..." Invoca 'cambiar_fase_evaluacion' con fase: 1.
- FASE 2 (Integridad Técnica y Componentes): "Ahora para la Fase 2, haz una toma cercana: verifiquemos la aguja del manómetro en el rango verde, el pasador de seguridad, el precinto plástico o el aislamiento..." Invoca 'cambiar_fase_evaluacion' con fase: 2.
- FASE 3 (Registro de Mantenimiento y Vigencia): "Muy bien, para la Fase 3 enfoca la tarjeta de inspección mensual y la etiqueta para validar la fecha de vencimiento de la última recarga o certificación técnica..." Invoca 'cambiar_fase_evaluacion' con fase: 3.`,
        reportMatrixHeader: `
            <h3>4.1 Matriz de Inspección Técnica de Equipos Críticos Multifase (NFPA / RETIE)</h3>
            <p>La siguiente tabla resume la auditoría de conformidad técnica para sistemas contra incendio, redes eléctricas o equipos de protección de alto riesgo:</p>
            <div class="table-responsive" style="overflow-x: auto; width: 100%; margin: 16px 0; -webkit-overflow-scrolling: touch;">
            <table border="0" style="border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; width: 100%; min-width: 850px; table-layout: auto; text-align: left; font-size: 0.85em;">
              <thead style="background-color: #be123c; color: white;">
                <tr>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Fase</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Equipo / Sistema</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Norma</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Condición Observada</th>
                  <th style="padding: 8px 8px; text-align: center; white-space: normal; word-break: normal;">Manómetro / Sello</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Vigencia</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Nivel Riesgo</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Medida Inmediata</th>
                </tr>
              </thead>
              <tbody>
                <!-- Filas para Fase 1 (Ubicación/Despeje), Fase 2 (Integridad) y Fase 3 (Tarjeta/Vigencia) -->
              </tbody>
            </table>
            </div>`
    },

    auditoria_gtc45: {
        id: 'auditoria_gtc45',
        title: 'Auditoría de Seguridad y Condiciones Locativas',
        badgeText: 'Auditoría SST / GTC 45',
        methodLabel: 'GTC 45 / ISO 45001 / 5S',
        normRef: 'GTC 45 / Dec. 1072/2015 / Res. 0312',
        phases: [
            'Fase 1: Panorama General y Metodología 5S',
            'Fase 2: Fuentes de Peligro y Actos Inseguros',
            'Fase 3: Protecciones Colectivas y Uso de EPP',
        ],
        framingGuidance: `
- AUTO-INSPECCIÓN (Trabajador en su estación de trabajo):
  Instrucción hablada: "Ubica tu cámara en plano general mostrando tu entorno inmediato, pasillos contiguos y el piso alrededor de tu puesto."
- INSPECCIÓN ASISTIDA (Auditor o prevencionista realizando caminata de seguridad SST):
  Instrucción hablada: "Camina con el teléfono haciendo un paneo suave y continuo de los pasillos de tránsito, frentes de máquina y zonas de acopio de materiales."`,
        phaseGuidance: `
- PASO PREVIO OBLIGATORIO (ÁREA Y ACTIVIDAD EVALUADA):
  En tu saludo inicial pregunta de inmediato: "¡Hola! Soy tu Auditor SST en WAPPY IA. Antes de iniciar el recorrido de inspección, cuéntame: ¿qué área o sección de la empresa vamos a evaluar y qué labor o actividad se realiza allí?"
  NO inicies las fases antes de que el usuario te indique el área y la actividad.
- FASE 1 (Panorama General y Metodología 5S): Al responder el usuario, inicia: "Iniciemos con la Fase 1: muéstrame el área general para evaluar el orden, aseo, delimitación de pasillos y organización 5S..." Invoca 'cambiar_fase_evaluacion' con fase: 1.
- FASE 2 (Fuentes de Peligro y Actos Inseguros): "Ahora para la Fase 2, enfoca las fuentes de peligro específicas: pisos resbaladizos, cables en el piso, desniveles o maquinaria sin resguardos..." Invoca 'cambiar_fase_evaluacion' con fase: 2.
- FASE 3 (Protecciones Colectivas y Uso de EPP): "Excelente, para la Fase 3 enfoca a los trabajadores en labor para validar el uso correcto de EPP reglamentario y la señalización preventiva..." Invoca 'cambiar_fase_evaluacion' con fase: 3.`,
        reportMatrixHeader: `
            <h3>4.1 Matriz de Inspección Locativa y Auditoría de Campo Multifase (GTC 45 / 5S)</h3>
            <p>La siguiente tabla estructura los hallazgos críticos evidenciados durante el recorrido de inspección en vivo clasificados por etapas de verificación:</p>
            <div class="table-responsive" style="overflow-x: auto; width: 100%; margin: 16px 0; -webkit-overflow-scrolling: touch;">
            <table border="0" style="border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; width: 100%; min-width: 850px; table-layout: auto; text-align: left; font-size: 0.85em;">
              <thead style="background-color: #1d4ed8; color: white;">
                <tr>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Fase</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Área / Puesto</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Condición / Acto Inseguro</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Peligro GTC 45</th>
                  <th style="padding: 8px 8px; text-align: center; white-space: normal; word-break: normal;">5S</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">EPP</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Nivel Riesgo</th>
                  <th style="padding: 8px 8px; white-space: normal; word-break: normal;">Acción Inmediata</th>
                </tr>
              </thead>
              <tbody>
                <!-- Filas para Fase 1 (Panorama 5S), Fase 2 (Puntos Críticos) y Fase 3 (EPP y Guardas) -->
              </tbody>
            </table>
            </div>`
    },
    psicosocial: {
        id: 'psicosocial',
        title: 'Evaluación de Factores Psicosociales y Salud Mental',
        badgeText: 'Salud Mental & Psicosocial',
        methodLabel: 'Batería MinTrabajo / Res. 2764/2022',
        normRef: 'Res. 2646/2008 / Res. 2764/2022',
        phases: [
            'Fase 1: Clima, Carga Mental y Entorno Laboral',
            'Fase 2: Señales de Fatiga y Agotamiento Emocional',
            'Fase 3: Pautas de Autocuidado y Primeros Auxilios Psicológicos',
        ],
        framingGuidance: `
- AUTO-EVALUACIÓN (Trabajador dialogando frente a pantalla o webcam):
  Instrucción hablada: "Ubícate en un espacio tranquilo, cómodo y con buena iluminación frente a la cámara para conversar sobre tu bienestar laboral."
- EVALUACIÓN ASISTIDA / ENTREVISTA GUIADA:
  Instrucción hablada: "Mantén un encuadre facial medio neutro, sin distracciones de fondo, para facilitar una escucha empática y confidencial."`,
        phaseGuidance: `
- PASO PREVIO OBLIGATORIO (IDENTIFICACIÓN Y CONTEXTO LABORAL):
  En tu saludo inicial pregunta cordialmente: "¡Hola! Soy tu Terapeuta en Salud Mental y Riesgo Psicosocial en WAPPY IA. Para brindarte el mejor acompañamiento, cuéntame: ¿cuál es tu cargo y cómo te has sentido en tu jornada en los últimos días?"
  NO inicies las fases sin antes escuchar el contexto y estado del usuario.
- FASE 1 (Clima, Carga Mental y Entorno): "Comencemos con la Fase 1: conversemos sobre las demandas cognitivas de tu trabajo, los ritmos de entrega y el ambiente con tu equipo..." Invoca 'cambiar_fase_evaluacion' con fase: 1.
- FASE 2 (Señales de Fatiga y Agotamiento): "Para la Fase 2: exploremos síntomas de fatiga, tensión física o dificultades para desconectarte del trabajo al terminar el día..." Invoca 'cambiar_fase_evaluacion' con fase: 2.
- FASE 3 (Pautas de Autocuidado y Bienestar): "Excelente, para la Fase 3: apliquemos una pauta breve de respiración consciente, pausas activas cognitivas y estrategias de autocuidado..." Invoca 'cambiar_fase_evaluacion' con fase: 3.`,
        reportMatrixHeader: `
            <h3>4.1 Matriz de Evaluación Psicosocial y Salud Mental Ocupacional (Res. 2764)</h3>
            <p>La siguiente tabla consolida las dimensiones psicosociales valoradas y las medidas preventivas recomendadas para el bienestar del colaborador:</p>
            <div class="table-responsive" style="overflow-x: auto; width: 100%; margin: 16px 0; -webkit-overflow-scrolling: touch;">
            <table border="0" style="border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; width: 100%; min-width: 850px; table-layout: auto; text-align: left; font-size: 0.85em;">
              <thead style="background-color: #7e22ce; color: white;">
                <tr>
                  <th style="padding: 8px 8px;">Fase</th>
                  <th style="padding: 8px 8px;">Dimensión Evaluada</th>
                  <th style="padding: 8px 8px;">Criterio Técnico (Res. 2764)</th>
                  <th style="padding: 8px 8px;">Manifestación Reportada</th>
                  <th style="padding: 8px 8px; text-align: center;">Nivel de Riesgo</th>
                  <th style="padding: 8px 8px;">Recomendación / PAP</th>
                </tr>
              </thead>
              <tbody>
              </tbody>
            </table>
            </div>`
    },

    medicina_laboral: {
        id: 'medicina_laboral',
        title: 'Inspección de Salud Ocupacional y Medicina Laboral',
        badgeText: 'Medicina Laboral & Salud',
        methodLabel: 'Profesiogramas / Res. 2346/2007',
        normRef: 'Res. 2346/2007 / Dec. 1072/2015',
        phases: [
            'Fase 1: Antecedentes y Exámenes Ocupacionales',
            'Fase 2: Condiciones Fisiológicas y Hábitos',
            'Fase 3: Casos Médicos, ATEL y Reubicaciones',
        ],
        framingGuidance: `
- AUTO-CONSULTA (Colaborador frente a la cámara):
  Instrucción hablada: "Ubícate frente a la cámara con buena luz para un diálogo fluido sobre tu condición de salud y recomendaciones médicas."
- INSPECCIÓN ASISTIDA / REVISIÓN CLÍNICA OCUPACIONAL:
  Instrucción hablada: "Mantén un plano medio del colaborador para verificar postura general y condiciones observables de salud."`,
        phaseGuidance: `
- PASO PREVIO OBLIGATORIO (IDENTIFICACIÓN Y CONTEXTO MÉDICO):
  En tu saludo inicial pregunta cordialmente: "¡Hola! Soy tu Médico Laboral en WAPPY IA. Para registrar este seguimiento ocupacional, cuéntame: ¿cuál es tu cargo y qué sintomatología, examen o caso médico deseas consultar hoy?"
  NO inicies las fases sin antes registrar los antecedentes básicos del usuario.
- FASE 1 (Antecedentes y Exámenes Ocupacionales): "Iniciemos la Fase 1: revisemos tu concepto de aptitud de los exámenes periódicos o de ingreso y las restricciones vigentes..." Invoca 'cambiar_fase_evaluacion' con fase: 1.
- FASE 2 (Condiciones Fisiológicas y Hábitos): "Para la Fase 2: conversemos sobre pausas activas, hidratación, fatiga visual y síntomas físicos durante la jornada..." Invoca 'cambiar_fase_evaluacion' con fase: 2.
- FASE 3 (Casos Médicos y Reubicación): "Para la Fase 3: definamos las recomendaciones ergonómicas y médicas para la adecuación de tu puesto o plan de vigilancia..." Invoca 'cambiar_fase_evaluacion' con fase: 3.`,
        reportMatrixHeader: `
            <h3>4.1 Matriz de Seguimiento Médico Ocupacional y Vigilancia Epidemiológica</h3>
            <p>La siguiente tabla resume los hallazgos de aptitud médica, factores de riesgo fisiológicos y plan de manejo:</p>
            <div class="table-responsive" style="overflow-x: auto; width: 100%; margin: 16px 0; -webkit-overflow-scrolling: touch;">
            <table border="0" style="border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; width: 100%; min-width: 850px; table-layout: auto; text-align: left; font-size: 0.85em;">
              <thead style="background-color: #0f766e; color: white;">
                <tr>
                  <th style="padding: 8px 8px;">Fase</th>
                  <th style="padding: 8px 8px;">Aspecto Médico</th>
                  <th style="padding: 8px 8px;">Hallazgo / Síntoma</th>
                  <th style="padding: 8px 8px; text-align: center;">Aptitud</th>
                  <th style="padding: 8px 8px;">Restricción / SVE</th>
                  <th style="padding: 8px 8px;">Conducta Ocupacional</th>
                </tr>
              </thead>
              <tbody>
              </tbody>
            </table>
            </div>`
    },

    juridico_legal: {
        id: 'juridico_legal',
        title: 'Auditoría Jurídica y Cumplimiento Normativo SG-SST',
        badgeText: 'Cumplimiento Legal SST',
        methodLabel: 'Matriz Legal / Dec. 1072 / Res. 0312',
        normRef: 'Decreto 1072 de 2015 / Res. 0312 de 2019',
        phases: [
            'Fase 1: Evidencias y Documentación Obligatoria',
            'Fase 2: Responsabilidad y Gestión de Riesgos',
            'Fase 3: Plan de Acción y Medidas Correctivas',
        ],
        framingGuidance: `
- AUTO-REVISIÓN (Responsable SST frente a documentos o plataforma):
  Instrucción hablada: "Enfoca con tu cámara los documentos, actas de comité o certificados de afiliación que requieran validación jurídica."
- AUDITORÍA ASISTIDA:
  Instrucción hablada: "Muestra las carpetas o registros físicos del SG-SST para contrastarlos con los estándares mínimos obligatorios."`,
        phaseGuidance: `
- PASO PREVIO OBLIGATORIO (TEMA Y NORMATIVA A CONSULTAR):
  En tu saludo inicial pregunta cordialmente: "¡Hola! Soy tu Abogado Laboral y Consultor Jurídico SG-SST en WAPPY IA. ¿Qué proceso, acta, proceso disciplinario o norma específica deseas auditar hoy?"
  NO inicies las fases sin antes establecer el alcance legal de la consulta.
- FASE 1 (Documentación Obligatoria): "Iniciemos la Fase 1: verifiquemos las políticas firmadas, actas del COPASST / Convivencia y afiliaciones al Sistema de Seguridad Social..." Invoca 'cambiar_fase_evaluacion' con fase: 1.
- FASE 2 (Responsabilidad y Matriz Legal): "Para la Fase 2: identifiquemos los artículos del Decreto 1072 o Resolución 0312 aplicables y las posibles no conformidades..." Invoca 'cambiar_fase_evaluacion' con fase: 2.
- FASE 3 (Medidas Correctivas y Blindaje): "Excelente, para la Fase 3: tracemos el plan de acción con fechas perentorias para subsanar y blindar jurídicamente a la empresa..." Invoca 'cambiar_fase_evaluacion' con fase: 3.`,
        reportMatrixHeader: `
            <h3>4.1 Matriz de Auditoría Jurídica y Cumplimiento de Estándares Mínimos (Res. 0312)</h3>
            <p>La siguiente tabla detalla la conformidad legal de los requisitos obligatorios auditados y las acciones de subsanación:</p>
            <div class="table-responsive" style="overflow-x: auto; width: 100%; margin: 16px 0; -webkit-overflow-scrolling: touch;">
            <table border="0" style="border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; width: 100%; min-width: 850px; table-layout: auto; text-align: left; font-size: 0.85em;">
              <thead style="background-color: #3730a3; color: white;">
                <tr>
                  <th style="padding: 8px 8px;">Fase</th>
                  <th style="padding: 8px 8px;">Estándar / Requisito Legal</th>
                  <th style="padding: 8px 8px;">Norma Aplicable</th>
                  <th style="padding: 8px 8px; text-align: center;">Estado de Cumplimiento</th>
                  <th style="padding: 8px 8px;">Riesgo Sancionatorio</th>
                  <th style="padding: 8px 8px;">Acción Correctiva</th>
                </tr>
              </thead>
              <tbody>
              </tbody>
            </table>
            </div>`
    }
};

/**
 * Resolve inspection protocol based on agent name or specialty string
 */
function resolveInspectionProtocol(agentNameOrSpecialty) {
    if (!agentNameOrSpecialty) {
        return INSPECTION_PROTOCOLS.auditoria_gtc45;
    }

    const name = String(agentNameOrSpecialty).toLowerCase();

    // Consultor SG-SST / Profesional SST / Auditor -> SIEMPRE auditoria_gtc45
    if (name.includes('consultor') || name.includes('profesional sst') || name.includes('auditor')) {
        return INSPECTION_PROTOCOLS.auditoria_gtc45;
    }

    // 1. Biomechanics / Ergonomics / Fisioterapia (ESTRICTAMENTE Fisioterapeuta)
    if (
        name.includes('fisioterapeuta') ||
        name.includes('biomec') ||
        name.includes('rula') ||
        name.includes('reba') ||
        name.includes('owas')
    ) {
        return INSPECTION_PROTOCOLS.biomecanico;
    }

    // 2. Mental Health / Psychology / Psicosocial
    if (
        name.includes('salud mental') ||
        name.includes('mental') ||
        name.includes('terapeuta') ||
        name.includes('psicólog') ||
        name.includes('psicolog') ||
        name.includes('psicosocial') ||
        name.includes('estrés') ||
        name.includes('estres') ||
        name.includes('burnout') ||
        name.includes('emocional')
    ) {
        return INSPECTION_PROTOCOLS.psicosocial;
    }

    // 3. Occupational Health / Medicine
    if (
        name.includes('médic') ||
        name.includes('medic') ||
        name.includes('medicina') ||
        name.includes('salud ocupacional') ||
        name.includes('profesiograma') ||
        name.includes('reubicación') ||
        name.includes('reubicacion') ||
        name.includes('atel') ||
        name.includes('enfermedad laboral')
    ) {
        return INSPECTION_PROTOCOLS.medicina_laboral;
    }

    // 4. Legal / Jurídico / Abogado
    if (
        name.includes('abogad') ||
        name.includes('jurídic') ||
        name.includes('juridic') ||
        name.includes('legal') ||
        name.includes('normat') ||
        name.includes('legislación') ||
        name.includes('legislacion')
    ) {
        return INSPECTION_PROTOCOLS.juridico_legal;
    }

    // 5. Chemical family
    if (
        name.includes('químic') ||
        name.includes('quimic') ||
        name.includes('sga') ||
        name.includes('sustancias') ||
        name.includes('reactivos') ||
        name.includes('ambiental')
    ) {
        return INSPECTION_PROTOCOLS.quimico;
    }

    // 6. Road safety / PESV family
    if (
        name.includes('vial') ||
        name.includes('pesv') ||
        name.includes('vehicular') ||
        name.includes('tránsito') ||
        name.includes('transito') ||
        name.includes('conductor')
    ) {
        return INSPECTION_PROTOCOLS.pesv;
    }

    // 7. Emergencies, Electrical, First Aid, Botiquín, Fire, High Risk, Heights
    if (
        name.includes('botiquín') ||
        name.includes('botiquin') ||
        name.includes('primeros auxilios') ||
        name.includes('emergencia') ||
        name.includes('extintor') ||
        name.includes('brigad') ||
        name.includes('eléctric') ||
        name.includes('electric') ||
        name.includes('retie') ||
        name.includes('alto riesgo') ||
        name.includes('altura') ||
        name.includes('tsa') ||
        name.includes('minería') ||
        name.includes('mineria')
    ) {
        return INSPECTION_PROTOCOLS.emergencias_electrico;
    }

    // 8. Default: General Safety Audit GTC 45 / 5S (Consultor SG-SST)
    return INSPECTION_PROTOCOLS.auditoria_gtc45;
}

module.exports = {
    INSPECTION_PROTOCOLS,
    resolveInspectionProtocol
};
