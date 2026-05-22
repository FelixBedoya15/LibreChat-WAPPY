/**
 * Extended Corporate Templates for WAPPY Canvas
 * Complete, compliant, and beautifully designed in Spanish
 * Aligned with Colombian Labor Laws, Decree 1072 of 2015, Ley 2365 de 2024, C-593 de 2014, Ley 2466 de 2025 and RIT.
 */

export const SIGNATURE_BLOCK_SST = `
<div style="margin-top:50px; page-break-inside:avoid; font-family: sans-serif;">
  <table style="width:100%; border-collapse:collapse;">
    <tr>
      <td style="width:48%; text-align:center; padding:8px;">
        <div class="signature-placeholder" style="border-bottom:2px solid #0f766e; min-height:85px; display:flex; align-items:center; justify-content:center; background:#f0fdfa; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
          <span style="font-size:11px; opacity:0.6; color:#0f766e;">Clic para firmar</span>
        </div>
        <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">REPRESENTANTE LEGAL</p>
        <p style="font-size:11px; margin:0; color:#64748b;">{{empresa_nombre}}</p>
      </td>
      <td style="width:4%;"></td>
      <td style="width:48%; text-align:center; padding:8px;">
        <div class="signature-placeholder" style="border-bottom:2px solid #0f766e; min-height:85px; display:flex; align-items:center; justify-content:center; background:#f0fdfa; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
          <span style="font-size:11px; opacity:0.6; color:#0f766e;">Clic para firmar</span>
        </div>
        <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">LÍDER SST / RESPONSABLE SG-SST</p>
        <p style="font-size:11px; margin:0; color:#64748b;">Licencia SST Vigente</p>
      </td>
    </tr>
  </table>
</div>
`;

export const SIGNATURE_BLOCK_CONVIVENCIA = `
<div style="margin-top:50px; page-break-inside:avoid; font-family: sans-serif;">
  <table style="width:100%; border-collapse:collapse;">
    <tr>
      <td style="width:48%; text-align:center; padding:8px;">
        <div class="signature-placeholder" style="border-bottom:2px solid #0d9488; min-height:85px; display:flex; align-items:center; justify-content:center; background:#f0fdfa; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
          <span style="font-size:11px; opacity:0.6; color:#0d9488;">Clic para firmar</span>
        </div>
        <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">REPRESENTANTE LEGAL</p>
        <p style="font-size:11px; margin:0; color:#64748b;">{{empresa_nombre}}</p>
      </td>
      <td style="width:4%;"></td>
      <td style="width:48%; text-align:center; padding:8px;">
        <div class="signature-placeholder" style="border-bottom:2px solid #0d9488; min-height:85px; display:flex; align-items:center; justify-content:center; background:#f0fdfa; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
          <span style="font-size:11px; opacity:0.6; color:#0d9488;">Clic para firmar</span>
        </div>
        <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">PRESIDENTE COMITÉ DE CONVIVENCIA</p>
        <p style="font-size:11px; margin:0; color:#64748b;">Comité Paritario de Convivencia Laboral</p>
      </td>
    </tr>
  </table>
</div>
`;

export const SIGNATURE_BLOCK_CONTRATO = `
<div style="margin-top:50px; page-break-inside:avoid; font-family: sans-serif;">
  <table style="width:100%; border-collapse:collapse;">
    <tr>
      <td style="width:48%; text-align:center; padding:8px;">
        <div class="signature-placeholder" style="border-bottom:2px solid #475569; min-height:85px; display:flex; align-items:center; justify-content:center; background:#f8fafc; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
          <span style="font-size:11px; opacity:0.6; color:#475569;">Clic para firmar</span>
        </div>
        <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">EL EMPLEADOR (o contratante)</p>
        <p style="font-size:11px; margin:0; color:#64748b;">{{representante_legal}}</p>
      </td>
      <td style="width:4%;"></td>
      <td style="width:48%; text-align:center; padding:8px;">
        <div class="signature-placeholder" style="border-bottom:2px solid #475569; min-height:85px; display:flex; align-items:center; justify-content:center; background:#f8fafc; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
          <span style="font-size:11px; opacity:0.6; color:#475569;">Clic para firmar</span>
        </div>
        <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">EL TRABAJADOR (o contratista)</p>
        <p style="font-size:11px; margin:0; color:#64748b;">Firma, Huella y Cédula</p>
      </td>
    </tr>
  </table>
</div>
`;

// 1. Política de Desconexión Laboral
export const politicaDesconexionHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(99,102,241,0.15); position: relative;">
    <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px; letter-spacing: 0.5px;">CÓDIGO: SST-POL-007 | V.02</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">POLÍTICA DE DESCONEXIÓN LABORAL Y SALUD DIGITAL</h1>
    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 600; text-transform: uppercase;">Garantía Constitucional y Bienestar Laboral</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Conforme a la Ley 2191 de 2022 y la Reforma Laboral de la República de Colombia (Ley 2466 de 2025)</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">Empresa:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; width: 25%; font-weight: 600; color: #4f46e5;">{{empresa_nombre}}</td>
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">NIT:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; width: 25%;">{{empresa_nit}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Aprobador:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">{{representante_legal}}</td>
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Fecha Entrada:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">22/05/2026</td>
    </tr>
  </table>

  <h3 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. OBJETIVO Y MARCO DE APLICACIÓN</h3>
  <p style="text-align: justify; font-size: 13.5px;">
    En <strong>{{empresa_nombre}}</strong>, entendemos que la salud mental, el descanso físico y la conciliación efectiva de la vida personal, familiar y laboral son pilares esenciales para el desarrollo sostenible y el bienestar integral de nuestros colaboradores. La presente política tiene por objeto reglamentar y garantizar el derecho fundamental a la **desconexión laboral** de la totalidad de los trabajadores de la empresa, asegurando de forma efectiva que, al concluir su jornada diaria ordinaria o el horario de trabajo pactado contractualmente, gocen de la plena libertad de no atender ningún tipo de comunicación laboral digital, telefónica o presencial.
  </p>

  <h3 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. DEFINICIÓN DEL DERECHO A LA DESCONEXIÓN LABORAL</h3>
  <p style="text-align: justify; font-size: 13.5px;">
    De conformidad con la Ley 2191 de 2022 y los lineamientos de la reforma laboral (Ley 2466 de 2025), la desconexión laboral es un derecho legítimo que faculta al trabajador a desconectarse por completo de sus herramientas tecnológicas de trabajo (tales como teléfonos móviles, correos electrónicos, chats corporativos, WhatsApp corporativo, plataformas de gestión y redes de comunicación internas) una vez finalizada su jornada laboral ordinaria, durante los periodos de descanso, permisos remunerados o no, licencias médicas, fines de semana y periodos de vacaciones.
  </p>

  <h3 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. DECLARACIÓN DE DERECHOS Y COMPROMISOS INSTITUCIONALES</h3>
  <p style="text-align: justify; font-size: 13.5px;">
    {{empresa_nombre}} declara formalmente su compromiso irrestricto de proteger y hacer efectivo este derecho mediante la implementación de las siguientes directrices operativas:
  </p>
  <ul style="padding-left: 20px; font-size: 13px; margin-bottom: 20px; text-align: justify;">
    <li style="margin-bottom: 8px;"><strong>Derecho a la omisión de respuesta:</strong> Ningún colaborador de la compañía estará obligado a responder llamadas telefónicas, correos electrónicos, requerimientos por WhatsApp o mensajes en plataformas de gestión fuera de su horario laboral establecido. No se le exigirá disponibilidad injustificada.</li>
    <li style="margin-bottom: 8px;"><strong>Garantía de no represalias:</strong> Se prohíbe de forma tajante que la empresa, a través de sus líderes de proceso o directivos, realice amonestaciones, desmejoramientos laborales, exclusión de promociones o cualquier tipo de discriminación laboral hacia un trabajador debido a la inobservancia de mensajes fuera de su horario de trabajo ordinario.</li>
    <li style="margin-bottom: 8px;"><strong>Abstención en la emisión de directrices:</strong> La alta dirección y los mandos medios se comprometen y obligan a no emitir órdenes, solicitudes u directrices laborales fuera de los horarios reglamentarios de trabajo, procurando la planeación responsable de los proyectos.</li>
    <li style="margin-bottom: 8px;"><strong>Uso de herramientas de gestión diferida:</strong> Si por motivos de planeación personal o diferencias horarias de los equipos de trabajo, un directivo o compañero de trabajo genera un correo electrónico u comunicación por fuera del horario laboral ordinario de su destinatario, es obligatorio el uso de la funcionalidad de **envío programado/diferido**, a efectos de que dicha comunicación ingrese a la bandeja de entrada del receptor en el primer minuto hábil de su siguiente jornada.</li>
  </ul>

  <h3 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">4. EXCEPCIONES LEGALES DE APLICACIÓN</h3>
  <p style="font-size: 13px; text-align: justify;">
    De absoluta conformidad con el Artículo 6 de la Ley 2191 de 2022, quedan expresamente exceptuados del derecho a la desconexión laboral los siguientes colaboradores:
  </p>
  <ol style="padding-left: 20px; font-size: 13px; margin-bottom: 20px; text-align: justify;">
    <li style="margin-bottom: 6px;"><strong>Cargos de Dirección, Confianza y Manejo:</strong> Entendiéndose aquellos trabajadores que, por la naturaleza intrínseca de sus funciones, representan directamente al empleador y tienen poder decisorio y de mando absoluto en la estructura de {{empresa_nombre}}.</li>
    <li style="margin-bottom: 6px;"><strong>Disponibilidad y Turnos de Soporte:</strong> Colaboradores que en razón de su rol operativo clave tengan un acuerdo explícito y contractual de turnos de disponibilidad técnica, operativa o de urgencia, los cuales serán reconocidos y compensados de conformidad con la ley aplicable en Colombia.</li>
    <li style="margin-bottom: 6px;"><strong>Fuerza Mayor o Caso Fortuito:</strong> Situaciones extraordinarias e imprevistas de catástrofe, emergencia sanitaria, ambiental, riesgo operativo crítico o fuerza mayor que amenace gravemente la continuidad o la existencia de las instalaciones, del personal o de la operación de {{empresa_nombre}}.</li>
  </ol>

  <h3 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">5. VÍNCULO DISCIPLINARIO Y REGULACIÓN EN EL RIT</h3>
  <div style="background-color: #f5f3ff; border-left: 4px solid #6366f1; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; text-align: justify;">
    <strong>Relación Vinculante con el RIT:</strong> El Reglamento Interno de Trabajo (RIT) de {{empresa_nombre}} prohíbe a todos los colaboradores y directivos incurrir de forma reiterada, sistemática y abusiva en requerimientos, llamadas o directrices laborales por fuera de la jornada de trabajo a sus subordinados o compañeros. Dicha conducta persistente e injustificada será valorada como un comportamiento contrario al clima organizacional y de acoso telefónico/digital, tipificada como **infracción a las obligaciones laborales**. Se someterá al debido proceso del **Procedimiento Sancionatorio Laboral** de la organización, acarreando suspensiones del cargo de conformidad con la gravedad y la reincidencia constatadas.
  </div>

  <h3 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">6. RUTA DE RECLAMO Y MECANISMO DE PROTECCIÓN</h3>
  <p style="font-size: 13px; text-align: justify;">
    Cualquier colaborador que estime que su derecho a la desconexión laboral está siendo menoscabado, o que sea objeto de presiones indebidas para responder requerimientos fuera de su horario laboral, podrá interponer una reclamación formal y estrictamente confidencial ante el **Comité de Convivencia Laboral**. El Comité analizará las pruebas aportadas (chats, registros de llamadas, correos sin diferir) y, de encontrar mérito, adelantará una sesión de concertación amistosa con el presunto infractor y remitirá las recomendaciones correctivas al área de Talento Humano.
  </p>

  ${SIGNATURE_BLOCK_SST}
</div>
`.trim();

// 2. Política de Prevención de Acoso Laboral
export const politicaAcosoLaboralHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(16,185,129,0.15); position: relative;">
    <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px;">CÓDIGO: SST-POL-008 | V.04</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">POLÍTICA DE PREVENCIÓN DEL ACOSO LABORAL</h1>
    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 600; text-transform: uppercase;">Convivencia Armónica, Respeto y Dignidad Humana</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Enmarcada en la Ley 1010 de 2006, Decretos Reglamentarios y las directrices del Ministerio del Trabajo de Colombia</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">Empresa:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; width: 25%; font-weight: 600; color: #059669;">{{empresa_nombre}}</td>
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">NIT:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; width: 25%;">{{empresa_nit}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Aprobador:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">{{representante_legal}}</td>
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Fecha Entrada:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">22/05/2026</td>
    </tr>
  </table>

  <h3 style="color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. DECLARACIÓN DE TOLERANCIA CERO Y COMPROMISO ÉTICO</h3>
  <p style="text-align: justify; font-size: 13.5px;">
    En <strong>{{empresa_nombre}}</strong> rechazamos enérgicamente cualquier manifestación de acoso laboral, discriminación, maltrato, exclusión o persecución en todas las relaciones de trabajo. Esta organización asume el compromiso ético y legal inalienable de garantizar un entorno laboral sano, constructivo, digno e inclusivo. Propiciamos relaciones interpersonales basadas en el respeto mutuo entre todos los colaboradores, contratistas, directores y proveedores de la organización, independientemente de su tipo de vinculación, rango o jerarquía.
  </p>

  <h3 style="color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. DEFINICIÓN LEGAL DE ACOSO LABORAL</h3>
  <p style="font-size: 13.5px; text-align: justify;">
    De acuerdo con el Artículo 2 de la Ley 1010 de 2006, se define el acoso laboral como toda conducta persistente y demostrable, ejercida sobre un empleado por parte de un empleador, un jefe o superior jerárquico inmediato o mediato, un compañero de trabajo o un subalterno, encaminada a infundir miedo, intimidación, terror y angustia, a causar perjuicio laboral, generar desmotivación en el trabajo, o inducir la renuncia del mismo.
  </p>

  <h3 style="color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. MODALIDADES DEL ACOSO LABORAL</h3>
  <p style="font-size: 13px; text-align: justify;">La ley reconoce y prohíbe expresamente las siguientes modalidades de acoso laboral, las cuales constituyen objeto de erradicación definitiva en {{empresa_nombre}}:</p>
  <ul style="padding-left: 20px; font-size: 13px; margin-bottom: 20px; text-align: justify;">
    <li style="margin-bottom: 8px;"><strong>Maltrato laboral:</strong> Todo acto de violencia contra la integridad física o moral, la libertad física o sexual, y los bienes de quien se desempeñe como trabajador; así como toda expresión verbal injuriosa o ultrajante que lesione la dignidad.</li>
    <li style="margin-bottom: 8px;"><strong>Persecución laboral:</strong> Toda conducta cuyas características de reiteración o evidente arbitrariedad permitan inferir el propósito de inducir la renuncia del empleado mediante descalificaciones, sobrecarga de trabajo y cambios sorpresivos de horarios sin justificación técnica.</li>
    <li style="margin-bottom: 8px;"><strong>Discriminación laboral:</strong> Todo trato diferenciado y perjudicial por razones de raza, género, origen familiar, nacionalidad, credo religioso, preferencia política o identidad sexual.</li>
    <li style="margin-bottom: 8px;"><strong>Entorpecimiento laboral:</strong> Toda acción tendiente a obstaculizar el cumplimiento de las labores encomendadas, hacerlas más gravosas o retardarlas con perjuicio para el trabajador (privación de insumos, destrucción de información, ocultamiento de correspondencia).</li>
    <li style="margin-bottom: 8px;"><strong>Inequidad laboral:</strong> Asignación de funciones a menosprecio del trabajador, afectando su dignidad profesional y asignándole labores degradantes o ajenas a su perfil sin sustento operativo.</li>
    <li style="margin-bottom: 8px;"><strong>Desprotección laboral:</strong> Toda conducta tendiente a poner en riesgo la integridad física y la seguridad del trabajador mediante órdenes o asignación de tareas sin el cumplimiento de los requisitos mínimos de protección de seguridad industrial y dotación de EPP.</li>
  </ul>

  <h3 style="color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">4. CONDUCTAS QUE NO CONSTITUYEN ACOSO LABORAL</h3>
  <p style="font-size: 13px; text-align: justify;">
    De conformidad con la Ley 1010 de 2006, no se consideran acoso laboral aquellas exigencias técnicas, operativas y administrativas razonables ligadas a la ejecución legítima del contrato de trabajo. A saber:
  </p>
  <ul style="padding-left: 20px; font-size: 13px; margin-bottom: 20px; text-align: justify;">
    <li style="margin-bottom: 6px;">Las exigencias de cumplimiento de las obligaciones y deberes laborales contenidos en el CST y en el Reglamento Interno de Trabajo.</li>
    <li style="margin-bottom: 6px;">Las directrices razonables del empleador enfocadas a la productividad, eficiencia, orden y buen funcionamiento operativo de la empresa.</li>
    <li style="margin-bottom: 6px;">La formulación de circulares, memorandos o llamados de atención por escrito destinados a corregir deficiencias de desempeño o de disciplina debidamente argumentados.</li>
    <li style="margin-bottom: 6px;">La evaluación del desempeño laboral de acuerdo con indicadores preestablecidos.</li>
  </ul>

  <h3 style="color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">5. VÍNCULO DISCIPLINARIO CON EL REGLAMENTO INTERNO DE TRABAJO (RIT)</h3>
  <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; text-align: justify;">
    <strong>Régimen Disciplinario y Justa Causa:</strong> Toda conducta demostrada que sea constitutiva de acoso laboral, maltrato o persecución entre los empleados será calificada por {{empresa_nombre}} como una **infracción grave a las obligaciones contractuales**. Conforme al RIT de la organización y el Código Sustantivo del Trabajo, la comprobación objetiva de estas conductas a través del debido proceso disciplinario dará lugar a la **terminación unilateral del contrato de trabajo con justa causa** para el acosador, sin derecho a indemnización y sin perjuicio de las sanciones económicas legales impuestas por el Ministerio del Trabajo de Colombia.
  </div>

  <h3 style="color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">6. MEDIDAS PREVENTIVAS Y CAPACITACIÓN</h3>
  <p style="font-size: 13px; text-align: justify;">
    {{empresa_nombre}} se obliga a programar semestralmente capacitaciones de sensibilización sobre acoso laboral, fomento de la sana convivencia y liderazgo respetuoso. Adicionalmente, apoyará activamente al **Comité de Convivencia Laboral** dotándolo de herramientas y tiempo laboral para el ejercicio idóneo de sus funciones preventivas.
  </p>

  ${SIGNATURE_BLOCK_CONVIVENCIA}
</div>
`.trim();

// 3. Protocolo de Intervención Frente al Acoso Laboral
export const protocoloAcosoLaboralHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(13,148,136,0.15); position: relative;">
    <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px;">CÓDIGO: SST-PRO-009 | V.03</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">PROTOCOLO DE INTERVENCIÓN FRENTE AL ACOSO LABORAL</h1>
    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 600; text-transform: uppercase;">Procedimiento de Queja, Mediación y Debido Proceso</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Ruta Oficial del Comité de Convivencia Laboral, Garantías de Confidencialidad y Debido Proceso</p>
  </div>

  <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. RADICACIÓN Y RECEPCIÓN DE LA QUEJA</h3>
  <p style="text-align: justify; font-size: 13px;">
    Cualquier colaborador de <strong>{{empresa_nombre}}</strong> que estime que está sufriendo conductas sistemáticas de acoso laboral, o que tenga conocimiento de una presunta situación de acoso, podrá radicar formalmente una queja por escrito ante los miembros del **Comité de Convivencia Laboral** o a través del canal digital exclusivo y cifrado dispuesto por el área de Talento Humano.
  </p>
  <p style="font-size: 13px; text-align: justify;">La queja deberá presentarse bajo reserva y contendrá de forma obligatoria:</p>
  <ul style="padding-left: 20px; font-size: 12.5px; margin-bottom: 16px; text-align: justify;">
    <li>Identificación del quejoso (nombre completo, identificación, cargo y área).</li>
    <li>Identificación de la persona denunciada por presunto acoso (nombre y cargo).</li>
    <li>Relación pormenorizada e histórica de los hechos (con especificación de fechas, horas y lugares físicos o digitales).</li>
    <li>Aporte de los elementos de prueba indiciaria (capturas de chats, correos electrónicos, audios, documentos o nombres de testigos).</li>
  </ul>

  <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. ETAPAS DEL PROCEDIMIENTO DE MEDIACIÓN INTERNA</h3>
  <p style="font-size: 13px; text-align: justify;">El Comité de Convivencia Laboral se obliga a agotar las siguientes etapas con absoluto rigor y reserva procesal:</p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 1px solid #e2e8f0;">
    <thead>
      <tr style="background-color: #f1f5f9; font-weight: bold; color: #0f766e;">
        <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; width: 15%;">Fase</th>
        <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; width: 55%;">Actividades y Garantías del Debido Proceso</th>
        <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; width: 30%;">Plazos y Responsable</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">1. Admisión e Indicios</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: justify;">Revisión jurídica de la queja y de los indicios. El Comité evalúa si los hechos concuerdan con la Ley 1010. Se convoca a las partes por separado para escuchar su versión preliminar de los hechos.</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Comité de Convivencia<br><em>Plazo: 5 días hábiles</em></td>
      </tr>
      <tr style="background-color: #f8fafc;">
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">2. Concertación</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: justify;">Audiencia presencial o virtual conjunta de carácter estrictamente privado. Se formulan fórmulas de arreglo, compromisos de respeto mutuo y planes de acción para sanear el clima laboral de los colaboradores.</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Comité de Convivencia<br><em>Plazo: 10 días hábiles</em></td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">3. Seguimiento</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: justify;">Evaluación directa y entrevistas con los implicados para verificar el cese definitivo de cualquier conducta hostil y la plena vigencia de los compromisos de convivencia.</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Comité / Líder Talento Humano<br><em>Plazo: 30 días calendario</em></td>
      </tr>
    </tbody>
  </table>

  <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. ESCALAMIENTO DISCIPLINARIO Y VÍNCULO RIT</h3>
  <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; text-align: justify;">
    <strong>Ruta Sancionatoria Obligatoria:</strong> En aquellos casos donde: a) Se evidencie de forma flagrante que la conducta denunciada es inaceptable o lesiva de los derechos humanos básicos del quejoso; b) El presunto acosador se niegue a comparecer o a pactar compromisos; c) Se verifique el incumplimiento sistemático de los acuerdos pactados en el acta de convivencia; el Comité **cerrará la mediación de forma inmediata y remitirá el expediente íntegro** a la Gerencia de Talento Humano. Talento Humano procederá a dar apertura de oficio al **Procedimiento Sancionatorio Laboral** formal del RIT, aplicando las sanciones que incluyan suspensiones del cargo o despido por justa causa de forma prioritaria.
  </div>

  <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">4. PROTECCIÓN CONTRA RETALIACIONES (FUERO DE 6 MESES)</h3>
  <p style="font-size: 13px; text-align: justify;">
    De total conformidad con la Ley 1010 de 2006, {{empresa_nombre}} garantiza de forma efectiva que ningún trabajador que hubiere formulado una queja de buena fe o que sirva de testigo calificado dentro de una investigación de acoso laboral, podrá ser objeto de despido unilateral, terminación del contrato, desmejoramiento en sus condiciones laborales o traslados injustificados dentro de los **seis (6) meses siguientes** a la radicación de la queja. En caso de ocurrencia de despido unilateral dentro de dicho plazo, la desvinculación se considerará legalmente ineficaz a menos que se demuestre causa justa plenamente probada en descargos.
  </p>

  ${SIGNATURE_BLOCK_CONVIVENCIA}
</div>
`.trim();

// 4. Política de Prevención de Acoso Sexual Laboral
export const politicaAcosoSexualHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background: linear-gradient(135deg, #db2777 0%, #be123c 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(219,39,119,0.15); position: relative;">
    <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px;">CÓDIGO: SST-POL-010 | V.02</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">POLÍTICA DE PREVENCIÓN DEL ACOSO SEXUAL LABORAL</h1>
    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 600; text-transform: uppercase;">Tolerancia Cero frente a la Violencia Sexual y de Género</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Estrictamente alineada con la Ley 2365 de 2024 de la República de Colombia y la Ley 1257 de 2008</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">Empresa:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; width: 25%; font-weight: 600; color: #be123c;">{{empresa_nombre}}</td>
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">NIT:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; width: 25%;">{{empresa_nit}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Aprobador:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">{{representante_legal}}</td>
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Fecha Entrada:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">22/05/2026</td>
    </tr>
  </table>

  <h3 style="color: #be123c; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. DECLARACIÓN DE TOLERANCIA CERO Y ENFOQUE DE GÉNERO</h3>
  <p style="text-align: justify; font-size: 13.5px;">
    En <strong>{{empresa_nombre}}</strong> rechazamos tajantemente cualquier acto, insinuación, ademán, presión o conducta hostil que configure acoso sexual, acoso por razón de sexo, identidad de género u orientación sexual en el ámbito laboral. En cumplimiento estricto de la **Ley 2365 de 2024**, establecemos un principio de **tolerancia cero** contra cualquier violencia de género. Esta política protege no solo a los empleados directos con contrato de trabajo, sino a contratistas de prestación de servicios, pasantes, estudiantes en práctica, proveedores y personas postulantes en procesos de selección.
  </p>

  <h3 style="color: #be123c; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. DEFINICIÓN LEGAL DE ACOSO SEXUAL LABORAL</h3>
  <p style="font-size: 13.5px; text-align: justify;">
    De conformidad con la Ley 2365 de 2024, se entiende por acoso sexual laboral todo acto de persecución, hostigamiento, asedio o acorralamiento de connotación física, verbal o no verbal, con propósitos lascivos, libidinosos u obtención de favores sexuales no consensuados, que se manifieste a través de relaciones de poder verticales u horizontales y que afecte la dignidad, la libertad sexual y la salud mental de la persona agredida.
  </p>

  <h3 style="color: #be123c; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. CONDUCTAS ESPECÍFICAMENTE PROHIBIDAS</h3>
  <p style="font-size: 13px; text-align: justify;">Esta organización prohíbe de forma absoluta, exhaustiva e inequívoca las siguientes conductas en el entorno laboral:</p>
  <ul style="padding-left: 20px; font-size: 13px; margin-bottom: 20px; text-align: justify;">
    <li style="margin-bottom: 8px;"><strong>Comportamientos Verbales:</strong> Insinuaciones o proposiciones de índole sexual no deseadas; comentarios inapropiados, lascivos o humillantes sobre la apariencia física, vestimenta u orientación sexual de un colaborador; bromas de carácter sexual de forma persistente; preguntas invasivas sobre la vida íntima y sexual de los colaboradores.</li>
    <li style="margin-bottom: 8px;"><strong>Comportamientos No Verbales:</strong> Miradas lascivas, gestos de connotación sexual, exhibición no consentida de imágenes, videos o material audiovisual pornográfico o erótico en pantallas de trabajo o a través de WhatsApp, Teams o correo electrónico corporativo; invasión persistente y no justificada del espacio personal de trabajo.</li>
    <li style="margin-bottom: 8px;"><strong>Comportamientos Físicos:</strong> Tocamientos indeseados, roces intencionales, abrazos, apretones de hombros o besos no consentidos; intentos de acorralamiento en pasillos, oficinas, baños o durante eventos corporativos fuera de las instalaciones físicas de la organización.</li>
  </ul>

  <h3 style="color: #be123c; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">4. ALINEACIÓN VINCULANTE CON EL RIT Y DEBER DISCIPLINARIO</h3>
  <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; text-align: justify;">
    <strong>Infracción Gravísima del RIT:</strong> En el Reglamento Interno de Trabajo (RIT) de {{empresa_nombre}}, el acoso sexual laboral está clasificado expresamente como una **infracción contractual gravísima de especial trascendencia**. La comprobación fáctica del cometimiento de acoso sexual laboral a través del debido proceso disciplinario de descargos, acarreará la **terminación inmediata del contrato individual de trabajo por justa causa**, sin lugar a indemnizaciones de ningún tipo. Asimismo, en el caso de contratistas, la comprobación de la agresión será causal de rescisión unilateral inmediata del contrato por incumplimiento contractual grave y penalidades comerciales.
  </div>

  <h3 style="color: #be123c; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">5. GARANTÍA DE NO REVICTIMIZACIÓN Y NO CENSURA</h3>
  <p style="font-size: 13px; text-align: justify;">
    {{empresa_nombre}} prohíbe de forma radical cualquier acto de censura, silencio forzoso, moralización o juzgamiento que victimice de manera secundaria a la persona que interpone la queja. El protocolo de la empresa operará bajo el principio rector de presunción de buena fe hacia la víctima y de acompañamiento integral durante todo el proceso.
  </p>

  ${SIGNATURE_BLOCK_CONVIVENCIA}
</div>
`.trim();

// 5. Protocolo de Canalización y Atención al Acoso Sexual
export const protocoloAcosoSexualHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(139,92,246,0.15); position: relative;">
    <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px;">CÓDIGO: SST-PRO-011 | V.02</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">PROTOCOLO DE ATENCIÓN Y CANALIZACIÓN DEL ACOSO SEXUAL</h1>
    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 600; text-transform: uppercase;">Ruta de Protección Inmediata, Fiscalía, SIVIGE y Fuero Legal</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Ruta Procedimental Obligatoria en Ejecución de la Ley 2365 de 2024</p>
  </div>

  <h3 style="color: #7c3aed; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. PRIMERA ACOGIDA Y MEDIDAS CAUTELARES OBLIGATORIAS (24 HORAS)</h3>
  <p style="text-align: justify; font-size: 13px;">
    Ante la presentación de una queja, reporte o alerta de presunto acoso sexual o violencia de género en <strong>{{empresa_nombre}}</strong>, se activará de forma inmediata la **Ruta de Atención Preferencial**. En un término estricto **no mayor a veinticuatro (24) horas hábiles**, el área de Talento Humano y la gerencia de la empresa decretarán de manera unilateral medidas cautelares indispensables para salvaguardar la integridad de la presunta víctima. Estas medidas se aplicarán de inmediato y consisten en:
  </p>
  <ul style="padding-left: 20px; font-size: 12.5px; margin-bottom: 16px; text-align: justify;">
    <li style="margin-bottom: 6px;">Separación inmediata del entorno laboral del presunto acosador respecto de la presunta víctima. Se reubicará al presunto implicado en otro puesto físico u operativo de la compañía.</li>
    <li style="margin-bottom: 6px;">Asignación de esquemas de **Trabajo en Casa (Home Office)** provisional para el presunto agresor, o en su defecto de la presunta víctima siempre y cuando esta lo solicite u otorgue su consentimiento libre de presiones.</li>
    <li style="margin-bottom: 6px;">Modificación temporal de turnos u horarios de trabajo de las partes para evitar cualquier cruce presencial en las dependencias de la empresa.</li>
    <li style="margin-bottom: 6px;">Suspensión de accesos a canales o proyectos virtuales de trabajo donde deba concurrir comunicación directa entre los implicados.</li>
  </ul>

  <h3 style="color: #7c3aed; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. PROHIBICIÓN ABSOLUTA DE CONCILIACIÓN</h3>
  <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 13.5px; color: #581c87; text-align: justify;">
    <strong>Regla de No Revictimización:</strong> A diferencia de las reclamaciones de acoso laboral ordinario bajo la Ley 1010, **el acoso sexual laboral no es conciliable**. De conformidad con la Ley 2365 de 2024, queda estrictamente prohibido someter a la presunta víctima a careos presenciales, audiencias de conciliación mutua o mediaciones amistosas con el presunto agresor. La queja dará inicio inmediato a una etapa de investigación de carácter reservado y, de encontrarse méritos, el expediente será trasladado directamente a proceso disciplinario formal sin necesidad de mediación previa.
  </div>

  <h3 style="color: #7c3aed; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. DEBER DE REPORTE Y TRASLADO A LA FISCALÍA GENERAL DE LA NACIÓN</h3>
  <p style="font-size: 13px; text-align: justify;">
    Si los hechos denunciados revisten el carácter de delito tipificado en el Código Penal Colombiano (Artículo 210A - Delito de Acoso Sexual), {{empresa_nombre}} tiene la **obligación legal de orientar y asistir a la víctima** en la formulación de la correspondiente denuncia.
  </p>
  <p style="font-size: 13px; text-align: justify;">
    Asimismo, la empresa **remitirá de forma oficial e inmediata el expediente con las pruebas a la Fiscalía General de la Nación**, siempre y cuando medie la **autorización libre y expresa de la víctima**, garantizando y respetando en todo momento su derecho a la intimidad personal y evitando su revictimización o exposición pública.
  </p>

  <h3 style="color: #7c3aed; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">4. NOTIFICACIÓN Y REPORTE SEMESTRAL OBLIGATORIO AL SIVIGE</h3>
  <p style="font-size: 13px; text-align: justify;">
    En estricto acatamiento del mandato contenido en la Ley 2365 de 2024, la Dirección de Talento Humano de {{empresa_nombre}} consolidará periódicamente un informe estadístico detallado sobre la totalidad de quejas, alertas, investigaciones adelantadas y sanciones de despido o rescisión aplicadas con ocasión de acoso sexual en el ámbito laboral.
  </p>
  <p style="font-size: 13px; text-align: justify;">
    Este reporte corporativo **deberá cargarse y notificarse oficialmente ante el Sistema Integrado de Información de Violencias de Género (SIVIGE)** de la autoridad de salud colombiana de forma obligatoria durante **los últimos diez (10) días calendario de cada semestre** (en los meses de junio y diciembre), garantizando la completa **anonimización de los datos personales** de las víctimas para proteger su intimidad, honra y el debido proceso.
  </p>

  <h3 style="color: #7c3aed; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">5. ESTABILIDAD LABORAL REFORZADA (FUERO DE 6 MESES)</h3>
  <div style="background-color: #fff1f2; border-left: 4px solid #db2777; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; text-align: justify;">
    <strong>Garantía de Ineficacia del Despido:</strong> De acuerdo con lo consagrado por la Ley 2365 de 2024, las víctimas que hubiesen radicado una queja por conductas de acoso sexual laboral, así como aquellos colaboradores de la empresa que actúen de buena fe como denunciantes, testigos, o aporten elementos materiales probatorios en el proceso, **gozan de estabilidad laboral reforzada (fuero especial) por un término de seis (6) meses** posteriores a la fecha de radicación del reporte o queja.
    <br><br>
    Cualquier terminación unilateral del contrato de trabajo o despido sin justa causa durante dicho plazo de seis meses **se entenderá legalmente ineficaz (nulo de pleno derecho)** y obligará al reintegro inmediato del trabajador con el correspondiente pago de salarios caídos. En caso de invocación de despido, recaerá enteramente sobre el empleador la carga de la prueba para demostrar judicialmente que la desvinculación se debió a una causa técnica u disciplinaria justa y debidamente sustentada en descargos, totalmente ajena a la queja formulada.
  </div>

  ${SIGNATURE_BLOCK_CONVIVENCIA}
</div>
`.trim();

// 6. Política de Equidad de Género y Diversidad
export const politicaGeneroHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(79,70,229,0.15); position: relative;">
    <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px;">CÓDIGO: SST-POL-012 | V.02</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">POLÍTICA DE EQUIDAD DE GÉNERO, DIVERSIDAD E INCLUSIÓN</h1>
    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 600; text-transform: uppercase;">Igualdad de Oportunidades, Brecha Salarial Cero y Diversidad</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">En cumplimiento de la Ley 1496 de 2011, ODS 5 de las Naciones Unidas y la Ley 2466 de 2025</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">Empresa:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; width: 25%; font-weight: 600; color: #2563eb;">{{empresa_nombre}}</td>
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">NIT:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; width: 25%;">{{empresa_nit}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Aprobador:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">{{representante_legal}}</td>
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Fecha Entrada:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">22/05/2026</td>
    </tr>
  </table>

  <h3 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. PRICIPIOS RECTORES DE EQUIDAD</h3>
  <p style="text-align: justify; font-size: 13.5px;">
    En <strong>{{empresa_nombre}}</strong>, creemos firmemente que el talento, el intelecto y el mérito profesional no están supeditados al género, orientación sexual, credo, raza o identidad de las personas. La presente política establece el marco de acción estratégica corporativo destinado a garantizar la equidad de género real, la diversidad en nuestros equipos de trabajo y una inclusión genuina. Nos comprometemos a mantener un clima organizacional seguro, donde cada persona pueda desarrollar su máximo potencial profesional libre de sesgos conscientes o inconscientes.
  </p>

  <h3 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. EJES ESTRATÉGICOS DE ACCIÓN CORPORATIVA</h3>
  <p style="font-size: 13px; text-align: justify;">La organización implementará de forma constante y evaluará anualmente los siguientes ejes de equidad:</p>
  <ul style="padding-left: 20px; font-size: 13px; margin-bottom: 20px; text-align: justify;">
    <li style="margin-bottom: 8px;"><strong>Selección e Incorporación Insesgada:</strong> Implementar perfiles de cargo neutrales, libres de lenguaje de género sesgado. Se adoptarán mecanismos de **currículum ciego** para las fases de preselección administrativa y la conformación paritaria de ternas para cargos directivos de alta responsabilidad corporativa.</li>
    <li style="margin-bottom: 8px;"><strong>Equidad Salarial Estricta (Brecha Salarial Cero):</strong> Dar cumplimiento riguroso a la **Ley 1496 de 2011** (Igualdad Salarial). Todo cargo con idénticas responsabilidades, competencias exigidas y jornada de trabajo gozará de la misma remuneración básica, prohibiendo explícitamente cualquier diferenciación por causa del sexo o género del ocupante del cargo.</li>
    <li style="margin-bottom: 8px;"><strong>Corresponsabilidad en el Cuidado y Conciliación:</strong> Fomentar de manera proactiva el disfrute pleno de las licencias de paternidad consagradas por la ley colombiana, promoviendo el cuidado compartido. Se facilitarán horarios flexibles de trabajo y teletrabajo para aquellos colaboradores con responsabilidades de cuidado de hijos o familiares dependientes, sin distinción de género.</li>
  </ul>

  <h3 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. DEBER DE RESPETO Y ALINEACIÓN CON EL RIT</h3>
  <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; text-align: justify;">
    <strong>Consecuencias de Actos Discriminatorios en el RIT:</strong> De conformidad con las normas de convivencia del RIT de {{empresa_nombre}}, los actos hostiles, burlas, descalificaciones profesionales, segregación o discriminación explícita fundados en el sexo, estado civil, embarazo, identidad de género, expresión de género u orientación sexual de cualquier persona constituyen una **falta grave laboral**. Su comisión será sometida directamente al procedimiento sancionatorio y disciplinario regular, conllevando a amonestaciones, suspensiones o rescisión de contrato según corresponda.
  </div>

  ${SIGNATURE_BLOCK_SST}
</div>
`.trim();

// 7. Contrato de Trabajo a Término Indefinido
export const contratoIndefinidoHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background-color: #475569; color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(71,85,105,0.15);">
    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">CONTRATO INDIVIDUAL DE TRABAJO A TÉRMINO INDEFINIDO</h1>
    <p style="margin: 6px 0 0; font-size: 12px; opacity: 0.9; text-transform: uppercase; font-weight: 600;">Documento de Carácter Vinculante y Legal</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Sometido a las normas del Código Sustantivo del Trabajo de la República de Colombia</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 1px solid #e2e8f0;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">Empleador:</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; width: 25%; font-weight: bold; color: #475569;">{{empresa_nombre}}</td>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">NIT / Identificación:</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; width: 25%;">{{empresa_nit}}</td>
    </tr>
    <tr>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Trabajador:</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">[Nombre del Trabajador]</td>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Cédula de Ciudadanía:</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">[Cédula del Trabajador]</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Cargo / Funciones:</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">[Cargo a desempeñar]</td>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Salario Básico Mensual:</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">$ [Monto del Salario] COP</td>
    </tr>
  </table>

  <p style="font-size: 13px; text-align: justify;">
    Entre los suscritos a saber, <strong>{{empresa_nombre}}</strong>, legalmente representada por <strong>{{representante_legal}}</strong>, en adelante denominado <strong>EL EMPLEADOR</strong>, y por otra parte el colaborador identificado en la tabla superior, quien en adelante se denominará <strong>EL TRABAJADOR</strong>, acordamos de mutuo acuerdo celebrar el presente Contrato de Trabajo a Término Indefinido bajo las siguientes cláusulas sustanciales:
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA PRIMERA. OBJETO Y PRESTACIÓN PERSONAL DEL SERVICIO:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    EL TRABAJADOR se obliga a prestar sus servicios personales de manera exclusiva al EMPLEADOR en el cargo de **[Cargo a desempeñar]**, ejecutando de forma diligente, cuidadosa y con la mayor lealtad las tareas inherentes a su cargo y las directrices operacionales legítimas impartidas por sus superiores inmediatos. Queda expresamente estipulado que el cargo implica responsabilidades técnicas directas.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA SEGUNDA. JORNADA Y LUGAR DE TRABAJO:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    EL TRABAJADOR cumplirá la jornada laboral máxima legal ordinaria de la República de Colombia, distribuida conforme a los horarios operativos dispuestos por el EMPLEADOR en su Reglamento Interno de Trabajo. Las labores se desempeñarán habitualmente en las dependencias físicas del EMPLEADOR, no obstante, las partes podrán acordar de forma provisional la migración a la modalidad de Teletrabajo o Trabajo en Casa cuando las necesidades del servicio lo aconsejen.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA TERCERA. REMUNERACIÓN Y LIQUIDACIÓN DE PRESTACIONES:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    EL EMPLEADOR pagará al TRABAJADOR como contraprestación por sus servicios un salario básico mensual ascendente a la suma de **$ [Monto del Salario] COP**. Esta suma se cancelará de forma mensualizada y vencida dentro de los últimos cinco (5) días hábiles de cada mes. Este pago incluye de forma proporcional las prestaciones sociales establecidas por el CST, así como las correspondientes cotizaciones obligatorias a la EPS, AFP y ARL conforme a las normas de seguridad social vigentes.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA CUARTA. PERIODO DE PRUEBA:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    Acuerdan las partes fijar un periodo de prueba de **dos (2) meses** (que no supera el límite de sesenta días calendario ni la quinta parte del contrato). Durante este periodo de prueba, cualquiera de las partes podrá dar por terminado de manera unilateral el presente contrato de trabajo en cualquier momento, sin que haya lugar a preaviso legal ni a indemnización económica alguna de conformidad con el CST.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA QUINTA. OBLIGACIÓN EXPRESA DE CUMPLIMIENTO DEL RIT Y POLÍTICAS DEL SG-SST:</h4>
  <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 10px; border-radius: 6px; font-size: 12.5px; text-align: justify;">
    <strong>Sometimiento Reglamentario:</strong> EL TRABAJADOR declara de manera expresa conocer, aceptar y someterse íntegramente a las normas, deberes, prohibiciones y escalas de faltas contenidas en el **Reglamento Interno de Trabajo (RIT)** de {{empresa_nombre}}, así como a las políticas integrales de Seguridad y Salud en el Trabajo (SST), la política de prevención del acoso laboral y de acoso sexual. El incumplimiento verificado de cualquiera de estas disposiciones reglamentarias constituirá una **justa causa para la terminación unilateral** del contrato de trabajo por parte del EMPLEADOR, de acuerdo con el procedimiento sancionatorio establecido.
  </div>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA SEXTA. CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    EL TRABAJADOR se obliga a guardar absoluta reserva y confidencialidad respecto a la información técnica, comercial, bases de datos de clientes, secretos industriales y comerciales a los que tenga acceso directo o indirecto en virtud de su cargo. Cualquier divulgación no autorizada de dicha información confidencial constituirá falta grave de especial trascendencia.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA SÉPTIMA. PROPIEDAD INTELECTUAL E INVENTOS:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    Cualquier invención, desarrollo tecnológico, software, diseño industrial o mejora procesal desarrollada por el TRABAJADOR en el desempeño de su cargo o utilizando los insumos de la compañía, pertenecerá exclusivamente al EMPLEADOR. EL TRABAJADOR se obliga a suscribir los instrumentos legales necesarios para formalizar dicha cesión sin costo adicional.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA OCTAVA. CAUSALES DE TERMINACIÓN DEL CONTRATO:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    Este contrato podrá darse por terminado por las causales legales ordinarias de culminación de las relaciones de trabajo, por mutuo acuerdo de las partes, por despido justificado de conformidad con el Artículo 62 del Código Sustantivo del Trabajo (con observancia del procedimiento sancionatorio y descargos), y por decisión unilateral de cualquiera de las partes mediante indemnización legal si fuere el caso.
  </p>

  ${SIGNATURE_BLOCK_CONTRATO}
</div>
`.trim();

// 8. Contrato de Trabajo a Término Fijo
export const contratoDefinidoHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background-color: #1e3a8a; color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(30,58,138,0.15);">
    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">CONTRATO DE TRABAJO A TÉRMINO FIJO INDIVIDUAL</h1>
    <p style="margin: 6px 0 0; font-size: 12px; opacity: 0.9; text-transform: uppercase; font-weight: 600;">Estructura con Fecha de Expiración y Régimen de Prórrogas</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Conforme al Artículo 46 del Código Sustantivo del Trabajo de Colombia</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 1px solid #cbd5e1;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1; width: 25%;">Empleador:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; width: 25%; font-weight: bold; color: #1e3a8a;">{{empresa_nombre}}</td>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1; width: 25%;">NIT:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; width: 25%;">{{empresa_nit}}</td>
    </tr>
    <tr>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Trabajador:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 600;">[Nombre del Trabajador]</td>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Cédula:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">[Cédula del Trabajador]</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Fecha de Inicio:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">[Fecha Inicio]</td>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Fecha de Vencimiento:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 600; color: #b91c1c;">[Fecha Vencimiento]</td>
    </tr>
    <tr>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Salario Base:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 600;">$ [Salario] COP</td>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Duración Pactada:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">[Meses] Meses</td>
    </tr>
  </table>

  <p style="font-size: 13px; text-align: justify;">
    Entre los suscritos a saber, <strong>{{empresa_nombre}}</strong>, legalmente representada por <strong>{{representante_legal}}</strong>, en adelante denominado <strong>EL EMPLEADOR</strong>, y por otra parte el colaborador identificado en la tabla superior, en adelante denominado <strong>EL TRABAJADOR</strong>, acordamos de mutuo acuerdo celebrar el presente Contrato de Trabajo a Término Fijo regulado por las siguientes cláusulas sustanciales:
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA PRIMERA. DURACIÓN Y MANDATO DE PREAVISO DE NO RENOVACIÓN:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    El presente contrato individual de trabajo tendrá una duración inicial fija de **[Meses] meses**, contados a partir del **[Fecha Inicio]** y con vencimiento en la fecha estipulada de **[Fecha Vencimiento]**. De total conformidad con el Artículo 46 del CST, si ninguna de las partes notifica por escrito a la otra con una antelación **no inferior a treinta (30) días calendario** su determinación expresa de no prorrogar el contrato, este se entenderá renovado automáticamente por un lapso igual al pactado inicialmente. Si el contrato inicial es menor a un año, las prórrogas consecutivas no podrán superar tres (3) periodos iguales o menores, a partir de la cual el término de renovación no podrá ser inferior a un (1) año.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA SEGUNDA. PERIODO DE PRUEBA:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    Establécese un periodo de prueba de **[Meses en letras o número de días]** (que no podrá exceder de la quinta parte de la duración pactada inicialmente, ni superar en ningún caso el límite absoluto de dos meses). Durante este lapso de prueba, cualquiera de las partes podrá dar por terminado de forma unilateral el contrato sin preaviso e indemnización.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA TERCERA. JORNADA Y REMUNERACIÓN:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    EL TRABAJADOR desempeñará sus funciones en la jornada máxima legal vigente en el país, conforme a los turnos operativos asignados por la compañía. Recibirá una asignación salarial básica mensual de **$ [Salario] COP**, cancelada mensualmente. Adicionalmente, tendrá derecho a percibir de manera oportuna y de forma proporcional el pago de todas sus prestaciones sociales (Prima de Servicios, Cesantías, Intereses a las Cesantías y Vacaciones proporcionales al tiempo de servicio real ejecutado).
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA CUARTA. CUMPLIMIENTO INTEGRAL DEL REGLAMENTO INTERNO (RIT):</h4>
  <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 12.5px; text-align: justify;">
    <strong>Sumisión a las Normas Internas:</strong> EL TRABAJADOR se compromete formal y contractualmente a someterse a todas las normas, obligaciones y prohibiciones contenidas en el **Reglamento Interno de Trabajo (RIT)** de {{empresa_nombre}}, las políticas del SG-SST, la política contra el acoso laboral y acoso sexual de la compañía. El incumplimiento verificado constituirá **justa causa para la terminación unilateral anticipada** de la relación laboral conforme al procedimiento legal correspondiente de descargos.
  </div>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA QUINTA. TERMINACIÓN ANTICIPADA E INDEMNIZACIONES:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    De concurrir la finalización unilateral del presente contrato de trabajo por parte del EMPLEADOR sin la concurrencia de una de las justas causas previstas en el Artículo 62 del CST, el EMPLEADOR se obligará a indemnizar al TRABAJADOR de acuerdo con lo consagrado por el Artículo 64 del CST, a saber: el pago de los salarios correspondientes al tiempo que faltare para cumplirse el plazo estipulado en el contrato.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA SEXTA. PROPIEDAD INTELECTUAL Y CONFIDENCIALIDAD:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    Toda obra literaria, científica o artística, software, diseño o invención producida por el TRABAJADOR en el marco de sus funciones contractuales, es de propiedad del EMPLEADOR. EL TRABAJADOR mantendrá absoluta reserva sobre los secretos empresariales de la organización.
  </p>

  ${SIGNATURE_BLOCK_CONTRATO}
</div>
`.trim();

// 9. Contrato de Prestación de Servicios
export const contratoServiciosHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background-color: #0f766e; color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(15,118,110,0.15);">
    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">CONTRATO CIVIL DE PRESTACIÓN DE SERVICIOS PROFESIONALES</h1>
    <p style="margin: 6px 0 0; font-size: 12px; opacity: 0.9; text-transform: uppercase; font-weight: 600;">Deslinde de Relación Laboral / Naturaleza Comercial y Civil</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Régimen de la Autonomía Técnica y Directiva (Código Civil Colombiano)</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 1px solid #cbd5e1;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1; width: 25%;">Contratante:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; width: 25%; font-weight: bold; color: #0f766e;">{{empresa_nombre}}</td>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1; width: 25%;">NIT:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; width: 25%;">{{empresa_nit}}</td>
    </tr>
    <tr>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Contratista:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 600;">[Nombre del Profesional / Contratista]</td>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">CC / NIT Contratista:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">[Identificación Contratista]</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Honorarios Pactados:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 600;">$ [Monto Honorarios] COP</td>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Duración del Servicio:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">[Plazo del Contrato]</td>
    </tr>
  </table>

  <p style="font-size: 13px; text-align: justify;">
    Entre los suscritos a saber, <strong>{{empresa_nombre}}</strong>, representada legalmente por <strong>{{representante_legal}}</strong>, en adelante denominado **EL CONTRATANTE**, y por otra parte la persona natural u jurídica identificada en la tabla superior como **EL CONTRATISTA**, celebramos de mutuo acuerdo el presente Contrato Civil de Prestación de Servicios Profesionales bajo las siguientes cláusulas obligacionales:
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA PRIMERA. OBJETO DE PRESTACIÓN INDEPENDIENTE:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    EL CONTRATISTA se obliga de forma totalmente independiente a prestar sus servicios calificados consistentes en **[Detalle minucioso del servicio profesional]** en favor del CONTRATANTE. EL CONTRATISTA garantiza la ejecución idónea del objeto con absoluta **autonomía técnica, administrativa, directiva e intelectual**, utilizando sus propios recursos, herramientas de trabajo y personal técnico si así lo considerase necesario, sin estar sometido a subordinación de ningún tipo.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA SEGUNDA. EXCLUSIÓN DE RELACIÓN LABORAL Y DE NORMAS DISCIPLINARIAS DEL RIT:</h4>
  <div style="background-color: #f0fdfa; border: 1px solid #5eead4; padding: 12px; border-radius: 6px; font-size: 12.5px; text-align: justify; margin-bottom: 15px; color: #0f766e;">
    <strong>Garantía de Realidad Civil:</strong> Las partes declaran de forma unánime y expresa que el presente vínculo es exclusivamente civil y comercial, fundamentado en la autonomía privada. Por consiguiente, **al CONTRATISTA no le son aplicables las normas de control disciplinario, órdenes jerárquicas o sanciones previstas en el Reglamento Interno de Trabajo (RIT)** de {{empresa_nombre}}, las cuales rigen estrictamente a los trabajadores subordinados. Cualquier desavenencia contractual o incumplimiento del objeto se resolverá mediante la exigencia de penalidades comerciales pactadas en este documento o en tribunales civiles. Sin perjuicio de lo anterior, si el CONTRATISTA debe ingresar presencialmente a las dependencias de la empresa, estará obligado al estricto cumplimiento de los **Estándares Mínimos del SG-SST** para prevenir riesgos laborales en planta.
  </div>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA TERCERA. VALOR Y FORMA DE PAGO:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    El valor global del presente contrato asciende a la suma de **$ [Monto Honorarios] COP**, los cuales serán cancelados por el CONTRATANTE previa entrega a satisfacción de los informes de avance correspondientes y de la factura comercial u cuenta de cobro correspondiente debidamente aprobada por el interventor del contrato.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA CUARTA. OBLIGACIÓN EXPRESA DE APORTES A LA SEGURIDAD SOCIAL:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    De total conformidad con la Ley Colombiana (Decreto 1273 de 2018), EL CONTRATISTA asume el deber indelegable de afiliarse y cotizar mensualmente al Sistema de Seguridad Social Integral (EPS, AFP y ARL) sobre una base mínima equivalente al **cuarenta por ciento (40%)** del valor mensualizado del contrato. EL CONTRATISTA presentará los soportes de pago de aportes de forma mensualizada como requisito previo y obligatorio para tramitar cualquier desembolso de honorarios por parte del CONTRATANTE.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA QUINTA. CONFIDENCIALIDAD:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    EL CONTRATISTA mantendrá absoluto sigilo sobre la información comercial, técnica y operativa confidencial a la que acceda en virtud del contrato, absteniéndose de utilizarla en beneficio propio o de terceros durante y después de la vigencia de este contrato.
  </p>

  ${SIGNATURE_BLOCK_CONTRATO}
</div>
`.trim();

// 10. Contrato de Trabajo por Obra o Labor
export const contratoObraLaborHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background-color: #7c2d12; color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(124,45,18,0.15);">
    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">CONTRATO INDIVIDUAL DE TRABAJO POR OBRA O LABOR DETERMINADA</h1>
    <p style="margin: 6px 0 0; font-size: 12px; opacity: 0.9; text-transform: uppercase; font-weight: 600;">Terminación Vinculada de Forma Estricta a la Finalización del Objeto</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Conforme al Artículo 45 del Código Sustantivo del Trabajo de Colombia</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 1px solid #cbd5e1;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1; width: 25%;">Empleador:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; width: 25%; font-weight: bold; color: #7c2d12;">{{empresa_nombre}}</td>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1; width: 25%;">NIT:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; width: 25%;">{{empresa_nit}}</td>
    </tr>
    <tr>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Trabajador:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 600;">[Nombre del Trabajador]</td>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Cédula:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">[Cédula del Trabajador]</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Obra / Proyecto Definido:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 600; color: #7c2d12;">[Nombre de la Obra o Proyecto Específico]</td>
      <td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Salario:</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 600;">$ [Monto Salarial] COP</td>
    </tr>
  </table>

  <p style="font-size: 13px; text-align: justify;">
    Entre los suscritos a saber, <strong>{{empresa_nombre}}</strong>, legalmente representada por <strong>{{representante_legal}}</strong>, en adelante denominado <strong>EL EMPLEADOR</strong>, y por otra parte el colaborador identificado en la tabla superior, en adelante denominado <strong>EL TRABAJADOR</strong>, acordamos de mutuo acuerdo celebrar el presente Contrato de Trabajo por Obra o Labor determinada bajo las siguientes cláusulas sustanciales:
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA PRIMERA. OBJETO Y DELIMITACIÓN DE LA OBRA O LABOR:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    EL TRABAJADOR es contratado de manera específica y exclusiva para ejecutar la labor consistente en **[Detalle minucioso de las tareas en la obra o proyecto]**, la cual se inscribe estrictamente dentro del proyecto superior denominado **[Nombre de la Obra o Proyecto Específico]** desarrollado por el EMPLEADOR. Las partes acuerdan expresamente de forma consensual que la vigencia del contrato está condicionada única y exclusivamente a la duración del proyecto referido.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA SEGUNDA. DURACIÓN Y EXTINCIÓN CONTRACTUAL:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    De conformidad con el Artículo 45 del CST, el presente contrato individual de trabajo perdurará por el tiempo que sea estrictamente necesario para la total y completa terminación de la obra o labor descrita en la Cláusula Primera. El contrato se extinguirá de forma automática e inmediata, sin requerir preaviso de terminación por escrito, en el momento en que se culmine el correspondiente proyecto, procediéndose a la liquidación proporcional de prestaciones.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA TERCERA. PERIODO DE PRUEBA:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    Se acuerda un periodo de prueba de **[Días] días** (que no podrá exceder de la quinta parte de la duración presunta de la obra, ni ser superior en ningún caso a dos meses). Durante este lapso, el contrato podrá darse por terminado unilateralmente por cualquiera de las partes sin previo aviso ni indemnización.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA CUARTA. OBLIGACIÓN EXPRESA DE CUMPLIMIENTO DEL RIT Y SG-SST:</h4>
  <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 12.5px; text-align: justify;">
    <strong>Rigor de Convivencia y Seguridad en la Obra:</strong> Durante la ejecución de la obra contratada, EL TRABAJADOR se obliga de forma absoluta a cumplir con las normas de disciplina, orden y convivencia establecidas en el **Reglamento Interno de Trabajo (RIT)** de {{empresa_nombre}}, los estándares de seguridad industrial del SG-SST y el plan de prevención del acoso laboral. El incumplimiento verificado de estas disposiciones será justa causa de despido inmediato.
  </div>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA QUINTA. REMUNERACIÓN:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    EL EMPLEADOR pagará al TRABAJADOR por la ejecución de la labor específica, un salario básico mensualizado de **$ [Monto Salarial] COP**. El TRABAJADOR tendrá pleno derecho al disfrute proporcional de prima, cesantías e intereses.
  </p>

  ${SIGNATURE_BLOCK_CONTRATO}
</div>
`.trim();

// 11. Nuevo Documento: Procedimiento Sancionatorio Laboral
export const procedimientoSancionatorioHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background: linear-gradient(135deg, #475569 0%, #1e293b 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(30,41,59,0.15); position: relative;">
    <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px; letter-spacing: 0.5px;">CÓDIGO: RIT-PROC-001 | V.01</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">REGULACIÓN DEL PROCEDIMIENTO SANCIONATORIO LABORAL</h1>
    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 600; text-transform: uppercase;">Debido Proceso Constitucional y Garantía del Derecho de Defensa</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Alineado con el Artículo 115 del Código Sustantivo del Trabajo (Reforma Laboral Ley 2466 de 2025) y la Sentencia C-593 de 2014</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">Empresa:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; width: 25%; font-weight: 600; color: #1e293b;">{{empresa_nombre}}</td>
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0; width: 25%;">NIT:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; width: 25%;">{{empresa_nit}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Aprobador:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">{{representante_legal}}</td>
      <td style="padding: 10px; font-weight: bold; border: 1px solid #e2e8f0;">Fecha de Vigencia:</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0;">22/05/2026</td>
    </tr>
  </table>

  <h3 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. PROPÓSITO Y PRINCIPIOS GENERALES DEL DEBIDO PROCESO</h3>
  <p style="text-align: justify; font-size: 13.5px;">
    En <strong>{{empresa_nombre}}</strong>, garantizamos que la imposición de cualquier sanción disciplinaria o correctiva se fundamentará bajo el respeto absoluto de los derechos constitucionales. El presente **Procedimiento Sancionatorio Laboral** rige de manera obligatoria y exclusiva para todo trámite correctivo de trabajadores directos, asegurando la vigencia de los siguientes principios rectores:
  </p>
  <ul style="padding-left: 20px; font-size: 13px; margin-bottom: 20px; text-align: justify;">
    <li style="margin-bottom: 8px;"><strong>Presunción de Inocencia:</strong> Todo trabajador investigado se presume inocente de los cargos que se le imputan hasta tanto no se demuestre lo contrario en la correspondiente audiencia disciplinaria con elementos probatorios objetivos.</li>
    <li style="margin-bottom: 8px;"><strong>Derecho a la Defensa y Contradicción:</strong> El investigado tiene derecho a ser escuchado (descargos), a aportar las pruebas conducentes y a refutar las pruebas recaudadas en su contra.</li>
    <li style="margin-bottom: 8px;"><strong>Principio de Inmediatez:</strong> El empleador iniciará el procedimiento sancionatorio de forma oportuna tras la ocurrencia o conocimiento de los hechos, evitando retrasos injustificados.</li>
    <li style="margin-bottom: 8px;"><strong>Proporcionalidad y Razonabilidad:</strong> La sanción disciplinaria a imponer guardará estricta relación y equilibrio con la gravedad de la falta cometida y los antecedentes del trabajador.</li>
  </ul>

  <h3 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. ETAPAS PROCEDIMENTALES OBLIGATORIAS (SENTENCIA C-593 DE 2014)</h3>
  <p style="font-size: 13px; text-align: justify;">Para la validez de cualquier sanción disciplinaria de amonestación, suspensión del cargo o despido por justa causa, se agotará indefectiblemente el siguiente flujograma procedimental:</p>

  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 13px; text-align: justify;">
    <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px; font-weight: 700;">Etapa 1: Apertura de Investigación e Informe de Faltas</h4>
    <p style="margin: 0 0 12px 0;">Ocurrido un hecho constitutivo de presunta falta laboral conforme al RIT, el jefe inmediato o el área de Talento Humano elaborará un informe circunstanciado del suceso. Se abre oficialmente el expediente disciplinario.</p>

    <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px; font-weight: 700;">Etapa 2: Citación Formal a Audiencia de Descargos y Traslado de Pruebas</h4>
    <p style="margin: 0 0 12px 0;">Se citará al trabajador por escrito con una antelación mínima de **tres (3) días hábiles** a la fecha fijada para la audiencia. La citación por escrito deberá especificar con total precisión: los hechos investigados (fechas, horas, lugares), las normas del RIT o del CST presuntamente vulneradas y la fecha y hora de la audiencia. Adicionalmente, **junto con la citación, se le entregará copia íntegra de la totalidad de las pruebas recaudadas** (traslado de pruebas), para que pueda preparar debidamente su defensa.</p>

    <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px; font-weight: 700;">Etapa 3: Audiencia Formal de Descargos y Asistencia de Compañeros</h4>
    <p style="margin: 0 0 12px 0;">Llegado el día y hora, se instalará la audiencia dirigida por el Líder de Talento Humano. El trabajador rendirá libremente su versión de los hechos. **EL TRABAJADOR tendrá el derecho irrestricto de comparecer asistido por dos (2) compañeros de trabajo o por dos delegados sindicales** si estuviere afiliado a una organización sindical. Durante la audiencia, el trabajador podrá aportar sus propias pruebas físicas o testimoniales. Se levantará un acta detallada de descargos que será firmada por todos los asistentes.</p>

    <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px; font-weight: 700;">Etapa 4: Análisis de Pruebas y Emisión de Decisión Motivada</h4>
    <p style="margin: 0 0 12px 0;">Concluida la audiencia, la empresa contará con un plazo de **cinco (5) días hábiles** para valorar en conjunto las pruebas y los descargos del trabajador. La decisión disciplinaria **se notificará obligatoriamente por escrito** al trabajador, y contendrá la correspondiente **motivación fáctica e individualización de las pruebas** que demuestran la culpabilidad, justificando la proporcionalidad de la sanción a imponer de conformidad con las escalas del RIT.</p>

    <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px; font-weight: 700;">Etapa 5: Recurso de Apelación y Doble Instancia</h4>
    <p style="margin: 0;">En garantía del debido proceso y doble instancia, el trabajador que no se encuentre de acuerdo con la sanción impuesta **podrá interponer el Recurso de Apelación por escrito dentro de los tres (3) días hábiles siguientes** a la notificación de la sanción. El recurso será resuelto por un nivel jerárquico superior (ej. Gerencia General o Representación Legal), quien revisará el expediente disciplinario y emitirá la decisión final confirmando, modificando o revocando la sanción, en un término máximo de cinco (5) días hábiles.</p>
  </div>

  <h3 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. ESCALA DE MEDIDAS SANCIONATORIAS LÍMITES</h3>
  <p style="font-size: 13px; text-align: justify;">De conformidad con el Código Sustantivo del Trabajo de Colombia, las sanciones a aplicar por la compañía no podrán consistir en penas corporales, ni en medidas lesivas de la dignidad humana, limitándose estrictamente a:</p>
  <ul style="padding-left: 20px; font-size: 13px; margin-bottom: 20px; text-align: justify;">
    <li style="margin-bottom: 6px;"><strong>Amonestación Escrita:</strong> Llamado de atención pedagógico por faltas leves. Se anexa copia a la hoja de vida.</li>
    <li style="margin-bottom: 6px;"><strong>Suspensión del Trabajo (Faltas Graves):</strong> Suspensión de la relación laboral y del salario por un término no mayor a ocho (8) días por la primera falta, ni mayor a dos (2) meses en caso de reincidencia persistente.</li>
    <li style="margin-bottom: 6px;"><strong>Despido con Justa Causa:</strong> Aplicable únicamente ante faltas gravísimas catalogadas explícitamente en el RIT, el contrato de trabajo o en el Artículo 62 del CST, una vez surtido íntegramente este procedimiento disciplinario formal.</li>
  </ul>

  ${SIGNATURE_BLOCK_SST}
</div>
`.trim();
