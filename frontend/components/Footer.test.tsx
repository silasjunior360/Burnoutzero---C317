import { render, screen } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import Footer from '../components/Footer';


describe('Footer Component', () => {
  test('renders copyright and support text', () => {
    render(<Footer />);
    expect(screen.getByText(/2026 Burnoutzero/i)).toBeInTheDocument();
    expect(screen.getByText(/Apoio e monitoramento de saúde mental/i)).toBeInTheDocument();
  });
});
