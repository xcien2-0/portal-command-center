import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Monitor, Radio, Send, Phone, ScanLine, LayoutDashboard,
  FileBarChart, GraduationCap, AlertTriangle, CheckCircle2,
  Activity, Users, Wifi, WifiOff, TrendingUp, Clock,
  ChevronRight, Circle,
} from 'lucide-react';
import { getAllCasaData, getAllAlerts } from '@/services/nocboard';
import { CASA_TENANTS } from '@/types/tenant';
import { TENANT_COLORS, FSM_ABRIL_2026 } from '@/data/noc-mock';
import { ISP_UPTIMES, REVENUE_METRICS } from '@/data/mockGerenciaData';

// ── Module cards ────────────────────────────────────────────────────────────

const MODULES = [
  {
    title: 'Vista NOC',
    description: 'Estado global de redes y tenants',
    url: '/noc',
    icon: Monitor,
    color: '#00B4D8',
    bg: 'rgba(0,180,216,0.08)',
    border: 'rgba(0,180,216,0.25)',
  },
  {
    title: 'Red en Vivo',
    description: 'Nodos, latencia y alertas en tiempo real',
    url: '/red-en-vivo',
    icon: Radio,
    color: '#00C896',
    bg: 'rgba(0,200,150,0.08)',
    border: 'rgba(0,200,150,0.25)',
  },
  {
    title: 'Dispatch',
    description: 'Gestión de técnicos en campo',
    url: '/dispatch',
    icon: Send,
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.25)',
  },
  {
    title: 'Call Center',
    description: 'Atención y escalamiento de tickets',
    url: '/call-center',
    icon: Phone,
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.25)',
  },
  {
    title: 'Scanner',
    description: 'Escaneo de inventario y equipos',
    url: '/scan',
    icon: ScanLine,
    color: '#FB923C',
    bg: 'rgba(251,146,60,0.08)',
    border: 'rgba(251,146,60,0.25)',
  },
  {
    title: 'Gerencia',
    description: 'Revenue, SLAs y agentes IA',
    url: '/gerencia',
    icon: LayoutDashboard,
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.25)',
  },
  {
    title: 'Reportes',
    description: 'Gobierno, impacto y cumplimiento',
    url: '/reportes-gobierno',
    icon: FileBarChart,
    color: '#F472B6',
    bg: 'rgba(244,114,182,0.08)',
    border: 'rgba(244,114,182,0.25)',
  },
  {
    title: 'Academia XCIEN',
    description: 'Capacitación, exámenes y WFM',
    url: '/academia',
    icon: GraduationCap,
    color: '#34D399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.25)',
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

  // Network data derived from mocks
  const allData = useMemo(() => getAllCasaData(), []);
  const alerts = useMemo(() => getAllAlerts(), []);
  const activeAlerts = alerts.filter(a => !a.ticketCreated);

  const tenantStats = useMemo(() =>
    CASA_TENANTS.map(t => {
      const td = allData[t.id];
      const cities = td?.cities ?? [];
      const totalOnline = cities.reduce((s, c) => s + c.online, 0);
      const totalOffline = cities.reduce((s, c) => s + c.offline, 0);
      const avgScore = cities.length
        ? Math.round(cities.reduce((s, c) => s + c.score, 0) / cities.length)
        : 0;
      const cityAlerts = cities.reduce((s, c) => s + c.alerts, 0);
      return { ...t, cities: cities.length, totalOnline, totalOffline, avgScore, cityAlerts };
    }), [allData]);

  const globalOnline = tenantStats.reduce((s, t) => s + t.totalOnline, 0);
  const globalOffline = tenantStats.reduce((s, t) => s + t.totalOffline, 0);
  const globalTotal = globalOnline + globalOffline;
  const healthPct = globalTotal > 0 ? Math.round((globalOnline / globalTotal) * 100) : 0;

  const avgUptime = ISP_UPTIMES.reduce((s, i) => s + i.uptime, 0) / ISP_UPTIMES.length;

  const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen" style={{ background: '#0B1826', color: '#e2e8f0' }}>

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div
        className="px-8 pt-10 pb-8"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-[1300px] mx-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <img src="/xcien.png" alt="XCIEN" className="h-8 w-auto object-contain" />
              <span
                className="text-[28px] font-bold tracking-tight"
                style={{ color: '#e2e8f0', letterSpacing: '-0.02em' }}
              >
                XCIEN 2.0
              </span>
              <span
                className="text-[11px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                style={{ color: '#00B4D8', borderColor: 'rgba(0,180,216,0.4)', background: 'rgba(0,180,216,0.08)' }}
              >
                Operations Hub
              </span>
            </div>
            <p className="text-[13px] capitalize" style={{ color: '#64748b' }}>{dateStr}</p>
          </div>

          <div className="flex items-center gap-2" style={{ color: '#64748b' }}>
            <Clock className="h-4 w-4" />
            <span className="font-mono text-[20px] font-medium tabular-nums" style={{ color: '#e2e8f0' }}>
              {timeStr}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-8 pb-16 space-y-10 mt-8">

        {/* ── Global KPIs ─────────────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              label="Hosts en línea"
              value={`${globalOnline.toLocaleString()}`}
              sub={`de ${globalTotal.toLocaleString()} totales`}
              icon={<Wifi className="h-4 w-4" />}
              accent="#00C896"
              badge={`${healthPct}%`}
              badgeGood={healthPct >= 80}
            />
            <KpiCard
              label="Hosts caídos"
              value={`${globalOffline.toLocaleString()}`}
              sub="requieren atención"
              icon={<WifiOff className="h-4 w-4" />}
              accent={globalOffline > 50 ? '#FF4D6D' : '#FFB703'}
            />
            <KpiCard
              label="Alertas activas"
              value={`${activeAlerts.length}`}
              sub="sin ticket creado"
              icon={<AlertTriangle className="h-4 w-4" />}
              accent={activeAlerts.length > 3 ? '#FF4D6D' : '#FFB703'}
            />
            <KpiCard
              label="Uptime promedio"
              value={`${avgUptime.toFixed(1)}%`}
              sub="5 ISPs activos"
              icon={<Activity className="h-4 w-4" />}
              accent={avgUptime >= 99 ? '#00C896' : '#FFB703'}
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
                  to="/noc"
                  className="rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: '#0f2030',
                    border: `1px solid ${color}30`,
                    boxShadow: `0 0 0 1px ${color}10`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold" style={{ color: '#e2e8f0' }}>{t.name}</span>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: `${sc_color}18`, color: sc_color }}
                    >
                      {scoreLabel(sc)}
                    </span>
                  </div>

                  {/* Score arc */}
                  <div className="flex items-center gap-3">
                    <div
                      className="text-[32px] font-bold tabular-nums leading-none"
                      style={{ color: sc_color }}
                    >
                      {sc}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-1.5 rounded-full" style={{ background: '#1E3A4A' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${sc}%`, background: sc_color }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px]" style={{ color: '#64748b' }}>
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
                  background: m.bg,
                  border: `1px solid ${m.border}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center"
                    style={{ background: `${m.color}22` }}
                  >
                    <m.icon className="h-4.5 w-4.5" style={{ color: m.color, width: 18, height: 18 }} />
                  </div>
                  <ChevronRight
                    className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: m.color }}
                  />
                </div>
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: '#e2e8f0' }}>{m.title}</p>
                  <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#64748b' }}>{m.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Bottom Row: Field Ops + Revenue + Alerts ─────────────────────── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Field Ops */}
            <DarkCard title="Operaciones de Campo" subtitle={FSM_ABRIL_2026.periodo}>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-[40px] font-bold leading-none tabular-nums" style={{ color: '#FFB703' }}>
                  {FSM_ABRIL_2026.cumplimiento}%
                </span>
                <div className="mb-1">
                  <p className="text-[11px]" style={{ color: '#64748b' }}>cumplimiento global</p>
                  <p className="text-[11px]" style={{ color: '#64748b' }}>{FSM_ABRIL_2026.total} tareas totales</p>
                </div>
              </div>
              <div className="h-1.5 rounded-full mb-5" style={{ background: '#1E3A4A' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${FSM_ABRIL_2026.cumplimiento}%`, background: '#FFB703' }}
                />
              </div>
              <div className="space-y-2">
                {FSM_ABRIL_2026.porEmpresa.map(e => (
                  <div key={e.empresa} className="flex items-center gap-2">
                    <span className="text-[11px] w-24 truncate" style={{ color: '#94a3b8' }}>{e.empresa}</span>
                    <div className="flex-1 h-1 rounded-full" style={{ background: '#1E3A4A' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${e.pct}%`, background: scoreColor(e.pct) }}
                      />
                    </div>
                    <span className="text-[11px] font-mono w-8 text-right" style={{ color: scoreColor(e.pct) }}>
                      {e.pct}%
                    </span>
                  </div>
                ))}
              </div>
              <Link to="/dispatch" className="mt-4 text-[11px] font-medium inline-flex items-center gap-1" style={{ color: '#00B4D8' }}>
                Ver Dispatch <ChevronRight className="h-3 w-3" />
              </Link>
            </DarkCard>

            {/* Revenue */}
            <DarkCard title="Ingresos" subtitle="Resumen ejecutivo">
              <div className="space-y-3">
                {REVENUE_METRICS.slice(0, 4).map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px]" style={{ color: '#64748b' }}>{m.label}</p>
                      <p className="text-[15px] font-semibold tabular-nums" style={{ color: '#e2e8f0' }}>{m.value}</p>
                    </div>
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: m.trendGood ? '#00C896' : '#FF4D6D' }}
                    >
                      {m.trend}
                    </span>
                  </div>
                ))}
              </div>
              <Link to="/gerencia" className="mt-4 text-[11px] font-medium inline-flex items-center gap-1" style={{ color: '#00B4D8' }}>
                Ver Gerencia <ChevronRight className="h-3 w-3" />
              </Link>
            </DarkCard>

            {/* Active Alerts */}
            <DarkCard title="Alertas activas" subtitle={`${activeAlerts.length} sin atender`}>
              {activeAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <CheckCircle2 className="h-8 w-8" style={{ color: '#00C896' }} />
                  <p className="text-[13px]" style={{ color: '#64748b' }}>Sin alertas pendientes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeAlerts.slice(0, 5).map(a => (
                    <div
                      key={a.id}
                      className="flex gap-3 rounded-lg p-2.5"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <Circle
                        className="h-2 w-2 mt-1 shrink-0"
                        style={{
                          color: a.severity === 'critical' ? '#FF4D6D' : '#FFB703',
                          fill: a.severity === 'critical' ? '#FF4D6D' : '#FFB703',
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium truncate" style={{ color: '#e2e8f0' }}>
                          {a.cityName}
                        </p>
                        <p className="text-[11px]" style={{ color: '#64748b' }}>{a.type} · {a.siteName}</p>
                      </div>
                    </div>
                  ))}
                  {activeAlerts.length > 5 && (
                    <p className="text-[11px]" style={{ color: '#64748b' }}>
                      +{activeAlerts.length - 5} más…
                    </p>
                  )}
                </div>
              )}
              <Link to="/noc" className="mt-4 text-[11px] font-medium inline-flex items-center gap-1" style={{ color: '#00B4D8' }}>
                Ver NOC <ChevronRight className="h-3 w-3" />
              </Link>
            </DarkCard>

          </div>
        </section>

        {/* ── Top Technicians ─────────────────────────────────────────────── */}
        <section>
          <SectionLabel icon={<Users className="h-3.5 w-3.5" />}>Técnicos con más carga — {FSM_ABRIL_2026.periodo}</SectionLabel>
          <div className="rounded-xl overflow-hidden" style={{ background: '#0f2030', border: '1px solid rgba(255,255,255,0.06)' }}>
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', color: '#64748b' }}>
                  <th className="text-left px-5 py-3 font-medium">Técnico</th>
                  <th className="text-right px-5 py-3 font-medium">Empresa</th>
                  <th className="text-right px-5 py-3 font-medium">Tareas</th>
                  <th className="text-right px-5 py-3 font-medium">Completadas</th>
                  <th className="text-right px-5 py-3 font-medium">Avance</th>
                </tr>
              </thead>
              <tbody>
                {FSM_ABRIL_2026.topTecnicos.map((t, i) => {
                  const pct = Math.round((t.completadas / t.tareas) * 100);
                  return (
                    <tr
                      key={i}
                      style={{ borderTop: '1px solid rgba(255,255,255,0.04)', color: '#e2e8f0' }}
                    >
                      <td className="px-5 py-3 font-medium">{t.nombre}</td>
                      <td className="px-5 py-3 text-right" style={{ color: '#64748b' }}>{t.empresa}</td>
                      <td className="px-5 py-3 text-right font-mono">{t.tareas}</td>
                      <td className="px-5 py-3 text-right font-mono">{t.completadas}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full" style={{ background: '#1E3A4A' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: scoreColor(pct) }}
                            />
                          </div>
                          <span className="font-mono w-7 text-right" style={{ color: scoreColor(pct) }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon && <span style={{ color: '#64748b' }}>{icon}</span>}
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#64748b' }}>
        {children}
      </p>
    </div>
  );
}

function KpiCard({
  label, value, sub, icon, accent, badge, badgeGood,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  badge?: string;
  badgeGood?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: '#0f2030', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span style={{ color: accent }}>{icon}</span>
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
      <p className="text-[28px] font-bold tabular-nums leading-none" style={{ color: '#e2e8f0' }}>{value}</p>
      <p className="text-[11px] mt-1" style={{ color: '#64748b' }}>{label}</p>
      <p className="text-[10px] mt-0.5" style={{ color: '#475569' }}>{sub}</p>
    </div>
  );
}

function DarkCard({
  title, subtitle, children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col"
      style={{ background: '#0f2030', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="mb-4">
        <p className="text-[14px] font-semibold" style={{ color: '#e2e8f0' }}>{title}</p>
        {subtitle && <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>{subtitle}</p>}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
