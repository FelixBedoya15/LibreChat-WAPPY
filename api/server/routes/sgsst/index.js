const diagnostico = require('./diagnostico');
const companyInfo = require('./companyInfo');
const config = require('./config');
const politica = require('./politica');
const matriz = require('./matriz');
const estadisticas = require('./estadisticas');
const matrizPeligros = require('./matrizPeligros');
const perfilSociodemografico = require('./perfilSociodemografico');
const objetivos = require('./objetivos');
const rhs = require('./rhs');
const rit = require('./rit');
const responsable = require('./responsable');
const permisoAlturas = require('./permisoAlturas');
const perfilesCargo = require('./perfilesCargo');
const investigacionAtel = require('./investigacionAtel');
const reporteActos = require('./reporteActos');
const analisisTrabajoSeguro = require('./analisisTrabajoSeguro');
const metodoOwas = require('./metodoOwas');
const analisisVulnerabilidad = require('./analisisVulnerabilidad');
const predictivo = require('./predictivo');
const participacionIpevar = require('./participacionIpevar');
const altaDireccion = require('./altaDireccion');
const gtc45Workspace = require('./gtc45Workspace');
const liveEditor = require('./liveEditor');
const patchAgentPrompt = require('./patchAgentPrompt');
const programaCapacitaciones = require('./programaCapacitaciones');
const workers = require('./workers');



module.exports = {
    diagnostico,
    companyInfo,
    config,
    politica,
    matriz,
    estadisticas,
    atelData: require('./atel-data'),
    matrizPeligros,
    perfilSociodemografico,
    objetivos,
    rhs,
    rit,
    responsable,
    permisoAlturas,
    perfilesCargo,
    investigacionAtel,
    reporteActos,
    analisisTrabajoSeguro,
    metodoOwas,
    analisisVulnerabilidad,
    predictivo,
    participacionIpevar,
    altaDireccion,
    signatures: require('./signatures'),
    gtc45Workspace,
    liveEditor,
    patchAgentPrompt,
    programaCapacitaciones,
    workers,
};

