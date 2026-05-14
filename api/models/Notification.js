const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: [
            'ticket_created', 'ticket_responded', 'contact_request', 'payment_received',
            'sgsst_reporte_acto', 'sgsst_participacion_ipevar', 'sgsst_alta_direccion', 'sgsst_perfil_update',
            'sgsst_testimonio_atel', 'system_update', 'welcome_promo'
        ],
        required: true,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
    },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
