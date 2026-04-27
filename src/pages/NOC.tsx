import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { CASA_TENANTS } from '@/types/tenant';
import { NOCCity, NOCAlert } from '@/types/noc';
import { getAllCasaData, getNOCData, getAllAlerts, getAlertsForTenant, getTotalAlertCount, getRealCities, getRealAlerts, fetchNOCSummary } from '@/services/nocboard';
import { TENANT_COLORS } from '@/data/noc-mock';
import { GlobalMetrics } from '@/components/noc/GlobalMetrics';
import { MexicoMap } from '@/components/noc/MexicoMap';
import { CityCard } from '@/components/noc/CityCard';
import { BenchmarkTable } from '@/components/noc/BenchmarkTable';
import { AlertsDrawer } from '@/components/noc/AlertsDrawer';
import { CreateTicketModal } from '@/components/noc/CreateTicketModal';
import { TenantGrid } from '@/components/noc/TenantGrid';
import { RegionFilter, CITY_REGION, TENANT_NET_TYPE, type Region, type NetworkType } from '@/components/noc/RegionFilter';

import { useViewMode } from "../contexts/ViewModeContext.tsx";
import NocSection from "./xcien2/sections/NocSection.tsx";
import { DEFAULT_THEME } from "./xcien2/types.ts";

export default function NOC() {
  const { mode } = useViewMode();
  const theme = DEFAULT_THEME;
  const navigate = useNavigate();
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [ticketAlert, setTicketAlert] = useState<NOCAlert | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString('es-MX'));
  const [realCities, setRealCities] = useState<NOCCity[] | null>(null);
  const [realAlerts, setRealAlerts] = useState<NOCAlert[] | null>(null);
  const [nocSummary, setNocSummary] = useState<any>(null);
  const [backendOnline, setBackendOnline] = useState(false);

  // Cross-cutting filters (apply only in global view)
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(new Set());
  const [region, setRegion] = useState<Region>('all');
  const [netType, setNetType] = useState<NetworkType>('all');

  // Cargar datos reales de NOCBoard
  const loadRealData = async () => {
    try {
      const [cities, alerts, summary] = await Promise.all([
        getRealCities(),
        getRealAlerts(),
        fetchNOCSummary(),
      ]);
      if (cities && cities.length > 0) {
        setRealCities(cities);
        setRealAlerts(alerts);
        setNocSummary(summary);
        setBackendOnline(true);
      }
    } catch { setBackendOnline(false); }
    setLastUpdated(new Date().toLocaleTimeString('es-MX'));
  };

  useEffect(() => {
    loadRealData();
    const interval = setInterval(loadRealData, 30_000);
    return () => clearInterval(interval);
  }, []);

  const isGlobal = activeTenantId === null;
  const activeTenant = CASA_TENANTS.find(t => t.id === activeTenantId);

  // Build cities list — real data (NOCBoard) con fallback a mock
  const cities = useMemo(() => {
    let result: Array<NOCCity & { tenantId: string }> = [];

    if (realCities && realCities.length > 0 && isGlobal) {
      // Datos reales de NOCBoard — asignar tenantId por ciudad
      const cityTenant: Record<string, string> = {
        'monterrey': 'xcien', 'saltillo': 'xcien', 'piedras-negras': 'xcien',
        'san-luis-potosi': 'xcien', 'coco': 'xcien',
        'guadalajara': 'wispi', 'querétaro': 'wispi',
        'torreón': 'luminet', 'monclova': 'luminet',
        'cdmx': 'huus', 'guanajuato': 'huus',
      };
      result = realCities.map(c => ({
        ...c,
        tenantId: cityTenant[c.id] ?? 'xcien',
      }));
    } else if (isGlobal) {
      const allData = getAllCasaData();
      Object.entries(allData).forEach(([tid, td]) => {
        td.cities.forEach(c => result.push({ ...c, tenantId: tid }));
      });
    } else {
      const data = getNOCData(activeTenantId!);
      result = data ? data.cities.map(c => ({ ...c, tenantId: activeTenantId! })) : [];
    }

    if (isGlobal) {
      if (selectedTenants.size > 0) result = result.filter(c => selectedTenants.has(c.tenantId));
      if (region !== 'all') result = result.filter(c => CITY_REGION[c.id] === region);
      if (netType !== 'all') result = result.filter(c => TENANT_NET_TYPE[c.tenantId] === netType);
    }
    return result;
  }, [activeTenantId, isGlobal, selectedTenants, region, netType, realCities]);

  const filteredCities = selectedCityId ? cities.filter(c => c.id === selectedCityId) : cities;

  const alerts = realAlerts ?? (isGlobal ? getAllAlerts() : getAlertsForTenant(activeTenantId!));
  const totalAlertCount = alerts.filter(a => !a.ticketCreated).length;

  const tenantScores = useMemo(() => {
    // Usar datos reales si están disponibles
    if (realCities && realCities.length > 0) {
      const cityTenant: Record<string, string> = {
        'monterrey': 'xcien', 'saltillo': 'xcien', 'piedras-negras': 'xcien',
        'san-luis-potosi': 'xcien', 'coco': 'xcien',
      };
      const totals: Record<string, { sum: number; count: number }> = {};
      realCities.forEach(c => {
        const tid = cityTenant[c.id] ?? 'xcien';
        if (!totals[tid]) totals[tid] = { sum: 0, count: 0 };
        totals[tid].sum += c.score;
        totals[tid].count++;
      });
      const scores: Record<string, number> = {};
      Object.entries(totals).forEach(([tid, { sum, count }]) => {
        scores[tid] = Math.round(sum / count);
      });
      return scores;
    }
    // Fallback mock
    const allData = getAllCasaData();
    const scores: Record<string, number> = {};
    CASA_TENANTS.forEach(t => {
      const td = allData[t.id];
      if (td && td.cities.length > 0) {
        scores[t.id] = Math.round(td.cities.reduce((a, c) => a + c.score, 0) / td.cities.length);
      }
    });
    return scores;
  }, [realCities]);

  const handleCreateTicket = (alert: NOCAlert) => {
    setTicketAlert(alert);
    setAlertsOpen(false);
  };

  const handleSelectTenantFromCard = (tenantId: string) => {
    {
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


  if (mode === 'holo') {
    return (
      <NocSection 
        theme={theme} 
        cities={filteredCities} 
        alerts={alerts} 
        activeTenantId={activeTenantId} 
        onTenantChange={setActiveTenantId}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--xcien-bg)', color: 'var(--xcien-text)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--xcien-border)' }}>
        <div className="flex items-center gap-3">
          <Monitor className="h-5 w-5" style={{ color: 'var(--xcien-accent)' }} />
          <h1 className="text-[18px] font-bold tracking-tight">NOC Dashboard</h1>
        </div>
        <div className="flex items-center gap-4 text-[13px] font-medium" style={{ color: 'var(--xcien-dim)' }}>
          <span>{alerts.length} Alertas Activas</span>
          <div className="h-4 w-[1px]" style={{ background: 'var(--xcien-border)' }} />
          <span>Ultima actualización: {lastUpdated}</span>
        </div>
      </div>

      {/* Tenant tabs */}
      <div className="flex items-center gap-1 px-6 py-2 overflow-x-auto" style={{ borderBottom: '1px solid var(--xcien-border)' }}>
        <button
          onClick={() => { setActiveTenantId(null); setSelectedCityId(null); }}
          className={`px-4 py-1.5 rounded-md text-[12px] font-medium transition-all whitespace-nowrap ${
            activeTenantId === null 
              ? 'bg-[var(--xcien-accent)] text-white shadow-[0_0_15px_var(--xcien-accent)]' 
              : 'text-[var(--xcien-dim)] hover:text-[var(--xcien-text)] hover:bg-[var(--xcien-border)]'
          }`}
        >
          Vista Global
        </button>
        {CASA_TENANTS.map(tenant => (
          <button
            key={tenant.id}
            onClick={() => { setActiveTenantId(tenant.id); setSelectedCityId(null); }}
            className={`px-4 py-1.5 rounded-md text-[12px] font-medium transition-all whitespace-nowrap ${
              activeTenantId === tenant.id 
                ? 'bg-[var(--xcien-accent)] text-white shadow-[0_0_15px_var(--xcien-accent)]' 
                : 'text-[var(--xcien-dim)] hover:text-[var(--xcien-text)] hover:bg-[var(--xcien-border)]'
            }`}
          >
            {tenant.name}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {activeTenantId === null ? (
          <div className="space-y-6">
            <GlobalMetrics summary={nocSummary} realCities={realCities} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MexicoMap cities={cities} onCitySelect={setSelectedCityId} />
              <div className="space-y-6">
                <BenchmarkTable />
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl" style={{ background: 'var(--xcien-card)', border: '1px solid var(--xcien-border)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--xcien-dim)' }}>SLA Cumplimiento</p>
                    <p className="text-[24px] font-bold text-[#00C896]">99.8%</p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: 'var(--xcien-card)', border: '1px solid var(--xcien-border)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--xcien-dim)' }}>MTTR Global</p>
                    <p className="text-[24px] font-bold text-[#FFB703]">42m</p>
                  </div>
                </div>
              </div>
            </div>
            <TenantGrid onSelectTenant={setActiveTenantId} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => setActiveTenantId(null)}
                className="text-[13px] font-medium text-[#00B4D8] hover:underline"
              >
                ← Regresar a Vista Global
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredCities.map(city => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          </div>
        )}
      </div>

      <AlertsDrawer 
        open={alertsOpen} 
        onClose={() => setAlertsOpen(false)} 
        alerts={alerts} 
      />
      <CreateTicketModal 
        open={ticketAlert !== null} 
        onClose={() => setTicketAlert(null)} 
        alert={ticketAlert} 
      />
    </div>
  );
}
