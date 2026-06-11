const { buildStandardHeader } = require('~/server/routes/sgsst/reportHeader');

// Recreate the exact hasHeader logic from CanvasTool.js and canvas.js for verification
function testHasHeader(html) {
  if (!html) return false;
  const lower = html.toLowerCase();
  return (
    lower.includes('información resumida de la entidad') ||
    lower.includes('linear-gradient') ||
    lower.includes('registro de inducción') ||
    lower.includes('formato de inspección') ||
    lower.includes('datos generales') ||
    lower.includes('proceso: sg-sst') ||
    lower.includes('proceso:sg-sst')
  );
}

describe('Canvas Report Header & Detection Logic', () => {
  describe('buildStandardHeader logo injection', () => {
    const companyInfoWithLogo = {
      companyName: 'WAPPY LTDA',
      companyType: 'Persona Jurídica',
      nit: '901234567-8',
      logoBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    };

    const companyInfoWithoutLogo = {
      companyName: 'WAPPY LTDA',
      companyType: 'Persona Jurídica',
      nit: '901234567-8',
    };

    it('should inject the company logo when logoBase64 is present', () => {
      const html = buildStandardHeader({
        title: 'INFORME DE PRUEBA',
        companyInfo: companyInfoWithLogo,
      });

      expect(html).toContain('<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="');
      expect(html).toContain('max-height: 40px;');
      expect(html).toContain('max-width: 90px;');
    });

    it('should not inject the logo image when logoBase64 is missing', () => {
      const html = buildStandardHeader({
        title: 'INFORME DE PRUEBA',
        companyInfo: companyInfoWithoutLogo,
      });

      expect(html).not.toContain('<img src=');
    });

    it('should maintain standard gradient styles and entity info table', () => {
      const html = buildStandardHeader({
        title: 'INFORME DE PRUEBA',
        companyInfo: companyInfoWithLogo,
      });

      expect(html).toContain('linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #0ea5e9 100%)');
      expect(html).toContain('INFORMACIÓN RESUMIDA DE LA ENTIDAD');
      expect(html).toContain('Empresa:');
      expect(html).toContain('NIT:');
      expect(html).toContain('WAPPY LTDA');
      expect(html).toContain('901234567-8');
    });
  });

  describe('Refined hasHeader detection logic', () => {
    it('should NOT match standard plain text tables with Empresa and NIT (the false positive case)', () => {
      const plainTextTable = `
        | Empresa: Mi Empresa S.A.S. | NIT: 123.456.789-0 |
        | Representante: Juan Perez | Ciudad: Bogota |
      `;
      expect(testHasHeader(plainTextTable)).toBe(false);

      const htmlTextTable = `
        <table>
          <tr>
            <td>Empresa:</td>
            <td>Mi Empresa</td>
            <td>NIT:</td>
            <td>123456789</td>
          </tr>
        </table>
      `;
      expect(testHasHeader(htmlTextTable)).toBe(false);
    });

    it('should match official headers with linear-gradient', () => {
      const officialHeader = '<div style="background: linear-gradient(135deg, #0f766e 0%, ...">';
      expect(testHasHeader(officialHeader)).toBe(true);
    });

    it('should match official headers with "información resumida de la entidad"', () => {
      const officialHeader = '<h3>INFORMACIÓN RESUMIDA DE LA ENTIDAD</h3>';
      expect(testHasHeader(officialHeader)).toBe(true);
    });

    it('should match official headers with "proceso: sg-sst" signature', () => {
      const officialHeader = '<div>PROCESO: SG-SST</div>';
      expect(testHasHeader(officialHeader)).toBe(true);
    });
  });
});
