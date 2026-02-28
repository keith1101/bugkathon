/**
 * Events API — /events/*
 * All endpoints require Bearer token (handled by api.js interceptor)
 */
import api from './api';

const eventService = {
    /** GET /events → 200 [ EventResponse ] */
    getAll: async () => {
        const response = await api.get('/events');
        return response.data;
    },

    /** GET /events/:id → 200 EventResponse */
    getById: async (eventId) => {
        const response = await api.get(`/events/${eventId}`);
        return response.data;
    },

    /**
     * POST /events → 201
     * @param {{ name: string, event_date: string }} data
     * event_date format: "YYYY-MM-DD"
     */
    create: async (data) => {
        const response = await api.post('/events', data);
        return response.data;
    },

    /**
     * PUT /events/:id → 200
     * @param {string} eventId
     * @param {{ name?: string, event_date?: string }} data
     */
    update: async (eventId, data) => {
        const response = await api.put(`/events/${eventId}`, data);
        return response.data;
    },

    /** DELETE /events/:id → 204 No Content */
    delete: async (eventId) => {
        await api.delete(`/events/${eventId}`);
    },

    /** GET /events/:id/templates → 200 [ TemplateResponse ] */
    getTemplates: async (eventId) => {
        const response = await api.get(`/events/${eventId}/templates`);
        return response.data;
    },
};

export default eventService;
