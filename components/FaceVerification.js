'use client';

import { useState, useCallback } from 'react';
import FaceCapture from './FaceCapture';
import { verifyFace } from '@/utils/api';

const FaceVerification = ({ onSuccess, userId }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [error, setError] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);

    const handleCapture = useCallback((imageSrc) => {
        setCapturedImage(imageSrc);
        setError('');
    }, []);

    const handleVerify = async () => {
        if (!capturedImage) {
            setError('Please capture an image first');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            console.log('Verifying face for userId:', userId);
            console.log('Image data length:', capturedImage.length);
            
            const response = await verifyFace(capturedImage, userId);
            console.log('Face verification response:', response);
            
            // Log more details about the verification result
            if (response.confidence) {
                console.log('Verification confidence:', response.confidence);
                console.log('Confidence threshold used:', 0.6); // Default threshold
            }

            if (response.success) {
                setIsVerified(true);
                setVerificationResult(response);
                if (onSuccess) {
                    onSuccess(response);
                }
            } else {
                setError(response.message || 'Face verification failed');
                // Add more specific error information if available
                if (response.confidence) {
                    setError(`Verification failed: Confidence ${Math.round(response.confidence * 100)}% is below threshold`);
                }
            }
        } catch (error) {
            console.error('Error verifying face:', error);
            setError('An error occurred while verifying your face');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        setCapturedImage(null);
        setError('');
        setIsVerified(false);
        setVerificationResult(null);
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Face Verification</h2>
            
            {isVerified ? (
                <div className="text-center">
                    <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">
                        <p>Face verification successful!</p>
                        {verificationResult && (
                            <p className="mt-2 font-semibold">Welcome, {verificationResult.name}</p>
                        )}
                    </div>
                    <button
                        onClick={handleRetry}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        Verify Again
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
                                    onClick={handleVerify}
                                    className={`px-4 py-2 rounded-md ${
                                        isLoading
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-500 hover:bg-blue-600'
                                    } text-white`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Verifying...' : 'Verify Face'}
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
                            <li>Look directly at the camera</li>
                            <li>Position your face in the same way as during registration</li>
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
};

export default FaceVerification; 