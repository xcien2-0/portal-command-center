export type TenantType = 'casa' | 'externo';

export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  slug: string;
  logoUrl?: string;
  nocboardApiUrl?: string;
  nocboardApiKey?: string;
}

// NOTE: los slugs de estos tenants también se usan como keys en src/data/noc-mock.ts
// (MOCK_NOC_DATA, TENANT_COLORS). Si cambias estos ids/slugs, actualiza ese archivo también.
export const CASA_TENANTS: Tenant[] = [
  { id: 'isp1',   name: 'ISP Principal', type: 'casa', slug: 'isp1' },
  { id: 'isp2',   name: 'ISP 2',         type: 'casa', slug: 'isp2' },
  { id: 'isp3',   name: 'ISP 3',         type: 'casa', slug: 'isp3' },
  { id: 'sandur', name: 'Sandur',        type: 'casa', slug: 'sandur' },
];

export interface AdBanner {
  id: string;
  vendor: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
  targetRegion?: string;
}

export interface TicketPayload {
  tenantId: string;
  tenantType: TenantType;
  city: string;
  site: string;
  hostIp: string;
  description: string;
  technicianId?: string;
  priority: 'alta' | 'media' | 'baja';
  source: 'noc_alert';
}
