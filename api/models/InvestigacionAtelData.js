const mongoose = require('mongoose');

const InvestigacionAtelDataSchema = new mongoose.Schema({
    id: {
        type: String,
        default: () => require('crypto').randomUUID(),
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CompanyInfo',
        required: false
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

// New index is unique on user, companyId and id combined
InvestigacionAtelDataSchema.index({ user: 1, companyId: 1, id: 1 }, { unique: true });

const InvestigacionAtelData = mongoose.models.InvestigacionAtelData || mongoose.model('InvestigacionAtelData', InvestigacionAtelDataSchema);

// Drop the old unique index user_1_companyId_1 if it exists to allow multiple investigations
if (mongoose.connection.readyState === 1) {
    InvestigacionAtelData.collection.dropIndex('user_1_companyId_1').catch(() => {});
} else {
    mongoose.connection.once('open', () => {
        InvestigacionAtelData.collection.dropIndex('user_1_companyId_1').catch(() => {});
    });
}

module.exports = InvestigacionAtelData;

