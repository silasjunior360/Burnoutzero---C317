// frontend/components/Header.tsx
import { 
  AppBar, Toolbar, Typography, Box, Container
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname === '/') return null;
  // Simplified header: only brand displayed. Navigation and avatar removed for minimal top bar.

  return (
    <AppBar position="sticky" color="default" elevation={1} sx={{ backgroundColor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Logo */}
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #147DAC 0%, #AE45AF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
            }}
            onClick={() => navigate('/')}
          >
            Burnoutzero
          </Typography>

            {/* Empty space where navigation and avatar used to be - keeping header minimal */}
            <Box sx={{ width: 48 }} />
        </Toolbar>
      </Container>
    </AppBar>
  );
}