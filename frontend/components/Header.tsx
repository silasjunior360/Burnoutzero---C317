// frontend/components/Header.tsx
import {
  AppBar, Toolbar, Typography, Box, Container, IconButton, Menu, MenuItem, Avatar, Divider
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useEffect, useState } from 'react';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState('');

  const getNormalizedRole = () => {
    const roleRaw = (userRole || localStorage.getItem('user_role') || '').toString();
    return roleRaw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  const isEmployeeRole = getNormalizedRole() === 'employee';
  const isPsychologistRole = getNormalizedRole().includes('psychologist') || getNormalizedRole().includes('psicologo') || getNormalizedRole().includes('psicologa');
  const isManagerRole = getNormalizedRole().includes('manager') || getNormalizedRole().includes('gestor') || getNormalizedRole().includes('gerente');
  const isAuthPage = ['/login', '/register', '/'].includes(location.pathname);
  const showNavigation = !isAuthPage;

  const getUserDashboardRoute = () => {
    if (isManagerRole) return '/manager';
    if (isPsychologistRole) return '/psychologist';
    return '/employee';
  };

  const handleLogoClick = () => {
    if (location.pathname === '/register') {
      navigate('/login');
      return;
    }

    if (location.pathname === '/login' || location.pathname === '/') {
      navigate('/');
      return;
    }

    navigate(getUserDashboardRoute());
  };

  const loadUserProfile = () => {
    import('../services/api').then(({ default: api }) => {
      if (!api || !api.get) return;

      api.get('/users/me/').then((res) => {
        const data = res.data || {};
        const name = (data.first_name || data.username || data.email || 'Usuário') + (data.last_name ? ` ${data.last_name}` : '');
        setUserName(name);
        setUserRole(data.role || null);
        setUserAvatar(data.avatar || '');
      }).catch(() => {
        // keep defaults
      });
    }).catch(() => {
      // ignore import errors
    });
  };

  useEffect(() => {
    let mounted = true;
    loadUserProfile();

    const handleProfileUpdated = (event: Event) => {
      if (!mounted) return;
      const customEvent = event as CustomEvent<{ avatar?: string; name?: string }>;
      if (customEvent.detail?.name) {
        setUserName(customEvent.detail.name);
      }
      if (typeof customEvent.detail?.avatar === 'string') {
        setUserAvatar(customEvent.detail.avatar);
      }
      loadUserProfile();
    };

    window.addEventListener('user-profile-updated', handleProfileUpdated);
    return () => {
      mounted = false;
      window.removeEventListener('user-profile-updated', handleProfileUpdated);
    };
  }, [location.pathname]);

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
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
              onClick={handleLogoClick}
            >
              Burnoutzero
            </Typography>

            {showNavigation && isEmployeeRole && (
              <>
                <Divider orientation="vertical" flexItem sx={{ my: 1 }} />

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

          {showNavigation && (
            <>
              {isEmployeeRole ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }} size="large">
                    <Avatar src={userAvatar || undefined} sx={{ width: 40, height: 40, bgcolor: 'primary.main', cursor: 'pointer' }}>
                      {userName.split(' ').map((n) => n[0]).join('')}
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
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }} size="large" aria-label="abrir perfil do usuário">
                    <Avatar src={userAvatar || undefined} sx={{ width: 40, height: 40, bgcolor: 'primary.main', cursor: 'pointer' }}>
                      {userName.split(' ').map((n) => n[0]).join('')}
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
              )}
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}