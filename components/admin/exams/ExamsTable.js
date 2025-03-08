'use client';

import { useState } from 'react';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import React from 'react';

export default function ExamsTable({ exams, onEdit, onDelete, onToggleStatus }) {
    const [expandedExam, setExpandedExam] = useState(null);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Questions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date Range
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {exams.map((exam) => (
                        <React.Fragment key={exam._id}>
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {exam.title}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {exam.subject?.name || 'No Subject'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {exam.duration} mins
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {exam.questions?.length || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            exam.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {exam.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                    <button
                                        onClick={() => setExpandedExam(expandedExam === exam._id ? null : exam._id)}
                                        className="text-blue-600 hover:text-blue-900"
                                    >
                                        <EyeIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => onEdit(exam)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(exam)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => onToggleStatus(exam._id)}
                                        className={`${
                                            exam.isActive
                                                ? 'text-red-600 hover:text-red-900'
                                                : 'text-green-600 hover:text-green-900'
                                        }`}
                                    >
                                        {exam.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                            {expandedExam === exam._id && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 bg-gray-50">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900">Instructions:</h4>
                                                <p className="mt-1 text-sm text-gray-600">{exam.instructions}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900">Questions:</h4>
                                                <div className="mt-2 space-y-4">
                                                    {exam.questions && exam.questions.map((question, qIndex) => (
                                                        <div key={question._id} className="bg-white p-4 rounded-lg shadow-sm">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {qIndex + 1}. {question.text}
                                                            </p>
                                                            <div className="mt-2 space-y-2">
                                                                {question.options && question.options.map((option, oIndex) => (
                                                                    <div
                                                                        key={oIndex}
                                                                        className={`text-sm ${
                                                                            option.isCorrect
                                                                                ? 'text-green-600 font-medium'
                                                                                : 'text-gray-600'
                                                                        }`}
                                                                    >
                                                                        {String.fromCharCode(65 + oIndex)}. {option.text}
                                                                        {option.isCorrect && ' ✓'}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {question.explanation && (
                                                                <p className="mt-2 text-sm text-gray-500">
                                                                    <span className="font-medium">Explanation:</span>{' '}
                                                                    {question.explanation}
                                                                </p>
                                                            )}
                                                            <p className="mt-2 text-sm text-gray-500">
                                                                <span className="font-medium">Marks:</span> {question.marks}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                                                <div>
                                                    <span className="font-medium">Passing Marks:</span>{' '}
                                                    {exam.passingMarks}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Total Marks:</span> {exam.totalMarks}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Attempt Limit:</span>{' '}
                                                    {exam.attemptLimit}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                    {exams.length === 0 && (
                        <tr>
                            <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                No exams found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
} 