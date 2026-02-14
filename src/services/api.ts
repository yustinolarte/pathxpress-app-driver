// API Configuration
// ⚠️ IMPORTANT: Select the correct URL for your testing environment:

// 1. For Android Emulator (with adb reverse):
// export const API_URL = 'http://10.0.2.2:3000/api';

// 2. For Physical Device (Your Local IP - find with ipconfig):
// const API_URL = 'http://192.168.70.149:3000/api';

// 3. For Production (PathXpress Portal):
// Ensure .env VITE_API_URL is set to 'https://pathxpress.net/api'
export const API_URL = import.meta.env.VITE_API_URL || 'https://pathxpress.net/api';

import { networkService } from './network';
import { offlineQueue } from './offlineQueue';

export const api = {
    // Auth
    login: async (username: string, password: string): Promise<any> => {
        if (!networkService.isOnline()) {
            throw new Error('No internet connection. Cannot login.');
        }

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Login failed');
        }
        return response.json();
    },

    getDriverProfile: async (token: string) => {
        if (!networkService.isOnline()) {
            throw new Error('No internet connection');
        }
        // Endpoint: /api/driver/profile
        const response = await fetch(`${API_URL}/driver/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        return response.json();
    },

    // Routes
    getRoute: async (routeId: string, token: string) => {
        if (!networkService.isOnline()) {
            throw new Error('No internet connection');
        }
        const response = await fetch(`${API_URL}/routes/${routeId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch route');
        return response.json();
    },

    // Claim Route (Scanning QR)
    claimRoute: async (routeId: string, token: string) => {
        if (!networkService.isOnline()) {
            throw new Error('No internet connection');
        }

        // Endpoint: POST /api/routes/:id/claim
        // Backend expects POST, not PUT.
        console.log(`Claiming route: ${API_URL}/routes/${routeId}/claim`);

        const response = await fetch(`${API_URL}/routes/${routeId}/claim`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const text = await response.text();

        if (!response.ok) {
            let errorMessage = 'Failed to claim route';
            try {
                const err = JSON.parse(text);
                errorMessage = err.message || err.error || errorMessage;
            } catch {
                // If parse fails, it's likely HTML (404/500)
                console.error('API Error (Raw):', text);
                errorMessage = `Server Error (${response.status}): Check API URL or Backend Logs.`;
            }
            throw new Error(errorMessage);
        }

        try {
            return JSON.parse(text);
        } catch {
            return { success: true }; // Fallback if empty success response
        }
    },

    finishRoute: async (routeId: string, token: string) => {
        if (!networkService.isOnline()) {
            offlineQueue.addToQueue('FINISH_ROUTE', { routeId });
            return { status: 'COMPLETED', offline: true };
        }

        try {
            const url = `${API_URL}/routes/${routeId}/status`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'COMPLETED' })
            });

            if (!response.ok) throw new Error('Failed to finish route');
            return response.json();
        } catch (error) {
            console.warn('Network error finishing route, queuing offline', error);
            offlineQueue.addToQueue('FINISH_ROUTE', { routeId });
            return { status: 'COMPLETED', offline: true };
        }
    },

    updateDeliveryStatus: async (
        deliveryId: number,
        status: string,
        token: string,
        photoBase64?: string,
        notes?: string
    ) => {
        if (!networkService.isOnline()) {
            offlineQueue.addToQueue('UPDATE_DELIVERY', { deliveryId, status, photoBase64, notes });
            return { success: true, offline: true };
        }

        try {
            const response = await fetch(`${API_URL}/deliveries/${deliveryId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, photoBase64, notes })
            });

            if (!response.ok) throw new Error('Failed to update delivery');
            return response.json();
        } catch (error) {
            console.warn('Network error updating delivery, queuing offline', error);
            offlineQueue.addToQueue('UPDATE_DELIVERY', { deliveryId, status, photoBase64, notes });
            return { success: true, offline: true };
        }
    },

    createReport: async (reportData: any, token: string) => {
        if (!networkService.isOnline()) {
            offlineQueue.addToQueue('CREATE_REPORT', { reportData });
            return { success: true, offline: true };
        }

        try {
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
                throw new Error(errorText || 'Failed to create report');
            }
            return response.json();
        } catch (error) {
            console.warn('Network error creating report, queuing offline', error);
            offlineQueue.addToQueue('CREATE_REPORT', { reportData });
            return { success: true, offline: true };
        }
    },

    updateStopStatus: async (stopId: number, status: string, token: string, photo?: string, notes?: string, collectedAmount?: number) => {
        if (!networkService.isOnline()) {
            offlineQueue.addToQueue('UPDATE_STOP', { stopId, status, photo, notes, collectedAmount });
            return { success: true, offline: true };
        }

        try {
            const response = await fetch(`${API_URL}/stops/${stopId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status,
                    photoBase64: photo,
                    notes,
                    collectedAmount
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || 'Failed to update stop status');
            }
            return response.json();
        } catch (error) {
            console.warn('Network error updating stop, queuing offline', error);
            offlineQueue.addToQueue('UPDATE_STOP', { stopId, status, photo, notes, collectedAmount });
            return { success: true, offline: true };
        }
    },

    // Wallet Summary
    getWalletSummary: async (token: string) => {
        if (!networkService.isOnline()) return { total_cod: 0, pending_deposit: 0 };
        try {
            const response = await fetch(`${API_URL}/wallet`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return { total_cod: 0, pending_deposit: 0 };
            return response.json();
        } catch {
            return { total_cod: 0, pending_deposit: 0 };
        }
    }
};
