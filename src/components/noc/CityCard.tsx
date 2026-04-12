import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { NOCCity } from '@/types/noc';
import { ScoreCircle } from './ScoreCircle';

interface CityCardProps {
  city: NOCCity;
  tenantName?: string;
  tenantColor?: string;
}

export function CityCard({ city, tenantName, tenantColor }: CityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const healthPct = city.totalHosts > 0 ? (city.online / city.totalHosts) * 100 : 0;

  return (
    <div className="bg-[#1A2B3C] rounded-lg border border-[#1E3A4A] overflow-hidden transition-all duration-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-[#1E3A4A]/50 transition-colors duration-200"
      >
        {expanded ? <ChevronDown className="h-4 w-4 text-[#64748b]" /> : <ChevronRight className="h-4 w-4 text-[#64748b]" />}
        <ScoreCircle score={city.score} size={36} strokeWidth={3} />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#e2e8f0]">{city.name}</span>
            {tenantName && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${tenantColor}20`, color: tenantColor }}>
                {tenantName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[11px] text-[#00C896]">{city.online} online</span>
            <span className="text-[11px] text-[#FF4D6D]">{city.offline} offline</span>
            {city.alerts > 0 && <span className="text-[11px] text-[#FFB703]">{city.alerts} alertas</span>}
          </div>
        </div>
        {/* Health bar */}
        <div className="w-24 h-2 bg-[#0D1B2A] rounded-full overflow-hidden">
          <div className="h-full bg-[#00C896] rounded-full transition-all duration-500" style={{ width: `${healthPct}%` }} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#1E3A4A] p-3 space-y-2">
          {city.sites.map(site => (
            <div key={site.id} className="bg-[#0D1B2A] rounded-lg p-3">
              <p className="text-[11px] font-medium text-[#e2e8f0] mb-2">{site.name}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-[#64748b] text-[9px] uppercase tracking-wider">
                      <th className="text-left py-1 px-2">Host</th>
                      <th className="text-left py-1 px-2">IP</th>
                      <th className="text-center py-1 px-2">Score</th>
                      <th className="text-center py-1 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {site.hosts.map(host => (
                      <tr key={host.id} className="border-t border-[#1E3A4A]/50">
                        <td className="py-1.5 px-2 font-mono text-[#e2e8f0]">{host.name}</td>
                        <td className="py-1.5 px-2 font-mono text-[#64748b]">{host.ip}</td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold" style={{
                          color: host.score >= 85 ? '#00C896' : host.score >= 60 ? '#FFB703' : '#FF4D6D'
                        }}>{host.score}</td>
                        <td className="py-1.5 px-2 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                            host.status === 'online' ? 'bg-[#00C896]/10 text-[#00C896]'
                            : host.status === 'degraded' ? 'bg-[#FFB703]/10 text-[#FFB703]'
                            : 'bg-[#FF4D6D]/10 text-[#FF4D6D]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              host.status === 'offline' ? 'animate-pulse' : ''
                            }`} style={{
                              backgroundColor: host.status === 'online' ? '#00C896' : host.status === 'degraded' ? '#FFB703' : '#FF4D6D'
                            }} />
                            {host.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
