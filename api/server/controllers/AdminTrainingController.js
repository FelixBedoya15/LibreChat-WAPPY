const { Course } = require('../../models/Course');

// --- Courses ---

const getAllCoursesAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const courses = await Course.find({}).sort({ createdAt: -1 }).lean();
        res.status(200).json(courses);
    } catch (error) {
        console.error('Error in getAllCoursesAdmin:', error);
        res.status(500).json({ message: 'Error retrieving courses' });
    }
};

const createCourse = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const { title, description, thumbnail, tags, isPublished } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const newCourse = new Course({
            title,
            description,
            thumbnail,
            tags: tags || [],
            isPublished: isPublished || false,
            lessons: []
        });

        const savedCourse = await newCourse.save();
        res.status(201).json(savedCourse);
    } catch (error) {
        console.error('Error in createCourse:', error);
        res.status(500).json({ message: 'Error creating course' });
    }
};

const updateCourse = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const { id } = req.params;
        const updates = req.body;

        const updatedCourse = await Course.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.status(200).json(updatedCourse);
    } catch (error) {
        console.error('Error in updateCourse:', error);
        res.status(500).json({ message: 'Error updating course' });
    }
};

const deleteCourse = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const { id } = req.params;
        const result = await Course.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Optional: Also delete UserProgress associated with this course
        const { UserProgress } = require('../../models/UserProgress');
        await UserProgress.deleteMany({ course: id });

        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error in deleteCourse:', error);
        res.status(500).json({ message: 'Error deleting course' });
    }
};

// --- Lessons ---

const addLesson = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const { courseId } = req.params;
        const { title, content, videoUrl, order } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Lesson title is required' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const newLesson = { title, content, videoUrl, order: order || course.lessons.length + 1 };
        course.lessons.push(newLesson);

        await course.save();

        // Return the newly added lesson (the last one in the array)
        const addedLesson = course.lessons[course.lessons.length - 1];
        res.status(201).json(addedLesson);
    } catch (error) {
        console.error('Error in addLesson:', error);
        res.status(500).json({ message: 'Error adding lesson' });
    }
};

const updateLesson = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const { courseId, lessonId } = req.params;
        const updates = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const lesson = course.lessons.id(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        // Apply updates
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                lesson[key] = updates[key];
            }
        });

        await course.save();
        res.status(200).json(lesson);
    } catch (error) {
        console.error('Error in updateLesson:', error);
        res.status(500).json({ message: 'Error updating lesson' });
    }
};

const deleteLesson = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const { courseId, lessonId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const lesson = course.lessons.id(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        course.lessons.pull(lessonId);
        await course.save();

        res.status(200).json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        console.error('Error in deleteLesson:', error);
        res.status(500).json({ message: 'Error deleting lesson' });
    }
};

module.exports = {
    getAllCoursesAdmin,
    createCourse,
    updateCourse,
    deleteCourse,
    addLesson,
    updateLesson,
    deleteLesson
};
