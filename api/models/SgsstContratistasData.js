const mongoose = require('mongoose');

const ContratistaItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    codigo: { type: String, default: 'CONTR-001' },
    razonSocial: { type: String, required: true },
    nit: { type: String, default: '' },
    contactoResponsable: { type: String, default: '' },
    servicio: { type: String, default: '' },
    tipoTercero: {
      type: String,
      default: 'Contratista en Misión',
    },
    nivelRiesgo: {
      type: String,
      default: 'Clase III',
    },
    arl: { type: String, default: 'ARL SURA / Positiva / Colmena' },
    trabajadoresEnMision: { type: Number, default: 1 },
    puntaje0312: { type: Number, default: 86 },
    estadoPila: {
      type: String,
      default: 'Vigente',
    },
    planillaPilaRef: { type: String, default: '' },
    induccionSST: { type: Boolean, default: true },
    tareaAltoRiesgo: {
      type: String,
      default: 'Ninguna / Rutinaria',
    },
    certificadosExigidos: { type: String, default: '' },
    origenEcosistema: {
      type: String,
      default: 'Padrón Directo de Contratistas',
    },
    calificacionSST: {
      type: String,
      default: 'Aprobado',
    },
    fechaUltimaAuditoria: { type: String, default: '' },
    sentToKanban: { type: Boolean, default: false },
  },
  { _id: false }
);

const ChecklistRequisitoContratistaSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    requisito: { type: String, required: true },
    normaBase: { type: String, default: 'Dec. 1072/2015 Art. 2.2.4.6.28 · Res. 0312 Est. 2.10.1' },
    etapa: { type: String, default: 'Precontractual / Selección' },
    obligatorio: { type: Boolean, default: true },
    estadoVerificacion: { type: String, default: 'Verificado' },
  },
  { _id: false }
);

const SgsstContratistasDataSchema = new mongoose.Schema(
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
    contratistas: {
      type: [ContratistaItemSchema],
      default: [],
    },
    checklistRequisitos: {
      type: [ChecklistRequisitoContratistaSchema],
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

SgsstContratistasDataSchema.index({ user: 1, companyId: 1 }, { unique: true });

module.exports =
  mongoose.models.SgsstContratistasData ||
  mongoose.model('SgsstContratistasData', SgsstContratistasDataSchema);
