const mongoose = require('mongoose');

const userProgressSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    completedLessons: [{
        type: mongoose.Schema.Types.ObjectId, // references the virtual lesson IDs inside the course.lessons array
    }],
    isCourseCompleted: {
        type: Boolean,
        default: false,
    },
    lastAccessed: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

// Ensure one progress record per user per course
userProgressSchema.index({ user: 1, course: 1 }, { unique: true });

const UserProgress = mongoose.models.UserProgress || mongoose.model('UserProgress', userProgressSchema);

module.exports = { UserProgress };
