const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class AdminApiService {
    private token: string | null = null;

    constructor() {
        this.token = localStorage.getItem('admin_token');
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            (headers as any)['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE}/admin${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
        }

        return response.json();
    }

    // Auth
    async login(username: string, password: string) {
        const data = await this.request<{ token: string; admin: any }>('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        this.token = data.token;
        localStorage.setItem('admin_token', data.token);
        return data;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('admin_token');
    }

    isAuthenticated() {
        return !!this.token;
    }

    // Dashboard
    async getDashboard() {
        return this.request<any>('/dashboard');
    }

    // Drivers
    async getDrivers(params?: { status?: string; search?: string }) {
        const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
        return this.request<any[]>(`/drivers${query}`);
    }

    async getDriver(id: number) {
        return this.request<any>(`/drivers/${id}`);
    }

    async createDriver(data: any) {
        return this.request<any>('/drivers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateDriver(id: number, data: any) {
        return this.request<any>(`/drivers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteDriver(id: number) {
        return this.request<any>(`/drivers/${id}`, {
            method: 'DELETE',
        });
    }

    // Routes
    async getRoutes(params?: { status?: string; driverId?: number; date?: string }) {
        const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
        return this.request<any[]>(`/routes${query}`);
    }

    async getRouteDetails(routeId: string) {
        return this.request<any>(`/routes/${routeId}`);
    }

    async createRoute(data: any) {
        return this.request<any>('/routes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateRouteStatus(routeId: string, status: string) {
        return this.request<any>(`/routes/${routeId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    // Deliveries
    async getDeliveries(params?: { status?: string; routeId?: string; date?: string }) {
        const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
        return this.request<any[]>(`/deliveries${query}`);
    }

    // Reports
    async getReports(params?: { status?: string; driverId?: number }) {
        const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
        return this.request<any[]>(`/reports${query}`);
    }

    async updateReportStatus(id: number, status: string) {
        return this.request<any>(`/reports/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }
}

export const adminApi = new AdminApiService();
