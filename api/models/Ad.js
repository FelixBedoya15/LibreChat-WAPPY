const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: false,
        trim: true,
    },
    images: [{
        type: String, // URLs to images
        required: true,
    }],
    link: {
        type: String,
        required: false,
        trim: true,
    },
    ctaText: {
        type: String,
        required: false,
        default: 'Ver más',
    },
    active: {
        type: Boolean,
        default: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('Ad', adSchema);
