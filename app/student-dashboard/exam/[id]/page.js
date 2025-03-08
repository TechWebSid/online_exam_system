'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FaceMonitor from '@/components/FaceMonitor';

export default function ExamPage({ params }) {
    const router = useRouter();
    const { id } = params;
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [examCompleted, setExamCompleted] = useState(false);
    const [warningCount, setWarningCount] = useState(0);
    const [warnings, setWarnings] = useState([]);

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const response = await fetch(`/api/student/exams/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.success) {
                    setExam(data.exam);
                    setTimeLeft(data.exam.duration * 60); // Convert minutes to seconds
                } else {
                    setError(data.message || 'Failed to fetch exam');
                }
            } catch (error) {
                console.error('Error fetching exam:', error);
                setError('An error occurred while fetching the exam');
            } finally {
                setLoading(false);
            }
        };

        fetchExam();
    }, [id]);

    // Timer countdown
    useEffect(() => {
        if (!exam || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [exam, timeLeft]);

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleNextQuestion = () => {
        if (currentQuestion < exam.questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        
        try {
            const response = await fetch('/api/student/exams/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    examId: id,
                    answers: Object.entries(answers).map(([questionId, answer]) => ({
                        questionId,
                        answer
                    }))
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                setExamCompleted(true);
                setTimeout(() => {
                    router.push('/student-dashboard');
                }, 3000);
            } else {
                setError(data.message || 'Failed to submit exam');
            }
        } catch (error) {
            console.error('Error submitting exam:', error);
            setError('An error occurred while submitting the exam');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFaceWarning = (warningType, message) => {
        setWarningCount(prev => prev + 1);
        
        // Add warning to list
        setWarnings(prev => [
            ...prev,
            {
                id: Date.now(),
                type: warningType,
                message,
                timestamp: new Date().toLocaleTimeString()
            }
        ]);
        
        // Log warning
        console.warn(`Face monitoring warning: ${warningType} - ${message}`);
    };

    const handleFaceError = (errorType, message) => {
        console.error(`Face monitoring error: ${errorType} - ${message}`);
        setError(`Face monitoring error: ${message}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
                    <div className="text-red-600 mb-4">
                        <p>{error}</p>
                    </div>
                    <button
                        onClick={() => router.push('/student-dashboard')}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (examCompleted) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="text-green-600 mb-4">
                        <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <h2 className="text-2xl font-bold mt-4">Exam Submitted Successfully!</h2>
                        <p className="mt-2">Redirecting to dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
                    <div className="text-red-600 mb-4">
                        <p>Exam not found</p>
                    </div>
                    <button
                        onClick={() => router.push('/student-dashboard')}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestionData = exam.questions[currentQuestion];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Exam Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                            {/* Exam Header */}
                            <div className="p-6 bg-white border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <h1 className="text-2xl font-semibold text-gray-900">{exam.title}</h1>
                                    <div className="text-lg font-medium text-red-600">
                                        Time Left: {formatTime(timeLeft)}
                                    </div>
                                </div>
                                <p className="mt-2 text-gray-600">{exam.description}</p>
                            </div>

                            {/* Question */}
                            <div className="p-6">
                                <div className="mb-6">
                                    <h2 className="text-xl font-medium text-gray-900">
                                        Question {currentQuestion + 1} of {exam.questions.length}
                                    </h2>
                                    <p className="mt-4 text-gray-800">{currentQuestionData.text}</p>
                                </div>

                                {/* Options */}
                                <div className="space-y-4 mt-6">
                                    {currentQuestionData.options.map((option, index) => (
                                        <div key={index} className="flex items-center">
                                            <input
                                                id={`option-${index}`}
                                                name={`question-${currentQuestionData._id}`}
                                                type="radio"
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                checked={answers[currentQuestionData._id] === option}
                                                onChange={() => handleAnswerChange(currentQuestionData._id, option)}
                                            />
                                            <label htmlFor={`option-${index}`} className="ml-3 block text-gray-700">
                                                {option}
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between mt-8">
                                    <button
                                        onClick={handlePrevQuestion}
                                        disabled={currentQuestion === 0}
                                        className={`px-4 py-2 rounded-md ${
                                            currentQuestion === 0
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        Previous
                                    </button>
                                    
                                    {currentQuestion < exam.questions.length - 1 ? (
                                        <button
                                            onClick={handleNextQuestion}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                        >
                                            Next
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className={`px-4 py-2 rounded-md ${
                                                isSubmitting
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-green-500 hover:bg-green-600'
                                            } text-white`}
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg mb-6">
                            <div className="p-4 bg-white border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-900">Face Monitoring</h2>
                            </div>
                            <div className="p-4">
                                <FaceMonitor 
                                    onWarning={handleFaceWarning}
                                    onError={handleFaceError}
                                    monitoringInterval={5000}
                                />
                                
                                {warningCount > 0 && (
                                    <div className="mt-4">
                                        <div className="flex items-center text-amber-600 mb-2">
                                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <span className="font-medium">Warnings: {warningCount}</span>
                                        </div>
                                        
                                        <div className="max-h-40 overflow-y-auto text-sm">
                                            {warnings.slice().reverse().map(warning => (
                                                <div key={warning.id} className="mb-2 p-2 bg-amber-50 rounded">
                                                    <div className="font-medium">{warning.type}</div>
                                                    <div>{warning.message}</div>
                                                    <div className="text-xs text-gray-500">{warning.timestamp}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                            <div className="p-4 bg-white border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-900">Question Navigator</h2>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-5 gap-2">
                                    {exam.questions.map((question, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentQuestion(index)}
                                            className={`h-10 w-10 rounded-md flex items-center justify-center ${
                                                currentQuestion === index
                                                    ? 'bg-blue-500 text-white'
                                                    : answers[question._id]
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="mt-4 text-sm text-gray-600">
                                    <div className="flex items-center mb-1">
                                        <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
                                        <span>Not Answered</span>
                                    </div>
                                    <div className="flex items-center mb-1">
                                        <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
                                        <span>Answered</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                                        <span>Current Question</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 