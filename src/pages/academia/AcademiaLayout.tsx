import { useState, useEffect, createContext, useContext } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, BookOpen, ClipboardCheck, User, Trophy, Settings, ChevronDown } from 'lucide-react';
import { getInitials, getLevelInfo, PLAZA_LABELS } from '@/lib/academia-utils';

const API = 'http://localhost:8000/api';

export interface Technician {
  id: string;
  nombre: string;
  zona: string;
  especialidad: string;
  status: string;
  skills: Record<string, number>;
  nivel?: number;
  xp_total?: number;
  xp_mes_actual?: number;
  racha_meses_limpios?: number;
}

interface AcademiaContextType {
  technician: Technician | null;
  setTechnician: (t: Technician) => void;
  isSupervisor: boolean;
  api: string;
}

const AcademiaContext = createContext<AcademiaContextType>({
  technician: null,
  setTechnician: () => {},
  isSupervisor: false,
  api: API,
});

export const useAcademia = () => useContext(AcademiaContext);

const navItems = [
  { path: '/academia',           label: 'Dashboard', icon: Home,          exact: true },
  { path: '/academia/modulos',   label: 'Biblioteca', icon: BookOpen },
  { path: '/academia/examenes',  label: 'Exámenes',  icon: ClipboardCheck },
  { path: '/academia/perfil',    label: 'Mi Perfil', icon: User },
  { path: '/academia/leaderboard', label: 'Ranking', icon: Trophy },
  { path: '/academia/admin',     label: 'Admin',     icon: Settings, supervisor: true },
];

export default function AcademiaLayout() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [activeTech, setActiveTech] = useState<Technician | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetch(`${API}/wfm/tecnicos`)
      .then(r => r.json())
      .then((data: Technician[]) => {
        setTechnicians(data);
        if (data.length > 0) setActiveTech(data[0]);
      })
      .catch(() => {});
  }, []);

  const levelInfo = activeTech ? getLevelInfo(activeTech.nivel ?? 1) : null;

  return (
    <AcademiaContext.Provider value={{ technician: activeTech, setTechnician: setActiveTech, isSupervisor, api: API }}>
      <div className="min-h-screen bg-white font-sans text-gray-900">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-4">
            <Link to="/academia" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: '#1B7F4A' }}>
                X
              </div>
              <span className="font-semibold text-base hidden sm:block">Academia <span style={{ color: '#1B7F4A' }}>XCIEN</span></span>
            </Link>

            <nav className="flex-1 flex items-center gap-1 overflow-x-auto">
              {navItems.filter(n => !n.supervisor || isSupervisor).map(item => {
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                      isActive ? 'font-medium text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    style={isActive ? { background: '#1B7F4A' } : {}}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {activeTech && (
              <div className="relative">
                <button
                  onClick={() => setShowPicker(!showPicker)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                  style={{ border: '0.5px solid #e5e7eb' }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold" style={{ background: levelInfo?.color ?? '#1B7F4A' }}>
                    {getInitials(activeTech.nombre)}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-medium leading-tight">{activeTech.nombre}</div>
                    <div className="text-[10px] text-gray-400">{activeTech.especialidad} · {activeTech.zona}</div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {showPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl z-50 py-1" style={{ border: '0.5px solid #e5e7eb' }}>
                      <div className="px-3 py-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Seleccionar técnico</span>
                        <label className="flex items-center gap-1.5 text-xs text-gray-500">
                          <input type="checkbox" checked={isSupervisor} onChange={e => setIsSupervisor(e.target.checked)} className="rounded" />
                          Supervisor
                        </label>
                      </div>
                      {technicians.map(t => (
                        <button
                          key={t.id}
                          onClick={() => { setActiveTech(t); setShowPicker(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${activeTech.id === t.id ? 'bg-gray-50' : ''}`}
                        >
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold" style={{ background: '#1B7F4A' }}>
                            {getInitials(t.nombre)}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{t.nombre}</div>
                            <div className="text-[11px] text-gray-400">{t.especialidad} · {t.zona}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </main>
      </div>
    </AcademiaContext.Provider>
  );
}
