const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['Petición', 'Queja', 'Reclamo', 'Sugerencia', 'Solicitud Empresarial'],
        default: 'Petición',
    },
    description: {
        type: String, // Detail of the request
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'resolved', 'closed'],
        default: 'pending',
    },
    response: {
        type: String,
    },
    adminResponseBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    attachments: [{
        type: String, // URL/Path to files
    }],
}, { timestamps: true });

ticketSchema.index({ name: 'text', description: 'text', response: 'text', type: 'text' });

module.exports = mongoose.model('Ticket', ticketSchema);
