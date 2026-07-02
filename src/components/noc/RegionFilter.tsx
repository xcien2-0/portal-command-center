import { CASA_TENANTS } from '@/types/tenant';
import { TENANT_COLORS } from '@/data/noc-mock';

export type Region = 'all' | 'norte' | 'centro' | 'sur';
export type NetworkType = 'all' | 'residencial' | 'empresarial' | 'rural';

// City → region mapping (simplified for MX)
export const CITY_REGION: Record<string, Region> = {
  mty: 'norte', pnegras: 'norte', saltillo: 'norte',
  qro: 'centro', cdmx: 'centro', gdl: 'centro',
};

// Tenant → network type
export const TENANT_NET_TYPE: Record<string, NetworkType> = {
  xcien: 'empresarial',
  isp1: 'residencial',
  luminet: 'empresarial',
  huus: 'residencial',
  sandur: 'residencial',
};

interface FilterBarProps {
  selectedTenants: Set<string>;
  region: Region;
  netType: NetworkType;
  onToggleTenant: (id: string) => void;
  onRegionChange: (r: Region) => void;
  onNetTypeChange: (n: NetworkType) => void;
  onClear: () => void;
}

export function RegionFilter({
  selectedTenants, region, netType,
  onToggleTenant, onRegionChange, onNetTypeChange, onClear,
}: FilterBarProps) {
  const hasFilters = selectedTenants.size > 0 || region !== 'all' || netType !== 'all';

  return (
    <div className="bg-[#1A2B3C] rounded-lg border border-[#1E3A4A] p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-[#64748b] mr-1">Empresa:</span>
        {CASA_TENANTS.map(t => {
          const active = selectedTenants.has(t.id);
          const color = TENANT_COLORS[t.id] || '#00B4D8';
          return (
            <button
              key={t.id}
              onClick={() => onToggleTenant(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                active ? 'bg-[#0D1B2A] border' : 'bg-transparent border border-[#1E3A4A] text-[#64748b] hover:text-[#e2e8f0]'
              }`}
              style={active ? { borderColor: color, color } : undefined}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              {t.name}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase tracking-wider text-[#64748b] mr-1">Región:</span>
          {(['all', 'norte', 'centro', 'sur'] as Region[]).map(r => (
            <button
              key={r}
              onClick={() => onRegionChange(r)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                region === r ? 'bg-[#00B4D8]/15 text-[#00B4D8]' : 'text-[#64748b] hover:text-[#e2e8f0]'
              }`}
            >
              {r === 'all' ? 'Todas' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-[#1E3A4A]" />

        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase tracking-wider text-[#64748b] mr-1">Tipo:</span>
          {(['all', 'residencial', 'empresarial', 'rural'] as NetworkType[]).map(n => (
            <button
              key={n}
              onClick={() => onNetTypeChange(n)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                netType === n ? 'bg-[#00B4D8]/15 text-[#00B4D8]' : 'text-[#64748b] hover:text-[#e2e8f0]'
              }`}
            >
              {n === 'all' ? 'Todas' : n.charAt(0).toUpperCase() + n.slice(1)}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button onClick={onClear} className="ml-auto text-[10px] text-[#FF4D6D] hover:underline">
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
