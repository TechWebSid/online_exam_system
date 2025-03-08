const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const ExamResult = require('../models/ExamResult');
const User = require('../models/User');
const Exam = require('../models/Exam');

// Import controllers
const {
    getAllStudents,
    deleteStudent,
    promoteToAdmin
} = require('../controllers/studentController');

const {
    getAllSubjects,
    getSubject,
    createSubject,
    updateSubject,
    deleteSubject
} = require('../controllers/subjectController');

const {
    getAllExams,
    getExam,
    createExam,
    updateExam,
    deleteExam,
    toggleExamStatus
} = require('../controllers/examController');

const {
    getQuestions,
    getQuestion,
    createQuestion,
    createBulkQuestions,
    updateQuestion,
    deleteQuestion
} = require('../controllers/questionController');

// Student management routes
router.get('/students', protect, isAdmin, getAllStudents);
router.delete('/students/:id', protect, isAdmin, deleteStudent);
router.patch('/students/:id/promote', protect, isAdmin, promoteToAdmin);

// Subject routes
router.route('/subjects')
    .get(protect, isAdmin, getAllSubjects)
    .post(protect, isAdmin, createSubject);

router.route('/subjects/:id')
    .get(protect, isAdmin, getSubject)
    .put(protect, isAdmin, updateSubject)
    .delete(protect, isAdmin, deleteSubject);

// Exam routes
router.route('/exams')
    .get(protect, isAdmin, getAllExams)
    .post(protect, isAdmin, createExam);

router.route('/exams/:id')
    .get(protect, isAdmin, getExam)
    .put(protect, isAdmin, updateExam)
    .delete(protect, isAdmin, deleteExam);

router.patch('/exams/:id/toggle-status', protect, isAdmin, toggleExamStatus);

// Question routes
router.route('/exams/:examId/questions')
    .get(protect, isAdmin, getQuestions)
    .post(protect, isAdmin, createQuestion);

router.post('/exams/:examId/questions/bulk', protect, isAdmin, createBulkQuestions);

router.route('/questions/:id')
    .get(protect, isAdmin, getQuestion)
    .put(protect, isAdmin, updateQuestion)
    .delete(protect, isAdmin, deleteQuestion);

// @desc    Get all exam results with student and exam details
// @route   GET /api/admin/reports/exam-results
// @access  Private (Admin only)
router.get('/reports/exam-results', protect, isAdmin, async (req, res) => {
    try {
        const results = await ExamResult.find()
            .populate('student', 'fullName username email')
            .populate({
                path: 'exam',
                populate: {
                    path: 'subject',
                    select: 'name'
                }
            })
            .sort('-submittedAt');

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error fetching exam results:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch exam results'
        });
    }
});

module.exports = router; 