const fs = require('fs');
const path = require('path');

const ch6_10 = `
  <h2>CAPÍTULO VI — SEGURIDAD Y SALUD EN EL TRABAJO</h2>
  <h3>Art. 39° Política de SST</h3>
  <p>La empresa declara su férreo compromiso con el diseño, implementación, mantenimiento y mejora continua del Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST), de conformidad con el Decreto 1072 de 2015, Resolución 0312 de 2019 y leyes subsiguientes. El bienestar físico, mental y social de nuestros trabajadores es el principal activo de nuestra operación. Las normativas sobre SST son de obligatorio cumplimiento por parte de todos los contratistas, personal interno y visitantes.</p>

  <h3>Art. 40° Obligaciones del empleador en SST</h3>
  <p>Son obligaciones irrenunciables del empleador: 1. Procurar el cuidado integral de la salud de los trabajadores y los ambientes de trabajo. 2. Afiliar obligatoriamente a todos los trabajadores a la ARL, EPS y Fondo de Pensiones, asumiendo su costo conforme a la ley. 3. Identificar peligros, evaluar y valorar los riesgos (Matriz IPEVAR) y establecer los controles para mitigarlos. 4. Suministrar y reponer oportunamente todos los Elementos de Protección Personal (EPP) y ropa de trabajo. 5. Garantizar las inducciones y reinducciones en materia de prevención de riesgos. 6. Diseñar y ensayar los planes de emergencia y brigadas.</p>

  <h3>Art. 41° Obligaciones del trabajador en SST</h3>
  <p>El trabajador está legalmente obligado a: 1. Procurar el cuidado integral de su salud. 2. Suministrar información clara, veraz y completa sobre su estado de salud. 3. Cumplir celosamente con las normas, reglamentos e instrucciones del SG-SST. 4. Informar oportunamente al empleador acerca de los peligros y riesgos latentes en su puesto de trabajo. 5. Participar proactivamente en las actividades de capacitación en SST. 6. Utilizar adecuada y obligatoriamente las dotaciones, maquinaria y los EPP asignados. El incumplimiento de estas normas se califica como falta grave y puede ser justa causa de terminación del contrato.</p>

  <h3>Art. 42° Elementos de Protección Personal (EPP)</h3>
  <p>La empresa hará entrega sin costo alguno para el trabajador de todos los Elementos de Protección Personal de acuerdo con la labor a realizar y la Matriz IPEVAR del cargo. El trabajador deberá utilizarlos obligatoriamente en todas las zonas o actividades de riesgo, mantenerlos aseados, no sacarlos del recinto laboral injustificadamente, solicitar su reemplazo por daño o desgaste natural, y devolverlos a la terminación del contrato.</p>

  <h3>Art. 43° Indicaciones para evitar riesgos profesionales</h3>
  <p>Los trabajadores deben evitar acciones temerarias como operar equipos para los cuales no estén capacitados ni autorizados, retirar guardas de seguridad, hacer mantenimiento a máquinas en movimiento, correr por escaleras o pasillos, obstruir salidas de emergencia, realizar maniobras eléctricas sin autorización o laborar bajo influjo del alcohol o medicamentos sedantes sin informar. Ante el riesgo inminente, el trabajador tiene el derecho y deber de detener la labor y notificar al empleador.</p>

  <h3>Art. 44° Instrucciones para primeros auxilios</h3>
  <p>En caso de accidente o emergencia de salud, el accidentado o quien presencie el hecho deberá comunicar de inmediato a la Brigada de Emergencia, Jefe Inmediato o Responsable de SST. Únicamente el personal con entrenamiento está autorizado a brindar primeros auxilios. La empresa dispondrá de botiquines dotados con los elementos exigidos por la norma y rutas de evacuación claras. Todo trabajador está en obligación de conocer y actuar según el Plan Escrito de Prevención, Preparación y Respuesta ante Emergencias de la empresa.</p>

  <h3>Art. 45° Reporte de accidentes de trabajo y enfermedades laborales</h3>
  <p>El trabajador que sufra un accidente de trabajo, por leve que sea, debe reportarlo inmediatamente a su superior para que la empresa diligencie el reporte ante la ARL (FURAT) dentro de los dos (2) días hábiles siguientes al hecho, conforme a la Ley 1562 de 2012. La omisión del trabajador en el reporte oportuno acarreará procesos disciplinarios. En el caso de sospecha de enfermedad laboral, el trabajador debe informar el dictamen médico apenas le sea entregado por su EPS o ARL.</p>

  <h3>Art. 46° COPASST — Comité Paritario de SST</h3>
  <p>Dependiendo de la cantidad de trabajadores, la empresa garantizará la conformación del Comité Paritario de Seguridad y Salud en el Trabajo (COPASST), o designará al Vigía en SST, quienes vigilarán la normativa y promoción de la salud. La empresa otorgará a los representantes del comité un (1) hora semanal dentro de la jornada ordinaria para sus funciones, y las reuniones tendrán carácter de obligatorio cumplimiento y se llevarán bajo actas formales.</p>

  <h3>Art. 47° Exámenes médicos</h3>
  <p>El empleador tiene el deber y el trabajador la obligación de someterse a los exámenes médicos ocupacionales de ingreso, periódicos, por cambio de ocupación, de egreso, post-incapacidad, y aquellos exigidos por la vigilancia epidemiológica que la empresa determine pertinentes con cargo exclusivo al empleador. La negativa del trabajador de practicarse el examen se considera insubordinación grave.</p>

  <h3>Art. 48° Política de prevención del consumo de alcohol, tabaco y sustancias psicoactivas</h3>
  <p>Con el fin de garantizar condiciones de trabajo seguras, está terminantemente prohibido para todo el personal, directivo, operativo y subcontratistas, presentarse al lugar de trabajo bajo el efecto del alcohol, sustancias psicoactivas ilícitas o medicamentos que afecten el desempeño seguro, y consumir, poseer o comercializar los mismos durante la jornada laboral o dentro de las instalaciones. La empresa se reserva el derecho de realizar pruebas de alcoholimetría o sustancias de manera preventiva o aleatoria garantizando la dignidad del trabajador.</p>

  <h3>Art. 49° Espacios libres de humo de tabaco</h3>
  <p>En estricto cumplimiento de la Ley 1335 de 2009, todas las instalaciones de la empresa bajo techo, lugares cerrados, áreas de almacenamiento, bodegas y vehículos corporativos son declarados Áreas 100% Libres de Humo. Ningún trabajador o visitante podrá encender cigarrillos o emplear vapeadores en dichas áreas. Quien desee fumar deberá hacerlo en el exterior de la empresa o en áreas designadas específicamente a la intemperie (si existieren), durante los periodos de descanso.</p>

  <h2>CAPÍTULO VII — NORMAS DE CONVIVENCIA Y CONDUCTA</h2>
  <h3>Art. 50° Protección especial a la mujer embarazada y madre lactante</h3>
  <p>De conformidad con el Código Sustantivo del Trabajo y la Constitución Política, la empresa garantiza la estabilidad laboral reforzada de la mujer embarazada o en estado de lactancia. Ninguna trabajadora puede ser despedida por motivo de embarazo o lactancia. El despido requiere obligatoriamente autorización del Inspector del Trabajo. Adicionalmente, se prohibirá exigir a mujeres gestantes o lactantes realizar tareas de levantamiento de cargas pesadas o que pongan en peligro el normal desarrollo del feto o al recién nacido.</p>

  <h3>Art. 51° Normas para trabajadores menores de edad</h3>
  <p>La contratación de menores de edad (de 15 a 17 años) requerirá de manera indelegable autorización por escrito y fundamentada del Inspector de Trabajo o el ente territorial (ICBF/Comisaría de Familia). Estará estrictamente prohibido que desempeñen labores nocturnas, trabajo en minas, labores peligrosas, manipulación de sustancias tóxicas o maquinaria pesada, o que superen las jornadas limitadas dispuestas en la Ley de Infancia y Adolescencia.</p>

  <h3>Art. 52° Manejo de activos, equipos y herramientas corporativas</h3>
  <p>Todos los equipos de oficina, computadores, teléfonos, maquinaria, vehículos y demás herramientas suministradas por la empresa a los trabajadores son de uso estrictamente laboral y de propiedad de la compañía. El trabajador es responsable por su cuidado, conservación y debida utilización. Deberá reportar inmediatamente su daño, deterioro o pérdida justificada. En caso de daño por negligencia severa comprobada, dolo o pérdida, la empresa podrá tomar acciones resarcitorias mediante las deducciones autorizadas y ejecutar el proceso disciplinario.</p>

  <h3>Art. 53° Uso de tecnología y comunicaciones corporativas</h3>
  <p>El acceso a internet corporativo, correo electrónico, redes de datos e información institucional y sistemas de información es para uso exclusivo del desempeño de las labores asignadas. La empresa podrá monitorear el tráfico, las redes y la metadata generada a través de estos sistemas. Está prohibida la instalación de software no autorizado, el uso del correo institucional para fines de acoso laboral/sexual, pornografía, proselitismo político, el envío de cadenas de correos ajenos a la actividad laboral, y el hurto y la exposición indebida de la propiedad intelectual empresarial.</p>

  <h3>Art. 54° Protección de datos personales</h3>
  <p>La recolección y tratamiento de los datos personales de los trabajadores estará ceñida a lo dispuesto en la Ley Estatutaria 1581 de 2012 (Hábeas Data). La información suministrada se tratará bajo absoluta reserva, en especial el diagnóstico de condiciones de salud y datos de menores. Asimismo, el trabajador que en ejercicio de su rol tenga acceso a datos personales de clientes y terceros deberá mantener confidencialidad irrestricta de acuerdo a los protocolos empresariales.</p>

  <h3>Art. 55° Presentación personal y porte del carné o uniforme</h3>
  <p>Si la empresa suministra uniformes o dotación, su uso es obligatorio, completo e inalterado durante la totalidad de la jornada laboral. En todo caso, los trabajadores deben presentarse a sus labores vestidos de forma adecuada, limpia, guardando las normas mínimas de decoro o el código de vestimenta (dress code) expedido por la compañía, portando siempre en lugar visible su carné de identificación corporativa por motivos de seguridad.</p>

  <h2>CAPÍTULO VIII — OBLIGACIONES Y PROHIBICIONES</h2>
  <h3>Art. 56° Obligaciones especiales del EMPLEADOR</h3>
  <p>Son obligaciones especiales del empleador (Art. 57 CST):
  1. Poner a disposición los instrumentos y materias primas necesarios.
  2. Proveer locales apropiados y elementos contra accidentes.
  3. Prestar primeros auxilios.
  4. Pagar el salario, prestaciones y aportes a seguridad social a tiempo.
  5. Guardar absoluto respeto a la dignidad del trabajador, sus creencias y sentimientos.
  6. Conceder las licencias necesarias remuneradas y no remuneradas de ley.
  7. Cumplir el reglamento interno y garantizar la desconexión laboral, y prevenir acoso laboral, acoso sexual, garantizando la salud mental de todos.
  </p>

  <h3>Art. 57° Prohibiciones especiales al EMPLEADOR</h3>
  <p>El empleador tiene prohibido (Art. 59 CST):
  1. Deducir, retener o compensar sumas de salarios sin autorización clara del trabajador.
  2. Obligar a compras de mercancías o alimentos de comercios del empleador.
  3. Exigir dinero o regalos para ser admitido o promocionado en el cargo.
  4. Limitar el derecho a asociarse o pertenecer a sindicatos (Pacto Colectivo forzado).
  5. Imponer a los trabajadores obligaciones religiosas o políticas.
  6. Autorizar o tolerar el porte o uso de drogas y alcohol durante el trabajo, coaccionar, o generar acoso en cualquiera de sus manifestaciones.
  7. Desconocer el derecho a la desconexión digital de sus subordinados.</p>

  <h3>Art. 58° Obligaciones especiales de LOS TRABAJADORES</h3>
  <p>Son deberes del trabajador (Art. 58 CST):
  1. Cumplir estrictamente sus obligaciones y el presente reglamento.
  2. Guardar rigurosa moral en todas sus relaciones con sus superiores y compañeros.
  3. Conservar y restituir en buen estado las herramientas, maquinaria e instrumentos asignados.
  4. Prestar la colaboración posible en casos de siniestro o riesgo inminente.
  5. Guardar el secreto y confidencialidad comercial e industrial y de los asuntos estrictamente técnicos o que puedan causar perjuicios.
  6. Acatar las órdenes y medidas dadas para la seguridad y la prevención en SST.
  7. Respetar y velar por los derechos a la desconexión digital de sus pares y subordinados.</p>

  <h3>Art. 59° Prohibiciones especiales a LOS TRABAJADORES</h3>
  <p>Está estrictamente prohibido a los trabajadores (Art. 60 CST y demás):
  1. Sustraer de las instalaciones útiles, materia prima o productos sin permiso.
  2. Presentarse al trabajo en estado de embriaguez o bajo el efecto de sustancias narcóticas.
  3. Portar armas de cualquier especie durante el trabajo.
  4. Disminuir intencionalmente el ritmo de trabajo o promover huelgas ilegales.
  5. Faltar al trabajo sin justa causa de impedimento o sin permiso del empleador.
  6. Usar los útiles de la empresa en asuntos distintos al trabajo asignado.
  7. Incurrir en conductas que representen acoso laboral, discriminación de género o cualquier modalidad de acoso sexual sobre compañeros o terceros.</p>

  <h2>CAPÍTULO IX — RÉGIMEN DISCIPLINARIO</h2>
  <h3>Art. 60° Principios rectores</h3>
  <p>El régimen disciplinario está basado en el respeto del Debido Proceso Constitucional en los términos señalados en la Ley 2466 de 2025. Toda investigación y sanción interna estará orientada por los principios de: Dignidad Humana, Imparcialidad, Legalidad (la falta debe estar claramente descrita en este reglamento o en el contrato), Tipicidad, Proporcionalidad a la gravedad de la falta, y Non bis in ídem (nadie puede ser sancionado dos veces por el mismo hecho).</p>

  <h3>Art. 61° Escala de FALTAS LEVES</h3>
  <p>Constituyen faltas de menor magnitud e impacto, que entorpecen la operación pero no destruyen la confianza del empleador, tales como:
  1. Retardos injustificados inferiores a 15 minutos al iniciar la jornada.
  2. Fallar por primera vez en la utilización completa de los elementos de dotación (sin ser EPP crítico).
  3. Errores operativos leves y corregibles que no generen pérdidas económicas notables.
  4. Exceder los tiempos fijados para descansos sin autorización.
  5. Distraer a sus compañeros de labores y conversar en exceso afectando el rendimiento.</p>

  <h3>Art. 62° Escala de FALTAS GRAVES</h3>
  <p>Se considerarán faltas graves todas las enumeradas en el Art. 62 del CST como justas causas para terminación de contrato, y de manera enunciativa:
  1. La ausencia injustificada o abandono de labores, por uno o más días continuos o fraccionados en el mismo mes calendario.
  2. Fraude, falsificación de firmas o manipulación de registros y certificados (incapacidades falsas, marcaciones de tiempos inexistentes).
  3. Violación del secreto industrial y de la confidencialidad de la información (Ley 1581/2012).
  4. Negativa obstinada a someterse a medidas preventivas, normas SST, realización de evaluaciones médicas y el no uso de EPP para actividades de alto riesgo (ej. alturas).
  5. Consumir licor o drogas en horas y espacios de trabajo.
  6. Cualquier manifestación o queja ratificada de acoso sexual o acoso laboral con componente lesivo, acoso digital y agresión física, o cualquier forma de maltrato a la mujer o a las comunidades diversas.
  7. Usar los vehículos y propiedad de la compañía sin autorización.
  8. La desobediencia manifiesta al derecho a la desconexión laboral de sus subordinados causando coacción y hostigamiento.</p>

  <h3>Art. 63° Escala de SANCIONES DISCIPLINARIAS</h3>
  <p>Dependiendo de la gravedad de la falta y los agravantes o atenuantes hallados en la investigación, la empresa podrá imponer progresivamente las siguientes sanciones:
  1. Llamado de atención verbal y orientación (solo para el expediente general y feedback).
  2. Amonestación escrita con anotación en la hoja de vida.
  3. Multa monetaria, aplicable exclusivamente a faltas asociadas con retardos o ausencias injustificadas.
  4. Suspensión temporal en la prestación de los servicios y del pago del salario, la cual, por la primera vez de una falta determinada, no excederá de ocho (8) días; en caso de reincidencia repetida de la misma clase de falta, no excederá de dos (2) meses.
  5. Despido con Justa Causa Legal (previsto como falta grave que resquebraja irremediablemente la confianza y causa el retiro amparado en el CST y en los estipulados de este Reglamento).</p>

  <h3>Art. 64° Límites a las multas</h3>
  <p>De conformidad con el Artículo 113 del CST, las multas se aplicarán exclusivamente cuando el trabajador, sin excusa suficiente, llegue tarde a sus labores, o falte al trabajo (ausentismo). Esta multa no puede en ningún caso, ni en repetidas oportunidades, exceder de la quinta (1/5) parte del salario de un (1) día de la cuota ordinaria de nómina; y la suma recaudada se destinará exclusivamente al rubro de bienestar o estímulo que beneficie a todos los trabajadores.</p>

  <h3>Art. 65° PROCEDIMIENTO DISCIPLINARIO CON GARANTÍA DE DEBIDO PROCESO</h3>
  <p>De acuerdo con la nueva legislación laboral colombiana y sentencias vinculantes, para aplicar cualquier sanción la empresa debe garantizar obligatoriamente el siguiente protocolo:
  1. <strong>Citación a diligencia de descargos:</strong> Se notificará por escrito y de forma presencial o electrónica al trabajador de la falta cometida, su fecha, su calificación y pruebas, con al menos 48 horas de antelación.
  2. <strong>Audiencia y acompañamiento:</strong> El trabajador expondrá su versión y pruebas de defensa; para ello tiene el derecho a ser asistido por dos (2) compañeros de trabajo y/o un (1) representante del sindicato al cual pertenezca.
  3. <strong>Toma de decisión debidamente motivada:</strong> El ente sancionador o superior directo redactará un fallo con las pruebas recabadas en que se determinará la absolución o aplicación de la sanción proporcional.
  4. <strong>Recurso de reposición / reconsideración:</strong> Conforme al Debido Proceso y Ley 2466 de 2025, el trabajador tendrá un plazo no mayor a cinco (5) días hábiles tras ser notificado, para elevar recurso de reconsideración, que deberá ser fallado por el ente superior a quien impuso la sanción.</p>

  <h3>Art. 66° Cargos con facultad sancionatoria</h3>
  <p>Estarán facultados directa y expresamente para citar a descargos, dirigir la audiencia y resolver la imposición de las sanciones disciplinarias hasta por despido de justa causa, los siguientes cargos dentro de la estructura empresarial:</p>
  <p><strong>Cargos facultados:</strong><br>
  {{cargos_sancionatorios}}</p>
  <p>Toda sanción superior a amonestación verbal deberá constar en copia en el expediente laboral del trabajador reposado en Gestión Humana o la dependencia correspondiente.</p>

  <h3>Art. 67° Término de prescripción para aplicar sanciones</h3>
  <p>El empleador perderá toda facultad y caducará la potestad disciplinaria para investigar y sancionar faltas de los trabajadores, si dentro de los tres (3) meses siguientes al conocimiento efectivo de la ocurrencia del hecho, no ha citado formalmente a descargos o impuesto la sanción correspondiente, tal como lo regula el Código Sustantivo del Trabajo.</p>
\`;

fs.writeFileSync(path.join(__dirname, 'rit_parts_2.js'), ch6_10);
console.log('Part 2 written');
