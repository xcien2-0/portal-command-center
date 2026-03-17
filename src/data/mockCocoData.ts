export type CocoStatus = 'ok' | 'degraded' | 'sin_energia' | 'sin_senal';

export interface CocoBox {
  id: string;
  community: string;
  state: string;
  connectedUsers: number;
  satelliteSignal: number | null; // dBm, null when no power
  latency: number | null; // ms, null when offline
  status: CocoStatus;
  lat: number;
  lng: number;
  lastSeen: string;
}

export const COCO_LATENCY_THRESHOLDS = {
  normal: 800,
  alert: 1200,
  critical: 2000,
} as const;

export function getCocoStatusFromMetrics(
  latency: number | null,
  signal: number | null,
  hasPower: boolean
): CocoStatus {
  if (!hasPower) return 'sin_energia';
  if (signal === null || signal < -85) return 'sin_senal';
  if (latency !== null && latency >= COCO_LATENCY_THRESHOLDS.critical) return 'sin_senal';
  if (
    (latency !== null && latency >= COCO_LATENCY_THRESHOLDS.alert) ||
    (signal !== null && signal < -75)
  )
    return 'degraded';
  return 'ok';
}

export const MOCK_COCO_BOXES: CocoBox[] = [
  {
    id: 'coco-001',
    community: 'San Marcos',
    state: 'OAX',
    connectedUsers: 47,
    satelliteSignal: -65,
    latency: 680,
    status: 'ok',
    lat: 16.8,
    lng: -99.4,
    lastSeen: 'Hace 2 min',
  },
  {
    id: 'coco-002',
    community: 'El Palmar',
    state: 'CHIS',
    connectedUsers: 23,
    satelliteSignal: -78,
    latency: 1350,
    status: 'degraded',
    lat: 15.5,
    lng: -92.4,
    lastSeen: 'Hace 5 min',
  },
  {
    id: 'coco-003',
    community: 'La Montaña',
    state: 'GRO',
    connectedUsers: 0,
    satelliteSignal: null,
    latency: null,
    status: 'sin_energia',
    lat: 17.4,
    lng: -98.7,
    lastSeen: 'Hace 4 hrs',
  },
  {
    id: 'coco-004',
    community: 'Valle Verde',
    state: 'OAX',
    connectedUsers: 61,
    satelliteSignal: -62,
    latency: 620,
    status: 'ok',
    lat: 17.1,
    lng: -96.7,
    lastSeen: 'Hace 1 min',
  },
  {
    id: 'coco-005',
    community: 'Tierra Blanca',
    state: 'VER',
    connectedUsers: 38,
    satelliteSignal: -71,
    latency: 740,
    status: 'ok',
    lat: 18.4,
    lng: -96.3,
    lastSeen: 'Hace 3 min',
  },
];

export function getCocoSummary(boxes: CocoBox[]) {
  const total = boxes.length;
  const ok = boxes.filter(b => b.status === 'ok').length;
  const degraded = boxes.filter(b => b.status === 'degraded').length;
  const critical = boxes.filter(b => b.status === 'sin_energia' || b.status === 'sin_senal').length;
  const totalUsers = boxes.reduce((sum, b) => sum + b.connectedUsers, 0);
  const avgSignal = boxes.filter(b => b.satelliteSignal !== null).reduce((sum, b) => sum + (b.satelliteSignal ?? 0), 0) / (boxes.filter(b => b.satelliteSignal !== null).length || 1);
  const avgLatency = boxes.filter(b => b.latency !== null).reduce((sum, b) => sum + (b.latency ?? 0), 0) / (boxes.filter(b => b.latency !== null).length || 1);
  return { total, ok, degraded, critical, totalUsers, avgSignal: Math.round(avgSignal), avgLatency: Math.round(avgLatency) };
}
