import { mockNOCData, mockAlerts, alertTenantMap, type NOCTenantData } from '@/data/noc-mock';
import { NOCAlert } from '@/types/noc';

// TODO: Conectar con API REST de NOCBoard cuando esté disponible el README
// const BASE_URL = import.meta.env.VITE_NOCBOARD_API_URL;
// const API_KEY = import.meta.env.VITE_NOCBOARD_API_KEY;
// export async function fetchCities(tenantId: string): Promise<NOCCity[]> { ... }
// export async function fetchAlerts(tenantId: string): Promise<NOCAlert[]> { ... }
// export async function fetchHosts(cityId: string): Promise<NOCHost[]> { ... }

export function getNOCData(tenantId: string): NOCTenantData | null {
  return mockNOCData[tenantId] ?? null;
}

export function getAllCasaData(): Record<string, NOCTenantData> {
  return mockNOCData;
}

export function getAlertsForTenant(tenantId: string): NOCAlert[] {
  return mockAlerts.filter(a => alertTenantMap[a.id] === tenantId);
}

export function getAllAlerts(): NOCAlert[] {
  return mockAlerts;
}

export function getTotalAlertCount(): number {
  return mockAlerts.filter(a => !a.ticketCreated).length;
}
