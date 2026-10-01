const mongoose = require('mongoose');

// ─── 1. Modelo de Conformación del Comité Paritario (COPASST o Vigía) ───────────────
const copasstComiteSchema = new mongoose.Schema(
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
    // Modalidad reglamentaria según número de trabajadores (Res. 2013/1986 Art. 1 y Dec. 1295/1994)
    // < 10 trabajadores = vigia | >= 10 = copasst
    modalidad: {
      type: String,
      enum: ['copasst', 'vigia'],
      default: 'copasst',
      required: true,
    },
    periodoInicio: {
      type: Date,
      required: true,
      default: Date.now,
    },
    periodoFin: {
      type: Date,
      required: true,
      // Período de 2 años según Art. 63 Dec. 1295 de 1994
      default: () => new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
    },
    estado: {
      type: String,
      enum: ['activo', 'renovacion', 'vencido', 'en_proceso_eleccion'],
      default: 'activo',
    },
    horasSemanalesDedicadas: {
      type: Number,
      default: 4, // 4 horas semanales mínimas obligatorias por ley para miembros del COPASST
    },
    // Representantes designados directamente por el Empleador / Gerencia
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
    // Representantes elegidos democráticamente por sufragio secreto de los Trabajadores
    representantesTrabajadores: [
      {
        nombre: { type: String, required: true },
        cedula: { type: String, required: true },
        cargo: { type: String, default: '' },
        rol: {
          type: String,
          enum: ['Secretario', 'Principal', 'Suplente', 'Vigía'],
          default: 'Principal',
        },
        telefono: { type: String, default: '' },
        email: { type: String, default: '' },
        votosObtenidos: { type: Number, default: 0 },
      },
    ],
    // Para microempresas (<10 trabajadores) que solo eligen Vigía de SST
    vigia: {
      nombre: { type: String, default: '' },
      cedula: { type: String, default: '' },
      cargo: { type: String, default: '' },
      email: { type: String, default: '' },
      telefono: { type: String, default: '' },
      fechaEleccion: { type: Date, default: null },
    },
    observaciones: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// ─── 2. Modelo de Actas Mensuales Ordinarias y Extraordinarias ────────────────────
const copasstActaSchema = new mongoose.Schema(
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
      ref: 'SgsstCopasstComite',
      required: false,
    },
    consecutivo: {
      type: String,
      required: true,
      trim: true,
      // Ej. "ACTA-COPASST-2025-001"
    },
    tipo: {
      type: String,
      enum: ['ordinaria_mensual', 'extraordinaria'],
      default: 'ordinaria_mensual',
      required: true,
    },
    mes: {
      type: Number,
      min: 1,
      max: 12,
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
      default: '08:00',
    },
    horaFin: {
      type: String,
      default: '10:00',
    },
    centroTrabajo: {
      type: String,
      default: 'Sede Principal',
    },
    lugar: {
      type: String,
      default: 'Sala Principal de Reuniones / Híbrida',
    },
    ordenDelDia: {
      type: [String],
      default: [
        '1. Verificación del quórum reglamentario',
        '2. Lectura y aprobación del acta anterior',
        '3. Revisión de accidentalidad, incidentes y ausentismo del mes (ATEL)',
        '4. Estado de inspecciones planeadas de seguridad y condiciones de trabajo',
        '5. Avance de las capacitaciones y compromisos pendientes',
        '6. Proposiciones y varios',
      ],
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
        firma: { type: String, default: null }, // Base64 signature
        firmadoEn: { type: Date, default: null },
        firmadoDesde: { type: String, default: null }, // 'portal_trabajador' | 'admin'
      },
    ],
    // Desarrollo temático estructurado
    desarrollo: {
      lecturaActaAnterior: { type: String, default: 'Aprobada sin modificaciones.' },
      seguimientoCompromisos: { type: String, default: '' },
      analisisAccidentalidad: { type: String, default: '' },
      inspeccionesSeguridad: { type: String, default: '' },
      capacitacionesYCampanas: { type: String, default: '' },
      solicitudesTrabajadores: { type: String, default: '' },
      asesoriaArl: { type: String, default: '' },
      proposicionesVarios: { type: String, default: '' },
      analisisIaTenshi: { type: String, default: '' }, // Sugerencias automáticas por IA
    },
    reporteOficialHtml: {
      type: String,
      default: '',
    },
    // Compromisos / Plan de acción derivado del acta
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
        vinculadaAcpm: { type: Boolean, default: false },
        acpmId: { type: mongoose.Schema.Types.ObjectId, ref: 'KanbanTask', default: null },
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

// ─── 3. Modelo de Elecciones Democráticas del COPASST / Convivencia ─────────────────
const sgsstEleccionSchema = new mongoose.Schema(
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
    tipoComite: {
      type: String,
      enum: ['copasst', 'cocolab'],
      required: true,
    },
    titulo: {
      type: String,
      required: true,
      // Ej: "Elección de Representantes de los Trabajadores COPASST 2025-2027"
    },
    periodo: {
      type: String,
      default: '2025-2027',
    },
    fechaApertura: {
      type: Date,
      required: true,
      default: Date.now,
    },
    fechaCierre: {
      type: Date,
      required: true,
    },
    estado: {
      type: String,
      enum: ['convocatoria', 'activa', 'cerrada', 'escrutada'],
      default: 'convocatoria',
    },
    candidatos: [
      {
        id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        nombre: { type: String, required: true },
        cedula: { type: String, default: '' },
        cargo: { type: String, default: '' },
        propuesta: { type: String, default: '' },
        foto: { type: String, default: '' },
        votos: { type: Number, default: 0 },
      },
    ],
    votosEnBlanco: {
      type: Number,
      default: 0,
    },
    totalVotantesHabilitados: {
      type: Number,
      default: 0,
    },
    totalVotosEmitidos: {
      type: Number,
      default: 0,
    },
    juradosVotacion: [
      {
        nombre: { type: String, default: '' },
        cedula: { type: String, default: '' },
        cargo: { type: String, default: '' },
      },
    ],
    actaEscrutinioTexto: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const SgsstCopasstComite = mongoose.models.SgsstCopasstComite || mongoose.model('SgsstCopasstComite', copasstComiteSchema);
const SgsstCopasstActa = mongoose.models.SgsstCopasstActa || mongoose.model('SgsstCopasstActa', copasstActaSchema);
const SgsstEleccion = mongoose.models.SgsstEleccion || mongoose.model('SgsstEleccion', sgsstEleccionSchema);

// ─── 4. Modelo del Comité de Seguridad Vial (CSV - PESV Res. 20223040040595 Paso 1 y 2) ───
const pesvComiteSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      index: true,
      default: 'default_company',
    },
    periodoInicio: {
      type: Date,
      required: true,
      default: Date.now,
    },
    periodoFin: {
      type: Date,
      required: true,
    },
    nivelPesv: {
      type: String,
      enum: ['Básico', 'Estándar', 'Avanzado'],
      default: 'Estándar',
    },
    flotaTotal: {
      type: Number,
      default: 0,
    },
    conductoresTotal: {
      type: Number,
      default: 0,
    },
    frecuenciaReuniones: {
      type: String,
      enum: ['Trimestral', 'Mensual'],
      default: 'Trimestral',
    },
    estado: {
      type: String,
      enum: ['vigente', 'vencido', 'en_conformacion'],
      default: 'vigente',
    },
    // Paso 1: Líder del Diseño e Implementación del PESV (Obligatorio en Básico, Estándar y Avanzado)
    liderPesv: {
      nombre: { type: String, default: '' },
      cedula: { type: String, default: '' },
      cargo: { type: String, default: '' },
      email: { type: String, default: '' },
      telefono: { type: String, default: '' },
      fechaDesignacion: { type: Date, default: Date.now },
      nivelCompetencia: { type: String, default: 'Profesional / Especialista SST o Seguridad Vial' },
    },
    // Paso 2: Miembros del Comité de Seguridad Vial designados por la Alta Dirección (Mínimo 3 integrantes en Estándar/Avanzado)
    integrantesComite: [
      {
        nombre: { type: String, required: true },
        cedula: { type: String, required: true },
        cargo: { type: String, default: '' },
        rol: {
          type: String,
          enum: [
            'Presidente del CSV (Alta Dirección)',
            'Secretario Técnico / Líder PESV',
            'Vocal de Mantenimiento y Flota',
            'Vocal de Operaciones / Conductores',
            'Vocal de SST / Talento Humano',
            'Integrante Principal',
            'Suplente',
          ],
          default: 'Integrante Principal',
        },
        telefono: { type: String, default: '' },
        email: { type: String, default: '' },
      },
    ],
    // Paso 20: Objetivos y Metas Anuales del PESV (Seguimiento por el Comité)
    metasAnuales: [
      {
        codigo: { type: String, default: 'META-01' },
        indicador: { type: String, default: '' },
        metaAnual: { type: String, default: '' },
        resultadoActual: { type: String, default: '' },
        estado: { type: String, enum: ['Cumplida', 'En Seguimiento', 'Alerta'], default: 'En Seguimiento' },
      },
    ],
    observaciones: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// ─── 5. Modelo de Actas del Comité de Seguridad Vial (Trimestrales / Mensuales) ───
const pesvActaSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      index: true,
      default: 'default_company',
    },
    comiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SgsstPesvComite',
      default: null,
    },
    numeroActa: {
      type: String,
      required: true,
    },
    tipoSesion: {
      type: String,
      enum: ['Ordinaria Trimestral', 'Ordinaria Mensual', 'Extraordinaria (Siniestro Vial)'],
      default: 'Ordinaria Trimestral',
    },
    trimestre: {
      type: String,
      enum: ['Trimestre I', 'Trimestre II', 'Trimestre III', 'Trimestre IV', 'Extraordinaria'],
      default: 'Trimestre I',
    },
    mes: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    anio: {
      type: Number,
      required: true,
    },
    fechaReunion: {
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
      default: '10:30',
    },
    lugarModalidad: {
      type: String,
      default: 'Sala de Juntas / Híbrida',
    },
    asistentes: [
      {
        nombre: { type: String, required: true },
        cedula: { type: String, default: '' },
        cargo: { type: String, default: '' },
        rol: { type: String, default: 'Integrante CSV' },
        asistio: { type: Boolean, default: true },
        firma: { type: String, default: '' },
        firmadoEn: { type: Date, default: null },
        firmadoDesde: { type: String, default: '' },
      },
    ],
    // 8 puntos oficiales del Orden del Día del Comité de Seguridad Vial (Res. 20223040040595 Paso 2 y Paso 20)
    ordenDelDia: {
      verificacionQuorumActaAnterior: { type: String, default: '' },
      seguimientoCompromisosViales: { type: String, default: '' },
      analisisSiniestralidadInfracciones: { type: String, default: '' },
      inspeccionesPreoperacionalesMantenimiento: { type: String, default: '' },
      factoresHumanosVelocidadFatigaAlcohol: { type: String, default: '' },
      capacitacionCompetenciaVial: { type: String, default: '' },
      revisionIndicadoresPaso20: { type: String, default: '' },
      proposicionesPresupuestoVial: { type: String, default: '' },
    },
    compromisos: [
      {
        actividad: { type: String, required: true },
        responsable: { type: String, required: true },
        fechaLimite: { type: Date, default: null },
        estado: {
          type: String,
          enum: ['Pendiente', 'En Proceso', 'Cumplido'],
          default: 'Pendiente',
        },
        kanbanTaskId: { type: String, default: null },
      },
    ],
    resumenEjecutivoIA: {
      type: String,
      default: '',
    },
    estadoActa: {
      type: String,
      enum: ['borrador', 'firmada', 'cerrada'],
      default: 'borrador',
    },
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const SgsstPesvComite = mongoose.models.SgsstPesvComite || mongoose.model('SgsstPesvComite', pesvComiteSchema);
const SgsstPesvActa = mongoose.models.SgsstPesvActa || mongoose.model('SgsstPesvActa', pesvActaSchema);

module.exports = {
  SgsstCopasstComite,
  SgsstCopasstActa,
  SgsstEleccion,
  SgsstPesvComite,
  SgsstPesvActa,
};

