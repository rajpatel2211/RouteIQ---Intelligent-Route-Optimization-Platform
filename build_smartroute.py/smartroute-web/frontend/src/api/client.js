import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (username, password) => {
    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);
    return api.post('/api/auth/login', form);
  },
  me: () => api.get('/api/auth/me'),
};

export const metersAPI = {
  list: () => api.get('/api/meters/'),
  create: (data) => api.post('/api/meters/', data),
  bulk: (data) => api.post('/api/meters/bulk', data),
  delete: (id) => api.delete('/api/meters/' + id),
};

export const routesAPI = {
  optimize: (data) => api.post('/api/routes/optimize', data),
  list: () => api.get('/api/routes/'),
  get: (id) => api.get('/api/routes/' + id),
  delete: (id) => api.delete('/api/routes/' + id),
};

export const analyticsAPI = {
  summary: () => api.get('/api/analytics/summary'),
};

export default api;
