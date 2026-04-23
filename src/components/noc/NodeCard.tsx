import { NetworkNode, NodeStatus } from '@/data/mockNetworkData';

const ISP_COLORS: Record<string, string> = {
  Xcien:      'bg-[#1B7F4A]/20 text-[#1D9E75]',
  Luminet:    'bg-[#0E6B3A]/20 text-[#0EA472]',
  Wispi:      'bg-[#0ea5e9]/20 text-[#38bdf8]',
  Huus:       'bg-[#7C3AED]/20 text-[#a78bfa]',
  Sandur:     'bg-[#EA580C]/20 text-[#fb923c]',
};

const borderColor: Record<NodeStatus, string> = {
  ok: '#34C759',
  warning: '#FF9F0A',
  critical: '#FF3B30',
};

interface NodeCardProps {
  node: NetworkNode;
  onClick: (node: NetworkNode) => void;
}

export function NodeCard({ node, onClick }: NodeCardProps) {
  const isCritical = node.status === 'critical';
  const latencyColor = node.latency > 150 ? 'text-[#FF3B30]' : node.latency > 30 ? 'text-[#FF9F0A]' : 'text-[#34C759]';
  const uptimeColor = node.uptime < 95 ? 'text-[#FF3B30]' : node.uptime < 99 ? 'text-[#FF9F0A]' : 'text-[#34C759]';

  return (
    <button
      onClick={() => onClick(node)}
      className={`w-full text-left rounded-lg p-3.5 transition-all cursor-pointer border-l-[3px] ${
        isCritical
          ? 'bg-[#FF3B30]/[0.08] animate-pulse-alert'
          : 'bg-[#1a2733] hover:bg-[#223344]'
      }`}
      style={{ borderLeftColor: borderColor[node.status] }}
    >
      <div className="flex items-start justify-between mb-1.5">
        <span className="text-[14px] font-semibold text-[#F5F5F7] leading-tight">{node.shortName}</span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${ISP_COLORS[node.isp] || 'bg-[#2a3f50] text-[#8ba3b8]'}`}>
          {node.isp}
        </span>
      </div>
      <p className="text-[12px] text-[#8ba3b8] mb-2.5">{node.location}</p>
      <div className="border-t border-[#2a3f50] pt-2 flex items-center gap-4 text-[12px] font-mono">
        <span>
          <span className={latencyColor}>{node.latency}ms</span>
          <span className="text-[#5a7080] ml-1 text-[10px]">Lat.</span>
        </span>
        <span>
          <span className={uptimeColor}>{node.uptime}%</span>
          <span className="text-[#5a7080] ml-1 text-[10px]">Up</span>
        </span>
      </div>
    </button>
  );
}
