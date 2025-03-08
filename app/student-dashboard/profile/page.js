'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FaceRegistration from '@/components/FaceRegistration';
import { getFaceAuthStatus } from '@/utils/api';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFaceRegistration, setShowFaceRegistration] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await fetch('/api/auth/profile', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.success) {
                    console.log('User profile data:', data);
                    setUser(data.user);
                } else {
                    setError(data.message || 'Failed to fetch profile');
                    // Redirect to login if not authenticated
                    router.push('/login');
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                setError('An error occurred while fetching your profile');
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [router]);

    const fetchFaceAuthStatus = async () => {
        try {
            const data = await getFaceAuthStatus();
            return data.isRegistered;
        } catch (error) {
            console.error('Error fetching face auth status:', error);
            return false;
        }
    };

    useEffect(() => {
        const checkFaceAuthStatus = async () => {
            if (user) {
                const isRegistered = await fetchFaceAuthStatus();
                setUser(prev => ({
                    ...prev,
                    faceAuthStatus: {
                        ...prev.faceAuthStatus,
                        isRegistered
                    }
                }));
            }
        };

        checkFaceAuthStatus();
    }, [user?._id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
                    <div className="text-red-600 mb-4">
                        <p>{error}</p>
                    </div>
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                    <div className="p-6 bg-white border-b border-gray-200">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
                            <button
                                onClick={() => router.push('/student-dashboard')}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                                Back to Dashboard
                            </button>
                        </div>

                        {user && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-medium text-gray-900">Personal Information</h2>
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                                <div className="mt-1 p-2 bg-gray-50 rounded-md">{user.fullName}</div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Username</label>
                                                <div className="mt-1 p-2 bg-gray-50 rounded-md">{user.username}</div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                                <div className="mt-1 p-2 bg-gray-50 rounded-md">{user.email}</div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                                <div className="mt-1 p-2 bg-gray-50 rounded-md capitalize">{user.role}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-medium text-gray-900">Face Authentication</h2>
                                        <div className="mt-4">
                                            <div className="flex items-center space-x-2">
                                                <div className={`w-4 h-4 rounded-full ${user.faceAuthStatus?.isRegistered ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <span>{user.faceAuthStatus?.isRegistered ? 'Face Registered' : 'Face Not Registered'}</span>
                                            </div>
                                            
                                            {user.faceAuthStatus?.lastVerified && (
                                                <div className="mt-2 text-sm text-gray-600">
                                                    Last verified: {new Date(user.faceAuthStatus.lastVerified).toLocaleString()}
                                                </div>
                                            )}
                                            
                                            <button
                                                onClick={() => setShowFaceRegistration(!showFaceRegistration)}
                                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                            >
                                                {user.faceAuthStatus?.isRegistered ? 'Update Face Registration' : 'Register Face'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    {showFaceRegistration && (
                                        <FaceRegistration />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage; 