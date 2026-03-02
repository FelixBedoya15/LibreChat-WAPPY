const { Course } = require('../../models/Course');
const { UserProgress } = require('../../models/UserProgress');

const getCourses = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        // Fetch all published courses
        const courses = await Course.find({ isPublished: true }).select('-lessons.content').lean();

        // Fetch progress for this user
        const progressList = await UserProgress.find({ user: userId }).lean();

        // Map progress to courses
        const coursesWithProgress = courses.map(course => {
            const progress = progressList.find(p => p.course.toString() === course._id.toString());
            const totalLessons = course.lessons ? course.lessons.length : 0;
            const completedCount = progress && progress.completedLessons ? progress.completedLessons.length : 0;

            return {
                ...course,
                progress: {
                    completedCount,
                    totalLessons,
                    percentage: totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100),
                    isCompleted: progress ? progress.isCourseCompleted : false
                }
            };
        });

        res.status(200).json(coursesWithProgress);
    } catch (error) {
        console.error('Error in getCourses:', error);
        res.status(500).json({ message: 'Error retrieving courses' });
    }
};

const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id || req.user.id;

        const course = await Course.findById(id).lean();
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const progress = await UserProgress.findOne({ user: userId, course: id }).lean();

        const responseData = {
            ...course,
            progress: progress ? {
                completedLessons: progress.completedLessons || [],
                isCompleted: progress.isCourseCompleted
            } : { completedLessons: [], isCompleted: false }
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error in getCourseById:', error);
        res.status(500).json({ message: 'Error retrieving course details' });
    }
};

const markLessonComplete = async (req, res) => {
    try {
        const { courseId, lessonId } = req.body;
        const userId = req.user._id || req.user.id;

        if (!courseId || !lessonId) {
            return res.status(400).json({ message: 'Missing courseId or lessonId' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Validate lesson exists
        const lessonExists = course.lessons.some(l => l._id.toString() === lessonId);
        if (!lessonExists) {
            return res.status(404).json({ message: 'Lesson not found in this course' });
        }

        let progress = await UserProgress.findOne({ user: userId, course: courseId });

        if (!progress) {
            progress = new UserProgress({
                user: userId,
                course: courseId,
                completedLessons: [lessonId]
            });
        } else {
            // Add if not already completed
            if (!progress.completedLessons.includes(lessonId)) {
                progress.completedLessons.push(lessonId);
            }
        }

        progress.lastAccessed = new Date();

        // Check if course is fully complete
        const totalLessons = course.lessons.length;
        if (progress.completedLessons.length >= totalLessons) {
            progress.isCourseCompleted = true;
        }

        await progress.save();

        res.status(200).json({
            message: 'Lesson marked as complete',
            progress: {
                completedLessons: progress.completedLessons,
                isCompleted: progress.isCourseCompleted
            }
        });
    } catch (error) {
        console.error('Error in markLessonComplete:', error);
        res.status(500).json({ message: 'Error updating course progress' });
    }
};

module.exports = {
    getCourses,
    getCourseById,
    markLessonComplete
};
