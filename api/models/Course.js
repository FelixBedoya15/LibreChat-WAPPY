const mongoose = require('mongoose');

const questionSchema = mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true },
    explanation: { type: String }
});

const examSchema = mongoose.Schema({
    title: { type: String },
    description: { type: String },
    questions: [questionSchema],
    passingScore: { type: Number, default: 70 },
    isEnabled: { type: Boolean, default: false }
});

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
    },
    exam: examSchema
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
    exam: examSchema,
    isPublished: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

module.exports = { Course };
