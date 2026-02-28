/**
 * Generated Assets API — /generated-assets/*
 * email_status values: "PENDING" | "SENT" | "FAILED"
 * resendEmail() only works for assets with email_status === "FAILED"
 */
import api from './api';

const generatedAssetService = {
    /** GET /generated-assets → 200 [ GeneratedAssetResponse ] */
    getAll: async () => {
        const response = await api.get('/generated-assets');
        return response.data;
    },

    /** GET /generated-assets/:id → 200 GeneratedAssetResponse */
    getById: async (assetId) => {
        const response = await api.get(`/generated-assets/${assetId}`);
        return response.data;
    },

    /**
     * POST /generated-assets/:id/resend-email → 200
     * Only works if asset.email_status === "FAILED"
     * Backend returns 400 if email_status !== "FAILED"
     * @returns {Promise<GeneratedAssetResponse>} with updated email_status
     */
    resendEmail: async (assetId) => {
        const response = await api.post(`/generated-assets/${assetId}/resend-email`);
        return response.data;
    },
};

export default generatedAssetService;
