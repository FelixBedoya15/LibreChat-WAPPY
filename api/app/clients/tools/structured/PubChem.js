const { StructuredTool } = require('@langchain/core/tools');
const { z } = require('zod');
const logger = require('~/config/winston');

class PubChem extends StructuredTool {
  constructor(fields = {}) {
    super();
    this.name = 'pubchem_api';
    this.description =
      'Busca información oficial de seguridad química, número CAS, palabra de advertencia, clasificación SGA (GHS), frases H/P y pictogramas en la base de datos oficial de PubChem (NIH). Acepta nombres en español, inglés o número CAS.';
    this.schema = z.object({
      chemicalName: z
        .string()
        .describe(
          'Nombre del compuesto químico en español o inglés, o número CAS (ej. Hipoclorito de sodio, ácido clorhídrico, ethanol, 7681-52-9).',
        ),
    });
  }

  async _call({ chemicalName }) {
    try {
      const { lookupPubChemGHS } = require('~/server/routes/sgsst/matrizCompatibilidad');
      const ghsInfo = await lookupPubChemGHS(chemicalName);

      if (!ghsInfo) {
        return JSON.stringify({
          found: false,
          chemicalName,
          error: `No se encontró clasificación SGA en PubChem para: ${chemicalName}`,
        });
      }

      return JSON.stringify({
        found: true,
        chemicalName,
        cid: ghsInfo.cid,
        cas: ghsInfo.cas || '',
        queryUsed: ghsInfo.queryUsed,
        signalWord: ghsInfo.signalWord,
        ghsCodes: ghsInfo.ghsCodes,
        wappyPictograms: ghsInfo.wappyPictograms,
        pictogramDetails: ghsInfo.pictogramDetails,
        hazardStatements: ghsInfo.hazardStatements,
        precautionaryStatements: ghsInfo.precautionaryStatements,
        clasificacion_onu: ghsInfo.clasificacion_onu,
        incompatibilidades: ghsInfo.incompatibilidades,
      });
    } catch (error) {
      logger.error('[PubChem Tool] Error:', error);
      return JSON.stringify({ error: `Error al consultar PubChem: ${error.message}` });
    }
  }
}

module.exports = PubChem;
