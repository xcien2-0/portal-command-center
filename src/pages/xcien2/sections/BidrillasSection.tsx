import { ThemeConfig } from '../types';
import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../../../config';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TareaResumen {
  id: number;
  nombre: string;
  etapa: string;
  deadline: string | null;
  creado: string;
}

interface Mensaje {
  id: number;
  autor: string;
  fecha: string;
  cuerpo: string;
  tipo: string;
}

interface EtapaDisponible { id: number; nombre: string; }

interface TareaDetalle {
  id: number;
  nombre: string;
  descripcion: string;
  etapa_id: number | null;
  etapa: string;
  tecnicos: { id: number; nombre: string }[];
  cliente: string | null;
  proyecto: string | null;
  prioridad: 'normal' | 'alta';
  deadline: string | null;
  creado: string;
  mensajes: Mensaje[];
  etapas_disponibles: EtapaDisponible[];
}

interface Tecnico {
  id: string;
  odoo_id: number;
  nombre: string;
  alias: string;
  rol: string;
  total: number;
  abiertos: number;
  cerrados: number;
  pct_resolucion: number;
  tareas: TareaResumen[];
}

// ── Task Detail Drawer ────────────────────────────────────────────────────────
function TareaDrawer({
  taskId, theme, onClose, onUpdated,
}: { taskId: number; theme: ThemeConfig; onClose: () => void; onUpdated: () => void }) {
  const [detalle, setDetalle] = useState<TareaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cambiandoEtapa, setCambiando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchDetalle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/wfm/bidrillas/tarea/${taskId}`);
      if (res.ok) setDetalle(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDetalle(); }, [taskId]);
  useEffect(() => {
    if (detalle) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detalle?.mensajes.length]);

  const enviarComentario = async () => {
    if (!comentario.trim()) return;
    setEnviando(true);
    try {
      await fetch(`${API_BASE}/api/wfm/bidrillas/tarea/${taskId}/comentario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuerpo: comentario }),
      });
      setComentario('');
      await fetchDetalle();
    } finally { setEnviando(false); }
  };

  const cambiarEtapa = async (etapa_id: number) => {
    setCambiando(true);
    try {
      await fetch(`${API_BASE}/api/wfm/bidrillas/tarea/${taskId}/etapa`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa_id }),
      });
      await fetchDetalle();
      onUpdated();
    } finally { setCambiando(false); }
  };

  const etapaColor = (e: string) => {
    const s = e.toLowerCase();
    if (s.includes('done') || s.includes('resuel')) return '#00C896';
    if (s.includes('visit') || s.includes('campo'))  return '#FF6B35';
    return '#00B4D8';
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', justifyContent: 'flex-end',
    }}>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      />

      {/* Drawer */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 560,
        background: theme.bg, borderLeft: `1px solid ${theme.border}`,
        display: 'flex', flexDirection: 'column', height: '100%',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
      }}>

        {/* Drawer header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading
              ? <div style={{ color: theme.dim, fontSize: 13 }}>Cargando...</div>
              : <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, lineHeight: 1.3 }}>
                  {detalle?.nombre}
                </div>
            }
            {detalle && (
              <div style={{ fontSize: 11, color: theme.dim, marginTop: 4 }}>
                {detalle.cliente && <span>👤 {detalle.cliente} · </span>}
                <span>��� {detalle.proyecto}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: theme.dim, fontSize: 20,
            cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Drawer body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {detalle && (
            <>
              {/* Meta strip */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: `${etapaColor(detalle.etapa)}20`, color: etapaColor(detalle.etapa),
                  border: `1px solid ${etapaColor(detalle.etapa)}50`,
                }}>{detalle.etapa}</span>
                {detalle.prioridad === 'alta' && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FFB70320', color: '#FFB703', border: '1px solid #FFB70350' }}>
                    ⚡ ALTA PRIORIDAD
                  </span>
                )}
                {detalle.deadline && (
                  <span style={{ fontSize: 10, color: theme.dim }}>
                    📅 {new Date(detalle.deadline).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Técnicos */}
              {detalle.tecnicos.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: theme.dim, marginBottom: 6, textTransform: 'uppercase' }}>Asignado a</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {detalle.tecnicos.map(t => (
                      <span key={t.id} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: `${theme.accent}15`, color: theme.accent, border: `1px solid ${theme.accent}40` }}>
                        👷 {t.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Descripción */}
              {detalle.descripcion && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: theme.dim, marginBottom: 6, textTransform: 'uppercase' }}>Descripción</div>
                  <div style={{
                    fontSize: 11, color: theme.text, lineHeight: 1.6,
                    background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                    padding: '10px 12px', border: `1px solid ${theme.border}`,
                    maxHeight: 180, overflowY: 'auto', whiteSpace: 'pre-wrap',
                  }}>
                    {detalle.descripcion}
                  </div>
                </div>
              )}

              {/* Cambiar etapa */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: theme.dim, marginBottom: 8, textTransform: 'uppercase' }}>Cambiar etapa</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {detalle.etapas_disponibles.map(e => {
                    const active = e.id === detalle.etapa_id;
                    const col    = etapaColor(e.nombre);
                    return (
                      <button
                        key={e.id}
                        onClick={() => !active && cambiarEtapa(e.id)}
                        disabled={active || cambiandoEtapa}
                        style={{
                          padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: active ? 700 : 400,
                          background: active ? `${col}25` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${active ? col : theme.border}`,
                          color: active ? col : theme.dim,
                          cursor: active ? 'default' : 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {active ? '● ' : ''}{e.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chatter */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: theme.dim, marginBottom: 8, textTransform: 'uppercase' }}>
                  Chatter Odoo ({detalle.mensajes.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                  {detalle.mensajes.length === 0 && (
                    <div style={{ fontSize: 11, color: theme.dim, textAlign: 'center', padding: 16 }}>Sin mensajes aún</div>
                  )}
                  {detalle.mensajes.map(m => (
                    <div key={m.id} style={{
                      padding: '10px 12px', borderRadius: 10,
                      background: m.tipo === 'comment'
                        ? `${theme.accent}08`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${m.tipo === 'comment' ? theme.accent + '30' : theme.border}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent }}>{m.autor}</span>
                        <span style={{ fontSize: 9, color: theme.dim }}>
                          {new Date(m.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: theme.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.cuerpo}</div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Comentario input — fixed at bottom */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${theme.border}`, background: theme.bg }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) enviarComentario(); }}
              placeholder="Escribe un comentario... (⌘↵ para enviar)"
              rows={2}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, resize: 'none',
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`,
                color: theme.text, fontSize: 12, fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button
              onClick={enviarComentario}
              disabled={enviando || !comentario.trim()}
              style={{
                padding: '0 16px', borderRadius: 8, border: 'none',
                background: comentario.trim() ? theme.accent : 'rgba(255,255,255,0.06)',
                color: comentario.trim() ? '#000' : theme.dim,
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                transition: 'all 0.15s', alignSelf: 'stretch',
              }}
            >
              {enviando ? '...' : '↑ Enviar'}
            </button>
          </div>
          <div style={{ fontSize: 9, color: theme.dim, marginTop: 4 }}>El comentario se publicará en Odoo Field Service</div>
        </div>
      </div>
    </div>
  );
}

// ── Desempeño Tab ─────────────────────────────────────────────────────────────
interface DesempenoTecnico {
  odoo_id: number; alias: string; nombre: string; rank: number;
  total: number; cerradas: number; abiertos: number; mensajes: number;
  pct_resolucion: number; pct_doc: number; pct_vol: number; pct_puntual: number;
  score: number;
  detalle: { resolucion_pts: number; doc_pts: number; volumen_pts: number };
}

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function DesempenoTab({ theme }: { theme: ThemeConfig }) {
  const [data, setData]       = useState<{ tecnicos: DesempenoTecnico[]; formula: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/wfm/bidrillas/desempeno`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: theme.dim }}>Calculando scores desde Odoo...</div>;
  if (!data)   return null;

  const MEDAL = ['🥇','🥈','🥉'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Formula badge */}
      <div style={{ fontSize: 10, color: theme.dim, padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${theme.border}`, display: 'inline-block', alignSelf: 'flex-start' }}>
        📐 {data.formula}
      </div>

      {/* Ranking cards */}
      {data.tecnicos.map(t => {
        const scoreColor = t.score >= 70 ? '#00C896' : t.score >= 40 ? '#FFB703' : '#FF4757';
        return (
          <div key={t.odoo_id} style={{
            background: theme.card, borderRadius: 16, padding: 22,
            border: `1px solid ${t.rank === 1 ? '#FFD70050' : theme.border}`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Gold shimmer for #1 */}
            {t.rank === 1 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #FFD700, #FFA500, #FFD700)' }} />}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
              {/* Rank + medal */}
              <div style={{ textAlign: 'center', minWidth: 48 }}>
                <div style={{ fontSize: 28 }}>{MEDAL[t.rank - 1] ?? `#${t.rank}`}</div>
                <div style={{ fontSize: 9, color: theme.dim, fontWeight: 700 }}>RANK</div>
              </div>

              {/* Name + score */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>{t.alias}</div>
                <div style={{ fontSize: 10, color: theme.dim }}>{t.nombre}</div>
              </div>

              {/* Score circle */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: `conic-gradient(${scoreColor} ${t.score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: theme.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{t.score}</div>
                  <div style={{ fontSize: 7, color: theme.dim }}>/ 100</div>
                </div>
              </div>
            </div>

            {/* Metrics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Tareas cerradas', val: t.cerradas,           color: '#00C896' },
                { label: 'Tasa resolución', val: `${t.pct_resolucion}%`, color: t.pct_resolucion > 30 ? '#00C896' : '#FFB703' },
                { label: 'Mensajes Odoo',   val: t.mensajes,            color: '#00B4D8' },
                { label: 'Abiertas',        val: t.abiertos,            color: t.abiertos > 20 ? '#FF4757' : '#FFB703' },
              ].map(k => (
                <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.val}</div>
                  <div style={{ fontSize: 8, color: theme.dim, fontWeight: 700, marginTop: 2 }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Score breakdown bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Tasa de resolución', pts: t.detalle.resolucion_pts, max: 35, pct: t.pct_resolucion, color: '#00C896', weight: '35%' },
                { label: 'Documentación',       pts: t.detalle.doc_pts,        max: 35, pct: t.pct_doc,        color: '#00B4D8', weight: '35%' },
                { label: 'Volumen completado',  pts: t.detalle.volumen_pts,    max: 30, pct: t.pct_vol,        color: '#FF6B35', weight: '30%' },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: theme.dim, fontWeight: 600 }}>{m.label} <span style={{ color: theme.dim, opacity: 0.6 }}>({m.weight})</span></span>
                    <span style={{ fontSize: 9, color: m.color, fontWeight: 700 }}>{m.pts} / {m.max} pts — {m.pct}%</span>
                  </div>
                  <ScoreBar value={m.pts} max={m.max} color={m.color} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ fontSize: 10, color: theme.dim, textAlign: 'center', padding: '8px 0' }}>
        Datos calculados en tiempo real desde Odoo Field Service · Actualización automática
      </div>
    </div>
  );
}


// ── GPS Interfaces ────────────────────────────────────────────────────────────
interface Vehiculo {
  id: number;
  nombre: string;
  placa: string;
  lat: number;
  lng: number;
  velocidad: number;
  direccion: number;
  ultima_vez: string | null;
  ubicacion: string;
  activo: boolean;
}

function vehiculoIcon(activo: boolean) {
  const color = activo ? '#00ff88' : '#00B4D8';
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="${color}"/>
      ${activo ? `<circle cx="16" cy="16" r="14" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 2" opacity="0.5"/>` : ''}
    </svg>`);
  return L.divIcon({
    html: `<img src="data:image/svg+xml,${svg}" width="32" height="32"/>`,
    className: '', iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18],
  });
}

function MapFitter({ vehiculos }: { vehiculos: Vehiculo[] }) {
  const map = useMap();
  useEffect(() => {
    if (vehiculos.length === 0) return;
    const bounds = L.latLngBounds(vehiculos.map(v => [v.lat, v.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [vehiculos.length]);
  return null;
}

function GPSTab({ theme }: { theme: ThemeConfig }) {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [selected, setSelected]   = useState<Vehiculo | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchGPS = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/gps/vehiculos`);
      const data = await res.json();
      setVehiculos(data.vehiculos ?? []);
      setLastUpdate(new Date().toLocaleTimeString('es-MX'));
    } catch {
      // silently keep stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGPS();
    intervalRef.current = setInterval(fetchGPS, 90_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchGPS]);

  const activos  = vehiculos.filter(v => v.activo).length;
  const detenidos = vehiculos.length - activos;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: theme.dim }}>
      Conectando a TN360...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI bar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Total unidades', val: vehiculos.length, col: theme.accent },
          { label: 'En movimiento',  val: activos,           col: '#00ff88'  },
          { label: 'Detenidas',      val: detenidos,         col: '#FFB703'  },
        ].map(k => (
          <div key={k.label} style={{ flex: 1, minWidth: 100, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.col }}>{k.val}</div>
            <div style={{ fontSize: 10, color: theme.dim, marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
        <div style={{ flex: 1, minWidth: 100, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, color: theme.dim }}>Última actualización</div>
          <div style={{ fontSize: 13, color: theme.text, fontWeight: 600, marginTop: 2 }}>{lastUpdate}</div>
          <div style={{ fontSize: 9, color: theme.dim, marginTop: 2 }}>Refresco cada 90 seg</div>
        </div>
      </div>

      {/* Mapa + lista lado a lado */}
      <div style={{ display: 'flex', gap: 16, height: 480 }}>
        {/* Mapa */}
        <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: `1px solid ${theme.border}` }}>
          {vehiculos.length > 0 && (
            <MapContainer
              center={[vehiculos[0].lat, vehiculos[0].lng]}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              <MapFitter vehiculos={vehiculos} />
              {vehiculos.map(v => (
                <Marker
                  key={v.id}
                  position={[v.lat, v.lng]}
                  icon={vehiculoIcon(v.activo)}
                  eventHandlers={{ click: () => setSelected(v) }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'sans-serif', fontSize: 12, minWidth: 160 }}>
                      <b style={{ fontSize: 14 }}>{v.nombre}</b><br/>
                      <span style={{ color: '#666' }}>{v.placa}</span><br/>
                      <span style={{ color: v.activo ? '#00C896' : '#888' }}>
                        {v.activo ? '🟢 En movimiento' : '🔵 Detenido'}
                      </span><br/>
                      <b>{v.velocidad} km/h</b><br/>
                      <span style={{ color: '#666', fontSize: 10 }}>{v.ubicacion}</span><br/>
                      <span style={{ color: '#aaa', fontSize: 10 }}>{v.ultima_vez}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
          {vehiculos.length === 0 && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.dim }}>
              Sin datos de GPS disponibles
            </div>
          )}
        </div>

        {/* Lista de vehículos */}
        <div style={{ width: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {vehiculos.map(v => (
            <div
              key={v.id}
              onClick={() => setSelected(v)}
              style={{
                padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                background: selected?.id === v.id ? `${theme.accent}15` : theme.card,
                border: `1px solid ${selected?.id === v.id ? theme.accent + '60' : theme.border}`,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{v.nombre}</span>
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 10, background: v.activo ? '#00ff8820' : '#00B4D820', color: v.activo ? '#00ff88' : '#00B4D8' }}>
                  {v.activo ? '▶ mov' : '⏸ det'}
                </span>
              </div>
              <div style={{ fontSize: 10, color: theme.dim, marginTop: 3 }}>{v.placa}</div>
              <div style={{ fontSize: 10, color: theme.dim, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.ubicacion}</div>
              <div style={{ fontSize: 11, color: v.activo ? '#00ff88' : theme.dim, marginTop: 2, fontWeight: v.activo ? 700 : 400 }}>
                {v.velocidad > 0 ? `${v.velocidad} km/h` : 'Detenido'}
                <span style={{ color: theme.dim, fontWeight: 400 }}> · {v.ultima_vez}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detalle seleccionado */}
      {selected && (
        <div style={{ background: theme.card, border: `1px solid ${theme.accent}40`, borderRadius: 12, padding: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, color: theme.dim }}>UNIDAD</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>{selected.nombre}</div>
            <div style={{ fontSize: 11, color: theme.dim }}>{selected.placa}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: theme.dim }}>VELOCIDAD</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: selected.activo ? '#00ff88' : theme.accent }}>{selected.velocidad} <span style={{ fontSize: 12 }}>km/h</span></div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: theme.dim }}>RUMBO</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: theme.text }}>{selected.direccion}°</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: theme.dim }}>ÚLTIMA UBICACIÓN</div>
            <div style={{ fontSize: 12, color: theme.text, marginTop: 2 }}>{selected.ubicacion || '—'}</div>
            <div style={{ fontSize: 10, color: theme.dim, marginTop: 2 }}>{selected.ultima_vez}</div>
          </div>
          <button onClick={() => setSelected(null)} style={{ alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 6, background: 'transparent', border: `1px solid ${theme.border}`, color: theme.dim, cursor: 'pointer', fontSize: 11 }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Organizar Tab ─────────────────────────────────────────────────────────────

const ROLES_DISPONIBLES = ['Auxiliar', 'Técnico FO', 'Técnico RF/Microondas', 'Líder de Cuadrilla'];
const ZONAS = ['MTY Norte', 'MTY Sur', 'MTY Oriente', 'Saltillo', 'Piedras Negras', 'Nuevo Laredo', 'Reynosa', 'Cd. Victoria'];

const PLANTILLAS = [
  {
    id: 'ftth-basica',
    nombre: 'FTTH Básica',
    icon: '🔦',
    color: '#00B4D8',
    descripcion: 'Instalación residencial last-mile. 2 personas.',
    perfiles: ['Técnico FO', 'Auxiliar'],
    sla: '4 h/instalación',
    capacidad: '3 instalaciones/día',
  },
  {
    id: 'ftth-reforzada',
    nombre: 'FTTH Reforzada',
    icon: '⚡',
    color: '#00C896',
    descripcion: 'Proyectos empresariales o alta densidad. 3 personas.',
    perfiles: ['Líder de Cuadrilla', 'Técnico FO', 'Auxiliar'],
    sla: '6 h/instalación',
    capacidad: '2 proyectos/día',
  },
  {
    id: 'microondas',
    nombre: 'RF / Microondas',
    icon: '📡',
    color: '#FF6B35',
    descripcion: 'Enlace inalámbrico punto a punto. 2 personas especializadas.',
    perfiles: ['Técnico RF/Microondas', 'Técnico RF/Microondas'],
    sla: '8 h/enlace',
    capacidad: '1 enlace/día',
  },
  {
    id: 'mantenimiento',
    nombre: 'Mantenimiento Preventivo',
    icon: '🔧',
    color: '#FFB703',
    descripcion: 'Revisión y limpieza de nodos y splitters. 2 personas.',
    perfiles: ['Técnico FO', 'Auxiliar'],
    sla: '2 h/nodo',
    capacidad: '4 nodos/día',
  },
];

interface CuadrillaBuilt {
  id: string;
  nombre: string;
  plantilla: string;
  color: string;
  icon: string;
  zona: string;
  miembros: { nombre: string; rol: string; odoo_id: number }[];
  vehiculo: string;
  estado: 'activa' | 'en-campo' | 'en-pausa';
  creada: string;
}

function OrganizarTab({ theme, tecnicosPool }: { theme: ThemeConfig; tecnicosPool: Tecnico[] }) {
  const [plantillaActiva, setPlantillaActiva] = useState<string | null>(null);
  const [cuadrillas, setCuadrillas]           = useState<CuadrillaBuilt[]>([]);
  const [builder, setBuilder]                 = useState<{
    nombre: string; zona: string; vehiculo: string;
    miembros: { tecnico: Tecnico | null; rol: string }[];
  } | null>(null);
  const [vehiculos, setVehiculos]             = useState<{ nombre: string; placa: string }[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/gps/vehiculos`)
      .then(r => r.json())
      .then(d => setVehiculos(d.vehiculos ?? []))
      .catch(() => {});
  }, []);

  const plantillaSelected = PLANTILLAS.find(p => p.id === plantillaActiva);

  const iniciarBuilder = (plantilla: typeof PLANTILLAS[0]) => {
    setPlantillaActiva(plantilla.id);
    setBuilder({
      nombre: `${plantilla.nombre} — ${ZONAS[0]}`,
      zona: ZONAS[0],
      vehiculo: vehiculos[0]?.nombre ?? '',
      miembros: plantilla.perfiles.map(rol => ({ tecnico: null, rol })),
    });
  };

  const guardarCuadrilla = () => {
    if (!builder || !plantillaSelected) return;
    const nueva: CuadrillaBuilt = {
      id: crypto.randomUUID(),
      nombre: builder.nombre,
      plantilla: plantillaSelected.nombre,
      color: plantillaSelected.color,
      icon: plantillaSelected.icon,
      zona: builder.zona,
      vehiculo: builder.vehiculo,
      miembros: builder.miembros
        .filter(m => m.tecnico)
        .map(m => ({ nombre: m.tecnico!.alias, rol: m.rol, odoo_id: m.tecnico!.odoo_id })),
      estado: 'activa',
      creada: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };
    setCuadrillas(prev => [nueva, ...prev]);
    setBuilder(null);
    setPlantillaActiva(null);
  };

  const estadoColor = (e: CuadrillaBuilt['estado']) =>
    e === 'activa' ? '#00C896' : e === 'en-campo' ? '#FF6B35' : '#FFB703';

  const disponibles = tecnicosPool.filter(t =>
    !cuadrillas.some(c => c.miembros.some(m => m.odoo_id === t.odoo_id))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* KPI bar de cobertura */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Cuadrillas activas', val: cuadrillas.length, color: '#00C896', icon: '👷' },
          { label: 'Técnicos en pool',   val: tecnicosPool.length, color: theme.accent, icon: '🧑‍🔧' },
          { label: 'Disponibles',        val: disponibles.length, color: '#00B4D8', icon: '✅' },
          { label: 'Zonas cubiertas',    val: new Set(cuadrillas.map(c => c.zona)).size, color: '#FFB703', icon: '📍' },
        ].map(k => (
          <div key={k.label} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 22 }}>{k.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color, marginTop: 6 }}>{k.val}</div>
            <div style={{ fontSize: 10, color: theme.dim, marginTop: 2, fontWeight: 600 }}>{k.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Plantillas */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: theme.dim, marginBottom: 12, letterSpacing: 1 }}>
          PLANTILLAS DE CUADRILLA — selecciona una para armar tu equipo
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {PLANTILLAS.map(p => {
            const active = plantillaActiva === p.id;
            return (
              <div
                key={p.id}
                onClick={() => iniciarBuilder(p)}
                style={{
                  padding: '20px 22px', borderRadius: 14, cursor: 'pointer',
                  background: active ? `${p.color}12` : theme.card,
                  border: `1.5px solid ${active ? p.color : theme.border}`,
                  transition: 'all 0.15s', position: 'relative', overflow: 'hidden',
                }}
              >
                {active && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: p.color }} />}
                <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: active ? p.color : theme.text }}>{p.nombre}</div>
                <div style={{ fontSize: 11, color: theme.dim, marginTop: 4, lineHeight: 1.4 }}>{p.descripcion}</div>
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {p.perfiles.map((rol, i) => (
                    <span key={i} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: `${p.color}20`, color: p.color, fontWeight: 700 }}>{rol}</span>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: 9, color: theme.dim }}>⏱ {p.sla}</span>
                  <span style={{ fontSize: 9, color: theme.dim }}>📦 {p.capacidad}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Builder */}
      {builder && plantillaSelected && (
        <div style={{ background: theme.card, border: `1.5px solid ${plantillaSelected.color}50`, borderRadius: 18, padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: plantillaSelected.color }} />

          <div style={{ fontSize: 13, fontWeight: 800, color: plantillaSelected.color, marginBottom: 18 }}>
            {plantillaSelected.icon} ARMAR CUADRILLA — {plantillaSelected.nombre}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
            {/* Nombre */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: theme.dim, marginBottom: 5 }}>NOMBRE DE CUADRILLA</div>
              <input
                value={builder.nombre}
                onChange={e => setBuilder(b => b ? { ...b, nombre: e.target.value } : b)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`, color: theme.text, fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            {/* Zona */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: theme.dim, marginBottom: 5 }}>ZONA / PLAZA</div>
              <select
                value={builder.zona}
                onChange={e => setBuilder(b => b ? { ...b, zona: e.target.value } : b)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, fontSize: 12, outline: 'none' }}
              >
                {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            {/* Vehículo */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: theme.dim, marginBottom: 5 }}>VEHÍCULO ASIGNADO</div>
              <select
                value={builder.vehiculo}
                onChange={e => setBuilder(b => b ? { ...b, vehiculo: e.target.value } : b)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, fontSize: 12, outline: 'none' }}
              >
                <option value="">Sin asignar</option>
                {vehiculos.map(v => <option key={v.placa} value={v.nombre}>{v.nombre} · {v.placa}</option>)}
              </select>
            </div>
          </div>

          {/* Asignación de miembros */}
          <div style={{ fontSize: 9, fontWeight: 700, color: theme.dim, marginBottom: 10, letterSpacing: 1 }}>ASIGNAR TÉCNICOS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {builder.miembros.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', border: `1px solid ${theme.border}` }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: `${plantillaSelected.color}20`, color: plantillaSelected.color, flexShrink: 0 }}>
                  {m.rol}
                </span>
                <select
                  value={m.tecnico?.odoo_id ?? ''}
                  onChange={e => {
                    const tec = tecnicosPool.find(t => t.odoo_id === Number(e.target.value)) ?? null;
                    setBuilder(b => {
                      if (!b) return b;
                      const miembros = [...b.miembros];
                      miembros[idx] = { ...miembros[idx], tecnico: tec };
                      return { ...b, miembros };
                    });
                  }}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 8, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, fontSize: 12, outline: 'none' }}
                >
                  <option value="">— seleccionar técnico —</option>
                  {disponibles.map(t => (
                    <option key={t.odoo_id} value={t.odoo_id}>{t.alias} · {t.abiertos} tareas abiertas</option>
                  ))}
                  {m.tecnico && !disponibles.find(d => d.odoo_id === m.tecnico!.odoo_id) && (
                    <option value={m.tecnico.odoo_id}>{m.tecnico.alias} (en uso)</option>
                  )}
                </select>
                {m.tecnico && (
                  <span style={{ fontSize: 10, color: m.tecnico.abiertos > 10 ? '#FF4757' : '#00C896', fontWeight: 700, flexShrink: 0 }}>
                    {m.tecnico.abiertos} abiertas
                  </span>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button
              onClick={guardarCuadrilla}
              disabled={builder.miembros.every(m => !m.tecnico)}
              style={{
                padding: '9px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: plantillaSelected.color, color: '#000', fontWeight: 800, fontSize: 12,
                opacity: builder.miembros.every(m => !m.tecnico) ? 0.4 : 1,
              }}
            >
              ✅ Activar Cuadrilla
            </button>
            <button
              onClick={() => { setBuilder(null); setPlantillaActiva(null); }}
              style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.dim, fontSize: 12, cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Cuadrillas creadas */}
      {cuadrillas.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: theme.dim, marginBottom: 12, letterSpacing: 1 }}>
            CUADRILLAS ACTIVAS — {cuadrillas.length} equipo{cuadrillas.length > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {cuadrillas.map(c => (
              <div key={c.id} style={{ background: theme.card, border: `1px solid ${c.color}40`, borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: c.color }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 18 }}>{c.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: theme.text, marginTop: 4 }}>{c.nombre}</div>
                    <div style={{ fontSize: 10, color: theme.dim, marginTop: 2 }}>{c.plantilla} · {c.zona}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: `${estadoColor(c.estado)}20`, color: estadoColor(c.estado) }}>
                      ● {c.estado.toUpperCase()}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(['activa', 'en-campo', 'en-pausa'] as const).map(e => (
                        <button key={e} onClick={() => setCuadrillas(prev => prev.map(x => x.id === c.id ? { ...x, estado: e } : x))}
                          style={{ padding: '2px 7px', borderRadius: 6, border: `1px solid ${c.estado === e ? estadoColor(e) : theme.border}`, background: 'transparent', color: c.estado === e ? estadoColor(e) : theme.dim, fontSize: 8, cursor: 'pointer' }}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {c.miembros.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 8, background: `${c.color}15`, color: c.color, fontWeight: 700, flexShrink: 0 }}>{m.rol}</span>
                      <span style={{ fontSize: 11, color: theme.text }}>{m.nombre}</span>
                    </div>
                  ))}
                </div>
                {c.vehiculo && (
                  <div style={{ marginTop: 12, fontSize: 10, color: theme.dim }}>🚛 {c.vehiculo}</div>
                )}
                <div style={{ marginTop: 8, fontSize: 9, color: theme.dim }}>Creada {c.creada}</div>
                <button
                  onClick={() => setCuadrillas(prev => prev.filter(x => x.id !== c.id))}
                  style={{ position: 'absolute', top: 12, right: 12, padding: '2px 8px', borderRadius: 6, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.dim, fontSize: 9, cursor: 'pointer' }}
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {cuadrillas.length === 0 && !builder && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: theme.dim, fontSize: 12 }}>
          Selecciona una plantilla arriba para armar tu primera cuadrilla.
        </div>
      )}
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────
export default function BidrillasSection({ theme }: { theme: ThemeConfig }) {
  const [tab, setTab]                 = useState<'cuadrillas' | 'desempeno' | 'gps' | 'organizar'>('cuadrillas');
  const [tecnicos, setTecnicos]       = useState<Tecnico[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [selectedTask, setSelected]   = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/wfm/bidrillas`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTecnicos(data.tecnicos ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const now = Date.now();

  const etapaColor = (etapa: string) => {
    const e = etapa.toLowerCase();
    if (e.includes('done') || e.includes('resuel')) return '#00C896';
    if (e.includes('visit') || e.includes('campo'))  return '#FF6B35';
    return '#00B4D8';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: theme.text, margin: 0 }}>
            🔦 CUADRILLAS FIBRA ÓPTICA
          </h2>
          <p style={{ fontSize: 12, color: theme.dim, marginTop: 4 }}>
            Equipos de campo — datos en vivo desde Odoo Field Service
          </p>
        </div>
        <button onClick={fetchData} style={{ padding: '6px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${theme.border}`, color: theme.dim, fontSize: 11, cursor: 'pointer' }}>
          🔄 Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {([
          ['cuadrillas', '👷 Cuadrillas',    theme.accent],
          ['organizar',  '🏗️ Organizar',     '#00C896'],
          ['desempeno',  '🏆 Desempeño',     '#FFD700'],
          ['gps',        '🗺️ GPS en Vivo',   '#FF6B35'],
        ] as const).map(([id, label, col]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === id ? 700 : 400,
            background: tab === id ? `${col}20` : 'rgba(255,255,255,0.04)',
            color: tab === id ? col : theme.dim,
            boxShadow: tab === id ? `0 0 0 1.5px ${col}50` : 'none',
            transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* Organizar tab */}
      {tab === 'organizar' && <OrganizarTab theme={theme} tecnicosPool={tecnicos} />}

      {/* Desempeño tab */}
      {tab === 'desempeno' && <DesempenoTab theme={theme} />}

      {/* GPS tab */}
      {tab === 'gps' && <GPSTab theme={theme} />}

      {loading && tab === 'cuadrillas' && <div style={{ textAlign: 'center', padding: 60, color: theme.dim }}>Conectando a Odoo Field Service...</div>}
      {error   && tab === 'cuadrillas' && <div style={{ padding: 16, borderRadius: 8, background: '#FF475710', color: '#FF4757', fontSize: 12 }}>Error: {error}</div>}

      {/* Tarjetas de técnicos */}
      {tab === 'cuadrillas' && !loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
          {tecnicos.map(t => (
            <div key={t.id} style={{
              background: theme.card, border: `1px solid ${theme.border}`,
              borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: theme.accent }} />

              {/* Header técnico */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: theme.accent, letterSpacing: 1, marginBottom: 4 }}>FIBRA ÓPTICA</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>{t.alias}</div>
                  <div style={{ fontSize: 11, color: theme.dim, marginTop: 2 }}>{t.nombre}</div>
                  <div style={{ fontSize: 10, color: theme.accent, marginTop: 2, fontWeight: 600 }}>{t.rol}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: t.abiertos > 10 ? '#FF4757' : '#FFB703' }}>{t.abiertos}</div>
                  <div style={{ fontSize: 9, color: theme.dim, fontWeight: 700 }}>ABIERTAS</div>
                </div>
              </div>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
                {[
                  { label: 'Total',      val: t.total,               color: theme.text },
                  { label: 'Cerradas',   val: t.cerrados,            color: '#00C896' },
                  { label: 'Resolución', val: `${t.pct_resolucion}%`, color: t.pct_resolucion > 50 ? '#00C896' : '#FFB703' },
                ].map(k => (
                  <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px', border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: k.color }}>{k.val}</div>
                    <div style={{ fontSize: 9, color: theme.dim, fontWeight: 700 }}>{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Barra resolución */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div style={{ width: `${Math.min(t.pct_resolucion, 100)}%`, height: '100%', background: t.pct_resolucion > 50 ? '#00C896' : '#FFB703', borderRadius: 2 }} />
                </div>
              </div>

              {/* Tareas abiertas — clickeables */}
              {t.tareas.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: theme.dim, marginBottom: 8, textTransform: 'uppercase' }}>Tareas activas</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {t.tareas.map(tarea => {
                      const col     = etapaColor(tarea.etapa);
                      const overdue = tarea.deadline && new Date(tarea.deadline).getTime() < now;
                      return (
                        <div
                          key={tarea.id}
                          onClick={() => setSelected(tarea.id)}
                          style={{
                            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.03)',
                            border: `1px solid ${theme.border}`,
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = col + '60'; (e.currentTarget as HTMLElement).style.background = col + '08'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = theme.border; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: `${col}20`, color: col, flexShrink: 0 }}>
                              {tarea.etapa}
                            </span>
                            {overdue && <span style={{ fontSize: 8, color: '#FF4757', fontWeight: 700, flexShrink: 0 }}>⚠️</span>}
                            <span style={{ fontSize: 10, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {tarea.nombre}
                            </span>
                            <span style={{ fontSize: 9, color: theme.dim, flexShrink: 0 }}>→</span>
                          </div>
                          {tarea.deadline && (
                            <div style={{ fontSize: 8, color: overdue ? '#FF4757' : theme.dim, marginTop: 3 }}>
                              📅 {new Date(tarea.deadline).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {t.tareas.length === 0 && (
                <div style={{ fontSize: 11, color: theme.dim, textAlign: 'center', padding: 12 }}>✅ Sin tareas abiertas</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nota */}
      <div style={{ background: 'rgba(0,180,216,0.05)', border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, fontSize: 12, color: theme.dim }}>
        🔦 <b style={{ color: theme.text }}>Cuadrillas Fibra Óptica</b> — Datos en vivo desde <b>Odoo Field Service</b>.
        Haz clic en cualquier tarea para ver detalle, comentar o cambiar etapa. GPS en vivo vía <b>TN360</b>.
      </div>

      {/* Task Drawer */}
      {selectedTask !== null && (
        <TareaDrawer
          taskId={selectedTask}
          theme={theme}
          onClose={() => setSelected(null)}
          onUpdated={fetchData}
        />
      )}
    </div>
  );
}
