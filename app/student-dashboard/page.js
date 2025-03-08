'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ExamCard from '@/components/student/ExamCard';
import ExamAttempt from '@/components/student/ExamAttempt';
import ExamResult from '@/components/student/ExamResult';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const FLASK_SERVER_URL = process.env.NEXT_PUBLIC_FLASK_URL || 'http://localhost:5001';

export default function StudentDashboard() {
    const router = useRouter();
    const [availableExams, setAvailableExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [examResult, setExamResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [faceServerStatus, setFaceServerStatus] = useState('unknown');

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

                setUser(authData.user);

                // Check if face monitoring server is running
                try {
                    const faceServerResponse = await fetch(`${FLASK_SERVER_URL}/health`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                    
                    if (faceServerResponse.ok) {
                        setFaceServerStatus('online');
                    } else {
                        setFaceServerStatus('offline');
                        console.warn('Face monitoring server is offline');
                    }
                } catch (err) {
                    setFaceServerStatus('offline');
                    console.warn('Face monitoring server is not accessible:', err);
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
            // Format answers for the API
            const formattedAnswers = Object.entries(answers).map(([questionId, optionIndex]) => ({
                questionId,
                selectedOption: optionIndex
            }));
            
            const response = await fetch(`${API_BASE_URL}/student/exams/${selectedExam._id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ answers: formattedAnswers })
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
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
                    <Link 
                        href="/student-dashboard/profile"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        My Profile
                    </Link>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}
                
                {faceServerStatus === 'offline' && (
                    <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-md">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>
                                Face monitoring server is offline. Exam proctoring features may be limited. 
                                Please contact your administrator.
                            </span>
                        </div>
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
            </div>
        </div>
    );
} 