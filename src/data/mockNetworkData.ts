export type NodeStatus = 'ok' | 'warning' | 'critical';
export type AlertSeverity = 'critico' | 'alto' | 'medio' | 'bajo';
export type AlertStatus = 'nueva' | 'en_atencion' | 'resuelta';

export interface NetworkNode {
  id: string;
  name: string;
  location: string;
  zone: string;
  status: NodeStatus;
  latency: number;
  uptime: number;
  ip: string;
  lastIncident: string;
  bandwidthUp: number;
  bandwidthDown: number;
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
  { id: 'n1', name: 'NL-MONTERREY-CORE', location: 'Monterrey, NL', zone: 'Nuevo León', status: 'ok', latency: 2, uptime: 99.9, ip: '10.0.1.1', lastIncident: '2026-02-15', bandwidthUp: 850, bandwidthDown: 920 },
  { id: 'n2', name: 'NL-APODACA-DIST', location: 'Apodaca, NL', zone: 'Nuevo León', status: 'warning', latency: 45, uptime: 97.2, ip: '10.0.2.1', lastIncident: '2026-03-10', bandwidthUp: 320, bandwidthDown: 410 },
  { id: 'n3', name: 'NL-ESCOBEDO-DIST', location: 'Escobedo, NL', zone: 'Nuevo León', status: 'ok', latency: 3, uptime: 99.8, ip: '10.0.3.1', lastIncident: '2026-01-20', bandwidthUp: 280, bandwidthDown: 350 },
  { id: 'n4', name: 'COAH-SALTILLO-CORE', location: 'Saltillo, COAH', zone: 'Coahuila', status: 'critical', latency: 210, uptime: 89.1, ip: '10.1.1.1', lastIncident: '2026-03-12', bandwidthUp: 50, bandwidthDown: 80 },
  { id: 'n5', name: 'COAH-RAMOS-DIST', location: 'Ramos Arizpe, COAH', zone: 'Coahuila', status: 'ok', latency: 5, uptime: 99.7, ip: '10.1.2.1', lastIncident: '2026-02-28', bandwidthUp: 190, bandwidthDown: 250 },
  { id: 'n6', name: 'SLP-CAPITAL-CORE', location: 'San Luis Potosí, SLP', zone: 'San Luis Potosí', status: 'ok', latency: 8, uptime: 99.5, ip: '10.2.1.1', lastIncident: '2026-03-01', bandwidthUp: 420, bandwidthDown: 510 },
  { id: 'n7', name: 'SLP-SOLEDAD-DIST', location: 'Soledad de G.S., SLP', zone: 'San Luis Potosí', status: 'warning', latency: 67, uptime: 95.3, ip: '10.2.2.1', lastIncident: '2026-03-11', bandwidthUp: 150, bandwidthDown: 200 },
  { id: 'n8', name: 'NL-GARCIA-DIST', location: 'García, NL', zone: 'Nuevo León', status: 'ok', latency: 4, uptime: 99.9, ip: '10.0.4.1', lastIncident: '2026-01-15', bandwidthUp: 210, bandwidthDown: 270 },
  { id: 'n9', name: 'COAH-TORREON-CORE', location: 'Torreón, COAH', zone: 'Coahuila', status: 'ok', latency: 6, uptime: 99.6, ip: '10.1.3.1', lastIncident: '2026-02-10', bandwidthUp: 380, bandwidthDown: 460 },
  { id: 'n10', name: 'NL-SANTA-CATARINA', location: 'Santa Catarina, NL', zone: 'Nuevo León', status: 'ok', latency: 3, uptime: 99.8, ip: '10.0.5.1', lastIncident: '2026-02-20', bandwidthUp: 260, bandwidthDown: 310 },
];

export const MOCK_ALERTS: ActiveAlert[] = [
  { id: 'a1', timestamp: '2026-03-12 14:32:10', nodeId: 'n4', nodeName: 'COAH-SALTILLO-CORE', type: 'Alta latencia', severity: 'critico', assignedTech: 'Carlos Mendoza', status: 'nueva', isNew: true },
  { id: 'a2', timestamp: '2026-03-12 14:28:45', nodeId: 'n4', nodeName: 'COAH-SALTILLO-CORE', type: 'Packet loss >5%', severity: 'critico', assignedTech: 'Carlos Mendoza', status: 'nueva', isNew: true },
  { id: 'a3', timestamp: '2026-03-12 13:15:22', nodeId: 'n2', nodeName: 'NL-APODACA-DIST', type: 'Latencia elevada', severity: 'alto', assignedTech: 'Ana Rodríguez', status: 'en_atencion' },
  { id: 'a4', timestamp: '2026-03-12 12:45:00', nodeId: 'n7', nodeName: 'SLP-SOLEDAD-DIST', type: 'Latencia elevada', severity: 'alto', assignedTech: 'Miguel Ángel Torres', status: 'en_atencion' },
  { id: 'a5', timestamp: '2026-03-12 11:30:15', nodeId: 'n2', nodeName: 'NL-APODACA-DIST', type: 'CPU alto', severity: 'medio', assignedTech: 'Ana Rodríguez', status: 'nueva' },
  { id: 'a6', timestamp: '2026-03-12 10:20:00', nodeId: 'n9', nodeName: 'COAH-TORREON-CORE', type: 'Interfaz flapping', severity: 'bajo', assignedTech: 'Laura Garza', status: 'resuelta' },
];

export function generateBandwidthHistory(): { time: string; upload: number; download: number }[] {
  const data = [];
  for (let i = 24; i >= 0; i--) {
    const h = new Date();
    h.setHours(h.getHours() - i);
    data.push({
      time: `${h.getHours().toString().padStart(2, '0')}:00`,
      upload: Math.floor(800 + Math.random() * 400),
      download: Math.floor(1000 + Math.random() * 500),
    });
  }
  return data;
}

export function getNetworkHealthPercent(nodes: NetworkNode[]): number {
  const okNodes = nodes.filter(n => n.status === 'ok').length;
  return parseFloat(((okNodes / nodes.length) * 100).toFixed(1));
}

export function getAverageLatency(nodes: NetworkNode[]): number {
  return parseFloat((nodes.reduce((s, n) => s + n.latency, 0) / nodes.length).toFixed(1));
}

export function getPacketLoss(nodes: NetworkNode[]): number {
  // TODO: connect to Zabbix API for real packet loss data
  const criticalNodes = nodes.filter(n => n.status === 'critical').length;
  return parseFloat((criticalNodes * 2.1 + Math.random() * 0.5).toFixed(2));
}
