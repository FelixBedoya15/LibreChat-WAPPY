const mongoose = require('mongoose');

const matrizIpvrMetricSchema = new mongoose.Schema({
    companyName: {
        type: String,
        trim: true,
        default: '',
        index: true,
    },
    companyType: {
        type: String,
        trim: true,
        default: 'Persona Jurídica',
    },
    nit: {
        type: String,
        trim: true,
        default: '',
        index: true,
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
    workerCount: {
        type: Number,
        default: 0,
    },
    arl: {
        type: String,
        trim: true,
        default: '',
    },
    economicActivity: {
        type: String,
        trim: true,
        default: '',
    },
    riskLevel: {
        type: String,
        trim: true,
        default: '',
    },
    ciiu: {
        type: String,
        trim: true,
        default: '',
    },
    address: {
        type: String,
        trim: true,
        default: '',
    },
    city: {
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
    licenseNumber: {
        type: String,
        trim: true,
        default: '',
    },
    licenseExpiry: {
        type: String,
        trim: true,
        default: '',
    },
    formationLevel: {
        type: String,
        trim: true,
        default: '',
    },
    totalRisks: {
        type: Number,
        default: 0,
    },
    highRisks: {
        type: Number,
        default: 0,
    },
    mediumRisks: {
        type: Number,
        default: 0,
    },
    lowRisks: {
        type: Number,
        default: 0,
    },
    matrixRowsCount: {
        type: Number,
        default: 0,
    },
    processes: [{
        type: String,
        trim: true
    }],
    cargos: [{
        type: String,
        trim: true
    }],
    peligros: [{
        type: String,
        trim: true
    }],
    sedesCount: {
        type: Number,
        default: 0,
    },
    clientIp: {
        type: String,
        default: '',
    },
    source: {
        type: String,
        default: 'matrizipvr_live',
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MatrizIpvrMetric', matrizIpvrMetricSchema);
