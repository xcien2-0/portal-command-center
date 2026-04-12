import { NOCCity, NOCAlert } from '@/types/noc';

export interface NOCTenantData {
  cities: NOCCity[];
}

const generateHosts = (cityId: string, online: number, offline: number) => {
  const hosts = [];
  for (let i = 1; i <= online + offline; i++) {
    const isOnline = i <= online;
    hosts.push({
      id: `${cityId}-h${i}`,
      ip: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${i}`,
      name: `${cityId.toUpperCase()}-AP-${String(i).padStart(3, '0')}`,
      score: isOnline ? 60 + Math.floor(Math.random() * 40) : 0,
      status: isOnline ? (Math.random() > 0.15 ? 'online' as const : 'degraded' as const) : 'offline' as const,
      lastSeen: isOnline ? new Date().toISOString() : new Date(Date.now() - Math.random() * 3600000).toISOString(),
    });
  }
  return hosts;
};

const buildCity = (id: string, name: string, score: number, online: number, offline: number, alerts: number, lat: number, lng: number): NOCCity => ({
  id,
  name,
  score,
  sites: [
    {
      id: `${id}-s1`,
      name: `Site Principal ${name}`,
      hosts: generateHosts(id, Math.floor(online * 0.6), Math.floor(offline * 0.6)),
      hostsOnline: Math.floor(online * 0.6),
      hostsOffline: Math.floor(offline * 0.6),
    },
    {
      id: `${id}-s2`,
      name: `Site ${name} Norte`,
      hosts: generateHosts(`${id}n`, online - Math.floor(online * 0.6), offline - Math.floor(offline * 0.6)),
      hostsOnline: online - Math.floor(online * 0.6),
      hostsOffline: offline - Math.floor(offline * 0.6),
    },
  ],
  totalHosts: online + offline,
  online,
  offline,
  alerts,
  lat,
  lng,
});

export const mockNOCData: Record<string, NOCTenantData> = {
  xcien: {
    cities: [
      buildCity('mty', 'Monterrey', 77, 121, 18, 4, 25.6866, -100.3161),
      buildCity('pnegras', 'Piedras Negras', 82, 12, 1, 0, 28.7000, -100.5231),
      buildCity('saltillo', 'Saltillo', 89, 22, 0, 1, 25.4232, -100.9928),
    ],
  },
  coco: {
    cities: [
      buildCity('coco_slp', 'Coco / SLP', 83, 15, 1, 0, 22.1565, -100.9855),
    ],
  },
  wispi: {
    cities: [
      buildCity('qro', 'Querétaro', 91, 34, 2, 0, 20.5888, -100.3899),
    ],
  },
  luminet: {
    cities: [
      buildCity('gdl', 'Guadalajara', 85, 28, 3, 1, 20.6597, -103.3496),
    ],
  },
  iblack: {
    cities: [
      buildCity('cdmx', 'CDMX', 79, 45, 8, 3, 19.4326, -99.1332),
    ],
  },
};

export const TENANT_COLORS: Record<string, string> = {
  xcien: '#00B4D8',
  wispi: '#00C896',
  luminet: '#FFB703',
  iblack: '#A78BFA',
  coco: '#FF6B6B',
};

export const mockAlerts: NOCAlert[] = [
  { id: 'a1', cityId: 'mty', cityName: 'Monterrey', siteName: 'Site Principal Monterrey', hostIp: '10.0.1.15', type: 'Host Down', severity: 'critical', timestamp: new Date(Date.now() - 300000).toISOString(), ticketCreated: false },
  { id: 'a2', cityId: 'mty', cityName: 'Monterrey', siteName: 'Site Monterrey Norte', hostIp: '10.0.2.8', type: 'High Latency', severity: 'warning', timestamp: new Date(Date.now() - 600000).toISOString(), ticketCreated: false },
  { id: 'a3', cityId: 'mty', cityName: 'Monterrey', siteName: 'Site Principal Monterrey', hostIp: '10.0.1.22', type: 'Packet Loss >5%', severity: 'critical', timestamp: new Date(Date.now() - 120000).toISOString(), ticketCreated: true },
  { id: 'a4', cityId: 'mty', cityName: 'Monterrey', siteName: 'Site Monterrey Norte', hostIp: '10.0.2.3', type: 'Host Down', severity: 'critical', timestamp: new Date(Date.now() - 900000).toISOString(), ticketCreated: false },
  { id: 'a5', cityId: 'saltillo', cityName: 'Saltillo', siteName: 'Site Principal Saltillo', hostIp: '10.1.1.5', type: 'High Latency', severity: 'warning', timestamp: new Date(Date.now() - 1800000).toISOString(), ticketCreated: false },
  { id: 'a6', cityId: 'gdl', cityName: 'Guadalajara', siteName: 'Site Principal Guadalajara', hostIp: '10.3.1.10', type: 'Host Down', severity: 'critical', timestamp: new Date(Date.now() - 450000).toISOString(), ticketCreated: false },
  { id: 'a7', cityId: 'cdmx', cityName: 'CDMX', siteName: 'Site Principal CDMX', hostIp: '10.4.1.12', type: 'Packet Loss >5%', severity: 'warning', timestamp: new Date(Date.now() - 2400000).toISOString(), ticketCreated: false },
  { id: 'a8', cityId: 'cdmx', cityName: 'CDMX', siteName: 'Site CDMX Norte', hostIp: '10.4.2.7', type: 'Host Down', severity: 'critical', timestamp: new Date(Date.now() - 180000).toISOString(), ticketCreated: false },
  { id: 'a9', cityId: 'cdmx', cityName: 'CDMX', siteName: 'Site Principal CDMX', hostIp: '10.4.1.30', type: 'High Latency', severity: 'warning', timestamp: new Date(Date.now() - 3600000).toISOString(), ticketCreated: true },
];

// Map alerts to tenants
export const alertTenantMap: Record<string, string> = {
  a1: 'xcien', a2: 'xcien', a3: 'xcien', a4: 'xcien', a5: 'xcien',
  a6: 'luminet', a7: 'iblack', a8: 'iblack', a9: 'iblack',
};
