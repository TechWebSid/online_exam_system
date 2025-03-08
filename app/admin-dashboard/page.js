'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentManagement } from '@/components/admin/StudentManagement';
import ExamManagement from '@/components/admin/ExamManagement';
import { SubjectManagement } from '@/components/admin/SubjectManagement';
import { Reports } from '@/components/admin/Reports';
import { 
  UserGroupIcon, DocumentTextIcon, 
  BookOpenIcon, AcademicCapIcon 
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const stats = [
  { name: 'Total Students', stat: '0', icon: UserGroupIcon },
  { name: 'Active Exams', stat: '0', icon: DocumentTextIcon },
  { name: 'Total Subjects', stat: '0', icon: BookOpenIcon },
  { name: 'Completed Exams', stat: '0', icon: AcademicCapIcon },
];

export default function AdminDashboard() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('students');

    useEffect(() => {
        // Check user's role when component mounts
        const checkAuth = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                    credentials: 'include'
                });
                const data = await response.json();

                if (!response.ok || data.user.role !== 'admin') {
                    router.replace('/login');
                }
            } catch (error) {
                router.replace('/login');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const tabs = [
        { id: 'students', label: 'Student Management' },
        { id: 'subjects', label: 'Subject Management' },
        { id: 'exams', label: 'Exam Management' },
        { id: 'reports', label: 'Reports' },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Admin Dashboard
                    </h1>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                                    ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Student Management Section */}
                {activeTab === 'students' && (
                    <div className="bg-white rounded-lg shadow">
                        <StudentManagement />
                    </div>
                )}

                {/* Subject Management Section */}
                {activeTab === 'subjects' && (
                    <div className="bg-white rounded-lg shadow">
                        <SubjectManagement />
                    </div>
                )}

                {/* Exam Management Section */}
                {activeTab === 'exams' && (
                    <div className="bg-white rounded-lg shadow">
                        <ExamManagement />
                    </div>
                )}

                {/* Reports Section */}
                {activeTab === 'reports' && (
                    <div className="bg-white rounded-lg shadow">
                        <Reports />
                    </div>
                )}

                {/* Remove or comment out the placeholder reports section */}
                {/* <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                        <div className="mt-4">
                            <p className="text-sm text-gray-500">No recent activity</p>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900">Upcoming Exams</h3>
                        <div className="mt-4">
                            <p className="text-sm text-gray-500">No upcoming exams</p>
                        </div>
                    </div>
                </div> */}
            </main>
        </div>
    );
} 