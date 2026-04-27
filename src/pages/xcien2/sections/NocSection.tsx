import { useState, useEffect } from 'react';
import { ThemeConfig } from '../types';
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

function HoloGrid() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(0,255,136,0.03) 1px,transparent 1px),
                          linear-gradient(90deg,rgba(0,255,136,0.03) 1px,transparent 1px)`,
        backgroundSize: '36px 36px',
      }} />
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,255,136,0.06) 0%,transparent 65%)' }} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <div style={{ width: 4, height: 18, background: G, boxShadow: `0 0 12px ${G}`, borderRadius: 2 }} />
      <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: 14, fontWeight: 600, letterSpacing: 2, color: G, textShadow: `0 0 10px ${G}`, textTransform: 'uppercase' }}>{children}</span>
      <div style={{ flex: 1, height: '1.5px', background: `linear-gradient(90deg,${G}40,transparent)` }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props { 
  theme: ThemeConfig;
  cities?: NOCCity[];
  alerts?: NOCAlert[];
  activeTenantId?: string | null;
  onTenantChange?: (id: string | null) => void;
}

export default function NocSection({ 
  theme, 
  cities = [], 
  alerts = [], 
  activeTenantId = null,
  onTenantChange
}: Props) {
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString('es-MX'));
  const [view, setView] = useState<'Operador' | 'Gerencial'>('Operador');
  const [alertFilter, setAlertFilter] = useState<'Todos' | 'Crítico' | 'Alto'>('Todos');

  useEffect(() => {
    const id = setInterval(() => setLastUpdated(new Date().toLocaleTimeString('es-MX')), 30_000);
    return () => clearInterval(id);
  }, []);

  const healthPct = cities.length > 0 
    ? Math.round(cities.reduce((acc, c) => acc + c.score, 0) / cities.length)
    : 100;

  const hc = healthPct >= 95 ? G : healthPct >= 85 ? Y : R;
  const critAlerts = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div style={{ position: 'relative', background: '#000c08', borderRadius: theme.radius, border: `1px solid ${G}30`, overflow: 'hidden', padding: 32 }}>
      <MatrixBackground />
      <HoloGrid />
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: G, boxShadow: `0 0 20px ${G}`, animation: theme.animations ? 'nocpulse 2s ease-in-out infinite' : 'none' }} />
            <span style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 600, fontSize: 28, letterSpacing: 2, color: '#fff', textShadow: `0 0 20px ${G}`, textTransform: 'uppercase' }}>RED EN VIVO — NOC XCIEN</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: `${G}60`, letterSpacing: 1, marginLeft: 15 }}>[ SYNC_TIME: {lastUpdated} ]</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: `${G}40`, fontWeight: 700, fontFamily: 'Oswald, sans-serif', letterSpacing: 1 }}>SALUD GLOBAL</div>
              <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 36, fontWeight: 700, color: hc, textShadow: `0 0 25px ${hc}`, lineHeight: 1 }}>{healthPct}%</div>
            </div>
            {critAlerts > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: `${R}15`, border: `2px solid ${R}`, borderRadius: 8, padding: '10px 20px', boxShadow: `0 0 25px ${R}40` }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: R, animation: theme.animations ? 'critpulse 1s ease-in-out infinite' : 'none' }} />
                <span style={{ color: R, fontWeight: 800, fontSize: 18, fontFamily: 'Oswald, sans-serif', letterSpacing: 1 }}>{critAlerts} ALERTAS CRÍTICAS</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 32, borderBottom: `1px solid ${G}20`, paddingBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1 }}>
            <button
              onClick={() => onTenantChange?.(null)}
              style={{
                padding: '10px 22px', fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer', fontFamily: 'Oswald, sans-serif', letterSpacing: 1.5, textTransform: 'uppercase',
                background: activeTenantId === null ? `${G}20` : 'transparent',
                color: activeTenantId === null ? G : `${G}40`,
                border: `1px solid ${activeTenantId === null ? G : `${G}20`}`,
                transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}
            >
              Vista Global
            </button>
            {CASA_TENANTS.map(t => (
              <button
                key={t.id}
                onClick={() => onTenantChange?.(t.id)}
                style={{
                  padding: '10px 22px', fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer', fontFamily: 'Oswald, sans-serif', letterSpacing: 1.5, textTransform: 'uppercase',
                  background: activeTenantId === t.id ? `${G}20` : 'transparent',
                  color: activeTenantId === t.id ? G : `${G}40`,
                  border: `1px solid ${activeTenantId === t.id ? G : `${G}20`}`,
                  transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                {t.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', background: `${G}08`, border: `1px solid ${G}25`, borderRadius: 8, overflow: 'hidden' }}>
            {(['Operador', 'Gerencial'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{ 
                  padding: '8px 22px', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Oswald, sans-serif', 
                  letterSpacing: 2, textTransform: 'uppercase', 
                  background: view === v ? `${G}25` : 'transparent', color: view === v ? G : `${G}40`, transition: 'all 0.2s' 
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Node cards */}
        {view === 'Operador' && (
          <div style={{ marginBottom: 40 }}>
            <SectionLabel>Nodos en Tiempo Real</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
              {cities.map(city => {
                const c   = sc(city.status || (city.score < 80 ? 'critical' : 'ok'));
                const lc  = sc(city.score < 90 ? 'warning' : 'ok');
                const tenant = CASA_TENANTS.find(t => t.id === city.tenantId);
                const isc = ISP_COLORS[tenant?.name || 'Xcien'] || ISP_COLORS.Xcien;
                return (
                  <div
                    key={city.id}
                    style={{
                      position: 'relative', borderRadius: 12, overflow: 'hidden',
                      background: 'rgba(0,12,6,0.92)', border: `1px solid ${c}50`,
                      backdropFilter: 'blur(16px)', padding: '20px',
                      boxShadow: city.score < 80 ? `0 0 20px ${c}25` : 'none'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${c},transparent)`, boxShadow: `0 0 12px ${c}` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 600, fontSize: 18, color: '#fff', textShadow: `0 0 10px ${G}50` }}>{city.name}</span>
                      <span style={{ background: `${isc}20`, color: isc, border: `1px solid ${isc}50`, borderRadius: 4, padding: '2px 10px', fontSize: 10, fontWeight: 800, fontFamily: 'Oswald, sans-serif' }}>{tenant?.name || 'Xcien'}</span>
                    </div>
                    <div style={{ fontSize: 11, color: `${G}40`, marginBottom: 18, fontFamily: 'monospace' }}>IP: {city.id.slice(0,14)}</div>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <div>
                        <div style={{ fontSize: 9, color: `${G}25`, marginBottom: 2 }}>LATENCIA</div>
                        <span style={{ color: lc, fontFamily: 'Oswald, sans-serif', fontWeight: 600, fontSize: 26, textShadow: `0 0 15px ${lc}` }}>{city.score}</span>
                        <span style={{ color: `${G}30`, fontSize: 11, marginLeft: 4 }}>ms</span>
                      </div>
                      <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
                      <div>
                        <div style={{ fontSize: 9, color: `${G}25`, marginBottom: 2 }}>ESTABILIDAD</div>
                        <span style={{ color: lc, fontFamily: 'Oswald, sans-serif', fontWeight: 600, fontSize: 26, textShadow: `0 0 15px ${lc}` }}>{city.score}</span>
                        <span style={{ color: `${G}30`, fontSize: 11, marginLeft: 4 }}>%</span>
                      </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: 14, right: 14, width: 10, height: 10, borderRadius: '50%', background: c, boxShadow: `0 0 10px ${c}`, animation: (city.score < 80) && theme.animations ? 'critpulse 1s ease-in-out infinite' : 'none' }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Alerts Table */}
        <div style={{ background: 'rgba(0,12,6,0.92)', border: `1px solid ${G}30`, borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(20px)', boxShadow: `0 20px 50px rgba(0,0,0,0.6)` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: `1px solid ${G}20` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 5, height: 20, background: G, boxShadow: `0 0 12px ${G}`, borderRadius: 2 }} />
              <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: 16, fontWeight: 600, letterSpacing: 2, color: G, textTransform: 'uppercase' }}>Consola de Alertas Activas</span>
              <div style={{ background: `${R}30`, border: `1px solid ${R}`, borderRadius: 40, padding: '3px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: 14, fontWeight: 700, color: R }}>{alerts.length} EVENTOS</span>
              </div>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${G}20`, background: 'rgba(255,255,255,0.03)' }}>
                {['ID', 'Nodo Principal', 'Tipo de Incidencia', 'Gravedad', 'Workflow'].map(h => (
                  <th key={h} style={{ padding: '18px 24px', fontSize: 11, fontWeight: 600, color: `${G}60`, letterSpacing: 2, textAlign: 'left', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.map(a => {
                const isCrit = a.severity === 'critical';
                const c = isCrit ? R : Y;
                return (
                  <tr key={a.id} style={{ borderBottom: `1px solid rgba(0,255,136,0.1)`, transition: 'background 0.2s' }}>
                    <td style={{ padding: '20px 24px', fontFamily: 'monospace', fontSize: 14, color: `${G}70` }}>{a.id.slice(0, 10)}</td>
                    <td style={{ padding: '20px 24px', fontSize: 16, color: '#fff', fontWeight: 600, fontFamily: 'Oswald, sans-serif' }}>{a.cityName}</td>
                    <td style={{ padding: '20px 24px', fontSize: 14, color: '#d8f8e8', fontWeight: 500 }}>{a.type}</td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: c, boxShadow: `0 0 15px ${c}`, animation: isCrit ? 'critpulse 1s ease-in-out infinite' : undefined }} />
                        <span style={{ color: c, fontSize: 12, fontWeight: 800, fontFamily: 'Oswald, sans-serif', letterSpacing: 1 }}>{isCrit ? 'CRITICAL' : 'WARNING'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ background: a.ticketCreated ? `${G}20` : `${R}20`, color: a.ticketCreated ? G : R, border: `1px solid ${a.ticketCreated ? G : R}`, borderRadius: 6, padding: '5px 14px', fontSize: 11, fontWeight: 800, fontFamily: 'Oswald, sans-serif' }}>
                        {a.ticketCreated ? 'TICKET OPEN' : 'PENDING'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {alerts.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 60, textAlign: 'center', color: `${G}40`, fontSize: 18, fontFamily: 'Oswald, sans-serif', letterSpacing: 3 }}>— RED ESTABLE: NO SE DETECTAN ALERTAS —</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 20 }}>
          {([['● ONLINE', G], ['● WARNING', Y], ['● CRITICAL', R]] as [string, string][]).map(([l, c]) => (
            <span key={l} style={{ fontSize: 12, color: c, fontFamily: 'Oswald, sans-serif', fontWeight: 600, letterSpacing: 1.5 }}>{l}</span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes nocpulse  { 0%,100%{opacity:1;box-shadow:0 0 25px #00ff88}50%{opacity:.4;box-shadow:0 0 10px #00ff88} }
        @keyframes critpulse { 0%,100%{opacity:1}50%{opacity:.2} }
      `}</style>
    </div>
  );
}
