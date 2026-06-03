import { createContext } from 'react';

export type UserProfile = {
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

export type UserContextValue = {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateUser: (nextUser: UserProfile) => void;
  logout: () => void;
};

const USER_STORAGE_KEY = 'burnout-zero-user';

export const UserContext = createContext<UserContextValue | undefined>(undefined);

export const normalizeUser = (data: Record<string, unknown>): UserProfile => {
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

export const getStoredUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
};

export const storeUser = (user: UserProfile | null) => {
  if (typeof window === 'undefined') return;
  if (!user) {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};