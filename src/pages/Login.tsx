import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Login() {
  const [searchParams] = useSearchParams();
  const isCliente = searchParams.get('portal') === 'cliente';
  const portal = isCliente ? 'cliente' : 'empleado';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signIn, user, portalType, loading } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  useEffect(() => {
    if (!loading && user && portalType) {
      navigate(portalType === 'cliente' ? '/cliente' : '/', { replace: true });
    }
  }, [user, portalType, loading, navigate]);

  const accentColor = isCliente ? '#FB923C' : '#00B4D8';
  const accentColorMuted = isCliente ? 'rgba(251,146,60,0.15)' : 'rgba(0,180,216,0.15)';
  const accentBorder = isCliente ? 'rgba(251,146,60,0.4)' : 'rgba(0,180,216,0.4)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      setSubmitting(false);
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid') || msg.includes('wrong')) {
        setErrorMsg('Correo o contraseña incorrectos.');
      } else if (msg.includes('email not confirmed')) {
        setErrorMsg('Por favor confirma tu correo electrónico antes de iniciar sesión.');
      } else if (msg.includes('too many requests')) {
        setErrorMsg('Demasiados intentos. Espera un momento e inténtalo de nuevo.');
      } else {
        setErrorMsg('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    }
    // On success, the useEffect above will handle redirect
  };

  const switchPortalUrl = isCliente ? '/login' : '/login?portal=cliente';
  const switchPortalLabel = isCliente
    ? '¿Eres empleado XCIEN? Ingresa aquí'
    : '¿Eres cliente Sandur? Ingresa aquí';

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#0a1628' }}
    >
      {/* Background subtle glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isCliente
            ? 'radial-gradient(ellipse at 50% 30%, rgba(251,146,60,0.08) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at 50% 30%, rgba(0,180,216,0.08) 0%, transparent 60%)',
        }}
      />

      <div
        className="relative w-full max-w-md rounded-2xl border p-8 shadow-2xl"
        style={{
          backgroundColor: 'rgba(15, 28, 52, 0.95)',
          borderColor: accentBorder,
          boxShadow: `0 0 40px ${accentColorMuted}`,
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {isCliente ? (
            <div className="mb-4">
              <span
                className="text-4xl font-bold tracking-wider"
                style={{ color: accentColor, fontFamily: 'Inter, sans-serif', letterSpacing: '0.12em' }}
              >
                SANDUR
              </span>
              <p className="text-center text-sm mt-1" style={{ color: '#64748b' }}>
                Portal de Clientes
              </p>
            </div>
          ) : (
            <div className="mb-4 flex flex-col items-center">
              <img
                src="/xcien.png"
                alt="XCIEN"
                className="h-16 w-auto object-contain mb-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span
                className="text-2xl font-bold tracking-widest"
                style={{ color: accentColor }}
              >
                XCIEN
              </span>
              <p className="text-center text-sm mt-1" style={{ color: '#64748b' }}>
                Portal de Empleados
              </p>
            </div>
          )}

          <div
            className="w-12 h-px"
            style={{ backgroundColor: accentBorder }}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: '#94a3b8' }}>
              Correo electrónico
            </label>
            <Input
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="border-0"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(255,255,255,0.1)',
                color: '#e2e8f0',
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: '#94a3b8' }}>
              Contraseña
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(255,255,255,0.1)',
                color: '#e2e8f0',
              }}
            />
          </div>

          {errorMsg && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(239,68,68,0.3)',
                color: '#fca5a5',
              }}
            >
              {errorMsg}
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full font-semibold py-5 transition-all"
            style={{
              backgroundColor: accentColor,
              color: '#fff',
              border: 'none',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>

        {/* Switch portal */}
        <div className="mt-6 text-center">
          <Link
            to={switchPortalUrl}
            className="text-sm transition-colors hover:underline"
            style={{ color: accentColor }}
          >
            {switchPortalLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
