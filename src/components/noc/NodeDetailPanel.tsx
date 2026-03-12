import { X, Globe, Clock, ArrowUpDown } from 'lucide-react';
import { NetworkNode } from '@/data/mockNetworkData';
import { Button } from '@/components/ui/button';

interface NodeDetailPanelProps {
  node: NetworkNode;
  onClose: () => void;
  onCreateIncident: (nodeId: string) => void;
}

export function NodeDetailPanel({ node, onClose, onCreateIncident }: NodeDetailPanelProps) {
  // TODO: connect to Zabbix API for real-time sparkline data
  const sparklineData = Array.from({ length: 20 }, () => Math.floor(Math.random() * 40) + node.latency * 0.5);
  const maxVal = Math.max(...sparklineData);
  const points = sparklineData.map((v, i) => `${(i / 19) * 200},${40 - (v / maxVal) * 36}`).join(' ');

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border z-40 animate-slide-in-right flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold truncate">{node.name}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-accent rounded p-2">
            <span className="text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> IP</span>
            <span className="font-mono font-medium">{node.ip}</span>
          </div>
          <div className="bg-accent rounded p-2">
            <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Último inc.</span>
            <span className="font-mono font-medium">{node.lastIncident}</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" /> Bandwidth
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-accent rounded p-2">
              <span className="text-muted-foreground">Upload</span>
              <p className="font-mono font-semibold text-status-ok">{node.bandwidthUp} Mbps</p>
            </div>
            <div className="bg-accent rounded p-2">
              <span className="text-muted-foreground">Download</span>
              <p className="font-mono font-semibold text-primary">{node.bandwidthDown} Mbps</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Tiempo de respuesta</h4>
          <div className="bg-accent rounded p-2">
            <svg viewBox="0 0 200 40" className="w-full h-10">
              <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" points={points} />
            </svg>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-border">
        <Button size="sm" className="w-full text-xs" onClick={() => onCreateIncident(node.id)}>
          Crear Incidente
        </Button>
      </div>
    </div>
  );
}
