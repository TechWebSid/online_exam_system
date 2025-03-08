const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Flask API URL
const FLASK_API_URL = process.env.FACE_AUTH_API_URL || 'http://localhost:5001';

/**
 * @route   POST /api/face-auth/register
 * @desc    Register a user's face
 * @access  Private
 */
router.post('/register', protect, async (req, res) => {
    try {
        const { image } = req.body;
        
        if (!image) {
            return res.status(400).json({
                success: false,
                message: 'Image is required'
            });
        }
        
        // Get user from database
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        console.log(`Registering face for user: ${user._id}, name: ${user.fullName}`);
        
        // Call Flask API to register face
        const response = await axios.post(`${FLASK_API_URL}/register`, {
            userId: user._id.toString(),
            name: user.fullName,
            image
        });
        
        console.log('Flask API response for face registration:', response.data);
        
        // Update user's face auth status
        await User.findByIdAndUpdate(user._id, {
            'faceAuthStatus.isRegistered': true,
            'faceAuthStatus.lastVerified': null
        });
        
        return res.status(200).json({
            success: true,
            message: 'Face registered successfully'
        });
        
    } catch (error) {
        console.error('Error registering face:', error.message);
        
        // Check if error is from Flask API
        if (error.response && error.response.data) {
            console.error('Flask API error:', error.response.data);
            return res.status(error.response.status || 500).json({
                success: false,
                message: error.response.data.message || 'Error registering face'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Error registering face'
        });
    }
});

/**
 * @route   POST /api/face-auth/verify
 * @desc    Verify a user's face
 * @access  Public
 */
router.post('/verify', async (req, res) => {
    try {
        const { image, userId } = req.body;
        
        if (!image) {
            return res.status(400).json({
                success: false,
                message: 'Image is required'
            });
        }
        
        console.log(`Verifying face for userId: ${userId || 'not provided'}`);
        
        // Call Flask API to verify face
        const response = await axios.post(`${FLASK_API_URL}/verify`, {
            userId,
            image
        });
        
        console.log('Flask API response for face verification:', response.data);
        
        const { success, match, userId: matchedUserId, confidence } = response.data;
        
        console.log(`Verification result: success=${success}, match=${match}, confidence=${confidence}`);
        
        if (success && match) {
            // Get user from database
            const user = await User.findById(matchedUserId);
            
            if (!user) {
                console.log(`User not found for ID: ${matchedUserId}`);
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            console.log(`User found: ${user.fullName}, updating last verified timestamp`);
            
            // Update user's face auth status
            await User.findByIdAndUpdate(user._id, {
                'faceAuthStatus.lastVerified': Date.now()
            });
            
            return res.status(200).json({
                success: true,
                message: 'Face verification successful',
                userId: user._id,
                name: user.fullName,
                email: user.email,
                confidence
            });
        }
        
        return res.status(200).json({
            success: false,
            message: 'Face verification failed',
            confidence: response.data.confidence || 0
        });
        
    } catch (error) {
        console.error('Error verifying face:', error.message);
        
        // Check if error is from Flask API
        if (error.response && error.response.data) {
            console.error('Flask API error:', error.response.data);
            return res.status(error.response.status || 500).json({
                success: false,
                message: error.response.data.message || 'Error verifying face'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Error verifying face'
        });
    }
});

/**
 * @route   POST /api/face-auth/monitor
 * @desc    Monitor a user's face during an exam
 * @access  Private
 */
router.post('/monitor', protect, async (req, res) => {
    try {
        const { image } = req.body;
        
        if (!image) {
            return res.status(400).json({
                success: false,
                message: 'Image is required'
            });
        }
        
        // Call Flask API to monitor face
        const response = await axios.post(`${FLASK_API_URL}/monitor`, {
            userId: req.user.id,
            image
        });
        
        return res.status(200).json(response.data);
        
    } catch (error) {
        console.error('Error monitoring face:', error.message);
        
        // Check if error is from Flask API
        if (error.response && error.response.data) {
            return res.status(error.response.status || 500).json({
                success: false,
                message: error.response.data.message || 'Error monitoring face',
                warning: error.response.data.warning || 'unknown_error'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Error monitoring face',
            warning: 'server_error'
        });
    }
});

/**
 * @route   GET /api/face-auth/status
 * @desc    Get user's face auth status
 * @access  Private
 */
router.get('/status', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            isRegistered: user.faceAuthStatus.isRegistered,
            lastVerified: user.faceAuthStatus.lastVerified
        });
        
    } catch (error) {
        console.error('Error getting face auth status:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error getting face auth status'
        });
    }
});

module.exports = router; 