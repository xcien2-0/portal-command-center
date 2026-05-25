import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config';
import brand from '../brand';
import {
  Monitor, Radio, Send, Phone, ScanLine, LayoutDashboard,
  FileBarChart, GraduationCap, AlertTriangle, CheckCircle2,
  Activity, Users, Wifi, WifiOff, TrendingUp, Clock,
  ChevronRight, Circle, Zap, Tag
} from 'lucide-react';
import { getAllCasaData, getAllAlerts } from '@/services/nocboard';
import { CASA_TENANTS } from '@/types/tenant';
import { TENANT_COLORS, FSM_ABRIL_2026 } from '@/data/noc-mock';
import { ISP_UPTIMES, REVENUE_METRICS } from '@/data/mockGerenciaData';

// ── Module cards ────────────────────────────────────────────────────────────

const MODULES = [
  {
    title: 'Centro de Operaciones (NOC)',
    description: 'Monitoreo de red, nodos y alertas en tiempo real',
    url: '/portal?section=noc',
    icon: Monitor,
    color: '#00B4D8',
    bg: 'rgba(0,180,216,0.08)',
    border: 'rgba(0,180,216,0.25)',
  },
  {
    title: 'Dispatch',
    description: 'Gestión de técnicos en campo',
    url: '/portal?section=wfm',
    icon: Send,
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.25)',
  },
  {
    title: 'Call Center',
    description: 'Atención y escalamiento de tickets',
    url: '/portal?section=call',
    icon: Phone,
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.25)',
  },
  {
    title: 'Inventario & Scanner',
    description: 'Escaneo de equipos y trazabilidad',
    url: '/portal?section=scan',
    icon: ScanLine,
    color: '#FB923C',
    bg: 'rgba(251,146,60,0.08)',
    border: 'rgba(251,146,60,0.25)',
  },
  {
    title: 'Creación de Etiquetas',
    description: 'Generación de QR y comprobantes',
    url: '/portal?section=etiquetas',
    icon: Tag,
    color: '#FFB703',
    bg: 'rgba(255,183,3,0.08)',
    border: 'rgba(255,183,3,0.25)',
  },
  {
    title: 'Gerencia',
    description: 'Revenue, SLAs y agentes IA',
    url: '/portal?section=gerencia',
    icon: LayoutDashboard,
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.25)',
  },
  {
    title: 'Reportes',
    description: 'Gobierno, impacto y cumplimiento',
    url: '/portal?section=reports',
    icon: FileBarChart,
    color: '#F472B6',
    bg: 'rgba(244,114,182,0.08)',
    border: 'rgba(244,114,182,0.25)',
  },
  {
    title: brand.academiaLabel,
    description: 'Capacitación, exámenes y WFM',
    url: '/portal?section=academia',
    icon: GraduationCap,
    color: '#34D399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.25)',
  },
  {
    title: 'Puente IA (Antigravity)',
    description: 'Terminal de ejecución y logs en tiempo real',
    url: '/portal?section=bridge',
    icon: Zap,
    color: '#F472B6',
    bg: 'rgba(244,114,182,0.08)',
    border: 'rgba(244,114,182,0.25)',
  },
  {
    title: 'Sala de Guerra (War Room)',
    description: 'Orquestación multi-agente en vivo',
    url: '/portal?section=war-room',
    icon: Activity,
    color: '#FFB703',
    bg: 'rgba(255,183,3,0.08)',
    border: 'rgba(255,183,3,0.25)',
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 80) return '#00C896';
  if (s >= 60) return '#FFB703';
  return '#FF4D6D';
}

function scoreLabel(s: number) {
  if (s >= 80) return 'Saludable';
  if (s >= 60) return 'Degradado';
  return 'Crítico';
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Network data derived from mocks (fallback)
  const allData = useMemo(() => getAllCasaData(), []);
  const alertsData = useMemo(() => getAllAlerts(), []);

  // ── Live Data Sync ────────────────────────────────────────────────────────
  const [realData, setRealData] = useState<{ cities: any[], alerts: any[] }>({ cities: [], alerts: [] });
  const [summary, setSummary] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [citiesRes, alertsRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE}/api/noc/cities`),
        fetch(`${API_BASE}/api/noc/alerts?active_only=true`),
        fetch(`${API_BASE}/api/noc/summary`)
      ]);
      if (citiesRes.ok) setRealData(prev => ({ ...prev, cities: [] })); // clear old
      if (citiesRes.ok) {
        const c = await citiesRes.json();
        setRealData(d => ({ ...d, cities: c }));
      }
      if (alertsRes.ok) {
        const a = await alertsRes.json();
        setRealData(d => ({ ...d, alerts: a }));
      }
      if (summaryRes.ok) {
        const s = await summaryRes.json();
        setSummary(s);
      }
    } catch (err) { console.error("Error fetching live data", err); }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, []);

  const tenantStats = useMemo(() => {
    if (realData.cities.length > 0) {
      return CASA_TENANTS.map(t => {
        const citiesInTenant = realData.cities.filter(c => 
          t.id === 'xcien' ? (c.tenantId === 'xcien' || !c.tenantId) : c.tenantId === t.id
        );
        const totalOnline = citiesInTenant.reduce((s, c) => s + c.online, 0);
        const totalOffline = citiesInTenant.reduce((s, c) => s + c.offline, 0);
        const avgScore = citiesInTenant.length 
          ? Math.round(citiesInTenant.reduce((acc, c) => acc + c.score, 0) / citiesInTenant.length)
          : 0;
        const cityAlerts = realData.alerts.filter(a => a.cityId && citiesInTenant.some(c => c.id === a.cityId)).length;
        return { ...t, cities: citiesInTenant.length, totalOnline, totalOffline, avgScore, cityAlerts };
      });
    }
    // Fallback a mocks
    return CASA_TENANTS.map(t => {
      const td = allData[t.id];
      const cities = td?.cities ?? [];
      const totalOnline = cities.reduce((s, c) => s + c.online, 0);
      const totalOffline = cities.reduce((s, c) => s + c.offline, 0);
      const avgScore = cities.length ? Math.round(cities.reduce((s, c) => s + c.score, 0) / cities.length) : 0;
      const cityAlerts = cities.reduce((s, c) => s + c.alerts, 0);
      return { ...t, cities: cities.length, totalOnline, totalOffline, avgScore, cityAlerts };
    });
  }, [allData, realData]);

  const globalOnline = summary?.online || tenantStats.reduce((s, t) => s + t.totalOnline, 0);
  const globalTotal  = summary?.totalHosts || tenantStats.reduce((s, t) => s + (t.totalOnline || 0) + (t.totalOffline || 0), 0);
  const healthPct    = summary?.avgHealthScore || (tenantStats.length ? Math.round(tenantStats.reduce((s, t) => s + t.avgScore, 0) / tenantStats.length) : 0);
  const activeAlertsCount = summary?.activeAlerts || tenantStats.reduce((s, t) => s + t.cityAlerts, 0);

  const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)', color: 'var(--app-text)' }}>

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div
        className="px-8 pt-10 pb-8"
        style={{ borderBottom: '1px solid var(--app-border)' }}
      >
        <div className="max-w-[1300px] mx-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <img src={brand.logo} alt={brand.name} className="h-8 w-auto object-contain" />
              <span
                className="text-[28px] font-bold tracking-tight"
                style={{ color: 'var(--app-text)', letterSpacing: '-0.02em' }}
              >
                {brand.name} {brand.version}
              </span>
              <span
                className="text-[11px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                style={{ color: 'var(--app-accent)', borderColor: 'var(--app-accent)', background: 'var(--app-accent)15' }}
              >
                Operations Hub
              </span>
            </div>
            <p className="text-[13px] capitalize" style={{ color: 'var(--app-dim)' }}>{dateStr}</p>
          </div>

          <div className="flex items-center gap-2" style={{ color: 'var(--app-dim)' }}>
            <Clock className="h-4 w-4" />
            <span className="font-mono text-[20px] font-medium tabular-nums" style={{ color: 'var(--app-text)' }}>
              {timeStr}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-8 pb-16 space-y-10 mt-8">

        {/* ── Quick Actions ─────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            className="flex items-center justify-center gap-3 p-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #FF4D6D 0%, #C9184A 100%)', boxShadow: '0 8px 20px rgba(255,77,109,0.25)' }}
          >
            <AlertTriangle className="h-5 w-5" />
            ABRIR INCIDENTE MAYOR
          </button>
          <button 
            className="flex items-center justify-center gap-3 p-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)', boxShadow: '0 8px 20px rgba(0,180,216,0.25)' }}
          >
            <Send className="h-5 w-5" />
            DESPACHAR TÉCNICO
          </button>
          <div 
            className="flex items-center justify-between p-4 rounded-xl border"
            style={{ background: 'var(--app-card)', borderColor: 'var(--app-border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                <CheckCircle2 className="h-5 w-5 text-[#34D399]" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-dim">SLA Global</p>
                <p className="text-[18px] font-black text-white">99.82%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#34D399] font-bold">↑ 0.05%</p>
              <p className="text-[9px] text-dim">vs mes anterior</p>
            </div>
          </div>
        </section>

        {/* ── Global KPIs ─────────────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              label="Hosts en línea"
              value={`${globalOnline.toLocaleString()}`}
              sub={`de ${globalTotal.toLocaleString()} totales`}
              icon={<Wifi className="h-4 w-4" />}
              accent="#00C896"
              badge={`${Math.round((globalOnline/globalTotal)*100 || 0)}%`}
              badgeGood={(globalOnline/globalTotal) >= 0.8}
              delta={{ val: "↑ +12", color: "#00C896" }}
            />
            <KpiCard
              label="Hosts caídos"
              value={`${(globalTotal - globalOnline).toLocaleString()}`}
              sub="requieren atención"
              icon={<WifiOff className="h-4 w-4" />}
              accent={(globalTotal - globalOnline) > 10 ? '#FF4D6D' : '#FFB703'}
              delta={{ val: "↓ -2", color: "#00C896" }}
            />
            <KpiCard
              label="Alertas activas"
              value={`${activeAlertsCount}`}
              sub="en tiempo real"
              icon={<AlertTriangle className="h-4 w-4" />}
              accent={activeAlertsCount > 5 ? '#FF4D6D' : '#FFB703'}
              delta={{ val: "↑ +8", color: "#FF4D6D" }}
            />
            <KpiCard
              label="Salud de Red"
              value={`${healthPct.toFixed(1)}%`}
              sub={scoreLabel(healthPct)}
              icon={<Activity className="h-4 w-4" />}
              accent={scoreColor(healthPct)}
              delta={{ val: "↓ -0.4%", color: "#FF4D6D" }}
            />
          </div>
        </section>

        {/* ── Tenant Health Grid ───────────────────────────────────────────── */}
        <section>
          <SectionLabel icon={<Wifi className="h-3.5 w-3.5" />}>Estado de redes</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {tenantStats.map(t => {
              const color = TENANT_COLORS[t.id] ?? '#64748b';
              const sc = t.avgScore;
              const sc_color = scoreColor(sc);
              return (
                <Link
                  key={t.id}
                  to="/portal?section=noc"
                  className="rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'var(--app-card)',
                    border: `1px solid ${color}30`,
                    boxShadow: `0 0 0 1px ${color}10`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--app-text)' }}>{t.name}</span>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: `${sc_color}18`, color: sc_color }}
                    >
                      {scoreLabel(sc)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="text-[32px] font-bold tabular-nums leading-none"
                      style={{ color: sc_color }}
                    >
                      {sc}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-1.5 rounded-full" style={{ background: 'var(--app-border)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${sc}%`, background: sc_color }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px]" style={{ color: 'var(--app-dim)' }}>
                        <span>{t.cities} ciudad{t.cities !== 1 ? 'es' : ''}</span>
                        <span>{t.cityAlerts > 0 ? `${t.cityAlerts} alertas` : 'sin alertas'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 text-[11px]">
                    <span style={{ color: '#00C896' }}>
                      <CheckCircle2 className="h-3 w-3 inline mr-0.5" />{t.totalOnline}
                    </span>
                    <span style={{ color: '#FF4D6D' }}>
                      <WifiOff className="h-3 w-3 inline mr-0.5" />{t.totalOffline}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Module Grid ─────────────────────────────────────────────────── */}
        <section>
          <SectionLabel icon={<Monitor className="h-3.5 w-3.5" />}>Módulos</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {MODULES.map(m => (
              <Link
                key={m.url}
                to={m.url}
                className="group rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: 'var(--app-card)',
                  border: `1px solid var(--app-border)`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                  style={{ background: m.bg, border: `1px solid ${m.border}` }}
                >
                  <m.icon className="h-5 w-5" style={{ color: m.color }} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--app-text)' }}>{m.title}</p>
                  <p className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--app-dim)' }}>{m.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

function SectionLabel({ children, icon }: { children: React.ReactNode, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span style={{ color: 'var(--app-accent)' }}>{icon}</span>
      <h2 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--app-dim)' }}>
        {children}
      </h2>
    </div>
  );
}

function KpiCard({
  label, value, sub, icon, accent, badge, badgeGood, delta
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  badge?: string;
  badgeGood?: boolean;
  delta?: { val: string; color: string };
}) {
  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden"
      style={{ background: 'var(--app-card)', border: '1px solid var(--app-border)' }}
    >
      <div className="flex items-center justify-between mb-3 relative z-10">
        <span style={{ color: accent }}>{icon}</span>
        <div className="flex items-center gap-2">
          {delta && (
            <span className="text-[10px] font-bold" style={{ color: delta.color }}>{delta.val}</span>
          )}
          {badge && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: badgeGood ? 'rgba(0,200,150,0.12)' : 'rgba(255,77,109,0.12)',
                color: badgeGood ? '#00C896' : '#FF4D6D',
              }}
            >
              {badge}
            </span>
          )}
        </div>
      </div>
      <p className="text-[28px] font-bold tabular-nums leading-none" style={{ color: '#e2e8f0' }}>{value}</p>
      <p className="text-[11px] mt-1" style={{ color: '#64748b' }}>{label}</p>
      <p className="text-[10px] mt-0.5" style={{ color: '#475569' }}>{sub}</p>
    </div>
  );
}
