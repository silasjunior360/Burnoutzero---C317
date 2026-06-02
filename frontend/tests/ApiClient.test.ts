import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../services/api';

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds the bearer token to authenticated requests', async () => {
    localStorage.setItem('access_token', 'test-token');

    const previousAdapter = api.defaults.adapter;
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => ({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));

    api.defaults.adapter = adapter as never;

    try {
      await api.get('/manager/sectors/');

      expect(adapter).toHaveBeenCalledTimes(1);

      const requestConfig = adapter.mock.calls[0][0];
      const headers = requestConfig.headers as {
        get?: (name: string) => string | undefined;
        Authorization?: string;
      };

      expect(headers.get?.('Authorization') ?? headers.Authorization).toBe('Bearer test-token');
    } finally {
      api.defaults.adapter = previousAdapter;
    }
  });
});