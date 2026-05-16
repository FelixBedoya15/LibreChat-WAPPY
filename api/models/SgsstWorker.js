const mongoose = require('mongoose');

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const BioRiskSchema = new mongoose.Schema({
  id: String,
  fecha_registro: { type: Date, default: Date.now },

  // Origen del Riesgo (Opcional, complementario)
  origen_riesgo: { type: String, enum: ['Condición Insegura', 'Acto Inseguro', 'Inherente a la Tarea'], default: 'Inherente a la Tarea' },

  // Contexto Bio-Individual (Expandido para cubrir GTC-45)
  dominio_bio: String,         // Osteomuscular|Cardiovascular|Neurológico|Psicoemocional|Metabólico|Respiratorio|Sensorial|Inmunológico|Seguridad
  dimension_bio: String,       // Mapeo directo a Descripción GTC-45 (ej. Ruido, Virus, Movimiento repetitivo)
  peligro_cargo: String,
  actividad_expuesta: String,

  // Moduladores individuales
  factor_individual: String,   // Condición del trabajador que amplifica el riesgo
  fit_score: Number,           // FIT % en el momento del registro
  percepcion_riesgo_pts: { type: Number, default: 0 },

  // Cálculo
  nivel_susceptibilidad: { type: Number, min: 1, max: 5, default: 1 },
  nivel_exposicion: { type: Number, min: 1, max: 5, default: 1 },
  indice_bio_riesgo_bruto: Number,    // susceptibilidad × exposicion
  factor_reduccion_percepcion: Number, // pts / 500 (máx 0.40)
  indice_bio_riesgo_efectivo: Number, // bruto × (1 - factor_reduccion)

  // Clasificación
  clasificacion_bio: { type: String, enum: ['Crítico', 'Alto', 'Moderado', 'Bajo'], default: 'Moderado' },
  intervencion_prioritaria: { type: Boolean, default: false },

  // Plan individualizado (Jerarquía de Controles 1072)
  controles_fuente: String,
  controles_medio: String,
  controles_individuo: String,
  plan_accion_bio: String, // Legado o general
  restricciones_laborales: String,
  seguimiento_medico: { type: String, enum: ['Mensual', 'Trimestral', 'Semestral', 'Anual'], default: 'Anual' },
}, { _id: false });

const PercepcionHistorialSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now },
  accion: String,
  puntos: Number,
  modulo: { type: String, enum: ['actos', 'participacion_ipevar', 'atel', 'capacitacion', 'ats'] },
  referencia: String, // ID del registro origen
}, { _id: false });

const ATELSchema = new mongoose.Schema({
  fecha: Date,
  tipo: String,         // Accidente | Enfermedad laboral
  descripcion: String,
  referenciaId: String,
}, { _id: false });

const ActoInseguroSchema = new mongoose.Schema({
  fecha: Date,
  tipo: String,
  descripcion: String,
}, { _id: false });

const ParticipacionSchema = new mongoose.Schema({
  fecha: Date,
  descripcion: String,
}, { _id: false });

const CapacitacionSchema = new mongoose.Schema({
  nombre: String,
  fecha: Date,
}, { _id: false });

const ATSSchema = new mongoose.Schema({
  fecha: Date,
  descripcion: String,
}, { _id: false });

// ─── Schema principal ─────────────────────────────────────────────────────────

const SgsstWorkerSchema = new mongoose.Schema({
  // Identificación (existente)
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
  perfilId: { type: String, required: true },
  nombre: { type: String, required: true },
  documento: { type: String, required: true },
  fechaNacimiento: { type: Date },
  genero: { type: String },
  fechaIngreso: { type: Date },
  condicionesSalud: { type: String, default: '' },
  observaciones: { type: String, default: '' },

  // Legado (se mantiene para retrocompatibilidad)
  riesgosIpevar: { type: Array, default: [] },

  // ── NUEVA: Hoja de Vida Bio-Individual ──────────────────────────────────────

  // Nueva metodología Bio-Individual (reemplaza riesgosIpevar en el nuevo hub)
  riesgosBioIndividual: { type: [BioRiskSchema], default: [] },

  // FIT — Índice Biocéntrico Integral (sincronizado desde PerfilSociodemografico)
  fitScore: { type: Number, default: 0 },
  fitAlerts: { type: Array, default: [] },  // e.g. ['Tabaquismo Activo', 'Alerta Burnout']

  // Gamificación — Percepción del Riesgo
  percepcionRiesgoScore: { type: Number, default: 0 },
  percepcionRiesgoHistorial: { type: [PercepcionHistorialSchema], default: [] },

  // Historial de eventos por módulo (auto-feed)
  atel: { type: [ATELSchema], default: [] },
  actos_inseguros: { type: [ActoInseguroSchema], default: [] },
  participaciones_ipevar: { type: [ParticipacionSchema], default: [] },
  capacitaciones: { type: [CapacitacionSchema], default: [] },
  ats: { type: [ATSSchema], default: [] },

  updatedAt: { type: Date, default: Date.now },
});

SgsstWorkerSchema.index({ user: 1, companyId: 1, perfilId: 1 });
SgsstWorkerSchema.index({ user: 1, documento: 1 }, { unique: true, sparse: true });

const SgsstWorker = mongoose.models.SgsstWorker || mongoose.model('SgsstWorker', SgsstWorkerSchema);

module.exports = SgsstWorker;
