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
  const nit = ci.nit || 'NIT';
  const representante = ci.legalRepresentative || responsibleName || 'No registrado';
  const trabajadores = ci.workerCount || 'N/A';
  const riesgo = riskLevel || ci.riskLevel || 'N/A';
  const arl = ci.arl || 'N/A';
  const norma = norm || 'Resolución 0312 de 2019 / Resolución 908 de 2025';
  const fecha = date || new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #004d99; font-size: 24px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; border-bottom: none; padding-bottom: 0;">
        ${title}
    </h1>
    <div style="width: 100px; height: 3px; background-color: #004d99; margin: 0 auto 12px auto;"></div>
</div>

<div style="overflow-x: auto; width: 100%; margin-bottom: 24px; padding-bottom: 8px;">
<table style="width: 100%; min-width: 700px; table-layout: fixed; word-wrap: break-word; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; font-family: inherit;">
  <thead>
    <tr>
      <th colspan="4" style="background-color: #004d99; color: white; text-align: left; padding: 12px 16px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        INFORMACIÓN RESUMIDA DE LA ENTIDAD
      </th>
    </tr>
  </thead>
  <tbody style="font-size: 14px; color: #1e293b;">
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; width: 20%; border-bottom: 1px solid #ddd; border-right: 1px solid #eee; background-color: #f8fafc;">Empresa:</td>
      <td style="padding: 10px 14px; width: 30%; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">${empresa}</td>
      <td style="padding: 10px 14px; font-weight: 700; width: 20%; border-bottom: 1px solid #ddd; border-right: 1px solid #eee; background-color: #f8fafc;">NIT:</td>
      <td style="padding: 10px 14px; width: 30%; border-bottom: 1px solid #ddd;">${nit}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee; background-color: #f8fafc;">Representante:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">${representante}</td>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee; background-color: #f8fafc;">N° Trabajadores:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd;">${trabajadores}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee; background-color: #f8fafc;">Nivel de Riesgo:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">${riesgo}</td>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee; background-color: #f8fafc;">Fecha de Emisión:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd;">${fecha}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; border-right: 1px solid #eee; background-color: #f8fafc;">ARL:</td>
      <td style="padding: 10px 14px; border-right: 1px solid #eee;">${arl}</td>
      <td style="padding: 10px 14px; font-weight: 700; border-right: 1px solid #eee; background-color: #f8fafc;">Norma:</td>
      <td style="padding: 10px 14px;">${norma}</td>
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

  return `
**Datos Registrados de la Organización:**
- Razón Social: ${companyInfo.companyName || 'No registrado'}
- NIT: ${companyInfo.nit || 'No registrado'}
- Representante Legal: ${companyInfo.legalRepresentative || 'No registrado'}
- Número de Trabajadores: ${companyInfo.workerCount || 'No registrado'}
- ARL: ${companyInfo.arl || 'No registrada'}
- Actividad Económica: ${companyInfo.economicActivity || 'No registrada'}
- Código CIIU: ${companyInfo.ciiu || 'No registrado'}
- Nivel de Riesgo: ${companyInfo.riskLevel || 'No registrado'}
- Sector Económico: ${companyInfo.sector || 'No registrado'}
- Dirección: ${companyInfo.address || 'No registrada'}, ${companyInfo.city || ''}
- Responsable SG-SST: ${companyInfo.responsibleSST || 'No registrado'}

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
function buildSignatureSection(companyInfo) {
  if (!companyInfo) return '';

  const responsible = companyInfo.responsibleSST || 'Nombre del Responsable';
  const license = companyInfo.licenseNumber || 'Número de Licencia';
  const licenseExpiry = companyInfo.licenseExpiry ? ` - Vence: ${companyInfo.licenseExpiry}` : '';

  return `
<div style="margin-top: 50px; page-break-inside: avoid;">
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr>
            <td style="width: 50%; padding: 20px; text-align: center; vertical-align: bottom;">
                <div class="signature-placeholder" data-signature-id="responsible" style="border-bottom: 2px solid #333; width: 80%; margin: 0 auto 10px auto; min-height: 80px; display: flex; align-items: center; justify-content: center; background-color: #f9f9f9; cursor: pointer; border-radius: 8px 8px 0 0; transition: all 0.3s ease;">
                    <span style="color: #999; font-size: 12px;">Haga clic para insertar FIRMA DIGITAL</span>
                </div>
                <div style="font-weight: 800; font-size: 14px; color: #1e293b; text-transform: uppercase;">${responsible}</div>
                <div style="font-size: 12px; color: #64748b; font-weight: 600;">Responsable SG-SST</div>
                <div style="font-size: 11px; color: #94a3b8;">Licencia No. ${license}${licenseExpiry}</div>
            </td>
            <td style="width: 50%; padding: 20px; text-align: center; vertical-align: bottom;">
                <div class="signature-placeholder" data-signature-id="legal" style="border-bottom: 2px solid #333; width: 80%; margin: 0 auto 10px auto; min-height: 80px; display: flex; align-items: center; justify-content: center; background-color: #f9f9f9; cursor: pointer; border-radius: 8px 8px 0 0; transition: all 0.3s ease;">
                    <span style="color: #999; font-size: 12px;">Haga clic para insertar FIRMA DIGITAL</span>
                </div>
                <div style="font-weight: 800; font-size: 14px; color: #1e293b; text-transform: uppercase;">${companyInfo.legalRepresentative || 'Representante Legal'}</div>
                <div style="font-size: 12px; color: #64748b; font-weight: 600;">Representante Legal</div>
                <div style="font-size: 11px; color: #94a3b8;">${companyInfo.companyName || 'Empresa'}</div>
            </td>
        </tr>
    </table>
    <div style="text-align: center; font-size: 10px; color: #cbd5e1; margin-top: 15px; font-style: italic;">
        Documento generado electrónicamente por el Gestor Inteligente SGSST - WAPPY IA By WAPPY LTDA © 2025
    </div>
</div>`;
}

module.exports = { buildStandardHeader, buildCompanyContextString, buildSignatureSection };
