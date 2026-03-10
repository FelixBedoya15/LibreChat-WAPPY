const diagnostico = require('./diagnostico');
const companyInfo = require('./companyInfo');
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


module.exports = {
    diagnostico,
    companyInfo,
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
    signatures: require('./signatures'),
};

