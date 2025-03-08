'use client';

import { useState, useEffect } from 'react';
import { 
    AcademicCapIcon, 
    CheckCircleIcon, 
    XCircleIcon,
    ChartBarIcon,
    UserGroupIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function Reports() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        totalAttempts: 0,
        passRate: 0,
        averageScore: 0,
        totalStudents: 0
    });

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/reports/exam-results`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                setResults(data.data);
                calculateStats(data.data);
            } else {
                setError(data.message || 'Failed to fetch results');
            }
        } catch (error) {
            setError('Failed to fetch results');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (results) => {
        if (!results || results.length === 0) {
            return {
                totalAttempts: 0,
                passRate: 0,
                averageScore: 0,
                totalStudents: 0
            };
        }

        const totalAttempts = results.length;
        
        // Count passed attempts
        const passedAttempts = results.filter(r => 
            r.obtainedMarks >= (r.exam?.passingMarks || 0)
        ).length;
        
        // Calculate average score as percentage
        const totalPercentages = results.reduce((sum, r) => {
            const percentage = r.exam?.totalMarks 
                ? (r.obtainedMarks / r.exam.totalMarks) * 100 
                : 0;
            return sum + percentage;
        }, 0);
        
        // Get unique students
        const uniqueStudents = new Set(
            results.filter(r => r.student?._id)
                  .map(r => r.student._id)
        ).size;

        setStats({
            totalAttempts,
            passRate: totalAttempts ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
            averageScore: totalAttempts ? Math.round(totalPercentages / totalAttempts) : 0,
            totalStudents: uniqueStudents
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Exam Reports</h2>
                <p className="mt-2 text-sm text-gray-600">
                    View and analyze student exam results
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <ChartBarIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalAttempts}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.passRate}%</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <AcademicCapIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Average Score</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.averageScore}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <UserGroupIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Students</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Exam
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Score
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Submitted
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {results.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No exam results found
                                    </td>
                                </tr>
                            ) : (
                                results.map((result) => (
                                    <tr key={result._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {result.student?.fullName || 'Unknown Student'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {result.student?.email || 'No email'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {result.exam?.title || 'Unknown Exam'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {result.exam?.subject?.name || 'Unknown Subject'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {result.obtainedMarks || 0} / {result.exam?.totalMarks || 0}
                                                <span className="text-gray-500 text-xs ml-1">
                                                    ({result.exam?.totalMarks 
                                                        ? Math.round((result.obtainedMarks / result.exam.totalMarks) * 100) 
                                                        : 0}%)
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {result.obtainedMarks >= (result.exam?.passingMarks || 0) ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Passed
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(result.submittedAt)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
} 