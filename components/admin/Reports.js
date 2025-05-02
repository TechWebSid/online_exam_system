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
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    RadialLinearScale
} from 'chart.js';
import { Doughnut, Bar, Line, PolarArea } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    RadialLinearScale
);

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
    const [subjectPerformance, setSubjectPerformance] = useState([]);
    const [attemptsOverTime, setAttemptsOverTime] = useState([]);
    const [scoreDistribution, setScoreDistribution] = useState([]);

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
                analyzeSubjectPerformance(data.data);
                analyzeAttemptsOverTime(data.data);
                analyzeScoreDistribution(data.data);
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

    const analyzeSubjectPerformance = (results) => {
        if (!results || results.length === 0) {
            setSubjectPerformance([]);
            return;
        }

        // Group results by subject
        const subjectMap = {};
        
        results.forEach(result => {
            const subjectName = result.exam?.subject?.name || 'Unknown Subject';
            if (!subjectMap[subjectName]) {
                subjectMap[subjectName] = {
                    totalAttempts: 0,
                    passedAttempts: 0,
                    totalPercentage: 0
                };
            }
            
            subjectMap[subjectName].totalAttempts++;
            
            if (result.obtainedMarks >= (result.exam?.passingMarks || 0)) {
                subjectMap[subjectName].passedAttempts++;
            }
            
            const percentage = result.exam?.totalMarks 
                ? (result.obtainedMarks / result.exam.totalMarks) * 100 
                : 0;
            subjectMap[subjectName].totalPercentage += percentage;
        });
        
        // Convert to array format for charts
        const subjectPerformanceData = Object.keys(subjectMap).map(subject => ({
            subject,
            totalAttempts: subjectMap[subject].totalAttempts,
            passRate: Math.round((subjectMap[subject].passedAttempts / subjectMap[subject].totalAttempts) * 100),
            averageScore: Math.round(subjectMap[subject].totalPercentage / subjectMap[subject].totalAttempts)
        }));
        
        setSubjectPerformance(subjectPerformanceData);
    };

    const analyzeAttemptsOverTime = (results) => {
        if (!results || results.length === 0) {
            setAttemptsOverTime([]);
            return;
        }
        
        // Group attempts by date
        const attemptsByDate = {};
        
        // Sort results by submission date
        const sortedResults = [...results].sort((a, b) => 
            new Date(a.submittedAt) - new Date(b.submittedAt)
        );
        
        sortedResults.forEach(result => {
            const date = new Date(result.submittedAt);
            const dateString = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            if (!attemptsByDate[dateString]) {
                attemptsByDate[dateString] = {
                    total: 0,
                    passed: 0
                };
            }
            
            attemptsByDate[dateString].total++;
            
            if (result.obtainedMarks >= (result.exam?.passingMarks || 0)) {
                attemptsByDate[dateString].passed++;
            }
        });
        
        // Convert to array format for charts
        const attemptsData = Object.keys(attemptsByDate).map(date => ({
            date,
            total: attemptsByDate[date].total,
            passed: attemptsByDate[date].passed
        }));
        
        setAttemptsOverTime(attemptsData);
    };
    
    const analyzeScoreDistribution = (results) => {
        if (!results || results.length === 0) {
            setScoreDistribution([]);
            return;
        }
        
        // Define score ranges
        const ranges = [
            { min: 0, max: 20, label: '0-20%' },
            { min: 21, max: 40, label: '21-40%' },
            { min: 41, max: 60, label: '41-60%' },
            { min: 61, max: 80, label: '61-80%' },
            { min: 81, max: 100, label: '81-100%' }
        ];
        
        // Initialize distribution counts
        const distribution = ranges.map(range => ({
            ...range,
            count: 0
        }));
        
        // Count scores in each range
        results.forEach(result => {
            const percentage = result.exam?.totalMarks 
                ? Math.round((result.obtainedMarks / result.exam.totalMarks) * 100) 
                : 0;
                
            for (const range of distribution) {
                if (percentage >= range.min && percentage <= range.max) {
                    range.count++;
                    break;
                }
            }
        });
        
        setScoreDistribution(distribution);
    };

    // Prepare pass rate gauge chart data
    const passRateChartData = {
        labels: ['Passed', 'Failed'],
        datasets: [
            {
                data: [stats.passRate, 100 - stats.passRate],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 99, 132, 0.8)'
                ],
                borderColor: [
                    'rgb(75, 192, 192)',
                    'rgb(255, 99, 132)'
                ],
                borderWidth: 1,
                cutout: '70%',
                borderRadius: 10,
            },
        ],
    };

    const passRateOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.label}: ${context.raw}%`;
                    }
                }
            }
        },
        animation: {
            animateRotate: true,
            animateScale: true
        }
    };

    // Subject performance chart data
    const subjectPerformanceChartData = {
        labels: subjectPerformance.map(item => item.subject),
        datasets: [
            {
                label: 'Pass Rate (%)',
                data: subjectPerformance.map(item => item.passRate),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1,
                borderRadius: 5
            },
            {
                label: 'Average Score (%)',
                data: subjectPerformance.map(item => item.averageScore),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1,
                borderRadius: 5
            }
        ]
    };

    const subjectPerformanceOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Subject Performance',
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

    // Attempts over time line chart
    const attemptsChartData = {
        labels: attemptsOverTime.map(item => item.date),
        datasets: [
            {
                label: 'Total Attempts',
                data: attemptsOverTime.map(item => item.total),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: 'rgb(54, 162, 235)',
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: 'Passed Attempts',
                data: attemptsOverTime.map(item => item.passed),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: 'rgb(75, 192, 192)',
                pointRadius: 4,
                pointHoverRadius: 6
            }
        ]
    };

    const attemptsChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Exam Attempts Over Time',
                font: {
                    size: 16
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Attempts'
                },
                ticks: {
                    precision: 0
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    // Score distribution chart
    const scoreDistributionData = {
        labels: scoreDistribution.map(item => item.label),
        datasets: [
            {
                data: scoreDistribution.map(item => item.count),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 205, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(54, 162, 235, 0.7)'
                ],
                borderColor: [
                    'rgb(255, 99, 132)',
                    'rgb(255, 159, 64)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(54, 162, 235)'
                ],
                borderWidth: 1
            }
        ]
    };

    const scoreDistributionOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
            title: {
                display: true,
                text: 'Score Distribution',
                font: {
                    size: 16
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.label}: ${context.raw} students`;
                    }
                }
            }
        },
        animation: {
            animateRotate: true,
            animateScale: true
        }
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

            {/* Charts Section - First Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Pass Rate Gauge */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Pass Rate</h3>
                    <div className="h-72 relative">
                        <Doughnut data={passRateChartData} options={passRateOptions} />
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-4xl font-bold text-gray-800">{stats.passRate}%</span>
                            <span className="text-sm text-gray-500">Pass Rate</span>
                        </div>
                    </div>
                </div>

                {/* Subject Performance Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
                    <div className="h-72">
                        {subjectPerformance.length > 0 ? (
                            <Bar data={subjectPerformanceChartData} options={subjectPerformanceOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                No subject data available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Section - Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Total Attempts Over Time Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Attempts Over Time</h3>
                    <div className="h-72">
                        {attemptsOverTime.length > 0 ? (
                            <Line data={attemptsChartData} options={attemptsChartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                No attempts data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Score Distribution Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
                    <div className="h-72">
                        {scoreDistribution.length > 0 ? (
                            <PolarArea data={scoreDistributionData} options={scoreDistributionOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                No score data available
                            </div>
                        )}
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