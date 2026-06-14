import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { API_BASE } from '../../../../config';
import brand from '../../../../brand';
import type { ThemeConfig } from '../../types';
import { buildTecnicoList, getLevel, LEVELS, type OdooCurso, type Tecnico } from './shared';
import RutasEditor from './RutasEditor';

interface Props { theme: ThemeConfig }

const GREEN = '#00C896';
const DIM   = '#6b7280';

// ── Mini componentes ──────────────────────────────────────────────────────────
function KPICard({ label, value, sub, color = GREEN }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 24px' }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      <p style={{ margin: '8px 0 0', fontSize: 36, fontWeight: 800, color, lineHeight: 1, letterSpacing: -1 }}>{value}</p>
      {sub && <p style={{ margin: '6px 0 0', fontSize: 12, color: DIM }}>{sub}</p>}
    </div>
  );
}

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
type Tab = 'dashboard' | 'leaderboard' | 'cursos' | 'plazas' | 'areas';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard',   label: 'Dashboard',   icon: '📊' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { id: 'cursos',      label: 'Cursos',      icon: '📚' },
  { id: 'areas',       label: 'Por Área',    icon: '🏢' },
  { id: 'plazas',      label: 'Por Plaza',   icon: '🗺️' },
];

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

// ── Dashboard Tab ─────────────────────────────────────────────────────────────
function TabDashboard({ cursos, tecnicos }: { cursos: OdooCurso[]; tecnicos: Tecnico[] }) {
  const levelDist = useMemo(() => {
    const dist: Record<string, number> = {};
    for (const t of tecnicos) dist[t.level] = (dist[t.level] ?? 0) + 1;
    return LEVELS.map(l => ({ name: l.name, icon: l.icon, color: l.color, count: dist[l.name] ?? 0 }));
  }, [tecnicos]);

  const avgGlobal = tecnicos.length
    ? Math.round(tecnicos.reduce((a, t) => a + t.avgPct, 0) / tecnicos.length * 10) / 10
    : 0;

  const cursosRezago = useMemo(() =>
    [...cursos].sort((a, b) => a.avg_completion - b.avg_completion).slice(0, 5),
    [cursos]
  );

  const expertosMas = tecnicos.filter(t => ['Experto', 'Leyenda'].includes(t.level)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KPICard label="Personas en Academia" value={tecnicos.length} sub="Toda la organización" />
        <KPICard label="Avance global"      value={`${avgGlobal}%`}   sub="Promedio todos los cursos" color="#4FC3F7" />
        <KPICard label="Cursos activos"     value={cursos.filter(c => c.published).length} sub={`de ${cursos.length} totales`} color="#7c3aed" />
        <KPICard label="Experto + Leyenda"  value={expertosMas}       sub={`${Math.round(expertosMas / (tecnicos.length || 1) * 100)}% del equipo`} color="#FFB703" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Distribución de niveles */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
          <p style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>Distribución de Niveles</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={levelDist} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: DIM }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: DIM }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                formatter={(v: number) => [`${v} técnicos`, '']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {levelDist.map((l, i) => <Cell key={i} fill={l.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cursos con más rezago */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
          <p style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>Cursos con Más Rezago</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {cursosRezago.map((c, i) => {
              const color = c.avg_completion < 30 ? '#FF4757' : c.avg_completion < 60 ? '#FFB703' : GREEN;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{c.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{c.avg_completion}%</span>
                  </div>
                  <Bar2 pct={c.avg_completion} color={color} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top 10 rápido */}
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
        <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>Top 10 Técnicos</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {tecnicos.slice(0, 10).map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#0d1117', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? '#FFB703' : DIM, width: 20, textAlign: 'center' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f3f4f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: DIM }}>{t.cursos} cursos · {t.level}</p>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: t.levelColor }}>{t.avgPct}%</span>
            </div>
          ))}
        </div>
      </div>
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
  const [tab, setTab]             = useState<Tab>('dashboard');
  const [cursos, setCursos]       = useState<OdooCurso[]>([]);
  const [plazaMapa, setPlazaMapa] = useState<Record<string, string> | undefined>(undefined);
  const [areaMapa, setAreaMapa]   = useState<Record<string, string> | undefined>(undefined);
  const [plazas, setPlazas]       = useState<string[]>([]);
  const [areas, setAreas]         = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showRutasEditor, setShowRutasEditor] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/academia/cursos`).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/api/academia/tecnicos-plaza`).then(r => r.ok ? r.json() : null),
    ]).then(([cs, pd]) => {
      setCursos(cs ?? []);
      if (pd?.mapa) {
        setPlazaMapa(pd.mapa);
        setPlazas(pd.plazas ?? []);
      }
      if (pd?.mapa_area) {
        setAreaMapa(pd.mapa_area);
        setAreas(pd.areas ?? []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Toda la organización inscrita en cursos, enriquecida con plaza y área
  const tecnicos = useMemo(() => buildTecnicoList(cursos, plazaMapa, areaMapa), [cursos, plazaMapa, areaMapa]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: DIM }}>
      <div style={{ width: 18, height: 18, border: `2px solid ${GREEN}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      Cargando datos de Odoo eLearning...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
          <button key={t.id} onClick={() => setTab(t.id)}
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
        {tab === 'dashboard'   && <TabDashboard cursos={cursos} tecnicos={tecnicos} />}
        {tab === 'leaderboard' && <TabLeaderboard tecnicos={tecnicos} plazas={plazas} areas={areas} />}
        {tab === 'cursos'      && <TabCursos cursos={cursos} />}
        {tab === 'areas'       && <TabAreas tecnicos={tecnicos} areas={areas} />}
        {tab === 'plazas'      && <TabPlazas tecnicos={tecnicos} plazas={plazas} />}
      </div>
    </div>
  );
}
