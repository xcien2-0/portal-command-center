/**
 * RutasEditor — Configurador de Rutas de Aprendizaje por Área.
 * Exclusivo para admin/director. Permite definir qué cursos de Odoo
 * forman la ruta obligatoria de cada área.
 */
import { useState, useEffect } from 'react';
import { API_BASE } from '../../../../config';
import type { OdooCurso } from './shared';

interface RutaCurso {
  curso_id: number;
  curso_name: string;
  orden: number;
  obligatorio: boolean;
}

interface Ruta {
  area: string;
  nombre: string;
  descripcion: string;
  cursos: RutaCurso[];
  color: string;
  icono: string;
  updated_at?: string;
}

interface Props {
  areas: string[];         // áreas disponibles desde RRHH
  cursosOdoo: OdooCurso[]; // catálogo completo de cursos Odoo
  onClose: () => void;
}

const GREEN  = '#00C896';
const DIM    = '#6b7280';
const ICONOS = ['🎓', '📡', '🔧', '⚙️', '💼', '🚛', '📊', '🛡️', '💻', '🔬'];
const COLORES = ['#00C896', '#4FC3F7', '#FFB703', '#FF4757', '#7c3aed', '#f97316'];

export default function RutasEditor({ areas, cursosOdoo, onClose }: Props) {
  const [rutas, setRutas]         = useState<Record<string, Ruta>>({});
  const [areaActiva, setArea]     = useState<string>(areas[0] ?? '');
  const [saving, setSaving]       = useState(false);
  const [busqueda, setBusqueda]   = useState('');
  const [msg, setMsg]             = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  // Ruta activa (o vacía)
  const rutaActiva: Ruta = rutas[areaActiva] ?? {
    area: areaActiva, nombre: `Ruta ${areaActiva}`, descripcion: '',
    cursos: [], color: GREEN, icono: '🎓',
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/academia/rutas`)
      .then(r => r.ok ? r.json() : {})
      .then(setRutas)
      .catch(() => {});
  }, []);

  const updateRuta = (patch: Partial<Ruta>) => {
    setRutas(prev => ({
      ...prev,
      [areaActiva]: { ...rutaActiva, ...patch },
    }));
  };

  const addCurso = (curso: OdooCurso) => {
    if (rutaActiva.cursos.some(c => c.curso_id === curso.id)) return;
    const nuevo: RutaCurso = {
      curso_id: curso.id, curso_name: curso.name,
      orden: rutaActiva.cursos.length + 1, obligatorio: true,
    };
    updateRuta({ cursos: [...rutaActiva.cursos, nuevo] });
  };

  const removeCurso = (id: number) => {
    updateRuta({ cursos: rutaActiva.cursos.filter(c => c.curso_id !== id).map((c, i) => ({ ...c, orden: i + 1 })) });
  };

  const toggleObligatorio = (id: number) => {
    updateRuta({ cursos: rutaActiva.cursos.map(c => c.curso_id === id ? { ...c, obligatorio: !c.obligatorio } : c) });
  };

  const moverCurso = (id: number, dir: -1 | 1) => {
    const arr = [...rutaActiva.cursos];
    const idx = arr.findIndex(c => c.curso_id === id);
    if (idx < 0) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    updateRuta({ cursos: arr.map((c, i) => ({ ...c, orden: i + 1 })) });
  };

  const guardar = async () => {
    setSaving(true); setMsg(null);
    try {
      const r = await fetch(`${API_BASE}/api/academia/rutas`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rutaActiva),
      });
      if (!r.ok) throw new Error(await r.text());
      setMsg({ tipo: 'ok', texto: `Ruta de "${areaActiva}" guardada ✓` });
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setMsg({ tipo: 'err', texto: String(e) });
    } finally {
      setSaving(false);
    }
  };

  const cursosFiltrados = cursosOdoo.filter(c =>
    !busqueda || c.name.toLowerCase().includes(busqueda.toLowerCase())
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '8px 12px', color: '#f3f4f6', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>🗺️ Editor de Rutas de Aprendizaje</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: DIM }}>Define la secuencia de cursos obligatorios por área</p>
        </div>
        <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: DIM, cursor: 'pointer', fontSize: 12 }}>
          Cerrar
        </button>
      </div>

      {msg && (
        <div style={{ marginBottom: 12, padding: '10px 16px', borderRadius: 8, background: msg.tipo === 'ok' ? 'rgba(0,200,150,0.1)' : 'rgba(255,71,87,0.1)', border: `1px solid ${msg.tipo === 'ok' ? 'rgba(0,200,150,0.3)' : 'rgba(255,71,87,0.3)'}`, color: msg.tipo === 'ok' ? GREEN : '#FF4757', fontSize: 13 }}>
          {msg.texto}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 260px', gap: 16, flex: 1, minHeight: 0 }}>

        {/* Columna 1: Áreas */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <p style={{ margin: 0, padding: '12px 14px', fontSize: 11, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>Áreas</p>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {areas.map(a => {
              const r = rutas[a];
              const isActive = a === areaActiva;
              return (
                <div key={a} onClick={() => setArea(a)} style={{
                  padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: isActive ? 'rgba(0,200,150,0.08)' : 'transparent',
                  borderLeft: `2px solid ${isActive ? GREEN : 'transparent'}`,
                  transition: 'all 0.12s',
                }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? '#f3f4f6' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r?.icono ?? '📁'} {a}
                  </p>
                  {r && <p style={{ margin: '2px 0 0', fontSize: 10, color: DIM }}>{r.cursos.length} cursos</p>}
                  {!r && <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(255,71,87,0.6)' }}>Sin ruta</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna 2: Editor de ruta activa */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          {/* Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: DIM, fontWeight: 700, display: 'block', marginBottom: 6 }}>NOMBRE DE LA RUTA</label>
              <input value={rutaActiva.nombre} onChange={e => updateRuta({ nombre: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: DIM, fontWeight: 700, display: 'block', marginBottom: 6 }}>DESCRIPCIÓN</label>
              <input value={rutaActiva.descripcion} onChange={e => updateRuta({ descripcion: e.target.value })} placeholder="Opcional…" style={inputStyle} />
            </div>
          </div>

          {/* Ícono y color */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 11, color: DIM, fontWeight: 700, display: 'block', marginBottom: 6 }}>ÍCONO</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {ICONOS.map(ic => (
                  <button key={ic} onClick={() => updateRuta({ icono: ic })} style={{
                    width: 32, height: 32, borderRadius: 6, border: `1px solid ${rutaActiva.icono === ic ? GREEN : 'rgba(255,255,255,0.1)'}`,
                    background: rutaActiva.icono === ic ? 'rgba(0,200,150,0.1)' : 'transparent', cursor: 'pointer', fontSize: 16,
                  }}>{ic}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: DIM, fontWeight: 700, display: 'block', marginBottom: 6 }}>COLOR</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {COLORES.map(cl => (
                  <button key={cl} onClick={() => updateRuta({ color: cl })} style={{
                    width: 24, height: 24, borderRadius: '50%', background: cl, cursor: 'pointer',
                    border: `2px solid ${rutaActiva.color === cl ? '#fff' : 'transparent'}`,
                  }} />
                ))}
              </div>
            </div>
          </div>

          {/* Cursos en la ruta */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#f3f4f6' }}>
              Secuencia de cursos — {rutaActiva.cursos.length} en la ruta
            </p>
            {rutaActiva.cursos.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: DIM, fontSize: 13, background: '#0d1117', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.08)' }}>
                Sin cursos. Agrega desde el catálogo →
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rutaActiva.cursos.map((c, i) => (
                  <div key={c.curso_id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: '#0d1117', borderRadius: 8,
                    border: `1px solid ${c.obligatorio ? 'rgba(255,255,255,0.06)' : 'rgba(255,183,3,0.15)'}`,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: rutaActiva.color, width: 22, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <p style={{ margin: 0, fontSize: 12, color: '#e5e7eb', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.curso_name}</p>
                    <button onClick={() => toggleObligatorio(c.curso_id)} style={{ padding: '2px 8px', borderRadius: 4, background: c.obligatorio ? 'rgba(0,200,150,0.1)' : 'rgba(255,183,3,0.1)', border: `1px solid ${c.obligatorio ? 'rgba(0,200,150,0.2)' : 'rgba(255,183,3,0.2)'}`, color: c.obligatorio ? GREEN : '#FFB703', fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 700 }}>
                      {c.obligatorio ? 'Obligatorio' : 'Opcional'}
                    </button>
                    <button onClick={() => moverCurso(c.curso_id, -1)} disabled={i === 0} style={{ background: 'none', border: 'none', color: i === 0 ? 'rgba(255,255,255,0.1)' : DIM, cursor: i === 0 ? 'default' : 'pointer', fontSize: 14, padding: '0 4px' }}>↑</button>
                    <button onClick={() => moverCurso(c.curso_id, 1)} disabled={i === rutaActiva.cursos.length - 1} style={{ background: 'none', border: 'none', color: i === rutaActiva.cursos.length - 1 ? 'rgba(255,255,255,0.1)' : DIM, cursor: i === rutaActiva.cursos.length - 1 ? 'default' : 'pointer', fontSize: 14, padding: '0 4px' }}>↓</button>
                    <button onClick={() => removeCurso(c.curso_id)} style={{ background: 'none', border: 'none', color: '#FF4757', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guardar */}
          <button onClick={guardar} disabled={saving} style={{
            padding: '11px 0', borderRadius: 10, background: GREEN, color: '#001a12',
            fontSize: 13, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1, border: 'none',
          }}>
            {saving ? 'Guardando…' : `Guardar Ruta — ${areaActiva}`}
          </button>
        </div>

        {/* Columna 3: Catálogo de cursos */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Catálogo Odoo</p>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Filtrar cursos…" style={{ ...inputStyle, padding: '6px 10px', fontSize: 12 }} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
            {cursosFiltrados.map(c => {
              const yaEsta = rutaActiva.cursos.some(r => r.curso_id === c.id);
              return (
                <div key={c.id} onClick={() => !yaEsta && addCurso(c)} style={{
                  padding: '9px 14px', cursor: yaEsta ? 'default' : 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  opacity: yaEsta ? 0.4 : 1,
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => !yaEsta && ((e.currentTarget as HTMLDivElement).style.background = 'rgba(0,200,150,0.06)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                >
                  <p style={{ margin: 0, fontSize: 12, color: yaEsta ? DIM : '#e5e7eb', lineHeight: 1.4 }}>{yaEsta ? '✓ ' : '+ '}{c.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: DIM }}>{c.members} inscritos · {c.avg_completion}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
