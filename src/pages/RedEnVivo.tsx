import { useState, useEffect, useCallback } from 'react';
import {
  MOCK_NODES, MOCK_ALERTS, generateBandwidthHistory,
  getNetworkHealthPercent, getAverageLatency, getPacketLoss,
  NetworkNode, ActiveAlert, Incident
} from '@/data/mockNetworkData';
import { HeaderStatusBar } from '@/components/noc/HeaderStatusBar';
import { NodeCard } from '@/components/noc/NodeCard';
import { NodeDetailPanel } from '@/components/noc/NodeDetailPanel';
import { AlertsTable } from '@/components/noc/AlertsTable';
import { MetricsSection } from '@/components/noc/MetricsSection';
import { IncidentPanel } from '@/components/noc/IncidentPanel';
import { DispatchModal } from '@/components/noc/DispatchModal';

export default function RedEnVivo() {
  const [nodes, setNodes] = useState(MOCK_NODES);
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [bandwidthData, setBandwidthData] = useState(generateBandwidthHistory);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString('es-MX'));
  const [viewMode, setViewMode] = useState<'operador' | 'gerencial'>('operador');
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [incidentPanelOpen, setIncidentPanelOpen] = useState(false);
  const [incidentNodeId, setIncidentNodeId] = useState<string | undefined>();
  const [dispatchNode, setDispatchNode] = useState<NetworkNode | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(prev => prev.map(n => ({
        ...n,
        latency: Math.max(1, n.latency + Math.floor(Math.random() * 5 - 2)),
        bandwidthUp: Math.max(10, n.bandwidthUp + Math.floor(Math.random() * 20 - 10)),
        bandwidthDown: Math.max(10, n.bandwidthDown + Math.floor(Math.random() * 20 - 10)),
      })));
      setBandwidthData(generateBandwidthHistory());
      setLastUpdated(new Date().toLocaleTimeString('es-MX'));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAttendAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'en_atencion' as const, isNew: false } : a));
  }, []);

  const handleCreateIncident = useCallback((data: Omit<Incident, 'id' | 'createdAt' | 'status'>) => {
    const newIncident: Incident = {
      ...data,
      id: `inc-${Date.now()}`,
      createdAt: new Date().toLocaleString('es-MX'),
      status: 'nueva',
    };
    setIncidents(prev => [newIncident, ...prev]);
  }, []);

  const handleOpenIncidentFromNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) setDispatchNode(node);
  };

  const handleExportCSV = () => {
    const header = 'ID,Nodo,Descripción,Prioridad,Técnico,Estado,Creado\n';
    const rows = incidents.map(i => `${i.id},${i.nodeId},${i.description},${i.priority},${i.assignedTech},${i.status},${i.createdAt}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidentes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const healthPercent = getNetworkHealthPercent(nodes);
  const avgLatency = getAverageLatency(nodes);
  const packetLoss = getPacketLoss(nodes);
  const activeAlerts = alerts.filter(a => a.status !== 'resuelta').length;
  const activeNodes = nodes.filter(n => n.status !== 'critical').length;

  return (
    <div className="flex flex-col h-screen bg-[#0f1923] text-[#F5F5F7]">
      <HeaderStatusBar
        healthPercent={healthPercent}
        activeAlertCount={activeAlerts}
        lastUpdated={lastUpdated}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-8">
        {/* Node Grid */}
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#8ba3b8] mb-3">Nodos de red</h2>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {nodes.map(node => (
              <NodeCard key={node.id} node={node} onClick={setSelectedNode} />
            ))}
          </div>
        </section>

        {/* Alerts */}
        <section>
          <AlertsTable alerts={alerts} onAttend={handleAttendAlert} />
        </section>

        {/* Bandwidth Chart */}
        <section>
          <MetricsSection
            avgLatency={avgLatency}
            packetLoss={packetLoss}
            activeNodes={activeNodes}
            totalNodes={nodes.length}
            incidentsToday={incidents.length + 2}
            bandwidthData={bandwidthData}
            nodes={nodes}
          />
        </section>
      </div>

      {/* Node Detail Slide-over */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onCreateIncident={handleOpenIncidentFromNode}
        />
      )}

      {/* Dispatch Modal */}
      <DispatchModal
        open={!!dispatchNode}
        onClose={() => setDispatchNode(null)}
        node={dispatchNode}
      />

      {/* Incident Panel */}
      <IncidentPanel
        open={incidentPanelOpen}
        onClose={() => { setIncidentPanelOpen(false); setIncidentNodeId(undefined); }}
        preselectedNodeId={incidentNodeId}
        incidents={incidents}
        onCreateIncident={handleCreateIncident}
        onExportCSV={handleExportCSV}
      />
    </div>
  );
}
