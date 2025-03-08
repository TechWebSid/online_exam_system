const User = require('../models/User');

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
const getAllStudents = async (req, res) => {
    try {
        const { search } = req.query;
        let query = { role: 'student' };

        // Add search functionality
        if (search) {
            query = {
                ...query,
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const students = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching students',
            error: error.message
        });
    }
};

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
    try {
        const student = await User.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Ensure the user is a student
        if (student.role !== 'student') {
            return res.status(400).json({
                success: false,
                message: 'Can only delete student accounts'
            });
        }

        await student.deleteOne();

        res.json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting student',
            error: error.message
        });
    }
};

// @desc    Promote student to admin
// @route   PATCH /api/admin/students/:id/promote
// @access  Private/Admin
const promoteToAdmin = async (req, res) => {
    try {
        const student = await User.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check if already an admin
        if (student.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'User is already an admin'
            });
        }

        student.role = 'admin';
        await student.save();

        res.json({
            success: true,
            message: 'Student promoted to admin successfully',
            data: {
                id: student._id,
                fullName: student.fullName,
                email: student.email,
                role: student.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error promoting student',
            error: error.message
        });
    }
};

module.exports = {
    getAllStudents,
    deleteStudent,
    promoteToAdmin
}; 