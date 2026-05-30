// frontend/App.tsx
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Employee from './pages/Employee';
import Psychologist from './pages/Psychologist';
import Manager from './pages/Manager';
import Settings from './pages/settings';
import { ThemeModeProvider } from './theme-context';
import './index.css';

function AppShell() {
  const theme = useTheme();

  return (
    <>
        <Header />

        <Box component="main" sx={{ minHeight: 'calc(100vh - 140px)', p: 0, bgcolor: theme.palette.background.default }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['employee', 'psychologist', 'manager']} />}>
              <Route path="/employee" element={<Employee />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['psychologist']} />}>
              <Route path="/psychologist" element={<Psychologist />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
              <Route path="/manager" element={<Manager />} />
            </Route>
          </Routes>
        </Box>
        <Footer />
    </>
  );
}

function App() {
  return (
    <ThemeModeProvider>
      <AppShell />
    </ThemeModeProvider>
  );
}

export default App;