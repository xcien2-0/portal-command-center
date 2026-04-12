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

export const CASA_TENANTS: Tenant[] = [
  { id: 'xcien', name: 'XCIEN', type: 'casa', slug: 'xcien', nocboardApiUrl: 'https://noc.xcien.mx/api' },
  { id: 'wispi', name: 'Wispi', type: 'casa', slug: 'wispi' },
  { id: 'luminet', name: 'Luminet WAN', type: 'casa', slug: 'luminet' },
  { id: 'iblack', name: 'iBlack', type: 'casa', slug: 'iblack' },
  { id: 'coco', name: 'Coco', type: 'casa', slug: 'coco' },
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
