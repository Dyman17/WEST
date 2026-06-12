import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { backend, getAuthToken, setAuthToken, type BackendAuthResponse, type BackendUser, type BackendUserRole } from "@/lib/backend";

const USER_KEY = "west-auth-user";

interface LoginPayload {
  login: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  name: string;
  role: BackendUserRole;
  company?: string;
}

interface AuthContextValue {
  user: BackendUser | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<BackendAuthResponse>;
  register: (payload: RegisterPayload) => Promise<BackendAuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): BackendUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BackendUser;
  } catch {
    return null;
  }
}

function storeSession(auth: BackendAuthResponse) {
  setAuthToken(auth.token);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  }
}

function clearSession() {
  setAuthToken("");
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(USER_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(() => readStoredUser());
  const [loading, setLoading] = useState<boolean>(() => Boolean(getAuthToken()));

  useEffect(() => {
    let isMounted = true;
    const token = getAuthToken();

    if (!token) {
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    backend
      .me()
      .then((response) => {
        if (!isMounted) return;
        setUser(response.user);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        }
      })
      .catch(() => {
        if (!isMounted) return;
        clearSession();
        setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!getAuthToken()) return;

    const refresh = () => {
      backend
        .me()
        .then((response) => {
          setUser(response.user);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
          }
        })
        .catch(() => {
          clearSession();
          setUser(null);
        });
    };

    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: async (payload) => {
      const auth = await backend.login(payload.login, payload.password);
      storeSession(auth);
      setUser(auth.user);
      return auth;
    },
    register: async (payload) => {
      const auth = await backend.register(payload);
      storeSession(auth);
      setUser(auth.user);
      return auth;
    },
    logout: () => {
      clearSession();
      setUser(null);
    },
    refreshUser: async () => {
      const response = await backend.me();
      setUser(response.user);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      }
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
