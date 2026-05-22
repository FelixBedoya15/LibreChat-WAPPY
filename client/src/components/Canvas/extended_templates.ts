/**
 * Extended Corporate Templates for WAPPY Canvas
 * Complete, compliant, and beautifully designed in Spanish
 * Aligned with Colombian Labor Laws, Decree 1072 of 2015, and RIT.
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
    <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px; letter-spacing: 0.5px;">CÓDIGO: SST-POL-007 | V.01</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">POLÍTICA DE DESCONEXIÓN LABORAL Y SALUD DIGITAL</h1>
    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 600; text-transform: uppercase;">Garantía Constitucional y Bienestar Laboral</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Conforme a la Ley 2191 de 2022 y la Reforma Laboral de la República de Colombia</p>
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
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date().toLocaleDateString('es-ES')}</td>
    </tr>
  </table>

  <h3 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. OBJETIVO Y MARCO DE APLICACIÓN</h3>
  <p style="text-align: justify; font-size: 13.5px;">
    En <strong>{{empresa_nombre}}</strong>, entendemos que la salud mental y la conciliación de la vida personal, familiar y laboral son pilares esenciales del desempeño sostenible. La presente política tiene como objeto regular y garantizar el derecho a la desconexión laboral de todos los trabajadores, asegurando que, al finalizar su jornada de trabajo estipulada legalmente o pactada contractualmente, gocen de plena libertad de no atender comunicaciones, llamadas, correos electrónicos, mensajes de WhatsApp o cualquier interacción digital de carácter laboral.
  </p>

  <h3 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. DECLARACIÓN DE DERECHOS Y COMPROMISOS</h3>
  <ul style="padding-left: 20px; font-size: 13px; margin-bottom: 20px;">
    <li style="margin-bottom: 8px;"><strong>Derecho a no responder:</strong> Ningún trabajador será reconvenido, penalizado, discriminado ni desfavorecido por no atender comunicaciones fuera de su horario laboral establecido o durante sus periodos de descanso, permisos o vacaciones.</li>
    <li style="margin-bottom: 8px;"><strong>Abstención de emisión de directrices:</strong> La alta dirección y los líderes de equipo se comprometen a abstenerse de enviar directrices laborales, requerimientos operativos o delegaciones de tareas fuera de la jornada de trabajo, a menos que correspondan a situaciones excepcionales descritas en el literal siguiente.</li>
    <li style="margin-bottom: 8px;"><strong>Gestión Diferida:</strong> Se implementará de forma obligatoria el uso de programación de envío diferido en herramientas de correo para que las ideas u orientaciones nacidas fuera del horario se entreguen al inicio de la siguiente jornada ordinaria.</li>
  </ul>

  <h3 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. EXCEPCIONES LEGALES</h3>
  <p style="font-size: 13px; text-align: justify;">
    De conformidad con el Artículo 6 de la Ley 2191 de 2022, el derecho a la desconexión no será aplicable en los siguientes cargos o situaciones especiales:
  </p>
  <ul style="padding-left: 20px; font-size: 13px; margin-bottom: 20px;">
    <li style="margin-bottom: 6px;">Trabajadores que desempeñen cargos de dirección, confianza y manejo.</li>
    <li style="margin-bottom: 6px;">Aquellos que por la naturaleza de su actividad tengan esquemas de disponibilidad permanente o turnos de soporte técnico/operativo previamente acordados y remunerados.</li>
    <li style="margin-bottom: 6px;">Situaciones de fuerza mayor, caso fortuito o urgencia imprevista donde se requiera evitar un daño grave o afectación inminente a la continuidad de la operación de {{empresa_nombre}}.</li>
  </ul>

  <h3 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">4. ALINEACIÓN CON EL REGLAMENTO INTERNO DE TRABAJO (RIT)</h3>
  <div style="background-color: #f5f3ff; border-left: 4px solid #6366f1; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 13px;">
    <strong>Vínculo Disciplinario:</strong> Las conductas persistentes de acoso telefónico, digital o requerimientos sistemáticos fuera de la jornada laboral ordinaria por parte de jefes inmediatos o compañeros de trabajo hacia otros colaboradores serán consideradas infracciones graves a las obligaciones laborales y contrarias a la armonía laboral. Tales conductas se tramitarán conforme al <strong>Capítulo de Procedimientos y Sanciones Disciplinarias</strong> del Reglamento Interno de Trabajo de {{empresa_nombre}}, pudiendo acarrear sanciones de suspensión laboral u otras medidas proporcionales.
  </div>

  <h3 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">5. CANAL DE DENUNCIA Y PROCEDIMIENTO</h3>
  <p style="font-size: 13px; text-align: justify;">
    Cualquier trabajador que sienta vulnerado su derecho a la desconexión laboral podrá reportar la situación de forma confidencial y segura ante el <strong>Comité de Convivencia Laboral</strong>. Este comité iniciará el protocolo de conciliación interna y emitirá las recomendaciones correctivas al área de Talento Humano y la Gerencia General para prevenir la reincidencia.
  </p>

  ${SIGNATURE_BLOCK_SST}
</div>
`.trim();

// 2. Política de Prevención de Acoso Laboral
export const politicaAcosoLaboralHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(16,185,129,0.15); position: relative;">
    <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px;">CÓDIGO: SST-POL-008 | V.03</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">POLÍTICA DE PREVENCIÓN DEL ACOSO LABORAL</h1>
    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 600; text-transform: uppercase;">Convivencia Armónica, Respeto y Dignidad Humana</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Enmarcada en la Ley 1010 de 2006 y las directrices del Ministerio del Trabajo de Colombia</p>
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
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date().toLocaleDateString('es-ES')}</td>
    </tr>
  </table>

  <h3 style="color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. DECLARACIÓN DE TOLERANCIA CERO</h3>
  <p style="text-align: justify; font-size: 13.5px;">
    En <strong>{{empresa_nombre}}</strong> rechazamos enérgicamente cualquier manifestación de acoso laboral, discriminación, hostigamiento, maltrato o persecución en el entorno de trabajo. Establecemos de forma rotunda el compromiso de propiciar un ambiente laboral sano, digno, seguro y constructivo, donde prime el respeto mutuo entre todos los colaboradores, independientemente de su jerarquía, cargo o tipo de vinculación.
  </p>

  <h3 style="color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. DEFINICIÓN Y MODALIDADES DE ACOSO</h3>
  <p style="font-size: 13.5px; text-align: justify;">
    Conforme a la Ley 1010 de 2006, se entiende por acoso laboral toda conducta persistente y demostrable, ejercida sobre un empleado por parte de un empleador, jefe, superior jerárquico, compañero de trabajo o subalterno, encaminada a infundir miedo, intimidación, terror y angustia, a causar perjuicio laboral, generar desmotivación en el trabajo, o inducir la renuncia del mismo. Se identifican las siguientes modalidades críticas:
  </p>
  <ul style="padding-left: 20px; font-size: 13px; margin-bottom: 20px;">
    <li style="margin-bottom: 8px;"><strong>Maltrato laboral:</strong> Todo acto de violencia contra la integridad física o moral, la libertad física o sexual, y los bienes de quien se desempeñe como trabajador.</li>
    <li style="margin-bottom: 8px;"><strong>Persecución laboral:</strong> Conducta cuyas características de reiteración o evidente arbitrariedad permitan inferir el propósito de inducir la renuncia del empleado.</li>
    <li style="margin-bottom: 8px;"><strong>Discriminación laboral:</strong> Trato diferenciado por razones de raza, género, origen familiar, religión, opinión política o filosófica.</li>
    <li style="margin-bottom: 8px;"><strong>Inequidad laboral:</strong> Asignación de funciones a menosprecio del trabajador.</li>
  </ul>

  <h3 style="color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. VÍNCULO CON EL REGLAMENTO INTERNO DE TRABAJO (RIT)</h3>
  <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; text-align: justify;">
    <strong>Coherencia Legal y Sanciones:</strong> El Reglamento Interno de Trabajo (RIT) de {{empresa_nombre}} (en su capítulo de obligaciones y prohibiciones) prohíbe de forma explícita toda conducta tipificada como acoso laboral. La comprobación del acoso laboral a través del debido proceso disciplinario constituirá una **justa causa para la terminación unilateral del contrato de trabajo** sin indemnización alguna (si es cometido por un superior o compañero laboral), o será sancionado con multas y suspensiones severas de conformidad con las escalas de faltas contenidas en el RIT y la legislación colombiana vigente.
  </div>

  <h3 style="color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">4. MEDIDAS PREVENTIVAS Y EL COMITÉ DE CONVIVENCIA</h3>
  <p style="font-size: 13px; text-align: justify;">
    La organización implementará de forma constante talleres de sensibilización, campañas de fomento del respeto, y mantendrá activo y capacitado al <strong>Comité de Convivencia Laboral</strong>. Este comité, constituido de forma paritaria, operará de forma confidencial para mediar de forma preventiva y generar recomendaciones antes de activar rutas externas.
  </p>

  ${SIGNATURE_BLOCK_CONVIVENCIA}
</div>
`.trim();

// 3. Protocolo de Intervención Frente al Acoso Laboral
export const protocoloAcosoLaboralHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(13,148,136,0.15); position: relative;">
    <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px;">CÓDIGO: SST-PRO-009 | V.02</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">PROTOCOLO DE INTERVENCIÓN FRENTE AL ACOSO LABORAL</h1>
    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 600; text-transform: uppercase;">Procedimiento de Queja, Mediación y Debido Proceso</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Ruta Oficial de Convivencia Laboral y Garantías de Confidencialidad</p>
  </div>

  <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. PRESENTACIÓN Y RECEPCIÓN DE LA QUEJA</h3>
  <p style="text-align: justify; font-size: 13px;">
    Cualquier colaborador de <strong>{{empresa_nombre}}</strong> que considere que está siendo víctima de acoso laboral podrá activar este protocolo formal mediante la presentación de una queja escrita ante el <strong>Comité de Convivencia Laboral</strong> o al correo institucional asignado para este fin. La queja deberá incluir:
  </p>
  <ul style="padding-left: 20px; font-size: 12.5px; margin-bottom: 16px;">
    <li>Nombres y cargo de la persona presuntamente afectada.</li>
    <li>Nombres y cargo de la persona presuntamente acosadora.</li>
    <li>Relación cronológica de los hechos con fechas y lugares.</li>
    <li>Pruebas documentales, correos, chats o testimonios que sustenten la queja.</li>
  </ul>

  <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. ETAPAS DEL PROCEDIMIENTO DE MEDIACIÓN</h3>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 1px solid #e2e8f0;">
    <thead>
      <tr style="background-color: #f1f5f9; font-weight: bold; color: #0f766e;">
        <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; width: 20%;">Fase</th>
        <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; width: 50%;">Descripción de Actividades</th>
        <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; width: 30%;">Responsable y Plazos</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">1. Admisión</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">Revisión inicial del caso y verificación de indicios de acoso conforme a la Ley 1010. Se cita a las partes de forma individual.</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Comité de Convivencia<br><em>Plazo: 5 días hábiles</em></td>
      </tr>
      <tr style="background-color: #f8fafc;">
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">2. Mediación</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">Audiencia de conciliación y compromiso mutuo para restablecer un clima de respeto y armonía en el área.</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Comité de Convivencia<br><em>Plazo: 10 días hábiles</em></td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">3. Seguimiento</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0;">Evaluación del cumplimiento de los acuerdos de convivencia y del cese de las conductas hostiles.</td>
        <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Comité / Líder Talento Humano<br><em>Plazo: 30 días posteriores</em></td>
      </tr>
    </tbody>
  </table>

  <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. VÍNCULO DISCIPLINARIO CON EL REGLAMENTO INTERNO DE TRABAJO (RIT)</h3>
  <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; text-align: justify;">
    <strong>Escalada Disciplinaria Obligatoria:</strong> En el evento en que los compromisos de conciliación sean incumplidos por el presunto acosador, o si la queja reviste una gravedad inaceptable que imposibilite la mediación ordinaria, el Comité de Convivencia remitirá formalmente el expediente completo al **Líder de Talento Humano** para la apertura inmediata del **proceso disciplinario formal bajo los términos del Reglamento Interno de Trabajo**. Cualquier conducta probada de acoso conllevará la aplicación directa de sanciones contempladas en el RIT, incluyendo la rescisión de contrato laboral con justa causa.
  </div>

  <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">4. GARANTÍA DE NO REPRESALIAS</h3>
  <p style="font-size: 13px; text-align: justify;">
    {{empresa_nombre}} garantiza absoluta confidencialidad durante todo el proceso. Ningún trabajador que actúe de buena fe como quejoso o testigo de acoso laboral podrá ser despedido, sancionado o desmejorado en sus condiciones de trabajo dentro de los seis (6) meses siguientes al reporte, gozando de las protecciones establecidas por la ley.
  </p>

  ${SIGNATURE_BLOCK_CONVIVENCIA}
</div>
`.trim();

// 4. Política de Prevención de Acoso Sexual Laboral
export const politicaAcosoSexualHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background: linear-gradient(135deg, #db2777 0%, #be123c 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(219,39,119,0.15); position: relative;">
    <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px;">CÓDIGO: SST-POL-010 | V.01</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">POLÍTICA DE PREVENCIÓN DEL ACOSO SEXUAL LABORAL</h1>
    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 600; text-transform: uppercase;">Tolerancia Cero frente a la Violencia Sexual y de Género</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Conforme a la Ley 2365 de 2024 de la República de Colombia</p>
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
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date().toLocaleDateString('es-ES')}</td>
    </tr>
  </table>

  <h3 style="color: #be123c; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. DECLARACIÓN DE PRINCIPIOS Y ENFOQUE</h3>
  <p style="text-align: justify; font-size: 13.5px;">
    En <strong>{{empresa_nombre}}</strong>, reafirmamos de manera contundente la <strong>tolerancia cero</strong> ante cualquier conducta que configure acoso sexual, acoso por razones de sexo, identidad de género, orientación sexual o cualquier agresión verbal, no verbal o física de índole sexual en el entorno laboral. En cumplimiento riguroso de la <strong>Ley 2365 de 2024</strong>, nos comprometemos a adoptar medidas integrales para prevenir, erradicar y sancionar este tipo de conductas degradantes.
  </p>

  <h3 style="color: #be123c; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. CONDUCTAS EXPRESAMENTE PROHIBIDAS</h3>
  <p style="font-size: 13px; text-align: justify;">Esta política prohíbe de forma exhaustiva los siguientes comportamientos en todos los ámbitos relacionados con la prestación de servicios:</p>
  <ul style="padding-left: 20px; font-size: 13px; margin-bottom: 20px;">
    <li style="margin-bottom: 8px;"><strong>Comportamiento Verbal:</strong> Bromas sexuales, comentarios inapropiados sobre la apariencia o el cuerpo, solicitudes insistentes de citas inapropiadas o proposiciones de carácter íntimo indeseadas.</li>
    <li style="margin-bottom: 8px;"><strong>Comportamiento No Verbal:</strong> Gestos obscenos, envío de material de contenido sexual explícito a través de correo corporativo o WhatsApp, miradas lascivas o insistencia en invadir el espacio personal.</li>
    <li style="margin-bottom: 8px;"><strong>Comportamiento Físico:</strong> Tocamientos innecesarios, abrazos o besos no deseados, roces corporales intencionados o acorralamientos físicos.</li>
  </ul>

  <h3 style="color: #be123c; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. ALINEACIÓN RIGUROSA CON EL REGLAMENTO INTERNO DE TRABAJO (RIT)</h3>
  <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; text-align: justify;">
    <strong>Consecuencias Disciplinarias Inmediatas:</strong> Conforme al Reglamento Interno de Trabajo (RIT) de {{empresa_nombre}}, el acoso sexual es considerado una **infracción gravísima de especial trascendencia**. La sola sospecha fundada dará lugar a medidas cautelares inmediatas de separación de ambientes. De confirmarse la agresión o conducta de acoso sexual a través de la ruta establecida, la sanción aplicable al responsable será la **terminación inmediata del contrato de trabajo con justa causa**, sin perjuicio de las denuncias penales correspondientes ante la Fiscalía General de la Nación, bajo la Ley 1257 de 2008.
  </div>

  <h3 style="color: #be123c; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">4. DEBER DE PROTECCIÓN Y CANALES</h3>
  <p style="font-size: 13px; text-align: justify;">
    {{empresa_nombre}} protegerá la intimidad, confidencialidad y dignidad de las víctimas y denunciantes, aplicando en todo momento el principio de no revictimización. No se permitirá ningún tipo de retaliación laboral contra quienes denuncien conductas contrarias a esta política.
  </p>

  ${SIGNATURE_BLOCK_CONVIVENCIA}
</div>
`.trim();

// 5. Protocolo de Canalización y Atención al Acoso Sexual
export const protocoloAcosoSexualHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(139,92,246,0.15); position: relative;">
    <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px;">CÓDIGO: SST-PRO-011 | V.01</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">PROTOCOLO DE ATENCIÓN Y CANALIZACIÓN DEL ACOSO SEXUAL</h1>
    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 600; text-transform: uppercase;">Ruta de Protección Inmediata, Medidas Cautelares y Rigor Disciplinario</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">Conforme a la Ley 2365 de 2024 de la República de Colombia</p>
  </div>

  <h3 style="color: #7c3aed; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. PRIMERA ACOGIDA Y MEDIDAS CAUTELARES</h3>
  <p style="text-align: justify; font-size: 13px;">
    Ante la interposición de una queja por presunto acosamiento sexual en <strong>{{empresa_nombre}}</strong>, se activará de forma inmediata la <strong>Ruta de Emergencia</strong> de Talento Humano. En un plazo no mayor a **veinticuatro (24) horas hábiles**, se decretarán medidas cautelares obligatorias con el fin de proteger de forma incondicional a la presunta víctima. Estas medidas pueden incluir:
  </p>
  <ul style="padding-left: 20px; font-size: 12.5px; margin-bottom: 16px;">
    <li style="margin-bottom: 6px;">Reubicación de puesto de trabajo física u operativa del presunto agresor, o en su defecto de la presunta víctima si esta así lo prefiere.</li>
    <li style="margin-bottom: 6px;">Ajuste de horarios laborales o transferencia provisional al esquema de trabajo en casa (Home Office) del presunto implicado.</li>
    <li style="margin-bottom: 6px;">Suspensión temporal del uso de canales directos de interacción en proyectos conjuntos.</li>
  </ul>

  <h3 style="color: #7c3aed; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. FLUJOGRAMA DE LA RUTA DE ATENCIÓN DE ACOSO SEXUAL</h3>
  <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 12.5px; color: #581c87;">
    <strong>[Paso 1: Recepción]</strong> Se radica la queja de forma reservada. No se requiere historial de reiteración para iniciar.<br>
    <div style="margin-left: 20px; border-left: 2px solid #c084fc; padding-left: 10px; margin-top: 5px; margin-bottom: 5px;">
      <strong>[Paso 2: Medidas Cautelares]</strong> Separación total de ambientes laborales (24 horas).<br>
      <strong>[Paso 3: Investigación Confidencial]</strong> Recolección acelerada de elementos probatorios.<br>
      <strong>[Paso 4: Remisión Disciplinaria RIT]</strong> Envío directo a proceso de descargos disciplinarios formal.
    </div>
    <strong>[Paso 5: Decisión y Sanción]</strong> Aplicación del Reglamento Interno y remisión judicial externa si aplica.
  </div>

  <h3 style="color: #7c3aed; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. DEBER DE COMUNICACIÓN A AUTORIDADES</h3>
  <p style="font-size: 13px; text-align: justify;">
    De identificarse indicios claros de conductas punibles conforme al Código Penal Colombiano (Artículo 210A, Acoso Sexual), la Gerencia General de {{empresa_nombre}}, en cumplimiento de la Ley 2365 de 2024, procederá a dar traslado inmediato del expediente a la Fiscalía General de la Nación, ofreciendo a la víctima asistencia psicológica y orientación legal primaria.
  </p>

  <h3 style="color: #7c3aed; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">4. ALINEACIÓN CON EL REGLAMENTO INTERNO DE TRABAJO (RIT)</h3>
  <div style="background-color: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; text-align: justify;">
    <strong>Rigor de Descargos:</strong> El procedimiento de investigación no exime al presunto infractor de ser citado a descargos disciplinarios formales de conformidad con las garantías de **debido proceso legal establecidas en el Capítulo Disciplinario del RIT**. La falsedad intencionada en denuncias de acoso sexual también será considerada falta grave al RIT y sancionada según su respectiva gravedad.
  </div>

  ${SIGNATURE_BLOCK_CONVIVENCIA}
</div>
`.trim();

// 6. Política de Equidad de Género y Diversidad
export const politicaGeneroHTML = `
<div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
  <!-- Cabecera Premium -->
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%); color: #ffffff; padding: 28px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; box-shadow: 0 4px 15px rgba(79,70,229,0.15); position: relative;">
    <div style="position: absolute; top: 12px; right: 16px; font-size: 10px; opacity: 0.85; font-weight: 700; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 20px;">CÓDIGO: SST-POL-012 | V.01</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">POLÍTICA DE EQUIDAD DE GÉNERO, DIVERSIDAD E INCLUSIÓN</h1>
    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 600; text-transform: uppercase;">Igualdad de Oportunidades, Brecha Salarial Cero y Diversidad</p>
    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.75; font-style: italic;">En línea con los Objetivos de Desarrollo Sostenible (ODS) y los lineamientos del Ministerio de Trabajo</p>
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
      <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date().toLocaleDateString('es-ES')}</td>
    </tr>
  </table>

  <h3 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. DECLARACIÓN DE IGUALDAD FUNDAMENTAL</h3>
  <p style="text-align: justify; font-size: 13.5px;">
    En <strong>{{empresa_nombre}}</strong>, creemos firmemente que el talento no tiene género. Esta política establece el compromiso institucional de garantizar la igualdad real de trato, participación, desarrollo y remuneración para todas las personas que integran nuestra organización, promoviendo un ambiente laboral libre de prejuicios y estereotipos de género.
  </p>

  <h3 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. EJES ESTRATÉGICOS DE ACCIÓN</h3>
  <ul style="padding-left: 20px; font-size: 13px; margin-bottom: 20px;">
    <li style="margin-bottom: 8px;"><strong>Selección de Personal Insesgada:</strong> Implementación de perfiles de cargo neutrales y revisión de currículums ciegos para vacantes estratégicas, evaluando estrictamente las competencias técnicas y humanas.</li>
    <li style="margin-bottom: 8px;"><strong>Equidad Salarial Estricta:</strong> Cumplimiento de la Ley 1496 de 2011 de Colombia, garantizando "igual salario por igual trabajo". Ninguna decisión salarial se fundamentará directa o indirectamente en el género o identidad de las personas.</li>
    <li style="margin-bottom: 8px;"><strong>Corresponsabilidad y Conciliación:</strong> Fomento del disfrute de licencias de paternidad y maternidad y el uso equitativo de medidas de flexibilidad horaria para favorecer el cuidado compartido de la familia.</li>
  </ul>

  <h3 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. COMPROMISO CONTRA LA DISCRIMINACIÓN Y ALINEACIÓN RIT</h3>
  <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; text-align: justify;">
    <strong>Integración en el RIT:</strong> De conformidad con el Reglamento Interno de Trabajo (RIT) de {{empresa_nombre}}, los actos de discriminación fundada en género, orientación sexual, estado de gravidez, o identidad de género por parte de cualquier miembro de la empresa constituyen una **falta grave y violación sustancial a las obligaciones de convivencia**. La vulneración de este principio ético dará lugar a sanciones disciplinarias de conformidad con el RIT.
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

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA PRIMERA. OBJETO Y FUNCIONES:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    EL TRABAJADOR se obliga a prestar sus servicios personales de manera exclusiva al EMPLEADOR en el cargo de [Cargo a desempeñar], ejecutando con la mayor diligencia y cuidado las tareas inherentes a su cargo y las directrices impartidas por sus superiores.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA SEGUNDA. JORNADA Y LUGAR DE TRABAJO:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    La jornada de trabajo será la máxima legal ordinaria de la República de Colombia, distribuida conforme a los horarios operativos del EMPLEADOR. Las labores se desempeñarán en las instalaciones físicas ordinarias del EMPLEADOR o en la modalidad de teletrabajo/trabajo en casa que sea dispuesta oficialmente.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA TERCERA. PERIODO DE PRUEBA:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    Establécese un periodo de prueba de dos (2) meses (no superior a la quinta parte de la duración ni a 60 días). Durante este término, cualquiera de las partes podrá dar por terminado unilateralmente este contrato en cualquier momento sin preaviso ni derecho a indemnización alguna.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA CUARTA. OBLIGACIÓN EXPRESA DE CUMPLIMIENTO DEL RIT Y SG-SST:</h4>
  <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 10px; border-radius: 6px; font-size: 12.5px; text-align: justify;">
    <strong>Vinculación Reglamentaria:</strong> EL TRABAJADOR declara de forma expresa conocer, aceptar y someterse íntegramente a las normas, deberes, prohibiciones y escalas de faltas contenidas en el **Reglamento Interno de Trabajo (RIT)** vigente de {{empresa_nombre}}, así como a las políticas integrales de Seguridad y Salud en el Trabajo (SST), prevención de acoso, y desconexión laboral del EMPLEADOR. El incumplimiento verificado de cualquiera de estas normas constituirá una **justa causa para la terminación unilateral** de la relación laboral de acuerdo con el Código Sustantivo del Trabajo.
  </div>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA QUINTA. CONFIDENCIALIDAD Y PROPIEDAD INTELECTUAL:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    Toda invención, desarrollo tecnológico, proceso o software diseñado por EL TRABAJADOR en ejercicio de sus funciones pertenecerá exclusivamente al EMPLEADOR de acuerdo con la Ley de Propiedad Intelectual. Asimismo, guardará absoluta confidencialidad sobre la información reservada de la empresa.
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

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA PRIMERA. DURACIÓN Y PRÓRROGAS:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    El presente contrato tendrá una duración fija de [Meses] meses a partir de la fecha de inicio. Si ninguna de las partes avisa por escrito a la otra de su determinación de no prorrogar el contrato, con una antelación no inferior a treinta (30) días calendario, este se entenderá renovado en los términos descritos por la ley laboral colombiana.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA SEGUNDA. SUMETIMIENTO ExPRESO AL RIT:</h4>
  <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 12.5px; text-align: justify;">
    <strong>Vínculo al Reglamento Interno:</strong> EL TRABAJADOR declara expresamente que se compromete de forma absoluta a cumplir y respetar el **Reglamento Interno de Trabajo (RIT)** de {{empresa_nombre}}. La inobservancia de las prohibiciones o deberes contenidos en el RIT, así como de las medidas preventivas y políticas del SG-SST (como la política de prevención del acoso laboral o acoso sexual), constituirá una **justa causa para la rescisión unilateral** inmediata de la relación contractual sin lugar a indemnizaciones.
  </div>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA TERCERA. PRESTACIONES SOCIALES Y DEDUCCIONES:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    EL TRABAJADOR tiene derecho al pago proporcional y oportuno de sus prestaciones sociales (Cesantías, Intereses de Cesantías, Prima de Servicios, Vacaciones), cotizaciones a la Seguridad Social Integral (EPS, AFP, ARL) de acuerdo con la base salarial pactada y las normas vigentes.
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

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA PRIMERA. OBJETO Y AUTONOMÍA TÉCNICA:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    EL CONTRATISTA se obliga de forma independiente a prestar sus servicios de [Detalle del servicio profesional] en favor del CONTRATANTE. EL CONTRATISTA ejecutará los servicios con absoluta **autonomía técnica, administrativa y directiva**, utilizando sus propios elementos y recursos sin estar sometido a subordinación laboral.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA SEGUNDA. EXCLUSIÓN DE APLICABILIDAD DEL REGLAMENTO INTERNO (RIT):</h4>
  <div style="background-color: #f0fdfa; border: 1px solid #5eead4; padding: 12px; border-radius: 6px; font-size: 12.5px; text-align: justify; margin-bottom: 15px; color: #0f766e;">
    <strong>Protección de Realidad Contractual:</strong> Las partes declaran de mutuo acuerdo que el presente contrato corresponde exclusivamente a una relación civil/comercial. Por lo tanto, **al CONTRATISTA no le son aplicables las normas de subordinación y control disciplinario previstas en el Reglamento Interno de Trabajo (RIT)** de {{empresa_nombre}}, las cuales rigen de forma exclusiva para los trabajadores subordinados directos. Cualquier infracción contractual se resolverá bajo las penalidades económicas comerciales acordadas en este documento y el Código Civil. Sin embargo, en caso de concurrir presencialmente a las instalaciones del CONTRATANTE, el CONTRATISTA se obliga a cumplir con los **Estándares Mínimos del SG-SST** para prevenir riesgos y asegurar la salud ocupacional del área.
  </div>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA TERCERA. APORTES DE SEGURIDAD SOCIAL:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    De conformidad con la normatividad legal colombiana (Decreto 1273 de 2018), EL CONTRATISTA se compromete a acreditar mensualmente el pago de sus aportes a la seguridad social integral (Salud, Pensión y ARL) sobre una base mínima del 40% del valor mensualizado del contrato, como requisito obligatorio para el trámite de sus desembolsos de honorarios.
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

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA PRIMERA. OBJETO DE LA OBRA O LABOR:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    EL TRABAJADOR es contratado de manera exclusiva para ejecutar la labor específica de **[Detalle minucioso de las tareas en la obra o proyecto]**, la cual forma parte del proyecto superior ejecutado por el EMPLEADOR. Las partes acuerdan expresamente que la vigencia del contrato está condicionada estrictamente a la existencia y terminación de dicha obra o labor específica.
  </p>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA SEGUNDA. OBLIGACIÓN EXPRESA DE CUMPLIMIENTO DEL RIT Y SG-SST:</h4>
  <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 12.5px; text-align: justify;">
    <strong>Cumplimiento de Convivencia y Seguridad en la Obra:</strong> Durante la ejecución de la obra o labor, EL TRABAJADOR se obliga a someterse y acatar de forma estricta las directrices de orden y disciplina del **Reglamento Interno de Trabajo (RIT)** de {{empresa_nombre}}, así como los estándares del SG-SST y el plan de emergencias. El incumplimiento verificado constituirá causa suficiente para la rescisión unilateral con justa causa por parte de la empresa.
  </div>

  <h4 style="color: #334155; font-size: 14px; margin-top: 15px; margin-bottom: 5px; font-weight: 700;">CLÁUSULA TERCERA. TERMINACIÓN DEL CONTRATO:</h4>
  <p style="font-size: 12.5px; text-align: justify; margin-top: 0;">
    El contrato de trabajo terminará de forma automática, sin requerir preaviso legal, en el momento en que se culmine el objeto de la obra contratada en la Cláusula Primera de este instrumento, liquidándose las prestaciones sociales de ley de forma proporcional.
  </p>

  ${SIGNATURE_BLOCK_CONTRATO}
</div>
`.trim();
