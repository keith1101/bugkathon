/**
 * Templates API — /templates/*
 * NOTE: variables field is returned as array of strings: ["participant_name", "event_date"]
 * (Backend's @field_validator parses JSON string → list automatically)
 */
import api from './api';

const templateService = {
    /** GET /templates → 200 [ TemplateResponse ] */
    getAll: async () => {
        const response = await api.get('/templates');
        return response.data;
    },

    /** GET /templates/:id → 200 TemplateResponse */
    getById: async (templateId) => {
        const response = await api.get(`/templates/${templateId}`);
        return response.data;
    },

    /**
     * POST /templates → 201
     * @param {{ event_id: string, name: string, svg_content: string, variables: string[] }} data
     */
    create: async (data) => {
        const response = await api.post('/templates', data);
        return response.data;
    },

    /**
     * PUT /templates/:id → 200
     * @param {string} templateId
     * @param {{ name?: string, svg_content?: string, variables?: string[] }} data
     */
    update: async (templateId, data) => {
        const response = await api.put(`/templates/${templateId}`, data);
        return response.data;
    },

    /** DELETE /templates/:id → 204 No Content */
    delete: async (templateId) => {
        await api.delete(`/templates/${templateId}`);
    },

    /**
     * POST /templates/:id/preview → 200 { svg_string: string }
     * @param {string} templateId
     * @param {Record<string, string>} sampleData
     * e.g. { participant_name: "Nguyễn Văn A", event_date: "2026-02-28" }
     * @returns {Promise<{ svg_string: string }>}
     */
    preview: async (templateId, sampleData) => {
        const response = await api.post(`/templates/${templateId}/preview`, {
            sample_data: sampleData,
        });
        return response.data;
    },
};

export default templateService;
