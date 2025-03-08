const Subject = require('../models/Subject');

// @desc    Get all subjects
// @route   GET /api/admin/subjects
// @access  Private/Admin
const getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find()
            .sort({ name: 1 });

        res.json({
            success: true,
            count: subjects.length,
            data: subjects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching subjects',
            error: error.message
        });
    }
};

// @desc    Get single subject
// @route   GET /api/admin/subjects/:id
// @access  Private/Admin
const getSubject = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        res.json({
            success: true,
            data: subject
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching subject',
            error: error.message
        });
    }
};

// @desc    Create new subject
// @route   POST /api/admin/subjects
// @access  Private/Admin
const createSubject = async (req, res) => {
    try {
        const { name, description } = req.body;

        const subject = await Subject.create({
            name,
            description
        });

        res.status(201).json({
            success: true,
            data: subject
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Subject already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating subject',
            error: error.message
        });
    }
};

// @desc    Update subject
// @route   PUT /api/admin/subjects/:id
// @access  Private/Admin
const updateSubject = async (req, res) => {
    try {
        const { name, description } = req.body;

        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        subject.name = name || subject.name;
        subject.description = description || subject.description;

        await subject.save();

        res.json({
            success: true,
            data: subject
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Subject name already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating subject',
            error: error.message
        });
    }
};

// @desc    Delete subject
// @route   DELETE /api/admin/subjects/:id
// @access  Private/Admin
const deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        await subject.deleteOne();

        res.json({
            success: true,
            message: 'Subject deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting subject',
            error: error.message
        });
    }
};

module.exports = {
    getAllSubjects,
    getSubject,
    createSubject,
    updateSubject,
    deleteSubject
}; 