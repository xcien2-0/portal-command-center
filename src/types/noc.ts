export interface NOCHost {
  id: string;
  ip: string;
  name: string;
  score: number; // 0-100
  status: 'online' | 'offline' | 'degraded';
  lastSeen: string;
}

export interface NOCSite {
  id: string;
  name: string;
  hosts: NOCHost[];
  hostsOnline: number;
  hostsOffline: number;
}

export interface NOCCity {
  id: string;
  name: string;
  score: number;
  sites: NOCSite[];
  totalHosts: number;
  online: number;
  offline: number;
  alerts: number;
  lat: number;
  lng: number;
  sources?: string[];
  priorityScore?: number;                        // score ponderado por prioridad de fuente
  sourceScores?: Record<string, number>;         // score por fuente: { "Energía": 45, "Datos": 87 }
}

export interface NOCAlert {
  id: string;
  cityId: string;
  cityName: string;
  siteName: string;
  hostIp: string;
  type: string;
  severity: 'critical' | 'warning';
  timestamp: string;
  ticketCreated: boolean;
}
