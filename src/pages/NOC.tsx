import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { CASA_TENANTS, Tenant } from '@/types/tenant';
import { NOCCity, NOCAlert } from '@/types/noc';
import { getAllCasaData, getNOCData, getAllAlerts, getAlertsForTenant, getTotalAlertCount } from '@/services/nocboard';
import { TENANT_COLORS } from '@/data/noc-mock';
import { GlobalMetrics } from '@/components/noc/GlobalMetrics';
import { MexicoMap } from '@/components/noc/MexicoMap';
import { CityCard } from '@/components/noc/CityCard';
import { BenchmarkTable } from '@/components/noc/BenchmarkTable';
import { AlertsDrawer } from '@/components/noc/AlertsDrawer';
import { CreateTicketModal } from '@/components/noc/CreateTicketModal';
import { AdBanner } from '@/components/noc/AdBanner';
import { ScoreCircle } from '@/components/noc/ScoreCircle';

export default function NOC() {
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [ticketAlert, setTicketAlert] = useState<NOCAlert | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString('es-MX'));

  // Mock polling every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString('es-MX'));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const isGlobal = activeTenantId === null;
  const activeTenant = CASA_TENANTS.find(t => t.id === activeTenantId);

  // Build cities list with tenant info
  const cities = useMemo(() => {
    if (isGlobal) {
      const allData = getAllCasaData();
      const allCities: Array<NOCCity & { tenantId: string }> = [];
      Object.entries(allData).forEach(([tid, td]) => {
        td.cities.forEach(c => allCities.push({ ...c, tenantId: tid }));
      });
      return allCities;
    }
    const data = getNOCData(activeTenantId!);
    return data ? data.cities.map(c => ({ ...c, tenantId: activeTenantId! })) : [];
  }, [activeTenantId, isGlobal]);

  const filteredCities = selectedCityId
    ? cities.filter(c => c.id === selectedCityId)
    : cities;

  const alerts = isGlobal ? getAllAlerts() : getAlertsForTenant(activeTenantId!);
  const totalAlertCount = getTotalAlertCount();

  // Compute per-tenant score for tab indicators
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

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-[#e2e8f0]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1E3A4A]">
        <div className="flex items-center gap-3">
          <h1 className="text-[16px] font-bold tracking-wide">NOC Monitor</h1>
          <span className="text-[10px] text-[#64748b] font-mono">Actualizado: {lastUpdated}</span>
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
        {/* Global metrics */}
        {isGlobal && <GlobalMetrics />}

        {/* Map + Cities split */}
        <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-6">
          {/* Map */}
          <MexicoMap
            cities={cities}
            selectedCityId={selectedCityId}
            onCityClick={id => setSelectedCityId(prev => prev === id ? null : id)}
            isGlobal={isGlobal}
          />

          {/* Cities panel */}
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
              <p className="text-center text-[#64748b] text-[12px] py-12">Sin datos disponibles</p>
            )}
          </div>
        </div>

        {/* Benchmark (global only) */}
        {isGlobal && <BenchmarkTable />}
      </div>

      {/* Alerts drawer */}
      <AlertsDrawer
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        alerts={alerts}
        isGlobal={isGlobal}
        onCreateTicket={handleCreateTicket}
      />

      {/* Ticket modal */}
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
