const mongoose = require('mongoose');

const companyInfoSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    companyName: {
        type: String,
        trim: true,
        default: '',
    },
    nit: {
        type: String,
        trim: true,
        default: '',
    },
    legalRepresentative: {
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
    generalActivities: {
        type: String,
        trim: true,
        default: '',
    },
    sector: {
        type: String,
        trim: true,
        default: '',
    },
    responsibleSST: {
        type: String,
        trim: true,
        default: '',
    },
}, { timestamps: true });

module.exports = mongoose.model('CompanyInfo', companyInfoSchema);
