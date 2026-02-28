/**
 * Generation Log API — /generation-log/*
 *
 * Key concept: trigger() returns immediately (202-like pattern).
 * The batch job runs in background. Use pollStatus() to track progress.
 *
 * pollStatus() returns a stopPolling function.
 * ALWAYS call stopPolling in useEffect cleanup to prevent memory leaks.
 */
import api from './api';

const generationLogService = {
    /**
     * POST /generation-log → 201
     * Triggers background batch job. Returns immediately.
     * @param {{ template_id: string, google_sheet_url: string, drive_folder_id?: string }} data
     * google_sheet_url must match: https://docs.google.com/spreadsheets/d/{id}/...
     * drive_folder_id is optional — if omitted, PDFs upload to Drive root
     * @returns {Promise<{ id, template_id, status, total_records, processed, created_at, updated_at }>}
     */
    trigger: async (data) => {
        const response = await api.post('/generation-log', data);
        return response.data;
    },

    /** GET /generation-log → 200 */
    getAll: async () => {
        const response = await api.get('/generation-log');
        return response.data;
    },

    /** GET /generation-log/:id → 200 */
    getById: async (logId) => {
        const response = await api.get(`/generation-log/${logId}`);
        return response.data;
    },

    /**
     * GET /generation-log/:id/status → 200 (Polling endpoint)
     * @returns {Promise<{ id, status, total_records, processed, progress_percent }>}
     * status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
     * progress_percent: 0.0 – 100.0 (computed by backend)
     */
    getStatus: async (logId) => {
        const response = await api.get(`/generation-log/${logId}/status`);
        return response.data;
    },

    /** GET /generation-log/:id/assets → 200 [ GeneratedAssetResponse ] */
    getAssets: async (logId) => {
        const response = await api.get(`/generation-log/${logId}/assets`);
        return response.data;
    },

    /**
     * Poll /generation-log/:id/status every intervalMs until COMPLETED or FAILED.
     *
     * @param {string} logId - UUID of the generation log
     * @param {function} onUpdate - callback({ id, status, total_records, processed, progress_percent })
     * @param {number} intervalMs - polling interval in ms (default: 2500)
     * @returns {function} stopPolling — call this in useEffect cleanup:
     *   useEffect(() => {
     *       const stop = generationLogService.pollStatus(logId, onUpdate);
     *       return () => stop(); // ← cleanup on unmount
     *   }, [logId]);
     */
    pollStatus: (logId, onUpdate, intervalMs = 2500) => {
        const TERMINAL_STATUSES = ['COMPLETED', 'FAILED'];
        const intervalId = setInterval(async () => {
            try {
                const status = await generationLogService.getStatus(logId);
                onUpdate(status);
                if (TERMINAL_STATUSES.includes(status.status)) {
                    clearInterval(intervalId);
                }
            } catch (error) {
                console.error('[pollStatus] error:', error);
                clearInterval(intervalId);
            }
        }, intervalMs);
        return () => clearInterval(intervalId);
    },
};

export default generationLogService;
