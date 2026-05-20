import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ORANGE = '#FB923C';
const CARD_BG = '#0f1f38';
const BORDER = 'rgba(251,146,60,0.18)';
const TARGET = 99.5;

const SLA_DATA = [
  { mes: 'Dic 25', disponibilidad: 99.95 },
  { mes: 'Ene 26', disponibilidad: 99.72 },
  { mes: 'Feb 26', disponibilidad: 100.0 },
  { mes: 'Mar 26', disponibilidad: 99.61 },
  { mes: 'Abr 26', disponibilidad: 99.88 },
  { mes: 'May 26', disponibilidad: 99.78 },
];

const avgDisponibilidad =
  (SLA_DATA.reduce((s, d) => s + d.disponibilidad, 0) / SLA_DATA.length).toFixed(2);

interface TooltipPayloadEntry {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: '#0a1628', border: `1px solid ${BORDER}` }}
    >
      <div style={{ color: '#94a3b8' }}>{label}</div>
      <div className="font-bold mt-0.5" style={{ color: val >= TARGET ? '#4ade80' : '#f87171' }}>
        {val.toFixed(2)}%
      </div>
    </div>
  );
}

export default function ClienteSLA() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>
          Reportes SLA
        </h1>
        <Button
          onClick={handlePrint}
          variant="outline"
          className="flex items-center gap-2 text-sm"
          style={{
            borderColor: BORDER,
            color: ORANGE,
            backgroundColor: 'transparent',
          }}
        >
          <Download size={14} />
          Descargar PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Disponibilidad promedio', value: `${avgDisponibilidad}%`, color: '#4ade80' },
          { label: 'Incidentes (6 meses)', value: '3', color: ORANGE },
          { label: 'MTTR promedio', value: '45 min', color: '#94a3b8' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-5"
            style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
          >
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>
              {label}
            </div>
            <div className="text-3xl font-bold" style={{ color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>
            Disponibilidad Mensual
          </h2>
          <span className="text-xs" style={{ color: '#64748b' }}>
            Línea de meta:{' '}
            <span style={{ color: ORANGE }}>{TARGET}%</span>
          </span>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={SLA_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="mes"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              domain={[99.0, 100.1]}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={TARGET}
              stroke={ORANGE}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Meta ${TARGET}%`,
                position: 'insideTopRight',
                fill: ORANGE,
                fontSize: 10,
              }}
            />
            <Bar dataKey="disponibilidad" radius={[4, 4, 0, 0]}>
              {SLA_DATA.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.disponibilidad >= TARGET ? '#4ade80' : '#f87171'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="flex items-center gap-5 mt-3 justify-center text-xs" style={{ color: '#64748b' }}>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#4ade80' }} />
            Cumple SLA
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#f87171' }} />
            Incumple SLA
          </span>
        </div>
      </div>

      {/* Detail table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>
            Detalle por Mes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Mes', 'Disponibilidad', 'vs. Meta', 'Estatus'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs uppercase tracking-wider"
                    style={{ color: '#475569' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLA_DATA.map((row, i) => {
                const diff = (row.disponibilidad - TARGET).toFixed(2);
                const ok = row.disponibilidad >= TARGET;
                return (
                  <tr
                    key={row.mes}
                    style={{
                      borderBottom: i < SLA_DATA.length - 1 ? `1px solid rgba(251,146,60,0.08)` : 'none',
                    }}
                  >
                    <td className="px-5 py-3 font-medium" style={{ color: '#cbd5e1' }}>
                      {row.mes}
                    </td>
                    <td className="px-5 py-3 font-mono" style={{ color: ok ? '#4ade80' : '#f87171' }}>
                      {row.disponibilidad.toFixed(2)}%
                    </td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: ok ? '#4ade80' : '#f87171' }}>
                      {Number(diff) >= 0 ? '+' : ''}{diff}%
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: ok ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                          color: ok ? '#4ade80' : '#f87171',
                        }}
                      >
                        {ok ? 'Cumple' : 'Incumple'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
