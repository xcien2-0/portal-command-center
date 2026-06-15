import { useEffect, useRef, useMemo } from 'react';
import { NOCCity } from '@/types/noc';

// ── Color helpers ─────────────────────────────────────────────────────────────
const G  = '#00ff88';   // verde  — healthy  ≥ 85
const Y  = '#ffcc00';   // amarillo — degraded 65–84
const O  = '#ff8800';   // naranja  — alerta   45–64
const R  = '#ff3366';   // rojo     — crítico   < 45
function nodeColor(score: number) {
  if (score >= 85) return G;
  if (score >= 65) return Y;
  if (score >= 45) return O;
  return R;
}

const ODOO_COLOR = '#00b4d8';

// ── Source badge helpers ──────────────────────────────────────────────────────
const SOURCE_BADGES: Record<string, { symbol: string; color: string }> = {
  'WL/WISPI': { symbol: '◉', color: '#60a5fa' },
  'Datos':    { symbol: '▲', color: '#00ff88' },
  'Energía':  { symbol: '⚡', color: '#ffcc00' },
  'CX Datos': { symbol: '◆', color: '#a78bfa' },
  'CX Radios':{ symbol: '●', color: '#fb923c' },
  'Central':  { symbol: '★', color: '#f472b6' },
};

function buildSourceBadges(sources: string[] | undefined): string {
  if (!sources || sources.length === 0) return '';
  return sources
    .filter(s => SOURCE_BADGES[s])
    .map(s => {
      const b = SOURCE_BADGES[s];
      return `<span style="font-size:10px;color:${b.color};line-height:1;text-shadow:0 0 6px ${b.color};" title="${s}">${b.symbol}</span>`;
    })
    .join('');
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface OdooServicio {
  id: number;
  lat: number;
  lng: number;
  nombre: string;
  cliente: string;
  bajada?: number;
  subida?: number;
  rb?: string;
}

interface Props {
  cities: NOCCity[];
  onSelectCity: (city: NOCCity) => void;
  selectedCityId: string | null;
  odooServices?: OdooServicio[];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function RealMap({ cities, onSelectCity, selectedCityId, odooServices = [] }: Props) {
  const mapRef        = useRef<any>(null);
  const leafRef       = useRef<any>(null);
  const layerRef      = useRef<any>(null);
  const odooLayerRef  = useRef<any>(null);
  const svgRef        = useRef<SVGSVGElement | null>(null);
  const citiesRef     = useRef<NOCCity[]>(cities);
  const selectedRef   = useRef<string | null>(selectedCityId);
  const fittedRef     = useRef(false);
  const containerId   = 'noc-real-map';

  // Keep refs in sync with props
  citiesRef.current   = cities;
  selectedRef.current = selectedCityId;

  // ── Init Leaflet map (once) ───────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(containerId, {
        center: [23.5, -102.5],
        zoom: 5,
        zoomControl: true,
        attributionControl: false,
        minZoom: 4,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 18 }
      ).addTo(map);

      leafRef.current = L;
      mapRef.current  = map;

      // SVG overlay — created once
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:500;overflow:visible';
      document.getElementById(containerId)?.appendChild(svg);
      svgRef.current = svg;

      // Redraw arcs on pan/zoom using always-fresh refs
      map.on('moveend zoomend', () => {
        drawArcs(map, L, svg, citiesRef.current, selectedRef.current);
      });
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; fittedRef.current = false; }
    };
  }, []);

  // ── Redraw markers + arcs when data changes ───────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const L   = leafRef.current;
    const svg = svgRef.current;
    if (!map || !L || !svg) return;

    // Markers
    if (layerRef.current) layerRef.current.clearLayers();
    const group = L.layerGroup().addTo(map);
    layerRef.current = group;

    // fitBounds only on first load with real data
    if (cities.length > 0 && !fittedRef.current) {
      const bounds = L.latLngBounds(cities.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 7, animate: false });
      fittedRef.current = true;
    }

    // Draw arcs immediately (fitBounds with animate:false won't fire moveend)
    drawArcs(map, L, svg, cities, selectedCityId);

    cities.forEach(city => {
      const c     = nodeColor(city.score);
      const isSelected = city.id === selectedCityId;
      const size  = isSelected ? 18 : Math.max(10, Math.min(20, 8 + city.totalHosts / 20));
      const badges = buildSourceBadges(city.sources);
      const totalH = size + (badges ? 10 : 0);

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;gap:1px;">
            <div style="
              width:${size}px;height:${size}px;border-radius:50%;
              background:${c}22;border:2px solid ${c};
              box-shadow:0 0 ${isSelected ? 20 : 10}px ${c}88;
              display:flex;align-items:center;justify-content:center;
              ${isSelected ? `animation:noc-pulse 1.5s ease-in-out infinite;` : ''}
            ">
              <div style="width:${size * 0.35}px;height:${size * 0.35}px;border-radius:50%;background:${c};"></div>
            </div>
            ${badges ? `<div style="display:flex;gap:2px;line-height:1;">${badges}</div>` : ''}
          </div>`,
        iconSize:   [size, totalH],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([city.lat, city.lng], { icon })
        .bindTooltip(`
          <div style="font-family:monospace;font-size:11px;background:#000d07;border:1px solid ${c}40;border-radius:8px;padding:8px 12px;color:#fff">
            <div style="font-weight:800;color:${c};margin-bottom:4px">${city.name.toUpperCase()}</div>
            <div>Score: <b style="color:${c}">${Math.round(city.score)}</b></div>
            <div>Hosts: ${city.online}↑ ${city.offline > 0 ? `<span style="color:${R}">${city.offline}↓</span>` : ''}</div>
            <div>Sitios: ${city.sites?.length || 0}</div>
            ${city.sources?.length ? `<div style="margin-top:4px;opacity:0.7">${city.sources.join(' · ')}</div>` : ''}
          </div>`, {
          className: 'noc-tooltip',
          permanent: false,
          opacity: 1,
          direction: 'top',
          offset: [0, -size / 2],
        })
        .on('click', () => onSelectCity(city));

      group.addLayer(marker);
    });

    drawArcs(map, L, svg, cities, selectedCityId);
  }, [cities, selectedCityId]);

  // ── Odoo customer layer ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const L   = leafRef.current;
    if (!map || !L) return;

    if (odooLayerRef.current) { odooLayerRef.current.clearLayers(); }
    if (!odooServices.length) return;

    const group = odooLayerRef.current ?? L.layerGroup().addTo(map);
    odooLayerRef.current = group;
    group.clearLayers();

    odooServices.forEach(s => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:5px;height:5px;border-radius:50%;background:${ODOO_COLOR};opacity:0.75;box-shadow:0 0 4px ${ODOO_COLOR}88;"></div>`,
        iconSize:   [5, 5],
        iconAnchor: [2.5, 2.5],
      });
      L.marker([s.lat, s.lng], { icon })
        .bindTooltip(`
          <div style="font-family:monospace;font-size:11px;background:#000d14;border:1px solid ${ODOO_COLOR}40;border-radius:8px;padding:8px 12px;color:#fff">
            <div style="font-weight:800;color:${ODOO_COLOR};margin-bottom:4px">${s.cliente || s.nombre}</div>
            ${s.bajada ? `<div>↓ ${s.bajada} Mbps &nbsp; ↑ ${s.subida} Mbps</div>` : ''}
            ${s.rb ? `<div style="color:rgba(255,255,255,0.5)">RB: ${s.rb}</div>` : ''}
          </div>`, {
          className: 'noc-tooltip', permanent: false, opacity: 1, direction: 'top', offset: [0, -4],
        })
        .addTo(group);
    });
  }, [odooServices]);

  return (
    <>
      <div id={containerId} style={{ width: '100%', height: '100%', borderRadius: 18, overflow: 'hidden' }} />
      <style>{`
        #${containerId} .leaflet-tile-pane { filter: brightness(0.9) saturate(1.1); }
        #${containerId} .leaflet-control-zoom a {
          background:#0a1a10 !important; color:${G} !important;
          border-color:${G}30 !important; font-family:monospace !important;
        }
        .noc-tooltip .leaflet-tooltip { background:transparent !important; border:none !important; box-shadow:none !important; }
        @keyframes noc-pulse {
          0%,100% { box-shadow:0 0 20px #00ff8888; transform:scale(1); }
          50%      { box-shadow:0 0 35px #00ff88cc; transform:scale(1.15); }
        }
        @keyframes dash-flow {
          to { stroke-dashoffset: -30; }
        }
        @keyframes dot-move {
          0%   { opacity:0; }
          10%  { opacity:1; }
          90%  { opacity:1; }
          100% { opacity:0; }
        }
      `}</style>
    </>
  );
}

// ── Arc drawing ───────────────────────────────────────────────────────────────
function drawArcs(map: any, L: any, svg: SVGSVGElement, cities: NOCCity[], selectedCityId: string | null) {
  // Clear old arcs
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  if (cities.length < 2) return;

  const core = cities.find(c => c.name === 'Monterrey') || cities[0];

  cities.forEach(city => {
    if (city.id === core.id) return;

    const p1 = map.latLngToContainerPoint([core.lat, core.lng]);
    const p2 = map.latLngToContainerPoint([city.lat, city.lng]);

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 5) return;

    // Control point — arc curvature
    const mx  = (p1.x + p2.x) / 2 - dy * 0.25;
    const my  = (p1.y + p2.y) / 2 + dx * 0.25;
    const d   = `M${p1.x},${p1.y} Q${mx},${my} ${p2.x},${p2.y}`;
    const col = nodeColor(city.score);
    const isSelected = city.id === selectedCityId || city.id === core.id;

    // Base arc
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', col);
    path.setAttribute('stroke-width', isSelected ? '1.5' : '0.8');
    path.setAttribute('stroke-dasharray', '8 6');
    path.setAttribute('opacity', isSelected ? '0.6' : '0.2');
    path.style.animation = `dash-flow ${2 + Math.random()}s linear infinite`;
    svg.appendChild(path);

    // Animated dot — represents data packet traveling the link
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', isSelected ? '4' : '2.5');
    dot.setAttribute('fill', col);
    dot.setAttribute('opacity', '0');
    dot.style.filter = `drop-shadow(0 0 4px ${col})`;
    dot.style.animation = `dot-move ${3 + Math.random() * 2}s ease-in-out infinite`;

    const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
    anim.setAttribute('dur', `${3 + Math.random() * 3}s`);
    anim.setAttribute('repeatCount', 'indefinite');
    anim.setAttribute('path', d);
    dot.appendChild(anim);
    svg.appendChild(dot);
  });
}
