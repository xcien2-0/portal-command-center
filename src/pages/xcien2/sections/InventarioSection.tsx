import { useState, useCallback, useEffect, useRef } from 'react';
import { API_BASE as API } from '../../../config';
import {
  Search, X, ScanLine, ArrowLeft, Check,
  ChevronRight, RefreshCw,
  MapPin, User, Tag, AlertCircle, Layers, Printer, Truck, Warehouse
} from 'lucide-react';
import { useTabTrack } from '../../../hooks/useTabTrack';

// ── Palette ───────────────────────────────────────────────────────────────────
const T = {
  bg:      '#0f1923',
  surface: '#1a2733',
  card:    '#1e2f3d',
  border:  '#2a3f50',
  text:    '#F5F5F7',
  dim:     '#8ba3b8',
  teal:    '#00ff88',
  red:     '#ff3366',
  yellow:  '#ffcc00',
  blue:    '#60a5fa',
};

// ── Odoo types ────────────────────────────────────────────────────────────────
interface OdooProducto {
  id: number;
  name: string;
  default_code: string | false;
  categ_id: [number, string] | false;
  type: string;
  qty_available: number;
  virtual_available: number;
  uom_id: [number, string] | false;
}
interface OdooResumen {
  total_productos: number;
  con_stock: number;
  sin_stock: number;
  total_categorias: number;
  movimientos_2026: number;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Activo {
  activo_id: string; nombre: string;
  categoria: string; categoria_label: string;
  empresa: string; regimen: string;
  site: string; asignado_a: string;
  numero_serie: string; marca: string; modelo: string;
  costo_mensual: number; vencimiento_contrato: string;
  estado: string; notas: string;
  registrado_en: string; historial: any[];
}

type ScanState = 'idle' | 'found' | 'not-found' | 'move' | 'damage' | 'success';
type DamageType = 'tecnica' | 'liquidos' | 'electrico' | 'fisico' | 'desconocida' | null;

const ESTADO_COLOR: Record<string, string> = {
  activo:           T.teal,
  en_mantenimiento: T.yellow,
  dado_de_baja:     T.red,
  extraviado:       T.red,
};

const DAMAGE_OPTIONS = [
  { key: 'tecnica' as DamageType,     icon: '🔴', label: 'Falla técnica' },
  { key: 'liquidos' as DamageType,    icon: '💧', label: 'Daño por líquidos' },
  { key: 'electrico' as DamageType,   icon: '⚡', label: 'Daño eléctrico' },
  { key: 'fisico' as DamageType,      icon: '🔨', label: 'Daño físico' },
  { key: 'desconocida' as DamageType, icon: '❓', label: 'Causa desconocida' },
];

// ── API ───────────────────────────────────────────────────────────────────────
async function fetchOdooProductos(search = '', offset = 0, limit = 100): Promise<{ productos: OdooProducto[]; total: number }> {
  try {
    const p = new URLSearchParams({ offset: String(offset), limit: String(limit) });
    if (search) p.set('search', search);
    const r = await fetch(`${API}/api/inventario/odoo/productos?${p}`);
    return r.ok ? r.json() : { productos: [], total: 0 };
  } catch { return { productos: [], total: 0 }; }
}
async function fetchOdooResumen(): Promise<OdooResumen | null> {
  try { const r = await fetch(`${API}/api/inventario/odoo/resumen`); return r.ok ? r.json() : null; }
  catch { return null; }
}

async function fetchActivos(): Promise<Activo[]> {
  try { const r = await fetch(`${API}/api/activos`); return r.ok ? r.json() : []; }
  catch { return []; }
}
async function fetchActivo(id: string): Promise<Activo | null> {
  try { const r = await fetch(`${API}/api/activos/${id.toUpperCase()}`); return r.ok ? r.json() : null; }
  catch { return null; }
}
async function moverActivo(id: string, site: string, asig: string, motivo: string) {
  return fetch(`${API}/api/activos/${id}/mover`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nuevo_site: site, nuevo_asignado: asig, motivo }),
  });
}
async function emitirToken(tipo: string, empresa: string, extra: Record<string, any>) {
  return fetch(`${API}/api/tokens/emitir`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ empresa, tipo, oportunidad_id: extra.activo_id || '', cliente: extra.activo_id || '', vendedor: 'Scanner', extra }),
  }).catch(() => null);
}

// ── Sub: Odoo Inventory table ─────────────────────────────────────────────────
function InventarioTab({ onScanActivo: _onScanActivo }: { onScanActivo: (a: Activo) => void }) {
  const [productos, setProductos] = useState<OdooProducto[]>([]);
  const [resumen, setResumen]     = useState<OdooResumen | null>(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [inputVal, setInputVal]   = useState('');
  const [total, setTotal]         = useState(0);
  const [offset, setOffset]       = useState(0);
  const [filterStock, setFilterStock] = useState<'todos' | 'con_stock' | 'sin_stock'>('con_stock');
  const LIMIT = 80;
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q: string, off: number) => {
    setLoading(true);
    const [res, sum] = await Promise.all([
      fetchOdooProductos(q, off, LIMIT),
      off === 0 ? fetchOdooResumen() : Promise.resolve(null),
    ]);
    setProductos(res.productos);
    setTotal(res.total);
    if (sum) setResumen(sum);
    setLoading(false);
  }, []);

  useEffect(() => { load(search, 0); }, []);

  const handleSearch = (v: string) => {
    setInputVal(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(v);
      setOffset(0);
      load(v, 0);
    }, 350);
  };

  const filtered = filterStock === 'todos' ? productos
    : filterStock === 'con_stock' ? productos.filter(p => p.qty_available > 0)
    : productos.filter(p => p.qty_available <= 0);

  const stockColor = (qty: number) => qty > 10 ? T.teal : qty > 0 ? T.yellow : T.red;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 14 }}>

      {/* KPIs Odoo */}
      {resumen && (
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Productos', value: resumen.total_productos.toLocaleString(), color: T.blue },
            { label: 'Con stock', value: resumen.con_stock.toLocaleString(), color: T.teal },
            { label: 'Sin stock', value: resumen.sin_stock.toLocaleString(), color: T.yellow },
            { label: 'Movimientos 2026', value: resumen.movimientos_2026.toLocaleString(), color: '#a78bfa' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              flex: 1, background: T.surface, border: `1px solid ${color}25`,
              borderRadius: 12, padding: '10px 14px',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <span style={{ fontSize: 20, fontWeight: 900, color, fontFamily: 'Oswald', lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: 9, color: T.dim, fontFamily: 'monospace', letterSpacing: 1 }}>{label.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: '0 12px', height: 38,
        }}>
          <Search size={13} color={T.dim} />
          <input value={inputVal} onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar producto, SKU..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 13 }} />
          {inputVal && <button onClick={() => handleSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={12} color={T.dim} /></button>}
        </div>

        {(['con_stock', 'todos', 'sin_stock'] as const).map(f => (
          <button key={f} onClick={() => setFilterStock(f)} style={{
            background: filterStock === f ? `${T.teal}18` : T.surface,
            border: `1px solid ${filterStock === f ? T.teal : T.border}`,
            color: filterStock === f ? T.teal : T.dim,
            borderRadius: 10, padding: '0 12px', height: 38, fontSize: 11, cursor: 'pointer', fontWeight: filterStock === f ? 700 : 400,
          }}>
            {f === 'con_stock' ? 'Con stock' : f === 'sin_stock' ? 'Sin stock' : 'Todos'}
          </button>
        ))}

        <button onClick={() => load(search, offset)} style={{
          background: T.surface, border: `1px solid ${T.border}`, color: T.dim,
          borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
        </button>
      </div>

      {/* Count + fuente */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.dim, fontFamily: 'monospace' }}>
        <span>{filtered.length} de {total.toLocaleString()} productos · Odoo wispi17</span>
        {total > LIMIT && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { const o = Math.max(0, offset - LIMIT); setOffset(o); load(search, o); }}
              disabled={offset === 0} style={{ background: 'none', border: 'none', color: offset === 0 ? T.border : T.teal, cursor: offset === 0 ? 'default' : 'pointer', fontSize: 11 }}>← Anterior</button>
            <span>{Math.floor(offset / LIMIT) + 1} / {Math.ceil(total / LIMIT)}</span>
            <button onClick={() => { const o = offset + LIMIT; setOffset(o); load(search, o); }}
              disabled={offset + LIMIT >= total} style={{ background: 'none', border: 'none', color: offset + LIMIT >= total ? T.border : T.teal, cursor: offset + LIMIT >= total ? 'default' : 'pointer', fontSize: 11 }}>Siguiente →</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: T.dim, padding: 40, fontSize: 13 }}>Cargando desde Odoo...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: T.dim, padding: 40, fontSize: 13 }}>Sin resultados</div>
        ) : filtered.map(p => {
          const sc = stockColor(p.qty_available);
          const catName = Array.isArray(p.categ_id) ? p.categ_id[1] : '—';
          const uomName = Array.isArray(p.uom_id) ? p.uom_id[1] : '';
          return (
            <div key={p.id} style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: '10px 14px', cursor: 'default',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              {/* Stock dot */}
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc, flexShrink: 0, boxShadow: `0 0 5px ${sc}` }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                  {p.name}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {p.default_code && (
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: T.blue }}>SKU: {p.default_code}</span>
                  )}
                  <span style={{ fontSize: 10, color: T.dim }}>{catName}</span>
                </div>
              </div>

              {/* Stock */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: sc, fontFamily: 'Oswald' }}>
                  {p.qty_available % 1 === 0 ? p.qty_available : p.qty_available.toFixed(1)}
                </span>
                <span style={{ fontSize: 9, color: T.dim }}>{uomName || 'UND'}</span>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ── Sub: Scanner flow ─────────────────────────────────────────────────────────
function ScannerTab({ initialActivo, onBack }: { initialActivo?: Activo | null; onBack?: () => void }) {
  const [scanState, setScanState] = useState<ScanState>(initialActivo ? 'found' : 'idle');
  const [activo, setActivo]       = useState<Activo | null>(initialActivo || null);
  const [query, setQuery]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [nuevoSite, setNuevoSite] = useState('');
  const [nuevoAsig, setNuevoAsig] = useState('');
  const [damageType, setDamageType] = useState<DamageType>(null);
  const [damageNotes, setDamageNotes] = useState('');
  const [successMsg, setSuccessMsg]   = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialActivo) { setActivo(initialActivo); setScanState('found'); }
  }, [initialActivo]);

  useEffect(() => {
    if (scanState === 'success') {
      const t = setTimeout(() => { setScanState('idle'); setActivo(null); setQuery(''); setDamageType(null); setDamageNotes(''); if (onBack) onBack(); }, 2000);
      return () => clearTimeout(t);
    }
  }, [scanState]);

  const buscar = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    const found = await fetchActivo(id.trim());
    setLoading(false);
    if (found) { setActivo(found); setScanState('found'); }
    else setScanState('not-found');
  }, []);

  const handleMover = async () => {
    if (!activo || !nuevoSite.trim()) return;
    setLoading(true);
    await moverActivo(activo.activo_id, nuevoSite, nuevoAsig, 'Movimiento vía inventario');
    await emitirToken('agente_ia', activo.empresa, { activo_id: activo.activo_id, nombre: activo.nombre, accion: 'movimiento_activo', site_nuevo: nuevoSite, asignado_nuevo: nuevoAsig });
    setLoading(false);
    setSuccessMsg(`Movido a ${nuevoSite}`);
    setScanState('success');
  };

  const handleDamage = async () => {
    if (!activo || !damageType) return;
    setLoading(true);
    await emitirToken('agente_ia', activo.empresa, { activo_id: activo.activo_id, nombre: activo.nombre, accion: 'reporte_dano', tipo_dano: damageType, notas: damageNotes });
    setLoading(false);
    setSuccessMsg('Daño reportado');
    setScanState('success');
  };

  // Success screen
  if (scanState === 'success') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${T.teal}20`, border: `2px solid ${T.teal}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={32} color={T.teal} />
      </div>
      <p style={{ fontSize: 18, fontWeight: 800, color: T.teal }}>{successMsg || 'Operación completada'}</p>
      <p style={{ fontSize: 12, color: T.dim }}>Token de trazabilidad emitido</p>
    </div>
  );

  // Damage form
  if (scanState === 'damage') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <button onClick={() => setScanState('found')} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <ArrowLeft size={12} />Volver
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Reportar daño — {activo?.nombre}</span>
      </div>
      {DAMAGE_OPTIONS.map(opt => (
        <button key={opt.key} onClick={() => setDamageType(opt.key)} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
          background: damageType === opt.key ? `${T.red}15` : T.surface,
          border: `2px solid ${damageType === opt.key ? T.red : T.border}`,
          color: damageType === opt.key ? T.red : T.text, fontSize: 14, fontWeight: 600,
        }}>
          <span style={{ fontSize: 20 }}>{opt.icon}</span>{opt.label}
        </button>
      ))}
      <textarea value={damageNotes} onChange={e => setDamageNotes(e.target.value)} rows={3}
        placeholder="Descripción del daño (opcional)"
        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 12, padding: 14, fontSize: 13, resize: 'none', outline: 'none' }} />
      <button onClick={handleDamage} disabled={!damageType || loading} style={{
        background: T.red, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: !damageType || loading ? 0.4 : 1,
      }}>{loading ? 'Enviando...' : 'Reportar y emitir token'}</button>
    </div>
  );

  // Move form
  if (scanState === 'move') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => setScanState('found')} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <ArrowLeft size={12} />Volver
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.teal }}>{activo?.nombre}</span>
      </div>
      {[
        { label: 'Nuevo site / ubicación', val: nuevoSite, set: setNuevoSite, placeholder: 'Ej: Podi, Bodega MTY' },
        { label: 'Asignado a (opcional)', val: nuevoAsig, set: setNuevoAsig, placeholder: 'Nombre del técnico o área' },
      ].map(({ label, val, set, placeholder }) => (
        <div key={label}>
          <div style={{ fontSize: 11, color: T.dim, marginBottom: 6 }}>{label}</div>
          <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder} style={{
            width: '100%', background: T.surface, border: `1px solid ${T.border}`, color: T.text,
            borderRadius: 10, padding: '12px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box',
          }} />
        </div>
      ))}
      <button onClick={handleMover} disabled={!nuevoSite.trim() || loading} style={{
        background: T.teal, color: '#000', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 800, cursor: 'pointer', opacity: !nuevoSite.trim() || loading ? 0.4 : 1, marginTop: 4,
      }}>{loading ? 'Guardando...' : 'Confirmar movimiento'}</button>
    </div>
  );

  // Found detail
  if (scanState === 'found' && activo) {
    const ec = ESTADO_COLOR[activo.estado] || T.dim;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.dim, fontFamily: 'monospace', marginBottom: 2 }}>{activo.categoria_label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{activo.nombre}</div>
            {(activo.marca || activo.modelo) && <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>{activo.marca} {activo.modelo}</div>}
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: T.dim, background: T.surface, padding: '4px 8px', borderRadius: 6 }}>{activo.activo_id}</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: `${ec}15`, color: ec, border: `1px solid ${ec}30` }}>
            {activo.estado.replace('_', ' ').toUpperCase()}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: `${T.blue}15`, color: T.blue, border: `1px solid ${T.blue}30` }}>
            {activo.regimen}
          </span>
        </div>

        <div style={{ background: T.surface, borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Empresa',    activo.empresa.toUpperCase()],
            ['Site',       activo.site || '—'],
            ['Asignado a', activo.asignado_a || '—'],
            ['N° Serie',   activo.numero_serie],
            ['Registrado', activo.registrado_en?.slice(0, 10)],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: T.dim }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => { setNuevoSite(''); setNuevoAsig(''); setScanState('move'); }} style={{ background: T.teal, color: '#000', border: 'none', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
            Registrar movimiento
          </button>
          <button onClick={async () => {
            if (!activo) return;
            setLoading(true);
            await moverActivo(activo.activo_id, 'Almacén', 'Almacén', 'Devolución vía inventario');
            await emitirToken('agente_ia', activo.empresa, { activo_id: activo.activo_id, nombre: activo.nombre, accion: 'devolucion_almacen', site_anterior: activo.site });
            setLoading(false); setSuccessMsg('Devuelto a almacén'); setScanState('success');
          }} style={{ background: 'transparent', color: T.teal, border: `1.5px solid ${T.teal}40`, borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {loading ? 'Procesando...' : 'Devolver a almacén'}
          </button>
          <button onClick={() => setScanState('damage')} style={{ background: 'transparent', color: T.red, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Reportar daño
          </button>
          <a href={`${API}/api/activos/${activo.activo_id}/etiqueta`} target="_blank" rel="noreferrer" style={{ background: 'transparent', color: T.dim, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '11px', fontSize: 13, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            Ver etiqueta / imprimir
          </a>
        </div>
      </div>
    );
  }

  // Search / idle
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>Buscar activo por ID</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: T.surface, border: `1px solid ${scanState === 'not-found' ? T.red : T.border}`,
            borderRadius: 10, padding: '0 14px', height: 48,
          }}>
            <Search size={15} color={T.dim} />
            <input ref={inputRef} value={query}
              onChange={e => setQuery(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && buscar(query)}
              placeholder="ACT-PODI001"
              autoFocus
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 14, fontFamily: 'monospace' }} />
            {query && <button onClick={() => setQuery('')}><X size={12} color={T.dim} /></button>}
          </div>
          <button onClick={() => buscar(query)} disabled={loading || !query.trim()} style={{
            background: T.teal, color: '#000', border: 'none', borderRadius: 10, padding: '0 20px',
            fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: loading || !query.trim() ? 0.5 : 1,
          }}>{loading ? '...' : 'Buscar'}</button>
        </div>
        {scanState === 'not-found' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '10px 14px', background: `${T.red}12`, border: `1px solid ${T.red}25`, borderRadius: 10 }}>
            <AlertCircle size={14} color={T.red} />
            <span style={{ fontSize: 12, color: T.red }}>Activo no encontrado — verifica el ID</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: T.border }} />
        <span style={{ fontSize: 11, color: T.dim }}>o escanea un código</span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '30px 0' }}>
        <div style={{ position: 'relative', width: 140, height: 140 }}>
          {['topLeft','topRight','bottomLeft','bottomRight'].map((pos, i) => (
            <div key={pos} style={{
              position: 'absolute',
              top: i < 2 ? 0 : 'auto', bottom: i >= 2 ? 0 : 'auto',
              left: i % 2 === 0 ? 0 : 'auto', right: i % 2 === 1 ? 0 : 'auto',
            }}>
              <div style={{ width: 20, height: 3, background: T.teal }} />
              <div style={{ width: 3, height: 20, background: T.teal, marginTop: i < 2 ? 0 : -3 }} />
            </div>
          ))}
          <div style={{ position: 'absolute', left: 10, right: 10, height: 2, top: '50%', background: `${T.teal}60` }} />
          <ScanLine size={40} color={`${T.teal}30`} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        </div>
        <p style={{ fontSize: 12, color: T.dim, textAlign: 'center' }}>Apunta al código QR o barcode del activo</p>
      </div>
    </div>
  );
}

// ── Sub: Etiquetas tab ────────────────────────────────────────────────────────
const EMPRESA_COLOR: Record<string, string> = {
  empresa_a: '#00C896', luminet: '#4FC3F7', empresa_b: '#FFB703', huus: '#FF6B35',
};
const REGIMEN_COLOR: Record<string, string> = {
  PROPIO: '#00C896', RENTADO: '#FFB703', LEASING: '#4FC3F7',
  COMODATO: '#8B5CF6', COMPARTIDO: '#FF6B35',
};

interface ActivoEtiqueta {
  activo_id: string; nombre: string; categoria_label: string;
  empresa: string; regimen: string; site: string;
  numero_serie: string; ip?: string; categoria: string;
}
interface Tx {
  tx_id: string; empresa_origen: string; empresa_destino: string;
  concepto: string; precio_preferencial: number; fecha: string;
}

function EtiquetasTab() {
  const [activos, setActivos]         = useState<ActivoEtiqueta[]>([]);
  const [txs, setTxs]                 = useState<Tx[]>([]);
  const [subTab, setSubTab]           = useState<'activos' | 'transacciones'>('activos');
  const [filtroSite, setFiltroSite]   = useState('');
  const [filtroEmp, setFiltroEmp]     = useState('todas');
  const [online, setOnline]           = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [formData, setFormData]       = useState({
    nombre: '', categoria: 'equipo_red', empresa: 'empresa_a', regimen: 'PROPIO',
    site: '', numero_serie: '', marca: '', modelo: '', ip: '', network_code: 'X100',
  });

  const fetchAll = useCallback(async () => {
    try {
      const [ra, rt] = await Promise.all([
        fetch(`${API}/api/activos`).then(r => r.json()),
        fetch(`${API}/api/transacciones`).then(r => r.json()),
      ]);
      if (Array.isArray(ra) && ra.length) setActivos(ra);
      if (Array.isArray(rt) && rt.length) setTxs(rt);
      setOnline(true);
    } catch { setOnline(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/activos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData(f => ({ ...f, nombre: '', ip: '', numero_serie: '' }));
        fetchAll();
      }
    } catch { /* ignore */ }
  };

  const sites    = [...new Set(activos.map(a => a.site).filter(Boolean))];
  const empresas = [...new Set(activos.map(a => a.empresa))];
  const filtered = activos.filter(a =>
    (!filtroSite || a.site === filtroSite) &&
    (filtroEmp === 'todas' || a.empresa === filtroEmp)
  );

  const printUrl = () => {
    const p = new URLSearchParams();
    if (filtroEmp !== 'todas') p.set('empresa', filtroEmp);
    if (filtroSite) p.set('site', filtroSite);
    return `${API}/api/etiquetas/hoja${p.toString() ? '?' + p.toString() : ''}`;
  };

  const chip = (active: boolean, color = T.teal) => ({
    fontSize: 11, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
    border: `1px solid ${active ? color : T.border}`,
    background: active ? `${color}18` : 'transparent',
    color: active ? color : T.dim, fontWeight: active ? 600 : 400,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

      {/* Sub-tabs + new activo button */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={chip(subTab === 'activos')}       onClick={() => setSubTab('activos')}>📦 Activos ({activos.length})</button>
        <button style={chip(subTab === 'transacciones')} onClick={() => setSubTab('transacciones')}>🔄 Transacciones ({txs.length})</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
            background: online ? 'rgba(0,200,150,0.12)' : 'rgba(255,71,87,0.12)',
            color: online ? '#00C896' : '#FF4757',
            border: `1px solid ${online ? 'rgba(0,200,150,0.3)' : 'rgba(255,71,87,0.3)'}` }}>
            {online ? '● Conectado' : '● Sin conexión'}
          </span>
          <button style={chip(showForm, '#00C896')} onClick={() => setShowForm(v => !v)}>
            {showForm ? '✖ Cancelar' : '➕ Nuevo Activo'}
          </button>
        </div>
      </div>

      {/* New activo form */}
      {showForm && (
        <form onSubmit={handleRegister} style={{
          background: 'rgba(0,200,150,0.05)', border: '1px solid rgba(0,200,150,0.25)',
          borderRadius: 12, padding: 16,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10,
        }}>
          {[
            { label: 'Nombre del equipo', key: 'nombre', req: true, placeholder: 'PTP-Santa-Rosa' },
            { label: 'Dirección IP',      key: 'ip',     req: true, placeholder: '172.31.x.x', accent: true },
            { label: 'Código de red',     key: 'network_code', placeholder: 'X100' },
            { label: 'Site / Ciudad',     key: 'site',   placeholder: 'Monterrey' },
            { label: 'Marca / Modelo',    key: 'marca',  placeholder: 'MikroTik / Mimosa' },
          ].map(({ label, key, req, placeholder, accent: ac }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: T.dim }}>{label}</label>
              <input required={req}
                style={{ background: T.bg, border: `1px solid ${ac ? T.teal : T.border}`, color: T.text, padding: '6px 10px', borderRadius: 6, fontSize: 12, outline: 'none' }}
                value={(formData as any)[key]}
                onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} />
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" style={{ width: '100%', background: '#00C896', color: '#000', fontWeight: 800, fontSize: 11, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
              REGISTRAR Y SINCRONIZAR
            </button>
          </div>
        </form>
      )}

      {subTab === 'activos' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflow: 'hidden' }}>
          {/* Filters + print */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: T.dim }}>Site:</span>
              <button style={chip(!filtroSite)} onClick={() => setFiltroSite('')}>Todos</button>
              {sites.map(s => <button key={s} style={chip(filtroSite === s)} onClick={() => setFiltroSite(s)}>{s}</button>)}
            </div>
            <div style={{ width: 1, height: 18, background: T.border }} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: T.dim }}>Empresa:</span>
              <button style={chip(filtroEmp === 'todas')} onClick={() => setFiltroEmp('todas')}>Todas</button>
              {empresas.map(emp => <button key={emp} style={chip(filtroEmp === emp, EMPRESA_COLOR[emp])} onClick={() => setFiltroEmp(emp)}>{emp.toUpperCase()}</button>)}
            </div>
            <a href={printUrl()} target="_blank" rel="noreferrer" style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 8,
              background: T.teal, color: '#000', textDecoration: 'none',
            }}>
              <Printer size={13} /> Imprimir hoja ({filtered.length})
            </a>
          </div>

          {/* Grid */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: T.dim }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
                <div>No hay activos{filtroSite ? ` en ${filtroSite}` : ''}</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {filtered.map(a => {
                  const ec = EMPRESA_COLOR[a.empresa] || T.dim;
                  const rc = REGIMEN_COLOR[a.regimen]  || T.dim;
                  return (
                    <div key={a.activo_id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{a.nombre}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: `${rc}18`, color: rc, border: `1px solid ${rc}30`, flexShrink: 0, marginLeft: 6 }}>{a.regimen}</span>
                      </div>
                      <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, color: T.dim }}>{a.categoria_label}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: ec }}>{a.empresa.toUpperCase()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, color: T.dim }}>Site: {a.site || '—'}</span>
                          <span style={{ fontSize: 10, fontFamily: 'monospace', color: T.dim }}>{a.activo_id}</span>
                        </div>
                        {a.ip && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, padding: '2px 6px', background: 'rgba(0,255,136,0.05)', borderRadius: 4, border: '1px solid rgba(0,255,136,0.1)' }}>
                            <span style={{ fontSize: 9, fontWeight: 600, color: T.teal }}>IP</span>
                            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: T.teal }}>{a.ip}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '8px 14px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8 }}>
                        <a href={`${API}/api/etiquetas/activo/${a.activo_id}`} target="_blank" rel="noreferrer"
                          style={{ flex: 1, fontSize: 11, fontWeight: 600, padding: '6px 0', borderRadius: 6, background: `${T.teal}18`, color: T.teal, border: `1px solid ${T.teal}30`, textDecoration: 'none', textAlign: 'center' }}>
                          Ver etiqueta
                        </a>
                        <a href={`${API}/api/etiquetas/activo/${a.activo_id}`} download={`${a.activo_id}.png`}
                          style={{ flex: 1, fontSize: 11, fontWeight: 600, padding: '6px 0', borderRadius: 6, background: 'transparent', color: T.dim, border: `1px solid ${T.border}`, textDecoration: 'none', textAlign: 'center' }}>
                          Descargar
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Transacciones */
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {txs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: T.dim }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔄</div>
              <div>No hay transacciones registradas</div>
            </div>
          ) : [...txs].reverse().map(tx => {
            const co = EMPRESA_COLOR[tx.empresa_origen]  || T.dim;
            const cd = EMPRESA_COLOR[tx.empresa_destino] || T.dim;
            return (
              <div key={tx.tx_id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: `${co}18`, color: co }}>{tx.empresa_origen.toUpperCase()}</span>
                    <span style={{ fontSize: 11, color: T.dim }}>→</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: `${cd}18`, color: cd }}>{tx.empresa_destino.toUpperCase()}</span>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: T.dim }}>{tx.tx_id}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{tx.concepto}</div>
                  <div style={{ fontSize: 11, color: T.teal }}>
                    ${tx.precio_preferencial.toLocaleString('es-MX')} MXN · {new Date(tx.fecha).toLocaleDateString('es-MX')}
                  </div>
                </div>
                <a href={`${API}/api/etiquetas/transaccion/${tx.tx_id}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: 11, fontWeight: 600, padding: '7px 14px', borderRadius: 8, background: `${T.teal}18`, color: T.teal, border: `1px solid ${T.teal}30`, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  🖨️ Ver comprobante
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Odoo Inventario Tab ───────────────────────────────────────────────────────
interface OdooProducto {
  id: number; name: string; default_code: string | false;
  categ_id: [number, string] | false; type: string;
  qty_available: number; virtual_available: number;
  uom_id: [number, string] | false;
}
interface OdooResumen {
  total_productos: number; con_stock: number; sin_stock: number;
  total_categorias: number; movimientos_2026: number;
}

function OdooInventarioTab() {
  const [resumen, setResumen]         = useState<OdooResumen | null>(null);
  const [productos, setProductos]     = useState<OdooProducto[]>([]);
  const [total, setTotal]             = useState(0);
  const [search, setSearch]           = useState('');
  const [offset, setOffset]           = useState(0);
  const [loading, setLoading]         = useState(false);
  const [selected, setSelected]       = useState<OdooProducto | null>(null);
  const [quants, setQuants]           = useState<any[]>([]);
  const LIMIT = 50;

  const loadResumen = async () => {
    try {
      const r = await fetch(`${API}/api/inventario/odoo/resumen`);
      if (r.ok) setResumen(await r.json());
    } catch {}
  };

  const loadProductos = async (q: string, off: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: q, offset: String(off), limit: String(LIMIT) });
      const r = await fetch(`${API}/api/inventario/odoo/productos?${params}`);
      if (r.ok) {
        const data = await r.json();
        setProductos(data.productos || []);
        setTotal(data.total || 0);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadResumen(); loadProductos('', 0); }, []);

  const handleSearch = (v: string) => {
    setSearch(v); setOffset(0);
    loadProductos(v, 0);
  };

  const selectProducto = async (p: OdooProducto) => {
    setSelected(p);
    try {
      const r = await fetch(`${API}/api/inventario/odoo/stock-por-ubicacion/${p.id}`);
      if (r.ok) { const d = await r.json(); setQuants(d.quants || []); }
    } catch { setQuants([]); }
  };

  const tipoLabel: Record<string, string> = { product: 'Almacenable', consu: 'Consumible', service: 'Servicio' };
  const tipoColor: Record<string, string> = { product: T.teal, consu: T.yellow, service: T.blue };

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%', overflow: 'hidden' }}>

      {/* Left panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>

        {/* Resumen cards */}
        {resumen && (
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            {[
              { label: 'Total productos', value: resumen.total_productos, color: T.blue },
              { label: 'Con stock',       value: resumen.con_stock,       color: T.teal },
              { label: 'Sin stock',       value: resumen.sin_stock,       color: T.red },
              { label: 'Movimientos 2026',value: resumen.movimientos_2026, color: T.yellow },
            ].map(c => (
              <div key={c.label} style={{ flex: 1, background: T.card, border: `1px solid ${c.color}33`, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 14px', flexShrink: 0 }}>
          <Search size={14} color={T.dim} />
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar por nombre o código..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 13 }} />
          {search && <button onClick={() => handleSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, display: 'flex' }}><X size={13} /></button>}
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', borderRadius: 10, border: `1px solid ${T.border}` }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.dim }}>Cargando inventario Odoo...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.card, position: 'sticky', top: 0 }}>
                  {['Código','Nombre','Categoría','Tipo','Disponible','Unidad'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.dim, fontWeight: 600, borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productos.map(p => (
                  <tr key={p.id} onClick={() => selectProducto(p)}
                    style={{ borderBottom: `1px solid ${T.border}20`, cursor: 'pointer',
                      background: selected?.id === p.id ? `${T.teal}10` : 'transparent',
                      transition: 'background 0.15s' }}>
                    <td style={{ padding: '8px 12px', color: T.dim, fontFamily: 'monospace', fontSize: 11 }}>{p.default_code || '—'}</td>
                    <td style={{ padding: '8px 12px', color: T.text, maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    </td>
                    <td style={{ padding: '8px 12px', color: T.dim, fontSize: 10 }}>
                      {p.categ_id ? (p.categ_id[1] || '').split(' / ').pop() : '—'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ background: `${tipoColor[p.type] || T.dim}22`, color: tipoColor[p.type] || T.dim, borderRadius: 6, padding: '2px 7px', fontSize: 10 }}>
                        {tipoLabel[p.type] || p.type}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', color: p.qty_available > 0 ? T.teal : T.red, fontWeight: 700 }}>
                      {p.qty_available.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 12px', color: T.dim, fontSize: 10 }}>
                      {p.uom_id ? p.uom_id[1] : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, color: T.dim, fontSize: 11 }}>
          <span>{total.toLocaleString()} productos totales · mostrando {offset + 1}–{Math.min(offset + LIMIT, total)}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button disabled={offset === 0} onClick={() => { const o = Math.max(0, offset - LIMIT); setOffset(o); loadProductos(search, o); }}
              style={{ background: T.card, border: `1px solid ${T.border}`, color: offset === 0 ? T.border : T.dim, borderRadius: 6, padding: '4px 10px', cursor: offset === 0 ? 'default' : 'pointer', fontSize: 11 }}>← Anterior</button>
            <button disabled={offset + LIMIT >= total} onClick={() => { const o = offset + LIMIT; setOffset(o); loadProductos(search, o); }}
              style={{ background: T.card, border: `1px solid ${T.border}`, color: offset + LIMIT >= total ? T.border : T.dim, borderRadius: 6, padding: '4px 10px', cursor: offset + LIMIT >= total ? 'default' : 'pointer', fontSize: 11 }}>Siguiente →</button>
          </div>
        </div>
      </div>

      {/* Right detail panel */}
      {selected && (
        <div style={{ width: 300, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, background: `${tipoColor[selected.type] || T.dim}22`, color: tipoColor[selected.type] || T.dim, borderRadius: 6, padding: '3px 8px' }}>
              {tipoLabel[selected.type] || selected.type}
            </span>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: T.dim, cursor: 'pointer', display: 'flex' }}><X size={14} /></button>
          </div>

          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.4 }}>{selected.name}</div>
            {selected.default_code && <div style={{ fontSize: 11, color: T.dim, marginTop: 4, fontFamily: 'monospace' }}>{selected.default_code}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: T.surface, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.teal }}>{selected.qty_available.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: T.dim }}>Disponible</div>
            </div>
            <div style={{ background: T.surface, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.yellow }}>{selected.virtual_available.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: T.dim }}>Pronosticado</div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: T.dim }}>
            <div style={{ marginBottom: 4 }}>Categoría</div>
            <div style={{ color: T.text }}>{selected.categ_id ? selected.categ_id[1] : '—'}</div>
          </div>

          {selected.uom_id && (
            <div style={{ fontSize: 11, color: T.dim }}>
              <div style={{ marginBottom: 4 }}>Unidad de medida</div>
              <div style={{ color: T.text }}>{selected.uom_id[1]}</div>
            </div>
          )}

          {quants.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: T.dim, marginBottom: 8 }}>Stock por ubicación</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {quants.map((q, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: T.surface, borderRadius: 6, padding: '6px 10px' }}>
                    <span style={{ fontSize: 10, color: T.dim, flex: 1 }}>{q.location_id?.[1] || 'Ubicación'}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.teal }}>{q.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stock por Plaza ───────────────────────────────────────────────────────────
const PLAZAS = [
  { code: 'CDMX', name: 'CDMX', flag: '🏙️' },
  { code: 'MTY',  name: 'Monterrey', flag: '⛰️' },
  { code: 'QRO',  name: 'Querétaro', flag: '🏛️' },
  { code: 'GDL',  name: 'Guadalajara', flag: '🌵' },
];

function StockPlazasTab() {
  const [data, setData]       = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [plaza, setPlaza]     = useState('MTY');

  useEffect(() => {
    setLoading(true);
    Promise.all(PLAZAS.map(p =>
      fetch(`${API}/api/inv-transfers/stock/${p.code}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => [p.code, d])
    )).then(results => {
      const map: Record<string, any> = {};
      results.forEach(([code, d]) => { if (d) map[code as string] = d; });
      setData(map);
      setLoading(false);
    });
  }, []);

  const current = data[plaza];
  const products: any[] = current?.products || [];
  const totalItems = Object.values(data).reduce((acc, d) => acc + (d?.products?.length || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Resumen plazas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {PLAZAS.map(p => {
          const d = data[p.code];
          const prods = d?.products || [];
          const ok = prods.filter((x: any) => x.quantity > 0).length;
          const low = prods.filter((x: any) => x.quantity <= 0).length;
          return (
            <button key={p.code} onClick={() => setPlaza(p.code)} style={{
              background: plaza === p.code ? T.teal + '22' : T.surface,
              border: `2px solid ${plaza === p.code ? T.teal : T.border}`,
              borderRadius: 10, padding: '12px 10px', cursor: 'pointer',
              textAlign: 'left' as const, transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{p.flag}</div>
              <div style={{ color: T.text, fontWeight: 700, fontSize: 13 }}>{p.name}</div>
              <div style={{ color: T.dim, fontSize: 11, marginTop: 4 }}>
                {loading ? '...' : `${prods.length} productos`}
              </div>
              {!loading && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {ok > 0 && <span style={{ background: '#00ff8822', color: T.teal, borderRadius: 4, padding: '2px 6px', fontSize: 10 }}>✓ {ok}</span>}
                  {low > 0 && <span style={{ background: '#ff336622', color: T.red, borderRadius: 4, padding: '2px 6px', fontSize: 10 }}>⚠ {low}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Tabla de productos */}
      <div style={{ background: T.surface, borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}` }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: T.text, fontWeight: 700, fontSize: 13 }}>
            {PLAZAS.find(p => p.code === plaza)?.flag} Stock — {PLAZAS.find(p => p.code === plaza)?.name}
          </span>
          <span style={{ color: T.dim, fontSize: 11 }}>{products.length} productos</span>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' as const, color: T.dim }}>Cargando stock...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' as const, color: T.dim }}>Sin productos registrados en esta plaza</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <thead>
              <tr style={{ background: T.card }}>
                {['Referencia', 'Producto', 'Cantidad'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, color: T.dim, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p: any, i: number) => (
                <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.card + '44' }}>
                  <td style={{ padding: '10px 16px', color: T.dim, fontSize: 12, fontFamily: 'monospace' }}>{p.product_ref}</td>
                  <td style={{ padding: '10px 16px', color: T.text, fontSize: 12 }}>{p.product_name}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      background: p.quantity > 0 ? '#00ff8822' : '#ff336622',
                      color: p.quantity > 0 ? T.teal : T.red,
                      borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700,
                    }}>{p.quantity > 0 ? `+${p.quantity}` : p.quantity}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Equipos en Tránsito ───────────────────────────────────────────────────────
const ESTADO_COLOR: Record<string, string> = {
  draft:     '#8ba3b8',
  confirmed: '#ffcc00',
  shipped:   '#00aaff',
  received:  '#00ff88',
  cancelled: '#ff3366',
};
const ESTADO_LABEL: Record<string, string> = {
  draft:     'Borrador',
  confirmed: 'Confirmado',
  shipped:   'En camino',
  received:  'Recibido',
  cancelled: 'Cancelado',
};

function TransitoTab() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filtro, setFiltro]       = useState<string>('all');

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/inv-transfers/`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setTransfers(Array.isArray(d) ? d : d.transfers || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filtro === 'all' ? transfers : transfers.filter(t => t.state === filtro);
  const counts: Record<string, number> = {};
  transfers.forEach(t => { counts[t.state] = (counts[t.state] || 0) + 1; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filtros de estado */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
        {[['all', 'Todos', T.dim], ...Object.entries(ESTADO_LABEL).map(([k, v]) => [k, v, ESTADO_COLOR[k]])].map(([k, label, color]) => (
          <button key={k} onClick={() => setFiltro(k)} style={{
            background: filtro === k ? color + '33' : T.surface,
            border: `1px solid ${filtro === k ? color : T.border}`,
            color: filtro === k ? color : T.dim,
            borderRadius: 8, padding: '6px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
            {label} {k !== 'all' && counts[k] ? `(${counts[k]})` : k === 'all' ? `(${transfers.length})` : '(0)'}
          </button>
        ))}
        <button onClick={load} style={{ marginLeft: 'auto', background: T.surface, border: `1px solid ${T.border}`, color: T.dim, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 11 }}>
          ↻ Actualizar
        </button>
      </div>

      {/* Lista de transferencias */}
      {loading ? (
        <div style={{ padding: 32, textAlign: 'center' as const, color: T.dim }}>Cargando transferencias...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center' as const, color: T.dim }}>
          {filtro === 'shipped' ? '✅ Sin equipos en tránsito actualmente' : 'Sin transferencias en este estado'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((t: any) => {
            const color = ESTADO_COLOR[t.state] || T.dim;
            const totalPiezas = t.lines?.reduce((s: number, l: any) => s + (l.quantity || 0), 0) || 0;
            return (
              <div key={t.token_id} style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderLeft: `4px solid ${color}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: T.text, fontWeight: 700, fontSize: 13 }}>{t.token_name}</span>
                      <span style={{ background: color + '22', color, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                        {ESTADO_LABEL[t.state] || t.state}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: T.dim }}>
                      <span>📦 Origen: <b style={{ color: T.text }}>{t.origin_warehouse}</b></span>
                      <span>📍 Destino: <b style={{ color: T.text }}>{t.dest_warehouse}</b></span>
                      <span>🔢 {totalPiezas} piezas en {t.lines?.length || 0} líneas</span>
                      {t.created_at && <span>📅 {t.created_at.slice(0,10)}</span>}
                    </div>
                    {t.notes && <div style={{ fontSize: 11, color: T.dim, marginTop: 4, fontStyle: 'italic' }}>"{t.notes}"</div>}
                  </div>
                </div>
                {t.lines?.length > 0 && (
                  <div style={{ borderTop: `1px solid ${T.border}`, padding: '8px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                    {t.lines.map((l: any, i: number) => (
                      <span key={i} style={{ background: T.card, borderRadius: 6, padding: '3px 8px', fontSize: 11, color: T.text }}>
                        {l.product_name} × {l.quantity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
type TabId = 'inventario' | 'scanner' | 'etiquetas' | 'odoo' | 'plazas' | 'transito';
interface Props { theme?: any; initialTab?: TabId }

export default function InventarioSection({ initialTab = 'inventario' }: Props) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const trackTab = useTabTrack('inventario');
  const [selectedActivo, setSelectedActivo] = useState<Activo | null>(null);

  const handleScanActivo = (a: Activo) => {
    setSelectedActivo(a);
    trackTab('scanner');
    setTab('scanner');
  };

  const handleScanBack = () => {
    setSelectedActivo(null);
    trackTab('inventario');
    setTab('inventario');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', color: T.text }}>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: T.surface, padding: 4, borderRadius: 12, alignSelf: 'flex-start' }}>
        {([
          ['plazas',     'Stock por Plaza',    Warehouse],
          ['transito',   'En Tránsito',        Truck],
          ['inventario', 'Inventario Privado', Layers],
          ['odoo',       'Inventario Odoo',    Tag],
          ['scanner',    'Scanner',            ScanLine],
          ['etiquetas',  'Etiquetas',          Printer],
        ] as [TabId, string, any][]).map(([id, label, Icon]) => (
          <button key={id} onClick={() => { trackTab(id); setTab(id); if (id !== 'scanner') setSelectedActivo(null); }} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: tab === id ? T.teal : 'transparent',
            color: tab === id ? '#000' : T.dim,
            fontSize: 12, fontWeight: tab === id ? 800 : 500,
            transition: 'all 0.15s',
          }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'plazas'     && <StockPlazasTab />}
        {tab === 'transito'   && <TransitoTab />}
        {tab === 'inventario' && <InventarioTab onScanActivo={handleScanActivo} />}

        {tab === 'scanner' && (
          <div style={{ maxWidth: 520 }}>
            {selectedActivo && (
              <button onClick={handleScanBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.surface, border: `1px solid ${T.border}`, color: T.dim, borderRadius: 8, padding: '6px 12px', fontSize: 11, cursor: 'pointer', marginBottom: 16 }}>
                <ArrowLeft size={11} />Volver al inventario
              </button>
            )}
            <ScannerTab initialActivo={selectedActivo} onBack={handleScanBack} />
          </div>
        )}

        {tab === 'odoo' && <OdooInventarioTab />}
        {tab === 'etiquetas' && <EtiquetasTab />}
      </div>
    </div>
  );
}
