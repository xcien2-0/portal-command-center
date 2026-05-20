import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type Portal = 'empleado' | 'cliente';

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, user, portalType, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSandurDomain = typeof window !== 'undefined' &&
    (window.location.hostname.includes('sandur') || window.location.hostname.includes('cliente'));
  const portalParam = searchParams.get('portal');
  const portal: Portal = portalParam === 'cliente'
    ? 'cliente'
    : portalParam === 'empleado'
    ? 'empleado'
    : isSandurDomain ? 'cliente' : 'empleado';

  const isCliente = portal === 'cliente';
  const accentColor = isCliente ? '#FB923C' : '#00B4D8';
  const accentColorDim = isCliente ? 'rgba(251,146,60,0.15)' : 'rgba(0,180,216,0.15)';

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && portalType) {
      if (portalType === 'cliente') {
        navigate('/cliente', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, portalType, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('El correo electrónico es requerido.');
      return;
    }
    if (!password) {
      setError('La contraseña es requerida.');
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setSubmitting(false);

    if (signInError) {
      const msg = signInError.message.toLowerCase();
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
        setError('Correo o contraseña incorrectos. Inténtalo de nuevo.');
      } else if (msg.includes('email not confirmed')) {
        setError('Por favor confirma tu correo electrónico antes de iniciar sesión.');
      } else {
        setError('Ocurrió un error al iniciar sesión. Inténtalo de nuevo.');
      }
      return;
    }

    // After sign-in, auth state change listener in AuthContext will update portalType.
    // The useEffect above will redirect based on portalType.
  };

  const otherPortal: Portal = isCliente ? 'empleado' : 'cliente';
  const otherLabel = isCliente ? 'Portal XCIEN (Empleados)' : 'Portal Sandur (Clientes)';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#0a1628' }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center top, ${accentColorDim} 0%, transparent 60%)`,
        }}
      />

      <div
        className="relative w-full max-w-md rounded-2xl p-8 shadow-2xl"
        style={{
          backgroundColor: '#0f1f38',
          border: `1px solid ${accentColor}30`,
          boxShadow: `0 0 40px ${accentColor}15`,
        }}
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          {isCliente ? (
            <div>
              <div
                className="text-4xl font-bold tracking-widest mb-1"
                style={{ color: accentColor, fontFamily: 'Inter, sans-serif' }}
              >
                SANDUR
              </div>
              <div className="text-xs tracking-widest uppercase" style={{ color: '#64748b' }}>
                Portal de Clientes
              </div>
            </div>
          ) : (
            <div>
              <img
                src="/xcien.png"
                alt="XCIEN"
                className="h-14 mx-auto mb-2 object-contain"
                onError={(e) => {
                  // Fallback to text if image not found
                  (e.target as HTMLImageElement).style.display = 'none';
                  const sibling = (e.target as HTMLImageElement).nextElementSibling;
                  if (sibling) (sibling as HTMLElement).style.display = 'block';
                }}
              />
              <div
                className="text-3xl font-bold tracking-widest hidden"
                style={{ color: accentColor }}
              >
                XCIEN
              </div>
              <div className="text-xs tracking-widest uppercase mt-1" style={{ color: '#64748b' }}>
                Portal de Empleados
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" style={{ color: '#94a3b8' }}>
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@xcien.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={submitting}
              style={{
                backgroundColor: '#0a1628',
                borderColor: `${accentColor}40`,
                color: '#e2e8f0',
              }}
              className="focus-visible:ring-0 focus-visible:border-current placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" style={{ color: '#94a3b8' }}>
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting}
              style={{
                backgroundColor: '#0a1628',
                borderColor: `${accentColor}40`,
                color: '#e2e8f0',
              }}
              className="focus-visible:ring-0 focus-visible:border-current placeholder:text-slate-600"
            />
          </div>

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full font-semibold tracking-wide transition-all duration-200"
            style={{
              backgroundColor: accentColor,
              color: isCliente ? '#1a0a00' : '#001a26',
              border: 'none',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>

        {/* Portal toggle */}
        <div className="mt-6 text-center">
          <p className="text-xs" style={{ color: '#475569' }}>
            ¿Acceder al otro portal?{' '}
            <Link
              to={`/login?portal=${otherPortal}`}
              className="underline transition-colors duration-150"
              style={{ color: accentColor }}
            >
              {otherLabel}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
