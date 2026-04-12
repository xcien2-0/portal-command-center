import { NOCCity } from '@/types/noc';
import { TENANT_COLORS } from '@/data/noc-mock';

interface MexicoMapProps {
  cities: Array<NOCCity & { tenantId?: string }>;
  selectedCityId: string | null;
  onCityClick: (cityId: string) => void;
  isGlobal?: boolean;
}

// Simplified mercator projection for Mexico
const projectToSVG = (lat: number, lng: number): { x: number; y: number } => {
  const minLng = -118, maxLng = -86, minLat = 14, maxLat = 33;
  const x = ((lng - minLng) / (maxLng - minLng)) * 500 + 20;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 350 + 20;
  return { x, y };
};

export function MexicoMap({ cities, selectedCityId, onCityClick, isGlobal }: MexicoMapProps) {
  return (
    <div className="bg-[#1A2B3C] rounded-lg border border-[#1E3A4A] p-4 h-full min-h-[400px]">
      <p className="text-[11px] uppercase tracking-wider text-[#64748b] mb-3">Mapa de Cobertura</p>
      <svg viewBox="0 0 540 390" className="w-full h-auto">
        {/* Mexico outline simplified */}
        <path
          d="M60,120 L100,80 L180,60 L260,50 L340,55 L400,70 L440,100 L460,140 L470,180 L450,220 L420,260 L380,290 L340,310 L300,330 L260,340 L220,335 L180,320 L140,290 L120,260 L80,230 L60,200 L50,160 Z"
          fill="#0D1B2A" stroke="#1E3A4A" strokeWidth="1.5"
        />
        {/* City markers */}
        {cities.map(city => {
          const { x, y } = projectToSVG(city.lat, city.lng);
          const color = isGlobal && city.tenantId
            ? TENANT_COLORS[city.tenantId] || '#00B4D8'
            : city.score >= 85 ? '#00C896' : city.score >= 60 ? '#FFB703' : '#FF4D6D';
          const isSelected = selectedCityId === city.id;

          return (
            <g key={city.id} onClick={() => onCityClick(city.id)} className="cursor-pointer">
              {/* Pulse ring for offline hosts */}
              {city.offline > 0 && (
                <circle cx={x} cy={y} r={14} fill="none" stroke={color} strokeWidth="1" opacity="0.4">
                  <animate attributeName="r" from="10" to="20" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={x} cy={y} r={isSelected ? 10 : 7} fill={color} opacity={isSelected ? 1 : 0.85}
                className="transition-all duration-200" />
              <circle cx={x} cy={y} r={3} fill="#0D1B2A" />
              <text x={x} y={y - 14} textAnchor="middle" className="fill-[#e2e8f0] text-[9px] font-medium">
                {city.name}
              </text>
              {isSelected && (
                <circle cx={x} cy={y} r={13} fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.5" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
