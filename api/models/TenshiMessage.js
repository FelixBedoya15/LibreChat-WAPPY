const mongoose = require('mongoose');

const tenshiMessageSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        htmlReport: {
            type: String,
        },
    },
    { timestamps: true }
);

const TenshiMessage = mongoose.model('TenshiMessage', tenshiMessageSchema);

module.exports = TenshiMessage;
