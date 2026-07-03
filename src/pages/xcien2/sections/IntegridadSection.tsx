import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../../config';
import { ThemeConfig } from '../types';
import {
  AlertTriangle, ShieldAlert, TrendingDown, Users,
  RefreshCw, ChevronDown, ChevronUp, DollarSign, Clock, Eye
} from 'lucide-react';

interface Props { theme: ThemeConfig }

type Riesgo = 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';

interface Flag   { tipo: Riesgo; label: string }
interface Nota   { autor: string; fecha: string; texto: string }
interface Alerta {
  id: number; nombre: string; cliente: string; vendedor: string;
  equipo: string; estado: string; fecha: string; dias: number;
  monto: number; sin_entrega: boolean; sin_factura: boolean;
  actores: string[]; flags: Flag[]; riesgo: Riesgo; score: number;
  notas: Nota[];
}
interface VendedorStat {
  vendedor: string; alertas: number; monto: number; criticos: number; score: number;
}
interface Resumen {
  total_analizadas: number; total_alertas: number;
  criticos: number; altos: number; medios: number; monto_en_riesgo: number;
}
interface ApiResp {
  ordenes: Alerta[]; ranking_vendedores: VendedorStat[]; resumen: Resumen; generado: string;
}

// ── Paleta ──────────────────────────────────────────────────────────────────
const RIESGO_STYLE: Record<Riesgo, { bg: string; text: string; border: string; label: string }> = {
  CRITICO: { bg: '#1f0a0a', text: '#f87171', border: '#ef4444', label: 'Crítico' },
  ALTO:    { bg: '#1a110a', text: '#fb923c', border: '#f97316', label: 'Alto'    },
  MEDIO:   { bg: '#1a1500', text: '#fbbf24', border: '#f59e0b', label: 'Medio'   },
  BAJO:    { bg: '#0a1a0f', text: '#4ade80', border: '#22c55e', label: 'Bajo'    },
};

const ESTADO_LABEL: Record<string, string> = {
  draft: 'Borrador', sent: 'Enviada', sale: 'Confirmada',
  done: 'Completada', cancel: 'Cancelada',
};

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ background: '#111827', border: `1px solid ${color}33`, borderRadius: 8, padding: '14px 18px' }}>
      <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontSize: 22, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: '#4b5563', fontSize: 10, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Badge riesgo ─────────────────────────────────────────────────────────────
function RiesgoBadge({ r }: { r: Riesgo }) {
  const s = RIESGO_STYLE[r];
  return (
    <span style={{
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
}

// ── Row expandible ────────────────────────────────────────────────────────────
function AlertRow({ a }: { a: Alerta }) {
  const [open, setOpen] = useState(false);
  const s = RIESGO_STYLE[a.riesgo];

  return (
    <div style={{ borderLeft: `3px solid ${s.border}`, background: '#0d1117', marginBottom: 4, borderRadius: '0 6px 6px 0' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'grid', gridTemplateColumns: '90px 1fr 1fr 90px 70px 80px 28px',
          gap: 8, alignItems: 'center', padding: '10px 14px', cursor: 'pointer',
          color: '#e5e7eb', fontSize: 12,
        }}
      >
        <div style={{ color: '#00A859', fontWeight: 700 }}>{a.nombre}</div>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.cliente}</div>
        <div style={{ color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.vendedor}</div>
        <div style={{ color: '#fbbf24', fontWeight: 600 }}>{fmt(a.monto)}</div>
        <div style={{ color: '#6b7280' }}>{a.dias}d</div>
        <RiesgoBadge r={a.riesgo} />
        <div style={{ color: '#6b7280', textAlign: 'center' }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid #1f2937' }}>
          {/* Flags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {a.flags.map((f, i) => (
              <span key={i} style={{
                background: RIESGO_STYLE[f.tipo as Riesgo]?.bg || '#111',
                color: RIESGO_STYLE[f.tipo as Riesgo]?.text || '#fff',
                border: `1px solid ${RIESGO_STYLE[f.tipo as Riesgo]?.border || '#333'}`,
                borderRadius: 4, padding: '2px 8px', fontSize: 10,
              }}>{f.tipo}: {f.label}</span>
            ))}
          </div>

          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10, fontSize: 11 }}>
            <div>
              <span style={{ color: '#6b7280' }}>Estado: </span>
              <span style={{ color: '#e5e7eb' }}>{ESTADO_LABEL[a.estado] || a.estado}</span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Fecha: </span>
              <span style={{ color: '#e5e7eb' }}>{a.fecha}</span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Equipo: </span>
              <span style={{ color: '#e5e7eb' }}>{a.equipo || '—'}</span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Entrega: </span>
              <span style={{ color: a.sin_entrega ? '#f87171' : '#4ade80' }}>
                {a.sin_entrega ? 'Sin entrega' : 'Con entrega'}
              </span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Factura: </span>
              <span style={{ color: a.sin_factura ? '#f87171' : '#4ade80' }}>
                {a.sin_factura ? 'Sin factura' : 'Facturada'}
              </span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Actores: </span>
              <span style={{ color: '#e5e7eb' }}>{a.actores.length > 0 ? a.actores.join(', ') : '—'}</span>
            </div>
          </div>

          {/* Chatter */}
          {a.notas.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 4 }}>Últimas notas del historial:</div>
              {a.notas.map((n, i) => (
                <div key={i} style={{
                  background: '#111827', borderRadius: 4, padding: '6px 10px',
                  marginBottom: 4, fontSize: 11,
                }}>
                  <span style={{ color: '#00A859' }}>{n.autor}</span>
                  <span style={{ color: '#4b5563', margin: '0 6px' }}>{n.fecha}</span>
                  <span style={{ color: '#d1d5db' }}>{n.texto}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function IntegridadSection({ theme }: Props) {
  const [data, setData]     = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [filtro, setFiltro] = useState<Riesgo | 'TODOS'>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [tab, setTab]       = useState<'ordenes' | 'vendedores'>('ordenes');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/api/integridad/comercial?dias_ventana=180`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const ordenesFiltradas = (data?.ordenes || []).filter(a => {
    if (filtro !== 'TODOS' && a.riesgo !== filtro) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return a.nombre.toLowerCase().includes(q) ||
             a.cliente.toLowerCase().includes(q) ||
             a.vendedor.toLowerCase().includes(q);
    }
    return true;
  });

  const res = data?.resumen;

  return (
    <div style={{ padding: 24, color: '#e5e7eb', fontFamily: 'monospace', minHeight: '100vh', background: '#060a0f' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f9fafb', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={20} color="#ef4444" /> Integridad Comercial
          </h2>
          <div style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>
            Detección de anomalías en órdenes de venta · últimos 180 días
            {data && <span style={{ marginLeft: 8, color: '#374151' }}>· actualizado {new Date(data.generado).toLocaleTimeString()}</span>}
          </div>
        </div>
        <button onClick={load} disabled={loading} style={{
          background: 'transparent', border: '1px solid #374151', color: '#9ca3af',
          borderRadius: 6, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
        }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Analizando...' : 'Actualizar'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#1f0a0a', border: '1px solid #ef4444', borderRadius: 6, padding: 12, marginBottom: 16, color: '#f87171', fontSize: 12 }}>
          Error: {error}
        </div>
      )}

      {/* KPIs */}
      {res && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
          <KpiCard label="Analizadas"       value={res.total_analizadas} color="#6b7280" />
          <KpiCard label="Con alertas"      value={res.total_alertas}    color="#fbbf24" />
          <KpiCard label="Críticos"         value={res.criticos}         color="#ef4444" />
          <KpiCard label="Altos"            value={res.altos}            color="#f97316" />
          <KpiCard label="Medios"           value={res.medios}           color="#fbbf24" />
          <KpiCard label="Monto en riesgo"  value={fmt(res.monto_en_riesgo)} color="#f87171"
            sub="valor total de órdenes con alerta" />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #1f2937' }}>
        {(['ordenes', 'vendedores'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'transparent', border: 'none', padding: '8px 20px', cursor: 'pointer',
            color: tab === t ? '#00A859' : '#6b7280', fontSize: 13,
            borderBottom: tab === t ? '2px solid #00A859' : '2px solid transparent',
            marginBottom: -1,
          }}>
            {t === 'ordenes' ? <><AlertTriangle size={13} style={{ marginRight: 5 }} />Órdenes ({data?.ordenes.length ?? 0})</> : <><Users size={13} style={{ marginRight: 5 }} />Por Vendedor</>}
          </button>
        ))}
      </div>

      {tab === 'ordenes' && (
        <>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {(['TODOS', 'CRITICO', 'ALTO', 'MEDIO'] as const).map(f => (
              <button key={f} onClick={() => setFiltro(f)} style={{
                background: filtro === f ? (f === 'TODOS' ? '#1f2937' : RIESGO_STYLE[f as Riesgo]?.bg) : 'transparent',
                border: `1px solid ${f === 'TODOS' ? '#374151' : RIESGO_STYLE[f as Riesgo]?.border || '#374151'}`,
                color: f === 'TODOS' ? '#9ca3af' : RIESGO_STYLE[f as Riesgo]?.text || '#9ca3af',
                borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
              }}>
                {f === 'TODOS' ? 'Todos' : RIESGO_STYLE[f as Riesgo]?.label}
              </button>
            ))}
            <input
              placeholder="Buscar orden, cliente, vendedor..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{
                background: '#111827', border: '1px solid #374151', borderRadius: 4,
                color: '#e5e7eb', padding: '4px 10px', fontSize: 11, width: 220,
              }}
            />
            <span style={{ color: '#4b5563', fontSize: 11, alignSelf: 'center' }}>
              {ordenesFiltradas.length} resultado{ordenesFiltradas.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Header tabla */}
          {ordenesFiltradas.length > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: '90px 1fr 1fr 90px 70px 80px 28px',
              gap: 8, padding: '6px 14px', color: '#4b5563', fontSize: 10,
              borderBottom: '1px solid #1f2937', marginBottom: 4,
            }}>
              <span>ORDEN</span><span>CLIENTE</span><span>VENDEDOR</span>
              <span>MONTO</span><span>DÍAS</span><span>RIESGO</span><span />
            </div>
          )}

          {loading && !data && (
            <div style={{ textAlign: 'center', color: '#4b5563', padding: 40, fontSize: 13 }}>
              Analizando órdenes de los últimos 180 días…
            </div>
          )}

          {!loading && ordenesFiltradas.length === 0 && data && (
            <div style={{ textAlign: 'center', color: '#4b5563', padding: 40, fontSize: 13 }}>
              No hay alertas con el filtro seleccionado.
            </div>
          )}

          {ordenesFiltradas.map(a => <AlertRow key={a.id} a={a} />)}
        </>
      )}

      {tab === 'vendedores' && (() => {
        const maxScore = Math.max(...(data?.ranking_vendedores || []).map(v => v.score), 1);
        return (
        <div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px 80px',
            gap: 8, padding: '6px 14px', color: '#4b5563', fontSize: 10,
            borderBottom: '1px solid #1f2937', marginBottom: 8,
          }}>
            <span>VENDEDOR</span><span>ALERTAS</span><span>MONTO RIESGO</span><span>CRÍTICOS</span><span>SCORE</span>
          </div>
          {(data?.ranking_vendedores || []).map((v, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px 80px',
              gap: 8, padding: '10px 14px', fontSize: 12,
              background: i % 2 === 0 ? '#0d1117' : '#060a0f',
              borderRadius: 4, marginBottom: 2, alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: i === 0 ? '#ef444433' : '#1f2937',
                  border: `1px solid ${i === 0 ? '#ef4444' : '#374151'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: i === 0 ? '#ef4444' : '#6b7280', fontWeight: 700,
                }}>{i + 1}</div>
                <span style={{ color: '#e5e7eb' }}>{v.vendedor}</span>
              </div>
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>{v.alertas}</span>
              <span style={{ color: '#f87171' }}>{fmt(v.monto)}</span>
              <span style={{ color: v.criticos > 0 ? '#ef4444' : '#4b5563', fontWeight: v.criticos > 0 ? 700 : 400 }}>
                {v.criticos}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  height: 6, width: Math.round((v.score / maxScore) * 50),
                  background: v.score >= 8 ? '#ef4444' : v.score >= 4 ? '#f97316' : '#fbbf24',
                  borderRadius: 3,
                }} />
                <span style={{ color: '#6b7280', fontSize: 10 }}>{v.score}</span>
              </div>
            </div>
          ))}
        </div>
        );
      })()}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
