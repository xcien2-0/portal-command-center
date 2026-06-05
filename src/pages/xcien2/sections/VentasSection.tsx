import { useState } from 'react';
import { ThemeConfig } from '../types';
import { TrendingUp, Package, RefreshCw, DollarSign, X, ChevronRight } from 'lucide-react';

interface Props { theme: ThemeConfig }

// ── Raw data from Google Sheet (Resumen tab, 2026 cut) ────────────────────────
const KPI = [
  { label: 'Venta Total',       value: 1_104_196, color: '#00A859', icon: DollarSign,  desc: 'Suma de todas las operaciones del período' },
  { label: 'Recurrente',        value:   956_099, color: '#00B4D8', icon: RefreshCw,   desc: 'MRR generado por contratos activos' },
  { label: 'Venta de Equipo',   value:   116_116, color: '#F59E0B', icon: Package,     desc: 'Hardware vendido en el período' },
  { label: 'Eventual',          value:    31_980, color: '#a855f7', icon: TrendingUp,  desc: 'Ingresos no recurrentes y servicios eventuales' },
];

const TIPO_OP = [
  { label: 'Renovación',       monto: 502_333, ops: 63, color: '#00B4D8' },
  { label: 'Upsale',           monto: 434_975, ops: 45, color: '#00A859' },
  { label: 'Primera Venta',    monto: 383_844, ops: 52, color: '#3B82F6' },
  { label: 'Upgrade',          monto: 137_280, ops: 18, color: '#F59E0B' },
  { label: 'Venta de Equipo',  monto: 116_116, ops: 28, color: '#EC4899' },
  { label: 'Cambio Domicilio', monto:  28_668, ops: 11, color: '#8B5CF6' },
  { label: 'Decremento',       monto: -31_586, ops:  9, color: '#ef4444' },
  { label: 'Cortesía',         monto:       0, ops: 15, color: '#475569' },
];

const CATEGORIA = [
  { label: 'Dedicado',               ops: 99, color: '#00A859' },
  { label: 'Servicios Administrados',ops: 26, color: '#00B4D8' },
  { label: 'PYME',                   ops: 20, color: '#F59E0B' },
  { label: 'Satelital',              ops: 14, color: '#8B5CF6' },
];

const VELOCIDADES = [
  { label: '20 Mbps',  ops: 36, avg_ticket: 6_800,  color: '#3B82F6' },
  { label: '50 Mbps',  ops: 29, avg_ticket: 9_500,  color: '#00B4D8' },
  { label: '100 Mbps', ops: 32, avg_ticket: 12_200, color: '#00A859' },
  { label: '200 Mbps', ops: 18, avg_ticket: 16_400, color: '#F59E0B' },
  { label: '500 Mbps', ops: 11, avg_ticket: 24_620, color: '#EC4899' },
  { label: '1 Gbps',   ops:  7, avg_ticket: 23_000, color: '#a855f7' },
];

const CANAL = [
  { label: 'Venta Directa', ops: 130, color: '#00A859' },
  { label: 'EAC',            ops:  15, color: '#00B4D8' },
  { label: 'Distribuidor',   ops:  13, color: '#F59E0B' },
];

const PLAZO = [
  { label: '36 meses', ops: 109, color: '#00A859' },
  { label: '24 meses', ops:  24, color: '#00B4D8' },
  { label: '12 meses', ops:  23, color: '#F59E0B' },
  { label: 'Sin plazo',ops:   1, color: '#475569' },
];

const SUBPRODUCTO = [
  { label: 'Dedicado',            ops: 71, color: '#00A859' },
  { label: 'Dedicado / AD',       ops: 23, color: '#00B4D8' },
  { label: 'PYME',                ops: 20, color: '#F59E0B' },
  { label: 'Satelital',           ops: 14, color: '#8B5CF6' },
  { label: 'Telefonía',           ops:  7, color: '#EC4899' },
  { label: 'WiFi Administrado',   ops:  7, color: '#3B82F6' },
  { label: 'Alta Disponibilidad', ops:  6, color: '#a855f7' },
];

const ON_OFF = [
  { label: 'ON (activos)',  ops: 127, color: '#22c55e' },
  { label: 'OFF (inactivos)',ops: 24, color: '#ef4444' },
];

const MONTHLY_COHORT = [
  { mes: 'Ene 2026', habilitados: 23, mrr: 214_320, acumulado: 214_320 },
  { mes: 'Feb 2026', habilitados: 31, mrr: 289_410, acumulado: 503_730 },
  { mes: 'Mar 2026', habilitados: 27, mrr: 251_640, acumulado: 755_370 },
  { mes: 'Abr 2026', habilitados: 19, mrr: 178_290, acumulado: 933_660 },
  { mes: 'May 2026', habilitados: 28, mrr: 262_150, acumulado:1_195_810 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function HBar({ value, max, color, height = 8 }: { value: number; max: number; color: string; height?: number }) {
  const pct = Math.max(0, (value / max) * 100);
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: height, height, overflow: 'hidden', flex: 1 }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: height,
        background: color, transition: 'width 0.5s ease',
        boxShadow: `0 0 8px ${color}66`,
      }} />
    </div>
  );
}

// ── Drill-down modal ──────────────────────────────────────────────────────────
type DrillTarget = 'tipo_op' | 'categoria' | 'velocidades' | 'canal' | 'plazo' | 'subproducto' | 'cohort' | null;

function DrillModal({ target, theme, onClose }: { target: DrillTarget; theme: ThemeConfig; onClose: () => void }) {
  if (!target) return null;

  const T = theme;
  const titles: Record<NonNullable<DrillTarget>, string> = {
    tipo_op:    'Tipo de Operación — Detalle',
    categoria:  'Categoría de Producto — Detalle',
    velocidades:'Distribución por Velocidad',
    canal:      'Canal de Venta',
    plazo:      'Plazo Contractual',
    subproducto:'Sub-producto',
    cohort:     'Cohort Mensual — Habilitaciones',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 20, padding: 32, minWidth: 480, maxWidth: 680,
          maxHeight: '80vh', overflowY: 'auto',
          boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${T.accent}20`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: T.accent, margin: 0 }}>{titles[target]}</h3>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: T.dim, lineHeight: 1 }}
          ><X size={16} /></button>
        </div>

        {/* Content by target */}
        {target === 'tipo_op' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {TIPO_OP.map(row => {
              const maxAbs = Math.max(...TIPO_OP.map(r => Math.abs(r.monto)));
              return (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: T.text, fontWeight: 600 }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: 700 }}>{fmt(row.monto)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <HBar value={Math.abs(row.monto)} max={maxAbs} color={row.color} height={10} />
                    <span style={{ fontSize: 11, color: T.dim, minWidth: 40, textAlign: 'right' }}>{row.ops} ops</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {target === 'categoria' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: T.dim, fontSize: 11, letterSpacing: 1 }}>
                <th style={{ textAlign: 'left', padding: '0 0 10px', fontWeight: 600 }}>CATEGORÍA</th>
                <th style={{ textAlign: 'right', padding: '0 0 10px', fontWeight: 600 }}>OPS</th>
                <th style={{ textAlign: 'right', padding: '0 0 10px', fontWeight: 600 }}>%</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIA.map(row => {
                const total = CATEGORIA.reduce((s, r) => s + r.ops, 0);
                return (
                  <tr key={row.label} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 0', color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: row.color, display: 'inline-block', flexShrink: 0 }} />
                      {row.label}
                    </td>
                    <td style={{ textAlign: 'right', color: row.color, fontWeight: 700, padding: '10px 0' }}>{row.ops}</td>
                    <td style={{ textAlign: 'right', color: T.dim, padding: '10px 0' }}>{((row.ops / total) * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {target === 'velocidades' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
              {VELOCIDADES.map(v => (
                <div key={v.label} style={{
                  background: `${v.color}10`, border: `1px solid ${v.color}30`,
                  borderRadius: 12, padding: '12px 16px',
                }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: v.color, margin: 0 }}>{v.label}</p>
                  <p style={{ fontSize: 12, color: T.text, margin: '4px 0 2px' }}>{v.ops} operaciones</p>
                  <p style={{ fontSize: 11, color: T.dim, margin: 0 }}>Ticket prom: {fmt(v.avg_ticket)}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: T.dim, textAlign: 'center' }}>
              Total: {VELOCIDADES.reduce((s, v) => s + v.ops, 0)} operaciones · Ticket promedio general: {fmt(Math.round(VELOCIDADES.reduce((s, v) => s + v.avg_ticket * v.ops, 0) / VELOCIDADES.reduce((s, v) => s + v.ops, 0)))}
            </p>
          </div>
        )}

        {target === 'canal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {CANAL.map(row => {
              const total = CANAL.reduce((s, r) => s + r.ops, 0);
              return (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: T.text, fontWeight: 600 }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: 700 }}>{row.ops} ops ({((row.ops / total) * 100).toFixed(1)}%)</span>
                  </div>
                  <HBar value={row.ops} max={total} color={row.color} height={12} />
                </div>
              );
            })}
            <p style={{ fontSize: 11, color: T.dim, marginTop: 8 }}>
              Venta Directa domina con {((130 / 158) * 100).toFixed(0)}% del pipeline.
              Oportunidad de crecimiento en canal indirecto (EAC + Distribuidor = {((28 / 158) * 100).toFixed(0)}%).
            </p>
          </div>
        )}

        {target === 'plazo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PLAZO.map(row => {
              const total = PLAZO.reduce((s, r) => s + r.ops, 0);
              return (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: T.text, fontWeight: 600 }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: 700 }}>{row.ops} contratos ({((row.ops / total) * 100).toFixed(1)}%)</span>
                  </div>
                  <HBar value={row.ops} max={total} color={row.color} height={12} />
                </div>
              );
            })}
            <p style={{ fontSize: 11, color: T.dim, marginTop: 8 }}>
              El 69% de los contratos son a 36 meses — excelente retención de ingresos a largo plazo.
              VTC promedio 36M: {fmt(TIPO_OP.filter(t => t.monto > 0).reduce((s, t) => s + t.monto, 0) / 109 * 36)}.
            </p>
          </div>
        )}

        {target === 'subproducto' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SUBPRODUCTO.map(row => {
              const total = SUBPRODUCTO.reduce((s, r) => s + r.ops, 0);
              return (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: T.text }}>{row.label}</span>
                  <HBar value={row.ops} max={total} color={row.color} height={8} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.color, minWidth: 32, textAlign: 'right' }}>{row.ops}</span>
                </div>
              );
            })}
          </div>
        )}

        {target === 'cohort' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {MONTHLY_COHORT.map(row => {
                const maxMrr = Math.max(...MONTHLY_COHORT.map(r => r.mrr));
                return (
                  <div key={row.mes}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                      <span style={{ color: T.text, fontWeight: 600 }}>{row.mes}</span>
                      <span style={{ color: T.accent, fontWeight: 700 }}>{fmt(row.mrr)}</span>
                      <span style={{ color: T.dim }}>{row.habilitados} habilitados</span>
                    </div>
                    <HBar value={row.mrr} max={maxMrr} color={T.accent} height={10} />
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 20, padding: '14px 16px', background: `${T.accent}10`, borderRadius: 12, border: `1px solid ${T.accent}25` }}>
              <p style={{ fontSize: 12, color: T.text, margin: 0 }}>
                <strong style={{ color: T.accent }}>MRR acumulado al cierre:</strong> {fmt(MONTHLY_COHORT[MONTHLY_COHORT.length - 1].acumulado)}
              </p>
              <p style={{ fontSize: 11, color: T.dim, margin: '4px 0 0' }}>
                Total habilitaciones: {MONTHLY_COHORT.reduce((s, r) => s + r.habilitados, 0)} · Ticket promedio: {fmt(Math.round(MONTHLY_COHORT.reduce((s, r) => s + r.mrr, 0) / MONTHLY_COHORT.reduce((s, r) => s + r.habilitados, 0)))}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────
export default function VentasSection({ theme: T }: Props) {
  const [drill, setDrill] = useState<DrillTarget>(null);

  const panelStyle = {
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 16,
    padding: '20px 24px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const hoverBorder = { borderColor: `${T.accent}50`, boxShadow: `0 0 0 1px ${T.accent}25` };
  const [hov, setHov] = useState<string | null>(null);

  const panel = (id: string, target: DrillTarget, children: React.ReactNode, style?: React.CSSProperties) => (
    <div
      style={{ ...panelStyle, ...(hov === id ? hoverBorder : {}), ...style }}
      onClick={() => setDrill(target)}
      onDoubleClick={() => setDrill(target)}
      onMouseEnter={() => setHov(id)}
      onMouseLeave={() => setHov(null)}
      title="Haz clic para ver detalle"
    >
      {children}
    </div>
  );

  const maxTipoOp = Math.max(...TIPO_OP.map(r => Math.abs(r.monto)));
  const totalOps = TIPO_OP.reduce((s, r) => s + r.ops, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>Resumen de Ventas</h1>
        <p style={{ fontSize: 13, color: T.dim, margin: '4px 0 0' }}>
          Planeación · {totalOps} operaciones · Datos del Google Sheet · Haz clic en cualquier panel para desglose
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {KPI.map(k => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 16, padding: '18px 20px',
                borderTop: `3px solid ${k.color}`,
              }}
              title={k.desc}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: T.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>{k.label}</span>
                <Icon size={14} color={k.color} />
              </div>
              <p style={{ fontSize: 24, fontWeight: 800, color: k.color, margin: 0 }}>{fmt(k.value)}</p>
            </div>
          );
        })}
      </div>

      {/* Row 2: Tipo op (wide) + ON/OFF */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>

        {panel('tipo_op', 'tipo_op', (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>Tipo de Operación</h2>
                <p style={{ fontSize: 11, color: T.dim, margin: '2px 0 0' }}>{totalOps} ops · clic para desglose</p>
              </div>
              <ChevronRight size={16} color={T.dim} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TIPO_OP.map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: T.text, minWidth: 130 }}>{row.label}</span>
                  <HBar value={Math.abs(row.monto)} max={maxTipoOp} color={row.color} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: row.color, minWidth: 60, textAlign: 'right' }}>{fmt(row.monto)}</span>
                  <span style={{ fontSize: 10, color: T.dim, minWidth: 36, textAlign: 'right' }}>{row.ops}</span>
                </div>
              ))}
            </div>
          </>
        ))}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* ON/OFF */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 20px', flex: 1 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 16px' }}>Estado Servicios</h2>
            {ON_OFF.map(row => {
              const total = ON_OFF.reduce((s, r) => s + r.ops, 0);
              return (
                <div key={row.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: T.text }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: 700 }}>{row.ops} ({((row.ops / total) * 100).toFixed(0)}%)</span>
                  </div>
                  <HBar value={row.ops} max={total} color={row.color} height={10} />
                </div>
              );
            })}
            <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(34,197,94,0.07)', borderRadius: 10, border: '1px solid rgba(34,197,94,0.2)' }}>
              <p style={{ fontSize: 12, color: '#22c55e', margin: 0, fontWeight: 700 }}>
                {((127 / 151) * 100).toFixed(0)}% retención activa
              </p>
              <p style={{ fontSize: 10, color: T.dim, margin: '2px 0 0' }}>127 de 151 servicios recurrentes ON</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Categoría + Canal + Plazo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

        {panel('categoria', 'categoria', (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>Categoría Producto</h2>
              <ChevronRight size={16} color={T.dim} />
            </div>
            {CATEGORIA.map(row => {
              const total = CATEGORIA.reduce((s, r) => s + r.ops, 0);
              return (
                <div key={row.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: T.text }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: 700 }}>{row.ops}</span>
                  </div>
                  <HBar value={row.ops} max={total} color={row.color} height={8} />
                </div>
              );
            })}
          </>
        ))}

        {panel('canal', 'canal', (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>Canal de Venta</h2>
              <ChevronRight size={16} color={T.dim} />
            </div>
            {CANAL.map(row => {
              const total = CANAL.reduce((s, r) => s + r.ops, 0);
              return (
                <div key={row.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: T.text }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: 700 }}>{row.ops} ({((row.ops / total) * 100).toFixed(0)}%)</span>
                  </div>
                  <HBar value={row.ops} max={total} color={row.color} height={8} />
                </div>
              );
            })}
          </>
        ))}

        {panel('plazo', 'plazo', (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>Plazo Contractual</h2>
              <ChevronRight size={16} color={T.dim} />
            </div>
            {PLAZO.map(row => {
              const total = PLAZO.reduce((s, r) => s + r.ops, 0);
              return (
                <div key={row.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: T.text }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: 700 }}>{row.ops}</span>
                  </div>
                  <HBar value={row.ops} max={total} color={row.color} height={8} />
                </div>
              );
            })}
          </>
        ))}
      </div>

      {/* Row 4: Velocidades + Sub-producto */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {panel('velocidades', 'velocidades', (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>Velocidades Vendidas</h2>
                <p style={{ fontSize: 11, color: T.dim, margin: '2px 0 0' }}>Con ticket promedio por tier</p>
              </div>
              <ChevronRight size={16} color={T.dim} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {VELOCIDADES.map(row => {
                const maxOps = Math.max(...VELOCIDADES.map(r => r.ops));
                return (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: T.text, minWidth: 72 }}>{row.label}</span>
                    <HBar value={row.ops} max={maxOps} color={row.color} />
                    <span style={{ fontSize: 11, color: row.color, fontWeight: 700, minWidth: 26, textAlign: 'right' }}>{row.ops}</span>
                    <span style={{ fontSize: 10, color: T.dim, minWidth: 54, textAlign: 'right' }}>{fmt(row.avg_ticket)}</span>
                  </div>
                );
              })}
            </div>
          </>
        ))}

        {panel('subproducto', 'subproducto', (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>Sub-Producto</h2>
                <p style={{ fontSize: 11, color: T.dim, margin: '2px 0 0' }}>Desglose por familia de producto</p>
              </div>
              <ChevronRight size={16} color={T.dim} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SUBPRODUCTO.map(row => {
                const total = SUBPRODUCTO.reduce((s, r) => s + r.ops, 0);
                return (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: T.text, flex: 1 }}>{row.label}</span>
                    <HBar value={row.ops} max={total} color={row.color} height={7} />
                    <span style={{ fontSize: 11, color: row.color, fontWeight: 700, minWidth: 26, textAlign: 'right' }}>{row.ops}</span>
                  </div>
                );
              })}
            </div>
          </>
        ))}
      </div>

      {/* Row 5: Cohort */}
      {panel('cohort', 'cohort', (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>Cohort Mensual — MRR por Habilitaciones</h2>
              <p style={{ fontSize: 11, color: T.dim, margin: '2px 0 0' }}>Ingresos generados mes a mes</p>
            </div>
            <ChevronRight size={16} color={T.dim} />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 80 }}>
            {MONTHLY_COHORT.map(row => {
              const maxMrr = Math.max(...MONTHLY_COHORT.map(r => r.mrr));
              const heightPct = (row.mrr / maxMrr) * 100;
              return (
                <div key={row.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, color: T.accent, fontWeight: 700 }}>{fmt(row.mrr)}</span>
                  <div style={{
                    width: '100%', height: `${heightPct}%`, minHeight: 8,
                    background: `linear-gradient(180deg, ${T.accent}, ${T.accent}66)`,
                    borderRadius: '4px 4px 0 0',
                    boxShadow: `0 0 10px ${T.accent}44`,
                  }} />
                  <span style={{ fontSize: 9, color: T.dim }}>{row.mes.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 24, fontSize: 11, color: T.dim }}>
            <span>Total hab.: <strong style={{ color: T.text }}>{MONTHLY_COHORT.reduce((s, r) => s + r.habilitados, 0)}</strong></span>
            <span>MRR total: <strong style={{ color: T.accent }}>{fmt(MONTHLY_COHORT.reduce((s, r) => s + r.mrr, 0))}</strong></span>
            <span>Mejor mes: <strong style={{ color: T.text }}>Feb 2026</strong></span>
          </div>
        </>
      ), { cursor: 'pointer' })}

      {/* Drill modal */}
      <DrillModal target={drill} theme={T} onClose={() => setDrill(null)} />
    </div>
  );
}
