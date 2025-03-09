'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { use } from 'react';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Mock data for development or when API is not available
const MOCK_EXAM_RESULT = {
    id: '123456789',
    examId: '987654321',
    examTitle: 'Introduction to Computer Science',
    subject: 'Computer Science',
    studentName: 'John Doe',
    studentEmail: 'john.doe@example.com',
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
};

export default function CertificatePage({ params }) {
    // Unwrap params using React.use()
    const unwrappedParams = use(params);
    const resultId = unwrappedParams.resultId;
    
    const [examResult, setExamResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [generating, setGenerating] = useState(false);
    const certificateRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const fetchExamResult = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/student/exams/result/${resultId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });

                if (!response.ok) {
                    console.warn(`API error: ${response.status}. Using mock exam result.`);
                    // Use mock data for development or when API is not available
                    setExamResult(MOCK_EXAM_RESULT);
                    setLoading(false);
                    return;
                }

                const data = await response.json();

                if (data.success) {
                    console.log('Exam result data:', data);
                    setExamResult(data.data);
                    
                    // Check if the user passed the exam
                    const percentage = (data.data.score.obtained / data.data.score.total) * 100;
                    if (percentage < 40) {
                        setError('You did not pass this exam. Certificate is only available for passed exams.');
                    }
                } else {
                    setError(data.message || 'Failed to fetch exam result');
                }
            } catch (error) {
                console.error('Error fetching exam result:', error);
                console.warn('Using mock data due to API error');
                // Use mock data for development or when API is not available
                setExamResult(MOCK_EXAM_RESULT);
            } finally {
                setLoading(false);
            }
        };

        fetchExamResult();
    }, [resultId]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const generatePDF = async () => {
        if (!certificateRef.current) return;
        
        setGenerating(true);
        
        try {
            const canvas = await html2canvas(certificateRef.current, {
                scale: 2,
                useCORS: true,
                logging: false
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            const imgWidth = 297;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`${examResult.examTitle.replace(/\s+/g, '_')}_Certificate.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setGenerating(false);
        }
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
                        onClick={() => router.push('/student-dashboard/profile')}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Back to Profile
                    </button>
                </div>
            </div>
        );
    }

    if (!examResult) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
                    <div className="text-red-600 mb-4">
                        <p>Exam result not found</p>
                    </div>
                    <button
                        onClick={() => router.push('/student-dashboard/profile')}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Back to Profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Certificate of Completion</h1>
                    <div className="flex space-x-4">
                        <button
                            onClick={generatePDF}
                            disabled={generating}
                            className={`px-4 py-2 rounded-md text-white ${generating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {generating ? 'Generating PDF...' : 'Download PDF'}
                        </button>
                        <button
                            onClick={() => router.push('/student-dashboard/profile')}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                            Back to Profile
                        </button>
                    </div>
                </div>

                {/* Certificate */}
                <div 
                    ref={certificateRef} 
                    className="bg-white p-12 rounded-lg shadow-lg"
                    style={{ 
                        aspectRatio: '1.414', 
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        backgroundSize: 'cover',
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0'
                    }}
                >
                    {/* Certificate Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0" style={{ 
                            backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}></div>
                    </div>
                    
                    {/* Modern geometric accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-20" 
                        style={{ 
                            clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                        }}
                    ></div>
                    
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 opacity-20" 
                        style={{ 
                            clipPath: 'polygon(0 100%, 0 0, 100% 100%)',
                        }}
                    ></div>
                    
                    {/* Certificate Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full py-8">
                        <div className="text-center max-w-3xl mx-auto">
                            {/* Certificate Header with modern badge */}
                            <div className="mb-12 relative pt-8">
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center z-20 shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h1 className="text-4xl font-bold text-blue-800 mt-12">Certificate of Achievement</h1>
                                <div className="w-32 h-1 bg-blue-600 mx-auto mt-4"></div>
                            </div>
                            
                            <p className="text-xl text-gray-600 mb-6">This is to certify that</p>
                            
                            <h2 className="text-3xl font-bold text-blue-900 mb-6">{examResult.studentName}</h2>
                            
                            <p className="text-xl text-gray-600 mb-2">has successfully completed</p>
                            
                            <h3 className="text-2xl font-bold text-blue-900 mb-6">{examResult.examTitle}</h3>
                            
                            <div className="my-6 flex items-center justify-center">
                                <div className="w-28 h-28 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg">
                                    <span className="text-2xl font-bold">{examResult.score.percentage}%</span>
                                </div>
                            </div>
                            
                            {/* Modern progress bar */}
                            <div className="w-full max-w-md mx-auto mb-6">
                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                                    <div 
                                        className="bg-blue-600 h-4 rounded-full" 
                                        style={{ width: `${examResult.score.percentage}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-sm mt-2 text-gray-600">
                                    <span>0%</span>
                                    <span>Score: {examResult.score.obtained}/{examResult.score.total}</span>
                                    <span>100%</span>
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-blue-200">
                                <p className="text-lg text-gray-600">Issued on {formatDate(examResult.submittedAt)}</p>
                                <p className="text-sm text-gray-500 mt-2">Certificate ID: {examResult.id}</p>
                            </div>
                            
                            {/* Modern badge/achievement icon */}
                            <div className="mt-6">
                                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Verified Achievement
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 