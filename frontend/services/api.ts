import axios, { AxiosHeaders } from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

export default api;
