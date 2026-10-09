const { StructuredTool } = require('langchain/tools');
const { z } = require('zod');
const axios = require('axios');
const logger = require('~/config/winston');

class PubChem extends StructuredTool {
  constructor(fields = {}) {
    super();
    this.name = 'pubchem_api';
    this.description = 'Busca información, clasificación SGA (GHS) y pictogramas de seguridad química en la base de datos oficial de PubChem (NIH).';
    this.schema = z.object({
      chemicalName: z.string().describe('El nombre del compuesto químico en INGLÉS (ej. benzene, xylene, chlorine).'),
    });
  }

  async _call({ chemicalName }) {
    try {
      // 1. Obtener el CID
      const cidUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(chemicalName)}/cids/JSON`;
      const cidRes = await axios.get(cidUrl);
      const cids = cidRes.data?.IdentifierList?.CID;
      
      if (!cids || cids.length === 0) {
        return JSON.stringify({ error: `No se encontró el químico: ${chemicalName}` });
      }
      
      const cid = cids[0];
      
      // 2. Obtener clasificación GHS
      const ghsUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=GHS+Classification`;
      const ghsRes = await axios.get(ghsUrl);
      
      // Extraer datos relevantes
      const result = {
        chemicalName,
        cid,
        ghsData: ghsRes.data
      };
      
      return JSON.stringify(result);
    } catch (error) {
      logger.error('[PubChem Tool] Error:', error);
      return JSON.stringify({ error: `Error al consultar PubChem: ${error.message}` });
    }
  }
}

module.exports = PubChem;
