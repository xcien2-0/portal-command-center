import { CASA_TENANTS } from '@/types/tenant';
import { getAllCasaData } from '@/services/nocboard';

export function GlobalMetrics() {
  const allData = getAllCasaData();
  let totalOnline = 0, totalOffline = 0, totalAlerts = 0, totalScore = 0, tenantCount = 0;

  Object.values(allData).forEach(td => {
    td.cities.forEach(c => {
      totalOnline += c.online;
      totalOffline += c.offline;
      totalAlerts += c.alerts;
      totalScore += c.score;
      tenantCount++;
    });
  });

  const avgUptime = tenantCount > 0 ? (totalScore / tenantCount).toFixed(1) : '0';

  const metrics = [
    { label: 'Hosts Online', value: totalOnline, color: '#00C896' },
    { label: 'Hosts Offline', value: totalOffline, color: '#FF4D6D' },
    { label: 'Alertas Activas', value: totalAlerts, color: '#FFB703' },
    { label: 'Score Promedio', value: `${avgUptime}%`, color: '#00B4D8' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="bg-[#1A2B3C] rounded-lg p-4 border border-[#1E3A4A]">
            <p className="text-[11px] uppercase tracking-wider text-[#64748b] mb-1">{m.label}</p>
            <p className="text-2xl font-mono font-bold" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>
      {/* Per-tenant uptime bars */}
      <div className="bg-[#1A2B3C] rounded-lg p-4 border border-[#1E3A4A]">
        <p className="text-[11px] uppercase tracking-wider text-[#64748b] mb-3">Uptime por empresa</p>
        <div className="space-y-2">
          {CASA_TENANTS.map(t => {
            const td = allData[t.id];
            if (!td) return null;
            const total = td.cities.reduce((a, c) => a + c.online + c.offline, 0);
            const online = td.cities.reduce((a, c) => a + c.online, 0);
            const pct = total > 0 ? ((online / total) * 100).toFixed(1) : '0';
            return (
              <div key={t.id} className="flex items-center gap-3">
                <span className="text-[12px] text-[#e2e8f0] w-24 font-medium">{t.name}</span>
                <div className="flex-1 h-2 bg-[#0D1B2A] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: '#00C896' }} />
                </div>
                <span className="text-[12px] font-mono text-[#64748b] w-14 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
