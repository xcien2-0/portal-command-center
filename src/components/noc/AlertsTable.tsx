import { useState } from 'react';
import { ActiveAlert, AlertSeverity, AlertStatus } from '@/data/mockNetworkData';
import { Button } from '@/components/ui/button';

const severityColors: Record<AlertSeverity, string> = {
  critico: 'bg-status-critical/15 text-status-critical',
  alto: 'bg-status-warning/15 text-status-warning',
  medio: 'bg-primary/15 text-primary',
  bajo: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<AlertStatus, string> = {
  nueva: 'Nueva',
  en_atencion: 'En atención',
  resuelta: 'Resuelta',
};

interface AlertsTableProps {
  alerts: ActiveAlert[];
  onAttend: (alertId: string) => void;
}

export function AlertsTable({ alerts, onAttend }: AlertsTableProps) {
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  const filtered = alerts.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (zoneFilter !== 'all' && !a.nodeName.startsWith(zoneFilter)) return false;
    return true;
  });

  const zones = ['all', 'NL', 'COAH', 'SLP'];

  return (
    <div className="bg-card rounded border border-border">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider">Alertas Activas</h3>
        <div className="flex gap-1.5">
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value as any)} className="text-[11px] bg-accent text-foreground border border-border rounded px-2 py-1">
            <option value="all">Severidad</option>
            <option value="critico">Crítico</option>
            <option value="alto">Alto</option>
            <option value="medio">Medio</option>
            <option value="bajo">Bajo</option>
          </select>
          <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} className="text-[11px] bg-accent text-foreground border border-border rounded px-2 py-1">
            {zones.map(z => <option key={z} value={z}>{z === 'all' ? 'Zona' : z}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="text-[11px] bg-accent text-foreground border border-border rounded px-2 py-1">
            <option value="all">Estado</option>
            <option value="nueva">Nueva</option>
            <option value="en_atencion">En atención</option>
            <option value="resuelta">Resuelta</option>
          </select>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-card">
            <tr className="text-muted-foreground text-left">
              <th className="px-3 py-1.5 font-medium">Timestamp</th>
              <th className="px-3 py-1.5 font-medium">Nodo</th>
              <th className="px-3 py-1.5 font-medium">Tipo</th>
              <th className="px-3 py-1.5 font-medium">Severidad</th>
              <th className="px-3 py-1.5 font-medium">Técnico</th>
              <th className="px-3 py-1.5 font-medium">Estado</th>
              <th className="px-3 py-1.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(alert => (
              <tr
                key={alert.id}
                className={`border-t border-border hover:bg-accent/50 ${alert.isNew ? 'animate-pulse-alert' : ''}`}
              >
                <td className="px-3 py-1.5 font-mono">{alert.timestamp}</td>
                <td className="px-3 py-1.5 font-mono font-medium">{alert.nodeName}</td>
                <td className="px-3 py-1.5">{alert.type}</td>
                <td className="px-3 py-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${severityColors[alert.severity]}`}>
                    {alert.severity}
                  </span>
                </td>
                <td className="px-3 py-1.5">{alert.assignedTech}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{statusLabels[alert.status]}</td>
                <td className="px-3 py-1.5">
                  {alert.status === 'nueva' && (
                    <Button size="sm" variant="outline" className="h-5 text-[10px] px-2" onClick={() => onAttend(alert.id)}>
                      Atender
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
