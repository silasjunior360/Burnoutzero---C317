// frontend/components/Header.tsx
import { 
  AppBar, Toolbar, Typography, Box, Container, IconButton, Menu, MenuItem, Avatar, Divider
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState } from 'react';
import { useUser } from '../user-context';

const isEmployeeRole = (role?: string): boolean => {
  if (!role) return false;
  const normalized = (role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  
  return normalized.includes('employee') || normalized.includes('funcionario');
};

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user } = useUser();

  const userName = user
    ? `${user.first_name || user.username || user.email || 'Usuário'}${user.last_name ? ' ' + user.last_name : ''}`
    : '';
  const userAvatar = user?.avatar || '';

  const isAuthPage = ['/login', '/register', '/'].includes(location.pathname);
  const isEmployee = user ? isEmployeeRole(user.role as string) : false;

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const handleSettings = () => {
    handleCloseUserMenu();
    navigate('/settings');
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <AppBar position="sticky" color="default" elevation={1} sx={{ backgroundColor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Logo e Home */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            {/* Logo */}
            <Typography
              variant="h6"
              component="div"
              sx={{ 
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

            {!isAuthPage && isEmployee && (
              <>
                {/* Divider */}
                <Divider orientation="vertical" flexItem sx={{ my: 1 }} />

                {/* Home Button */}
                <Box
                  component="button"
                  onClick={() => navigate('/home')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'text.primary',
                    fontSize: '1rem',
                    padding: '4px 8px',
                    '&:hover': {
                      opacity: 0.7,
                    }
                  }}
                >
                  <img 
                    src="/favicon.svg" 
                    alt="Home" 
                    style={{ width: '24px', height: '24px' }}
                  />
                  <Box
                    sx={{
                      background: 'linear-gradient(135deg, #147DAC 0%, #AE45AF 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 600,
                      fontSize: '1rem'
                    }}
                  >
                    Desafios
                  </Box>
                </Box>
              </>
            )}
          </Box>

          {!isAuthPage && user && (
            <>
              {/* Menu de Usuário */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  onClick={handleOpenUserMenu}
                  sx={{ p: 0 }}
                  size="large"
                >

                  <Avatar src={userAvatar || undefined} sx={{ width: 40, height: 40, bgcolor: 'primary.main', cursor: 'pointer' }}>

                    {userName.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleCloseUserMenu}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem disabled sx={{ opacity: 0.6 }}>
                    <Typography variant="body2">{userName}</Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleSettings}>
                    <SettingsIcon sx={{ mr: 2 }} fontSize="small" />
                    Configurações
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon sx={{ mr: 2 }} fontSize="small" />
                    Sair
                  </MenuItem>
                </Menu>
              </Box>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}