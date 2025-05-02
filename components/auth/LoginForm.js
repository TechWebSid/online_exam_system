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
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await loginUser(formData);
            setUserId(response.user._id);
            
            if (response.user.faceAuthStatus?.isRegistered && response.user.role === 'student') {
                setIsLoggedIn(true);
                setShowFaceVerification(true);
            } else {
                if (response.user.role === 'admin') {
                    router.push('/admin-dashboard');
                } else {
                    router.push('/student-dashboard');
                }
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFaceVerificationSuccess = (data) => {
        if (data.userId) {
            setTimeout(() => {
                router.push('/student-dashboard');
            }, 1500);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
            <div className="max-w-sm w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-medium text-gray-900">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to your account
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500">
                        <p className="text-sm text-red-600">{error}</p>
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
                        <div className="mb-6">
                            <div className="flex space-x-1 p-1 bg-gray-50 rounded-lg">
                                {['student', 'admin'].map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => setFormData(prev => ({ ...prev, role }))}
                                        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                                            formData.role === role
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                        type="button"
                                    >
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-6 text-black font-semibold">
                            {/* Username */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                                        focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                                    placeholder="Enter your username"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="relative mt-1">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                                            focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                                        placeholder="Enter your password"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black 
                                    hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    'Sign In'
                                )}
                            </button>

                            {/* Sign Up Link */}
                            <p className="text-center text-sm text-gray-600">
                                New member?{' '}
                                <Link
                                    href="/signup"
                                    className="font-medium text-black hover:text-gray-900 transition-colors"
                                >
                                    Create an account
                                </Link>
                            </p>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
} 