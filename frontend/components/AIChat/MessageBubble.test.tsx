import { render, screen } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import MessageBubble from '../components/AIChat/MessageBubble';


describe('MessageBubble Component', () => {
  test('renders user message correctly with plain text style', () => {
    render(<MessageBubble content="Olá, esta é uma mensagem do usuário" isUser={true} />);
    expect(screen.getByText('Olá, esta é uma mensagem do usuário')).toBeInTheDocument();
    expect(screen.queryByText('IA')).not.toBeInTheDocument();
  });

  test('renders assistant message correctly with avatar and markdown formatting', () => {
    render(<MessageBubble content="Olá, sou a **inteligência**" isUser={false} />);
    expect(screen.getByText('IA')).toBeInTheDocument();
    const boldText = screen.getByText('inteligência', { selector: 'strong' });
    expect(boldText).toBeInTheDocument();
  });
});
