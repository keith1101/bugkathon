/**
 * Auth API — /auth/*
 * login()           → BE sets HttpOnly cookies, returns UserResponse
 * logout()          → calls BE /logout to delete cookies, then redirects
 * isAuthenticated() → calls /me (async) to verify session
 */
import api from './api';

const authService = {
    /**
     * POST /auth/register → 201 UserResponse
     * @param {{ email: string, name: string, password: string, role?: string }} data
     * @returns {Promise<{ id, email, name, role, created_at }>}
     */
    register: async (data) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    /**
     * POST /auth/login → 200 UserResponse (cookies set by BE)
     * NO token in response body — cookies handled automatically by browser
     * @param {{ email: string, password: string }} data
     * @returns {Promise<{ id, email, name, role, created_at }>}
     */
    login: async (data) => {
        const response = await api.post('/auth/login', data);
        return response.data;
    },

    /**
     * POST /auth/logout → 200 (BE deletes cookies server-side)
     */
    logout: async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            window.location.href = '/login';
        }
    },

    /**
     * GET /auth/me → 200 UserResponse (requires valid cookie)
     * @returns {Promise<{ id, email, name, role, created_at }>}
     */
    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    /**
     * Check if user is authenticated by calling /me.
     * Async because cookie presence doesn't guarantee valid session.
     * @returns {Promise<boolean>}
     */
    isAuthenticated: async () => {
        try {
            await api.get('/auth/me');
            return true;
        } catch {
            return false;
        }
    },
};

export default authService;
