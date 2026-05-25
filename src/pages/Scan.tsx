import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, ChevronRight, Check, X, Search, ScanLine, Package } from 'lucide-react';
import { API_BASE as API } from '../config';
import brand from '../brand';

/* ── tokens ── */
const dk = {
  bg: '#0f1923', surface: '#1a2733', border: '#2a3f50',
  text: '#F5F5F7', textSec: '#8ba3b8',
  teal: '#12B886', red: '#FF3B30', blue: '#007AFF', amber: '#FF9500',
};

/* ── Types ── */
interface Activo {
  activo_id: string;
  nombre: string;
  categoria_label: string;
  empresa: string;
  regimen: string;
  site: string;
  asignado_a: string;
  numero_serie: string;
  marca: string;
  modelo: string;
  estado: string;
  registrado_en: string;
}

type PageState = 'scanning' | 'manual' | 'found' | 'not-found' | 'move' | 'damage' | 'success' | 'error';
type DamageType = 'tecnica' | 'liquidos' | 'electrico' | 'fisico' | 'desconocida' | null;

const damageOptions: { key: DamageType; icon: string; label: string }[] = [
  { key: 'tecnica',     icon: '🔴', label: 'Falla técnica' },
  { key: 'liquidos',    icon: '💧', label: 'Daño por líquidos' },
  { key: 'electrico',   icon: '⚡', label: 'Daño eléctrico' },
  { key: 'fisico',      icon: '🔨', label: 'Daño físico' },
  { key: 'desconocida', icon: '❓', label: 'Causa desconocida' },
];

const ESTADO_COLOR: Record<string, string> = {
  activo:           dk.teal,
  en_mantenimiento: dk.amber,
  dado_de_baja:     dk.red,
  extraviado:       dk.red,
};

/* ── API helpers ── */
async function fetchActivo(id: string): Promise<Activo | null> {
  try {
    const r = await fetch(`${API}/api/activos/${id.toUpperCase()}`);
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

async function moverActivo(id: string, site: string, asignado: string, motivo: string) {
  return fetch(`${API}/api/activos/${id}/mover`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nuevo_site: site, nuevo_asignado: asignado, motivo }),
  });
}

async function emitirToken(tipo: string, empresa: string, extra: Record<string, any>) {
  return fetch(`${API}/api/tokens/emitir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      empresa, tipo,
      oportunidad_id: extra.activo_id || '',
      cliente: extra.activo_id || '',
      vendedor: 'Scanner',
      extra,
    }),
  }).catch(() => null);
}

/* ── Component ── */
export default function Scan() {
  const navigate = useNavigate();
  const [state, setState]           = useState<PageState>('scanning');
  const [manualId, setManualId]     = useState('');
  const [activo, setActivo]         = useState<Activo | null>(null);
  const [loading, setLoading]       = useState(false);
  const [nuevoSite, setNuevoSite]   = useState('');
  const [nuevoAsig, setNuevoAsig]   = useState('');
  const [damageType, setDamageType] = useState<DamageType>(null);
  const [damageNotes, setDamageNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Simulate scan after 2.5s → go to manual entry
  useEffect(() => {
    if (state !== 'scanning') return;
    const t = setTimeout(() => { setState('manual'); setTimeout(() => inputRef.current?.focus(), 100); }, 2500);
    return () => clearTimeout(t);
  }, [state]);

  // Auto-reset after success
  useEffect(() => {
    if (state !== 'success') return;
    const t = setTimeout(() => { setState('scanning'); setActivo(null); setManualId(''); setDamageType(null); setDamageNotes(''); }, 2500);
    return () => clearTimeout(t);
  }, [state]);

  const buscar = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    const found = await fetchActivo(id.trim());
    setLoading(false);
    if (found) { setActivo(found); setState('found'); }
    else setState('not-found');
  }, []);

  const handleMover = useCallback(async () => {
    if (!activo || !nuevoSite.trim()) return;
    setLoading(true);
    await moverActivo(activo.activo_id, nuevoSite, nuevoAsig, 'Movimiento vía scanner');
    await emitirToken('agente_ia', activo.empresa, {
      activo_id: activo.activo_id,
      nombre: activo.nombre,
      accion: 'movimiento_activo',
      site_nuevo: nuevoSite,
      asignado_nuevo: nuevoAsig,
    });
    setLoading(false);
    setSuccessMsg(`Movido a ${nuevoSite}`);
    setState('success');
  }, [activo, nuevoSite, nuevoAsig]);

  const handleDamage = useCallback(async () => {
    if (!activo || !damageType) return;
    setLoading(true);
    await emitirToken('agente_ia', activo.empresa, {
      activo_id: activo.activo_id,
      nombre: activo.nombre,
      accion: 'reporte_dano',
      tipo_dano: damageType,
      notas: damageNotes,
    });
    setLoading(false);
    setSuccessMsg('Daño reportado y token emitido');
    setState('success');
  }, [activo, damageType, damageNotes]);

  /* ── SUCCESS ── */
  if (state === 'success') return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{ background: dk.teal }}>
      <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-6">
        <Check className="w-10 h-10 text-white" strokeWidth={3} />
      </div>
      <p className="text-white text-xl font-bold">✓ {successMsg || 'Operación completada'}</p>
      <p className="text-white/70 text-sm mt-2">Token de trazabilidad emitido</p>
    </div>
  );

  /* ── DAMAGE ── */
  if (state === 'damage') return (
    <div className="fixed inset-0 flex flex-col overflow-auto" style={{ background: dk.bg, color: dk.text }}>
      <div className="flex items-center h-14 px-4 shrink-0" style={{ borderBottom: `1px solid ${dk.border}` }}>
        <button onClick={() => setState('found')}><ArrowLeft className="w-5 h-5" /></button>
        <span className="flex-1 text-center text-sm font-medium">Reportar daño — {activo?.nombre}</span>
      </div>
      <div className="flex-1 p-4 space-y-3 overflow-auto pb-28">
        {damageOptions.map(opt => (
          <button key={opt.key} onClick={() => setDamageType(opt.key)}
            className="w-full flex items-center gap-3 p-4 rounded-xl transition-all"
            style={{ background: dk.surface, border: `2px solid ${damageType === opt.key ? dk.red : dk.border}`, color: damageType === opt.key ? dk.red : dk.text, minHeight: 64 }}>
            <span className="text-2xl">{opt.icon}</span>
            <span className="text-[15px] font-medium">{opt.label}</span>
          </button>
        ))}
        <textarea value={damageNotes} onChange={e => setDamageNotes(e.target.value)} rows={3}
          placeholder="Descripción del daño (opcional)"
          className="w-full rounded-xl p-4 text-sm resize-none outline-none"
          style={{ background: dk.surface, border: `1px solid ${dk.border}`, color: dk.text }} />
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6" style={{ background: dk.bg }}>
        <button onClick={handleDamage} disabled={!damageType || loading}
          className="w-full rounded-xl text-white font-semibold text-[15px] disabled:opacity-40"
          style={{ background: dk.red, height: 56 }}>
          {loading ? 'Enviando...' : 'Reportar y emitir token'}
        </button>
      </div>
    </div>
  );

  /* ── MOVE ── */
  if (state === 'move') return (
    <div className="fixed inset-0 flex flex-col" style={{ background: dk.bg, color: dk.text }}>
      <div className="flex items-center h-14 px-4 shrink-0" style={{ borderBottom: `1px solid ${dk.border}` }}>
        <button onClick={() => setState('found')}><ArrowLeft className="w-5 h-5" /></button>
        <span className="flex-1 text-center text-sm font-medium">Mover activo</span>
      </div>
      <div className="flex-1 p-5 space-y-4">
        <p className="text-sm font-semibold" style={{ color: dk.teal }}>{activo?.nombre}</p>
        <div>
          <label className="text-xs mb-1 block" style={{ color: dk.textSec }}>Nuevo site / ubicación</label>
          <input value={nuevoSite} onChange={e => setNuevoSite(e.target.value)}
            placeholder="Ej: Podi, Bodega MTY, Oficina CDMX"
            className="w-full rounded-xl p-4 text-[15px] outline-none"
            style={{ background: dk.surface, border: `1px solid ${dk.border}`, color: dk.text }} />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: dk.textSec }}>Asignado a (opcional)</label>
          <input value={nuevoAsig} onChange={e => setNuevoAsig(e.target.value)}
            placeholder="Nombre del técnico o área"
            className="w-full rounded-xl p-4 text-[15px] outline-none"
            style={{ background: dk.surface, border: `1px solid ${dk.border}`, color: dk.text }} />
        </div>
      </div>
      <div className="p-4 pb-8">
        <button onClick={handleMover} disabled={!nuevoSite.trim() || loading}
          className="w-full rounded-xl text-white font-semibold text-[15px] disabled:opacity-40"
          style={{ background: dk.teal, height: 56 }}>
          {loading ? 'Guardando...' : 'Confirmar movimiento'}
        </button>
      </div>
    </div>
  );

  /* ── FOUND ── */
  if (state === 'found' && activo) {
    const estadoColor = ESTADO_COLOR[activo.estado] || dk.textSec;
    return (
      <div className="fixed inset-0 flex flex-col overflow-auto" style={{ background: dk.bg, color: dk.text }}>
        <div className="flex items-center h-14 px-4 shrink-0" style={{ borderBottom: `1px solid ${dk.border}` }}>
          <button onClick={() => setState('manual')}><ArrowLeft className="w-5 h-5" /></button>
          <span className="flex-1 text-center text-sm font-medium">Activo encontrado</span>
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: dk.surface, color: dk.textSec }}>{activo.activo_id}</span>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4 pb-28 space-y-4">
          {/* Header */}
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: dk.textSec }}>{activo.categoria_label}</p>
            <p className="text-[22px] font-bold" style={{ color: dk.text }}>{activo.nombre}</p>
            {(activo.marca || activo.modelo) && (
              <p className="text-sm mt-1" style={{ color: dk.textSec }}>{activo.marca} {activo.modelo}</p>
            )}
          </div>

          {/* Status */}
          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: `${estadoColor}15`, border: `1.5px solid ${estadoColor}40`, color: estadoColor }}>
              <span className="w-2 h-2 rounded-full" style={{ background: estadoColor }} />
              {activo.estado.replace('_', ' ').toUpperCase()}
            </span>
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: `${dk.blue}15`, border: `1.5px solid ${dk.blue}40`, color: dk.blue }}>
              {activo.regimen}
            </span>
          </div>

          <div className="h-px" style={{ background: dk.border }} />

          {/* Details */}
          <div className="space-y-3">
            {[
              ['Empresa',    activo.empresa.toUpperCase()],
              ['Site',       activo.site || '—'],
              ['Asignado a', activo.asignado_a || '—'],
              ['N° Serie',   activo.numero_serie],
              ['Registrado', activo.registrado_en?.slice(0,10)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-sm" style={{ color: dk.textSec }}>{label}</span>
                <span className="text-sm font-medium" style={{ color: dk.text }}>{value}</span>
              </div>
            ))}
          </div>

          <div className="h-px" style={{ background: dk.border }} />

          {/* Actions */}
          <div className="space-y-2 pb-4">
            <button onClick={() => { setNuevoSite(''); setNuevoAsig(''); setState('move'); }}
              className="w-full rounded-xl text-white font-semibold text-[15px]"
              style={{ background: dk.teal, height: 56 }}>
              Registrar movimiento
            </button>
            <button onClick={async () => {
                if (!activo) return;
                setLoading(true);
                await moverActivo(activo.activo_id, 'Almacén', 'Almacén', 'Devolución a almacén vía scanner');
                await emitirToken('agente_ia', activo.empresa, {
                  activo_id: activo.activo_id,
                  nombre: activo.nombre,
                  accion: 'devolucion_almacen',
                  site_anterior: activo.site,
                });
                setLoading(false);
                setSuccessMsg('Devuelto a almacén');
                setState('success');
              }}
              className="w-full rounded-xl font-semibold text-[15px]"
              style={{ border: `1.5px solid ${dk.teal}`, color: dk.teal, height: 52 }}>
              {loading ? 'Procesando...' : 'Devolver a almacén'}
            </button>
            <button onClick={() => setState('damage')}
              className="w-full rounded-xl font-medium text-[15px]"
              style={{ border: `1.5px solid ${dk.border}`, color: dk.red, height: 52 }}>
              Reportar daño
            </button>
            <a href={`${API}/api/activos/${activo.activo_id}/etiqueta`} target="_blank" rel="noreferrer"
              className="w-full rounded-xl font-medium text-[15px] flex items-center justify-center"
              style={{ border: `1.5px solid ${dk.border}`, color: dk.textSec, height: 52 }}>
              Ver etiqueta / imprimir
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── SCANNING + MANUAL ── */
  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: dk.bg }}>
      {/* Camera area */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at center, ${dk.surface} 0%, ${dk.bg} 100%)` }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 100%)' }} />

        <div className="absolute top-0 left-0 right-0 flex items-center h-14 px-4 z-10">
          <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" style={{ color: dk.text }} /></button>
          <span className="flex-1 text-center text-sm font-medium" style={{ color: dk.text }}>{brand.scannerLabel}</span>
        </div>

        {state === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="relative" style={{ width: 220, height: 220 }}>
              {['top-0 left-0','top-0 right-0','bottom-0 left-0','bottom-0 right-0'].map((pos, i) => (
                <React.Fragment key={i}>
                  <div className={`absolute ${pos}`} style={{ width: 24, height: 3, background: dk.teal }} />
                  <div className={`absolute ${pos}`} style={{ width: 3, height: 24, background: dk.teal }} />
                </React.Fragment>
              ))}
              <div className="absolute left-3 right-3 h-[2px]" style={{ top: '50%', background: `${dk.teal}80` }} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      <div className="shrink-0 rounded-t-[20px]" style={{ background: dk.surface, minHeight: state === 'manual' ? '50vh' : 120 }}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: dk.border }} />
        </div>

        {state === 'scanning' ? (
          <div className="px-6 pb-6 text-center">
            <p className="text-[15px] mb-2" style={{ color: dk.textSec }}>Apunta al código QR o barcode del activo</p>
            <button onClick={() => { setState('manual'); setTimeout(() => inputRef.current?.focus(), 100); }}
              className="text-sm font-medium" style={{ color: dk.teal }}>
              Ingresar ID manualmente
            </button>
          </div>
        ) : (
          <div className="px-5 pb-8 space-y-4">
            <p className="text-[15px] font-semibold" style={{ color: dk.text }}>Buscar activo por ID</p>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 rounded-xl px-4" style={{ background: dk.bg, border: `1px solid ${state === 'not-found' ? dk.red : dk.border}`, height: 52 }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: dk.textSec }} />
                <input
                  ref={inputRef}
                  value={manualId}
                  onChange={e => setManualId(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && buscar(manualId)}
                  placeholder="ACT-PODI001"
                  className="flex-1 bg-transparent outline-none text-[15px] font-mono"
                  style={{ color: dk.text }}
                />
                {manualId && <button onClick={() => setManualId('')}><X className="w-4 h-4" style={{ color: dk.textSec }} /></button>}
              </div>
              <button onClick={() => buscar(manualId)} disabled={loading || !manualId.trim()}
                className="rounded-xl px-5 font-semibold text-sm disabled:opacity-40"
                style={{ background: dk.teal, color: '#fff' }}>
                {loading ? '...' : 'Buscar'}
              </button>
            </div>

            {state === 'not-found' && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: `${dk.red}15`, border: `1px solid ${dk.red}30` }}>
                <X className="w-4 h-4" style={{ color: dk.red }} />
                <span className="text-sm" style={{ color: dk.red }}>Activo no encontrado — verifica el ID</span>
              </div>
            )}

            <p className="text-xs text-center pt-2" style={{ color: dk.textSec }}>
              Formato: <span className="font-mono" style={{ color: dk.teal }}>ACT-PODI001</span> · <span className="font-mono" style={{ color: dk.teal }}>ACT-XXXXXX</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
