const mongoose = require('mongoose');

const gtc45WorkspaceSessionSchema = new mongoose.Schema(
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
     * Keys: 'clasificacion' | 'controles' | 'enfermedades' | 'procesos'
     */
    chartConclusions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isOfficial: {
      type: Boolean,
      default: false,
      index: true,
    },
    officialTitle: {
      type: String,
      default: 'Matriz IPEVAR Oficial',
    },
    sourceConversationId: {
      type: String,
      default: null,
    },
    promotedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const GTC45WorkspaceSession = mongoose.model('GTC45WorkspaceSession', gtc45WorkspaceSessionSchema);

module.exports = GTC45WorkspaceSession;
