import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

interface Tarea {
  id: string; nombre: string; status: string; status_type: string;
  due_date: string | null; start_date: string | null; url: string;
  asignados: string[]; priority: string | null; priority_id: number;
}
interface Proyecto {
  code: string; nombre: string; color: string; list_id: string;
  prioridad: string; total: number; completadas: number;
  en_progreso: number; pct: number; tareas: Tarea[]; error?: string;
}
type SortMode = 'fecha' | 'prioridad' | 'status';

const PRIO_META: Record<string, { label: string; color: string }> = {
  urgente: { label: 'Urgente', color: '#EF4444' },
  alta:    { label: 'Alta',    color: '#F97316' },
  normal:  { label: 'Normal',  color: '#3B82F6' },
  baja:    { label: 'Baja',    color: '#6B7280' },
};
const PRIO_ORDER: Record<string, number> = { urgente: 0, alta: 1, normal: 2, baja: 3 };
const TASK_PRIO_COLOR: Record<number, string> = {
  1: '#EF4444', 2: '#F97316', 3: '#3B82F6', 4: '#6B7280', 0: '#444',
};

function fmt(ts: string | null) {
  if (!ts) return '—';
  const d = new Date(Number(ts));
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}
function isOverdue(ts: string | null) { return !!ts && Number(ts) < Date.now(); }

function Ring({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e1e1e" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={c} strokeDashoffset={c - (pct/100)*c} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset .6s ease' }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize={12} fontWeight="bold"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}>
        {pct}%
      </text>
    </svg>
  );
}

function sortTareas(t: Tarea[], m: SortMode): Tarea[] {
  return [...t].sort((a, b) => {
    if (m === 'fecha')     return Number(a.start_date ?? a.due_date ?? 9e15) - Number(b.start_date ?? b.due_date ?? 9e15);
    if (m === 'prioridad') return (a.priority_id || 99) - (b.priority_id || 99);
    return (a.status_type === 'closed' ? 1 : 0) - (b.status_type === 'closed' ? 1 : 0);
  });
}

export default function Plan2026Page() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [updating,  setUpdating]  = useState<string | null>(null);
  const [sort,      setSort]      = useState<SortMode>('fecha');
  const [lastSync,  setLastSync]  = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/api/proyectos2026/dashboard`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setProyectos(d.proyectos ?? []);
      setLastSync(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (taskId: string, status: string) => {
    setUpdating(taskId);
    try {
      await fetch(`${API_BASE}/api/proyectos2026/tarea/${taskId}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally { setUpdating(null); }
  };

  const sorted = [...proyectos].sort((a,b) => (PRIO_ORDER[a.prioridad]??9)-(PRIO_ORDER[b.prioridad]??9));
  const totalT = proyectos.reduce((a,p) => a+p.total, 0);
  const totalC = proyectos.reduce((a,p) => a+p.completadas, 0);
  const pctG   = totalT ? Math.round(totalC/totalT*100) : 0;

  return (
    <div style={{
      minHeight: '100vh', background: '#09090b', color: '#e5e7eb',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 56, borderBottom: '1px solid #1f2937',
        background: '#0d1117', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/portal" style={{ color: '#4b5563', fontSize: 12, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Portal
          </a>
          <div style={{ width: 1, height: 20, background: '#1f2937' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#f9fafb', letterSpacing: '-0.5px' }}>
              MESQUITE
            </span>
            <span style={{ color: '#1f2937', fontSize: 14 }}>·</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#d1d5db' }}>Plan de Trabajo 2026</span>
            <span style={{ color: '#4b5563', fontSize: 12 }}>Julio — Diciembre</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastSync && <span style={{ color: '#4b5563', fontSize: 11 }}>Sync {lastSync}</span>}
          <a href="https://app.clickup.com" target="_blank" rel="noreferrer"
            style={{ color: '#4b5563', fontSize: 11, textDecoration: 'none' }}>
            ClickUp ↗
          </a>
          <button onClick={load} disabled={loading}
            style={{ background: '#111827', border: '1px solid #374151', borderRadius: 8,
              color: '#9ca3af', padding: '6px 14px', cursor: 'pointer', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 6, opacity: loading ? 0.5 : 1 }}>
            <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
            Actualizar
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {loading && !proyectos.length && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div style={{ width: 36, height: 36, border: '3px solid #00A859',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {error && (
          <div style={{ background: '#1a0a0a', border: '1px solid #7f1d1d',
            borderRadius: 12, padding: 20, color: '#f87171', marginBottom: 24 }}>
            Error conectando con ClickUp: {error}
          </div>
        )}

        {proyectos.length > 0 && (
          <>
            {/* ── KPIs ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 28 }}>
              {[
                { label: 'Proyectos',     value: String(proyectos.length), color: '#00A859' },
                { label: 'Total fases',   value: String(totalT),           color: '#3b82f6' },
                { label: 'Completadas',   value: String(totalC),           color: '#22c55e' },
                { label: 'Pendientes',    value: String(totalT-totalC),    color: '#f59e0b' },
                { label: 'Avance global', value: `${pctG}%`,               color: '#a855f7' },
              ].map(k => (
                <div key={k.label} style={{ background: '#111827', border: `1px solid ${k.color}25`,
                  borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* ── Barra global ── */}
            <div style={{ background: '#111827', border: '1px solid #1f2937',
              borderRadius: 12, padding: '18px 22px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                <span>Avance consolidado</span>
                <span>{totalC} / {totalT} fases completadas · {pctG}%</span>
              </div>
              <div style={{ height: 8, background: '#1e1e1e', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, transition: 'width .7s ease',
                  width: `${pctG}%`, background: 'linear-gradient(90deg,#00A859,#00c46a)' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                {sorted.map(p => (
                  <div key={p.code} style={{ flex: 1, height: 4, background: '#1e1e1e',
                    borderRadius: 99, overflow: 'hidden' }} title={p.nombre}>
                    <div style={{ height: '100%', borderRadius: 99, background: p.color,
                      width: `${p.pct}%`, transition: 'width .5s' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                {sorted.map(p => (
                  <div key={p.code} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
                    <span style={{ color: '#9ca3af' }}>{p.nombre}</span>
                    <span style={{ color: p.color, fontWeight: 700 }}>{p.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Sort ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ color: '#6b7280', fontSize: 12 }}>Ordenar fases:</span>
              {(['fecha','prioridad','status'] as SortMode[]).map(m => (
                <button key={m} onClick={() => setSort(m)}
                  style={{
                    background: sort===m ? '#00A859' : '#111827',
                    border: `1px solid ${sort===m ? '#00A859' : '#374151'}`,
                    borderRadius: 20, color: sort===m ? '#000' : '#9ca3af',
                    padding: '4px 14px', cursor: 'pointer', fontSize: 11, fontWeight: sort===m ? 700 : 400,
                  }}>
                  {m==='fecha' ? '📅 Fecha' : m==='prioridad' ? '🔴 Prioridad' : '✅ Estado'}
                </button>
              ))}
            </div>

            {/* ── Cards ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sorted.map((p, idx) => {
                const open  = expandido === p.code;
                const pm    = PRIO_META[p.prioridad] ?? PRIO_META.normal;
                const pend  = p.tareas.filter(t => t.status_type !== 'closed').length;
                const tareas = sortTareas(p.tareas, sort);

                return (
                  <div key={p.code} style={{ background: '#111827', border: '1px solid #1f2937',
                    borderRadius: 16, overflow: 'hidden', transition: 'border-color .2s' }}>

                    <button onClick={() => setExpandido(open ? null : p.code)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                        padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer',
                        textAlign: 'left' }}>
                      <span style={{ color: '#374151', fontSize: 13, fontWeight: 800, width: 20 }}>
                        {idx+1}
                      </span>
                      <div style={{ width: 4, height: 48, borderRadius: 4, background: p.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, color: '#f9fafb', fontSize: 15 }}>{p.nombre}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px',
                            borderRadius: 20, background: pm.color+'22', color: pm.color }}>
                            {pm.label}
                          </span>
                          <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 'auto' }}>
                            {pend} pendientes · {p.completadas}/{p.total}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: '#1e1e1e', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 99, background: p.color,
                              width: `${p.pct}%`, transition: 'width .5s' }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#6b7280', flexShrink: 0 }}>{p.pct}%</span>
                        </div>
                      </div>
                      <Ring pct={p.pct} color={p.color} size={60} />
                      <span style={{ color: '#374151', fontSize: 20, transition: 'transform .2s',
                        transform: open ? 'rotate(90deg)' : 'none' }}>›</span>
                    </button>

                    {open && (
                      <div style={{ borderTop: '1px solid #1f2937' }}>
                        {/* Cabecera tabla */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 40px',
                          gap: 8, padding: '8px 22px', fontSize: 10, fontWeight: 700,
                          color: '#4b5563', textTransform: 'uppercase', letterSpacing: 1,
                          borderBottom: '1px solid #1a1a27' }}>
                          <span>Fase</span><span style={{textAlign:'center'}}>Fechas</span>
                          <span style={{textAlign:'center'}}>Estado</span><span/>
                        </div>

                        {tareas.length === 0 && (
                          <div style={{ padding: '16px 22px', color: '#4b5563', fontSize: 13 }}>
                            Sin fases registradas.
                          </div>
                        )}

                        {tareas.map((t, ti) => {
                          const closed  = t.status_type === 'closed';
                          const overdue = !closed && isOverdue(t.due_date);
                          const pc      = TASK_PRIO_COLOR[t.priority_id] ?? '#444';

                          return (
                            <div key={t.id} style={{
                              display: 'grid', gridTemplateColumns: '1fr 110px 110px 40px',
                              gap: 8, alignItems: 'center', padding: '10px 22px',
                              borderBottom: '1px solid #161622',
                              background: closed ? 'transparent' : overdue ? '#1f0a0a' :
                                ti%2===0 ? '#111827' : '#0f172a',
                              opacity: closed ? 0.45 : 1,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%',
                                  background: pc, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: closed?'#4b5563':'#f9fafb',
                                  textDecoration: closed?'line-through':'none',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {t.nombre}
                                </span>
                                {overdue && <span style={{ fontSize: 10, color: '#ef4444', flexShrink: 0 }}>vencida</span>}
                              </div>
                              <div style={{ textAlign: 'center', fontSize: 11, color: '#6b7280' }}>
                                {fmt(t.start_date)} → {fmt(t.due_date)}
                              </div>
                              <select value={t.status} disabled={updating===t.id}
                                onChange={e => updateStatus(t.id, e.target.value)}
                                style={{ background: '#0d1117', border: '1px solid #374151',
                                  borderRadius: 8, color: '#e5e7eb', padding: '4px 8px',
                                  fontSize: 11, cursor: 'pointer', width: '100%',
                                  opacity: updating===t.id ? 0.4 : 1 }}>
                                <option value="to do">⬜ Pendiente</option>
                                <option value="in progress">🔄 En progreso</option>
                                <option value="complete">✅ Completada</option>
                              </select>
                              {t.url
                                ? <a href={t.url} target="_blank" rel="noreferrer"
                                    style={{ color: '#374151', textAlign: 'center', fontSize: 16,
                                      textDecoration: 'none', display: 'block' }}
                                    title="Abrir en ClickUp">↗</a>
                                : <span/>}
                            </div>
                          );
                        })}

                        <div style={{ padding: '10px 22px', display: 'flex', justifyContent: 'flex-end' }}>
                          <a href={`https://app.clickup.com/90141376562/v/li/${p.list_id}`}
                            target="_blank" rel="noreferrer"
                            style={{ fontSize: 11, color: '#4b5563', textDecoration: 'none' }}>
                            Ver proyecto completo en ClickUp ↗
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
