// API Configuration
// ⚠️ IMPORTANT: Select the correct URL for your testing environment:

// 1. For Android Emulator (with adb reverse):
// const API_URL = 'http://localhost:3000/api';

// 2. For Physical Device (Your Local IP):
const API_URL = 'http://192.168.70.149:3000/api';

// 3. For Browser / Web Testing:
// const API_URL = 'http://localhost:3000/api';

export const api = {
    // Auth
    login: async (username: string, password: string) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        return response.json();
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
            throw new Error('Failed to create report');
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
    }
};
