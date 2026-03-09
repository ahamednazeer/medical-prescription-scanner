const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
    private token: string | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('token');
        }
    }

    getToken(): string | null {
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('token');
        }
        return this.token;
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
        }
    }

    clearToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const headers: Record<string, string> = {
            ...(options.headers as Record<string, string> || {}),
        };

        if (this.getToken()) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Don't set Content-Type for FormData
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${res.status}`);
        }

        return res.json();
    }

    // Auth
    async register(data: { name: string; email: string; password: string; phone?: string }) {
        const result = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        this.setToken(result.access_token);
        return result;
    }

    async login(email: string, password: string) {
        const result = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.setToken(result.access_token);
        return result;
    }

    async getMe() {
        return this.request('/auth/me');
    }

    // Profile
    async getProfile() {
        return this.request('/users/profile');
    }

    async updateProfile(data: any) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Prescriptions
    async uploadPrescription(file: File) {
        const formData = new FormData();
        formData.append('image', file);
        return this.request('/prescriptions/upload', {
            method: 'POST',
            body: formData,
        });
    }

    async processPrescription(id: number) {
        return this.request(`/prescriptions/${id}/process`, { method: 'POST' });
    }

    async getPrescriptions() {
        return this.request('/prescriptions');
    }

    async getPrescription(id: number) {
        return this.request(`/prescriptions/${id}`);
    }

    async verifyPrescription(id: number, data: any) {
        return this.request(`/prescriptions/${id}/verify`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deletePrescription(id: number) {
        return this.request(`/prescriptions/${id}`, { method: 'DELETE' });
    }

    // Reminders
    async getReminders() {
        return this.request('/reminders');
    }

    async createReminder(data: any) {
        return this.request('/reminders', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async createRemindersFromPrescription(data: { prescriptionId: number; phone: string; medicines: any[] }) {
        return this.request('/reminders/from-prescription', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateReminder(id: number, data: any) {
        return this.request(`/reminders/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteReminder(id: number) {
        return this.request(`/reminders/${id}`, { method: 'DELETE' });
    }

    async triggerReminder(id: number) {
        return this.request(`/reminders/${id}/trigger`, { method: 'POST' });
    }

    async checkDrugInteractions(medicines: string[]) {
        return this.request('/drug-interactions/check', {
            method: 'POST',
            body: JSON.stringify({ medicines }),
        });
    }

    // Admin
    async getAdminStats() {
        return this.request('/admin/stats');
    }

    async getAdminUsers() {
        return this.request('/admin/users');
    }

    async getAdminPrescriptions() {
        return this.request('/admin/prescriptions');
    }

    getImageUrl(path: string) {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${API_BASE}/${path}`;
    }
}

export const api = new ApiClient();
