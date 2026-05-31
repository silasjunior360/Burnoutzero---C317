import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Card, CardContent, LinearProgress, 
  Paper, Button, List, ListItem, ListItemText, Avatar,
  Chip, TextField, MenuItem, Rating, Divider, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import WarningIcon from '@mui/icons-material/Warning';
import Timeline from '@mui/icons-material/Timeline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ChatIcon from '@mui/icons-material/Chat';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HomeIcon from '@mui/icons-material/Home';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useUser } from '../user-context';
import api from '../services/api';
import AIChat from '../components/AIChat/AIChat';

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

const fallbackPsicologos: Psicologo[] = [
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

type Assessment = {
  id: number;
  stress: number;
  anxiety: number;
  burnout: number;
  depression: number;
  risk_level: string;
  assessment_date: string;
};

type Insight = {
  id: number;
  text: string;
  recommendations: string;
  generated_at: string;
};

type Appointment = {
  id: number;
  psychologist_name: string;
  date_time: string;
  status: string;
};

type HistoryItem = {
  points: number;
  reason: string;
  earned_at: string;
};

type Profile = {
  firstName: string;
  lastName: string;
  username: string;
};

const getProfileDisplayName = (profile: Profile) =>
  [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username || 'Usuário';

const getAvatarColor = (name: string): string => {
  const colors = ['#147DAC', '#AE45AF', '#157FAE', '#1b7a5a', '#7c5cbf', '#b05c2e'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string): string =>
  name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

export default function Employee() {
  const { user: contextUser } = useUser();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({ firstName: '', lastName: '', username: '' });
  const [showChat, setShowChat] = useState(false);
  
  const [psicologos, setPsicologos] = useState<Psicologo[]>([]);
  const [selectedPsicologo, setSelectedPsicologo] = useState<Psicologo | null>(null);
  const [selectedHorario, setSelectedHorario] = useState('');
  
  const [openDialog, setOpenDialog] = useState(false);
  const [openScheduleForm, setOpenScheduleForm] = useState(false);
  const [openAvaliacaoDialog, setOpenAvaliacaoDialog] = useState(false);
  const [newAssessment, setNewAssessment] = useState({ stress: 0, anxiety: 0, burnout: 0, depression: 0 });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: SnackbarSeverity }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [insightsData, setInsightsData] = useState<Insight[]>([]);
  const [pontos, setPontos] = useState(0);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);

  const fetchData = async () => {
    try {
      const [avRes, inRes, ptsRes, agRes, usersRes] = await Promise.all([
        api.get('/assessments/').catch(() => ({ data: [] })),
        api.get('/insights/').catch(() => ({ data: [] })),
        api.get('/gamification/my-points/').catch(() => ({ data: { total_points: 0, history: [] } })),
        api.get('/appointments/').catch(() => ({ data: [] })),
        api.get('/users/').catch(() => ({ data: [] }))
      ]);
      
      const sortedAssessments = (avRes.data || []).sort((a: Assessment, b: Assessment) => 
        new Date(a.assessment_date).getTime() - new Date(b.assessment_date).getTime()
      );
      
      setAssessments(sortedAssessments);
      setInsightsData(inRes.data || []);
      setPontos(ptsRes.data?.total_points || 0);
      setHistoryData(ptsRes.data?.history || []);
      setUpcomingAppointments(agRes.data || []);

      const fetchedPsicologos = (usersRes.data || [])
        .filter((u: any) => u.role === 'psychologist')
        .map((u: any) => {
          const nomeStr = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
          return {
            id: u.id,
            nome: nomeStr,
            especialidade: u.department || 'Psicologia',
            rating: 5.0,
            avaliacoes: Math.floor(Math.random() * 50) + 10,
            avatar: getInitials(nomeStr),
            cor: getAvatarColor(nomeStr),
            horarios: ['09:00', '10:30', '14:00', '16:00'],
            disponivelHoje: true,
          };
        });

      if (fetchedPsicologos.length > 0) {
        setPsicologos(fetchedPsicologos);
      } else {
        setPsicologos(fallbackPsicologos);
      }
    } catch (error) {
      console.error(error);
      setPsicologos(fallbackPsicologos);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) await fetchData();
    };
    void load();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!contextUser) return;
    setProfile({
      firstName: contextUser.first_name || '',
      lastName: contextUser.last_name || '',
      username: contextUser.username || '',
    });
  }, [contextUser]);

  const location = useLocation();
  useEffect(() => {
    const state = location?.state as any;
    if (state?.openAvaliacao) setOpenAvaliacaoDialog(true);
    if (state?.openChat) setShowChat(true);
    if (state?.openSchedule) setOpenScheduleForm(true);
  }, [location]);

  const handleEnviarAvaliacao = async () => {
    try {
      await api.post('/assessments/', newAssessment);
      setOpenAvaliacaoDialog(false);
      setSnackbar({ open: true, message: 'Avaliação enviada com sucesso!', severity: 'success' });
      setNewAssessment({ stress: 0, anxiety: 0, burnout: 0, depression: 0 });
      fetchData();
    } catch {
      setSnackbar({ open: true, message: 'Erro ao enviar avaliação.', severity: 'error' });
    }
  };
  
  const lastAssessment = assessments.length > 0 ? assessments[assessments.length - 1] : null;

  const metrics = lastAssessment ? [
    { name: 'Estresse', value: lastAssessment.stress, status: lastAssessment.stress >= 50 ? 'atencao' : 'normal', color: '#FFB347' },
    { name: 'Ansiedade', value: lastAssessment.anxiety, status: lastAssessment.anxiety >= 50 ? 'atencao' : 'normal', color: '#FFB347' },
    { name: 'Burnout', value: lastAssessment.burnout, status: lastAssessment.burnout >= 50 ? 'atencao' : 'normal', color: '#4CAF50' },
    { name: 'Depressão', value: lastAssessment.depression, status: lastAssessment.depression >= 50 ? 'atencao' : 'normal', color: '#4CAF50' },
  ] : [
    { name: 'Estresse', value: 0, status: 'normal', color: '#4CAF50' },
    { name: 'Ansiedade', value: 0, status: 'normal', color: '#4CAF50' },
    { name: 'Burnout', value: 0, status: 'normal', color: '#4CAF50' },
    { name: 'Depressão', value: 0, status: 'normal', color: '#4CAF50' },
  ];

  const insights = insightsData.map(i => ({
    date: new Date(i.generated_at).toLocaleDateString('pt-BR'),
    text: i.text,
    type: i.text.toLowerCase().includes('elevado') ? 'warning' : 'positive'
  }));

  const historicoMapeado = historyData.map((item) => ({
    date: new Date(item.earned_at).toLocaleDateString('pt-BR'),
    pontos: item.points,
    atividade: item.reason === 'assessment_complete' ? 'Avaliação de Saúde Concluída' : 'Bônus de Consistência'
  }));

  const dadosTendencia = assessments.slice(-7).map((a) => ({
    data: new Date(a.assessment_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    estresse: a.stress,
    ansiedade: a.anxiety,
    burnout: a.burnout,
    depressao: a.depression
  }));

  const handleAgendar = (psicologo: Psicologo, horario: string) => {
    setSelectedPsicologo(psicologo);
    setSelectedHorario(horario);
    setOpenDialog(true);
  };

  const handleOpenScheduleForm = () => {
    setSelectedPsicologo(null);
    setSelectedHorario('');
    setOpenScheduleForm(true);
  };

  const handleSelectPsychologist = (id: number) => {
    const psicologo = psicologos.find((p) => p.id === id) || null;
    setSelectedPsicologo(psicologo);
    setSelectedHorario('');
  };

  const handleConfirmScheduleSelection = () => {
    if (!selectedPsicologo || !selectedHorario) {
      setSnackbar({ open: true, message: 'Escolha um psicólogo e um horário antes de continuar.', severity: 'warning' });
      return;
    }
    setOpenScheduleForm(false);
    setOpenDialog(true);
  };

  const handleConfirmarAgendamento = async () => {
    try {
      await api.post('/appointments/', {
        psychologist_name: selectedPsicologo?.nome,
        date_time: selectedHorario
      });
      setOpenDialog(false);
      setSnackbar({
        open: true,
        message: `Consulta agendada com ${selectedPsicologo?.nome} para ${selectedHorario}.`,
        severity: 'success',
      });
      fetchData();
    } catch (error: any) {
      const backendMessage = error?.response?.data?.detail || error?.response?.data?.error || error?.message;
      setOpenDialog(false);
      setSnackbar({
        open: true,
        message: backendMessage ? `Erro ao agendar: ${backendMessage}` : 'Erro ao agendar consulta.',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box className="container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 6, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ mb: 0 }}>
          Olá, {getProfileDisplayName(profile)}!
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/home')}
          >
            Ir para Home
          </Button>
          <Button 
            variant="contained" 
            startIcon={<ChatIcon />}
            onClick={() => setShowChat(true)}
          >
            Chat de Acolhimento
          </Button>
          <Button 
            variant="contained" 
            color="secondary"
            onClick={() => setOpenAvaliacaoDialog(true)}
          >
            Nova Avaliação
          </Button>
        </Box>
      </Box>

      {!showChat ? (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {metrics.map((metric) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={metric.name}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      {metric.name}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ mb: 2 }}>
                      {metric.value}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(metric.value, 100)} 
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

          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Timeline color="primary" />
              <Typography variant="h6">
                Tendência de Avaliações
              </Typography>
            </Box>
            
            {dadosTendencia.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosTendencia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="data" />
                  <YAxis domain={[0, 'dataMax + 10']} />
                  <Tooltip />
                  <Line type="monotone" name="Estresse" dataKey="estresse" stroke="#147DAC" strokeWidth={2} />
                  <Line type="monotone" name="Ansiedade" dataKey="ansiedade" stroke="#AE45AF" strokeWidth={2} />
                  <Line type="monotone" name="Burnout" dataKey="burnout" stroke="#157FAE" strokeWidth={2} />
                  <Line type="monotone" name="Depressão" dataKey="depressao" stroke="#4CAF50" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Realize avaliações para visualizar suas tendências.</Typography>
              </Box>
            )}

            <Paper sx={{ mt: 2, p: 2, bgcolor: 'success.light', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                <Typography variant="body2">
                  Monitore seus níveis regularmente para manter um histórico atualizado.
                </Typography>
              </Box>
            </Paper>
          </Paper>

          <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.light', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EmojiEventsIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">Seus Pontos</Typography>
                <Typography variant="h3">{pontos} pontos</Typography>
                <Typography variant="body2">
                  Complete questionários e desafios diários para ganhar mais pontos!
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Insights Personalizados
              </Typography>
              {insights.length > 0 ? (
                insights.map((insight, index) => (
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
                ))
              ) : (
                <Typography color="text.secondary">Nenhum insight disponível ainda.</Typography>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Histórico de Atividades
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List>
                  {historicoMapeado.length > 0 ? (
                    historicoMapeado.map((item, index) => (
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
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="Nenhuma atividade registrada." />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>

          <Typography variant="h5" sx={{ mt: 5, mb: 2 }}>
            Agendamento com Psicólogo
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
                            {psicologo.rating} ({psicologo.avaliacoes} avaliações)
                          </Typography>
                        </Box>
                      </Box>

                      <Chip
                        label={psicologo.disponivelHoje ? 'Disponível hoje' : 'Amanhã'}
                        color={psicologo.disponivelHoje ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      {psicologo.disponivelHoje ? 'Horários disponíveis hoje' : 'Próxima disponibilidade'}
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
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Próximas Consultas
                  </Typography>

                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((consulta) => (
                      <Box key={consulta.id} sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <CalendarMonthIcon color="primary" />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2">{consulta.psychologist_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Data e Hora: {consulta.date_time} | Status: {consulta.status}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <CalendarMonthIcon color="primary" />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">Nenhuma consulta agendada</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Agende sua primeira consulta ao lado
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PsychologyIcon />}
                    sx={{ mt: 3 }}
                    onClick={handleOpenScheduleForm}
                  >
                    Agendar Nova Consulta
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : (
        <AIChat onClose={() => setShowChat(false)} />
      )}

      <Dialog open={openScheduleForm} onClose={() => setOpenScheduleForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>Agendar Consulta</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            select
            label="Selecione o psicólogo"
            value={selectedPsicologo?.id ?? ''}
            onChange={(event) => handleSelectPsychologist(Number(event.target.value))}
            margin="normal"
          >
            {psicologos.map((psicologo) => (
              <MenuItem key={psicologo.id} value={psicologo.id}>
                {psicologo.nome} — {psicologo.especialidade}
              </MenuItem>
            ))}
          </TextField>

          {selectedPsicologo && (
            <TextField
              fullWidth
              select
              label="Selecione o horário"
              value={selectedHorario}
              onChange={(event) => setSelectedHorario(event.target.value)}
              margin="normal"
            >
              {selectedPsicologo.horarios.map((horario) => (
                <MenuItem key={horario} value={horario}>
                  {horario}
                </MenuItem>
              ))}
            </TextField>
          )}

          {!selectedPsicologo && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Escolha um psicólogo para ver os horários disponíveis.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenScheduleForm(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmScheduleSelection}>
            Seguir para confirmar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>Confirmar Agendamento</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Você está agendando uma consulta com:
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
            Horário: {selectedHorario}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Você receberá um link de videoconferência por e-mail 15 minutos antes da consulta.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmarAgendamento}>
            Confirmar Agendamento
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAvaliacaoDialog} onClose={() => setOpenAvaliacaoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white' }}>Nova Avaliação</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" gutterBottom sx={{ mb: 2, mt: 2 }}>
            Como você está se sentindo? Avalie de 0 a 100 cada métrica.
          </Typography>
          <TextField
            label="Estresse"
            type="number"
            fullWidth
            margin="normal"
            value={newAssessment.stress || ''}
            onChange={(e) => setNewAssessment({ ...newAssessment, stress: Number(e.target.value) })}
          />
          <TextField
            label="Ansiedade"
            type="number"
            fullWidth
            margin="normal"
            value={newAssessment.anxiety || ''}
            onChange={(e) => setNewAssessment({ ...newAssessment, anxiety: Number(e.target.value) })}
          />
          <TextField
            label="Burnout"
            type="number"
            fullWidth
            margin="normal"
            value={newAssessment.burnout || ''}
            onChange={(e) => setNewAssessment({ ...newAssessment, burnout: Number(e.target.value) })}
          />
          <TextField
            label="Depressão"
            type="number"
            fullWidth
            margin="normal"
            value={newAssessment.depression || ''}
            onChange={(e) => setNewAssessment({ ...newAssessment, depression: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAvaliacaoDialog(false)}>Cancelar</Button>
          <Button variant="contained" color="secondary" onClick={handleEnviarAvaliacao}>
            Enviar Avaliação
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