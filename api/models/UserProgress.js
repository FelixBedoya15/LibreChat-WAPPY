const mongoose = require('mongoose');

const userProgressSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Optional for workers
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CompanyInfo',
        required: false,
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
    workerCedula: {
        type: String,
        index: true,
        required: false
    },
    workerName: {
        type: String,
        required: false
    },
    lastAccessed: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

// Ensure unique progress record per user/course/company using partial filters to handle null user/workerCedula values
userProgressSchema.index(
    { user: 1, course: 1, companyId: 1 },
    { unique: true, partialFilterExpression: { user: { $exists: true, $ne: null } } }
);

userProgressSchema.index(
    { workerCedula: 1, course: 1, companyId: 1 },
    { unique: true, partialFilterExpression: { workerCedula: { $exists: true, $ne: null } } }
);

const UserProgress = mongoose.models.UserProgress || mongoose.model('UserProgress', userProgressSchema);

module.exports = { UserProgress };
