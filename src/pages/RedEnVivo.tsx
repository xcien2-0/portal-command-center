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

  // TODO: connect to Zabbix API or LibreNMS API for real data
  useEffect(() => {
    const interval = setInterval(() => {
      // Mock data rotation: slightly vary latency values
      setNodes(prev => prev.map(n => ({
        ...n,
        latency: Math.max(1, n.latency + Math.floor(Math.random() * 5 - 2)),
        bandwidthUp: Math.max(10, n.bandwidthUp + Math.floor(Math.random() * 20 - 10)),
        bandwidthDown: Math.max(10, n.bandwidthDown + Math.floor(Math.random() * 20 - 10)),
      })));
      setBandwidthData(generateBandwidthHistory());
      setLastUpdated(new Date().toLocaleTimeString('es-MX'));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAttendAlert = useCallback((alertId: string) => {
    // TODO: connect to Zabbix API to acknowledge alert
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'en_atencion' as const, isNew: false } : a));
  }, []);

  const handleCreateIncident = useCallback((data: Omit<Incident, 'id' | 'createdAt' | 'status'>) => {
    // TODO: connect to Supabase incidents table
    const newIncident: Incident = {
      ...data,
      id: `inc-${Date.now()}`,
      createdAt: new Date().toLocaleString('es-MX'),
      status: 'nueva',
    };
    setIncidents(prev => [newIncident, ...prev]);
  }, []);

  const handleOpenIncidentFromNode = (nodeId: string) => {
    setIncidentNodeId(nodeId);
    setSelectedNode(null);
    setIncidentPanelOpen(true);
  };

  const handleExportCSV = () => {
    // TODO: connect to Supabase for full incident history
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
    <div className="flex flex-col h-screen overflow-hidden">
      <HeaderStatusBar
        healthPercent={healthPercent}
        activeAlertCount={activeAlerts}
        lastUpdated={lastUpdated}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Mapa de Alertas - Node Grid */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Mapa de Nodos</h2>
          <div className="grid grid-cols-5 gap-2">
            {nodes.map(node => (
              <NodeCard key={node.id} node={node} onClick={setSelectedNode} />
            ))}
          </div>
        </section>

        {/* Alertas Activas */}
        <section>
          <AlertsTable alerts={alerts} onAttend={handleAttendAlert} />
        </section>

        {/* Métricas de Red */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Métricas de Red</h2>
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

      {/* Incident Panel Slide-over */}
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
