import { useAuth } from '@/contexts/AuthContext';

const ORANGE = '#FB923C';
const CARD_BG = '#0f1f38';
const BORDER = 'rgba(251,146,60,0.18)';

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function KpiCard({ label, value, sub, color = ORANGE }: KpiCardProps) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: CARD_BG,
        border: `1px solid ${BORDER}`,
      }}
    >
      <div className="text-xs uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>
        {label}
      </div>
      <div className="text-3xl font-bold" style={{ color }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs mt-1" style={{ color: '#475569' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

const MOCK_INCIDENTS = [
  { fecha: '08 May 2026', descripcion: 'Degradación de servicio — Enlace principal', duracion: '28 min', estatus: 'Resuelto' },
  { fecha: '22 Abr 2026', descripcion: 'Pérdida de conectividad parcial', duracion: '14 min', estatus: 'Resuelto' },
  { fecha: '10 Abr 2026', descripcion: 'Alta latencia en router de borde', duracion: '6 min', estatus: 'Resuelto' },
  { fecha: '01 Abr 2026', descripcion: 'Mantenimiento programado', duracion: '2 h 00 min', estatus: 'Resuelto' },
  { fecha: '15 Mar 2026', descripcion: 'Interrupción de servicio de voz', duracion: '45 min', estatus: 'Resuelto' },
];

export default function ClienteHome() {
  const { profile } = useAuth();
  const companyName = profile?.company_name || profile?.display_name || 'Cliente';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>
          Bienvenido, <span style={{ color: ORANGE }}>{companyName}</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: '#475569' }}>
          Aquí tienes un resumen de tu servicio Sandur / XCIEN.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Uptime del mes"
          value="99.8%"
          sub="Meta SLA: 99.5%"
          color="#4ade80"
        />
        <KpiCard
          label="Tickets abiertos"
          value="2"
          sub="1 en proceso · 1 abierto"
          color={ORANGE}
        />
        <KpiCard
          label="Último incidente"
          value="Hace 12 días"
          sub="08 May 2026"
          color="#94a3b8"
        />
      </div>

      {/* Recent Incidents Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        <div
          className="px-5 py-4"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <h2 className="font-semibold" style={{ color: '#e2e8f0' }}>
            Últimos 5 Incidentes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Fecha', 'Descripción', 'Duración', 'Estatus'].map((h) => (
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
              {MOCK_INCIDENTS.map((inc, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: i < MOCK_INCIDENTS.length - 1 ? `1px solid rgba(251,146,60,0.08)` : 'none',
                  }}
                >
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: '#94a3b8' }}>
                    {inc.fecha}
                  </td>
                  <td className="px-5 py-3" style={{ color: '#cbd5e1' }}>
                    {inc.descripcion}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: '#94a3b8' }}>
                    {inc.duracion}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80' }}
                    >
                      {inc.estatus}
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
