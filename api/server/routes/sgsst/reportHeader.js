/**
 * Shared report header generator for all SGSST applications.
 * Produces a standardized header matching the Diagnóstico report style:
 * - Blue banner with the report title
 * - Company info table with 4 rows × 4 columns
 */

/**
 * @param {Object} options
 * @param {string} options.title - Report title (e.g. "INFORME GERENCIAL DE EVALUACIÓN SG-SST")
 * @param {Object} options.companyInfo - Company info from CompanyInfo model
 * @param {string} options.date - Formatted date string
 * @param {string} [options.norm] - Normative reference (e.g. "Resolución 0312 de 2019")
 * @param {string} [options.riskLevel] - Risk level label
 * @param {string} [options.responsibleName] - Name of the person generating the report
 * @returns {string} HTML string
 */
function buildStandardHeader({ title, companyInfo, date, norm, riskLevel, responsibleName }) {
  const ci = companyInfo || {};
  const empresa = ci.companyName || 'EMPRESA';
  const companyType = ci.companyType || 'Persona Jurídica';
  const nitLabel = companyType === 'Persona Natural' ? 'C.C.' : 'NIT';
  const nit = ci.nit || 'N/A';
  const representante = ci.legalRepresentative || responsibleName || 'No registrado';
  const representanteId = ci.legalRepresentativeId ? ` (C.C. ${ci.legalRepresentativeId})` : '';
  const trabajadores = ci.workerCount || 'N/A';
  const riesgo = riskLevel || ci.riskLevel || 'N/A';
  const arl = ci.arl || 'N/A';
  const norma = norm || 'Resolución 0312 de 2019 / Resolución 908 de 2025';
  const fecha = date || new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  const ciudad = ci.city ? `${ci.city}${ci.departamento ? ', ' + ci.departamento : ''}` : 'N/A';

  return `
<div style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #0ea5e9 100%); color: #ffffff; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(15,118,110,0.15); font-family: sans-serif; display: flex; flex-direction: column; gap: 16px; position: relative;">
    <!-- Fila Superior: Logo y Proceso -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
        <!-- Logo o Iniciales -->
        <div style="flex: 0 0 80px; width: 80px; height: 80px; display: flex; justify-content: center; align-items: center; background-color: rgba(255, 255, 255, 0.95); padding: 6px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); box-sizing: border-box;">
            ${ci.logoBase64 ? `
                <img src="${ci.logoBase64}" style="max-height: 68px; max-width: 68px; object-fit: contain;" alt="Logo" />
            ` : `
                <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #0f766e, #0ea5e9); border-radius: 6px; color: #ffffff; font-weight: 900; font-size: 22px; letter-spacing: 0.5px;">
                    ${empresa.substring(0, 2).toUpperCase()}
                </div>
            `}
        </div>

        <!-- Proceso en la Esquina Superior Derecha -->
        <div style="font-size: 9px; opacity: 0.9; font-weight: 700; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px; white-space: nowrap; backdrop-filter: blur(5px);">
            PROCESO: SG-SST | V.02
        </div>
    </div>

    <!-- Fila Inferior: Título y Contenido -->
    <div style="text-align: left; width: 100%; margin-top: 4px;">
        <h1 style="margin: 0; font-size: 19px; font-weight: 800; color: #ffffff; text-transform: uppercase; border-bottom: none; padding-bottom: 0; line-height: 1.25;">
            ${title}${ci.companyName && !title.toLowerCase().includes(ci.companyName.toLowerCase()) ? ` - ${ci.companyName}` : ''}
        </h1>
        <p style="margin: 6px 0 0; font-size: 11px; opacity: 0.95; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO</p>
        <p style="margin: 4px 0 0; font-size: 10px; opacity: 0.75; font-style: italic;">Documento Corporativo Oficial - Conforme a la Normatividad Vigente</p>
    </div>
</div>

<div style="overflow-x: auto; width: 100%; margin-bottom: 24px; font-family: sans-serif;">
<table style="width: 100%; min-width: 700px; table-layout: auto; word-wrap: break-word; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; font-family: inherit;">
  <thead>
    <tr>
      <th colspan="4" style="background-color: #0f766e; color: white; text-align: left; padding: 12px 16px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        INFORMACIÓN RESUMIDA DE LA ENTIDAD
      </th>
    </tr>
  </thead>
  <tbody style="font-size: 14px; color: #1e293b;">
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; width: 20%; border-bottom: 1px solid #ddd; border-right: 1px solid #eee; background-color: #f8fafc;">Empresa:</td>
      <td style="padding: 10px 14px; width: 30%; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">${empresa} <span style="font-size:11px;color:#64748b;">(${companyType})</span></td>
      <td style="padding: 10px 14px; font-weight: 700; width: 20%; border-bottom: 1px solid #ddd; border-right: 1px solid #eee; background-color: #f8fafc;">${nitLabel}:</td>
      <td style="padding: 10px 14px; width: 30%; border-bottom: 1px solid #ddd;">${nit}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee; background-color: #f8fafc;">Representante:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">${representante}${representanteId}</td>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee; background-color: #f8fafc;">N° Trabajadores:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd;">${trabajadores}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee; background-color: #f8fafc;">Nivel de Riesgo:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">${riesgo}</td>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee; background-color: #f8fafc;">Ciudad / Depto:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd;">${ciudad}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee; background-color: #f8fafc;">Fecha de Emisión:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">${fecha}</td>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee; background-color: #f8fafc;">ARL:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd;">${arl}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; border-right: 1px solid #eee; background-color: #f8fafc;">Norma:</td>
      <td colspan="3" style="padding: 10px 14px;">${norma}</td>
    </tr>
  </tbody>
</table>
</div>`;
}

/**
 * Builds a standardized company context text block for AI prompts.
 * Helps the AI understand the organization's background, risk level, and main activities.
 * @param {Object} companyInfo - Company info from CompanyInfo model
 * @returns {string} Text block to be injected into the AI prompt
 */
function buildCompanyContextString(companyInfo) {
  if (!companyInfo || !companyInfo.companyName) return '';

  const companyType = companyInfo.companyType || 'Persona Jurídica';
  const nitLabel = companyType === 'Persona Natural' ? 'Cédula de Ciudadanía' : 'NIT';
  const ubicacion = [companyInfo.address, companyInfo.city, companyInfo.departamento].filter(Boolean).join(', ');

  return `
**Datos Registrados de la Organización:**
- Razón Social / Nombre: ${companyInfo.companyName || 'No registrado'}
- Tipo de Empresa: ${companyType}
- ${nitLabel}: ${companyInfo.nit || 'No registrado'}
- Representante Legal: ${companyInfo.legalRepresentative || 'No registrado'}
- Cédula Representante Legal: ${companyInfo.legalRepresentativeId || 'No registrado'}
- Número de Trabajadores: ${companyInfo.workerCount || 'No registrado'}
- ARL: ${companyInfo.arl || 'No registrada'}
- Actividad Económica: ${companyInfo.economicActivity || 'No registrada'}
- Código CIIU: ${companyInfo.ciiu || 'No registrado'}
- Nivel de Riesgo: ${companyInfo.riskLevel || 'No registrado'}
- Sector Económico: ${companyInfo.sector || 'No registrado'}
- Ubicación: ${ubicacion || 'No registrada'}
- Responsable SG-SST: ${companyInfo.responsibleSST || 'No registrado'}
- Nivel de Formación: ${companyInfo.formationLevel || 'No registrado'}
- Licencia SST: ${companyInfo.licenseNumber || 'No registrado'} (Vence: ${companyInfo.licenseExpiry || 'N/A'})
- Curso 50/20H: ${companyInfo.courseStatus || 'No registrado'}

**Actividades Generales de la Empresa (Contexto Crítico para la IA):**
${companyInfo.generalActivities || 'No registradas (Asume un entorno operativo general asociado a su sector económico vigente).'}
`;
}

/**
 * Builds a standardized signature section for the end of reports.
 * Includes a placeholder for the digital signature and details of the responsible person.
 * @param {Object} companyInfo - Company info with responsible SST data
 * @returns {string} HTML string
 */
function buildSignatureSection(companyInfo, worker = null) {
  if (!companyInfo) return '';

  const responsible = companyInfo.responsibleSST || 'Nombre del Responsable';
  const license = companyInfo.licenseNumber || 'Número de Licencia';
  const licenseExpiry = companyInfo.licenseExpiry ? ` - Vence: ${companyInfo.licenseExpiry}` : '';
  
  const colWidth = worker ? '33.33%' : '50%';

  let html = `
<div style="margin-top: 50px; page-break-inside: avoid;">
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr>
            <td style="width: ${colWidth}; padding: 20px; text-align: center; vertical-align: bottom;">
                <div class="signature-placeholder" data-signature-id="responsible" style="border-bottom: 2px solid #333; width: 80%; margin: 0 auto 10px auto; min-height: 80px; display: flex; align-items: center; justify-content: center; background-color: #f9f9f9; cursor: pointer; border-radius: 8px 8px 0 0; transition: all 0.3s ease;">
                    <span style="color: #999; font-size: 12px;">Haga clic para insertar FIRMA DIGITAL</span>
                </div>
                <div style="font-weight: 800; font-size: 14px; color: #1e293b; text-transform: uppercase;">${responsible}</div>
                <div style="font-size: 12px; color: #64748b; font-weight: 600;">Responsable SG-SST</div>
                <div style="font-size: 11px; color: #94a3b8;">Licencia No. ${license}${licenseExpiry}</div>
            </td>
            <td style="width: ${colWidth}; padding: 20px; text-align: center; vertical-align: bottom;">
                <div class="signature-placeholder" data-signature-id="legal" style="border-bottom: 2px solid #333; width: 80%; margin: 0 auto 10px auto; min-height: 80px; display: flex; align-items: center; justify-content: center; background-color: #f9f9f9; cursor: pointer; border-radius: 8px 8px 0 0; transition: all 0.3s ease;">
                    <span style="color: #999; font-size: 12px;">Haga clic para insertar FIRMA DIGITAL</span>
                </div>
                <div style="font-weight: 800; font-size: 14px; color: #1e293b; text-transform: uppercase;">${companyInfo.legalRepresentative || 'Representante Legal'}</div>
                <div style="font-size: 12px; color: #64748b; font-weight: 600;">Representante Legal</div>
                <div style="font-size: 11px; color: #94a3b8;">${companyInfo.companyName || 'Empresa'}</div>
            </td>`;

  if (worker) {
    // Attempt to inject valid signature image if worker has one registered
    const signatureContent = (worker.consentimientoFirmaDigital === 'Sí' && worker.firmaDigital) 
      ? `<img src="${worker.firmaDigital}" style="max-height: 70px; max-width: 100%;" />`
      : `<span style="color: #999; font-size: 12px;">Haga clic para insertar FIRMA DIGITAL</span>`;

    html += `
            <td style="width: ${colWidth}; padding: 20px; text-align: center; vertical-align: bottom;">
                <div class="signature-placeholder" data-signature-id="worker_${worker.id || '1'}" style="border-bottom: 2px solid #333; width: 80%; margin: 0 auto 10px auto; min-height: 80px; display: flex; align-items: center; justify-content: center; background-color: #f9f9f9; cursor: pointer; border-radius: 8px 8px 0 0; transition: all 0.3s ease;">
                    ${signatureContent}
                </div>
                <div style="font-weight: 800; font-size: 14px; color: #1e293b; text-transform: uppercase;">${worker.nombre}</div>
                <div style="font-size: 12px; color: #64748b; font-weight: 600;">Trabajador / Interviniente</div>
                <div style="font-size: 11px; color: #94a3b8;">C.C. ${worker.identificacion || ''} - ${worker.cargo || ''}</div>
            </td>`;
  }

  html += `
        </tr>
    </table>
    <div style="text-align: center; font-size: 10px; color: #cbd5e1; margin-top: 15px; font-style: italic;">
        Documento generado electrónicamente por el Gestor Inteligente SGSST - WAPPY IA By WAPPY LTDA © 2025
    </div>
</div>`;

  return html;
}

module.exports = { buildStandardHeader, buildCompanyContextString, buildSignatureSection };
