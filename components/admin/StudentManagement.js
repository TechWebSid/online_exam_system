'use client';

import { useState, useEffect } from 'react';
import { getAllStudents, deleteStudent, promoteToAdmin } from '@/utils/api';
import { ConfirmationModal } from './ConfirmationModal';

export function StudentManagement() {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: null, // 'delete' or 'promote'
    });

    // Fetch students
    const fetchStudents = async () => {
        try {
            setIsLoading(true);
            const response = await getAllStudents(searchQuery);
            if (response.success) {
                setStudents(response.data);
                setError('');
            } else {
                setError(response.message || 'Failed to fetch students');
            }
        } catch (error) {
            setError(error.message || 'Failed to fetch students');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [searchQuery]);

    // Handle delete student
    const handleDeleteClick = (student) => {
        setSelectedStudent(student);
        setModalConfig({
            isOpen: true,
            type: 'delete',
        });
    };

    // Handle promote student
    const handlePromoteClick = (student) => {
        setSelectedStudent(student);
        setModalConfig({
            isOpen: true,
            type: 'promote',
        });
    };

    // Handle modal confirmation
    const handleModalConfirm = async () => {
        if (!selectedStudent) return;
        
        try {
            if (modalConfig.type === 'delete') {
                await deleteStudent(selectedStudent._id);
            } else if (modalConfig.type === 'promote') {
                await promoteToAdmin(selectedStudent._id);
            }
            await fetchStudents();
            handleModalClose();
        } catch (error) {
            setError(error.message || 'Operation failed');
        }
    };

    // Handle modal close
    const handleModalClose = () => {
        setModalConfig({ isOpen: false, type: null });
        setSelectedStudent(null);
    };

    // Get modal configuration based on type
    const getModalConfig = () => {
        if (!selectedStudent) return null;

        if (modalConfig.type === 'delete') {
            return {
                title: 'Delete Student',
                message: `Are you sure you want to delete ${selectedStudent.fullName}? This action cannot be undone.`,
                confirmText: 'Delete',
                confirmButtonClass: 'bg-red-600 hover:bg-red-700',
            };
        }
        return {
            title: 'Promote to Admin',
            message: `Are you sure you want to promote ${selectedStudent.fullName} to admin? This will give them full administrative access.`,
            confirmText: 'Promote',
            confirmButtonClass: 'bg-blue-600 hover:bg-blue-700',
        };
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Manage student accounts and permissions
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by name, email, or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Students Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Username
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Joined
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : students.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                    No students found
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => (
                                <tr key={student._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {student.fullName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {student.username}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {student.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {new Date(student.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handlePromoteClick(student)}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            Promote
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(student)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Confirmation Modal */}
            {modalConfig.isOpen && selectedStudent && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={handleModalClose}
                    onConfirm={handleModalConfirm}
                    {...getModalConfig()}
                />
            )}
        </div>
    );
} 