import { CASA_TENANTS } from '@/types/tenant';
import { getAllCasaData } from '@/services/nocboard';

export function BenchmarkTable() {
  const allData = getAllCasaData();

  const rows = CASA_TENANTS.map(t => {
    const td = allData[t.id];
    if (!td) return null;
    const hosts = td.cities.reduce((a, c) => a + c.totalHosts, 0);
    const online = td.cities.reduce((a, c) => a + c.online, 0);
    const alerts = td.cities.reduce((a, c) => a + c.alerts, 0);
    const avgScore = td.cities.length > 0
      ? Math.round(td.cities.reduce((a, c) => a + c.score, 0) / td.cities.length)
      : 0;
    const uptime = hosts > 0 ? ((online / hosts) * 100).toFixed(1) : '0';
    return { name: t.name, hosts, uptime, alerts, score: avgScore };
  }).filter(Boolean);

  return (
    <div className="bg-[#1A2B3C] rounded-lg border border-[#1E3A4A] p-4">
      <p className="text-[11px] uppercase tracking-wider text-[#64748b] mb-3">Benchmarking — Empresas Casa</p>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-[#64748b] text-[9px] uppercase tracking-wider border-b border-[#1E3A4A]">
            <th className="text-left py-2 px-3">Empresa</th>
            <th className="text-center py-2 px-3">Hosts</th>
            <th className="text-center py-2 px-3">Uptime %</th>
            <th className="text-center py-2 px-3">Alertas</th>
            <th className="text-center py-2 px-3">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.name} className="border-t border-[#1E3A4A]/50 hover:bg-[#0D1B2A]/50">
              <td className="py-2.5 px-3 font-medium text-[#e2e8f0]">{r.name}</td>
              <td className="py-2.5 px-3 text-center font-mono text-[#64748b]">{r.hosts}</td>
              <td className="py-2.5 px-3 text-center font-mono" style={{ color: parseFloat(r.uptime) >= 95 ? '#00C896' : '#FFB703' }}>{r.uptime}%</td>
              <td className="py-2.5 px-3 text-center font-mono" style={{ color: r.alerts > 0 ? '#FF4D6D' : '#64748b' }}>{r.alerts}</td>
              <td className="py-2.5 px-3 text-center font-mono font-bold" style={{ color: r.score >= 85 ? '#00C896' : r.score >= 60 ? '#FFB703' : '#FF4D6D' }}>{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
