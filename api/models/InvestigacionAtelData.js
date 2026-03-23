const mongoose = require('mongoose');

const InvestigacionAtelDataSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    formData: {
        type: Object,
        default: {}
    },
    equipoList: {
        type: Array,
        default: []
    },
    testigosList: {
        type: Array,
        default: []
    },
    images: {
        type: Object,
        default: {}
    },
    video: {
        type: String,
        default: null
    },
    inboxTestimonios: {
        type: Array,
        default: []
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

InvestigacionAtelDataSchema.index({ user: 1 }, { unique: true });

const InvestigacionAtelData = mongoose.models.InvestigacionAtelData || mongoose.model('InvestigacionAtelData', InvestigacionAtelDataSchema);

module.exports = InvestigacionAtelData;
