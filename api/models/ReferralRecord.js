const mongoose = require('mongoose');

const referralRecordSchema = new mongoose.Schema({
    referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    referredByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    referredByPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', default: null, index: true },
    status: { type: String, enum: ['registered', 'subscribed'], default: 'registered' }
}, { timestamps: true });

const ReferralRecord = mongoose.models.ReferralRecord || mongoose.model('ReferralRecord', referralRecordSchema);
module.exports = ReferralRecord;
