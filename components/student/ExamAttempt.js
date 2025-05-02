'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';

// Add styles for the countdown animation
const styles = {
    '@keyframes countdown': {
        '0%': { width: '100%' },
        '100%': { width: '0%' }
    },
    animateCountdown: {
        animation: 'countdown 10s linear forwards'
    }
};

export default function ExamAttempt({ exam, onSubmit, onCancel }) {
    const router = useRouter();
    
    // All state declarations first
    const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [warningCount, setWarningCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [lastWarningTime, setLastWarningTime] = useState(0);
    const [lastCopyAttemptTime, setLastCopyAttemptTime] = useState(0);
    const [lastMovementWarningTime, setLastMovementWarningTime] = useState(0);
    const [isExamCancelling, setIsExamCancelling] = useState(false);
    const [isWindowFocused, setIsWindowFocused] = useState(true);
    const [windowLeaveTime, setWindowLeaveTime] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFullscreenModal, setShowFullscreenModal] = useState(false);
    const [faceMissingStartTime, setFaceMissingStartTime] = useState(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [debugInfo, setDebugInfo] = useState(null);
    const [isWarmupPeriod, setIsWarmupPeriod] = useState(true);
    const [cameraError, setCameraError] = useState('');
    const [minimized, setMinimized] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [status, setStatus] = useState('Loading...');
    const [sessionId, setSessionId] = useState('');
    const [showDebug, setShowDebug] = useState(true);
    const [showStartModal, setShowStartModal] = useState(true);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);

    // All refs
    const webcamRef = useRef(null);
    const intervalRef = useRef(null);
    const containerRef = useRef(null);

    // All constants
    const MAX_WARNINGS = 5;
    const WARNING_COOLDOWN = 3000; // 3 seconds between warnings
    const COPY_ATTEMPT_COOLDOWN = 500; // 500ms between copy attempts
    const FACE_MISSING_TIMEOUT = 10000; // 10 seconds before exam cancellation
    const MAX_WINDOW_LEAVE_TIME = 5000; // 5 seconds max time allowed away
    const monitoringInterval = 1000; // Check every second
    const warmupDurationMs = 3000; // 3 seconds warmup period
    const MOVEMENT_THRESHOLD = 17; // 10% threshold for movement detection
    const MOVEMENT_WARNING_COOLDOWN = 6000; // 3 seconds between movement warnings
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

    // Handle warnings with proper cooldown and tracking
    const handleWarning = useCallback((message, type) => {
        const now = Date.now();
        const timeSinceLastWarning = now - lastWarningTime;
        
        // Special handling for face missing warnings
        if (type === 'face_missing') {
            setFaceMissingStartTime(prev => {
                if (!prev) {
                    setWarningMessage('Face not detected! Return to camera view or exam will be cancelled in 10 seconds.');
                    setShowWarning(true);
                    return now;
                }
                
                const timeElapsed = now - prev;
                if (timeElapsed >= FACE_MISSING_TIMEOUT && !isExamCancelling) {
                    setIsExamCancelling(true);
                    setWarningMessage('Face not detected for too long. Exam will be cancelled.');
                    setTimeout(() => onCancel(), 3000);
                }
                return prev;
            });
            return;
        }

        // Regular warning handling
        if (timeSinceLastWarning < WARNING_COOLDOWN) {
            return;
        }

        // For copy attempts, use a separate cooldown
        if (type === 'copy' || type === 'paste') {
            const timeSinceLastCopy = now - lastCopyAttemptTime;
            if (timeSinceLastCopy < COPY_ATTEMPT_COOLDOWN) {
                return;
            }
            setLastCopyAttemptTime(now);
        }

        const newWarningCount = warningCount + 1;
        setWarningCount(newWarningCount);
        setLastWarningTime(now);
        
        if (newWarningCount >= MAX_WARNINGS && !isExamCancelling) {
            setIsExamCancelling(true);
            setWarningMessage(`Maximum warnings reached. Cancelling exam in 3 seconds...`);
            
            // Create a countdown effect
            setTimeout(() => {
                setWarningMessage(`Maximum warnings reached. Cancelling exam in 2 seconds...`);
                
                setTimeout(() => {
                    setWarningMessage(`Maximum warnings reached. Cancelling exam in 1 second...`);
                    
                    setTimeout(() => {
                        onCancel();
                    }, 1000);
                }, 1000);
            }, 1000);
            
            return;
        }
        
        const warningText = `${message} (Warning ${newWarningCount}/${MAX_WARNINGS})`;
        setWarningMessage(warningText);
        setShowWarning(true);

        setTimeout(() => {
            setShowWarning(false);
        }, 3000);
    }, [warningCount, lastWarningTime, lastCopyAttemptTime, isExamCancelling, onCancel]);

    // Prevent copy-paste and handle tab key
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Prevent Tab key and its combinations
            if (e.key === 'Tab') {
                e.preventDefault();
                // Check if it's combined with Ctrl, Alt, or both
                if (e.ctrlKey && e.altKey) {
                    handleWarning('Ctrl+Alt+Tab is disabled during the exam', 'tab');
                } else if (e.ctrlKey) {
                    handleWarning('Ctrl+Tab is disabled during the exam', 'tab');
                } else if (e.altKey) {
                    handleWarning('Alt+Tab is disabled during the exam', 'tab');
                } else {
                    handleWarning('Tab key is disabled during the exam', 'tab');
                }
                return;
            }

            // Prevent copy-paste shortcuts
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'c' || e.key === 'C') {
                    e.preventDefault();
                    handleWarning('Copying is not allowed during the exam', 'copy');
                } else if (e.key === 'v' || e.key === 'V') {
                    e.preventDefault();
                    handleWarning('Pasting is not allowed during the exam', 'paste');
                } else if (e.key === 'x' || e.key === 'X') {
                    e.preventDefault();
                    handleWarning('Cutting is not allowed during the exam', 'cut');
                }
            }
        };

        const handleCopy = (e) => {
            e.preventDefault();
            handleWarning('Copying is not allowed during the exam', 'copy');
        };

        const handlePaste = (e) => {
            e.preventDefault();
            handleWarning('Pasting is not allowed during the exam', 'paste');
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setIsWindowFocused(false);
                setWindowLeaveTime(Date.now());
                handleWarning('Window switching detected! Return immediately to avoid exam cancellation', 'visibility');
                
                const timer = setTimeout(() => {
                    if (document.hidden) {
                        setIsExamCancelling(true);
                        setWarningMessage('You were away from the exam window for too long. Exam will be cancelled in 10 seconds.');
                        setTimeout(() => {
                            onCancel();
                        }, 10000);
                    }
                }, MAX_WINDOW_LEAVE_TIME);

                return () => clearTimeout(timer);
            } else {
                setIsWindowFocused(true);
                const timeAway = windowLeaveTime ? Date.now() - windowLeaveTime : 0;
                if (timeAway > 2000) {
                    handleWarning(`You were away from the exam window for ${Math.round(timeAway/1000)} seconds`, 'visibility');
                }
                setWindowLeaveTime(null);
            }
        };

        const handleFocus = () => {
            setIsWindowFocused(true);
        };

        const handleBlur = () => {
            setIsWindowFocused(false);
            handleWarning('Window switching detected! Return immediately to avoid exam cancellation', 'visibility');
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, [handleWarning, onCancel]);

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
                        setIsWarmupPeriod(false); // Set warmup period to false
                        setLastWarningTime(Date.now());
                        console.log('Camera initialized and monitoring enabled');
                    } else {
                        setCameraError('Failed to initialize camera. Please refresh and try again.');
                        console.error('Failed to initialize camera');
                    }
                }, 2000);
            } catch (error) {
                console.error('Error starting camera:', error);
                setCameraError('Failed to access camera. Please ensure camera permissions are granted.');
            }
        };
        
        startCamera();
        
        // Always clean up intervals on component unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);

    // Capture and send frames to server for monitoring
    const captureAndSendFrame = useCallback(async () => {
        if (!webcamRef.current || !isMonitoring) {
            console.log('Webcam not ready or monitoring disabled');
            return;
        }

        try {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) {
                console.error('No screenshot available');
                handleWarning('No camera feed available', 'face_missing');
                return;
            }

            console.log('Sending frame to server:', FLASK_SERVER_URL);
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
            console.log('Response from server:', data);
            
            // Handle potential undefined data
            const processedData = {
                success: data.success || false,
                warning: data.warning || null,
                movement: data.movement || 0,
                rawMovement: data.rawMovement || 0,
                avgMovement: data.avgMovement || 0,
                threshold: data.threshold || 0,
                consecutiveMovements: data.consecutiveMovements || 0,
                movementDetected: data.movementDetected || false,
                debug: data.debug || {}
            };
            
            if (!processedData.success || processedData.warning === 'face_missing') {
                handleWarning('Face not detected in camera view', 'face_missing');
                return;
            }

            // Face is detected, reset the timer
            setFaceMissingStartTime(null);
            
            // Check for movement with separate cooldown for movement warnings
            setDebugInfo(processedData);
            const movementPercentage = processedData.movement * 100;
            
            // Use higher threshold (10%) and check if enough time has passed since last movement warning
            const now = Date.now();
            const timeSinceLastMovementWarning = now - lastMovementWarningTime;
            
            if (movementPercentage > MOVEMENT_THRESHOLD && timeSinceLastMovementWarning >= MOVEMENT_WARNING_COOLDOWN) {
                // Update the last movement warning time 
                setLastMovementWarningTime(now);
                handleWarning(`Excessive head movement detected (${movementPercentage.toFixed(1)}%). Please keep your head still.`, 'movement');
            }
            
        } catch (error) {
            console.error('Error monitoring face:', error);
            handleWarning('Error monitoring face', 'face_missing');
        }
    }, [isMonitoring, sessionId, handleWarning, webcamRef, lastMovementWarningTime]);

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
        console.log('Debug display toggled');
    }, []);

    // Function to enter fullscreen
    const enterFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
                setShowFullscreenModal(false);
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
            // Don't show warning, show modal instead
            setShowFullscreenModal(true);
        }
    }, []);

    // Function to start exam in fullscreen
    const startExamInFullscreen = async () => {
        try {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
            setShowStartModal(false);
            setShowFullscreenModal(false);
            
            // Start monitoring here as well
            console.log('Starting monitoring after fullscreen...');
            if (!intervalRef.current) {
                intervalRef.current = setInterval(() => {
                    captureAndSendFrame();
                }, monitoringInterval);
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
            setShowFullscreenModal(true);
        }
    };

    // Handle fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isInFullscreen = !!document.fullscreenElement;
            setIsFullscreen(isInFullscreen);
            
            if (!isInFullscreen && !isExamCancelling && !showStartModal) {
                setShowFullscreenModal(true);
            }
        };
        
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [isExamCancelling, showStartModal]);

    // Remove the automatic fullscreen request on mount
    useEffect(() => {
        // Only start monitoring after exam starts
        if (!showStartModal) {
            console.log('Exam started, initializing monitoring...');
            
            // Clear any existing interval first
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            
            // Set up monitoring interval
            intervalRef.current = setInterval(() => {
                captureAndSendFrame();
            }, monitoringInterval);
            
            // Cleanup interval on component unmount or when exam is canceled
            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            };
        }
    }, [showStartModal, captureAndSendFrame]);

    // Add getVideoDevices function
    const getVideoDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setDevices(videoDevices);
            
            // Set the first device as default if none selected
            if (videoDevices.length > 0 && !selectedDevice) {
                setSelectedDevice(videoDevices[0].deviceId);
            }
        } catch (error) {
            console.error('Error getting video devices:', error);
            setCameraError('Failed to get camera devices. Please check your permissions.');
        }
    }, [selectedDevice]);

    // Add device change handler
    const handleDeviceChange = (event) => {
        setSelectedDevice(event.target.value);
        setIsMonitoring(false); // Reset monitoring state
        setStatus('Switching camera...'); // Update status
        
        // Restart monitoring with new device after a short delay
        setTimeout(() => {
            if (webcamRef.current && webcamRef.current.video) {
                setStatus('Camera ready');
                setIsMonitoring(true);
            }
        }, 1000);
    };

    // Add device enumeration effect
    useEffect(() => {
        getVideoDevices();
        
        // Listen for device changes
        navigator.mediaDevices.addEventListener('devicechange', getVideoDevices);
        
        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', getVideoDevices);
        };
    }, [getVideoDevices]);

    return (
        <div className="relative min-h-screen bg-gray-50 pb-10">
            {/* Initial Start Exam Modal */}
            {showStartModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-medium text-gray-900 mb-4">Start Exam</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                This exam requires fullscreen mode. Click the button below to start the exam in fullscreen mode.
                                <br /><br />
                                <span className="font-medium">Important Notes:</span>
                                <br />
                                • You cannot exit fullscreen during the exam
                                <br />
                                • Exiting fullscreen will require cancelling the exam
                                <br />
                                • Make sure you have completed all other tasks before starting
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={startExamInFullscreen}
                                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                                >
                                    Start Exam in Fullscreen
                                </button>
                                <button
                                    onClick={onCancel}
                                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Modal */}
            {showFullscreenModal && !showStartModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Fullscreen Required</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                This exam must be taken in fullscreen mode. You can either:
                                <br />
                                1. Return to fullscreen mode and continue
                                <br />
                                2. Cancel the exam
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={enterFullscreen}
                                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                                >
                                    Return to Fullscreen
                                </button>
                                <button
                                    onClick={onCancel}
                                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-red-900 bg-red-100 border border-transparent rounded-md hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                                >
                                    Cancel Exam
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                        {devices.length > 1 && (
                            <div className="p-2 border-b border-gray-200">
                                <select
                                    value={selectedDevice || ''}
                                    onChange={handleDeviceChange}
                                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    {devices.map((device, index) => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Camera ${index + 1}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="relative">
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    width: 256,
                                    height: 144,
                                    deviceId: selectedDevice
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
                            <p className="flex items-center">
                                Warnings: 
                                <span className={`ml-1 font-medium ${
                                    warningCount === 0 ? 'text-green-500' : 
                                    warningCount < 3 ? 'text-yellow-500' : 
                                    warningCount < MAX_WARNINGS ? 'text-orange-500' : 
                                    'text-red-500'
                                }`}>
                                    {warningCount}/{MAX_WARNINGS}
                                </span>
                                {warningCount >= 3 && warningCount < MAX_WARNINGS && (
                                    <span className="ml-1 text-red-500 animate-pulse">⚠️</span>
                                )}
                            </p>
                            <p>Time left: {formatTime(timeLeft)}</p>
                            <button 
                                onClick={toggleDebug} 
                                className="mt-1 text-blue-500 hover:text-blue-700 text-xs"
                            >
                                {showDebug ? 'Hide Debug' : 'Show Debug'}
                            </button>
                            
                            {showDebug && (
                                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                                    {debugInfo ? (
                                        <>
                                            <p>Movement: {((debugInfo.movement || 0) * 100).toFixed(2)}%</p>
                                            <p>Raw: {((debugInfo.rawMovement || 0) * 100).toFixed(2)}%</p>
                                            <p>Avg: {((debugInfo.avgMovement || 0) * 100).toFixed(2)}%</p>
                                            <p>Similarity: {((debugInfo.debug?.similarity || 0) * 100).toFixed(2)}%</p>
                                            <p>Threshold: {((debugInfo.threshold || 0) * 100).toFixed(2)}%</p>
                                            <p>Consecutive: {debugInfo.consecutiveMovements || 0}</p>
                                            <p>Detected: {debugInfo.movementDetected ? 'Yes' : 'No'}</p>
                                            <div className="mt-1 pt-1 border-t border-gray-200">
                                                <p>Warning threshold: {MOVEMENT_THRESHOLD}%</p>
                                                <p>Cooldown: {MOVEMENT_WARNING_COOLDOWN/1000}s</p>
                                                <p>Next warn in: {Math.max(0, Math.ceil((lastMovementWarningTime + MOVEMENT_WARNING_COOLDOWN - Date.now())/1000))}s</p>
                                            </div>
                                        </>
                                    ) : (
                                        <p>Waiting for camera data...</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            
            {/* Warning message */}
            {showWarning && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded shadow-md max-w-md animate-fade-in ${
                    isExamCancelling 
                        ? 'bg-red-600 text-white border-l-4 border-red-800' 
                        : 'bg-red-100 border-l-4 border-red-500 text-red-700'
                }`}>
                    <div className="flex">
                        <div className="py-1">
                            <svg className={`h-6 w-6 ${isExamCancelling ? 'text-white' : 'text-red-500'} mr-4`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold">{isExamCancelling ? 'EXAM CANCELLATION' : 'Warning'}</p>
                            <p className="text-sm">{warningMessage}</p>
                            {isExamCancelling && warningMessage.includes('Cancelling exam in') && (
                                <div className="mt-2">
                                    <div className="mt-2 h-2 bg-red-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-white" 
                                            style={{
                                                animation: 'countdown 3s linear forwards'
                                            }}
                                        />
                                        <style jsx>{`
                                            @keyframes countdown {
                                                0% { width: 100%; }
                                                100% { width: 0%; }
                                            }
                                        `}</style>
                                    </div>
                                    <p className="mt-1 text-sm text-white opacity-80">
                                        All progress will be lost. Please contact your instructor.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Exam content */}
            {!showStartModal && (
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
            )}
        </div>
    );
} 