const mongoose = require('mongoose');

// ─── 1. Modelo de Conformación del Comité de Convivencia Laboral (Res. 3461/2025) ───
const convivenciaComiteSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyInfo',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Resolución 3461 de 2025 Art. 3: Comités por centros de trabajo cuando las circunstancias lo ameriten
    centroTrabajo: {
      type: String,
      required: true,
      default: 'Sede Principal',
      trim: true,
    },
    periodoInicio: {
      type: Date,
      required: true,
      default: Date.now,
    },
    periodoFin: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 años
    },
    estado: {
      type: String,
      enum: ['activo', 'renovacion', 'vencido'],
      default: 'activo',
    },
    representantesEmpleador: [
      {
        nombre: { type: String, required: true },
        cedula: { type: String, required: true },
        cargo: { type: String, default: '' },
        rol: {
          type: String,
          enum: ['Presidente', 'Principal', 'Suplente'],
          default: 'Principal',
        },
        telefono: { type: String, default: '' },
        email: { type: String, default: '' },
      },
    ],
    representantesTrabajadores: [
      {
        nombre: { type: String, required: true },
        cedula: { type: String, required: true },
        cargo: { type: String, default: '' },
        rol: {
          type: String,
          enum: ['Secretario', 'Principal', 'Suplente'],
          default: 'Principal',
        },
        telefono: { type: String, default: '' },
        email: { type: String, default: '' },
      },
    ],
    observaciones: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// ─── 2. Modelo de Actas Trimestrales Ordinarias y Extraordinarias (Res. 3461/2025) ───
const convivenciaActaSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyInfo',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    comiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SgsstConvivenciaComite',
      required: false,
    },
    centroTrabajo: {
      type: String,
      default: 'Sede Principal',
    },
    consecutivo: {
      type: String,
      required: true,
      trim: true,
      // Ej. "ACTA-COCOLAB-2025-Q1"
    },
    tipo: {
      type: String,
      enum: ['ordinaria_trimestral', 'extraordinaria'],
      default: 'ordinaria_trimestral',
      required: true,
    },
    trimestre: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
    },
    anio: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    fecha: {
      type: Date,
      required: true,
      default: Date.now,
    },
    horaInicio: {
      type: String,
      default: '09:00',
    },
    horaFin: {
      type: String,
      default: '11:00',
    },
    lugar: {
      type: String,
      default: 'Sala Confidencial de Convivencia / Virtual',
    },
    quorumVerificado: {
      type: Boolean,
      default: true,
    },
    asistentes: [
      {
        nombre: { type: String, required: true },
        cedula: { type: String, required: true },
        cargo: { type: String, default: '' },
        rol: { type: String, default: 'Miembro' },
        asistio: { type: Boolean, default: true },
        firma: { type: String, default: null },
        firmadoEn: { type: Date, default: null },
        firmadoDesde: { type: String, default: null }, // 'portal_trabajador' | 'admin'
      },
    ],
    // Informe estadístico de quejas (completamente anonimizado para preservar la intimidad)
    estadisticasQuejas: {
      quejasRecibidasTrimestre: { type: Number, default: 0 },
      enTramite: { type: Number, default: 0 },
      acuerdosConciliatorios: { type: Number, default: 0 },
      archivadasSinMerito: { type: Number, default: 0 },
      remitidasAltaDireccion: { type: Number, default: 0 },
      casosAcosoSexualLey2365: { type: Number, default: 0 },
    },
    desarrollo: {
      revisionQuejasTrimestre: { type: String, default: '' },
      campanasPreventivasAcoso: { type: String, default: '' },
      climaLaboralPsicosocial: { type: String, default: '' },
      proposicionesVarios: { type: String, default: '' },
    },
    compromisos: [
      {
        accion: { type: String, required: true },
        responsable: { type: String, required: true },
        fechaLimite: { type: String, required: true },
        estado: {
          type: String,
          enum: ['pendiente', 'en_progreso', 'cumplido'],
          default: 'pendiente',
        },
      },
    ],
    proximaReunionFecha: {
      type: String,
      default: '',
    },
    estadoActa: {
      type: String,
      enum: ['borrador', 'en_firmas', 'aprobada', 'archivada'],
      default: 'borrador',
    },
  },
  { timestamps: true }
);

// ─── 3. Modelo de Caso Confidencial de Convivencia (Res. 3461/2025 & Ley 2365/2024) ───
const convivenciaCasoSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyInfo',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    radicado: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tipoAcoso: {
      type: String,
      enum: ['laboral_ley_1010', 'sexual_ley_2365'],
      required: true,
    },
    esAnonimo: {
      type: Boolean,
      default: false,
    },
    denuncianteNombre: {
      type: String,
      default: 'Confidencial / Anónimo',
    },
    denuncianteCedula: {
      type: String,
      default: '',
    },
    denuncianteCargo: {
      type: String,
      default: '',
    },
    denuncianteContacto: {
      type: String,
      default: '',
    },
    personaReportada: {
      type: String,
      required: true,
    },
    cargoPersonaReportada: {
      type: String,
      default: '',
    },
    descripcionHechos: {
      type: String,
      required: true,
    },
    fechaHechos: {
      type: String,
      default: '',
    },
    lugarHechos: {
      type: String,
      default: '',
    },
    testigos: {
      type: String,
      default: '',
    },
    evidencias: {
      type: Array,
      default: [],
    },
    peticionOProteccion: {
      type: String,
      default: '',
    },
    // Temporizador perentorio de 65 días calendario (Resolución 3461 de 2025)
    fechaRadicacion: {
      type: Date,
      default: Date.now,
    },
    fechaLimite65Dias: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 65 * 24 * 60 * 60 * 1000),
    },
    estado: {
      type: String,
      enum: [
        'radicado',
        'en_tramite',
        'audiencia_conciliacion',
        'acuerdo_conciliatorio',
        'no_acuerdo_alta_direccion',
        'medidas_cautelares_ley_2365', // Activación de ruta urgente sin conciliación
        'archivado',
      ],
      default: 'radicado',
    },
    // Para Acoso Sexual (Ley 2365 de 2024: NO es conciliable; medidas de protección en <48 horas)
    medidasProteccionUrgentes: {
      reubicacionFisica: { type: Boolean, default: false },
      cambioHorarioOModalidad: { type: Boolean, default: false },
      prohibicionContacto: { type: Boolean, default: false },
      apoyoPsicologicoArlEps: { type: Boolean, default: false },
      detalleMedidas: { type: String, default: '' },
      fechaActivacion: { type: Date, default: null },
    },
    // Bitácora cronológica confidencial de actuaciones del Comité
    actuaciones: [
      {
        fecha: { type: Date, default: Date.now },
        tipo: { type: String, required: true }, // 'citacion_parte', 'audiencia_individual', 'audiencia_conjunta', 'acta_acuerdo', 'seguimiento'
        descripcion: { type: String, required: true },
        responsable: { type: String, default: 'Secretario del CCL' },
        documentoAdjunto: { type: String, default: '' },
      },
    ],
    acuerdosLogrados: {
      type: String,
      default: '',
    },
    planSeguimiento: {
      type: String,
      default: '',
    },
    fechaCierre: {
      type: Date,
      default: null,
    },
    notasInternasComite: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const SgsstConvivenciaComite = mongoose.models.SgsstConvivenciaComite || mongoose.model('SgsstConvivenciaComite', convivenciaComiteSchema);
const SgsstConvivenciaActa = mongoose.models.SgsstConvivenciaActa || mongoose.model('SgsstConvivenciaActa', convivenciaActaSchema);
const SgsstConvivenciaCaso = mongoose.models.SgsstConvivenciaCaso || mongoose.model('SgsstConvivenciaCaso', convivenciaCasoSchema);

module.exports = {
  SgsstConvivenciaComite,
  SgsstConvivenciaActa,
  SgsstConvivenciaCaso,
};
