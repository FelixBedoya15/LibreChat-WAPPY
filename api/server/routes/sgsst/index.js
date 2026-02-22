const diagnostico = require('./diagnostico');
const companyInfo = require('./companyInfo');
const politica = require('./politica');
const matriz = require('./matriz');
const estadisticas = require('./estadisticas');
const matrizPeligros = require('./matrizPeligros');

module.exports = {
    diagnostico,
    companyInfo,
    politica,
    matriz,
    estadisticas,
    atelData: require('./atel-data'),
    matrizPeligros,
};
