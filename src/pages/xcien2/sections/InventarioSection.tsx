import { useState, useCallback, useEffect, useRef } from 'react';
import { API_BASE as API } from '../../../config';
import {
  Search, X, ScanLine, ArrowLeft, Check,
  ChevronRight, RefreshCw,
  MapPin, User, Tag, AlertCircle, Layers, Printer
} from 'lucide-react';

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

// ── Sub: Inventory table ──────────────────────────────────────────────────────
function InventarioTab({ onScanActivo }: { onScanActivo: (a: Activo) => void }) {
  const [activos, setActivos]   = useState<Activo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterEst, setFilterEst] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await fetchActivos();
    setActivos(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const categorias = [...new Set(activos.map(a => a.categoria_label))];
  const estados    = [...new Set(activos.map(a => a.estado))];

  const filtered = activos.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || [a.activo_id, a.nombre, a.site, a.asignado_a, a.marca, a.modelo]
      .some(v => v?.toLowerCase().includes(q));
    return matchQ
      && (!filterEst || a.estado === filterEst)
      && (!filterCat || a.categoria_label === filterCat);
  });

  const stats = {
    total:  activos.length,
    activo: activos.filter(a => a.estado === 'activo').length,
    mant:   activos.filter(a => a.estado === 'en_mantenimiento').length,
    baja:   activos.filter(a => a.estado === 'dado_de_baja').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { label: 'Total', value: stats.total, color: T.blue },
          { label: 'Activos', value: stats.activo, color: T.teal },
          { label: 'Mantenimiento', value: stats.mant, color: T.yellow },
          { label: 'Baja', value: stats.baja, color: T.red },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            flex: 1, background: T.surface, border: `1px solid ${color}25`,
            borderRadius: 12, padding: '12px 16px',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <span style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'Oswald', lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: 9, color: T.dim, fontFamily: 'monospace', letterSpacing: 1 }}>{label.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: '0 12px', height: 40,
        }}>
          <Search size={14} color={T.dim} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar activo, site, asignado..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 13 }} />
          {search && <button onClick={() => setSearch('')}><X size={12} color={T.dim} /></button>}
        </div>

        <select value={filterEst} onChange={e => setFilterEst(e.target.value)} style={{
          background: T.surface, border: `1px solid ${T.border}`, color: T.text,
          borderRadius: 10, padding: '0 12px', fontSize: 12, height: 40, cursor: 'pointer',
        }}>
          <option value="">Estado</option>
          {estados.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
        </select>

        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{
          background: T.surface, border: `1px solid ${T.border}`, color: T.text,
          borderRadius: 10, padding: '0 12px', fontSize: 12, height: 40, cursor: 'pointer',
        }}>
          <option value="">Categoría</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button onClick={load} style={{
          background: T.surface, border: `1px solid ${T.border}`, color: T.dim,
          borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
        </button>
      </div>

      {/* Count */}
      <div style={{ fontSize: 11, color: T.dim, fontFamily: 'monospace' }}>
        {filtered.length} activos {(search || filterEst || filterCat) ? '(filtrado)' : 'registrados'}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: T.dim, padding: 40, fontSize: 13 }}>Cargando inventario...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: T.dim, padding: 40, fontSize: 13 }}>Sin resultados</div>
        ) : filtered.map(a => {
          const ec = ESTADO_COLOR[a.estado] || T.dim;
          return (
            <div key={a.activo_id}
              onClick={() => onScanActivo(a)}
              style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 12, padding: '12px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${T.teal}40`; (e.currentTarget as HTMLDivElement).style.background = T.card; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.background = T.surface; }}
            >
              {/* Status dot */}
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ec, flexShrink: 0, boxShadow: `0 0 6px ${ec}` }} />

              {/* Main info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.nombre}
                  </span>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: T.dim, flexShrink: 0 }}>{a.activo_id}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {a.site && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: T.dim }}>
                      <MapPin size={9} />{a.site}
                    </span>
                  )}
                  {a.asignado_a && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: T.dim }}>
                      <User size={9} />{a.asignado_a}
                    </span>
                  )}
                  {a.categoria_label && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: T.dim }}>
                      <Tag size={9} />{a.categoria_label}
                    </span>
                  )}
                </div>
              </div>

              {/* Right side */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: `${ec}15`, color: ec, border: `1px solid ${ec}30`,
                }}>
                  {a.estado.replace('_', ' ').toUpperCase()}
                </span>
                <span style={{ fontSize: 9, color: T.dim }}>{a.empresa.toUpperCase()}</span>
              </div>

              <ChevronRight size={14} color={T.dim} />
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
  xcien: '#00C896', luminet: '#4FC3F7', wispi: '#FFB703', huus: '#FF6B35',
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
    nombre: '', categoria: 'equipo_red', empresa: 'xcien', regimen: 'PROPIO',
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

// ── Main component ────────────────────────────────────────────────────────────
type TabId = 'inventario' | 'scanner' | 'etiquetas';
interface Props { theme?: any; initialTab?: TabId }

export default function InventarioSection({ initialTab = 'inventario' }: Props) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const [selectedActivo, setSelectedActivo] = useState<Activo | null>(null);

  const handleScanActivo = (a: Activo) => {
    setSelectedActivo(a);
    setTab('scanner');
  };

  const handleScanBack = () => {
    setSelectedActivo(null);
    setTab('inventario');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', color: T.text }}>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: T.surface, padding: 4, borderRadius: 12, alignSelf: 'flex-start' }}>
        {([
          ['inventario', 'Inventario',  Layers],
          ['scanner',    'Scanner',     ScanLine],
          ['etiquetas',  'Etiquetas',   Printer],
        ] as [TabId, string, any][]).map(([id, label, Icon]) => (
          <button key={id} onClick={() => { setTab(id); if (id !== 'scanner') setSelectedActivo(null); }} style={{
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

        {tab === 'etiquetas' && <EtiquetasTab />}
      </div>
    </div>
  );
}
