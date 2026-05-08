module.exports = `
<div class="rit-document">
  <h1>REGLAMENTO INTERNO DE TRABAJO</h1>
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0; font-family: Arial, sans-serif; margin-bottom: 20px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <thead>
      <tr>
        <th colspan="4" style="background-color: #0e7460; color: white; padding: 12px; text-align: left; font-size: 14px; font-weight: bold; text-transform: uppercase;">
          INFORMACIÓN GENERAL DE LA EMPRESA
        </th>
      </tr>
    </thead>
    <tbody style="font-size: 13px; color: #333;">
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; width: 20%; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Razón Social:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; width: 30%; border-right: 1px solid #e0e0e0;">{{empresa_nombre}}</td>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; width: 20%; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">NIT:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; width: 30%;">{{empresa_nit}}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Representante:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">{{representante_legal}}</td>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">N° Trabajadores:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">{{numero_trabajadores}}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Nivel de Riesgo:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">{{nivel_riesgo}}</td>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">ARL:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">{{arl}}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Domicilio:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">{{ciudad_domicilio}}, {{departamento}} - {{direccion}}</td>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Tipo de Empresa:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">{{tipo_empresa}}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-right: 1px solid #e0e0e0;">Actividad Económica:</td>
        <td style="padding: 10px; border-right: 1px solid #e0e0e0;">{{actividad_economica}}</td>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-right: 1px solid #e0e0e0;">Código CIIU:</td>
        <td style="padding: 10px;">{{codigo_ciiu}}</td>
      </tr>
    </tbody>
  </table>

  <h2>PREÁMBULO</h2>
  <p>Este Reglamento Interno de Trabajo, prescrito por {{empresa_nombre}}, domiciliada en {{ciudad_domicilio}}, rige las relaciones laborales entre la empresa y sus trabajadores, de conformidad con lo establecido en los artículos 104 a 125 del Código Sustantivo del Trabajo y la legislación colombiana vigente, incluyendo la Ley 2466 de 2025.</p>

  <h2>CAPÍTULO I — DEL EMPLEADOR, TRABAJADORES Y TIPOS DE CONTRATO</h2>
  <h3>Art. 1° Identificación del empleador, domicilio y actividad</h3>
  <p>[El empleador es {{empresa_nombre}} con NIT {{empresa_nit}} y domicilio en {{ciudad_domicilio}} dedicada a {{actividad_economica}}]</p>
  
  <h3>Art. 2° Ámbito de aplicación del reglamento</h3>
  <p>[Aplica a todos los trabajadores de la empresa independientemente de su tipo de contrato o modalidad de trabajo]</p>
  
  <h3>Art. 3° Condiciones de admisión de nuevos trabajadores</h3>
  <p>[Requisitos y documentos necesarios para el ingreso a la empresa]</p>
  
  <h3>Art. 4° Período de prueba</h3>
  <p>[El período de prueba será máximo de 2 meses. No aplica para contratos inferiores a 1 año sin proporción]</p>
  
  <h3>Art. 5° Trabajadores accidentales o transitorios</h3>
  <p>[Definición y derechos de trabajadores accidentales o transitorios]</p>
  
  <h3>Art. 6° Contrato de aprendizaje SENA</h3>
  <p>[Condiciones según Ley 2466/2025, apoyo de sostenimiento, seguridad social y prestaciones plenas en etapa práctica]</p>
  
  <h3>Art. 7° Teletrabajo, trabajo remoto y trabajo en casa</h3>
  <p>[Disposiciones sobre Ley 1221/2008 y Ley 2121/2021]</p>
  
  <h3>Art. 8° Trabajo en plataformas digitales</h3>
  <p>[Disposiciones sobre formalización laboral Ley 2466/2025, si aplica]</p>
  
  <h3>Art. 9° Orden jerárquico del personal</h3>
  <p>[Orden jerárquico a definir en las preguntas interactivas]</p>

  <h2>CAPÍTULO II — JORNADA DE TRABAJO</h2>
  <h3>Art. 10° Jornada ordinaria</h3>
  <p>[La jornada será la máxima legal (42 horas desde 15 jul. 2026) o menor según acuerdo]</p>
  
  <h3>Art. 11° Horarios de entrada y salida / Turnos rotativos</h3>
  <p>[Horarios específicos de la empresa]</p>
  
  <h3>Art. 12° Jornada nocturna</h3>
  <p>[Inicia a las 7:00 p.m. y termina a las 6:00 a.m. vigente desde 25 dic. 2025 según Ley 2466/2025]</p>
  
  <h3>Art. 13° Períodos para comidas y descansos dentro de la jornada</h3>
  <p>[Tiempos de descanso y alimentación]</p>
  
  <h3>Art. 14° Horas extras y trabajo suplementario</h3>
  <p>[Autorización, límites diarios/semanales y recargos aplicables]</p>
  
  <h3>Art. 15° Recargos nocturnos, dominicales y festivos</h3>
  <p>[Escala gradual Ley 2466/2025: 80% en 2025, 90% en jul. 2026, 100% en 2027]</p>
  
  <h3>Art. 16° Trabajadoras domésticas</h3>
  <p>[Derecho pleno a jornada máxima, recargos nocturnos, dominicales y festivos]</p>
  
  <h3>Art. 17° Registro y control de asistencia</h3>
  <p>[Mecanismos de control de ingresos y salidas]</p>

  <h2>CAPÍTULO III — DESCONEXIÓN LABORAL DIGITAL (Ley 2191/2022)</h2>
  <h3>Art. 18° Derecho a la desconexión laboral</h3>
  <p>[Garantía de no contacto fuera de la jornada ordinaria salvo fuerza mayor]</p>
  
  <h3>Art. 19° Protocolo de desconexión</h3>
  <p>[Canales de comunicación permitidos y horarios de respuesta]</p>
  
  <h3>Art. 20° Excepciones de fuerza mayor o caso fortuito</h3>
  <p>[Definición de situaciones excepcionales]</p>
  
  <h3>Art. 21° Medidas frente a la vulneración del derecho a la desconexión</h3>
  <p>[Mecanismos de reporte y atención de vulneraciones]</p>

  <h2>CAPÍTULO IV — DESCANSOS, VACACIONES Y LICENCIAS</h2>
  <h3>Art. 22° Descanso dominical remunerado</h3>
  <p>[Condiciones para el descanso dominical remunerado]</p>
  
  <h3>Art. 23° Descanso en días festivos</h3>
  <p>[Condiciones para el descanso en festivos]</p>
  
  <h3>Art. 24° Vacaciones anuales</h3>
  <p>[15 días hábiles remunerados por cada año de servicio]</p>
  
  <h3>Art. 25° Compensación de vacaciones en dinero</h3>
  <p>[Condiciones para compensar hasta la mitad de las vacaciones]</p>
  
  <h3>Art. 26° Licencia de maternidad</h3>
  <p>[18 semanas según Ley 1822/2017]</p>
  
  <h3>Art. 27° Licencia de paternidad</h3>
  <p>[2 semanas según Ley 2114/2021]</p>
  
  <h3>Art. 28° Licencia remunerada por luto</h3>
  <p>[5 días hábiles según Ley 1280/2009]</p>
  
  <h3>Art. 29° Licencia por endometriosis y condiciones de salud menstrual</h3>
  <p>[Con certificación médica según Ley 2466/2025]</p>
  
  <h3>Art. 30° Licencia para acompañamiento escolar obligatorio</h3>
  <p>[Licencia como acudiente según Ley 2466/2025]</p>
  
  <h3>Art. 31° Permisos remunerados</h3>
  <p>[Calamidad doméstica comprobada, comisiones sindicales, entierro de compañeros]</p>
  
  <h3>Art. 32° Permisos no remunerados y su procedimiento de solicitud</h3>
  <p>[Procedimiento para solicitar permisos no remunerados]</p>

  <h2>CAPÍTULO V — SALARIOS, PAGOS Y PRESTACIONES</h2>
  <h3>Art. 33° Salario mínimo legal vigente y salario convencional</h3>
  <p>[Disposiciones sobre el salario base]</p>
  
  <h3>Art. 34° Lugar, día, hora y período de pago</h3>
  <p>[El pago se realizará mediante {{forma_pago}} con periodicidad {{periodicidad_pago}}]</p>
  
  <h3>Art. 35° Deducciones legalmente permitidas</h3>
  <p>[Retenciones y deducciones autorizadas por ley y por el trabajador]</p>
  
  <h3>Art. 36° Auxilio de transporte</h3>
  <p>[Pago del auxilio de transporte para quienes devenguen hasta 2 SMMLV]</p>
  
  <h3>Art. 37° Cesantías, intereses y prima de servicios</h3>
  <p>[Liquidación y pago de prestaciones sociales de ley]</p>
  
  <h3>Art. 38° Prestaciones adicionales a las legales</h3>
  <p>[Beneficios extralegales, si los hubiere]</p>

  <h2>CAPÍTULO VI — SEGURIDAD Y SALUD EN EL TRABAJO</h2>
  <h3>Art. 39° Política de SST</h3>
  <p>[Declaración de la política del Sistema de Gestión de SST]</p>
  
  <h3>Art. 40° Obligaciones del empleador en SST</h3>
  <p>[Proveer condiciones seguras, EPP, capacitación, etc.]</p>
  
  <h3>Art. 41° Obligaciones del trabajador en SST</h3>
  <p>[Cumplir normas, usar EPP, reportar peligros]</p>
  
  <h3>Art. 42° Elementos de Protección Personal (EPP)</h3>
  <p>[Entrega, uso obligatorio y reposición de EPP]</p>
  
  <h3>Art. 43° Indicaciones para evitar riesgos profesionales</h3>
  <p>[Prevención de accidentes y enfermedades laborales]</p>
  
  <h3>Art. 44° Instrucciones para primeros auxilios</h3>
  <p>[Manejo de emergencias y primeros auxilios básicos]</p>
  
  <h3>Art. 45° Reporte de accidentes de trabajo y enfermedades laborales</h3>
  <p>[Obligación de reporte inmediato según Ley 1562/2012]</p>
  
  <h3>Art. 46° COPASST — Comité Paritario de SST</h3>
  <p>[Conformación y funciones del COPASST o Vigía de SST]</p>
  
  <h3>Art. 47° Exámenes médicos</h3>
  <p>[Exámenes de ingreso, periódicos y de egreso]</p>
  
  <h3>Art. 48° Política de prevención del consumo de alcohol, tabaco y sustancias psicoactivas</h3>
  <p>[Prohibición de presentarse bajo efectos y consumo en instalaciones]</p>
  
  <h3>Art. 49° Espacios libres de humo de tabaco</h3>
  <p>[Prohibición total en instalaciones cerradas Ley 1335/2009]</p>

  <h2>CAPÍTULO VII — NORMAS DE CONVIVENCIA Y CONDUCTA</h2>
  <h3>Art. 50° Protección especial a la mujer embarazada y madre lactante</h3>
  <p>[Estabilidad laboral reforzada Art. 239 CST]</p>
  
  <h3>Art. 51° Normas para trabajadores menores de edad</h3>
  <p>[Disposiciones para trabajadores menores, si los hubiere]</p>
  
  <h3>Art. 52° Manejo de activos, equipos y herramientas corporativas</h3>
  <p>[Responsabilidad y buen uso de bienes de la empresa]</p>
  
  <h3>Art. 53° Uso de tecnología y comunicaciones corporativas</h3>
  <p>[Uso adecuado de internet, correo y equipos en horas laborales]</p>
  
  <h3>Art. 54° Protección de datos personales</h3>
  <p>[Tratamiento de datos personales de los trabajadores Ley 1581/2012]</p>
  
  <h3>Art. 55° Presentación personal y porte del carné o uniforme</h3>
  <p>[Normas de presentación, uniforme y distintivos]</p>

  <h2>CAPÍTULO VIII — OBLIGACIONES Y PROHIBICIONES</h2>
  <h3>Art. 56° Obligaciones especiales del EMPLEADOR</h3>
  <p>[Lista de obligaciones según Art. 57 CST]</p>
  
  <h3>Art. 57° Prohibiciones especiales al EMPLEADOR</h3>
  <p>[Lista de prohibiciones según Art. 59 CST]</p>
  
  <h3>Art. 58° Obligaciones especiales de LOS TRABAJADORES</h3>
  <p>[Lista de obligaciones según Art. 58 CST]</p>
  
  <h3>Art. 59° Prohibiciones especiales a LOS TRABAJADORES</h3>
  <p>[Lista de prohibiciones según Art. 60 CST]</p>

  <h2>CAPÍTULO IX — RÉGIMEN DISCIPLINARIO</h2>
  <h3>Art. 60° Principios rectores</h3>
  <p>[Legalidad, proporcionalidad, tipicidad, no doble sanción y debido proceso]</p>
  
  <h3>Art. 61° Escala de FALTAS LEVES</h3>
  <p>[Retardos injustificados, ausencias cortas, incumplimiento leve, etc.]</p>
  
  <h3>Art. 62° Escala de FALTAS GRAVES</h3>
  <p>[Causales de despido con justa causa según Art. 62 CST, acoso comprobado, etc.]</p>
  
  <h3>Art. 63° Escala de SANCIONES DISCIPLINARIAS</h3>
  <p>[Llamado de atención verbal, amonestación escrita, multa, suspensión, terminación]</p>
  
  <h3>Art. 64° Límites a las multas</h3>
  <p>[Máximo 1/8 del salario diario según Art. 113 CST]</p>
  
  <h3>Art. 65° PROCEDIMIENTO DISCIPLINARIO CON GARANTÍA DE DEBIDO PROCESO</h3>
  <p>[Procedimiento detallado según Ley 2466/2025: citación, descargos, pruebas, decisión, recurso]</p>
  
  <h3>Art. 66° Cargos con facultad sancionatoria</h3>
  <p>[Cargos con facultad sancionatoria a definir en las preguntas interactivas]</p>
  
  <h3>Art. 67° Término de prescripción para aplicar sanciones</h3>
  <p>[Máximo 3 meses desde el conocimiento del hecho Art. 115 CST]</p>

  <h2>CAPÍTULO X — PREVENCIÓN DEL ACOSO LABORAL (Ley 1010/2006)</h2>
  <h3>Art. 68° Política de cero tolerancia al acoso laboral</h3>
  <p>[Declaración formal de la política de convivencia]</p>
  
  <h3>Art. 69° Definición, modalidades y conductas constitutivas de acoso laboral</h3>
  <p>[Maltrato, persecución, discriminación, entorpecimiento, inequidad, desprotección]</p>
  
  <h3>Art. 70° Comité de Convivencia Laboral</h3>
  <p>[Conformación, funciones y períodos según Resolución 3461/2025]</p>
  
  <h3>Art. 71° Procedimiento confidencial de quejas por acoso laboral</h3>
  <p>[Mecanismo para recepción de quejas ante el Comité]</p>
  
  <h3>Art. 72° Sanciones disciplinarias internas por acoso laboral</h3>
  <p>[Sanciones aplicables si se comprueba el acoso]</p>
  
  <h3>Art. 73° Mecanismos de protección al denunciante</h3>
  <p>[Garantías contra represalias]</p>

  <h2>CAPÍTULO XI — PREVENCIÓN DEL ACOSO SEXUAL (Ley 2365/2024)</h2>
  <h3>Art. 74° Política de prevención y cero tolerancia al acoso sexual</h3>
  <p>[Declaración formal de rechazo al acoso sexual]</p>
  
  <h3>Art. 75° Definición de acoso sexual</h3>
  <p>[Connotación sexual, lasciva o libidinosa en contexto laboral, presencial o digital]</p>
  
  <h3>Art. 76° Alcance</h3>
  <p>[Aplica a empleados, contratistas, aprendices, pasantes y practicantes]</p>
  
  <h3>Art. 77° Protocolo de denuncia</h3>
  <p>[Canal confidencial, sin revictimización, protección inmediata]</p>
  
  <h3>Art. 78° Protección al denunciante</h3>
  <p>[Ineficacia del despido dentro de los 6 meses siguientes a la queja]</p>
  
  <h3>Art. 79° Obligación de reporte semestral al SIVIGE</h3>
  <p>[Reporte estadístico semestral al Sistema Integrado de Información de Violencias de Género]</p>
  
  <h3>Art. 80° Sanciones por acoso sexual comprobado</h3>
  <p>[Falta grave — causal de despido con justa causa]</p>

  <h2>CAPÍTULO XII — MECANISMOS DE RECLAMO Y PETICIONES</h2>
  <h3>Art. 81° Persona(s) designada(s) para recibir reclamos</h3>
  <p>[Canales de comunicación para reclamos laborales ordinarios]</p>
  
  <h3>Art. 82° Procedimiento de atención a reclamos</h3>
  <p>[Presentación escrita, respuesta en 15 días hábiles]</p>
  
  <h3>Art. 83° Derecho a asesorarse del sindicato respectivo</h3>
  <p>[Derecho de representación sindical]</p>
  
  <h3>Art. 84° Quejas ante el Inspector de Trabajo</h3>
  <p>[Instancia ante el Ministerio de Trabajo si no se resuelve internamente]</p>

  <h2>CAPÍTULO XIII — PROTECCIÓN A GRUPOS CON ESTABILIDAD REFORZADA</h2>
  <h3>Art. 85° Mujer embarazada y madre lactante</h3>
  <p>[Protección especial Art. 239 CST, Ley 1822/2017]</p>
  
  <h3>Art. 86° Trabajadores con discapacidad</h3>
  <p>[Protección especial Ley 361/1997, Ley 1618/2013]</p>
  
  <h3>Art. 87° Cuota de vinculación de personas con discapacidad</h3>
  <p>[Aplica según el tamaño de la empresa, mínimo 2% si > 100 trabajadores]</p>
  
  <h3>Art. 88° Fuero sindical</h3>
  <p>[Garantías para directivos sindicales]</p>
  
  <h3>Art. 89° Personas próximas a pensionarse (prepensionados)</h3>
  <p>[Estabilidad laboral para quienes están a 3 años o menos de la pensión]</p>
  
  <h3>Art. 90° Víctimas del conflicto armado</h3>
  <p>[Disposiciones de protección laboral]</p>

  <h2>CAPÍTULO XIV — POLÍTICA DE SALUD MENTAL</h2>
  <h3>Art. 91° Declaración de compromiso con la salud mental</h3>
  <p>[Salud mental como derecho fundamental en el trabajo]</p>
  
  <h3>Art. 92° Programa de Bienestar Mental</h3>
  <p>[Aplicación de Batería de Riesgo Psicosocial, prevención del burnout]</p>
  
  <h3>Art. 93° Factores de riesgo psicosocial a controlar</h3>
  <p>[Carga laboral, ambigüedad, violencia, aislamiento]</p>
  
  <h3>Art. 94° Confidencialidad del diagnóstico</h3>
  <p>[Prohibición de uso del diagnóstico para despido]</p>
  
  <h3>Art. 95° Articulación con el SG-SST</h3>
  <p>[Integración al Plan de Trabajo Anual]</p>

  <h2>CAPÍTULO XV — PROTOCOLO DE ACOSO LABORAL — RUTA COMPLETA</h2>
  <h3>Art. 96° Definición y modalidades de acoso laboral</h3>
  <p>[Contexto de la Ley 1010/2006]</p>
  
  <h3>Art. 97° El Comité de Convivencia Laboral (COCOLAB)</h3>
  <p>[Enfoque preventivo, orientador y conciliador]</p>
  
  <h3>Art. 98° RUTA INTERNA — Protocolo paso a paso</h3>
  <p>[Recepción, Admisión, Audiencias, Conciliación, Seguimiento, Cierre/Traslado]</p>
  
  <h3>Art. 99° Prohibición de represalias</h3>
  <p>[Protección de 6 meses contra sanciones/despido al quejoso]</p>
  
  <h3>Art. 100° Medidas de protección inmediata</h3>
  <p>[Traslado de área, cambio de turno, etc.]</p>

  <h2>CAPÍTULO XVI — PROTOCOLO DE ACOSO SEXUAL — RUTA COMPLETA</h2>
  <h3>Art. 101° Definición legal de acoso sexual</h3>
  <p>[Asedio de carácter sexual bajo cualquier relación de poder]</p>
  
  <h3>Art. 102° Conductas constitutivas de acoso sexual</h3>
  <p>[Proposiciones, comentarios, contacto no consentido]</p>
  
  <h3>Art. 103° Inconciliabilidad del acoso sexual</h3>
  <p>[El acoso sexual no se concilia en el COCOLAB según Res. 3461/2025]</p>
  
  <h3>Art. 104° RUTA INTERNA DE ATENCIÓN — Protocolo paso a paso</h3>
  <p>[Recepción, Medidas de protección, Investigación, Decisión, Reporte a Fiscalía]</p>
  
  <h3>Art. 105° REPORTE AL SIVIGE</h3>
  <p>[Obligación semestral estadística según Ley 2365/2024]</p>
  
  <h3>Art. 106° Protección reforzada a la víctima</h3>
  <p>[Presunción de ineficacia de despido en los 6 meses siguientes]</p>
  
  <h3>Art. 107° Prohibición de revictimización</h3>
  <p>[Prohibición de censura o cuestionamiento]</p>
  
  <h3>Art. 108° Reporte al Ministerio del Trabajo</h3>
  <p>[Formulario oficial y reserva de identidad]</p>

  <h2>CAPÍTULO XVII — DISPOSICIONES FINALES</h2>
  <h3>Art. 109° Publicación del reglamento</h3>
  <p>[El RIT se publicará en {{medios_publicacion}}]</p>
  
  <h3>Art. 110° Vigencia y entrada en fuerza</h3>
  <p>[Entra en vigencia el {{fecha_publicacion}}]</p>
  
  <h3>Art. 111° Disposiciones supletorias</h3>
  <p>[Lo no previsto se rige por el CST y normas vigentes]</p>
  
  <h3>Art. 112° Modificaciones</h3>
  <p>[Se publicarán con 8 días de antelación]</p>
  
  <h3>Art. 113° Consecuencias del incumplimiento</h3>
  <p>[Sanciones de hasta 5.000 SMMLV e invalidez de procesos]</p>
  
  <h3>Art. 114° Firma del Representante Legal</h3>
  <p>En constancia de lo anterior, firma el Representante Legal de la empresa a los {{current_date}}.</p>

  <br/><br/>
  <p>______________________________________</p>
  <p><strong>{{representante_legal}}</strong></p>
  <p>C.C. [Número de documento]</p>
  <p>Representante Legal</p>
  <p><strong>{{empresa_nombre}}</strong></p>
</div>
`;
