import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#FB923C';
const ORANGE_MUTED = 'rgba(251,146,60,0.12)';
const ORANGE_BORDER = 'rgba(251,146,60,0.25)';
const CARD_BG = 'rgba(15,28,52,0.8)';

const kpis = [
  { label: 'Uptime del mes', value: '99.8%', icon: '▲', trend: '+0.1%' },
  { label: 'Tickets abiertos', value: '2', icon: '◷', trend: '-1 vs semana pasada' },
  { label: 'Último incidente', value: 'hace 12 días', icon: '◉', trend: 'sin incidentes recientes' },
];

const mockIncidents = [
  {
    fecha: '08 May 2026',
    descripcion: 'Interrupción enlace principal',
    duracion: '23 min',
    estatus: 'Resuelto',
  },
  {
    fecha: '20 Abr 2026',
    descripcion: 'Latencia elevada región norte',
    duracion: '45 min',
    estatus: 'Resuelto',
  },
  {
    fecha: '05 Abr 2026',
    descripcion: 'Pérdida de paquetes intermitente',
    duracion: '12 min',
    estatus: 'Resuelto',
  },
  {
    fecha: '22 Mar 2026',
    descripcion: 'Actualización de firmware programada',
    duracion: '30 min',
    estatus: 'Resuelto',
  },
  {
    fecha: '10 Mar 2026',
    descripcion: 'Fallo de energía en nodo secundario',
    duracion: '1h 10 min',
    estatus: 'Resuelto',
  },
];

export default function ClienteHome() {
  const { profile } = useAuth();
  const companyName =
    (profile as unknown as { company_name?: string })?.company_name ||
    profile?.display_name ||
    'su empresa';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
          Panel de {companyName}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          Resumen de conectividad y servicios activos
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl p-5 border"
            style={{
              backgroundColor: CARD_BG,
              borderColor: ORANGE_BORDER,
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>
                {kpi.label}
              </span>
              <span style={{ color: ORANGE, fontSize: '18px' }}>{kpi.icon}</span>
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: ORANGE }}>
              {kpi.value}
            </p>
            <p className="text-xs" style={{ color: '#64748b' }}>
              {kpi.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Incidents Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: CARD_BG,
          borderColor: ORANGE_BORDER,
        }}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: ORANGE_BORDER }}
        >
          <h2 className="text-base font-semibold" style={{ color: '#e2e8f0' }}>
            Últimos incidentes
          </h2>
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              backgroundColor: ORANGE_MUTED,
              color: ORANGE,
              border: `1px solid ${ORANGE_BORDER}`,
            }}
          >
            Últimos 5
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${ORANGE_BORDER}` }}>
                {['Fecha', 'Descripción', 'Duración', 'Estatus'].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#64748b' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockIncidents.map((row, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: i < mockIncidents.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none',
                  }}
                >
                  <td className="px-6 py-3 font-mono text-xs" style={{ color: '#94a3b8' }}>
                    {row.fecha}
                  </td>
                  <td className="px-6 py-3" style={{ color: '#e2e8f0' }}>
                    {row.descripcion}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs" style={{ color: '#94a3b8' }}>
                    {row.duracion}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: 'rgba(34,197,94,0.12)',
                        color: '#4ade80',
                        border: '1px solid rgba(34,197,94,0.25)',
                      }}
                    >
                      {row.estatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
