// frontend/App.tsx
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Routes, Route } from 'react-router-dom';
import { theme } from './theme';
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
import './index.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
        <Header />
        <main style={{ minHeight: 'calc(100vh - 140px)', padding: '24px', backgroundColor: '#f5f5f5' }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

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
        </main>
        <Footer />
    </ThemeProvider>
  );
}

export default App;