import { Fragment, useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Alert, Chip, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Collapse, IconButton, TextField, Button, Checkbox, Tabs, Tab, MenuItem
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
    avg_stress: number;
    avg_anxiety: number;
    avg_burnout: number;
    avg_depression: number;
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
  setor: string;
  engajamento: number;
  saude: string;
  alertas: number;
  usuarios: string[];
}

export default function Manager() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [expandedSetores, setExpandedSetores] = useState<Record<string, boolean>>({});
  const [selectedSetores, setSelectedSetores] = useState<Record<string, boolean>>({});
  const [teamDetailsExpanded, setTeamDetailsExpanded] = useState(false);
  const [activeSectorTab, setActiveSectorTab] = useState<'unassigned' | 'sectors'>('unassigned');
  const [setoresStorageKey, setSetoresStorageKey] = useState('burnout-zero-manager-setores-default');
  const [setoresReady, setSetoresReady] = useState(false);
  const [novoSetor, setNovoSetor] = useState('');
  const [metricasSetores, setMetricasSetores] = useState<SetorMetric[]>([]);

  useEffect(() => {
    api.get('/manager/team-overview/')
      .then(res => setDashboardData(res.data))
      .catch(err => console.error(err));

    api.get('/users/me/')
      .then((res) => {
        const me = res.data || {};
        const userIdentifier = me.username || me.id || 'default';
        const companyCode = me.department || 'sem-codigo';
        const key = `burnout-zero-manager-setores-${userIdentifier}-${companyCode}`;
        setSetoresStorageKey(key);
        const fallbackKey = 'burnout-zero-manager-setores-default';
        const raw = window.localStorage.getItem(key) || window.localStorage.getItem(fallbackKey);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as SetorMetric[];
            if (Array.isArray(parsed)) {
              setMetricasSetores(parsed);
              if (!window.localStorage.getItem(key)) {
                window.localStorage.setItem(key, JSON.stringify(parsed));
              }
            }
          } catch {
            setMetricasSetores([]);
          }
        } else {
          setMetricasSetores([]);
        }
        setSetoresReady(true);
      })
      .catch(() => {
        setMetricasSetores([]);
        setSetoresReady(true);
      });
  }, []);

  useEffect(() => {
    if (!setoresReady) {
      return;
    }
    window.localStorage.setItem(setoresStorageKey, JSON.stringify(metricasSetores));
  }, [metricasSetores, setoresStorageKey, setoresReady]);

  const persistMetricasSetores = (nextMetricasSetores: SetorMetric[]) => {
    setMetricasSetores(nextMetricasSetores);
    try {
      window.localStorage.setItem(setoresStorageKey, JSON.stringify(nextMetricasSetores));
    } catch {
      // ignore storage errors and keep UI state working
    }
  };

  const alerts = dashboardData?.recent_alerts || [];
  const teamMembers = dashboardData?.team_members || [];
  const totalTeamMembers = dashboardData?.total_team_members ?? teamMembers.length;
  const assignedUsernames = metricasSetores.flatMap((setor) => setor.usuarios);
  const unassignedMembers = teamMembers.filter((member) => !assignedUsernames.includes(member.username));

  const handleToggleSetor = (nomeSetor: string) => {
    setExpandedSetores((prev) => ({
      ...prev,
      [nomeSetor]: !prev[nomeSetor]
    }));
  };

  const handleCreateSetor = () => {
    const nome = novoSetor.trim();
    if (!nome) {
      return;
    }

    const alreadyExists = metricasSetores.some(
      (setor) => setor.setor.toLowerCase() === nome.toLowerCase()
    );
    if (alreadyExists) {
      return;
    }

    persistMetricasSetores([
      ...metricasSetores,
      {
        setor: nome,
        engajamento: 0,
        saude: 'Bom',
        alertas: 0,
        usuarios: []
      }
    ]);
    setNovoSetor('');
  };

  const handleToggleSelectSetor = (nomeSetor: string) => {
    setSelectedSetores((prev) => ({
      ...prev,
      [nomeSetor]: !prev[nomeSetor]
    }));
  };

  const handleDeleteSelectedSetores = () => {
    persistMetricasSetores(metricasSetores.filter((setor) => !selectedSetores[setor.setor]));
    setExpandedSetores((prev) => {
      const next: Record<string, boolean> = {};
      Object.keys(prev).forEach((setor) => {
        if (!selectedSetores[setor]) {
          next[setor] = prev[setor];
        }
      });
      return next;
    });
    setSelectedSetores({});
  };

  const hasSelectedSetores = Object.values(selectedSetores).some(Boolean);

  const handleAssignMemberToSector = (username: string, targetSetor: string) => {
    if (!targetSetor) {
      return;
    }

    persistMetricasSetores(
      metricasSetores.map((setor) => {
        const nextUsers = setor.usuarios.filter((usuario) => usuario !== username);

        if (setor.setor === targetSetor) {
          nextUsers.push(username);
        }

        return {
          ...setor,
          usuarios: nextUsers,
        };
      })
    );
  };

  const handleRemoveMemberFromSector = (username: string) => {
    persistMetricasSetores(
      metricasSetores.map((setor) => ({
        ...setor,
        usuarios: setor.usuarios.filter((usuario) => usuario !== username),
      }))
    );
  };

  const getUserByUsername = (username: string) => {
    return teamMembers.find((m) => m.username === username) || null;
  };

  const getUserAlertsCount = (username: string) => {
    return alerts.filter((a) => a.employee__username === username).length;
  };

  // deterministic pseudo-random engagement based on username
  const getUserEngagement = (username: string) => {
    try {
      const seenKey = `${setoresStorageKey}-seen-users`;
      const raw = window.localStorage.getItem(seenKey);
      const seenMap = raw ? JSON.parse(raw) as Record<string, boolean> : {};
      if (!seenMap[username]) {
        // first time we see this user in this manager+company context => default values
        seenMap[username] = true;
        try { window.localStorage.setItem(seenKey, JSON.stringify(seenMap)); } catch (e) { void e; }
        return 100;
      }
    } catch {
      // ignore localStorage errors and fall back to computed value
    }

    let h = 0;
    for (let i = 0; i < username.length; i++) {
      h = (h << 5) - h + username.charCodeAt(i);
      h |= 0;
    }
    const val = Math.abs(h) % 101; // 0..100
    return val;
  };

  const getUserHealthStatus = (engagement: number) => {
    // new thresholds: <30 -> Ruim, 31-75 -> Bom, >75 -> Ótimo
    if (engagement > 75) return 'Ótimo';
    if (engagement > 30) return 'Bom';
    return 'Ruim';
  };

  const computeSectorEngagement = (setor: SetorMetric) => {
    if (!setor.usuarios || setor.usuarios.length === 0) return 0;
    const vals = setor.usuarios.map((u) => getUserEngagement(u));
    const sum = vals.reduce((s, v) => s + v, 0);
    return Math.round(sum / vals.length);
  };

  const computeSectorHasAlert = (setor: SetorMetric) => {
    if (!setor.usuarios || setor.usuarios.length === 0) return false;
    return setor.usuarios.some((u) => {
      const engagement = getUserEngagement(u);
      const health = getUserHealthStatus(engagement);
      return health === 'Ruim' || getUserAlertsCount(u) > 0;
    });
  };

  const computeSectorHealth = (setor: SetorMetric) => {
    const avg = computeSectorEngagement(setor);
    return getUserHealthStatus(avg);
  };

  const activeAlertUsersCount = Array.from(
    new Set(
      metricasSetores.flatMap((setor) =>
        setor.usuarios.filter((usuario) => {
          const engagement = getUserEngagement(usuario);
          const healthStatus = getUserHealthStatus(engagement);
          return healthStatus === 'Ruim' || getUserAlertsCount(usuario) > 0;
        })
      )
    )
  ).length;

  const activeAttentionUsernames = Array.from(
    new Set(
      metricasSetores.flatMap((setor) =>
        setor.usuarios.filter((usuario) => {
          const engagement = getUserEngagement(usuario);
          const healthStatus = getUserHealthStatus(engagement);
          return healthStatus === 'Ruim' || getUserAlertsCount(usuario) > 0;
        })
      )
    )
  );
  const activeAttentionMembers = activeAttentionUsernames
    .map((username) => getUserByUsername(username))
    .filter((member): member is TeamMember => Boolean(member));

  const activeAlertsDisplayCount = activeAlertUsersCount > 0 ? activeAlertUsersCount : alerts.length;
  const averageSectorPerformance = metricasSetores.length
    ? Math.round(
        metricasSetores.reduce((sum, setor) => sum + computeSectorEngagement(setor), 0) /
          metricasSetores.length
      )
    : 0;
  const overallSectorStatus = (() => {
    if (metricasSetores.length === 0) {
      return 'Sem dados';
    }

    const statusScores = metricasSetores.map((setor) => {
      const status = computeSectorHealth(setor);
      if (status === 'Ótimo') return 3;
      if (status === 'Bom') return 2;
      return 1;
    });

    const averageScore = statusScores.reduce((sum, score) => sum + score, 0) / statusScores.length;

    if (averageScore >= 2.5) return 'Ótimo';
    if (averageScore >= 1.5) return 'Bom';
    return 'Ruim';
  })();

  return (
    <Box className="container">
      <Typography variant="h4" sx={{ mt: 3, mb: 4, textAlign: 'left', fontWeight: 700 }}>
        Dashboard Gerencial
      </Typography>

      <Grid container spacing={3}>
        {/* Alertas Críticos */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, bgcolor: '#ffebee', border: '1px solid #ffcdd2' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WarningIcon color="error" />
              <Typography variant="h6" color="error">Alertas da Equipe</Typography>
            </Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
              
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              {activeAttentionMembers.length > 0 ? (
                activeAttentionMembers.map((member) => {
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
                })
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum funcionário com atenção no momento.
                </Typography>
              )}
            </Box>
            {alerts.map((alerta: AppAlert, index: number) => (
              <Alert 
                key={index} 
                severity="warning" 
                sx={{ mb: 1 }}
                action={
                  <Chip 
                    label={new Date(alerta.assessment_date).toLocaleDateString()} 
                    size="small" 
                    color="warning"
                  />
                }
              >
                <strong>Usuário:</strong> {alerta.employee__username} - Avaliação de alto risco identificada.
              </Alert>
            ))}
          </Paper>
        </Grid>

        {/* Cards de Métricas Gerais */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => setTeamDetailsExpanded((prev) => !prev)}>
            <CardContent sx={{ textAlign: 'center' }}>
              <GroupIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">{totalTeamMembers}</Typography>
              <Typography color="text.secondary">Total de Usuários</Typography>
              <Typography variant="caption" color="text.secondary">
                
              </Typography>
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
              <Typography color="text.secondary">Desempenho Médio</Typography>
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
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4">{activeAlertsDisplayCount}</Typography>
              <Typography color="text.secondary">Alertas Ativos</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Tabela por Setor */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Saúde Mental por Setor</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label="Novo setor"
                value={novoSetor}
                onChange={(e) => setNovoSetor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateSetor();
                  }
                }}
              />
              <Button variant="contained" onClick={handleCreateSetor}>
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
                            onChange={(event) => handleAssignMemberToSector(member.username, event.target.value)}
                          >
                            <MenuItem value="">
                              <em>Escolher setor</em>
                            </MenuItem>
                            {metricasSetores.map((setor) => (
                              <MenuItem key={setor.setor} value={setor.setor}>
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
                    <TableCell>Desempenho</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Alertas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metricasSetores.map((setor, index) => (
                    <Fragment key={`${setor.setor}-${index}`}>
                      <TableRow>
                        <TableCell>
                          <Checkbox
                            size="small"
                            checked={Boolean(selectedSetores[setor.setor])}
                            onChange={() => handleToggleSelectSetor(setor.setor)}
                            inputProps={{ 'aria-label': `Selecionar setor ${setor.setor} para exclusão` }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleSetor(setor.setor)}
                            >
                              {expandedSetores[setor.setor] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{setor.setor}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{computeSectorEngagement(setor)}%</TableCell>
                        <TableCell>
                          <Chip
                            label={computeSectorHealth(setor)}
                            size="small"
                            color={computeSectorHealth(setor) === 'Ótimo' ? 'success' : computeSectorHealth(setor) === 'Ruim' ? 'error' : 'primary'}
                          />
                        </TableCell>
                        <TableCell>
                          {computeSectorHasAlert(setor) ? (
                            <Box component="img" src="/Icons/atencao.png" sx={{ width: 18, height: 18 }} alt="Alertas" />
                          ) : (
                            <Box component="img" src="/Icons/marca.png" sx={{ width: 18, height: 18 }} alt="OK" />
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={5} sx={{ py: 0 }}>
                          <Collapse in={Boolean(expandedSetores[setor.setor])} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 1.5, px: 1 }}>
                              {setor.usuarios.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {setor.usuarios.map((usuario) => {
                                    const member = getUserByUsername(usuario);
                                    const nomeCompleto = member ? `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.username : usuario;
                                    const engagement = getUserEngagement(usuario);
                                    const healthStatus = getUserHealthStatus(engagement);
                                    return (
                                      <Paper key={`${setor.setor}-${usuario}-detail`} variant="outlined" sx={{ p: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                          
                                          {/* Avatar */}
                                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                            {((member?.first_name || member?.username || usuario)[0] || '').toUpperCase()}
                                          </Avatar>
                                          
                                          {/* Nome e Cargo */}
                                          <Box sx={{ flex: 1, width: 180, }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 20 }}>{nomeCompleto}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                              {member?.role === 'psychologist' ? 'Psicólogo' : 'Funcionário'}
                                            </Typography>
                                          </Box>

                                          {/* CONTAINER DAS MÉTRICAS ALINHADAS EM COLUNAS */}
                                          <Box sx={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1, width: '100%' }}>
                                            <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'left' }}>
                                              {engagement}%
                                            </Typography>

                                            <Box sx={{ flex: 1 }} />

                                            <Box sx={{ minWidth: 70, display: 'flex', justifyContent: 'center' }}>
                                              <Chip
                                                label={healthStatus}
                                                size="small"
                                                color={healthStatus === 'Ótimo' ? 'success' : healthStatus === 'Ruim' ? 'error' : 'primary'}
                                              />
                                            </Box>

                                            <Box sx={{ minWidth: 120, display: 'flex', justifyContent: 'flex-end' }}>
                                              {healthStatus === 'Ruim' ? (
                                                <Box component="img" src="/Icons/atencao.png" sx={{ width: 20, height: 20 }} alt="Alerta" />
                                              ) : (
                                                <Box component="img" src="/Icons/marca.png" sx={{ width: 20, height: 20 }} alt="OK" />
                                              )}
                                            </Box>

                                            {/* Espaçador invisível que empurra o botão Remover totalmente para a direita */}
                                            <Box sx={{ flexGrow: 1 }} />
                                            
                                            {/* Botão Remover */}
                                            <Button size="small" onClick={() => handleRemoveMemberFromSector(usuario)}>
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