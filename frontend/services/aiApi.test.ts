import { expect, test, describe, vi, beforeEach } from 'vitest';
import { streamAIChat } from './aiApi';

describe('AI Chat Streaming Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test('should parse Server-Sent Events successfully and call onChunk', async () => {
    const mockChunks = [
      'data: {"chunk": "Olá"}\n',
      'data: {"chunk": " mundo"}\n',
      'data: [DONE]\n',
    ];

    let chunkIdx = 0;
    const mockReader = {
      read: vi.fn(async () => {
        if (chunkIdx < mockChunks.length) {
          const val = mockChunks[chunkIdx++];
          return { done: false, value: new TextEncoder().encode(val) };
        }
        return { done: true, value: undefined };
      }),
    };

    const mockStream = {
      getReader: () => mockReader,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: mockStream,
    } as unknown as Response);

    vi.stubGlobal('fetch', mockFetch);

    const onChunkMock = vi.fn();
    await streamAIChat('Olá', 'session-123', onChunkMock);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ai/chat/'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ message: 'Olá', session_id: 'session-123' }),
      })
    );

    expect(onChunkMock).toHaveBeenCalledTimes(2);
    expect(onChunkMock).toHaveBeenNthCalledWith(1, 'Olá');
    expect(onChunkMock).toHaveBeenNthCalledWith(2, ' mundo');
  });

  test('should throw error if response is not ok', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
    } as unknown as Response);

    vi.stubGlobal('fetch', mockFetch);

    await expect(streamAIChat('Olá', 'session-123', vi.fn())).rejects.toThrow('Erro na requisição');
  });

  test('should throw error if response body is null', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: null,
    } as unknown as Response);

    vi.stubGlobal('fetch', mockFetch);

    await expect(streamAIChat('Olá', 'session-123', vi.fn())).rejects.toThrow('Sem corpo de resposta');
  });
});
