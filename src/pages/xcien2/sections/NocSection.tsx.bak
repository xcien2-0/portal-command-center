import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThemeConfig } from '../types';
import { MOCK_NODES, MOCK_ALERTS, getNetworkHealthPercent } from '@/data/mockNetworkData';

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
function latSt(ms: number) { return ms > 100 ? 'critical' : ms > 30 ? 'warning' : 'ok'; }
function uptSt(u: number)  { return u < 95   ? 'critical' : u  < 99  ? 'warning' : 'ok'; }

// ── Sub-components ────────────────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────────────────
interface Props { theme: ThemeConfig }

export default function NocSection({ theme }: Props) {
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString('es-MX'));

  useEffect(() => {
    const id = setInterval(() => setLastUpdated(new Date().toLocaleTimeString('es-MX')), 30_000);
    return () => clearInterval(id);
  }, []);

  const healthPct  = Math.round(getNetworkHealthPercent(MOCK_NODES));
  const hc         = healthPct >= 95 ? G : healthPct >= 85 ? Y : R;
  const critAlerts = MOCK_ALERTS.filter(a => a.severity === 'critico').length;
  const isps       = [...new Set(MOCK_NODES.map(n => n.isp))];

  return (
    <div style={{ position: 'relative', background: '#000905', borderRadius: theme.radius, overflow: 'hidden', padding: 24 }}>
      <HoloGrid />
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: G, boxShadow: `0 0 12px ${G}`, animation: theme.animations ? 'nocpulse 2s ease-in-out infinite' : 'none' }} />
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, letterSpacing: 2.5, color: '#d8f8e8', textTransform: 'uppercase' }}>Red en Vivo</span>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: `${G}45`, letterSpacing: 1 }}>· {lastUpdated}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: hc, textShadow: `0 0 14px ${hc}` }}>{healthPct}%</span>
            {critAlerts > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${R}10`, border: `1px solid ${R}45`, borderRadius: 6, padding: '4px 10px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: R, animation: theme.animations ? 'critpulse 1s ease-in-out infinite' : 'none' }} />
                <span style={{ color: R, fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}>{critAlerts} CRÍTICO{critAlerts > 1 ? 'S' : ''}</span>
              </div>
            )}
            <Link to="/red-en-vivo" style={{ fontSize: 11, color: G, textDecoration: 'none', border: `1px solid ${G}30`, borderRadius: 6, padding: '4px 10px', fontFamily: 'monospace', letterSpacing: 1 }}>
              PANTALLA COMPLETA →
            </Link>
          </div>
        </div>

        {/* ISP health bars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
          {isps.map(isp => {
            const nodes = MOCK_NODES.filter(n => n.isp === isp);
            const avg = Math.round(nodes.reduce((s, n) => s + n.uptime, 0) / nodes.length * 10) / 10;
            const color = ISP_COLORS[isp] ?? '#888';
            return (
              <div key={isp} style={{ background: 'rgba(0,8,4,0.7)', border: `1px solid ${color}25`, borderRadius: 8, padding: '12px 14px', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'monospace', letterSpacing: 1 }}>{isp}</span>
                  <span style={{ fontSize: 10, color: `${G}30`, fontFamily: 'monospace' }}>{nodes.length}n</span>
                </div>
                <div style={{ height: 3, background: 'rgba(0,255,136,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${avg}%`, height: '100%', background: `linear-gradient(90deg,${color}60,${color})`, boxShadow: `0 0 6px ${color}`, transition: 'width 1s ease' }} />
                </div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color, marginTop: 4, display: 'block', textShadow: `0 0 8px ${color}` }}>{avg}%</span>
              </div>
            );
          })}
        </div>

        {/* Node cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 8 }}>
          {MOCK_NODES.map(node => {
            const c   = sc(node.status);
            const lc  = sc(latSt(node.latency));
            const uc  = sc(uptSt(node.uptime));
            const isc = ISP_COLORS[node.isp] ?? '#888';
            return (
              <div
                key={node.id}
                style={{
                  position: 'relative', borderRadius: 7, overflow: 'hidden',
                  background: 'rgba(0,8,4,0.85)', border: `1px solid ${c}30`,
                  backdropFilter: 'blur(10px)', padding: '12px 13px',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${c},transparent)`, boxShadow: `0 0 8px ${c}` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, color: '#d8f8e8', letterSpacing: 1 }}>{node.shortName}</span>
                  <span style={{ background: `${isc}12`, color: isc, border: `1px solid ${isc}30`, borderRadius: 3, padding: '1px 5px', fontSize: 8, fontWeight: 700 }}>{node.isp}</span>
                </div>
                <div style={{ fontSize: 9, color: '#2a5040', marginBottom: 10, fontFamily: 'monospace' }}>{node.location}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div>
                    <span style={{ color: lc, fontFamily: 'monospace', fontWeight: 700, fontSize: 14, textShadow: `0 0 8px ${lc}` }}>{node.latency}</span>
                    <span style={{ color: '#1e4030', fontSize: 9 }}>ms</span>
                  </div>
                  <div style={{ width: 1, background: '#0a2018' }} />
                  <div>
                    <span style={{ color: uc, fontFamily: 'monospace', fontWeight: 700, fontSize: 14, textShadow: `0 0 8px ${uc}` }}>{node.uptime}</span>
                    <span style={{ color: '#1e4030', fontSize: 9 }}>%</span>
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: 9, right: 9, width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}`, animation: node.status === 'critical' && theme.animations ? 'critpulse 1s ease-in-out infinite' : 'none' }} />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
          {([['● OK', G], ['● WARN', Y], ['● CRIT', R]] as [string, string][]).map(([l, c]) => (
            <span key={l} style={{ fontSize: 9, color: c, fontFamily: 'monospace', letterSpacing: 1 }}>{l}</span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes nocpulse  { 0%,100%{opacity:1;box-shadow:0 0 12px #00ff88}50%{opacity:.4;box-shadow:0 0 4px #00ff88} }
        @keyframes critpulse { 0%,100%{opacity:1}50%{opacity:.25} }
      `}</style>
    </div>
  );
}
