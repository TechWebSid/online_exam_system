'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerUser, registerFace } from '@/utils/api';
import FaceCapture from '@/components/FaceCapture';

export function SignupForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        role: 'student'
    });

    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        message: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showFaceCapture, setShowFaceCapture] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [registeredUser, setRegisteredUser] = useState(null);
    const [faceRegistrationComplete, setFaceRegistrationComplete] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(''); // Clear error when user types

        if (name === 'password') {
            checkPasswordStrength(value);
        }
    };

    const checkPasswordStrength = (password) => {
        let score = 0;
        let message = '';

        // Length check
        if (password.length >= 8) score += 1;
        
        // Contains number
        if (/\d/.test(password)) score += 1;
        
        // Contains lowercase
        if (/[a-z]/.test(password)) score += 1;
        
        // Contains uppercase
        if (/[A-Z]/.test(password)) score += 1;
        
        // Contains special character
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

        switch (score) {
            case 0:
            case 1:
                message = 'Weak';
                break;
            case 2:
            case 3:
                message = 'Moderate';
                break;
            case 4:
                message = 'Strong';
                break;
            case 5:
                message = 'Very Strong';
                break;
            default:
                message = '';
        }

        setPasswordStrength({ score, message });
    };

    const getStrengthColor = () => {
        switch (passwordStrength.score) {
            case 0:
            case 1:
                return 'bg-red-500';
            case 2:
            case 3:
                return 'bg-yellow-500';
            case 4:
                return 'bg-green-500';
            case 5:
                return 'bg-green-600';
            default:
                return 'bg-gray-200';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await registerUser(formData);
            setRegisteredUser(response.user);
            setShowFaceCapture(true);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFaceCapture = (imageSrc) => {
        setCapturedImage(imageSrc);
    };

    const handleRetakePhoto = () => {
        setCapturedImage(null);
    };

    const handleRegisterFace = async () => {
        if (!capturedImage || !registeredUser) {
            setError('Please capture your face image first');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            console.log('Registering face for user:', registeredUser._id);
            console.log('Image data length:', capturedImage.length);
            
            const response = await registerFace(capturedImage);
            console.log('Face registration response:', response);
            
            if (response.success) {
                setFaceRegistrationComplete(true);
                
                // Redirect to login after a short delay
                setTimeout(() => {
                    router.push('/login?registered=true');
                }, 2000);
            } else {
                setError(response.message || 'Failed to register face');
            }
        } catch (error) {
            console.error('Error registering face:', error);
            setError(error.message || 'Failed to register face');
        } finally {
            setIsLoading(false);
        }
    };

    // If face registration is complete, show success message
    if (faceRegistrationComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center">
                    <div className="text-green-600">
                        <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <h2 className="text-2xl font-bold mt-4">Registration Complete!</h2>
                        <p className="mt-2">Your account has been created successfully with face authentication.</p>
                        <p className="mt-4 text-gray-600">Redirecting to login page...</p>
                    </div>
                </div>
            </div>
        );
    }

    // If showing face capture screen
    if (showFaceCapture) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Face Registration
                        </h2>
                        <p className="text-gray-600">
                            Please register your face for secure authentication
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4">
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="mt-6">
                        {capturedImage ? (
                            <div className="space-y-6">
                                <div className="relative">
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
                                        onClick={handleRetakePhoto}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                        disabled={isLoading}
                                    >
                                        Retake Photo
                                    </button>
                                    <button
                                        onClick={handleRegisterFace}
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
                            <div className="space-y-6">
                                <FaceCapture
                                    onCapture={handleFaceCapture}
                                    buttonText="Capture Face"
                                    width={320}
                                    height={240}
                                />
                                <div className="text-sm text-gray-600">
                                    <h3 className="font-semibold mb-2">Instructions:</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Ensure your face is clearly visible and well-lit</li>
                                        <li>Remove glasses, hats, or other accessories</li>
                                        <li>Look directly at the camera</li>
                                        <li>Keep a neutral expression</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Original signup form
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                {/* Header */}
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Create Your Student Account
                    </h2>
                    <p className="text-gray-600">
                        Join our secure online examination platform
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Signup Form */}
                <form className="mt-8 space-y-6 text-black" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-gray-50"
                                placeholder="Enter your full name"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-gray-50"
                                placeholder="Choose a username"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-gray-50"
                                placeholder="Enter your email"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-gray-50"
                                    placeholder="Create a strong password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="h-2 rounded-full bg-gray-200">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${getStrengthColor()}`}
                                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                        />
                                    </div>
                                    <p className={`mt-1 text-sm ${getStrengthColor().replace('bg-', 'text-')}`}>
                                        Password Strength: {passwordStrength.message}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            'Create Account'
                        )}
                    </button>

                    {/* Login Link */}
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                            >
                                Login instead
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
} 