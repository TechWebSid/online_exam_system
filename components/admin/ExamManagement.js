'use client';

import { useState, useEffect } from 'react';
import ExamsTable from './exams/ExamsTable';
import ExamModal from './exams/ExamModal';
import { ConfirmationModal } from './ConfirmationModal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ExamManagement() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch exams
    useEffect(() => {
        const fetchExams = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/exams`, {
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    setExams(data.data);
                } else {
                    setError(data.message || 'Failed to fetch exams');
                }
            } catch (err) {
                console.error('Error fetching exams:', err);
                setError('Failed to fetch exams');
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, [refreshTrigger]);

    // Handle exam creation/update
    const handleSaveExam = async (examData) => {
        try {
            const url = selectedExam 
                ? `${API_BASE_URL}/admin/exams/${selectedExam._id}`
                : `${API_BASE_URL}/admin/exams`;
            
            const response = await fetch(url, {
                method: selectedExam ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(examData)
            });

            const data = await response.json();
            
            if (data.success) {
                setRefreshTrigger(prev => prev + 1);
                setShowModal(false);
                setSelectedExam(null);
            } else {
                setError(data.message || 'Failed to save exam');
            }
        } catch (err) {
            console.error('Error saving exam:', err);
            setError('Failed to save exam');
        }
    };

    // Handle exam deletion
    const handleDeleteExam = async () => {
        if (!selectedExam) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/exams/${selectedExam._id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();
            
            if (data.success) {
                setRefreshTrigger(prev => prev + 1);
                setShowDeleteModal(false);
                setSelectedExam(null);
            } else {
                setError(data.message || 'Failed to delete exam');
            }
        } catch (err) {
            console.error('Error deleting exam:', err);
            setError('Failed to delete exam');
        }
    };

    // Handle exam status toggle
    const handleToggleStatus = async (examId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/exams/${examId}/toggle-status`, {
                method: 'PATCH',
                credentials: 'include'
            });

            const data = await response.json();
            
            if (data.success) {
                setRefreshTrigger(prev => prev + 1);
            } else {
                setError(data.message || 'Failed to toggle exam status');
            }
        } catch (err) {
            console.error('Error toggling exam status:', err);
            setError('Failed to toggle exam status');
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800">Exam Management</h2>
                    <p className="text-gray-600">Create and manage exams</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedExam(null);
                        setShowModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Create New Exam
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <ExamsTable
                    exams={exams}
                    onEdit={(exam) => {
                        setSelectedExam(exam);
                        setShowModal(true);
                    }}
                    onDelete={(exam) => {
                        setSelectedExam(exam);
                        setShowDeleteModal(true);
                    }}
                    onToggleStatus={handleToggleStatus}
                />
            )}

            {showModal && (
                <ExamModal
                    exam={selectedExam}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedExam(null);
                    }}
                    onSave={handleSaveExam}
                />
            )}

            {showDeleteModal && (
                <ConfirmationModal
                    title="Delete Exam"
                    message={`Are you sure you want to delete the exam "${selectedExam?.title}"? This action cannot be undone.`}
                    onConfirm={handleDeleteExam}
                    onCancel={() => {
                        setShowDeleteModal(false);
                        setSelectedExam(null);
                    }}
                />
            )}
        </div>
    );
} 