const Question = require('../models/Question');

// @desc    Get all questions for an exam
// @route   GET /api/admin/exams/:examId/questions
// @access  Private/Admin
const getQuestions = async (req, res) => {
    try {
        const questions = await Question.find({ exam: req.params.examId })
            .populate('subject', 'name')
            .populate('exam', 'title')
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            count: questions.length,
            data: questions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching questions',
            error: error.message
        });
    }
};

// @desc    Get single question
// @route   GET /api/admin/questions/:id
// @access  Private/Admin
const getQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id)
            .populate('subject', 'name')
            .populate('exam', 'title');

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        res.json({
            success: true,
            data: question
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching question',
            error: error.message
        });
    }
};

// @desc    Create new question
// @route   POST /api/admin/exams/:examId/questions
// @access  Private/Admin
const createQuestion = async (req, res) => {
    try {
        const {
            questionText,
            options,
            correctOption,
            marks,
            explanation,
            subject
        } = req.body;

        const question = await Question.create({
            exam: req.params.examId,
            subject,
            questionText,
            options,
            correctOption,
            marks,
            explanation,
            createdBy: req.user._id
        });

        await question.populate('subject', 'name');
        await question.populate('exam', 'title');

        res.status(201).json({
            success: true,
            data: question
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating question',
            error: error.message
        });
    }
};

// @desc    Create multiple questions
// @route   POST /api/admin/exams/:examId/questions/bulk
// @access  Private/Admin
const createBulkQuestions = async (req, res) => {
    try {
        const { questions } = req.body;

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of questions'
            });
        }

        const questionsToCreate = questions.map(question => ({
            ...question,
            exam: req.params.examId,
            createdBy: req.user._id
        }));

        const createdQuestions = await Question.insertMany(questionsToCreate);

        res.status(201).json({
            success: true,
            count: createdQuestions.length,
            data: createdQuestions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating questions',
            error: error.message
        });
    }
};

// @desc    Update question
// @route   PUT /api/admin/questions/:id
// @access  Private/Admin
const updateQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        const updates = { ...req.body };
        delete updates.exam; // Prevent updating exam field
        delete updates.createdBy; // Prevent updating createdBy field

        Object.keys(updates).forEach(key => {
            question[key] = updates[key];
        });

        await question.save();
        await question.populate('subject', 'name');
        await question.populate('exam', 'title');

        res.json({
            success: true,
            data: question
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating question',
            error: error.message
        });
    }
};

// @desc    Delete question
// @route   DELETE /api/admin/questions/:id
// @access  Private/Admin
const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        await question.deleteOne();

        res.json({
            success: true,
            message: 'Question deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting question',
            error: error.message
        });
    }
};

module.exports = {
    getQuestions,
    getQuestion,
    createQuestion,
    createBulkQuestions,
    updateQuestion,
    deleteQuestion
}; 