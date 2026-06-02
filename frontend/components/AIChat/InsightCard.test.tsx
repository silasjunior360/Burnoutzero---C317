import { render, screen } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import InsightCard from '../components/AIChat/InsightCard';


describe('InsightCard Component', () => {
  test('renders insight details text', () => {
    render(<InsightCard />);
    expect(screen.getByText('Insight Details')).toBeInTheDocument();
  });
});
