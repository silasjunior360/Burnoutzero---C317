import axios, {
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: apiBaseUrl,
});

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let isRefreshing = false;

let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const clearAuthStorage = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_role');
  localStorage.removeItem('burnout-zero-user');
  localStorage.removeItem('burnout-zero-current-user');
};

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
      return;
    }

    if (token) {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

const isAuthEndpoint = (url?: string) => {
  if (!url) return false;

  return (
    url.includes('/auth/login/') ||
    url.includes('/auth/refresh/') ||
    url.includes('/auth/register/')
  );
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');

  if (token && !isAuthEndpoint(config.url)) {
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      clearAuthStorage();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers = AxiosHeaders.from(originalRequest.headers);
            originalRequest.headers.set('Authorization', `Bearer ${token}`);
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const response = await axios.post(`${apiBaseUrl}auth/refresh/`, {
        refresh: refreshToken,
      });

      const newAccessToken = response.data?.access;

      if (!newAccessToken) {
        clearAuthStorage();
        return Promise.reject(error);
      }

      localStorage.setItem('access_token', newAccessToken);

      processQueue(null, newAccessToken);

      originalRequest.headers = AxiosHeaders.from(originalRequest.headers);
      originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthStorage();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;