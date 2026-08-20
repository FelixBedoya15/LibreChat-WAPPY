const mongoose = require('mongoose');

const referralRecordSchema = new mongoose.Schema({
    referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    referredByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    referredByPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', default: null, index: true },
    status: { type: String, enum: ['registered', 'subscribed'], default: 'registered' },
    crmStage: { 
        type: String, 
        enum: ['nuevo', 'contactado', 'interesado', 'propuesta', 'ganado', 'frio', 'invalido'], 
        default: 'nuevo', 
        index: true 
    },
    crmNotes: [{
        id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        author: { type: String, default: 'Asesor' },
        text: { type: String, required: true },
        type: { 
            type: String, 
            enum: ['whatsapp', 'email', 'call', 'note', 'proposal', 'status_change'], 
            default: 'note' 
        },
        createdAt: { type: Date, default: Date.now }
    }],
    lastContactedAt: { type: Date, default: null },
    nextFollowUpDate: { type: Date, default: null }
}, { timestamps: true });

const ReferralRecord = mongoose.models.ReferralRecord || mongoose.model('ReferralRecord', referralRecordSchema);
module.exports = ReferralRecord;
