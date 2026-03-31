import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      } else if (status === 403) {
        // Forbidden
        console.error('Access forbidden:', data.message);
      } else if (status === 404) {
        console.error('Resource not found:', data.message);
      } else if (status >= 500) {
        console.error('Server error:', data.message);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error - no response received');
    } else {
      // Error in request setup
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const studentAPI = {
  uploadCSV: (formData) => api.post('/students/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getBatches: () => api.get('/students/batches'),
  getMyTeam: () => api.get('/students/my-team'),
  getMySubmissions: () => api.get('/students/my-submissions'),
  getTeamPhases: () => api.get('/students/team-phases'),
};

export const draftAPI = {
  createCommit: (data) => api.post('/drafts', data),
  getTeamVelocity: (teamId, phaseId) => api.get(`/teams/${teamId}/velocity/${phaseId}`),
};

export const submissionAPI = {
  submit: (data) => api.post('/submissions', data),
  getByPhase: (phaseId) => api.get(`/submissions/phase/${phaseId}`),
  getById: (submissionId) => api.get(`/submissions/${submissionId}`),
};

export const tutorAPI = {
  getOverview: () => api.get('/tutor/overview'),
  getPhases: () => api.get('/tutor/phases'),
  createPhase: (data) => api.post('/tutor/phases', data),
  getTeams: () => api.get('/tutor/teams'),
  getBatches: () => api.get('/tutor/batches'),
  createBatch: (data) => api.post('/tutor/batches', data),
  getPhaseSubmissions: (phaseId) => api.get(`/tutor/phases/${phaseId}/submissions`),
  deletePhase: (phaseId) => api.delete(`/tutor/phases/${phaseId}`),
  gradeSubmission: (submissionId, data) => api.put(`/tutor/submissions/${submissionId}/grade`, data)
};

export default api;
