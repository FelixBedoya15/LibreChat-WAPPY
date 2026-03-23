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
    signatures: require('./signatures'),
};

