import { useState, useEffect, useMemo } from 'react';
import { useTabTrack } from '../../../../hooks/useTabTrack';
// recharts removed — Dashboard uses custom RingChart/GlassCard components
import { API_BASE } from '../../../../config';
import brand from '../../../../brand';
import type { ThemeConfig } from '../../types';
import { buildTecnicoList, getLevel, LEVELS, type OdooCurso, type Tecnico, type AcademiaStats } from './shared';
import RutasEditor from './RutasEditor';

interface Props { theme: ThemeConfig }

const GREEN = '#00C896';
const DIM   = '#6b7280';

// ── Mini componentes ──────────────────────────────────────────────────────────
function Bar2({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 1s ease' }} />
    </div>
  );
}

function LevelBadge({ level, color, icon }: { level: string; color: string; icon: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${color}14`, color, border: `1px solid ${color}30` }}>
      {icon} {level}
    </span>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
type Tab = 'dashboard' | 'ruta' | 'leaderboard' | 'cursos' | 'plazas' | 'areas' | 'rutas';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard',   label: 'Dashboard',   icon: '📊' },
  { id: 'rutas',       label: 'Rutas',       icon: '🗺️' },
  { id: 'ruta',        label: 'Ruta',        icon: '🛤️' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { id: 'cursos',      label: 'Cursos',      icon: '📚' },
  { id: 'areas',       label: 'Por Área',    icon: '🏢' },
  { id: 'plazas',      label: 'Por Plaza',   icon: '🗺️' },
];

// ── Rutas de Aprendizaje ──────────────────────────────────────────────────────
interface RutaCurso { curso_id: number; curso_name: string; orden: number; obligatorio: boolean; }
interface RutaDef { area: string; nombre: string; descripcion: string; cursos: RutaCurso[]; color: string; icono: string; }

function TabRutas({ cursosOdoo, theme }: { cursosOdoo: OdooCurso[]; theme: ThemeConfig }) {
  const [rutas, setRutas]   = useState<Record<string, RutaDef>>({});
  const [area, setArea]     = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/academia/rutas`)
      .then(r => r.ok ? r.json() : {})
      .then(d => { setRutas(d); const first = Object.keys(d)[0]; if (first) setArea(first); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cursoMap = useMemo(() => {
    const m: Record<number, OdooCurso> = {};
    cursosOdoo.forEach(c => { m[c.id] = c; });
    return m;
  }, [cursosOdoo]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#6b7280' }}>
      <div style={{ width: 16, height: 16, border: `2px solid ${GREEN}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Cargando rutas…
    </div>
  );

  const areas = Object.values(rutas);
  const ruta  = rutas[area];
  const stepColor = (n: number) => n <= 2 ? '#4FC3F7' : n <= 5 ? '#00C896' : n <= 7 ? '#FFB703' : '#7c3aed';

  return (
    <div style={{ display: 'flex', gap: 16, minHeight: 500, padding: '4px 0' }}>
      {/* Sidebar */}
      <div style={{ width: 175, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#4b5563', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, padding: '0 4px' }}>ÁREAS ({areas.length})</div>
        {areas.map(r => (
          <button key={r.area} onClick={() => setArea(r.area)} style={{
            display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', width: '100%', cursor: 'pointer',
            background: area === r.area ? `${r.color}22` : 'transparent',
            border: area === r.area ? `1px solid ${r.color}55` : '1px solid transparent',
            borderRadius: 9, padding: '7px 10px', transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>{r.icono}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: area === r.area ? '#f9fafb' : '#9ca3af', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.area}</div>
              <div style={{ fontSize: 9, color: '#4b5563', marginTop: 1 }}>{r.cursos.length} cursos</div>
            </div>
            {area === r.area && <div style={{ width: 5, height: 5, borderRadius: '50%', background: r.color, flexShrink: 0, marginLeft: 'auto' }} />}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {!ruta ? (
          <div style={{ color: '#4b5563', padding: 40, textAlign: 'center' }}>Selecciona un área</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, padding: '12px 16px', background: `${ruta.color}14`, border: `1px solid ${ruta.color}30`, borderRadius: 12 }}>
              <span style={{ fontSize: 26 }}>{ruta.icono}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>{ruta.nombre}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{ruta.descripcion}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: ruta.color }}>{ruta.cursos.length}</div>
                <div style={{ fontSize: 8, color: '#4b5563', textTransform: 'uppercase' }}>cursos</div>
              </div>
            </div>

            {/* Steps */}
            {ruta.cursos.map((item, i) => {
              const c = cursoMap[item.curso_id];
              const isLast = i === ruta.cursos.length - 1;
              const hasContent = !!c && c.lessons.length > 0;
              const pct = c?.avg_completion ?? 0;
              const pc = pct >= 80 ? '#00C896' : pct >= 40 ? '#FFB703' : '#4FC3F7';
              const sc = stepColor(item.orden);
              return (
                <div key={item.curso_id} style={{ display: 'flex', gap: 0, marginBottom: isLast ? 0 : 0 }}>
                  {/* Connector */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: hasContent ? `${ruta.color}25` : 'rgba(255,255,255,0.03)', border: `2px solid ${hasContent ? ruta.color : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: hasContent ? ruta.color : '#374151' }}>{item.orden}</div>
                    {!isLast && <div style={{ width: 2, flex: 1, minHeight: 12, background: hasContent ? `${ruta.color}25` : 'rgba(255,255,255,0.04)', margin: '2px 0' }} />}
                  </div>
                  {/* Card */}
                  <div style={{ flex: 1, marginLeft: 10, marginBottom: isLast ? 0 : 6, background: hasContent ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.2)', border: `0.5px solid ${hasContent ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}`, borderRadius: 9, padding: '10px 12px', opacity: hasContent ? 1 : 0.55 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: hasContent ? 7 : 0 }}>
                      <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: hasContent ? '#e5e7eb' : '#4b5563', lineHeight: 1.3 }}>{c ? c.name : item.curso_name}</div>
                      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                        <span style={{ fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 7, background: item.obligatorio ? 'rgba(255,71,87,0.1)' : 'rgba(255,255,255,0.03)', color: item.obligatorio ? '#FF4757' : '#4b5563', border: `0.5px solid ${item.obligatorio ? 'rgba(255,71,87,0.2)' : 'rgba(255,255,255,0.05)'}` }}>{item.obligatorio ? 'OBLIGATORIO' : 'OPCIONAL'}</span>
                        <span style={{ fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 7, color: sc, background: `${sc}12`, border: `0.5px solid ${sc}30` }}>#{item.orden}</span>
                      </div>
                    </div>
                    {hasContent && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pc, borderRadius: 2, transition: 'width 0.8s ease' }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: pc, flexShrink: 0 }}>{pct}%</span>
                        <span style={{ fontSize: 9, color: '#4b5563', flexShrink: 0 }}>{c.lessons.length} lecc · {c.members} ins</span>
                        <a href={`https://odoo.wispi.mx/slides/${c.id}`} target="_blank" rel="noreferrer" style={{ fontSize: 8, color: '#4b5563', textDecoration: 'none', padding: '2px 6px', borderRadius: 5, border: '0.5px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>Odoo ↗</a>
                      </div>
                    )}
                    {!hasContent && <div style={{ fontSize: 9, color: '#4b5563', fontStyle: 'italic', marginTop: 2 }}>En desarrollo — sin contenido aún</div>}
                  </div>
                </div>
              );
            })}

            {/* Certificado */}
            <div style={{ display: 'flex', gap: 0, marginTop: 8 }}>
              <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${ruta.color}35`, border: `2px solid ${ruta.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🏅</div>
              </div>
              <div style={{ flex: 1, marginLeft: 10, padding: '9px 12px', background: `${ruta.color}08`, border: `1px dashed ${ruta.color}40`, borderRadius: 9 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: ruta.color }}>{ruta.nombre} — Certificado</div>
                <div style={{ fontSize: 9, color: '#4b5563', marginTop: 2 }}>Completa los cursos obligatorios para obtener la certificación</div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── RutasEditor Overlay ───────────────────────────────────────────────────────
function RutasEditorOverlay({ areas, cursosOdoo, onClose }: { areas: string[]; cursosOdoo: OdooCurso[]; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header de overlay */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0d1117', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🛤️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f9fafb' }}>Editor de Rutas de Aprendizaje</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>Define secuencias de cursos obligatorios por área</p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ padding: '8px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          ✕ Cerrar
        </button>
      </div>
      {/* Contenido */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <RutasEditor areas={areas} cursosOdoo={cursosOdoo} onClose={onClose} />
      </div>
    </div>
  );
}

// ── Premium Components ───────────────────────────────────────────────────────
function RingChart({ pct, size = 72, stroke = 5, color = GREEN }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const [p, setP] = useState(0);
  useEffect(() => { const t = setTimeout(() => setP(pct), 120); return () => clearTimeout(t); }, [pct]);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${(p/100)*circ} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
}

function GlassCard({ children, style, glow, hoverable, onClick }: { children: React.ReactNode; style?: React.CSSProperties; glow?: string; hoverable?: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick}
      style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24,
        boxShadow: glow ? `0 0 40px ${glow}08, inset 0 1px 0 rgba(255,255,255,0.04)` : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s', ...style }}
      onMouseEnter={hoverable ? e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.borderColor = `${glow || GREEN}40`; } : undefined}
      onMouseLeave={hoverable ? e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'; } : undefined}
    >{children}</div>
  );
}

function AnimNum({ value, suffix = '', style }: { value: number; suffix?: string; style?: React.CSSProperties }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let rafId = 0; const dur = 1200; const t0 = performance.now();
    const tick = (now: number) => { const p = Math.min((now - t0) / dur, 1); setV(Math.round(p * value * 10) / 10); if (p < 1) rafId = requestAnimationFrame(tick); };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value]);
  return <span style={style}>{v % 1 === 0 ? Math.round(v) : v.toFixed(1)}{suffix}</span>;
}

// ── Dashboard Tab (redesigned) ───────────────────────────────────────────────
function TabDashboard({ cursos, tecnicos, stats }: { cursos: OdooCurso[]; tecnicos: Tecnico[]; stats: import('./shared').AcademiaStats | null }) {
  const levelDist = useMemo(() => {
    const dist: Record<string, number> = {};
    for (const t of tecnicos) dist[t.level] = (dist[t.level] ?? 0) + 1;
    return LEVELS.map(l => ({ name: l.name, icon: l.icon, color: l.color, count: dist[l.name] ?? 0 }));
  }, [tecnicos]);

  const activos    = stats?.total_activos ?? tecnicos.filter(t => t.avgPct > 0).length;
  const avActivos  = stats?.avance_activos ?? (activos ? Math.round(tecnicos.filter(t => t.avgPct > 0).reduce((a, t) => a + t.avgPct, 0) / activos * 10) / 10 : 0);
  const published  = cursos.filter(c => c.published).length;
  const expertosMas = tecnicos.filter(t => ['Experto', 'Leyenda'].includes(t.level)).length;
  const expertoPct  = tecnicos.length ? Math.round(expertosMas / tecnicos.length * 100) : 0;
  const cursosRezago = useMemo(() => [...cursos].filter(c => c.published && c.members > 0 && c.members_list?.length > 0).sort((a, b) => a.avg_completion - b.avg_completion).slice(0, 5), [cursos]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero KPIs with Ring Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {([
          { label: 'PERSONAS EN ACADEMIA', value: tecnicos.length, pct: activos / (tecnicos.length || 1) * 100, color: GREEN, sub: `${activos} con avance activo`, suffix: '' },
          { label: 'AVANCE ACTIVOS', value: avActivos, pct: avActivos, color: '#4FC3F7', sub: `${activos} personas con progreso`, suffix: '%' },
          { label: 'CURSOS ACTIVOS', value: published, pct: cursos.length ? (published / cursos.length) * 100 : 0, color: '#7c3aed', sub: `de ${cursos.length} totales`, suffix: '' },
          { label: 'EXPERTO + LEYENDA', value: expertosMas, pct: expertoPct, color: '#FFB703', sub: `${expertoPct}% del equipo`, suffix: '' },
        ] as const).map((kpi, i) => (
          <GlassCard key={i} glow={kpi.color} style={{ padding: '20px 22px', animation: `fadeSlide .5s ease ${i * 80}ms both` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <RingChart pct={kpi.pct} size={64} stroke={4} color={kpi.color} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AnimNum value={kpi.pct} suffix="%" style={{ fontSize: 13, fontWeight: 800, color: kpi.color, fontFamily: 'system-ui' }} />
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{kpi.label}</p>
                <AnimNum value={kpi.value} suffix={kpi.suffix} style={{ fontSize: 32, fontWeight: 800, color: kpi.color, lineHeight: 1.1, letterSpacing: -1, display: 'block', marginTop: 4 }} />
                <p style={{ margin: '4px 0 0', fontSize: 11, color: DIM }}>{kpi.sub}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Level Distribution — horizontal bars */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>Distribucion de Niveles</p>
            <span style={{ fontSize: 11, color: DIM, background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 20 }}>{tecnicos.length} personas</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {levelDist.map((l, i) => {
              const pct = tecnicos.length ? (l.count / tecnicos.length) * 100 : 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, width: 22, textAlign: 'center', flexShrink: 0 }}>{l.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#d1d5db', width: 80, flexShrink: 0 }}>{l.name}</span>
                  <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${l.color}90, ${l.color})`, borderRadius: 4, transition: 'width 1.2s cubic-bezier(.4,0,.2,1)' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: l.color, width: 28, textAlign: 'right', flexShrink: 0, fontFamily: 'system-ui' }}>{l.count}</span>
                  <span style={{ fontSize: 10, color: DIM, width: 32, textAlign: 'right', flexShrink: 0 }}>{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Top Performers — podium style */}
        <GlassCard>
          <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>Top Performers</p>
          {/* Podium */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            {[1, 0, 2].map(rank => {
              const t = tecnicos[rank];
              if (!t) return null;
              const medals = ['🥇', '🥈', '🥉'];
              const isFirst = rank === 0;
              return (
                <div key={rank} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 14px', background: `${t.levelColor}08`, borderRadius: 14, border: `1px solid ${t.levelColor}20`, flex: 1, marginTop: isFirst ? 0 : 16 }}>
                  <div style={{ position: 'relative' }}>
                    <RingChart pct={t.avgPct} size={isFirst ? 56 : 44} stroke={3} color={t.levelColor} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: isFirst ? 16 : 13, fontWeight: 800, color: t.levelColor }}>{t.avgPct}%</span>
                    </div>
                  </div>
                  <span style={{ fontSize: isFirst ? 16 : 14 }}>{medals[rank]}</span>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#f3f4f6', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{t.name}</p>
                  <LevelBadge level={t.level} color={t.levelColor} icon={t.levelIcon} />
                </div>
              );
            })}
          </div>
          {/* Ranks 4-10 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tecnicos.slice(3, 10).map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: DIM, width: 22, textAlign: 'center' }}>#{i + 4}</span>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${t.levelColor}15`, border: `1.5px solid ${t.levelColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: t.levelColor, flexShrink: 0 }}>{t.name.charAt(0)}</div>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${t.avgPct}%`, height: '100%', background: t.levelColor, borderRadius: 2, transition: 'width 1s ease' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: t.levelColor, width: 36, textAlign: 'right', fontFamily: 'system-ui' }}>{t.avgPct}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Mayor / Menor avance individual */}
      {(stats?.mayor_avance || stats?.menor_avance) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {stats.mayor_avance && (
            <GlassCard glow={GREEN} style={{ padding: '18px 22px' }}>
              <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🏆 Mayor Avance</p>
              <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#f9fafb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stats.mayor_avance.name}</p>
              <span style={{ fontSize: 28, fontWeight: 900, color: GREEN, fontFamily: 'system-ui' }}>{stats.mayor_avance.pct}%</span>
            </GlassCard>
          )}
          {stats.menor_avance && (
            <GlassCard glow="#FF4757" style={{ padding: '18px 22px' }}>
              <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>📉 Menor Avance Activo</p>
              <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#f9fafb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stats.menor_avance.name}</p>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#FF4757', fontFamily: 'system-ui' }}>{stats.menor_avance.pct}%</span>
            </GlassCard>
          )}
        </div>
      )}

      {/* Cursos que requieren atencion */}
      <GlassCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>Cursos que Requieren Atencion</p>
          <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,71,87,0.1)', color: '#FF4757', fontWeight: 600 }}>menor avance</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {cursosRezago.map((c, i) => {
            const color = c.avg_completion < 15 ? '#FF4757' : c.avg_completion < 40 ? '#FFB703' : GREEN;
            const rezagados = (c.members_list ?? []).filter(m => (m.pct ?? 0) < 30).length;
            return (
              <div key={i} style={{ background: '#0d1117', borderRadius: 14, padding: 16, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, animation: `fadeSlide .4s ease ${i * 60}ms both` }}>
                <div style={{ position: 'relative' }}>
                  <RingChart pct={c.avg_completion} size={56} stroke={4} color={color} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color, fontFamily: 'system-ui' }}>{c.avg_completion}%</span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#d1d5db', textAlign: 'center', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{c.name}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 10, color: DIM }}>{c.members} inscritos</span>
                  {rezagados > 0 && <span style={{ fontSize: 10, color: '#FF4757' }}>{rezagados} rezagados</span>}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

    </div>
  );
}

// ── Ruta de Profesionalizacion ────────────────────────────────────────────────
function TabRuta({ cursos, tecnicos }: { cursos: OdooCurso[]; tecnicos: Tecnico[] }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'avance' | 'rezago' | 'name'>('avance');

  const backbone = useMemo(() =>
    cursos.find(c => c.name.toLowerCase().includes('gestion de proyecto') || c.name.toLowerCase().includes('gestión de proyecto')),
    [cursos]
  );

  const modules = useMemo(() => {
    if (!backbone) return [];
    return (backbone as any).lessons?.filter((l: any) => l.name?.startsWith('MODULO') || l.name?.startsWith('MÓDULO')) ?? [];
  }, [backbone]);

  const totalModules = modules.length || 10;

  const enrolled = useMemo(() => {
    if (!backbone) return [];
    const techMap = new Map(tecnicos.map(t => [t.name.toLowerCase(), t]));
    return (backbone.members_list ?? [])
      .map(m => {
        const pct = m.pct ?? 0;
        const tech = techMap.get(m.name.toLowerCase());
        const completed = Math.floor((pct / 100) * totalModules);
        return { name: m.name, pct, completed, plaza: tech?.plaza || '', area: tech?.area || '', level: tech?.level || 'Aprendiz', levelColor: tech?.levelColor || DIM, levelIcon: tech?.levelIcon || '' };
      })
      .filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => sortBy === 'avance' ? b.pct - a.pct : sortBy === 'rezago' ? a.pct - b.pct : a.name.localeCompare(b.name));
  }, [backbone, tecnicos, search, sortBy, totalModules]);

  const avgCompletion = backbone?.avg_completion ?? 0;
  const completaron100 = enrolled.filter(e => e.pct >= 95).length;
  const operCursos = useMemo(() => cursos.filter(c => c.published && c.members > 3 && c.total_slides > 0).sort((a, b) => b.members - a.members).slice(0, 6), [cursos]);

  if (!backbone) return (
    <GlassCard style={{ textAlign: 'center', padding: 40 }}>
      <p style={{ fontSize: 16, color: '#e5e7eb', fontWeight: 600, marginBottom: 8 }}>Curso backbone no encontrado</p>
      <p style={{ fontSize: 12, color: DIM }}>El curso "Gestion de Proyectos" no esta en Odoo. Verifica que este publicado.</p>
    </GlassCard>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero banner */}
      <GlassCard glow="#7c3aed" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, #111827 60%)', padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <RingChart pct={avgCompletion} size={100} stroke={6} color="#7c3aed" />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <AnimNum value={avgCompletion} suffix="%" style={{ fontSize: 22, fontWeight: 800, color: '#7c3aed' }} />
              <span style={{ fontSize: 8, color: DIM, marginTop: 2 }}>AVANCE</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em' }}>RUTA DE PROFESIONALIZACION</p>
            <h3 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color: '#f9fafb' }}>{backbone.name}</h3>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: DIM }}>{totalModules} modulos  ·  {enrolled.length} inscritos  ·  Profesionalizacion operativa de tecnicos y lideres de campo</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            {([
              { label: 'Inscritos', value: enrolled.length, color: GREEN },
              { label: 'Completaron', value: completaron100, color: '#FFB703' },
              { label: 'Modulos', value: totalModules, color: '#4FC3F7' },
            ]).map((pill, i) => (
              <div key={i} style={{ background: `${pill.color}10`, border: `1px solid ${pill.color}25`, borderRadius: 12, padding: '10px 16px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: pill.color, lineHeight: 1 }}>{pill.value}</p>
                <p style={{ margin: '4px 0 0', fontSize: 9, color: DIM, fontWeight: 600, textTransform: 'uppercase' }}>{pill.label}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Otros cursos operativos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {operCursos.map((c, i) => {
          const color = c.avg_completion < 20 ? '#FF4757' : c.avg_completion < 50 ? '#FFB703' : GREEN;
          return (
            <GlassCard key={i} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }} glow={color}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <RingChart pct={c.avg_completion} size={40} stroke={3} color={color} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color }}>{c.avg_completion}%</span>
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 10, color: DIM }}>{c.members} inscritos</p>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tecnico..."
          style={{ flex: 1, minWidth: 200, background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', color: '#f3f4f6', fontSize: 13, outline: 'none' }} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
          style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', color: '#f3f4f6', fontSize: 13, outline: 'none' }}>
          <option value="avance">Mas avanzado</option>
          <option value="rezago">Menor avance</option>
          <option value="name">Nombre</option>
        </select>
        <span style={{ fontSize: 12, color: DIM }}>{enrolled.length} en la ruta</span>
      </div>

      {/* Journey timeline */}
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${totalModules}, 1fr) 70px`, gap: 0, padding: '12px 16px', background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: DIM, textTransform: 'uppercase' }}>Tecnico</span>
          {Array.from({ length: totalModules }, (_, i) => (
            <span key={i} style={{ fontSize: 9, fontWeight: 600, color: DIM, textAlign: 'center' }}>M{i + 1}</span>
          ))}
          <span style={{ fontSize: 10, fontWeight: 700, color: DIM, textTransform: 'uppercase', textAlign: 'right' }}>Avance</span>
        </div>

        {/* Rows */}
        {enrolled.map((e, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: `200px repeat(${totalModules}, 1fr) 70px`, gap: 0, padding: '10px 16px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', animation: `fadeSlide .3s ease ${idx * 30}ms both` }}>
            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${e.levelColor}15`, border: `1.5px solid ${e.levelColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: e.levelColor, flexShrink: 0 }}>{e.name.charAt(0)}</div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</p>
                <p style={{ margin: 0, fontSize: 9, color: DIM }}>{e.plaza || e.area || e.level}</p>
              </div>
            </div>
            {/* Module dots */}
            {Array.from({ length: totalModules }, (_, m) => {
              const done = m < e.completed;
              const current = m === e.completed && e.pct < 100;
              return (
                <div key={m} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    width: done ? 18 : current ? 16 : 14,
                    height: done ? 18 : current ? 16 : 14,
                    borderRadius: '50%',
                    background: done ? GREEN : current ? `${GREEN}40` : 'rgba(255,255,255,0.06)',
                    border: current ? `2px solid ${GREEN}` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 700,
                    color: done ? '#001a12' : current ? GREEN : 'rgba(255,255,255,0.2)',
                    animation: current ? 'pulse 2s ease infinite' : 'none',
                    transition: 'all 0.3s',
                  }}>
                    {done ? '✓' : m + 1}
                  </div>
                </div>
              );
            })}
            {/* Percentage */}
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: e.pct >= 80 ? GREEN : e.pct >= 40 ? '#FFB703' : '#FF4757', fontFamily: 'system-ui' }}>{e.pct}%</span>
            </div>
          </div>
        ))}

        {enrolled.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: DIM, fontSize: 13 }}>
            {search ? 'Sin resultados para la busqueda' : 'No hay tecnicos inscritos en esta ruta'}
          </div>
        )}
      </GlassCard>

    </div>
  );
}

// ── CSV Export helper ─────────────────────────────────────────────────────────
function exportCSV(tecnicos: Tecnico[]) {
  const header = ['Rank', 'Nombre', 'Plaza', 'Nivel', 'Avance %', 'Cursos'];
  const rows = tecnicos.map(t => [t.rank, `"${t.name}"`, `"${t.plaza || 'Sin plaza'}"`, t.level, t.avgPct, t.cursos]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `academia_xcien_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Leaderboard Tab ───────────────────────────────────────────────────────────
function TabLeaderboard({ tecnicos, plazas, areas }: { tecnicos: Tecnico[]; plazas: string[]; areas: string[] }) {
  const [search, setSearch]       = useState('');
  const [levelFilter, setLevel]   = useState('');
  const [plazaFilter, setPlaza]   = useState('');
  const [areaFilter, setArea]     = useState('');
  const [page, setPage]           = useState(0);
  const PAGE = 20;

  const filtered = useMemo(() => tecnicos.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (levelFilter && t.level !== levelFilter) return false;
    if (plazaFilter && t.plaza !== plazaFilter) return false;
    if (areaFilter  && t.area  !== areaFilter)  return false;
    return true;
  }), [tecnicos, search, levelFilter, plazaFilter, areaFilter]);

  const pages = Math.ceil(filtered.length / PAGE);
  const slice = filtered.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Buscar técnico..."
          style={{ flex: 1, minWidth: 180, background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', color: '#f3f4f6', fontSize: 13, outline: 'none' }}
        />
        <select
          value={areaFilter}
          onChange={e => { setArea(e.target.value); setPage(0); }}
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', color: '#f3f4f6', fontSize: 13, outline: 'none' }}
        >
          <option value="">Todas las áreas</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={plazaFilter}
          onChange={e => { setPlaza(e.target.value); setPage(0); }}
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', color: '#f3f4f6', fontSize: 13, outline: 'none' }}
        >
          <option value="">Todas las plazas</option>
          {plazas.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={levelFilter}
          onChange={e => { setLevel(e.target.value); setPage(0); }}
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', color: '#f3f4f6', fontSize: 13, outline: 'none' }}
        >
          <option value="">Todos los niveles</option>
          {LEVELS.map(l => <option key={l.name} value={l.name}>{l.icon} {l.name}</option>)}
        </select>
        <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: DIM, whiteSpace: 'nowrap' }}>
          {filtered.length} técnicos
        </span>
        <button
          onClick={() => exportCSV(filtered)}
          style={{ padding: '9px 16px', borderRadius: 10, background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)', color: GREEN, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          title="Exportar lista filtrada como CSV"
        >
          ⬇ CSV
        </button>
      </div>

      {/* Tabla */}
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d1117' }}>
              {['#', 'Empleado', 'Área', 'Plaza', 'Nivel', 'Progreso', 'Avance'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((t) => (
              <tr key={t.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 16px', fontSize: 13, color: t.rank <= 3 ? '#FFB703' : DIM, fontWeight: 700 }}>
                  {t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : t.rank === 3 ? '🥉' : `#${t.rank}`}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${t.levelColor}20`, border: `1.5px solid ${t.levelColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: t.levelColor, flexShrink: 0 }}>
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f3f4f6' }}>{t.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 11, color: DIM, whiteSpace: 'nowrap', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.area || <span style={{ opacity: 0.35 }}>—</span>}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 11, color: DIM, whiteSpace: 'nowrap' }}>
                  {t.plaza || <span style={{ opacity: 0.35 }}>—</span>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <LevelBadge level={t.level} color={t.levelColor} icon={t.levelIcon} />
                </td>
                <td style={{ padding: '12px 16px', width: 140 }}>
                  <Bar2 pct={t.avgPct} color={t.levelColor} />
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 800, color: t.levelColor }}>{t.avgPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ padding: '6px 14px', borderRadius: 8, background: '#111827', border: '1px solid rgba(255,255,255,0.08)', color: page === 0 ? DIM : '#f3f4f6', cursor: page === 0 ? 'default' : 'pointer', fontSize: 12 }}>
            ← Anterior
          </button>
          <span style={{ padding: '6px 14px', fontSize: 12, color: DIM, display: 'flex', alignItems: 'center' }}>
            {page + 1} / {pages}
          </span>
          <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}
            style={{ padding: '6px 14px', borderRadius: 8, background: '#111827', border: '1px solid rgba(255,255,255,0.08)', color: page === pages - 1 ? DIM : '#f3f4f6', cursor: page === pages - 1 ? 'default' : 'pointer', fontSize: 12 }}>
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Cursos Tab ────────────────────────────────────────────────────────────────
function TabCursos({ cursos }: { cursos: OdooCurso[] }) {
  const [selected, setSelected] = useState<OdooCurso | null>(null);
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState<'completion' | 'members' | 'name'>('completion');

  const sorted = useMemo(() => {
    const filtered = cursos.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
    return [...filtered].sort((a, b) => {
      if (sort === 'completion') return a.avg_completion - b.avg_completion;
      if (sort === 'members')    return b.members - a.members;
      return a.name.localeCompare(b.name);
    });
  }, [cursos, search, sort]);

  if (selected) {
    const rezagados = selected.members_list.filter(m => (m.pct ?? 0) < 50);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setSelected(null)} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', color: '#f3f4f6', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12 }}>← Volver</button>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f3f4f6' }}>{selected.name}</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: DIM }}>{selected.members} inscritos · {selected.avg_completion}% completado en promedio</p>
          </div>
          <a href={`${brand.odooUrl}/slides/${selected.id}`} target="_blank" rel="noreferrer"
            style={{ marginLeft: 'auto', padding: '7px 16px', borderRadius: 8, background: 'rgba(0,200,150,0.12)', color: GREEN, border: `1px solid ${GREEN}30`, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            Ver en Odoo ↗
          </a>
        </div>

        {rezagados.length > 0 && (
          <div style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: 12, padding: '14px 18px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#FF4757' }}>⚠ {rezagados.length} técnicos por debajo del 50%</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {rezagados.slice(0, 12).map((m, i) => (
                <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,71,87,0.1)', color: '#FF4757' }}>
                  {m.name} · {m.pct}%
                </span>
              ))}
              {rezagados.length > 12 && <span style={{ fontSize: 11, color: DIM }}>+{rezagados.length - 12} más</span>}
            </div>
          </div>
        )}

        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d1117' }}>
                {['Técnico', 'Nivel', 'Progreso', '%'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: DIM, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...selected.members_list].sort((a, b) => b.pct - a.pct).map((m, i) => {
                const lv = getLevel(m.pct ?? 0);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: '#f3f4f6', fontWeight: 500 }}>{m.name}</td>
                    <td style={{ padding: '10px 16px' }}><LevelBadge level={lv.name} color={lv.color} icon={lv.icon} /></td>
                    <td style={{ padding: '10px 16px', width: 160 }}><Bar2 pct={m.pct ?? 0} color={lv.color} /></td>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: lv.color }}>{m.pct ?? 0}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar curso..."
          style={{ flex: 1, minWidth: 200, background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', color: '#f3f4f6', fontSize: 13, outline: 'none' }}
        />
        <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', color: '#f3f4f6', fontSize: 13, outline: 'none' }}>
          <option value="completion">Ordenar: Menor avance</option>
          <option value="members">Ordenar: Más inscritos</option>
          <option value="name">Ordenar: Nombre</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {sorted.map(c => {
          const color = c.avg_completion < 30 ? '#FF4757' : c.avg_completion < 60 ? '#FFB703' : GREEN;
          const rezagados = c.members_list.filter(m => (m.pct ?? 0) < 50).length;
          return (
            <div key={c.id} onClick={() => setSelected(c)}
              style={{ background: '#111827', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${color}40`; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f3f4f6', lineHeight: 1.4 }}>{c.name}</p>
                <span style={{ fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>{c.avg_completion}%</span>
              </div>
              <Bar2 pct={c.avg_completion} color={color} />
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <span style={{ fontSize: 11, color: DIM }}>{c.members} inscritos</span>
                {rezagados > 0 && <span style={{ fontSize: 11, color: '#FF4757' }}>⚠ {rezagados} rezagados</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab Por Área ──────────────────────────────────────────────────────────────
const AREA_COLORS: Record<string, string> = {
  'Técnicos de Campo': '#00C896',
  'NOC':               '#4FC3F7',
  'WFM':               '#FFB703',
  'Comercial':         '#7c3aed',
  'Administración':    '#6b7280',
  'Sin área':          '#374151',
};
function getAreaColor(area: string): string {
  for (const [key, color] of Object.entries(AREA_COLORS)) {
    if (area.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return '#4FC3F7';
}

function TabAreas({ tecnicos, areas }: { tecnicos: Tecnico[]; areas: string[] }) {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const stats = useMemo(() => {
    const map: Record<string, Tecnico[]> = {};
    for (const t of tecnicos) {
      const a = t.area || 'Sin área';
      if (!map[a]) map[a] = [];
      map[a].push(t);
    }
    return Object.entries(map)
      .map(([area, emps]) => {
        const avg = emps.reduce((s, t) => s + t.avgPct, 0) / emps.length;
        const rezagados = emps.filter(t => t.avgPct < 30).length;
        const completados = emps.filter(t => t.avgPct === 100).length;
        return { area, emps, avg: Math.round(avg * 10) / 10, total: emps.length, rezagados, completados };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [tecnicos]);

  if (selectedArea) {
    const areaEmps = tecnicos.filter(t => (t.area || 'Sin área') === selectedArea).sort((a, b) => b.avgPct - a.avgPct);
    const color = getAreaColor(selectedArea);
    const avg   = areaEmps.reduce((s, t) => s + t.avgPct, 0) / (areaEmps.length || 1);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setSelectedArea(null)} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', color: '#f3f4f6', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12 }}>← Todas las áreas</button>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f9fafb' }}>🏢 {selectedArea}</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: DIM }}>{areaEmps.length} personas · {Math.round(avg)}% avance promedio</p>
          </div>
          <button onClick={() => exportCSV(areaEmps)} style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 8, background: `${color}12`, border: `1px solid ${color}25`, color, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            ⬇ CSV
          </button>
        </div>

        {areaEmps.filter(t => t.avgPct < 30).length > 0 && (
          <div style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: 12, padding: '14px 18px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#FF4757' }}>⚠ Rezagados — Avance menor al 30%</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {areaEmps.filter(t => t.avgPct < 30).map(t => (
                <span key={t.name} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,71,87,0.1)', color: '#FF4757' }}>
                  {t.name} · {t.avgPct}%
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d1117' }}>
                {['#', 'Empleado', 'Plaza', 'Nivel', 'Progreso', 'Avance'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: DIM, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {areaEmps.map((t, i) => (
                <tr key={t.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: i < 3 ? '#FFB703' : DIM, fontWeight: 700 }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#f3f4f6', fontWeight: 500 }}>{t.name}</td>
                  <td style={{ padding: '10px 16px', fontSize: 11, color: DIM }}>{t.plaza || '—'}</td>
                  <td style={{ padding: '10px 16px' }}><LevelBadge level={t.level} color={t.levelColor} icon={t.levelIcon} /></td>
                  <td style={{ padding: '10px 16px', width: 140 }}><Bar2 pct={t.avgPct} color={t.levelColor} /></td>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: t.levelColor }}>{t.avgPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: DIM }}>{stats.length} áreas · {tecnicos.length} personas totales en Academia</p>
        <button onClick={() => exportCSV(tecnicos)} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)', color: GREEN, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          ⬇ Exportar todo CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {stats.map(s => {
          const color = getAreaColor(s.area);
          const semaforo = s.avg >= 70 ? color : s.avg >= 40 ? '#FFB703' : '#FF4757';
          return (
            <div
              key={s.area}
              onClick={() => setSelectedArea(s.area)}
              style={{ background: '#111827', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = `${color}40`; el.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(255,255,255,0.06)'; el.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f3f4f6' }}>{s.area}</p>
                </div>
                <span style={{ fontSize: 22, fontWeight: 900, color: semaforo, lineHeight: 1 }}>{s.avg}%</span>
              </div>
              <Bar2 pct={s.avg} color={semaforo} />
              <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
                <span style={{ fontSize: 11, color: DIM }}>{s.total} personas</span>
                {s.rezagados > 0 && <span style={{ fontSize: 11, color: '#FF4757' }}>⚠ {s.rezagados} rezagados</span>}
                {s.completados > 0 && <span style={{ fontSize: 11, color: GREEN }}>✓ {s.completados} al 100%</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab Por Plaza ─────────────────────────────────────────────────────────────
function TabPlazas({ tecnicos, plazas }: { tecnicos: Tecnico[]; plazas: string[] }) {
  const [selectedPlaza, setSelectedPlaza] = useState<string | null>(null);

  const stats = useMemo(() => {
    const map: Record<string, Tecnico[]> = {};
    for (const t of tecnicos) {
      const p = t.plaza || 'Sin plaza';
      if (!map[p]) map[p] = [];
      map[p].push(t);
    }
    return Object.entries(map)
      .map(([plaza, tecs]) => {
        const avg = tecs.reduce((s, t) => s + t.avgPct, 0) / tecs.length;
        const rezagados = tecs.filter(t => t.avgPct < 30).length;
        const expertos  = tecs.filter(t => ['Experto', 'Leyenda'].includes(t.level)).length;
        return { plaza, tecs, avg: Math.round(avg * 10) / 10, total: tecs.length, rezagados, expertos };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [tecnicos]);

  if (selectedPlaza) {
    const plazaTecs = tecnicos.filter(t => (t.plaza || 'Sin plaza') === selectedPlaza)
      .sort((a, b) => b.avgPct - a.avgPct);
    const plazaAvg = plazaTecs.reduce((s, t) => s + t.avgPct, 0) / (plazaTecs.length || 1);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setSelectedPlaza(null)} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', color: '#f3f4f6', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12 }}>← Todas las plazas</button>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f9fafb' }}>🗺️ {selectedPlaza}</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: DIM }}>{plazaTecs.length} técnicos · {Math.round(plazaAvg)}% avance promedio</p>
          </div>
          <button onClick={() => exportCSV(plazaTecs)} style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 8, background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)', color: GREEN, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            ⬇ CSV
          </button>
        </div>

        {/* Rezagados de esta plaza */}
        {plazaTecs.filter(t => t.avgPct < 30).length > 0 && (
          <div style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: 12, padding: '14px 18px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#FF4757' }}>⚠ Rezagados — Avance menor al 30%</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {plazaTecs.filter(t => t.avgPct < 30).map(t => (
                <span key={t.name} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,71,87,0.1)', color: '#FF4757' }}>
                  {t.name} · {t.avgPct}%
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d1117' }}>
                {['#', 'Técnico', 'Nivel', 'Progreso', 'Avance'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: DIM, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plazaTecs.map((t, i) => (
                <tr key={t.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: i < 3 ? '#FFB703' : DIM, fontWeight: 700 }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#f3f4f6', fontWeight: 500 }}>{t.name}</td>
                  <td style={{ padding: '10px 16px' }}><LevelBadge level={t.level} color={t.levelColor} icon={t.levelIcon} /></td>
                  <td style={{ padding: '10px 16px', width: 160 }}><Bar2 pct={t.avgPct} color={t.levelColor} /></td>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: t.levelColor }}>{t.avgPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: DIM }}>{stats.length} plazas · {tecnicos.length} técnicos totales</p>
        <button onClick={() => exportCSV(tecnicos)} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)', color: GREEN, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          ⬇ Exportar todo CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {stats.map(s => {
          const color = s.avg >= 70 ? GREEN : s.avg >= 40 ? '#FFB703' : '#FF4757';
          return (
            <div
              key={s.plaza}
              onClick={() => setSelectedPlaza(s.plaza)}
              style={{ background: '#111827', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = `${color}40`; el.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(255,255,255,0.06)'; el.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f3f4f6' }}>🗺️ {s.plaza}</p>
                <span style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{s.avg}%</span>
              </div>
              <Bar2 pct={s.avg} color={color} />
              <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
                <span style={{ fontSize: 11, color: DIM }}>{s.total} técnicos</span>
                {s.rezagados > 0 && <span style={{ fontSize: 11, color: '#FF4757' }}>⚠ {s.rezagados} rezagados</span>}
                {s.expertos > 0 && <span style={{ fontSize: 11, color: '#FFB703' }}>🏅 {s.expertos} expertos</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AcademiaGerencial({ theme }: Props) {
  const trackTab = useTabTrack('academia-gerencial');
  const [tab, setTab]             = useState<Tab>('dashboard');
  const [cursos, setCursos]       = useState<OdooCurso[]>([]);
  const [plazaMapa, setPlazaMapa] = useState<Record<string, string> | undefined>(undefined);
  const [areaMapa, setAreaMapa]   = useState<Record<string, string> | undefined>(undefined);
  const [plazas, setPlazas]       = useState<string[]>([]);
  const [areas, setAreas]         = useState<string[]>([]);
  const [stats, setStats]         = useState<AcademiaStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRutasEditor, setShowRutasEditor] = useState(false);

  const loadData = (bustCache = false) => {
    const doLoad = () => Promise.all([
      fetch(`${API_BASE}/api/academia/cursos`).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/academia/tecnicos-plaza`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/api/academia/stats`).then(r => r.ok ? r.json() : null),
    ]).then(([cs, pd, st]) => {
      setCursos(cs ?? []);
      if (pd?.mapa) { setPlazaMapa(pd.mapa); setPlazas(pd.plazas ?? []); }
      if (pd?.mapa_area) { setAreaMapa(pd.mapa_area); setAreas(pd.areas ?? []); }
      if (st) setStats(st);
    }).catch(() => {});

    if (bustCache) {
      setRefreshing(true);
      fetch(`${API_BASE}/api/academia/refresh`, { method: 'POST' })
        .then(() => doLoad())
        .finally(() => setRefreshing(false));
    } else {
      doLoad().finally(() => setLoading(false));
    }
  };

  useEffect(() => { loadData(false); }, []);

  // Toda la organización inscrita en cursos, enriquecida con plaza y área
  const tecnicos = useMemo(() => buildTecnicoList(cursos, plazaMapa, areaMapa), [cursos, plazaMapa, areaMapa]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: DIM }}>
      <div style={{ width: 18, height: 18, border: `2px solid ${GREEN}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      Cargando datos de Odoo eLearning...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.15)}}`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Overlay Editor de Rutas */}
      {showRutasEditor && (
        <RutasEditorOverlay areas={areas} cursosOdoo={cursos} onClose={() => setShowRutasEditor(false)} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f9fafb', letterSpacing: -0.5 }}>
            Academia {brand.name}
            <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,200,150,0.1)', color: GREEN, border: `1px solid ${GREEN}30`, verticalAlign: 'middle' }}>
              ● Odoo en vivo
            </span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: DIM }}>
            Vista gerencial · {tecnicos.length} personas
            {areas.length > 0 && ` · ${areas.length} áreas`}
            {plazas.length > 0 && ` · ${plazas.length} plazas`}
            {' · '}{cursos.filter(c => c.published).length} cursos activos
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{ padding: '9px 14px', borderRadius: 10, background: refreshing ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: refreshing ? DIM : '#f3f4f6', fontSize: 13, fontWeight: 600, cursor: refreshing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
            title="Recargar datos desde Odoo"
          >
            <span style={{ display: 'inline-block', animation: refreshing ? 'spin .8s linear infinite' : 'none' }}>↻</span>
            {refreshing ? 'Actualizando…' : 'Actualizar'}
          </button>
          <button
            onClick={() => setShowRutasEditor(true)}
            style={{ padding: '9px 18px', borderRadius: 10, background: 'rgba(0,200,150,0.08)', border: `1px solid ${GREEN}25`, color: GREEN, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            🛤️ Editor de Rutas
          </button>
          <a href={`${brand.odooUrl}/slides`} target="_blank" rel="noreferrer"
            style={{ padding: '9px 18px', borderRadius: 10, background: '#111827', border: '1px solid rgba(255,255,255,0.1)', color: '#f3f4f6', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            Abrir Odoo eLearning ↗
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#111827', borderRadius: 12, padding: 4, alignSelf: 'flex-start', border: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { trackTab(t.id); setTab(t.id); }}
            style={{ padding: '8px 20px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              background: tab === t.id ? GREEN : 'transparent',
              color: tab === t.id ? '#001a12' : DIM,
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'dashboard'   && <TabDashboard cursos={cursos} tecnicos={tecnicos} stats={stats} />}
        {tab === 'rutas'       && <TabRutas cursosOdoo={cursos} theme={theme} />}
        {tab === 'ruta'        && <TabRuta cursos={cursos} tecnicos={tecnicos} />}
        {tab === 'leaderboard' && <TabLeaderboard tecnicos={tecnicos} plazas={plazas} areas={areas} />}
        {tab === 'cursos'      && <TabCursos cursos={cursos} />}
        {tab === 'areas'       && <TabAreas tecnicos={tecnicos} areas={areas} />}
        {tab === 'plazas'      && <TabPlazas tecnicos={tecnicos} plazas={plazas} />}
      </div>
    </div>
  );
}
