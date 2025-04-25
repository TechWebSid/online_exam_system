'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_CHATBOT_URL || 'http://localhost:5002/api';

export default function FAQManagement() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newQuestion, setNewQuestion] = useState('');
    const [newAnswer, setNewAnswer] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editQuestion, setEditQuestion] = useState('');
    const [editAnswer, setEditAnswer] = useState('');
    const router = useRouter();

    // Fetch FAQs
    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/faq`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.success) {
                    setFaqs(data.data);
                } else {
                    setError(data.message || 'Failed to fetch FAQs');
                }
            } catch (error) {
                console.error('Error fetching FAQs:', error);
                setError('Failed to fetch FAQs. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchFAQs();
    }, []);

    // Add new FAQ
    const handleAddFAQ = async (e) => {
        e.preventDefault();
        
        if (!newQuestion.trim() || !newAnswer.trim()) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/faq`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    question: newQuestion,
                    answer: newAnswer
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Refresh FAQs
                const updatedFaqs = [...faqs, { question: newQuestion, answer: newAnswer }];
                setFaqs(updatedFaqs);
                setNewQuestion('');
                setNewAnswer('');
            } else {
                setError(data.message || 'Failed to add FAQ');
            }
        } catch (error) {
            console.error('Error adding FAQ:', error);
            setError('Failed to add FAQ. Please try again later.');
        }
    };

    // Delete FAQ
    const handleDeleteFAQ = async (id) => {
        if (!confirm('Are you sure you want to delete this FAQ?')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/faq/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Remove deleted FAQ from state
                const updatedFaqs = faqs.filter(faq => faq._id !== id);
                setFaqs(updatedFaqs);
            } else {
                setError(data.message || 'Failed to delete FAQ');
            }
        } catch (error) {
            console.error('Error deleting FAQ:', error);
            setError('Failed to delete FAQ. Please try again later.');
        }
    };

    // Start editing FAQ
    const handleStartEdit = (faq) => {
        setEditingId(faq._id);
        setEditQuestion(faq.question);
        setEditAnswer(faq.answer);
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditQuestion('');
        setEditAnswer('');
    };

    // Update FAQ
    const handleUpdateFAQ = async (id) => {
        if (!editQuestion.trim() || !editAnswer.trim()) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/faq/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    question: editQuestion,
                    answer: editAnswer
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Update FAQ in state
                const updatedFaqs = faqs.map(faq => 
                    faq._id === id 
                        ? { ...faq, question: editQuestion, answer: editAnswer } 
                        : faq
                );
                setFaqs(updatedFaqs);
                setEditingId(null);
                setEditQuestion('');
                setEditAnswer('');
            } else {
                setError(data.message || 'Failed to update FAQ');
            }
        } catch (error) {
            console.error('Error updating FAQ:', error);
            setError('Failed to update FAQ. Please try again later.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">FAQ Management</h1>
                    <button
                        onClick={() => router.push('/admin-dashboard')}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                        Back to Dashboard
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {/* Add new FAQ form */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New FAQ</h2>
                    <form onSubmit={handleAddFAQ}>
                        <div className="mb-4">
                            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
                                Question
                            </label>
                            <input
                                type="text"
                                id="question"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter question"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
                                Answer
                            </label>
                            <textarea
                                id="answer"
                                value={newAnswer}
                                onChange={(e) => setNewAnswer(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter answer"
                                rows="3"
                                required
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Add FAQ
                        </button>
                    </form>
                </div>

                {/* FAQ list */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing FAQs</h2>
                    
                    {faqs.length === 0 ? (
                        <p className="text-gray-500">No FAQs found. Add some using the form above.</p>
                    ) : (
                        <div className="space-y-6">
                            {faqs.map((faq) => (
                                <div key={faq._id} className="border border-gray-200 rounded-md p-4">
                                    {editingId === faq._id ? (
                                        // Edit mode
                                        <div>
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Question
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editQuestion}
                                                    onChange={(e) => setEditQuestion(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Answer
                                                </label>
                                                <textarea
                                                    value={editAnswer}
                                                    onChange={(e) => setEditAnswer(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    rows="3"
                                                    required
                                                ></textarea>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleUpdateFAQ(faq._id)}
                                                    className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View mode
                                        <div>
                                            <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                                            <p className="text-gray-600 mb-4">{faq.answer}</p>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleStartEdit(faq)}
                                                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFAQ(faq._id)}
                                                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 