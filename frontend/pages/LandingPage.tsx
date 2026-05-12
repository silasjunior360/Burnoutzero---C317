import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../theme';

const BurnoutZeroLanding = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="burnout-zero-page">
      {/* Estilos Globais da Página */}
      <style>{`
        :root {
          --color-primary: ${theme.palette.primary.main};
          --color-primary-dark: ${theme.palette.primary.dark};
          --color-secondary: ${theme.palette.secondary.main};
          --bg-default: #ffffff; /* Forçar fundo branco na landing */
          --bg-paper: ${theme.palette.background.paper};
          --text-primary: ${theme.palette.text.primary};
          --text-secondary: ${theme.palette.text.secondary};
          --divider: ${theme.palette.divider || '#e2e8f0'};
          --accent-warning: ${theme.palette.warning?.main || '#FFB347'};
          --accent-error: ${theme.palette.error?.main || '#FF6B6B'};
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .burnout-zero-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: linear-gradient(135deg, var(--bg-default) 0%, var(--bg-paper) 100%);
          color: var(--text-primary);
          line-height: 1.5;
          scroll-behavior: smooth;
        }

        /* Container principal */
        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
        }

        /* Botões */
        .btn-primary {
          display: inline-block;
          background-color: var(--color-primary);
          color: white;
          font-weight: 600;
          padding: 12px 28px;
          border-radius: 40px;
          text-decoration: none;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .btn-primary:hover {
          background-color: var(--color-primary-dark);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(15,59,60,0.3);
        }

        .btn-outline {
          display: inline-block;
          background-color: transparent;
          color: var(--color-primary);
          font-weight: 600;
          padding: 12px 28px;
          border-radius: 40px;
          text-decoration: none;
          border: 2px solid var(--color-primary);
          transition: all 0.3s ease;
          cursor: pointer;
          font-size: 1rem;
        }

        .btn-outline:hover {
          background-color: var(--color-primary);
          color: white;
          transform: translateY(-2px);
        }

        .btn-large {
          padding: 14px 36px;
          font-size: 1.1rem;
        }

        /* Hero Section */
        .hero {
          text-align: center;
          padding: 100px 0 80px;
        }

        .hero h1 {
          font-size: 3.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .hero p {
          font-size: 1.25rem;
          color: var(--text-secondary);
          max-width: 700px;
          margin: 0 auto 40px;
          line-height: 1.6;
        }

        .button-group {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Soluções */
        .solutions {
          padding: 80px 0;
          background-color: rgba(255,255,255,0.6);
          border-radius: 64px 64px 0 0;
        }

        .section-label {
          text-align: center;
          font-size: 0.9rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--color-secondary);
          font-weight: 600;
          margin-bottom: 16px;
        }

        .section-title {
          text-align: center;
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 56px;
          color: var(--text-primary);
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 32px;
        }

        .card {
          background: var(--bg-paper);
          border-radius: 32px;
          padding: 32px 28px;
          box-shadow: 0 20px 35px -12px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
          border: 1px solid var(--divider);
        }

        .card:hover {
          transform: translateY(-8px);
          box-shadow: 0 30px 40px -15px rgba(15,59,60,0.2);
          border-color: #cbd5e1;
        }

        .card-icon {
          font-size: 3rem;
          margin-bottom: 24px;
        }

        .card h3 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 16px;
          color: var(--color-primary);
        }

        .card p {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* Seção CTA */
        .cta-section {
          background: linear-gradient(120deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          border-radius: 48px;
          margin: 60px 0 80px;
          padding: 64px 48px;
          text-align: center;
          color: white;
          box-shadow: 0 25px 35px -12px rgba(0,0,0,0.2);
        }

        .cta-section h2 {
          font-size: 2.2rem;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .cta-section p {
          font-size: 1.2rem;
          max-width: 600px;
          margin: 0 auto 32px;
          opacity: 0.9;
        }

        .cta-section .btn-primary {
          background-color: var(--bg-paper);
          color: var(--color-primary);
          box-shadow: 0 8px 18px rgba(0,0,0,0.1);
        }

        .cta-section .btn-primary:hover {
          background-color: #f1f5f9;
          transform: scale(1.02);
        }

        .cta-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-top: 20px;
        }

        /* Footer */
        .footer {
          border-top: 1px solid var(--divider);
          padding: 48px 0 40px;
          margin-top: 20px;
          background-color: var(--bg-default);
        }

        .footer-content {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: flex-start;
          gap: 32px;
        }

        .footer-brand h3 {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--color-primary);
          margin-bottom: 8px;
        }

        .footer-brand p {
          color: var(--text-secondary);
          max-width: 280px;
          font-size: 0.9rem;
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 32px;
        }

        .footer-links a {
          text-decoration: none;
          color: var(--text-secondary);
          font-weight: 500;
          transition: color 0.2s;
          font-size: 0.95rem;
        }

        .footer-links a:hover {
          color: var(--color-primary);
        }

        .copyright {
          text-align: center;
          padding-top: 40px;
          margin-top: 40px;
          border-top: 1px solid var(--divider);
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        
        .btn-outline2 {
          display: inline-block;
          background-color: transparent;
          color: #ffffff;
          font-weight: 600;
          padding: 12px 28px;
          border-radius: 40px;
          text-decoration: none;
          border: 2px solid #ffffff;
          transition: all 0.3s ease;
          cursor: pointer;
          font-size: 1rem;
        }
          
        .btn-outline2:hover {
          background-color: #ffffff;
          color: #3468a3;
          transform: translateY(-2px);
        }

        /* Responsividade */
        @media (max-width: 768px) {
          .container {
            padding: 0 24px;
          }
          .hero h1 {
            font-size: 2.4rem;
          }
          .hero p {
            font-size: 1rem;
          }
          .section-title {
            font-size: 2rem;
          }
          .cta-section h2 {
            font-size: 1.8rem;
          }
          .cta-section {
            padding: 40px 24px;
          }
          .footer-content {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .footer-brand p {
            margin: 0 auto;
          }
          .button-group {
            gap: 12px;
          }
          .cards-grid {
            gap: 24px;
          }
        }

        @media (max-width: 480px) {
          .hero {
            padding: 60px 0 40px;
          }
          .btn-primary, .btn-outline {
            padding: 10px 20px;
            font-size: 0.9rem;
          }
          .section-title {
            font-size: 1.8rem;
          }
        }
      `}</style>

      {/* Conteúdo da Landing Page */}
      <div className="container">
        {/* Hero Section */}
        <section className="hero">
          <h1>Transforme a saúde mental da sua empresa</h1>
          <p>
            Uma plataforma completa para prevenir o burnout e cultivar o bem-estar corporativo com inteligência e empatia.
          </p>
          <div className="button-group">
            <Link to="/login" className="btn-primary">Login</Link>
            <Link to="/register" className="btn-outline">Cadastrar</Link>
            
          </div>
        </section>

        {/* Soluções */}
        <section className="solutions">
          <div className="section-label">O QUE OFERECEMOS</div>
          <h2 className="section-title">Soluções para todo o ecossistema</h2>
          <div className="cards-grid">
            <div className="card">
              <div className="card-icon"></div>
              <h3>Para Funcionários</h3>
              <p>
                Desafios diários gamificados que incentivam o autoconhecimento, a meditação guiada e o uso de canais de apoio – transformando o equilíbrio emocional em um hábito recompensador.              </p>
            </div>
            <div className="card">
              <div className="card-icon"></div>
              <h3>Para Psicólogos</h3>
              <p>
                Gestão clínica eficiente com prontuários digitais, agendamento simplificado e insights baseados em dados para tratamentos mais assertivos.
              </p>
            </div>
            <div className="card">
              <div className="card-icon"></div>
              <h3>Para Gestores</h3>
              <p>
                Dashboards em tempo real com indicadores de clima e saúde organizacional, permitindo intervenções preventivas estratégicas.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action Central */}
        <section className="cta-section">
          <h2>Pronto para reduzir o estresse na sua equipe?</h2>
          <p>Junte-se a centenas de empresas que já estão redefinindo a cultura de trabalho como Burnout Zero.</p>
          <div className="cta-buttons">
            <Link to="/login" className="btn-primary btn-large">Login</Link>
            <Link to="/register" className="btn-outline2 btn-large">Cadastro</Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>Burnout Zero</h3>
              <p>Cultivando mentes, transformando corporações.</p>
            </div>
            <div className="footer-links">
              <a href="#">TERMOS DE USO</a>
              <a href="#">PRIVACIDADE</a>
              <a href="#">CONTATO</a>
              <a href="#">CARREIRAS</a>
            </div>
          </div>
          <div className="copyright">
            © 2024 BURNOUT ZERO. CULTIVANDO MENTES, TRANSFORMANDO CORPORAÇÕES.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BurnoutZeroLanding;