'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExamAttempt({ exam, onSubmit, onCancel }) {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState(exam.duration * 60); // Convert minutes to seconds
    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Timer effect
    useEffect(() => {
        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // Format time left
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Handle answer selection
    const handleAnswerSelect = (questionId, optionIndex) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    // Navigate questions
    const handlePrevQuestion = () => {
        setCurrentQuestion(prev => Math.max(0, prev - 1));
    };

    const handleNextQuestion = () => {
        setCurrentQuestion(prev => Math.min(exam.questions.length - 1, prev + 1));
    };

    // Submit exam
    const handleSubmit = async () => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        const formattedAnswers = Object.entries(answers).map(([questionId, optionIndex]) => ({
            questionId,
            selectedOption: optionIndex
        }));

        await onSubmit(formattedAnswers);
        setIsSubmitting(false);
    };

    // Prevent tab switching
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Log warning or take action when user switches tabs
                console.warn('Tab switching detected');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Prevent right-click
    useEffect(() => {
        const handleContextMenu = (e) => {
            e.preventDefault();
        };

        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    const currentQ = exam.questions[currentQuestion];

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">{exam.title}</h2>
                    <p className="text-gray-600">{exam.subject.name}</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                        {formatTime(timeLeft)}
                    </div>
                    <p className="text-sm text-gray-600">Time Remaining</p>
                </div>
            </div>

            {/* Question */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                        Question {currentQuestion + 1} of {exam.questions.length}
                    </h3>
                    <span className="text-sm text-gray-600">
                        Marks: {currentQ.marks}
                    </span>
                </div>
                <p className="text-gray-800 mb-4">{currentQ.text}</p>
                <div className="space-y-3">
                    {currentQ.options.map((option, index) => (
                        <label
                            key={index}
                            className={`flex items-center p-4 rounded-lg border ${
                                answers[currentQ._id] === index
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            } cursor-pointer transition-colors`}
                        >
                            <input
                                type="radio"
                                name={`question-${currentQ._id}`}
                                checked={answers[currentQ._id] === index}
                                onChange={() => handleAnswerSelect(currentQ._id, index)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-3">{option.text}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
                <div className="space-x-4">
                    <button
                        onClick={handlePrevQuestion}
                        disabled={currentQuestion === 0}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={handleNextQuestion}
                        disabled={currentQuestion === exam.questions.length - 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
                <div className="space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                    </button>
                </div>
            </div>

            {/* Question Navigator */}
            <div className="mt-8 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Question Navigator</h4>
                <div className="flex flex-wrap gap-2">
                    {exam.questions.map((q, index) => (
                        <button
                            key={q._id}
                            onClick={() => setCurrentQuestion(index)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium
                                ${currentQuestion === index
                                    ? 'bg-blue-600 text-white'
                                    : answers[q._id] !== undefined
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                                }
                                hover:opacity-80 transition-opacity`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
} 