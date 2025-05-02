'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

const FaceCapture = ({ onCapture, buttonText = 'Capture', width = 320, height = 240 }) => {
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
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
            setErrorMessage('Failed to get camera devices. Please check your permissions.');
        }
    }, [selectedDevice]);

    useEffect(() => {
        getVideoDevices();
        
        // Listen for device changes (e.g., when a camera is plugged in/out)
        navigator.mediaDevices.addEventListener('devicechange', getVideoDevices);
        
        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', getVideoDevices);
        };
    }, [getVideoDevices]);

    const capture = useCallback(() => {
        if (!webcamRef.current) return;
        
        const imageSrc = webcamRef.current.getScreenshot();
        if (onCapture && imageSrc) {
            onCapture(imageSrc);
        }
    }, [onCapture]);

    const handleDeviceChange = (event) => {
        setSelectedDevice(event.target.value);
        setIsCameraReady(false); // Reset camera state for new device
    };

    return (
        <div className="flex flex-col items-center">
            {devices.length > 1 && (
                <div className="w-full mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Camera
                    </label>
                    <select
                        value={selectedDevice || ''}
                        onChange={handleDeviceChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                        {devices.map((device, index) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Camera ${index + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            
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
                            deviceId: selectedDevice
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