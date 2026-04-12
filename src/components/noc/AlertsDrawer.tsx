import { useState } from 'react';
import { X, AlertTriangle, Ticket } from 'lucide-react';
import { NOCAlert } from '@/types/noc';
import { alertTenantMap } from '@/data/noc-mock';
import { CASA_TENANTS } from '@/types/tenant';

interface AlertsDrawerProps {
  open: boolean;
  onClose: () => void;
  alerts: NOCAlert[];
  isGlobal: boolean;
  onCreateTicket: (alert: NOCAlert) => void;
}

export function AlertsDrawer({ open, onClose, alerts, isGlobal, onCreateTicket }: AlertsDrawerProps) {
  const [filterTenant, setFilterTenant] = useState<string>('all');

  const filtered = isGlobal && filterTenant !== 'all'
    ? alerts.filter(a => alertTenantMap[a.id] === filterTenant)
    : alerts;

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#161B27] border-l border-[#1E3A4A] z-50 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-[#1E3A4A]">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#FFB703]" />
          <h2 className="text-[13px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Alertas</h2>
          <span className="bg-[#FF4D6D]/20 text-[#FF4D6D] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{alerts.length}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-[#1E3A4A] rounded transition-colors">
          <X className="h-4 w-4 text-[#64748b]" />
        </button>
      </div>

      {isGlobal && (
        <div className="flex items-center gap-1.5 p-3 border-b border-[#1E3A4A] overflow-x-auto">
          <button
            onClick={() => setFilterTenant('all')}
            className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${filterTenant === 'all' ? 'bg-[#00B4D8]/20 text-[#00B4D8]' : 'text-[#64748b] hover:text-[#e2e8f0]'}`}
          >Todas</button>
          {CASA_TENANTS.map(t => (
            <button key={t.id} onClick={() => setFilterTenant(t.id)}
              className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${filterTenant === t.id ? 'bg-[#00B4D8]/20 text-[#00B4D8]' : 'text-[#64748b] hover:text-[#e2e8f0]'}`}
            >{t.name}</button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.map(alert => (
          <div key={alert.id} className="bg-[#1A2B3C] rounded-lg p-3 border border-[#1E3A4A] hover:border-[#00B4D8]/30 transition-colors duration-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-[#FF4D6D] animate-pulse' : 'bg-[#FFB703]'}`} />
                <span className="text-[12px] font-medium text-[#e2e8f0]">{alert.type}</span>
              </div>
              {isGlobal && alertTenantMap[alert.id] && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00B4D8]/10 text-[#00B4D8]">
                  {CASA_TENANTS.find(t => t.id === alertTenantMap[alert.id])?.name}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#64748b] space-y-0.5">
              <p>{alert.cityName} → {alert.siteName}</p>
              <p className="font-mono">{alert.hostIp}</p>
              <p>{new Date(alert.timestamp).toLocaleString('es-MX')}</p>
            </div>
            {!alert.ticketCreated ? (
              <button
                onClick={() => onCreateTicket(alert)}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#00C896]/30 text-[#00C896] text-[11px] font-medium hover:bg-[#00C896]/10 transition-colors"
              >
                <Ticket className="h-3 w-3" /> Crear Ticket
              </button>
            ) : (
              <span className="mt-2 inline-block text-[10px] text-[#64748b]">✓ Ticket creado</span>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-[#64748b] text-[12px] py-8">Sin alertas activas</p>
        )}
      </div>
    </div>
  );
}
