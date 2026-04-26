// frontend/pages/Cadastro.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  Container,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import BadgeIcon from '@mui/icons-material/Badge';

const steps = ['Dados pessoais', 'Perfil de acesso', 'Termos e LGPD'];

export default function Cadastro() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Dados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    usuario: '',
    senha: '',
    confirmarSenha: '',
    perfil: 'funcionario',
    crp: '',
    empresa: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validarStep1 = () => {
    if (!formData.nome) {
      setError('Nome é obrigatório');
      return false;
    }
    if (!formData.email) {
      setError('E-mail é obrigatório');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('E-mail inválido');
      return false;
    }
    if (!formData.usuario) {
      setError('Usuário é obrigatório');
      return false;
    }
    if (!formData.senha) {
      setError('Senha é obrigatória');
      return false;
    }
    if (formData.senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return false;
    }
    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não conferem');
      return false;
    }
    setError('');
    return true;
  };

  const validarStep2 = () => {
    if (formData.perfil === 'psicologo' && !formData.crp) {
      setError('CRP é obrigatório para psicólogos');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = async () => {
    if (activeStep === 0 && !validarStep1()) return;
    if (activeStep === 1 && !validarStep2()) return;
    if (activeStep === 2) {
      if (!acceptTerms) {
        setError('Você precisa aceitar os termos LGPD');
        return;
      }
      
      try {
        await api.post('/auth/register/', {
          username: formData.usuario,
          email: formData.email,
          password: formData.senha,
          first_name: formData.nome.split(' ')[0],
          last_name: formData.nome.split(' ').slice(1).join(' '),
          role: formData.perfil,
          departamento: formData.empresa
        });
        
        alert('Cadastro realizado com sucesso! Faça login.');
        navigate('/login');
      } catch (err: any) {
        setError('Erro ao realizar o cadastro. Verifique os dados ou se o usuário já existe.');
      }
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Typography
            variant="h4"
            align="center"
            sx={{
              mb: 1,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #147DAC 0%, #AE45AF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Criar Conta
          </Typography>
          <Typography align="center" color="text.secondary" sx={{ mb: 4 }}>
            Junte-se ao BurnoutZero
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* STEP 1 - Dados Pessoais */}
          {activeStep === 0 && (
            <Box>
              <TextField
                fullWidth
                label="Nome completo"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="E-mail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
                placeholder="seu@email.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Usuário"
                name="usuario"
                value={formData.usuario}
                onChange={handleChange}
                margin="normal"
                required
                placeholder="escolha um nome de usuário"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Senha"
                name="senha"
                type={showPassword ? 'text' : 'password'}
                value={formData.senha}
                onChange={handleChange}
                margin="normal"
                required
                helperText="Mínimo 6 caracteres"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirmar senha"
                name="confirmarSenha"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmarSenha}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}

          {/* STEP 2 - Perfil de Acesso */}
          {activeStep === 1 && (
            <Box>
              <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
                <FormLabel component="legend">Qual seu perfil?</FormLabel>
                <RadioGroup
                  name="perfil"
                  value={formData.perfil}
                  onChange={handleChange}
                  sx={{ mt: 2 }}
                >
                  <FormControlLabel
                    value="funcionario"
                    control={<Radio />}
                    label="Funcionário - Acesso a questionários e chat de acolhimento"
                  />
                  <FormControlLabel
                    value="psicologo"
                    control={<Radio />}
                    label="Psicólogo - Acesso a dashboard de pacientes e insights"
                  />
                  <FormControlLabel
                    value="gestor"
                    control={<Radio />}
                    label="Gestor - Acesso a dashboards gerenciais e relatórios"
                  />
                </RadioGroup>
              </FormControl>

              {formData.perfil === 'psicologo' && (
                <TextField
                  fullWidth
                  label="CRP (Registro profissional)"
                  name="crp"
                  value={formData.crp}
                  onChange={handleChange}
                  margin="normal"
                  placeholder="Ex: 06/123456"
                  helperText="Obrigatório para psicólogos"
                />
              )}

              <TextField
                fullWidth
                label="Empresa (opcional)"
                name="empresa"
                value={formData.empresa}
                onChange={handleChange}
                margin="normal"
                placeholder="Nome da empresa"
              />
            </Box>
          )}

          {/* STEP 3 - Termos LGPD */}
          {activeStep === 2 && (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: '#f5f5f5',
                  borderRadius: 2,
                  maxHeight: 300,
                  overflow: 'auto',
                  mb: 3
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Termos de Consentimento LGPD
                </Typography>
                <Typography variant="body2" paragraph>
                  Ao criar uma conta no BurnoutZero, você concorda com:
                </Typography>
                <Typography variant="body2" component="div">
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Seus dados serão usados apenas para monitoramento de saúde mental</li>
                    <li>Gestores veem apenas dados agregados e anonimizados</li>
                    <li>Psicólogos acessam seus dados mediante consentimento</li>
                    <li>Você pode solicitar exclusão dos dados a qualquer momento</li>
                    <li>Dados armazenados com segurança e criptografia</li>
                    <li>BurnoutZero não compartilha dados com terceiros</li>
                    <li>Informações são confidenciais com sigilo profissional</li>
                  </ul>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018
                </Typography>
              </Paper>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    color="primary"
                  />
                }
                label="Li e concordo com os termos de uso e política de privacidade"
              />
            </Box>
          )}

          {/* Botões de navegação */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              variant="outlined"
            >
              Voltar
            </Button>
            <Button
              onClick={handleNext}
              variant="contained"
            >
              {activeStep === steps.length - 1 ? 'Finalizar Cadastro' : 'Próximo'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/login')}
              underline="hover"
            >
              Já tem uma conta? Faça login
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}