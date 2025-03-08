'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';

export default function ExamAttempt({ exam, onSubmit, onCancel }) {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState(exam.duration * 60); // Convert minutes to seconds
    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Face monitoring states
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [minimized, setMinimized] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [status, setStatus] = useState('Loading...');
    const [warningCount, setWarningCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [debugInfo, setDebugInfo] = useState(null);
    const [showDebug, setShowDebug] = useState(false);
    
    // Face monitoring refs
    const webcamRef = useRef(null);
    const intervalRef = useRef(null);
    const containerRef = useRef(null);
    
    // Monitoring settings
    const monitoringInterval = 1500; // Check every 1.5 seconds for better responsiveness
    const warningCooldownMs = 8000; // 8 seconds cooldown between warnings
    const [lastWarningTime, setLastWarningTime] = useState(0);
    const [isWarmupPeriod, setIsWarmupPeriod] = useState(true);
    const warmupDurationMs = 3000; // 3 seconds warmup period

    // Flask server URL
    const FLASK_SERVER_URL = process.env.NEXT_PUBLIC_FLASK_URL || 'http://localhost:5001';

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

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle answer selection
    const handleAnswerSelect = (questionId, optionIndex) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    // Navigation between questions
    const handlePrevQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
        }
    };
    
    const handleNextQuestion = () => {
        if (currentQuestion < exam.questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    };

    // Submit exam
    const handleSubmit = async () => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        
        try {
            await onSubmit(answers);
        } catch (error) {
            console.error('Error submitting exam:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Prevent copy-paste
    useEffect(() => {
        const handleCopy = (e) => {
            e.preventDefault();
            handleWarning('Copying is not allowed during the exam');
        };
        
        const handlePaste = (e) => {
            e.preventDefault();
            handleWarning('Pasting is not allowed during the exam');
        };
        
        const handleKeyDown = (e) => {
            // Prevent Ctrl+C, Ctrl+V, Ctrl+X
            if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
                e.preventDefault();
                handleWarning(`${e.key === 'c' ? 'Copying' : e.key === 'v' ? 'Pasting' : 'Cutting'} is not allowed during the exam`);
            }
        };
        
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('cut', handleCopy);
        document.addEventListener('keydown', handleKeyDown);
        
        return () => {
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('cut', handleCopy);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Initialize webcam and monitoring
    useEffect(() => {
        // Generate a unique session ID for this exam attempt
        const generateSessionId = () => {
            return `exam_${exam.id}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        };
        
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        
        // Start camera
        const startCamera = async () => {
            try {
                setStatus('Starting camera...');
                
                // Wait for webcam to initialize
                setTimeout(() => {
                    if (webcamRef.current && webcamRef.current.video) {
                        setStatus('Camera ready');
                        setIsMonitoring(true);
                        setIsWarmupPeriod(true);
                        setLastWarningTime(Date.now());
                    } else {
                        setCameraError('Failed to initialize camera. Please refresh and try again.');
                    }
                }, 2000);
            } catch (error) {
                console.error('Error starting camera:', error);
                setCameraError('Failed to access camera. Please ensure camera permissions are granted.');
            }
        };
        
        startCamera();
        
        return () => {
            // Clean up
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Capture and send frames to server for monitoring
    const captureAndSendFrame = useCallback(async () => {
        if (!webcamRef.current || !isMonitoring) {
            return;
        }
        
        // Handle warmup period
        if (isWarmupPeriod) {
            const timeElapsed = Date.now() - lastWarningTime;
            if (timeElapsed >= warmupDurationMs) {
                setIsWarmupPeriod(false);
                console.log('Warmup period complete');
            }
            return;
        }
        
        try {
            // Capture frame from webcam
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) return;
            
            // Send to server for movement detection
            const response = await fetch(`${FLASK_SERVER_URL}/detect-movement`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageSrc,
                    sessionId: sessionId
                }),
            });
            
            const data = await response.json();
            
            if (!data.success) {
                // Handle error cases
                if (data.warning === 'face_missing') {
                    handleWarning('Face not detected. Please ensure your face is visible.');
                } else if (data.warning === 'processing_error') {
                    console.error('Server error:', data.message);
                }
                return;
            }
            
            // Store debug info
            setDebugInfo(data);
            
            // Log movement data for debugging (only occasionally to avoid flooding console)
            if (Math.random() < 0.1) { // Only log 10% of the time
                console.log('Movement data:', {
                    movement: data.movement,
                    rawMovement: data.rawMovement,
                    avgMovement: data.avgMovement,
                    detected: data.movementDetected,
                    consecutive: data.consecutiveMovements,
                    threshold: data.threshold
                });
            }
            
            // Check for movement warning
            if (data.warning === 'excessive_movement') {
                handleWarning('Excessive head movement detected. Please keep your head still.');
            }
            
            // Check for multiple faces (separate API call, but only occasionally)
            // This reduces server load and network traffic
            if (Math.random() < 0.2) { // Only check 20% of the time
                checkForMultipleFaces(imageSrc);
            }
            
        } catch (error) {
            console.error('Error monitoring face:', error);
        }
    }, [isMonitoring, sessionId, isWarmupPeriod, lastWarningTime]);
    
    // Check for multiple faces
    const checkForMultipleFaces = async (imageSrc) => {
        try {
            const response = await fetch(`${FLASK_SERVER_URL}/check-multiple-faces`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageSrc
                }),
            });
            
            const data = await response.json();
            
            if (data.success && data.multipleFaces) {
                handleWarning('Multiple faces detected. Only the exam taker should be visible.');
            }
        } catch (error) {
            console.error('Error checking for multiple faces:', error);
        }
    };

    // Start monitoring with warmup period
    useEffect(() => {
        if (isMonitoring) {
            console.log('Starting monitoring with warmup period');
            intervalRef.current = setInterval(() => {
                captureAndSendFrame();
            }, monitoringInterval);
        }
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                console.log('Stopped monitoring');
            }
        };
    }, [isMonitoring, captureAndSendFrame]);

    // Centralized warning handler with cooldown
    const handleWarning = useCallback((message) => {
        const now = Date.now();
        const timeElapsed = now - lastWarningTime;
        
        // Only show warning if cooldown period has passed
        if (timeElapsed >= warningCooldownMs) {
            setWarningMessage(message);
            setShowWarning(true);
            setWarningCount(prev => prev + 1);
            setLastWarningTime(now);
            
            // Log warning for debugging
            console.log(`Warning triggered: ${message} (warnings so far: ${warningCount + 1})`);
            
            setTimeout(() => {
                setShowWarning(false);
            }, 3000);
        }
    }, [lastWarningTime, warningCount, warningCooldownMs]);

    // Add tab switching detection
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // User switched tabs or minimized window
                handleWarning('Tab switching detected. Please stay on the exam page.');
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Prevent right-click
    useEffect(() => {
        const handleContextMenu = (e) => {
            e.preventDefault();
            handleWarning('Right-clicking is not allowed during the exam');
        };
        
        document.addEventListener('contextmenu', handleContextMenu);
        
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);

    // Webcam container dragging functionality
    const handleMouseDown = (e) => {
        if (minimized) return;
        
        // Only allow dragging from the header
        if (e.target.closest('.webcam-header')) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
            
            // Prevent text selection during drag
            e.preventDefault();
        }
    };
    
    const handleMouseMove = (e) => {
        if (isDragging) {
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;
            
            // Keep within window bounds
            const containerWidth = containerRef.current?.offsetWidth || 200;
            const containerHeight = containerRef.current?.offsetHeight || 200;
            
            const maxX = window.innerWidth - containerWidth;
            const maxY = window.innerHeight - containerHeight;
            
            setPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            });
        }
    };
    
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    
    // Add mouse event listeners for dragging
    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    // Get status color based on monitoring state
    const getStatusColor = () => {
        if (cameraError) return 'bg-red-500';
        if (isMonitoring) return 'bg-green-500';
        return 'bg-yellow-500';
    };

    // Toggle debug display
    const toggleDebug = useCallback(() => {
        setShowDebug(prev => !prev);
    }, []);

    return (
        <div className="relative min-h-screen bg-gray-50 pb-10">
            {/* Webcam container */}
            <div
                ref={containerRef}
                className={`fixed z-50 bg-white rounded-lg shadow-lg transition-all duration-300 ${
                    minimized ? 'w-12 h-12 overflow-hidden' : 'w-64'
                }`}
                style={{
                    top: `${position.y}px`,
                    left: `${position.x}px`
                }}
                onMouseDown={handleMouseDown}
            >
                <div className="webcam-header flex justify-between items-center p-2 bg-gray-100 rounded-t-lg cursor-move">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                    <span className="text-xs font-medium text-gray-700">{status}</span>
                    <button
                        onClick={() => setMinimized(!minimized)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        {minimized ? '↗' : '↘'}
                    </button>
                </div>
                
                {!minimized && (
                    <>
                        <div className="relative">
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    width: 256,
                                    height: 144,
                                    facingMode: 'user'
                                }}
                                className="w-full h-auto"
                            />
                            {cameraError && (
                                <div className="absolute inset-0 bg-red-100 bg-opacity-80 flex items-center justify-center p-2">
                                    <p className="text-red-700 text-xs text-center">{cameraError}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-2 text-xs text-gray-700">
                            <p>Warnings: {warningCount}</p>
                            <p>Time left: {formatTime(timeLeft)}</p>
                            <button 
                                onClick={toggleDebug} 
                                className="mt-1 text-blue-500 hover:text-blue-700 text-xs"
                            >
                                {showDebug ? 'Hide Debug' : 'Show Debug'}
                            </button>
                            
                            {showDebug && debugInfo && (
                                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                                    <p>Movement: {(debugInfo.movement * 100).toFixed(2)}%</p>
                                    <p>Raw: {(debugInfo.rawMovement * 100).toFixed(2)}%</p>
                                    <p>Avg: {(debugInfo.avgMovement * 100).toFixed(2)}%</p>
                                    <p>Similarity: {(debugInfo.debug?.similarity * 100).toFixed(2)}%</p>
                                    <p>Threshold: {(debugInfo.threshold * 100).toFixed(2)}%</p>
                                    <p>Consecutive: {debugInfo.consecutiveMovements}</p>
                                    <p>Detected: {debugInfo.movementDetected ? 'Yes' : 'No'}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            
            {/* Warning message */}
            {showWarning && (
                <div className="fixed top-4 right-4 z-50 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md max-w-md animate-fade-in">
                    <div className="flex">
                        <div className="py-1">
                            <svg className="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold">Warning</p>
                            <p className="text-sm">{warningMessage}</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Exam content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
                    <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium text-gray-500">
                            Time left: <span className="text-gray-900">{formatTime(timeLeft)}</span>
                        </div>
                        <button
                            onClick={onCancel}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                            Exit
                        </button>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    {exam.questions.length > 0 && (
                        <>
                            <div className="mb-4">
                                <h2 className="text-lg font-medium text-gray-900">
                                    Question {currentQuestion + 1} of {exam.questions.length}
                                </h2>
                            </div>
                            
                            <div className="mb-6">
                                <p className="text-gray-800 mb-4">{exam.questions[currentQuestion].text}</p>
                                
                                <div className="space-y-3">
                                    {exam.questions[currentQuestion].options.map((option, index) => {
                                        // Get the question ID (handle both id and _id formats)
                                        const questionId = exam.questions[currentQuestion].id || exam.questions[currentQuestion]._id;
                                        
                                        return (
                                            <div key={index} className="flex items-start">
                                                <input
                                                    type="radio"
                                                    id={`option-${index}`}
                                                    name={`question-${questionId}`}
                                                    checked={answers[questionId] === index}
                                                    onChange={() => handleAnswerSelect(questionId, index)}
                                                    className="mt-1 mr-3"
                                                />
                                                <label htmlFor={`option-${index}`} className="text-gray-700">
                                                    {typeof option === 'object' ? option.text : option}
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            <div className="flex justify-between">
                                <button
                                    onClick={handlePrevQuestion}
                                    disabled={currentQuestion === 0}
                                    className={`px-4 py-2 rounded ${
                                        currentQuestion === 0
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                                >
                                    Previous
                                </button>
                                
                                {currentQuestion < exam.questions.length - 1 ? (
                                    <button
                                        onClick={handleNextQuestion}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className={`px-4 py-2 rounded ${
                                            isSubmitting
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-green-500 hover:bg-green-600'
                                        } text-white`}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex flex-wrap gap-2">
                        {exam.questions.map((question, index) => {
                            // Get the question ID (handle both id and _id formats)
                            const questionId = question.id || question._id;
                            
                            return (
                                <button
                                    key={index}
                                    onClick={() => setCurrentQuestion(index)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                        currentQuestion === index
                                            ? 'bg-blue-500 text-white'
                                            : answers[questionId] !== undefined
                                            ? 'bg-green-100 text-green-800 border border-green-500'
                                            : 'bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
} 