const mongoose = require('mongoose');

const pesvWorkspaceSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyInfo',
      required: false,
    },
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    matrixRows: {
      type: Array,
      default: [],
    },
    /**
     * chartConclusions: conclusiones generadas por IA para cada gráfico del dashboard.
     * Keys: 'actor_vial' | 'factor_riesgo' | 'controles' | 'tipo_desplazamiento'
     */
    chartConclusions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const PESVWorkspaceSession = mongoose.model('PESVWorkspaceSession', pesvWorkspaceSessionSchema);

module.exports = PESVWorkspaceSession;
