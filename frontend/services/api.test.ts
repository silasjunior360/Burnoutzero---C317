import { expect, test, describe, beforeEach, vi } from 'vitest';
import axios from 'axios';
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
    expect(api.defaults.baseURL).toBe('http://localhost:8000/api/');
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

  test('should refresh expired token and retry protected requests once', async () => {
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', 'refresh-token');

    const refreshResponse = { data: { access: 'new-access-token' } };
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue(refreshResponse as never);
    const retryAdapter = vi.fn().mockResolvedValue({ data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config: {} });

    const responseInterceptorManager = api.interceptors.response as unknown as InterceptorManager & {
      handlers: Array<{
        fulfilled?: (value: unknown) => unknown;
        rejected?: (error: unknown) => unknown;
      } | null>;
    };

    const firstResponseHandler = responseInterceptorManager.handlers[0];
    expect(firstResponseHandler?.rejected).toBeDefined();

    if (firstResponseHandler?.rejected) {
      await firstResponseHandler.rejected({
        config: { url: '/manager/sectors/', headers: {}, adapter: retryAdapter },
        response: { status: 401 },
      });
    }

    expect(postSpy).toHaveBeenCalledWith('http://localhost:8000/api/auth/refresh/', { refresh: 'refresh-token' });
    expect(localStorage.getItem('access_token')).toBe('new-access-token');
    expect(retryAdapter).toHaveBeenCalled();

    postSpy.mockRestore();
  });
});
