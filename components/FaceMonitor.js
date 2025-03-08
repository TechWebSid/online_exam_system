'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { monitorFace } from '@/utils/api';

const FaceMonitor = ({ onWarning, onError, monitoringInterval = 5000 }) => {
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [warningCount, setWarningCount] = useState(0);
    const webcamRef = useRef(null);
    const intervalRef = useRef(null);

    const handleUserMedia = useCallback(() => {
        setIsMonitoring(true);
        setErrorMessage('');
    }, []);

    const handleUserMediaError = useCallback((error) => {
        console.error('Camera error:', error);
        setIsMonitoring(false);
        setErrorMessage('Camera access denied or not available. Please check your permissions.');
        if (onError) {
            onError('camera_error', 'Camera access denied or not available');
        }
    }, [onError]);

    const monitorFaceHandler = useCallback(async () => {
        if (!webcamRef.current || !isMonitoring) return;
        
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;
        
        try {
            const response = await monitorFace(imageSrc);
            
            if (!response.success) {
                setWarningCount(prev => prev + 1);
                
                if (onWarning) {
                    onWarning(response.warning || 'unknown_warning', response.message || 'Face monitoring warning');
                }
                
                // Log the warning
                console.warn('Face monitoring warning:', response.message, response.warning);
            } else {
                // Reset warning count if successful
                setWarningCount(0);
            }
        } catch (error) {
            console.error('Error monitoring face:', error);
            if (onError) {
                onError('monitoring_error', 'Failed to monitor face');
            }
        }
    }, [isMonitoring, onWarning, onError]);

    // Start monitoring when component mounts
    useEffect(() => {
        if (isMonitoring) {
            intervalRef.current = setInterval(monitorFaceHandler, monitoringInterval);
        }
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isMonitoring, monitorFaceHandler, monitoringInterval]);

    return (
        <div className="relative">
            {errorMessage ? (
                <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                    <p>{errorMessage}</p>
                </div>
            ) : (
                <div className="relative">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{
                            width: 320,
                            height: 240,
                            facingMode: 'user'
                        }}
                        onUserMedia={handleUserMedia}
                        onUserMediaError={handleUserMediaError}
                        className="rounded-lg"
                        width={320}
                        height={240}
                        mirrored={true}
                    />
                    
                    {warningCount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            {warningCount}
                        </div>
                    )}
                    
                    <div className="absolute bottom-2 left-2 flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                            {isMonitoring ? 'Monitoring' : 'Not monitoring'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FaceMonitor; 