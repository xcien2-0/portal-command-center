import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#FB923C';
const ORANGE_MUTED = 'rgba(251,146,60,0.15)';
const ORANGE_BORDER = 'rgba(251,146,60,0.25)';
const BG = '#0a1628';
const SIDEBAR_BG = '#071020';
const CARD_BG = 'rgba(15,28,52,0.95)';

const navItems = [
  { to: '/cliente', label: 'Inicio', icon: '⊙' },
  { to: '/cliente/servicio', label: 'Mi Servicio', icon: '◈' },
  { to: '/cliente/tickets', label: 'Mis Tickets', icon: '◷' },
  { to: '/cliente/sla', label: 'Reportes SLA', icon: '◉' },
  { to: '/cliente/soporte', label: 'Soporte', icon: '◌' },
];

export default function ClienteLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login?portal=cliente', { replace: true });
  };

  const displayName = profile?.display_name
    || (profile as unknown as { company_name?: string })?.company_name
    || 'Cliente';

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: BG, color: '#e2e8f0' }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col border-r"
        style={{
          backgroundColor: SIDEBAR_BG,
          borderColor: ORANGE_BORDER,
        }}
      >
        {/* Brand */}
        <div
          className="px-6 py-6 border-b"
          style={{ borderColor: ORANGE_BORDER }}
        >
          <span
            className="text-2xl font-bold tracking-widest block"
            style={{ color: ORANGE, fontFamily: 'Inter, sans-serif' }}
          >
            SANDUR
          </span>
          <span className="text-xs mt-1 block" style={{ color: '#64748b' }}>
            Portal de Clientes
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/cliente'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? ORANGE : '#94a3b8',
                backgroundColor: isActive ? ORANGE_MUTED : 'transparent',
                transition: 'all 0.15s',
                textDecoration: 'none',
              })}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t" style={{ borderColor: ORANGE_BORDER }}>
          <p className="text-xs truncate mb-3" style={{ color: '#64748b' }}>
            {displayName}
          </p>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm px-3 py-2 rounded-lg transition-colors"
            style={{ color: '#94a3b8' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = ORANGE;
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = ORANGE_MUTED;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            ⏻ Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="h-14 flex items-center justify-between px-6 border-b flex-shrink-0"
          style={{
            backgroundColor: CARD_BG,
            borderColor: ORANGE_BORDER,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>
              Bienvenido,
            </span>
            <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
              {displayName}
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs"
            style={{
              backgroundColor: ORANGE_MUTED,
              color: ORANGE,
              border: `1px solid ${ORANGE_BORDER}`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Conectado
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
