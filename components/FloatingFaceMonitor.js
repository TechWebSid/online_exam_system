'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
// Import CPU backend explicitly
import '@tensorflow/tfjs-backend-cpu';
import * as facemesh from '@tensorflow-models/face-landmarks-detection';

const FloatingFaceMonitor = ({ 
    onWarning,
    movementThreshold = 20,
    maxConsecutiveMovements = 3,
    monitoringInterval = 1500
}) => {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [consecutiveMovements, setConsecutiveMovements] = useState(0);
    const [cameraError, setCameraError] = useState('');
    const [minimized, setMinimized] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [status, setStatus] = useState('Loading...');
    
    const webcamRef = useRef(null);
    const modelRef = useRef(null);
    const intervalRef = useRef(null);
    const previousPositionsRef = useRef(null);
    const containerRef = useRef(null);

    // Load TensorFlow.js model with CPU backend
    useEffect(() => {
        const loadModel = async () => {
            try {
                // Set CPU as the backend
                await tf.setBackend('cpu');
                await tf.ready();
                
                setStatus('Loading face model...');
                
                // Load the facemesh model with lighter configuration
                modelRef.current = await facemesh.load(
                    facemesh.SupportedPackages.mediapipeFacemesh,
                    { 
                        maxFaces: 1,
                        shouldLoadIrisModel: false, // Disable iris model for better performance
                        modelUrl: undefined // Use default model
                    }
                );
                
                setIsModelLoaded(true);
                setStatus('Ready');
                console.log('Face landmarks model loaded successfully');
            } catch (error) {
                console.error('Error loading face landmarks model:', error);
                setCameraError('Failed to load face detection model');
                setStatus('Error loading model');
            }
        };

        loadModel();

        return () => {
            // Cleanup
            if (modelRef.current) {
                modelRef.current = null;
            }
        };
    }, []);

    const handleUserMedia = useCallback(() => {
        setIsMonitoring(true);
        setCameraError('');
        setStatus('Monitoring');
    }, []);

    const handleUserMediaError = useCallback((error) => {
        console.error('Camera error:', error);
        setIsMonitoring(false);
        setCameraError('Camera access denied');
        setStatus('Camera error');
    }, []);

    // Calculate movement between face positions
    const calculateMovement = (currentPositions, previousPositions) => {
        if (!currentPositions || !previousPositions) return 0;
        
        // Use fewer key points for better performance
        // Just use the main facial features: eyes, nose, and mouth
        const keyPoints = [0, 5, 8, 13, 14, 17]; // Reduced set of key points
        
        let totalMovement = 0;
        let pointsCount = 0;
        
        keyPoints.forEach(index => {
            if (currentPositions[index] && previousPositions[index]) {
                const dx = currentPositions[index].x - previousPositions[index].x;
                const dy = currentPositions[index].y - previousPositions[index].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                totalMovement += distance;
                pointsCount++;
            }
        });
        
        return pointsCount > 0 ? totalMovement / pointsCount : 0;
    };

    // Detect face and monitor head movement
    const detectFace = useCallback(async () => {
        if (!webcamRef.current || !modelRef.current || !isModelLoaded || !isMonitoring) return;
        
        try {
            const video = webcamRef.current.video;
            if (!video || video.readyState !== 4) return;
            
            // Make detections with lighter settings
            const predictions = await modelRef.current.estimateFaces({
                input: video,
                returnTensors: false,
                flipHorizontal: false,
                predictIrises: false
            });
            
            if (predictions.length > 0) {
                const currentPositions = predictions[0].scaledMesh;
                
                // If we have previous positions, calculate movement
                if (previousPositionsRef.current) {
                    const movement = calculateMovement(currentPositions, previousPositionsRef.current);
                    
                    // Check if movement exceeds threshold
                    if (movement > movementThreshold) {
                        setConsecutiveMovements(prev => prev + 1);
                        
                        // If consecutive movements exceed the maximum allowed
                        if (consecutiveMovements + 1 >= maxConsecutiveMovements) {
                            // Call the warning callback
                            if (onWarning) {
                                onWarning('excessive_movement', 'Excessive head movement detected. Please keep your head still.');
                            }
                            
                            // Reset consecutive movements after warning
                            setConsecutiveMovements(0);
                        }
                    } else {
                        // Reset consecutive movements if movement is within threshold
                        setConsecutiveMovements(0);
                    }
                }
                
                // Update previous positions
                previousPositionsRef.current = currentPositions;
            } else {
                // No face detected
                previousPositionsRef.current = null;
            }
        } catch (error) {
            console.error('Error detecting face:', error);
        }
    }, [isModelLoaded, isMonitoring, consecutiveMovements, movementThreshold, maxConsecutiveMovements, onWarning]);

    // Start monitoring when component mounts and model is loaded
    useEffect(() => {
        if (isMonitoring && isModelLoaded) {
            // Use a longer interval for CPU-based detection to reduce performance impact
            const actualInterval = Math.max(monitoringInterval, 1500); // Ensure at least 1.5 seconds between checks
            intervalRef.current = setInterval(detectFace, actualInterval);
        }
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isMonitoring, isModelLoaded, detectFace, monitoringInterval]);

    // Handle dragging
    const handleMouseDown = (e) => {
        if (containerRef.current) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleMouseMove = useCallback((e) => {
        if (isDragging && containerRef.current) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    }, [isDragging, dragStart]);

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Add and remove event listeners for dragging
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove]);

    // Get status color
    const getStatusColor = () => {
        if (cameraError) return 'bg-red-500';
        if (!isModelLoaded) return 'bg-yellow-500';
        if (isMonitoring) return 'bg-green-500';
        return 'bg-gray-500';
    };

    return (
        <div 
            ref={containerRef}
            className={`fixed rounded-lg shadow-lg z-50 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ 
                top: `${position.y}px`, 
                left: `${position.x}px`,
                width: minimized ? 'auto' : '180px',
                transition: 'width 0.3s ease'
            }}
        >
            <div 
                className="bg-gray-800 text-white p-2 rounded-t-lg flex justify-between items-center"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor()}`}></div>
                    <span className="text-xs font-medium">Face Monitor</span>
                </div>
                <button 
                    onClick={() => setMinimized(!minimized)}
                    className="text-gray-400 hover:text-white focus:outline-none"
                >
                    {minimized ? '□' : '−'}
                </button>
            </div>
            
            {!minimized && (
                <div className="bg-white p-2 rounded-b-lg">
                    <div className="relative">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{
                                width: 160,
                                height: 120,
                                facingMode: "user"
                            }}
                            onUserMedia={handleUserMedia}
                            onUserMediaError={handleUserMediaError}
                            className="rounded w-full h-auto"
                            mirrored={true}
                        />
                        
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                            {status}
                        </div>
                        
                        {consecutiveMovements > 0 && (
                            <div className="absolute top-1 right-1 bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                {consecutiveMovements}
                            </div>
                        )}
                    </div>
                    
                    {cameraError && (
                        <div className="mt-2 text-xs text-red-600">
                            {cameraError}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FloatingFaceMonitor; 