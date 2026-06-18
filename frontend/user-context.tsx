import { useEffect, useMemo, useState, type ReactNode } from "react";
import api from "./services/api";
import {
  UserContext,
  getStoredUser,
  normalizeUser,
  storeUser,
  type UserProfile,
} from "./user-context-core";

const CURRENT_USER_STORAGE_KEY = "burnout-zero-current-user";

const storeCurrentUser = (user: UserProfile | null) => {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(
    CURRENT_USER_STORAGE_KEY,
    JSON.stringify({
      username: user.username || "",
      nome:
        user.nome ||
        [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
        user.username ||
        "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      avatar: user.avatar || "",
      role: user.role || "employee",
      xp: user.xp ?? user.total_pontos ?? 0,
      pontos: user.total_pontos ?? user.xp ?? 0,
      diasAtivo: user.dias_ativo ?? 0,
      level: user.level ?? 1,
    }),
  );
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const token = window.localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      setUser(null);
      storeUser(null);
      storeCurrentUser(null);
      return;
    }

    try {
      const [profileRes, pointsRes] = await Promise.all([
        api.get("/users/me/"),
        api.get("/gamification/my-points/"),
      ]);

      const nextUser = normalizeUser({
        ...profileRes.data,
        total_pontos:
          pointsRes.data?.total_pontos ??
          pointsRes.data?.total_points ??
          profileRes.data?.xp,
      });

      setUser(nextUser);
      storeUser(nextUser);
      storeCurrentUser(nextUser);
      window.localStorage.setItem("user_role", nextUser.role || "employee");
    } catch (error) {
      console.error("Erro ao carregar perfil do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUser();
  }, []);

  useEffect(() => {
    storeUser(user);
    storeCurrentUser(user);
  }, [user]);

  const updateUser = (nextUser: UserProfile) => {
    const normalizedUser = normalizeUser(nextUser);
    setUser(normalizedUser);
    storeUser(normalizedUser);
    storeCurrentUser(normalizedUser);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "user_role",
        normalizedUser.role || "employee",
      );
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("access_token");
      window.localStorage.removeItem("refresh_token");
      window.localStorage.removeItem("user_role");
      storeUser(null);
      storeCurrentUser(null);
    }
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, refreshUser, updateUser, logout }),
    [user, loading],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
