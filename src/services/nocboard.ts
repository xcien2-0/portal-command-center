import { NOCAlert, NOCCity, NOCHost } from '@/types/noc';

// ── Config ────────────────────────────────────────────────────────────────────
const NB_BASE = 'http://localhost:9401/api';
const NB_KEY  = '87a08190b801416392e944ab79c7e3c9';

const headers = { 'X-API-Key': NB_KEY };

// ── City coordinates ─────────────────────────────────────────────────────────
const COORDS: Record<string, { lat: number; lng: number }> = {
  'Monterrey':       { lat: 25.6866,  lng: -100.3161 },
  'Saltillo':        { lat: 25.4232,  lng: -100.9928 },
  'Piedras Negras':  { lat: 28.7000,  lng: -100.5231 },
  'San Luis Potosi': { lat: 22.1565,  lng: -100.9855 },
  'San Luis Potosí': { lat: 22.1565,  lng: -100.9855 },
  'Torreón':         { lat: 25.5428,  lng: -103.4068 },
  'Torreon':         { lat: 25.5428,  lng: -103.4068 },
  'Chihuahua':       { lat: 28.6353,  lng: -106.0889 },
  'Nuevo Laredo':    { lat: 27.4765,  lng: -99.5151  },
  'Reynosa':         { lat: 26.0922,  lng: -98.2772  },
  'Matamoros':       { lat: 25.8691,  lng: -97.5027  },
  'Monclova':        { lat: 26.9083,  lng: -101.4217 },
  'Sabinas':         { lat: 27.8529,  lng: -101.1191 },
  'Guadalajara':     { lat: 20.6597,  lng: -103.3496 },
  'Ciudad de México':{ lat: 19.4326,  lng: -99.1332  },
  'Querétaro':       { lat: 20.5888,  lng: -100.3899 },
  'Celaya':          { lat: 20.5200,  lng: -100.8161 },
  'León':            { lat: 21.1221,  lng: -101.6823 },
  'Tampico':         { lat: 22.2552,  lng: -97.8686  },
  'Mérida':          { lat: 20.9674,  lng: -89.5926  },
  'Puebla':          { lat: 19.0414,  lng: -98.2063  },
};

// ── Raw fetch helpers ─────────────────────────────────────────────────────────
async function fetchHosts(): Promise<any[]> {
  const res = await fetch(`${NB_BASE}/hosts`, { headers });
  if (!res.ok) throw new Error(`NOCBoard hosts HTTP ${res.status}`);
  const d = await res.json();
  return d.hosts ?? d;
}

async function fetchAlerts(): Promise<any[]> {
  const res = await fetch(`${NB_BASE}/alerts`, { headers });
  if (!res.ok) throw new Error(`NOCBoard alerts HTTP ${res.status}`);
  const d = await res.json();
  return d.alerts ?? d;
}

// ── Cache ─────────────────────────────────────────────────────────────────────
let _cities:  NOCCity[]  | null = null;
let _alerts:  NOCAlert[] | null = null;
let _lastFetch = 0;
const TTL = 30_000;

async function _refresh() {
  if (Date.now() - _lastFetch < TTL) return;
  try {
    const [rawHosts, rawAlerts] = await Promise.all([fetchHosts(), fetchAlerts()]);

    // Build city map from hosts
    const cityMap: Record<string, {
      sites: Record<string, { hosts: NOCHost[] }>;
    }> = {};

    for (const h of rawHosts) {
      const city = h.city || 'Sin Ciudad';
      const site = h.site || 'Principal';
      if (!cityMap[city]) cityMap[city] = { sites: {} };
      if (!cityMap[city].sites[site]) cityMap[city].sites[site] = { hosts: [] };
      cityMap[city].sites[site].hosts.push({
        id:       h.id,
        ip:       h.ip,
        name:     h.display_name || h.name || h.ip,
        score:    Math.round(h.health_score ?? 0),
        status:   h.status === 'online' ? 'online' : h.status === 'degraded' ? 'degraded' : 'offline',
        lastSeen: h.ping?.timestamp ?? '',
      });
    }

    _cities = Object.entries(cityMap).map(([name, { sites }]) => {
      const allHosts = Object.values(sites).flatMap(s => s.hosts);
      const online   = allHosts.filter(h => h.status === 'online').length;
      const offline  = allHosts.filter(h => h.status === 'offline').length;
      const scores   = allHosts.map(h => h.score);
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const coord    = COORDS[name] ?? { lat: 23.0, lng: -102.0 };

      return {
        id:         name.toLowerCase().replace(/\s+/g, '-'),
        name,
        score:      avgScore,
        totalHosts: allHosts.length,
        online,
        offline,
        alerts:     0,
        lat:        coord.lat,
        lng:        coord.lng,
        sites: Object.entries(sites).map(([siteName, { hosts }]) => ({
          id:           `${name}-${siteName}`.toLowerCase().replace(/\s+/g, '-'),
          name:         siteName,
          hostsOnline:  hosts.filter(h => h.status === 'online').length,
          hostsOffline: hosts.filter(h => h.status === 'offline').length,
          hosts,
        })),
      };
    }).sort((a, b) => b.offline - a.offline);

    _alerts = rawAlerts.map(a => ({
      id:            a.id,
      cityId:        (a.city ?? '').toLowerCase().replace(/\s+/g, '-'),
      cityName:      a.city ?? '',
      siteName:      a.site ?? '',
      hostIp:        a.host_ip ?? '',
      hostName:      a.host_name ?? '',
      type:          a.cause ?? a.type ?? '',
      message:       a.message ?? '',
      severity:      a.severity === 'critical' ? 'critical' : 'warning',
      timestamp:     a.triggered_at ?? '',
      ticketCreated: false,
      state:         a.state,
    }));

    // Update alerts count per city
    for (const city of _cities) {
      city.alerts = _alerts.filter(a => a.cityId === city.id && a.severity === 'critical').length;
    }

    _lastFetch = Date.now();
  } catch (e) {
    console.warn('[NOCBoard] Error directo, reintentando...', e);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function getRealCities(): Promise<NOCCity[] | null> {
  await _refresh();
  return _cities;
}

export async function getRealAlerts(): Promise<NOCAlert[] | null> {
  await _refresh();
  return _alerts;
}

// ── Legacy exports (compatibilidad con NOC.tsx) ───────────────────────────────
export function getNOCData()       { return null; }
export function getAllCasaData()   { return {}; }
export function getAllAlerts()     { return _alerts ?? []; }
export function getTotalAlertCount() {
  return (_alerts ?? []).filter(a => !a.ticketCreated).length;
}
export function getAlertsForTenant(tenantId: string) {
  return (_alerts ?? []).filter(a => a.cityId.includes(tenantId));
}
export async function fetchNOCSummary() { return null; }
