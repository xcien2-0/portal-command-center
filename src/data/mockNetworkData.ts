export type NodeStatus = 'ok' | 'warning' | 'critical';
export type AlertSeverity = 'critico' | 'alto' | 'medio' | 'bajo';
export type AlertStatus = 'nueva' | 'en_atencion' | 'resuelta';

export interface NetworkNode {
  id: string;
  name: string;
  shortName: string;
  location: string;
  zone: string;
  isp: string;
  status: NodeStatus;
  latency: number;
  uptime: number;
  ip: string;
  lastIncident: string;
  bandwidthUp: number;
  bandwidthDown: number;
  packetLoss: number;
  signal: number; // dBm
  weekHealth: NodeStatus[]; // 7 days
}

export interface ActiveAlert {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeName: string;
  type: string;
  severity: AlertSeverity;
  assignedTech: string;
  status: AlertStatus;
  isNew?: boolean;
}

export interface Incident {
  id: string;
  nodeId: string;
  description: string;
  priority: AlertSeverity;
  assignedTech: string;
  estimatedResolution: string;
  internalNotes: string;
  createdAt: string;
  status: AlertStatus;
}

export const TECHNICIANS = [
  'Carlos Mendoza',
  'Ana Rodríguez',
  'Miguel Ángel Torres',
  'Laura Garza',
  'Roberto Salinas',
];

export const MOCK_NODES: NetworkNode[] = [
  { id: 'n1', name: 'NL-MONTERREY-CORE', shortName: 'MTY-CORE', location: 'Monterrey, NL', zone: 'Nuevo León', isp: 'Xcien', status: 'ok', latency: 2, uptime: 99.9, ip: '10.0.1.1', lastIncident: '2026-02-15', bandwidthUp: 850, bandwidthDown: 920, packetLoss: 0.01, signal: -22, weekHealth: ['ok','ok','ok','ok','ok','ok','ok'] },
  { id: 'n2', name: 'NL-APODACA-DIST', shortName: 'APO-DIST', location: 'Apodaca, NL', zone: 'Nuevo León', isp: 'Xcien', status: 'warning', latency: 45, uptime: 97.2, ip: '10.0.2.1', lastIncident: '2026-03-10', bandwidthUp: 320, bandwidthDown: 410, packetLoss: 0.8, signal: -41, weekHealth: ['ok','ok','warning','ok','ok','warning','warning'] },
  { id: 'n3', name: 'NL-ESCOBEDO-DIST', shortName: 'ESC-DIST', location: 'Escobedo, NL', zone: 'Nuevo León', isp: 'Luminet', status: 'ok', latency: 3, uptime: 99.8, ip: '10.0.3.1', lastIncident: '2026-01-20', bandwidthUp: 280, bandwidthDown: 350, packetLoss: 0.02, signal: -28, weekHealth: ['ok','ok','ok','ok','ok','ok','ok'] },
  { id: 'n4', name: 'COAH-SALTILLO-CORE', shortName: 'SAL-CORE', location: 'Saltillo, COAH', zone: 'Coahuila', isp: 'Wispi', status: 'critical', latency: 210, uptime: 89.1, ip: '10.1.1.1', lastIncident: '2026-03-12', bandwidthUp: 50, bandwidthDown: 80, packetLoss: 5.2, signal: -68, weekHealth: ['ok','ok','ok','warning','warning','critical','critical'] },
  { id: 'n5', name: 'COAH-RAMOS-DIST', shortName: 'RAM-DIST', location: 'Ramos Arizpe, COAH', zone: 'Coahuila', isp: 'Wispi', status: 'ok', latency: 5, uptime: 99.7, ip: '10.1.2.1', lastIncident: '2026-02-28', bandwidthUp: 190, bandwidthDown: 250, packetLoss: 0.05, signal: -30, weekHealth: ['ok','ok','ok','ok','ok','ok','ok'] },
  { id: 'n6', name: 'SLP-CAPITAL-CORE', shortName: 'SLP-CORE', location: 'San Luis Potosí, SLP', zone: 'San Luis Potosí', isp: 'Luminet', status: 'ok', latency: 8, uptime: 99.5, ip: '10.2.1.1', lastIncident: '2026-03-01', bandwidthUp: 420, bandwidthDown: 510, packetLoss: 0.1, signal: -25, weekHealth: ['ok','ok','ok','ok','ok','ok','ok'] },
  { id: 'n7', name: 'SLP-SOLEDAD-DIST', shortName: 'SOL-DIST', location: 'Soledad de G.S., SLP', zone: 'San Luis Potosí', isp: 'Coco', status: 'warning', latency: 67, uptime: 95.3, ip: '10.2.2.1', lastIncident: '2026-03-11', bandwidthUp: 150, bandwidthDown: 200, packetLoss: 1.5, signal: -52, weekHealth: ['ok','warning','ok','ok','warning','warning','warning'] },
  { id: 'n8', name: 'NL-GARCIA-DIST', shortName: 'GAR-DIST', location: 'García, NL', zone: 'Nuevo León', isp: 'iBlack', status: 'ok', latency: 4, uptime: 99.9, ip: '10.0.4.1', lastIncident: '2026-01-15', bandwidthUp: 210, bandwidthDown: 270, packetLoss: 0.02, signal: -26, weekHealth: ['ok','ok','ok','ok','ok','ok','ok'] },
  { id: 'n9', name: 'COAH-TORREON-CORE', shortName: 'TOR-CORE', location: 'Torreón, COAH', zone: 'Coahuila', isp: 'Xcien', status: 'ok', latency: 6, uptime: 99.6, ip: '10.1.3.1', lastIncident: '2026-02-10', bandwidthUp: 380, bandwidthDown: 460, packetLoss: 0.08, signal: -24, weekHealth: ['ok','ok','ok','ok','ok','ok','ok'] },
  { id: 'n10', name: 'NL-SANTA-CATARINA', shortName: 'STC-DIST', location: 'Santa Catarina, NL', zone: 'Nuevo León', isp: 'iBlack', status: 'ok', latency: 3, uptime: 99.8, ip: '10.0.5.1', lastIncident: '2026-02-20', bandwidthUp: 260, bandwidthDown: 310, packetLoss: 0.03, signal: -29, weekHealth: ['ok','ok','ok','ok','ok','ok','ok'] },
];

export const MOCK_ALERTS: ActiveAlert[] = [
  { id: 'a1', timestamp: '14:32', nodeId: 'n4', nodeName: 'COAH-SALTILLO-CORE', type: 'Alta latencia', severity: 'critico', assignedTech: 'Carlos Mendoza', status: 'nueva', isNew: true },
  { id: 'a2', timestamp: '14:28', nodeId: 'n4', nodeName: 'COAH-SALTILLO-CORE', type: 'Packet loss >5%', severity: 'critico', assignedTech: 'Carlos Mendoza', status: 'nueva', isNew: true },
  { id: 'a3', timestamp: '13:15', nodeId: 'n2', nodeName: 'NL-APODACA-DIST', type: 'Latencia elevada', severity: 'alto', assignedTech: 'Ana Rodríguez', status: 'en_atencion' },
  { id: 'a4', timestamp: '12:45', nodeId: 'n7', nodeName: 'SLP-SOLEDAD-DIST', type: 'Latencia elevada', severity: 'alto', assignedTech: 'Miguel Ángel Torres', status: 'en_atencion' },
  { id: 'a5', timestamp: '11:30', nodeId: 'n2', nodeName: 'NL-APODACA-DIST', type: 'CPU alto', severity: 'medio', assignedTech: 'Ana Rodríguez', status: 'nueva' },
];

export function generateBandwidthHistory(): { time: string; upload: number; download: number }[] {
  const data = [];
  for (let i = 24; i >= 0; i--) {
    const h = new Date();
    h.setHours(h.getHours() - i);
    const hour = h.getHours();
    // Spike at 14:00 for Saltillo incident
    const spike = hour === 14 ? 0.4 : 0;
    data.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      upload: Math.floor(800 + Math.random() * 400 - spike * 600),
      download: Math.floor(1000 + Math.random() * 500 - spike * 700),
    });
  }
  return data;
}

export function getNetworkHealthPercent(nodes: NetworkNode[]): number {
  const weights = nodes.map(n => n.status === 'ok' ? 1 : n.status === 'warning' ? 0.7 : 0.3);
  return parseFloat(((weights.reduce((a, b) => a + b, 0) / nodes.length) * 100).toFixed(1));
}

export function getAverageLatency(nodes: NetworkNode[]): number {
  return parseFloat((nodes.reduce((s, n) => s + n.latency, 0) / nodes.length).toFixed(1));
}

export function getPacketLoss(nodes: NetworkNode[]): number {
  const criticalNodes = nodes.filter(n => n.status === 'critical').length;
  return parseFloat((criticalNodes * 2.1 + Math.random() * 0.5).toFixed(2));
}
