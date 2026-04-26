// frontend/pages/Funcionario.tsx
import { useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, LinearProgress, 
  Paper, Button, List, ListItem, ListItemText, Avatar,
  Chip, TextField, Rating, Divider, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import WarningIcon from '@mui/icons-material/Warning';
import Timeline from '@mui/icons-material/Timeline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ChatIcon from '@mui/icons-material/Chat';
import HistoryIcon from '@mui/icons-material/History';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';

type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

type Psicologo = {
  id: number;
  nome: string;
  especialidade: string;
  rating: number;
  avaliacoes: number;
  avatar: string;
  cor: string;
  horarios: string[];
  disponivelHoje: boolean;
  proximaDisponibilidade?: string;
};

const dadosTendencia = [
  { semana: 'Semana 1', estresse: 65, ansiedade: 70, burnout: 45 },
  { semana: 'Semana 2', estresse: 58, ansiedade: 62, burnout: 40 },
  { semana: 'Semana 3', estresse: 52, ansiedade: 55, burnout: 35 },
  { semana: 'Semana 4', estresse: 45, ansiedade: 48, burnout: 30 },
];

const psicologos: Psicologo[] = [
  {
    id: 1,
    nome: 'Dra. Ana Silva',
    especialidade: 'Especialista em Burnout',
    rating: 4.9,
    avaliacoes: 42,
    avatar: 'AS',
    cor: '#147DAC',
    horarios: ['14:00', '15:30', '17:00'],
    disponivelHoje: true,
  },
  {
    id: 2,
    nome: 'Dr. Marcos Lima',
    especialidade: 'Psicologia Cognitiva',
    rating: 5.0,
    avaliacoes: 28,
    avatar: 'ML',
    cor: '#AE45AF',
    horarios: ['09:00', '11:30', '16:00'],
    disponivelHoje: true,
  },
  {
    id: 3,
    nome: 'Dra. Clara Mendonca',
    especialidade: 'Ansiedade e Estresse',
    rating: 4.8,
    avaliacoes: 56,
    avatar: 'CM',
    cor: '#157FAE',
    horarios: ['10:00'],
    disponivelHoje: false,
    proximaDisponibilidade: 'Amanha, 10:00',
  },
];

export default function Funcionario() {
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedPsicologo, setSelectedPsicologo] = useState<Psicologo | null>(null);
  const [selectedHorario, setSelectedHorario] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: SnackbarSeverity }>({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // Dados simulados
  const metrics = [
    { name: 'Estresse', value: 35, status: 'normal', color: '#4CAF50' },
    { name: 'Ansiedade', value: 62, status: 'atencao', color: '#FFB347' },
    { name: 'Burnout', value: 28, status: 'normal', color: '#4CAF50' },
    { name: 'Depressão', value: 15, status: 'normal', color: '#4CAF50' },
  ];

  const insights = [
    { 
      date: '2026-01-15', 
      text: 'Seu nível de estresse está controlado esta semana. Continue com as práticas de mindfulness!',
      type: 'positive' 
    },
    { 
      date: '2026-01-14', 
      text: 'Sua ansiedade aumentou 15% esta semana. Que tal fazer uma sessão de respiração guiada?',
      type: 'warning' 
    },
  ];

  const historico = [
    { date: '2026-01-15', pontos: 50, atividade: 'Questionário diário' },
    { date: '2026-01-14', pontos: 30, atividade: 'Check-in semanal' },
    { date: '2026-01-13', pontos: 20, atividade: 'Exercício de respiração' },
  ];

  const handleAgendar = (psicologo: Psicologo, horario: string) => {
    setSelectedPsicologo(psicologo);
    setSelectedHorario(horario);
    setOpenDialog(true);
  };

  const handleConfirmarAgendamento = async () => {
    try {
      await api.post('/agendamentos/', {
        nome_psicologo: selectedPsicologo?.nome,
        data_hora: selectedHorario
      });
      setOpenDialog(false);
      setSnackbar({
        open: true,
        message: `Consulta agendada com ${selectedPsicologo?.nome} para ${selectedHorario}.`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao agendar consulta.',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box className="container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Olá, João! 
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<HistoryIcon />}
            onClick={() => setShowChat(false)}
          >
            Histórico
          </Button>
          <Button 
            variant="contained" 
            startIcon={<ChatIcon />}
            onClick={() => setShowChat(true)}
          >
            Chat de Acolhimento
          </Button>
        </Box>
      </Box>

      {!showChat ? (
        <>
          {/* Cards de métricas */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {metrics.map((metric) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={metric.name}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      {metric.name}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ mb: 2 }}>
                      {metric.value}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={metric.value} 
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: metric.color,
                          borderRadius: 4,
                        }
                      }}
                    />
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      {metric.status === 'atencao' ? (
                        <>
                          <WarningIcon color="warning" fontSize="small" />
                          <Typography variant="body2" color="warning.main">
                            Atenção
                          </Typography>
                        </>
                      ) : (
                        <>
                          <SentimentSatisfiedIcon color="success" fontSize="small" />
                          <Typography variant="body2" color="success.main">
                            Normal
                          </Typography>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Gráfico de tendência */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Timeline color="primary" />
              <Typography variant="h6">
                Tendência dos últimos 30 dias
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosTendencia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="semana" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="estresse" stroke="#147DAC" strokeWidth={2} />
                <Line type="monotone" dataKey="ansiedade" stroke="#AE45AF" strokeWidth={2} />
                <Line type="monotone" dataKey="burnout" stroke="#157FAE" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>

            <Paper sx={{ mt: 2, p: 2, bgcolor: 'success.light', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                <Typography variant="body2">
                  Seus niveis reduziram nas ultimas semanas. Continue nesse ritmo.
                </Typography>
              </Box>
            </Paper>
          </Paper>

          {/* Gamificação */}
          <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.light', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EmojiEventsIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">Seus Pontos</Typography>
                <Typography variant="h3">100 pontos</Typography>
                <Typography variant="body2">
                  Complete questionários diários para ganhar mais pontos!
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Insights e Histórico */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Insights Personalizados
              </Typography>
              {insights.map((insight, index) => (
                <Card 
                  key={index} 
                  sx={{ 
                    mb: 2,
                    bgcolor: insight.type === 'positive' ? 'success.light' : 'warning.light',
                    color: 'white'
                  }}
                >
                  <CardContent>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      {insight.date}
                    </Typography>
                    <Typography>
                      {insight.text}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Histórico de Atividades
              </Typography>
              <List>
                {historico.map((item, index) => (
                  <ListItem key={index} divider>
                    <ListItemText 
                      primary={item.atividade}
                      secondary={item.date}
                    />
                    <Chip 
                      label={`+${item.pontos} pts`} 
                      color="primary"
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>

          <Typography variant="h5" sx={{ mt: 5, mb: 2 }}>
            Agendamento com Psicologo
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              {psicologos.map((psicologo) => (
                <Card key={psicologo.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Avatar sx={{ width: 56, height: 56, bgcolor: psicologo.cor }}>{psicologo.avatar}</Avatar>

                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">{psicologo.nome}</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {psicologo.especialidade}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating
                            value={psicologo.rating}
                            precision={0.1}
                            size="small"
                            readOnly
                            icon={<StarIcon fontSize="inherit" />}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {psicologo.rating} ({psicologo.avaliacoes} avaliacoes)
                          </Typography>
                        </Box>
                      </Box>

                      <Chip
                        label={psicologo.disponivelHoje ? 'Disponivel hoje' : 'Amanha'}
                        color={psicologo.disponivelHoje ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      {psicologo.disponivelHoje ? 'Horarios disponiveis hoje' : 'Proxima disponibilidade'}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {psicologo.disponivelHoje ? (
                        psicologo.horarios.map((horario) => (
                          <Button
                            key={horario}
                            variant="outlined"
                            size="small"
                            onClick={() => handleAgendar(psicologo, horario)}
                          >
                            {horario}
                          </Button>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {psicologo.proximaDisponibilidade}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Proximas Consultas
                  </Typography>

                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <CalendarMonthIcon color="primary" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">Nenhuma consulta agendada</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Agende sua primeira consulta acima
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PsychologyIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    Agendar Nova Consulta
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : (
        // Chat de acolhimento
        <Paper sx={{ p: 3, height: '600px', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>IA</Avatar>
            <Box>
              <Typography variant="h6">Assistente de Acolhimento</Typography>
              <Typography variant="caption" color="text.secondary">
                IA de suporte emocional
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 1, width: 32, height: 32 }}>IA</Avatar>
              <Paper sx={{ p: 2, maxWidth: '80%', bgcolor: 'primary.light', color: 'white' }}>
                <Typography>Olá! Como você está se sentindo hoje? Estou aqui para ouvir você.</Typography>
              </Paper>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField 
              fullWidth 
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              size="small"
            />
            <Button variant="contained">Enviar</Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Lembre-se: este chat é um espaço de acolhimento e não substitui acompanhamento profissional.
          </Typography>
        </Paper>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>Confirmar Agendamento</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Voce esta agendando uma consulta com:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Avatar sx={{ bgcolor: selectedPsicologo?.cor }}>{selectedPsicologo?.avatar}</Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>{selectedPsicologo?.nome}</Typography>
              <Typography variant="caption" color="text.secondary">{selectedPsicologo?.especialidade}</Typography>
            </Box>
          </Box>
          <Typography variant="body2" gutterBottom>
            Data: {new Date().toLocaleDateString('pt-BR')}
          </Typography>
          <Typography variant="body2" gutterBottom>
            Horario: {selectedHorario}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Voce recebera um link de videoconferencia por e-mail 15 minutos antes da consulta.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmarAgendamento}>
            Confirmar Agendamento
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}