import { useState, useEffect, useRef, useCallback } from 'react';
import { ThemeConfig } from '../types';
import { API_BASE } from '../../../config';
import { RefreshCw, Filter, Radio, Activity, GitBranch, X, Cpu, Signal, Zap, Clock, Wifi, Share2, Building2 } from 'lucide-react';
import NetworkGraph from '../../../components/NetworkGraph';
import 'leaflet/dist/leaflet.css';

// ── Colores ────────────────────────────────────────────────────────────────────
const COLOR_ONLINE  = '#00ff88';
const COLOR_OFFLINE = '#ff3366';
const COLOR_WARN    = '#ffcc00';

const VENDOR_COLORS: Record<string, string> = {
  Mimosa:   '#f97316',
  Ubiquiti: '#3b82f6',
  Cambium:  '#a855f7',
  MikroTik: '#ef4444',
  Unknown:  '#6b7280',
};

const VENDOR_ICONS: Record<string, string> = {
  Mimosa:   '📡',
  Ubiquiti: '📶',
  Cambium:  '🔵',
  MikroTik: '🔴',
  Unknown:  '❓',
};

// ── Tipos KMZ ─────────────────────────────────────────────────────────────────
interface KmzLayer  { id: string; name: string; }
interface KmzGroup  { id: string; label: string; color: string; layers: KmzLayer[]; }

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface NOCHost {
  id: string;
  name: string;
  display_name?: string;
  ip: string;
  city: string;
  site?: string;
  vendor: string;
  model: string;
  role?: string;
  status: 'online' | 'offline';
  health_score?: number;
  ping?: { latency_avg: number; latency_max?: number; latency_min?: number; packet_loss: number; reachable: boolean; timestamp?: string; };
  uisp?: { signal?: number; uplink_util?: number; downlink_util?: number; stations?: number; can_upgrade?: boolean; firmware?: string; };
}

interface CityGroup {
  name: string; lat: number; lng: number;
  hosts: NOCHost[]; online: number; offline: number;
  byVendor: Record<string, number>;
}

interface TopoLink {
  id: string; vendor: string;
  from_site: string; to_site: string;
  from_lat: number; from_lng: number;
  to_lat: number; to_lng: number;
  status: string;
  frequency?: string;
  channel_width?: number;
  signal?: number;
  link_score?: number;
  quality?: string;
  mode?: string;
  model?: string;
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Monterrey':        { lat: 25.6866,  lng: -100.3161 },
  'Saltillo':         { lat: 25.4232,  lng: -100.9928 },
  'Piedras Negras':   { lat: 28.7000,  lng: -100.5231 },
  'San Luis Potosi':  { lat: 22.1565,  lng: -100.9855 },
  'San Luis Potosí':  { lat: 22.1565,  lng: -100.9855 },
  'Torreón':          { lat: 25.5428,  lng: -103.4068 },
  'Torreon':          { lat: 25.5428,  lng: -103.4068 },
  'Chihuahua':        { lat: 28.6353,  lng: -106.0889 },
  'Nuevo Laredo':     { lat: 27.4765,  lng:  -99.5151 },
  'Reynosa':          { lat: 26.0922,  lng:  -98.2772 },
  'Matamoros':        { lat: 25.8691,  lng:  -97.5027 },
  'Monclova':         { lat: 26.9083,  lng: -101.4217 },
  'Sabinas':          { lat: 27.8529,  lng: -101.1191 },
  'Guadalajara':      { lat: 20.6597,  lng: -103.3496 },
  'Ciudad de México': { lat: 19.4326,  lng:  -99.1332 },
  'Querétaro':        { lat: 20.5888,  lng: -100.3899 },
  'Queretaro':        { lat: 20.5888,  lng: -100.3899 },
  'Celaya':           { lat: 20.5200,  lng: -100.8161 },
  'León':             { lat: 21.1221,  lng: -101.6823 },
  'Leon':             { lat: 21.1221,  lng: -101.6823 },
  'Tampico':          { lat: 22.2552,  lng:  -97.8686 },
  'Mérida':           { lat: 20.9674,  lng:  -89.5926 },
  'Merida':           { lat: 20.9674,  lng:  -89.5926 },
  'Puebla':           { lat: 19.0414,  lng:  -98.2063 },
  'Coco':             { lat: 25.5000,  lng: -103.5000 },
};

const VENDORS_ALL = ['Mimosa', 'Ubiquiti', 'Cambium', 'MikroTik', 'Unknown'];

// ── Panel de detalle de host ───────────────────────────────────────────────────
function HostDetailPanel({ host, onClose }: { host: NOCHost; onClose: () => void }) {
  const [detail, setDetail] = useState<NOCHost | null>(null);
  const [loading, setLoading] = useState(true);
  const vc = VENDOR_COLORS[host.vendor] || '#6b7280';
  const isOnline = host.status === 'online';

  useEffect(() => {
    fetch(`${API_BASE}/api/red/host/${host.id}`)
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(() => setDetail(host))
      .finally(() => setLoading(false));
  }, [host.id]);

  const h = detail || host;
  const health = h.health_score ? Math.round(h.health_score) : null;
  const healthColor = !health ? '#6b7280' : health >= 85 ? COLOR_ONLINE : health >= 65 ? COLOR_WARN : COLOR_OFFLINE;

  const fmt = (v: number | undefined | null, unit = '') =>
    v != null ? `${typeof v === 'number' ? v.toFixed(v % 1 === 0 ? 0 : 1) : v}${unit}` : '—';

  const pct = (v: number | null | undefined) =>
    v != null ? `${(v * 100).toFixed(1)}%` : '—';

  return (
    <div style={{
      position: 'absolute', top: 16, right: 16, width: 340,
      maxHeight: 'calc(100% - 32px)', overflowY: 'auto',
      background: 'rgba(5,15,10,0.97)', border: `1px solid ${vc}40`,
      borderRadius: 16, zIndex: 1000,
      boxShadow: `0 0 40px rgba(0,0,0,0.7), 0 0 20px ${vc}10`,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${vc}20`,
        background: `${vc}08`, position: 'sticky', top: 0, zIndex: 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 16 }}>{VENDOR_ICONS[h.vendor]}</span>
              <span style={{ color: vc, fontWeight: 700, fontSize: 13 }}>{h.vendor}</span>
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 10,
                background: isOnline ? `${COLOR_ONLINE}22` : `${COLOR_OFFLINE}22`,
                color: isOnline ? COLOR_ONLINE : COLOR_OFFLINE,
                border: `1px solid ${isOnline ? COLOR_ONLINE : COLOR_OFFLINE}44`,
              }}>{h.status}</span>
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{h.display_name || h.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
              {h.model} {h.role ? `· ${h.role}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer', fontSize: 18, marginLeft: 8, flexShrink: 0,
          }}>✕</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          <Activity size={20} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Health score */}
          {health != null && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Health Score</span>
                <span style={{ color: healthColor, fontWeight: 700, fontSize: 13 }}>{health}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${health}%`, background: healthColor, borderRadius: 4 }} />
              </div>
            </div>
          )}

          {/* Red info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'IP', val: h.ip },
              { label: 'Ciudad', val: h.city },
              { label: 'Sitio', val: h.site || '—' },
              { label: 'Rol', val: h.role || '—' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px',
              }}>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginBottom: 2 }}>{item.label}</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600 }}>{item.val}</div>
              </div>
            ))}
          </div>

          {/* Ping */}
          {h.ping && (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Wifi size={11} /> PING
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, textAlign: 'center' }}>
                {[
                  { label: 'Latencia', val: fmt(h.ping.latency_avg, 'ms') },
                  { label: 'Máx', val: fmt(h.ping.latency_max, 'ms') },
                  { label: 'Pérdida', val: fmt(h.ping.packet_loss, '%') },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700 }}>{item.val}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UISP data (Ubiquiti only) */}
          {h.uisp && (
            <div style={{ background: `${VENDOR_COLORS.Ubiquiti}0a`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${VENDOR_COLORS.Ubiquiti}20` }}>
              <div style={{ color: VENDOR_COLORS.Ubiquiti, fontSize: 10, marginBottom: 8, fontWeight: 600 }}>
                📶 UISP — UBIQUITI
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { label: 'Señal', val: h.uisp.signal != null ? `${h.uisp.signal} dBm` : '—', icon: '📶' },
                  { label: 'Estaciones', val: fmt(h.uisp.stations), icon: '📱' },
                  { label: 'Uplink', val: pct(h.uisp.uplink_util), icon: '⬆' },
                  { label: 'Downlink', val: pct(h.uisp.downlink_util), icon: '⬇' },
                  { label: 'Firmware', val: h.uisp.firmware || '—', icon: '💾' },
                  { label: 'Actualiz.', val: h.uisp.can_upgrade ? '⚠ Disponible' : 'Al día', icon: '🔄' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '6px 8px' }}>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{item.icon} {item.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600 }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nombre técnico */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px',
            fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)',
            wordBreak: 'break-all',
          }}>{h.name}</div>

        </div>
      )}
    </div>
  );
}

// ── Panel de ciudad ───────────────────────────────────────────────────────────
function CityPanel({
  city, vendorFilter, onSelectHost, onClose,
}: {
  city: CityGroup; vendorFilter: string[];
  onSelectHost: (h: NOCHost) => void; onClose: () => void;
}) {
  const filtered = city.hosts.filter(h =>
    vendorFilter.length === 0 || vendorFilter.includes(h.vendor)
  );

  return (
    <div style={{
      position: 'absolute', top: 16, right: 16, width: 360,
      maxHeight: 'calc(100% - 32px)',
      background: 'rgba(5,15,10,0.97)', border: '1px solid rgba(0,255,136,0.2)',
      borderRadius: 16, zIndex: 1000, display: 'flex', flexDirection: 'column',
      boxShadow: '0 0 40px rgba(0,0,0,0.6)',
    }}>
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid rgba(0,255,136,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(0,255,136,0.04)',
      }}>
        <div>
          <div style={{ color: COLOR_ONLINE, fontWeight: 700, fontSize: 15 }}>{city.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
            {city.online} online · {city.offline} offline · {city.hosts.length} total
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18 }}>✕</button>
      </div>

      <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {Object.entries(city.byVendor).map(([v, count]) => (
          <span key={v} style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 20,
            background: `${VENDOR_COLORS[v] || '#6b7280'}22`,
            color: VENDOR_COLORS[v] || '#aaa',
            border: `1px solid ${VENDOR_COLORS[v] || '#6b7280'}44`,
          }}>{VENDOR_ICONS[v]} {v}: {count}</span>
        ))}
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {filtered.map(h => (
          <div
            key={h.id}
            onClick={() => onSelectHost(h)}
            style={{
              padding: '9px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: h.status === 'online' ? COLOR_ONLINE : COLOR_OFFLINE,
              boxShadow: h.status === 'online' ? `0 0 6px ${COLOR_ONLINE}` : 'none',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {h.display_name || h.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 1 }}>
                <span style={{ color: VENDOR_COLORS[h.vendor] || '#aaa' }}>{h.vendor}</span>
                {h.model ? ` · ${h.model}` : ''}
                {h.ping?.latency_avg ? ` · ${h.ping.latency_avg}ms` : ''}
              </div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function RedSection({ theme }: { theme: ThemeConfig }) {
  const [hosts, setHosts]               = useState<NOCHost[]>([]);
  const [topoLinks, setTopoLinks]       = useState<TopoLink[]>([]);
  const [loading, setLoading]           = useState(true);
  const [lastUpdate, setLastUpdate]     = useState<Date | null>(null);
  const [vendorFilter, setVendorFilter] = useState<string[]>([]);
  const [showTopo, setShowTopo]         = useState(false);
  const [showDevices, setShowDevices]   = useState(false);
  const [geoDevices, setGeoDevices]     = useState<any[]>([]);
  const [mainView, setMainView]         = useState<'map' | 'graph' | 'dashboard'>('map');
  const [selectedCity, setSelectedCity] = useState<CityGroup | null>(null);
  const [selectedHost, setSelectedHost] = useState<NOCHost | null>(null);
  const [mapLayer, setMapLayer]         = useState<'dark' | 'satellite' | 'topo'>('dark');

  const [kmzGroups,       setKmzGroups]       = useState<KmzGroup[]>([]);
  const [kmzActive,       setKmzActive]       = useState<Record<string, boolean>>({});
  const [uispStatus,      setUispStatus]       = useState<{ ok: boolean; error: string | null } | null>(null);
  const [odooServicios,   setOdooServicios]    = useState<any[]>([]);
  const [showOdoo,        setShowOdoo]         = useState(false);
  const [odooFiltro,      setOdooFiltro]       = useState<'all' | 'innet' | 'offnet'>('all');

  const mapRef       = useRef<any>(null);
  const leafRef      = useRef<any>(null);
  const layerRef     = useRef<any>(null);
  const topoLayer    = useRef<any>(null);
  const devicesLayer = useRef<any>(null);
  const odooLayer    = useRef<any>(null);
  const tileRef   = useRef<any>(null);
  const kmzLayers = useRef<Record<string, any[]>>({}); // groupId → Leaflet layers[]
  const kmzCache  = useRef<Record<string, any>>({}); // layerId → GeoJSON

  // ── Cargar datos ─────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    try {
      const [hostsRes, topoRes, uispRes] = await Promise.all([
        fetch(`${API_BASE}/api/noc/hosts`),
        fetch(`${API_BASE}/api/red/topologia-geo`),
        fetch(`${API_BASE}/api/red/uisp-status`),
      ]);
      const hostsData = await hostsRes.json();
      const topoData  = await topoRes.json();
      const uispData  = uispRes.ok ? await uispRes.json() : null;
      setHosts(Array.isArray(hostsData) ? hostsData : (hostsData.hosts || []));
      setTopoLinks(Array.isArray(topoData) ? topoData : []);
      if (uispData) setUispStatus(uispData);
      setLastUpdate(new Date());
    } catch (e) {
      console.error('RedSection error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    const t = setInterval(cargar, 30_000);
    return () => clearInterval(t);
  }, [cargar]);

  // ── Cargar dispositivos con coords geográficas ───────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/red/dispositivos-geo`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setGeoDevices(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // ── Cargar servicios Odoo con coords ────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/red/odoo-servicios-geo`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setOdooServicios(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // ── Cargar índice KMZ ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/red/kmz-capas`)
      .then(r => r.ok ? r.json() : [])
      .then((groups: KmzGroup[]) => {
        setKmzGroups(groups);
        const active: Record<string, boolean> = {};
        groups.forEach(g => { active[g.id] = false; });
        setKmzActive(active);
      })
      .catch(() => {});
  }, []);

  // ── Agrupar por ciudad ────────────────────────────────────────────────────────
  const cities: CityGroup[] = (() => {
    const map: Record<string, CityGroup> = {};
    const filtered = vendorFilter.length === 0 ? hosts : hosts.filter(h => vendorFilter.includes(h.vendor));
    for (const h of filtered) {
      const cn = h.city || 'Desconocida';
      const coords = CITY_COORDS[cn] || { lat: 23.0, lng: -102.0 };
      if (!map[cn]) map[cn] = { name: cn, lat: coords.lat, lng: coords.lng, hosts: [], online: 0, offline: 0, byVendor: {} };
      map[cn].hosts.push(h);
      if (h.status === 'online') map[cn].online++; else map[cn].offline++;
      map[cn].byVendor[h.vendor] = (map[cn].byVendor[h.vendor] || 0) + 1;
    }
    return Object.values(map);
  })();

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const visible   = vendorFilter.length === 0 ? hosts : hosts.filter(h => vendorFilter.includes(h.vendor));
  const online    = visible.filter(h => h.status === 'online').length;
  const offline   = visible.filter(h => h.status === 'offline').length;
  const uptime    = visible.length > 0 ? Math.round(online / visible.length * 1000) / 10 : 0;

  // ── Inicializar Leaflet ──────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;
    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      const map = L.map('red-section-map', {
        center: [23.5, -102.5], zoom: 5, zoomControl: true,
        attributionControl: false, minZoom: 4,
      });
      const tile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd', maxZoom: 18,
      }).addTo(map);
      tileRef.current = tile;
      leafRef.current = L;
      mapRef.current  = map;
    });
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  // ── Cambiar capa de mapa ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !leafRef.current || !tileRef.current) return;
    const L   = leafRef.current;
    const map = mapRef.current;

    // Quitar tile actual
    map.removeLayer(tileRef.current);

    // Agregar nuevo tile
    const URLS: Record<string, [string, object]> = {
      dark:      ['https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 18 }],
      satellite: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18 }],
      topo:      ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18 }],
    };
    const [url, opts] = URLS[mapLayer];
    tileRef.current = L.tileLayer(url, opts).addTo(map);

    // Re-agregar overlay layers encima del tile nuevo
    if (topoLayer.current) { map.removeLayer(topoLayer.current); topoLayer.current.addTo(map); }
    if (layerRef.current)  { map.removeLayer(layerRef.current);  layerRef.current.addTo(map);  }
  }, [mapLayer]);

  // ── Renderizar marcadores ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !leafRef.current) return;
    const L = leafRef.current;
    if (layerRef.current) layerRef.current.clearLayers();
    else layerRef.current = L.layerGroup().addTo(mapRef.current);

    cities.forEach(city => {
      const pct   = city.online / (city.hosts.length || 1);
      const color = pct >= 0.85 ? COLOR_ONLINE : pct >= 0.5 ? COLOR_WARN : COLOR_OFFLINE;
      const size  = Math.max(14, Math.min(30, 9 + city.hosts.length / 6));
      const top   = Object.entries(city.byVendor).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Unknown';
      const vc    = VENDOR_COLORS[top] || '#6b7280';

      const icon = L.divIcon({
        className: '',
        iconSize: [size, size], iconAnchor: [size/2, size/2],
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;
          background:${color}22;border:2px solid ${vc};
          box-shadow:0 0 ${size/2}px ${color}55;
          display:flex;align-items:center;justify-content:center;
          font-size:${Math.max(7,size/3)}px;font-weight:700;color:${color}">${city.hosts.length}</div>`,
      });

      const vendorLines = Object.entries(city.byVendor)
        .sort((a,b) => b[1]-a[1])
        .map(([v,n]) => `<span style="color:${VENDOR_COLORS[v]||'#aaa'}">${VENDOR_ICONS[v]} ${v}: ${n}</span>`)
        .join('<br/>');

      L.marker([city.lat, city.lng], { icon })
        .bindTooltip(`
          <div style="font-weight:800;color:${color};margin-bottom:6px">${city.name.toUpperCase()}</div>
          <div>${city.online} <span style="color:${COLOR_ONLINE}">online</span> · ${city.offline} <span style="color:${COLOR_OFFLINE}">offline</span></div>
          <hr style="border-color:rgba(255,255,255,0.1);margin:5px 0"/>
          ${vendorLines}
          <div style="color:rgba(255,255,255,0.3);font-size:10px;margin-top:4px">Clic para ver dispositivos</div>
        `, { className: 'noc-tooltip' })
        .on('click', () => { setSelectedHost(null); setSelectedCity(city); })
        .addTo(layerRef.current);
    });
  }, [cities]);

  // ── Renderizar topología ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !leafRef.current) return;
    const L = leafRef.current;
    if (topoLayer.current) { topoLayer.current.clearLayers(); }
    else { topoLayer.current = L.layerGroup().addTo(mapRef.current); }

    if (!showTopo) return;

    const filtered = vendorFilter.length === 0
      ? topoLinks
      : topoLinks.filter(l => vendorFilter.includes(l.vendor));

    filtered.forEach(link => {
      const vc    = VENDOR_COLORS[link.vendor] || '#6b7280';
      const isUp  = link.status === 'active' || link.status === 'online';
      const score = link.link_score;
      const lineColor = !isUp ? COLOR_OFFLINE
        : score == null ? vc
        : score >= 80 ? COLOR_ONLINE
        : score >= 60 ? COLOR_WARN
        : COLOR_OFFLINE;
      const weight  = isUp ? 2.5 : 1.5;
      const opacity = isUp ? 0.8 : 0.35;

      const freqBadge = link.frequency
        ? `<span style="background:${vc}33;color:${vc};padding:1px 6px;border-radius:8px;font-size:10px">${link.frequency}</span>`
        : '';
      const bwBadge = link.channel_width
        ? `<span style="color:rgba(255,255,255,0.4);font-size:10px">BW: ${link.channel_width} MHz</span>`
        : '';
      const qualityColor = !score ? '#6b7280' : score >= 80 ? COLOR_ONLINE : score >= 60 ? COLOR_WARN : COLOR_OFFLINE;
      const qualityLine = link.quality
        ? `<div style="margin-top:4px">Calidad: <span style="color:${qualityColor};font-weight:700">${link.quality}</span></div>`
        : '';
      const signalLine = link.signal != null
        ? `<div style="color:rgba(255,255,255,0.5);font-size:11px">Señal: ${link.signal} dBm</div>`
        : '';
      const modeLine = link.mode
        ? `<div style="color:rgba(255,255,255,0.4);font-size:10px">${link.mode}${link.model ? ` · ${link.model}` : ''}</div>`
        : '';

      L.polyline(
        [[link.from_lat, link.from_lng], [link.to_lat, link.to_lng]],
        { color: lineColor, weight, opacity, dashArray: isUp ? undefined : '6,4' }
      ).bindTooltip(
        `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
           <span style="color:${vc};font-weight:700">${link.vendor}</span>
           ${freqBadge}
         </div>
         <div style="font-weight:600;color:rgba(255,255,255,0.8)">${link.from_site} → ${link.to_site}</div>
         ${qualityLine}${signalLine}${bwBadge ? `<div>${bwBadge}</div>` : ''}${modeLine}`,
        { className: 'noc-tooltip' }
      ).addTo(topoLayer.current);
    });
  }, [showTopo, topoLinks, vendorFilter]);

  // ── Renderizar dispositivos UISP sobre el mapa ───────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !leafRef.current) return;
    const L = leafRef.current;

    if (devicesLayer.current) { devicesLayer.current.clearLayers(); }
    else { devicesLayer.current = L.layerGroup().addTo(mapRef.current); }

    if (!showDevices || geoDevices.length === 0) return;

    // Color por calidad de señal
    const signalColor = (signal: number | null, status: string): string => {
      if (status !== 'active') return '#ff3366';          // rojo  — desconectado
      if (signal == null)       return '#00aff0';          // azul  — sin dato de señal (routers, switches)
      if (signal >= -65)        return '#00ff88';          // verde — excelente ≥ -65 dBm
      if (signal >= -75)        return '#ffcc00';          // ámbar — bueno -65 a -75 dBm
      return '#ff3366';                                    // rojo  — malo < -75 dBm
    };

    const signalLabel = (signal: number | null, status: string): string => {
      if (status !== 'active') return 'DESCONECTADO';
      if (signal == null)       return 'SIN SEÑAL RF';
      if (signal >= -65)        return `EXCELENTE (${signal} dBm)`;
      if (signal >= -75)        return `BUENO (${signal} dBm)`;
      return `MALO (${signal} dBm)`;
    };

    geoDevices.forEach(dev => {
      const color  = signalColor(dev.signal, dev.status);
      const isUp   = dev.status === 'active';
      const radius = dev.type === 'wave' || dev.type === 'airFiber' ? 8
                   : dev.type === 'airMax' ? 6 : 5;

      L.circleMarker([dev.lat, dev.lng], {
        radius,
        fillColor: color,
        color: color,
        weight: 1.5,
        fillOpacity: isUp ? 0.85 : 0.5,
        opacity: 1,
      }).bindTooltip(
        `<div style="font-weight:700;color:${color};margin-bottom:4px">${dev.name}</div>
         <div style="color:rgba(255,255,255,0.5);font-size:10px">${dev.model || dev.type}</div>
         <div style="margin-top:5px">
           <span style="color:${color};font-weight:700;font-size:10px">● ${signalLabel(dev.signal, dev.status)}</span>
         </div>
         ${dev.stations != null ? `<div style="color:rgba(255,255,255,0.4);font-size:10px;margin-top:2px">Estaciones: ${dev.stations}</div>` : ''}
         <div style="color:rgba(255,255,255,0.3);font-size:9px;margin-top:3px">${dev.site}</div>`,
        { className: 'noc-tooltip' }
      ).addTo(devicesLayer.current);
    });
  }, [showDevices, geoDevices]);

  // ── Renderizar servicios Odoo ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !leafRef.current) return;
    const L = leafRef.current;

    if (odooLayer.current) { odooLayer.current.clearLayers(); }
    else { odooLayer.current = L.layerGroup().addTo(mapRef.current); }

    if (!showOdoo || odooServicios.length === 0) return;

    // Colores por tipo de entrega (onnet/offnet)
    const COLOR_INNET  = '#00A859';   // verde XCIEN — on-net
    const COLOR_OFFNET = '#3b82f6';   // azul — off-net (infraestructura de terceros)
    const COLOR_INTER  = '#a855f7';   // morado — intercompañía
    const COLOR_NULL   = '#64748b';   // gris — sin clasificar

    const entregaColor = (entrega: string): string => {
      if (entrega === 'innet')  return COLOR_INNET;
      if (entrega === 'offnet') return COLOR_OFFNET;
      if (entrega === 'inter')  return COLOR_INTER;
      return COLOR_NULL;
    };
    const entregaLabel = (entrega: string): string => {
      if (entrega === 'innet')  return 'ON-NET';
      if (entrega === 'offnet') return 'OFF-NET';
      if (entrega === 'inter')  return 'INTERCOMPANY';
      return '—';
    };
    const iconoAcceso: Record<string, string> = { radio: '📡', fiber: '🔌', other: '🌐' };

    const visibles = odooFiltro === 'all'
      ? odooServicios
      : odooServicios.filter(s => {
          if (odooFiltro === 'innet')  return s.entrega === 'innet';
          if (odooFiltro === 'offnet') return s.entrega === 'offnet';
          return true;
        });

    visibles.forEach(srv => {
      const color  = entregaColor(srv.entrega);
      const icono  = iconoAcceso[srv.acceso] || '🌐';
      const label  = entregaLabel(srv.entrega);
      const isActive = srv.estado === 'active';

      const sopUrl = `https://odoo.wispi.mx/web#id=${srv.id}&model=running.services&view_type=form&cids=25`;

      L.circleMarker([srv.lat, srv.lng], {
        radius:      isActive ? 5 : 4,
        fillColor:   color,
        color:       isActive ? color : '#475569',
        weight:      1,
        fillOpacity: isActive ? 0.8 : 0.35,
        opacity:     1,
      })
      .bindTooltip(
        `<div style="font-weight:700;color:${color};margin-bottom:3px">${icono} ${srv.nombre}</div>
         <div style="color:rgba(255,255,255,0.75);font-size:11px">${srv.cliente}</div>
         <div style="margin-top:4px;font-size:10px">
           <span style="background:${color}22;color:${color};padding:1px 6px;border-radius:8px;font-weight:700">${label}</span>
         </div>`,
        { className: 'noc-tooltip' }
      )
      .bindPopup(
        `<div style="min-width:200px">
           <div style="font-weight:700;color:${color};font-size:13px;margin-bottom:4px">${icono} ${srv.nombre}</div>
           <div style="color:#64748b;font-size:11px;margin-bottom:8px">${srv.cliente}</div>
           <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:10px;margin-bottom:6px">
             <span style="background:${color}22;color:${color};padding:2px 8px;border-radius:8px;font-weight:700">${label}</span>
             ${srv.acceso ? `<span style="background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:8px">${srv.acceso}</span>` : ''}
             ${srv.bajada_mbps ? `<span style="background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:8px">${srv.bajada_mbps}↓ ${srv.subida_mbps}↑ Mbps</span>` : ''}
           </div>
           ${srv.ip ? `<div style="color:#94a3b8;font-size:10px;margin-bottom:8px;font-family:monospace">${srv.ip}</div>` : ''}
           <a href="${sopUrl}" target="_blank" rel="noopener noreferrer"
              style="display:block;text-align:center;padding:6px 12px;background:${color};color:#fff;border-radius:6px;font-size:11px;font-weight:700;text-decoration:none">
             Abrir SOP en Odoo →
           </a>
         </div>`,
        { className: 'noc-popup', maxWidth: 260 }
      )
      .addTo(odooLayer.current);
    });
  }, [showOdoo, odooServicios, odooFiltro]);

  // ── Toggle KMZ group ─────────────────────────────────────────────────────────
  const toggleKmzGroup = useCallback(async (group: KmzGroup) => {
    if (!mapRef.current || !leafRef.current) return;
    const L = leafRef.current;
    const map = mapRef.current;
    const turning_on = !kmzActive[group.id];
    setKmzActive(prev => ({ ...prev, [group.id]: turning_on }));

    if (!turning_on) {
      // Remove all layers of this group
      (kmzLayers.current[group.id] || []).forEach((lyr: any) => map.removeLayer(lyr));
      kmzLayers.current[group.id] = [];
      return;
    }

    // Fetch all layers in parallel (cached after first load)
    const geojsons = await Promise.all(
      group.layers.map(async (l) => {
        if (!kmzCache.current[l.id]) {
          try {
            const res = await fetch(`${API_BASE}/api/red/kmz/${l.id}`);
            kmzCache.current[l.id] = res.ok ? await res.json() : null;
          } catch { kmzCache.current[l.id] = null; }
        }
        return { id: l.id, name: l.name, geojson: kmzCache.current[l.id] };
      })
    );

    const c = group.color;
    const added: any[] = [];
    geojsons.forEach(({ name, geojson }) => {
      if (!geojson) return;
      const lyr = L.geoJSON(geojson, {
        style: () => ({ color: c, weight: 2.5, opacity: 0.85, fillColor: c, fillOpacity: 0.25 }),
        pointToLayer: (_: any, latlng: any) =>
          L.circleMarker(latlng, { radius: 4, fillColor: c, color: '#fff', weight: 1, opacity: 0.9, fillOpacity: 0.85 }),
        onEachFeature: (feat: any, layer: any) => {
          const fname = feat.properties?.name || name;
          if (fname) layer.bindTooltip(
            `<span style="font-size:11px;color:${c};font-weight:600">🔌 ${fname}</span>`,
            { className: 'noc-tooltip', sticky: true }
          );
        },
      }).addTo(map);
      added.push(lyr);
    });
    kmzLayers.current[group.id] = added;
  }, [kmzActive]);

  // ── Toggle vendor ─────────────────────────────────────────────────────────────
  const toggleVendor = (v: string) => {
    setSelectedCity(null); setSelectedHost(null);
    setVendorFilter(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000d06' }}>

      {/* Header */}
      <div style={{
        padding: '12px 20px', borderBottom: '1px solid rgba(0,255,136,0.1)',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Radio size={18} color={COLOR_ONLINE} />
          <span style={{ color: COLOR_ONLINE, fontWeight: 700, fontSize: 15 }}>Mapa de Red</span>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 20, flex: 1 }}>
          {[
            { label: 'Dispositivos', val: visible.length,  color: 'rgba(255,255,255,0.7)' },
            { label: 'Online',       val: online,           color: COLOR_ONLINE },
            { label: 'Offline',      val: offline,          color: COLOR_OFFLINE },
            { label: 'Uptime',       val: `${uptime}%`,     color: uptime >= 85 ? COLOR_ONLINE : COLOR_WARN },
            { label: 'Ciudades',     val: cities.length,    color: 'rgba(255,255,255,0.5)' },
            { label: 'Links',        val: topoLinks.length, color: '#3b82f6' },
            { label: 'Servicios',    val: odooServicios.filter(s => s.estado === 'active').length, color: '#00A859' },
          ].map(k => (
            <div key={k.label} style={{ textAlign: 'center' }}>
              <div style={{ color: k.color, fontWeight: 700, fontSize: 17 }}>{k.val}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Vista toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3, gap: 2 }}>
          <button onClick={() => setMainView('map')} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: 'none',
            background: mainView === 'map' ? 'rgba(0,255,136,0.15)' : 'transparent',
            color: mainView === 'map' ? COLOR_ONLINE : 'rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Radio size={12} /> Mapa
          </button>
          <button onClick={() => setMainView('graph')} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: 'none',
            background: mainView === 'graph' ? 'rgba(0,175,240,0.15)' : 'transparent',
            color: mainView === 'graph' ? '#00aff0' : 'rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Share2 size={12} /> Grafo completo
          </button>
          <button onClick={() => setMainView('dashboard')} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: 'none',
            background: mainView === 'dashboard' ? 'rgba(0,166,81,0.15)' : 'transparent',
            color: mainView === 'dashboard' ? '#00A651' : 'rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Activity size={12} /> Dashboard Nacional
          </button>
        </div>

        {/* Controles de capas — solo en vista mapa */}
        {mainView === 'map' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowDevices(p => !p)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              background: showDevices ? 'rgba(0,175,240,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showDevices ? '#00aff0' : 'rgba(255,255,255,0.15)'}`,
              color: showDevices ? '#00aff0' : 'rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Wifi size={13} /> Dispositivos
            </button>
            <button onClick={() => setShowTopo(p => !p)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              background: showTopo ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showTopo ? '#3b82f6' : 'rgba(255,255,255,0.15)'}`,
              color: showTopo ? '#3b82f6' : 'rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <GitBranch size={13} /> Links
            </button>
            <button onClick={() => setShowOdoo(p => !p)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              background: showOdoo ? 'rgba(0,168,89,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showOdoo ? '#00A859' : 'rgba(255,255,255,0.15)'}`,
              color: showOdoo ? '#00A859' : 'rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Building2 size={13} />
              Servicios Odoo
              {odooServicios.length > 0 && (
                <span style={{
                  background: showOdoo ? 'rgba(0,168,89,0.25)' : 'rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '0 5px', fontSize: 10,
                }}>
                  {odooServicios.filter(s => s.estado === 'active').length}
                </span>
              )}
            </button>
            {/* Sub-filtros onnet/offnet — solo si Odoo visible */}
            {showOdoo && (
              <>
                {([
                  { id: 'all',    label: 'Todos',    count: odooServicios.filter(s=>s.estado==='active').length,                            color: '#e2e8f0' },
                  { id: 'innet',  label: '🟢 On-net', count: odooServicios.filter(s=>s.estado==='active'&&s.entrega==='innet').length,  color: '#00A859' },
                  { id: 'offnet', label: '🔵 Off-net', count: odooServicios.filter(s=>s.estado==='active'&&s.entrega==='offnet').length, color: '#3b82f6' },
                ] as const).map(opt => (
                  <button key={opt.id} onClick={() => setOdooFiltro(opt.id)} style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                    background: odooFiltro === opt.id ? `${opt.color}20` : 'transparent',
                    border: `1px solid ${odooFiltro === opt.id ? opt.color : `${opt.color}30`}`,
                    color: odooFiltro === opt.id ? opt.color : `${opt.color}70`,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {opt.label}
                    <span style={{ background: `${opt.color}18`, borderRadius: 8, padding: '0 5px', fontSize: 10 }}>
                      {opt.count}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}


        {/* Refresh */}
        <button
          onClick={() => { setLoading(true); cargar(); }}
          style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
            background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.2)',
            color: COLOR_ONLINE, display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {lastUpdate ? lastUpdate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '...'}
        </button>
      </div>

      {/* Banner UISP no disponible */}
      {uispStatus && !uispStatus.ok && (
        <div style={{
          padding: '7px 20px',
          background: 'rgba(255,160,0,0.08)',
          borderBottom: '1px solid rgba(255,160,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Zap size={13} color="#ff9f0a" />
          <span style={{ color: '#ff9f0a', fontSize: 12, fontWeight: 600 }}>
            Monitoreo Ubiquiti (UISP) no disponible
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
            — Los links de topología y dispositivos Ubiquiti no se pueden cargar en este momento.
            {uispStatus.error && ` (${uispStatus.error.slice(0, 80)})`}
          </span>
        </div>
      )}

      {/* Filtros por marca */}
      <div style={{
        padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        {/* Selector de capa */}
        {([
          { id: 'dark',      label: '🌑 Oscuro'   },
          { id: 'satellite', label: '🛰 Satélite'  },
          { id: 'topo',      label: '🗻 Relieve'   },
        ] as const).map(opt => (
          <button key={opt.id} onClick={() => setMapLayer(opt.id)} style={{
            padding: '3px 11px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
            background: mapLayer === opt.id ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: `1px solid ${mapLayer === opt.id ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: mapLayer === opt.id ? 'white' : 'rgba(255,255,255,0.35)',
          }}>{opt.label}</button>
        ))}

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        <Filter size={12} color="rgba(255,255,255,0.3)" />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Marca:</span>
        <button
          onClick={() => { setVendorFilter([]); setSelectedCity(null); setSelectedHost(null); }}
          style={{
            padding: '3px 11px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
            background: vendorFilter.length === 0 ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: `1px solid ${vendorFilter.length === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
            color: vendorFilter.length === 0 ? 'white' : 'rgba(255,255,255,0.35)',
          }}
        >Todas</button>
        {VENDORS_ALL.map(v => {
          const count = hosts.filter(h => h.vendor === v).length;
          if (!count) return null;
          const active = vendorFilter.includes(v);
          const vc = VENDOR_COLORS[v];
          return (
            <button key={v} onClick={() => toggleVendor(v)} style={{
              padding: '3px 11px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
              background: active ? `${vc}22` : 'transparent',
              border: `1px solid ${active ? vc : `${vc}33`}`,
              color: active ? vc : `${vc}77`,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span>{VENDOR_ICONS[v]}</span>
              <span>{v}</span>
              <span style={{ background: `${vc}22`, borderRadius: 8, padding: '0 5px', fontSize: 10 }}>{count}</span>
            </button>
          );
        })}

        {/* KMZ Fiber groups — same pill style */}
        {kmzGroups.length > 0 && (
          <>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
            <Zap size={12} color="rgba(255,200,50,0.5)" />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Fibra:</span>
            {kmzGroups.map(g => {
              const on = kmzActive[g.id];
              return (
                <button key={g.id} onClick={() => toggleKmzGroup(g)} style={{
                  padding: '3px 11px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                  background: on ? `${g.color}22` : 'transparent',
                  border: `1px solid ${on ? g.color : `${g.color}33`}`,
                  color: on ? g.color : `${g.color}77`,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <span>🔌</span>
                  <span>{g.label}</span>
                  <span style={{ background: `${g.color}22`, borderRadius: 8, padding: '0 5px', fontSize: 10 }}>{g.layers.length}</span>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Vista principal: Mapa o Grafo completo */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>

        {/* Grafo D3 — toda la red inalámbrica */}
        {mainView === 'graph' && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <NetworkGraph height="100%" />
          </div>
        )}

        {/* Dashboard Nacional — iframe Observium */}
        {mainView === 'dashboard' && (
          <iframe
            src="/noc-status.html"
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            title="Dashboard Nacional XCIEN"
          />
        )}

        {/* Mapa Leaflet */}
        <div id="red-section-map" style={{ width: '100%', height: '100%', display: mainView === 'map' ? 'block' : 'none' }} />

        {/* Panel ciudad */}
        {selectedCity && !selectedHost && (
          <CityPanel
            city={selectedCity}
            vendorFilter={vendorFilter}
            onSelectHost={h => { setSelectedHost(h); }}
            onClose={() => setSelectedCity(null)}
          />
        )}

        {/* Panel host detalle */}
        {selectedHost && (
          <HostDetailPanel
            host={selectedHost}
            onClose={() => setSelectedHost(null)}
          />
        )}

        {/* Leyenda — dispositivos por calidad de señal */}
        {showDevices && (
          <div style={{
            position: 'absolute', bottom: 24, right: 16, zIndex: 999,
            background: 'rgba(5,8,16,0.92)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '10px 14px', minWidth: 170,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 7 }}>
              Calidad de señal RF
            </div>
            {[
              { color: '#00ff88', label: 'Excelente', detail: '≥ −65 dBm' },
              { color: '#ffcc00', label: 'Bueno',     detail: '−65 a −75 dBm' },
              { color: '#ff3366', label: 'Malo / Caído', detail: '< −75 dBm' },
              { color: '#00aff0', label: 'Sin señal RF', detail: 'Router / Switch' },
            ].map(({ color, label, detail }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}`, flexShrink: 0 }} />
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 600 }}>{label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, marginLeft: 5 }}>{detail}</span>
                </div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 6, paddingTop: 6, fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
              {geoDevices.length} dispositivos con coords
            </div>
          </div>
        )}

        {/* Leyenda — topología + fibra activas */}
        {(showTopo && topoLinks.length > 0) || kmzGroups.some(g => kmzActive[g.id]) ? (
          <div style={{
            position: 'absolute', bottom: 24, left: 16, zIndex: 999,
            background: 'rgba(5,15,10,0.92)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '10px 14px', minWidth: 160,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>

            {/* Topología */}
            {showTopo && topoLinks.length > 0 && (
              <div style={{ marginBottom: kmzGroups.some(g => kmzActive[g.id]) ? 10 : 0 }}>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6 }}>Topología</div>
                {[...new Set(topoLinks.map(l => l.vendor))].map(v => (
                  <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 22, height: 2, background: VENDOR_COLORS[v] || '#6b7280', borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{v}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginLeft: 'auto' }}>{topoLinks.filter(l => l.vendor === v).length}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Fibra óptica activa */}
            {kmzGroups.some(g => kmzActive[g.id]) && (
              <div>
                {showTopo && topoLinks.length > 0 && (
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 0 8px' }} />
                )}
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6 }}>Fibra Óptica</div>
                {kmzGroups.filter(g => kmzActive[g.id]).map(g => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 22, height: 3, background: g.color, borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ color: g.color, fontSize: 11, fontWeight: 600 }}>{g.label}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginLeft: 'auto' }}>{g.layers.length}</span>
                  </div>
                ))}
              </div>
            )}

          </div>
        ) : null}

        {/* Loading overlay */}
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,13,6,0.7)', zIndex: 999,
          }}>
            <div style={{ color: COLOR_ONLINE, textAlign: 'center' }}>
              <Activity size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ marginTop: 12, fontSize: 14 }}>Cargando red...</div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        .noc-tooltip {
          background: rgba(5,15,10,0.97) !important;
          border: 1px solid rgba(0,255,136,0.15) !important;
          border-radius: 10px !important;
          padding: 10px 14px !important;
          font-size: 12px !important;
          line-height: 1.6 !important;
          color: rgba(255,255,255,0.7) !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.5) !important;
        }
        .noc-tooltip::before { display:none !important; }
        .noc-popup .leaflet-popup-content-wrapper {
          background: #fff !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18) !important;
          padding: 0 !important;
        }
        .noc-popup .leaflet-popup-content {
          margin: 14px 16px !important;
        }
        .noc-popup .leaflet-popup-tip { background: #fff !important; }
        .noc-popup .leaflet-popup-close-button {
          color: #94a3b8 !important;
          font-size: 16px !important;
          top: 6px !important;
          right: 8px !important;
        }
      `}</style>
    </div>
  );
}
