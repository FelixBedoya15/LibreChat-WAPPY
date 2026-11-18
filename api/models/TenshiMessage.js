const mongoose = require('mongoose');

const tenshiEvidenceFileSchema = new mongoose.Schema(
    {
        title: { type: String, default: '' },
        portal: { type: String, default: '' },
        workerName: { type: String, default: '' },
        cedula: { type: String, default: '' },
        cargo: { type: String, default: '' },
        pdfUrl: { type: String, default: null },
        pdfDownloadUrl: { type: String, default: null },
        pdfAbsoluteUrl: { type: String, default: null },
        pdfFileName: { type: String, default: null },
        imageUrl: { type: String, default: null },
        imageDownloadUrl: { type: String, default: null },
        imageAbsoluteUrl: { type: String, default: null },
        imageFileName: { type: String, default: null },
    },
    { _id: false }
);

const tenshiMessageSchema = mongoose.Schema(
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
        image: {
            type: String,
        },
        media: {
            name: { type: String },
            type: { type: String },
            mimeType: { type: String },
            size: { type: Number },
            dataUrl: { type: String },
            content: { type: String },
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
        widget: {
            widgetType: { type: String },
            title: { type: String },
            subtitle: { type: String },
            status: { type: String },
            actionId: { type: String },
            data: { type: mongoose.Schema.Types.Mixed },
        },
        evidenceFiles: {
            type: [tenshiEvidenceFileSchema],
            default: undefined,
        },
    },
    { timestamps: true }
);

tenshiMessageSchema.index({ user: 1, companyId: 1, createdAt: 1 });

const TenshiMessage = mongoose.model('TenshiMessage', tenshiMessageSchema);

module.exports = TenshiMessage;
