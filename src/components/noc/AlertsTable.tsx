import { useState } from 'react';
import { Search } from 'lucide-react';
import { ActiveAlert, AlertSeverity } from '@/data/mockNetworkData';

const severityDots: Record<AlertSeverity, string> = {
  critico: '🔴',
  alto: '🟡',
  medio: '🟢',
  bajo: '🟢',
};

const statusLabel: Record<string, string> = {
  nueva: 'Nueva',
  en_atencion: 'En atención',
  resuelta: 'Resuelta',
};

interface AlertsTableProps {
  alerts: ActiveAlert[];
  onAttend: (alertId: string) => void;
}

export function AlertsTable({ alerts, onAttend }: AlertsTableProps) {
  const [filter, setFilter] = useState<'all' | 'critico' | 'alto'>('all');
  const [search, setSearch] = useState('');

  const filtered = alerts.filter(a => {
    if (a.status === 'resuelta') return false;
    if (filter === 'critico' && a.severity !== 'critico') return false;
    if (filter === 'alto' && a.severity !== 'alto') return false;
    if (search && !a.nodeName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#8ba3b8]">Alertas activas</h2>
          <span className="bg-[#FF3B30]/20 text-[#FF3B30] text-[11px] font-bold px-2 py-0.5 rounded-full">
            {alerts.filter(a => a.status !== 'resuelta').length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter pills */}
          {(['all', 'critico', 'alto'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                filter === f
                  ? 'bg-[#F5F5F7] text-[#0f1923]'
                  : 'border border-[#2a3f50] text-[#8ba3b8] hover:text-[#F5F5F7]'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'critico' ? 'Crítico' : 'Alto'}
            </button>
          ))}
          {/* Search */}
          <div className="relative ml-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5a7080]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar nodo..."
              className="bg-[#1a2733] border border-[#2a3f50] rounded-lg pl-7 pr-3 py-1.5 text-[12px] text-[#F5F5F7] placeholder:text-[#5a7080] outline-none focus:border-[#34C759]/50 w-40"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[#1a2733] text-[#5a7080] uppercase text-[10px] tracking-wider">
              <th className="text-left px-4 py-2.5 font-medium">Nodo</th>
              <th className="text-left px-4 py-2.5 font-medium">Tipo</th>
              <th className="text-center px-4 py-2.5 font-medium">Sev.</th>
              <th className="text-left px-4 py-2.5 font-medium">Técnico</th>
              <th className="text-left px-4 py-2.5 font-medium">Estado</th>
              <th className="text-right px-4 py-2.5 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((alert, i) => (
              <tr
                key={alert.id}
                className={`h-[52px] border-t border-[#2a3f50]/50 hover:bg-[#1a2733]/60 ${alert.isNew ? 'animate-pulse-alert' : ''}`}
              >
                <td className="px-4 font-mono font-semibold text-[#F5F5F7]">{alert.nodeName}</td>
                <td className="px-4 text-[#8ba3b8]">{alert.type}</td>
                <td className="px-4 text-center text-base">{severityDots[alert.severity]}</td>
                <td className="px-4 text-[#8ba3b8]">{alert.assignedTech}</td>
                <td className="px-4 text-[#8ba3b8]">{statusLabel[alert.status]}</td>
                <td className="px-4 text-right">
                  {alert.status === 'nueva' && (
                    <button
                      onClick={() => onAttend(alert.id)}
                      className="px-3 py-1 rounded-md border border-[#34C759]/40 text-[#34C759] text-[11px] font-medium hover:bg-[#34C759]/10 transition-colors"
                    >
                      Atender
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[#5a7080]">Sin alertas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
