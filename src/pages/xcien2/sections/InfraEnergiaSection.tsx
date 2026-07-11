import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE } from '../../../config';
import type { ThemeConfig } from '../types';
import 'leaflet/dist/leaflet.css';
import { useVisibleInterval } from '../../../hooks/useVisibleInterval';

interface Props { theme: ThemeConfig }

const GREEN  = '#00C896';
const DIM    = '#6b7280';
const RED    = '#FF4757';
const ORANGE = '#FF6B35';
const YELLOW = '#FFB703';
const BLUE   = '#3B82F6';
const CYAN   = '#00B4D8';
const PURPLE = '#8B5CF6';

interface PowerDevice {
  name: string; ip: string; city: string; site: string; status: string;
  type: string; vendor: string; protocol: string; healthScore: number;
  ping: { reachable: boolean; latency: number; packetLoss: number };
  lastSNMPPoll: string | null; hasMetrics: boolean;
  metrics?: {
    batteryVoltage: number | null; acOutputVoltage: number | null;
    mainsVoltage: number | null; mainsPresent: boolean | null;
    loadPower: number | null; batteryRuntimeMinutes: number | null;
    timestamp: string | null;
  };
}

type ReviewStatus = 'por_revisar' | 'revisada';
const STORAGE_KEY = 'xcien_infra_energia_reviews';
function loadReviews(): Record<string, ReviewStatus> { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } }
function saveReviews(r: Record<string, ReviewStatus>) { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); }

const TYPE_LABELS: Record<string, string> = { rectifier: 'Rectificador', inverter: 'Inversor', siteMonitor: 'Site Monitor' };
const VENDOR_COLORS: Record<string, string> = { eltek: '#4F46E5', samlex: CYAN, mei: ORANGE, victron: '#059669', unknown: '#6B7280' };

function DonutChart({ pct, color, size = 80, stroke = 8 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

function SparkBar({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data, 1);
  const w = 100 / data.length;
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      {data.map((v, i) => {
        const h = (v / max) * (height - 4);
        return <rect key={i} x={i * w + w * 0.15} y={height - h} width={w * 0.7} height={h} rx={1.5} fill={color} opacity={0.7 + (i / data.length) * 0.3} />;
      })}
    </svg>
  );
}

interface Radiobase {
  name: string; estatus: string; vigencia: string; direccion: string;
  city: string; state: string; renta: string; lat: number | null; lng: number | null; source: 'drive';
}

type ListItem = (PowerDevice & { _source: 'nocboard'; _key: string }) | (Radiobase & { _source: 'drive'; _key: string });

const TILE_LAYERS: Record<string, { url: string; label: string }> = {
  dark: { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png', label: 'Oscuro' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', label: 'Satélite' },
  streets: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', label: 'Calles' },
  topo: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', label: 'Topo' },
};

const CITY_COORDS: Record<string, [number, number]> = {
  'Monterrey': [25.6866, -100.3161], 'Guadalajara': [20.6597, -103.3496],
  'Querétaro': [20.5888, -100.3899], 'Saltillo': [25.4232, -100.9924],
  'Guadalupe': [25.6775, -100.2597], 'Pesquería': [25.7758, -100.0461],
  'Apodaca': [25.7819, -100.1884], 'Chihuahua': [28.6353, -106.0889],
  'San Luis Potosí': [22.1565, -100.9855], 'Reynosa': [26.0923, -98.2775],
  'Torreón': [25.5428, -103.4068], 'Piedras Negras': [28.7001, -100.5232],
  'León': [21.1221, -101.6840], 'Zapopan': [20.7217, -103.3893],
  'Ramos Arizpe': [25.5384, -100.9488], 'Santa Catarina': [25.6732, -100.4593],
  'San Pedro': [25.6600, -100.4025], 'Monclova': [26.9069, -101.4214],
  'Coyotepec': [19.7703, -99.2058], 'San Juan del Río': [20.3893, -99.9960],
};

function MapPanel({ devices, radiobases, U }: { devices: PowerDevice[]; radiobases: Radiobase[]; U: any }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const [mapStyle, setMapStyle] = useState<string>(() => localStorage.getItem('xcien_map_style') || 'dark');

  // Init map ONCE
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    import('leaflet').then(L => {
      const map = L.map(mapRef.current!, { zoomControl: true, attributionControl: false }).setView([24.5, -102], 5);
      tileRef.current = L.tileLayer(TILE_LAYERS[mapStyle]?.url || TILE_LAYERS.dark.url, { maxZoom: 18, subdomains: 'abcd' }).addTo(map);
      markersRef.current = L.layerGroup().addTo(map);
      const style = document.createElement('style');
      style.textContent = '.noc-tooltip{background:rgba(10,10,10,0.9)!important;color:#f0f0f0!important;border:1px solid rgba(255,255,255,0.15)!important;border-radius:6px!important;padding:4px 8px!important;font-size:11px!important;font-family:Inter,sans-serif!important;box-shadow:0 2px 8px rgba(0,0,0,0.4)!important}.noc-tooltip::before{border-top-color:rgba(10,10,10,0.9)!important}';
      document.head.appendChild(style);
      map.locate({ setView: false, watch: false });
      map.on('locationfound', (e: any) => {
        const locMarker = L.circleMarker(e.latlng, { radius: 8, color: '#fff', fillColor: '#3B82F6', fillOpacity: 1, weight: 2 });
        locMarker.bindTooltip('Mi ubicación', { permanent: false, direction: 'top', className: 'noc-tooltip' });
        locMarker.addTo(map);
      });
      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    });
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  // Update tile layer when style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileRef.current) return;
    import('leaflet').then(L => {
      tileRef.current.remove();
      tileRef.current = L.tileLayer(TILE_LAYERS[mapStyle]?.url || TILE_LAYERS.dark.url, { maxZoom: 18, subdomains: 'abcd' }).addTo(mapInstanceRef.current);
    });
    localStorage.setItem('xcien_map_style', mapStyle);
  }, [mapStyle]);

  // Update markers when data changes (without recreating map)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersRef.current) return;
    import('leaflet').then(L => {
      markersRef.current.clearLayers();
      const makeIcon = (color: string, size = 10, glow = true) => L.divIcon({ className: '', html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 ${glow?'8':'4'}px ${color}${glow?'':'80'}"></div>`, iconSize: [size+4, size+4], iconAnchor: [(size+4)/2, (size+4)/2] });
      const snmpActiveIcon = makeIcon('#00ff88', 12, true);
      const nocIcon = makeIcon(CYAN, 10, false);
      const driveIcon = makeIcon(PURPLE, 10, false);
      const offlineIcon = makeIcon(RED, 10, false);

      devices.forEach(d => {
        const coords = CITY_COORDS[d.city];
        if (!coords) return;
        const jitter = () => (Math.random() - 0.5) * 0.02;
        const icon = d.status !== 'online' ? offlineIcon : d.hasMetrics ? snmpActiveIcon : nocIcon;
        const marker = L.marker([coords[0] + jitter(), coords[1] + jitter()], { icon });
        const label = d.name.replace(/_/g, ' ').replace(/MONTERREY /g,'').replace(/QUERÉTARO /g,'QRO ');
        marker.bindTooltip(label, { permanent: false, direction: 'top', className: 'noc-tooltip', offset: [0, -8] });
        marker.bindPopup(`<div style="font-family:Inter,sans-serif;font-size:12px;min-width:180px"><b>${d.name.replace(/_/g, ' ')}</b><br><span style="color:#888">${d.ip}</span><br>${d.city} · <b style="color:${d.status==='online'?'#00C896':'#FF4757'}">${d.status}</b>${d.hasMetrics && d.metrics ? `<br>Bat: <b>${d.metrics.batteryVoltage??'—'}V</b>` : ''}</div>`);
        markersRef.current.addLayer(marker);
      });

      radiobases.forEach(rb => {
        const coords = rb.lat && rb.lng ? [rb.lat, rb.lng] as [number, number] : CITY_COORDS[rb.city];
        if (!coords) return;
        const jitter = () => (Math.random() - 0.5) * 0.015;
        const marker = L.marker([coords[0] + jitter(), coords[1] + jitter()], { icon: driveIcon });
        marker.bindTooltip(rb.name, { permanent: false, direction: 'top', className: 'noc-tooltip', offset: [0, -8] });
        marker.bindPopup(`<div style="font-family:Inter,sans-serif;font-size:12px;min-width:180px"><b>${rb.name}</b><br><span style="color:#888">${rb.city}, ${rb.state}</span><br>${rb.estatus}</div>`);
        markersRef.current.addLayer(marker);
      });
    });
  }, [devices, radiobases]);

  return (
    <div style={{ background: U.card, border: `1px solid ${U.border}`, borderRadius: 14, overflow: 'hidden', marginTop: 16 }}>
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: U.text }}>MAPA DE INFRAESTRUCTURA</div>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 2, gap: 2 }}>
            {Object.entries(TILE_LAYERS).map(([key, { label }]) => (
              <button key={key} onClick={() => setMapStyle(key)} style={{
                padding: '3px 8px', fontSize: 9, fontWeight: 600, borderRadius: 4, border: 'none', cursor: 'pointer',
                background: mapStyle === key ? GREEN : 'transparent',
                color: mapStyle === key ? '#000' : U.dim,
                transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: U.dim }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} /> SNMP Activo</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: CYAN }} /> NOCBoard</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: PURPLE }} /> Radiobase</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: RED }} /> Offline</span>
          <button onClick={() => { if (mapInstanceRef.current) mapInstanceRef.current.locate({ setView: true, maxZoom: 13 }); }} style={{
            padding: '3px 8px', fontSize: 9, fontWeight: 600, borderRadius: 4, border: `1px solid ${BLUE}40`,
            background: `${BLUE}15`, color: BLUE, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          }}>📍 Mi ubicación</button>
        </div>
      </div>
      <div ref={mapRef} style={{ height: 400, width: '100%' }} />
    </div>
  );
}

export default function InfraEnergiaSection({ theme }: Props) {
  const [devices, setDevices] = useState<PowerDevice[]>([]);
  const [radiobases, setRadiobases] = useState<Radiobase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<Record<string, ReviewStatus>>(loadReviews);
  const [filter, setFilter] = useState<'all' | 'revisada' | 'por_revisar' | 'online' | 'offline' | 'nocboard' | 'drive'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'city' | 'status' | 'type'>('city');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>(() => { try { return JSON.parse(localStorage.getItem('xcien_infra_notes') || '{}'); } catch { return {}; } });

  const saveNote = (key: string, note: string) => {
    const next = { ...notes, [key]: note };
    setNotes(next);
    localStorage.setItem('xcien_infra_notes', JSON.stringify(next));
  };

  const U = { bg: theme.bg, card: theme.card, text: theme.text, dim: theme.dim || '#8090a8', accent: theme.accent, border: theme.border || 'rgba(255,255,255,0.06)' };

  const fetchData = useCallback(async () => {
    try {
      const [rPower, rBases] = await Promise.all([
        fetch(`${API_BASE}/api/noc/energia/power`),
        fetch(`${API_BASE}/api/noc/energia/radiobases`),
      ]);
      if (rPower.ok) { const d = await rPower.json(); setDevices(d.devices || []); }
      if (rBases.ok) { const d = await rBases.json(); setRadiobases(d.sites || []); }
      setError('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useVisibleInterval(fetchData, 60_000);

  const toggleReview = (ip: string) => {
    const next = { ...reviews };
    next[ip] = next[ip] === 'revisada' ? 'por_revisar' : 'revisada';
    setReviews(next); saveReviews(next);
  };

  const nocNames = new Set(devices.map(d => d.name.replace(/_/g, ' ').toUpperCase().trim()));
  const dedupedBases = radiobases.filter(r => {
    const rName = r.name.toUpperCase().trim();
    return !nocNames.has(rName) && ![...nocNames].some(n => n.includes(rName) || rName.includes(n.split(' ')[0]));
  });

  const allItems: ListItem[] = [
    ...devices.map(d => ({ ...d, _source: 'nocboard' as const, _key: `noc-${d.ip}` })),
    ...dedupedBases.map((r, i) => ({ ...r, _source: 'drive' as const, _key: `drive-${i}-${r.name}` })),
  ];

  const totalAll = allItems.length;
  const totalNoc = devices.length;
  const totalDrive = radiobases.length;
  const online = devices.filter(d => d.status === 'online').length;
  const offline = totalNoc - online;
  const withMetrics = devices.filter(d => d.hasMetrics).length;
  const reviewed = allItems.filter(item => reviews[item._key] === 'revisada').length;
  const reviewPct = totalAll > 0 ? Math.round((reviewed / totalAll) * 100) : 0;
  const availPct = totalNoc > 0 ? +((online / totalNoc) * 100).toFixed(1) : 0;
  const vigentes = radiobases.filter(r => r.estatus.toUpperCase().includes('VIGENTE')).length;
  const snmpOk = devices.filter(d => d.hasMetrics).length;
  const snmpPending = devices.filter(d => !d.hasMetrics && d.protocol === 'snmpV2c').length;
  const snmpNone = devices.filter(d => d.protocol === 'icmp' || d.protocol === 'modbusTCP' || !d.protocol).length;
  const snmpPct = totalNoc > 0 ? Math.round((snmpOk / totalNoc) * 100) : 0;

  const allCities = [...new Set(allItems.map(item => item.city).filter(Boolean))].sort();
  const byCity = allCities.map(c => ({
    city: c,
    total: allItems.filter(item => item.city === c).length,
    online: devices.filter(d => d.city === c && d.status === 'online').length,
    reviewed: allItems.filter(item => item.city === c && reviews[item._key] === 'revisada').length,
  })).sort((a, b) => b.total - a.total);

  const vendors = [...new Set(devices.map(d => d.vendor))];
  const byVendor = vendors.map(v => ({ vendor: v, count: devices.filter(d => d.vendor === v).length })).sort((a, b) => b.count - a.count);
  const maxVendor = Math.max(...byVendor.map(v => v.count), 1);

  const types = [...new Set(devices.map(d => d.type))];
  const byType = types.map(t => ({ type: t, count: devices.filter(d => d.type === t).length })).sort((a, b) => b.count - a.count);
  const maxType = Math.max(...byType.map(t => t.count), 1);

  const filtered = allItems
    .filter(item => {
      if (filter === 'nocboard') return item._source === 'nocboard';
      if (filter === 'drive') return item._source === 'drive';
      if (filter === 'online') return item._source === 'nocboard' && (item as PowerDevice).status === 'online';
      if (filter === 'offline') return item._source === 'nocboard' && (item as PowerDevice).status !== 'online';
      if (filter === 'revisada') return reviews[item._key] === 'revisada';
      if (filter === 'por_revisar') return reviews[item._key] !== 'revisada';
      return true;
    })
    .filter(item => {
      if (!search) return true;
      const s = search.toLowerCase();
      const n = item.name.toLowerCase();
      const c = item.city.toLowerCase();
      if (item._source === 'nocboard') {
        const d = item as PowerDevice & { _source: 'nocboard' };
        return n.includes(s) || c.includes(s) || d.ip.includes(s) || d.site.toLowerCase().includes(s);
      }
      const r = item as Radiobase & { _source: 'drive' };
      return n.includes(s) || c.includes(s) || r.state.toLowerCase().includes(s) || r.direccion.toLowerCase().includes(s);
    })
    .sort((a, b) => {
      if (sortBy === 'city') return (a.city || '').localeCompare(b.city || '');
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'type') return a._source.localeCompare(b._source);
      if (sortBy === 'status') {
        const sa = a._source === 'nocboard' ? (a as any).status || '' : (a as any).estatus || '';
        const sb = b._source === 'nocboard' ? (b as any).status || '' : (b as any).estatus || '';
        return sa.localeCompare(sb);
      }
      return (a.name || '').localeCompare(b.name || '');
    });

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: U.dim }}>Cargando infraestructura...</div>;
  if (error) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: RED }}>Error: {error}</div>;

  const cardStyle = (extra?: React.CSSProperties): React.CSSProperties => ({ background: U.card, border: `1px solid ${U.border}`, borderRadius: 14, padding: 24, ...extra });

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1440, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Title */}
      <div style={{ marginBottom: 6 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          <span style={{ color: U.text }}>INFRAESTRUCTURA </span>
          <span style={{ color: GREEN }}>ENERGÍA</span>
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: U.dim }}>
          {totalNoc} dispositivos NOCBoard + {totalDrive} radiobases Drive · {allCities.length} ciudades
        </p>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 20 }}>
        {[
          { label: 'DISPOSITIVOS', value: totalNoc, sub: `${online} online · ${offline} offline`, color: CYAN, icon: '⚡' },
          { label: 'SNMP ACTIVO', value: snmpOk, sub: `${snmpPct}% del total`, color: GREEN, icon: '📡' },
          { label: 'DISPONIBILIDAD', value: `${availPct}%`, sub: `${online} de ${totalNoc}`, color: availPct >= 90 ? GREEN : availPct >= 70 ? YELLOW : RED, icon: '✓' },
          { label: 'RADIOBASES', value: totalDrive, sub: `${vigentes} vigentes`, color: PURPLE, icon: '📋' },
        ].map((kpi, i) => (
          <div key={i} style={cardStyle({ position: 'relative', overflow: 'hidden' })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: U.dim, letterSpacing: '0.1em', marginBottom: 8 }}>{kpi.label}</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: kpi.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{kpi.value}</div>
                <div style={{ fontSize: 11, color: U.dim, marginTop: 6 }}>{kpi.sub}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {kpi.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mapa — primero lo visual */}
      <MapPanel devices={devices} radiobases={dedupedBases} U={U} />

      {/* SNMP Status + Disponibilidad — lado a lado */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 16 }}>
        {/* SNMP Status */}
        <div style={cardStyle()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: U.text }}>ESTADO SNMP</div>
              <div style={{ fontSize: 11, color: U.dim, marginTop: 2 }}>{totalNoc} dispositivos NOCBoard</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: snmpPct >= 50 ? GREEN : snmpPct >= 25 ? YELLOW : RED, fontFamily: 'JetBrains Mono' }}>{snmpPct}%</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={{ background: `${GREEN}10`, border: `1px solid ${GREEN}30`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: GREEN, fontFamily: 'JetBrains Mono' }}>{snmpOk}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: GREEN, marginTop: 4 }}>ACTIVO</div>
            </div>
            <div style={{ background: `${YELLOW}10`, border: `1px solid ${YELLOW}30`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: YELLOW, fontFamily: 'JetBrains Mono' }}>{snmpPending}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: YELLOW, marginTop: 4 }}>PENDIENTE</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${U.border}`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: U.dim, fontFamily: 'JetBrains Mono' }}>{snmpNone}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: U.dim, marginTop: 4 }}>SIN SNMP</div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 10, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${totalNoc > 0 ? (snmpOk / totalNoc) * 100 : 0}%`, height: '100%', background: GREEN }} />
            <div style={{ width: `${totalNoc > 0 ? (snmpPending / totalNoc) * 100 : 0}%`, height: '100%', background: YELLOW }} />
          </div>
        </div>

        {/* Disponibilidad + Fabricantes compacto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={cardStyle({ display: 'flex', alignItems: 'center', gap: 16, flex: 1 })}>
            <div style={{ position: 'relative' }}>
              <DonutChart pct={availPct} color={GREEN} size={70} stroke={8} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: GREEN, fontFamily: 'JetBrains Mono' }}>{availPct}%</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: U.text }}>DISPONIBILIDAD</div>
              <div style={{ fontSize: 10, color: U.dim, marginTop: 4 }}>
                <span style={{ color: GREEN }}>▲ {online}</span> · <span style={{ color: RED }}>▼ {offline}</span>
              </div>
            </div>
          </div>
          <div style={cardStyle({ flex: 1 })}>
            <div style={{ fontSize: 11, fontWeight: 700, color: U.dim, marginBottom: 8, letterSpacing: '0.05em' }}>FABRICANTES</div>
            {byVendor.slice(0, 5).map(v => (
              <div key={v.vendor} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: U.dim, width: 55, fontWeight: 600, textTransform: 'uppercase' }}>{v.vendor}</span>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(v.count / maxVendor) * 100}%`, height: '100%', background: VENDOR_COLORS[v.vendor] || CYAN, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: VENDOR_COLORS[v.vendor] || CYAN, fontFamily: 'JetBrains Mono', width: 20, textAlign: 'right' }}>{v.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Avance de revisión — compacto */}
      <div style={cardStyle({ marginTop: 16 })}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: U.text }}>AVANCE DE REVISIÓN FÍSICA</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: GREEN, fontFamily: 'JetBrains Mono' }}>{reviewPct}%</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 10, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${reviewPct}%`, height: '100%', background: `linear-gradient(90deg, ${GREEN}, #00E5A0)`, borderRadius: 6, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 }}>
          {byCity.slice(0, 10).map(c => (
            <div key={c.city} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: U.dim, flex: 1 }}>{c.city}</span>
              <span style={{ fontSize: 10, color: c.reviewed === c.total && c.total > 0 ? GREEN : YELLOW, fontWeight: 600, fontFamily: 'JetBrains Mono' }}>{c.reviewed}/{c.total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginTop: 24, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar torre, ciudad, IP..."
          style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${U.border}`, borderRadius: 8, padding: '8px 14px', color: U.text, fontSize: 12, minWidth: 220, outline: 'none' }} />
        {(['all', 'nocboard', 'drive', 'por_revisar', 'revisada', 'online', 'offline'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? 'rgba(0,200,150,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${filter === f ? GREEN : U.border}`,
            borderRadius: 20, padding: '5px 14px', color: filter === f ? GREEN : U.dim,
            fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {{ all: 'Todos', nocboard: 'NOCBoard', drive: 'Radiobases', por_revisar: 'Por revisar', revisada: 'Revisadas', online: 'En línea', offline: 'Offline' }[f]}
          </button>
        ))}
        <span style={{ fontSize: 11, color: U.dim, marginLeft: 'auto' }}>{filtered.length} resultados</span>
      </div>

      {/* Table */}
      <div style={cardStyle({ padding: 0, overflow: 'hidden' })}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${U.border}` }}>
              {[{ key: 'name', label: 'TORRE / DISPOSITIVO' }, { key: 'city', label: 'CIUDAD' }, { key: 'type', label: 'TIPO' }, { key: 'status', label: 'ESTADO' }].map(col => (
                <th key={col.key} onClick={() => setSortBy(col.key as any)} style={{
                  padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: U.dim,
                  cursor: 'pointer', fontSize: 10, letterSpacing: '0.08em',
                  background: sortBy === col.key ? 'rgba(0,200,150,0.04)' : 'transparent',
                }}>
                  {col.label} {sortBy === col.key ? '▾' : ''}
                </th>
              ))}
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: U.dim, fontSize: 10, letterSpacing: '0.08em' }}>MÉTRICAS</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: U.dim, fontSize: 10, letterSpacing: '0.08em' }}>REVISIÓN</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const rev = reviews[item._key] === 'revisada';
              const isNoc = item._source === 'nocboard';
              const srcColor = isNoc ? CYAN : PURPLE;
              const srcLabel = isNoc ? 'NOCBoard' : 'Radiobase';

              const isEditing = editingKey === item._key;
              const noteVal = notes[item._key] || '';

              const editPanel = isEditing ? (
                <tr key={item._key + '-edit'} style={{ borderBottom: `1px solid ${U.border}`, borderLeft: `3px solid ${srcColor}` }}>
                  <td colSpan={6} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: U.dim, marginBottom: 4, fontWeight: 600 }}>NOTAS / OBSERVACIONES</div>
                        <textarea
                          defaultValue={noteVal}
                          onBlur={e => saveNote(item._key, e.target.value)}
                          placeholder="Escribe notas sobre este dispositivo..."
                          style={{ width: '100%', minHeight: 60, background: 'rgba(255,255,255,0.04)', border: `1px solid ${U.border}`, borderRadius: 8, padding: 8, color: U.text, fontSize: 11, resize: 'vertical', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                        />
                      </div>
                      <button onClick={() => setEditingKey(null)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, background: 'rgba(255,255,255,0.06)', border: `1px solid ${U.border}`, color: U.dim, cursor: 'pointer' }}>Cerrar</button>
                    </div>
                  </td>
                </tr>
              ) : null;

              if (isNoc) {
                const d = item as PowerDevice & { _source: 'nocboard'; _key: string };
                const vc = VENDOR_COLORS[d.vendor] || VENDOR_COLORS.unknown;
                return (<>
                  <tr key={item._key} onClick={() => setEditingKey(isEditing ? null : item._key)} style={{ borderBottom: isEditing ? 'none' : `1px solid ${U.border}`, transition: 'background 0.15s', borderLeft: `3px solid ${srcColor}`, cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, background: `${srcColor}20`, color: srcColor, fontWeight: 700 }}>{srcLabel}</span>
                        <span style={{ fontWeight: 600, color: U.text }}>{d.name.replace(/_/g, ' ')}</span>
                        {noteVal && <span style={{ fontSize: 8, color: YELLOW }}>●</span>}
                      </div>
                      <div style={{ fontSize: 10, color: U.dim, marginTop: 2 }}>{d.ip} · {d.site}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: U.text, fontSize: 12 }}>{d.city}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, color: vc, background: `${vc}15`, border: `1px solid ${vc}30` }}>
                        {d.vendor.toUpperCase()} · {TYPE_LABELS[d.type] || d.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                        color: d.status === 'online' ? GREEN : RED,
                        background: d.status === 'online' ? 'rgba(0,200,150,0.1)' : 'rgba(255,71,87,0.1)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.status === 'online' ? GREEN : RED }} />
                        {d.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {d.hasMetrics && d.metrics ? (
                        <div style={{ fontSize: 10, lineHeight: 1.7 }}>
                          <div><span style={{ color: U.dim }}>Bat:</span> <span style={{ color: BLUE, fontWeight: 600 }}>{d.metrics.batteryVoltage ?? '—'}V</span></div>
                          <div><span style={{ color: U.dim }}>AC:</span> <span style={{ color: GREEN, fontWeight: 600 }}>{d.metrics.acOutputVoltage ?? '—'}V</span></div>
                          <div><span style={{ color: U.dim }}>CFE:</span> <span style={{ color: d.metrics.mainsPresent ? GREEN : RED, fontWeight: 600 }}>{d.metrics.mainsPresent ? 'SÍ' : 'NO'}</span></div>
                        </div>
                      ) : <span style={{ fontSize: 10, color: U.dim }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleReview(item._key)} style={{
                        padding: '5px 14px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                        background: rev ? 'rgba(0,200,150,0.15)' : 'rgba(255,183,3,0.12)',
                        color: rev ? GREEN : YELLOW,
                      }}>
                        {rev ? '✓ Revisada' : 'Por revisar'}
                      </button>
                    </td>
                  </tr>
                  {editPanel}
                </>);
              }

              const rb = item as Radiobase & { _source: 'drive'; _key: string };
              const esVigente = rb.estatus.toUpperCase().includes('VIGENTE');
              return (<>
                <tr key={item._key} onClick={() => setEditingKey(isEditing ? null : item._key)} style={{ borderBottom: isEditing ? 'none' : `1px solid ${U.border}`, transition: 'background 0.15s', borderLeft: `3px solid ${srcColor}`, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, background: `${srcColor}20`, color: srcColor, fontWeight: 700 }}>{srcLabel}</span>
                      <span style={{ fontWeight: 600, color: U.text }}>{rb.name}</span>
                      {noteVal && <span style={{ fontSize: 8, color: YELLOW }}>●</span>}
                    </div>
                    <div style={{ fontSize: 10, color: U.dim, marginTop: 2 }}>{rb.direccion || '—'}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: U.text, fontSize: 12 }}>
                    <div>{rb.city || '—'}</div>
                    <div style={{ fontSize: 10, color: U.dim }}>{rb.state}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                      color: PURPLE, background: `${PURPLE}15`, border: `1px solid ${PURPLE}30` }}>
                      RADIOBASE
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                      color: esVigente ? GREEN : RED,
                      background: esVigente ? 'rgba(0,200,150,0.1)' : 'rgba(255,71,87,0.1)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: esVigente ? GREEN : RED }} />
                      {rb.estatus || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 10, color: U.dim }}>Sin SNMP</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleReview(item._key)} style={{
                      padding: '5px 14px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                      cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                      background: rev ? 'rgba(0,200,150,0.15)' : 'rgba(255,183,3,0.12)',
                      color: rev ? GREEN : YELLOW,
                    }}>
                      {rev ? '✓ Revisada' : 'Por revisar'}
                    </button>
                  </td>
                </tr>
                {editPanel}
              </>);
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 14, fontSize: 10, color: U.dim, textAlign: 'right' }}>
        NOCBoard Energía v3.7.0 · Polling 60s · {new Date().toLocaleString('es-MX')}
      </div>
    </div>
  );
}
