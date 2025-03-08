const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const { protect, isStudent } = require('../middleware/authMiddleware');

// @desc    Get available exams for students
// @route   GET /api/student/exams
// @access  Private (Student only)
router.get('/exams', protect, isStudent, async (req, res) => {
    try {
        const currentDate = new Date();
        
        // Get only active exams that are currently available
        const exams = await Exam.find({
            isActive: true,
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate }
        })
        .populate('subject')
        .populate('questions')
        .sort({ startDate: 1 });

        res.json({
            success: true,
            data: exams
        });
    } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch exams'
        });
    }
});

// @desc    Submit exam answers
// @route   POST /api/student/exams/:examId/submit
// @access  Private (Student only)
router.post('/exams/:examId/submit', protect, isStudent, async (req, res) => {
    try {
        const { examId } = req.params;
        const { answers } = req.body;

        const exam = await Exam.findById(examId)
            .populate('subject')
            .populate('questions');

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        // Calculate results
        let obtainedMarks = 0;
        let correctAnswers = 0;
        let incorrectAnswers = 0;

        const processedAnswers = exam.questions.map(question => {
            const answer = answers.find(a => a.questionId === question._id.toString());
            const isCorrect = answer && question.options[answer.selectedOption].isCorrect;
            
            if (isCorrect) {
                obtainedMarks += question.marks;
                correctAnswers++;
            } else if (answer) {
                incorrectAnswers++;
            }

            return answer ? {
                questionId: question._id,
                selectedOption: answer.selectedOption,
                isCorrect
            } : null;
        }).filter(Boolean);

        // Save exam result
        const examResult = await ExamResult.create({
            student: req.user._id,
            exam: examId,
            answers: processedAnswers,
            obtainedMarks,
            totalQuestions: exam.questions.length,
            attemptedQuestions: answers.length,
            correctAnswers,
            incorrectAnswers
        });

        // Populate the result with exam and student details
        await examResult.populate('exam');
        await examResult.populate('student', 'fullName username email');

        const result = {
            exam,
            obtainedMarks,
            totalQuestions: exam.questions.length,
            attemptedQuestions: answers.length,
            correctAnswers,
            incorrectAnswers,
            questions: exam.questions.map(question => {
                const answer = answers.find(a => a.questionId === question._id.toString());
                const isCorrect = answer && question.options[answer.selectedOption].isCorrect;
                
                return {
                    ...question.toObject(),
                    selectedOption: answer ? answer.selectedOption : null,
                    isCorrect
                };
            })
        };

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error submitting exam:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit exam'
        });
    }
});

module.exports = router; 