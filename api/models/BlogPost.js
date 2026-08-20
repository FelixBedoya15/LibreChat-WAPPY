const mongoose = require('mongoose');

const attachmentSchema = mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    filename: { type: String },
    size: { type: Number },
    fileType: { type: String }
});

const blogPostSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    content: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
    },
    tags: [{
        type: String
    }],
    attachments: [attachmentSchema],
    isPublished: {
        type: Boolean,
        default: false,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', blogPostSchema);

module.exports = { BlogPost };

