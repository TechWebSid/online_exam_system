const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function loginUser(credentials) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        return data;
    } catch (error) {
        throw new Error(error.message || 'Login failed');
    }
}

export async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        return data;
    } catch (error) {
        throw new Error(error.message || 'Registration failed');
    }
}

export async function logoutUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Logout failed');
        }

        return data;
    } catch (error) {
        throw new Error(error.message || 'Logout failed');
    }
}

export async function getAllStudents(search = '') {
    try {
        const response = await fetch(
            `${API_BASE_URL}/admin/students${search ? `?search=${search}` : ''}`,
            {
                credentials: 'include',
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch students');
        }

        return data;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch students');
    }
}

export async function deleteStudent(studentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/students/${studentId}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete student');
        }

        return data;
    } catch (error) {
        throw new Error(error.message || 'Failed to delete student');
    }
}

export async function promoteToAdmin(studentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/students/${studentId}/promote`, {
            method: 'PATCH',
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to promote student');
        }

        return data;
    } catch (error) {
        throw new Error(error.message || 'Failed to promote student');
    }
} 