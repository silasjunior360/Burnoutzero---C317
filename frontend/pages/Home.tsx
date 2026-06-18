import { useState, useEffect, useRef, useCallback } from 'react';
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import api from '../services/api';
import {
  EmojiEvents as EmojiEventsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import ChatIcon from '@mui/icons-material/Chat';

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

import cascalhoPng from '../../Icons/cascalho.png';
import bronzePng from '../../Icons/bronze.png';
import ferroPng from '../../Icons/ferro.png';
import ouroPng from '../../Icons/ouro.png';
import prataPng from '../../Icons/prata.png';
import obsidianaPng from '../../Icons/obsidiana.png';
import diamantePng from '../../Icons/diamante.png';


const breathIn = keyframes`
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0.3; }
`;

const breathOut = keyframes`
  0% { transform: scale(1.8); opacity: 0.3; }
  100% { transform: scale(1); opacity: 0.6; }
`;

const FAST_TEST_MODE = false;
const testTiming = <T extends number>(normalValue: T) => (FAST_TEST_MODE ? (1 as T) : normalValue);

const getXpRequiredForNextLevel = (level: number): number => {
  if (level <= 1) {
    return 200;
  }

  if (level <= 9) {
    return (level + 1) * 100;
  }

  if (level <= 19) {
    return 1000 + ((level - 9) * 200);
  }

  if (level <= 29) {
    return 3000 + ((level - 19) * 300);
  }

  if (level <= 39) {
    return 6000 + ((level - 29) * 400);
  }

  return 10000 + ((level - 39) * 500);
};

const getXpTotalForLevel = (level: number) => {
  if (level <= 1) {
    return 0;
  }

  let totalXp = 0;
  for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
    totalXp += getXpRequiredForNextLevel(currentLevel);
  }

  return totalXp;
};

const getXpNextLevel = (totalXp: number) => {
  let level = 1;
  let currentXp = totalXp;

  while (currentXp >= getXpRequiredForNextLevel(level)) {
    currentXp -= getXpRequiredForNextLevel(level);
    level += 1;
  }

  return getXpRequiredForNextLevel(level);
};

const WORD_POOL = [
  'céu', 'azul', 'avião', 'verde', 'torre', 'nuvem', 'sol', 'mar',
  'rio', 'vento', 'pedra', 'fogo', 'gelo', 'casa', 'porta', 'janela',
  'luz', 'sombra', 'raiz', 'flor'
];

const ORDINALS = ['primeira', 'segunda', 'terceira', 'quarta', 'quinta'];
const WORD_INTERVAL_MS = testTiming(50 * 60 * 1000);

const moodOptions = [
  { label: 'Muito mal', icon: '😣' },
  { label: 'Mal', icon: '😕' },
  { label: 'Neutro', icon: '😐' },
  { label: 'Bem', icon: '🙂' },
  { label: 'Muito bem', icon: '😁' }
];

const weeklyMissionOptions = [
  { label: 'Péssimo', value: 'pessimo', score: 20 },
  { label: 'Ruim', value: 'ruim', score: 40 },
  { label: 'Neutro', value: 'neutro', score: 60 },
  { label: 'Bom', value: 'bom', score: 80 },
  { label: 'Ótimo', value: 'otimo', score: 100 }
];

const weeklyMissionScoreMap = weeklyMissionOptions.reduce<Record<string, number>>((accumulator, option) => {
  accumulator[option.value] = option.score;
  return accumulator;
}, {});

const normalizeText = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const resolveHomeRouteFromUser = (userData: {
  role?: string;
  user_type?: string;
  userType?: string;
  tipo?: string;
  tipo_usuario?: string;
  profile_type?: string;
}) => {
  const rawType =
    userData.role ||
    userData.user_type ||
    userData.userType ||
    userData.tipo ||
    userData.tipo_usuario ||
    userData.profile_type ||
    'employee';

  const normalizedType = normalizeText(rawType);

  if (normalizedType.includes('manager') || normalizedType.includes('gerente')) {
    return '/manager';
  }

  if (normalizedType.includes('psychologist') || normalizedType.includes('psicologo') || normalizedType.includes('psicologa')) {
    return '/psychologist';
  }

  return '/employee';
};

const AchievementIcon = ({ badge, title }: { badge?: string; title?: string }) => {
  const keyTitle = normalizeText(title);
  const keyBadge = normalizeText(badge);
  const map: Record<string, { icon?: string; bg: string }> = {
    'faisca': { icon: faiscaPng, bg: '#FFF1E6' },
    'brasa semanal': { icon: isqueiroPng, bg: '#FFF3E0' },
    'chama mensal': { icon: fogueiraPng, bg: '#FFEDE0' },
    'labareda trimestral': { icon: brasaPng, bg: '#ffc8b6' },
    'fogareu ardente': { icon: labaredaPng, bg: '#fdb9b9' },
    'fulgor eterno': { icon: infernoPng, bg: '#d7c1ee' },

    'gota iniciante': { icon: gotaPng, bg: '#E3F2FD' },
    'correnteza pesada': { icon: correntezaPng, bg: '#E8F6FF' },
    'rio profundo': { icon: rioPng, bg: '#E0F7FA' },
    'oceano eterno': { icon: oceanoPng, bg: '#c3e4f8' },
    'mare alta': { icon: tsunamiPng, bg: '#b4defa' },

    'relogio de agua': { icon: relogioPng, bg: '#fffaf3' },
    'sopro': { icon: soproPng, bg: '#f4fff5' },
    'brisa cortante': { icon: ventoPng, bg: '#d9fff4' },
    'pulmao de aco': { icon: pulmoesPng, bg: '#bdbdbd' },
    'tornado celeste': { icon: tornadoPng, bg: '#b6e1fd' },

    'cascalho': { icon: cascalhoPng, bg: '#ECEFF1' },
    'bronze': { icon: bronzePng, bg: '#FFD9B3' },
    'ferro': { icon: ferroPng, bg: '#B0BEC5' },
    'ouro': { icon: ouroPng, bg: '#FFF3B0' },
    'prata': { icon: prataPng, bg: '#CFD8DC' },
    'obsidiana': { icon: obsidianaPng, bg: '#919191' },
    'diamante': { icon: diamantePng, bg: '#E1F5FE' }

  };

  const found = (keyBadge && map[keyBadge]) || (keyTitle && map[keyTitle]) || { icon: trofeuPng, bg: '#F5F5F5' };
  const isGold = keyBadge === 'ouro' || keyTitle === 'ouro';
  const imgSize = isGold ? 54 : 26;

  return (
    <Box sx={{ width: 48, height: 48, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: found.bg, boxShadow: 1 }}>
      <Box
        component="img"
        src={found.icon}
        alt={badge || title || 'badge'}
        sx={{ width: imgSize, height: imgSize, objectFit: 'contain' }}
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

const randomWord = () => WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];

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
  void syncStorageToBackend(key, value);
};

const seedStorage = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const getAvatarInitials = (name: string, username: string) => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  if (name.trim()) {
    return name.trim()[0].toUpperCase();
  }

  return username ? username[0].toUpperCase() : 'U';
};

const resolveAvatarSrc = (avatar?: string) => {
  if (!avatar) {
    return '';
  }

  if (avatar.startsWith('data:') || avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/')) {
    return avatar;
  }

  if (/^[A-Za-z0-9+/=]+$/.test(avatar) && avatar.length > 100) {
    return `data:image/png;base64,${avatar}`;
  }

  return '';
};

const readCurrentUserProfile = () =>
  readStorage<{
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar?: string;
    role?: string;
    nome?: string;
    xp?: number;
    pontos?: number;
    diasAtivo?: number;
    level?: number;
  }>('burnout-zero-current-user', {});

const getGamificationStorageKey = (baseKey: string) => {
  const currentUser = readCurrentUserProfile();
  const username = normalizeText(currentUser.username);

  return username ? `${baseKey}:${username}` : baseKey;
};

const readCachedPoints = () => readStorage<number>(getGamificationStorageKey('burnout-zero-pontos'), 0);

const buildDisplayName = (userData: {
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
}) =>
  [userData.first_name, userData.last_name].filter(Boolean).join(' ').trim() ||
  userData.username ||
  userData.email ||
  'Usuário';

const syncStorageToBackend = async (key: string, value: unknown) => {
  const payloadMap: Record<string, string> = {
    'burnout-zero-daily-words': 'daily_words',
    'burnout-zero-mood-challenge': 'mood',
    'burnout-zero-streak': 'streak',
    'burnout-zero-water-weekly': 'water',
    'burnout-zero-breaths': 'breathing',
    'burnout-zero-weekly-mission': 'weekly_mission',
  };

  const baseKey = Object.keys(payloadMap).find((candidateKey) => key === candidateKey || key.startsWith(`${candidateKey}:`));
  const payloadKey = baseKey ? payloadMap[baseKey] : undefined;
  if (!payloadKey) {
    return;
  }

  try {
    await api.patch('/gamification/me/', { [payloadKey]: value });
  } catch {
    // keep local cache even if the backend is temporarily unavailable
  }
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
  const [savedCycles, setSavedCycles] = useState(() => {
    const stored = readStorage<{ cycles?: number }>(getGamificationStorageKey('burnout-zero-breaths'), { cycles: 0 });
    return stored.cycles ?? 0;
  });
  const [xpAwarded, setXpAwarded] = useState(false);
  const TOTAL_DURATION = testTiming(60);
  const INHALE_DURATION = testTiming(4);
  const HOLD_DURATION = testTiming(3);
  const EXHALE_DURATION = testTiming(3);
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
          setSavedCycles((prev) => prev + 1);
          return 0;
        }

        return newPhaseTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [EXHALE_DURATION, HOLD_DURATION, INHALE_DURATION, TOTAL_DURATION, currentPhase, isActive, onComplete, xpAwarded]);

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

  useEffect(() => {
    writeStorage(getGamificationStorageKey('burnout-zero-breaths'), {
      cyclesCompleted,
      cycles: savedCycles,
      xpAwarded,
    });
  }, [cyclesCompleted, savedCycles, xpAwarded]);

  const progress = (totalTime / TOTAL_DURATION) * 100;
  const phaseProgress = (phaseTime / phases[currentPhase].duration) * 100;
  const currentPhaseInfo = phases[currentPhase];

  return (
    <Paper
        variant="outlined"
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
    
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Respiração Guiada
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

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
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
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
              ✓ Sessão concluída — +50 XP
            </Typography>
            <Typography variant="caption" sx={{ color: 'success.dark', mt: 1, display: 'block' }}>
              Ciclos: {cyclesCompleted}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Paper>
  );
};

const DailyWordsMission = ({ onCompleteXp }: { onCompleteXp: (xp: number) => void }) => {
  const STORAGE_KEY = getGamificationStorageKey('burnout-zero-daily-words');
  
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
  const [challengeIndex, setChallengeIndex] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [wrongWord, setWrongWord] = useState('');

  const pickWord = useCallback((collected: string[]) => {
    const usedWords = new Set(collected);
    const availableWords = WORD_POOL.filter((word) => !usedWords.has(word));
    return availableWords[Math.floor(Math.random() * availableWords.length)] || randomWord();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      
      setState(prev => {
        if (!prev.completed && !prev.currentWord && now >= prev.nextWordAt) {
          return { ...prev, currentWord: pickWord(prev.collectedWords) };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pickWord]);

  useEffect(() => {
    writeStorage(STORAGE_KEY, state);
  }, [STORAGE_KEY, state]);


  const handleRecordWord = () => {
    if (!currentWord || completed) {
      return;
    }

    const nextCollected = [...collectedWords, currentWord];
    const isFinished = nextCollected.length >= 5;
    const nextChallengeIndex = isFinished ? Math.floor(Math.random() * 5) : null;

    setState(prev => ({
      ...prev,
      collectedWords: nextCollected,
      currentWord: null,
      nextWordAt: Date.now() + WORD_INTERVAL_MS,
      completed: isFinished ? true : prev.completed,
      xpAwarded: (isFinished && !prev.xpAwarded) ? true : prev.xpAwarded
    }));

    setAnswer('');
    setResult(null);
    setWrongWord('');
    setChallengeIndex(nextChallengeIndex);

    if (isFinished && !xpAwarded) {
      onCompleteXp(75);
    }
  };

  const handleCheckAnswer = () => {
    if (challengeIndex === null) {
      return;
    }

    const correctWord = collectedWords[challengeIndex];
    if (answer.trim().toLowerCase() === correctWord.toLowerCase()) {
      setResult('correct');
      return;
    }

    setResult('wrong');
    setWrongWord(correctWord);
  };

  const remainingMs = Math.max(0, nextWordAt - currentTime);
  const progress = (collectedWords.length / 5) * 100;
  const timerLabel = currentWord
    ? 'agora'
    : `${Math.floor(remainingMs / 60000)}:${String(Math.ceil((remainingMs % 60000) / 1000)).padStart(2, '0')}`;

  return (
    <Paper
          variant="outlined"
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Decorar Palavras
            </Typography>
          </Box>
    
          <CardContent>
            {/* Progress row */}
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
    
                {/* Collected word chips */}
                
              </Box>
    
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Próxima palavra em
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {timerLabel}
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
    
            {/* Current word box */}
            <Box sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Palavra atual
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                {currentWord ?? (completed ? 'Missão encerrada' : 'Palavra registrada')}
              </Typography>
            </Box>
    
            {/* Challenge section */}
            {completed && challengeIndex !== null && (
              <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Teste de memória
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                  Qual foi a palavra que apareceu em{' '}
                  <Box component="span" sx={{ color: 'warning.main' }}>
                    {ORDINALS[challengeIndex]}
                  </Box>{' '}
                  lugar?
                </Typography>
    
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Digite a palavra..."
                  value={answer}
                  onChange={e => { setAnswer(e.target.value); setResult(null); }}
                  disabled={result === 'correct'}
                  sx={{ mb: 1.5 }}
                />
    
                <Button
                  variant="contained"
                  onClick={handleCheckAnswer}
                  disabled={!answer.trim() || result === 'correct'}
                  sx={{ borderRadius: 2 }}
                >
                  Confirmar
                </Button>
    
                {result === 'correct' && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                      ✓ Correto! +75 XP conquistados.
                    </Typography>
                  </Box>
                )}
    
                {result === 'wrong' && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                      ✗ Errado. A palavra correta era "{wrongWord}". Nenhum XP ganho.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Paper>
  );
};

const MoodChallenge = ({ onCompleteXp }: { onCompleteXp: (xp: number) => void }) => {
  const STORAGE_KEY = getGamificationStorageKey('burnout-zero-mood-challenge');
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

  useEffect(() => {
    writeStorage(STORAGE_KEY, state);
  }, [STORAGE_KEY, state]);

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

  return (
    <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
    
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Registrar humor diário
          </Typography>
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
    
    </Paper>
  );
};

const WeeklyMissionChallenge = () => {
  const STORAGE_KEY = getGamificationStorageKey('burnout-zero-weekly-mission');
  const todayKey = getLocalDateKey();

  const [state, setState] = useState(() => readStorage<{
    history: Record<string, string>;
  }>(STORAGE_KEY, {
    history: {}
  }));

  const { history } = state;

  useEffect(() => {
    writeStorage(STORAGE_KEY, state);
  }, [STORAGE_KEY, state]);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 4);
  weekStart.setHours(0, 0, 0, 0);

  const recentEntries = Object.entries(history).filter(([dateKey]) => {
    const date = new Date(`${dateKey}T00:00:00`);
    return date >= weekStart;
  });

  const currentDayChoice = history[todayKey];
  const completedDays = recentEntries.length;
  const averagePerformance = completedDays > 0
    ? Math.round(
        recentEntries.reduce((sum, [, value]) => sum + (weeklyMissionScoreMap[value] || 0), 0) / completedDays
      )
    : 0;

  const handleSelectPerformance = (value: string) => {
    if (currentDayChoice) {
      return;
    }

    setState((prev) => ({
      ...prev,
      history: {
        ...prev.history,
        [todayKey]: value
      }
    }));
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Missão Semanal de Desempenho
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Registre como foi seu dia durante 5 dias.
          </Typography>
        </Box>
        <Chip label={`${completedDays}/5`} color="primary" size="small" />
      </Box>

      <LinearProgress variant="determinate" value={(completedDays / 5) * 100} sx={{ height: 8, borderRadius: 4 }} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(5, minmax(0, 1fr))' },
          gap: 1
        }}
      >
        {weeklyMissionOptions.map((option) => (
          <Button
            key={option.value}
            fullWidth
            variant={currentDayChoice === option.value ? 'contained' : 'outlined'}
            onClick={() => handleSelectPerformance(option.value)}
            disabled={Boolean(currentDayChoice)}
            sx={{
              minHeight: 72,
              flexDirection: 'column',
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {option.label}
            </Typography>
          </Button>
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">
          Hoje: {currentDayChoice ? weeklyMissionOptions.find((option) => option.value === currentDayChoice)?.label || 'Registrado' : 'Sem registro'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Desempenho médio: {averagePerformance}%
        </Typography>
      </Box>
    </Paper>
  );
};

const StreakChallenge = ({ onCompleteXp }: { onCompleteXp: (xp: number) => void }) => {
  const STORAGE_KEY = getGamificationStorageKey('burnout-zero-streak');
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
  }, [STORAGE_KEY, state]);

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
  const COOLDOWN_MS = testTiming(15 * 60 * 1000);
  
  const todayKey = getLocalDateKey();
  const STORAGE_KEY = getGamificationStorageKey('burnout-zero-water-weekly');

  const [storedWater] = useState(() => readStorage<{
    history: Record<string, number>;
    totalMl?: number;
    lastSipTime?: number | null;
    waterXp?: number;
  }>(STORAGE_KEY, {
    history: {},
    totalMl: 0,
    lastSipTime: null,
    waterXp: 0,
  }));
  const [history, setHistory] = useState<Record<string, number>>(storedWater.history || {});
  const [totalMl, setTotalMl] = useState(() => storedWater.totalMl ?? storedWater.history?.[todayKey] ?? 0);
  const [lastSipTime, setLastSipTime] = useState<number | null>(storedWater.lastSipTime ?? null);
  const [waterXp, setWaterXp] = useState(storedWater.waterXp ?? 0);
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

  useEffect(() => {
    writeStorage(STORAGE_KEY, { totalMl, lastSipTime, waterXp, history });
  }, [STORAGE_KEY, totalMl, lastSipTime, waterXp, history]);

  const handleSip = () => {
    if (!canSip) return;
    setTotalMl((v) => {
      const next = Math.min(TARGET_ML, v + SIP_ML);
      setHistory((prev) => ({ ...prev, [todayKey]: next }));
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
    <Paper
        variant="outlined"
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflow: 'hidden'
        }}
      >
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Beber Água (3L)
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
    
  </Paper>
  );
};

export default function Jornada() {

  const theme = useTheme();
  const storedCurrentUser = readCurrentUserProfile();

  const [user, setUser] = useState({
    nome: storedCurrentUser.nome || buildDisplayName(storedCurrentUser),
    titulo: '',
    avatar: storedCurrentUser.avatar || '',
    xp: storedCurrentUser.xp ?? storedCurrentUser.pontos ?? readCachedPoints(),
    xpProximo: getXpNextLevel(storedCurrentUser.xp ?? storedCurrentUser.pontos ?? readCachedPoints()),
    pontos: storedCurrentUser.pontos ?? storedCurrentUser.xp ?? readCachedPoints(),
    diasAtivo: storedCurrentUser.diasAtivo ?? 0,
    level: storedCurrentUser.level ?? 1,
    username: storedCurrentUser.username || ''
  });

  const [totalXp, setTotalXp] = useState(0);
  const [backRoute, setBackRoute] = useState('/employee');
  const [selectedConquestIndex, setSelectedConquestIndex] = useState<number | null>(null);
  const [openRewards, setOpenRewards] = useState(false);
  const [openObtainedConquests, setOpenObtainedConquests] = useState(false);
  const [isProfileHydrated, setIsProfileHydrated] = useState(false);

  const [userTiers, setUserTiers] = useState<{ consistency: number; hydration: number; breathing: number; level: number }>({ consistency: -1, hydration: -1, breathing: -1, level: -1 });

  useEffect(() => {
    if (!openRewards) return;

    const streakStore = readStorage<{ streakDays?: number }>(getGamificationStorageKey('burnout-zero-streak'), { streakDays: 0 });
    const streakDays = streakStore.streakDays ?? 0;
    let consistencyTier = -1;
    if (streakDays >= 365) consistencyTier = 4; 
    else if (streakDays >= 90) consistencyTier = 3; 
    else if (streakDays >= 30) consistencyTier = 2; 
    else if (streakDays >= 7) consistencyTier = 1;
    else if (streakDays >= 1) consistencyTier = 0;

    const waterStore = readStorage<{ history: Record<string, number> }>(getGamificationStorageKey('burnout-zero-water-weekly'), { history: {} });
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

    const breathStore = readStorage<{ cycles?: number }>(getGamificationStorageKey('burnout-zero-breaths'), { cycles: 0 });
    const cycles = breathStore.cycles ?? 0;
    let breathingTier = -1;
    if (cycles >= 500) breathingTier = 2;
    else if (cycles >= 100) breathingTier = 1;
    else if (cycles >= 1) breathingTier = 0;

    let levelTier = -1;
    const currentLevel = user.level || 1;
    if (currentLevel >= 100) levelTier = 6;
    else if (currentLevel >= 75) levelTier = 5;
    else if (currentLevel >= 50) levelTier = 4;
    else if (currentLevel >= 25) levelTier = 3;
    else if (currentLevel >= 15) levelTier = 2;
    else if (currentLevel >= 10) levelTier = 1;
    else if (currentLevel >= 1) levelTier = 0;

    setUserTiers({ consistency: consistencyTier, hydration: hydrationTier, breathing: breathingTier, level: levelTier });
  }, [openRewards, user.level]);

  // fetch profile and sync basic stats on mount
  useEffect(() => {
    let mounted = true;
    Promise.all([api.get('/users/me/'), api.get('/gamification/me/')])
      .then(([userRes, gamificationRes]) => {
        if (!mounted) return;

        const data = userRes.data || {};
        const gamification = gamificationRes.data || {};
        setBackRoute(resolveHomeRouteFromUser(data));

        const username = data.username || storedCurrentUser.username || '';
        const profileData = gamification.profile || {};
        const profile: {
          nome: string;
          titulo: string;
          avatar: string;
          xp: number;
          xpProximo: number;
          pontos: number;
          diasAtivo: number;
          level: number;
          username: string;
        } = {
          nome: profileData.nome || buildDisplayName(data),
          titulo: '',
          avatar: data.avatar || profileData.avatar || '',
          xp: Math.max(
            storedCurrentUser.xp ?? 0,
            storedCurrentUser.pontos ?? 0,
            profileData.xp ?? profileData.total_xp ?? 0
          ),
          xpProximo: profileData.xpProximo ?? 1500,
          pontos: Math.max(
            storedCurrentUser.pontos ?? 0,
            storedCurrentUser.xp ?? 0,
            profileData.pontos ?? profileData.total_points ?? 0
          ),
          diasAtivo: profileData.diasAtivo ?? storedCurrentUser.diasAtivo ?? 0,
          level: profileData.level ?? storedCurrentUser.level ?? 1,
          username
        };

        if (gamification.storage) {
          Object.entries(gamification.storage as Record<string, unknown>).forEach(([key, value]) => {
            seedStorage(getGamificationStorageKey(key), value);
          });
        }

        if (gamification.reward_tiers) {
          setUserTiers(gamification.reward_tiers);
        }

        setUser(profile);
        setTotalXp(profile.xp);
        setIsProfileHydrated(true);

        writeStorage('burnout-zero-current-user', {
          username: profile.username,
          nome: profile.nome,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          avatar: profile.avatar,
          role: data.role || 'employee',
          xp: profile.xp,
          pontos: profile.pontos,
          diasAtivo: profile.diasAtivo,
          level: profile.level
        });
      })
      .catch(() => {
        // ignore - keep defaults when the API is unavailable
        setIsProfileHydrated(true);
      });

    return () => { mounted = false; };
  }, [
    storedCurrentUser.avatar,
    storedCurrentUser.diasAtivo,
    storedCurrentUser.email,
    storedCurrentUser.first_name,
    storedCurrentUser.last_name,
    storedCurrentUser.level,
    storedCurrentUser.nome,
    storedCurrentUser.pontos,
    storedCurrentUser.role,
    storedCurrentUser.username,
    storedCurrentUser.xp,
  ]);

  useEffect(() => {
    const handleUserProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        avatar?: string;
        name?: string;
        username?: string;
        first_name?: string;
        last_name?: string;
      }>;

      setUser((current) => {
        const nextAvatar = customEvent.detail?.avatar ?? current.avatar;
        const nextName = customEvent.detail?.name ?? current.nome;
        const nextUsername = customEvent.detail?.username || current.username;
        const nextUser = {
          ...current,
          avatar: nextAvatar,
          nome: nextName,
          username: nextUsername
        };

        writeStorage('burnout-zero-current-user', {
          username: nextUsername,
          nome: nextName,
          first_name: customEvent.detail?.first_name || '',
          last_name: customEvent.detail?.last_name || '',
          email: '',
          avatar: nextAvatar,
          role: 'employee',
          xp: nextUser.xp,
          pontos: nextUser.pontos,
          diasAtivo: nextUser.diasAtivo,
          level: nextUser.level
        });

        return nextUser;
      });
    };

    window.addEventListener('user-profile-updated', handleUserProfileUpdated);
    return () => window.removeEventListener('user-profile-updated', handleUserProfileUpdated);
  }, []);
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState('home');
  const [isDailyExpanded, setIsDailyExpanded] = useState(true);
  const [isWeeklyExpanded, setIsWeeklyExpanded] = useState(true);
  const [isConquestExpanded, setIsConquestExpanded] = useState(true);

  const currentLevelXp = Math.max(0, totalXp - getXpTotalForLevel(user.level));
  const currentLevelRequirement = Math.max(1, user.xpProximo);
  const currentLevelProgress = Math.min(100, (currentLevelXp / currentLevelRequirement) * 100);

  useEffect(() => {
    if (!isProfileHydrated) {
      return;
    }

    writeStorage(getGamificationStorageKey('burnout-zero-pontos'), user.pontos);
    writeStorage('burnout-zero-current-user', {
      username: user.username,
      nome: user.nome,
      first_name: user.nome.split(' ')[0] || '',
      last_name: user.nome.split(' ').slice(1).join(' '),
      email: storedCurrentUser.email || '',
      avatar: user.avatar,
      role: storedCurrentUser.role || 'employee',
      xp: user.xp,
      pontos: user.pontos,
      diasAtivo: user.diasAtivo,
      level: user.level
    });

    void api.patch('/gamification/me/', {
      xp: user.xp,
      pontos: user.pontos,
      diasAtivo: user.diasAtivo,
      level: user.level
    }).catch(() => {
      // keep local cache if the backend sync fails temporarily
    });
  }, [isProfileHydrated, storedCurrentUser.email, storedCurrentUser.role, user.avatar, user.diasAtivo, user.level, user.nome, user.pontos, user.username, user.xp]);

  const handleGainXp = (xp: number) => {
    setUser((prev) => {
      const next = {
        ...prev,
        xp: (prev.xp || 0) + xp,
        pontos: (prev.pontos || 0) + xp
      };
      setTotalXp(next.xp);
      return next;
    });
    void api.post('/gamification/me/award/', { points: xp, reason: 'assessment_complete' })
      .then((response) => {
        const profile = response.data?.profile || {};
        setUser((current) => ({
          ...current,
          xp: profile.xp ?? profile.total_xp ?? current.xp,
          pontos: profile.pontos ?? profile.total_points ?? current.pontos,
          diasAtivo: profile.diasAtivo ?? profile.streak_days ?? current.diasAtivo,
          level: profile.level ?? current.level
        }));
        if (profile.xp ?? profile.total_xp) {
          setTotalXp(profile.xp ?? profile.total_xp);
        }
      })
      .catch(() => {
        // keep the optimistic UI state even if the backend request fails temporarily
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
        { titulo: 'Tornado Celeste', requisito: 'Fazer 1000 ciclos', xp: 5000, badge: 'tornado' }
      ]
    },
    {
      key: 'level',
      category: 'Progressão de Nível',
      achievements: [
        { titulo: 'Cascalho', requisito: 'Alcançar o Nível 1', xp: 50, badge: 'cascalho' },
        { titulo: 'Bronze Amassado', requisito: 'Alcançar o Nível 10', xp: 150, badge: 'bronze' },
        { titulo: 'Ferro Forjado', requisito: 'Alcançar o Nível 15', xp: 300, badge: 'ferro' },
        { titulo: 'Pepita de Prata', requisito: 'Alcançar o Nível 25', xp: 500, badge: 'prata' },
        { titulo: 'Cavalheiro de Ouro', requisito: 'Alcançar o Nível 50', xp: 1200, badge: 'ouro' },
        { titulo: 'Coração de Obsidiana', requisito: 'Alcançar o Nível 75', xp: 5000, badge: 'obsidiana' },
        { titulo: 'Cristal de Diamante', requisito: 'Alcançar o Nível 100', xp: 10000, badge: 'diamante' },
      ]
    }
  ];

  const obtainedAchievements = achievementCategories
    .flatMap((category) =>
      category.achievements.map((achievement, index) => {
        const currentTier =
          category.key === 'consistency'
            ? userTiers.consistency
            : category.key === 'hydration'
              ? userTiers.hydration
              : category.key === 'breathing'
                ? userTiers.breathing
                : userTiers.level;

        return {
          category: category.category,
          titulo: achievement.titulo,
          requisito: achievement.requisito,
          xp: achievement.xp,
          badge: achievement.badge,
          obtained: currentTier >= index && currentTier >= 0
        };
      })
    )
    .filter((achievement) => achievement.obtained);

  const WeeklyHydrationChallenge = ({ onCompleteXp }: { onCompleteXp: (xp: number) => void }) => {
    const STORAGE_KEY = getGamificationStorageKey('burnout-zero-water-weekly');
    const TARGET_DAILY_ML = 2000;
    const TARGET_DAYS = FAST_TEST_MODE ? 1 : 5;
    const [history, setHistory] = useState<Record<string, number>>({});
    const [awardedDate, setAwardedDate] = useState<string | undefined>(undefined);

    useEffect(() => {
      const stored = readStorage<{ history: Record<string, number>; awardedDate?: string }>(STORAGE_KEY, { history: {}, awardedDate: undefined });
      setHistory(stored.history || {});
      setAwardedDate(stored.awardedDate);
    }, [STORAGE_KEY]);

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
    }, [STORAGE_KEY, TARGET_DAYS, weeklyCount, awardedDate, history, onCompleteXp]);

    const progress = Math.min(100, (weeklyCount / TARGET_DAYS) * 100);

    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            +250 XP (Beber 2L/dia por 5 dias)
          </Typography>
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

        <Box sx={{ mt: 3, display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant={tabValue === 'area' ? 'contained' : 'outlined'}
            onClick={() => {
              setTabValue('area');
              navigate(backRoute);
            }}
            sx={{ borderRadius: 2, minWidth: 140, textTransform: 'none' }}
          >
            Histórico
          </Button>
          <Button
            variant="contained"
            startIcon={<ChatIcon />}
            onClick={() => {
              // request Employee page to open chat view
              setTabValue('chat');
              navigate(backRoute, { state: { openChat: true } });
            }}
            sx={{ borderRadius: 2, minWidth: 240, textTransform: 'none' }}
          >
            Chat de Acolhimento
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              // navigate to the employee area and request the evaluation dialog to open
              navigate(backRoute, { state: { openAvaliacao: true } });
            }}
            sx={{ borderRadius: 2, minWidth: 180, textTransform: 'none' }}
          >
            Nova Avaliação
          </Button>
          <Button
            variant="contained"
            startIcon={<CalendarMonthIcon />}
            onClick={() => {
              setTabValue('schedule');
              navigate(backRoute, { state: { openSchedule: true } });
            }}
            sx={{ borderRadius: 2, minWidth: 220, textTransform: 'none' }}
          >
            Agendar Consulta
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
        <Grid size={{ xs: 12, md: 8 }}>
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
                />
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
                />
              </Box>
            </Box>
            {isWeeklyExpanded && (
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <WeeklyHydrationChallenge key={`weekly-water-${user.username}`} onCompleteXp={handleGainXp} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <MoodChallenge key={`mood-${user.username}`} onCompleteXp={handleGainXp} />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <WeeklyMissionChallenge />
                  </Grid>
                </Grid>
              </CardContent>
            )}
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
                src={resolveAvatarSrc(user.avatar) || undefined}
                alt={user.nome}
              >
                {getAvatarInitials(user.nome, user.username)}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {user.nome}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">XP atual:</Typography>
                  <Typography variant="body2" fontWeight={600}>{currentLevelXp} / {currentLevelRequirement}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={currentLevelProgress}
                  sx={{ height: 8, borderRadius: 2 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Próximo Nível: {user.level + 1}
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
                  Streak diário
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
                            
                          </Box>
                        );
                      })()}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              {selectedConquestIndex !== null && (
                <Box sx={{ mt: 2, p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {conquistas[selectedConquestIndex].titulo}
                  </Typography>
                  <Typography variant="caption" color="success.dark">
                    {conquistas[selectedConquestIndex].data}
                  </Typography>
                </Box>
              )}
              <StreakChallenge key={`streak-${user.username}`} onCompleteXp={handleGainXp} />
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EmojiEventsIcon />}
                sx={{ mt: 3, borderRadius: 2 }}
                onClick={() => setOpenObtainedConquests(true)}
              >
                Conquistas obtidas
              </Button>
              
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
                                {((cat.key === 'consistency' && userTiers.consistency === ai) || (cat.key === 'hydration' && userTiers.hydration === ai) || (cat.key === 'breathing' && userTiers.breathing === ai) || (cat.key === 'level' && userTiers.level === ai)) && (
                                  <Chip label="Realizada" color="success" size="small" sx={{ mt: 1 }} />
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