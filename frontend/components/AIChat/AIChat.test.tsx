import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import AIChat from './AIChat';
import { streamAIChat } from '../../services/aiApi';

vi.mock('../../services/aiApi', () => ({
  streamAIChat: vi.fn(),
}));

describe('AIChat Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  test('should render welcome message, text field and close button', () => {
    render(<AIChat onClose={mockOnClose} />);
    expect(screen.getByText(/Olá! Como você está se sentindo hoje?/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Digite sua mensagem/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Voltar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar/i })).toBeInTheDocument();
  });

  test('should call onClose when clicking Voltar button', () => {
    render(<AIChat onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Voltar/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('should send message and stream response chunks successfully', async () => {
    vi.mocked(streamAIChat).mockImplementation(
      async (_msg: string, _sessionId: string, onChunk: (text: string) => void) => {
        onChunk("Estou ");
        onChunk("aqui ");
        onChunk("ajudando.");
      }
    );

    render(<AIChat onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
    const sendButton = screen.getByRole('button', { name: /Enviar/i });

    fireEvent.change(input, { target: { value: 'Olá assistente' } });
    fireEvent.click(sendButton);

    expect(screen.getByText('Olá assistente')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Estou aqui ajudando.')).toBeInTheDocument();
    });

    expect(input).toHaveValue('');
  });

  test('should handle stream error gracefully by appending error text', async () => {
    vi.mocked(streamAIChat).mockRejectedValue(new Error("API Error"));

    render(<AIChat onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
    const sendButton = screen.getByRole('button', { name: /Enviar/i });

    fireEvent.change(input, { target: { value: 'Erro de teste' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Erro de conexão com o assistente/i)).toBeInTheDocument();
    });
  });

  test('should disable send button and not call streamAIChat when input is empty', () => {
    render(<AIChat onClose={mockOnClose} />);
    const sendButton = screen.getByRole('button', { name: /Enviar/i });
    expect(sendButton).toBeDisabled();
    expect(streamAIChat).not.toHaveBeenCalled();
  });
});
