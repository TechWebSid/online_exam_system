'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ExamCard from '@/components/student/ExamCard';
import ExamAttempt from '@/components/student/ExamAttempt';
import ExamResult from '@/components/student/ExamResult';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function StudentDashboard() {
    const router = useRouter();
    const [availableExams, setAvailableExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [examResult, setExamResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkAuthAndFetchExams = async () => {
            try {
                // First check if user is authenticated and is a student
                const authResponse = await fetch(`${API_BASE_URL}/auth/profile`, {
                    credentials: 'include'
                });
                const authData = await authResponse.json();

                if (!authResponse.ok || authData.user.role !== 'student') {
                    router.replace('/login');
                    return;
                }

                // Then fetch available exams
                const examsResponse = await fetch(`${API_BASE_URL}/student/exams`, {
                    credentials: 'include'
                });
                const examsData = await examsResponse.json();
                
                if (examsData.success) {
                    setAvailableExams(examsData.data);
                    setError(null);
                } else {
                    setError(examsData.message || 'Failed to fetch exams');
                }
            } catch (err) {
                console.error('Error:', err);
                setError('Failed to fetch available exams');
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndFetchExams();
    }, [router]);

    const handleStartExam = (exam) => {
        setSelectedExam(exam);
        setExamResult(null);
    };

    const handleSubmitExam = async (answers) => {
        try {
            const response = await fetch(`${API_BASE_URL}/student/exams/${selectedExam._id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ answers })
            });

            const data = await response.json();
            
            if (data.success) {
                setExamResult(data.data);
                setSelectedExam(null);
                setError(null);
            } else {
                setError(data.message || 'Failed to submit exam');
            }
        } catch (err) {
            console.error('Error submitting exam:', err);
            setError('Failed to submit exam');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Student Dashboard
                    </h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {selectedExam ? (
                    <ExamAttempt
                        exam={selectedExam}
                        onSubmit={handleSubmitExam}
                        onCancel={() => setSelectedExam(null)}
                    />
                ) : examResult ? (
                    <ExamResult
                        result={examResult}
                        onClose={() => setExamResult(null)}
                    />
                ) : (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Exams</h2>
                        {availableExams.length === 0 ? (
                            <p className="text-gray-600">No exams available at the moment.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {availableExams.map((exam) => (
                                    <ExamCard
                                        key={exam._id}
                                        exam={exam}
                                        onStart={() => handleStartExam(exam)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
} 