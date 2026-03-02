const mongoose = require('mongoose');

const lessonSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String, // Can be Markdown or HTML
    },
    videoUrl: {
        type: String, // e.g. YouTube or Vimeo link
    },
    order: {
        type: Number,
        default: 0,
    }
});

const courseSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    thumbnail: {
        type: String, // URL to image
    },
    tags: [{
        type: String
    }],
    lessons: [lessonSchema],
    isPublished: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

module.exports = { Course };
