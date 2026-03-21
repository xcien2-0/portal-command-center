import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { NetworkNode } from '@/data/mockNetworkData';

interface MetricsSectionProps {
  avgLatency: number;
  packetLoss: number;
  activeNodes: number;
  totalNodes: number;
  incidentsToday: number;
  bandwidthData: { time: string; upload: number; download: number }[];
  nodes: NetworkNode[];
}

export function MetricsSection({ bandwidthData }: MetricsSectionProps) {
  return (
    <div>
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#8ba3b8] mb-3">
        Tráfico — últimas 24 horas
      </h2>
      <div className="bg-[#1a2733] rounded-xl p-4 border border-[#2a3f50]">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={bandwidthData}>
            <defs>
              <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34C759" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#34C759" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="downloadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0A84FF" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#0A84FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3f50" strokeOpacity={0.5} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: '#5a7080' }}
              axisLine={{ stroke: '#2a3f50' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#5a7080' }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: '#1a2733',
                border: '1px solid #2a3f50',
                borderRadius: 8,
                fontSize: 12,
                color: '#F5F5F7',
              }}
              labelStyle={{ color: '#8ba3b8' }}
            />
            <Area
              type="monotone"
              dataKey="upload"
              stroke="#34C759"
              strokeWidth={1.5}
              fill="url(#uploadGrad)"
              name="Upload"
            />
            <Area
              type="monotone"
              dataKey="download"
              stroke="#0A84FF"
              strokeWidth={1.5}
              fill="url(#downloadGrad)"
              name="Download"
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-6 mt-2 text-[13px]">
          <span className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-[#34C759] rounded" />
            <span className="text-[#8ba3b8]">Upload</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-[#0A84FF] rounded" />
            <span className="text-[#8ba3b8]">Download</span>
          </span>
        </div>
      </div>
    </div>
  );
}
