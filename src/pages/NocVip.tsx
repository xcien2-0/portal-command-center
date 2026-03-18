import { useState, useEffect } from 'react';
import { Shield, Wifi, Activity, Monitor, AlertTriangle, Bell, CheckCircle, XCircle, Radio, Zap, Signal } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MOCK_VIP_CLIENTS, VipClient, VipNodeStatus, VIP_THRESHOLDS, getVipSummary, ProactiveAlert, MeshNode } from '@/data/mockVipData';

/* ── Status config ── */
const statusConfig: Record<VipNodeStatus, { label: string; dotClass: string; bgClass: string; textClass: string }> = {
  ok:       { label: 'OK',       dotClass: 'bg-status-ok',       bgClass: 'bg-status-ok/15',       textClass: 'text-status-ok' },
  warning:  { label: 'ALERTA',   dotClass: 'bg-status-warning',  bgClass: 'bg-status-warning/15',  textClass: 'text-status-warning' },
  critical: { label: 'CRÍTICO',  dotClass: 'bg-status-critical', bgClass: 'bg-status-critical/15', textClass: 'text-status-critical' },
};

const borderMap: Record<VipNodeStatus, string> = {
  ok: 'border-status-ok', warning: 'border-status-warning', critical: 'border-status-critical',
};

/* ── Alert icon ── */
function AlertIcon({ type }: { type: ProactiveAlert['type'] }) {
  const cls = "h-3.5 w-3.5";
  switch (type) {
    case 'speed_drop': return <Activity className={`${cls} text-status-warning`} />;
    case 'mesh_desync': return <Wifi className={`${cls} text-status-critical`} />;
    case 'interference': return <Radio className={`${cls} text-status-warning`} />;
    case 'latency_spike': return <Zap className={`${cls} text-status-critical`} />;
    case 'packet_loss': return <AlertTriangle className={`${cls} text-status-critical`} />;
  }
}

/* ── Mesh Node Row ── */
function MeshNodeRow({ node }: { node: MeshNode }) {
  const signalColor = node.signalQuality >= 80 ? 'text-status-ok' : node.signalQuality >= 50 ? 'text-status-warning' : 'text-status-critical';
  return (
    <tr className="border-t border-border text-[11px]">
      <td className="py-1.5 font-mono">{node.location}</td>
      <td className={`py-1.5 font-mono font-semibold ${signalColor}`}>{node.signalQuality}%</td>
      <td className="py-1.5 text-muted-foreground">{node.frequency}</td>
      <td className="py-1.5">
        {node.interference && <span className="text-status-warning text-[10px] font-semibold">⚡ Interferencia</span>}
      </td>
      <td className="py-1.5">
        {node.synced
          ? <CheckCircle className="h-3 w-3 text-status-ok" />
          : <XCircle className="h-3 w-3 text-status-critical" />}
      </td>
    </tr>
  );
}

/* ── Client Detail Panel ── */
function ClientDetail({ client }: { client: VipClient }) {
  const sc = statusConfig[client.status];
  const avgDownload = Math.round(client.speedHistory.reduce((s, h) => s + h.download, 0) / client.speedHistory.length);
  const speedRatio = Math.round((avgDownload / client.planSpeedMbps) * 100);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className={`bg-card rounded border-l-2 ${borderMap[client.status]} border border-border p-3`}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold">{client.name}</h3>
            <p className="text-[10px] text-muted-foreground">{client.plan} · {client.connectedDevices} dispositivos</p>
          </div>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${sc.bgClass} ${sc.textClass}`}>{sc.label}</span>
        </div>
        <div className="grid grid-cols-4 gap-3 text-[11px]">
          <div>
            <span className="text-muted-foreground">Latencia</span>
            <p className={`font-mono font-semibold ${client.latency > VIP_THRESHOLDS.latency.critical ? 'text-status-critical' : client.latency > VIP_THRESHOLDS.latency.alert ? 'text-status-warning' : ''}`}>
              {client.latency} ms
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Packet Loss</span>
            <p className={`font-mono font-semibold ${client.packetLoss > VIP_THRESHOLDS.packetLoss.alert ? 'text-status-warning' : ''}`}>
              {client.packetLoss}%
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Uptime 30d</span>
            <p className={`font-mono font-semibold ${client.uptime < VIP_THRESHOLDS.uptimeMin ? 'text-status-critical' : ''}`}>
              {client.uptime}%
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Velocidad real</span>
            <p className={`font-mono font-semibold ${speedRatio < 80 ? 'text-status-critical' : speedRatio < 90 ? 'text-status-warning' : ''}`}>
              {speedRatio}% del plan
            </p>
          </div>
        </div>
      </div>

      {/* Speed chart */}
      <div className="bg-card rounded border border-border p-3">
        <h4 className="text-xs font-semibold mb-2">Velocidad real vs contratada — 24h</h4>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={client.speedHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="hour" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} interval={3} />
            <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
            <ReferenceLine y={client.planSpeedMbps} stroke="hsl(var(--primary))" strokeDasharray="5 5" label={{ value: 'Plan', fontSize: 9, fill: 'hsl(var(--primary))' }} />
            <Line type="monotone" dataKey="download" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} name="Download" />
            <Line type="monotone" dataKey="upload" stroke="hsl(var(--status-ok))" strokeWidth={1} dot={false} name="Upload" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Mesh nodes */}
      <div className="bg-card rounded border border-border p-3">
        <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
          <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
          Nodos Mesh ({client.meshNodes.length})
        </h4>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground text-left text-[10px]">
              <th className="pb-1 font-medium">Ubicación</th>
              <th className="pb-1 font-medium">Señal</th>
              <th className="pb-1 font-medium">Banda</th>
              <th className="pb-1 font-medium">Interferencia</th>
              <th className="pb-1 font-medium">Sync</th>
            </tr>
          </thead>
          <tbody>
            {client.meshNodes.map(mn => <MeshNodeRow key={mn.id} node={mn} />)}
          </tbody>
        </table>
      </div>

      {/* Proactive alerts */}
      {client.proactiveAlerts.length > 0 && (
        <div className="bg-card rounded border border-border p-3">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-status-warning" />
            Alertas proactivas ({client.proactiveAlerts.length})
          </h4>
          <div className="space-y-2">
            {client.proactiveAlerts.map(alert => (
              <div key={alert.id} className={`rounded border border-border p-2 ${alert.autoResolved ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-2">
                  <AlertIcon type={alert.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span>{alert.timestamp}</span>
                      {alert.autoResolved && <span className="text-status-ok font-medium">✓ Auto-resuelto</span>}
                      {alert.clientNotified && <span className="flex items-center gap-0.5"><Bell className="h-2.5 w-2.5" /> Notificado</span>}
                    </div>
                    {alert.clientMessage && (
                      <div className="mt-1.5 bg-accent/50 rounded p-2 text-[10px] text-muted-foreground italic border border-border">
                        📱 "{alert.clientMessage}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Client List Card ── */
function ClientListCard({ client, selected, onClick }: { client: VipClient; selected: boolean; onClick: () => void }) {
  const sc = statusConfig[client.status];
  const unresolved = client.proactiveAlerts.filter(a => !a.autoResolved).length;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded border-l-2 ${borderMap[client.status]} border border-border p-3 hover:bg-accent transition-colors cursor-pointer ${selected ? 'bg-accent ring-1 ring-primary' : 'bg-card'}`}
    >
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs font-semibold truncate">{client.name}</span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${sc.bgClass} ${sc.textClass}`}>{sc.label}</span>
      </div>
      <p className="text-[10px] text-muted-foreground mb-1.5">{client.plan}</p>
      <div className="flex items-center gap-3 text-[10px]">
        <span className="font-mono"><Monitor className="inline h-2.5 w-2.5 mr-0.5" />{client.connectedDevices}</span>
        <span className={`font-mono ${client.latency > VIP_THRESHOLDS.latency.alert ? 'text-status-warning' : ''}`}>{client.latency}ms</span>
        <span className="font-mono">{client.uptime}%</span>
        {unresolved > 0 && (
          <span className="text-status-warning font-semibold">⚠ {unresolved}</span>
        )}
      </div>
    </button>
  );
}

/* ── Summary Metric Box ── */
function MetricBox({ icon, label, value, sub, alert }: { icon: React.ReactNode; label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <div className={`bg-card rounded border border-border p-3 ${alert ? 'border-l-2 border-l-status-warning' : ''}`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="text-lg font-semibold font-mono">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ── Main Page ── */
export default function NocVip() {
  const [clients, setClients] = useState(MOCK_VIP_CLIENTS);
  const [selectedId, setSelectedId] = useState<string>(MOCK_VIP_CLIENTS[0].id);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString('es-MX'));

  useEffect(() => {
    const interval = setInterval(() => {
      setClients(prev => prev.map(c => ({
        ...c,
        latency: Math.max(1, c.latency + Math.floor(Math.random() * 6 - 3)),
        connectedDevices: Math.max(1, c.connectedDevices + Math.floor(Math.random() * 5 - 2)),
      })));
      setLastUpdated(new Date().toLocaleTimeString('es-MX'));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const summary = getVipSummary(clients);
  const selected = clients.find(c => c.id === selectedId) ?? clients[0];

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Shield className="h-4 w-4 text-primary" />
          <div>
            <h1 className="text-sm font-semibold">NOC VIP Residencial</h1>
            <p className="text-[10px] text-muted-foreground">Cero tolerancia · Umbrales: lat&gt;{VIP_THRESHOLDS.latency.alert}ms alerta, &gt;{VIP_THRESHOLDS.latency.critical}ms crítico · PL&gt;{VIP_THRESHOLDS.packetLoss.alert}%</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-ok animate-pulse" />
            <span className="text-muted-foreground">{summary.ok} OK</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-warning" />
            <span className="text-muted-foreground">{summary.warning} Alerta</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-critical animate-pulse" />
            <span className="text-muted-foreground">{summary.critical} Crítico</span>
          </div>
          <span className="text-muted-foreground font-mono text-[10px]">⟳ {lastUpdated}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Summary row */}
        <div className="grid grid-cols-6 gap-2 p-3 pb-0">
          <MetricBox icon={<Monitor className="h-3.5 w-3.5" />} label="Dispositivos total" value={`${summary.totalDevices}`} />
          <MetricBox icon={<Activity className="h-3.5 w-3.5" />} label="Latencia promedio" value={`${summary.avgLatency} ms`} sub={summary.avgLatency > VIP_THRESHOLDS.latency.alert ? '⚠ Sobre umbral VIP' : 'Normal (<15ms)'} alert={summary.avgLatency > VIP_THRESHOLDS.latency.alert} />
          <MetricBox icon={<Shield className="h-3.5 w-3.5" />} label="Clientes VIP" value={`${summary.total}`} sub={`${summary.ok} OK · ${summary.warning} alerta · ${summary.critical} crítico`} />
          <MetricBox icon={<Wifi className="h-3.5 w-3.5" />} label="Nodos mesh" value={`${summary.totalMeshNodes}`} sub={summary.desyncedMesh > 0 ? `${summary.desyncedMesh} desincronizados` : 'Todos sincronizados'} alert={summary.desyncedMesh > 0} />
          <MetricBox icon={<Bell className="h-3.5 w-3.5" />} label="Alertas proactivas" value={`${summary.totalAlerts}`} sub={`${summary.unresolvedAlerts} sin resolver`} alert={summary.unresolvedAlerts > 0} />
          <MetricBox icon={<Signal className="h-3.5 w-3.5" />} label="SLA garantizado" value="99.9%" sub="Uptime mínimo" />
        </div>

        {/* Client list + detail */}
        <div className="flex-1 overflow-hidden grid grid-cols-5 gap-3 p-3">
          <div className="col-span-2 overflow-y-auto space-y-2 pr-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Clientes VIP</h2>
            {clients.map(c => (
              <ClientListCard key={c.id} client={c} selected={c.id === selectedId} onClick={() => setSelectedId(c.id)} />
            ))}
          </div>
          <div className="col-span-3 overflow-y-auto pr-1">
            <ClientDetail client={selected} />
          </div>
        </div>
      </div>
    </div>
  );
}
