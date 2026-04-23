import { ChevronRight, AlertTriangle, Activity, MapPin } from 'lucide-react';
import { CASA_TENANTS } from '@/types/tenant';
import { getAllCasaData } from '@/services/nocboard';
import { TENANT_COLORS } from '@/data/noc-mock';

interface TenantGridProps {
  onSelectTenant: (tenantId: string) => void;
}


export function TenantGrid({ onSelectTenant }: TenantGridProps) {
  const allData = getAllCasaData();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-wider text-[#64748b]">
          Redes monitoreadas · click para ver detalle
        </p>
        <span className="text-[10px] text-[#64748b] font-mono">
          {CASA_TENANTS.length} empresas
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {CASA_TENANTS.map(t => {
          const td = allData[t.id];
          if (!td) return null;
          const totalHosts = td.cities.reduce((a, c) => a + c.totalHosts, 0);
          const online = td.cities.reduce((a, c) => a + c.online, 0);
          const offline = td.cities.reduce((a, c) => a + c.offline, 0);
          const alerts = td.cities.reduce((a, c) => a + c.alerts, 0);
          const avgScore = td.cities.length > 0
            ? Math.round(td.cities.reduce((a, c) => a + c.score, 0) / td.cities.length)
            : 0;
          const color = TENANT_COLORS[t.id] || '#00B4D8';
          const scoreColor = avgScore >= 85 ? '#00C896' : avgScore >= 60 ? '#FFB703' : '#FF4D6D';

          return (
            <button
              key={t.id}
              onClick={() => onSelectTenant(t.id)}
              className="group text-left bg-[#1A2B3C] hover:bg-[#1E3A4A] rounded-lg border border-[#1E3A4A] hover:border-[#00B4D8]/40 p-4 transition-all duration-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[13px] font-semibold text-[#e2e8f0]">{t.name}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-[#64748b] group-hover:text-[#00B4D8] transition-colors" />
              </div>

              {/* Score */}
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-2xl font-mono font-bold" style={{ color: scoreColor }}>
                  {avgScore}
                </span>
                <span className="text-[10px] text-[#64748b]">score</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-[#00C896]" />
                  <span className="font-mono text-[#e2e8f0]">{online}</span>
                  <span className="text-[#64748b]">/{totalHosts}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" style={{ color: alerts > 0 ? '#FF4D6D' : '#64748b' }} />
                  <span className="font-mono" style={{ color: alerts > 0 ? '#FF4D6D' : '#64748b' }}>
                    {alerts}
                  </span>
                  <span className="text-[#64748b]">alertas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-[#64748b]" />
                  <span className="font-mono text-[#e2e8f0]">{td.cities.length}</span>
                  <span className="text-[#64748b]">ciudades</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 inline-flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D6D]" />
                  </span>
                  <span className="font-mono text-[#FF4D6D]">{offline}</span>
                  <span className="text-[#64748b]">offline</span>
                </div>
              </div>

            </button>
          );
        })}
      </div>
    </div>
  );
}
