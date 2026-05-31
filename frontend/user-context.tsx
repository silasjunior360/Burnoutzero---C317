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

const normalizeUser = (data: any): UserProfile => ({
  ...data,
  username: data.username || '',
  first_name: data.first_name || '',
  last_name: data.last_name || '',
  email: data.email || '',
  avatar: data.avatar || '',
  role: data.role || data.user_type || data.tipo || data.tipo_usuario || data.profile_type || 'employee',
  xp: typeof data.total_pontos === 'number' ? data.total_pontos : data.xp ?? 0,
  total_pontos: typeof data.total_pontos === 'number' ? data.total_pontos : data.xp ?? 0,
  xp_proximo: data.xp_proximo ?? 1500,
  dias_ativo: data.dias_ativo ?? 0,
  level: data.level ?? 1,
});

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
