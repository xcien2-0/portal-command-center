import { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../../../../config';
import brand from '../../../../brand';
import type { ThemeConfig } from '../../types';
import { buildTecnicoList, getLevel, LEVELS, type OdooCurso } from './shared';
import RutaEmpleado from './RutaEmpleado';

interface Props { theme: ThemeConfig; nombreTecnico: string; onExamen: () => void }

const GREEN = '#00C896';
const DIM   = '#6b7280';

const BADGES_DATA = [
  { icon: '🔧', name: 'Maestro Instalador', desc: '100% en Instalación',        req: 100, key: 'instalacion' },
  { icon: '📡', name: 'RF Pro',             desc: 'Dominio total Redes RF',     req: 90,  key: 'rf'          },
  { icon: '⭐', name: `Leyenda ${brand.name}`, desc: 'Avance ≥ 95% global',    req: 95,  key: 'leyenda'     },
  { icon: '🔥', name: 'Firewall Hero',      desc: 'Habilidad crítica',          req: 85,  key: 'firewall'    },
  { icon: '🏅', name: 'Top de Plaza',       desc: 'Mejor técnico en ciudad',    req: 80,  key: 'topplaza'    },
  { icon: '💥', name: 'Racha x5',           desc: '5 cursos completados 100%',  req: 100, key: 'racha'       },
];

function Ring({ pct, size = 80, stroke = 6, color = GREEN }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const [p, setP] = useState(0);
  useEffect(() => { const t = setTimeout(() => setP(pct), 150); return () => clearTimeout(t); }, [pct]);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${(p/100)*circ} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
}

function BarPct({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 1s ease' }} />
    </div>
  );
}

export default function AcademiaTecnico({ nombreTecnico, onExamen }: Props) {
  const [tab, setTab]         = useState<'perfil' | 'ruta'>('perfil');
  const [cursos, setCursos]   = useState<OdooCurso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/academia/cursos`)
      .then(r => r.ok ? r.json() : [])
      .then(setCursos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Cursos donde este técnico está inscrito
  const misCursos = useMemo(() =>
    cursos
      .map(c => {
        const m = c.members_list.find(x => x.name?.trim().toLowerCase() === nombreTecnico.trim().toLowerCase());
        return m ? { ...c, miPct: m.pct ?? 0 } : null;
      })
      .filter(Boolean) as (OdooCurso & { miPct: number })[],
    [cursos, nombreTecnico]
  );

  // Rank global
  const todos        = useMemo(() => buildTecnicoList(cursos), [cursos]);
  const miPerfil     = todos.find(t => t.name.toLowerCase() === nombreTecnico.toLowerCase());
  const avgGlobal    = miPerfil?.avgPct ?? 0;
  const nivel        = getLevel(avgGlobal);
  const rank         = miPerfil?.rank ?? 0;
  const totalTecnicos = todos.length;

  // Badges ganados (heurístico: basado en avgPct y completions)
  const completados100 = misCursos.filter(c => c.miPct === 100).length;
  const badgesGanados = BADGES_DATA.filter(b => {
    if (b.key === 'leyenda')    return avgGlobal >= 95;
    if (b.key === 'topplaza')   return rank <= 10;
    if (b.key === 'racha')      return completados100 >= 5;
    return avgGlobal >= b.req;
  });

  // Siguiente nivel
  const sigNivel = LEVELS.find(l => l.min > avgGlobal);
  const pctHastaSig = sigNivel ? Math.round(((avgGlobal - nivel.min) / (sigNivel.min - nivel.min)) * 100) : 100;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: DIM }}>
      <div style={{ width: 18, height: 18, border: `2px solid ${GREEN}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      Cargando tu perfil desde Odoo...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const sinCuenta = misCursos.length === 0 && !loading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#111827', borderRadius: 12, padding: 4, alignSelf: 'flex-start', border: '1px solid rgba(255,255,255,0.06)' }}>
        {([
          { id: 'perfil' as const, label: 'Mi Perfil',        icon: '👤' },
          { id: 'ruta'   as const, label: 'Mi Ruta',          icon: '🛤️' },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 20px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              background: tab === t.id ? GREEN : 'transparent',
              color: tab === t.id ? '#001a12' : DIM,
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Mi Ruta ──────────────────────────────────────────────────── */}
      {tab === 'ruta' && (
        <RutaEmpleado nombreUsuario={nombreTecnico} />
      )}

      {/* ── Mi Perfil ────────────────────────────────────────────────── */}
      {tab === 'perfil' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Hero: Perfil ─────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0d1117 0%, #111827 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Avatar + ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Ring pct={avgGlobal} size={96} stroke={6} color={nivel.color} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: nivel.color, lineHeight: 1 }}>{avgGlobal}%</span>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f9fafb' }}>{nombreTecnico}</h2>
            <span style={{ fontSize: 13, padding: '3px 12px', borderRadius: 20, background: `${nivel.color}15`, color: nivel.color, fontWeight: 700, border: `1px solid ${nivel.color}30` }}>
              {nivel.icon} {nivel.name}
            </span>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: DIM }}>
            Técnico de Campo · {brand.name}
          </p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Ranking global', value: rank > 0 ? `#${rank} de ${totalTecnicos}` : '—', color: rank <= 10 ? '#FFB703' : DIM },
              { label: 'Cursos inscritos', value: misCursos.length, color: '#4FC3F7' },
              { label: 'Completados al 100%', value: completados100, color: GREEN },
              { label: 'Badges ganados', value: badgesGanados.length, color: '#7c3aed' },
            ].map((s, i) => (
              <div key={i}>
                <p style={{ margin: 0, fontSize: 11, color: DIM, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</p>
                <p style={{ margin: '3px 0 0', fontSize: 20, fontWeight: 800, color: s.color as string }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Odoo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignSelf: 'flex-start' }}>
          <a href={`${brand.odooUrl}/slides`} target="_blank" rel="noreferrer"
            style={{ padding: '10px 20px', borderRadius: 10, background: GREEN, color: '#001a12', fontSize: 13, fontWeight: 800, textDecoration: 'none', textAlign: 'center', whiteSpace: 'nowrap' }}>
            Ir a mis cursos ↗
          </a>
          <button onClick={onExamen}
            style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Examen de Colocación
          </button>
        </div>
      </div>

      {sinCuenta && (
        <div style={{ background: 'rgba(255,183,3,0.06)', border: '1px solid rgba(255,183,3,0.2)', borderRadius: 12, padding: 20 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#FFB703' }}>
            ⚠ No se encontraron cursos de Odoo asociados a <strong>{nombreTecnico}</strong>. Verifica que tu cuenta de Odoo esté activa y tengas cursos inscritos.
          </p>
        </div>
      )}

      {/* ── Siguiente nivel ───────────────────────────────────────────── */}
      {sigNivel && (
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#f3f4f6' }}>
              Progreso hacia {sigNivel.icon} <span style={{ color: sigNivel.color }}>{sigNivel.name}</span>
            </p>
            <span style={{ fontSize: 12, color: DIM }}>{avgGlobal}% → {sigNivel.min}% requerido</span>
          </div>
          <BarPct pct={pctHastaSig} color={sigNivel.color} />
          <p style={{ margin: '8px 0 0', fontSize: 12, color: DIM }}>
            Necesitas {(sigNivel.min - avgGlobal).toFixed(1)}% más de avance promedio para llegar a {sigNivel.name}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* ── Mis Cursos ───────────────────────────────────────────────── */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#f3f4f6' }}>📚 Mis Cursos</p>
            <span style={{ fontSize: 11, color: DIM }}>{misCursos.length} inscritos</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
            {misCursos.length === 0 ? (
              <p style={{ color: DIM, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sin cursos inscritos en Odoo</p>
            ) : (
              [...misCursos].sort((a, b) => b.miPct - a.miPct).map(c => {
                const lv = getLevel(c.miPct);
                return (
                  <div key={c.id} style={{ padding: '12px 14px', background: '#0d1117', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{c.name}</p>
                      <span style={{ fontSize: 12, fontWeight: 800, color: lv.color, flexShrink: 0 }}>{c.miPct}%</span>
                    </div>
                    <BarPct pct={c.miPct} color={lv.color} />
                    {c.miPct === 100 && (
                      <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, color: GREEN, fontWeight: 700 }}>✓ Completado</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <a href={`${brand.odooUrl}/slides`} target="_blank" rel="noreferrer"
            style={{ display: 'block', marginTop: 14, textAlign: 'center', padding: '9px', borderRadius: 8, background: 'rgba(0,200,150,0.08)', border: `1px solid ${GREEN}20`, color: GREEN, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            Ver todos en Odoo eLearning →
          </a>
        </div>

        {/* ── Mis Badges ───────────────────────────────────────────────── */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#f3f4f6' }}>🏅 Mis Badges</p>
            <span style={{ fontSize: 11, color: DIM }}>{badgesGanados.length}/{BADGES_DATA.length} ganados</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {BADGES_DATA.map((b, i) => {
              const ganado = badgesGanados.includes(b);
              return (
                <div key={i} style={{ padding: '12px 14px', background: ganado ? 'rgba(255,183,3,0.04)' : '#0d1117', borderRadius: 10, border: `1px solid ${ganado ? 'rgba(255,183,3,0.2)' : 'rgba(255,255,255,0.04)'}`, opacity: ganado ? 1 : 0.45, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 22 }}>{b.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: ganado ? '#FFB703' : DIM }}>{b.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: DIM, lineHeight: 1.3 }}>{b.desc}</p>
                    </div>
                  </div>
                  {ganado && <p style={{ margin: '6px 0 0', fontSize: 10, color: GREEN, fontWeight: 700 }}>✓ Desbloqueado</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    )}
    </div>
  );
}
