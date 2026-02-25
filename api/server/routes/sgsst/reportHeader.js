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
  const norma = norm || 'Decreto 1072 de 2015';
  const fecha = date || new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<table style="width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; margin-bottom: 24px; font-family: inherit;">
  <thead>
    <tr>
      <th colspan="4" style="background-color: #004d99; color: white; text-align: center; padding: 16px 12px; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
        ${title}
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; width: 20%; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">Empresa:</td>
      <td style="padding: 10px 14px; width: 30%; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">${empresa}</td>
      <td style="padding: 10px 14px; font-weight: 700; width: 20%; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">NIT:</td>
      <td style="padding: 10px 14px; width: 30%; border-bottom: 1px solid #ddd;">${nit}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">Representante:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">${representante}</td>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">N° Trabajadores:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd;">${trabajadores}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">Nivel de Riesgo:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">${riesgo}</td>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">Fecha de Emisión:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd;">${fecha}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; border-right: 1px solid #eee;">ARL:</td>
      <td style="padding: 10px 14px; border-right: 1px solid #eee;">${arl}</td>
      <td style="padding: 10px 14px; font-weight: 700; border-right: 1px solid #eee;">Norma:</td>
      <td style="padding: 10px 14px;">${norma}</td>
    </tr>
  </tbody>
</table>`;
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

module.exports = { buildStandardHeader, buildCompanyContextString };
