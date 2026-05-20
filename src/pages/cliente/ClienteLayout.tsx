import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Wifi,
  TicketCheck,
  BarChart2,
  HeadphonesIcon,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const ORANGE = '#FB923C';
const ORANGE_DIM = 'rgba(251,146,60,0.12)';
const BG = '#0a1628';
const SIDEBAR_BG = '#080f1e';
const BORDER = 'rgba(251,146,60,0.18)';

const navItems = [
  { to: '/cliente', label: 'Inicio', icon: Home, end: true },
  { to: '/cliente/servicio', label: 'Mi Servicio', icon: Wifi, end: false },
  { to: '/cliente/tickets', label: 'Mis Tickets', icon: TicketCheck, end: false },
  { to: '/cliente/sla', label: 'Reportes SLA', icon: BarChart2, end: false },
  { to: '/cliente/soporte', label: 'Soporte', icon: HeadphonesIcon, end: false },
];

export default function ClienteLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login?portal=cliente');
  };

  const displayName = profile?.display_name || profile?.company_name || 'Cliente';

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`flex flex-col h-full ${mobile ? 'w-64' : 'w-60'}`}
      style={{
        backgroundColor: SIDEBAR_BG,
        borderRight: `1px solid ${BORDER}`,
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center justify-between px-6 py-5"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div>
          <div
            className="text-xl font-bold tracking-widest"
            style={{ color: ORANGE }}
          >
            SANDUR
          </div>
          <div className="text-xs tracking-wide mt-0.5" style={{ color: '#475569' }}>
            Portal de Clientes
          </div>
        </div>
        {mobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ color: '#64748b' }}
            className="p-1"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive ? 'font-semibold' : ''
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? ORANGE_DIM : 'transparent',
              color: isActive ? ORANGE : '#94a3b8',
              border: isActive ? `1px solid ${BORDER}` : '1px solid transparent',
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div
        className="px-4 py-4"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        <div className="mb-3 px-2">
          <div className="text-xs font-semibold truncate" style={{ color: '#e2e8f0' }}>
            {displayName}
          </div>
          <div className="text-xs truncate" style={{ color: '#475569' }}>
            {profile?.company_name && profile.company_name !== displayName
              ? profile.company_name
              : 'Cuenta de cliente'}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors duration-150"
          style={{ color: '#64748b' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(248,113,113,0.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: BG }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="h-14 flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10"
          style={{
            backgroundColor: '#080f1e',
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <button
            className="md:hidden p-1 rounded"
            onClick={() => setSidebarOpen(true)}
            style={{ color: '#64748b' }}
          >
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: ORANGE_DIM, color: ORANGE, border: `1px solid ${BORDER}` }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm hidden sm:block" style={{ color: '#94a3b8' }}>
              {displayName}
            </span>
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
