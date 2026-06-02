import { render, screen } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BurnoutZeroLanding from './LandingPage';

describe('BurnoutZeroLanding Page', () => {
  const renderLanding = () =>
    render(
      <MemoryRouter>
        <BurnoutZeroLanding />
      </MemoryRouter>
    );

  test('should render the landing page headers', () => {
    renderLanding();
    expect(screen.getByText(/Transforme a saúde mental da sua empresa/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Uma plataforma completa para prevenir o burnout e cultivar o bem-estar corporativo/i
      )
    ).toBeInTheDocument();
  });

  test('should render navigation links to login and register', () => {
    renderLanding();
    // Buttons are links with to="/login" and to="/register"
    const loginLinks = screen.getAllByRole('link', { name: /login/i });
    expect(loginLinks.length).toBeGreaterThan(0);
    expect(loginLinks[0].getAttribute('href')).toBe('/login');

    const registerLinks = screen.getAllByRole('link', { name: /cadastrar/i });
    expect(registerLinks.length).toBeGreaterThan(0);
    expect(registerLinks[0].getAttribute('href')).toBe('/register');
  });

  test('should render the audience overview cards content', () => {
    renderLanding();
    expect(screen.getByText('Para Funcionários')).toBeInTheDocument();
    expect(screen.getByText('Para Psicólogos')).toBeInTheDocument();
    expect(screen.getByText('Para Gestores')).toBeInTheDocument();

    expect(screen.getByText(/Desafios diários gamificados/i)).toBeInTheDocument();
    expect(screen.getByText(/Gestão clínica eficiente/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboards em tempo real/i)).toBeInTheDocument();
  });
});
