const mongoose = require('mongoose');

const DofaItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['fortaleza', 'debilidad', 'oportunidad', 'amenaza'],
      required: true,
    },
    description: { type: String, required: true },
    source: { type: String, enum: ['interno', 'externo'], required: true },
    impact: { type: String, default: 'alto' },
    strategicAction: { type: String, default: '' },
    category: { type: String, default: 'Gobernanza / SST' },
    originModule: { type: String, default: 'Contexto Organizacional' },
    responsible: { type: String, default: 'Responsable SG-SST' },
    status: { type: String, default: 'En Plan de Acción' },
    sentToKanban: { type: Boolean, default: false },
  },
  { _id: false }
);

const StakeholderItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    parte: { type: String, required: true },
    type: { type: String, default: 'Interno' },
    necesidades: { type: String, required: true },
    expectativas: { type: String, default: '' },
    requisito: { type: String, default: '' },
    control: { type: String, default: '' },
    communicationChannel: { type: String, default: 'Comités SST / Cartelera Digital WAPPY' },
    frequency: { type: String, default: 'Mensual' },
    impactLevel: { type: String, default: 'alto' },
  },
  { _id: false }
);

const CrossStrategiesSchema = new mongoose.Schema(
  {
    fo: [{ type: String }],
    do: [{ type: String }],
    fa: [{ type: String }],
    da: [{ type: String }],
  },
  { _id: false }
);

const ContextoDataSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyInfo',
      required: false,
      index: true,
    },
    dofaList: {
      type: [DofaItemSchema],
      default: [],
    },
    stakeholders: {
      type: [StakeholderItemSchema],
      default: [],
    },
    crossStrategies: {
      type: CrossStrategiesSchema,
      default: () => ({ fo: [], do: [], fa: [], da: [] }),
    },
    lastGeneratedReport: {
      type: String,
      default: '',
    },
    conversationId: {
      type: String,
      default: null,
    },
    messageId: {
      type: String,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ContextoDataSchema.index({ user: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.models.ContextoData || mongoose.model('ContextoData', ContextoDataSchema);
