'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/utils/api';
import FaceVerification from '@/components/FaceVerification';

export function LoginForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'student'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showFaceVerification, setShowFaceVerification] = useState(false);
    const [userId, setUserId] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(''); // Clear error when user types
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await loginUser(formData);
            
            console.log('Login response:', response);
            console.log('User face auth status:', response.user.faceAuthStatus);
            
            // Set user ID for face verification
            setUserId(response.user._id);
            
            // Check if user has face registered
            if (response.user.faceAuthStatus?.isRegistered && response.user.role === 'student') {
                console.log('Face is registered, showing verification');
                setIsLoggedIn(true);
                setShowFaceVerification(true);
            } else {
                console.log('Face not registered or user is admin, proceeding directly');
                // If face is not registered or user is admin, proceed directly
                if (response.user.role === 'admin') {
                    router.push('/admin-dashboard');
                } else {
                    router.push('/student-dashboard');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFaceVerificationSuccess = (data) => {
        // Redirect based on user role after successful face verification
        if (data.userId) {
            setTimeout(() => {
                router.push('/student-dashboard');
            }, 1500);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                {/* Header */}
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome Back!
                    </h2>
                    <p className="text-gray-600">
                        Login to Your Account
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {isLoggedIn && showFaceVerification ? (
                    <FaceVerification 
                        onSuccess={handleFaceVerificationSuccess} 
                        userId={userId} 
                    />
                ) : (
                    <>
                        {/* Role Selection */}
                        <div className="flex justify-center space-x-4 p-1 bg-gray-50 rounded-lg">
                            {['student', 'admin'].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setFormData(prev => ({ ...prev, role }))}
                                    className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 ${
                                        formData.role === role
                                            ? 'bg-white shadow-sm text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                    type="button"
                                >
                                    {role.charAt(0).toUpperCase() + role.slice(1)} Login
                                </button>
                            ))}
                        </div>

                        {/* Login Form */}
                        <form className="mt-8 space-y-6 text-black" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                {/* Username Field */}
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
                                        placeholder="Enter your username"
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Password Field */}
                                <div className="relative">
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
                                            placeholder="Enter your password"
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
                                </div>
                            </div>

                            {/* Forgot Password Link */}
                            <div className="flex items-center justify-end">
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
                                >
                                    Forgot your password?
                                </Link>
                            </div>

                            {/* Login Button */}
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
                                    'Login'
                                )}
                            </button>

                            {/* Sign Up Link */}
                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    New member?{' '}
                                    <Link
                                        href="/signup"
                                        className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                                    >
                                        Create an account
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
} 