import { ThemeConfig } from '../types';
import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../../../config';

interface TareaResumen {
  id: number;
  nombre: string;
  etapa: string;
  deadline: string | null;
  creado: string;
}

interface Mensaje {
  id: number;
  autor: string;
  fecha: string;
  cuerpo: string;
  tipo: string;
}

interface EtapaDisponible { id: number; nombre: string; }

interface TareaDetalle {
  id: number;
  nombre: string;
  descripcion: string;
  etapa_id: number | null;
  etapa: string;
  tecnicos: { id: number; nombre: string }[];
  cliente: string | null;
  proyecto: string | null;
  prioridad: 'normal' | 'alta';
  deadline: string | null;
  creado: string;
  mensajes: Mensaje[];
  etapas_disponibles: EtapaDisponible[];
}

interface Tecnico {
  id: string;
  odoo_id: number;
  nombre: string;
  alias: string;
  rol: string;
  total: number;
  abiertos: number;
  cerrados: number;
  pct_resolucion: number;
  tareas: TareaResumen[];
}

// ── Task Detail Drawer ────────────────────────────────────────────────────────
function TareaDrawer({
  taskId, theme, onClose, onUpdated,
}: { taskId: number; theme: ThemeConfig; onClose: () => void; onUpdated: () => void }) {
  const [detalle, setDetalle] = useState<TareaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cambiandoEtapa, setCambiando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchDetalle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/wfm/bidrillas/tarea/${taskId}`);
      if (res.ok) setDetalle(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDetalle(); }, [taskId]);
  useEffect(() => {
    if (detalle) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detalle?.mensajes.length]);

  const enviarComentario = async () => {
    if (!comentario.trim()) return;
    setEnviando(true);
    try {
      await fetch(`${API_BASE}/api/wfm/bidrillas/tarea/${taskId}/comentario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuerpo: comentario }),
      });
      setComentario('');
      await fetchDetalle();
    } finally { setEnviando(false); }
  };

  const cambiarEtapa = async (etapa_id: number) => {
    setCambiando(true);
    try {
      await fetch(`${API_BASE}/api/wfm/bidrillas/tarea/${taskId}/etapa`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa_id }),
      });
      await fetchDetalle();
      onUpdated();
    } finally { setCambiando(false); }
  };

  const etapaColor = (e: string) => {
    const s = e.toLowerCase();
    if (s.includes('done') || s.includes('resuel')) return '#00C896';
    if (s.includes('visit') || s.includes('campo'))  return '#FF6B35';
    return '#00B4D8';
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', justifyContent: 'flex-end',
    }}>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      />

      {/* Drawer */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 560,
        background: theme.bg, borderLeft: `1px solid ${theme.border}`,
        display: 'flex', flexDirection: 'column', height: '100%',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
      }}>

        {/* Drawer header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading
              ? <div style={{ color: theme.dim, fontSize: 13 }}>Cargando...</div>
              : <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, lineHeight: 1.3 }}>
                  {detalle?.nombre}
                </div>
            }
            {detalle && (
              <div style={{ fontSize: 11, color: theme.dim, marginTop: 4 }}>
                {detalle.cliente && <span>👤 {detalle.cliente} · </span>}
                <span>��� {detalle.proyecto}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: theme.dim, fontSize: 20,
            cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Drawer body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {detalle && (
            <>
              {/* Meta strip */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: `${etapaColor(detalle.etapa)}20`, color: etapaColor(detalle.etapa),
                  border: `1px solid ${etapaColor(detalle.etapa)}50`,
                }}>{detalle.etapa}</span>
                {detalle.prioridad === 'alta' && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FFB70320', color: '#FFB703', border: '1px solid #FFB70350' }}>
                    ⚡ ALTA PRIORIDAD
                  </span>
                )}
                {detalle.deadline && (
                  <span style={{ fontSize: 10, color: theme.dim }}>
                    📅 {new Date(detalle.deadline).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Técnicos */}
              {detalle.tecnicos.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: theme.dim, marginBottom: 6, textTransform: 'uppercase' }}>Asignado a</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {detalle.tecnicos.map(t => (
                      <span key={t.id} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: `${theme.accent}15`, color: theme.accent, border: `1px solid ${theme.accent}40` }}>
                        👷 {t.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Descripción */}
              {detalle.descripcion && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: theme.dim, marginBottom: 6, textTransform: 'uppercase' }}>Descripción</div>
                  <div style={{
                    fontSize: 11, color: theme.text, lineHeight: 1.6,
                    background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                    padding: '10px 12px', border: `1px solid ${theme.border}`,
                    maxHeight: 180, overflowY: 'auto', whiteSpace: 'pre-wrap',
                  }}>
                    {detalle.descripcion}
                  </div>
                </div>
              )}

              {/* Cambiar etapa */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: theme.dim, marginBottom: 8, textTransform: 'uppercase' }}>Cambiar etapa</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {detalle.etapas_disponibles.map(e => {
                    const active = e.id === detalle.etapa_id;
                    const col    = etapaColor(e.nombre);
                    return (
                      <button
                        key={e.id}
                        onClick={() => !active && cambiarEtapa(e.id)}
                        disabled={active || cambiandoEtapa}
                        style={{
                          padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: active ? 700 : 400,
                          background: active ? `${col}25` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${active ? col : theme.border}`,
                          color: active ? col : theme.dim,
                          cursor: active ? 'default' : 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {active ? '● ' : ''}{e.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chatter */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: theme.dim, marginBottom: 8, textTransform: 'uppercase' }}>
                  Chatter Odoo ({detalle.mensajes.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                  {detalle.mensajes.length === 0 && (
                    <div style={{ fontSize: 11, color: theme.dim, textAlign: 'center', padding: 16 }}>Sin mensajes aún</div>
                  )}
                  {detalle.mensajes.map(m => (
                    <div key={m.id} style={{
                      padding: '10px 12px', borderRadius: 10,
                      background: m.tipo === 'comment'
                        ? `${theme.accent}08`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${m.tipo === 'comment' ? theme.accent + '30' : theme.border}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent }}>{m.autor}</span>
                        <span style={{ fontSize: 9, color: theme.dim }}>
                          {new Date(m.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: theme.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.cuerpo}</div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Comentario input — fixed at bottom */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${theme.border}`, background: theme.bg }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) enviarComentario(); }}
              placeholder="Escribe un comentario... (⌘↵ para enviar)"
              rows={2}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, resize: 'none',
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`,
                color: theme.text, fontSize: 12, fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button
              onClick={enviarComentario}
              disabled={enviando || !comentario.trim()}
              style={{
                padding: '0 16px', borderRadius: 8, border: 'none',
                background: comentario.trim() ? theme.accent : 'rgba(255,255,255,0.06)',
                color: comentario.trim() ? '#000' : theme.dim,
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                transition: 'all 0.15s', alignSelf: 'stretch',
              }}
            >
              {enviando ? '...' : '↑ Enviar'}
            </button>
          </div>
          <div style={{ fontSize: 9, color: theme.dim, marginTop: 4 }}>El comentario se publicará en Odoo Field Service</div>
        </div>
      </div>
    </div>
  );
}

// ── Desempeño Tab ─────────────────────────────────────────────────────────────
interface DesempenoTecnico {
  odoo_id: number; alias: string; nombre: string; rank: number;
  total: number; cerradas: number; abiertos: number; mensajes: number;
  pct_resolucion: number; pct_doc: number; pct_vol: number; pct_puntual: number;
  score: number;
  detalle: { resolucion_pts: number; doc_pts: number; volumen_pts: number };
}

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function DesempenoTab({ theme }: { theme: ThemeConfig }) {
  const [data, setData]       = useState<{ tecnicos: DesempenoTecnico[]; formula: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/wfm/bidrillas/desempeno`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: theme.dim }}>Calculando scores desde Odoo...</div>;
  if (!data)   return null;

  const MEDAL = ['🥇','🥈','🥉'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Formula badge */}
      <div style={{ fontSize: 10, color: theme.dim, padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${theme.border}`, display: 'inline-block', alignSelf: 'flex-start' }}>
        📐 {data.formula}
      </div>

      {/* Ranking cards */}
      {data.tecnicos.map(t => {
        const scoreColor = t.score >= 70 ? '#00C896' : t.score >= 40 ? '#FFB703' : '#FF4757';
        return (
          <div key={t.odoo_id} style={{
            background: theme.card, borderRadius: 16, padding: 22,
            border: `1px solid ${t.rank === 1 ? '#FFD70050' : theme.border}`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Gold shimmer for #1 */}
            {t.rank === 1 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #FFD700, #FFA500, #FFD700)' }} />}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
              {/* Rank + medal */}
              <div style={{ textAlign: 'center', minWidth: 48 }}>
                <div style={{ fontSize: 28 }}>{MEDAL[t.rank - 1] ?? `#${t.rank}`}</div>
                <div style={{ fontSize: 9, color: theme.dim, fontWeight: 700 }}>RANK</div>
              </div>

              {/* Name + score */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>{t.alias}</div>
                <div style={{ fontSize: 10, color: theme.dim }}>{t.nombre}</div>
              </div>

              {/* Score circle */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: `conic-gradient(${scoreColor} ${t.score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: theme.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{t.score}</div>
                  <div style={{ fontSize: 7, color: theme.dim }}>/ 100</div>
                </div>
              </div>
            </div>

            {/* Metrics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Tareas cerradas', val: t.cerradas,           color: '#00C896' },
                { label: 'Tasa resolución', val: `${t.pct_resolucion}%`, color: t.pct_resolucion > 30 ? '#00C896' : '#FFB703' },
                { label: 'Mensajes Odoo',   val: t.mensajes,            color: '#00B4D8' },
                { label: 'Abiertas',        val: t.abiertos,            color: t.abiertos > 20 ? '#FF4757' : '#FFB703' },
              ].map(k => (
                <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.val}</div>
                  <div style={{ fontSize: 8, color: theme.dim, fontWeight: 700, marginTop: 2 }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Score breakdown bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Tasa de resolución', pts: t.detalle.resolucion_pts, max: 35, pct: t.pct_resolucion, color: '#00C896', weight: '35%' },
                { label: 'Documentación',       pts: t.detalle.doc_pts,        max: 35, pct: t.pct_doc,        color: '#00B4D8', weight: '35%' },
                { label: 'Volumen completado',  pts: t.detalle.volumen_pts,    max: 30, pct: t.pct_vol,        color: '#FF6B35', weight: '30%' },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: theme.dim, fontWeight: 600 }}>{m.label} <span style={{ color: theme.dim, opacity: 0.6 }}>({m.weight})</span></span>
                    <span style={{ fontSize: 9, color: m.color, fontWeight: 700 }}>{m.pts} / {m.max} pts — {m.pct}%</span>
                  </div>
                  <ScoreBar value={m.pts} max={m.max} color={m.color} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ fontSize: 10, color: theme.dim, textAlign: 'center', padding: '8px 0' }}>
        Datos calculados en tiempo real desde Odoo Field Service · Actualización automática
      </div>
    </div>
  );
}


// ── Main Section ──────────────────────────────────────────────────────────────
export default function BidrillasSection({ theme }: { theme: ThemeConfig }) {
  const [tab, setTab]                 = useState<'cuadrillas' | 'desempeno'>('cuadrillas');
  const [tecnicos, setTecnicos]       = useState<Tecnico[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [selectedTask, setSelected]   = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/wfm/bidrillas`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTecnicos(data.tecnicos ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const now = Date.now();

  const etapaColor = (etapa: string) => {
    const e = etapa.toLowerCase();
    if (e.includes('done') || e.includes('resuel')) return '#00C896';
    if (e.includes('visit') || e.includes('campo'))  return '#FF6B35';
    return '#00B4D8';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: theme.text, margin: 0 }}>
            🔦 CUADRILLAS FIBRA ÓPTICA
          </h2>
          <p style={{ fontSize: 12, color: theme.dim, marginTop: 4 }}>
            Equipos de campo — datos en vivo desde Odoo Field Service
          </p>
        </div>
        <button onClick={fetchData} style={{ padding: '6px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${theme.border}`, color: theme.dim, fontSize: 11, cursor: 'pointer' }}>
          🔄 Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {([
          ['cuadrillas', '👷 Cuadrillas',   theme.accent],
          ['desempeno',  '🏆 Desempeño',    '#FFD700'],
        ] as const).map(([id, label, col]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === id ? 700 : 400,
            background: tab === id ? `${col}20` : 'rgba(255,255,255,0.04)',
            color: tab === id ? col : theme.dim,
            boxShadow: tab === id ? `0 0 0 1.5px ${col}50` : 'none',
            transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* Desempeño tab */}
      {tab === 'desempeno' && <DesempenoTab theme={theme} />}

      {loading && tab === 'cuadrillas' && <div style={{ textAlign: 'center', padding: 60, color: theme.dim }}>Conectando a Odoo Field Service...</div>}
      {error   && tab === 'cuadrillas' && <div style={{ padding: 16, borderRadius: 8, background: '#FF475710', color: '#FF4757', fontSize: 12 }}>Error: {error}</div>}

      {/* Tarjetas de técnicos */}
      {tab === 'cuadrillas' && !loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
          {tecnicos.map(t => (
            <div key={t.id} style={{
              background: theme.card, border: `1px solid ${theme.border}`,
              borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: theme.accent }} />

              {/* Header técnico */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: theme.accent, letterSpacing: 1, marginBottom: 4 }}>FIBRA ÓPTICA</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>{t.alias}</div>
                  <div style={{ fontSize: 11, color: theme.dim, marginTop: 2 }}>{t.nombre}</div>
                  <div style={{ fontSize: 10, color: theme.accent, marginTop: 2, fontWeight: 600 }}>{t.rol}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: t.abiertos > 10 ? '#FF4757' : '#FFB703' }}>{t.abiertos}</div>
                  <div style={{ fontSize: 9, color: theme.dim, fontWeight: 700 }}>ABIERTAS</div>
                </div>
              </div>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
                {[
                  { label: 'Total',      val: t.total,               color: theme.text },
                  { label: 'Cerradas',   val: t.cerrados,            color: '#00C896' },
                  { label: 'Resolución', val: `${t.pct_resolucion}%`, color: t.pct_resolucion > 50 ? '#00C896' : '#FFB703' },
                ].map(k => (
                  <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px', border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: k.color }}>{k.val}</div>
                    <div style={{ fontSize: 9, color: theme.dim, fontWeight: 700 }}>{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Barra resolución */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div style={{ width: `${Math.min(t.pct_resolucion, 100)}%`, height: '100%', background: t.pct_resolucion > 50 ? '#00C896' : '#FFB703', borderRadius: 2 }} />
                </div>
              </div>

              {/* Tareas abiertas — clickeables */}
              {t.tareas.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: theme.dim, marginBottom: 8, textTransform: 'uppercase' }}>Tareas activas</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {t.tareas.map(tarea => {
                      const col     = etapaColor(tarea.etapa);
                      const overdue = tarea.deadline && new Date(tarea.deadline).getTime() < now;
                      return (
                        <div
                          key={tarea.id}
                          onClick={() => setSelected(tarea.id)}
                          style={{
                            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.03)',
                            border: `1px solid ${theme.border}`,
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = col + '60'; (e.currentTarget as HTMLElement).style.background = col + '08'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = theme.border; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: `${col}20`, color: col, flexShrink: 0 }}>
                              {tarea.etapa}
                            </span>
                            {overdue && <span style={{ fontSize: 8, color: '#FF4757', fontWeight: 700, flexShrink: 0 }}>⚠️</span>}
                            <span style={{ fontSize: 10, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {tarea.nombre}
                            </span>
                            <span style={{ fontSize: 9, color: theme.dim, flexShrink: 0 }}>→</span>
                          </div>
                          {tarea.deadline && (
                            <div style={{ fontSize: 8, color: overdue ? '#FF4757' : theme.dim, marginTop: 3 }}>
                              📅 {new Date(tarea.deadline).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {t.tareas.length === 0 && (
                <div style={{ fontSize: 11, color: theme.dim, textAlign: 'center', padding: 12 }}>✅ Sin tareas abiertas</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nota */}
      <div style={{ background: 'rgba(0,180,216,0.05)', border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, fontSize: 12, color: theme.dim }}>
        🔦 <b style={{ color: theme.text }}>Bidrilla Fibra Óptica</b> — Iván y Marroquín. Datos en vivo desde <b>Odoo Field Service</b>.
        Haz clic en cualquier tarea para ver el detalle, comentar o cambiar etapa.
      </div>

      {/* Task Drawer */}
      {selectedTask !== null && (
        <TareaDrawer
          taskId={selectedTask}
          theme={theme}
          onClose={() => setSelected(null)}
          onUpdated={fetchData}
        />
      )}
    </div>
  );
}
