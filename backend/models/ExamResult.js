const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        selectedOption: {
            type: Number,
            required: true
        },
        isCorrect: {
            type: Boolean,
            required: true
        }
    }],
    obtainedMarks: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    attemptedQuestions: {
        type: Number,
        required: true
    },
    correctAnswers: {
        type: Number,
        required: true
    },
    incorrectAnswers: {
        type: Number,
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

// Add index for faster queries
examResultSchema.index({ student: 1, exam: 1 });
examResultSchema.index({ submittedAt: -1 });

const ExamResult = mongoose.model('ExamResult', examResultSchema);

module.exports = ExamResult; 