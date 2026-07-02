import { useState, useEffect, useCallback } from 'react';
import { MOCK_NODES, MOCK_ALERTS, getNetworkHealthPercent, NetworkNode, ActiveAlert } from '@/data/mockNetworkData';
import brand from '../brand';

// ── Palette ──────────────────────────────────────────────────────────────────
const G = '#00ff88';
const Y = '#ffcc00';
const R = '#ff3366';

const ISP_COLORS: Record<string, string> = {
  Xcien:   '#00aaff',
  ISP2:    '#aa66ff',
  Wispi:   '#0EA5E9',
  Sandur:  '#FF6B35',
  ISP3:    '#9B59D7',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function sc(status: string) {
  return status === 'critical' || status === 'critico' ? R
       : status === 'warning'  || status === 'alto'    ? Y
       : G;
}
function latencyStatus(ms: number) { return ms > 100 ? 'critical' : ms > 30 ? 'warning' : 'ok'; }
function uptimeStatus(u: number)   { return u < 95 ? 'critical' : u < 99 ? 'warning' : 'ok'; }
function ispColor(isp: string)     { return ISP_COLORS[isp] ?? '#888'; }

const BOOT_LINES = [
  `${brand.nocLabel} v${brand.version} — INICIANDO...`,
  'Cargando nodos de red...',
  'Conectando telemetría...',
  'Sistema operacional.',
];

// ── Sub-components ───────────────────────────────────────────────────────────

function HoloBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(0,255,136,0.035) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,255,136,0.035) 1px, transparent 1px)`,
        backgroundSize: '44px 44px',
      }} />
      <div style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%,-50%)', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,136,0.05) 0%, transparent 65%)' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,170,255,0.04) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,rgba(0,255,136,0.25),transparent)`, animation: 'scanline 7s linear infinite' }} />
    </div>
  );
}

function NocClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 13, color: G, letterSpacing: 2, textShadow: `0 0 10px ${G}` }}>
      {t.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ width: 3, height: 14, background: G, boxShadow: `0 0 8px ${G}`, borderRadius: 2 }} />
      <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: 3, color: `${G}80`, textTransform: 'uppercase' }}>{children}</span>
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg,${G}25,transparent)` }} />
    </div>
  );
}

function NodeCard({ node }: { node: NetworkNode }) {
  const c = sc(node.status);
  const isCrit = node.status === 'critical';
  const lc = sc(latencyStatus(node.latency));
  const uc = sc(uptimeStatus(node.uptime));

  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: 8, overflow: 'hidden', cursor: 'default',
        background: 'rgba(0,8,4,0.88)',
        border: `1px solid ${hovered ? c + '70' : c + '35'}`,
        backdropFilter: 'blur(10px)', transition: 'all 0.2s',
        boxShadow: hovered ? `0 0 24px ${c}30` : isCrit ? `0 0 18px ${R}18` : 'none',
      }}
    >
      {/* top gradient line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${c},transparent)`, boxShadow: `0 0 8px ${c}` }} />
      <div style={{ padding: '14px 15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#d8f8e8', letterSpacing: 1 }}>{node.shortName}</span>
          <span style={{ background: `${ispColor(node.isp)}12`, color: ispColor(node.isp), border: `1px solid ${ispColor(node.isp)}35`, borderRadius: 3, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>{node.isp}</span>
        </div>
        <div style={{ fontSize: 9, color: '#2a5040', marginBottom: 13, fontFamily: 'monospace' }}>{node.location}</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div>
            <span style={{ color: lc, fontFamily: 'monospace', fontWeight: 700, fontSize: 17, textShadow: `0 0 10px ${lc}` }}>{node.latency}</span>
            <span style={{ color: '#1e4030', fontSize: 9 }}>ms</span>
          </div>
          <div style={{ width: 1, height: 18, background: '#0a2018' }} />
          <div>
            <span style={{ color: uc, fontFamily: 'monospace', fontWeight: 700, fontSize: 17, textShadow: `0 0 10px ${uc}` }}>{node.uptime}</span>
            <span style={{ color: '#1e4030', fontSize: 9 }}>%up</span>
          </div>
        </div>
      </div>
      {/* status dot */}
      <div style={{
        position: 'absolute', bottom: 11, right: 11, width: 7, height: 7, borderRadius: '50%',
        background: c, boxShadow: `0 0 8px ${c}, 0 0 16px ${c}50`,
        animation: isCrit ? 'critpulse 1s ease-in-out infinite' : undefined,
      }} />
    </div>
  );
}

function HoloBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 3, background: 'rgba(0,255,136,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: `linear-gradient(90deg,${color}60,${color})`, boxShadow: `0 0 6px ${color}`, transition: 'width 1s ease' }} />
      </div>
      <span style={{ color, fontFamily: 'monospace', fontWeight: 700, fontSize: 12, textShadow: `0 0 8px ${color}`, minWidth: 44, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

function AlertRow({ alert, onAttend }: { alert: ActiveAlert; onAttend: (a: ActiveAlert) => void }) {
  const isCrit = alert.severity === 'critico';
  const c = isCrit ? R : Y;
  const statusLabel = alert.status === 'nueva' ? 'Nueva' : alert.status === 'en_atencion' ? 'En atención' : 'Resuelta';
  const isNueva = alert.status === 'nueva';

  const [hovered, setHovered] = useState(false);
  const [btnHov, setBtnHov] = useState(false);

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderBottom: `1px solid rgba(0,255,136,0.05)`, background: hovered ? 'rgba(0,255,136,0.025)' : 'transparent', transition: 'background 0.15s' }}
    >
      <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontSize: 11, color: '#90d8b0' }}>{alert.nodeName}</td>
      <td style={{ padding: '11px 16px', fontSize: 11, color: '#3a6050' }}>{alert.type}</td>
      <td style={{ padding: '11px 16px', textAlign: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, margin: '0 auto', boxShadow: `0 0 8px ${c}`, animation: isCrit ? 'critpulse 1s ease-in-out infinite' : undefined }} />
      </td>
      <td style={{ padding: '11px 16px', fontSize: 11, color: '#3a6050' }}>{alert.assignedTech}</td>
      <td style={{ padding: '11px 16px' }}>
        <span style={{ background: isNueva ? `${R}10` : `${G}08`, color: isNueva ? R : G, border: `1px solid ${isNueva ? R + '35' : G + '25'}`, borderRadius: 3, padding: '2px 8px', fontSize: 9, fontFamily: 'monospace' }}>
          {statusLabel}
        </span>
      </td>
      <td style={{ padding: '11px 16px' }}>
        <button
          onClick={() => onAttend(alert)}
          onMouseEnter={() => setBtnHov(true)}
          onMouseLeave={() => setBtnHov(false)}
          style={{ background: btnHov ? `${G}12` : 'transparent', border: `1px solid ${G}45`, color: G, borderRadius: 4, padding: '4px 11px', fontSize: 9, cursor: 'pointer', fontFamily: 'monospace', letterSpacing: 1.5 }}
        >
          ATENDER
        </button>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RedEnVivo() {
  const [nodes] = useState(MOCK_NODES);
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [filter, setFilter] = useState<'Todos' | 'Crítico' | 'Alto'>('Todos');
  const [view, setView] = useState<'Operador' | 'Gerencial'>('Operador');
  const [lastR, setLastR] = useState(new Date());
  const [bootStep, setBootStep] = useState(0);

  // Boot sequence
  useEffect(() => {
    if (bootStep < BOOT_LINES.length) {
      const t = setTimeout(() => setBootStep(s => s + 1), 600);
      return () => clearTimeout(t);
    }
  }, [bootStep]);

  // Auto refresh timestamp
  const refresh = useCallback(() => setLastR(new Date()), []);
  useEffect(() => {
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  const healthPct = Math.round(getNetworkHealthPercent(nodes));
  const hc = healthPct >= 95 ? G : healthPct >= 85 ? Y : R;

  const critCount = alerts.filter(a => a.severity === 'critico').length;
  const altCount  = alerts.filter(a => a.severity === 'alto').length;

  const shown = filter === 'Crítico' ? alerts.filter(a => a.severity === 'critico')
              : filter === 'Alto'    ? alerts.filter(a => a.severity === 'alto')
              : alerts;

  const handleAttend = (alert: ActiveAlert) =>
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: 'en_atencion' as const } : a));

  const isps = [...new Set(nodes.map(n => n.isp))];

  return (
    <div style={{ background: '#000905', minHeight: '100vh', color: '#d8f8e8', fontFamily: 'sans-serif', position: 'relative', overflowX: 'hidden' }}>
      <HoloBackground />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Top Bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 28px', background: 'rgba(0,8,4,0.92)', borderBottom: `1px solid ${G}18`, backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: G, boxShadow: `0 0 12px ${G}`, animation: 'nocpulse 2s ease-in-out infinite' }} />
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, letterSpacing: 2.5, color: '#d8f8e8', textTransform: 'uppercase' }}>Red en Vivo</span>
            </div>
            <NocClock />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ fontFamily: 'monospace' }}>
              <span style={{ fontSize: 9, color: `${G}45`, letterSpacing: 1.5, marginRight: 8 }}>RED OPERANDO</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: hc, textShadow: `0 0 14px ${hc}` }}>{healthPct}%</span>
            </div>
            {critCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${R}10`, border: `1px solid ${R}45`, borderRadius: 6, padding: '4px 12px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: R, boxShadow: `0 0 8px ${R}`, animation: 'critpulse 1s ease-in-out infinite' }} />
                <span style={{ color: R, fontWeight: 700, fontSize: 11, fontFamily: 'monospace', letterSpacing: 1 }}>{critCount} CRÍTICO{critCount > 1 ? 'S' : ''}</span>
              </div>
            )}
            <div style={{ display: 'flex', background: `${G}06`, border: `1px solid ${G}20`, borderRadius: 6, overflow: 'hidden' }}>
              {(['Operador', 'Gerencial'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{ padding: '5px 14px', fontSize: 9, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: 1.5, textTransform: 'uppercase', background: view === v ? `${G}18` : 'transparent', color: view === v ? G : `${G}35`, transition: 'all 0.2s' }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Boot sequence ── */}
        {bootStep < BOOT_LINES.length && (
          <div style={{ padding: '7px 28px', background: `${G}07`, borderBottom: `1px solid ${G}12` }}>
            {BOOT_LINES.slice(0, bootStep).map((line, i) => (
              <div key={i} style={{ fontFamily: 'monospace', fontSize: 9, color: `${G}55`, letterSpacing: 1.5 }}>&gt; {line}</div>
            ))}
          </div>
        )}

        <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>

          {/* ── Vista Gerencial ── */}
          {view === 'Gerencial' && (
            <div style={{ marginBottom: 28, background: 'rgba(0,8,4,0.75)', border: `1px solid ${G}18`, borderRadius: 10, padding: '20px 24px', backdropFilter: 'blur(12px)' }}>
              <SectionLabel>Salud por ISP</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 20 }}>
                {isps.map(isp => {
                  const cn = nodes.filter(n => n.isp === isp);
                  const avg = Math.round(cn.reduce((s, n) => s + n.uptime, 0) / cn.length * 10) / 10;
                  return (
                    <div key={isp}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 10, color: ispColor(isp), fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1 }}>{isp}</span>
                        <span style={{ fontSize: 9, color: `${G}25`, fontFamily: 'monospace' }}>{cn.length}n</span>
                      </div>
                      <HoloBar value={avg} color={ispColor(isp)} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Nodos ── */}
          <SectionLabel>Nodos de red</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(205px, 1fr))', gap: 10, marginBottom: 28 }}>
            {nodes.map(node => <NodeCard key={node.id} node={node} />)}
          </div>

          {/* ── Alertas ── */}
          <div style={{ background: 'rgba(0,8,4,0.82)', border: `1px solid ${G}18`, borderRadius: 10, overflow: 'hidden', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderBottom: `1px solid ${G}10` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <SectionLabel>Alertas activas</SectionLabel>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${R}18`, border: `1px solid ${R}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: R }}>{alerts.length}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {([['Todos', null], ['Crítico', critCount], ['Alto', altCount]] as [string, number | null][]).map(([l, n]) => (
                  <button
                    key={l}
                    onClick={() => setFilter(l as typeof filter)}
                    style={{
                      padding: '4px 11px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, borderRadius: 20,
                      border: '1px solid', fontFamily: 'monospace', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
                      borderColor: filter === l ? G : `${G}20`,
                      background: filter === l ? `${G}12` : 'transparent',
                      color: filter === l ? G : `${G}35`,
                    }}
                  >
                    {l}{n !== null ? ` (${n})` : ''}
                  </button>
                ))}
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${G}08` }}>
                  {['Nodo', 'Tipo', 'Sev.', 'Técnico', 'Estado', 'Acción'].map(h => (
                    <th key={h} style={{ padding: '9px 16px', fontSize: 8, fontWeight: 700, color: `${G}35`, letterSpacing: 2, textAlign: 'left', textTransform: 'uppercase', fontFamily: 'monospace' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map(a => (
                  <AlertRow key={a.id} alert={a} onAttend={handleAttend} />
                ))}
                {shown.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 28, textAlign: 'center', color: `${G}20`, fontSize: 10, fontFamily: 'monospace', letterSpacing: 2 }}>— SIN ALERTAS —</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Footer ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, padding: '0 2px' }}>
            <span style={{ fontSize: 8, color: `${G}20`, fontFamily: 'monospace', letterSpacing: 1.5 }}>
              {brand.nocLabel} v{brand.version} · REFRESH {lastR.toLocaleTimeString('es-MX')} · AUTO 30s
            </span>
            <div style={{ display: 'flex', gap: 14, fontSize: 8, fontFamily: 'monospace', letterSpacing: 1 }}>
              <span style={{ color: G }}>● OK</span>
              <span style={{ color: Y }}>● WARNING</span>
              <span style={{ color: R }}>● CRÍTICO</span>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes nocpulse {
          0%,100% { opacity:1; box-shadow:0 0 12px #00ff88 }
          50%      { opacity:.4; box-shadow:0 0 4px #00ff88 }
        }
        @keyframes critpulse {
          0%,100% { opacity:1 }
          50%      { opacity:.25 }
        }
        @keyframes scanline {
          0%   { top:-2px }
          100% { top:100vh }
        }
        button:focus { outline:none }
        ::-webkit-scrollbar { width:3px }
        ::-webkit-scrollbar-thumb { background:#00ff8825; border-radius:2px }
      `}</style>
    </div>
  );
}
