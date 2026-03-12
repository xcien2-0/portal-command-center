import { Activity, Wifi, Server, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { NetworkNode } from '@/data/mockNetworkData';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}

function MetricCard({ icon, label, value, sub }: MetricCardProps) {
  return (
    <div className="bg-card rounded border border-border p-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="text-lg font-semibold font-mono">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

interface MetricsSectionProps {
  avgLatency: number;
  packetLoss: number;
  activeNodes: number;
  totalNodes: number;
  incidentsToday: number;
  bandwidthData: { time: string; upload: number; download: number }[];
  nodes: NetworkNode[];
}

export function MetricsSection({ avgLatency, packetLoss, activeNodes, totalNodes, incidentsToday, bandwidthData, nodes }: MetricsSectionProps) {
  const topLatencyNodes = [...nodes].sort((a, b) => b.latency - a.latency).slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        <MetricCard icon={<Activity className="h-3.5 w-3.5" />} label="Latencia promedio" value={`${avgLatency} ms`} />
        <MetricCard icon={<Wifi className="h-3.5 w-3.5" />} label="Packet Loss" value={`${packetLoss}%`} sub={packetLoss > 2 ? 'Sobre umbral' : 'Normal'} />
        <MetricCard icon={<Server className="h-3.5 w-3.5" />} label="Nodos activos" value={`${activeNodes}/${totalNodes}`} />
        <MetricCard icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Incidentes hoy" value={`${incidentsToday}`} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 bg-card rounded border border-border p-3">
          <h4 className="text-xs font-semibold mb-2">Bandwidth — Últimas 24h (Mbps)</h4>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={bandwidthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="upload" stroke="hsl(var(--status-ok))" strokeWidth={1.5} dot={false} name="Upload" />
              <Line type="monotone" dataKey="download" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} name="Download" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded border border-border p-3">
          <h4 className="text-xs font-semibold mb-2">Top 5 Latencia</h4>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-muted-foreground text-left">
                <th className="pb-1 font-medium">Nodo</th>
                <th className="pb-1 font-medium text-right">ms</th>
              </tr>
            </thead>
            <tbody>
              {topLatencyNodes.map(n => (
                <tr key={n.id} className="border-t border-border">
                  <td className="py-1 font-mono truncate max-w-[140px]">{n.name}</td>
                  <td className={`py-1 font-mono text-right font-semibold ${n.latency > 100 ? 'text-status-critical' : n.latency > 30 ? 'text-status-warning' : ''}`}>
                    {n.latency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
