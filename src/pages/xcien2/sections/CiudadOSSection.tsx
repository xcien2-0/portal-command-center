import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeConfig } from '../types';
import { API_BASE } from '../../../config';
import FibraSection from './FibraSection';
import 'leaflet/dist/leaflet.css';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface PersonaConfig {
  nombre: string;
  rol: string;
  emoji: string;
  activo?: boolean;
}

export interface PlazaConfig {
  id: string;
  nombre: string;
  estado_mx: string;
  emoji: string;
  fibra_plaza_id: string;
  tecnico_filter: string;
  ticket_terms?: string[];
  noc_terms: string[];
  equipo: PersonaConfig[];
  blocker?: string;
}

interface Ticket {
  id: string; odoo_id: number; nombre: string; cliente: string;
  tecnico: string | null; tipo: 'falla' | 'habilitacion';
  prioridad: string; etapa_op: string; etapa_op_idx: number;
  etapa_color: string; fecha_creacion: string;
  cerrado: boolean; kanban_state: string;
}

interface Alerta {
  id: string; cityName: string; siteName: string;
  hostName: string; hostIp: string; type: string;
  message: string; severity: string; timestamp: string;
  ticketCreated: boolean;
}

interface MeetingNote {
  id: string;
  fecha: string;
  fuente: 'read' | 'gemini' | 'manual';
  texto: string;
}

// ── Colores semánticos fijos ───────────────────────────────────────────────────
const BLUE = '#3B82F6';
const RED   = '#EF4444';
const AMB   = '#F59E0B';

// Dims oscuros (dark theme)
const BLUE_DIM_D = '#1E3A5F', RED_DIM_D = '#3F1515', AMB_DIM_D = '#3D2800';
// Dims claros (light/corporate theme)
const BLUE_DIM_L = '#e8f4ff', RED_DIM_L = '#fef0f0', AMB_DIM_L = '#fef9e7';

interface C {
  bg: string; surface: string; surface2: string; border: string;
  text: string; muted: string; dim: string; light: boolean;
  green: string; greenDim: string; white: string;
  blue: string; blueDim: string; red: string; redDim: string;
  amber: string; amberDim: string;
  shadow: string; shadowMd: string;
}

function isLightBg(hex: string): boolean {
  const h = hex.replace('#', '');
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

function mkC(t: ThemeConfig): C {
  const light = isLightBg(t.bg);
  return {
    bg: t.bg, surface: t.card, surface2: t.sidebar,
    border: t.border, text: t.text, muted: t.dim, dim: t.dim,
    light,
    green: t.accent,
    greenDim: light ? '#e8f5eb' : t.accent + '22',
    white: t.text,
    blue: BLUE,
    blueDim:  light ? BLUE_DIM_L : BLUE_DIM_D,
    red: RED,
    redDim:   light ? RED_DIM_L  : RED_DIM_D,
    amber: AMB,
    amberDim: light ? AMB_DIM_L  : AMB_DIM_D,
    shadow:   light ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
    shadowMd: light ? '0 4px 16px rgba(0,0,0,0.10)' : '0 -8px 32px rgba(0,0,0,0.4)',
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function tiempoTranscurrido(fecha: string): string {
  if (!fecha) return '—';
  const diff = Date.now() - new Date(fecha.replace(' ', 'T') + 'Z').getTime();
  const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
  if (h > 48) return `${Math.floor(h / 24)}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const horaLocal = () =>
  new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const fechaCorta = () =>
  new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });

const fechaCompleta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const sevColor = (s: string, c: C) =>
  s === 'critical' ? c.red : s === 'warning' ? c.amber : c.blue;

const etapaColor = (idx: number, c: C) =>
  ({ 0: c.muted, 1: c.blue, 2: c.amber, 3: c.green, 4: c.dim } as Record<number, string>)[idx] ?? c.muted;

const initials = (nombre: string) =>
  nombre.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();

// ── Minutas — localStorage ────────────────────────────────────────────────────

function loadNotes(plazaId: string): MeetingNote[] {
  try {
    return JSON.parse(localStorage.getItem(`xcien-city-notes-${plazaId}`) ?? '[]');
  } catch { return []; }
}

function saveNote(plazaId: string, note: MeetingNote): void {
  const existing = loadNotes(plazaId);
  localStorage.setItem(`xcien-city-notes-${plazaId}`, JSON.stringify([note, ...existing].slice(0, 20)));
}

type OSTab = string;

export interface ExtraTab {
  id: string;
  icon: string;
  label: string;
  content: React.ReactNode;
}

// ── Mapa PDN — constantes ─────────────────────────────────────────────────────
const PDN_CENTER: [number, number] = [28.703, -100.535];
const PDN_BOUNDS = { latMin: 28.3, latMax: 29.2, lngMin: -101.5, lngMax: -100.0 };

export const PROSPECTOS_PDN = [
  { name: 'Asfaltos y Pegamentos',  lat: 28.67908, lng: -100.56878 },
  { name: 'Day Star Trim',          lat: 28.67957, lng: -100.57053 },
  { name: 'Elastomeros',            lat: 28.68705, lng: -100.55532 },
  { name: 'Elektrocontact',         lat: 28.64845, lng: -100.56018 },
  { name: 'Elektrokontakt PDS',     lat: 28.64548, lng: -100.52983 },
  { name: 'ERICH JAEGER',           lat: 28.69730, lng: -100.55566 },
  { name: 'Fujikura',               lat: 28.69811, lng: -100.55676 },
  { name: 'Fujikura 2',             lat: 28.67908, lng: -100.55090 },
  { name: 'Fujikura 3',             lat: 28.67910, lng: -100.55293 },
  { name: 'General Aluminium',      lat: 28.68696, lng: -100.55516 },
  { name: 'GI Grupo',               lat: 28.72919, lng: -100.51991 },
  { name: 'Gondi',                  lat: 28.68707, lng: -100.55741 },
  { name: 'Lear 1',                 lat: 28.68134, lng: -100.55218 },
  { name: 'Lear 2',                 lat: 28.68123, lng: -100.57019 },
  { name: 'Lear 3',                 lat: 28.68129, lng: -100.57142 },
  { name: 'Lear 4',                 lat: 28.67740, lng: -100.56987 },
  { name: 'Lear 5',                 lat: 28.64570, lng: -100.55948 },
  { name: 'Littelfuse',             lat: 28.64529, lng: -100.53565 },
  { name: 'M&B Hangers',            lat: 28.64698, lng: -100.55784 },
  { name: 'Mex Star',               lat: 28.64604, lng: -100.55910 },
  { name: 'Nesse',                  lat: 28.72533, lng: -100.52280 },
  { name: 'Path Logistics',         lat: 28.64938, lng: -100.55907 },
  { name: 'PKC Group',              lat: 28.68129, lng: -100.55394 },
  { name: 'Prossesa',               lat: 28.59685, lng: -100.58513 },
  { name: 'Prysmian WH',            lat: 28.72056, lng: -100.52100 },
  { name: 'Prysmian',               lat: 28.68764, lng: -100.55569 },
  { name: 'Rassini',                lat: 28.68875, lng: -100.52095 },
  { name: 'Regal 2',                lat: 28.68195, lng: -100.55248 },
  { name: 'Regal 3',                lat: 28.67693, lng: -100.55125 },
  { name: 'Regal Amistad Sur',      lat: 28.64604, lng: -100.52117 },
  { name: 'Remy Borg Warner',       lat: 28.72833, lng: -100.52451 },
  { name: 'Structural Graphics',    lat: 28.68386, lng: -100.55627 },
  { name: 'Transformadores PN',     lat: 28.68758, lng: -100.55705 },
  { name: 'Us Liner',               lat: 28.64222, lng: -100.52995 },
] as const;

// ── MapaPDN ───────────────────────────────────────────────────────────────────
type MapTile = 'dark' | 'satellite' | 'hybrid';

const TILE_URLS: Record<MapTile, { base: string; labels?: string; opts: object }> = {
  dark: {
    base: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png',
    opts: { subdomains: 'abcd', maxZoom: 19 },
  },
  satellite: {
    base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    opts: { maxZoom: 19 },
  },
  hybrid: {
    base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    opts: { maxZoom: 19 },
  },
};

function MapaPDN({ C }: { C: C }) {
  const mapRef    = useRef<any>(null);
  const leafRef   = useRef<any>(null);
  const layerRef  = useRef<Record<string, any>>({});
  const kmzRef    = useRef<any[]>([]);
  const tileRef   = useRef<any>(null);
  const labelsRef = useRef<any>(null);

  const [rbData,   setRbData]   = useState<any[]>([]);
  const [sidfData, setSidfData] = useState<any[]>([]);
  const [gpsData,  setGpsData]  = useState<any[]>([]);
  const [mapTile,  setMapTile]  = useState<MapTile>('dark');

  const [active, setActive] = useState(() => new Set<string>(['rb', 'sidf', 'prospectos']));
  const toggle = (id: string) => setActive(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  // Inicializar Leaflet cuando el div ya está en el DOM
  useEffect(() => {
    if (mapRef.current) return;
    const el = document.getElementById('pdn-os-map');
    if (!el) return;
    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      const map = L.map('pdn-os-map', {
        center: PDN_CENTER, zoom: 12,
        zoomControl: true, attributionControl: false, minZoom: 10,
      });
      const cfg = TILE_URLS.dark;
      tileRef.current = L.tileLayer(cfg.base, cfg.opts).addTo(map);
      leafRef.current = L;
      mapRef.current  = map;
    });
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; leafRef.current = null; layerRef.current = {}; kmzRef.current = []; tileRef.current = null; labelsRef.current = null; }
    };
  }, []);

  // Cambiar capa base
  useEffect(() => {
    const L = leafRef.current; const map = mapRef.current;
    if (!L || !map || !tileRef.current) return;
    map.removeLayer(tileRef.current);
    if (labelsRef.current) { map.removeLayer(labelsRef.current); labelsRef.current = null; }
    const cfg = TILE_URLS[mapTile];
    tileRef.current = L.tileLayer(cfg.base, cfg.opts).addTo(map);
    if (cfg.labels) {
      labelsRef.current = L.tileLayer(cfg.labels, { maxZoom: 19, opacity: 0.9 }).addTo(map);
    }
    // Re-subir overlays encima del tile nuevo
    Object.values(layerRef.current).forEach((lyr: any) => {
      if (lyr && map.hasLayer(lyr)) { map.removeLayer(lyr); lyr.addTo(map); }
    });
    kmzRef.current.forEach((lyr: any) => {
      if (lyr && map.hasLayer(lyr)) { map.removeLayer(lyr); lyr.addTo(map); }
    });
  }, [mapTile]);

  // Fetch data
  useEffect(() => {
    fetch(`${API_BASE}/api/red/radiobases-odoo`)
      .then(r => r.ok ? r.json() : [])
      .then((d: any) => {
        const all: any[] = Array.isArray(d) ? d : [];
        setRbData(all.filter(rb => rb.lat && rb.lng &&
          rb.lat > PDN_BOUNDS.latMin && rb.lat < PDN_BOUNDS.latMax &&
          rb.lng > PDN_BOUNDS.lngMin && rb.lng < PDN_BOUNDS.lngMax));
      }).catch(() => {});

    fetch(`${API_BASE}/api/red/clientes-sidf`)
      .then(r => r.ok ? r.json() : { clientes: [] })
      .then((d: any) => setSidfData((d.clientes || []).filter((c: any) => c.plaza === 'pn')))
      .catch(() => {});

    fetch(`${API_BASE}/api/gps/vehiculos`)
      .then(r => r.ok ? r.json() : { vehiculos: [] })
      .then((d: any) => setGpsData((d.vehiculos || []).filter((v: any) => v.lat && v.lng)))
      .catch(() => {});
  }, []);

  const getLayer = (id: string) => {
    const L = leafRef.current; const map = mapRef.current;
    if (!L || !map) return null;
    if (!layerRef.current[id]) layerRef.current[id] = L.layerGroup().addTo(map);
    return layerRef.current[id];
  };

  // ── Radiobases ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const L = leafRef.current; const lyr = getLayer('rb');
    if (!lyr) return;
    lyr.clearLayers();
    if (!active.has('rb') || !L) return;
    rbData.forEach(rb => {
      const color = rb.en_infra ? '#00ffcc' : '#ffaa00';
      const tw = 11, th = 20, W = tw + 4, H = th + 2;
      const icon = L.divIcon({
        className: '', iconSize: [W, H], iconAnchor: [W / 2, H],
        html: `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
          <line x1="${W/2}" y1="0" x2="${W/2}" y2="6" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="${W/2-5}" y1="4" x2="${W/2+5}" y2="4" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/>
          <line x1="${W/2-5}" y1="4" x2="${W/2-5}" y2="7" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="${W/2+5}" y1="4" x2="${W/2+5}" y2="7" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="${W/2}" y1="7" x2="${W/2 - tw*0.42}" y2="${th-2}" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
          <line x1="${W/2}" y1="7" x2="${W/2 + tw*0.42}" y2="${th-2}" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
          <line x1="${W/2 - tw*0.11}" y1="${7 + (th-9)*0.25}" x2="${W/2 + tw*0.11}" y2="${7 + (th-9)*0.25}" stroke="${color}" stroke-width="1"/>
          <line x1="${W/2 - tw*0.23}" y1="${7 + (th-9)*0.55}" x2="${W/2 + tw*0.23}" y2="${7 + (th-9)*0.55}" stroke="${color}" stroke-width="1"/>
          <line x1="${W/2 - tw*0.35}" y1="${7 + (th-9)*0.85}" x2="${W/2 + tw*0.35}" y2="${7 + (th-9)*0.85}" stroke="${color}" stroke-width="1.1"/>
          <line x1="${W/2 - tw*0.42}" y1="${th-2}" x2="${W/2 + tw*0.42}" y2="${th-2}" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="${W/2}" cy="3" r="2" fill="${color}" opacity="0.95"/>
        </svg>`,
      });
      L.marker([rb.lat, rb.lng], { icon })
        .bindTooltip(
          `<div style="font-weight:700;color:${color};margin-bottom:3px">📡 ${rb.nombre}</div>
           <div style="color:rgba(255,255,255,0.6);font-size:10px">${rb.sop || ''}</div>
           <div style="margin-top:5px;font-size:10px">
             <span style="color:${color};font-weight:700">${rb.clientes || 0} clientes</span>
             <span style="background:${color}22;color:${color};padding:1px 6px;border-radius:8px;margin-left:6px;font-size:9px">
               ${rb.en_infra ? '✓ En Infra' : 'Solo Odoo'}
             </span>
           </div>`,
          { className: 'pdn-tooltip', sticky: true }
        )
        .bindPopup(
          `<div style="min-width:200px">
             <div style="font-weight:700;color:${color};font-size:13px;margin-bottom:4px">📡 ${rb.nombre}</div>
             <div style="color:#64748b;font-size:11px;margin-bottom:8px">${rb.partner || rb.sop || ''}</div>
             <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:10px;margin-bottom:6px">
               <span style="background:${color}22;color:${color};padding:2px 8px;border-radius:8px;font-weight:700">${rb.clientes || 0} clientes</span>
             </div>
             <a href="https://odoo.wispi.mx/web#id=${rb.id}&model=running.services&view_type=form&cids=25" target="_blank" rel="noopener noreferrer"
                style="display:block;text-align:center;padding:6px 12px;background:${color};color:#000;border-radius:6px;font-size:11px;font-weight:700;text-decoration:none;margin-top:8px">
               Ver en Odoo →
             </a>
           </div>`,
          { maxWidth: 240 }
        )
        .addTo(lyr);
    });
  }, [active, rbData]);

  // ── SIDF ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const L = leafRef.current; const lyr = getLayer('sidf');
    if (!lyr) return;
    lyr.clearLayers();
    if (!active.has('sidf') || !L) return;
    sidfData.forEach(c => {
      const color = c.estado === 'activo' ? '#00e5ff' : c.estado === 'instalacion' ? '#FFB703' : '#3B82F6';
      L.circleMarker([c.lat, c.lng], {
        radius: 10, fillColor: color, color: c.alertas?.length ? '#ff4757' : color,
        weight: c.alertas?.length ? 3 : 2, fillOpacity: 0.88,
        dashArray: c.coord_verificada ? undefined : '4 3',
      }).bindTooltip(
        `<div style="font-weight:700;color:${color};margin-bottom:3px">🔷 SIDF · ${c.id.toUpperCase()}</div>
         <div style="font-weight:600;font-size:12px">${c.nombre}</div>
         <div style="color:rgba(255,255,255,0.5);font-size:10px">PN · ${c.velocidad || '—'}</div>
         <div style="margin-top:5px;display:flex;gap:4px;flex-wrap:wrap">
           <span style="background:${color}22;color:${color};padding:1px 6px;border-radius:6px;font-size:9px;font-weight:700">● ${c.estado}</span>
           ${c.noc_monitoreado ? '<span style="background:#00e5ff22;color:#00e5ff;padding:1px 6px;border-radius:6px;font-size:9px">✓ NOC</span>' : ''}
         </div>
         ${!c.coord_verificada ? '<div style="margin-top:4px;font-size:9px;color:#fbbf24">⚠ coords aproximadas</div>' : ''}`,
        { className: 'pdn-tooltip', sticky: true }
      ).addTo(lyr);
    });
  }, [active, sidfData]);

  // ── Prospectos industriales ───────────────────────────────────────────────────
  useEffect(() => {
    const L = leafRef.current; const lyr = getLayer('prospectos');
    if (!lyr) return;
    lyr.clearLayers();
    if (!active.has('prospectos') || !L) return;
    PROSPECTOS_PDN.forEach(p => {
      L.circleMarker([p.lat, p.lng], {
        radius: 7, fillColor: '#39FF14', color: '#000', weight: 1, fillOpacity: 0.88,
      }).bindTooltip(
        `<div style="font-weight:700;color:#39FF14;margin-bottom:2px">🏭 ${p.name}</div>
         <div style="font-size:10px;color:rgba(255,255,255,0.5)">Prospecto industrial · Amistad</div>`,
        { className: 'pdn-tooltip', sticky: true }
      ).addTo(lyr);
    });
  }, [active]);

  // ── GPS ───────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const L = leafRef.current; const lyr = getLayer('gps');
    if (!lyr) return;
    lyr.clearLayers();
    if (!active.has('gps') || !L) return;
    gpsData.forEach(v => {
      const color = v.activo ? '#00ff88' : v.activo_hoy ? '#38BDF8' : '#64748b';
      const truck = `<path d="M3 17h2v1a1 1 0 002 0v-1h10v1a1 1 0 002 0v-1h2v-4l-2.5-5H3v9zm2-7h12l2 4H5v-4z" fill="${color}" opacity="0.9"/>`;
      const svg = encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="12" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="1.6"/>
          ${truck}</svg>`
      );
      const icon = L.divIcon({ className: '', html: `<img src="data:image/svg+xml,${svg}" width="28" height="28"/>`, iconSize: [28, 28], iconAnchor: [14, 14] });
      L.marker([v.lat, v.lng], { icon })
        .bindTooltip(
          `<div style="font-weight:700;color:${color};margin-bottom:3px">🚛 ${v.nombre}</div>
           <div style="font-size:11px;color:rgba(255,255,255,0.7)">${v.placa}${v.make ? ' · ' + v.make : ''}</div>
           <div style="display:flex;gap:10px;margin-top:5px">
             <span style="font-size:11px;font-weight:700;color:${color}">${v.velocidad ?? 0} km/h</span>
             <span style="font-size:11px;color:#38BDF8">${(v.km_hoy ?? 0).toFixed(0)} km hoy</span>
           </div>
           ${v.conductor ? `<div style="font-size:10px;color:rgba(255,255,255,0.6);margin-top:2px">👤 ${v.conductor}</div>` : ''}
           <div style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:2px">${v.ubicacion ?? ''}</div>`,
          { className: 'pdn-tooltip', sticky: true }
        ).addTo(lyr);
    });
  }, [active, gpsData]);

  // ── KMZ Fibra Piedras Negras ──────────────────────────────────────────────────
  useEffect(() => {
    const L = leafRef.current; const map = mapRef.current;
    if (!L || !map) return;
    kmzRef.current.forEach(lyr => map.removeLayer(lyr));
    kmzRef.current = [];
    if (!active.has('kmz')) return;
    const color = '#f97316';
    // Buscar las capas del grupo 'negras' en el índice para obtener los IDs correctos
    fetch(`${API_BASE}/api/red/kmz-capas`)
      .then(r => r.ok ? r.json() : [])
      .then(async (groups: any[]) => {
        const grupo = groups.find((g: any) => g.id === 'negras');
        if (!grupo) return;
        const added: any[] = [];
        for (const layer of grupo.layers) {
          const res = await fetch(`${API_BASE}/api/red/kmz/${layer.id}`);
          if (!res.ok) continue;
          const geojson = await res.json();
          if (!geojson?.features) continue;
          const lyr = L.geoJSON(geojson, {
            style: () => ({ color, weight: 2.5, opacity: 0.85, fillColor: color, fillOpacity: 0.2 }),
            pointToLayer: (_: any, latlng: any) =>
              L.circleMarker(latlng, { radius: 4, fillColor: color, color: '#fff', weight: 1, fillOpacity: 0.85 }),
            onEachFeature: (feat: any, lyrItem: any) => {
              const name = feat.properties?.name || layer.name;
              if (name) lyrItem.bindTooltip(
                `<span style="font-size:11px;color:${color};font-weight:600">🔌 ${name}</span>`,
                { className: 'pdn-tooltip', sticky: true }
              );
            },
          }).addTo(map);
          added.push(lyr);
        }
        kmzRef.current = added;
      }).catch(() => {});
  }, [active]);

  const LAYERS: { id: string; label: string; color: string; count: number }[] = [
    { id: 'rb',         label: 'Radiobases', color: '#00ffcc', count: rbData.length },
    { id: 'sidf',       label: 'SIDF',       color: '#00e5ff', count: sidfData.length },
    { id: 'prospectos', label: 'Prospectos', color: '#39FF14', count: PROSPECTOS_PDN.length },
    { id: 'gps',        label: 'GPS Flotilla', color: '#00ff88', count: gpsData.length },
    { id: 'kmz',        label: 'Fibra KMZ',  color: '#f97316', count: 1 },
  ];

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      {/* Layer toggles — arriba izquierda */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 1000,
        display: 'flex', gap: 6, flexWrap: 'wrap',
      }}>
        {LAYERS.map(l => (
          <button key={l.id} onClick={() => toggle(l.id)} style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: 'none',
            background: active.has(l.id) ? `${l.color}20` : 'rgba(0,0,0,0.65)',
            outline: `1px solid ${active.has(l.id) ? l.color + '99' : 'rgba(255,255,255,0.12)'}`,
            color: active.has(l.id) ? l.color : 'rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', gap: 5,
            backdropFilter: 'blur(6px)', transition: 'all 0.15s',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: active.has(l.id) ? l.color : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            {l.label}
            {l.count > 0 && (
              <span style={{ fontWeight: 700, fontSize: 9, color: active.has(l.id) ? l.color : 'rgba(255,255,255,0.3)' }}>{l.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Selector de capa base — arriba derecha */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1000,
        display: 'flex', gap: 4, backdropFilter: 'blur(6px)',
        background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '3px 4px',
        outline: '1px solid rgba(255,255,255,0.1)',
      }}>
        {([
          { id: 'dark',      label: '🌑 Oscuro'    },
          { id: 'satellite', label: '🛰 Satélite'   },
          { id: 'hybrid',    label: '🗺 Híbrido'    },
        ] as { id: MapTile; label: string }[]).map(opt => (
          <button key={opt.id} onClick={() => setMapTile(opt.id)} style={{
            padding: '3px 10px', borderRadius: 16, fontSize: 10, cursor: 'pointer', border: 'none',
            background: mapTile === opt.id ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: mapTile === opt.id ? '#fff' : 'rgba(255,255,255,0.4)',
            fontWeight: mapTile === opt.id ? 700 : 400,
            transition: 'all 0.15s',
          }}>{opt.label}</button>
        ))}
      </div>

      {/* Map container */}
      <div id="pdn-os-map" style={{ width: '100%', height: '100%' }} />
      <style>{`
        .pdn-tooltip {
          background: rgba(5,15,10,0.97) !important;
          border: 1px solid rgba(0,255,136,0.15) !important;
          border-radius: 10px !important;
          padding: 10px 14px !important;
          font-size: 12px !important;
          line-height: 1.6 !important;
          color: rgba(255,255,255,0.7) !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.5) !important;
        }
        .pdn-tooltip::before { display:none !important; }
      `}</style>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CiudadOSSection({
  config, theme, extraTabs = [],
}: { config: PlazaConfig; theme: ThemeConfig; extraTabs?: ExtraTab[] }) {
  const C = mkC(theme);

  const [osTab, setOsTab]             = useState<OSTab>('ops');
  const [tickets, setTickets]         = useState<Ticket[]>([]);
  const [alertas, setAlertas]         = useState<Alerta[]>([]);
  const [hora, setHora]               = useState(horaLocal());
  const [loadingT, setLoadingT]       = useState(true);
  const [loadingA, setLoadingA]       = useState(true);
  const [errorT, setErrorT]           = useState<string | null>(null);
  const [errorA, setErrorA]           = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [ticketDetail, setTicketDetail] = useState<Ticket | null>(null);

  // Minutas
  const [notes, setNotes]               = useState<MeetingNote[]>(() => loadNotes(config.id));
  const [showInput, setShowInput]       = useState(false);
  const [showOutput, setShowOutput]     = useState(false);
  const [noteText, setNoteText]         = useState('');
  const [noteFuente, setNoteFuente]     = useState<MeetingNote['fuente']>('read');
  const [noteSaved, setNoteSaved]       = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [showAllNote, setShowAllNote]   = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const id = setInterval(() => setHora(horaLocal()), 1000);
    return () => clearInterval(id);
  }, []);

  const matchesTicket = useCallback((t: Ticket) => {
    const byTech = config.tecnico_filter
      ? (t.tecnico || '').toLowerCase().includes(config.tecnico_filter.toLowerCase())
      : false;
    const byTerms = config.ticket_terms?.length
      ? (() => {
          // Solo buscar en el título del ticket, no en el nombre del cliente
          // — evita falsos positivos por apellidos (e.g. "NAVA" como apellido vs municipio)
          const hay = t.nombre.toLowerCase();
          return config.ticket_terms!.some(term => hay.includes(term));
        })()
      : false;
    const hasCriteria = !!config.tecnico_filter || (config.ticket_terms?.length ?? 0) > 0;
    return hasCriteria ? (byTech || byTerms) : true;
  }, [config.tecnico_filter, config.ticket_terms]);

  const matchesCiudad = useCallback((a: Alerta) => {
    const hay = (a.cityName + ' ' + a.hostName + ' ' + a.siteName).toLowerCase();
    return config.noc_terms.some(t => hay.includes(t));
  }, [config.noc_terms]);

  const fetchTickets = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/wfm/field-tickets?limit=200`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setTickets((d.tickets ?? []).filter((t: Ticket) => matchesTicket(t) && !t.cerrado));
      setErrorT(null);
    } catch (e: any) { setErrorT(e.message); }
    finally { setLoadingT(false); setLastRefresh(new Date()); }
  }, [matchesTicket]);

  const fetchAlertas = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/noc/alerts?active_only=true&limit=500`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setAlertas((Array.isArray(d) ? d : (d.alerts ?? [])).filter(matchesCiudad));
      setErrorA(null);
    } catch (e: any) { setErrorA(e.message); }
    finally { setLoadingA(false); }
  }, [matchesCiudad]);

  useEffect(() => {
    fetchTickets(); fetchAlertas();
    const t1 = setInterval(fetchTickets, 60_000);
    const t2 = setInterval(fetchAlertas, 30_000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [fetchTickets, fetchAlertas, matchesTicket]);

  // ── Guardar minuta ──────────────────────────────────────────────────────────

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    const note: MeetingNote = {
      id: Date.now().toString(),
      fecha: new Date().toISOString(),
      fuente: noteFuente,
      texto: noteText.trim(),
    };
    saveNote(config.id, note);
    const updated = loadNotes(config.id);
    setNotes(updated);
    setNoteSaved(true);
    setTimeout(() => { setNoteSaved(false); setShowInput(false); setNoteText(''); }, 1200);
  };

  // ── Generar reporte de salida ───────────────────────────────────────────────

  const generateOutput = () => {
    const fallas = tickets.filter(t => t.tipo === 'falla');
    const habs   = tickets.filter(t => t.tipo === 'habilitacion');
    const urg    = tickets.filter(t => t.prioridad === 'urgent');
    const crit   = alertas.filter(a => a.severity === 'critical');
    const fecha  = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const hora   = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const lastNote = notes[0];

    const ticketLines = tickets.slice(0, 8).map(t =>
      `  • [${t.tipo === 'falla' ? 'FALLA' : 'INST'}] ${t.id} — ${t.nombre} (${tiempoTranscurrido(t.fecha_creacion)})`
    ).join('\n');

    const alertaLines = alertas.slice(0, 6).map(a =>
      `  • [${a.severity.toUpperCase()}] ${a.hostName || a.siteName} — ${a.cityName}`
    ).join('\n');

    const equipoLines = config.equipo.map(p =>
      `  • ${p.nombre} — ${p.rol}${p.activo ? ' ✓ activo' : ''}`
    ).join('\n');

    return `╔══════════════════════════════════════════════╗
  REPORTE DE PLAZA — ${config.nombre.toUpperCase()} · ${config.estado_mx.toUpperCase()}
  ${fecha} · ${hora}
╚══════════════════════════════════════════════╝

RESUMEN OPERATIVO
─────────────────
Tickets abiertos : ${tickets.length}
  Fallas         : ${fallas.length}
  Habilitaciones : ${habs.length}
  Urgentes       : ${urg.length}
Alertas NOC      : ${alertas.length}
  Críticas       : ${crit.length}
${config.blocker ? `\n⚠ BLOCKER: ${config.blocker}` : ''}

TICKETS ACTIVOS${tickets.length > 8 ? ` (primeros 8 de ${tickets.length})` : ''}
───────────────
${ticketLines || '  Sin tickets abiertos'}

ALERTAS RED${alertas.length > 6 ? ` (primeras 6 de ${alertas.length})` : ''}
───────────
${alertaLines || '  Sin alertas activas'}

EQUIPO DE PLAZA
───────────────
${equipoLines}
${lastNote ? `
ÚLTIMA REUNIÓN — ${new Date(lastNote.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })} [${lastNote.fuente.toUpperCase()}]
───────────────
${lastNote.texto.slice(0, 600)}${lastNote.texto.length > 600 ? '\n[...]' : ''}` : '\nSin minutas registradas.'}

─────────────────────────────────────────────
Generado por XCIEN CiudadOS — Portal XCIEN 2.0`;
  };

  const handleCopyOutput = async () => {
    await navigator.clipboard.writeText(generateOutput());
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  const handlePrint = (content: string, title: string) => {
    const GD = '#1a3d2b';
    const GM = '#2d7a3a';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { margin: 1.8cm 1.5cm 1.5cm 1.5cm; }
  body { font-family: 'Helvetica Neue', sans-serif; font-size: 11px; color: #1a1a1a; line-height: 1.6; }
  .header { background: ${GD}; color: #fff; padding: 10px 16px; margin: -1.8cm -1.5cm 16px -1.5cm;
            font-size: 13px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
  .header span { font-size: 10px; opacity: 0.8; }
  h1 { color: ${GD}; font-size: 14px; margin: 0 0 4px; }
  h2 { color: ${GM}; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase;
       border-bottom: 1px solid #c8dccb; padding-bottom: 3px; margin: 16px 0 6px; }
  pre { font-family: 'SF Mono', 'Courier New', monospace; font-size: 9.5px;
        background: #f8fdf9; border: 1px solid #c8dccb; border-radius: 4px;
        padding: 12px; white-space: pre-wrap; word-break: break-word; }
  .footer { position: fixed; bottom: 0; left: 0; right: 0; background: ${GD};
            color: #fff; font-size: 8px; padding: 4px 16px;
            display: flex; justify-content: space-between; }
</style></head><body>
<div class="header"><b>⊪⊪⊪  xcien</b><span>CONFIDENCIAL · XCIEN Networks</span></div>
<h1>${title}</h1>
<pre>${content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
<div class="footer"><span>XCIEN Networks · Uso interno</span><span>Piedras Negras OS</span></div>
</body></html>`;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
    document.body.appendChild(iframe);
    iframe.contentDocument!.write(html);
    iframe.contentDocument!.close();
    iframe.contentWindow!.focus();
    setTimeout(() => {
      iframe.contentWindow!.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  };

  const fallas         = tickets.filter(t => t.tipo === 'falla');
  const habilitaciones = tickets.filter(t => t.tipo === 'habilitacion');
  const criticas       = alertas.filter(a => a.severity === 'critical');
  const urgentes       = tickets.filter(t => t.prioridad === 'urgent');
  const lastNote       = notes[0] ?? null;

  const GD = '#1a3d2b'; // verde oscuro institucional — solo para el header accent

  return (
    <div style={{
      background: C.bg, minHeight: '100%', color: C.text,
      fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes glow-pulse {
          0%,100% { box-shadow: 0 0 4px ${C.red}55; }
          50%     { box-shadow: 0 0 12px ${C.red}99; }
        }
        @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .ticket-row:hover { background: ${C.light ? '#f0f9f3' : C.surface2} !important; }
        .tab-btn:hover { color: ${C.text} !important; }
        .city-btn:hover { background: ${C.light ? '#e8f5eb' : C.surface} !important; }
      `}</style>

      {/* ── TOP ACCENT LINE — verde oscuro institucional ───────────────────── */}
      <div style={{
        height: C.light ? 3 : 2,
        background: C.light
          ? `linear-gradient(90deg, ${GD}, ${C.green} 40%, ${C.green}44 70%, transparent)`
          : `linear-gradient(90deg, ${C.green}, ${C.green}55 60%, transparent)`,
        flexShrink: 0,
      }} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        boxShadow: C.shadow,
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        flexShrink: 0,
      }}>
        {/* Identidad */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: C.light
              ? `linear-gradient(135deg, ${C.green}22, ${C.green}0a)`
              : `linear-gradient(135deg, ${C.green}28, ${C.green}0a)`,
            border: `1px solid ${C.green}40`,
            boxShadow: C.light ? `0 2px 8px ${C.green}20` : `0 0 14px ${C.green}1a`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            {config.emoji}
          </div>
          <div>
            <div style={{
              fontSize: 15, fontWeight: 700, letterSpacing: 2,
              color: C.light ? GD : C.white, fontFamily: 'inherit', lineHeight: 1.2,
            }}>
              {config.nombre.toLowerCase()}<span style={{ color: C.green }}>OS</span>
            </div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
              {config.estado_mx} · XCIEN
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Status dots */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <StatusDot label="Odoo" ok={!errorT} loading={loadingT} c={C} />
          <StatusDot label="NOC"  ok={!errorA} loading={loadingA} c={C} />
        </div>

        {/* ── BOTONES INPUT / OUTPUT ────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            className="city-btn"
            onClick={() => { setShowInput(true); setTimeout(() => textareaRef.current?.focus(), 80); }}
            title="Subir minuta de reunión"
            style={{
              background: C.light ? '#f0f9f3' : C.surface2,
              border: `1px solid ${C.green}44`,
              borderRadius: 7, color: C.green,
              padding: '5px 11px', cursor: 'pointer',
              fontSize: 11, fontFamily: 'inherit', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
            }}
          >
            <span>↑</span> Minuta
            {notes.length > 0 && (
              <span style={{
                background: C.green, color: '#fff',
                borderRadius: 100, fontSize: 9, padding: '0px 5px',
                fontWeight: 700, minWidth: 16, textAlign: 'center',
              }}>{notes.length}</span>
            )}
          </button>

          <button
            className="city-btn"
            onClick={() => setShowOutput(true)}
            title="Generar reporte de estado"
            style={{
              background: C.light ? '#f0f9f3' : C.surface2,
              border: `1px solid ${C.border}`,
              borderRadius: 7, color: C.muted,
              padding: '5px 11px', cursor: 'pointer',
              fontSize: 11, fontFamily: 'inherit', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
            }}
          >
            <span>↓</span> Reporte
          </button>
        </div>

        {/* Refresh */}
        <button
          className="city-btn"
          onClick={() => { fetchTickets(); fetchAlertas(); }}
          title="Actualizar ahora"
          style={{
            background: C.light ? '#f0f9f3' : C.surface2,
            border: `1px solid ${C.border}`,
            borderRadius: 7, color: C.muted,
            padding: '5px 11px', cursor: 'pointer',
            fontSize: 14, fontFamily: 'inherit', transition: 'all 0.15s',
          }}
        >↻</button>

        {/* Reloj */}
        <div style={{ textAlign: 'right', minWidth: 96 }}>
          <div style={{
            fontSize: 17, fontWeight: 700,
            color: C.light ? GD : C.green,
            letterSpacing: 1, fontFamily: 'inherit', lineHeight: 1.2,
          }}>
            {hora}
          </div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 0.5 }}>{fechaCorta()}</div>
        </div>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1, background: C.border,
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <KPITile
          label="Tickets abiertos" value={tickets.length}
          sub={urgentes.length > 0 ? `${urgentes.length} urgentes` : 'sin urgencia'}
          color={urgentes.length > 0 ? C.red : C.green}
          icon="⚡" loading={loadingT} c={C}
        />
        <KPITile
          label="Fallas activas" value={fallas.length}
          sub={`plaza ${config.id.toUpperCase()}`}
          color={fallas.length > 0 ? C.amber : C.green}
          icon="⚠" loading={loadingT} c={C}
        />
        <KPITile
          label="Habilitaciones" value={habilitaciones.length}
          sub="en proceso" color={C.blue}
          icon="✦" loading={loadingT} c={C}
        />
        <KPITile
          label={`Alertas NOC ${config.id.toUpperCase()}`} value={alertas.length}
          sub={`${criticas.length} críticas`}
          color={criticas.length > 0 ? C.red : alertas.length > 0 ? C.amber : C.green}
          icon="◈" loading={loadingA} c={C}
        />
      </div>

      {/* ── BLOCKER BANNER ─────────────────────────────────────────────────── */}
      {config.blocker && (
        <div style={{
          background: C.redDim,
          borderBottom: `1px solid ${C.red}33`,
          padding: '9px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 12, color: C.red, flexShrink: 0,
        }}>
          <span style={{ animation: 'blink 1.4s step-start infinite', flexShrink: 0 }}>⬤</span>
          <span style={{ fontFamily: 'system-ui, sans-serif' }}>
            <strong style={{ marginRight: 6 }}>BLOCKER —</strong>
            {config.blocker}
          </span>
        </div>
      )}

      {/* ── TAB BAR ────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface2,
        padding: '0 12px', gap: 4, flexShrink: 0,
        boxShadow: C.light ? '0 1px 0 rgba(0,0,0,0.04)' : 'none',
      }}>
        {([
          { id: 'ops',   icon: '⚙', label: 'Operaciones' },
          { id: 'mapa',  icon: '◍', label: 'Mapa' },
          { id: 'fibra', icon: '◎', label: `Fibra X100 · ${config.id.toUpperCase()}` },
          ...extraTabs.map(t => ({ id: t.id, icon: t.icon, label: t.label })),
        ] as { id: string; icon: string; label: string }[]).map(t => (
          <button
            key={t.id}
            className="tab-btn"
            onClick={() => setOsTab(t.id)}
            style={{
              padding: '9px 14px', border: 'none', cursor: 'pointer',
              background: osTab === t.id ? `${C.green}18` : 'transparent',
              borderRadius: 6,
              color: osTab === t.id ? (C.light ? GD : C.green) : C.dim,
              fontSize: 11, fontWeight: osTab === t.id ? 700 : 500,
              letterSpacing: 0.8, fontFamily: 'inherit', margin: '5px 0',
              borderBottom: osTab === t.id ? `2px solid ${C.green}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ marginRight: 6, fontSize: 10 }}>{t.icon}</span>
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── MAPA TAB ───────────────────────────────────────────────────────── */}
      {osTab === 'mapa' && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <MapaPDN C={C} />
        </div>
      )}

      {/* ── FIBRA TAB ──────────────────────────────────────────────────────── */}
      {osTab === 'fibra' && (
        <div style={{ flex: 1, overflowY: 'auto', background: C.bg }}>
          <FibraSection theme={theme} />
        </div>
      )}

      {/* ── EXTRA TABS (PDN y otras plazas) ────────────────────────────────── */}
      {extraTabs.map(t => osTab === t.id && (
        <div key={t.id} style={{ flex: 1, overflowY: 'auto', background: C.bg }}>
          {t.content}
        </div>
      ))}

      {/* ── OPS: cuerpo principal ───────────────────────────────────────────── */}
      {osTab === 'ops' && (
        <div style={{
          flex: 1,
          display: 'grid', gridTemplateColumns: '1fr 400px',
          gap: 0, overflow: 'hidden',
          background: C.light ? '#e0ede8' : C.border,
          minHeight: 0,
        }}>

          {/* Col izquierda: Tickets */}
          <div style={{ background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <PanelHeader
              icon="⚙"
              title={config.tecnico_filter
                ? `Tickets — ${config.tecnico_filter.charAt(0).toUpperCase()}${config.tecnico_filter.slice(1)}`
                : `Tickets Abiertos — ${config.nombre}`}
              badge={tickets.length}
              badgeColor={urgentes.length > 0 ? C.red : C.blue}
              c={C}
            />
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 16px' }}>
              {loadingT && <LoadingRows c={C} />}
              {!loadingT && errorT && <ErrorMsg msg={errorT} c={C} />}
              {!loadingT && !errorT && tickets.length === 0 && (
                <EmptyState icon="✓" msg="Sin tickets abiertos" sub={config.nombre} c={C} />
              )}
              {!loadingT && tickets.map(t => (
                <TicketRow
                  key={t.id} ticket={t}
                  isSelected={ticketDetail?.id === t.id}
                  onClick={() => setTicketDetail(p => p?.id === t.id ? null : t)}
                  c={C}
                />
              ))}
            </div>
          </div>

          {/* Col derecha: Alertas NOC + Equipo + Minuta */}
          <div style={{
            background: C.surface, display: 'flex', flexDirection: 'column',
            borderLeft: `1px solid ${C.border}`, overflow: 'hidden',
          }}>
            <PanelHeader
              icon="◈"
              title={`Red ${config.nombre}`}
              badge={alertas.length}
              badgeColor={criticas.length > 0 ? C.red : alertas.length > 0 ? C.amber : C.green}
              c={C}
            />
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 12px' }}>
              {loadingA && <LoadingRows c={C} />}
              {!loadingA && errorA && <ErrorMsg msg={errorA} c={C} />}
              {!loadingA && !errorA && alertas.length === 0 && (
                <EmptyState icon="◉" msg="Sin alertas activas" sub={config.nombre} c={C} />
              )}
              {!loadingA && alertas
                .sort((a, b) => (b.severity === 'critical' ? 1 : 0) - (a.severity === 'critical' ? 1 : 0))
                .map(a => <AlertaRow key={a.id} alerta={a} c={C} />)
              }
            </div>

            {/* Equipo */}
            <div style={{ borderTop: `1px solid ${C.border}`, background: C.surface2, flexShrink: 0 }}>
              <div style={{
                padding: '8px 14px 4px', fontSize: 9, color: C.dim,
                letterSpacing: 2, textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>◈</span> Equipo de plaza
              </div>
              <div style={{ padding: '4px 12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {config.equipo.map(p => (
                  <PersonaChip key={p.nombre} {...p} c={C} gd={GD} />
                ))}
              </div>
            </div>

            {/* Última minuta */}
            {lastNote && (
              <div style={{
                borderTop: `1px solid ${C.border}`,
                background: C.light ? '#f8fdf9' : C.surface,
                flexShrink: 0, padding: '10px 14px',
                animation: 'fadein 0.3s ease',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
                }}>
                  <div style={{
                    fontSize: 9, color: C.muted, letterSpacing: 1.5,
                    textTransform: 'uppercase', flex: 1,
                  }}>
                    Última reunión
                  </div>
                  <span style={{
                    fontSize: 9, padding: '1px 7px', borderRadius: 100,
                    background: C.greenDim, color: C.green,
                    border: `1px solid ${C.green}30`,
                    fontFamily: 'inherit',
                  }}>
                    {lastNote.fuente.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 9, color: C.dim }}>
                    {new Date(lastNote.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div style={{
                  fontSize: 11, color: C.text, fontFamily: 'system-ui, sans-serif',
                  lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  maxHeight: showAllNote ? 300 : 72,
                  overflow: 'hidden', transition: 'max-height 0.3s',
                }}>
                  {lastNote.texto}
                </div>
                {lastNote.texto.length > 180 && (
                  <button
                    onClick={() => setShowAllNote(v => !v)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 10, color: C.green, padding: '4px 0 0',
                      fontFamily: 'inherit',
                    }}
                  >
                    {showAllNote ? '▲ Menos' : '▼ Ver todo'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DETAIL DRAWER ──────────────────────────────────────────────────── */}
      {osTab === 'ops' && ticketDetail && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: C.surface,
          borderTop: `2px solid ${C.blue}`,
          boxShadow: C.shadowMd,
          padding: '16px 24px', zIndex: 100,
          display: 'flex', gap: 24, alignItems: 'flex-start',
          maxHeight: '40vh', overflowY: 'auto',
        }}>
          <div style={{
            width: 3, alignSelf: 'stretch', borderRadius: 2, flexShrink: 0,
            background: ticketDetail.tipo === 'falla' ? C.red : C.blue,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: C.dim, fontFamily: 'inherit' }}>{ticketDetail.id}</span>
              <Pill
                label={ticketDetail.tipo === 'falla' ? 'FALLA' : 'INSTALACIÓN'}
                color={ticketDetail.tipo === 'falla' ? C.red : C.blue}
                dim={ticketDetail.tipo === 'falla' ? C.redDim : C.blueDim}
              />
              {ticketDetail.prioridad === 'urgent' && (
                <Pill label="URGENTE" color={C.red} dim={C.redDim} bold />
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 5, fontFamily: 'system-ui, sans-serif' }}>
              {ticketDetail.nombre}
            </div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: 'system-ui, sans-serif' }}>
              {ticketDetail.cliente}
              <span style={{ color: C.dim, margin: '0 6px' }}>·</span>
              {ticketDetail.etapa_op}
              <span style={{ color: C.dim, margin: '0 6px' }}>·</span>
              {tiempoTranscurrido(ticketDetail.fecha_creacion)} ago
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <a
              href={`https://odoo.wispi.mx/odoo/helpdesk/${ticketDetail.odoo_id}`}
              target="_blank" rel="noreferrer"
              style={{
                padding: '7px 16px', borderRadius: 7, fontSize: 12,
                background: C.blue, color: '#fff', textDecoration: 'none',
                fontFamily: 'inherit', fontWeight: 600,
                boxShadow: `0 2px 8px ${C.blue}44`,
              }}
            >Abrir en Odoo ↗</a>
            <button onClick={() => setTicketDetail(null)} style={{
              padding: '7px 12px', borderRadius: 7, fontSize: 14,
              background: C.surface2, border: `1px solid ${C.border}`,
              color: C.muted, cursor: 'pointer', fontFamily: 'inherit',
            }}>✕</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL INPUT — Subir minuta de reunión
      ══════════════════════════════════════════════════════════════════════ */}
      {showInput && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowInput(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div style={{
            background: C.surface, borderRadius: 12,
            border: `1px solid ${C.border}`,
            boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
            width: '100%', maxWidth: 620,
            animation: 'fadein 0.2s ease',
            overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${C.border}`,
              background: C.light ? C.surface2 : C.surface2,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: C.greenDim, border: `1px solid ${C.green}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13,
              }}>↑</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
                  Subir Minuta de Reunión
                </div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: 'inherit' }}>
                  PLAZA {config.nombre.toUpperCase()} · {config.estado_mx.toUpperCase()}
                </div>
              </div>
              <button onClick={() => setShowInput(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.muted, fontSize: 18, lineHeight: 1, padding: 4,
              }}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{ padding: 20 }}>
              {/* Fuente selector */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8, fontFamily: 'inherit' }}>
                  FUENTE DEL RESUMEN
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['read', 'gemini', 'manual'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setNoteFuente(f)}
                      style={{
                        padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
                        border: `1px solid ${noteFuente === f ? C.green : C.border}`,
                        background: noteFuente === f ? C.greenDim : 'transparent',
                        color: noteFuente === f ? C.green : C.muted,
                        fontSize: 11, fontFamily: 'inherit', fontWeight: noteFuente === f ? 700 : 400,
                        transition: 'all 0.15s',
                      }}
                    >
                      {f === 'read' ? '🎙 Read.ai' : f === 'gemini' ? '✦ Gemini' : '✏ Manual'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 8, fontFamily: 'inherit' }}>
                  RESUMEN / MINUTA
                </div>
                <textarea
                  ref={textareaRef}
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder={`Pega aquí el resumen de la reunión semanal de ${config.nombre}...\n\nPuedes incluir:\n• Acuerdos alcanzados\n• Pendientes del equipo\n• Avances en el blocker\n• Próximos pasos`}
                  rows={10}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: C.light ? '#f8fdf9' : C.bg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: '12px 14px',
                    color: C.text, fontSize: 12,
                    fontFamily: 'system-ui, sans-serif',
                    lineHeight: 1.6, resize: 'vertical',
                    outline: 'none',
                    boxShadow: `inset 0 1px 3px rgba(0,0,0,0.05)`,
                  }}
                />
                <div style={{ fontSize: 10, color: C.dim, marginTop: 4, textAlign: 'right', fontFamily: 'inherit' }}>
                  {noteText.length} caracteres
                </div>
              </div>

              {/* Historial de notas */}
              {notes.length > 0 && (
                <div style={{
                  marginBottom: 16, padding: '10px 12px', borderRadius: 8,
                  background: C.light ? '#f0f9f3' : C.surface2,
                  border: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: 9, color: C.dim, letterSpacing: 1, marginBottom: 6, fontFamily: 'inherit' }}>
                    HISTORIAL — {notes.length} minuta{notes.length !== 1 ? 's' : ''} guardada{notes.length !== 1 ? 's' : ''}
                  </div>
                  {notes.slice(0, 3).map(n => (
                    <div key={n.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '4px 0', borderBottom: `1px solid ${C.border}`,
                    }}>
                      <span style={{ fontSize: 9, color: C.muted, fontFamily: 'system-ui, sans-serif', flex: 1 }}>
                        {fechaCompleta(n.fecha)}
                      </span>
                      <span style={{
                        fontSize: 9, padding: '1px 6px', borderRadius: 100,
                        background: C.greenDim, color: C.green,
                        fontFamily: 'inherit',
                      }}>{n.fuente}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{
                display: 'flex', gap: 8, alignItems: 'center',
                paddingTop: 4, borderTop: `1px solid ${C.border}`, marginTop: 4,
              }}>
                <button
                  onClick={() => handlePrint(noteText, `Minuta — ${config.nombre} · ${new Date().toLocaleDateString('es-MX')}`)}
                  disabled={!noteText.trim()}
                  style={{
                    padding: '9px 16px', borderRadius: 8,
                    cursor: noteText.trim() ? 'pointer' : 'not-allowed',
                    border: `1px solid ${C.border}`,
                    background: noteText.trim() ? C.surface2 : 'transparent',
                    color: noteText.trim() ? C.text : C.dim,
                    fontSize: 13, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: noteText.trim() ? 1 : 0.4,
                    transition: 'all 0.15s',
                  }}
                >🖨 Imprimir</button>
                <div style={{ flex: 1 }} />
                <button onClick={() => setShowInput(false)} style={{
                  padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${C.border}`, background: 'transparent',
                  color: C.muted, fontSize: 12, fontFamily: 'inherit',
                }}>Cancelar</button>
                <button
                  onClick={handleSaveNote}
                  disabled={!noteText.trim()}
                  style={{
                    padding: '9px 22px', borderRadius: 8,
                    cursor: noteText.trim() ? 'pointer' : 'default',
                    border: 'none',
                    background: noteSaved ? C.green : noteText.trim() ? C.green : C.border,
                    color: '#fff', fontSize: 12, fontFamily: 'inherit', fontWeight: 700,
                    transition: 'all 0.2s',
                    boxShadow: noteText.trim() ? `0 2px 8px ${C.green}44` : 'none',
                  }}
                >
                  {noteSaved ? '✓ Guardado' : '↑ Guardar Minuta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL OUTPUT — Reporte de estado
      ══════════════════════════════════════════════════════════════════════ */}
      {showOutput && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowOutput(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div style={{
            background: C.surface, borderRadius: 12,
            border: `1px solid ${C.border}`,
            boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
            width: '100%', maxWidth: 580,
            animation: 'fadein 0.2s ease',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            maxHeight: '80vh',
          }}>
            {/* Header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${C.border}`,
              background: C.surface2,
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: C.blueDim, border: `1px solid ${C.blue}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: C.blue,
              }}>↓</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
                  Reporte de Estado — {config.nombre}
                </div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: 'inherit' }}>
                  {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
              <button onClick={() => setShowOutput(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.muted, fontSize: 18, lineHeight: 1, padding: 4,
              }}>✕</button>
            </div>

            {/* Output content */}
            <pre style={{
              flex: 1, overflowY: 'auto',
              margin: 0, padding: 20,
              background: C.light ? '#f8fdf9' : C.bg,
              fontSize: 11, lineHeight: 1.65,
              color: C.text, fontFamily: "'SF Mono', 'Fira Code', monospace",
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {generateOutput()}
            </pre>

            {/* Barra de acciones — siempre visible al fondo */}
            <div style={{
              padding: '12px 20px',
              borderTop: `1px solid ${C.border}`,
              background: C.surface2,
              display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0,
            }}>
              <button
                onClick={() => handlePrint(
                  generateOutput(),
                  `Reporte ${config.nombre} · ${new Date().toLocaleDateString('es-MX')}`
                )}
                style={{
                  padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${C.border}`,
                  background: C.surface, color: C.text,
                  fontSize: 13, fontFamily: 'inherit', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: C.shadow,
                }}
              >🖨 Imprimir</button>
              <div style={{ flex: 1 }} />
              <button
                onClick={handleCopyOutput}
                style={{
                  padding: '9px 20px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${copiedOutput ? C.green : C.border}`,
                  background: copiedOutput ? C.greenDim : C.surface,
                  color: copiedOutput ? C.green : C.muted,
                  fontSize: 12, fontFamily: 'inherit', fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {copiedOutput ? '✓ Copiado' : 'Copiar texto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pill badge ────────────────────────────────────────────────────────────────

function Pill({ label, color, dim, bold }: { label: string; color: string; dim: string; bold?: boolean }) {
  return (
    <span style={{
      fontSize: 9, padding: '2px 8px', borderRadius: 100,
      background: dim, color, fontFamily: 'inherit',
      letterSpacing: 0.8, fontWeight: bold ? 800 : 600,
      border: `1px solid ${color}33`,
    }}>
      {label}
    </span>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function StatusDot({ label, ok, loading, c }: { label: string; ok: boolean; loading: boolean; c: C }) {
  const color = loading ? c.amber : ok ? c.green : c.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%', background: color,
        boxShadow: `0 0 7px ${color}`,
        animation: loading ? 'pulse 1s infinite' : 'none',
        flexShrink: 0,
      }} />
      <span style={{ fontSize: 10, color: c.muted, letterSpacing: 0.5 }}>{label}</span>
    </div>
  );
}

function KPITile({ label, value, sub, color, icon, loading, c }:
  { label: string; value: number; sub: string; color: string; icon: string; loading: boolean; c: C }) {
  return (
    <div style={{
      background: c.surface, padding: '14px 18px',
      display: 'flex', flexDirection: 'column', gap: 3,
      borderLeft: `3px solid ${color}`,
      position: 'relative', overflow: 'hidden',
      boxShadow: c.shadow,
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 60, height: 60,
        background: `radial-gradient(circle at 80% 20%, ${color}0c, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span style={{ fontSize: 9, color, opacity: 0.7 }}>{icon}</span>
        <span style={{ fontSize: 9, color: c.dim, letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{
        fontSize: 34, fontWeight: 800, color, lineHeight: 1,
        fontFamily: 'inherit', opacity: loading ? 0.3 : 1, transition: 'opacity 0.3s',
      }}>
        {loading ? '—' : value}
      </div>
      <div style={{ fontSize: 10, color: c.muted, fontFamily: 'system-ui, sans-serif' }}>{sub}</div>
    </div>
  );
}

function PanelHeader({ icon, title, badge, badgeColor, c }:
  { icon: string; title: string; badge: number; badgeColor: string; c: C }) {
  return (
    <div style={{
      padding: '10px 14px', borderBottom: `1px solid ${c.border}`,
      display: 'flex', alignItems: 'center', gap: 8,
      background: c.surface2, flexShrink: 0,
      boxShadow: c.light ? '0 1px 0 rgba(0,0,0,0.04)' : 'none',
    }}>
      <span style={{ fontSize: 12, color: c.dim }}>{icon}</span>
      <span style={{ fontSize: 10, color: c.muted, flex: 1, letterSpacing: 1.2, textTransform: 'uppercase' }}>{title}</span>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 100,
        background: badgeColor + '1a', color: badgeColor,
        fontFamily: 'inherit', border: `1px solid ${badgeColor}33`,
        minWidth: 24, textAlign: 'center',
      }}>{badge}</span>
    </div>
  );
}

function TicketRow({ ticket, isSelected, onClick, c }:
  { ticket: Ticket; isSelected: boolean; onClick: () => void; c: C }) {
  const typeColor = ticket.tipo === 'falla' ? c.red : c.blue;
  const stageColor = etapaColor(ticket.etapa_op_idx, c);
  const isUrgent = ticket.prioridad === 'urgent';

  return (
    <div
      className="ticket-row"
      onClick={onClick}
      style={{
        padding: '10px 14px', borderBottom: `1px solid ${c.border}`,
        cursor: 'pointer',
        background: isSelected ? (c.light ? '#f0f9f3' : c.surface2) : 'transparent',
        borderLeft: `3px solid ${isSelected ? c.blue : isUrgent ? c.red : 'transparent'}`,
        transition: 'background 0.12s',
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}
    >
      <div style={{ paddingTop: 2, flexShrink: 0 }}>
        <Pill label={ticket.tipo === 'falla' ? 'FALLA' : 'INST'} color={typeColor} dim={typeColor + '1a'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: c.dim, fontFamily: 'inherit', letterSpacing: 0.3 }}>{ticket.id}</span>
          {isUrgent && <span style={{ fontSize: 9, color: c.red, fontWeight: 700 }}>● URG</span>}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: c.dim, fontFamily: 'inherit' }}>
            {tiempoTranscurrido(ticket.fecha_creacion)}
          </span>
        </div>
        <div style={{
          fontSize: 12, color: c.text, fontFamily: 'system-ui, sans-serif',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 4, fontWeight: 500,
        }}>{ticket.nombre}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, color: c.muted, flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'system-ui, sans-serif',
          }}>{ticket.cliente || '—'}</span>
          <span style={{
            fontSize: 9, padding: '1px 7px', borderRadius: 100, flexShrink: 0,
            background: stageColor + '1a', color: stageColor,
            fontFamily: 'inherit', border: `1px solid ${stageColor}30`,
          }}>{ticket.etapa_op}</span>
        </div>
      </div>
    </div>
  );
}

function AlertaRow({ alerta, c }: { alerta: Alerta; c: C }) {
  const color = sevColor(alerta.severity, c);
  const isCritical = alerta.severity === 'critical';
  const time = alerta.timestamp
    ? new Date(alerta.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div style={{
      padding: '10px 14px', borderBottom: `1px solid ${c.border}`,
      borderLeft: `3px solid ${color}`,
      animation: isCritical ? 'glow-pulse 2.5s ease-in-out infinite' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{
          width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
          background: color + '1a', border: `1px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, color,
        }}>
          {isCritical ? '⬤' : alerta.severity === 'warning' ? '▲' : '◆'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <Pill label={alerta.severity.toUpperCase()} color={color} dim={color + '1a'} />
            <span style={{ fontSize: 9, color: c.dim, marginLeft: 'auto', fontFamily: 'inherit' }}>{time}</span>
          </div>
          <div style={{
            fontSize: 11, color: c.text, fontFamily: 'system-ui, sans-serif',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: 2, fontWeight: 500,
          }}>{alerta.hostName || alerta.siteName || '—'}</div>
          <div style={{
            fontSize: 10, color: c.muted, fontFamily: 'system-ui, sans-serif',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {alerta.cityName}
            {alerta.type && <span style={{ color: c.dim }}> · {alerta.type}</span>}
          </div>
          {alerta.ticketCreated && (
            <div style={{ fontSize: 9, color: c.green, marginTop: 3 }}>✓ ticket creado</div>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonaChip({ nombre, rol, emoji, activo, c, gd }:
  PersonaConfig & { c: C; gd: string }) {
  const ini = nombre.split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
      borderRadius: 8,
      background: activo ? (c.light ? '#e8f5eb' : `${c.green}0a`) : 'transparent',
      border: `1px solid ${activo ? c.green + '40' : c.border + '80'}`,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: activo ? (c.light ? `${c.green}22` : `${c.green}40`) : c.surface,
        border: `1px solid ${activo ? c.green + '55' : c.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700,
        color: activo ? (c.light ? gd : c.green) : c.muted,
        fontFamily: 'inherit', letterSpacing: 0.3,
      }}>{ini}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, color: c.text, fontFamily: 'system-ui, sans-serif',
          fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{nombre}</div>
        <div style={{
          fontSize: 9, color: c.muted, fontFamily: 'system-ui, sans-serif',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{rol}</div>
      </div>
      {activo && (
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: c.green, boxShadow: `0 0 8px ${c.green}`,
          flexShrink: 0, animation: 'pulse 2.5s ease-in-out infinite',
        }} />
      )}
      <span style={{ fontSize: 13, flexShrink: 0, opacity: 0.65 }}>{emoji}</span>
    </div>
  );
}

function LoadingRows({ c }: { c: C }) {
  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[1, 2, 3].map((_, i) => (
        <div key={i} style={{
          height: 58, borderRadius: 6, background: c.surface2,
          overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(90deg, transparent, ${c.border}88, transparent)`,
            animation: 'shimmer 1.6s infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        </div>
      ))}
    </div>
  );
}

function ErrorMsg({ msg, c }: { msg: string; c: C }) {
  return (
    <div style={{ padding: '16px 14px' }}>
      <div style={{
        padding: '12px 14px', borderRadius: 8,
        background: c.redDim, border: `1px solid ${c.red}22`,
        fontSize: 11, color: c.red, fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>⚠</span><span>Error: {msg}</span>
      </div>
    </div>
  );
}

function EmptyState({ icon, msg, sub, c }: { icon: string; msg: string; sub: string; c: C }) {
  return (
    <div style={{
      padding: '48px 14px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: `${c.green}12`, border: `1px solid ${c.green}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, color: c.green, marginBottom: 4,
      }}>{icon}</div>
      <div style={{ fontSize: 13, color: c.muted, fontFamily: 'system-ui, sans-serif', fontWeight: 500 }}>{msg}</div>
      <div style={{ fontSize: 10, color: c.dim, fontFamily: 'inherit', letterSpacing: 0.5 }}>{sub.toUpperCase()}</div>
    </div>
  );
}
