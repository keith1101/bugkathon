import axios from 'axios';

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh',

  // Templates
  TEMPLATES: '/api/templates',
  TEMPLATE_BY_ID: (id) => `/api/templates/${id}`,

  // Generation
  GENERATE: '/api/generate',
  FETCH_SHEET_DATA: '/api/sheets/fetch',

  // User
  USER_PROFILE: '/api/user/profile',
};

// Helper function to build full URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// ============================================================================
// BACKEND API CONFIGURATION (PLACEHOLDER)
// ============================================================================
// This sets up the Axios instance for future backend communication.
// It is currently NOT actively replacing `localStorage` to keep the 
// standalone frontend working, but it is ready to be imported and used
// whenever the Node/Python backend is deployed.

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- REQUEST INTERCEPTOR ---
// Automatically attach the JWT auth token to every request if the user is logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token'); // Future token key
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- RESPONSE INTERCEPTOR ---
// Automatically intercept 401 Unauthorized errors (e.g. expired tokens)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request. Token may be expired.');
      // Future: Automatically log out the user or trigger token refresh
      // localStorage.removeItem('auth_token');
      // localStorage.removeItem('current_user');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// PLACEHOLDER ENDPOINT SERVICES
// Replace or adapt these wrappers when integrating the real backend.
// ============================================================================
export const AuthAPI = {
  login: (credentials) => api.post(API_ENDPOINTS.LOGIN, credentials),
  register: (userData) => api.post(API_ENDPOINTS.REGISTER, userData),
  getProfile: () => api.get(API_ENDPOINTS.USER_PROFILE),
  deleteAccount: () => api.delete(API_ENDPOINTS.USER_PROFILE),
  logout: () => api.post(API_ENDPOINTS.LOGOUT)
};

export const TemplatesAPI = {
  getAll: () => api.get(API_ENDPOINTS.TEMPLATES),
  getById: (id) => api.get(API_ENDPOINTS.TEMPLATE_BY_ID(id)),
  create: (templateData) => api.post(API_ENDPOINTS.TEMPLATES, templateData),
  update: (id, templateData) => api.put(API_ENDPOINTS.TEMPLATE_BY_ID(id), templateData),
  delete: (id) => api.delete(API_ENDPOINTS.TEMPLATE_BY_ID(id))
};

export default api;
