import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Grid,
  Avatar,
  Chip,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon,
  Bolt as BoltIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
 
import { keyframes } from '@mui/system';
import brasaPng from '../../Icons/brasa.png';
import correntezaPng from '../../Icons/correnteza.png';
import faiscaPng from '../../Icons/faisca.png';
import fogueiraPng from '../../Icons/fogueira.png';
import infernoPng from '../../Icons/inferno.png';
import isqueiroPng from '../../Icons/isqueiro.png';
import labaredaPng from '../../Icons/labareda.png';
import gotaPng from '../../Icons/gota.png';

import oceanoPng from '../../Icons/oceano.png';
import pulmoesPng from '../../Icons/pulmoes.png';
import relogioPng from '../../Icons/relogio-de-parede.png';
import rioPng from '../../Icons/rio.png';
import soproPng from '../../Icons/sopro-de-vento.png';
import tornadoPng from '../../Icons/tornado.png';
import trofeuPng from '../../Icons/trofeu.png';
import tsunamiPng from '../../Icons/tsunami.png';
import ventoPng from '../../Icons/vento.png';


const breathIn = keyframes`
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0.3; }
`;

const breathOut = keyframes`
  0% { transform: scale(1.8); opacity: 0.3; }
  100% { transform: scale(1); opacity: 0.6; }
`;

const WORD_INTERVAL_MS = 60 * 60 * 1000;
const DAILY_WORDS = [
  'calma',
  'foco',
  'pausa',
  'respirar',
  'equilíbrio',
  'presença',
  'silêncio',
  'leveza',
  'cuidado',
  'ritmo'
];

const moodOptions = [
  { label: 'Muito mal', icon: '😣' },
  { label: 'Mal', icon: '😕' },
  { label: 'Neutro', icon: '😐' },
  { label: 'Bem', icon: '🙂' },
  { label: 'Muito bem', icon: '😁' }
];

const normalizeText = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const AchievementIcon = ({ badge, title }: { badge?: string; title?: string }) => {
  const key = normalizeText(title || badge);
  const map: Record<string, { icon?: string; bg: string }> = {
    'faisca': { icon: faiscaPng, bg: '#FFF1E6' },
    'brasa semanal': { icon: isqueiroPng, bg: '#FFF3E0' },
    'chama mensal': { icon: fogueiraPng, bg: '#FFEDE0' },
    'labareda trimestral': { icon: brasaPng, bg: '#FFE8E0' },
    'fogareu ardente': { icon: labaredaPng, bg: '#FFE8E0' },
    'fulgor eterno': { icon: infernoPng, bg: '#F3E8FF' },

    'gota iniciante': { icon: gotaPng, bg: '#E3F2FD' },
    'correnteza pesada': { icon: correntezaPng, bg: '#E8F6FF' },
    'rio profundo': { icon: rioPng, bg: '#E0F7FA' },
    'oceano eterno': { icon: oceanoPng, bg: '#FFF8E1' },
    'mare alta': { icon: tsunamiPng, bg: '#FFF4D6' },

    'relogio de agua': { icon: relogioPng, bg: '#FFF3E0' },
    'sopro': { icon: soproPng, bg: '#E8F5E9' },
    'brisa cortante': { icon: ventoPng, bg: '#F3E8FF' },
    'pulmao de aco': { icon: pulmoesPng, bg: '#FFF0F6' },
    'tornado celeste': { icon: tornadoPng, bg: '#FFF8E1' }
  };

  const found = map[key] ?? { icon: trofeuPng, bg: '#F5F5F5' };

  return (
    <Box sx={{ width: 44, height: 44, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: found.bg, boxShadow: 1 }}>
      <Box
        component="img"
        src={found.icon}
        alt={badge || title || 'badge'}
        sx={{ width: 26, height: 26, objectFit: 'contain' }}
      />
    </Box>
  );
};

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayKey = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateKey(yesterday);
};

const randomWord = () => DAILY_WORDS[Math.floor(Math.random() * DAILY_WORDS.length)];

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeStorage = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

interface BreathingPhase {
  name: string;
  duration: number;
  instruction: string;
  color: string;
}

const BreathingExercise = ({ onComplete }: { onComplete: (xp: number) => void }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [phaseTime, setPhaseTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);
  const TOTAL_DURATION = 60;
  const INHALE_DURATION = 4;
  const HOLD_DURATION = 3;
  const EXHALE_DURATION = 3;
  const intervalRef = useRef<number | null>(null);

  const phases: Record<'inhale' | 'hold' | 'exhale', BreathingPhase> = {
    inhale: {
      name: 'Inspirar',
      duration: INHALE_DURATION,
      instruction: 'Inspire contando até 4',
      color: 'primary.main'
    },
    hold: {
      name: 'Reter',
      duration: HOLD_DURATION,
      instruction: 'Segure a respiração por 3 segundos',
      color: 'warning.main'
    },
    exhale: {
      name: 'Expirar',
      duration: EXHALE_DURATION,
      instruction: 'Expire lentamente em 3 segundos',
      color: 'success.main'
    }
  };

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTotalTime((prev) => {
        const newTime = prev + 1;
        if (newTime >= TOTAL_DURATION) {
          if (!xpAwarded) {
            onComplete(50);
            setXpAwarded(true);
          }
          setIsActive(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return TOTAL_DURATION;
        }
        return newTime;
      });

      setPhaseTime((prev) => {
        const newPhaseTime = prev + 1;

        if (currentPhase === 'inhale' && newPhaseTime >= INHALE_DURATION) {
          setCurrentPhase('hold');
          return 0;
        }
        if (currentPhase === 'hold' && newPhaseTime >= HOLD_DURATION) {
          setCurrentPhase('exhale');
          return 0;
        }
        if (currentPhase === 'exhale' && newPhaseTime >= EXHALE_DURATION) {
          setCurrentPhase('inhale');
          setCyclesCompleted((prev) => prev + 1);
          return 0;
        }

        return newPhaseTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, currentPhase, onComplete, xpAwarded]);

  const handleStart = () => {
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setCurrentPhase('inhale');
    setPhaseTime(0);
    setTotalTime(0);
    setCyclesCompleted(0);
    setXpAwarded(false);
  };

  const progress = (totalTime / TOTAL_DURATION) * 100;
  const phaseProgress = (phaseTime / phases[currentPhase].duration) * 100;
  const currentPhaseInfo = phases[currentPhase];

  return (
    <Card sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            RESPIRAÇÃO GUIADA
          </Typography>
        </Box>
      </Box>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Respiração • 1min
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {currentPhaseInfo.instruction}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Fase</Typography>
                <Typography variant="body2" color="text.secondary">{phaseTime} / {phases[currentPhase].duration}s</Typography>
              </Box>
              <LinearProgress variant="determinate" value={phaseProgress} sx={{ height: 8, borderRadius: 2 }} />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Tempo</Typography>
                <Typography variant="body2" color="text.secondary">{Math.floor(totalTime / 60)}:{String(totalTime % 60).padStart(2,'0')} / 1:00</Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 2 }} />
            </Box>
          </Box>

          <Box sx={{ textAlign: 'center', width: 120 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: currentPhaseInfo.color === 'primary.main' ? 'rgba(33,150,243,0.3)' : currentPhaseInfo.color === 'warning.main' ? 'rgba(255,193,7,0.3)' : 'rgba(76,175,80,0.3)',
                border: '3px solid',
                borderColor: currentPhaseInfo.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1,
                animation: isActive ? (currentPhase === 'exhale' ? `${breathOut} ${EXHALE_DURATION}s ease-in-out infinite` : `${breathIn} ${currentPhase === 'hold' ? HOLD_DURATION : INHALE_DURATION}s ease-in-out infinite`) : 'none'
              }}
            >
              <Typography variant="h6" sx={{ color: currentPhaseInfo.color }}>{phaseTime}s</Typography>
            </Box>

            <Box>
              {!isActive ? (
                <Button variant="contained" onClick={handleStart} sx={{ borderRadius: 3 }}>
                  Iniciar
                </Button>
              ) : (
                <Button variant="contained" onClick={handlePause} sx={{ borderRadius: 3 }}>
                  Pausar
                </Button>
              )}
              <Button variant="text" onClick={handleReset} sx={{ display: 'block', mt: 1 }}>Reiniciar</Button>
            </Box>
          </Box>
        </Box>

        {progress === 100 && (
          <Box sx={{ mt: 1, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
              ✓ Sessão concluída — +50 XP
            </Typography>
            <Typography variant="caption" sx={{ color: 'success.dark', mt: 1, display: 'block' }}>
              Ciclos: {cyclesCompleted}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const DailyWordsMission = ({ onCompleteXp }: { onCompleteXp: (xp: number) => void }) => {
  const STORAGE_KEY = 'burnout-zero-daily-words';
  
  const [state, setState] = useState(() => readStorage<{
    collectedWords: string[];
    currentWord: string | null;
    nextWordAt: number;
    completed: boolean;
    xpAwarded: boolean;
  }>(STORAGE_KEY, {
    collectedWords: [],
    currentWord: null,
    nextWordAt: Date.now(),
    completed: false,
    xpAwarded: false
  }));

  const { collectedWords, currentWord, nextWordAt, completed, xpAwarded } = state;
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      
      setState(prev => {
        if (!prev.completed && !prev.currentWord && now >= prev.nextWordAt) {
          return { ...prev, currentWord: randomWord() };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    writeStorage(STORAGE_KEY, state);
  }, [state]);


  const handleRecordWord = () => {
    if (!currentWord || completed) {
      return;
    }

    const nextCollected = [...collectedWords, currentWord];
    const isFinished = nextCollected.length >= 5;

    setState(prev => ({
      ...prev,
      collectedWords: nextCollected,
      currentWord: null,
      nextWordAt: Date.now() + WORD_INTERVAL_MS,
      completed: isFinished ? true : prev.completed,
      xpAwarded: (isFinished && !prev.xpAwarded) ? true : prev.xpAwarded
    }));

    if (isFinished && !xpAwarded) {
      onCompleteXp(75);
    }
  };

  const remainingMs = Math.max(0, nextWordAt - currentTime);
  const progress = (collectedWords.length / 5) * 100;

  return (
    <Card sx={{ mb: 3, borderRadius: 2 }}>
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Missão Diária: Palavras
          </Typography>
        </Box>
      </Box>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {collectedWords.length} / 5 palavras
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Anote a palavra atual e junte 5 em ordem para concluir a missão.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 2 }} />
            </Box>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Próxima palavra em
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {currentWord ? 'agora' : `${Math.floor(remainingMs / 60000)}:${String(Math.ceil((remainingMs % 60000) / 1000)).padStart(2, '0')}`}
            </Typography>
            <Button
              variant="contained"
              onClick={handleRecordWord}
              disabled={!currentWord || completed}
              sx={{ borderRadius: 2, mt: 1 }}
            >
              Registrar palavra
            </Button>
          </Box>
        </Box>

        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Palavra atual
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
            {currentWord ?? 'Palavra registrada'}
          </Typography>
        </Box>

        {completed && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
              ✓ Missão concluída — +75 XP
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const MoodChallenge = ({ onCompleteXp }: { onCompleteXp: (xp: number) => void }) => {
  const STORAGE_KEY = 'burnout-zero-mood-challenge';
  const todayKey = getLocalDateKey();

  const [state, setState] = useState(() => readStorage<{
    selectedMood: string | null;
    claimedDate: string | null;
    history: string[];
  }>(STORAGE_KEY, {
    selectedMood: null,
    claimedDate: null,
    history: []
  }));

  const { selectedMood, claimedDate, history } = state;
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    writeStorage(STORAGE_KEY, state);
  }, [state]);

  const claimedToday = claimedDate === todayKey;

  const handleSelectMood = (label: string) => {
    if (claimedToday) {
      return;
    }

    setState((prev) => {
      const hasToday = prev.history.includes(todayKey);
      const nextHistory = hasToday ? prev.history : [...prev.history, todayKey];

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);

      const filteredHistory = nextHistory.filter((k) => {
        const d = new Date(k + 'T00:00:00');
        return d >= weekAgo;
      });

      return {
        ...prev,
        selectedMood: label,
        claimedDate: todayKey,
        history: filteredHistory
      };
    });

    onCompleteXp(50);
  };

  const getWeeklyCount = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    return history.filter((k) => {
      const d = new Date(k + 'T00:00:00');
      return d >= weekAgo;
    }).length;
  };
  const weeklyCount = getWeeklyCount();

  if (!isExpanded) {
    return (
      <Card
        variant="outlined"
        onClick={() => setIsExpanded(true)}
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
          mt: 2,
          cursor: 'pointer',
          minHeight: 140,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Box sx={{ width: '100%' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Registrar humor diário
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Clique para abrir as 5 reações e registrar seu estado.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {claimedToday ? `Registrado hoje: ${selectedMood}` : '1 vez por dia • +50 XP'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Registros esta semana: {weeklyCount} / 7
              </Typography>
            </Box>
            <Typography variant="h5">{selectedMood ? '✅' : '🙂'}</Typography>
          </Box>
        </Box>
      </Card>
    );
  }

  return (
    <Card sx={{ mt: 2, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Registrar humor diário
          </Typography>
          <Button size="small" onClick={() => setIsExpanded(false)}>
            Recolher
          </Button>
        </Box>
      </Box>
      <CardContent sx={{ flex: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Escolha 1 reação por dia. +50 XP ao registrar.
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">Registros esta semana</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress variant="determinate" value={(weeklyCount / 7) * 100} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
            <Typography variant="caption" color="text.secondary">{weeklyCount} / 7</Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(5, minmax(0, 1fr))' },
            gap: 3,
            mx: 'auto',
            maxWidth: 620,
            width: '100%'
          }}
        >
          {moodOptions.map((mood) => (
            <Box key={mood.label} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                fullWidth
                variant={selectedMood === mood.label ? 'contained' : 'outlined'}
                onClick={() => handleSelectMood(mood.label)}
                disabled={claimedToday}
                sx={{
                  py: 1.2,
                  borderRadius: 2,
                  flexDirection: 'column',
                  textTransform: 'none'
                }}
              >
                <Typography variant="h6">{mood.icon}</Typography>
                <Typography variant="caption">{mood.label}</Typography>
              </Button>
            </Box>
          ))}
        </Box>
        {selectedMood && (
          <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
            Humor registrado: {selectedMood}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const StreakChallenge = ({ onCompleteXp }: { onCompleteXp: (xp: number) => void }) => {
  const STORAGE_KEY = 'burnout-zero-streak';
  const todayKey = getLocalDateKey();
  const yesterdayKey = getYesterdayKey();

  const [state, setState] = useState(() => readStorage<{ 
    streakDays: number; 
    lastClaimDate: string | null; 
    claimedDate: string | null 
  }>(STORAGE_KEY, {
    streakDays: 0,
    lastClaimDate: null,
    claimedDate: null
  }));

  const { streakDays, lastClaimDate, claimedDate } = state;

  useEffect(() => {
    writeStorage(STORAGE_KEY, state);
  }, [state]);

  const claimedToday = claimedDate === todayKey;

  const handleClaim = () => {
    if (claimedToday) {
      return;
    }

    const nextStreak = lastClaimDate === yesterdayKey ? streakDays + 1 : 1;
    setState({
      streakDays: nextStreak,
      lastClaimDate: todayKey,
      claimedDate: todayKey
    });
    onCompleteXp(10);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, mt: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        🔥 {streakDays}
      </Typography>
      <Button variant="contained" onClick={handleClaim} disabled={claimedToday} sx={{ borderRadius: 2 }}>
        +1 dia
      </Button>
    </Box>
  );
};

const WaterChallenge = ({ onGainXp }: { onGainXp: (xp: number) => void }) => {
  const SIP_ML = 200;
  const TARGET_ML = 3000;
  const COOLDOWN_MS = 15 * 60 * 1000;
  
  const todayKey = getLocalDateKey();
  const STORAGE_KEY = 'burnout-zero-water-weekly';

  const [totalMl, setTotalMl] = useState(() => {
    const stored = readStorage<{ history: Record<string, number>; awardedDate?: string }>(STORAGE_KEY, {
      history: {},
      awardedDate: undefined
    });
    return stored.history?.[todayKey] ?? 0;
  });

  const [lastSipTime, setLastSipTime] = useState<number | null>(null);
  const [waterXp, setWaterXp] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = lastSipTime ? currentTime - lastSipTime : Infinity;
  const remainingMs = Math.max(0, COOLDOWN_MS - elapsed);

  const canSip = totalMl < TARGET_ML && (lastSipTime === null || elapsed >= COOLDOWN_MS);

  const persistToday = (ml: number) => {
    const key = STORAGE_KEY;
    const stored = readStorage<{ history: Record<string, number>; awardedDate?: string }>(key, { history: {}, awardedDate: undefined });
    const today = getLocalDateKey();
    const nextHistory = { ...(stored.history || {}) };
    nextHistory[today] = ml;
    writeStorage(key, { history: nextHistory, awardedDate: stored.awardedDate });
  };

  const handleSip = () => {
    if (!canSip) return;
    setTotalMl((v) => {
      const next = Math.min(TARGET_ML, v + SIP_ML);
      persistToday(next);
      return next;
    });
    setLastSipTime(Date.now());
    setWaterXp((x) => x + 5);
    onGainXp(5);
  };

  const formatMs = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

  const progress = (totalMl / TARGET_ML) * 100;

  return (
    <Card sx={{ mb: 3, borderRadius: 2 }}>
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Desafio: Beber Água (3L)
          </Typography>
        </Box>
      </Box>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {totalMl / 1000}L / 3L
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 2, mt: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Goles: {Math.floor(totalMl / SIP_ML)} • +5 XP por gole
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              onClick={handleSip}
              disabled={!canSip}
              sx={{ borderRadius: 2 }}
            >
              Beber 200ml
            </Button>
            {!canSip && lastSipTime && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Próximo gole em {formatMs(remainingMs)}
              </Typography>
            )}
          </Box>
        </Box>
        {waterXp > 0 && (
          <Typography variant="body2" color="success.main">
            XP ganho: +{waterXp}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default function Jornada() {
  const theme = useTheme();
  const [user, setUser] = useState({
    nome: 'Usuário',
    titulo: '',
    avatar: '',
    xp: 0,
    xpProximo: 1500,
    pontos: 0,
    diasAtivo: 0,
    level: 1,
    username: ''
  });

  const [totalXp, setTotalXp] = useState(user.xp);
  const [selectedConquestIndex, setSelectedConquestIndex] = useState<number | null>(null);
  const [openRewards, setOpenRewards] = useState(false);
  const [openObtainedConquests, setOpenObtainedConquests] = useState(false);

  const [userTiers, setUserTiers] = useState<{ consistency: number; hydration: number; breathing: number }>({ consistency: -1, hydration: -1, breathing: -1 });

  useEffect(() => {
    if (!openRewards) return;

    const streakStore = readStorage<{ streakDays?: number }>('burnout-zero-streak', { streakDays: 0 });
    const streakDays = streakStore.streakDays ?? 0;
    let consistencyTier = -1;
    if (streakDays >= 365) consistencyTier = 4; 
    else if (streakDays >= 90) consistencyTier = 3; 
    else if (streakDays >= 30) consistencyTier = 2; 
    else if (streakDays >= 7) consistencyTier = 1;
    else if (streakDays >= 1) consistencyTier = 0;

    const waterStore = readStorage<{ history: Record<string, number> }>('burnout-zero-water-weekly', { history: {} });
    const hist = waterStore.history || {};
    const dayValues = Object.values(hist || {});
    const daysWith2L = dayValues.filter((v) => v >= 2000).length;
    const daysWith1L = dayValues.filter((v) => v >= 1000).length;
    const totalMl = dayValues.reduce((s, v) => s + v, 0);
    let hydrationTier = -1;
    if (daysWith2L >= 30) hydrationTier = 3;
    else if (totalMl >= 50000) hydrationTier = 2;
    else if (daysWith2L >= 10) hydrationTier = 1;
    else if (daysWith1L >= 1) hydrationTier = 0;

    const breathStore = readStorage<{ cycles?: number }>('burnout-zero-breaths', { cycles: 0 });
    const cycles = breathStore.cycles ?? 0;
    let breathingTier = -1;
    if (cycles >= 500) breathingTier = 2;
    else if (cycles >= 100) breathingTier = 1;
    else if (cycles >= 1) breathingTier = 0;

    setUserTiers({ consistency: consistencyTier, hydration: hydrationTier, breathing: breathingTier });
  }, [openRewards]);

  // fetch profile and sync basic stats on mount
  useEffect(() => {
    let mounted = true;
    import('../services/api').then(({ default: api }) => {
      api.get('/users/me/').then((res) => {
        if (!mounted) return;
        const data = res.data || {};
        const nome = (data.first_name || data.username || data.email || 'Usuário') + (data.last_name ? ' ' + data.last_name : '');
        const username = data.username || '';
        const profile: any = {
          nome,
          titulo: '',
          avatar: (data.first_name ? data.first_name[0] : (data.username ? data.username[0] : 'U')) + (data.last_name ? data.last_name[0] : ''),
          xp: 0,
          xpProximo: 1500,
          pontos: 0,
          diasAtivo: 0,
          level: 1,
          username
        };

        // compute diasAtivo from local storage streak
        const streakStoreLocal = readStorage<{ streakDays?: number }>('burnout-zero-streak', { streakDays: 0 });
        profile.diasAtivo = streakStoreLocal.streakDays ?? 0;

        // baseline xp estimate: streakDays * 10
        profile.xp = (profile.diasAtivo || 0) * 10;
        profile.pontos = profile.xp;

        // if we have persisted pontos (XP total) use it as the canonical total
        try {
          const storedPontos = readStorage<number>('burnout-zero-pontos', profile.pontos || 0);
          profile.pontos = storedPontos;
          profile.xp = storedPontos;
        } catch {}

        setUser(profile);
        setTotalXp(profile.xp);
      }).catch(() => {
        // ignore - keep defaults
      });
    });

    return () => { mounted = false; };
  }, []);
  const navigate = useNavigate();
  const [isDailyExpanded, setIsDailyExpanded] = useState(true);
  const [isWeeklyExpanded, setIsWeeklyExpanded] = useState(true);
  const [isConquestExpanded, setIsConquestExpanded] = useState(true);

  const handleGainXp = (xp: number) => {
    setTotalXp((prev) => prev + xp);
    setUser((prev) => {
      const next = {
        ...prev,
        xp: (prev.xp || 0) + xp,
        pontos: (prev.pontos || 0) + xp
      };
      try {
        writeStorage('burnout-zero-pontos', next.pontos);
      } catch {}
      return next;
    });
  };

  const conquistas = [
    { titulo: 'Brasa Semanal', data: 'Hoje', icone: '' },
    { titulo: 'Faísca', data: '3 dias atrás', icone: '' }
  ];

    const achievementCategories = [
    {
      key: 'consistency',
      category: 'Consistência (Streak)',
      achievements: [
        { titulo: 'Faísca', requisito: 'Completar 1 desafio qualquer', xp: 50, badge: 'faisca' },
        { titulo: 'Brasa Semanal', requisito: '7 dias seguidos', xp: 200, badge: 'brasa' },
        { titulo: 'Chama Mensal', requisito: '30 dias seguidos', xp: 1000, badge: 'chama' },
        { titulo: 'Labareda Trimestral', requisito: '90 dias seguidos', xp: 5000, badge: 'labareda' },
        { titulo: 'Fogaréu Ardente', requisito: '180 dias seguidos', xp: 20000, badge: 'fogareu' },
        { titulo: 'Fulgor Eterno', requisito: '365 dias seguidos', xp: 30000, badge: 'fulgor' }
      ]
    },
    {
      key: 'hydration',
      category: 'Hidratação (Água)',
      achievements: [
        { titulo: 'Gota iniciante', requisito: 'Beber 1L em um dia', xp: 50, badge: 'gota' },
        { titulo: 'Correnteza Pesada', requisito: 'Beber 2L em um dia (10x no total)', xp: 150, badge: 'correnteza' },
        { titulo: 'Rio Profundo', requisito: 'Beber 50L acumulados (25 dias de 2L)', xp: 500, badge: 'rio' },
        { titulo: 'Oceano Eterno', requisito: 'Completar a meta de água 30 dias', xp: 2000, badge: 'oceano' },
        { titulo: 'Maré Alta', requisito: 'Beber 100L acumulados', xp: 5000, badge: 'mare' },
        { titulo: 'Relógio de Água', requisito: 'Fazer 10 goles no tempo certo (sem atrasar mais que 5 min)', xp: 300, badge: 'cronômetro' }
      ]
    },
    {
      key: 'breathing',
      category: 'Respiração e Calma',
      achievements: [
        { titulo: 'Sopro', requisito: 'Fazer 1 ciclo de respiração', xp: 30, badge: 'sopro' },
        { titulo: 'Brisa Cortante', requisito: 'Fazer 100 ciclos de respiração', xp: 400, badge: 'brisa' },
        { titulo: 'Pulmão de aço', requisito: 'Fazer 500 ciclos', xp: 1500, badge: 'pulmão aço' },
        { titulo: 'Tornado Celeste', requisito: 'Fazer 1000 ciclos', xp: 100, badge: 'tornado' }
      ]
    }
  ];

  const obtainedAchievements = achievementCategories
    .flatMap((category) =>
      category.achievements.map((achievement, index) => {
        const activeTier =
          (category.key === 'consistency' && userTiers.consistency === index) ||
          (category.key === 'hydration' && userTiers.hydration === index) ||
          (category.key === 'breathing' && userTiers.breathing === index);

        return {
          category: category.category,
          titulo: achievement.titulo,
          requisito: achievement.requisito,
          xp: achievement.xp,
          badge: achievement.badge,
          obtained: activeTier
        };
      })
    )
    .filter((achievement) => achievement.obtained);

  const WeeklyHydrationChallenge = ({ onCompleteXp }: { onCompleteXp: (xp: number) => void }) => {
    const STORAGE_KEY = 'burnout-zero-water-weekly';
    const TARGET_DAILY_ML = 2000;
    const TARGET_DAYS = 5;
    const [history, setHistory] = useState<Record<string, number>>({});
    const [awardedDate, setAwardedDate] = useState<string | undefined>(undefined);

    useEffect(() => {
      const stored = readStorage<{ history: Record<string, number>; awardedDate?: string }>(STORAGE_KEY, { history: {}, awardedDate: undefined });
      setHistory(stored.history || {});
      setAwardedDate(stored.awardedDate);
    }, []);

    const getLast7DaysCount = () => {
      const keys = Object.keys(history);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      return keys.filter((k) => {
        const d = new Date(k + 'T00:00:00');
        return d >= weekAgo && (history[k] ?? 0) >= TARGET_DAILY_ML;
      }).length;
    };

    const weeklyCount = getLast7DaysCount();

    useEffect(() => {
      if (weeklyCount >= TARGET_DAYS) {
        const lastAward = awardedDate ? new Date(awardedDate) : null;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 6);

        const alreadyAwardedThisWindow = lastAward ? lastAward >= weekAgo : false;
        if (!alreadyAwardedThisWindow) {
          onCompleteXp(250);
          const today = getLocalDateKey();
          const stored = readStorage<{ history: Record<string, number>; awardedDate?: string }>(STORAGE_KEY, { history: history || {}, awardedDate: undefined });
          writeStorage(STORAGE_KEY, { history: stored.history || {}, awardedDate: today });
          setAwardedDate(today);
        }
      }
    }, [weeklyCount, awardedDate, history, onCompleteXp]);

    const progress = Math.min(100, (weeklyCount / TARGET_DAYS) * 100);

    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Hidratação consistente
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <BoltIcon sx={{ fontSize: 16, color: 'warning.main' }} />
          <Typography variant="caption" color="warning.main">
            +250 XP (Beber 2L/dia por 5 dias)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {weeklyCount} DE {TARGET_DAYS} DIAS
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Meta semanal: beber 2L por dia durante 5 dias. Progresso conta os últimos 7 dias.
        </Typography>
      </Paper>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
      {/* Header de boas-vindas */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          SUA JORNADA DE BEM-ESTAR
        </Typography>
        <Typography variant="h5" sx={{ color: 'text.secondary', mb: 2 }}>
          Olá, {user.nome}! Vamos começar sua jornada de hoje?
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/employee')} sx={{ borderRadius: 2 }}>
            Voltar para Funcionário
          </Button>
          <Button
            variant="outlined"
            startIcon={<EmojiEventsIcon />}
            onClick={() => setOpenRewards(true)}
            sx={{ borderRadius: 2 }}
          >
            Ver Recompensas
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Coluna principal (esquerda) */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Desafios Diários: Respiração + Água */}
            <Card sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ bgcolor: 'primary.main', px: 3, py: 2, color: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Desafios Diários
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setIsDailyExpanded(!isDailyExpanded)}
                    sx={{ color: 'white' }}
                    endIcon={isDailyExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  >
                  </Button>
                </Box>
              </Box>
              {isDailyExpanded && (
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <BreathingExercise onComplete={handleGainXp} />
                    <WaterChallenge onGainXp={handleGainXp} />
                    <DailyWordsMission onCompleteXp={handleGainXp} />
                  </Box>
                </CardContent>
              )}
            </Card>

          {/* Desafios Semanais */}
          <Card sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ bgcolor: 'primary.main', px: 3, py: 2, color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Desafios Semanais
                </Typography>
                <Button
                  size="small"
                  onClick={() => setIsWeeklyExpanded(!isWeeklyExpanded)}
                  sx={{ color: 'white' }}
                  endIcon={isWeeklyExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                </Button>
              </Box>
            </Box>
            {isWeeklyExpanded && (
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <WeeklyHydrationChallenge onCompleteXp={handleGainXp} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <MoodChallenge onCompleteXp={handleGainXp} />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            )}
          </Card>

          {/* Seu equilíbrio semanal */}
          <Card sx={{ borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(20, 125, 172, 0.18)' : 'success.light', color: theme.palette.mode === 'dark' ? 'text.primary' : 'white', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">Seu equilíbrio semanal</Typography>
                  <Typography variant="body2">
                    Você está 15% mais calmo que na semana passada. Continue assim!
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'white', color: 'success.main' }}
                >
                  ELOGIOS FEITOS
                </Button>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  12
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Coluna lateral (direita) */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Perfil do usuário */}
          <Card sx={{ mb: 3, borderRadius: 2, textAlign: 'center', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: 32,
                  mx: 'auto',
                  mb: 2
                }}
              >
                {user.avatar}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {user.nome}
              </Typography>
              <Chip
                label={user.titulo}
                size="small"
                sx={{ mt: 1, mb: 2 }}
              />
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">XP atual:</Typography>
                  <Typography variant="body2" fontWeight={600}>{totalXp} / {user.xpProximo}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (totalXp / user.xpProximo) * 100)}
                  sx={{ height: 8, borderRadius: 2 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Próximo Nível: {user.xpProximo}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2, gap: 1 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                    {user.pontos}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">PONTOS</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                    {user.diasAtivo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">DIAS ATIVO</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                    {user.level}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">NÍVEL</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Conquistas Recentes */}
          <Card sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ bgcolor: 'primary.main', px: 3, py: 2, color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Conquistas Recentes
                </Typography>
                <Button
                  size="small"
                  onClick={() => setIsConquestExpanded(!isConquestExpanded)}
                  sx={{ color: 'white' }}
                  endIcon={isConquestExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                </Button>
              </Box>
            </Box>
            {isConquestExpanded && (
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                {conquistas.map((conquista, index) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={index}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        minHeight: 104,
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'grey.50',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'scale(1.05)'
                        }
                      }}
                      onClick={() => setSelectedConquestIndex(selectedConquestIndex === index ? null : index)}
                    >
                      {(() => {
                        const found = achievementCategories
                          .flatMap((c) => c.achievements)
                          .find((a) => a.titulo === conquista.titulo);
                        return (
                          <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                              width: 56,
                              height: 56,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <AchievementIcon badge={found?.badge} title={conquista.titulo} />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Clique para ver
                            </Typography>
                          </Box>
                        );
                      })()}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              {selectedConquestIndex !== null && (
                <Box sx={{ mt: 2, p: 2, borderRadius: 1, bgcolor: 'success.light' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {conquistas[selectedConquestIndex].titulo}
                  </Typography>
                  <Typography variant="caption" color="success.dark">
                    {conquistas[selectedConquestIndex].data}
                  </Typography>
                </Box>
              )}
              <StreakChallenge onCompleteXp={handleGainXp} />
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EmojiEventsIcon />}
                sx={{ mt: 3, borderRadius: 2 }}
                onClick={() => setOpenObtainedConquests(true)}
              >
                Conquistas obtidas
              </Button>
              <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1 }}>
                Veja as conquistas já desbloqueadas pelo seu progresso
              </Typography>
            </CardContent>
            )}
          </Card>
        </Grid>
      </Grid>
        {/* Rewards dialog showing tiers per category */}
        <Dialog open={openRewards} onClose={() => setOpenRewards(false)} fullWidth maxWidth="md">
          <DialogTitle>Recompensas — Tiers por Categoria</DialogTitle>
          <DialogContent>
            <Typography variant="caption" color="text.secondary">
              Cada categoria tem tiers ordenados. O usuário pode ter somente um tier ativo por categoria (escalonamento).
            </Typography>
            <Box sx={{ mt: 2 }}>
                  {achievementCategories.map((cat) => (
                    <Box key={cat.key} sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{cat.category}</Typography>
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        {cat.achievements.map((ach, ai) => (
                          <Grid size={{ xs: 12, sm: 6 }} key={ai}>
                            <Paper
                              variant="outlined"
                              sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AchievementIcon badge={ach.badge} title={ach.titulo} />
                                <Box>
                                  <Typography variant="subtitle2">{ach.titulo}</Typography>
                                  <Typography variant="caption" color="text.secondary">{ach.requisito}</Typography>
                                </Box>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{ach.xp} XP</Typography>
                                {((cat.key === 'consistency' && userTiers.consistency === ai) || (cat.key === 'hydration' && userTiers.hydration === ai) || (cat.key === 'breathing' && userTiers.breathing === ai)) && (
                                  <Chip label="Ativo" color="success" size="small" sx={{ mt: 1 }} />
                                )}
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRewards(false)}>Fechar</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openObtainedConquests} onClose={() => setOpenObtainedConquests(false)} fullWidth maxWidth="sm">
          <DialogTitle>Conquistas obtidas</DialogTitle>
          <DialogContent>
            <Typography variant="caption" color="text.secondary">
              Conquistas já desbloqueadas pelo usuário com base no progresso salvo.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {obtainedAchievements.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma conquista obtida ainda.
                </Typography>
              ) : (
                obtainedAchievements.map((achievement) => (
                  <Paper
                    key={`${achievement.category}-${achievement.titulo}`}
                    variant="outlined"
                    sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <AchievementIcon badge={achievement.badge} title={achievement.titulo} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {achievement.titulo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {achievement.category}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip label={`${achievement.xp} XP`} color="success" size="small" />
                  </Paper>
                ))
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenObtainedConquests(false)}>Fechar</Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
}