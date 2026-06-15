import { NOCAlert, NOCCity } from '@/types/noc';
import { API_BASE } from '../config';

// ── Cache ─────────────────────────────────────────────────────────────────────
let _cities:   NOCCity[]  | null = null;
let _alerts:   NOCAlert[] | null = null;
let _lastFetch = 0;
const TTL = 30_000;

// ── Transform raw backend response to NOCCity shape ───────────────────────────
function transformCity(raw: any): NOCCity {
  // Backend uses Spanish field names; frontend expects English
  const nodos   = raw.nodos   ?? raw.totalHosts ?? 0;
  const activos = raw.activos ?? raw.online     ?? 0;
  const offline = nodos - activos;
  const score   = raw.uptime  ?? raw.score      ?? (nodos > 0 ? Math.round((activos / nodos) * 100) : 0);
  const sitesRaw: string[] = Array.isArray(raw.sites) ? raw.sites : [];

  return {
    id:         raw.id         || '',
    name:       raw.name       || raw.nombre || '',
    score,
    totalHosts: nodos,
    online:     activos,
    offline:    offline < 0 ? 0 : offline,
    alerts:     raw.alertas    ?? raw.alerts ?? (offline > 0 ? offline : 0),
    lat:        raw.lat        ?? 0,
    lng:        raw.lng        ?? 0,
    // Convert string site names to NOCSite objects so SiteInspector works
    sites: sitesRaw.map(siteName => ({
      id:          siteName,
      name:        siteName,
      hosts:       [],
      hostsOnline:  0,
      hostsOffline: 0,
    })),
  };
}

async function _refresh() {
  if (Date.now() - _lastFetch < TTL) return;
  try {
    const [citiesRes, alertsRes] = await Promise.all([
      fetch(`${API_BASE}/api/noc/cities`),
      fetch(`${API_BASE}/api/noc/alerts?active_only=true`),
    ]);
    if (citiesRes.ok) {
      const raw = await citiesRes.json();
      _cities = Array.isArray(raw) ? raw.map(transformCity) : [];
    }
    if (alertsRes.ok)  _alerts = await alertsRes.json();
    _lastFetch = Date.now();
  } catch (e) {
    console.warn('[NOCBoard] Error fetching via backend:', e);
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

// ── Legacy exports ────────────────────────────────────────────────────────────
export function getNOCData()       { return null; }
export function getAllCasaData()   { return {}; }
export function getAllAlerts()     { return _alerts ?? []; }
export function getTotalAlertCount() {
  return (_alerts ?? []).filter(a => !a.ticketCreated).length;
}
export function getAlertsForTenant(tenantId: string) {
  return (_alerts ?? []).filter(a => a.cityId?.includes(tenantId));
}
export async function fetchNOCSummary() { return null; }

export function invalidateNOCCache() { _lastFetch = 0; }
