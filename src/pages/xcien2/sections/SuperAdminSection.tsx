import { useState, useEffect } from 'react';
import { ThemeConfig } from '../types';
import brand from '../../../brand';

interface Props { theme: ThemeConfig }

type Tab = 'uso' | 'actividad' | 'salud';

interface Stats {
  total_visits: number;
  today_visits: number;
  week_visits: number;
  unique_ips: number;
  top_sections: { section: string; visits: number }[];
  daily_activity: { date: string; visits: number }[];
  recent_events: { ts: string; section: string; ip: string; ua: string }[];
}

const SECTION_LABELS: Record<string, string> = {
  noc: 'NOC Virtual', mapa: 'Mapa de Red', wfm: 'Campo WFM',
  bidrillas: 'Cuadrillas', inventario: 'Inventario', transferencias: 'Transferencias',
  ventas: 'Ventas', rrhh: 'RRHH', sala: 'Sala de Juntas',
  academia: 'Academia', academiaholo: 'Academia Holo',
  agentes: 'Agentes IA', bridge: 'Data Bridge',
  foda: 'FODA', adopcion: 'Adopción', estrategia2030: 'Estrategia 2030',
  superadmin: 'Super Admin', reportlab: 'Reporte PDF',
  docs: 'Documentos', telegram: 'Telegram Bot',
  merkle: 'Merkle', ventas2: 'Ventas 2',
};

function label(s: string) { return SECTION_LABELS[s] || s; }

function fmt(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return ts; }
}

function fmtDate(d: string) {
  try {
    const [, m, day] = d.split('-');
    return `${day}/${m}`;
  } catch { return d; }
}

export default function SuperAdminSection({ theme }: Props) {
  const G = theme.accent;
  const [pin, setPin] = useState('');
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('admin_authed'));
  const [pinErr, setPinErr] = useState(false);
  const [tab, setTab] = useState<Tab>('uso');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  const attemptLogin = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/stats?pin=${encodeURIComponent(pin)}`);
      if (r.ok) {
        const data = await r.json();
        setStats(data);
        sessionStorage.setItem('admin_authed', pin);
        setAuthed(true);
        setPinErr(false);
      } else {
        setPinErr(true);
      }
    } catch {
      setPinErr(true);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const savedPin = sessionStorage.getItem('admin_authed') || pin;
    try {
      const r = await fetch(`/api/admin/stats?pin=${encodeURIComponent(savedPin)}`);
      if (r.ok) setStats(await r.json());
    } catch { /* silent */ }
  };

  const loadHealth = async () => {
    try {
      const r = await fetch('/api/health');
      if (r.ok) setHealth(await r.json());
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (authed) { loadStats(); loadHealth(); }
  }, [authed]);

  // ── PIN Gate ─────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ background: theme.card, border: `1px solid ${theme.border}` }}
             className="rounded-2xl p-10 w-80 text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h2 style={{ color: G }} className="text-xl font-bold mb-1">Super Admin</h2>
          <p style={{ color: theme.dim }} className="text-sm mb-6">Ingresa el PIN de acceso</p>
          <input
            type="password"
            value={pin}
            onChange={e => { setPin(e.target.value); setPinErr(false); }}
            onKeyDown={e => e.key === 'Enter' && attemptLogin()}
            placeholder="••••••••"
            className="w-full text-center text-lg rounded-lg px-4 py-3 mb-3 outline-none"
            style={{ background: theme.bg, border: `1.5px solid ${pinErr ? '#ef4444' : theme.border}`, color: theme.text }}
          />
          {pinErr && <p className="text-red-400 text-xs mb-3">PIN incorrecto</p>}
          <button
            onClick={attemptLogin}
            disabled={loading || !pin}
            className="w-full py-2 rounded-lg font-semibold transition-opacity disabled:opacity-40"
            style={{ background: G, color: '#fff' }}
          >
            {loading ? 'Verificando…' : 'Entrar'}
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'uso', label: 'Uso por sección', icon: '📊' },
    { id: 'actividad', label: 'Actividad reciente', icon: '🕐' },
    { id: 'salud', label: 'Salud del sistema', icon: '❤️' },
  ];

  const maxVisits = stats?.top_sections?.[0]?.visits || 1;
  const maxDaily = Math.max(...(stats?.daily_activity?.map(d => d.visits) || [1]));

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ color: G }} className="text-2xl font-bold">Super Admin</h1>
          <p style={{ color: theme.dim }} className="text-sm">Estadísticas de uso · {brand.name} 2.0</p>
        </div>
        <button
          onClick={loadStats}
          className="text-sm px-3 py-1.5 rounded-lg"
          style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.dim }}
        >
          ↻ Actualizar
        </button>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Visitas totales', value: stats.total_visits.toLocaleString(), icon: '👁️' },
            { label: 'Hoy', value: stats.today_visits.toLocaleString(), icon: '📅' },
            { label: 'Esta semana', value: stats.week_visits.toLocaleString(), icon: '📈' },
            { label: 'IPs únicas', value: stats.unique_ips.toLocaleString(), icon: '🌐' },
          ].map(k => (
            <div key={k.label} style={{ background: theme.card, border: `1px solid ${theme.border}` }}
                 className="rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{k.icon}</div>
              <div style={{ color: G }} className="text-2xl font-bold">{k.value}</div>
              <div style={{ color: theme.dim }} className="text-xs mt-1">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.id ? G : theme.card,
              color: tab === t.id ? '#fff' : theme.dim,
              border: `1px solid ${tab === t.id ? G : theme.border}`,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Uso ── */}
      {tab === 'uso' && stats && (
        <div style={{ background: theme.card, border: `1px solid ${theme.border}` }} className="rounded-2xl p-5">
          <h3 style={{ color: theme.text }} className="font-semibold mb-4">Top secciones visitadas</h3>
          <div className="space-y-3">
            {stats.top_sections.map((s, i) => (
              <div key={s.section} className="flex items-center gap-3">
                <span style={{ color: theme.dim }} className="text-xs w-5 text-right">{i + 1}</span>
                <span style={{ color: theme.text }} className="text-sm w-36 truncate">{label(s.section)}</span>
                <div className="flex-1 relative h-5 rounded overflow-hidden" style={{ background: theme.bg }}>
                  <div
                    className="absolute left-0 top-0 h-full rounded transition-all"
                    style={{ width: `${(s.visits / maxVisits) * 100}%`, background: G, opacity: 0.8 }}
                  />
                </div>
                <span style={{ color: G }} className="text-sm font-semibold w-10 text-right">{s.visits}</span>
              </div>
            ))}
          </div>

          {/* Daily chart */}
          {stats.daily_activity.length > 0 && (
            <>
              <h3 style={{ color: theme.text }} className="font-semibold mt-8 mb-4">Actividad diaria (14 días)</h3>
              <div className="flex items-end gap-1 h-28">
                {stats.daily_activity.map(d => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="relative w-full flex justify-center">
                      <div
                        className="w-full rounded-t transition-all"
                        style={{
                          height: `${Math.max(4, (d.visits / maxDaily) * 90)}px`,
                          background: d.date === new Date().toISOString().slice(0, 10) ? G : `${G}66`,
                        }}
                      />
                    </div>
                    <span style={{ color: theme.dim }} className="text-[9px]">{fmtDate(d.date)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Actividad ── */}
      {tab === 'actividad' && stats && (
        <div style={{ background: theme.card, border: `1px solid ${theme.border}` }} className="rounded-2xl p-5">
          <h3 style={{ color: theme.text }} className="font-semibold mb-4">Últimas 20 visitas</h3>
          <div className="space-y-2">
            {stats.recent_events.length === 0 && (
              <p style={{ color: theme.dim }} className="text-sm">Sin eventos aún.</p>
            )}
            {stats.recent_events.map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b"
                   style={{ borderColor: theme.border }}>
                <span style={{ color: G }} className="text-lg">→</span>
                <div className="flex-1">
                  <span style={{ color: theme.text }} className="text-sm font-medium">{label(e.section)}</span>
                  <span style={{ color: theme.dim }} className="text-xs ml-2">{fmt(e.ts)}</span>
                </div>
                <span style={{ color: theme.dim }} className="text-xs font-mono">{e.ip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Salud ── */}
      {tab === 'salud' && (
        <div style={{ background: theme.card, border: `1px solid ${theme.border}` }} className="rounded-2xl p-5">
          <h3 style={{ color: theme.text }} className="font-semibold mb-4">Estado del sistema</h3>
          {health ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: theme.bg }}>
                <span className="text-green-400 text-xl">●</span>
                <div>
                  <div style={{ color: theme.text }} className="font-medium">Backend FastAPI</div>
                  <div style={{ color: theme.dim }} className="text-xs">
                    {String(health.service)} · v{String(health.version)} · {String(health.status).toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: theme.bg }}>
                <span className="text-green-400 text-xl">●</span>
                <div>
                  <div style={{ color: theme.text }} className="font-medium">Frontend React</div>
                  <div style={{ color: theme.dim }} className="text-xs">Vite · React 18 · TypeScript · ONLINE</div>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: theme.dim }} className="text-sm">Cargando estado…</p>
          )}

          <div className="mt-6">
            <h4 style={{ color: theme.dim }} className="text-xs font-semibold uppercase tracking-wider mb-3">Acciones</h4>
            <button
              onClick={() => { setAuthed(false); sessionStorage.removeItem('admin_authed'); }}
              className="text-sm px-4 py-2 rounded-lg"
              style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444' }}
            >
              Cerrar sesión admin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
