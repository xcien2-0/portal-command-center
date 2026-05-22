import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ThemeConfig } from '../types';
import { NOCCity, NOCAlert, NOCHost } from '@/types/noc';
import { CASA_TENANTS } from '@/types/tenant';
import { Activity, Terminal, Network, AlertTriangle, CheckCircle, Server, Wifi, WifiOff, Map, LayoutGrid, Route, X, ChevronDown, ChevronRight, Loader, Eye, Box } from 'lucide-react';
import HexoField3D, { NetworkNode } from '../../../components/HexoField3D';
import { API_BASE } from '../../../config';
import RealMap from '@/components/noc/RealMap';
import 'leaflet/dist/leaflet.css';

// ── Palette ───────────────────────────────────────────────────────────────────
const G   = '#00ff88';   // verde    — healthy  ≥ 85
const Y   = '#ffcc00';   // amarillo — degraded 65–84
const O   = '#ff8800';   // naranja  — alerta   45–64
const R   = '#ff3366';   // rojo     — crítico   < 45
const DIM = 'rgba(255,255,255,0.35)';

function nodeColor(score: number) {
  if (score >= 85) return G;
  if (score >= 65) return Y;
  if (score >= 45) return O;
  return R;
}

// ── MTR Modal ────────────────────────────────────────────────────────────────
interface MtrHop {
  hop: number; ip: string; sent: number; loss: number;
  last: number | null; avg: number | null; best: number | null; worst: number | null;
}

function MtrModal({ host, onClose }: { host: NOCHost; onClose: () => void }) {
  const [hops, setHops] = useState<MtrHop[]>([]);
  const [status, setStatus] = useState<'connecting' | 'running' | 'done' | 'error'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/noc/mtr?ip=${encodeURIComponent(host.ip)}&cycles=15`);
    esRef.current = es;
    setStatus('running');

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.hops) setHops(data.hops);
        if (data.done) { setStatus('done'); es.close(); }
        if (data.error) { setError(data.error); setStatus('error'); es.close(); }
      } catch {}
    };
    es.onerror = () => { setStatus('error'); setError('Conexión perdida'); es.close(); };
    return () => es.close();
  }, [host.ip]);

  const lossColor = (loss: number) => loss >= 50 ? R : loss > 0 ? Y : G;
  const latColor  = (ms: number | null) => {
    if (ms === null) return DIM;
    return ms > 100 ? R : ms > 30 ? Y : G;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: 760, maxHeight: '80vh',
        background: 'rgba(0,10,5,0.97)', border: `1px solid ${G}30`,
        borderRadius: 20, display: 'flex', flexDirection: 'column',
        boxShadow: `0 0 80px ${G}10`,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: `1px solid ${G}15`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: `${G}05`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Route size={18} color={G} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
                MTR — {host.ip}
              </div>
              <div style={{ fontSize: 10, color: DIM, marginTop: 1 }}>{host.name || host.ip}</div>
            </div>
            {status === 'running' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                <Loader size={12} color={G} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 9, color: G, fontFamily: 'monospace' }}>TRAZANDO...</span>
              </div>
            )}
            {status === 'done' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                <CheckCircle size={12} color={G} />
                <span style={{ fontSize: 9, color: G, fontFamily: 'monospace' }}>COMPLETADO · {hops.length} hops</span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff',
            width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={14} /></button>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 180px 55px 60px 70px 70px 70px 70px',
          padding: '8px 24px', borderBottom: `1px solid rgba(255,255,255,0.05)`,
          background: 'rgba(255,255,255,0.02)',
        }}>
          {['HOP','HOST / IP','SENT','LOSS%','LAST','AVG','BEST','WORST'].map(h => (
            <div key={h} style={{ fontSize: 8, fontWeight: 800, color: DIM, fontFamily: 'monospace', letterSpacing: 1 }}>{h}</div>
          ))}
        </div>

        {/* Hops */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {hops.length === 0 && status === 'running' && (
            <div style={{ padding: 40, textAlign: 'center', color: DIM, fontSize: 12, fontFamily: 'monospace' }}>
              Descubriendo ruta...
            </div>
          )}
          {error && (
            <div style={{ padding: 24, color: R, fontSize: 12, fontFamily: 'monospace' }}>
              Error: {error}
            </div>
          )}
          {hops.map((hop, i) => {
            const isLast = i === hops.length - 1;
            const lc = lossColor(hop.loss);
            return (
              <div key={hop.hop} style={{
                display: 'grid',
                gridTemplateColumns: '40px 180px 55px 60px 70px 70px 70px 70px',
                padding: '10px 24px',
                borderBottom: `1px solid rgba(255,255,255,0.03)`,
                background: isLast ? `${G}06` : 'transparent',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = isLast ? `${G}06` : 'transparent')}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: DIM, fontFamily: 'monospace' }}>{hop.hop}</div>
                <div style={{ fontSize: 11, fontWeight: isLast ? 800 : 500, color: isLast ? G : '#fff', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hop.ip === '*' ? <span style={{ color: DIM }}>* * *</span> : hop.ip}
                </div>
                <div style={{ fontSize: 11, color: DIM, fontFamily: 'monospace' }}>{hop.sent}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: lc, fontFamily: 'monospace' }}>
                  {hop.ip === '*' ? '100%' : `${hop.loss}%`}
                </div>
                {(['last','avg','best','worst'] as const).map(k => (
                  <div key={k} style={{ fontSize: 11, fontWeight: k === 'avg' ? 700 : 400, color: latColor(hop[k]), fontFamily: 'monospace' }}>
                    {hop[k] !== null ? `${hop[k]}ms` : <span style={{ color: DIM }}>—</span>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer legend */}
        <div style={{
          padding: '10px 24px', borderTop: `1px solid rgba(255,255,255,0.05)`,
          display: 'flex', gap: 20, background: 'rgba(0,0,0,0.3)',
        }}>
          {[{ c: G, label: 'OK (<30ms / sin pérdida)' }, { c: Y, label: 'Degradado (30-100ms / pérdida parcial)' }, { c: R, label: 'Crítico (>100ms / alta pérdida)' }].map(({ c, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
              <span style={{ fontSize: 9, color: DIM }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = G, icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon: React.ReactNode;
}) {
  return (
    <div style={{
      flex: 1, minWidth: 140,
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${color}25`,
      borderRadius: 14, padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: `0 0 20px ${color}08`,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}15`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 9, color: DIM, fontWeight: 700, letterSpacing: 1.5, fontFamily: 'monospace', marginBottom: 2 }}>
          {label.toUpperCase()}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1, fontFamily: 'Oswald' }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Map ───────────────────────────────────────────────────────────────────────
function HoloMap({ cities, onSelectCity, selectedCityId }: {
  cities: NOCCity[];
  onSelectCity: (city: NOCCity) => void;
  selectedCityId: string | null;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const coreNode = useMemo(() =>
    cities.find(c => c.name === 'Monterrey') || cities[0], [cities]);

  const { toSVG, nodes } = useMemo(() => {
    if (cities.length === 0) return {
      toSVG: () => ({ x: 500, y: 250 }),
      nodes: [],
    };
    const lats = cities.map(c => c.lat);
    const lngs = cities.map(c => c.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const padX = 90, padY = 60;
    const W = 1000 - padX * 2, H = 480 - padY * 2;
    const lngRange = maxLng - minLng || 1;
    const latRange = maxLat - minLat || 1;
    const scale = Math.min(W / lngRange, H / latRange);
    const offX = padX + (W - lngRange * scale) / 2;
    const offY = padY + (H - latRange * scale) / 2;
    const fn = (lat: number, lng: number) => ({
      x: offX + (lng - minLng) * scale,
      y: offY + (maxLat - lat) * scale,
    });
    // Pre-compute node sizes (proportional to host count)
    const maxHosts = Math.max(...cities.map(c => c.totalHosts), 1);
    const ns = cities.map(c => ({
      ...fn(c.lat, c.lng),
      r: 5 + (c.totalHosts / maxHosts) * 10,
      city: c,
    }));
    return { toSVG: fn, nodes: ns };
  }, [cities]);

  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= 10; i++) {
      lines.push(
        <line key={`h${i}`} x1="0" y1={i * 48} x2="1000" y2={i * 48} stroke={`${G}08`} strokeWidth="1" />,
        <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="480" stroke={`${G}08`} strokeWidth="1" />,
      );
    }
    return lines;
  }, []);

  return (
    <div style={{
      position: 'relative', width: '100%', height: 480,
      background: 'rgba(0,8,4,0.7)',
      border: `1px solid ${G}20`, borderRadius: 18, overflow: 'hidden',
      boxShadow: `inset 0 0 60px ${G}06`,
    }}>
      {/* Scanline */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${G}03 3px, ${G}03 4px)`,
      }} />

      {/* HUD corners */}
      {[
        { style: { top: 16, left: 16 }, label: 'XCIEN NOC', value: `${cities.length} NODOS` },
        { style: { top: 16, right: 16 }, label: 'SYNC', value: 'REAL-TIME' },
      ].map(({ style, label, value }) => (
        <div key={label} style={{
          position: 'absolute', ...style, zIndex: 3,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
          padding: '5px 12px', borderRadius: 8, borderLeft: `2px solid ${G}60`,
        }}>
          <div style={{ fontSize: 8, color: `${G}60`, fontFamily: 'monospace', letterSpacing: 1.5 }}>{label}</div>
          <div style={{ fontSize: 12, color: G, fontWeight: 800, fontFamily: 'monospace' }}>{value}</div>
        </div>
      ))}

      <svg width="100%" height="100%" viewBox="0 0 1000 480" style={{ position: 'relative', zIndex: 2 }}>
        <defs>
          <filter id="noc-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="noc-glow-strong">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Grid */}
        {gridLines}

        {/* Connection arcs from core node */}
        {coreNode && nodes.map(({ x: x2, y: y2, city }) => {
          if (city.id === coreNode.id) return null;
          const { x: x1, y: y1 } = toSVG(coreNode.lat, coreNode.lng);
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.15;
          const c = nodeColor(city.score);
          const isHov = hoveredId === city.id;
          return (
            <g key={`arc-${city.id}`}>
              <path
                d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
                fill="none" stroke={c}
                strokeWidth={isHov ? 1.5 : 0.8}
                strokeDasharray="6,8"
                opacity={isHov ? 0.5 : 0.15}
              >
                <animate attributeName="stroke-dashoffset" from="200" to="0" dur="4s" repeatCount="indefinite" />
              </path>
              {isHov && (
                <circle r="3" fill={c} opacity="0.8">
                  <animateMotion dur="2s" repeatCount="indefinite"
                    path={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} />
                </circle>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(({ x, y, r, city }) => {
          const isSelected = selectedCityId === city.id;
          const isHov = hoveredId === city.id;
          const c = nodeColor(city.score);
          const active = isSelected || isHov;

          // Smart label offset: push label away from edges
          const labelRight = x < 850;
          const labelBelow = y < 60;
          const lx = labelRight ? x + r + 6 : x - r - 6;
          const ly = labelBelow ? y + r + 14 : y - r - 6;
          const anchor = labelRight ? 'start' : 'end';

          return (
            <g key={`node-${city.id}`}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectCity(city)}
              onMouseEnter={() => setHoveredId(city.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Pulse ring */}
              {active && (
                <circle cx={x} cy={y} r={r + 6} fill="none" stroke={c} strokeWidth="1.5" opacity="0.4">
                  <animate attributeName="r" from={r} to={r + 18} dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Offline indicator ring */}
              {city.offline > 0 && (
                <circle cx={x} cy={y} r={r + 3} fill="none" stroke={R}
                  strokeWidth="1" strokeDasharray="3,4" opacity="0.5" />
              )}

              {/* Main node */}
              <circle cx={x} cy={y} r={r}
                fill={active ? `${c}25` : `${c}10`}
                stroke={c}
                strokeWidth={active ? 2.5 : 1.5}
                filter={active ? 'url(#noc-glow-strong)' : 'url(#noc-glow)'}
              />

              {/* Core dot */}
              <circle cx={x} cy={y} r={r * 0.35} fill={c} opacity={active ? 1 : 0.7} />

              {/* Label */}
              <text x={lx} y={ly} textAnchor={anchor}
                fill={active ? '#fff' : c}
                style={{
                  fontSize: active ? 12 : 10,
                  fontWeight: active ? 800 : 600,
                  fontFamily: 'monospace',
                  opacity: active ? 1 : 0.75,
                  textShadow: `0 0 8px ${c}`,
                }}
              >
                {city.name}
              </text>

              {/* Score badge on hover */}
              {active && (
                <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                  fill={c} style={{ fontSize: 8, fontWeight: 900, fontFamily: 'monospace' }}>
                  {Math.round(city.score)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16, zIndex: 3,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        borderRadius: 10, padding: '8px 14px',
        display: 'flex', gap: 14, border: `1px solid rgba(255,255,255,0.06)`,
      }}>
        {[
          { c: G, label: '≥95%' },
          { c: Y, label: '80–94%' },
          { c: R, label: '<80%' },
        ].map(({ c, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }} />
            <span style={{ fontSize: 9, color: DIM, fontFamily: 'monospace' }}>{label}</span>
          </div>
        ))}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', border: `1px dashed ${R}`, opacity: 0.6 }} />
          <span style={{ fontSize: 9, color: DIM, fontFamily: 'monospace' }}>Hosts caídos</span>
        </div>
      </div>
    </div>
  );
}

// ── Alert stream ──────────────────────────────────────────────────────────────
function AlertStream({ alerts }: { alerts: NOCAlert[] }) {
  const sevConfig: Record<string, { color: string; bg: string; label: string }> = {
    critical: { color: R,       bg: `${R}15`,       label: 'CRIT' },
    warning:  { color: Y,       bg: `${Y}15`,       label: 'WARN' },
    info:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', label: 'INFO' },
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'rgba(0,6,3,0.8)', border: `1px solid ${G}15`,
      borderRadius: 16, overflow: 'hidden', height: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 18px', borderBottom: `1px solid ${G}10`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: `${G}04`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Terminal size={13} color={G} />
          <span style={{ fontSize: 10, fontWeight: 800, color: G, fontFamily: 'monospace', letterSpacing: 1.5 }}>
            STREAM DE ALERTAS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: G }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: G, animation: 'nocpulse 1.5s infinite' }} />
          </div>
          <span style={{ fontSize: 9, color: G, fontFamily: 'monospace', opacity: 0.7 }}>
            {alerts.length} activas
          </span>
        </div>
      </div>

      {/* Alerts list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {alerts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, opacity: 0.4 }}>
            <CheckCircle size={28} color={G} />
            <span style={{ fontSize: 11, color: G, fontFamily: 'monospace' }}>SIN AMENAZAS ACTIVAS</span>
          </div>
        ) : (
          alerts.map((a, i) => {
            const s = sevConfig[a.severity] || sevConfig.info;
            const time = a.timestamp?.split('T')[1]?.slice(0, 5) || '--:--';
            return (
              <div key={i} style={{
                padding: '9px 18px', borderBottom: `1px solid rgba(255,255,255,0.03)`,
                display: 'flex', gap: 10, alignItems: 'flex-start',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Severity badge */}
                <div style={{
                  flexShrink: 0, marginTop: 1,
                  background: s.bg, color: s.color,
                  fontSize: 8, fontWeight: 900, fontFamily: 'monospace',
                  padding: '2px 6px', borderRadius: 4,
                  border: `1px solid ${s.color}30`,
                }}>
                  {s.label}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.cityName}
                    </span>
                    <span style={{ fontSize: 9, color: DIM, fontFamily: 'monospace', flexShrink: 0, marginLeft: 8 }}>
                      {time}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: DIM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.type}
                  </div>
                  {a.siteName && (
                    <div style={{ fontSize: 9, color: `${G}50`, marginTop: 1, fontFamily: 'monospace' }}>
                      {a.siteName}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Grid card ─────────────────────────────────────────────────────────────────
function CityCard({ city, onClick }: { city: NOCCity; onClick: () => void }) {
  const c = nodeColor(city.score);
  const upPct = city.totalHosts > 0 ? Math.round((city.online / city.totalHosts) * 100) : 0;
  return (
    <div onClick={onClick} style={{
      background: 'rgba(0,12,7,0.7)', border: `1px solid ${c}25`,
      borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
      transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = `${c}08`; (e.currentTarget as HTMLDivElement).style.borderColor = `${c}50`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,12,7,0.7)'; (e.currentTarget as HTMLDivElement).style.borderColor = `${c}25`; }}
    >
      {/* Color strip */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: c, borderRadius: '14px 0 0 14px' }} />

      <div style={{ paddingLeft: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{city.name}</div>
            <div style={{ fontSize: 9, color: DIM, fontFamily: 'monospace', marginTop: 2, whiteSpace: 'nowrap' }}>
              {city.sites?.length || 0} sitios · {city.totalHosts} hosts
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, width: 52 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: c, lineHeight: 1, fontFamily: 'Oswald' }}>
              {Math.round(city.score)}
            </div>
            <div style={{ fontSize: 8, color: DIM, fontFamily: 'monospace' }}>SCORE</div>
          </div>
        </div>

        {/* Hosts row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Wifi size={11} color={G} />
            <span style={{ fontSize: 11, fontWeight: 700, color: G }}>{city.online}</span>
            <span style={{ fontSize: 9, color: DIM }}>online</span>
          </div>
          {city.offline > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <WifiOff size={11} color={R} />
              <span style={{ fontSize: 11, fontWeight: 700, color: R }}>{city.offline}</span>
              <span style={{ fontSize: 9, color: DIM }}>caídos</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${upPct}%`,
            background: c, borderRadius: 4,
            boxShadow: `0 0 8px ${c}60`,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ fontSize: 8, color: DIM, marginTop: 4, fontFamily: 'monospace', textAlign: 'right' }}>
          {upPct}% uptime
        </div>
      </div>
    </div>
  );
}

// ── Site Inspector ────────────────────────────────────────────────────────────
function SiteInspector({ city, onClose }: { city: NOCCity; onClose: () => void }) {
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());
  const [mtrHost, setMtrHost] = useState<NOCHost | null>(null);
  const c = nodeColor(city.score);
  const upPct = city.totalHosts > 0 ? Math.round((city.online / city.totalHosts) * 100) : 0;

  const toggleSite = (id: string) =>
    setExpandedSites(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  return (
    <div style={{
      width: 320, flexShrink: 0,
      background: 'rgba(0,12,7,0.92)', backdropFilter: 'blur(20px)',
      borderLeft: `1px solid ${c}25`, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${c}15` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'Oswald', letterSpacing: 1 }}>
              {city.name.toUpperCase()}
            </h3>
            <span style={{ fontSize: 9, color: `${c}70`, fontFamily: 'monospace' }}>{city.id}</span>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none',
            color: '#fff', cursor: 'pointer', width: 28, height: 28,
            borderRadius: 8, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Score + bar */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 9, color: DIM, fontFamily: 'monospace' }}>HEALTH SCORE</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: c, fontFamily: 'Oswald', lineHeight: 1 }}>
              {Math.round(city.score)}
            </span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${city.score}%`, background: c, boxShadow: `0 0 8px ${c}`, borderRadius: 4 }} />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'TOTAL', value: city.totalHosts, color: '#fff' },
            { label: 'ONLINE', value: city.online, color: G },
            { label: 'CAÍDOS', value: city.offline, color: city.offline > 0 ? R : DIM },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.03)', padding: '10px 8px', borderRadius: 10, textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: 18, fontWeight: 900, color, fontFamily: 'Oswald' }}>{value}</div>
              <div style={{ fontSize: 8, color: DIM, fontFamily: 'monospace', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Uptime bar */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 9, color: DIM, fontFamily: 'monospace' }}>UPTIME</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: c, fontFamily: 'monospace' }}>{upPct}%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${upPct}%`, background: c, boxShadow: `0 0 8px ${c}60`, borderRadius: 4 }} />
          </div>
        </div>

        {/* Sites + Hosts */}
        <div>
          <div style={{ fontSize: 9, color: `${c}60`, fontFamily: 'monospace', fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
            SITIOS ({city.sites?.length || 0})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {city.sites?.map(site => {
              const sc2 = site.hostsOffline > 0 ? (site.hostsOffline > site.hostsOnline ? R : Y) : G;
              const isExpanded = expandedSites.has(site.id);
              return (
                <div key={site.id}>
                  {/* Site header — clickable to expand */}
                  <div
                    onClick={() => toggleSite(site.id)}
                    style={{
                      background: 'rgba(255,255,255,0.03)', padding: '9px 12px', borderRadius: isExpanded ? '8px 8px 0 0' : 8,
                      border: `1px solid ${sc2}20`, cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isExpanded ? <ChevronDown size={11} color={DIM} /> : <ChevronRight size={11} color={DIM} />}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{site.name}</div>
                        <div style={{ fontSize: 9, color: DIM, marginTop: 1 }}>{site.hostsOnline + site.hostsOffline} hosts</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: G }}>{site.hostsOnline}↑</span>
                      {site.hostsOffline > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: R }}>{site.hostsOffline}↓</span>}
                    </div>
                  </div>

                  {/* Host list */}
                  {isExpanded && (
                    <div style={{
                      background: 'rgba(0,0,0,0.3)', border: `1px solid ${sc2}15`,
                      borderTop: 'none', borderRadius: '0 0 8px 8px',
                      overflow: 'hidden',
                    }}>
                      {site.hosts?.map((host, hi) => {
                        const hc2 = host.status === 'offline' ? R : host.status === 'degraded' ? Y : G;
                        const displayName = host.name && host.name !== '→' ? host.name : host.ip;
                        return (
                          <div key={host.id || hi} style={{
                            padding: '7px 12px',
                            borderBottom: hi < (site.hosts?.length || 0) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            display: 'flex', alignItems: 'center', gap: 8,
                          }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: hc2, flexShrink: 0, boxShadow: `0 0 4px ${hc2}` }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 10, color: '#fff', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {displayName}
                              </div>
                              <div style={{ fontSize: 9, color: DIM }}>{host.ip}</div>
                            </div>
                            <button
                              onClick={() => setMtrHost(host)}
                              style={{
                                flexShrink: 0, padding: '3px 8px',
                                background: `${G}12`, color: G,
                                border: `1px solid ${G}30`, borderRadius: 6,
                                fontSize: 9, fontWeight: 800, cursor: 'pointer',
                                fontFamily: 'monospace', letterSpacing: 0.5,
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <Route size={9} />MTR
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* MTR modal */}
        {mtrHost && <MtrModal host={mtrHost} onClose={() => setMtrHost(null)} />}
      </div>

      {/* Actions */}
      <div style={{ padding: '14px 20px', borderTop: `1px solid ${c}15`, display: 'flex', gap: 8 }}>
        <button style={{
          flex: 1, padding: '10px', background: `${c}12`, color: c,
          border: `1px solid ${c}35`, borderRadius: 10, fontSize: 11,
          fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace', letterSpacing: 0.5,
        }}>
          PING TEST
        </button>
        <button style={{
          flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 11,
          fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace',
        }}>
          BIDRILLA
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props {
  theme: ThemeConfig;
  activeThemeId?: string;
  cities?: NOCCity[];
  alerts?: NOCAlert[];
  activeTenantId?: string | null;
  onTenantChange?: (id: string | null) => void;
}

// ── Reporte Semanal ───────────────────────────────────────────────────────────
function ReporteSemanal({ cities, alerts }: { cities: NOCCity[]; alerts: NOCAlert[] }) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const [ciudad, setCiudad]           = useState('todas');
  const [fechaInicio, setFechaInicio] = useState(fmt(monday));
  const [fechaFin, setFechaFin]       = useState(fmt(today));
  const [loading, setLoading]         = useState(false);
  const [pdfError, setPdfError]       = useState('');
  const [wfmStats, setWfmStats]       = useState<{total:number;backlog:number;listo:number;proceso:number}>({total:0,backlog:0,listo:0,proceso:0});

  useEffect(() => {
    fetch(`${API_BASE}/api/wfm/ordenes`).then(r => r.json()).then(d => {
      if (!Array.isArray(d)) return;
      setWfmStats({
        total:   d.length,
        backlog: d.filter((o:any) => o.estado === 'BACKLOG').length,
        listo:   d.filter((o:any) => o.estado === 'LISTO_INSTALACION').length,
        proceso: d.filter((o:any) => !['BACKLOG','LISTO_INSTALACION'].includes(o.estado)).length,
      });
    }).catch(() => {});
  }, []);

  const cityNames = ['todas', ...Array.from(new Set(cities.map(c => c.name))).sort()];

  const filteredCities = ciudad === 'todas' ? cities : cities.filter(c => c.name === ciudad);
  const filteredAlerts = ciudad === 'todas' ? alerts : alerts.filter(a => a.cityName === ciudad);

  const totalHosts   = filteredCities.reduce((s, c) => s + c.totalHosts, 0);
  const totalOnline  = filteredCities.reduce((s, c) => s + c.online, 0);
  const totalOffline = filteredCities.reduce((s, c) => s + c.offline, 0);
  const critical     = filteredAlerts.filter(a => a.severity === 'critical').length;
  const warnings     = filteredAlerts.filter(a => a.severity === 'warning').length;
  const avgScore     = filteredCities.length
    ? Math.round(filteredCities.reduce((s, c) => s + c.score, 0) / filteredCities.length)
    : 0;

  const offlineCities = filteredCities.filter(c => c.offline > 0)
    .sort((a, b) => b.offline - a.offline).slice(0, 8);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ciudad, fecha_inicio: fechaInicio, fecha_fin: fechaFin });
      const res = await fetch(`${API_BASE}/api/reportes/semanal?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `Reporte_NOC_${ciudad}_${fechaInicio}_${fechaFin}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setPdfError('Error generando PDF — intenta de nuevo');
      setTimeout(() => setPdfError(''), 4000);
    } finally { setLoading(false); }
  };

  const kpiStyle = (color: string): React.CSSProperties => ({
    flex: 1, background: '#1A2733', border: `1px solid ${color}25`,
    borderRadius: 12, padding: '14px 16px', display: 'flex',
    flexDirection: 'column', gap: 3, borderTop: `2px solid ${color}`,
  });

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Controles */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, color: DIM }}>Ciudad</span>
          <select value={ciudad} onChange={e => setCiudad(e.target.value)} style={{
            background: '#1A2733', border: '1px solid rgba(0,255,136,0.2)', color: '#fff',
            borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer', outline: 'none',
          }}>
            {cityNames.map(c => <option key={c} value={c}>{c === 'todas' ? '🌐 Todas las ciudades' : c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, color: DIM }}>Desde</span>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={{
            background: '#1A2733', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
            borderRadius: 8, padding: '8px 12px', fontSize: 12, outline: 'none',
          }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, color: DIM }}>Hasta</span>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={{
            background: '#1A2733', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
            borderRadius: 8, padding: '8px 12px', fontSize: 12, outline: 'none',
          }} />
        </div>
        <button onClick={handleDownload} disabled={loading} style={{
          background: loading ? 'rgba(0,255,136,0.2)' : G, color: '#000',
          border: 'none', borderRadius: 8, padding: '8px 24px',
          fontSize: 13, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto',
          opacity: loading ? 0.7 : 1, transition: 'all 0.15s',
        }}>
          {loading
            ? <><div style={{ width: 14, height: 14, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Generando...</>
            : <>📄 Descargar PDF</>}
        </button>
      </div>
      {pdfError && (
        <div style={{ background: 'rgba(214,40,40,0.12)', border: '1px solid rgba(214,40,40,0.4)',
          borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#FF6B6B' }}>
          ⚠️ {pdfError}
        </div>
      )}

      {/* Preview NOC */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: G, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>
          Red — {ciudad === 'todas' ? 'Global' : ciudad}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Hosts Totales',   value: totalHosts,   color: '#60A5FA' },
            { label: 'Online',          value: totalOnline,  color: G },
            { label: 'Offline',         value: totalOffline, color: R },
            { label: 'Alertas Críticas',value: critical,     color: R },
            { label: 'Warnings',        value: warnings,     color: Y },
            { label: 'Score Promedio',  value: `${avgScore}%`, color: Y },
          ].map(({ label, value, color }) => (
            <div key={label} style={kpiStyle(color)}>
              <span style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1, fontFamily: 'monospace' }}>{value}</span>
              <span style={{ fontSize: 9, color: DIM, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sitios con fallas */}
      {offlineCities.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: R, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>
            Sitios con hosts caídos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {offlineCities.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#1A2733', borderRadius: 10, border: '1px solid rgba(255,51,102,0.15)' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{c.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: 11, color: R, fontWeight: 700 }}>{c.offline} offline</span>
                  <span style={{ fontSize: 11, color: G }}>{c.online} online</span>
                  <span style={{ fontSize: 11, color: Y }}>{c.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview WFM */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#60A5FA', letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>
          WFM — Órdenes de Servicio
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Total Órdenes', value: wfmStats.total,   color: '#60A5FA' },
            { label: 'Listas',        value: wfmStats.listo,   color: G },
            { label: 'Backlog',       value: wfmStats.backlog, color: R },
            { label: 'En Proceso',    value: wfmStats.proceso, color: Y },
          ].map(({ label, value, color }) => (
            <div key={label} style={kpiStyle(color)}>
              <span style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1, fontFamily: 'monospace' }}>{value}</span>
              <span style={{ fontSize: 9, color: DIM, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function NocSection({
  theme,
  cities = [],
  alerts = [],
  activeTenantId = null,
  onTenantChange,
}: Props) {
  const [selectedCity, setSelectedCity] = useState<NOCCity | null>(null);
  const [view, setView] = useState<'map' | 'grid' | 'reportes' | '3d'>('map');
  const [selected3dNode, setSelected3dNode] = useState<NetworkNode | null>(null);

  // ── Observium ──────────────────────────────────────────────────────────────
  const [obsOpen,    setObsOpen]    = useState(false);
  const [obsSummary, setObsSummary] = useState<{total:number;up:number;down:number;availability:number}|null>(null);
  const [obsAlerts,  setObsAlerts]  = useState<any[]>([]);
  const [obsDown,    setObsDown]    = useState<any[]>([]);
  const [obsLoading, setObsLoading] = useState(false);

  const fetchObs = useCallback(async () => {
    setObsLoading(true);
    try {
      const [s, a, d] = await Promise.all([
        fetch(`${API_BASE}/api/observium/summary`).then(r => r.json()),
        fetch(`${API_BASE}/api/observium/alerts?limit=50`).then(r => r.json()),
        fetch(`${API_BASE}/api/observium/devices/down?limit=100`).then(r => r.json()),
      ]);
      setObsSummary(s);
      setObsAlerts(Array.isArray(a) ? a : []);
      setObsDown(Array.isArray(d) ? d : []);
    } catch(e) { console.error('obs:', e); }
    finally { setObsLoading(false); }
  }, []);

  useEffect(() => { if (obsOpen) fetchObs(); }, [obsOpen]);
  useEffect(() => {
    if (!obsOpen) return;
    const t = setInterval(fetchObs, 60_000);
    return () => clearInterval(t);
  }, [obsOpen]);

  const totalHosts  = useMemo(() => cities.reduce((a, c) => a + c.totalHosts, 0), [cities]);
  const totalOnline = useMemo(() => cities.reduce((a, c) => a + c.online, 0), [cities]);
  const totalOffline = useMemo(() => cities.reduce((a, c) => a + c.offline, 0), [cities]);
  const healthPct   = useMemo(() => cities.length === 0 ? 100 : Math.round(cities.reduce((a, c) => a + c.score, 0) / cities.length), [cities]);
  const critCount   = useMemo(() => alerts.filter(a => a.severity === 'critical').length, [alerts]);
  const warnCount   = useMemo(() => alerts.filter(a => a.severity === 'warning').length, [alerts]);
  const hc = healthPct >= 95 ? G : healthPct >= 85 ? Y : R;

  const handleSelectCity = useCallback((city: NOCCity) => {
    setSelectedCity(prev => prev?.id === city.id ? null : city);
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 16,
      height: 'calc(100vh - 140px)',
    }}>
      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
        <KpiCard label="Health Global" value={`${healthPct}%`}
          sub={`${cities.length} ciudades`} color={hc}
          icon={<Activity size={18} color={hc} />} />
        <KpiCard label="Hosts Online" value={totalOnline}
          sub={`de ${totalHosts} total`} color={G}
          icon={<Server size={18} color={G} />} />
        <KpiCard label="Hosts Caídos" value={totalOffline}
          color={totalOffline > 0 ? R : G}
          icon={<WifiOff size={18} color={totalOffline > 0 ? R : G} />} />
        <KpiCard label="Alertas Críticas" value={critCount}
          sub={`${warnCount} warnings`} color={critCount > 0 ? R : G}
          icon={<AlertTriangle size={18} color={critCount > 0 ? R : G} />} />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        {/* Tenant filters */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onTenantChange?.(null)} style={{
            padding: '6px 14px', fontSize: 10, fontWeight: 700, borderRadius: 8, cursor: 'pointer',
            background: activeTenantId === null ? `${G}20` : 'rgba(255,255,255,0.04)',
            color: activeTenantId === null ? G : DIM,
            border: `1px solid ${activeTenantId === null ? `${G}40` : 'transparent'}`,
            fontFamily: 'monospace', transition: 'all 0.15s',
          }}>GLOBAL</button>
          {CASA_TENANTS.map(t => (
            <button key={t.id} onClick={() => onTenantChange?.(t.id)} style={{
              padding: '6px 14px', fontSize: 10, fontWeight: 700, borderRadius: 8, cursor: 'pointer',
              background: activeTenantId === t.id ? `${G}20` : 'rgba(255,255,255,0.04)',
              color: activeTenantId === t.id ? G : DIM,
              border: `1px solid ${activeTenantId === t.id ? `${G}40` : 'transparent'}`,
              fontFamily: 'monospace', transition: 'all 0.15s',
            }}>{t.name.toUpperCase()}</button>
          ))}
        </div>

        {/* Observium button */}
        <button onClick={() => setObsOpen(p => !p)} style={{
          padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
          fontSize: 11, display: 'flex', alignItems: 'center', gap: 7,
          background: obsOpen ? '#ef4444' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${obsOpen ? '#ef4444' : 'rgba(239,68,68,0.4)'}`,
          color: obsOpen ? 'white' : '#ef4444', position: 'relative',
        }}>
          <Eye size={13} />
          OBSERVIUM
          {obsSummary && (
            <span style={{
              background: obsOpen ? 'rgba(255,255,255,0.25)' : 'rgba(239,68,68,0.2)',
              borderRadius: 6, padding: '1px 6px', fontSize: 10,
            }}>{obsSummary.down} ↓</span>
          )}
          {obsLoading && <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} />}
        </button>

        {/* View toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: 3, borderRadius: 10, gap: 2 }}>
          {([['map', 'Mapa', Map], ['grid', 'Rejilla', LayoutGrid], ['3d', 'Topología 3D', Box], ['reportes', 'Reporte', Activity]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setView(id as any)} style={{
              padding: '6px 14px', fontSize: 10, fontWeight: 700, borderRadius: 7,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: view === id ? G : 'transparent',
              color: view === id ? '#000' : G,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0, overflow: 'hidden' }}>
        {view === 'reportes' && (
          <ReporteSemanal cities={cities} alerts={alerts} />
        )}
        {view !== 'reportes' && view === 'map' ? (
          <>
            {/* Map + alerts side by side */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ flex: '0 0 auto', height: 520, position: 'relative', borderRadius: 18, overflow: 'hidden', border: `1px solid ${G}20` }}>
                <RealMap cities={cities} onSelectCity={handleSelectCity} selectedCityId={selectedCity?.id || null} />
              </div>
              <div style={{ flex: 1, minHeight: 180, overflow: 'hidden' }}>
                <AlertStream alerts={alerts} />
              </div>
            </div>

            {/* Side panel */}
            {selectedCity && (
              <SiteInspector city={selectedCity} onClose={() => setSelectedCity(null)} />
            )}
          </>
        ) : view === 'grid' ? (
          <>
            <div style={{
              flex: 1, overflowY: 'auto',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12, alignContent: 'start',
            }}>
              {cities.map(city => (
                <CityCard key={city.id} city={city} onClick={() => handleSelectCity(city)} />
              ))}
            </div>
            {selectedCity && (
              <SiteInspector city={selectedCity} onClose={() => setSelectedCity(null)} />
            )}
          </>
        ) : view === '3d' ? (
          <div style={{ flex: 1, position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid ${G}20`, background: '#050810' }}>
            <HexoField3D
              mode="network"
              nodes={cities.map(c => ({
                id: c.id,
                label: c.name,
                status: c.availability >= 85 ? 'online' : c.availability >= 50 ? 'warning' : 'offline',
                group: c.name,
                value: c.totalHosts,
              }))}
              width="100%"
              height="100%"
              interactive={true}
              onNodeClick={(node) => {
                const city = cities.find(c => c.id === node.id);
                if (city) { handleSelectCity(city); setSelected3dNode(node); }
              }}
            />

            {/* Leyenda */}
            <div style={{
              position: 'absolute', bottom: 20, left: 20,
              background: 'rgba(5,8,16,0.85)', border: `1px solid ${G}20`,
              borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(8px)',
            }}>
              <div style={{ fontSize: 9, color: G, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>LEYENDA DE RED</div>
              {[['#00ff88','Online ≥ 85%'],['#ffcc00','Degradado 50–84%'],['#ff3366','Crítico < 50%']].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, marginTop: 8, paddingTop: 6, fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                Click en nodo para inspeccionar
              </div>
            </div>

            {/* KPIs flotantes */}
            <div style={{
              position: 'absolute', top: 16, right: 16,
              display: 'flex', gap: 8,
            }}>
              {[
                { label: 'Nodos', val: cities.length, color: '#fff' },
                { label: 'Online', val: cities.filter(c => c.availability >= 85).length, color: '#00ff88' },
                { label: 'Alerta', val: cities.filter(c => c.availability < 85 && c.availability >= 50).length, color: '#ffcc00' },
                { label: 'Crítico', val: cities.filter(c => c.availability < 50).length, color: '#ff3366' },
              ].map(k => (
                <div key={k.label} style={{
                  background: 'rgba(5,8,16,0.85)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 8, padding: '6px 12px', textAlign: 'center', backdropFilter: 'blur(8px)',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: k.color }}>{k.val}</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>{k.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Inspector flotante cuando se hace click */}
            {selected3dNode && (
              <div style={{
                position: 'absolute', bottom: 20, right: 20,
                background: 'rgba(5,8,16,0.9)', border: `1px solid ${G}30`,
                borderRadius: 12, padding: '14px 18px', backdropFilter: 'blur(12px)',
                minWidth: 200,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{selected3dNode.label}</span>
                  <button onClick={() => setSelected3dNode(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 2 }}>
                    <X size={13} />
                  </button>
                </div>
                {(() => {
                  const city = cities.find(c => c.id === selected3dNode.id);
                  if (!city) return null;
                  const color = city.availability >= 85 ? '#00ff88' : city.availability >= 50 ? '#ffcc00' : '#ff3366';
                  return (
                    <>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Disponibilidad</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color, marginBottom: 8 }}>{city.availability.toFixed(1)}%</div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
                        <span style={{ color: '#00ff88' }}>↑ {city.onlineHosts} online</span>
                        <span style={{ color: '#ff3366' }}>↓ {city.offlineHosts} offline</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ── Panel Observium ────────────────────────────────────────────────── */}
      {obsOpen && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 340, zIndex: 2000,
          background: 'rgba(8,8,20,0.97)', borderLeft: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', flexDirection: 'column', backdropFilter: 'blur(16px)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
        }}>
          {/* Header */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(239,68,68,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eye size={16} color="#ef4444" />
              <span style={{ color: 'white', fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>Observium — Red en Vivo</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={fetchObs} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
                <Loader size={13} style={{ animation: obsLoading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <button onClick={() => setObsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* KPIs */}
            {obsSummary && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Total',         val: obsSummary.total,              color: 'rgba(255,255,255,0.7)' },
                  { label: 'Online',        val: obsSummary.up,                 color: '#00ff88' },
                  { label: 'Offline',       val: obsSummary.down,               color: '#ef4444' },
                  { label: 'Disponibilidad',val: `${obsSummary.availability}%`, color: obsSummary.availability >= 80 ? '#ffcc00' : '#ef4444' },
                ].map(k => (
                  <div key={k.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: k.color }}>{k.val}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Alertas */}
            {obsAlerts.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={11} color="#ef4444" /> Alertas críticas ({obsAlerts.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {obsAlerts.slice(0, 20).map((a: any, i: number) => (
                    <div key={i} style={{
                      background: a.cls === 'red' ? 'rgba(239,68,68,0.08)' : 'rgba(234,179,8,0.08)',
                      border: `1px solid ${a.cls === 'red' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}`,
                      borderLeft: `3px solid ${a.cls === 'red' ? '#ef4444' : '#eab308'}`,
                      borderRadius: 6, padding: '7px 10px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: a.cls === 'red' ? '#ef4444' : '#eab308', textTransform: 'uppercase' }}>
                          {a.entity_type} · dev {a.device_id}
                        </span>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{a.changed}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{a.message || 'Checks failed'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipos offline */}
            {obsDown.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <WifiOff size={11} color="#ef4444" /> Offline ({obsDown.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {obsDown.slice(0, 50).map((d: any, i: number) => (
                    <div key={i} style={{ background: 'rgba(239,68,68,0.05)', borderLeft: '2px solid rgba(239,68,68,0.3)', borderRadius: 5, padding: '6px 10px' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{d.hostname}</div>
                      {d.location && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{d.location}</div>}
                    </div>
                  ))}
                  {obsDown.length > 50 && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 8 }}>
                      + {obsDown.length - 50} equipos más
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes nocpulse {
          0%,100% { opacity:1; transform:scale(1) }
          50%      { opacity:0.4; transform:scale(1.8) }
        }
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
      `}</style>
    </div>
  );
}
