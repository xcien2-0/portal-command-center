import { NetworkNode, NodeStatus } from '@/data/mockNetworkData';

const statusBorderMap: Record<NodeStatus, string> = {
  ok: 'border-status-ok',
  warning: 'border-status-warning',
  critical: 'border-status-critical',
};

const statusBgMap: Record<NodeStatus, string> = {
  ok: 'bg-status-ok/10 text-status-ok',
  warning: 'bg-status-warning/10 text-status-warning',
  critical: 'bg-status-critical/10 text-status-critical',
};

const statusLabel: Record<NodeStatus, string> = {
  ok: 'OK',
  warning: 'WARNING',
  critical: 'CRITICAL',
};

interface NodeCardProps {
  node: NetworkNode;
  onClick: (node: NetworkNode) => void;
}

export function NodeCard({ node, onClick }: NodeCardProps) {
  return (
    <button
      onClick={() => onClick(node)}
      className={`w-full text-left rounded border-l-2 ${statusBorderMap[node.status]} bg-card p-3 hover:bg-accent transition-colors cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-xs font-semibold font-mono truncate">{node.name}</span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusBgMap[node.status]}`}>
          {statusLabel[node.status]}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2">{node.location}</p>
      <div className="flex items-center gap-3 text-[11px]">
        <span className="font-mono">
          <span className="text-muted-foreground">Lat:</span>{' '}
          <span className={node.latency > 50 ? 'text-status-warning' : node.latency > 150 ? 'text-status-critical' : 'text-foreground'}>{node.latency}ms</span>
        </span>
        <span className="font-mono">
          <span className="text-muted-foreground">Up:</span>{' '}
          <span className={node.uptime < 95 ? 'text-status-critical' : node.uptime < 99 ? 'text-status-warning' : 'text-foreground'}>{node.uptime}%</span>
        </span>
      </div>
    </button>
  );
}
