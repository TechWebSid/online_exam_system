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

export async function registerFace(imageData) {
    try {
        console.log('Registering face, image data length:', imageData.length);
        
        const response = await fetch(`${API_BASE_URL}/face-auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ image: imageData }),
        });

        const data = await response.json();
        console.log('Face registration response:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Face registration failed');
        }

        return data;
    } catch (error) {
        console.error('Error in registerFace:', error);
        throw new Error(error.message || 'Face registration failed');
    }
}

export async function verifyFace(imageData, userId = null) {
    try {
        console.log('Verifying face, image data length:', imageData.length);
        console.log('UserId for verification:', userId);
        
        const body = { image: imageData };
        if (userId) {
            body.userId = userId;
        }

        const response = await fetch(`${API_BASE_URL}/face-auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        console.log('Face verification API response:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Face verification failed');
        }

        return data;
    } catch (error) {
        console.error('Error in verifyFace:', error);
        throw new Error(error.message || 'Face verification failed');
    }
}

export async function monitorFace(imageData) {
    try {
        const response = await fetch(`${API_BASE_URL}/face-auth/monitor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ image: imageData }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Face monitoring failed');
        }

        return data;
    } catch (error) {
        throw new Error(error.message || 'Face monitoring failed');
    }
}

export async function getFaceAuthStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/face-auth/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get face auth status');
        }

        return data;
    } catch (error) {
        throw new Error(error.message || 'Failed to get face auth status');
    }
} 