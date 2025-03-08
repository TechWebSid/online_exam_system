const Exam = require('../models/Exam');
const Question = require('../models/Question');

// @desc    Get all exams
// @route   GET /api/admin/exams
// @access  Private/Admin
const getAllExams = async (req, res) => {
    try {
        const exams = await Exam.find()
            .populate('subject', 'name')
            .populate('questions')
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: exams.length,
            data: exams
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching exams',
            error: error.message
        });
    }
};

// @desc    Get single exam
// @route   GET /api/admin/exams/:id
// @access  Private/Admin
const getExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('subject', 'name')
            .populate('createdBy', 'username');

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        res.json({
            success: true,
            data: exam
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching exam',
            error: error.message
        });
    }
};

// @desc    Create new exam
// @route   POST /api/admin/exams
// @access  Private/Admin
const createExam = async (req, res) => {
    try {
        const {
            title,
            subject,
            duration,
            passingMarks,
            totalMarks,
            attemptLimit,
            instructions,
            startDate,
            endDate,
            questions
        } = req.body;

        // First create all questions
        const createdQuestions = await Promise.all(
            questions.map(async (q) => {
                const question = await Question.create({
                    text: q.text,
                    options: q.options,
                    marks: q.marks,
                    explanation: q.explanation,
                    subject,
                    createdBy: req.user._id
                });
                return question._id;
            })
        );

        // Create exam with question references
        const exam = await Exam.create({
            title,
            subject,
            duration,
            passingMarks,
            totalMarks,
            attemptLimit,
            instructions,
            startDate,
            endDate,
            questions: createdQuestions,
            createdBy: req.user._id
        });

        // Populate the exam with all related data
        await exam.populate('subject', 'name');
        await exam.populate('questions');
        await exam.populate('createdBy', 'username');

        res.status(201).json({
            success: true,
            data: exam
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating exam',
            error: error.message
        });
    }
};

// @desc    Update exam
// @route   PUT /api/admin/exams/:id
// @access  Private/Admin
const updateExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        const {
            title,
            subject,
            duration,
            passingMarks,
            totalMarks,
            attemptLimit,
            instructions,
            startDate,
            endDate,
            questions
        } = req.body;

        // Delete existing questions
        await Question.deleteMany({ _id: { $in: exam.questions } });

        // Create new questions
        const createdQuestions = await Promise.all(
            questions.map(async (q) => {
                const question = await Question.create({
                    text: q.text,
                    options: q.options,
                    marks: q.marks,
                    explanation: q.explanation,
                    subject,
                    createdBy: req.user._id
                });
                return question._id;
            })
        );

        // Update exam
        exam.title = title;
        exam.subject = subject;
        exam.duration = duration;
        exam.passingMarks = passingMarks;
        exam.totalMarks = totalMarks;
        exam.attemptLimit = attemptLimit;
        exam.instructions = instructions;
        exam.startDate = startDate;
        exam.endDate = endDate;
        exam.questions = createdQuestions;

        await exam.save();
        await exam.populate('subject', 'name');
        await exam.populate('questions');
        await exam.populate('createdBy', 'username');

        res.json({
            success: true,
            data: exam
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating exam',
            error: error.message
        });
    }
};

// @desc    Delete exam
// @route   DELETE /api/admin/exams/:id
// @access  Private/Admin
const deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        // Delete associated questions
        await Question.deleteMany({ _id: { $in: exam.questions } });

        // Delete exam
        await exam.deleteOne();

        res.json({
            success: true,
            message: 'Exam deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting exam',
            error: error.message
        });
    }
};

// @desc    Toggle exam status (active/inactive)
// @route   PATCH /api/admin/exams/:id/toggle-status
// @access  Private/Admin
const toggleExamStatus = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        exam.isActive = !exam.isActive;
        await exam.save();

        res.json({
            success: true,
            message: `Exam ${exam.isActive ? 'activated' : 'deactivated'} successfully`,
            data: exam
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error toggling exam status',
            error: error.message
        });
    }
};

module.exports = {
    getAllExams,
    getExam,
    createExam,
    updateExam,
    deleteExam,
    toggleExamStatus
}; 