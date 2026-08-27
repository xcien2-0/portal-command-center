import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  plaza: string;
  permisos: string[];
  titular_de: string[];
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
  /** true si el usuario es titular del módulo indicado (o es admin) */
  isTitular: (moduloId: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'xcien_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) { setLoading(false); return; }
    setToken(stored);
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${stored}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(u => setUser(u))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

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

  const authFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      // Token expirado o inválido — limpiar sesión y redirigir al login
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    }
    return res;
  }, [token]);

  const hasPermiso = useCallback((permiso: string): boolean => {
    if (!user) return false;
    const p = user.permisos ?? [];
    return p.includes('*') || p.includes(permiso);
  }, [user]);

  const isTitular = useCallback((moduloId: string): boolean => {
    if (!user) return false;
    if (user.rol === 'admin') return true;
    return (user.titular_de ?? []).includes(moduloId);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch, hasPermiso, isTitular }}>
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
