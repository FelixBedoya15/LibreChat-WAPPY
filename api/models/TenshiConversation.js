const mongoose = require('mongoose');

const tenshiConversationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        companyId: {
            type: String,
            default: null,
            index: true,
        },
        title: {
            type: String,
            default: 'Nuevo chat',
            maxlength: 120,
            trim: true,
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
        messageCount: {
            type: Number,
            default: 0,
        },
        modelOverride: {
            type: String,
            default: null,
        },
        isLegacyDefault: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

tenshiConversationSchema.index({ user: 1, companyId: 1, lastMessageAt: -1 });

const TenshiConversation =
    mongoose.models.TenshiConversation ||
    mongoose.model('TenshiConversation', tenshiConversationSchema);

module.exports = TenshiConversation;
