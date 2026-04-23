import { X, Wifi, Clock, Activity, Signal } from 'lucide-react';
import { NetworkNode, NodeStatus } from '@/data/mockNetworkData';

const healthBarColor: Record<NodeStatus, string> = {
  ok: 'bg-[#34C759]',
  warning: 'bg-[#FF9F0A]',
  critical: 'bg-[#FF3B30]',
};

const ISP_COLORS: Record<string, string> = {
  Xcien:   'bg-[#1B7F4A]/20 text-[#1D9E75]',
  Luminet: 'bg-[#0E6B3A]/20 text-[#0EA472]',
  Wispi:   'bg-[#0ea5e9]/20 text-[#38bdf8]',
  Huus:    'bg-[#7C3AED]/20 text-[#a78bfa]',
  Sandur:  'bg-[#EA580C]/20 text-[#fb923c]',
};

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const recentIncidents = [
  { date: '12 Mar 14:32', desc: 'Alta latencia — pico 210ms' },
  { date: '10 Mar 09:15', desc: 'Interfaz flapping eth0/1' },
  { date: '28 Feb 22:40', desc: 'Packet loss intermitente' },
];

interface NodeDetailPanelProps {
  node: NetworkNode;
  onClose: () => void;
  onCreateIncident: (nodeId: string) => void;
}

export function NodeDetailPanel({ node, onClose, onCreateIncident }: NodeDetailPanelProps) {
  const latencyColor = node.latency > 150 ? 'text-[#FF3B30]' : node.latency > 30 ? 'text-[#FF9F0A]' : 'text-[#34C759]';
  const uptimeColor = node.uptime < 95 ? 'text-[#FF3B30]' : node.uptime < 99 ? 'text-[#FF9F0A]' : 'text-[#34C759]';

  return (
    <div className="fixed right-0 top-0 h-full w-[360px] bg-[#1a2733] border-l border-[#2a3f50] z-40 animate-slide-in-right flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#2a3f50]">
        <div>
          <h3 className="text-[20px] font-bold text-[#F5F5F7]">{node.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[13px] text-[#8ba3b8]">{node.location}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${ISP_COLORS[node.isp] || ''}`}>{node.isp}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-[#5a7080] hover:text-[#F5F5F7] transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* 2x2 Live metrics */}
        <div className="grid grid-cols-2 gap-3">
          <MetricBox icon={<Clock className="h-3.5 w-3.5" />} label="Latencia" value={`${node.latency}ms`} color={latencyColor} />
          <MetricBox icon={<Wifi className="h-3.5 w-3.5" />} label="Packet Loss" value={`${node.packetLoss}%`} color={node.packetLoss > 1 ? 'text-[#FF3B30]' : 'text-[#34C759]'} />
          <MetricBox icon={<Activity className="h-3.5 w-3.5" />} label="Uptime" value={`${node.uptime}%`} color={uptimeColor} />
          <MetricBox icon={<Signal className="h-3.5 w-3.5" />} label="Señal" value={`${node.signal} dBm`} color={node.signal < -50 ? 'text-[#FF9F0A]' : 'text-[#34C759]'} />
        </div>

        {/* 7-day health */}
        <div>
          <h4 className="text-[12px] font-medium text-[#5a7080] uppercase tracking-wider mb-2">Historial 7 días</h4>
          <div className="flex gap-1.5">
            {node.weekHealth.map((status, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full h-8 rounded ${healthBarColor[status]}`} />
                <span className="text-[10px] text-[#5a7080]">{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent incidents */}
        <div>
          <h4 className="text-[12px] font-medium text-[#5a7080] uppercase tracking-wider mb-2">Últimos incidentes</h4>
          <div className="space-y-2">
            {recentIncidents.map((inc, i) => (
              <div key={i} className="bg-[#0f1923] rounded-lg p-3">
                <p className="text-[11px] text-[#5a7080] font-mono">{inc.date}</p>
                <p className="text-[13px] text-[#8ba3b8] mt-0.5">{inc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-[#2a3f50] space-y-2">
        <button
          onClick={() => onCreateIncident(node.id)}
          className="w-full h-10 bg-[#34C759] hover:bg-[#2db84e] text-[#0f1923] font-semibold text-[13px] rounded-lg transition-colors"
        >
          Crear incidente
        </button>
        <button className="w-full h-10 text-[#8ba3b8] hover:text-[#F5F5F7] text-[13px] transition-colors">
          Ver historial completo →
        </button>
      </div>
    </div>
  );
}

function MetricBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-[#0f1923] rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-[#5a7080] mb-1">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className={`text-[20px] font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}
