import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HealingIcon from '@mui/icons-material/Healing';
import DashboardIcon from '@mui/icons-material/Dashboard';

const audienceCards = [
  {
    title: 'Para Funcionários',
    description:
      'Desafios diários gamificados que incentivam o autoconhecimento, a meditação guiada e o uso de canais de apoio, transformando o equilíbrio emocional em um hábito recompensador.',
    icon: <AccessTimeIcon />,
  },
  {
    title: 'Para Psicólogos',
    description:
      'Gestão clínica eficiente com prontuários digitais, agendamento simplificado e insights baseados em dados para tratamentos mais assertivos.',
    icon: <HealingIcon />,
  },
  {
    title: 'Para Gestores',
    description:
      'Dashboards em tempo real com indicadores de clima e saúde organizacional, permitindo intervenções preventivas estratégicas.',
    icon: <DashboardIcon />,
  },
];

export default function BurnoutZeroLanding() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(20,125,172,0.12), transparent 28%), radial-gradient(circle at top right, rgba(174,69,175,0.12), transparent 24%), linear-gradient(180deg, #f7fbff 0%, #ffffff 42%, #f6f9fc 100%)',
        color: 'text.primary',
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Stack spacing={8}>
          <Box
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 6,
              px: { xs: 3, md: 6 },
              py: { xs: 5, md: 8 },
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,250,255,0.96) 100%)',
              border: '1px solid',
              borderColor: alpha('#147DAC', 0.12),
              boxShadow: '0 24px 60px rgba(18, 38, 63, 0.10)',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 80% 0%, rgba(20,125,172,0.10), transparent 22%), radial-gradient(circle at 20% 100%, rgba(174,69,175,0.10), transparent 20%)',
                pointerEvents: 'none',
              }}
            />

              <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box component="img" src="/favicon.svg" alt="Home" sx={{ width: 60, height: 60, mb: 0 }} />
              </Box>

            <Grid container spacing={4} alignItems="center" sx={{ position: 'relative' }}>
              <Grid size={{ xs: 12 }}>
                <Stack spacing={3} alignItems="center">
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.05,
                        fontSize: { xs: '2rem', sm: '2.4rem', md: '2.8rem', lg: '3.15rem' },
                        maxWidth: 'none',
                        whiteSpace: { xs: 'normal', md: 'nowrap' },
                        backgroundImage: 'linear-gradient(90deg, #147DAC 0%, #AE45AF 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Transforme a saúde mental da sua empresa
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        mt: 2,
                        maxWidth: 700,
                        color: 'text.secondary',
                        fontWeight: 400,
                        lineHeight: 1.75,
                        mx: 'auto',
                      }}
                    >
                      Uma plataforma completa para prevenir o burnout e cultivar o bem-estar corporativo com
                      inteligência e empatia.
                    </Typography>
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
                    <Button
                      component={Link}
                      to="/login"
                      variant="contained"
                      size="large"
                      sx={{ px: 3.5, py: 1.35, borderRadius: 999, fontWeight: 700 }}
                    >
                      Login
                    </Button>
                    <Button
                      component={Link}
                      to="/register"
                      variant="outlined"
                      size="large"
                      sx={{ px: 3.5, py: 1.35, borderRadius: 999, fontWeight: 700 }}
                    >
                      Cadastrar
                    </Button>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          <Box>
            <Stack spacing={1.25} sx={{ mb: 3 }}>
              <Chip
                label="O QUE OFERECEMOS"
                sx={{
                  width: 'fit-content',
                  bgcolor: alpha('#AE45AF', 0.10),
                  color: 'secondary.main',
                  fontWeight: 700,
                }}
              />
              <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Soluções para todo o ecossistema
              </Typography>
            </Stack>

            <Grid container spacing={3}>
              {audienceCards.map((card) => (
                <Grid size={{ xs: 12, md: 4 }} key={card.title}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      borderRadius: 4,
                      borderColor: alpha('#147DAC', 0.12),
                      boxShadow: '0 12px 30px rgba(18, 38, 63, 0.05)',
                    }}
                  >
                    <CardContent sx={{ p: 3.25 }}>
                      <Stack spacing={2}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            display: 'grid',
                            placeItems: 'center',
                            color: 'primary.main',
                            backgroundColor: 'rgba(20, 125, 172, 0.08)',
                          }}
                        >
                          {card.icon}
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {card.title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.75 }}>
                          {card.description}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Card
            sx={{
              borderRadius: 6,
              color: '#fff',
              background: 'linear-gradient(135deg, #147DAC 0%, #0F4C68 52%, #AE45AF 100%)',
              boxShadow: '0 28px 60px rgba(15, 59, 60, 0.22)',
            }}
          >
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, md: 7 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                      Pronto para reduzir o estresse na sua equipe?
                    </Typography>
                    <Typography variant="body1" sx={{ maxWidth: 620, opacity: 0.92, lineHeight: 1.8 }}>
                      Junte-se a centenas de empresas que já estão redefinindo a cultura de trabalho como Burnout
                      Zero.
                    </Typography>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    justifyContent={{ md: 'flex-end' }}
                  >
                    <Button
                      component={Link}
                      to="/login"
                      variant="contained"
                      size="large"
                      sx={{
                        bgcolor: '#fff',
                        color: 'primary.main',
                        px: 3.5,
                        py: 1.3,
                        borderRadius: 999,
                        fontWeight: 800,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' },
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      component={Link}
                      to="/register"
                      variant="outlined"
                      size="large"
                      sx={{
                        borderColor: 'rgba(255,255,255,0.7)',
                        color: '#fff',
                        px: 3.5,
                        py: 1.3,
                        borderRadius: 999,
                        fontWeight: 800,
                        '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.08)' },
                      }}
                    >
                      Cadastro
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      <Box component="footer" sx={{ borderTop: '1px solid', borderColor: alpha('#147DAC', 0.1), textAlign: 'center' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Stack spacing={1.5} justifyContent="center">
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', textAlign: 'center' }}>
                Burnout Zero
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Cultivando mentes, transformando corporações.
              </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
