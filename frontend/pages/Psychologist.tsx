import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Paper, Avatar, Chip, Card, CardContent, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Divider, LinearProgress,
  Tabs, Tab, Badge, IconButton, Tooltip, Alert, Snackbar, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Skeleton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import PeopleIcon from '@mui/icons-material/People';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import api from '../services/api';

type EmployeeData = number | { id: number; username: string; first_name?: string; last_name?: string; email?: string };

interface Patient {
  id: number;
  employee: EmployeeData;
  date: string;
  status: string;
  private_notes?: string;
}

interface Insight {
  id: number;
  text: string;
  recommendations: string;
  generated_at: string;
  validated_at: string | null;
  validated_by: number | null;
  employee: number;
  assessment: number;
}

interface Assessment {
  id: number;
  employee: number;
  stress: number;
  anxiety: number;
  burnout: number;
  depression: number;
  risk_level: 'low' | 'medium' | 'high';
  assessment_date: string;
}

interface Appointment {
  id: number;
  employee: EmployeeData;
  psychologist_name: string;
  date_time: string;
  status: string;
  created_at?: string;
}

interface PatientDetail {
  patient: Patient;
  assessments: Assessment[];
  insights: Insight[];
}

interface DashboardStats {
  total_patients: number;
  active_patients: number;
  improving_count: number;
  attention_count: number;
  monthly_appointments: number;
  pending_insights: number;
}

const getEmployeeId = (employee: EmployeeData): number => {
  if (typeof employee === 'number') return employee;
  return employee.id;
};

const getPatientName = (employee: EmployeeData): string => {
  if (typeof employee === 'number') {
    return `Paciente #${employee}`;
  }
  const fn = employee.first_name || '';
  const ln = employee.last_name || '';
  return [fn, ln].filter(Boolean).join(' ') || employee.username || 'Paciente';
};

const getPatientUsername = (employee: EmployeeData): string => {
  if (typeof employee === 'number') {
    return `ID: ${employee}`;
  }
  return employee.username;
};

const getInitials = (name: string): string =>
  name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

const getRiskColor = (risk: string): 'success' | 'warning' | 'error' => {
  if (risk === 'high') return 'error';
  if (risk === 'medium') return 'warning';
  return 'success';
};

const getRiskLabel = (risk: string): string => {
  if (risk === 'high') return 'Alto';
  if (risk === 'medium') return 'Médio';
  return 'Baixo';
};

const AVATAR_COLORS = ['#147DAC', '#AE45AF', '#157FAE', '#1b7a5a', '#7c5cbf', '#b05c2e'];
const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const MetricMini = ({ value }: { value: number }) => {
  const color = value > 70 ? '#d32f2f' : value > 40 ? '#f57c00' : '#2e7d32';
  return (
    <Box sx={{ minWidth: 52 }}>
      <Typography variant="caption" sx={{ color, fontWeight: 600 }}>{value}</Typography>
      <LinearProgress variant="determinate" value={Math.min(value, 100)}
        sx={{ height: 3, borderRadius: 2, mt: 0.25, bgcolor: 'rgba(0,0,0,0.06)',
          '& .MuiLinearProgress-bar': { bgcolor: color } }} />
    </Box>
  );
};

const PatientDetailModal = ({
  detail, open, onClose, onInsightValidated,
}: {
  detail: PatientDetail | null;
  open: boolean;
  onClose: () => void;
  onInsightValidated: () => void;
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [editingInsight, setEditingInsight] = useState<Insight | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  if (!detail) return null;

  const name = getPatientName(detail.patient.employee);
  const initials = getInitials(name);
  const avatarColor = getAvatarColor(name);
  const lastAssessment = detail.assessments[0] || null;
  const pendingInsights = detail.insights.filter(i => !i.validated_by).length;

  const avgOf = (key: keyof Assessment): number => {
    if (!detail.assessments.length) return 0;
    return Math.round(detail.assessments.reduce((s, a) => s + (a[key] as number), 0) / detail.assessments.length);
  };

  const handleSaveInsight = async () => {
    if (!editingInsight) return;
    setSaving(true);
    try {
      await api.patch(`/insights/${editingInsight.id}/validate_insight/`, {
        text: editingInsight.text,
        recommendations: editingInsight.recommendations,
      });
      setSnackbar({ open: true, message: 'Insight validado!', severity: 'success' });
      setEditingInsight(null);
      onInsightValidated();
    } catch {
      setSnackbar({ open: true, message: 'Erro ao validar insight.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: avatarColor, width: 48, height: 48, fontSize: 18, fontWeight: 600 }}>
              {initials}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>{name}</Typography>
              <Typography variant="caption" color="text.secondary">
                @{getPatientUsername(detail.patient.employee)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={detail.patient.status === 'active' || detail.patient.status === 'ativo' ? 'Ativo' : detail.patient.status}
                color={detail.patient.status === 'active' || detail.patient.status === 'ativo' ? 'success' : 'default'}
                size="small" />
              {lastAssessment && (
                <Chip label={`Risco: ${getRiskLabel(lastAssessment.risk_level)}`}
                  color={getRiskColor(lastAssessment.risk_level)} size="small" variant="outlined" />
              )}
            </Box>
          </Box>
        </DialogTitle>

        <Divider />

        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <Grid container spacing={1.5}>
            {[
              { label: 'Avaliações', value: detail.assessments.length, color: '#147DAC' },
              { label: 'Insights', value: detail.insights.length, color: '#AE45AF' },
              { label: 'Pendentes', value: pendingInsights, color: pendingInsights > 0 ? '#f57c00' : '#2e7d32' },
              { label: 'Estresse médio', value: `${avgOf('stress')}%`, color: avgOf('stress') > 60 ? '#d32f2f' : '#2e7d32' },
            ].map((c, i) => (
              <Grid key={i} size={{ xs: 6, sm: 3 }}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={700} sx={{ color: c.color }}>{c.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 3 }}>
          <Tab label="Avaliações" />
          <Tab label={<Badge badgeContent={pendingInsights} color="warning">Insights</Badge>} />
          <Tab label="Anotações" />
        </Tabs>
        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          {activeTab === 0 && (
            detail.assessments.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <AssessmentIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">Nenhuma avaliação registrada.</Typography>
              </Box>
            ) : (
              <>
                {lastAssessment && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                      Última avaliação — {new Date(lastAssessment.assessment_date).toLocaleDateString('pt-BR')}
                    </Typography>
                    <Grid container spacing={2}>
                      {([
                        { label: 'Estresse', value: lastAssessment.stress, color: '#e65100' },
                        { label: 'Ansiedade', value: lastAssessment.anxiety, color: '#6a1b9a' },
                        { label: 'Burnout', value: lastAssessment.burnout, color: '#d32f2f' },
                        { label: 'Depressão', value: lastAssessment.depression, color: '#1565c0' },
                      ]).map(m => (
                        <Grid key={m.label} size={{ xs: 6, sm: 3 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 0.5 }}>
                              <CircularProgress variant="determinate" value={m.value}
                                size={56} thickness={5}
                                sx={{ color: m.color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
                              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant="caption" fontWeight={700} sx={{ color: m.color }}>{m.value}</Typography>
                              </Box>
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block">{m.label}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Histórico completo</Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell>Data</TableCell>
                        <TableCell>Estresse</TableCell>
                        <TableCell>Ansiedade</TableCell>
                        <TableCell>Burnout</TableCell>
                        <TableCell>Depressão</TableCell>
                        <TableCell>Risco</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detail.assessments.map(a => (
                        <TableRow key={a.id} hover>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(a.assessment_date).toLocaleDateString('pt-BR', {
                                day: '2-digit', month: '2-digit', year: '2-digit',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell><MetricMini value={a.stress} /></TableCell>
                          <TableCell><MetricMini value={a.anxiety} /></TableCell>
                          <TableCell><MetricMini value={a.burnout} /></TableCell>
                          <TableCell><MetricMini value={a.depression} /></TableCell>
                          <TableCell>
                            <Chip label={getRiskLabel(a.risk_level)} size="small"
                              color={getRiskColor(a.risk_level)} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )
          )}

          {activeTab === 1 && (
            detail.insights.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <PsychologyIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">Nenhum insight gerado para este paciente.</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {detail.insights.map(insight => (
                  <Paper key={insight.id} variant="outlined" sx={{ p: 2, borderRadius: 2,
                    borderLeft: `4px solid ${insight.validated_by ? '#2e7d32' : '#f57c00'}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {insight.validated_by
                          ? <Chip icon={<CheckCircleOutlineIcon />} label="Validado" color="success" size="small" />
                          : <Chip icon={<AccessTimeIcon />} label="Pendente" color="warning" size="small" />}
                        <Typography variant="caption" color="text.secondary">
                          {new Date(insight.generated_at).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>
                      {!insight.validated_by && (
                        <Tooltip title="Analisar e validar">
                          <IconButton size="small" onClick={() => setEditingInsight({ ...insight })}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>{insight.text}</Typography>
                    {insight.recommendations && (
                      <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Recomendações</Typography>
                        <Typography variant="body2" color="text.secondary">{insight.recommendations}</Typography>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            )
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Anotações privadas — visíveis apenas para você.
              </Typography>
              <TextField multiline rows={8} fullWidth
                placeholder="Escreva suas anotações clínicas aqui..."
                defaultValue={detail.patient.private_notes || ''}
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              <Button variant="contained" sx={{ mt: 2 }}>Salvar anotações</Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editingInsight} onClose={() => setEditingInsight(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>Validar Insight</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField label="Texto do Insight" multiline rows={4} fullWidth margin="normal"
            value={editingInsight?.text || ''}
            onChange={e => editingInsight && setEditingInsight({ ...editingInsight, text: e.target.value })} />
          <TextField label="Recomendações" multiline rows={4} fullWidth margin="normal"
            value={editingInsight?.recommendations || ''}
            onChange={e => editingInsight && setEditingInsight({ ...editingInsight, recommendations: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditingInsight(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveInsight} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar e Validar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled"
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

const PatientRow = ({
  patient, insights, onView,
}: {
  patient: Patient;
  insights: Insight[];
  onView: () => void;
}) => {
  const name = getPatientName(patient.employee);
  const employeeId = getEmployeeId(patient.employee);
  const initials = getInitials(name);
  const avatarColor = getAvatarColor(name);
  const pending = insights.filter(i => i.employee === employeeId && !i.validated_by).length;
  const patientInsights = insights.filter(i => i.employee === employeeId);
  const lastInsight = patientInsights[0] || null;

  const riskFromInsight = lastInsight
    ? lastInsight.text.includes('elevado') ? 'high'
      : lastInsight.text.includes('moderado') ? 'medium' : 'low'
    : null;

  return (
    <TableRow hover sx={{ cursor: 'pointer' }} onClick={onView}>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Badge badgeContent={pending} color="warning" overlap="circular">
            <Avatar sx={{ bgcolor: avatarColor, width: 36, height: 36, fontSize: 14, fontWeight: 600 }}>
              {initials}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="body2" fontWeight={600}>{name}</Typography>
            <Typography variant="caption" color="text.secondary">@{getPatientUsername(patient.employee)}</Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={patient.status === 'active' || patient.status === 'ativo' ? 'Ativo' : patient.status}
          color={patient.status === 'active' || patient.status === 'ativo' ? 'success' : 'default'}
          size="small" sx={{ fontSize: 11 }} />
      </TableCell>
      <TableCell>
        {riskFromInsight ? (
          <Chip label={getRiskLabel(riskFromInsight)} color={getRiskColor(riskFromInsight)}
            size="small" variant="outlined" sx={{ fontSize: 11 }} />
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        )}
      </TableCell>
      <TableCell>
        <Typography variant="caption" color="text.secondary">
          {new Date(patient.date).toLocaleDateString('pt-BR')}
        </Typography>
      </TableCell>
      <TableCell>
        {pending > 0
          ? <Chip icon={<NotificationsActiveIcon />} label={`${pending} pendente${pending > 1 ? 's' : ''}`} color="warning" size="small" />
          : <Typography variant="caption" color="success.main">✓ Em dia</Typography>}
      </TableCell>
      <TableCell align="right">
        <Tooltip title="Ver detalhes">
          <IconButton size="small" onClick={e => { e.stopPropagation(); onView(); }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

export default function Psychologist() {
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState(0);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [allInsights, setAllInsights] = useState<Insight[]>([]);
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedDetail, setSelectedDetail] = useState<PatientDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending'>('all');

  const [openInsightValidate, setOpenInsightValidate] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [savingInsight, setSavingInsight] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const [patientsRes, insightsRes, statsRes, apptRes] = await Promise.all([
        api.get('/follow-ups/').catch(() => ({ data: [] })),
        api.get('/insights/').catch(() => ({ data: [] })),
        api.get('/psychologist/dashboard/').catch(() => ({ data: null })),
        api.get('/appointments/').catch(() => ({ data: [] })),
      ]);
      setPatients(patientsRes.data || []);
      setAllInsights(insightsRes.data || []);
      setDashStats(statsRes.data);
      setAppointments(apptRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleViewPatient = async (patient: Patient) => {
    setLoadingDetail(true);
    setDetailOpen(true);
    try {
      const assessRes = await api.get('/assessments/').catch(() => ({ data: [] }));
      const employeeId = getEmployeeId(patient.employee);
      
      const patientAssessments: Assessment[] = (assessRes.data || [])
        .filter((a: Assessment) => a.employee === employeeId)
        .sort((a: Assessment, b: Assessment) =>
          new Date(b.assessment_date).getTime() - new Date(a.assessment_date).getTime());
          
      const patientInsights: Insight[] = allInsights
        .filter((i: Insight) => i.employee === employeeId)
        .sort((a: Insight, b: Insight) =>
          new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
          
      setSelectedDetail({ patient, assessments: patientAssessments, insights: patientInsights });
    } catch {
      setSelectedDetail({ patient, assessments: [], insights: [] });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleValidateInsight = async () => {
    if (!selectedInsight) return;
    setSavingInsight(true);
    try {
      await api.patch(`/insights/${selectedInsight.id}/validate_insight/`, {
        text: selectedInsight.text,
        recommendations: selectedInsight.recommendations,
      });
      setOpenInsightValidate(false);
      setSnackbar({ open: true, message: 'Insight validado com sucesso!', severity: 'success' });
      fetchData(true);
    } catch {
      setSnackbar({ open: true, message: 'Erro ao validar insight.', severity: 'error' });
    } finally {
      setSavingInsight(false);
    }
  };

  const totalPatients = dashStats?.total_patients ?? patients.length;
  const activePatients = dashStats?.active_patients ?? patients.filter(p => p.status === 'active' || p.status === 'ativo').length;
  const improvingCount = dashStats?.improving_count ?? 0;
  const attentionCount = dashStats?.attention_count ?? 0;
  const monthlyAppointments = dashStats?.monthly_appointments ?? appointments.length;
  const pendingInsightsCount = dashStats?.pending_insights ?? allInsights.filter(i => !i.validated_by).length;

  const pendingInsights = allInsights.filter(i => !i.validated_by);

  const validatedThisMonth = allInsights.filter(i => {
    if (!i.validated_at) return false;
    const d = new Date(i.validated_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const highRiskPatients = patients.filter(p => {
    const employeeId = getEmployeeId(p.employee);
    return allInsights.some(i => i.employee === employeeId && !i.validated_by && i.text.includes('elevado'));
  });

  const filteredPatients = patients.filter(p => {
    const employeeId = getEmployeeId(p.employee);
    if (filterStatus === 'active') return p.status === 'active' || p.status === 'ativo';
    if (filterStatus === 'pending') return allInsights.some(i => i.employee === employeeId && !i.validated_by);
    return true;
  });

  const mediumRiskCount = patients.filter(p => {
    const employeeId = getEmployeeId(p.employee);
    return allInsights.some(i => i.employee === employeeId && !i.validated_by && i.text.includes('moderado'));
  }).length;

  const lowRiskCount = totalPatients - highRiskPatients.length - mediumRiskCount;

  const riskData = [
    { name: 'Alto Risco', value: highRiskPatients.length, color: '#d32f2f' },
    { name: 'Médio Risco', value: mediumRiskCount, color: '#f57c00' },
    { name: 'Baixo Risco', value: lowRiskCount > 0 ? lowRiskCount : 0, color: '#2e7d32' }
  ].filter(d => d.value > 0);

  const statCards = [
    { value: loading ? '—' : totalPatients, label: 'Total de Pacientes', sub: `${activePatients} ativos`, color: '#147DAC' },
    { value: loading ? '—' : improvingCount, label: 'Em melhora', sub: 'risco caiu na última avaliação', color: '#2e7d32' },
    { value: loading ? '—' : monthlyAppointments, label: 'Consultas este mês', sub: 'agendamentos', color: '#AE45AF' },
    { value: loading ? '—' : pendingInsightsCount, label: 'Insights pendentes', sub: 'aguardando validação', color: pendingInsightsCount > 0 ? '#f57c00' : '#2e7d32' },
  ];

  return (
    <Box className="container" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{
            background: 'linear-gradient(135deg, #147DAC 0%, #AE45AF 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Dashboard do Psicólogo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Acompanhamento clínico e gestão da sua agenda
          </Typography>
        </Box>
        <Tooltip title="Atualizar dados">
          <IconButton onClick={() => fetchData(true)} disabled={refreshing}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <RefreshIcon sx={{
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
            }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Visão Geral" />
          <Tab label="Minha Agenda" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          {!loading && highRiskPatients.length > 0 && (
            <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {highRiskPatients.length} paciente{highRiskPatients.length > 1 ? 's' : ''} com indicadores de alto risco aguardando atenção
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {highRiskPatients.slice(0, 3).map(p => (
                    <Chip key={p.id} label={getPatientName(p.employee)} size="small"
                      sx={{ bgcolor: alpha('#d32f2f', 0.1), color: 'error.dark', cursor: 'pointer' }}
                      onClick={() => handleViewPatient(p)} />
                  ))}
                </Box>
              </Box>
            </Alert>
          )}

          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {statCards.map((card, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card elevation={0} sx={{
                  border: '1px solid', borderColor: 'divider', borderRadius: 3,
                  '&:hover': { borderColor: card.color, boxShadow: `0 4px 20px ${alpha(card.color, 0.15)}` },
                  transition: 'all 0.2s ease',
                }}>
                  <CardContent sx={{ p: 2.5 }}>
                    {loading
                      ? <Skeleton height={80} />
                      : <>
                        <Typography variant="h3" fontWeight={700} sx={{ color: card.color, mb: 0.25 }}>
                          {card.value}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>{card.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{card.sub}</Typography>
                      </>}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {!loading && attentionCount > 0 && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                {attentionCount} paciente{attentionCount > 1 ? 's' : ''} com alto risco na última avaliação requerem atenção prioritária.
              </Typography>
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PeopleIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>Meus Pacientes</Typography>
                    {!loading && <Chip label={filteredPatients.length} size="small" color="primary" />}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {(['all', 'active', 'pending'] as const).map(f => (
                      <Chip key={f}
                        label={f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Com pendências'}
                        onClick={() => setFilterStatus(f)}
                        color={filterStatus === f ? 'primary' : 'default'}
                        variant={filterStatus === f ? 'filled' : 'outlined'}
                        size="small" sx={{ cursor: 'pointer' }} />
                    ))}
                  </Box>
                </Box>
                <Divider />

                {loading ? (
                  <Box sx={{ p: 2 }}>
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={56} sx={{ mb: 1 }} />)}
                  </Box>
                ) : filteredPatients.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                    <Typography color="text.secondary">Nenhum paciente encontrado.</Typography>
                    <Typography variant="caption" color="text.disabled">
                      {filterStatus !== 'all'
                        ? 'Tente mudar o filtro.'
                        : 'Pacientes aparecem quando você inicia um follow-up.'}
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                          <TableCell sx={{ fontWeight: 600 }}>Paciente</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Risco</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Início</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Insights</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredPatients.map(patient => (
                          <PatientRow key={patient.id} patient={patient} insights={allInsights}
                            onView={() => handleViewPatient(patient)} />
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AssessmentIcon sx={{ color: '#147DAC' }} />
                  <Typography variant="h6" fontWeight={700}>Distribuição de Risco</Typography>
                </Box>
                <Divider />
                <Box sx={{ p: 2, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {loading ? (
                    <CircularProgress />
                  ) : riskData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={riskData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {riskData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography color="text.secondary">Dados insuficientes</Typography>
                  )}
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PsychologyIcon sx={{ color: '#AE45AF' }} />
                  <Typography variant="h6" fontWeight={700}>Insights para Validar</Typography>
                  {!loading && pendingInsights.length > 0 && (
                    <Chip label={pendingInsights.length} size="small" color="warning" />
                  )}
                </Box>
                <Divider />

                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 400, overflowY: 'auto' }}>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={80} sx={{ borderRadius: 2 }} />)
                  ) : pendingInsights.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">Todos os insights estão validados!</Typography>
                    </Box>
                  ) : (
                    pendingInsights.slice(0, 15).map(insight => {
                      const patient = patients.find(p => getEmployeeId(p.employee) === insight.employee);
                      const patientName = patient ? getPatientName(patient.employee) : `Paciente #${insight.employee}`;
                      const isHigh = insight.text.includes('elevado');
                      return (
                        <Paper key={insight.id} variant="outlined" sx={{
                          p: 2, borderRadius: 2, cursor: 'pointer',
                          borderLeft: `3px solid ${isHigh ? '#d32f2f' : '#f57c00'}`,
                          '&:hover': { bgcolor: 'action.hover' }, transition: 'background 0.15s',
                        }}
                          onClick={() => { setSelectedInsight({ ...insight }); setOpenInsightValidate(true); }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="caption" fontWeight={700}>{patientName}</Typography>
                            {isHigh && <Chip label="Alto risco" color="error" size="small" sx={{ height: 18, fontSize: 10 }} />}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1,
                          }}>
                            {insight.text}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.disabled">
                              {new Date(insight.generated_at).toLocaleDateString('pt-BR')}
                            </Typography>
                            <Button size="small" variant="outlined" sx={{ height: 24, fontSize: 11, py: 0 }}
                              onClick={e => { e.stopPropagation(); setSelectedInsight({ ...insight }); setOpenInsightValidate(true); }}>
                              Validar
                            </Button>
                          </Box>
                        </Paper>
                      );
                    })
                  )}
                </Box>

                {!loading && validatedThisMonth.length > 0 && (
                  <>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>VALIDADOS ESTE MÊS</Typography>
                      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {validatedThisMonth.slice(0, 3).map(i => (
                          <Box key={i.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 14, color: 'success.main' }} />
                            <Typography variant="caption" color="text.secondary" sx={{
                              flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {i.text.slice(0, 50)}…
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, minHeight: 400 }}>
            <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CalendarMonthIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>Minha Agenda de Consultas</Typography>
              </Box>
              <Button variant="outlined" startIcon={<EventAvailableIcon />}>
                Adicionar Horário
              </Button>
            </Box>
            <Divider />

            <Box sx={{ p: 2 }}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={70} sx={{ mb: 2, borderRadius: 2 }} />)
              ) : appointments.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <CalendarMonthIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">Nenhuma consulta agendada.</Typography>
                  <Typography variant="body2" color="text.disabled">Seus horários aparecerão aqui quando os pacientes agendarem.</Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {appointments.map(appointment => {
                    const patientName = getPatientName(appointment.employee);
                    const initials = getInitials(patientName);
                    const isCompleted = appointment.status.toLowerCase() === 'completed' || appointment.status.toLowerCase() === 'concluído';
                    
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={appointment.id}>
                        <Card variant="outlined" sx={{ 
                          borderRadius: 2, 
                          display: 'flex', 
                          opacity: isCompleted ? 0.7 : 1,
                          bgcolor: isCompleted ? 'action.hover' : 'background.paper',
                        }}>
                          <Box sx={{ 
                            p: 2, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            minWidth: 100,
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            bgcolor: isCompleted ? 'transparent' : alpha(theme.palette.primary.main, 0.05)
                          }}>
                            <Typography variant="h6" color="primary" fontWeight={700}>
                              {appointment.date_time.split(' ')[1] || appointment.date_time}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              {appointment.date_time.split(' ')[0] || 'Hoje'}
                            </Typography>
                          </Box>
                          
                          <CardContent sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                            <Avatar sx={{ bgcolor: getAvatarColor(patientName), width: 40, height: 40 }}>
                              {initials}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" fontWeight={600}>{patientName}</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip 
                                  label={appointment.status} 
                                  size="small" 
                                  color={isCompleted ? "default" : "primary"}
                                  variant={isCompleted ? "outlined" : "filled"}
                                  sx={{ fontSize: 11, height: 20 }}
                                />
                                {appointment.created_at && (
                                  <Typography variant="caption" color="text.disabled">
                                    Agendado em: {new Date(appointment.created_at).toLocaleDateString('pt-BR')}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            <Tooltip title="Acessar Prontuário">
                              <IconButton size="small" color="primary" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                                <AssignmentIndIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          </Paper>
        </Box>
      )}

      {loadingDetail && detailOpen && (
        <Dialog open maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, p: 4, textAlign: 'center' } }}>
          <CircularProgress sx={{ mx: 'auto', mb: 2 }} />
          <Typography color="text.secondary">Carregando dados do paciente...</Typography>
        </Dialog>
      )}
      {!loadingDetail && (
        <PatientDetailModal
          detail={selectedDetail}
          open={detailOpen && !!selectedDetail}
          onClose={() => { setDetailOpen(false); setSelectedDetail(null); }}
          onInsightValidated={() => fetchData(true)}
        />
      )}

      <Dialog open={openInsightValidate} onClose={() => setOpenInsightValidate(false)}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>Validar Insight</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField label="Texto do Insight" multiline rows={4} fullWidth margin="normal"
            value={selectedInsight?.text || ''}
            onChange={e => selectedInsight && setSelectedInsight({ ...selectedInsight, text: e.target.value })} />
          <TextField label="Recomendações" multiline rows={4} fullWidth margin="normal"
            value={selectedInsight?.recommendations || ''}
            onChange={e => selectedInsight && setSelectedInsight({ ...selectedInsight, recommendations: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenInsightValidate(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleValidateInsight} disabled={savingInsight}>
            {savingInsight ? 'Salvando...' : 'Salvar e Validar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={5000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled"
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}