const mongoose = require('mongoose');

// ─── Colección 1: Padrón Electoral de Participación (Control de Duplicados) ─────────
// Registra únicamente si el colaborador ya sufragó para evitar que vote dos veces.
// NO CONTIENE POR QUIÉN VOTÓ. Garantiza el secreto constitucional del voto (Res. 2013/86 & Res. 3461/25).
const padronVotanteSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyInfo',
      required: true,
      index: true,
    },
    eleccionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SgsstEleccion',
      required: true,
      index: true,
    },
    trabajadorCedula: {
      type: String,
      required: true,
      trim: true,
    },
    trabajadorNombre: {
      type: String,
      default: '',
    },
    yaVoto: {
      type: Boolean,
      default: true,
    },
    fechaVoto: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Índice compuesto único para que una misma cédula jamás pueda votar dos veces en la misma elección
padronVotanteSchema.index({ eleccionId: 1, trabajadorCedula: 1 }, { unique: true });

// ─── Colección 2: Voto Secreto y Anónimo ──────────────────────────────────────────
// Registra exclusivamente la preferencia electoral del sufragante sin ningún vínculo con su cédula,
// identidad, sesión, IP o dispositivo.
const votoAnonimoSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyInfo',
      required: true,
      index: true,
    },
    eleccionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SgsstEleccion',
      required: true,
      index: true,
    },
    tipoComite: {
      type: String,
      enum: ['copasst', 'cocolab'],
      required: true,
    },
    // ID del candidato seleccionado o 'voto_en_blanco'
    candidatoId: {
      type: String,
      required: true,
    },
    fechaVoto: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const SgsstPadronVotante = mongoose.models.SgsstPadronVotante || mongoose.model('SgsstPadronVotante', padronVotanteSchema);
const SgsstVotoAnonimo = mongoose.models.SgsstVotoAnonimo || mongoose.model('SgsstVotoAnonimo', votoAnonimoSchema);

module.exports = {
  SgsstPadronVotante,
  SgsstVotoAnonimo,
};
