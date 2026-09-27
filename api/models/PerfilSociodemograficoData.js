const mongoose = require('mongoose');

if (mongoose.models.PerfilSociodemograficoData) {
  module.exports = mongoose.models.PerfilSociodemograficoData;
} else {
  const WorkerEntrySchema = new mongoose.Schema({
    id: String,
    nombre: String,
    identificacion: String,
    edad: Number,
    genero: String,
    estadoCivil: String,
    nivelEscolaridad: String,
    direccion: String,
    telefono: String,
    cargo: String,
    fechaExamenMedico: String,
    fechaCursoAlturasAutorizado: String,
    fechaCursoAlturasCoordinador: String,
    diagnosticoMedico: String,
    recomendacionesMedicas: String,
    fechaSeguimiento: String,
    completedByAI: { type: Boolean, default: false },
    consentimientoFirmaDigital: { type: String, default: 'No' },
    firmaDigital: { type: String, default: null },
    // New extended sociodemographic fields
    fechaNacimiento: { type: String, default: '' },
    lugarNacimiento: { type: String, default: '' },
    barrio: { type: String, default: '' },
    municipioDomicilio: { type: String, default: '' },
    estrato: { type: String, default: '' },
    tipoVivienda: { type: String, default: '' },
    personasACargo: { type: Number, default: 0 },
    hijos: { type: Number, default: 0 },
    cabezaFamilia: { type: String, default: 'No' },
    areaTrabajo: { type: String, default: '' },
    tipoContrato: { type: String, default: '' },
    fechaIngreso: { type: String, default: '' },
    antiguedadAnos: { type: Number, default: 0 },
    jornadaLaboral: { type: String, default: 'Diurna' },
    salario: { type: String, default: '' },
    eps: { type: String, default: '' },
    afp: { type: String, default: '' },
    estadoPila: { type: String, default: 'Pendiente de soporte PILA' },
    licenciasConduccion: { type: Array, default: [] },
    licenciaConduccion: { type: String, default: '' },
    licenciaCategoria: { type: String, default: '' },
    licenciaVencimiento: { type: String, default: '' },
    soatVencimiento: { type: String, default: '' },
    tecnicomecanicaVencimiento: { type: String, default: '' },
    esCopasst: { type: String, default: 'No' },
    esComiteConvivencia: { type: String, default: 'No' },
    esBrigadista: { type: String, default: 'No' },
    esComiteSeguridadVial: { type: String, default: 'No' },
    formacion: { type: Array, default: [] },
    dictamenPredictivoH1: { type: String, default: '' },
    bioScoreIAVersion: { type: String, default: '' },
    bioScoreIAReason: { type: String, default: '' },
    bioScoreIADate: { type: Date, default: null },
    bioTagsIA: { type: Array, default: [] },
    bioScoreIAAptitud: { type: String, default: '' },
  }, { _id: false });

  const PerfilSociodemograficoDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
    trabajadores: [WorkerEntrySchema],
    actualizacionesPendientes: { type: Array, default: [] },
    actualizacionesPendientesSalud: { type: Array, default: [] },
    updatedAt: { type: Date, default: Date.now },
  });

  PerfilSociodemograficoDataSchema.index({ user: 1, companyId: 1 }, { unique: true });

  module.exports = mongoose.model('PerfilSociodemograficoData', PerfilSociodemograficoDataSchema);
}
