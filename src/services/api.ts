// API Configuration
// ⚠️ IMPORTANT: Select the correct URL for your testing environment:

// 3. For Production (PathXpress Portal):
// Ensure .env VITE_API_URL is set to 'https://pathxpress.net/api/driver'
export const API_URL = import.meta.env.VITE_API_URL || 'https://pathxpress.net/api/driver';

// Helper to get the base API URL (removing /driver if present) for non-driver routes
const getBaseApiUrl = () => {
    return API_URL.replace(/\/driver$/, '');
};

import { networkService } from './network';
import { offlineQueue } from './offlineQueue';

export const api = {
    // Auth
    login: async (username: string, password: string): Promise<any> => {
        if (!networkService.isOnline()) {
            throw new Error('No internet connection. Cannot login.');
        }

        // Login uses .../api/driver/auth/login
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
        // Endpoint: .../api/driver/profile
        const response = await fetch(`${API_URL}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        return response.json();
    },

    // Routes - Helper for Wallet
    getDriverRoutes: async (token: string) => {
        if (!networkService.isOnline()) return [];
        try {
            const baseUrl = getBaseApiUrl();
            const response = await fetch(`${baseUrl}/routes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return [];
            return response.json();
        } catch {
            return [];
        }
    },

    // Routes
    getRoute: async (routeId: string, token: string) => {
        if (!networkService.isOnline()) {
            throw new Error('No internet connection');
        }
        // Routes are under .../api/routes
        const baseUrl = getBaseApiUrl();
        const response = await fetch(`${baseUrl}/routes/${routeId}`, {
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

        // Backend expects POST /api/routes/:id/claim
        const baseUrl = getBaseApiUrl();
        const url = `${baseUrl}/routes/${routeId}/claim`;

        console.log(`Claiming route at: ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const text = await response.text();

        if (!response.ok) {
            let errorMessage = `Request failed: ${response.status}`;
            try {
                const err = JSON.parse(text);
                errorMessage = err.message || err.error || errorMessage;
            } catch {
                errorMessage = `Server Error (${response.status}): ${text.substring(0, 100)}`;
            }
            throw new Error(errorMessage);
        }

        try {
            return JSON.parse(text);
        } catch {
            return { success: true };
        }
    },

    finishRoute: async (routeId: string, token: string) => {
        if (!networkService.isOnline()) {
            offlineQueue.addToQueue('FINISH_ROUTE', { routeId });
            return { status: 'COMPLETED', offline: true };
        }

        try {
            const baseUrl = getBaseApiUrl();
            const url = `${baseUrl}/routes/${routeId}/status`;
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
            // Deliveries likely under .../api/deliveries
            const baseUrl = getBaseApiUrl();
            const response = await fetch(`${baseUrl}/deliveries/${deliveryId}/status`, {
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
            const baseUrl = getBaseApiUrl();
            const response = await fetch(`${baseUrl}/reports`, {
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
            const baseUrl = getBaseApiUrl();
            const response = await fetch(`${baseUrl}/stops/${stopId}/status`, {
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

    // Wallet Summary - Calculated locally to avoid 404
    getWalletSummary: async (token: string) => {
        const emptySummary = {
            totalExpected: 0,
            totalCollected: 0,
            discrepancy: 0,
            orders: []
        };

        if (!networkService.isOnline()) return emptySummary;

        try {
            // First try fetching routes to calculate summary
            // (Since the wallet endpoint doesn't exist on backend)
            const baseUrl = getBaseApiUrl();
            const response = await fetch(`${baseUrl}/routes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => null);

            if (response && response.ok) {
                const routes = await response.json();

                let totalExpected = 0;
                let totalCollected = 0;
                let orders: any[] = [];

                if (Array.isArray(routes)) {
                    routes.forEach((r: any) => {
                        // Relaxed Logic: Include ALL routes returned by getDriverRoutes.
                        // We do NOT filter by date ("today") locally, because the driver
                        // might be working on a route created recently but not "today".
                        // Logic: IF it's in the list, count it.

                        if (r.deliveries) {
                            r.deliveries.forEach((d: any) => {
                                // Check if it's COD
                                const amount = Number(d.codAmount || 0);
                                if (amount > 0) {
                                    totalExpected += amount;
                                    const isDelivered = d.status === 'DELIVERED';
                                    const collected = isDelivered ? amount : 0;
                                    totalCollected += collected;

                                    orders.push({
                                        id: d.id,
                                        waybillNumber: d.trackingNumber || `ORD-${d.id}`,
                                        customerName: d.customerName || 'Unknown',
                                        expectedAmount: amount,
                                        collectedAmount: collected,
                                        status: d.status,
                                        isDelivered: isDelivered
                                    });
                                }
                            });
                        }
                    });
                }

                return {
                    totalExpected,
                    totalCollected,
                    discrepancy: 0,
                    orders
                };
            }
            // Fallback
            return emptySummary;

        } catch (e) {
            console.warn('Wallet calc error:', e);
            return emptySummary;
        }
    }
};
