import { Fragment, useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Chip, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Collapse, IconButton, TextField, Button, Checkbox, Tabs, Tab, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import GroupIcon from '@mui/icons-material/Group';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import api from '../services/api';
import { Avatar } from '@mui/material';

interface AppAlert {
  assessment_date: string;
  employee__username: string;
}

interface DashboardData {
  recent_alerts: AppAlert[];
  team_members?: TeamMember[];
  total_team_members?: number;
  averages: {
    avg_stress: number | null;
    avg_anxiety: number | null;
    avg_burnout: number | null;
    avg_depression: number | null;
  };
}

interface TeamMember {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: 'employee' | 'psychologist' | 'manager';
}

interface SetorMetric {
  id: number;
  setor: string;
  engajamento: number;
  saude: string;
  alertas: number;
  usuarios: string[];
  usuarios_detalhes?: Array<{
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    role: 'employee' | 'psychologist' | 'manager';
    engajamento: number;
    saude: string;
    alerta: boolean;
  }>;
}

const normalizeSetores = (data: unknown): SetorMetric[] => {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    const maybeResults = (data as { results?: unknown }).results;
    if (Array.isArray(maybeResults)) {
      return maybeResults as SetorMetric[];
    }
  }

  return [];
};

export default function Manager() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [expandedSetores, setExpandedSetores] = useState<Record<number, boolean>>({});
  const [selectedSetores, setSelectedSetores] = useState<Record<number, boolean>>({});
  const [teamDetailsExpanded, setTeamDetailsExpanded] = useState(false);
  const [activeSectorTab, setActiveSectorTab] = useState<'unassigned' | 'sectors'>('unassigned');
  const [novoSetor, setNovoSetor] = useState('');
  const [createSectorDialogOpen, setCreateSectorDialogOpen] = useState(false);
  const [activeAlertsExpanded, setActiveAlertsExpanded] = useState(false);
  const [metricasSetores, setMetricasSetores] = useState<SetorMetric[]>([]);

  const loadDashboardData = async () => {
    const [dashboardRes, sectorsRes] = await Promise.all([
      api.get('/manager/team-overview/'),
      api.get('/manager/sectors/')
    ]);

    return {
      dashboardData: dashboardRes.data as DashboardData,
      sectors: normalizeSetores(sectorsRes.data)
    };
  };

  const applyDashboardData = (data: { dashboardData: DashboardData; sectors: SetorMetric[] }) => {
    setDashboardData(data.dashboardData);
    setMetricasSetores(data.sectors);
  };

  const refreshDashboard = async () => {
    const data = await loadDashboardData();
    applyDashboardData(data);
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await loadDashboardData();
        if (!cancelled) {
          applyDashboardData(data);
        }
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshSectors = async () => {
    await refreshDashboard();
  };

  const alerts = dashboardData?.recent_alerts || [];
  const teamMembers = dashboardData?.team_members || [];
  const totalTeamMembers = dashboardData?.total_team_members ?? teamMembers.length;
  const assignedUsernames = metricasSetores.flatMap((setor) => setor.usuarios || []);
  const unassignedMembers = teamMembers.filter((member) => !assignedUsernames.includes(member.username));

  const handleToggleSetor = (sectorId: number) => {
    setExpandedSetores((prev) => ({
      ...prev,
      [sectorId]: !prev[sectorId]
    }));
  };

  const handleCreateSetor = async () => {
    const nome = novoSetor.trim();
    if (!nome) {
      return;
    }

    try {
      await api.post('/manager/sectors/', { setor: nome });
      await refreshDashboard();
      setNovoSetor('');
      setCreateSectorDialogOpen(false);
      setActiveSectorTab('sectors');
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenCreateSectorDialog = () => {
    setCreateSectorDialogOpen(true);
  };

  const handleCancelCreateSector = () => {
    setNovoSetor('');
    setCreateSectorDialogOpen(false);
  };

  const handleToggleSelectSetor = (sectorId: number) => {
    setSelectedSetores((prev) => ({
      ...prev,
      [sectorId]: !prev[sectorId]
    }));
  };

  const handleDeleteSelectedSetores = async () => {
    await Promise.all(
      metricasSetores
        .filter((setor) => selectedSetores[setor.id])
        .map((setor) => api.delete(`/manager/sectors/${setor.id}/`))
    );
    await refreshSectors();
    setExpandedSetores((prev) => {
      const next: Record<number, boolean> = {};
      Object.keys(prev).forEach((setorKey) => {
        const sectorId = Number(setorKey);
        if (!selectedSetores[sectorId]) {
          next[sectorId] = prev[sectorId];
        }
      });
      return next;
    });
    setSelectedSetores({});
  };

  const hasSelectedSetores = Object.values(selectedSetores).some(Boolean);

  const handleAssignMemberToSector = async (username: string, targetSectorId: number) => {
    if (!targetSectorId) {
      return;
    }

    await api.post(`/manager/sectors/${targetSectorId}/assign/`, { username });
    await refreshSectors();
  };

  const handleRemoveMemberFromSector = async (username: string, sectorId: number) => {
    await api.post(`/manager/sectors/${sectorId}/remove_member/`, { username });
    await refreshSectors();
  };

  const activeAttentionMembers = metricasSetores
    .flatMap((sector) => (sector.usuarios_detalhes || []).filter((user) => user.alerta))
    .filter((user, index, array) => array.findIndex((item) => item.username === user.username) === index);

  const activeAlertsDisplayCount = activeAttentionMembers.length || alerts.length;
  const hasActiveAlerts = activeAlertsDisplayCount > 0;
  const averageSectorPerformance = metricasSetores.length
    ? Math.round(metricasSetores.reduce((sum, setor) => sum + setor.engajamento, 0) / metricasSetores.length)
    : 0;
  const overallSectorStatus = (() => {
    if (metricasSetores.length === 0) {
      return 'Sem dados';
    }

    if (averageSectorPerformance >= 75) return 'Ótimo';
    if (averageSectorPerformance >= 40) return 'Bom';
    return 'Ruim';
  })();

  return (
    <Box className="container">
      <Typography variant="h4" sx={{ mt: 3, mb: 4, textAlign: 'left', fontWeight: 700 }}>
        Dashboard Gerencial
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => setTeamDetailsExpanded((prev) => !prev)}>
            <CardContent sx={{ textAlign: 'center' }}>
              <GroupIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">{totalTeamMembers}</Typography>
              <Typography color="text.secondary">Total de Usuários</Typography>
            </CardContent>
          </Card>
        </Grid>

        {teamDetailsExpanded && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Colaboradores da sua empresa
              </Typography>
              {teamMembers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhum colaborador encontrado para este código da empresa.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {teamMembers.map((member) => {
                    const nomeCompleto = `${member.first_name || ''} ${member.last_name || ''}`.trim();
                    const label = nomeCompleto ? `${nomeCompleto} (${member.username})` : member.username;
                    return (
                      <Chip
                        key={member.id}
                        label={`${label} • ${member.role === 'psychologist' ? 'Psicólogo' : 'Funcionário'}`}
                        size="small"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              )}
            </Paper>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4">{averageSectorPerformance}%</Typography>
              <Typography color="text.secondary">Desempenho Semanal Médio</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssessmentIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4">{overallSectorStatus}</Typography>
              <Typography color="text.secondary">Status Geral</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card
            onClick={() => setActiveAlertsExpanded((prev) => !prev)}
            sx={{
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              border: hasActiveAlerts ? '1px solid #ef9a9a' : '1px solid transparent',
              backgroundColor: activeAlertsExpanded ? '#ffffff' : hasActiveAlerts ? '#ffcdd2' : 'background.paper',
              animation: hasActiveAlerts && !activeAlertsExpanded ? 'blinkAlert 1.1s ease-in-out infinite' : 'none',
              '@keyframes blinkAlert': {
                '0%, 100%': { backgroundColor: '#ffcdd2' },
                '50%': { backgroundColor: '#ffebee' }
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4">{activeAlertsDisplayCount}</Typography>
              <Typography color="text.secondary">Alertas Ativos</Typography>
              
            </CardContent>
            <Collapse in={activeAlertsExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ px: 2, pb: 2, textAlign: 'left' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Pessoas em alerta
                </Typography>
                {activeAttentionMembers.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {activeAttentionMembers.map((member) => {
                      const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim();
                      const label = fullName ? `${fullName} (${member.username})` : member.username;
                      const initials = (member.first_name || member.username || '?').slice(0, 1).toUpperCase();
                      return (
                        <Box
                          key={member.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 1.25,
                            py: 0.9,
                            borderRadius: 1,
                            bgcolor: '#fff8e1',
                            border: '1px solid #ffcc80'
                          }}
                        >
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'warning.main', fontSize: 14 }}>
                            {initials}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                              {label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                              Atenção ativa
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Nenhum funcionário com atenção no momento.
                  </Typography>
                )}
              </Box>
            </Collapse>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Saúde Mental por Setor</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={handleOpenCreateSectorDialog}>
                Criar setor
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteSelectedSetores}
                disabled={!hasSelectedSetores}
              >
                Excluir selecionados
              </Button>
            </Box>

            <Tabs
              value={activeSectorTab}
              onChange={(_, value) => setActiveSectorTab(value)}
              sx={{ mb: 2 }}
            >
              <Tab value="unassigned" label={`Sem setor (${unassignedMembers.length})`} />
              <Tab value="sectors" label={`Setores (${metricasSetores.length})`} />
            </Tabs>

            <Dialog open={createSectorDialogOpen} onClose={handleCancelCreateSector} fullWidth maxWidth="sm">
              <DialogTitle>Criar setor</DialogTitle>
              <DialogContent sx={{ pt: 1 }}>
                <TextField
                  autoFocus
                  fullWidth
                  margin="dense"
                  label="Nome do setor"
                  value={novoSetor}
                  onChange={(e) => setNovoSetor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateSetor();
                    }
                  }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCancelCreateSector}>Cancelar</Button>
                <Button variant="contained" onClick={handleCreateSetor}>
                  Criar
                </Button>
              </DialogActions>
            </Dialog>

            {activeSectorTab === 'unassigned' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {unassignedMembers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Todos os colaboradores já estão em algum setor.
                  </Typography>
                ) : (
                  unassignedMembers.map((member) => {
                    const nomeCompleto = `${member.first_name || ''} ${member.last_name || ''}`.trim();
                    const displayName = nomeCompleto ? `${nomeCompleto} (${member.username})` : member.username;
                    return (
                      <Paper key={member.id} variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Box sx={{ flex: 1, minWidth: 220 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {member.role === 'psychologist' ? 'Psicólogo' : 'Funcionário'} sem setor
                            </Typography>
                          </Box>
                          <TextField
                            select
                            size="small"
                            label="Selecionar setor"
                            defaultValue=""
                            sx={{ minWidth: 220 }}
                            disabled={metricasSetores.length === 0}
                            onChange={(event) => handleAssignMemberToSector(member.username, Number(event.target.value))}
                          >
                            <MenuItem value="">
                              <em>Escolher setor</em>
                            </MenuItem>
                            {metricasSetores.map((setor) => (
                              <MenuItem key={setor.id} value={setor.id}>
                                {setor.setor}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Box>
                      </Paper>
                    );
                  })
                )}
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell width={60}>Excluir</TableCell>
                      <TableCell>Setor</TableCell>
                      <TableCell>Desempenho Semanal</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Alertas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metricasSetores.map((setor) => (
                      <Fragment key={setor.id}>
                        <TableRow>
                          <TableCell>
                            <Checkbox
                              size="small"
                              checked={Boolean(selectedSetores[setor.id])}
                              onChange={() => handleToggleSelectSetor(setor.id)}
                              inputProps={{ 'aria-label': `Selecionar setor ${setor.setor} para exclusão` }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleSetor(setor.id)}
                              >
                                {expandedSetores[setor.id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                              </IconButton>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{setor.setor}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{setor.engajamento}%</TableCell>
                          <TableCell>
                            <Chip
                              label={setor.saude}
                              size="small"
                              color={setor.saude === 'Ótimo' ? 'success' : setor.saude === 'Ruim' ? 'error' : 'primary'}
                            />
                          </TableCell>
                          <TableCell>
                            {setor.alertas > 0 ? (
                              <Box component="img" src="/Icons/atencao.png" sx={{ width: 18, height: 18 }} alt="Alertas" />
                            ) : (
                              <Box component="img" src="/Icons/marca.png" sx={{ width: 18, height: 18 }} alt="OK" />
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={5} sx={{ py: 0 }}>
                            <Collapse in={Boolean(expandedSetores[setor.id])} timeout="auto" unmountOnExit>
                              <Box sx={{ py: 1.5, px: 1 }}>
                                {(setor.usuarios_detalhes || []).length > 0 ? (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {(setor.usuarios_detalhes || []).map((usuario) => {
                                      const nomeCompleto = `${usuario.first_name || ''} ${usuario.last_name || ''}`.trim() || usuario.username;
                                      return (
                                        <Paper key={`${setor.id}-${usuario.username}-detail`} variant="outlined" sx={{ p: 1 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                              {((usuario.first_name || usuario.username)[0] || '').toUpperCase()}
                                            </Avatar>

                                            <Box sx={{ flex: 1, width: 180 }}>
                                              <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 20 }}>{nomeCompleto}</Typography>
                                              <Typography variant="caption" color="text.secondary">
                                                {usuario.role === 'psychologist' ? 'Psicólogo' : 'Funcionário'}
                                              </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1, width: '100%' }}>
                                              <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'left' }}>
                                                {usuario.engajamento}%
                                              </Typography>

                                              <Box sx={{ flex: 1 }} />

                                              <Box sx={{ minWidth: 70, display: 'flex', justifyContent: 'center' }}>
                                                <Chip
                                                  label={usuario.saude}
                                                  size="small"
                                                  color={usuario.saude === 'Ótimo' ? 'success' : usuario.saude === 'Ruim' ? 'error' : 'primary'}
                                                />
                                              </Box>

                                              <Box sx={{ minWidth: 120, display: 'flex', justifyContent: 'flex-end' }}>
                                                {usuario.alerta ? (
                                                  <Box component="img" src="/Icons/atencao.png" sx={{ width: 20, height: 20 }} alt="Alerta" />
                                                ) : (
                                                  <Box component="img" src="/Icons/marca.png" sx={{ width: 20, height: 20 }} alt="OK" />
                                                )}
                                              </Box>

                                              <Box sx={{ flexGrow: 1 }} />

                                              <Button size="small" onClick={() => handleRemoveMemberFromSector(usuario.username, setor.id)}>
                                                Remover
                                              </Button>
                                            </Box>
                                          </Box>
                                        </Paper>
                                      );
                                    })}
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Nenhum usuário vinculado a este setor ainda.
                                  </Typography>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}