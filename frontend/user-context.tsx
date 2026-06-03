import { useEffect, useMemo, useState, type ReactNode } from 'react';
import api from './services/api';
import { UserContext, getStoredUser, normalizeUser, storeUser, type UserProfile } from './user-context-core';

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
