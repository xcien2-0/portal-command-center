import { mockNOCData, mockAlerts, alertTenantMap, type NOCTenantData } from '@/data/noc-mock';
import { NOCAlert, NOCCity } from '@/types/noc';

// ── API real (backend Python → NOCBoard JSON) ─────────────────────────────────
const API_BASE = 'http://localhost:8000';

let _cachedCities: NOCCity[] | null = null;
let _cachedAlerts: NOCAlert[] | null = null;
let _lastFetch = 0;
const CACHE_TTL = 30_000; // 30 segundos

async function _fetchCities(): Promise<NOCCity[]> {
  const res = await fetch(`${API_BASE}/api/noc/cities`);
  if (!res.ok) throw new Error(`NOC cities HTTP ${res.status}`);
  return res.json();
}

async function _fetchAlerts(): Promise<NOCAlert[]> {
  const res = await fetch(`${API_BASE}/api/noc/alerts?active_only=true&limit=500`);
  if (!res.ok) throw new Error(`NOC alerts HTTP ${res.status}`);
  return res.json();
}

async function _refreshIfNeeded() {
  if (Date.now() - _lastFetch < CACHE_TTL) return;
  try {
    const [cities, alerts] = await Promise.all([_fetchCities(), _fetchAlerts()]);
    _cachedCities = cities;
    _cachedAlerts = alerts;
    _lastFetch = Date.now();
  } catch (e) {
    console.warn('[NOCBoard] Backend no disponible, usando mock data.', e);
  }
}

// ── API pública ───────────────────────────────────────────────────────────────

export async function fetchNOCSummary() {
  try {
    const res = await fetch(`${API_BASE}/api/noc/summary`);
    if (res.ok) return res.json();
  } catch { /* fallback */ }
  return null;
}

export async function getRealCities(): Promise<NOCCity[] | null> {
  await _refreshIfNeeded();
  return _cachedCities;
}

export async function getRealAlerts(): Promise<NOCAlert[] | null> {
  await _refreshIfNeeded();
  return _cachedAlerts;
}

// ── Funciones síncronas con fallback a mock (compatibilidad con NOC.tsx) ──────

export function getNOCData(tenantId: string): NOCTenantData | null {
  return mockNOCData[tenantId] ?? null;
}

export function getAllCasaData(): Record<string, NOCTenantData> {
  return mockNOCData;
}

export function getAlertsForTenant(tenantId: string): NOCAlert[] {
  if (_cachedAlerts) {
    const cityMap: Record<string, string> = {
      'monterrey': 'xcien', 'saltillo': 'xcien', 'piedras-negras': 'xcien',
      'san-luis-potosi': 'xcien', 'guadalajara': 'wispi',
    };
    return _cachedAlerts.filter(a => cityMap[a.cityId] === tenantId);
  }
  return mockAlerts.filter(a => alertTenantMap[a.id] === tenantId);
}

export function getAllAlerts(): NOCAlert[] {
  return _cachedAlerts ?? mockAlerts;
}

export function getTotalAlertCount(): number {
  const alerts = _cachedAlerts ?? mockAlerts;
  return alerts.filter(a => !a.ticketCreated).length;
}
