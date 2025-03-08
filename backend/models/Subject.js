const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true,
        unique: true,
        minlength: [2, 'Subject name must be at least 2 characters long']
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject; 