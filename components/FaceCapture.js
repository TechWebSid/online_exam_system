'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

const FaceCapture = ({ onCapture, buttonText = 'Capture', width = 320, height = 240 }) => {
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const webcamRef = useRef(null);

    const handleUserMedia = useCallback(() => {
        setIsCameraReady(true);
        setErrorMessage('');
    }, []);

    const handleUserMediaError = useCallback((error) => {
        console.error('Camera error:', error);
        setIsCameraReady(false);
        setErrorMessage('Camera access denied or not available. Please check your permissions.');
    }, []);

    const capture = useCallback(() => {
        if (!webcamRef.current) return;
        
        const imageSrc = webcamRef.current.getScreenshot();
        if (onCapture && imageSrc) {
            onCapture(imageSrc);
        }
    }, [onCapture]);

    return (
        <div className="flex flex-col items-center">
            <div className="relative mb-4 rounded-lg overflow-hidden border-2 border-gray-300">
                {errorMessage ? (
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                        <p>{errorMessage}</p>
                    </div>
                ) : (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{
                            width,
                            height,
                            facingMode: 'user'
                        }}
                        onUserMedia={handleUserMedia}
                        onUserMediaError={handleUserMediaError}
                        className="rounded-lg"
                        width={width}
                        height={height}
                    />
                )}
                {isCameraReady && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                        <div className="w-16 h-16 border-2 border-white rounded-full"></div>
                    </div>
                )}
            </div>
            <button
                onClick={capture}
                disabled={!isCameraReady}
                className={`px-4 py-2 rounded-md ${
                    isCameraReady
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
                {buttonText}
            </button>
        </div>
    );
};

export default FaceCapture; 