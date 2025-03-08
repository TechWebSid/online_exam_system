'use client';

import { useState, useCallback } from 'react';
import FaceCapture from './FaceCapture';
import { registerFace } from '@/utils/api';

const FaceRegistration = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [error, setError] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);

    const handleCapture = useCallback((imageSrc) => {
        setCapturedImage(imageSrc);
        setError('');
    }, []);

    const handleRegister = async () => {
        if (!capturedImage) {
            setError('Please capture an image first');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await registerFace(capturedImage);

            if (response.success) {
                setIsRegistered(true);
                setCapturedImage(null);
            } else {
                setError(response.message || 'Failed to register face');
            }
        } catch (error) {
            console.error('Error registering face:', error);
            setError('An error occurred while registering your face');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        setCapturedImage(null);
        setError('');
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Face Registration</h2>
            
            {isRegistered ? (
                <div className="text-center">
                    <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">
                        <p>Face registered successfully!</p>
                    </div>
                    <button
                        onClick={() => setIsRegistered(false)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        Register Another Face
                    </button>
                </div>
            ) : (
                <>
                    {capturedImage ? (
                        <div className="mb-6">
                            <div className="relative mb-4">
                                <img
                                    src={capturedImage}
                                    alt="Captured face"
                                    className="rounded-lg mx-auto border-2 border-gray-300"
                                    width={320}
                                    height={240}
                                />
                            </div>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={handleRetry}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                    disabled={isLoading}
                                >
                                    Retake
                                </button>
                                <button
                                    onClick={handleRegister}
                                    className={`px-4 py-2 rounded-md ${
                                        isLoading
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-500 hover:bg-blue-600'
                                    } text-white`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Registering...' : 'Register Face'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <FaceCapture
                            onCapture={handleCapture}
                            buttonText="Capture Face"
                            width={320}
                            height={240}
                        />
                    )}

                    {error && (
                        <div className="bg-red-100 text-red-700 p-4 rounded-lg mt-4">
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="mt-6 text-sm text-gray-600">
                        <h3 className="font-semibold mb-2">Instructions:</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Ensure your face is clearly visible and well-lit</li>
                            <li>Remove glasses, hats, or other accessories</li>
                            <li>Look directly at the camera</li>
                            <li>Keep a neutral expression</li>
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
};

export default FaceRegistration; 