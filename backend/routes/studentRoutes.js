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

// @desc    Get exam history for the current student
// @route   GET /api/student/exams/history
// @access  Private (Student only)
router.get('/exams/history', protect, isStudent, async (req, res) => {
    try {
        // Get all exam results for the current student
        const examResults = await ExamResult.find({ student: req.user._id })
            .populate({
                path: 'exam',
                select: 'title subject duration totalMarks',
                populate: {
                    path: 'subject',
                    select: 'name'
                }
            })
            .sort({ submittedAt: -1 });
        
        // Format the results for the frontend
        const formattedResults = examResults.map(result => {
            // Skip results with missing exam data
            if (!result.exam) {
                console.warn(`Exam result ${result._id} has missing exam data`);
                return null;
            }
            
            return {
                id: result._id.toString(),
                examId: result.exam._id.toString(),
                examTitle: result.exam.title,
                subject: result.exam.subject?.name || 'Unknown Subject',
                submittedAt: result.submittedAt,
                score: {
                    obtained: result.obtainedMarks,
                    total: result.exam.totalMarks || 100,
                    percentage: ((result.obtainedMarks / (result.exam.totalMarks || 100)) * 100).toFixed(2)
                },
                questions: {
                    total: result.totalQuestions,
                    attempted: result.attemptedQuestions,
                    correct: result.correctAnswers,
                    incorrect: result.incorrectAnswers
                }
            };
        }).filter(Boolean); // Remove null entries
        
        res.json({
            success: true,
            data: formattedResults
        });
    } catch (error) {
        console.error('Error fetching exam history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch exam history'
        });
    }
});

// @desc    Get specific exam result for certificate
// @route   GET /api/student/exams/result/:resultId
// @access  Private (Student only)
router.get('/exams/result/:resultId', protect, isStudent, async (req, res) => {
    try {
        const { resultId } = req.params;
        
        // Find the exam result
        const examResult = await ExamResult.findById(resultId)
            .populate({
                path: 'exam',
                select: 'title subject duration totalMarks',
                populate: {
                    path: 'subject',
                    select: 'name'
                }
            })
            .populate('student', 'fullName username email');
        
        // Check if the exam result exists
        if (!examResult) {
            return res.status(404).json({
                success: false,
                message: 'Exam result not found'
            });
        }
        
        // Check if the exam data exists
        if (!examResult.exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam data not found for this result'
            });
        }
        
        // Check if the exam result belongs to the current user
        if (examResult.student._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this exam result'
            });
        }
        
        // Format the result for the frontend
        const formattedResult = {
            id: examResult._id.toString(),
            examId: examResult.exam._id.toString(),
            examTitle: examResult.exam.title,
            subject: examResult.exam.subject?.name || 'Unknown Subject',
            studentName: examResult.student.fullName,
            studentEmail: examResult.student.email,
            submittedAt: examResult.submittedAt,
            score: {
                obtained: examResult.obtainedMarks,
                total: examResult.exam.totalMarks || 100,
                percentage: ((examResult.obtainedMarks / (examResult.exam.totalMarks || 100)) * 100).toFixed(2)
            },
            questions: {
                total: examResult.totalQuestions,
                attempted: examResult.attemptedQuestions,
                correct: examResult.correctAnswers,
                incorrect: examResult.incorrectAnswers
            }
        };
        
        res.json({
            success: true,
            data: formattedResult
        });
    } catch (error) {
        console.error('Error fetching exam result:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch exam result'
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