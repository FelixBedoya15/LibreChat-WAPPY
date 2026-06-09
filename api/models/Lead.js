const mongoose = require('mongoose');

const leadSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    videoUrl: {
        type: String,
        trim: true,
    },
    funnelKey: {
        type: String,
        default: 'comunidad',
        trim: true
    }
}, { timestamps: true });

const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

module.exports = { Lead };
