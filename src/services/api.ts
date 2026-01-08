// API Configuration
// ⚠️ IMPORTANT: Select the correct URL for your testing environment:

// 1. For Android Emulator (with adb reverse):
// export const API_URL = 'http://10.0.2.2:3001/api';

// 2. For Physical Device (Your Local IP - find with ipconfig):
// const API_URL = 'http://192.168.70.149:3001/api';

// 3. For Production (Vercel):
export const API_URL = 'https://pathxpress-app-driver.vercel.app/api';

// 4. For Local Development:
// const API_URL = 'http://localhost:3001/api';

export const api = {
    // Auth
    login: async (username: string, password: string) => {
        const url = `${API_URL}/auth/login`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Login failed');
            }

            return response.json();
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Routes
    getRoute: async (routeId: string, token: string) => {
        const response = await fetch(`${API_URL}/routes/${routeId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch route');
        }

        return response.json();
    },

    finishRoute: async (routeId: string, token: string) => {
        const url = `${API_URL}/routes/${routeId}/status`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'COMPLETED' })
        });

        if (!response.ok) {
            throw new Error('Failed to finish route');
        }

        return response.json();
    },

    // Deliveries
    updateDeliveryStatus: async (
        deliveryId: number,
        status: string,
        token: string,
        photoBase64?: string,
        notes?: string
    ) => {
        const response = await fetch(`${API_URL}/deliveries/${deliveryId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, photoBase64, notes })
        });

        if (!response.ok) {
            throw new Error('Failed to update delivery');
        }

        return response.json();
    },

    // Reports
    createReport: async (reportData: any, token: string) => {
        const response = await fetch(`${API_URL}/reports`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.error || 'Failed to create report');
            } catch {
                throw new Error(errorText || 'Failed to create report');
            }
        }

        return response.json();
    },

    // Driver Profile
    getDriverProfile: async (token: string) => {
        const response = await fetch(`${API_URL}/driver/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        return response.json();
    },

    // Generic helpers
    post: async (endpoint: string, data: any) => {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No auth token');

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Request failed');
        }
        return response.json();
    }
};
