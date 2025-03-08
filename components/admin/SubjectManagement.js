import { useState, useEffect } from 'react';
import { ConfirmationModal } from './ConfirmationModal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function SubjectManagement() {
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [modalAction, setModalAction] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/subjects`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setSubjects(data.data);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const url = isEditing 
                ? `${API_BASE_URL}/admin/subjects/${selectedSubject._id}`
                : `${API_BASE_URL}/admin/subjects`;
            
            const response = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            fetchSubjects();
            resetForm();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleEdit = (subject) => {
        setSelectedSubject(subject);
        setFormData({
            name: subject.name,
            description: subject.description || ''
        });
        setIsEditing(true);
    };

    const handleDelete = (subject) => {
        setSelectedSubject(subject);
        setModalAction('delete');
        setShowModal(true);
    };

    const handleModalConfirm = async () => {
        if (modalAction === 'delete') {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/subjects/${selectedSubject._id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message);
                }

                fetchSubjects();
            } catch (error) {
                setError(error.message);
            }
        }
        setShowModal(false);
    };

    const resetForm = () => {
        setFormData({ name: '', description: '' });
        setSelectedSubject(null);
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Form Section */}
            <div className="mb-8 bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {isEditing ? 'Edit Subject' : 'Add New Subject'}
                </h2>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-black">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Subject Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block text-black w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        {isEditing && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {isEditing ? 'Update Subject' : 'Add Subject'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Subjects List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="sm:flex sm:items-center p-6">
                    <div className="sm:flex-auto">
                        <h2 className="text-xl font-semibold text-gray-900">Subjects</h2>
                        <p className="mt-2 text-sm text-gray-700">
                            A list of all subjects available in the system
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {subjects.map((subject) => (
                                <tr key={subject._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {subject.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {subject.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(subject)}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(subject)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {subjects.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                                        No subjects found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleModalConfirm}
                title="Delete Subject"
                message="Are you sure you want to delete this subject? This action cannot be undone."
                confirmText="Delete"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />
        </div>
    );
} 