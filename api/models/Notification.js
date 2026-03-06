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
        enum: ['ticket_created', 'ticket_responded'],
        required: true,
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
