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

  <h2>MANIFIESTO DE CULTURA Y CONVIVENCIA (PREÁMBULO)</h2>
  <p>El presente Reglamento Interno de Trabajo, prescrito por <strong>{{empresa_nombre}}</strong>, empresa legalmente constituida en Colombia e identificada con NIT <strong>{{empresa_nit}}</strong>, domiciliada en <strong>{{ciudad_domicilio}}, {{departamento}}</strong>, hace parte integral de los contratos de trabajo individuales, verbales o escritos, celebrados o que se celebren con todos sus trabajadores. la organización y el colaborador (bioindividuo) se someten estrictamente a las disposiciones de este reglamento, así como al Código Sustantivo del Trabajo (CST), sus decretos reglamentarios, las leyes 1010 de 2006, 2191 de 2022, 2365 de 2024, 2396 de 2024, y la Ley 2466 de 2025 (Reforma Laboral), en todo lo que no resulte contrario a los derechos mínimos e irrenunciables de los colaboradores garantizados por la Constitución Política de Colombia.</p>
  <p>Este Manifiesto de Cultura y Convivencia nace de la convicción de que las organizaciones más exitosas son aquellas que cuidan genuinamente a su talento humano. Su finalidad es definir, de forma clara y respetuosa, las condiciones que guían la relación entre la organización y cada colaborador (bioindividuo), promoviendo el respeto profundo, la sana convivencia, la prevención del acoso laboral y sexual, la protección de la salud mental y el florecimiento de un entorno de trabajo digno, justo e inspirador.</p>
  <p>Este documento está alineado con los principios fundamentales de la Organización Internacional del Trabajo (OIT) sobre trabajo decente, con la Constitución Política de Colombia, y con las más avanzadas tendencias del capitalismo consciente y el bienestar corporativo integral. Reconocemos que cada persona que forma parte de este ecosistema es un bioindividuo único, con necesidades, talentos y ciclos de vida propios, y que nuestra responsabilidad como organización es crear las condiciones para que pueda desarrollar su mejor versión mientras contribuye al propósito colectivo.</p>

  <h3>Marco Normativo y Legal Aplicable</h3>
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0; font-family: Arial, sans-serif; margin-bottom: 25px; margin-top: 15px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <thead>
      <tr>
        <th style="background-color: #0e7460; color: white; padding: 12px; text-align: left; font-size: 14px; font-weight: bold; width: 25%; border-right: 1px solid #0b5c4d;">Normatividad Aplicable</th>
        <th style="background-color: #0e7460; color: white; padding: 12px; text-align: left; font-size: 14px; font-weight: bold; width: 75%;">Descripción y Aplicación en el Reglamento</th>
      </tr>
    </thead>
    <tbody style="font-size: 13px; color: #333;">
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Código Sustantivo del Trabajo (CST) de 1950</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Norma matriz que rige y estructura las relaciones laborales individuales, los contratos, derechos mínimos e irrenunciables, y obligaciones entre la organización y los colaboradores.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #ffffff; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Ley 2466 de 2025<br/><span style="font-size:11px; font-weight:normal; color:#666;">(Reforma Laboral)</span></td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Regula la reducción definitiva de la jornada laboral máxima (42 horas semanales), modificaciones en recargos nocturnos (iniciando desde las 7:00 p.m.), nuevas directrices en contratos de aprendizaje, estabilidad laboral reforzada y exigencia de publicación digital del RIT.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Sentencia C-593 de 2014 y T-329 de 2021<br/><span style="font-size:11px; font-weight:normal; color:#666;">(Corte Constitucional)</span></td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Jurisprudencia que exige un estricto <strong>"Blindaje del Debido Proceso"</strong>. Definen los requisitos mínimos: comunicación formal, formulación de cargos, traslado ineludible de pruebas, y garantía integral de defensa y doble instancia.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #ffffff; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Sentencia SU-111 de 2025<br/><span style="font-size:11px; font-weight:normal; color:#666;">(Corte Constitucional)</span></td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Reitera la ineficacia de conciliaciones que violen derechos ciertos e indiscutibles y garantiza la estabilidad laboral reforzada para trabajadores por motivos de salud y fuero médico.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Sentencia C-038 de 2021<br/><span style="font-size:11px; font-weight:normal; color:#666;">(Corte Constitucional)</span></td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Refuerza el mandato de igualdad material, declarando inconstitucional cualquier limitación de labores u ocupaciones para las mujeres fundamentada en su género o supuesta protección desproporcionada, prohibiendo la discriminación en el RIT.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #ffffff; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Sentencia SL155-2022<br/><span style="font-size:11px; font-weight:normal; color:#666;">(Corte Suprema de Justicia)</span></td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Subraya la obligación de democratizar las relaciones laborales, garantizando que la organización deba escuchar y considerar las objeciones de los colaboradores durante la etapa de publicación del RIT, particularmente frente a la escala de sanciones.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Leyes 1010/2006 y 2365/2024, con Sentencia T-104 de 2025</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Marco integral para prevenir, investigar y sancionar todo acto de acoso laboral y sexual. Impone rutas de atención, reporte semestral ante el SIVIGE, prevención de revictimización, y extiende la obligación de protección a la víctima incluso tras su desvinculación laboral.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #ffffff; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Ley 2191 de 2022</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Garantiza el derecho a la desconexión laboral, salvaguardando el tiempo de descanso, licencias, permisos, vacaciones y la vida personal y familiar de los colaboradores fuera de su jornada ordinaria.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Decreto 1072 de 2015</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Decreto Único Reglamentario del Sector Trabajo. Establece la obligatoriedad, estructura y directrices para la implementación del Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST).</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #ffffff; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Resolución 0312 de 2019 / SST</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Estándares Mínimos del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST), que fundamentan las obligaciones de autocuidado, uso de EPP y reporte inmediato de incidentes, accidentes o condiciones de salud preexistentes por parte de los colaboradores.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Ley 1562 de 2012</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Modifica el Sistema de Riesgos Laborales. Define integralmente los conceptos de accidente de trabajo y enfermedad laboral para garantizar su reporte oportuno.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #ffffff; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Ley Estatutaria 1581 de 2012</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Ley de Protección de Datos Personales (Hábeas Data). Regula la privacidad, recolección y tratamiento confidencial de la información, expedientes médicos y bases de datos de los colaboradores.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Leyes 1221 (2008), 2088 y 2121 (2021)</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Marcos regulatorios para las modalidades de trabajo a distancia: Teletrabajo, Trabajo en Casa y Trabajo Remoto, garantizando la igualdad de derechos y obligaciones.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #ffffff; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Ley 2101 de 2021</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Establece los lineamientos originales para la reducción gradual de la jornada laboral máxima legal sin afectar los salarios ni los derechos adquiridos.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Resolución 089 de 2019 y Ley 1335 de 2009</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Prevención de adicciones y políticas de salud pública: prohíbe el consumo de alcohol, sustancias psicoactivas y declara las instalaciones corporativas como espacios 100% Libres de Humo (incluyendo vapeadores).</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #ffffff; border-right: 1px solid #e0e0e0;">Leyes 1822 de 2017, 2114 de 2021, 1280 de 2009, 1811 de 2016 y 163 de 1994</td>
        <td style="padding: 10px; line-height: 1.5;">Conjunto normativo que amplía y asegura las licencias y permisos remunerados irrenunciables: Maternidad y aborto (1822), Paternidad (2114), Luto (1280), incentivo de transporte en bicicleta (1811) y fuero electoral por sufragio o jurado (163).</td>
      </tr>
    </tbody>
  </table>

  <h2>CAPÍTULO I — ECOSISTEMA CORPORATIVO Y VÍNCULOS DE VALOR</h2>
  <h3>Art. 1° Identificación dla organización, domicilio y actividad</h3>
  <p>Nuestra organización, que acoge con orgullo a cada persona que aporta su talento, es <strong>{{empresa_nombre}}</strong>, identificada con NIT <strong>{{empresa_nit}}</strong>, constituida como una sociedad comercial de tipo <strong>{{tipo_empresa}}</strong>. El domicilio principal de la empresa es <strong>{{ciudad_domicilio}}, {{departamento}}</strong> en la dirección <strong>{{direccion}}</strong>. La actividad económica principal de la compañía es <strong>{{actividad_economica}}</strong>, bajo el Código CIIU <strong>{{codigo_ciiu}}</strong>. Las disposiciones de este reglamento aplican tanto para los colaboradores del domicilio principal como para las sucursales, agencias o dependencias que operen a nivel nacional o internacional donde presten servicio los empleados de la misma.</p>

  <h3>Art. 2° Ámbito de aplicación del reglamento</h3>
  <p>Este Manifiesto de Cultura y Convivencia es un pacto de mutuo respeto que cobija a cada persona que forma parte de nuestro ecosistema, sin distinción del tipo de vínculo (término fijo, término indefinido, obra o labor, aprendizaje, accidental), la modalidad de prestación del servicio (presencial, teletrabajo, trabajo remoto, trabajo en casa, trabajo a domicilio) ni la jerarquía que ocupen dentro de la organización.</p>

  <h3>Art. 3° Condiciones de admisión de nuevos trabajadores</h3>
  <p>Quienes deseen unirse a nuestro equipo vivirán un proceso de selección transparente, basado en el mérito y el respeto. Para iniciar este camino juntos, se compartirán los siguientes documentos:</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Hoja de vida actualizada.</li>
    <li>Copia del documento de identidad.</li>
    <li>Soportes de estudios, certificaciones académicas y experiencia laboral.</li>
    <li>Examen médico ocupacional de ingreso con concepto de aptitud expedido por el médico especialista en SST designado por la empresa.</li>
    <li>Certificado de afiliación a EPS y Fondo de Pensiones a los cuales se encontraba afiliado o desea afiliarse.</li>
    <li>Referencias personales y laborales.</li>
  </ol>
  <p>La organización valorará con objetividad y buena fe la información aportada por cada aspirante, tomando decisiones fundamentadas en criterios de idoneidad y no discriminación.</p>

  <h3>Art. 4° Período de prueba</h3>
  <p>El período de prueba es una etapa de descubrimiento mutuo: la organización conoce el talento y las capacidades del nuevo integrante, y este, a su vez, explora el entorno, la cultura y las condiciones de trabajo (Art. 76 CST). El período de prueba se estipulará siempre por escrito y en ningún caso excederá de dos (2) meses. Tratándose de contratos a término fijo cuya duración sea inferior a un (1) año, el período de prueba no podrá ser superior a la quinta parte (1/5) del término inicialmente pactado para el respectivo contrato, sin que pueda exceder de dos meses (Art. 78 CST). Durante el período de prueba, el contrato puede darse por terminado unilateralmente por cualquiera de las partes sin previo aviso ni pago de indemnización alguna.</p>

  <h3>Art. 5° Trabajadores accidentales o transitorios</h3>
  <p>Son colaboradores de vinculación transitoria quienes se integran al equipo para la ejecución de labores específicas de corta duración, no mayores de un (1) mes, que se refieren a actividades distintas de las actividades normales o misionales dla organización (Art. 6 CST). Estos trabajadores gozarán de todos los derechos fundamentales laborales mínimos de ley mientras presten su servicio a la empresa.</p>

  <h3>Art. 6° Contrato de aprendizaje SENA</h3>
  <p>El contrato de aprendizaje ya no es una figura especial, sino que se ha transformado en un contrato laboral especial a término fijo, conforme a lo estipulado por la Ley 2466 de 2025. Esto implica que los aprendices ahora tienen derecho al pago de todas las prestaciones sociales de ley, vacaciones remuneradas, y afiliación plena al sistema integral de seguridad social (salud, pensión y riesgos laborales) sobre un valor no inferior a un (1) SMMLV, garantizando una protección laboral completa.</p>

  <h3>Art. 7° Teletrabajo, trabajo remoto y trabajo en casa</h3>
  <p>La empresa, conforme a la Ley 1221 de 2008, la Ley 2088 de 2021 y la Ley 2121 de 2021, podrá acordar modalidades de prestación del servicio a distancia. el colaborador (bioindividuo) remoto, teletrabajador o quien trabaje en casa, deberá cumplir a cabalidad con sus responsabilidades, atender los requerimientos en su jornada ordinaria y velar por el correcto mantenimiento de las herramientas de trabajo proporcionadas por la organización, si las hubiere. Se garantizará plenamente el principio de igualdad y no discriminación frente a los colaboradores presenciales, preservando la desconexión laboral y las medidas de SST.</p>

  <h3>Art. 8° Trabajo en plataformas digitales</h3>
  <p>Para la organización, ningún colaborador es invisible. Quienes presten servicios a través de plataformas digitales tienen plenos derechos laborales: afiliación al sistema de seguridad social, prestaciones de ley y libertad de asociación, conforme a la Ley 2466 de 2025.</p>

  <h3>Art. 9° Orden jerárquico del personal</h3>
  <p>Nuestra estructura organizacional define los vínculos de liderazgo y trabajo colaborativo. Cada nivel es un puente de comunicación, no una barrera. La cadena de valor humano de <strong>{{empresa_nombre}}</strong> es la siguiente:</p>
  <p><strong>Cadena de mando específica:</strong><br>
  {{orden_jerarquico}}</p>

  <h2>CAPÍTULO II — TIEMPOS DE VIDA Y PRODUCTIVIDAD CONSCIENTE (JORNADA)</h2>
  <h3>Art. 10° Jornada ordinaria</h3>
  <p>La jornada de trabajo es un acuerdo de valor entre la organización y cada colaborador, construido con respeto por su tiempo vital. Conforme a lo dispuesto en la Ley 2101 de 2021 y reforzado en la legislación laboral vigente (Ley 2466 de 2025), la jornada máxima de trabajo a partir de julio de 2026 será de cuarenta y dos (42) horas semanales. Esta jornada podrá ser distribuida en mutuo acuerdo, en 5 o 6 días a la semana garantizando el día de descanso. Aquellos colaboradores de dirección, confianza y manejo están excluidos de la jornada máxima legal de acuerdo con el Art. 162 del CST.</p>

  <h3>Art. 11° Horarios de entrada y salida / Turnos rotativos</h3>
  <p>La organización, en diálogo y con preaviso razonable, podrá ajustar horarios y turnos según las necesidades del servicio, garantizando siempre el respeto por la jornada máxima y el descanso del colaborador. Los horarios de entrada y salida, así como los descansos, se definirán de forma específica en cada dependencia. Cuando la naturaleza de la labor lo requiera, la empresa podrá implementar sistemas de turnos de trabajo sucesivos y rotativos.</p>

  <h3>Art. 12° Jornada nocturna</h3>
  <p>Conforme a la Ley 2466 de 2025, el trabajo diurno está comprendido entre las seis horas (6:00 a.m.) y las diecinueve horas (7:00 p.m.). A partir del 26 de diciembre de 2025, el horario nocturno debe iniciar obligatoriamente a las 7:00 p.m. y finalizar a las 6:00 a.m. del día siguiente. El trabajo nocturno generará los recargos legales correspondientes sobre el valor ordinario de la hora.</p>

  <h3>Art. 13° Períodos para comidas y descansos dentro de la jornada</h3>
  <p>Las pausas son parte esencial de una jornada saludable. La organización garantiza los tiempos de descanso que cada labor requiere. Se dispondrá de un período no inferior a treinta (30) minutos continuos para que los colaboradores tomen sus alimentos y descansen, tiempo que en ningún caso se computará como parte integral de la jornada de trabajo (Art. 167 CST), a menos que por acuerdo previo se establezca lo contrario.</p>

  <h3>Art. 14° Horas extras y trabajo suplementario</h3>
  <p>Las horas adicionales son un esfuerzo extraordinario que siempre será reconocido y compensado. Ninguna hora extra será válida sin la autorización previa y escrita del líder responsable. la organización solo podrá exigir la prestación de servicios en tiempo suplementario dentro de los límites establecidos en la ley (no más de dos horas diarias ni doce semanales). El pago se realizará con los recargos correspondientes de ley: veinticinco por ciento (25%) sobre el valor de la hora ordinaria por el trabajo extra diurno, y setenta y cinco por ciento (75%) por el trabajo extra nocturno.</p>

  <h3>Art. 15° Recargos nocturnos, dominicales y festivos</h3>
  <p>El trabajo realizado en domingo o en día de fiesta de descanso obligatorio, generará un recargo sobre el salario ordinario en proporción a las horas laboradas, de conformidad con la implementación progresiva dispuesta por la Ley 2466 de 2025 (80% a partir de julio 2025; 90% a partir de julio de 2026; 100% a partir de julio de 2027). El solo hecho de laborar en jornada nocturna generará un recargo del treinta y cinco por ciento (35%) sobre la hora ordinaria. El trabajo que combine horas extras con recargo dominical/festivo o nocturno se pagará liquidando los recargos de forma acumulativa conforme a la ley.</p>

  <h3>Art. 16° Trabajadores del servicio doméstico y cuidado</h3>
  <p>Todo el personal contratado por la empresa que ejerza labores de servicio doméstico o cuidado tendrá plenos derechos respecto a la jornada máxima legal vigente, reconocimiento de horas extras y recargos por trabajo nocturno, dominical y festivo, equiparándose sus derechos laborales a los del resto de los colaboradores de la empresa, de conformidad con la Ley 2466 de 2025.</p>

  <h3>Art. 17° Registro y control de asistencia</h3>
  <p>Como parte de nuestra cultura de corresponsabilidad, cada colaborador registra de forma personal su asistencia al iniciar y finalizar su jornada laboral mediante los mecanismos dispuestos por la empresa (biométricos, aplicaciones, planillas, etc.). El incumplimiento de esta obligación sin causa justificada o la alteración de los registros de asistencia constituirán falta restaurativa y comportamental.</p>

  <h2>CAPÍTULO III — DERECHO AL DESCANSO Y RESPETO AL TIEMPO PERSONAL (Ley 2191/2022)</h2>
  <h3>Art. 18° Derecho a la desconexión laboral</h3>
  <p>Reconocemos y protegemos con convicción el derecho fundamental de cada colaborador a desconectarse del trabajo. El tiempo personal, familiar y de descanso es sagrado. Una vez finalizada la jornada ordinaria de trabajo y durante los períodos de descanso remunerado, licencias, vacaciones y festivos, el colaborador (bioindividuo) tiene el derecho a no tener contacto laboral, no responder comunicaciones o requerimientos relacionados con su empleo, y a que la empresa respete su tiempo de descanso y vida familiar o personal.</p>

  <h3>Art. 19° Protocolo de desconexión</h3>
  <p>Los líderes y la organización se comprometen a respetar el tiempo de vida de cada colaborador. No se enviarán mensajes, correos ni llamadas fuera del horario pactado. Si por automatización de correos algún mensaje es recibido fuera de horario, el colaborador (bioindividuo) no estará en la obligación de leerlo ni responderlo hasta el inicio de su siguiente jornada hábil. No podrá haber ninguna repercusión negativa o medida formativa por no responder requerimientos fuera del horario.</p>

  <h3>Art. 20° Excepciones de fuerza mayor o caso fortuito</h3>
  <p>En situaciones excepcionales de fuerza mayor, algunos colaboradores con roles críticos pueden ser contactados fuera de jornada. Esto nunca será la norma, sino la excepción:</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>los colaboradores que desempeñen cargos de dirección, confianza y manejo.</li>
    <li>Quienes, por la naturaleza de su actividad o soporte técnico urgente, deban tener disponibilidad (soportes pagados mediante acuerdos de disponibilidad).</li>
    <li>Situaciones inminentes de fuerza mayor o caso fortuito que pongan en peligro inminente la operación de la empresa, bienes o la salud de las personas.</li>
  </ol>
  <p>Cualquier contacto fuera de jornada por emergencia real se compensa económicamente o con tiempo libre. El esfuerzo extraordinario siempre tiene reconocimiento.</p>

  <h3>Art. 21° Medidas frente a la vulneración del derecho a la desconexión</h3>
  <p>Desconocer reiteradamente el derecho a la desconexión de un colaborador es un acto que la organización considera grave y que puede constituir acoso laboral ante las autoridades competentes. Cualquier trabajador que vea vulnerado este derecho de manera constante podrá elevar su queja ante el Comité de Convivencia Laboral de la empresa para que este inicie el procedimiento conciliatorio correspondiente.</p>

  <h2>CAPÍTULO IV — RECUPERACIÓN BIOPSICOSOCIAL Y TIEMPO EN FAMILIA</h2>
  <h3>Art. 22° Descanso dominical remunerado</h3>
  <p>La organización garantiza con convicción el descanso dominical remunerado de todos los colaboradores, reconociendo que el descanso es parte esencial del bienestar integral. El descanso tendrá una duración mínima de veinticuatro (24) horas. Para tener derecho al descanso dominical remunerado el colaborador (bioindividuo) debe haber laborado todos los días de su jornada semanal, o haber faltado por justa causa, responsabilidad o disposición dla organización. Quien trabaje habitualmente u ocasionalmente en domingos, tendrá derecho a un descanso compensatorio o pago extraordinario según disponga el Código Sustantivo del Trabajo.</p>

  <h3>Art. 23° Descanso en días festivos</h3>
  <p>Serán días de descanso obligatorio remunerado aquellos estipulados por la ley colombiana como festivos civiles o religiosos. Si por necesidades del servicio el colaborador (bioindividuo) debe laborar en un día festivo, tendrá derecho a la respectiva remuneración con los recargos previstos por la Ley 2466 de 2025 para el momento en que se cause.</p>

  <h3>Art. 24° Vacaciones anuales</h3>
  <p>Cada colaborador que haya aportado su talento durante un año consecutivo merece y tiene derecho a disfrutar quince (15) días hábiles de vacaciones plenamente remuneradas. La época de disfrute de las vacaciones deberá ser señalada por la organización, a más tardar dentro del año subsiguiente, concediéndolas de forma oficiosa o por petición del colaborador (bioindividuo), con una antelación no menor a quince (15) días. el colaborador (bioindividuo) debe disfrutar mínimo seis (6) días continuos al año.</p>

  <h3>Art. 25° Compensación de vacaciones en dinero</h3>
  <p>Creemos que el descanso real no puede comprarse. Por eso, está prohibido compensar en su totalidad las vacaciones en dinero. Sin embargo, a petición escrita del colaborador (bioindividuo), la organización podrá autorizar la compensación en dinero de hasta la mitad (7.5 días) de las vacaciones a que tiene derecho cada año. A la terminación del contrato de trabajo se liquidarán y pagarán en dinero las vacaciones pendientes proporcionalmente al tiempo laborado.</p>

  <h3>Art. 26° Licencia de maternidad</h3>
  <p>La maternidad es un momento sagrado. La organización garantiza a cada colaboradora en estado de embarazo dieciocho (18) semanas de licencia plenamente remunerada, Al menos una (1) o dos (2) semanas deberán tomarse de forma preparto. Esta licencia se extenderá también a las madres adoptantes y a los casos de aborto no provocado conforme a lo estipulado por la Ley 1822 de 2017.</p>

  <h3>Art. 27° Licencia de paternidad</h3>
  <p>La paternidad también merece tiempo y presencia. El padre colaborador tiene derecho a dos (2) semanas de licencia plenamente remunerada (Ley 2114/2021) La licencia opera por los hijos nacidos de su cónyuge o de su compañera permanente, y en casos de adopción. La licencia de paternidad se hará efectiva mediante la presentación del Registro Civil de Nacimiento en un plazo no mayor a 30 días posteriores a su expedición.</p>

  <h3>Art. 28° Licencia remunerada por luto</h3>
  <p>Ante la pérdida de un ser querido, la organización acompaña a cada colaborador con respeto y humanidad. En caso de fallecimiento de cónyuge, compañero/a permanente o familiar hasta el segundo grado, primero de afinidad y primero civil, la empresa concederá una licencia remunerada por luto de cinco (5) días hábiles, de acuerdo con la Ley 1280 de 2009. el colaborador (bioindividuo) deberá presentar ante Recursos Humanos el certificado de defunción y documentos que demuestren el parentesco en los siguientes 30 días al hecho.</p>

  <h3>Art. 29° Licencia por endometriosis y condiciones de salud menstrual</h3>
  <p>La salud menstrual no es un tabú, es una realidad biológica que la organización reconoce y respeta. Toda colaboradora que experimente ciclos menstruales incapacitantes, endometriosis o síntomas severos, siempre y cuando esto sea certificado por un profesional médico o la entidad de salud prestadora (EPS). Esta licencia protegerá el derecho fundamental a la salud menstrual, impidiendo cualquier represalia o descuento.</p>

  <h3>Art. 30° Licencia para acompañamiento escolar obligatorio</h3>
  <p>Ser padre o madre es también una forma de aportar al mundo. La organización valora ese rol y otorga el tiempo remunerado necesario para que los colaboradores acompañen a sus hijos en reuniones escolares, reuniones de padres de familia y acompañamiento frente a procesos pedagógicos ineludibles de sus hijos menores de edad. Estos permisos deben ser acordados y demostrados oportunamente con la dirección de la empresa según la reforma laboral (Ley 2466/2025).</p>

  <h3>Art. 31° Permisos remunerados</h3>
  <p>Porque la vida sucede también fuera de la oficina, la organización concede con calidez y sin burocracia los siguientes permisos remunerados contemplados en la Ley 2466 de 2025:</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Calamidad doméstica debidamente comprobada.</li>
    <li>Para asistir a <strong>citas médicas programadas</strong> (EPS, ARL, medicina prepagada, especialistas) y atención de urgencias médicas (tiempo estricto para cita y traslados).</li>
    <li>Para atender de forma ineludible <strong>diligencias judiciales o administrativas</strong>, o rendir declaratoria cuando sea requerido por autoridades competentes.</li>
    <li>Para desempeñar cargos oficiales transitorios de forzosa aceptación (ej: jurados de votación, el cual otorga 1 día compensatorio remunerado - Ley 163 de 1994).</li>
    <li>Para ejercer el derecho al sufragio en elecciones democráticas (otorga medio día compensatorio remunerado en los 30 días siguientes - Ley 163 de 1994).</li>
    <li>Para el cabal cumplimiento de comisiones sindicales (si aplica).</li>
    <li>Por contraer matrimonio (licencia de tres (3) días hábiles remunerados, en concordancia con la protección a la familia avalada jurisprudencialmente).</li>
    <li>Por llegar al trabajo en bicicleta (un (1) día remunerado cada 6 meses por uso frecuente de bicicleta).</li>
  </ol>

  <h3>Art. 32° Permisos no remunerados y su procedimiento de solicitud</h3>
  <p>La organización comprende que la vida tiene imprevistos. Ante situaciones personales no contempladas en la ley, podrá otorgar licencias no remuneradas para atender asuntos personales del colaborador (bioindividuo) que no estén contemplados en la ley como de forzosa concesión. La solicitud deberá presentarse con al menos cuarenta y ocho (48) horas de anticipación ante el superior inmediato, salvo fuerza mayor, quien aprobará según la necesidad del servicio. Durante estas licencias, el colaborador (bioindividuo) no devengará salario, no aportará el colaborador (bioindividuo) a salud, pero la empresa y el empleado continuarán pagando los aportes pensionales proporcionales si hubiere lugar a ello.</p>

  <h2>CAPÍTULO V — COMPENSACIÓN, BENEFICIOS Y RECONOCIMIENTO</h2>
  <h3>Art. 33° Salario mínimo legal vigente y salario convencional</h3>
  <p>La organización garantiza que la compensación de cada colaborador será siempre igual o superior al mínimo fijado por el Gobierno Nacional, honrando el valor de su trabajo. Si existiere pacto colectivo o convención colectiva, regirán los mínimos allí establecidos. Constituye salario no solo la remuneración ordinaria fija o variable, sino todo lo que recibe el colaborador (bioindividuo) en dinero o en especie como contraprestación directa del servicio. Los viáticos accidentales, gastos de representación, beneficios extralegales estipulados por mero acto de liberalidad o con cláusula de no salarización, no constituyen salario.</p>

  <h3>Art. 34° Lugar, día, hora y período de pago</h3>
  <p>La puntualidad en el pago es un compromiso de honor de la organización con cada colaborador. El salario se abonará mediante <strong>{{forma_pago}}</strong> con una periodicidad de <strong>{{periodicidad_pago}}</strong>. El pago se hará directamente al trabajador o a quien él autorice por escrito. Cuando el día de pago pactado sea festivo o no laborable, el pago se anticipará al último día hábil anterior. La empresa deberá entregar el desprendible de pago detallando ingresos y deducciones.</p>

  <h3>Art. 35° Deducciones legalmente permitidas</h3>
  <p>La organización solo realizará deducciones al salario del colaborador bajo mandato expreso y escrito de este, o por disposición legal o judicial, escrita y expresa del colaborador (bioindividuo), o por mandamiento judicial emitido por juez competente, o por mandato legal. Son retenciones obligatorias: los aportes del colaborador (bioindividuo) al Sistema de Seguridad Social Integral (Salud y Pensión), retención en la fuente (si aplica), multas restaurativa y comportamentals legalmente impuestas por atrasos u omisiones al trabajo sin justificación, cuotas sindicales y cuotas alimentarias debidamente embargadas por un juez. En ningún caso las deducciones y embargos podrán afectar el salario mínimo legal, salvo por pensiones alimenticias o deudas con cooperativas, en cuyo caso solo se podrá afectar hasta el 50% de este.</p>

  <h3>Art. 36° Auxilio de transporte</h3>
  <p>La movilidad tiene un costo real. Los colaboradores que devenguen hasta dos (2) SMMLV recibirán el auxilio de transporte fijado por el Gobierno, como reconocimiento a ese esfuerzo cotidiano fijado por el Gobierno Nacional, a menos que la empresa suministre el transporte de manera completa o que el colaborador (bioindividuo) resida en el lugar de trabajo, realice sus labores exclusivamente bajo modalidades de trabajo remoto (donde aplica auxilio de conectividad si corresponde), o cuando no trabaje por incapacidad médica o permisos personales continuados.</p>

  <h3>Art. 37° Cesantías, intereses y prima de servicios</h3>
  <p>Las prestaciones sociales son derechos, no favores. La organización los reconoce y liquida con exactitud y puntualidad:</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li><strong>Cesantías</strong>: un mes de salario por cada año de servicios y proporcional, consignadas al Fondo de Cesantías escogido por el colaborador (bioindividuo) a más tardar el 14 de febrero del año siguiente.</li>
    <li><strong>Intereses sobre cesantías</strong>: 12% anual sobre el saldo de las cesantías a diciembre 31, a pagar directo al trabajador a más tardar el 31 de enero del año siguiente.</li>
    <li><strong>Prima de servicios</strong>: correspondiente a un mes de salario anual, pagadero por mitades (hasta el 30 de junio y hasta el 20 de diciembre).</li>
  </ol>

  <h3>Art. 38° Prestaciones adicionales a las legales</h3>
  <p>La organización puede reconocer beneficios adicionales a la ley —bonificaciones, auxilios de estudio, bienestar— como expresión de gratitud y compromiso con el desarrollo integral de su equipo, planes de medicina prepagada, primas extralegales, participaciones de utilidades, no constituyen factor salarial para la liquidación de prestaciones sociales ni seguridad social, de conformidad con el Art. 128 del CST.</p>

  <h2>CAPÍTULO VI — CUIDADO INTEGRAL Y ENTORNOS BIOSEGUROS</h2>
  <h3>Art. 39° Disposiciones de Cuidado Integral y SST</h3>
  <p>Como organización que pone al bioindividuo en el centro de su gestión, declaramos nuestro compromiso profundo, genuino e irrenunciable con el diseño, implementación y mejora continua de nuestro Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST), de conformidad con el Decreto 1072 de 2015, la Resolución 0312 de 2019 y la Ley 1562 de 2012. Para nosotros, la seguridad no es un requisito de papel: es una expresión de respeto por la vida y la integridad de cada integrante de nuestro ecosistema. Destinamos recursos humanos, técnicos y financieros suficientes para garantizar entornos de trabajo que promuevan la salud física, mental y social. Estas disposiciones aplican de forma universal a cada persona que, bajo cualquier modalidad de vinculación, esté en nuestras instalaciones o preste servicios en nombre de la organización. Quienes incumplan estas normas de cuidado colectivo enfrentarán el proceso restaurativo definido en este Reglamento.</p>

  <h3>Art. 40° Obligaciones dla organización en SST</h3>
  <p>La organización asume los siguientes compromisos indelegables con el cuidado integral de cada colaborador:</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Procurar el cuidado integral de la salud de los colaboradores y los ambientes de trabajo.</li>
    <li>Afiliar obligatoriamente a todos los colaboradores a la ARL, EPS y Fondo de Pensiones, asumiendo su costo conforme a la ley.</li>
    <li>Identificar peligros, evaluar y valorar los riesgos (Matriz IPEVAR) y establecer los controles para mitigarlos.</li>
    <li>Suministrar y reponer oportunamente todos los Elementos de Protección Personal (EPP) y ropa de trabajo.</li>
    <li>Garantizar las inducciones y reinducciones en materia de prevención de riesgos.</li>
    <li>Diseñar y ensayar los planes de emergencia y brigadas.</li>
  </ol>

  <h3>Art. 41° Obligaciones del colaborador (bioindividuo) en SST</h3>
  <p>Como parte del cuidado colectivo, cada colaborador asume los siguientes compromisos de autocuidado y prevención:</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Procurar el cuidado integral de su salud en todo momento.</li>
    <li>Suministrar información clara, veraz y completa sobre su estado de salud (tanto en el examen médico de ingreso, como en los periódicos y de egreso). Ocultar patologías preexistentes de mala fe constituirá falta restaurativa y comportamental grave.</li>
    <li>Reportar inmediatamente (y a más tardar dentro del turno de trabajo en que ocurre) cualquier incidente o accidente de trabajo, y notificar las enfermedades laborales apenas sean dictaminadas, bajo pena de sanciones.</li>
    <li>Cumplir celosamente con las normas, reglamentos e instrucciones del SG-SST.</li>
    <li>Informar oportunamente a la organización acerca de los peligros y riesgos latentes en su puesto de trabajo.</li>
    <li>Participar proactivamente en las actividades de capacitación en SST.</li>
    <li>Utilizar adecuada y obligatoriamente las dotaciones, maquinaria y los EPP asignados.</li>
  </ol>
  <p>El desconocimiento de estas normas de cuidado colectivo puede derivar en un proceso de gestión del comportamiento y, según su gravedad, en la terminación del vínculo laboral.</p>

  <h3>Art. 42° Elementos de Protección Personal (EPP)</h3>
  <p>La organización, con absoluta responsabilidad y sin costo para el colaborador, suministrará todos los Elementos de Protección Personal de acuerdo con la labor a realizar y la Matriz IPEVAR del cargo. el colaborador (bioindividuo) deberá utilizarlos obligatoriamente en todas las zonas o actividades de riesgo, mantenerlos aseados, no sacarlos del recinto laboral injustificadamente, solicitar su reemplazo por daño o desgaste natural, y devolverlos a la terminación del contrato.</p>

  <h3>Art. 43° Indicaciones para evitar riesgos profesionales</h3>
  <p>El autocuidado es un valor que vivimos a diario. Cada colaborador evita situaciones de riesgo innecesarias, como operar equipos sin capacitación o trabajar bajo efectos de sustancias, retirar guardas de seguridad, hacer mantenimiento a máquinas en movimiento, correr por escaleras o pasillos, obstruir salidas de emergencia, realizar maniobras eléctricas sin autorización o laborar bajo influjo del alcohol o medicamentos sedantes sin informar. Ante el riesgo inminente, el colaborador (bioindividuo) tiene el derecho y deber de detener la labor y notificar a la organización.</p>

  <h3>Art. 44° Instrucciones para primeros auxilios</h3>
  <p>Ante cualquier emergencia, activamos nuestra red de cuidado inmediatamente. El colaborador afectado o quien presencie el hecho debe comunicar de forma urgente a la Brigada de Emergencia, Jefe Inmediato o Responsable de SST. Únicamente el personal con entrenamiento está autorizado a brindar primeros auxilios. La empresa dispondrá de botiquines dotados con los elementos exigidos por la norma y rutas de evacuación claras. Todo trabajador está en obligación de conocer y actuar según el Plan Escrito de Prevención, Preparación y Respuesta ante Emergencias de la empresa.</p>

  <h3>Art. 45° Reporte de accidentes de trabajo y enfermedades laborales</h3>
  <p>Todo accidente, por menor que parezca, importa y debe reportarse. El colaborador afectado lo comunica de inmediato a su líder directo para activar el reporte ante la ARL (FURAT) dentro de los dos (2) días hábiles siguientes al hecho, conforme a la Ley 1562 de 2012. La omisión del colaborador (bioindividuo) en el reporte oportuno acarreará procesos restaurativo y comportamentals. En el caso de sospecha de enfermedad laboral, el colaborador (bioindividuo) debe informar el dictamen médico apenas le sea entregado por su EPS o ARL.</p>

  <h3>Art. 46° COPASST — Comité Paritario de SST</h3>
  <p>La voz de los colaboradores en materia de seguridad es fundamental. La organización garantiza la conformación del COPASST, o designará al Vigía en SST, quienes vigilarán la normativa y promoción de la salud. La empresa otorgará a los representantes del comité un (1) hora semanal dentro de la jornada ordinaria para sus funciones, y las reuniones tendrán carácter de obligatorio cumplimiento y se llevarán bajo actas formales.</p>

  <h3>Art. 47° Exámenes médicos</h3>
  <p>Los exámenes médicos son una expresión de cuidado mutuo. La organización los financia en su totalidad, y cada colaborador participa activamente en ellos, por cambio de ocupación, de egreso, post-incapacidad, y aquellos exigidos por la vigilancia epidemiológica que la empresa determine pertinentes con cargo exclusivo a la organización. La negativa del colaborador (bioindividuo) de practicarse el examen se considera insubordinación grave.</p>

  <h3>Art. 48° Disposiciones de prevención del consumo de alcohol, tabaco y sustancias psicoactivas</h3>
  <p>Nuestro entorno de trabajo es un espacio de vida saludable. Conforme a la Resolución 089 de 2019 (Política integral para la prevención y atención del consumo de sustancias psicoactivas), está terminantemente prohibido para todo el personal presentarse al lugar de trabajo bajo el efecto del alcohol, sustancias psicoactivas o medicamentos no recetados que afecten el desempeño seguro, así como consumir, poseer o comercializar los mismos durante la jornada laboral. La empresa promoverá campañas de prevención y estilos de vida saludables. La empresa podrá realizar pruebas preventivas de alcoholimetría o sustancias (respetando la dignidad del colaborador (bioindividuo)). La negativa injustificada a practicarse la prueba o el resultado positivo constituyen falta grave que acarrea suspensión o terminación del contrato con justa causa.</p>

  <h3>Art. 49° Espacios libres de humo de tabaco</h3>
  <p>Cuidamos el aire que respiramos. Todas nuestras instalaciones son espacios 100% Libres de Humo (Ley 1335/2009), lugares cerrados, áreas de almacenamiento, bodegas y vehículos corporativos son declarados Áreas 100% Libres de Humo. Ningún trabajador o visitante podrá encender cigarrillos o emplear vapeadores en dichas áreas. Quien desee fumar deberá hacerlo en el exterior de la empresa o en áreas designadas específicamente a la intemperie (si existieren), durante los periodos de descanso.</p>

  <h2>CAPÍTULO VII — ACUERDOS DE CONVIVENCIA ARMÓNICA</h2>
  <h3>Art. 50° Protección especial a la mujer embarazada y madre lactante</h3>
  <p>Con pleno respeto por la vida y la maternidad, la organización protege con especial cuidado a las colaboradoras embarazadas o en período de lactancia, garantizando su estabilidad laboral reforzada. Ninguna trabajadora puede ser despedida por motivo de embarazo o lactancia. El despido requiere obligatoriamente autorización del Inspector del Trabajo. Adicionalmente, se prohibirá exigir a mujeres gestantes o lactantes realizar tareas de levantamiento de cargas pesadas o que pongan en peligro el normal desarrollo del feto o al recién nacido.</p>

  <h3>Art. 51° Normas para trabajadores menores de edad</h3>
  <p>La organización protege con absoluta prioridad a los adolescentes. Su vinculación (entre 15 y 17 años) requiere autorización obligatoria por escrito y fundamentada del Inspector de Trabajo o el ente territorial (ICBF/Comisaría de Familia). Estará estrictamente prohibido que desempeñen labores nocturnas, trabajo en minas, labores peligrosas, manipulación de sustancias tóxicas o maquinaria pesada, o que superen las jornadas limitadas dispuestas en la Ley de Infancia y Adolescencia.</p>

  <h3>Art. 52° Manejo de activos, equipos y herramientas corporativas</h3>
  <p>Los recursos que la organización pone a disposición de cada colaborador son herramientas de su propósito compartido. Su uso responsable y exclusivamente laboral y de propiedad de la compañía. el colaborador (bioindividuo) es responsable por su cuidado, conservación y debida utilización. Deberá reportar inmediatamente su daño, deterioro o pérdida justificada. En caso de daño por negligencia severa comprobada, dolo o pérdida, la empresa podrá tomar acciones resarcitorias mediante las deducciones autorizadas y ejecutar el proceso restaurativo y comportamental.</p>

  <h3>Art. 53° Uso de tecnología y comunicaciones corporativas</h3>
  <p>Los recursos digitales de la organización son herramientas del propósito colectivo. Su uso responsable y exclusivamente laboral es parte de nuestro pacto de convivencia. La empresa podrá monitorear el tráfico, las redes y la metadata generada a través de estos sistemas. Está prohibida la instalación de software no autorizado, el uso del correo institucional para fines de acoso laboral/sexual, pornografía, proselitismo político, el envío de cadenas de correos ajenos a la actividad laboral, y el hurto y la exposición indebida de la propiedad intelectual empresarial.</p>

  <h3>Art. 54° Protección de datos personales</h3>
  <p>La privacidad de cada colaborador es un valor que la organización protege con rigor. Toda información personal se trata con respeto, reserva absoluta y conforme a la Ley 1581/2012. La información suministrada se tratará bajo absoluta reserva, en especial el diagnóstico de condiciones de salud y datos de menores. Asimismo, el colaborador (bioindividuo) que en ejercicio de su rol tenga acceso a datos personales de clientes y terceros deberá mantener confidencialidad irrestricta de acuerdo a los protocolos empresariales.</p>

  <h3>Art. 55° Presentación personal y porte del carné o uniforme</h3>
  <p>El uniforme o dotación es parte de nuestra identidad colectiva y de la seguridad de cada uno. Su uso correcto durante toda la jornada es un acuerdo de convivencia básico. En todo caso, los colaboradores deben presentarse a sus labores vestidos de forma adecuada, limpia, guardando las normas mínimas de decoro o el código de vestimenta (dress code) expedido por la compañía, portando siempre en lugar visible su carné de identificación corporativa por motivos de seguridad.</p>

  <h2>CAPÍTULO VIII — COMPROMISOS MUTUOS Y LÍMITES PARA EL BIENESTAR COLECTIVO</h2>
  <h3>Art. 56° Compromisos de valor de LA ORGANIZACIÓN</h3>
  <p>La organización asume los siguientes compromisos de valor con cada colaborador (Art. 57 CST):</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Poner a disposición los instrumentos y materias primas necesarios.</li>
    <li>Proveer locales apropiados y elementos contra accidentes.</li>
    <li>Prestar primeros auxilios.</li>
    <li>Pagar el salario, prestaciones y aportes a seguridad social a tiempo.</li>
    <li>Guardar absoluto respeto a la dignidad del colaborador (bioindividuo), sus creencias y sentimientos.</li>
    <li>Conceder las licencias necesarias remuneradas y no remuneradas de ley.</li>
    <li>Cumplir el reglamento interno y garantizar la desconexión laboral, y prevenir acoso laboral, acoso sexual, garantizando la salud mental de todos.</li>
  </ol>

  <h3>Art. 57° Límites y conductas incompatibles de LA ORGANIZACIÓN</h3>
  <p>Las siguientes conductas son incompatibles con nuestra cultura y están expresamente prohibidas a la organización (Art. 59 CST):</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Deducir, retener o compensar sumas de salarios sin autorización clara del colaborador (bioindividuo).</li>
    <li>Obligar a compras de mercancías o alimentos de comercios dla organización.</li>
    <li>Exigir dinero o regalos para ser admitido o promocionado en el cargo.</li>
    <li>Limitar el derecho a asociarse o pertenecer a sindicatos (Pacto Colectivo forzado).</li>
    <li>Imponer a los colaboradores obligaciones religiosas o políticas.</li>
    <li>Autorizar o tolerar el porte o uso de drogas y alcohol durante el trabajo, coaccionar, o generar acoso en cualquiera de sus manifestaciones.</li>
    <li>Desconocer el derecho a la desconexión digital de sus integrante del equipos.</li>
  </ol>

  <h3>Art. 58° Compromisos de valor de LOS COLABORADORES</h3>
  <p>Como parte activa de este ecosistema, cada colaborador (bioindividuo) abraza los siguientes compromisos de valor (Art. 58 CST):</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Cumplir estrictamente sus obligaciones y el presente reglamento.</li>
    <li>Suministrar información clara, veraz y completa sobre su estado de salud, tanto en los exámenes médicos ocupacionales de ingreso como en los periódicos, sin ocultar condiciones preexistentes que puedan agravarse o ser incompatibles con su labor (Decreto 1072/2015).</li>
    <li>Guardar rigurosa moral y absoluto respeto en todas sus relaciones con sus superiores y compañeros, absteniéndose de cualquier acto de violencia o riña.</li>
    <li>Conservar y restituir en buen estado las herramientas, maquinaria e instrumentos asignados.</li>
    <li>Prestar la colaboración posible en casos de siniestro o riesgo inminente.</li>
    <li>Guardar el secreto y confidencialidad comercial e industrial y de los asuntos estrictamente técnicos o que puedan causar perjuicios.</li>
    <li>Acatar las órdenes y medidas dadas para la seguridad y la prevención en SST.</li>
    <li>Respetar y velar por los derechos a la desconexión digital de sus pares y integrante del equipos.</li>
  </ol>

  <h3>Art. 59° Límites y conductas incompatibles de LOS COLABORADORES</h3>
  <p>Las siguientes conductas son incompatibles con nuestra cultura de bienestar y están prohibidas a los colaboradores (Art. 60 CST):</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Sustraer de las instalaciones útiles, materia prima o productos sin permiso.</li>
    <li>Presentarse al trabajo bajo el influjo de alcohol, sustancias psicoactivas o estupefacientes, así como consumirlos dentro de las instalaciones o durante el desarrollo de sus funciones.</li>
    <li>Promover o participar en riñas, peleas, agresiones físicas o verbales contra compañeros de trabajo, superiores, subalternos o terceros dentro o fuera de las instalaciones si afecta la imagen corporativa.</li>
    <li>Portar armas de cualquier especie durante el trabajo.</li>
    <li>Disminuir intencionalmente el ritmo de trabajo o promover huelgas ilegales.</li>
    <li>Faltar al trabajo, llegar reiteradamente tarde o abandonar el cargo en horas de servicio sin justa causa comprobada o sin permiso expreso dla organización.</li>
    <li>Usar los útiles de la empresa en asuntos distintos al trabajo asignado.</li>
    <li>Incurrir en conductas que representen acoso laboral, discriminación de género o cualquier modalidad de acoso sexual sobre compañeros o terceros.</li>
  </ol>

  <h2>CAPÍTULO IX — GESTIÓN DEL COMPORTAMIENTO Y PROCESO RESTAURATIVO</h2>
  <h3>Art. 60° Principios rectores: Justicia, Proporcionalidad y Dignidad</h3>
  <p>El régimen restaurativo y comportamental está basado en el respeto del Debido Proceso Constitucional y las garantías estipuladas en la Reforma Laboral (Ley 2466 de 2025). Toda investigación y medida formativa interna estará orientada por los principios ineludibles de: Dignidad Humana, Presunción de Inocencia, <em>In dubio pro disciplinado</em> (toda duda razonable favorecerá al trabajador), Imparcialidad, Legalidad (la falta debe estar expresamente descrita), Tipicidad, Proporcionalidad a la gravedad de la falta, y Non bis in ídem (nadie puede ser sancionado dos veces por el mismo hecho).</p>

  <h3>Art. 61° Oportunidades de mejora (Faltas Leves)</h3>
  <p>Constituyen faltas de menor magnitud e impacto, que entorpecen la operación pero no destruyen la confianza dla organización, tales como:</p>
  
  
  <table style="width:100%;border-collapse:collapse;margin-top:10px;margin-bottom:20px;">
    <thead>
      <tr style="background-color:#e8f5e9;">
        <th style="padding:10px;border:1px solid #e0e0e0;text-align:center;width:8%;">#</th>
        <th style="padding:10px;border:1px solid #e0e0e0;text-align:left;">Oportunidad de Mejora y Descripción de la Conducta</th>
        <th style="padding:10px;border:1px solid #e0e0e0;text-align:center;width:20%;">Marco Legal</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">1</td><td style="padding:10px;border:1px solid #e0e0e0;">Llegar tarde al inicio de la jornada o reanudar labores tras descanso con retardo injustificado de hasta 15 minutos.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 58 CST</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">2</td><td style="padding:10px;border:1px solid #e0e0e0;">Retardo injustificado al reanudar labores después de las pausas o tiempo de almuerzo, entre 15 y 30 minutos (primera ocurrencia).</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 58 CST</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">3</td><td style="padding:10px;border:1px solid #e0e0e0;">Omisión injustificada del registro de asistencia (entrada o salida) sin que implique abandono del puesto de trabajo.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">RIT Art. 17°</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">4</td><td style="padding:10px;border:1px solid #e0e0e0;">Descuido o desorden en el aseo y mantenimiento del puesto de trabajo, herramientas asignadas o áreas comunes.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 58 CST / SST</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">5</td><td style="padding:10px;border:1px solid #e0e0e0;">Uso inadecuado, incompleto o alterado del uniforme o dotación suministrada por la empresa (cuando no implique riesgo de SST).</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">RIT Art. 55°</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">6</td><td style="padding:10px;border:1px solid #e0e0e0;">Uso del teléfono celular personal en horas de trabajo para actividades personales (redes sociales, llamadas, entretenimiento) sin autorización, afectando la productividad.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 58 CST</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">7</td><td style="padding:10px;border:1px solid #e0e0e0;">Navegar en sitios web, realizar compras en línea o ejecutar actividades personales desde equipos o conexión de la empresa, de forma leve y no reincidente.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">RIT Art. 53°</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">8</td><td style="padding:10px;border:1px solid #e0e0e0;">Conversaciones excesivas o distracciones que disminuyan el rendimiento propio o de compañeros, sin llegar a constituir acoso o perturbación grave del orden.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 58 CST</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">9</td><td style="padding:10px;border:1px solid #e0e0e0;">Errores operativos o administrativos de baja complejidad, corregibles de forma inmediata, que no generen pérdida económica para la empresa ni afecten a terceros.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 58 CST</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">10</td><td style="padding:10px;border:1px solid #e0e0e0;">Incumplir el tiempo de antelación exigido para la solicitud de permisos o ausencias no urgentes, sin notificación oportuna a su superior.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">RIT Art. 32°</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">11</td><td style="padding:10px;border:1px solid #e0e0e0;">Consumir alimentos, bebidas o fumar en zonas o tiempos no autorizados (siempre que el área no sea restringida por normas SST de seguridad industrial).</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Ley 1335/2009 / RIT</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">12</td><td style="padding:10px;border:1px solid #e0e0e0;">Omisión del reporte oportuno de situaciones leves de riesgo, incidentes de bajo impacto o condiciones inseguras menores que no hayan generado lesión.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">SG-SST / RIT Art. 45°</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">13</td><td style="padding:10px;border:1px solid #e0e0e0;">No mantener el nivel de silencio o concentración requerido en áreas de atención al cliente, trabajo técnico o zonas de confidencialidad señaladas.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">RIT Art. 52°/53°</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">14</td><td style="padding:10px;border:1px solid #e0e0e0;">No portar de forma visible el carné de identificación corporativa durante la jornada laboral, tras haber sido informado de la obligación.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">RIT Art. 55°</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">15</td><td style="padding:10px;border:1px solid #e0e0e0;">Incumplimiento a las indicaciones de orden, almacenamiento y mantenimiento de materiales, herramientas o insumos, que no genere pérdida económica.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 58 CST / SG-SST</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">16</td><td style="padding:10px;border:1px solid #e0e0e0;">Ausentarse del puesto de trabajo sin autorización por un lapso breve (inferior a 30 minutos) dentro de la jornada, por primera vez y sin impacto operativo.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 58 CST</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">17</td><td style="padding:10px;border:1px solid #e0e0e0;">Incumplir puntualmente las pausas activas, ejercicios de movilidad o rutinas de bienestar físico obligatorias establecidas por el SG-SST, en primera ocurrencia.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">SG-SST / RIT</td></tr>
    </tbody>
  </table>

  

  <h3>Art. 62° Conductas de alto impacto (Faltas Graves)</h3>
  <p>Se considerarán faltas graves todas las enumeradas en el Art. 62 del CST como justas causas para terminación de contrato, y de manera enunciativa:</p>
  
  
  <table style="width:100%;border-collapse:collapse;margin-top:10px;margin-bottom:20px;">
    <thead>
      <tr style="background-color:#fce4ec;">
        <th style="padding:10px;border:1px solid #e0e0e0;text-align:center;width:8%;">#</th>
        <th style="padding:10px;border:1px solid #e0e0e0;text-align:left;">Conducta de Alto Impacto y Consecuencia Máxima (Causal de Desvinculación)</th>
        <th style="padding:10px;border:1px solid #e0e0e0;text-align:center;width:20%;">Marco Legal</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">1</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Abandono del puesto:</strong> Abandonar el puesto de trabajo o las instalaciones durante la jornada sin permiso previo y expreso del jefe inmediato.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 62 CST num. 4</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">2</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Ausentismo injustificado:</strong> Faltar al trabajo sin justa causa ni permiso del empleador, desde el primer día de ausencia no autorizada.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 62 CST num. 4</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">3</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Estado de embriaguez o drogadicción:</strong> Presentarse al lugar de trabajo bajo el influjo del alcohol, sustancias psicoactivas, estupefacientes o medicamentos no formulados que alteren el juicio o la capacidad operativa.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 62 CST num. 6 / Res. 089/2019</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">4</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Consumo en instalaciones:</strong> Consumir, portar o comercializar alcohol, sustancias psicoactivas o estupefacientes dentro de las instalaciones o durante el desarrollo de las funciones, incluyendo el trabajo remoto.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 62 CST / Res. 089/2019</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">5</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Negativa a prueba de tamizaje:</strong> Negarse injustificada y rotundamente a practicarse la prueba de alcoholimetría o de sustancias psicoactivas en el momento en que la empresa la solicite, conforme al protocolo.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 62 CST / Res. 089/2019</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">6</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Violencia física:</strong> Todo acto de agresión física (golpes, empujones, lanzamiento de objetos) contra el empleador, directivos, compañeros de trabajo, subordinados, clientes o proveedores, ocurra dentro o fuera de las instalaciones si existe nexo causal con el trabajo.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 62 CST num. 9</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">7</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Violencia verbal y amenazas:</strong> Insultos graves, amenazas, injurias, calumnias o difamación que atenten contra la honra, dignidad o buen nombre del empleador, directivos, compañeros o clientes.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 62 CST num. 9</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">8</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Daño intencional a bienes:</strong> Causar daño intencional o por negligencia grave a edificios, maquinaria, equipos, materias primas, vehículos, instalaciones, herramientas o cualquier bien relacionado con el trabajo.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 62 CST num. 3</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">9</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Hurto y apropiación:</strong> Hurto, robo, apropiación indebida o uso no autorizado de bienes, dinero, materiales o información de la empresa, de compañeros de trabajo o de clientes.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 62 CST num. 3</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">10</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Acoso laboral:</strong> Toda conducta comprobada, persistente y sistemática de maltrato, persecución, discriminación, entorpecimiento o inequidad laboral (Ley 1010/2006).</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Ley 1010/2006 / Art. 62 CST</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">11</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Acoso sexual:</strong> Cualquier conducta, comentario, gesto, acto físico o digital de naturaleza sexual no consentida, que cause humillación, intimidación o cree un ambiente hostil (Ley 2365/2024). El acoso sexual es causa de despido inmediato.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Ley 2365/2024 / Res. 3461/2025</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">12</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Fraude y falsedad:</strong> Presentar documentos falsos (certificados médicos, diplomas, referencias), suplantar la identidad, alterar registros de asistencia o nómina, o cometer cualquier acto de fraude contra la empresa.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 62 CST num. 1</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">13</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Secreto empresarial:</strong> Revelar, transferir o comercializar secretos técnicos, comerciales, financieros, de producción, datos de clientes o información confidencial de la empresa a terceros, competidores o mediante redes sociales.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 62 CST num. 2 / Ley 1581/2012</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">14</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Incumplimiento SST crítico:</strong> Negativa sistemática o desobediencia reiterada a usar los Elementos de Protección Personal (EPP) asignados para actividades de alto riesgo (trabajo en alturas, espacios confinados, electricidad, manipulación de químicos).</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Res. 0312/2019 / Art. 62 CST</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">15</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Ocultamiento de estado de salud:</strong> Ocultar de forma dolosa o con mala fe información sobre enfermedades, lesiones o condiciones de salud preexistentes que sean incompatibles con el cargo y que pongan en riesgo la operación o la seguridad de terceros.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 62 CST / Decreto 1072/2015</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">16</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Discriminación:</strong> Todo trato desigual, excluyente, humillante o vejatorio basado en raza, sexo, origen nacional o familiar, lengua, religión, opinión política, discapacidad, orientación sexual o identidad de género.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Constitución / Ley 2466/2025</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">17</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Insubordinación grave:</strong> Desobedecer de manera abierta, reiterada y sin justificación las órdenes e instrucciones del empleador o sus representantes, relacionadas con el objeto del contrato y la operación.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 62 CST num. 4</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">18</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Competencia desleal:</strong> Ejecutar labores de la misma naturaleza del objeto del contrato para terceros o competidores durante la vigencia del vínculo laboral, sin autorización escrita del empleador.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 62 CST num. 2</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">19</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Uso indebido de TIC:</strong> Usar los recursos tecnológicos, correo corporativo, internet o equipos para acceder a contenido pornográfico, instalar software pirata o malicioso, realizar apuestas, ejecutar fraudes informáticos o acoso digital.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">RIT Art. 53° / Ley 1273/2009</td></tr>
      <tr><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">20</td><td style="padding:10px;border:1px solid #e0e0e0;"><strong>Reincidencia:</strong> La acumulación de tres (3) o más sanciones menores (amonestaciones escritas o suspensiones) en un período de seis (6) meses, tipificándose como indisciplina reiterativa que resquebraja la confianza.</td><td style="padding:10px;border:1px solid #e0e0e0;text-align:center;">Art. 62 CST / RIT Art. 63°</td></tr>
    </tbody>
  </table>

  

  <h3>Art. 63° Medidas formativas y de gestión del comportamiento</h3>
  <p>Antes de activar cualquier medida, la organización escucha, investiga y comprende. Toda respuesta a una conducta inadecuada es proporcional, respetuosa de la dignidad del bioindividuo y orientada a la corrección constructiva, no al castigo:</p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px;">
    <thead>
      <tr style="background-color: #fff3cd;">
        <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: center; width: 10%;">Nivel</th>
        <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: left;">medida formativa restaurativa y comportamental Aplicable</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center; font-weight: bold;">1</td><td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Llamado de atención verbal y orientación</strong> (solo para el expediente general y feedback).</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center; font-weight: bold;">2</td><td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Amonestación escrita</strong> con anotación en la hoja de vida.</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center; font-weight: bold;">3</td><td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Multa monetaria</strong>, aplicable exclusivamente a faltas asociadas con retardos o ausencias injustificadas.</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center; font-weight: bold;">4</td><td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Suspensión temporal</strong> en la prestación de los servicios y del pago del salario, la cual, por la primera vez de una falta determinada, no excederá de ocho (8) días; en caso de reincidencia repetida de la misma clase de falta, no excederá de dos (2) meses.</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center; font-weight: bold; color: #d32f2f;">5</td><td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Despido con Justa Causa Legal</strong> (previsto como falta grave que resquebraja irremediablemente la confianza y causa el retiro amparado en el CST y en los estipulados de este Reglamento).</td></tr>
    </tbody>
  </table>

  <h3>Art. 64° Límites a las multas</h3>
  <p>En cumplimiento del Artículo 113 del CST y la Sentencia C-478 de 2007, la organización podrá aplicar una deducción económica únicamente cuando el colaborador, sin causa justificada, presente retardos o ausencias injustificadas. Esta multa no puede en ningún caso, ni en repetidas oportunidades, exceder de la quinta (1/5) parte del salario de un (1) día de la cuota ordinaria de nómina; y la suma recaudada se destinará exclusivamente al rubro de bienestar o estímulo que beneficie a todos los colaboradores.</p>

  <h3>Art. 65° PROCEDIMIENTO DISCIPLINARIO (BLINDAJE DEL DEBIDO PROCESO)</h3>
  <p>En estricto apego a la Reforma Laboral (Ley 2466 de 2025) que modifica el Artículo 115 del CST, y la Sentencia C-593 de 2014, para evitar nulidades de gestión del comportamientos la empresa garantiza el siguiente protocolo ineludible de siete (7) pasos:</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li style="margin-bottom: 10px;"><strong>Apertura Formal e Investigación:</strong> Recolección imparcial de pruebas (documentales, testimoniales, cámaras de seguridad o auditorías TIC) antes de tomar cualquier decisión.</li>
    <li style="margin-bottom: 10px;"><strong>Citación a Descargos:</strong> Notificación formal y escrita al trabajador indicando de manera expresa y detallada los hechos, conductas u omisiones investigadas, así como las normas del RIT o CST posiblemente infringidas.</li>
    <li style="margin-bottom: 10px;"><strong>Traslado de Pruebas y Plazo de Defensa:</strong> Con la citación, se entregará copia íntegra de todas las pruebas que obran en su contra. Se le otorgará al trabajador un período no inferior a <strong>cinco (5) días</strong> para preparar y presentar su defensa, controvertir las pruebas allegadas y aportar las suyas.</li>
    <li style="margin-bottom: 10px;"><strong>Audiencia de Descargos y Acompañamiento:</strong> el colaborador (bioindividuo) expondrá su versión verbal o escrita. Tiene derecho a ser asistido por dos (2) compañeros de trabajo o representante del sindicato. Si los descargos son verbales, se levantará obligatoriamente un acta que transcriba lo expresado, la cual será firmada por los asistentes.</li>
    <li style="margin-bottom: 10px;"><strong>Valoración Imparcial:</strong> El ente encargado analizará las pruebas y descargos basándose en el principio de <em>in dubio pro disciplinado</em> y la proporcionalidad de la sanción.</li>
    <li style="margin-bottom: 10px;"><strong>Fallo Motivado y Notificación:</strong> Comunicación escrita fundamentando de manera clara, fáctica y jurídica la decisión de absolución, medida formativa menor o despido con justa causa.</li>
    <li><strong>Doble Instancia (Recursos de Ley):</strong> Se otorgará un plazo de cinco (5) días hábiles tras la notificación del fallo para que el colaborador (bioindividuo) interponga los recursos de reposición y apelación. La apelación será resuelta por el superior jerárquico de quien impuso la sanción, garantizando la doble instancia constitucional.</li>
  </ol>

  <h3>Art. 66° Cargos con facultad de gestión del comportamiento</h3>
  <p>Los siguientes líderes están facultados para gestionar los procesos de comportamiento, siempre con respeto al debido proceso y a la dignidad del colaborador:</p>
  <p><strong>Cargos facultados:</strong><br>
  {{cargos_sancionatorios}}</p>
  <p>Para garantizar la transparencia y el aprendizaje organizacional, toda medida formal queda documentada en el expediente del colaborador reposado en Gestión Humana o la dependencia correspondiente.</p>

  <h3>Art. 67° Término de prescripción para la gestión</h3>
  <p>La organización respeta el principio de caducidad: perderá la facultad de iniciar cualquier proceso de gestión del comportamiento de los colaboradores, si dentro de los tres (3) meses siguientes al conocimiento efectivo de la ocurrencia del hecho, no ha citado formalmente a descargos o impuesto la medida formativa correspondiente, tal como lo regula el Código Sustantivo del Trabajo.</p>

  <h2>CAPÍTULO X — PREVENCIÓN Y PROTOCOLO DE ACOSO LABORAL (Ley 1010/2006)</h2>
  <h3>Art. 68° Disposiciones de cero tolerancia al acoso laboral</h3>
  <p>En nuestra organización, cada colaborador tiene derecho a un entorno libre de miedo, maltrato y hostigamiento. En consonancia con la Ley 1010 de 2006 y la Constitución, adoptamos una postura de cero tolerancia frente al acoso laboral en cualquiera de sus formas. Garantizamos a todos los colaboradores el derecho a un ambiente libre de violencia en el que se respete la salud mental, la dignidad y el derecho al trabajo en condiciones justas.</p>

  <h3>Art. 69° Definición, modalidades y conductas constitutivas de acoso laboral</h3>
  <p>Se entiende por Acoso Laboral toda conducta persistente y demostrable, ejercida sobre un empleado por parte de un empleador, un jefe o superior jerárquico inmediato o mediato, un compañero de trabajo o un subalterno, encaminada a infundir miedo, intimidación, terror y angustia, a causar perjuicio laboral, generar desmotivación en el trabajo, o inducir la renuncia del mismo. Sus modalidades incluyen: maltrato, persecución, discriminación, entorpecimiento, inequidad y desprotección laboral.</p>

  <h3>Art. 70° Comité de Convivencia Laboral</h3>
  <p>Para proteger el bienestar emocional y la dignidad de cada colaborador, la organización, siguiendo los mandatos de la Resolución 3461 de 2025 y Resolución 652 de 2012, instalará un Comité de Convivencia Laboral (COCOLAB) bipartito compuesto por igual número de representantes dla organización y de los colaboradores. Sesionará ordinariamente de forma trimestral y extraordinariamente ante quejas graves y urgentes, custodiando las actas y manteniendo reserva absoluta.</p>

  <h3>Art. 71° Procedimiento confidencial de quejas por acoso laboral</h3>
  <p>El colaborador que viva una situación de acoso podrá acudir con plena confianza y garantía de reserva al canal confidencial dispuesto para el COCOLAB, detallando los hechos, modo, tiempo y lugar, así como testigos o soportes. El Comité iniciará el protocolo conciliatorio en un plazo máximo e infranqueable de 65 días calendario desde la recepción de la queja formal convocando a las partes y agotará todos los canales del diálogo constructivo. Si no hay acuerdo o si se incumple la conciliación, el caso será remitido al fuero restaurativo y comportamental de la empresa y/o Ministerio de Trabajo.</p>

  <h3>Art. 72° medidas formativas restaurativa y comportamentals internas por acoso laboral</h3>
  <p>Cuando el proceso restaurativo confirme, con plena garantía del debido proceso, que una persona ha incurrido en conductas de acoso laboral, la empresa, en estricto cumplimiento del Código Sustantivo del Trabajo, y de acuerdo con el impacto sobre el clima organizacional, impondrá las medidas correctivas aplicables desde la amonestación escrita hasta la terminación de contrato con Justa Causa (Falta Grave), previo dictamen garantizado con el debido proceso.</p>

  <h3>Art. 73° Mecanismos de protección al denunciante</h3>
  <p>Quien denuncia actúa con valentía. La organización protege de forma incondicional a quienes reportan situaciones de acoso laboral o sirvan de testigos en dichos procedimientos, no podrá terminarse el contrato de trabajo ni rebajar los salarios, desmejorar sus labores o aplicar traslados intempestivos sin justa causa comprobada del colaborador (bioindividuo) quejoso en los seis (6) meses siguientes a la presentación de la queja debidamente fundamentada.</p>

  
  <h3>Art. 74° Definición y modalidades de acoso laboral</h3>
  <p>Todo colaborador que experimente conductas que atenten contra su dignidad o bienestar en el trabajo que entorpezcan sus labores y dañen su patrimonio psicológico, en los términos estipulados de la Ley 1010 de 2006, interpondrá y accionará el siguiente protocolo especial de solución diseñado de manera neutral.</p>

  <h3>Art. 75° El Comité de Convivencia Laboral (COCOLAB)</h3>
  <p>Para activar el protocolo será receptora de la querella directa el COCOLAB, ente autónomo al interior de la compañía constituido equitativamente por actores, el cual tendrá independencia procedimental, que de forma neutral buscará con enfoque conciliatorio e instructivo desescalar el conflicto sin llegar a imposiciones de gestión del comportamientos o coacciones de fondo que no rebasen su propio fuero estipulado para la convivencia y amparo social.</p>

  <h3>Art. 76° RUTA INTERNA — Protocolo paso a paso</h3>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li style="margin-bottom: 5px;"><strong>Recepción y Admisión:</strong> Llegada de queja o remisión directa para análisis preliminar.</li>
    <li style="margin-bottom: 5px;"><strong>Audiencias aisladas:</strong> Escucha confidencial, privada e imparcial en sesión del comité tanto al presunto agresor como al querellante.</li>
    <li style="margin-bottom: 5px;"><strong>Conciliación y Pacto:</strong> Audiencia conjunta dirigida por un mediador (del comité) tendiente a construir espacios de perdón, no repetición y acuerdos.</li>
    <li style="margin-bottom: 5px;"><strong>Seguimiento:</strong> Monitoreo de cumplimiento del pacto y evaluación bimestral.</li>
    <li><strong>Traslado:</strong> En el escenario del fracaso total del diálogo, remisión directa del caso a Gerencia, o entes de fuero restaurativo y comportamental corporativo e inspectores del Ministerio para aplicación de medidas de gestión del comportamientos a los responsabilidadbles.</li>
  </ol>

  <h3>Art. 77° Prohibición de represalias</h3>
  <p>los colaboradores denunciantes y todos aquellos que presten auxilio testifical al proceso de comité o querellas oficiales y sean citados a rendir testimonio de acoso estarán protegidos por una garantía ineludible de indemnidad. Cualquier venganza, destitución, presión o censura se declarará inválida frente al código sustantivo por el término mínimo legal de los seis (6) meses post-queja.</p>

  <h3>Art. 78° Medidas de protección inmediata</h3>
  <p>La protección de la persona afectada es inmediata. El COCOLAB u órgano competente recomendará con urgencia la reubicación, cambio de horario o teletrabajo, variar horarios de servicio, alternar esquemas del sistema o teletrabajo de urgencia a las víctimas a fin de extinguir inminentes acercamientos nocivos y salvaguardar la vida y sanidad integral del afectado, evitando revictimización bajo escenarios adversos prolongados.</p>

  <h2>CAPÍTULO XI — PREVENCIÓN Y PROTOCOLO DE ACOSO SEXUAL (Ley 2365/2024)</h2>
  <h3>Art. 79° Disposiciones de prevención y cero tolerancia al acoso sexual</h3>
  <p>Esta organización cree que cada persona merece trabajar con dignidad, seguridad y respeto pleno de su integridad. Rechazamos de forma categórica e irrestricta cualquier acto de acoso sexual, hostigamiento con fines no consentidos de orden sexual y toda forma de agresión o violencia de género. El entorno de trabajo se regirá por la total indemnidad sexual y el respeto integral de los derechos humanos y sexuales de la planta de personal.</p>

  <h3>Art. 80° Definición de acoso sexual</h3>
  <p>El acoso sexual consiste en todo acto, conducta o comportamiento no deseado de naturaleza o connotación sexual que cause incomodidad, humillación o intimidación a quien lo recibe, cuando dicho acto ocurra en el marco o con ocasión del trabajo, bien sea de forma verbal, física, visual, no verbal, a través de plataformas digitales o fuera de las instalaciones si existe conexión laboral, sea o no ejercido bajo asimetrías de poder.</p>

  <h3>Art. 81° Alcance</h3>
  <p>Las disposiciones y protecciones de este capítulo y de las rutas de prevención de Acoso Sexual aplican imperativamente sobre la totalidad de empleados formales, practicantes, contratistas de prestación de servicios, trabajadores en misión, aprendices SENA, proveedores regulares y pasantes, sin perjuicio de la tercerización e intermediación.</p>

  <h3>Art. 82° Protocolo de denuncia</h3>
  <p>Habilitamos un canal de escucha seguro, confidencial y sin juicios para que la persona afectada pueda reportar con plena tranquilidad. En ninguna circunstancia se podrá citar a la víctima y al presunto agresor a escenarios de careo o conciliación para casos de acoso sexual. El protocolo actuará con celeridad aislando a la víctima de espacios o cercanía directa con el presunto acosador dictando medidas de urgencia preventivas sin vulnerar su dignidad.</p>

  <h3>Art. 83° Protección al denunciante</h3>
  <p>La persona que reporta acoso sexual está protegida de forma irrestricta. Todo despido en los seis (6) meses posteriores a la denuncia se presume ineficaz e ilegal. Adicionalmente, la organización está en la obligación de no aplicar descuentos, suspensiones, cambios intempestivos de sede o de subordinación que menoscaben sus derechos mientras se emita una decisión o investigación penal en curso.</p>

  <h3>Art. 84° Obligación de reporte semestral al SIVIGE</h3>
  <p>La empresa, bajo su deber estatutario derivado de la Ley 2365 de 2024, deberá rendir informes y reportes semestrales y estadísticos rigurosos sobre quejas y atenciones de presuntos casos de Acoso Sexual Laboral al Sistema Integrado de Información de Violencias de Género (SIVIGE) obligatoriamente dentro de los últimos diez (10) días de cada semestre conservando el blindaje e intimidad de la identidad de la víctima, cumpliendo las inspecciones y auditorías requeridas por el Ministerio del Trabajo.</p>

  <h3>Art. 85° medidas formativas por acoso sexual comprobado</h3>
  <p>Confirmado el acoso sexual con plena garantía del debido proceso, la respuesta de la organización es firme e inmediata:, se aplicará invariablemente la medida formativa máxima correspondiente a Despido Unilateral y Directo por Justa Causa legal tipificado como Falta Grave, sin desmedro del traslado del caso a las autoridades de justicia penal ordinaria (Fiscalía General de la Nación).</p>

  
  <h3>Art. 86° Definición legal de acoso sexual</h3>
  <p>Es acoso sexual toda aproximación forzosa, solicitudes de favores carnales y sexuales o asedios indeseados y graves. Para que se consolide, según las pautas formales legales, su naturaleza será repetitiva, en un ejercicio perverso del poder (horizontal o vertical) que amilane e indigne, condicionando decisiones vinculantes del puesto o generando un ambiente grosero.</p>

  <h3>Art. 87° Conductas constitutivas de acoso sexual</h3>
  <p>Expresamente a nivel laboral comprende pero no se limita a: chantajes de ascensos o conservaciones de vacantes supeditadas al sometimiento erótico; roces corporales no solicitados; tocamientos; acoso digital o cibernético; envío de imágenes con contenido gráfico explícito o chistes humillantes, invitaciones obsesivas denegadas explícitamente y acosos sistemáticos sexistas que rompan barreras sanas de la inter-relación corporativa general.</p>

  <h3>Art. 88° Inconciliabilidad del acoso sexual</h3>
  <p>El acoso sexual no se concilia, no se negocia, no se relativiza. En cumplimiento de la Res. 3461/2025, es una conducta que y un factor lesivo mayúsculo que <strong>NUNCA ES SUSCEPTIBLE DE CONCILIACIÓN</strong> ni abordaje en procesos paritarios ante el COCOLAB, o amigables componedores, pasando su conocimiento de forma prioritaria al resorte gerencial sancionador supremo, entidades de género y fiscales.</p>

  <h3>Art. 89° RUTA INTERNA DE ATENCIÓN — Protocolo paso a paso</h3>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li style="margin-bottom: 5px;"><strong>Prevención e Inicio rápido:</strong> Alerta confidencial reportada al alto mando con copia a SST o dependencia habilitada en la empresa.</li>
    <li style="margin-bottom: 5px;"><strong>Separación Cautelar de Riesgo:</strong> Concesión de permiso remunerado y distanciamiento preventivo al denunciante y presunto asaltante.</li>
    <li style="margin-bottom: 5px;"><strong>Trámite de Averiguación restaurativa y comportamental Expedita:</strong> Evaluación rigurosa sin confrontar a la presunta víctima con el ofensor.</li>
    <li style="margin-bottom: 5px;"><strong>Decisión Plena Causal:</strong> Expulsión y desvinculación justificada inminente en caso de confirmación fáctica y sólida.</li>
    <li><strong>Copia Penal:</strong> Traspaso inmediato del historial sin ocultamientos para denuncia penal del implicado ante la Fiscalía y sus dependencias.</li>
  </ol>

  <h3>Art. 90° REPORTE AL SIVIGE</h3>
  <p>El área de Talento Humano o la Gerencia informará debida, formal, estadística y documentadamente mediante la estructura, codificación de causas, cargos y atenuantes, exigida bajo control perentorio semestral a las plataformas en línea impuestas por la legislación de la república como el Sistema Integrado SIVIGE y otros canales, para los rastreos macro del observatorio gubernamental que compila los incidentes de violencia y equidad de género.</p>

  <h3>Art. 91° Protección reforzada a la víctima</h3>
  <p>Todo el andamiaje del resorte legal garantiza, en favor indiscutible del afectado que interpone de manera fundamentada, creíble y diligente la queja grave en mención, un fuero total o impedimento que acarrea presunción legal de ilegalidad y nulidad sobre el despido en represalia o las reducciones salariales acometidas a manera de reprimenda bajo la sombrilla y lapso restrictivo que delimitan las directrices estatales impuestas hasta superar los seis (6) meses dictados por normativa a partir del requerimiento y más, si persiste el litigio.</p>

  <h3>Art. 92° Prohibición de revictimización</h3>
  <p>Cualquier directivo corporativo que, notificado del flagelo de acoso denunciado por uno de sus integrante del equipos o de una empresa temporal adjunta, asuma roles sesgados para cuestionar o estigmatizar el relato de quien sufre la vejación, lo confronte cara a cara con su violador laboral, impida su acceso a medidas temporales, y divulgue su nombre causando maltrato social en pasillos incurrirá de hecho grave e imputable por tolerancia complaciente, cómplice e ignorancia de protocolos rectores.</p>

  <h3>Art. 93° Reporte al Ministerio del Trabajo</h3>
  <p>Sin demérito de actuar simultáneamente mediante querellas judiciales u ordinarias y el aparato de justicia colombiano, la parte agraviada podrá y estará en franco derecho de formalizar e instaurar denuncia a través de la herramienta especial dispuesta en la sede electrónica del Ministerio del Trabajo garantizando total anonimato en una reserva de sumario incólume del funcionario receptor de turno.</p>

  <h2>CAPÍTULO XII — CANALES DE ESCUCHA ACTIVA Y RESOLUCIÓN</h2>
  <h3>Art. 94° Persona(s) designada(s) para recibir reclamos</h3>
  <p>Todo colaborador tiene voz. Cualquier inquietud, petición o reclamo relacionado con su compensación, dotación, clima laboral o procesos administrativos puede canalizarse con su líder directo, y si la complejidad lo amerita, al responsable de Gestión Humana o en su defecto a la Gerencia General de la empresa. Ninguna otra instancia carente de autorización tiene poder vinculante para recibir u otorgar respuestas jurídicas a solicitudes laborales.</p>

  <h3>Art. 95° Procedimiento de atención a reclamos</h3>
  <p>La organización escucha activamente. Todo reclamo puede presentarse de forma escrita y documentada, El área encargada tendrá la obligación de dictar respuesta de fondo, integral, y congruente dentro del término máximo de quince (15) días hábiles siguientes a la radicación. Aquellos casos atípicos podrán solicitar al trabajador una prórroga por escrito antes del vencimiento del primer lapso, que no excederá el doble del mismo.</p>

  <h3>Art. 96° Derecho a asesorarse del sindicato respectivo</h3>
  <p>La organización respeta y valora el derecho de libre asociación. Cada colaborador que pertenezca a un sindicato tiene derecho al acompañamiento de sus representantes, todo empleado que eleve o adelante un proceso de queja, petición o proceso restaurativo y comportamental y que haga parte oficial del sindicato tendrá derecho a solicitar el acompañamiento expreso de los directivos sindicales para velar por su debido proceso sin lugar a rechazo de la compañía.</p>

  <h3>Art. 97° Quejas ante el Inspector de Trabajo</h3>
  <p>Si después de agotar los canales internos un colaborador aún siente vulnerados sus derechos, tiene plena libertad de acudir al Ministerio del Trabajo, subsisten violaciones directas a sus fueros y garantías sustantivas contempladas en la Constitución o el contrato, podrá, sin recibir medida formativa posterior de esta corporación por ese hecho, dirigirse a las inspecciones del Ministerio del Trabajo para intermediación y querella de sus derechos irrenunciables.</p>

  <h2>CAPÍTULO XIII — DIVERSIDAD, INCLUSIÓN Y ESTABILIDAD REFORZADA</h2>
  <h3>Art. 98° Mujer embarazada y madre lactante</h3>
  <p>Como mecanismo garantista frente a la discriminación laboral, se protege la especial maternidad. Se requiere calificación del Inspector del Trabajo con justa causa previamente valorada si se pretendiese dar de baja del cuadro de empleados a trabajadoras gestantes y en periodo de lactancia. La empresa acondicionará un espacio privado e higiénico como "Sala Amiga de la Familia Lactante" aplicable si fuere pertinente según los aforos, la ley o convenios, así como pausas de descanso especiales.</p>

  <h3>Art. 99° Trabajadores con discapacidad</h3>
  <p>La diversidad es un valor, no un trámite. La organización garantiza activamente la inclusión de personas con discapacidad, realizando los ajustes razonables necesarios para que puedan desarrollar su talento plenamente., debiendo la organización garantizar los ajustes razonables requeridos para desarrollar la actividad del empleado. Queda proscrito el despido motivado exclusivamente por una discapacidad, ya que el mismo generaría como corolario legal la ineficacia del despido, el reintegro, y el resarcimiento indemnizatorio punitivo de 180 días de salario mínimo exigido por la Ley 361 de 1997 y 1618 de 2013.</p>

  <h3>Art. 100° Cuota de vinculación de personas con discapacidad</h3>
  <p>La organización asume el compromiso de cumplir con las cuotas de vinculación de personas con discapacidad que la ley establece, amparados por los estatutos de igualdad de oportunidades y vinculación equitativa para la inclusión laboral que demanda la normativa, a cumplir imperativamente con los porcentajes y cuotas legales de contratación para la empleabilidad del talento diverso, favoreciendo preferentemente el mérito.</p>

  <h3>Art. 101° Fuero sindical</h3>
  <p>El fuero sindical es una garantía de libertad colectiva. Los colaboradores protegidos por fuero, ni trasladados a otros establecimientos de la misma empresa sin justa causa debidamente comprobada y autorizada por la autoridad u órgano competente. La protección del fuero abarca fundadores, adherentes, miembros y la junta directiva o subdirectiva de acuerdo con las cifras y porcentajes avalados en el CST y la Ley.</p>

  <h3>Art. 102° Personas próximas a pensionarse (prepensionados)</h3>
  <p>La organización honra el camino laboral de quienes están próximos a jubilarse. Todo colaborador que se encuentre en los 36 meses previos de causar las edades, semanas y requerimientos pensionales dictaminados en los fondos formales del Estado, ostentará estabilidad laboral reforzada (fuero de prepensionados). La compañía blindará su contrato como garantía para el acceso al derecho vital que materializará su jubilación sin interrumpir los aportes definitivos.</p>

  <h3>Art. 103° Víctimas del conflicto armado</h3>
  <p>Las víctimas del conflicto armado merecen una oportunidad real. La organización las acoge con prioridad, apoyo psicosocial y sin discriminación en sus procesos de selección e incentivos tributarios para los colombianos reportados y ratificados con el certificado de inscripción en el Registro Único de Víctimas (RUV), implementando espacios de memoria constructiva en la política corporativa de sostenibilidad y convivencia.</p>

  
  <h3>Art. 115° Fuero circunstancial</h3>
  <p>El diálogo colectivo es un derecho fundamental. Durante una negociación colectiva, ningún colaborador que haya presentado un pliego de peticiones podrá ser despedido sin justa causa, desde la fecha de presentación del pliego y durante los términos legales de las etapas de arreglo directo y huelga o tribunal de arbitramento. Toda desvinculación en contravía de este fuero circunstancial se presumirá ilegal y carecerá de todo efecto.</p>
<h2>CAPÍTULO XIV — BIENESTAR EMOCIONAL Y SALUD MENTAL</h2>
  <h3>Art. 104° Declaración de compromiso con la salud mental</h3>
  <p>Para nosotros, la salud mental es tan prioritaria como la salud física. Comprendemos el bienestar emocional como el estado de plenitud en el que cada colaborador (bioindividuo) puede ser consciente de sus capacidades, afronta el estrés natural del trabajo, contribuye productivamente y actúa constructivamente de acuerdo a la Ley 1616 de 2013 y Resolución 2404 de 2019. Declaramos la salud mental como un eje fundamental, promoviendo espacios sin saturación emocional y la erradicación de conductas nocivas.</p>

  <h3>Art. 105° Programa de Bienestar Mental</h3>
  <p>Creamos, con presupuesto propio y convicción genuina, espacios y programas de bienestar emocional que van más allá del cumplimiento de la Ley 2396 de 2024: para la prevención del estrés crónico, el 'Síndrome de Burnout', y los conflictos humanos interpersonales. La empresa dispondrá de un programa de bienestar emocional con presupuesto propio asignado. Se priorizarán las pausas activas físicas y cognitivas obligatorias, talleres de capacitación para directivos sobre inteligencia emocional, y se deberá reportar los indicadores de ausentismo por causas de salud mental a la dirección de SST.</p>

  <h3>Art. 106° Factores de riesgo psicosocial a controlar</h3>
  <p>Como expresión de nuestro cuidado por el bioindividuo, la organización aplica anualmente (o según la periodicidad impuesta por resultados previos de alto o mediano riesgo) la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial exigida por la normatividad del Ministerio. Las conclusiones permitirán que la organización ajuste las demandas ambientales y carga física, mejore las recompensas organizacionales, flexibilice liderazgos autoritarios e incremente la participación de los empleados en la gestión del cambio.</p>

  <h3>Art. 107° Confidencialidad del diagnóstico</h3>
  <p>La historia de salud mental de cada colaborador es absolutamente privada. Nadie puede ser presionado a revelar sus procesos terapéuticos o terapias y asistencia psicológica salvo para trámites debidos de licencias incapacitantes radicadas vía EPS y la reserva de su historia ocupacional, de modo que queda estrictamente tipificado como falta calificada muy grave a quienes divulguen diagnósticos de salud mental para acoso sistemático, burlas, o ser usados como argumentos dolosos de despido encubierto.</p>

  <h3>Art. 108° Articulación con el SG-SST</h3>
  <p>El cuidado de la salud mental cuenta con respaldo institucional real. Los programas de vigilancia epidemiológica psicosocial, bienestar emocional y atención a señales de agotamiento serán plenamente abarcados por el presupuesto y metas exigibles desde la Responsabilidad de la dirección técnica del Sistema de Gestión de SST con el pleno auxilio científico o financiero y en acompañamiento concurrente con las administradoras de riesgos laborales (ARL).</p>

  <h2>CAPÍTULO XV — ACUERDOS FINALES Y ADAPTABILIDAD CONTINUA</h2>
  <h3>Art. 109° Publicación del reglamento</h3>
  <p>En estricto cumplimiento de la modificación al Artículo 120 del CST (Reforma Laboral 2025), este Reglamento se publicará mediante fijación física en dos (2) sitios distintos y visibles de la empresa. De manera obligatoria y concurrente, el RIT estará fijado permanentemente en el <strong>medio digital, intranet o plataforma de la compañía</strong> (<strong>{{medios_publicacion}}</strong>) garantizando que todos los colaboradores tengan acceso inmediato y remoto a él en cualquier momento para su lectura y consulta sin restricciones.</p>

  <h3>Art. 110° Vigencia y entrada en fuerza</h3>
  <p>Este Manifiesto entra en vigor y comienza a guiar nuestra convivencia de manera oficial y unificado en fecha <strong>{{fecha_publicacion}}</strong>. Toda regla, directiva, circular, cláusula transitoria o pacto contractual pretérito que vulnere y contradiga las presentes normativas será subsumido bajo este reglamento y resultará en anulación tacita por pérdida de vigor jurídico vinculante prevaleciente.</p>

  <h3>Art. 111° Disposiciones supletorias</h3>
  <p>Cualquier situación no contemplada expresamente en este Manifiesto se resolverá con espíritu de equidad y justicia, conforme al e incluida exhaustivamente entre el presente estipulado, se ceñirá y solucionará única y llanamente por mandatos, alcances o lagunas supletorias avalados mediante la sombrilla y cobertura general del Código Sustantivo del Trabajo de Colombia y las leyes reformistas conexas, decretos reglamentarios vigentes o por las dictaminaciones supremas ratificadas constitucionalmente.</p>

  <h3>Art. 112° Modificaciones</h3>
  <p>Este Manifiesto es un documento vivo. Cuando la organización requiera actualizarlo, lo hará con transparencia y notificación anticipada de, o a través de mesa representativa y por fuerza legal externa, algún tipo de adecuación, revisión y reforma capitulada o normativa especial con rango a este cuerpo reglamentario, deberá notificarse y someterse a escrutinio formal y publicación anticipada mínima de ocho (8) días calendario hábiles a todos los niveles empresariales a fin de surtir formal y plenos efectos.</p>

  <h3>Art. 113° Consecuencias del incumplimiento</h3>
  <p>La organización conoce sus responsabilidades legales: el incumplimiento en la adopción y publicación de este Reglamento acarrea sanciones conforme y de acuerdo a las directrices que impone legalmente la legislación nacional como el Artículo 114 y 120 (CST) o la Reforma 2466 de 2025, el negarse a disponer, redactar legalmente, y publicitar o faltar a implementar formal y periódicamente el presente compendio RIT en los fueros correctos acarreará al ente patronal multas onerosas desde las mínimas vigentes a consecuencias pecuniarios supremos del orden de hasta 5.000 (Cinco mil) SMMLV e invalidez de los ceses unilaterales pactados frente a litigios corporativos.</p>

  <h3>Art. 114° Firma del Representante Legal</h3>
  <p>Como acto de compromiso genuino con nuestra gente y con la ley, suscribe y firma en constancia de expedición y publicación el/la representante legal <strong>{{representante_legal}}</strong> identificado(a) con C.C. <strong>{{cedula_representante_legal}}</strong> en nombre y representación de la empresa <strong>{{empresa_nombre}}</strong>, expidiendo y promulgando lo dictado a los <strong>{{fecha_publicacion}}</strong>.</p>
</div>
`;
