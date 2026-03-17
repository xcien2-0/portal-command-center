import { useState, useEffect } from 'react';
import { Users, Satellite, Zap, Activity, Radio, MapPin } from 'lucide-react';
import { MOCK_COCO_BOXES, CocoBox, CocoStatus, getCocoSummary, COCO_LATENCY_THRESHOLDS } from '@/data/mockCocoData';

/* ── Status helpers ── */
const statusConfig: Record<CocoStatus, { label: string; dotClass: string; bgClass: string; textClass: string }> = {
  ok:          { label: 'OK',            dotClass: 'bg-status-ok',       bgClass: 'bg-status-ok/15',       textClass: 'text-status-ok' },
  degraded:    { label: 'DEGRADADO',     dotClass: 'bg-status-warning',  bgClass: 'bg-status-warning/15',  textClass: 'text-status-warning' },
  sin_senal:   { label: 'SIN SEÑAL',     dotClass: 'bg-status-critical', bgClass: 'bg-status-critical/15', textClass: 'text-status-critical' },
  sin_energia: { label: 'SIN ENERGÍA',   dotClass: 'bg-status-critical', bgClass: 'bg-status-critical/15', textClass: 'text-status-critical' },
};

const borderColorMap: Record<CocoStatus, string> = {
  ok: 'border-status-ok',
  degraded: 'border-status-warning',
  sin_senal: 'border-status-critical',
  sin_energia: 'border-status-critical',
};

/* ── Simplified Mexico Map ── */
function MexicoMap({ boxes }: { boxes: CocoBox[] }) {
  // Bounding box approx for southern Mexico (OAX, CHIS, GRO, VER)
  const minLat = 14.5, maxLat = 20.5;
  const minLng = -102, maxLng = -88;

  const toX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * 100;
  const toY = (lat: number) => ((maxLat - lat) / (maxLat - minLat)) * 100;

  // Simplified Mexico southern outline (very rough polygon)
  const outline = "M 2,15 L 15,5 L 30,3 L 50,8 L 65,2 L 80,10 L 95,5 L 98,20 L 92,35 L 85,50 L 75,65 L 60,75 L 45,80 L 35,85 L 25,90 L 15,80 L 8,65 L 3,45 Z";

  return (
    <div className="bg-card rounded border border-border p-3">
      <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        Mapa de Comunidades
      </h4>
      <div className="relative bg-accent/50 rounded overflow-hidden" style={{ aspectRatio: '16/10' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Simplified map outline */}
          <path d={outline} fill="hsl(var(--accent))" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.6" />

          {/* State labels */}
          <text x="30" y="55" className="fill-muted-foreground" fontSize="3" textAnchor="middle" opacity="0.5">GRO</text>
          <text x="50" y="50" className="fill-muted-foreground" fontSize="3" textAnchor="middle" opacity="0.5">OAX</text>
          <text x="75" y="55" className="fill-muted-foreground" fontSize="3" textAnchor="middle" opacity="0.5">CHIS</text>
          <text x="55" y="25" className="fill-muted-foreground" fontSize="3" textAnchor="middle" opacity="0.5">VER</text>

          {/* Community dots */}
          {boxes.map(box => {
            const x = toX(box.lng);
            const y = toY(box.lat);
            const sc = statusConfig[box.status];
            const fillColor = box.status === 'ok' ? 'hsl(var(--status-ok))'
              : box.status === 'degraded' ? 'hsl(var(--status-warning))'
              : 'hsl(var(--status-critical))';

            return (
              <g key={box.id}>
                {/* Pulse ring for critical */}
                {(box.status === 'sin_energia' || box.status === 'sin_senal') && (
                  <circle cx={x} cy={y} r="4" fill="none" stroke={fillColor} strokeWidth="0.3" opacity="0.4">
                    <animate attributeName="r" from="2.5" to="6" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={x} cy={y} r="2.5" fill={fillColor} opacity="0.85" />
                <circle cx={x} cy={y} r="1" fill="white" opacity="0.7" />
                <text x={x} y={y - 4} fill="hsl(var(--foreground))" fontSize="2.2" textAnchor="middle" fontWeight="600">
                  {box.community}
                </text>
                <text x={x} y={y + 5} fill="hsl(var(--muted-foreground))" fontSize="1.8" textAnchor="middle">
                  {box.connectedUsers > 0 ? `${box.connectedUsers} usuarios` : 'offline'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-ok inline-block" /> OK</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-warning inline-block" /> Degradado</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-critical inline-block" /> Crítico</span>
      </div>
    </div>
  );
}

/* ── Community Card ── */
function CommunityCard({ box }: { box: CocoBox }) {
  const sc = statusConfig[box.status];

  return (
    <div className={`bg-card rounded border-l-2 ${borderColorMap[box.status]} border border-border p-3`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-xs font-semibold font-mono">{box.community}</h3>
          <p className="text-[10px] text-muted-foreground">{box.state}</p>
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${sc.bgClass} ${sc.textClass}`}>
          {sc.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="flex items-center gap-1.5">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono font-medium">{box.connectedUsers}</span>
          <span className="text-muted-foreground">usuarios</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Satellite className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono font-medium">{box.satelliteSignal !== null ? `${box.satelliteSignal} dBm` : '—'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-muted-foreground" />
          <span className={`font-mono font-medium ${
            box.latency === null ? 'text-status-critical'
            : box.latency >= COCO_LATENCY_THRESHOLDS.critical ? 'text-status-critical'
            : box.latency >= COCO_LATENCY_THRESHOLDS.alert ? 'text-status-warning'
            : ''
          }`}>
            {box.latency !== null ? `${box.latency} ms` : '—'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {box.status === 'sin_energia' ? (
            <>
              <Zap className="h-3 w-3 text-status-critical" />
              <span className="text-status-critical font-medium">Sin energía</span>
            </>
          ) : (
            <>
              <Zap className="h-3 w-3 text-status-ok" />
              <span className="text-muted-foreground">Energía OK</span>
            </>
          )}
        </div>
      </div>

      <p className="text-[9px] text-muted-foreground mt-2">{box.lastSeen}</p>
    </div>
  );
}

/* ── Main Page ── */
export default function CocoBoxMonitor() {
  const [boxes, setBoxes] = useState(MOCK_COCO_BOXES);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString('es-MX'));

  useEffect(() => {
    const interval = setInterval(() => {
      setBoxes(prev => prev.map(b => {
        if (b.status === 'sin_energia') return b;
        return {
          ...b,
          connectedUsers: Math.max(0, b.connectedUsers + Math.floor(Math.random() * 5 - 2)),
          latency: b.latency !== null ? Math.max(400, b.latency + Math.floor(Math.random() * 100 - 50)) : null,
        };
      }));
      setLastUpdated(new Date().toLocaleTimeString('es-MX'));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const summary = getCocoSummary(boxes);

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Radio className="h-4 w-4 text-primary" />
          <div>
            <h1 className="text-sm font-semibold">Coco Box Monitor</h1>
            <p className="text-[10px] text-muted-foreground">Tenant: coco · {summary.total} comunidades</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-ok animate-pulse" />
            <span className="text-muted-foreground">{summary.ok} OK</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-warning" />
            <span className="text-muted-foreground">{summary.degraded} Degradado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-critical animate-pulse" />
            <span className="text-muted-foreground">{summary.critical} Crítico</span>
          </div>
          <span className="text-muted-foreground font-mono text-[10px]">⟳ {lastUpdated}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Summary metrics */}
        <div className="grid grid-cols-5 gap-2">
          <MetricBox icon={<Users className="h-3.5 w-3.5" />} label="Usuarios conectados" value={`${summary.totalUsers}`} />
          <MetricBox icon={<Satellite className="h-3.5 w-3.5" />} label="Señal promedio" value={`${summary.avgSignal} dBm`} />
          <MetricBox icon={<Activity className="h-3.5 w-3.5" />} label="Latencia promedio" value={`${summary.avgLatency} ms`} sub={summary.avgLatency > COCO_LATENCY_THRESHOLDS.alert ? 'Sobre umbral' : 'Normal (600-800ms)'} />
          <MetricBox icon={<Radio className="h-3.5 w-3.5" />} label="Comunidades activas" value={`${summary.ok + summary.degraded}/${summary.total}`} />
          <MetricBox icon={<Zap className="h-3.5 w-3.5" />} label="Sin energía" value={`${boxes.filter(b => b.status === 'sin_energia').length}`} sub={boxes.filter(b => b.status === 'sin_energia').length > 0 ? 'Intervención requerida' : 'Todo con energía'} />
        </div>

        {/* Map + Cards */}
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3">
            <MexicoMap boxes={boxes} />
          </div>
          <div className="col-span-2 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comunidades</h2>
            {boxes.map(box => (
              <CommunityCard key={box.id} box={box} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
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
