import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { CASA_TENANTS } from '@/types/tenant';
import { NOCCity, NOCAlert } from '@/types/noc';
import { getAllCasaData, getNOCData, getAllAlerts, getAlertsForTenant, getTotalAlertCount } from '@/services/nocboard';
import { TENANT_COLORS } from '@/data/noc-mock';
import { GlobalMetrics } from '@/components/noc/GlobalMetrics';
import { MexicoMap } from '@/components/noc/MexicoMap';
import { CityCard } from '@/components/noc/CityCard';
import { BenchmarkTable } from '@/components/noc/BenchmarkTable';
import { AlertsDrawer } from '@/components/noc/AlertsDrawer';
import { CreateTicketModal } from '@/components/noc/CreateTicketModal';
import { TenantGrid } from '@/components/noc/TenantGrid';
import { RegionFilter, CITY_REGION, TENANT_NET_TYPE, type Region, type NetworkType } from '@/components/noc/RegionFilter';

const TENANT_SUBNOC_ROUTE: Record<string, string> = {
  iblack: '/iblack',
  coco: '/coco-monitor',
  xcien: '/noc-vip',
};

export default function NOC() {
  const navigate = useNavigate();
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [ticketAlert, setTicketAlert] = useState<NOCAlert | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString('es-MX'));

  // Cross-cutting filters (apply only in global view)
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(new Set());
  const [region, setRegion] = useState<Region>('all');
  const [netType, setNetType] = useState<NetworkType>('all');

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString('es-MX'));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const isGlobal = activeTenantId === null;
  const activeTenant = CASA_TENANTS.find(t => t.id === activeTenantId);

  // Build cities list with tenant info + apply filters
  const cities = useMemo(() => {
    let result: Array<NOCCity & { tenantId: string }> = [];
    if (isGlobal) {
      const allData = getAllCasaData();
      Object.entries(allData).forEach(([tid, td]) => {
        td.cities.forEach(c => result.push({ ...c, tenantId: tid }));
      });
    } else {
      const data = getNOCData(activeTenantId!);
      result = data ? data.cities.map(c => ({ ...c, tenantId: activeTenantId! })) : [];
    }

    if (isGlobal) {
      if (selectedTenants.size > 0) {
        result = result.filter(c => selectedTenants.has(c.tenantId));
      }
      if (region !== 'all') {
        result = result.filter(c => CITY_REGION[c.id] === region);
      }
      if (netType !== 'all') {
        result = result.filter(c => TENANT_NET_TYPE[c.tenantId] === netType);
      }
    }
    return result;
  }, [activeTenantId, isGlobal, selectedTenants, region, netType]);

  const filteredCities = selectedCityId ? cities.filter(c => c.id === selectedCityId) : cities;

  const alerts = isGlobal ? getAllAlerts() : getAlertsForTenant(activeTenantId!);
  const totalAlertCount = getTotalAlertCount();

  const tenantScores = useMemo(() => {
    const allData = getAllCasaData();
    const scores: Record<string, number> = {};
    CASA_TENANTS.forEach(t => {
      const td = allData[t.id];
      if (td && td.cities.length > 0) {
        scores[t.id] = Math.round(td.cities.reduce((a, c) => a + c.score, 0) / td.cities.length);
      }
    });
    return scores;
  }, []);

  const handleCreateTicket = (alert: NOCAlert) => {
    setTicketAlert(alert);
    setAlertsOpen(false);
  };

  const handleSelectTenantFromCard = (tenantId: string) => {
    const sub = TENANT_SUBNOC_ROUTE[tenantId];
    if (sub) {
      navigate(sub);
    } else {
      setActiveTenantId(tenantId);
      setSelectedCityId(null);
    }
  };

  const toggleTenant = (id: string) => {
    setSelectedTenants(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedTenants(new Set());
    setRegion('all');
    setNetType('all');
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-[#e2e8f0]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1E3A4A]">
        <div className="flex items-center gap-3">
          <h1 className="text-[16px] font-bold tracking-wide">NOC Monitor</h1>
          <span className="text-[10px] text-[#64748b] font-mono">Actualizado: {lastUpdated}</span>
          {isGlobal && (
            <span className="text-[10px] uppercase tracking-wider text-[#00B4D8] bg-[#00B4D8]/10 px-2 py-0.5 rounded-full border border-[#00B4D8]/30">
              Vista Global · {CASA_TENANTS.length} redes
            </span>
          )}
        </div>
        <button
          onClick={() => setAlertsOpen(true)}
          className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1E3A4A] hover:border-[#FFB703]/40 transition-colors"
        >
          <AlertTriangle className="h-4 w-4 text-[#FFB703]" />
          <span className="text-[12px] text-[#e2e8f0]">Alertas</span>
          {totalAlertCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#FF4D6D] text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {totalAlertCount}
            </span>
          )}
        </button>
      </div>

      {/* Tenant tabs */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-[#1E3A4A] overflow-x-auto">
        <button
          onClick={() => { setActiveTenantId(null); setSelectedCityId(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 ${
            isGlobal ? 'bg-[#00B4D8]/15 text-[#00B4D8] border border-[#00B4D8]/30' : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1A2B3C]'
          }`}
        >
          Vista Global
        </button>
        {CASA_TENANTS.map(t => {
          const score = tenantScores[t.id] ?? 0;
          const dotColor = score >= 85 ? '#00C896' : score >= 60 ? '#FFB703' : '#FF4D6D';
          return (
            <button
              key={t.id}
              onClick={() => { setActiveTenantId(t.id); setSelectedCityId(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                activeTenantId === t.id ? 'bg-[#1A2B3C] text-[#e2e8f0] border border-[#1E3A4A]' : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1A2B3C]'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
              {t.name}
              <span className="text-[10px] font-mono" style={{ color: dotColor }}>{score}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Global view: KPIs + tenant grid + filters */}
        {isGlobal && (
          <>
            <GlobalMetrics />
            <TenantGrid onSelectTenant={handleSelectTenantFromCard} />
            <RegionFilter
              selectedTenants={selectedTenants}
              region={region}
              netType={netType}
              onToggleTenant={toggleTenant}
              onRegionChange={setRegion}
              onNetTypeChange={setNetType}
              onClear={clearFilters}
            />
          </>
        )}

        {/* Map + Cities split */}
        <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-6">
          <MexicoMap
            cities={cities}
            selectedCityId={selectedCityId}
            onCityClick={id => setSelectedCityId(prev => prev === id ? null : id)}
            isGlobal={isGlobal}
          />

          <div className="space-y-3">
            {selectedCityId && (
              <button onClick={() => setSelectedCityId(null)} className="text-[11px] text-[#00B4D8] hover:underline mb-1">
                ← Ver todas las ciudades
              </button>
            )}
            {filteredCities.map(city => (
              <CityCard
                key={city.id}
                city={city}
                tenantName={isGlobal ? CASA_TENANTS.find(t => t.id === city.tenantId)?.name : undefined}
                tenantColor={city.tenantId ? TENANT_COLORS[city.tenantId] : undefined}
              />
            ))}
            {filteredCities.length === 0 && (
              <p className="text-center text-[#64748b] text-[12px] py-12">
                {isGlobal && (selectedTenants.size > 0 || region !== 'all' || netType !== 'all')
                  ? 'Sin ciudades que coincidan con los filtros'
                  : 'Sin datos disponibles'}
              </p>
            )}
          </div>
        </div>

        {isGlobal && <BenchmarkTable />}
      </div>

      <AlertsDrawer
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        alerts={alerts}
        isGlobal={isGlobal}
        onCreateTicket={handleCreateTicket}
      />

      <CreateTicketModal
        open={ticketAlert !== null}
        onClose={() => setTicketAlert(null)}
        alert={ticketAlert}
        tenantId={activeTenantId ?? 'global'}
        tenantType="casa"
      />
    </div>
  );
}
