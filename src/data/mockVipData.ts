export type VipNodeStatus = 'ok' | 'warning' | 'critical';

export interface MeshNode {
  id: string;
  location: string; // e.g. "Sala", "Recámara principal"
  signalQuality: number; // 0-100%
  frequency: '2.4GHz' | '5GHz' | '6GHz';
  interference: boolean;
  synced: boolean;
}

export interface VipClient {
  id: string;
  name: string;
  plan: string; // e.g. "500 Mbps Simétrico"
  planSpeedMbps: number;
  connectedDevices: number;
  latency: number; // ms
  packetLoss: number; // %
  uptime: number; // % last 30d
  status: VipNodeStatus;
  meshNodes: MeshNode[];
  speedHistory: { hour: string; download: number; upload: number }[];
  proactiveAlerts: ProactiveAlert[];
}

export interface ProactiveAlert {
  id: string;
  timestamp: string;
  type: 'speed_drop' | 'mesh_desync' | 'interference' | 'latency_spike' | 'packet_loss';
  message: string;
  autoResolved: boolean;
  clientNotified: boolean;
  clientMessage?: string;
}

export const VIP_THRESHOLDS = {
  latency: { normal: 15, alert: 15, critical: 30 },
  packetLoss: { normal: 0.5, alert: 0.5 },
  uptimeMin: 99.9,
  speedDropPercent: 20,
} as const;

export function getVipStatus(latency: number, packetLoss: number, uptime: number): VipNodeStatus {
  if (latency > VIP_THRESHOLDS.latency.critical || packetLoss > 1 || uptime < 99) return 'critical';
  if (latency > VIP_THRESHOLDS.latency.alert || packetLoss > VIP_THRESHOLDS.packetLoss.alert || uptime < VIP_THRESHOLDS.uptimeMin) return 'warning';
  return 'ok';
}

function generateSpeedHistory(planSpeed: number, variance: number): { hour: string; download: number; upload: number }[] {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    download: Math.round(planSpeed * (0.85 + Math.random() * 0.15 - variance)),
    upload: Math.round(planSpeed * (0.80 + Math.random() * 0.15 - variance)),
  }));
}

export const MOCK_VIP_CLIENTS: VipClient[] = [
  {
    id: 'vip-001',
    name: 'Residencia García-Mendoza',
    plan: '500 Mbps Simétrico',
    planSpeedMbps: 500,
    connectedDevices: 23,
    latency: 8,
    packetLoss: 0.1,
    uptime: 99.98,
    status: 'ok',
    meshNodes: [
      { id: 'mn-1a', location: 'Sala principal', signalQuality: 97, frequency: '5GHz', interference: false, synced: true },
      { id: 'mn-1b', location: 'Estudio', signalQuality: 94, frequency: '5GHz', interference: false, synced: true },
      { id: 'mn-1c', location: 'Recámara principal', signalQuality: 91, frequency: '5GHz', interference: false, synced: true },
      { id: 'mn-1d', location: 'Jardín', signalQuality: 78, frequency: '2.4GHz', interference: false, synced: true },
    ],
    speedHistory: generateSpeedHistory(500, 0.02),
    proactiveAlerts: [],
  },
  {
    id: 'vip-002',
    name: 'Residencia Torres-Vega',
    plan: '1 Gbps Simétrico',
    planSpeedMbps: 1000,
    connectedDevices: 41,
    latency: 18,
    packetLoss: 0.6,
    uptime: 99.92,
    status: 'warning',
    meshNodes: [
      { id: 'mn-2a', location: 'Sala', signalQuality: 95, frequency: '6GHz', interference: false, synced: true },
      { id: 'mn-2b', location: 'Oficina', signalQuality: 88, frequency: '5GHz', interference: true, synced: true },
      { id: 'mn-2c', location: 'Recámara principal', signalQuality: 45, frequency: '5GHz', interference: true, synced: false },
      { id: 'mn-2d', location: 'Cuarto TV', signalQuality: 82, frequency: '5GHz', interference: false, synced: true },
      { id: 'mn-2e', location: 'Terraza', signalQuality: 61, frequency: '2.4GHz', interference: false, synced: true },
    ],
    speedHistory: generateSpeedHistory(1000, 0.08),
    proactiveAlerts: [
      {
        id: 'pa-1',
        timestamp: 'Hace 12 min',
        type: 'mesh_desync',
        message: 'Nodo mesh en Recámara principal perdió sincronía',
        autoResolved: false,
        clientNotified: true,
        clientMessage: 'Detectamos una pequeña variación en tu servicio en la recámara principal. Ya estamos trabajando en ello. No necesitas hacer nada — te avisamos cuando esté resuelto.',
      },
      {
        id: 'pa-2',
        timestamp: 'Hace 35 min',
        type: 'interference',
        message: 'Interferencia detectada en canal WiFi 5GHz — Oficina — cambiando canal',
        autoResolved: true,
        clientNotified: false,
      },
    ],
  },
  {
    id: 'vip-003',
    name: 'Residencia Nakamura',
    plan: '500 Mbps Simétrico',
    planSpeedMbps: 500,
    connectedDevices: 15,
    latency: 6,
    packetLoss: 0.0,
    uptime: 100,
    status: 'ok',
    meshNodes: [
      { id: 'mn-3a', location: 'Living room', signalQuality: 99, frequency: '6GHz', interference: false, synced: true },
      { id: 'mn-3b', location: 'Bedroom', signalQuality: 96, frequency: '5GHz', interference: false, synced: true },
      { id: 'mn-3c', location: 'Office', signalQuality: 93, frequency: '5GHz', interference: false, synced: true },
    ],
    speedHistory: generateSpeedHistory(500, 0.01),
    proactiveAlerts: [],
  },
  {
    id: 'vip-004',
    name: 'Residencia Fernández-Ruiz',
    plan: '1 Gbps Simétrico',
    planSpeedMbps: 1000,
    connectedDevices: 38,
    latency: 35,
    packetLoss: 1.2,
    uptime: 98.7,
    status: 'critical',
    meshNodes: [
      { id: 'mn-4a', location: 'Sala', signalQuality: 72, frequency: '5GHz', interference: true, synced: true },
      { id: 'mn-4b', location: 'Estudio', signalQuality: 31, frequency: '2.4GHz', interference: true, synced: false },
      { id: 'mn-4c', location: 'Recámara 1', signalQuality: 55, frequency: '5GHz', interference: false, synced: true },
      { id: 'mn-4d', location: 'Recámara 2', signalQuality: 28, frequency: '2.4GHz', interference: true, synced: false },
    ],
    speedHistory: generateSpeedHistory(1000, 0.25),
    proactiveAlerts: [
      {
        id: 'pa-3',
        timestamp: 'Hace 3 min',
        type: 'speed_drop',
        message: 'Velocidad bajó 40% — revisando automáticamente',
        autoResolved: false,
        clientNotified: true,
        clientMessage: 'Detectamos una pequeña variación en tu servicio. Ya estamos trabajando en ello. No necesitas hacer nada — te avisamos cuando esté resuelto.',
      },
      {
        id: 'pa-4',
        timestamp: 'Hace 8 min',
        type: 'latency_spike',
        message: 'Latencia elevada a 35ms — sobrepasa umbral crítico (30ms)',
        autoResolved: false,
        clientNotified: true,
        clientMessage: 'Detectamos una pequeña variación en tu servicio. Ya estamos trabajando en ello. No necesitas hacer nada — te avisamos cuando esté resuelto.',
      },
      {
        id: 'pa-5',
        timestamp: 'Hace 15 min',
        type: 'interference',
        message: 'Interferencia severa en 2.4GHz — Estudio y Recámara 2',
        autoResolved: false,
        clientNotified: false,
      },
    ],
  },
];

export function getVipSummary(clients: VipClient[]) {
  const total = clients.length;
  const ok = clients.filter(c => c.status === 'ok').length;
  const warning = clients.filter(c => c.status === 'warning').length;
  const critical = clients.filter(c => c.status === 'critical').length;
  const totalDevices = clients.reduce((s, c) => s + c.connectedDevices, 0);
  const avgLatency = Math.round(clients.reduce((s, c) => s + c.latency, 0) / (total || 1) * 10) / 10;
  const totalAlerts = clients.reduce((s, c) => s + c.proactiveAlerts.length, 0);
  const unresolvedAlerts = clients.reduce((s, c) => s + c.proactiveAlerts.filter(a => !a.autoResolved).length, 0);
  const totalMeshNodes = clients.reduce((s, c) => s + c.meshNodes.length, 0);
  const desyncedMesh = clients.reduce((s, c) => s + c.meshNodes.filter(m => !m.synced).length, 0);
  return { total, ok, warning, critical, totalDevices, avgLatency, totalAlerts, unresolvedAlerts, totalMeshNodes, desyncedMesh };
}
