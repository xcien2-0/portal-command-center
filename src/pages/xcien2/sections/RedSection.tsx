import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ThemeConfig } from '../types';
import { API_BASE } from '../../../config';
import { RefreshCw, Filter, Radio, Activity, GitBranch, X, Cpu, Signal, Zap, Clock, Wifi, Share2, Building2 } from 'lucide-react';
import NetworkGraph from '../../../components/NetworkGraph';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import brand from '../../../brand';

// ── Colores ────────────────────────────────────────────────────────────────────
const COLOR_ONLINE  = '#00ff88';
const COLOR_OFFLINE = '#ff3366';
const COLOR_WARN    = '#ffcc00';

// Sitios telecom (KMZ portfolios)
const COLOR_SITIO_MTP   = '#c8ff00'; // lime eléctrico — MTP
const COLOR_SITIO_CAPSA = '#facc15'; // amarillo brillante — CAPSA

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

// ── Prospectos industriales Piedras Negras (Next Ventures → destino XCIEN) ────
const PROSPECTOS_PN = [
  { name: 'Asfaltos y Pegamentos',  lat: 28.67908270651087,  lng: -100.5687768526713 },
  { name: 'Day Star Trim',          lat: 28.67957388231126,  lng: -100.5705253784698 },
  { name: 'Elastomeros',            lat: 28.68704699999893,  lng: -100.5553179999887 },
  { name: 'Elektrocontact',         lat: 28.64844999999912,  lng: -100.5601849999906 },
  { name: 'Elektrokontakt PDS',     lat: 28.64547999999907,  lng: -100.5298349999871 },
  { name: 'ERICH JAEGER',           lat: 28.69730099999897,  lng: -100.5556609999869 },
  { name: 'Fujikura',               lat: 28.69810599999892,  lng: -100.5567639999884 },
  { name: 'Fujikura 2',             lat: 28.67908099999895,  lng: -100.5508979999869 },
  { name: 'Fujikura 3',             lat: 28.67910199999896,  lng: -100.5529309999877 },
  { name: 'General Aluminium',      lat: 28.68695699999899,  lng: -100.5551649999885 },
  { name: 'GI Grupo',               lat: 28.72919399999885,  lng: -100.5199099999862 },
  { name: 'Gondi',                  lat: 28.68706899999893,  lng: -100.5574139999884 },
  { name: 'Lear 1',                 lat: 28.68133899999895,  lng: -100.5521769999882 },
  { name: 'Lear 2',                 lat: 28.68122699999896,  lng: -100.5701909999888 },
  { name: 'Lear 3',                 lat: 28.68129099999896,  lng: -100.5714159999887 },
  { name: 'Lear 4',                 lat: 28.67739999999897,  lng: -100.5698699999888 },
  { name: 'Lear 5',                 lat: 28.64570299999908,  lng: -100.5594769999907 },
  { name: 'Littelfuse',             lat: 28.64529299999908,  lng: -100.5356489999875 },
  { name: 'M&B Hangers',            lat: 28.64697599999908,  lng: -100.5578429999906 },
  { name: 'Mex Star',               lat: 28.64604399999908,  lng: -100.5591019999905 },
  { name: 'Nesse',                  lat: 28.72532699999888,  lng: -100.5227969999864 },
  { name: 'Path Logistics',         lat: 28.64937799999907,  lng: -100.5590679999905 },
  { name: 'PKC Group',              lat: 28.68128599999895,  lng: -100.5539429999882 },
  { name: 'Prossesa',               lat: 28.59684599999918,  lng: -100.5851339999924 },
  { name: 'Prysmian WH',            lat: 28.72056499999888,  lng: -100.5210000000000 },
  { name: 'Prysmian',               lat: 28.68763799999897,  lng: -100.5556909999884 },
  { name: 'Rassini',                lat: 28.68875299999897,  lng: -100.5209539999869 },
  { name: 'Regal 2',                lat: 28.68195299999895,  lng: -100.5524769999882 },
  { name: 'Regal 3',                lat: 28.67693399999897,  lng: -100.5512549999883 },
  { name: 'Regal Amistad Sur',      lat: 28.64604399999908,  lng: -100.5211749999872 },
  { name: 'Remy Borg Warner',       lat: 28.72832699999884,  lng: -100.5245059999864 },
  { name: 'Structural Graphics',    lat: 28.68385699999896,  lng: -100.5562659999884 },
  { name: 'Transformadores PN',     lat: 28.68758299999897,  lng: -100.5570529999883 },
  { name: 'Us Liner',               lat: 28.64222499999908,  lng: -100.5299469999872 },
] as const;

// ── Layer Registry — fuente única de verdad para capas del mapa ───────────────
const LAYER_REGISTRY = [
  { id: 'nocboard',      label: 'NOC',      color: '#00ff88' },
  { id: 'wireless',      label: 'Wireless',  color: '#3b82f6' },
  { id: 'core',          label: 'Core',      color: '#ff3366' },
  { id: 'onnet',         label: 'OnNet',     color: '#00A651' },
  { id: 'offnet',        label: 'OffNet',    color: '#ff3366' },
  { id: 'inter',         label: 'Inter',     color: '#a855f7' },
  { id: 'sinclasificar', label: 'Sin cls',   color: '#f59e0b' },
  { id: 'sitios',        label: 'Sitios',    color: '#c8ff00' },
  { id: 'rb-odoo',       label: 'RB Odoo',   color: '#00ffcc' },
  { id: 'fibra',         label: 'Fibra',     color: '#f97316' },
  { id: 'sidf',          label: 'SIDF',      color: '#00e5ff' },
  { id: 'gps',           label: 'GPS',       color: '#22d3ee' },
  { id: 'prospectos-pn', label: 'Prospectos', color: '#39FF14' },
] as const;

type LayerId = typeof LAYER_REGISTRY[number]['id'];

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

// Coordenadas vienen del backend (NOCBoard + _CITY_META) — no se necesitan aquí

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
  const [nocCities, setNocCities]       = useState<any[]>([]);
  const [topoLinks, setTopoLinks]       = useState<TopoLink[]>([]);
  const [loading, setLoading]           = useState(true);
  const [lastUpdate, setLastUpdate]     = useState<Date | null>(null);
  const [vendorFilter, setVendorFilter] = useState<string[]>([]);
  const [showTopo, setShowTopo]         = useState(false);
  const [showDevices, setShowDevices]   = useState(true);
  const [geoDevices, setGeoDevices]     = useState<any[]>([]);
  const [mainView, setMainView]         = useState<'map' | 'graph' | 'dashboard'>('map');
  const [selectedCity, setSelectedCity] = useState<CityGroup | null>(null);
  const [selectedHost, setSelectedHost] = useState<NOCHost | null>(null);
  const [mapLayer, setMapLayer]         = useState<'dark' | 'satellite' | 'topo'>('dark');

  const [kmzGroups,     setKmzGroups]   = useState<KmzGroup[]>([]);
  const [kmzActive,     setKmzActive]   = useState<Record<string, boolean>>({});
  const [uispStatus,    setUispStatus]  = useState<{ ok: boolean; error: string | null } | null>(null);
  const [odooServicios, setOdooServicios] = useState<any[]>([]);
  const [rbOdooData,    setRbOdooData]  = useState<any[]>([]);
  const [fibraSitios,   setFibraSitios] = useState<any[]>([]);
  const [clientesSIDF,  setClientesSIDF] = useState<any[]>([]);
  const [gpsVehiculos,  setGpsVehiculos] = useState<any[]>([]);

  // Capas activas — única fuente de verdad para visibilidad
  const [activeLayers, setActiveLayers] = useState<Set<LayerId>>(
    () => new Set<LayerId>(['nocboard', 'wireless'])
  );
  const toggleLayer = (id: LayerId) =>
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const showOdoo = (['onnet', 'offnet', 'inter', 'sinclasificar'] as LayerId[]).some(id => activeLayers.has(id));

  const mapRef      = useRef<any>(null);
  const leafRef     = useRef<any>(null);
  const tileRef     = useRef<any>(null);
  const sitiosCache = useRef<any>(null);
  const leafLayers  = useRef<Record<string, any>>({}); // layerId → Leaflet LayerGroup
  const kmzLayers   = useRef<Record<string, any[]>>({}); // groupId → Leaflet layers[]
  const kmzCache    = useRef<Record<string, any>>({}); // layerId → GeoJSON

  // Helper: obtiene o crea un LayerGroup para la capa dada
  const getLayer = (id: string) => {
    
    const map = mapRef.current;
    if (!L || !map) return null;
    if (!leafLayers.current[id]) {
      leafLayers.current[id] = L.layerGroup().addTo(map);
    }
    return leafLayers.current[id];
  };

  // ── Cargar datos ─────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    try {
      const [hostsRes, topoRes, uispRes, citiesRes] = await Promise.all([
        fetch(`${API_BASE}/api/noc/hosts`),
        fetch(`${API_BASE}/api/red/topologia-geo`),
        fetch(`${API_BASE}/api/red/uisp-status`),
        fetch(`${API_BASE}/api/noc/cities`),
      ]);
      const hostsData   = await hostsRes.json();
      const topoData    = await topoRes.json();
      const uispData    = uispRes.ok ? await uispRes.json() : null;
      const citiesRaw   = citiesRes.ok ? await citiesRes.json() : [];
      setHosts(Array.isArray(hostsData) ? hostsData : (hostsData.hosts || []));
      setNocCities(
        (Array.isArray(citiesRaw) ? citiesRaw : [])
          .filter((c: any) =>
            c.lat && c.lng &&
            14.5 < c.lat && c.lat < 32.8 && -118.5 < c.lng && c.lng < -86.5
          )
      );
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

  // ── Cargar sitios unificados (Odoo + Drive + Inventario) ────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/infra/sitios`)
      .then(r => r.ok ? r.json() : { sitios: [] })
      .then(data => setRbOdooData(Array.isArray(data) ? data : (data?.sitios ?? [])))
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

  // ── Ciudades NOCBoard (on-net, solo México) ──────────────────────────────────
  const cities: CityGroup[] = useMemo(() => nocCities.map((c: any) => {
    const cityHosts = hosts.filter(h => h.city === c.name);
    const byVendor: Record<string, number> = {};
    cityHosts.forEach(h => { byVendor[h.vendor] = (byVendor[h.vendor] || 0) + 1; });
    return {
      name: c.name,
      lat: c.lat,
      lng: c.lng,
      hosts: cityHosts,
      online: c.online ?? cityHosts.filter(h => h.status === 'online').length,
      offline: c.offline ?? cityHosts.filter(h => h.status === 'offline').length,
      byVendor,
    };
  }), [nocCities, hosts]);

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const visible   = vendorFilter.length === 0 ? hosts : hosts.filter(h => vendorFilter.includes(h.vendor));
  const online    = visible.filter(h => h.status === 'online').length;
  const offline   = visible.filter(h => h.status === 'offline').length;
  const uptime    = visible.length > 0 ? Math.round(online / visible.length * 1000) / 10 : 0;

  // ── Inicializar Leaflet ──────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    const map = L.map('red-section-map', {
      center: [23.5, -102.5], zoom: 5, zoomControl: true,
      attributionControl: false, minZoom: 4,
      preferCanvas: true,
    });
    const tile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19,
      keepBuffer: 4,
      updateWhenIdle: false,
      updateWhenZooming: false,
    }).addTo(map);
    tileRef.current = tile;
    leafRef.current = L;
    mapRef.current  = map;
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  // ── Cambiar capa de mapa ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !tileRef.current) return;
    const map = mapRef.current;

    map.removeLayer(tileRef.current);

    const TILE_OPT = { keepBuffer: 4, updateWhenIdle: false, updateWhenZooming: false };
    const URLS: Record<string, [string, object]> = {
      dark:      ['https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19, ...TILE_OPT }],
      satellite: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, ...TILE_OPT }],
      topo:      ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, ...TILE_OPT }],
    };
    const [url, opts] = URLS[mapLayer];
    tileRef.current = L.tileLayer(url, opts).addTo(map);

    Object.values(leafLayers.current).forEach((lyr: any) => {
      if (lyr && map.hasLayer(lyr)) { map.removeLayer(lyr); lyr.addTo(map); }
    });
  }, [mapLayer]);

  // ── Renderizar marcadores NOC (ciudades) ──────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    
    const lyr = getLayer('nocboard');
    if (!lyr) return;
    lyr.clearLayers();

    cities.forEach(city => {
      const total = city.online + city.offline || 1;
      const pct   = city.online / total;
      const color = pct >= 0.85 ? COLOR_ONLINE : pct >= 0.5 ? COLOR_WARN : COLOR_OFFLINE;
      const size  = Math.max(14, Math.min(30, 9 + total / 6));
      const top   = Object.entries(city.byVendor).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Unknown';
      const vc    = VENDOR_COLORS[top] || '#00A651';

      const icon = L.divIcon({
        className: '',
        iconSize: [size, size], iconAnchor: [size/2, size/2],
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;
          background:${color}22;border:2px solid ${vc};
          box-shadow:0 0 ${size/2}px ${color}55;
          display:flex;align-items:center;justify-content:center;
          font-size:${Math.max(7,size/3)}px;font-weight:700;color:${color}">${total}</div>`,
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
        .addTo(lyr);
    });
  }, [cities]);

  // ── Renderizar topología ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const lyr = getLayer('core');
    if (!lyr) return;
    lyr.clearLayers();
    if (!activeLayers.has('core')) return;

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
      ).addTo(lyr);
    });
  }, [activeLayers, topoLinks, vendorFilter]);

  // ── Renderizar dispositivos UISP sobre el mapa ───────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    
    const lyr = getLayer('wireless');
    if (!lyr) return;
    lyr.clearLayers();
    if (!activeLayers.has('wireless') || geoDevices.length === 0) return;

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
      ).addTo(lyr);
    });
  }, [activeLayers, geoDevices]);

  // ── Renderizar servicios Odoo ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    
    const lyr = getLayer('odoo');
    if (!lyr) return;
    lyr.clearLayers();
    if (!showOdoo || odooServicios.length === 0) return;

    // Colores por tipo de entrega (onnet/offnet)
    const COLOR_INNET  = brand.accentColor;   // on-net
    const COLOR_OFFNET = '#ff3366';   // rojo — off-net (infraestructura de terceros)
    const COLOR_INTER  = '#a855f7';   // morado — intercompañía
    const COLOR_NULL   = '#f59e0b';   // ámbar — sin clasificar

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

    const visibles = odooServicios.filter(s => {
      if (s.entrega === 'innet')  return activeLayers.has('onnet');
      if (s.entrega === 'offnet') return activeLayers.has('offnet');
      if (s.entrega === 'inter')  return activeLayers.has('inter');
      return activeLayers.has('sinclasificar');
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
      .addTo(lyr);
    });
  }, [activeLayers, odooServicios, showOdoo]);

  // ── Renderizar sitios telecom (KMZ portfolios MTP / CAPSA) ──────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const lyr = getLayer('sitios');
    if (!lyr) return;
    lyr.clearLayers();
    if (!activeLayers.has('sitios')) return;

    const render = (geojson: any) => {
      L.geoJSON(geojson, {
        pointToLayer: (feat: any, latlng: any) => {
          const isMTP = feat.properties?.portfolio === 'MTP';
          const color = isMTP ? COLOR_SITIO_MTP : COLOR_SITIO_CAPSA;
          return L.circleMarker(latlng, {
            radius: 4,
            fillColor: color,
            color: '#000',
            weight: 0.5,
            fillOpacity: 0.88,
            opacity: 1,
          });
        },
        onEachFeature: (feat: any, layer: any) => {
          const p = feat.properties;
          const color = p.portfolio === 'MTP' ? COLOR_SITIO_MTP : COLOR_SITIO_CAPSA;
          layer.bindTooltip(
            `<div style="font-weight:700;color:${color};margin-bottom:3px">📡 ${p.id}</div>
             <div style="color:rgba(255,255,255,0.85);font-size:11px;font-weight:600">${p.nombre}</div>
             <div style="color:rgba(255,255,255,0.4);font-size:10px;margin-top:2px">${p.municipio}, ${p.estado}</div>
             <div style="font-size:10px;margin-top:4px">
               <span style="background:${color}22;color:${color};padding:1px 7px;border-radius:8px;font-weight:700">${p.portfolio}</span>
             </div>`,
            { className: 'noc-tooltip', sticky: true }
          );
        },
      }).addTo(lyr);
    };

    if (sitiosCache.current) {
      render(sitiosCache.current);
    } else {
      fetch('/sitios_telecom.geojson')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) { sitiosCache.current = data; render(data); } })
        .catch(() => {});
    }
  }, [activeLayers]);

  // ── Capa Fibra ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    
    const lyr = getLayer('fibra');
    if (!lyr) return;
    lyr.clearLayers();
    if (!activeLayers.has('fibra')) return;

    const FIBRA_COLORS: Record<string, string> = {
      activo:       '#22c55e',
      instalacion:  '#f59e0b',
      aprobado:     '#22d3ee',
      levantamiento:'#f97316',
      prospecto:    '#94a3b8',
    };

    const doRender = (sitios: any[]) => {
      sitios.forEach((s: any) => {
        const color = FIBRA_COLORS[s.estado] || '#94a3b8';
        const m = L.circleMarker([s.lat, s.lng], {
          radius: 7, fillColor: color, color: '#000', weight: 1, fillOpacity: 0.9,
        });
        m.bindTooltip(
          `<div style="font-weight:700;color:${color};margin-bottom:3px">🔵 ${s.id}</div>
           <div style="font-weight:600;font-size:12px">${s.nombre}</div>
           <div style="color:rgba(255,255,255,0.5);font-size:10px">${s.plaza} · ${s.velocidad}</div>
           <div style="margin-top:4px"><span style="background:${color}22;color:${color};padding:1px 7px;border-radius:8px;font-weight:700;font-size:9px">${s.estado}</span></div>`,
          { className: 'noc-tooltip', sticky: true }
        );
        m.addTo(lyr);
      });
    };

    if (fibraSitios.length > 0) {
      doRender(fibraSitios);
    } else {
      fetch(`${API_BASE}/api/red/fibra-geo`)
        .then(r => r.ok ? r.json() : { sitios: [] })
        .then(data => {
          const list = data.sitios || [];
          setFibraSitios(list);
          doRender(list);
        })
        .catch(() => {});
    }
  }, [activeLayers, fibraSitios]);

  // ── Capa Clientes SIDF ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    
    const lyr = getLayer('sidf');
    if (!lyr) return;
    lyr.clearLayers();
    if (!activeLayers.has('sidf')) return;

    const SIDF_COLOR: Record<string, { fill: string; border: string; label: string }> = {
      activo:      { fill: '#00e5ff', border: '#0ea5e9', label: '● Activo'      },
      instalacion: { fill: '#FFB703', border: '#d97706', label: '● Instalación' },
      aprobado:    { fill: '#3B82F6', border: '#1d4ed8', label: '● Aprobado'    },
    };

    const doRender = (clientes: any[]) => {
      clientes.forEach((c: any) => {
        const cfg   = SIDF_COLOR[c.estado] ?? SIDF_COLOR.activo;
        const noc   = c.noc_monitoreado;
        const alertas: string[] = c.alertas || [];
        const hasAlert = alertas.length > 0;
        const coordOk  = c.coord_verificada === true;
        const alertHtml = hasAlert
          ? `<div style="margin-top:4px;padding:3px 6px;background:#ff475722;border-left:2px solid #ff4757;font-size:9px;color:#ff4757">${alertas.join(' · ')}</div>`
          : '';
        const coordWarn = !coordOk
          ? `<div style="margin-top:4px;padding:2px 6px;background:#fbbf2422;border-left:2px solid #fbbf24;font-size:9px;color:#fbbf24">⚠ coordenadas aproximadas — sin verificar</div>`
          : '';
        const m = L.circleMarker([c.lat, c.lng], {
          radius: c.estado === 'activo' ? 10 : 8,
          fillColor: cfg.fill,
          color: hasAlert ? '#ff4757' : cfg.border,
          weight: hasAlert ? 3 : 2,
          fillOpacity: 0.9,
          dashArray: coordOk ? undefined : '4 3',
        });
        m.bindTooltip(
          `<div style="font-weight:700;color:${cfg.fill};margin-bottom:3px">🔷 SIDF · ${c.id.toUpperCase()}</div>
           <div style="font-weight:600;font-size:12px">${c.nombre}</div>
           <div style="color:rgba(255,255,255,0.55);font-size:10px">${c.plaza.toUpperCase()} · ${c.velocidad || '—'}</div>
           ${c.equipo_hw ? `<div style="color:rgba(255,255,255,0.4);font-size:9px;margin-top:2px">${c.equipo_hw}</div>` : ''}
           <div style="margin-top:5px;display:flex;gap:4px;flex-wrap:wrap">
             <span style="background:${cfg.fill}22;color:${cfg.fill};padding:1px 6px;border-radius:6px;font-size:9px;font-weight:700">${cfg.label}</span>
             <span style="background:${noc ? '#00e5ff22' : '#6b728022'};color:${noc ? '#00e5ff' : '#94a3b8'};padding:1px 6px;border-radius:6px;font-size:9px;font-weight:700">
               ${noc ? '✓ NOC' : '✗ sin NOC'}
             </span>
             <span style="background:${c.sidf_odoo ? '#22c55e22' : '#f9731622'};color:${c.sidf_odoo ? '#22c55e' : '#f97316'};padding:1px 6px;border-radius:6px;font-size:9px;font-weight:700">
               ${c.sidf_odoo ? '✓ Odoo' : '✗ sin Odoo'}
             </span>
           </div>
           ${alertHtml}${coordWarn}`,
          { className: 'noc-tooltip', sticky: true }
        );
        m.addTo(lyr);
      });
    };

    if (clientesSIDF.length > 0) {
      doRender(clientesSIDF);
    } else {
      fetch(`${API_BASE}/api/red/clientes-sidf`)
        .then(r => r.ok ? r.json() : { clientes: [] })
        .then(data => {
          const list = data.clientes || [];
          setClientesSIDF(list);
          doRender(list);
        })
        .catch(() => {});
    }
  }, [activeLayers, clientesSIDF]);

  // ── Capa GPS ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const lyr = getLayer('gps');
    if (!lyr) return;
    lyr.clearLayers();
    if (!activeLayers.has('gps')) return;

    const doRender = (vehiculos: any[]) => {
      vehiculos.forEach((v: any) => {
        if (!v.lat || !v.lng) return;
        // verde = en movimiento, azul = activo hoy detenido, gris = sin actividad
        const color = v.activo ? '#00ff88' : v.activo_hoy ? '#38BDF8' : '#64748b';
        const ring  = v.activo
          ? `<circle cx="14" cy="14" r="12" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 2" opacity="0.6"/>`
          : '';
        const truck = `<path d="M3 17h2v1a1 1 0 002 0v-1h10v1a1 1 0 002 0v-1h2v-4l-2.5-5H3v9zm2-7h12l2 4H5v-4z" fill="${color}" opacity="0.9"/>`;
        const svg = encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="12" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="1.6"/>
            ${ring}${truck}
          </svg>`
        );
        const icon = L.divIcon({
          className: '',
          html: `<img src="data:image/svg+xml,${svg}" width="28" height="28"/>`,
          iconSize: [28, 28], iconAnchor: [14, 14],
        });
        const km    = (v.km_hoy ?? 0).toFixed(0);
        const cond  = v.conductor ? `<div style="font-size:10px;color:rgba(255,255,255,0.6);margin-top:2px">👤 ${v.conductor}</div>` : '';
        const m = L.marker([v.lat, v.lng], { icon });
        m.bindTooltip(
          `<div style="font-weight:700;color:${color};margin-bottom:3px">🚛 ${v.nombre}</div>
           <div style="font-size:11px;color:rgba(255,255,255,0.7)">${v.placa}${v.make ? ' · ' + v.make : ''}</div>
           <div style="display:flex;gap:10px;margin-top:5px">
             <span style="font-size:11px;font-weight:700;color:${color}">${v.velocidad ?? 0} km/h</span>
             <span style="font-size:11px;color:#38BDF8">${km} km hoy</span>
             <span style="font-size:11px;color:#a78bfa">${v.viajes_hoy ?? 0} viajes</span>
           </div>
           ${cond}
           <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:3px">${v.ubicacion ?? ''}</div>
           <div style="font-size:9px;color:rgba(255,255,255,0.25);margin-top:2px">${v.ultima_vez ?? ''}</div>`,
          { className: 'noc-tooltip', sticky: true }
        );
        m.addTo(lyr);
      });
    };

    fetch(`${API_BASE}/api/gps/vehiculos`)
      .then(r => r.ok ? r.json() : { vehiculos: [] })
      .then(data => {
        const list = data.vehiculos || [];
        setGpsVehiculos(list);
        doRender(list);
      })
      .catch(() => {});
  }, [activeLayers]);

  // ── Prospectos PN ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const lyr = getLayer('prospectos-pn');
    if (!lyr) return;
    lyr.clearLayers();
    if (!activeLayers.has('prospectos-pn')) return;
    
    PROSPECTOS_PN.forEach(p => {
      L.circleMarker([p.lat, p.lng], {
        radius: 8, color: '#000000', fillColor: '#39FF14',
        fillOpacity: 0.9, weight: 2,
      }).bindTooltip(
        `<div style="font-weight:700;color:#39FF14;margin-bottom:2px">🏭 ${p.name}</div>
         <div style="font-size:10px;color:rgba(255,255,255,0.55)">Prospecto industrial · Piedras Negras</div>`,
        { className: 'noc-tooltip', sticky: true }
      ).addTo(lyr);
    });
  }, [activeLayers]);

  // ── Toggle KMZ group ─────────────────────────────────────────────────────────
  const toggleKmzGroup = useCallback(async (group: KmzGroup) => {
    if (!mapRef.current) return;
    
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

    // Auto-zoom al área de la capa recién activada
    if (added.length > 0) {
      try {
        const bounds = added.reduce((b: any, lyr: any) => {
          try { return b ? b.extend(lyr.getBounds()) : lyr.getBounds(); } catch { return b; }
        }, null);
        if (bounds && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: true });
        }
      } catch {}
    }
  }, [kmzActive]);

  // ── Renderizar radiobases Odoo ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const lyr = getLayer('rb-odoo');
    if (!lyr) return;
    lyr.clearLayers();
    if (!activeLayers.has('rb-odoo') || rbOdooData.length === 0) return;

    rbOdooData.forEach((rb: any) => {
      const enInfra  = !!(rb.vigencia || rb.estatus_contrato || rb.ip_router_core);
      const color    = enInfra ? '#00ffcc' : '#ffaa00';
      const clients  = rb.clientes || 0;
      const th = 20;   // altura fija pequeña
      const tw = 11;

      // SVG de torre de telecomunicaciones compacta — sin label (nombre en tooltip)
      const W = tw + 4;
      const H = th + 2;
      const icon = L.divIcon({
        className: '',
        iconSize:   [W, H],
        iconAnchor: [W / 2, H], // ancla en la base de la torre
        html: `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
          <defs>
            <filter id="glow-${rb.id}" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <!-- Torre: coordenadas relativas al centro X=${W/2} -->
          <!-- Antena vertical -->
          <line x1="${W/2}" y1="0" x2="${W/2}" y2="6" stroke="${color}" stroke-width="1.8" stroke-linecap="round" filter="url(#glow-${rb.id})"/>
          <!-- Brazo antena -->
          <line x1="${W/2-5}" y1="4" x2="${W/2+5}" y2="4" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/>
          <line x1="${W/2-5}" y1="4" x2="${W/2-5}" y2="7" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="${W/2+5}" y1="4" x2="${W/2+5}" y2="7" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>
          <!-- Pata izquierda -->
          <line x1="${W/2}" y1="7" x2="${W/2 - tw*0.42}" y2="${th-2}" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
          <!-- Pata derecha -->
          <line x1="${W/2}" y1="7" x2="${W/2 + tw*0.42}" y2="${th-2}" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
          <!-- Travesaño 1 (25% altura) -->
          <line x1="${W/2 - tw*0.11}" y1="${7 + (th-9)*0.25}" x2="${W/2 + tw*0.11}" y2="${7 + (th-9)*0.25}" stroke="${color}" stroke-width="1" stroke-linecap="round"/>
          <!-- Travesaño 2 (55%) -->
          <line x1="${W/2 - tw*0.23}" y1="${7 + (th-9)*0.55}" x2="${W/2 + tw*0.23}" y2="${7 + (th-9)*0.55}" stroke="${color}" stroke-width="1" stroke-linecap="round"/>
          <!-- Travesaño 3 (85%) -->
          <line x1="${W/2 - tw*0.35}" y1="${7 + (th-9)*0.85}" x2="${W/2 + tw*0.35}" y2="${7 + (th-9)*0.85}" stroke="${color}" stroke-width="1.1" stroke-linecap="round"/>
          <!-- Diagonales cruzadas 1-2 -->
          <line x1="${W/2 - tw*0.11}" y1="${7 + (th-9)*0.25}" x2="${W/2 + tw*0.23}" y2="${7 + (th-9)*0.55}" stroke="${color}" stroke-width="0.6" stroke-opacity="0.4"/>
          <line x1="${W/2 + tw*0.11}" y1="${7 + (th-9)*0.25}" x2="${W/2 - tw*0.23}" y2="${7 + (th-9)*0.55}" stroke="${color}" stroke-width="0.6" stroke-opacity="0.4"/>
          <!-- Base horizontal -->
          <line x1="${W/2 - tw*0.42}" y1="${th-2}" x2="${W/2 + tw*0.42}" y2="${th-2}" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>
          <!-- Punto antena -->
          <circle cx="${W/2}" cy="3" r="2" fill="${color}" opacity="0.95" filter="url(#glow-${rb.id})"/>
        </svg>`,
      });

      L.marker([rb.lat, rb.lng], { icon })
        .bindTooltip(
          `<div style="font-weight:700;color:${color};margin-bottom:3px">📡 ${rb.nombre}</div>
           <div style="color:rgba(255,255,255,0.6);font-size:10px">${rb.sop}</div>
           <div style="margin-top:5px;font-size:10px">
             <span style="color:${color};font-weight:700">${clients} clientes</span>
             ${enInfra
               ? `<span style="background:#00ffcc22;color:#00ffcc;padding:1px 6px;border-radius:8px;margin-left:6px">✓ En Infra</span>`
               : `<span style="background:#ffaa0022;color:#ffaa00;padding:1px 6px;border-radius:8px;margin-left:6px">Solo Odoo</span>`}
           </div>
           ${rb.infra_estatus ? `<div style="color:rgba(255,255,255,0.4);font-size:9px;margin-top:2px">${rb.infra_estatus}</div>` : ''}`,
          { className: 'noc-tooltip' }
        )
        .bindPopup(
          `<div style="min-width:220px">
             <div style="font-weight:700;color:${color};font-size:13px;margin-bottom:4px">📡 ${rb.nombre}</div>
             <div style="color:#64748b;font-size:11px;margin-bottom:8px">${rb.partner || rb.sop}</div>
             <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:10px;margin-bottom:6px">
               <span style="background:${color}22;color:${color};padding:2px 8px;border-radius:8px;font-weight:700">${clients} clientes</span>
               ${enInfra
                 ? `<span style="background:#00ffcc22;color:#00ffcc;padding:2px 8px;border-radius:8px">✓ En Infra</span>`
                 : `<span style="background:#ffaa0022;color:#ffaa00;padding:2px 8px;border-radius:8px">Solo Odoo</span>`}
             </div>
             ${rb.estatus_contrato ? `<div style="color:#475569;font-size:10px"><b>Contrato:</b> ${rb.estatus_contrato}</div>` : ''}
             ${rb.vigencia ? `<div style="color:#475569;font-size:10px"><b>Vigencia:</b> ${rb.vigencia}</div>` : ''}
             ${rb.renta ? `<div style="color:#475569;font-size:10px"><b>Renta:</b> ${rb.renta}</div>` : ''}
             ${rb.ip_router_core ? `<div style="color:#475569;font-size:10px"><b>Router:</b> ${rb.ip_router_core}</div>` : ''}
             ${rb.noc_estado ? `<div style="color:#475569;font-size:10px"><b>NOC:</b> ${rb.noc_estado}</div>` : ''}
             <div style="font-size:10px;color:#475569;margin-top:4px;display:flex;gap:8px;flex-wrap:wrap">
               ${rb.sensor_cfe ? `<span>⚡CFE</span>` : ''}${rb.planta_emergencia ? `<span>🔋Planta</span>` : ''}${rb.camara ? `<span>📷Cámara</span>` : ''}${rb.temperatura ? `<span>🌡Temp</span>` : ''}
             </div>
             <a href="https://odoo.wispi.mx/web#id=${rb.id}&model=running.services&view_type=form&cids=25" target="_blank" rel="noopener noreferrer"
                style="display:block;text-align:center;padding:6px 12px;background:${color};color:#000;border-radius:6px;font-size:11px;font-weight:700;text-decoration:none;margin-top:8px">
               Abrir Radiobase en Odoo →
             </a>
           </div>`,
          { className: 'noc-popup', maxWidth: 280 }
        )
        .addTo(lyr);
    });
  }, [activeLayers, rbOdooData]);

  // ── Toggle vendor ─────────────────────────────────────────────────────────────
  const toggleVendor = (v: string) => {
    setSelectedCity(null); setSelectedHost(null);
    setVendorFilter(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000d06' }}>

      {/* Header minimalista — fila única */}
      <div style={{
        padding: '6px 14px', borderBottom: '1px solid rgba(0,255,136,0.08)',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        minHeight: 38,
      }}>
        {/* Título + stats inline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Radio size={13} color={COLOR_ONLINE} />
          <span style={{ color: COLOR_ONLINE, fontWeight: 700, fontSize: 12 }}>Red</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11 }}>
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>{visible.length} disp</span>
          <span style={{ color: COLOR_ONLINE, fontWeight: 600 }}>{online}↑</span>
          {offline > 0 && <span style={{ color: COLOR_OFFLINE, fontWeight: 600 }}>{offline}↓</span>}
          <span style={{ color: uptime >= 85 ? COLOR_ONLINE : COLOR_WARN, fontWeight: 600 }}>{uptime}%</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>{cities.length} ciu</span>
          {topoLinks.length > 0 && <span style={{ color: '#3b82f6' }}>{topoLinks.length} links</span>}
          {odooServicios.length > 0 && <span style={{ color: brand.accentColor }}>{odooServicios.filter(s => s.estado === 'active').length} svc</span>}
        </div>

        {/* Separador */}
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

        {/* Vista toggle — compacto */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 2, gap: 1, flexShrink: 0 }}>
          {([
            { id: 'map',       icon: <Radio size={11} />,    label: 'Mapa',      c: COLOR_ONLINE },
            { id: 'graph',     icon: <Share2 size={11} />,   label: 'Grafo',     c: '#00aff0' },
            { id: 'dashboard', icon: <Activity size={11} />, label: 'Nacional',  c: '#00A651' },
          ] as const).map(v => (
            <button key={v.id} onClick={() => setMainView(v.id)} style={{
              padding: '3px 9px', borderRadius: 4, fontSize: 10, cursor: 'pointer', border: 'none',
              background: mainView === v.id ? `${v.c}18` : 'transparent',
              color: mainView === v.id ? v.c : 'rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.12s',
            }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        {/* Separador */}
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

        {/* Capas — generadas desde LAYER_REGISTRY */}
        {mainView === 'map' && LAYER_REGISTRY.map(layer => {
          const active = layer.id === 'nocboard' ? true : activeLayers.has(layer.id);
          const count: number | string | null =
            layer.id === 'nocboard'  ? `${hosts.filter(h=>h.status==='online').length}/${hosts.length}` :
            layer.id === 'wireless'  ? (hosts.filter(h=>['Mimosa','Ubiquiti','Cambium'].includes(h.vendor)).length || null) :
            layer.id === 'core'      ? (offline > 0 ? offline : null) :
            layer.id === 'sitios'    ? 3727 :
            layer.id === 'rb-odoo'  ? (rbOdooData.length || null) :
            layer.id === 'fibra'     ? (fibraSitios.length || null) :
            layer.id === 'sidf'      ? (clientesSIDF.length || null) :
            layer.id === 'gps'       ? (gpsVehiculos.length || null) :
            null;
          return (
          <button key={layer.id}
            onClick={() => { if (layer.id !== 'nocboard') toggleLayer(layer.id); }}
            style={{
              padding: '3px 8px', borderRadius: 12, fontSize: 10, cursor: layer.id === 'nocboard' ? 'default' : 'pointer',
              background: active ? `${layer.color}15` : 'transparent',
              border: `1px solid ${active ? layer.color + '80' : 'rgba(255,255,255,0.1)'}`,
              color: active ? layer.color : 'rgba(255,255,255,0.35)',
              display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.12s', flexShrink: 0,
            }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? layer.color : 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
            {layer.label}
            {count !== null && count !== 0 && (
              <span style={{ color: layer.color, fontWeight: 700, fontSize: 9 }}>{count}</span>
            )}
          </button>
          );
        })}

        {/* Refresh — solo ícono */}
        <button onClick={() => { setLoading(true); cargar(); }}
          title={lastUpdate ? lastUpdate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Actualizar'}
          style={{
            marginLeft: 'auto', padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(0,255,136,0.15)',
            color: 'rgba(0,255,136,0.5)', display: 'flex', alignItems: 'center', gap: 4,
          }}>
          <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {lastUpdate ? lastUpdate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '—'}
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
            title={`Dashboard Nacional ${brand.name}`}
          />
        )}

        {/* Mapa Leaflet */}
        <div id="red-section-map" style={{ width: '100%', height: '100%', display: mainView === 'map' ? 'block' : 'none' }} />

        {/* Controles flotantes del mapa */}
        {mainView === 'map' && (
          <div style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, display: 'flex', gap: 8, alignItems: 'center',
            pointerEvents: 'none',
          }}>
            {/* Tipo de mapa */}
            <div style={{
              display: 'flex', gap: 3, background: 'rgba(5,15,10,0.92)',
              border: '1px solid rgba(0,255,136,0.2)', borderRadius: 10,
              padding: '5px 8px', backdropFilter: 'blur(8px)', pointerEvents: 'all',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 9, color: 'rgba(0,255,136,0.4)', fontFamily: 'monospace', marginRight: 3 }}>MAPA</span>
              {([
                { id: 'dark',      label: 'Dark'      },
                { id: 'satellite', label: 'Satélite'  },
                { id: 'topo',      label: 'Relieve'   },
              ] as const).map(opt => (
                <button key={opt.id} onClick={() => setMapLayer(opt.id)} style={{
                  padding: '3px 9px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                  fontFamily: 'monospace', fontWeight: mapLayer === opt.id ? 700 : 400, border: 'none',
                  background: mapLayer === opt.id ? '#00ff88' : 'transparent',
                  color: mapLayer === opt.id ? '#001a0d' : 'rgba(0,255,136,0.5)',
                  transition: 'all 0.15s',
                }}>{opt.label}</button>
              ))}
            </div>

            {/* Filtro por vendedor */}
            <div style={{
              display: 'flex', gap: 3, background: 'rgba(5,15,10,0.92)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
              padding: '5px 8px', backdropFilter: 'blur(8px)', pointerEvents: 'all',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginRight: 3 }}>CAPAS</span>
              {(['Ubiquiti','Cambium','Mimosa'] as const).map(v => {
                const count  = hosts.filter(h => h.vendor === v).length;
                const active = vendorFilter.includes(v);
                const vc     = VENDOR_COLORS[v];
                return (
                  <button key={v} onClick={() => toggleVendor(v)} style={{
                    padding: '3px 9px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    fontFamily: 'monospace', fontWeight: 700,
                    border: `1px solid ${active ? vc + '66' : 'rgba(255,255,255,0.1)'}`,
                    background: active ? vc + '22' : 'transparent',
                    color: active ? vc : count ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ fontSize: 10 }}>{VENDOR_ICONS[v]}</span>
                    {v}
                    {count > 0 && <span style={{ fontSize: 9, opacity: 0.7, background: active ? vc + '33' : 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '0 4px' }}>{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
        {activeLayers.has('wireless') && (
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

        {/* Leyenda — servicios Odoo OnNet/OffNet */}
        {showOdoo && (
          <div style={{
            position: 'absolute',
            bottom: activeLayers.has('wireless') ? 200 : 24,
            right: 16, zIndex: 999,
            background: 'rgba(5,8,16,0.92)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '10px 14px', minWidth: 170,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 7 }}>
              Servicios Odoo
            </div>
            {[
              { color: brand.accentColor, label: 'OnNet',          detail: `${odooServicios.filter(s => s.entrega === 'innet').length.toLocaleString()} servicios` },
              { color: '#ff3366', label: 'OffNet',         detail: `${odooServicios.filter(s => s.entrega === 'offnet').length.toLocaleString()} servicios` },
              { color: '#a855f7', label: 'Intercompañía',  detail: `${odooServicios.filter(s => s.entrega === 'inter').length.toLocaleString()} servicios` },
              { color: '#f59e0b', label: 'Sin clasificar', detail: `${odooServicios.filter(s => !s.entrega).length.toLocaleString()} servicios` },
            ].map(({ color, label, detail }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}`, flexShrink: 0 }} />
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 600 }}>{label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, marginLeft: 5 }}>{detail}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leyenda — sitios telecom */}
        {activeLayers.has('sitios') && (
          <div style={{
            position: 'absolute',
            bottom: (() => { let b = 24; if (showOdoo) b += 176; if (activeLayers.has('wireless')) b += 176; return b; })(),
            right: 16, zIndex: 999,
            background: 'rgba(5,8,16,0.92)', border: '1px solid rgba(200,255,0,0.15)',
            borderRadius: 12, padding: '10px 14px', minWidth: 170,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 7 }}>
              Sitios Telecom
            </div>
            {[
              { color: COLOR_SITIO_MTP,   label: 'MTP',  detail: '3,323 sitios' },
              { color: COLOR_SITIO_CAPSA, label: 'CAPSA', detail: '404 sitios' },
            ].map(({ color, label, detail }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}`, flexShrink: 0 }} />
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 600 }}>{label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, marginLeft: 5 }}>{detail}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leyenda — radiobases Odoo */}
        {activeLayers.has('rb-odoo') && rbOdooData.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: (() => { let b = 24; if (activeLayers.has('sitios')) b += 130; if (showOdoo) b += 176; if (activeLayers.has('wireless')) b += 176; return b; })(),
            right: 16, zIndex: 999,
            background: 'rgba(5,8,16,0.92)', border: '1px solid rgba(0,255,204,0.2)',
            borderRadius: 12, padding: '10px 14px', minWidth: 190,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 7 }}>
              Sitios XCIEN (unificado)
            </div>
            {[
              { color: '#00ffcc', label: 'Con datos infra',  detail: `${rbOdooData.filter((r: any) => r.vigencia || r.ip_router_core).length} RBs` },
              { color: '#ffaa00', label: 'Solo operacional',  detail: `${rbOdooData.filter((r: any) => !r.vigencia && !r.ip_router_core).length} RBs` },
            ].map(({ color, label, detail }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <svg width="10" height="16" viewBox="0 0 24 48" fill="none">
                  <line x1="12" y1="0" x2="12" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="5" x2="16" y2="5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="12" y1="8" x2="3" y2="45" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="12" y1="8" x2="21" y2="45" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="9" y1="16" x2="15" y2="16" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="7" y1="26" x2="17" y2="26" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="3" y1="45" x2="21" y2="45" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="12" cy="5" r="2.5" fill={color} opacity="0.9"/>
                </svg>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 600 }}>{label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, marginLeft: 5 }}>{detail}</span>
                </div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 6, paddingTop: 6, fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
              Total: {rbOdooData.length} · Tamaño = # clientes
            </div>
          </div>
        )}

        {/* Leyenda — topología + fibra activas */}
        {(activeLayers.has('core') && topoLinks.length > 0) || kmzGroups.some(g => kmzActive[g.id]) ? (
          <div style={{
            position: 'absolute', bottom: 24, left: 16, zIndex: 999,
            background: 'rgba(5,15,10,0.92)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '10px 14px', minWidth: 160,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>

            {/* Topología */}
            {activeLayers.has('core') && topoLinks.length > 0 && (
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
                {activeLayers.has('core') && topoLinks.length > 0 && (
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
