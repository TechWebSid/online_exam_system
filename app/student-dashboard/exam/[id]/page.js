'use client';

import React, { Component } from 'react';
import { useRouter } from 'next/navigation';
import FloatingFaceMonitor from '@/components/FloatingFaceMonitor';

// Let's use a class component wrapper to avoid hooks issues
class ExamPageContent extends Component {
    constructor(props) {
        super(props);
        this.id = props.id;
        this.router = props.router;
        
        // State initialization
        this.state = {
            exam: null,
            loading: true,
            error: '',
            currentQuestion: 0,
            answers: {},
            timeLeft: 0,
            isSubmitting: false,
            examCompleted: false,
            warningCount: 0,
            warnings: [],
            showWarning: false,
            warningMessage: '',
            showTabSwitchModal: false,
        };
        
        // Constants
        this.MAX_WARNINGS = 5;
        
        // Bind methods to this
        this.addWarning = this.addWarning.bind(this);
        this.handleFaceWarning = this.handleFaceWarning.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.handlePopState = this.handlePopState.bind(this);
        this.handleExamViolation = this.handleExamViolation.bind(this);
        this.handleCancelExam = this.handleCancelExam.bind(this);
        this.handleCloseTabModal = this.handleCloseTabModal.bind(this);
    }
    
    // Add a warning
    addWarning(type, message) {
        console.log(`Adding warning: ${type} - ${message}`);
        
        // Create warning object
        const newWarning = {
            id: Date.now(),
            type,
            message,
            timestamp: new Date().toLocaleTimeString(),
            number: this.state.warningCount + 1
        };
        
        // Update state
        this.setState(prevState => {
            const newCount = prevState.warningCount + 1;
            
            // Check if max warnings reached
            if (newCount >= this.MAX_WARNINGS) {
                setTimeout(() => this.handleExamViolation(), 0);
            }
            
            return {
                warningCount: newCount,
                warnings: [...prevState.warnings, newWarning],
                showWarning: true,
                warningMessage: `Warning ${newCount}/${this.MAX_WARNINGS}: ${message}`
            };
        });
        
        // Hide warning after 3 seconds
        setTimeout(() => {
            this.setState({ showWarning: false });
        }, 3000);
    }
    
    // Handle face warnings
    handleFaceWarning(warningType, message) {
        this.addWarning('face_monitoring', message);
    }
    
    // Handle tab visibility change
    handleVisibilityChange() {
        if (document.hidden) {
            this.addWarning('tab_switch', 'Tab switching detected! This action is not allowed during the exam.');
            this.setState({ showTabSwitchModal: true });
        }
    }
    
    // Handle key down for copy-paste prevention
    handleKeyDown(e) {
        // Prevent Tab key
        if (e.key === 'Tab') {
            e.preventDefault();
            this.addWarning('tab_key', 'Tab key is disabled during the exam.');
            return;
        }

        // Prevent copy-paste
        if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'C' || e.key === 'V')) {
            e.preventDefault();
            this.addWarning('copy_paste', 'Copy-paste attempt detected! This action is not allowed during the exam.');
        }
    }
    
    // Handle context menu (right-click)
    handleContextMenu(e) {
        e.preventDefault();
    }
    
    // Handle browser navigation
    handlePopState(e) {
        e.preventDefault();
        window.history.pushState(null, null, window.location.pathname);
        this.addWarning('navigation', 'Browser navigation detected! This action is not allowed during the exam.');
    }
    
    // Handle close tab modal
    handleCloseTabModal() {
        this.setState({ showTabSwitchModal: false });
    }
    
    // Cancel exam due to violations
    async handleExamViolation() {
        try {
            const response = await fetch('/api/student/exams/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    examId: this.id,
                    reason: 'Maximum warnings exceeded'
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                this.router.push('/student-dashboard?message=Exam cancelled due to multiple violations');
            } else {
                this.setState({ error: data.message || 'Failed to cancel exam' });
            }
        } catch (error) {
            console.error('Error cancelling exam:', error);
            this.setState({ error: 'An error occurred while cancelling the exam' });
        }
    }
    
    // Handle manual exam cancellation
    async handleCancelExam() {
        try {
            const response = await fetch('/api/student/exams/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    examId: this.id,
                    reason: 'Tab switch attempt - user cancelled'
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                this.router.push('/student-dashboard?message=Exam cancelled due to tab switch attempt');
            } else {
                this.setState({ error: data.message || 'Failed to cancel exam' });
            }
        } catch (error) {
            console.error('Error cancelling exam:', error);
            this.setState({ error: 'An error occurred while cancelling the exam' });
        }
    }
    
    // Component did mount - set up event listeners
    componentDidMount() {
        // Set up event listeners
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('contextmenu', this.handleContextMenu);
        
        // Prevent browser navigation
        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener('popstate', this.handlePopState);
        
        // Fetch exam data here
        this.fetchExam();
    }
    
    // Fetch exam data
    async fetchExam() {
        try {
            const response = await fetch(`/api/student/exams/${this.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.success) {
                this.setState({
                    exam: data.exam,
                    timeLeft: data.exam.duration * 60,
                    loading: false
                });
                
                // Start timer
                this.startTimer();
                } else {
                this.setState({
                    error: data.message || 'Failed to fetch exam',
                    loading: false
                });
                }
            } catch (error) {
                console.error('Error fetching exam:', error);
            this.setState({
                error: 'An error occurred while fetching the exam',
                loading: false
            });
        }
    }
    
    // Start timer
    startTimer() {
        this.timer = setInterval(() => {
            this.setState(prevState => {
                if (prevState.timeLeft <= 1) {
                    clearInterval(this.timer);
                    this.handleSubmit();
                    return { timeLeft: 0 };
                }
                return { timeLeft: prevState.timeLeft - 1 };
            });
        }, 1000);
    }

    // Format time as MM:SS
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Handle answer change
    handleAnswerChange = (questionId, answer) => {
        this.setState(prevState => ({
            answers: {
                ...prevState.answers,
            [questionId]: answer
            }
        }));
    };

    // Navigate to next question
    handleNextQuestion = () => {
        if (this.state.currentQuestion < this.state.exam.questions.length - 1) {
            this.setState(prevState => ({
                currentQuestion: prevState.currentQuestion + 1
            }));
        }
    };
    
    // Navigate to previous question
    handlePrevQuestion = () => {
        if (this.state.currentQuestion > 0) {
            this.setState(prevState => ({
                currentQuestion: prevState.currentQuestion - 1
            }));
        }
    };
    
    // Submit exam
    handleSubmit = async () => {
        if (this.state.isSubmitting) return;
        
        this.setState({ isSubmitting: true });
        
        try {
            const response = await fetch('/api/student/exams/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    examId: this.id,
                    answers: Object.entries(this.state.answers).map(([questionId, answer]) => ({
                        questionId,
                        answer
                    }))
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                this.setState({ examCompleted: true });
                setTimeout(() => {
                    this.router.push('/student-dashboard');
                }, 3000);
            } else {
                this.setState({ error: data.message || 'Failed to submit exam' });
            }
        } catch (error) {
            console.error('Error submitting exam:', error);
            this.setState({ error: 'An error occurred while submitting the exam' });
        } finally {
            this.setState({ isSubmitting: false });
        }
    };
    
    // Component will unmount - clean up event listeners and timer
    componentWillUnmount() {
        // Clean up event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('contextmenu', this.handleContextMenu);
        window.removeEventListener('popstate', this.handlePopState);
        
        // Clear timer
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
    
    // Render component
    render() {
        const {
            loading,
            error,
            exam,
            examCompleted,
            currentQuestion,
            answers,
            timeLeft,
            isSubmitting,
            warningCount,
            warnings,
            showWarning,
            warningMessage,
            showTabSwitchModal
        } = this.state;

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
                            onClick={() => this.router.push('/student-dashboard')}
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
                            onClick={() => this.router.push('/student-dashboard')}
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
            {/* Warning Banner */}
            {showWarning && (
                <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 text-center z-40">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex items-center justify-center">
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{warningMessage}</span>
                        </div>
                    </div>
                </div>
            )}
            
                {/* Tab Switch Warning Modal */}
                {showTabSwitchModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Warning {warningCount}/{this.MAX_WARNINGS}</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Tab switching is not allowed during the exam. You can either:
                                    <br />
                                    1. Stay on this tab and continue your exam
                                    <br />
                                    2. Cancel the exam to switch tabs
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button
                                        onClick={this.handleCloseTabModal}
                                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                                    >
                                        Continue Exam
                                    </button>
                                    <button
                                        onClick={this.handleCancelExam}
                                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-red-900 bg-red-100 border border-transparent rounded-md hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                                    >
                                        Cancel Exam
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Face Monitor */}
                <FloatingFaceMonitor 
                    onWarning={this.handleFaceWarning}
                    movementThreshold={10}
                    maxConsecutiveMovements={3}
                    monitoringInterval={1000}
                />
                
                {/* Main Exam Content */}
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
                                            Time Left: {this.formatTime(timeLeft)}
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
                                                    onChange={() => this.handleAnswerChange(currentQuestionData._id, option)}
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
                                            onClick={this.handlePrevQuestion}
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
                                                onClick={this.handleNextQuestion}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                        >
                                            Next
                                        </button>
                                    ) : (
                                        <button
                                                onClick={this.handleSubmit}
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
                                <h2 className="text-lg font-medium text-gray-900">Exam Progress</h2>
                            </div>
                            <div className="p-4">
                                <div className="mb-4">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">Progress</span>
                                        <span className="text-sm font-medium text-gray-700">
                                            {Math.round((Object.keys(answers).length / exam.questions.length) * 100)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full" 
                                            style={{ width: `${(Object.keys(answers).length / exam.questions.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                <div className="text-sm text-gray-600 mb-4">
                                    <div className="flex justify-between">
                                        <span>Questions Answered:</span>
                                        <span className="font-medium">{Object.keys(answers).length} of {exam.questions.length}</span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span>Time Remaining:</span>
                                            <span className="font-medium">{this.formatTime(timeLeft)}</span>
                                        </div>
                                </div>
                                
                                {warningCount > 0 && (
                                    <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                                        <div className="flex items-center text-amber-600 mb-2">
                                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                                <span className="font-medium">Warnings: {warningCount}/{this.MAX_WARNINGS}</span>
                                            </div>
                                            <div className="text-sm text-amber-700 space-y-1">
                                                {warnings.slice(-3).map((warning) => (
                                                    <p key={warning.id} className="flex items-center">
                                                        <span className="w-16 flex-shrink-0">#{warning.number}</span>
                                                        <span className="w-20 flex-shrink-0">{warning.timestamp}</span>
                                                        <span className="ml-2">{warning.message}</span>
                                                    </p>
                                                ))}
                                            </div>
                                            {warningCount >= this.MAX_WARNINGS - 1 && (
                                                <p className="mt-2 text-red-600 text-sm font-medium">
                                                    Warning: One more violation will result in exam cancellation!
                                                </p>
                                            )}
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
                                                onClick={() => this.setState({ currentQuestion: index })}
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
}

// Wrapper component to inject router
export default function ExamPage({ params }) {
    const router = useRouter();
    return <ExamPageContent id={params.id} router={router} />;
} 