const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Question text is required'],
        trim: true
    },
    options: [{
        text: {
            type: String,
            required: [true, 'Option text is required'],
            trim: true
        },
        isCorrect: {
            type: Boolean,
            default: false
        }
    }],
    marks: {
        type: Number,
        required: [true, 'Marks are required'],
        min: [1, 'Marks must be at least 1']
    },
    explanation: {
        type: String,
        trim: true,
        default: ''
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject is required']
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

// Validate that exactly one option is marked as correct
questionSchema.pre('save', function(next) {
    const correctOptions = this.options.filter(option => option.isCorrect);
    if (correctOptions.length !== 1) {
        next(new Error('Exactly one option must be marked as correct'));
    }
    if (this.options.length !== 4) {
        next(new Error('Question must have exactly 4 options'));
    }
    next();
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question; 