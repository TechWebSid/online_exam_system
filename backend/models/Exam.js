const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject is required']
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [10, 'Duration must be at least 10 minutes'],
        max: [180, 'Duration cannot exceed 180 minutes']
    },
    passingMarks: {
        type: Number,
        required: [true, 'Passing marks is required'],
        min: [0, 'Passing marks cannot be negative']
    },
    totalMarks: {
        type: Number,
        required: [true, 'Total marks is required'],
        min: [1, 'Total marks must be at least 1']
    },
    attemptLimit: {
        type: Number,
        required: [true, 'Attempt limit is required'],
        min: [1, 'Attempt limit must be at least 1'],
        default: 1
    },
    instructions: {
        type: String,
        required: [true, 'Instructions are required'],
        trim: true
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required']
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to populate questions when finding exams
examSchema.pre(/^find/, function(next) {
    this.populate('questions').populate('subject', 'name');
    next();
});

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam; 