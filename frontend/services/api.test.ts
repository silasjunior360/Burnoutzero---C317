import { expect, test, describe, beforeEach } from 'vitest';
import api from './api';
import type { InternalAxiosRequestConfig, AxiosRequestHeaders } from 'axios';

type RequestInterceptor = {
  fulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
  rejected?: (error: unknown) => unknown;
};

type InterceptorManager = {
  handlers: (RequestInterceptor | null)[];
};

describe('API Axios Client Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should create axios instance with default baseURL', () => {
    expect(api.defaults.baseURL).toBe('http://localhost:8080/api/');
  });

  test('should inject Bearer token into headers if access_token exists in localStorage', async () => {
    localStorage.setItem('access_token', 'my-mock-jwt-token');

    const interceptorManager = api.interceptors.request as unknown as InterceptorManager;
    const firstHandler = interceptorManager.handlers[0];
    expect(firstHandler).not.toBeNull();

    if (firstHandler) {
      const initialConfig = {
        headers: {} as unknown as AxiosRequestHeaders,
      } as InternalAxiosRequestConfig;

      const modifiedConfig = await firstHandler.fulfilled(initialConfig);
      expect(modifiedConfig.headers.Authorization).toBe('Bearer my-mock-jwt-token');
    }
  });

  test('should NOT inject Bearer token if access_token is missing in localStorage', async () => {
    const interceptorManager = api.interceptors.request as unknown as InterceptorManager;
    const firstHandler = interceptorManager.handlers[0];
    expect(firstHandler).not.toBeNull();

    if (firstHandler) {
      const initialConfig = {
        headers: {} as unknown as AxiosRequestHeaders,
      } as InternalAxiosRequestConfig;

      const modifiedConfig = await firstHandler.fulfilled(initialConfig);
      expect(modifiedConfig.headers.Authorization).toBeUndefined();
    }
  });
});
