import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  plaza: string;
  permisos: string[];
  activo: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** fetch() con Authorization: Bearer <token> inyectado automáticamente */
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  hasPermiso: (permiso: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'xcien_token';

const DEV_USER: AuthUser = {
  id: 'dev-admin',
  nombre: 'José Miguel Macías',
  email: 'miguel.macias@xcien.com',
  rol: 'admin',
  plaza: 'piedras-negras',
  permisos: ['*'],
  activo: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(DEV_USER);
  const [token, setToken] = useState<string | null>('dev-token');
  const [loading, setLoading] = useState(false);

  // Auth desactivada temporalmente — acceso directo como admin
  useEffect(() => {}, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? 'Credenciales incorrectas');
    }
    const data = await res.json();
    const { access_token, user: u } = data;
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const authFetch = useCallback((url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...options, headers });
  }, [token]);

  const hasPermiso = useCallback((permiso: string): boolean => {
    if (!user) return false;
    const p = user.permisos ?? [];
    return p.includes('*') || p.includes(permiso);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch, hasPermiso }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

/** HOC: redirige a /login si no hay sesión, conservando la ruta de origen */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#06070d' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #1f2937', borderTopColor: '#00C896', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return <>{children}</>;
}
