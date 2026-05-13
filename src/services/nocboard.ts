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
    if (citiesRes.ok)  _cities = await citiesRes.json();
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
