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
  <p>El presente Reglamento Interno de Trabajo, prescrito por <strong>{{empresa_nombre}}</strong>, empresa legalmente constituida en Colombia e identificada con NIT <strong>{{empresa_nit}}</strong>, domiciliada en <strong>{{ciudad_domicilio}}, {{departamento}}</strong>, hace parte integral de los contratos de trabajo individuales, verbales o escritos, celebrados o que se celebren con todos sus trabajadores. El empleador y el trabajador se someten estrictamente a las disposiciones de este reglamento, así como al Código Sustantivo del Trabajo (CST), sus decretos reglamentarios, las leyes 1010 de 2006, 2191 de 2022, 2365 de 2024, 2396 de 2024, y la Ley 2466 de 2025 (Reforma Laboral), en todo lo que no resulte contrario a los derechos mínimos e irrenunciables de los trabajadores garantizados por la Constitución Política de Colombia.</p>
  <p>Este documento tiene como finalidad fundamental regular y definir las condiciones que deben sujetar al empleador y a los trabajadores en el desempeño de las labores, promoviendo el respeto, la sana convivencia, la prevención del acoso laboral y sexual, y el desarrollo de un entorno de trabajo digno y justo, en consonancia con los principios de la Organización Internacional del Trabajo (OIT).</p>

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
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Código Sustantivo del Trabajo (CST)</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Norma matriz que rige y estructura las relaciones laborales individuales, los contratos, derechos mínimos e irrenunciables, y obligaciones entre el empleador y los trabajadores.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #ffffff; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Ley 2466 de 2025<br/><span style="font-size:11px; font-weight:normal; color:#666;">(Reforma Laboral)</span></td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Regula la reducción definitiva de la jornada laboral máxima (42 horas semanales), modificaciones en recargos nocturnos (iniciando desde las 7:00 p.m.), nuevas directrices en contratos de aprendizaje, estabilidad laboral reforzada y exigencia de publicación digital del RIT.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Sentencia C-593 de 2014<br/><span style="font-size:11px; font-weight:normal; color:#666;">(Corte Constitucional)</span></td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Jurisprudencia que exige un estricto <strong>"Blindaje del Debido Proceso"</strong>. Ordena que el trabajador sea informado claramente de las faltas, se le garantice el traslado formal de pruebas antes de descargos y la posibilidad de doble instancia ante una sanción.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #ffffff; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Ley 1010 de 2006</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Define y establece las medidas para prevenir, corregir y sancionar el acoso laboral y otras modalidades de hostigamiento en las relaciones de trabajo, incluyendo la creación del Comité de Convivencia Laboral.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Ley 2365 de 2024</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Estructura de prevención y sanción del acoso sexual laboral. Impone la creación de rutas de atención específicas, garantías de no revictimización y la obligatoriedad del reporte semestral ante el Sistema de Información de Violencias de Género (SIVIGE).</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #ffffff; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Ley 2191 de 2022</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Garantiza el derecho a la desconexión laboral, salvaguardando el tiempo de descanso, licencias, permisos, vacaciones y la vida personal y familiar de los trabajadores fuera de su jornada ordinaria.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Decreto 1072 de 2015</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Decreto Único Reglamentario del Sector Trabajo. Establece la obligatoriedad, estructura y directrices para la implementación del Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST).</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #ffffff; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Resolución 0312 de 2019 / SST</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Estándares Mínimos del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST), que fundamentan las obligaciones de autocuidado, uso de EPP y reporte inmediato de incidentes, accidentes o condiciones de salud preexistentes por parte de los trabajadores.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Ley 1562 de 2012</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Modifica el Sistema de Riesgos Laborales. Define integralmente los conceptos de accidente de trabajo y enfermedad laboral para garantizar su reporte oportuno.</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #ffffff; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Ley Estatutaria 1581 de 2012</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Ley de Protección de Datos Personales (Hábeas Data). Regula la privacidad, recolección y tratamiento confidencial de la información, expedientes médicos y bases de datos de los trabajadores.</td>
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
        <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">Resolución 089 y Ley 1335 (2009)</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; line-height: 1.5;">Prevención de adicciones y políticas de salud pública: prohíbe el consumo de alcohol, sustancias psicoactivas y declara las instalaciones corporativas como espacios 100% Libres de Humo (incluyendo vapeadores).</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; background-color: #ffffff; border-right: 1px solid #e0e0e0;">Leyes 1822, 2114, 1280, 1811 y 163</td>
        <td style="padding: 10px; line-height: 1.5;">Conjunto normativo que amplía y asegura las licencias y permisos remunerados irrenunciables: Maternidad y aborto (1822), Paternidad (2114), Luto (1280), incentivo de transporte en bicicleta (1811) y fuero electoral por sufragio o jurado (163).</td>
      </tr>
    </tbody>
  </table>

  <h2>CAPÍTULO I — DEL EMPLEADOR, TRABAJADORES Y TIPOS DE CONTRATO</h2>
  <h3>Art. 1° Identificación del empleador, domicilio y actividad</h3>
  <p>El empleador de las personas que prestan sus servicios a la empresa es <strong>{{empresa_nombre}}</strong>, identificada con NIT <strong>{{empresa_nit}}</strong>, constituida como una sociedad comercial de tipo <strong>{{tipo_empresa}}</strong>. El domicilio principal de la empresa es <strong>{{ciudad_domicilio}}, {{departamento}}</strong> en la dirección <strong>{{direccion}}</strong>. La actividad económica principal de la compañía es <strong>{{actividad_economica}}</strong>, bajo el Código CIIU <strong>{{codigo_ciiu}}</strong>. Las disposiciones de este reglamento aplican tanto para los trabajadores del domicilio principal como para las sucursales, agencias o dependencias que operen a nivel nacional o internacional donde presten servicio los empleados de la misma.</p>

  <h3>Art. 2° Ámbito de aplicación del reglamento</h3>
  <p>El presente Reglamento se aplica y resulta de obligatorio cumplimiento para todos los trabajadores que se encuentren vinculados o se vinculen en el futuro a la empresa, sin importar el tipo de contrato (término fijo, término indefinido, obra o labor, aprendizaje, accidental), la modalidad de prestación del servicio (presencial, teletrabajo, trabajo remoto, trabajo en casa, trabajo a domicilio) ni la jerarquía que ocupen dentro de la organización.</p>

  <h3>Art. 3° Condiciones de admisión de nuevos trabajadores</h3>
  <p>Quien aspire a desempeñar un cargo en <strong>{{empresa_nombre}}</strong> deberá someterse al proceso de selección establecido por la compañía. Para su admisión, deberá presentar los siguientes documentos:</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Hoja de vida actualizada.</li>
    <li>Copia del documento de identidad.</li>
    <li>Soportes de estudios, certificaciones académicas y experiencia laboral.</li>
    <li>Examen médico ocupacional de ingreso con concepto de aptitud expedido por el médico especialista en SST designado por la empresa.</li>
    <li>Certificado de afiliación a EPS y Fondo de Pensiones a los cuales se encontraba afiliado o desea afiliarse.</li>
    <li>Referencias personales y laborales.</li>
  </ol>
  <p>La empresa se reserva el derecho de admitir o rechazar al aspirante basado en la comprobación y veracidad de estos requisitos.</p>

  <h3>Art. 4° Período de prueba</h3>
  <p>El período de prueba tiene por objeto apreciar por parte de la empresa las aptitudes del trabajador, y por parte de este, las conveniencias de las condiciones de trabajo (Art. 76 CST). El período de prueba se estipulará siempre por escrito y en ningún caso excederá de dos (2) meses. Tratándose de contratos a término fijo cuya duración sea inferior a un (1) año, el período de prueba no podrá ser superior a la quinta parte (1/5) del término inicialmente pactado para el respectivo contrato, sin que pueda exceder de dos meses (Art. 78 CST). Durante el período de prueba, el contrato puede darse por terminado unilateralmente por cualquiera de las partes sin previo aviso ni pago de indemnización alguna.</p>

  <h3>Art. 5° Trabajadores accidentales o transitorios</h3>
  <p>Son trabajadores accidentales o transitorios aquellos que se contratan para la ejecución de labores de corta duración, no mayores de un (1) mes, que se refieren a actividades distintas de las actividades normales o misionales del empleador (Art. 6 CST). Estos trabajadores gozarán de todos los derechos fundamentales laborales mínimos de ley mientras presten su servicio a la empresa.</p>

  <h3>Art. 6° Contrato de aprendizaje SENA</h3>
  <p>La relación de aprendizaje es una forma especial de vinculación laboral conforme a lo estipulado por la Ley 2466 de 2025. Los aprendices vinculados mediante contrato de aprendizaje tendrán pleno derecho a la afiliación en salud y riesgos laborales en su fase lectiva, y en la fase práctica contarán además con derecho al pago de todas las prestaciones sociales de ley, cotización al sistema integral de seguridad social sobre un valor no inferior a un (1) SMMLV, o la proporción correspondiente, reconociéndose así la existencia de una vinculación de tipo laboral en condiciones de protección bajo el marco de la reforma laboral vigente.</p>

  <h3>Art. 7° Teletrabajo, trabajo remoto y trabajo en casa</h3>
  <p>La empresa, conforme a la Ley 1221 de 2008, la Ley 2088 de 2021 y la Ley 2121 de 2021, podrá acordar modalidades de prestación del servicio a distancia. El trabajador remoto, teletrabajador o quien trabaje en casa, deberá cumplir a cabalidad con sus responsabilidades, atender los requerimientos en su jornada ordinaria y velar por el correcto mantenimiento de las herramientas de trabajo proporcionadas por el empleador, si las hubiere. Se garantizará plenamente el principio de igualdad y no discriminación frente a los trabajadores presenciales, preservando la desconexión laboral y las medidas de SST.</p>

  <h3>Art. 8° Trabajo en plataformas digitales</h3>
  <p>En el evento en que la empresa opere a través de plataformas digitales de reparto o servicios similares, se dará estricto cumplimiento a las disposiciones de formalización laboral establecidas en la Ley 2466 de 2025. Se reconocerá el vínculo laboral de los trabajadores, su afiliación al Sistema de Seguridad Social Integral y los derechos de sindicalización y negociación colectiva.</p>

  <h3>Art. 9° Orden jerárquico del personal</h3>
  <p>A nivel de dirección, control y ejecución, la organización administrativa de <strong>{{empresa_nombre}}</strong> comprende el siguiente orden jerárquico general, desde los cargos de mayor a menor autoridad:</p>
  <ul>
    <li>Representante Legal / Gerencia General</li>
    <li>Direcciones de Área</li>
    <li>Coordinaciones / Jefaturas</li>
    <li>Supervisores</li>
    <li>Profesionales, Técnicos, Operativos y Auxiliares</li>
  </ul>
  <p><strong>Cadena de mando específica:</strong><br>
  {{orden_jerarquico}}</p>

  <h2>CAPÍTULO II — JORNADA DE TRABAJO</h2>
  <h3>Art. 10° Jornada ordinaria</h3>
  <p>La jornada ordinaria de trabajo es la que convengan las partes, o a falta de convenio, la jornada máxima legal. Conforme a lo dispuesto en la Ley 2101 de 2021 y reforzado en la legislación laboral vigente (Ley 2466 de 2025), la jornada máxima de trabajo a partir de julio de 2026 será de cuarenta y dos (42) horas semanales. Esta jornada podrá ser distribuida en mutuo acuerdo, en 5 o 6 días a la semana garantizando el día de descanso. Aquellos trabajadores de dirección, confianza y manejo están excluidos de la jornada máxima legal de acuerdo con el Art. 162 del CST.</p>

  <h3>Art. 11° Horarios de entrada y salida / Turnos rotativos</h3>
  <p>El empleador podrá establecer y modificar los horarios y turnos de trabajo según las necesidades operativas, respetando la jornada máxima, mediante un preaviso razonable a los trabajadores. Los horarios de entrada y salida, así como los descansos, se definirán de forma específica en cada dependencia. Cuando la naturaleza de la labor lo requiera, la empresa podrá implementar sistemas de turnos de trabajo sucesivos y rotativos.</p>

  <h3>Art. 12° Jornada nocturna</h3>
  <p>Conforme a la Ley 2466 de 2025, el trabajo diurno está comprendido entre las seis horas (6:00 a.m.) y las diecinueve horas (7:00 p.m.). El trabajo nocturno es aquel que se realiza entre las diecinueve horas (7:00 p.m.) y las seis horas (6:00 a.m.) del día siguiente. El trabajo nocturno generará los recargos legales correspondientes sobre el valor ordinario de la hora.</p>

  <h3>Art. 13° Períodos para comidas y descansos dentro de la jornada</h3>
  <p>Durante cada jornada de trabajo, la empresa otorgará los tiempos de descanso necesarios que exija la naturaleza de la labor. Se dispondrá de un período no inferior a treinta (30) minutos continuos para que los trabajadores tomen sus alimentos y descansen, tiempo que en ningún caso se computará como parte integral de la jornada de trabajo (Art. 167 CST), a menos que por acuerdo previo se establezca lo contrario.</p>

  <h3>Art. 14° Horas extras y trabajo suplementario</h3>
  <p>Trabajo suplementario o de horas extras es aquel que excede de la jornada ordinaria o de la máxima legal. No se reconocerá pago de horas extras que no hayan sido previa y expresamente autorizadas por escrito por el jefe inmediato. El empleador solo podrá exigir la prestación de servicios en tiempo suplementario dentro de los límites establecidos en la ley (no más de dos horas diarias ni doce semanales). El pago se realizará con los recargos correspondientes de acuerdo con la hora diurna o nocturna.</p>

  <h3>Art. 15° Recargos nocturnos, dominicales y festivos</h3>
  <p>El trabajo realizado en domingo o en día de fiesta de descanso obligatorio, generará un recargo sobre el salario ordinario en proporción a las horas laboradas, de conformidad con la implementación progresiva dispuesta por la Ley 2466 de 2025 (80% a partir de julio 2025; 90% a partir de julio de 2026; 100% a partir de julio de 2027). El trabajo que combine horas extras con recargo dominical/festivo o nocturno se pagará liquidando los recargos de forma acumulativa conforme a la ley.</p>

  <h3>Art. 16° Trabajadores del servicio doméstico y cuidado</h3>
  <p>Todo el personal contratado por la empresa que ejerza labores de servicio doméstico o cuidado tendrá plenos derechos respecto a la jornada máxima legal vigente, reconocimiento de horas extras y recargos por trabajo nocturno, dominical y festivo, equiparándose sus derechos laborales a los del resto de los trabajadores de la empresa, de conformidad con la Ley 2466 de 2025.</p>

  <h3>Art. 17° Registro y control de asistencia</h3>
  <p>Todos los trabajadores están obligados a registrar personal e intransferiblemente su asistencia al iniciar y finalizar su jornada laboral mediante los mecanismos dispuestos por la empresa (biométricos, aplicaciones, planillas, etc.). El incumplimiento de esta obligación sin causa justificada o la alteración de los registros de asistencia constituirán falta disciplinaria.</p>

  <h2>CAPÍTULO III — DESCONEXIÓN LABORAL DIGITAL (Ley 2191/2022)</h2>
  <h3>Art. 18° Derecho a la desconexión laboral</h3>
  <p>Se garantiza el legítimo derecho de los trabajadores a la desconexión laboral digital. Una vez finalizada la jornada ordinaria de trabajo y durante los períodos de descanso remunerado, licencias, vacaciones y festivos, el trabajador tiene el derecho a no tener contacto laboral, no responder comunicaciones o requerimientos relacionados con su empleo, y a que la empresa respete su tiempo de descanso y vida familiar o personal.</p>

  <h3>Art. 19° Protocolo de desconexión</h3>
  <p>El empleador, los jefes inmediatos y supervisores deberán abstenerse de enviar correos electrónicos, mensajes de WhatsApp u otras aplicaciones de mensajería, o realizar llamadas fuera del horario laboral. Si por automatización de correos algún mensaje es recibido fuera de horario, el trabajador no estará en la obligación de leerlo ni responderlo hasta el inicio de su siguiente jornada hábil. No podrá haber ninguna repercusión negativa o sanción por no responder requerimientos fuera del horario.</p>

  <h3>Art. 20° Excepciones de fuerza mayor o caso fortuito</h3>
  <p>Quedan exceptuados del derecho a la desconexión laboral estricta:</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Los trabajadores que desempeñen cargos de dirección, confianza y manejo.</li>
    <li>Quienes, por la naturaleza de su actividad o soporte técnico urgente, deban tener disponibilidad (soportes pagados mediante acuerdos de disponibilidad).</li>
    <li>Situaciones inminentes de fuerza mayor o caso fortuito que pongan en peligro inminente la operación de la empresa, bienes o la salud de las personas.</li>
  </ol>
  <p>En estos últimos casos, el contacto debe limitarse estrictamente a lo necesario para solucionar la emergencia y el tiempo dedicado deberá compensarse o pagarse como jornada suplementaria si corresponde.</p>

  <h3>Art. 21° Medidas frente a la vulneración del derecho a la desconexión</h3>
  <p>Las vulneraciones reiteradas y comprobadas al derecho a la desconexión laboral podrán ser consideradas como conducta constitutiva de acoso laboral ante las autoridades competentes. Cualquier trabajador que vea vulnerado este derecho de manera constante podrá elevar su queja ante el Comité de Convivencia Laboral de la empresa para que este inicie el procedimiento conciliatorio correspondiente.</p>

  <h2>CAPÍTULO IV — DESCANSOS, VACACIONES Y LICENCIAS</h2>
  <h3>Art. 22° Descanso dominical remunerado</h3>
  <p>El empleador está obligado a dar descanso dominical remunerado a todos sus trabajadores. El descanso tendrá una duración mínima de veinticuatro (24) horas. Para tener derecho al descanso dominical remunerado el trabajador debe haber laborado todos los días de su jornada semanal, o haber faltado por justa causa, culpa o disposición del empleador. Quien trabaje habitualmente u ocasionalmente en domingos, tendrá derecho a un descanso compensatorio o pago extraordinario según disponga el Código Sustantivo del Trabajo.</p>

  <h3>Art. 23° Descanso en días festivos</h3>
  <p>Serán días de descanso obligatorio remunerado aquellos estipulados por la ley colombiana como festivos civiles o religiosos. Si por necesidades del servicio el trabajador debe laborar en un día festivo, tendrá derecho a la respectiva remuneración con los recargos previstos por la Ley 2466 de 2025 para el momento en que se cause.</p>

  <h3>Art. 24° Vacaciones anuales</h3>
  <p>Los trabajadores que hubieren prestado sus servicios durante un (1) año consecutivo tienen derecho a quince (15) días hábiles consecutivos de vacaciones remuneradas. La época de disfrute de las vacaciones deberá ser señalada por el empleador, a más tardar dentro del año subsiguiente, concediéndolas de forma oficiosa o por petición del trabajador, con una antelación no menor a quince (15) días. El trabajador debe disfrutar mínimo seis (6) días continuos al año.</p>

  <h3>Art. 25° Compensación de vacaciones en dinero</h3>
  <p>Queda prohibido compensar totalmente las vacaciones en dinero. Sin embargo, a petición escrita del trabajador, el empleador podrá autorizar la compensación en dinero de hasta la mitad (7.5 días) de las vacaciones a que tiene derecho cada año. A la terminación del contrato de trabajo se liquidarán y pagarán en dinero las vacaciones pendientes proporcionalmente al tiempo laborado.</p>

  <h3>Art. 26° Licencia de maternidad</h3>
  <p>Toda trabajadora en estado de embarazo tiene derecho a una licencia de dieciocho (18) semanas en la época de parto, remunerada con el salario que devengue al entrar a disfrutar del descanso. Al menos una (1) o dos (2) semanas deberán tomarse de forma preparto. Esta licencia se extenderá también a las madres adoptantes y a los casos de aborto no provocado conforme a lo estipulado por la Ley 1822 de 2017.</p>

  <h3>Art. 27° Licencia de paternidad</h3>
  <p>El padre trabajador tiene derecho a dos (2) semanas de licencia remunerada de paternidad conforme a la Ley 2114 de 2021. La licencia opera por los hijos nacidos de su cónyuge o de su compañera permanente, y en casos de adopción. La licencia de paternidad se hará efectiva mediante la presentación del Registro Civil de Nacimiento en un plazo no mayor a 30 días posteriores a su expedición.</p>

  <h3>Art. 28° Licencia remunerada por luto</h3>
  <p>En caso de fallecimiento de su cónyuge, compañero o compañera permanente o de un familiar hasta el segundo grado de consanguinidad, primero de afinidad y primero civil, la empresa concederá una licencia remunerada por luto de cinco (5) días hábiles, de acuerdo con la Ley 1280 de 2009. El trabajador deberá presentar ante Recursos Humanos el certificado de defunción y documentos que demuestren el parentesco en los siguientes 30 días al hecho.</p>

  <h3>Art. 29° Licencia por endometriosis y condiciones de salud menstrual</h3>
  <p>De conformidad con la Ley 2466 de 2025, la empresa concederá permiso o licencia remunerada a las trabajadoras que sufran ciclos menstruales incapacitantes, endometriosis o síntomas severos, siempre y cuando esto sea certificado por un profesional médico o la entidad de salud prestadora (EPS). Esta licencia protegerá el derecho fundamental a la salud menstrual, impidiendo cualquier represalia o descuento.</p>

  <h3>Art. 30° Licencia para acompañamiento escolar obligatorio</h3>
  <p>La empresa concederá el tiempo necesario y prudencial como permiso remunerado, a los trabajadores que deban asistir a citaciones obligatorias escolares, reuniones de padres de familia y acompañamiento frente a procesos pedagógicos ineludibles de sus hijos menores de edad. Estos permisos deben ser acordados y demostrados oportunamente con la dirección de la empresa según la reforma laboral (Ley 2466/2025).</p>

  <h3>Art. 31° Permisos remunerados</h3>
  <p>En estricto cumplimiento de la ley laboral vigente y la Reforma Laboral (Ley 2466 de 2025), la empresa concederá obligatoriamente los permisos necesarios y remunerados en los siguientes eventos:</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Calamidad doméstica debidamente comprobada.</li>
    <li>Para asistir a <strong>citas médicas programadas</strong> (EPS, ARL, medicina prepagada, especialistas) y atención de urgencias médicas (tiempo estricto para cita y traslados).</li>
    <li>Para atender de forma ineludible <strong>diligencias judiciales o administrativas</strong>, o rendir declaratoria cuando sea requerido por autoridades competentes.</li>
    <li>Para desempeñar cargos oficiales transitorios de forzosa aceptación (ej: jurados de votación, el cual otorga 1 día compensatorio remunerado - Ley 163 de 1994).</li>
    <li>Para ejercer el derecho al sufragio en elecciones democráticas (otorga medio día compensatorio remunerado en los 30 días siguientes - Ley 163 de 1994).</li>
    <li>Para el cabal cumplimiento de comisiones sindicales (si aplica).</li>
    <li>Por contraer matrimonio (licencia de cinco (5) días hábiles remunerados, en concordancia con la protección a la familia avalada jurisprudencialmente).</li>
    <li>Por llegar al trabajo en bicicleta (otorga medio día remunerado por cada 30 veces certificadas, hasta 8 al año - Ley 1811 de 2016).</li>
  </ol>

  <h3>Art. 32° Permisos no remunerados y su procedimiento de solicitud</h3>
  <p>El empleador podrá otorgar, a su arbitrio y previa solicitud escrita, licencias no remuneradas para atender asuntos personales del trabajador que no estén contemplados en la ley como de forzosa concesión. La solicitud deberá presentarse con al menos cuarenta y ocho (48) horas de anticipación ante el superior inmediato, salvo fuerza mayor, quien aprobará según la necesidad del servicio. Durante estas licencias, el trabajador no devengará salario, no aportará el trabajador a salud, pero la empresa y el empleado continuarán pagando los aportes pensionales proporcionales si hubiere lugar a ello.</p>

  <h2>CAPÍTULO V — SALARIOS, PAGOS Y PRESTACIONES</h2>
  <h3>Art. 33° Salario mínimo legal vigente y salario convencional</h3>
  <p>El salario mínimo de los trabajadores será el establecido anualmente por el Gobierno Nacional de Colombia. Si existiere pacto colectivo o convención colectiva, regirán los mínimos allí establecidos. Constituye salario no solo la remuneración ordinaria fija o variable, sino todo lo que recibe el trabajador en dinero o en especie como contraprestación directa del servicio. Los viáticos accidentales, gastos de representación, beneficios extralegales estipulados por mero acto de liberalidad o con cláusula de no salarización, no constituyen salario.</p>

  <h3>Art. 34° Lugar, día, hora y período de pago</h3>
  <p>El pago de salarios se efectuará de manera puntual, sin excepción, a todos los trabajadores mediante <strong>{{forma_pago}}</strong> con una periodicidad de <strong>{{periodicidad_pago}}</strong>. El pago se hará directamente al trabajador o a quien él autorice por escrito. Cuando el día de pago pactado sea festivo o no laborable, el pago se anticipará al último día hábil anterior. La empresa deberá entregar el desprendible de pago detallando ingresos y deducciones.</p>

  <h3>Art. 35° Deducciones legalmente permitidas</h3>
  <p>La empresa solo podrá deducir, retener o compensar suma alguna del salario del trabajador por orden suscrita, escrita y expresa del trabajador, o por mandamiento judicial emitido por juez competente, o por mandato legal. Son retenciones obligatorias: los aportes del trabajador al Sistema de Seguridad Social Integral (Salud y Pensión), retención en la fuente (si aplica), multas disciplinarias legalmente impuestas por atrasos u omisiones al trabajo sin justificación, cuotas sindicales y cuotas alimentarias debidamente embargadas por un juez. En ningún caso las deducciones y embargos podrán afectar el salario mínimo legal, salvo por pensiones alimenticias o deudas con cooperativas, en cuyo caso solo se podrá afectar hasta el 50% de este.</p>

  <h3>Art. 36° Auxilio de transporte</h3>
  <p>Los trabajadores que devenguen hasta dos (2) veces el Salario Mínimo Mensual Legal Vigente (SMMLV) tendrán derecho al pago del auxilio de transporte fijado por el Gobierno Nacional, a menos que la empresa suministre el transporte de manera completa o que el trabajador resida en el lugar de trabajo, realice sus labores exclusivamente bajo modalidades de trabajo remoto (donde aplica auxilio de conectividad si corresponde), o cuando no trabaje por incapacidad médica o permisos personales continuados.</p>

  <h3>Art. 37° Cesantías, intereses y prima de servicios</h3>
  <p>La empresa reconocerá y liquidará las prestaciones sociales legales conforme a la norma:</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li><strong>Cesantías</strong>: un mes de salario por cada año de servicios y proporcional, consignadas al Fondo de Cesantías escogido por el trabajador a más tardar el 14 de febrero del año siguiente.</li>
    <li><strong>Intereses sobre cesantías</strong>: 12% anual sobre el saldo de las cesantías a diciembre 31, a pagar directo al trabajador a más tardar el 31 de enero del año siguiente.</li>
    <li><strong>Prima de servicios</strong>: correspondiente a un mes de salario anual, pagadero por mitades (hasta el 30 de junio y hasta el 20 de diciembre).</li>
  </ol>

  <h3>Art. 38° Prestaciones adicionales a las legales</h3>
  <p>Cualquier beneficio que la empresa entregue por mero acto de liberalidad, como bonificaciones ocasionales, auxilios para estudio, vivienda o transporte distinto al de ley, planes de medicina prepagada, primas extralegales, participaciones de utilidades, no constituyen factor salarial para la liquidación de prestaciones sociales ni seguridad social, de conformidad con el Art. 128 del CST.</p>

  <h2>CAPÍTULO VI — SEGURIDAD Y SALUD EN EL TRABAJO</h2>
  <h3>Art. 39° Política de SST</h3>
  <p>La empresa declara su férreo compromiso con el diseño, implementación, mantenimiento y mejora continua del Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST), de conformidad con el Decreto 1072 de 2015, Resolución 0312 de 2019 y leyes subsiguientes. El bienestar físico, mental y social de nuestros trabajadores es el principal activo de nuestra operación. Las normativas sobre SST son de obligatorio cumplimiento por parte de todos los contratistas, personal interno y visitantes.</p>

  <h3>Art. 40° Obligaciones del empleador en SST</h3>
  <p>Son obligaciones irrenunciables del empleador:</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Procurar el cuidado integral de la salud de los trabajadores y los ambientes de trabajo.</li>
    <li>Afiliar obligatoriamente a todos los trabajadores a la ARL, EPS y Fondo de Pensiones, asumiendo su costo conforme a la ley.</li>
    <li>Identificar peligros, evaluar y valorar los riesgos (Matriz IPEVAR) y establecer los controles para mitigarlos.</li>
    <li>Suministrar y reponer oportunamente todos los Elementos de Protección Personal (EPP) y ropa de trabajo.</li>
    <li>Garantizar las inducciones y reinducciones en materia de prevención de riesgos.</li>
    <li>Diseñar y ensayar los planes de emergencia y brigadas.</li>
  </ol>

  <h3>Art. 41° Obligaciones del trabajador en SST</h3>
  <p>El trabajador está legalmente obligado a:</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Procurar el cuidado integral de su salud en todo momento.</li>
    <li>Suministrar información clara, veraz y completa sobre su estado de salud (tanto en el examen médico de ingreso, como en los periódicos y de egreso). Ocultar patologías preexistentes de mala fe constituirá falta disciplinaria grave.</li>
    <li>Reportar inmediatamente (y a más tardar dentro del turno de trabajo en que ocurre) cualquier incidente o accidente de trabajo, y notificar las enfermedades laborales apenas sean dictaminadas, bajo pena de sanciones.</li>
    <li>Cumplir celosamente con las normas, reglamentos e instrucciones del SG-SST.</li>
    <li>Informar oportunamente al empleador acerca de los peligros y riesgos latentes en su puesto de trabajo.</li>
    <li>Participar proactivamente en las actividades de capacitación en SST.</li>
    <li>Utilizar adecuada y obligatoriamente las dotaciones, maquinaria y los EPP asignados.</li>
  </ol>
  <p>El incumplimiento de estas normas se califica como falta grave y puede ser justa causa de terminación del contrato.</p>

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
  <p>Con el fin de garantizar condiciones de trabajo seguras y en concordancia con la Resolución 089 de 2019 (Política integral para la prevención y atención del consumo de sustancias psicoactivas), está terminantemente prohibido para todo el personal presentarse al lugar de trabajo bajo el efecto del alcohol, sustancias psicoactivas o medicamentos no recetados que afecten el desempeño seguro, así como consumir, poseer o comercializar los mismos durante la jornada laboral. La empresa promoverá campañas de prevención y estilos de vida saludables. La empresa podrá realizar pruebas preventivas de alcoholimetría o sustancias (respetando la dignidad del trabajador). La negativa injustificada a practicarse la prueba o el resultado positivo constituyen falta grave que acarrea suspensión o terminación del contrato con justa causa.</p>

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
  <p>Son obligaciones especiales del empleador (Art. 57 CST):</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Poner a disposición los instrumentos y materias primas necesarios.</li>
    <li>Proveer locales apropiados y elementos contra accidentes.</li>
    <li>Prestar primeros auxilios.</li>
    <li>Pagar el salario, prestaciones y aportes a seguridad social a tiempo.</li>
    <li>Guardar absoluto respeto a la dignidad del trabajador, sus creencias y sentimientos.</li>
    <li>Conceder las licencias necesarias remuneradas y no remuneradas de ley.</li>
    <li>Cumplir el reglamento interno y garantizar la desconexión laboral, y prevenir acoso laboral, acoso sexual, garantizando la salud mental de todos.</li>
  </ol>

  <h3>Art. 57° Prohibiciones especiales al EMPLEADOR</h3>
  <p>El empleador tiene prohibido (Art. 59 CST):</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Deducir, retener o compensar sumas de salarios sin autorización clara del trabajador.</li>
    <li>Obligar a compras de mercancías o alimentos de comercios del empleador.</li>
    <li>Exigir dinero o regalos para ser admitido o promocionado en el cargo.</li>
    <li>Limitar el derecho a asociarse o pertenecer a sindicatos (Pacto Colectivo forzado).</li>
    <li>Imponer a los trabajadores obligaciones religiosas o políticas.</li>
    <li>Autorizar o tolerar el porte o uso de drogas y alcohol durante el trabajo, coaccionar, o generar acoso en cualquiera de sus manifestaciones.</li>
    <li>Desconocer el derecho a la desconexión digital de sus subordinados.</li>
  </ol>

  <h3>Art. 58° Obligaciones especiales de LOS TRABAJADORES</h3>
  <p>Son deberes del trabajador (Art. 58 CST):</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Cumplir estrictamente sus obligaciones y el presente reglamento.</li>
    <li>Suministrar información clara, veraz y completa sobre su estado de salud, tanto en los exámenes médicos ocupacionales de ingreso como en los periódicos, sin ocultar condiciones preexistentes que puedan agravarse o ser incompatibles con su labor (Decreto 1072/2015).</li>
    <li>Guardar rigurosa moral y absoluto respeto en todas sus relaciones con sus superiores y compañeros, absteniéndose de cualquier acto de violencia o riña.</li>
    <li>Conservar y restituir en buen estado las herramientas, maquinaria e instrumentos asignados.</li>
    <li>Prestar la colaboración posible en casos de siniestro o riesgo inminente.</li>
    <li>Guardar el secreto y confidencialidad comercial e industrial y de los asuntos estrictamente técnicos o que puedan causar perjuicios.</li>
    <li>Acatar las órdenes y medidas dadas para la seguridad y la prevención en SST.</li>
    <li>Respetar y velar por los derechos a la desconexión digital de sus pares y subordinados.</li>
  </ol>

  <h3>Art. 59° Prohibiciones especiales a LOS TRABAJADORES</h3>
  <p>Está estrictamente prohibido a los trabajadores (Art. 60 CST y demás):</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li>Sustraer de las instalaciones útiles, materia prima o productos sin permiso.</li>
    <li>Presentarse al trabajo bajo el influjo de alcohol, sustancias psicoactivas o estupefacientes, así como consumirlos dentro de las instalaciones o durante el desarrollo de sus funciones.</li>
    <li>Promover o participar en riñas, peleas, agresiones físicas o verbales contra compañeros de trabajo, superiores, subalternos o terceros dentro o fuera de las instalaciones si afecta la imagen corporativa.</li>
    <li>Portar armas de cualquier especie durante el trabajo.</li>
    <li>Disminuir intencionalmente el ritmo de trabajo o promover huelgas ilegales.</li>
    <li>Faltar al trabajo, llegar reiteradamente tarde o abandonar el cargo en horas de servicio sin justa causa comprobada o sin permiso expreso del empleador.</li>
    <li>Usar los útiles de la empresa en asuntos distintos al trabajo asignado.</li>
    <li>Incurrir en conductas que representen acoso laboral, discriminación de género o cualquier modalidad de acoso sexual sobre compañeros o terceros.</li>
  </ol>

  <h2>CAPÍTULO IX — RÉGIMEN DISCIPLINARIO</h2>
  <h3>Art. 60° Principios rectores</h3>
  <p>El régimen disciplinario está basado en el respeto del Debido Proceso Constitucional y las garantías estipuladas en la Reforma Laboral (Ley 2466 de 2025). Toda investigación y sanción interna estará orientada por los principios ineludibles de: Dignidad Humana, Presunción de Inocencia, <em>In dubio pro disciplinado</em> (toda duda razonable favorecerá al trabajador), Imparcialidad, Legalidad (la falta debe estar expresamente descrita), Tipicidad, Proporcionalidad a la gravedad de la falta, y Non bis in ídem (nadie puede ser sancionado dos veces por el mismo hecho).</p>

  <h3>Art. 61° Escala de FALTAS LEVES</h3>
  <p>Constituyen faltas de menor magnitud e impacto, que entorpecen la operación pero no destruyen la confianza del empleador, tales como:</p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px;">
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: center; width: 10%;">#</th>
        <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: left;">Descripción de la Falta Leve</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">1</td><td style="padding: 10px; border: 1px solid #e0e0e0;">Retardos injustificados inferiores a 15 minutos al iniciar la jornada.</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">2</td><td style="padding: 10px; border: 1px solid #e0e0e0;">Fallar por primera vez en la utilización completa de los elementos de dotación (sin ser EPP crítico).</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">3</td><td style="padding: 10px; border: 1px solid #e0e0e0;">Errores operativos leves y corregibles que no generen pérdidas económicas notables.</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">4</td><td style="padding: 10px; border: 1px solid #e0e0e0;">Exceder los tiempos fijados para descansos sin autorización.</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">5</td><td style="padding: 10px; border: 1px solid #e0e0e0;">Distraer a sus compañeros de labores y conversar en exceso afectando el rendimiento.</td></tr>
    </tbody>
  </table>

  <h3>Art. 62° Escala de FALTAS GRAVES</h3>
  <p>Se considerarán faltas graves todas las enumeradas en el Art. 62 del CST como justas causas para terminación de contrato, y de manera enunciativa:</p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px;">
    <thead>
      <tr style="background-color: #fff0f0;">
        <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: center; width: 10%;">#</th>
        <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: left;">Descripción de la Falta Grave (Causal de Despido)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">1</td><td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Abandono de cargo y ausentismo:</strong> Faltar al trabajo sin justa causa o permiso previo, constituyendo falta grave desde el primer evento o la sumatoria de fracciones de jornada.</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">2</td><td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Sustancias psicoactivas y alcohol:</strong> Presentarse a laborar bajo el influjo de alcohol, sustancias psicoactivas o medicamentos no formulados que alteren el desempeño, así como consumirlos durante la jornada o negarse injustificadamente a una prueba de tamizaje, por la afectación directa a la seguridad industrial.</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">3</td><td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Agresiones y riñas:</strong> Promover, participar o incitar riñas, peleas, agresiones físicas, verbales, insultos o alteraciones graves del orden público dentro de las instalaciones contra compañeros, superiores o terceros.</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">4</td><td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Ocultamiento de estado de salud:</strong> La omisión dolosa, falsedad o el ocultamiento intencional de información sobre el estado real de salud preexistente durante exámenes médicos ocupacionales de ingreso o periódicos, cuando dicha condición sea incompatible con el cargo o ponga en riesgo la operación.</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">5</td><td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Reincidencia y mala fe:</strong> La acumulación sistemática de tres (3) o más faltas leves (llamados de atención o amonestaciones) en un período de seis (6) meses, tipificándose automáticamente como indisciplina grave reiterativa que resquebraja la confianza.</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">6</td><td style="padding: 10px; border: 1px solid #e0e0e0;">Fraude, falsificación de firmas o manipulación de registros y certificados (incapacidades falsas, marcaciones de tiempos inexistentes).</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">7</td><td style="padding: 10px; border: 1px solid #e0e0e0;">Violación del secreto industrial y de la confidencialidad de la información (Ley 1581/2012).</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">8</td><td style="padding: 10px; border: 1px solid #e0e0e0;">Negativa obstinada a someterse a medidas preventivas, normas SST y el no uso de EPP para actividades de alto riesgo (ej. alturas).</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">9</td><td style="padding: 10px; border: 1px solid #e0e0e0;">Cualquier manifestación o queja ratificada de acoso sexual o acoso laboral con componente lesivo, acoso digital y agresión física, o maltrato a la mujer o comunidades diversas.</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">10</td><td style="padding: 10px; border: 1px solid #e0e0e0;">La desobediencia manifiesta al derecho a la desconexión laboral de sus subordinados causando coacción y hostigamiento.</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">11</td><td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Uso indebido de TIC:</strong> Utilizar los recursos tecnológicos, correos electrónicos, redes o internet de la empresa para fines ilícitos, acceder a contenido inapropiado, descargar software no licenciado (pirata) o malicioso que comprometa la seguridad de la información corporativa.</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">12</td><td style="padding: 10px; border: 1px solid #e0e0e0;"><strong>Conflicto de intereses y Competencia Desleal:</strong> Realizar, directa o indirectamente, actividades paralelas o negocios personales que compitan con la empresa durante la vigencia del contrato, así como usar su tiempo de la jornada laboral para lucrarse externamente.</td></tr>
    </tbody>
  </table>

  <h3>Art. 63° Escala de SANCIONES DISCIPLINARIAS</h3>
  <p>Dependiendo de la gravedad de la falta y los agravantes o atenuantes hallados en la investigación, la empresa podrá imponer progresivamente las siguientes sanciones:</p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px;">
    <thead>
      <tr style="background-color: #fff3cd;">
        <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: center; width: 10%;">Nivel</th>
        <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: left;">Sanción Disciplinaria Aplicable</th>
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
  <p>De conformidad con el Artículo 113 del CST, las multas se aplicarán exclusivamente cuando el trabajador, sin excusa suficiente, llegue tarde a sus labores, o falte al trabajo (ausentismo). Esta multa no puede en ningún caso, ni en repetidas oportunidades, exceder de la quinta (1/5) parte del salario de un (1) día de la cuota ordinaria de nómina; y la suma recaudada se destinará exclusivamente al rubro de bienestar o estímulo que beneficie a todos los trabajadores.</p>

  <h3>Art. 65° PROCEDIMIENTO DISCIPLINARIO (BLINDAJE DEL DEBIDO PROCESO)</h3>
  <p>En estricto apego a la Reforma Laboral (Ley 2466 de 2025) que modifica el Artículo 115 del CST, y la Sentencia C-593 de 2014, para evitar nulidades sancionatorias la empresa garantiza el siguiente protocolo ineludible de siete (7) pasos:</p>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li style="margin-bottom: 10px;"><strong>Apertura Formal e Investigación:</strong> Recolección imparcial de pruebas (documentales, testimoniales, cámaras de seguridad o auditorías TIC) antes de tomar cualquier decisión.</li>
    <li style="margin-bottom: 10px;"><strong>Citación a Descargos:</strong> Notificación formal y escrita al trabajador indicando de manera expresa y detallada los hechos, conductas u omisiones investigadas, así como las normas del RIT o CST posiblemente infringidas.</li>
    <li style="margin-bottom: 10px;"><strong>Traslado de Pruebas y Plazo de Defensa:</strong> Con la citación, se entregará copia íntegra de todas las pruebas que obran en su contra. Se le otorgará al trabajador un período no inferior a <strong>cinco (5) días</strong> para preparar y presentar su defensa, controvertir las pruebas allegadas y aportar las suyas.</li>
    <li style="margin-bottom: 10px;"><strong>Audiencia de Descargos y Acompañamiento:</strong> El trabajador expondrá su versión verbal o escrita. Tiene derecho a ser asistido por dos (2) compañeros de trabajo o representante del sindicato. Si los descargos son verbales, se levantará obligatoriamente un acta que transcriba lo expresado, la cual será firmada por los asistentes.</li>
    <li style="margin-bottom: 10px;"><strong>Valoración Imparcial:</strong> El ente encargado analizará las pruebas y descargos basándose en el principio de <em>in dubio pro disciplinado</em> y la proporcionalidad de la sanción.</li>
    <li style="margin-bottom: 10px;"><strong>Fallo Motivado y Notificación:</strong> Comunicación escrita fundamentando de manera clara, fáctica y jurídica la decisión de absolución, sanción menor o despido con justa causa.</li>
    <li><strong>Doble Instancia (Recursos de Ley):</strong> Se otorgará un plazo de cinco (5) días hábiles tras la notificación del fallo para que el trabajador interponga los recursos de reposición y apelación. La apelación será resuelta por el superior jerárquico de quien impuso la sanción, garantizando la doble instancia constitucional.</li>
  </ol>

  <h3>Art. 66° Cargos con facultad sancionatoria</h3>
  <p>Estarán facultados directa y expresamente para citar a descargos, dirigir la audiencia y resolver la imposición de las sanciones disciplinarias hasta por despido de justa causa, los siguientes cargos dentro de la estructura empresarial:</p>
  <p><strong>Cargos facultados:</strong><br>
  {{cargos_sancionatorios}}</p>
  <p>Toda sanción superior a amonestación verbal deberá constar en copia en el expediente laboral del trabajador reposado en Gestión Humana o la dependencia correspondiente.</p>

  <h3>Art. 67° Término de prescripción para aplicar sanciones</h3>
  <p>El empleador perderá toda facultad y caducará la potestad disciplinaria para investigar y sancionar faltas de los trabajadores, si dentro de los tres (3) meses siguientes al conocimiento efectivo de la ocurrencia del hecho, no ha citado formalmente a descargos o impuesto la sanción correspondiente, tal como lo regula el Código Sustantivo del Trabajo.</p>

  <h2>CAPÍTULO X — PREVENCIÓN DEL ACOSO LABORAL (Ley 1010/2006)</h2>
  <h3>Art. 68° Política de cero tolerancia al acoso laboral</h3>
  <p>En concordancia con la Constitución Política, la Ley 1010 de 2006 y normativas vigentes del Ministerio del Trabajo, la empresa adopta una política de cero tolerancia frente a toda práctica de acoso laboral, discriminación y maltrato. Garantizamos a todos los trabajadores el derecho a un ambiente libre de violencia en el que se respete la salud mental, la dignidad y el derecho al trabajo en condiciones justas.</p>

  <h3>Art. 69° Definición, modalidades y conductas constitutivas de acoso laboral</h3>
  <p>Se entiende por Acoso Laboral toda conducta persistente y demostrable, ejercida sobre un empleado por parte de un empleador, un jefe o superior jerárquico inmediato o mediato, un compañero de trabajo o un subalterno, encaminada a infundir miedo, intimidación, terror y angustia, a causar perjuicio laboral, generar desmotivación en el trabajo, o inducir la renuncia del mismo. Sus modalidades incluyen: maltrato, persecución, discriminación, entorpecimiento, inequidad y desprotección laboral.</p>

  <h3>Art. 70° Comité de Convivencia Laboral</h3>
  <p>Para la prevención y atención integral del acoso laboral y de factores de riesgo psicosocial intra-laboral, la empresa, siguiendo los mandatos de la Resolución 3461 de 2025 y Resolución 652 de 2012, instalará un Comité de Convivencia Laboral (COCOLAB) bipartito compuesto por igual número de representantes del empleador y de los trabajadores. Sesionará ordinariamente de forma trimestral y extraordinariamente ante quejas graves y urgentes, custodiando las actas y manteniendo reserva absoluta.</p>

  <h3>Art. 71° Procedimiento confidencial de quejas por acoso laboral</h3>
  <p>La presunta víctima podrá presentar su queja escrita con evidencias sumarias al correo o buzón confidencial dispuesto para el COCOLAB, detallando los hechos, modo, tiempo y lugar, así como testigos o soportes. El Comité iniciará el protocolo conciliatorio en término expedito convocando a las partes y agotará todos los canales del diálogo constructivo. Si no hay acuerdo o si se incumple la conciliación, el caso será remitido al fuero disciplinario de la empresa y/o Ministerio de Trabajo.</p>

  <h3>Art. 72° Sanciones disciplinarias internas por acoso laboral</h3>
  <p>Cuando un proceso disciplinario logre demostrar, previa conciliación fallida o por reiteración comprobada, que un empleado en su trato hostil y deliberado incurre en Acoso Laboral, la empresa, en estricto cumplimiento del Código Sustantivo del Trabajo, y de acuerdo con el impacto sobre el clima organizacional, impondrá las medidas correctivas aplicables desde la amonestación escrita hasta la terminación de contrato con Justa Causa (Falta Grave), previo dictamen garantizado con el debido proceso.</p>

  <h3>Art. 73° Mecanismos de protección al denunciante</h3>
  <p>Conforme a la ley, a fin de evitar represalias contra quienes formulen peticiones, quejas y reclamos de Acoso Laboral o sirvan de testigos en dichos procedimientos, no podrá terminarse el contrato de trabajo ni rebajar los salarios, desmejorar sus labores o aplicar traslados intempestivos sin justa causa comprobada del trabajador quejoso en los seis (6) meses siguientes a la presentación de la queja debidamente fundamentada.</p>

  <h2>CAPÍTULO XI — PREVENCIÓN DEL ACOSO SEXUAL (Ley 2365/2024)</h2>
  <h3>Art. 74° Política de prevención y cero tolerancia al acoso sexual</h3>
  <p>De conformidad con los mandatos de la Ley 2365 de 2024 y convenios internacionales OIT ratificados, la empresa manifiesta el rechazo absoluto frente a cualquier manifestación de acoso sexual laboral, hostigamiento con fines no consentidos de orden sexual y toda forma de agresión o violencia de género. El entorno de trabajo se regirá por la total indemnidad sexual y el respeto integral de los derechos humanos y sexuales de la planta de personal.</p>

  <h3>Art. 75° Definición de acoso sexual</h3>
  <p>El acoso sexual consiste en todo acto, conducta o comportamiento no deseado de naturaleza o connotación sexual que cause incomodidad, humillación o intimidación a quien lo recibe, cuando dicho acto ocurra en el marco o con ocasión del trabajo, bien sea de forma verbal, física, visual, no verbal, a través de plataformas digitales o fuera de las instalaciones si existe conexión laboral, sea o no ejercido bajo asimetrías de poder.</p>

  <h3>Art. 76° Alcance</h3>
  <p>Las disposiciones y protecciones de este capítulo y de las rutas de prevención de Acoso Sexual aplican imperativamente sobre la totalidad de empleados formales, practicantes, contratistas de prestación de servicios, trabajadores en misión, aprendices SENA, proveedores regulares y pasantes, sin perjuicio de la tercerización e intermediación.</p>

  <h3>Art. 77° Protocolo de denuncia</h3>
  <p>Se dispondrá de un canal especializado y reservado que garantice el anonimato si lo desea la víctima. En ninguna circunstancia se podrá citar a la víctima y al presunto agresor a escenarios de careo o conciliación para casos de acoso sexual. El protocolo actuará con celeridad aislando a la víctima de espacios o cercanía directa con el presunto acosador dictando medidas de urgencia preventivas sin vulnerar su dignidad.</p>

  <h3>Art. 78° Protección al denunciante</h3>
  <p>Las víctimas de presunto acoso sexual laboral gozan de estabilidad laboral reforzada temporal garantizada por la ineficacia del despido que ocurra en los seis (6) meses posteriores a la queja. Adicionalmente, el empleador está en la obligación de no aplicar descuentos, suspensiones, cambios intempestivos de sede o de subordinación que menoscaben sus derechos mientras se emita una decisión o investigación penal en curso.</p>

  <h3>Art. 79° Obligación de reporte semestral al SIVIGE</h3>
  <p>La empresa, bajo su deber estatutario derivado de la Ley 2365 de 2024, deberá rendir informes y reportes semestrales y estadísticos rigurosos sobre quejas y atenciones de presuntos casos de Acoso Sexual Laboral al Sistema Integrado de Información de Violencias de Género (SIVIGE) conservando el blindaje e intimidad de la identidad de la víctima, cumpliendo las inspecciones y auditorías requeridas por el Ministerio del Trabajo.</p>

  <h3>Art. 80° Sanciones por acoso sexual comprobado</h3>
  <p>Una vez agotado el trámite investigativo disciplinario con plena garantía constitucional, en caso de dictamen contundente por materialidad probatoria e indicial en actos de Acoso Sexual Laboral, se aplicará invariablemente la sanción máxima correspondiente a Despido Unilateral y Directo por Justa Causa legal tipificado como Falta Grave, sin desmedro del traslado del caso a las autoridades de justicia penal ordinaria (Fiscalía General de la Nación).</p>

  <h2>CAPÍTULO XII — MECANISMOS DE RECLAMO Y PETICIONES</h2>
  <h3>Art. 81° Persona(s) designada(s) para recibir reclamos</h3>
  <p>Cualquier reclamo o petición no asociada con procesos de acoso, concerniente a dotaciones, cálculos de liquidación, clima o procesos administrativos debe dirigirse al superior inmediato, y si la complejidad lo amerita, al responsable de Gestión Humana o en su defecto a la Gerencia General de la empresa. Ninguna otra instancia carente de autorización tiene poder vinculante para recibir u otorgar respuestas jurídicas a solicitudes laborales.</p>

  <h3>Art. 82° Procedimiento de atención a reclamos</h3>
  <p>El reclamo deberá presentarse preferiblemente de forma escrita y razonada, anexando las pruebas o justificaciones. El área encargada tendrá la obligación de dictar respuesta de fondo, integral, y congruente dentro del término máximo de quince (15) días hábiles siguientes a la radicación. Aquellos casos atípicos podrán solicitar al trabajador una prórroga por escrito antes del vencimiento del primer lapso, que no excederá el doble del mismo.</p>

  <h3>Art. 83° Derecho a asesorarse del sindicato respectivo</h3>
  <p>En garantía del derecho de asociación y fuero sindical consagrados legalmente en los casos en los que opere una asociación de trabajadores formal dentro de la empresa, todo empleado que eleve o adelante un proceso de queja, petición o proceso disciplinario y que haga parte oficial del sindicato tendrá derecho a solicitar el acompañamiento expreso de los directivos sindicales para velar por su debido proceso sin lugar a rechazo de la compañía.</p>

  <h3>Art. 84° Quejas ante el Inspector de Trabajo</h3>
  <p>Cualquier trabajador que considere que tras haber agotado el conducto regular y las instancias corporativas de respuesta y reclamo interno, subsisten violaciones directas a sus fueros y garantías sustantivas contempladas en la Constitución o el contrato, podrá, sin recibir sanción posterior de esta corporación por ese hecho, dirigirse a las inspecciones del Ministerio del Trabajo para intermediación y querella de sus derechos irrenunciables.</p>

  <h2>CAPÍTULO XIII — PROTECCIÓN A GRUPOS CON ESTABILIDAD REFORZADA</h2>
  <h3>Art. 85° Mujer embarazada y madre lactante</h3>
  <p>Como mecanismo garantista frente a la discriminación laboral, se protege la especial maternidad. Se requiere calificación del Inspector del Trabajo con justa causa previamente valorada si se pretendiese dar de baja del cuadro de empleados a trabajadoras gestantes y en periodo de lactancia. La empresa acondicionará un espacio privado e higiénico como "Sala Amiga de la Familia Lactante" aplicable si fuere pertinente según los aforos, la ley o convenios, así como pausas de descanso especiales.</p>

  <h3>Art. 86° Trabajadores con discapacidad</h3>
  <p>Es política expresa y constitucional la no discriminación del ingreso a personas por motivo de su discapacidad física o mental dictaminada, debiendo el empleador garantizar los ajustes razonables requeridos para desarrollar la actividad del empleado. Queda proscrito el despido motivado exclusivamente por una discapacidad, ya que el mismo generaría como corolario legal la ineficacia del despido, el reintegro, y el resarcimiento indemnizatorio punitivo de 180 días de salario mínimo exigido por la Ley 361 de 1997 y 1618 de 2013.</p>

  <h3>Art. 87° Cuota de vinculación de personas con discapacidad</h3>
  <p>Las empresas, dependiendo de la cantidad total de su nómina, se obligarán formalmente, amparados por los estatutos de igualdad de oportunidades y vinculación equitativa para la inclusión laboral que demanda la normativa, a cumplir imperativamente con los porcentajes y cuotas legales de contratación para la empleabilidad del talento diverso, favoreciendo preferentemente el mérito.</p>

  <h3>Art. 88° Fuero sindical</h3>
  <p>Garantía de la cual gozan ciertos trabajadores a no ser despedidos ni desmejorados en sus condiciones de trabajo, ni trasladados a otros establecimientos de la misma empresa sin justa causa debidamente comprobada y autorizada por la autoridad u órgano competente. La protección del fuero abarca fundadores, adherentes, miembros y la junta directiva o subdirectiva de acuerdo con las cifras y porcentajes avalados en el CST y la Ley.</p>

  <h3>Art. 89° Personas próximas a pensionarse (prepensionados)</h3>
  <p>Todo servidor corporativo o colaborador del que conste fehacientemente y certifique a la compañía estar en el rango máximo de 36 meses previos de causar las edades, semanas y requerimientos pensionales dictaminados en los fondos formales del Estado, ostentará estabilidad laboral reforzada (fuero de prepensionados). La compañía blindará su contrato como garantía para el acceso al derecho vital que materializará su jubilación sin interrumpir los aportes definitivos.</p>

  <h3>Art. 90° Víctimas del conflicto armado</h3>
  <p>El empleador velará por las garantías legales de empleo formal, de conformidad con lo instituido por el gobierno nacional, otorgando prioridad, no discriminación en procesos de selección y apoyo psicosocial e incentivos tributarios para los colombianos reportados y ratificados con el certificado de inscripción en el Registro Único de Víctimas (RUV), implementando espacios de memoria constructiva en la política corporativa de sostenibilidad y convivencia.</p>

  <h2>CAPÍTULO XIV — POLÍTICA DE SALUD MENTAL</h2>
  <h3>Art. 91° Declaración de compromiso con la salud mental</h3>
  <p>La empresa comprende la salud mental como el estado de bienestar integral donde el empleado es consciente de sus capacidades laborales, afronta el estrés natural del trabajo, contribuye productivamente y actúa constructivamente de acuerdo a la Ley 1616 de 2013 y Resolución 2404 de 2019. Declaramos la salud mental como un eje fundamental, promoviendo espacios sin saturación emocional y la erradicación de conductas nocivas.</p>

  <h3>Art. 92° Programa de Bienestar Mental</h3>
  <p>Como cumplimiento a la Ley 2396 de 2024, implementamos campañas y espacios del programa de Bienestar Mental intra-laboral para la prevención del estrés crónico, el 'Síndrome de Burnout', y los conflictos humanos interpersonales. Se priorizarán las pausas activas físicas y cognitivas obligatorias y talleres de capacitación para directivos que aborden inteligencia emocional y fortalecimiento de liderazgos humanos sin violencia.</p>

  <h3>Art. 93° Factores de riesgo psicosocial a controlar</h3>
  <p>El empleador asume el deber de aplicar anualmente (o según la periodicidad impuesta por resultados previos de alto o mediano riesgo) la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial exigida por la normatividad del Ministerio. Las conclusiones permitirán que el empleador ajuste las demandas ambientales y carga física, mejore las recompensas organizacionales, flexibilice liderazgos autoritarios e incremente la participación de los empleados en la gestión del cambio.</p>

  <h3>Art. 94° Confidencialidad del diagnóstico</h3>
  <p>Ningún empleado puede ser presionado a revelar sus antecedentes terapéuticos en salud mental o terapias y asistencia psicológica salvo para trámites debidos de licencias incapacitantes radicadas vía EPS y la reserva de su historia ocupacional, de modo que queda estrictamente tipificado como falta calificada muy grave a quienes divulguen diagnósticos de salud mental para acoso sistemático, burlas, o ser usados como argumentos dolosos de despido encubierto.</p>

  <h3>Art. 95° Articulación con el SG-SST</h3>
  <p>Los programas, la vigilancia epidemiológica psicosocial (SVE), encuestas cualitativas, atención inicial, derivación, y control de las patologías conexas al desgaste corporativo y mental serán plenamente abarcados por el presupuesto y metas exigibles desde la Responsabilidad de la dirección técnica del Sistema de Gestión de SST con el pleno auxilio científico o financiero y en acompañamiento concurrente con las administradoras de riesgos laborales (ARL).</p>

  <h2>CAPÍTULO XV — PROTOCOLO DE ACOSO LABORAL — RUTA COMPLETA</h2>
  <h3>Art. 96° Definición y modalidades de acoso laboral</h3>
  <p>Según lo reglado, todo trabajador que considere ser afectado por agresiones sistemáticas que entorpezcan sus labores y dañen su patrimonio psicológico, en los términos estipulados de la Ley 1010 de 2006, interpondrá y accionará el siguiente protocolo especial de solución diseñado de manera neutral.</p>

  <h3>Art. 97° El Comité de Convivencia Laboral (COCOLAB)</h3>
  <p>Para activar el protocolo será receptora de la querella directa el COCOLAB, ente autónomo al interior de la compañía constituido equitativamente por actores, el cual tendrá independencia procedimental, que de forma neutral buscará con enfoque conciliatorio e instructivo desescalar el conflicto sin llegar a imposiciones sancionatorias o coacciones de fondo que no rebasen su propio fuero estipulado para la convivencia y amparo social.</p>

  <h3>Art. 98° RUTA INTERNA — Protocolo paso a paso</h3>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li style="margin-bottom: 5px;"><strong>Recepción y Admisión:</strong> Llegada de queja o remisión directa para análisis preliminar.</li>
    <li style="margin-bottom: 5px;"><strong>Audiencias aisladas:</strong> Escucha confidencial, privada e imparcial en sesión del comité tanto al presunto agresor como al querellante.</li>
    <li style="margin-bottom: 5px;"><strong>Conciliación y Pacto:</strong> Audiencia conjunta dirigida por un mediador (del comité) tendiente a construir espacios de perdón, no repetición y acuerdos.</li>
    <li style="margin-bottom: 5px;"><strong>Seguimiento:</strong> Monitoreo de cumplimiento del pacto y evaluación bimestral.</li>
    <li><strong>Traslado:</strong> En el escenario del fracaso total del diálogo, remisión directa del caso a Gerencia, o entes de fuero disciplinario corporativo e inspectores del Ministerio para aplicación de medidas sancionatorias a los culpables.</li>
  </ol>

  <h3>Art. 99° Prohibición de represalias</h3>
  <p>Los trabajadores denunciantes y todos aquellos que presten auxilio testifical al proceso de comité o querellas oficiales y sean citados a rendir testimonio de acoso estarán protegidos por una garantía ineludible de indemnidad. Cualquier venganza, destitución, presión o censura se declarará inválida frente al código sustantivo por el término mínimo legal de los seis (6) meses post-queja.</p>

  <h3>Art. 100° Medidas de protección inmediata</h3>
  <p>El comité u órgano evaluador de contingencia recomendará como carácter perentorio suspender de las dependencias, reubicar puestos, variar horarios de servicio, alternar esquemas del sistema o teletrabajo de urgencia a las víctimas a fin de extinguir inminentes acercamientos nocivos y salvaguardar la vida y sanidad integral del afectado, evitando revictimización bajo escenarios adversos prolongados.</p>

  <h2>CAPÍTULO XVI — PROTOCOLO DE ACOSO SEXUAL — RUTA COMPLETA</h2>
  <h3>Art. 101° Definición legal de acoso sexual</h3>
  <p>Es acoso sexual toda aproximación forzosa, solicitudes de favores carnales y sexuales o asedios indeseados y graves. Para que se consolide, según las pautas formales legales, su naturaleza será repetitiva, en un ejercicio perverso del poder (horizontal o vertical) que amilane e indigne, condicionando decisiones vinculantes del puesto o generando un ambiente grosero.</p>

  <h3>Art. 102° Conductas constitutivas de acoso sexual</h3>
  <p>Expresamente a nivel laboral comprende pero no se limita a: chantajes de ascensos o conservaciones de vacantes supeditadas al sometimiento erótico; roces corporales no solicitados; tocamientos; acoso digital o cibernético; envío de imágenes con contenido gráfico explícito o chistes humillantes, invitaciones obsesivas denegadas explícitamente y acosos sistemáticos sexistas que rompan barreras sanas de la inter-relación corporativa general.</p>

  <h3>Art. 103° Inconciliabilidad del acoso sexual</h3>
  <p>En acatamiento irrestricto de la resolución marco 3461 de 2025 de las autoridades ministeriales del trabajo y sentencias supremas jurisprudenciales, el ACOSO SEXUAL es delito de carácter reprochable y un factor lesivo mayúsculo que <strong>NUNCA ES SUSCEPTIBLE DE CONCILIACIÓN</strong> ni abordaje en procesos paritarios ante el COCOLAB, o amigables componedores, pasando su conocimiento de forma prioritaria al resorte gerencial sancionador supremo, entidades de género y fiscales.</p>

  <h3>Art. 104° RUTA INTERNA DE ATENCIÓN — Protocolo paso a paso</h3>
  <ol style="margin-left: 20px; margin-bottom: 15px; line-height: 1.6;">
    <li style="margin-bottom: 5px;"><strong>Prevención e Inicio rápido:</strong> Alerta confidencial reportada al alto mando con copia a SST o dependencia habilitada en la empresa.</li>
    <li style="margin-bottom: 5px;"><strong>Separación Cautelar de Riesgo:</strong> Concesión de permiso remunerado y distanciamiento preventivo al denunciante y presunto asaltante.</li>
    <li style="margin-bottom: 5px;"><strong>Trámite de Averiguación Disciplinaria Expedita:</strong> Evaluación rigurosa sin confrontar a la presunta víctima con el ofensor.</li>
    <li style="margin-bottom: 5px;"><strong>Decisión Plena Causal:</strong> Expulsión y desvinculación justificada inminente en caso de confirmación fáctica y sólida.</li>
    <li><strong>Copia Penal:</strong> Traspaso inmediato del historial sin ocultamientos para denuncia penal del implicado ante la Fiscalía y sus dependencias.</li>
  </ol>

  <h3>Art. 105° REPORTE AL SIVIGE</h3>
  <p>El área de Talento Humano o la Gerencia informará debida, formal, estadística y documentadamente mediante la estructura, codificación de causas, cargos y atenuantes, exigida bajo control perentorio semestral a las plataformas en línea impuestas por la legislación de la república como el Sistema Integrado SIVIGE y otros canales, para los rastreos macro del observatorio gubernamental que compila los incidentes de violencia y equidad de género.</p>

  <h3>Art. 106° Protección reforzada a la víctima</h3>
  <p>Todo el andamiaje del resorte legal garantiza, en favor indiscutible del afectado que interpone de manera fundamentada, creíble y diligente la queja grave en mención, un fuero total o impedimento que acarrea presunción legal de ilegalidad y nulidad sobre el despido en represalia o las reducciones salariales acometidas a manera de reprimenda bajo la sombrilla y lapso restrictivo que delimitan las directrices estatales impuestas hasta superar los seis (6) meses dictados por normativa a partir del requerimiento y más, si persiste el litigio.</p>

  <h3>Art. 107° Prohibición de revictimización</h3>
  <p>Cualquier directivo corporativo que, notificado del flagelo de acoso denunciado por uno de sus subordinados o de una empresa temporal adjunta, asuma roles sesgados para cuestionar o estigmatizar el relato de quien sufre la vejación, lo confronte cara a cara con su violador laboral, impida su acceso a medidas temporales, y divulgue su nombre causando maltrato social en pasillos incurrirá de hecho grave e imputable por tolerancia complaciente, cómplice e ignorancia de protocolos rectores.</p>

  <h3>Art. 108° Reporte al Ministerio del Trabajo</h3>
  <p>Sin demérito de actuar simultáneamente mediante querellas judiciales u ordinarias y el aparato de justicia colombiano, la parte agraviada podrá y estará en franco derecho de formalizar e instaurar denuncia a través de la herramienta especial dispuesta en la sede electrónica del Ministerio del Trabajo garantizando total anonimato en una reserva de sumario incólume del funcionario receptor de turno.</p>

  <h2>CAPÍTULO XVII — DISPOSICIONES FINALES</h2>
  <h3>Art. 109° Publicación del reglamento</h3>
  <p>En estricto cumplimiento de la modificación al Artículo 120 del CST (Reforma Laboral 2025), este Reglamento se publicará mediante fijación física en dos (2) sitios distintos y visibles de la empresa. De manera obligatoria y concurrente, el RIT estará fijado permanentemente en el <strong>medio digital, intranet o plataforma de la compañía</strong> (<strong>{{medios_publicacion}}</strong>) garantizando que todos los trabajadores tengan acceso inmediato y remoto a él en cualquier momento para su lectura y consulta sin restricciones.</p>

  <h3>Art. 110° Vigencia y entrada en fuerza</h3>
  <p>Este cuerpo normativo interno empezará a regir plenamente sobre los designios corporativos de modo oficial y unificado en fecha <strong>{{fecha_publicacion}}</strong>. Toda regla, directiva, circular, cláusula transitoria o pacto contractual pretérito que vulnere y contradiga las presentes normativas será subsumido bajo este reglamento y resultará en anulación tacita por pérdida de vigor jurídico vinculante prevaleciente.</p>

  <h3>Art. 111° Disposiciones supletorias</h3>
  <p>Cualquier condición normativa referente al vínculo del trabajo legal que no hubiera sido descrita taxativamente e incluida exhaustivamente entre el presente estipulado, se ceñirá y solucionará única y llanamente por mandatos, alcances o lagunas supletorias avalados mediante la sombrilla y cobertura general del Código Sustantivo del Trabajo de Colombia y las leyes reformistas conexas, decretos reglamentarios vigentes o por las dictaminaciones supremas ratificadas constitucionalmente.</p>

  <h3>Art. 112° Modificaciones</h3>
  <p>Cuando la dirección y patronato corporativo disponga legítimamente añadir de manera integral y unilateral, o a través de mesa representativa y por fuerza legal externa, algún tipo de adecuación, revisión y reforma capitulada o normativa especial con rango a este cuerpo reglamentario, deberá notificarse y someterse a escrutinio formal y publicación anticipada mínima de ocho (8) días calendario hábiles a todos los niveles empresariales a fin de surtir formal y plenos efectos.</p>

  <h3>Art. 113° Consecuencias del incumplimiento</h3>
  <p>La compañía es consciente que bajo las exigencias formales y sancionatorias tipificadas expresamente por los entes inspectivos y de acuerdo a las directrices que impone legalmente la legislación nacional como el Artículo 114 y 120 (CST) o la Reforma 2466 de 2025, el negarse a disponer, redactar legalmente, y publicitar o faltar a implementar formal y periódicamente el presente compendio RIT en los fueros correctos acarreará al ente patronal multas onerosas desde las mínimas vigentes a castigos pecuniarios supremos del orden de hasta 5.000 (Cinco mil) SMMLV e invalidez de los ceses unilaterales pactados frente a litigios corporativos.</p>

  <h3>Art. 114° Firma del Representante Legal</h3>
  <p>En constancia unánime de expedición plena y publicación ratificada de lo anterior y para los fines rectores de fuerza de vigencia frente a la autoridad del trabajo nacional, avala, suscribe y firma en original con validez legal el/la representante legal <strong>{{representante_legal}}</strong> en nombre y representación de la empresa <strong>{{empresa_nombre}}</strong>, expidiendo y promulgando lo dictado a los <strong>{{current_date}}</strong>.</p>
</div>
`;
