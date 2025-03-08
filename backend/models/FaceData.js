const mongoose = require('mongoose');

const faceDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    faceEncoding: {
        type: [Number],
        required: true,
        description: 'Array of face encoding values from face recognition library'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    lastVerifiedAt: {
        type: Date,
        default: null
    },
    verificationCount: {
        type: Number,
        default: 0
    }
});

// Index for faster queries
faceDataSchema.index({ userId: 1 });

const FaceData = mongoose.model('FaceData', faceDataSchema);

module.exports = FaceData; 