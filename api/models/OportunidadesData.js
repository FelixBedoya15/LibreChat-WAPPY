const mongoose = require('mongoose');

const OportunidadItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    titulo: { type: String, required: true },
    categoria: { type: String, default: 'Prevención y Control Operacional' },
    origenSst: { type: String, default: 'Contexto Organizacional / DOFA' },
    beneficioEsperado: { type: String, default: '' },
    impactoPrioridad: { type: String, default: 'Alto' }, // 'Alto', 'Medio', 'Bajo'
    viabilidad: { type: String, default: 'Alta' }, // 'Alta', 'Media', 'Baja'
    recursosRequeridos: { type: String, default: 'Presupuesto SG-SST / ARL' },
    indicadorExito: { type: String, default: '100% de implementación en el período' },
    responsable: { type: String, default: 'Responsable SG-SST' },
    plazo: { type: String, default: 'Corto Plazo (1-3 meses)' },
    estado: { type: String, default: 'Planificada' }, // 'Identificada', 'En Evaluación', 'Planificada', 'En Ejecución', 'Implementada'
    sentToKanban: { type: Boolean, default: false },
  },
  { _id: false }
);

const RiesgoSistemaItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    amenaza: { type: String, required: true },
    fuenteContexto: { type: String, default: 'Contexto Externo / Interno' },
    impactoSistema: { type: String, default: 'Alto' }, // 'Alto', 'Medio', 'Bajo'
    probabilidad: { type: String, default: 'Media' }, // 'Alta', 'Media', 'Baja'
    nivelRiesgo: { type: String, default: 'Alto' }, // 'Crítico', 'Alto', 'Medio', 'Bajo'
    controlExistente: { type: String, default: '' },
    medidaMitigacion: { type: String, default: '' },
    responsableMonitoreo: { type: String, default: 'Responsable SG-SST' },
    plazo: { type: String, default: 'Inmediato (30 días)' },
    estadoControl: { type: String, default: 'En Tratamiento' }, // 'Abierto', 'En Tratamiento', 'Controlado', 'Monitoreado'
    sentToKanban: { type: Boolean, default: false },
  },
  { _id: false }
);

const OportunidadesDataSchema = new mongoose.Schema(
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
    oportunidades: {
      type: [OportunidadItemSchema],
      default: [],
    },
    riesgosSistema: {
      type: [RiesgoSistemaItemSchema],
      default: [],
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

OportunidadesDataSchema.index({ user: 1, companyId: 1 }, { unique: true });

module.exports =
  mongoose.models.OportunidadesData ||
  mongoose.model('OportunidadesData', OportunidadesDataSchema);
