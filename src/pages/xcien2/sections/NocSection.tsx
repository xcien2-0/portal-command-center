import { useState, useEffect } from 'react';
import { ThemeConfig } from '../types';
import { API_BASE } from '../../../config';
import { NOCCity, NOCAlert } from '@/types/noc';
import { CASA_TENANTS } from '@/types/tenant';

// ── Palette constants ─────────────────────────────────────────────────────────
const G = '#00ff88';
const Y = '#ffcc00';
const R = '#ff3366';

const ISP_COLORS: Record<string, string> = {
  Xcien: '#00aaff', Luminet: '#aa66ff',
  Wispi: '#0EA5E9', Sandur: '#FF6B35', Huus: '#9B59D7',
};

function sc(status: string) {
  return status === 'critical' || status === 'critico' ? R
       : status === 'warning'  || status === 'alto'    ? Y : G;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MatrixBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.15, pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)',
        fontFamily: 'monospace', fontSize: 12, color: '#00ff88', textShadow: '0 0 8px #00ff88',
        whiteSpace: 'nowrap', userSelect: 'none'
      }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{ 
            animation: `matrixFall ${15 + Math.random() * 25}s linear infinite`,
            animationDelay: `${-Math.random() * 25}s`,
            writingMode: 'vertical-rl',
            textAlign: 'center'
          }}>
            {Array.from({ length: 60 }).map(() => Math.random() > 0.5 ? '1' : '0').join(' ')}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes matrixFall {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}

function Scanlines() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
      background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
      backgroundSize: '100% 4px, 3px 100%', opacity: 0.15
    }} />
  );
}

function HUDElement({ pos, label, value }: { pos: any, label: string, value: string }) {
  return (
    <div style={{ position: 'absolute', ...pos, zIndex: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 2, height: 10, background: G }} />
        <span style={{ fontSize: 9, color: `${G}60`, fontFamily: 'monospace', letterSpacing: 1 }}>{label}</span>
      </div>
      <span style={{ fontSize: 14, color: G, fontWeight: 700, fontFamily: 'JetBrains Mono', textShadow: `0 0 10px ${G}` }}>{value}</span>
    </div>
  );
}

function HoloGrid() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
      <div style={{
        position: 'absolute', inset: -100,
        backgroundImage: `linear-gradient(rgba(0,255,136,0.05) 1px,transparent 1px),
                          linear-gradient(90deg,rgba(0,255,136,0.05) 1px,transparent 1px)`,
        backgroundSize: '40px 40px',
        transform: 'perspective(1000px) rotateX(60deg)',
        maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)'
      }} />
    </div>
  );
}

function HoloMap({ cities }: { cities: any[] }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: 450, background: 'rgba(0,20,10,0.4)', border: `1px solid ${G}25`, borderRadius: 24, marginBottom: 40, overflow: 'hidden', boxShadow: `inset 0 0 100px ${G}05` }}>
      <MatrixBackground />
      <HoloGrid />
      <Scanlines />
      
      {/* Decorative HUD */}
      <HUDElement pos={{ top: 20, left: 20 }} label="GEO_SCAN" value="MX_NORTH_CORE" />
      <HUDElement pos={{ top: 20, right: 20 }} label="SIG_STRENGTH" value="99.28%" />
      <HUDElement pos={{ bottom: 20, right: 20 }} label="SYS_STATUS" value="ENCRYPTED" />

      <svg width="100%" height="100%" viewBox="0 0 1000 450" style={{ position: 'relative', zIndex: 2 }}>
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={G} stopOpacity="0.5" />
            <stop offset="100%" stopColor={G} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Connection Lines to Core */}
        {cities.map(city => {
          const isCore = city.name === 'Monterrey';
          if (isCore) return null;
          const x = 500 + (city.lng + 100.31) * 3500;
          const y = 225 - (city.lat - 25.68) * 3500;
          const c = city.score < 80 ? R : G;
          return (
            <g key={`l-${city.id}`}>
              <path 
                d={`M 500 225 Q ${(500+x)/2} ${(225+y)/2 - 50} ${x} ${y}`} 
                fill="none" 
                stroke={c} 
                strokeWidth="1.5" 
                strokeDasharray="4,4" 
                opacity="0.25"
              >
                <animate attributeName="stroke-dashoffset" from="100" to="0" dur="4s" repeatCount="indefinite" />
              </path>
            </g>
          );
        })}

        {/* Nodes */}
        {cities.map(city => {
          const x = 500 + (city.lng + 100.31) * 3500;
          const y = 225 - (city.lat - 25.68) * 3500;
          const c = city.score < 80 ? R : G;
          return (
            <g key={`n-${city.id}`} style={{ cursor: 'pointer' }}>
              <circle cx={x} cy={y} r="15" fill={`url(#nodeGlow)`} opacity="0.4" />
              <circle cx={x} cy={y} r="5" fill="#000" stroke={c} strokeWidth="2" />
              <circle cx={x} cy={y} r="10" fill="transparent" stroke={c} strokeWidth="1" opacity="0.3">
                <animate attributeName="r" from="5" to="18" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="3s" repeatCount="indefinite" />
              </circle>
              <text x={x + 18} y={y + 5} fill={c} style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono', textShadow: `0 0 10px ${c}` }}>{city.name}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ position: 'absolute', bottom: 20, left: 20, color: `${G}40`, fontSize: 9, fontFamily: 'monospace', letterSpacing: 2 }}>[ HOLOGRAPHIC_INTERFACE_V2.0_READY ]</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <div style={{ width: 4, height: 18, background: G, boxShadow: `0 0 15px ${G}`, borderRadius: 2 }} />
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, letterSpacing: 2, color: G, textShadow: `0 0 10px ${G}`, textTransform: 'uppercase' }}>{children}</span>
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg,${G}40,transparent)` }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props { 
  theme: ThemeConfig;
  activeThemeId?: string;
  cities?: NOCCity[];
  alerts?: NOCAlert[];
  activeTenantId?: string | null;
  onTenantChange?: (id: string | null) => void;
}

export default function NocSection({ 
  theme, 
  activeThemeId,
  cities = [], 
  alerts = [], 
  activeTenantId = null,
  onTenantChange
}: Props) {
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString('es-MX'));
  const [view, setView] = useState<'Operador' | 'Gerencial'>('Gerencial');
  const [alertFilter, setAlertFilter] = useState<'Todos' | 'Crítico' | 'Alto'>('Todos');
  const [selectedSop, setSelectedSop] = useState<{ id: string, content: string } | null>(null);

  const openSop = async (id: string) => {
    try {
      const path = id === 'SOP-NOC-001' ? 'estandares/Estándar_Proceso_Soporte_HL.md' : 'estandares/Estándar_Corporativo_de_Instalación_Xcien_estándar_de_instalación.md';
      const res = await fetch(`${API_BASE}/api/docs/content?path=${path}`);
      const data = await res.json();
      setSelectedSop({ id, content: data.content });
    } catch (e) {
      console.error(e);
      setSelectedSop({ id, content: "# Error\nNo se pudo cargar el manual." });
    }
  };

  useEffect(() => {
    const id = setInterval(() => setLastUpdated(new Date().toLocaleTimeString('es-MX')), 10_000);
    return () => clearInterval(id);
  }, []);

  const healthPct = cities.length > 0 
    ? Math.round(cities.reduce((acc, c) => acc + c.score, 0) / cities.length)
    : 100;

  const hc = healthPct >= 95 ? G : healthPct >= 85 ? Y : R;
  const critAlerts = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div style={{ position: 'relative', background: 'radial-gradient(circle at center, #00150a 0%, #000804 100%)', borderRadius: theme.radius, border: `1px solid ${G}40`, overflow: 'hidden', padding: 32, boxShadow: `0 0 50px rgba(0,255,136,0.1)` }}>
      <MatrixBackground />
      <HoloGrid />
      <Scanlines />
      
      <div style={{ position: 'relative', zIndex: 10 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: G, boxShadow: `0 0 30px ${G}`, animation: 'nocpulse 2s ease-in-out infinite' }} />
            <div>
              <span style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 600, fontSize: 32, letterSpacing: 3, color: '#fff', textShadow: `0 0 30px ${G}`, textTransform: 'uppercase' }}>CENTRO DE MANDO NOC</span>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: `${G}80`, letterSpacing: 2, marginTop: 4 }}>OPERACIONES UNIFICADAS — ESTADO: [ ACTIVO ]</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: `${G}60`, fontWeight: 700, fontFamily: 'JetBrains Mono', letterSpacing: 2 }}>GLOBAL_HEALTH</div>
              <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 48, fontWeight: 700, color: hc, textShadow: `0 0 40px ${hc}`, lineHeight: 1 }}>{healthPct}<span style={{ fontSize: 24, opacity: 0.6 }}>%</span></div>
            </div>
            {critAlerts > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: `${R}15`, border: `1px solid ${R}`, borderRadius: 12, padding: '12px 24px', boxShadow: `0 0 40px ${R}40` }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: R, animation: 'critpulse 1s ease-in-out infinite' }} />
                <div style={{ fontFamily: 'Oswald, sans-serif', textAlign: 'left' }}>
                  <div style={{ color: R, fontWeight: 800, fontSize: 24, lineHeight: 1 }}>{critAlerts}</div>
                  <div style={{ color: R, fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>CRITICAL_FAILURES</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 32, borderBottom: `1px solid ${G}15`, paddingBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', flex: 1, paddingBottom: 4 }}>
            <button
              onClick={() => onTenantChange?.(null)}
              style={{
                padding: '12px 24px', fontSize: 11, fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontFamily: 'JetBrains Mono', letterSpacing: 2, textTransform: 'uppercase',
                background: activeTenantId === null ? `${G}15` : 'rgba(255,255,255,0.02)',
                color: activeTenantId === null ? G : `${G}40`,
                border: `1px solid ${activeTenantId === null ? G : 'transparent'}`,
                transition: 'all 0.3s', whiteSpace: 'nowrap', boxShadow: activeTenantId === null ? `0 0 20px ${G}20` : 'none'
              }}
            >
              Vista Global
            </button>
            {CASA_TENANTS.map(t => (
              <button
                key={t.id}
                onClick={() => onTenantChange?.(t.id)}
                style={{
                  padding: '12px 24px', fontSize: 11, fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontFamily: 'JetBrains Mono', letterSpacing: 2, textTransform: 'uppercase',
                  background: activeTenantId === t.id ? `${G}15` : 'rgba(255,255,255,0.02)',
                  color: activeTenantId === t.id ? G : `${G}40`,
                  border: `1px solid ${activeTenantId === t.id ? G : 'transparent'}`,
                  transition: 'all 0.3s', whiteSpace: 'nowrap', boxShadow: activeTenantId === t.id ? `0 0 20px ${G}20` : 'none'
                }}
              >
                {t.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: `1px solid ${G}20`, borderRadius: 10, overflow: 'hidden', padding: 4 }}>
            {(['Operador', 'Gerencial'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{ 
                  padding: '8px 24px', fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono', 
                  letterSpacing: 2, textTransform: 'uppercase', borderRadius: 6,
                  background: view === v ? G : 'transparent', color: view === v ? '#000' : `${G}60`, transition: 'all 0.3s' 
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Map visualization */}
          {view === 'Gerencial' && <HoloMap cities={cities} />}

          {/* Node cards */}
          {view === 'Operador' && (
            <div>
              <SectionLabel>ACTIVE_NODES_STREAM</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 16 }}>
                {cities.map(city => {
                  const c   = sc(city.status || (city.score < 80 ? 'critical' : 'ok'));
                  const lc  = sc(city.score < 90 ? 'warning' : 'ok');
                  const tenant = CASA_TENANTS.find(t => t.id === city.tenantId);
                  const isc = ISP_COLORS[tenant?.name || 'Xcien'] || ISP_COLORS.Xcien;
                  return (
                    <div
                      key={city.id}
                      style={{
                        position: 'relative', borderRadius: 16, overflow: 'hidden',
                        background: 'rgba(0,18,10,0.6)', border: `1px solid ${c}30`,
                        backdropFilter: 'blur(20px)', padding: '24px',
                        boxShadow: city.score < 80 ? `0 0 30px ${c}15` : 'none',
                        transition: 'transform 0.3s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${c},transparent)`, boxShadow: `0 0 15px ${c}` }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 600, fontSize: 20, color: '#fff', textShadow: `0 0 10px ${G}50` }}>{city.name}</span>
                        <span style={{ background: `${isc}15`, color: isc, border: `1px solid ${isc}40`, borderRadius: 6, padding: '2px 10px', fontSize: 9, fontWeight: 800, fontFamily: 'JetBrains Mono' }}>{tenant?.name || 'Xcien'}</span>
                      </div>
                      <div style={{ fontSize: 10, color: `${G}40`, marginBottom: 20, fontFamily: 'JetBrains Mono', letterSpacing: 1 }}>ADDR: {(city as any).primary_ip || '0.0.0.0'}</div>
                      <div style={{ display: 'flex', gap: 32 }}>
                        <div>
                          <div style={{ fontSize: 8, color: `${G}30`, marginBottom: 4, fontFamily: 'JetBrains Mono' }}>LATENCY</div>
                          <span style={{ color: lc, fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 28, textShadow: `0 0 20px ${lc}` }}>{city.score}</span>
                          <span style={{ color: `${G}40`, fontSize: 10, marginLeft: 6 }}>ms</span>
                        </div>
                        <div style={{ width: 1, background: 'rgba(255,255,255,0.05)' }} />
                        <div>
                          <div style={{ fontSize: 8, color: `${G}30`, marginBottom: 4, fontFamily: 'JetBrains Mono' }}>PKT_LOSS</div>
                          <span style={{ color: lc, fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 28, textShadow: `0 0 20px ${lc}` }}>{city.score < 80 ? '2.1' : '0.0'}</span>
                          <span style={{ color: `${G}40`, fontSize: 10, marginLeft: 6 }}>%</span>
                        </div>
                      </div>
                      <div style={{ position: 'absolute', bottom: 18, right: 18, width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 15px ${c}`, animation: (city.score < 80) ? 'critpulse 1s ease-in-out infinite' : 'none' }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alerts Table */}
          <div style={{ background: 'rgba(0,15,8,0.7)', border: `1px solid ${G}25`, borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(30px)', boxShadow: `0 30px 60px rgba(0,0,0,0.8)` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: `1px solid ${G}15` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 4, height: 20, background: G, boxShadow: `0 0 15px ${G}`, borderRadius: 2 }} />
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 15, fontWeight: 700, letterSpacing: 2, color: G, textTransform: 'uppercase' }}>Alert_Live_Console</span>
                <div style={{ background: `${R}15`, border: `1px solid ${R}40`, borderRadius: 6, padding: '4px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 800, color: R }}>{alerts.length} EVENTS</span>
                </div>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${G}10`, background: 'rgba(255,255,255,0.02)' }}>
                  {['Event_ID', 'Core_Node', 'Incidence_Type', 'SOP_Link', 'Severity', 'Workflow'].map(h => (
                    <th key={h} style={{ padding: '20px 32px', fontSize: 10, fontWeight: 700, color: `${G}40`, letterSpacing: 2, textAlign: 'left', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.map(a => {
                  const isCrit = a.severity === 'critical';
                  const c = isCrit ? R : Y;
                  return (
                    <tr key={a.id} style={{ borderBottom: `1px solid rgba(0,255,136,0.05)`, transition: 'background 0.3s' }} className="alert-row">
                      <td style={{ padding: '24px 32px', fontFamily: 'JetBrains Mono', fontSize: 13, color: `${G}50` }}>{a.id.slice(0, 8)}</td>
                      <td style={{ padding: '24px 32px', fontSize: 17, color: '#fff', fontWeight: 600, fontFamily: 'Oswald, sans-serif' }}>{a.cityName}</td>
                      <td style={{ padding: '24px 32px', fontSize: 14, color: '#e0f8ee', fontWeight: 500 }}>{a.type}</td>
                      <td style={{ padding: '24px 32px' }}>
                        <span 
                          onClick={() => openSop((a as any).sopId || 'SOP-NOC-001')}
                          style={{ color: G, fontSize: 11, fontWeight: 800, fontFamily: 'JetBrains Mono', background: `${G}10`, padding: '6px 14px', borderRadius: 6, border: `1px solid ${G}30`, cursor: 'pointer', transition: 'all 0.3s' }}
                        >
                          {(a as any).sopId || 'SOP-NOC-001'}
                        </span>
                      </td>
                      <td style={{ padding: '24px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, boxShadow: `0 0 15px ${c}`, animation: isCrit ? 'critpulse 1s ease-in-out infinite' : undefined }} />
                          <span style={{ color: c, fontSize: 11, fontWeight: 800, fontFamily: 'JetBrains Mono', letterSpacing: 1 }}>{isCrit ? 'CRITICAL' : 'WARNING'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '24px 32px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ background: a.ticketCreated ? `${G}10` : `${R}10`, color: a.ticketCreated ? G : R, border: `1px solid ${a.ticketCreated ? G : R}40`, borderRadius: 8, padding: '6px 16px', fontSize: 10, fontWeight: 800, fontFamily: 'JetBrains Mono', textAlign: 'center' }}>
                            {a.ticketCreated ? 'TICKET_SYNC' : 'ACTION_REQUIRED'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {alerts.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 80, textAlign: 'center', color: `${G}30`, fontSize: 16, fontFamily: 'JetBrains Mono', letterSpacing: 4 }}>— SYSTEM_OPTIMAL: NO_THREATS_DETECTED —</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 32, marginTop: 24 }}>
          {([['● SYSTEM_ONLINE', G], ['● NETWORK_DEGRADED', Y], ['● CRITICAL_FAILURE', R]] as [string, string][]).map(([l, c]) => (
            <span key={l} style={{ fontSize: 10, color: c, fontFamily: 'JetBrains Mono', fontWeight: 800, letterSpacing: 2 }}>{l}</span>
          ))}
        </div>
      </div>

      {/* SOP Modal */}
      {selectedSop && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', padding: 40 }}>
          <div style={{ width: '100%', maxWidth: 900, height: '85%', background: '#000c08', border: `1px solid ${G}`, borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: `0 0 80px ${G}30` }}>
            <div style={{ padding: '24px 32px', borderBottom: `1px solid ${G}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ color: G, fontWeight: 800, fontSize: 20, fontFamily: 'Oswald, sans-serif', letterSpacing: 1 }}>SYSTEM_MANUAL: {selectedSop.id}</span>
              <button onClick={() => setSelectedSop(null)} style={{ background: 'transparent', border: 'none', color: G, fontSize: 32, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ flex: 1, padding: 40, overflowY: 'auto', color: '#e0f8ee', fontFamily: 'JetBrains Mono', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {selectedSop.content}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes nocpulse  { 0%,100%{opacity:1;box-shadow:0 0 30px #00ff88}50%{opacity:.5;box-shadow:0 0 10px #00ff88} }
        @keyframes critpulse { 0%,100%{opacity:1}50%{opacity:.2} }
        .alert-row:hover { background: rgba(0,255,136,0.03) !important; }
      `}</style>
    </div>
  );
}
