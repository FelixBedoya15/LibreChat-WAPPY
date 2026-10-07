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
        file: {
            title: { type: String },
            fileType: { type: String },
            content: { type: String },
            canvasId: { type: String },
        },
        qrCode: {
            tipo: { type: String },
            titulo: { type: String },
            descripcion: { type: String },
            url: { type: String },
            qrImageUrl: { type: String },
            instrucciones: { type: String },
        },
        report: {
            titulo: { type: String },
            aplicativo: { type: String },
            formato: { type: String },
            contenido: { type: String },
        },
    },
    { timestamps: true }
);

const TenshiMessage = mongoose.model('TenshiMessage', tenshiMessageSchema);

module.exports = TenshiMessage;
