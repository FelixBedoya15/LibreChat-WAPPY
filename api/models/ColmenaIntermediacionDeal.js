const mongoose = require('mongoose');

const colmenaIntermediacionDealSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    nit: {
      type: String,
      trim: true,
      default: '',
    },
    legalRepresentative: {
      type: String,
      trim: true,
      default: '',
    },
    legalRepresentativeId: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    responsibleSST: {
      type: String,
      trim: true,
      default: '',
    },
    currentArl: {
      type: String,
      trim: true,
      default: 'SURA',
    },
    targetType: {
      type: String,
      enum: ['EMPRESA', 'VOLUNTARIO'],
      default: 'EMPRESA',
    },
    ciiu: {
      type: String,
      trim: true,
      default: '',
    },
    cod768: {
      type: String,
      trim: true,
      default: '',
    },
    claseRiesgo: {
      type: Number,
      default: 1,
    },
    descripcionActividad: {
      type: String,
      trim: true,
      default: '',
    },
    nicho2026: {
      type: String,
      trim: true,
      default: 'Otras Actividades',
    },
    nivelAutorizacion: {
      type: String,
      trim: true,
      default: 'Autorización Plena',
    },
    excepcionPrima: {
      type: String,
      trim: true,
      default: '',
    },
    minPrimaRequerida: {
      type: Number,
      default: 0,
    },
    workerCount: {
      type: Number,
      default: 10,
    },
    avgIbc: {
      type: Number,
      default: 1750905,
    },
    centers: {
      type: Array,
      default: [],
    },
    monthlyPrimaColmena: {
      type: Number,
      default: 0,
    },
    annualPrimaColmena: {
      type: Number,
      default: 0,
    },
    meetsMinPrimaRule: {
      type: Boolean,
      default: true,
    },
    commissionPct: {
      type: Number,
      default: 10,
    },
    estimatedMonthlyCommission: {
      type: Number,
      default: 0,
    },
    estimatedAnnualCommission: {
      type: Number,
      default: 0,
    },
    reinvestmentSstPct: {
      type: Number,
      default: 20,
    },
    estimatedReinvestmentSst: {
      type: Number,
      default: 0,
    },
    stage: {
      type: String,
      enum: [
        'PROSPECTO',
        'VIABILIDAD_APROBADA',
        'PROPUESTA_ENVIADA',
        'CARTA_RADICADA',
        'AFILIADO_ACTIVO',
        'DESCARTADO',
      ],
      default: 'PROSPECTO',
    },
    sourceOrigin: {
      type: String,
      default: 'MANUAL',
    },
    notes: {
      type: String,
      default: '',
    },
    aiProposalHtml: {
      type: String,
      default: '',
    },
    aiTechnicalSheetHtml: {
      type: String,
      default: '',
    },
    aiBrokerLetterHtml: {
      type: String,
      default: '',
    },
    createdBy: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

module.exports =
  mongoose.models.ColmenaIntermediacionDeal ||
  mongoose.model('ColmenaIntermediacionDeal', colmenaIntermediacionDealSchema);
