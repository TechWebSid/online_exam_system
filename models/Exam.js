import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide an exam title'],
        trim: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Please provide a subject']
    },
    duration: {
        type: Number,
        required: [true, 'Please provide exam duration in minutes'],
        min: [1, 'Duration must be at least 1 minute']
    },
    passingMarks: {
        type: Number,
        required: [true, 'Please provide passing marks'],
        min: [0, 'Passing marks cannot be negative']
    },
    totalMarks: {
        type: Number,
        required: [true, 'Please provide total marks'],
        min: [1, 'Total marks must be at least 1']
    },
    instructions: {
        type: String,
        required: [true, 'Please provide exam instructions']
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide exam start date']
    },
    endDate: {
        type: Date,
        required: [true, 'Please provide exam end date']
    },
    attemptLimit: {
        type: Number,
        required: [true, 'Please provide attempt limit'],
        min: [1, 'Attempt limit must be at least 1']
    },
    isActive: {
        type: Boolean,
        default: false
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure end date is after start date
examSchema.pre('save', function(next) {
    if (this.endDate <= this.startDate) {
        next(new Error('End date must be after start date'));
    }
    next();
});

// Calculate total marks before saving
examSchema.pre('save', async function(next) {
    if (this.isModified('questions')) {
        const Question = mongoose.model('Question');
        const questions = await Question.find({ _id: { $in: this.questions } });
        this.totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    }
    next();
});

const Exam = mongoose.models.Exam || mongoose.model('Exam', examSchema);

export default Exam; 