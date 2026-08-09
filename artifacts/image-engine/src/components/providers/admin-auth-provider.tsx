
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

interface AdminAuthState {
  isAuthenticated: boolean;
  username: string | null;
}

interface AdminAuthContextValue extends AdminAuthState {
  login: (username: string, password: string) => Promise<{ error: string | null }>;
  logout: () => void;
}

const STORAGE_KEY = 'admin_session_v1';
const storage = window.localStorage;

// Credentials are verified server-side via /api/admin/login + Supabase + bcrypt.
// No passwords are stored in the frontend code.

async function attemptLogin(
  username: string,
  password: string,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json() as { ok: boolean; error?: string };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error ?? "Invalid username or password." };
    }
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: "Cannot reach auth service. Check your connection." };
  }
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be inside AdminAuthProvider');
  return ctx;
}

export function AdminAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AdminAuthState>({
    isAuthenticated: false,
    username: null,
  });

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AdminAuthState;
        if (parsed.isAuthenticated && parsed.username) {
          setState(parsed);
        }
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await attemptLogin(username, password);
      if (!result.ok) return { error: result.error ?? "Invalid username or password." };
      const next: AdminAuthState = { isAuthenticated: true, username };
      setState(next);
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { error: null };
    },
    [],
  );

  const logout = useCallback(() => {
    setState({ isAuthenticated: false, username: null });
    storage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
