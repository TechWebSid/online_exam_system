'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FaceRegistration from '@/components/FaceRegistration';
import { getFaceAuthStatus } from '@/utils/api';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Mock data as fallback
const MOCK_USER = {
    _id: '123456789',
    fullName: 'John Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    role: 'student',
    faceAuthStatus: {
        isRegistered: true,
        lastVerified: new Date().toISOString()
    }
};

const MOCK_EXAM_HISTORY = [
    {
        id: '1',
        examId: '101',
        examTitle: 'Introduction to Computer Science',
        subject: 'Computer Science',
        submittedAt: new Date().toISOString(),
        score: {
            obtained: 85,
            total: 100,
            percentage: '85.00'
        },
        questions: {
            total: 20,
            attempted: 20,
            correct: 17,
            incorrect: 3
        }
    },
    {
        id: '2',
        examId: '102',
        examTitle: 'Data Structures and Algorithms',
        subject: 'Computer Science',
        submittedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        score: {
            obtained: 75,
            total: 100,
            percentage: '75.00'
        },
        questions: {
            total: 25,
            attempted: 23,
            correct: 15,
            incorrect: 8
        }
    },
    {
        id: '3',
        examId: '103',
        examTitle: 'Database Management Systems',
        subject: 'Information Technology',
        submittedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        score: {
            obtained: 60,
            total: 100,
            percentage: '60.00'
        },
        questions: {
            total: 30,
            attempted: 28,
            correct: 18,
            incorrect: 10
        }
    }
];

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFaceRegistration, setShowFaceRegistration] = useState(false);
    const [examHistory, setExamHistory] = useState([]);
    const [loadingExams, setLoadingExams] = useState(false);
    const [chartType, setChartType] = useState('bar'); // 'bar' or 'line'
    const router = useRouter();

    // Fetch user profile
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });

                if (!response.ok) {
                    console.warn(`API error: ${response.status}. Using mock user data.`);
                    // Use mock data as fallback
                    setUser(MOCK_USER);
                    return;
                }

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
                console.warn('Using mock data due to API error');
                // Use mock data as fallback
                setUser(MOCK_USER);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [router]);

    // Fetch exam history
    useEffect(() => {
        const fetchExamHistory = async () => {
            if (!user) return;
            
            setLoadingExams(true);
            try {
                const response = await fetch(`${API_BASE_URL}/student/exams/history`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });

                if (!response.ok) {
                    console.warn(`API error: ${response.status}. Using mock exam history.`);
                    // Use mock data as fallback
                    setExamHistory(MOCK_EXAM_HISTORY);
                    setLoadingExams(false);
                    return;
                }

                const data = await response.json();

                if (data.success) {
                    console.log('Exam history data:', data);
                    setExamHistory(data.data);
                } else {
                    console.error('Failed to fetch exam history:', data.message);
                    // Use mock data as fallback
                    setExamHistory(MOCK_EXAM_HISTORY);
                }
            } catch (error) {
                console.error('Error fetching exam history:', error);
                // Use mock data as fallback
                setExamHistory(MOCK_EXAM_HISTORY);
            } finally {
                setLoadingExams(false);
            }
        };

        fetchExamHistory();
    }, [user]);

    // Prepare chart data
    const prepareChartData = () => {
        if (!examHistory.length) return null;

        // Sort exams by submission date
        const sortedExams = [...examHistory].sort((a, b) => 
            new Date(a.submittedAt) - new Date(b.submittedAt)
        );

        const labels = sortedExams.map(exam => exam.examTitle);
        
        const data = {
            labels,
            datasets: [
                {
                    label: 'Score (%)',
                    data: sortedExams.map(exam => parseFloat(exam.score.percentage)),
                    backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    borderColor: 'rgb(53, 162, 235)',
                    borderWidth: 1,
                },
                {
                    label: 'Correct Answers (%)',
                    data: sortedExams.map(exam => 
                        (exam.questions.correct / exam.questions.total) * 100
                    ),
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1,
                }
            ],
        };

        return data;
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Exam Performance History',
                font: {
                    size: 16
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Percentage (%)'
                }
            }
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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

    const chartData = prepareChartData();

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
                                        <div className="mt-4 text-black space-y-4">
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

                        {/* Performance Graph Section */}
                        {examHistory.length > 0 && (
                            <div className="mt-10">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-medium text-gray-900">Performance Graph</h2>
                                    <div className="flex space-x-2">
                                        <button 
                                            className={`px-3 py-1 rounded-md text-sm ${chartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                            onClick={() => setChartType('bar')}
                                        >
                                            Bar Chart
                                        </button>
                                        <button 
                                            className={`px-3 py-1 rounded-md text-sm ${chartType === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                            onClick={() => setChartType('line')}
                                        >
                                            Line Chart
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                                    <div className="h-80">
                                        {chartData && (
                                            chartType === 'bar' ? (
                                                <Bar data={chartData} options={chartOptions} />
                                            ) : (
                                                <Line data={chartData} options={chartOptions} />
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Exam History Section */}
                        <div className="mt-10">
                            <h2 className="text-xl font-medium text-gray-900 mb-4">Exam History</h2>
                            
                            {loadingExams ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            ) : examHistory.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {examHistory.map((result) => (
                                                <tr key={result.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{result.examTitle}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{result.subject}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{formatDate(result.submittedAt)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{result.score.obtained}/{result.score.total}</div>
                                                        <div className="text-sm text-gray-500">{result.score.percentage}%</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                            <div 
                                                                className={`h-2.5 rounded-full ${
                                                                    parseFloat(result.score.percentage) >= 80 ? 'bg-green-500' :
                                                                    parseFloat(result.score.percentage) >= 60 ? 'bg-blue-500' :
                                                                    parseFloat(result.score.percentage) >= 40 ? 'bg-yellow-500' :
                                                                    'bg-red-500'
                                                                }`}
                                                                style={{ width: `${result.score.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <div className="flex justify-between text-xs mt-1">
                                                            <span>Attempted: {result.questions.attempted}/{result.questions.total}</span>
                                                            <span>Correct: {result.questions.correct}</span>
                                                        </div>
                                                        {parseFloat(result.score.percentage) >= 40 && (
                                                            <div className="mt-2">
                                                                <button
                                                                    onClick={() => router.push(`/student-dashboard/certificate/${result.id}`)}
                                                                    className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    View Certificate
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-6 rounded-lg text-center">
                                    <p className="text-gray-500">You haven't taken any exams yet.</p>
                                    <button
                                        onClick={() => router.push('/student-dashboard')}
                                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                    >
                                        Browse Available Exams
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage; 