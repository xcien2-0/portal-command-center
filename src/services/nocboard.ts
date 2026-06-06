import { NOCAlert, NOCCity } from '@/types/noc';
import { API_BASE } from '../config';

// ── Cache ─────────────────────────────────────────────────────────────────────
let _cities:   NOCCity[]  | null = null;
let _alerts:   NOCAlert[] | null = null;
let _lastFetch = 0;
const TTL = 30_000;

async function _refresh() {
  if (Date.now() - _lastFetch < TTL) return;
  try {
    const [citiesRes, alertsRes] = await Promise.all([
      fetch(`${API_BASE}/api/noc/cities`),
      fetch(`${API_BASE}/api/noc/alerts?active_only=true`),
    ]);
    if (citiesRes.ok) {
      const raw = await citiesRes.json();
      _cities = raw.map((c: any): NOCCity => ({
        id:         c.id,
        name:       c.nombre ?? c.name ?? c.id,
        lat:        c.lat,
        lng:        c.lng,
        score:      Math.round(c.uptime ?? c.score ?? 0),
        totalHosts: c.nodos   ?? c.totalHosts ?? 0,
        online:     c.activos ?? c.online     ?? 0,
        offline:    (c.nodos ?? c.totalHosts ?? 0) - (c.activos ?? c.online ?? 0),
        alerts:     c.alertas ?? c.alerts     ?? 0,
        sites:      c.sites   ?? [],
      }));
    }
    if (alertsRes.ok) {
      const raw = await alertsRes.json();
      _alerts = raw.map((a: any): NOCAlert => ({
        id:           a.id ?? String(Math.random()),
        cityId:       a.cityId   ?? a.ciudad_id ?? '',
        cityName:     a.cityName ?? a.ciudad    ?? '',
        siteName:     a.siteName ?? a.sitio     ?? '',
        hostIp:       a.hostIp   ?? a.ip        ?? '',
        type:         a.type     ?? a.tipo      ?? 'alert',
        severity:     a.severity ?? a.severidad ?? 'warning',
        timestamp:    a.timestamp ?? new Date().toISOString(),
        ticketCreated: a.ticketCreated ?? false,
      }));
    }
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
