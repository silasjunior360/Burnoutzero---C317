import axios, { AxiosHeaders } from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: apiBaseUrl,
});

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${apiBaseUrl}auth/refresh/`, { refresh: refreshToken })
      .then((response) => {
        const nextAccessToken = response.data?.access;
        if (nextAccessToken) {
          localStorage.setItem('access_token', nextAccessToken);
          return nextAccessToken as string;
        }
        return null;
      })
      .catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !String(originalRequest.url || '').includes('/auth/login/') &&
      !String(originalRequest.url || '').includes('/auth/refresh/') &&
      !String(originalRequest.url || '').includes('/auth/register/')
    ) {
      originalRequest._retry = true;
      const nextAccessToken = await refreshAccessToken();

      if (nextAccessToken) {
        originalRequest.headers = AxiosHeaders.from(originalRequest.headers);
        originalRequest.headers.set('Authorization', `Bearer ${nextAccessToken}`);
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
