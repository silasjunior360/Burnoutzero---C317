import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import api from './services/api';

type UserProfile = {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  tipo?: string;
  user_type?: string;
  tipo_usuario?: string;
  profile_type?: string;
  xp?: number;
  xp_proximo?: number;
  total_pontos?: number;
  dias_ativo?: number;
  level?: number;
  [key: string]: unknown;
};

type UserContextValue = {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateUser: (nextUser: UserProfile) => void;
  logout: () => void;
};

const USER_STORAGE_KEY = 'burnout-zero-user';

const UserContext = createContext<UserContextValue | undefined>(undefined);

const normalizeUser = (data: Record<string, unknown>): UserProfile => {
  const getStr = (val: unknown): string => typeof val === 'string' ? val : '';
  const getNum = (val: unknown): number => typeof val === 'number' ? val : 0;

  const username = getStr(data.username);
  const first_name = getStr(data.first_name);
  const last_name = getStr(data.last_name);
  const email = getStr(data.email);
  const avatar = getStr(data.avatar);
  
  const role = getStr(data.role || data.user_type || data.tipo || data.tipo_usuario || data.profile_type) || 'employee';
  
  const total_pontos = typeof data.total_pontos === 'number'
    ? data.total_pontos
    : (typeof data.xp === 'number' ? data.xp : 0);

  const xp = total_pontos;
  const xp_proximo = getNum(data.xp_proximo) || 1500;
  const dias_ativo = getNum(data.dias_ativo) || 0;
  const level = getNum(data.level) || 1;

  return {
    ...data,
    username,
    first_name,
    last_name,
    email,
    avatar,
    role,
    xp,
    total_pontos,
    xp_proximo,
    dias_ativo,
    level,
  };
};

const getStoredUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
};

const storeUser = (user: UserProfile | null) => {
  if (typeof window === 'undefined') return;
  if (!user) {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const token = window.localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    try {
      const [profileRes, pointsRes] = await Promise.all([
        api.get('/users/me/'),
        api.get('/gamification/my-points/'),
      ]);

      const nextUser = normalizeUser({
        ...profileRes.data,
        total_pontos: pointsRes.data?.total_pontos ?? pointsRes.data?.total_points ?? profileRes.data?.xp,
      });

      setUser(nextUser);
      storeUser(nextUser);
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUser();
  }, []);

  useEffect(() => {
    storeUser(user);
  }, [user]);

  const updateUser = (nextUser: UserProfile) => {
    setUser(nextUser);
    storeUser(nextUser);
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('access_token');
      window.localStorage.removeItem('refresh_token');
      window.localStorage.removeItem('user_role');
      storeUser(null);
    }
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, refreshUser, updateUser, logout }),
    [user, loading]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
