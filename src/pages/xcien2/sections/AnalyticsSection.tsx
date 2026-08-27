import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_BASE } from '../../../config';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, ArrowRight, RefreshCw, Lightbulb, Tag } from 'lucide-react';

// Áreas compartidas con AdopcionSection
const AREAS_DEF = [
  { rol: 'director',  label: 'Dirección General',  icon: '🏢', color: '#7c3aed' },
  { rol: 'noc',       label: 'NOC',                 icon: '📡', color: '#0ea5e9' },
  { rol: 'wfm',       label: 'Operaciones / WFM',   icon: '🏗️', color: '#f59e0b' },
  { rol: 'comercial', label: 'Comercial',            icon: '💰', color: '#10b981' },
  { rol: 'preventa',  label: 'Preventa',             icon: '📐', color: '#06b6d4' },
  { rol: 'almacen',   label: 'Almacén',              icon: '📦', color: '#f97316' },
  { rol: 'rrhh',      label: 'Recursos Humanos',     icon: '👥', color: '#ec4899' },
  { rol: 'academico', label: 'Academia / Entregas',  icon: '🎓', color: '#a78bfa' },
  { rol: 'tecnico',   label: 'Técnicos de Campo',    icon: '🔧', color: '#34d399' },
  { rol: 'readonly',  label: 'Solo lectura',         icon: '👁️', color: '#94a3b8' },
  { rol: 'admin',     label: 'Administración',       icon: '🔐', color: '#ef4444' },
];

type Tab = 'resumen' | 'secciones' | 'pestanas' | 'usuarios' | 'flujos' | 'sesiones' | 'feedback';

function KPI({ label, value, sub, color = '#00A859' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#0d1117', border: `1px solid ${color}22`, borderRadius: 8, padding: '14px 18px' }}>
      <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ color, fontSize: 24, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: '#4b5563', fontSize: 10, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const COLORS = ['#00A859','#3b82f6','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#84cc16'];

export default function AnalyticsSection() {
  const [tab, setTab]         = useState<Tab>('resumen');
  const [days, setDays]       = useState(7);
  const [data, setData]       = useState<Record<Tab, any>>({} as any);
  const [loading, setLoading] = useState(false);
  const [authUsers, setAuthUsers] = useState<any[]>([]);

  const load = useCallback(async (t: Tab, d: number) => {
    setLoading(true);
    try {
      const map: Record<Tab, string> = {
        resumen:   `${API_BASE}/api/analytics/resumen?dias=${d}`,
        secciones: `${API_BASE}/api/analytics/secciones?dias=${d}`,
        pestanas:  `${API_BASE}/api/analytics/tabs?dias=${d}`,
        usuarios:  `${API_BASE}/api/analytics/users?dias=${d}`,
        flujos:    `${API_BASE}/api/analytics/flows?dias=${d}`,
        sesiones:  `${API_BASE}/api/analytics/sessions?dias=${Math.min(d, 7)}`,
        feedback:  `${API_BASE}/api/analytics/feedback?dias=${d}`,
      };
      const r = await fetch(map[t]);
      if (r.ok) { const json = await r.json(); setData(prev => ({ ...prev, [t]: json })); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tab, days); }, [tab, days, load]);

  // Carga usuarios registrados cuando entramos al tab usuarios
  useEffect(() => {
    if (tab !== 'usuarios') return;
    fetch(`${API_BASE}/api/auth/usuarios`)
      .then(r => r.ok ? r.json() : [])
      .then(setAuthUsers)
      .catch(() => {});
  }, [tab]);

  const s = data[tab];

  // Combinar actividad analytics + usuarios registrados, segmentados por área
  const areaStats = useMemo(() => {
    const activity: any[] = Array.isArray(data.usuarios) ? data.usuarios : [];
    const actMap: Record<string, any> = {};
    for (const u of activity) actMap[u.email] = u;

    return AREAS_DEF.map(area => {
      const registered = authUsers.filter(u => u.rol === area.rol);
      const active = registered.filter(u => actMap[u.email]);
      const totalEventos = active.reduce((sum, u) => sum + (actMap[u.email]?.eventos ?? 0), 0);
      const totalSesiones = active.reduce((sum, u) => sum + (actMap[u.email]?.sesiones ?? 0), 0);

      const combined = registered.map(u => ({
        ...u,
        ...actMap[u.email],
        nombre: u.nombre,
        email: u.email,
        has_activity: !!actMap[u.email],
        eventos: actMap[u.email]?.eventos ?? 0,
        sesiones: actMap[u.email]?.sesiones ?? 0,
        ultimo_acceso: actMap[u.email]?.ultimo_acceso ?? null,
        secciones_usadas: actMap[u.email]?.secciones_usadas ?? [],
      })).sort((a, b) => b.eventos - a.eventos);

      return { ...area, registered, active, combined, totalEventos, totalSesiones };
    }).filter(a => a.registered.length > 0 || activity.some(u => u.rol === a.rol));
  }, [authUsers, data.usuarios]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'resumen',   label: 'Resumen'      },
    { id: 'secciones', label: 'Secciones'    },
    { id: 'pestanas',  label: '🗂 Pestañas'  },
    { id: 'usuarios',  label: 'Usuarios'     },
    { id: 'flujos',    label: 'Flujos'       },
    { id: 'sesiones',  label: 'Sesiones'     },
    { id: 'feedback',  label: '💡 Sugerencias' },
  ];

  return (
    <div style={{ padding: 24, color: '#e5e7eb', fontFamily: 'monospace', background: '#060a0f', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f9fafb', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={20} color="#00A859" /> Analytics de Uso
          </h2>
          <div style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>
            Comportamiento de usuarios · flujos · adopción por área
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{
              background: days === d ? '#00A85922' : 'transparent',
              border: `1px solid ${days === d ? '#00A859' : '#374151'}`,
              color: days === d ? '#00A859' : '#6b7280',
              borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 11,
            }}>{d}d</button>
          ))}
          <button onClick={() => load(tab, days)} disabled={loading} style={{
            background: 'transparent', border: '1px solid #374151', color: '#6b7280',
            borderRadius: 4, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
          }}>
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1f2937', marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'transparent', border: 'none', padding: '8px 18px', cursor: 'pointer',
            color: tab === t.id ? '#00A859' : '#6b7280', fontSize: 12,
            borderBottom: tab === t.id ? '2px solid #00A859' : '2px solid transparent',
            marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Loading state while first data fetch */}
      {loading && !s && (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: 48, fontSize: 13 }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} />
          <div>Cargando datos de analítica…</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* ── Resumen ── */}
      {tab === 'resumen' && s && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            <KPI label="Eventos totales"   value={s.total_eventos?.toLocaleString() ?? 0} color="#00A859" />
            <KPI label="Usuarios únicos"   value={s.usuarios_unicos ?? 0} color="#3b82f6" />
            <KPI label="Sesiones"          value={s.sesiones ?? 0} color="#a855f7" />
            <KPI label="Errores"           value={s.errores ?? 0} color={s.errores > 0 ? '#ef4444' : '#6b7280'} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
            <KPI label="Sección más visitada" value={s.seccion_top ?? '—'} sub="por volumen de eventos" color="#f59e0b" />
            <KPI label="Rol más activo"       value={s.rol_top ?? '—'}    sub="por número de eventos"  color="#06b6d4" />
            <KPI label="Hora pico"            value={s.hora_pico ? `${s.hora_pico}:00 hrs` : '—'} sub="mayor volumen del día" color="#f97316" />
          </div>

          {/* Actividad diaria */}
          {s.actividad_diaria && Object.keys(s.actividad_diaria).length > 0 && (
            <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actividad diaria</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={Object.entries(s.actividad_diaria).map(([fecha, count]) => ({ fecha: fecha.slice(5), count }))}>
                  <XAxis dataKey="fecha" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
                  <Bar dataKey="count" fill="#00A859" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Actividad por hora */}
          {s.actividad_por_hora && (
            <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 8, padding: 16 }}>
              <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Distribución por hora del día</div>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={Object.entries(s.actividad_por_hora).map(([h, c]) => ({ hora: `${h}h`, count: c }))}>
                  <XAxis dataKey="hora" tick={{ fill: '#4b5563', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6, fontSize: 11 }} />
                  <Bar dataKey="count" radius={[2,2,0,0]}>
                    {Object.entries(s.actividad_por_hora).map(([h], i) => (
                      <Cell key={i} fill={parseInt(h) === parseInt(s.hora_pico ?? '-1') ? '#f97316' : '#1f4e3a'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Secciones ── */}
      {tab === 'secciones' && Array.isArray(s) && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px 100px 90px', gap: 8, padding: '6px 12px', color: '#4b5563', fontSize: 10, borderBottom: '1px solid #1f2937', marginBottom: 6 }}>
            <span>SECCIÓN</span><span>VISITAS</span><span>USUARIOS</span><span>ROLES ACTIVOS</span><span>T. PROM.</span>
          </div>
          {s.map((sec: any, i: number) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 70px 90px 100px 90px',
              gap: 8, padding: '9px 12px', fontSize: 11,
              background: i % 2 === 0 ? '#0d1117' : '#060a0f', borderRadius: 4, marginBottom: 2,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 18, background: COLORS[i % COLORS.length], borderRadius: 2 }} />
                <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{sec.seccion}</span>
              </div>
              <span style={{ color: '#00A859', fontWeight: 600 }}>{sec.visitas}</span>
              <span style={{ color: '#6b7280' }}>{sec.usuarios_unicos}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {Object.entries(sec.roles || {}).map(([rol, cnt]: any) => (
                  <span key={rol} style={{ background: '#1f2937', borderRadius: 3, padding: '1px 5px', fontSize: 9, color: '#9ca3af' }}>
                    {rol} {cnt}
                  </span>
                ))}
              </div>
              <span style={{ color: '#6b7280' }}>{sec.duracion_prom_s > 0 ? `${sec.duracion_prom_s}s` : '—'}</span>
            </div>
          ))}
          {s.length === 0 && <div style={{ color: '#4b5563', textAlign: 'center', padding: 40 }}>Sin datos aún — los eventos aparecerán aquí conforme los usuarios naveguen.</div>}
        </div>
      )}

      {/* ── Pestañas / tabs dentro de cada sección ── */}
      {tab === 'pestanas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!Array.isArray(s) || s.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#4b5563' }}>
              Sin datos de pestañas aún.<br />
              <span style={{ fontSize: 11 }}>Los clicks de tab aparecerán aquí conforme los usuarios naveguen dentro de cada sección.</span>
            </div>
          ) : (
            s.map((sec: any) => {
              const maxCount = Math.max(...sec.tabs.map((t: any) => t.count), 1);
              const area = AREAS_DEF.find(a => a.rol === sec.section) ?? null;
              const color = area?.color ?? '#00A859';
              return (
                <div key={sec.section} style={{ background: '#0d1117', border: `1px solid ${color}20`, borderRadius: 12, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ height: 2, background: color }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid #1f2937', background: `${color}06` }}>
                    {area && <span style={{ fontSize: 16 }}>{area.icon}</span>}
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>{area?.label ?? sec.section}</span>
                      <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 8 }}>/ {sec.section}</span>
                    </div>
                    <span style={{ fontSize: 11, color: color, fontWeight: 700 }}>{sec.total_tab_clicks} clicks</span>
                  </div>
                  {/* Tabs */}
                  <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {sec.tabs.map((t: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 10, color: '#6b7280', width: 20, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                        <code style={{ fontSize: 11, color: color, background: `${color}10`, padding: '2px 8px', borderRadius: 4, flexShrink: 0, minWidth: 90, textAlign: 'center' }}>{t.tab}</code>
                        <div style={{ flex: 1, height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${(t.count / maxCount) * 100}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb', minWidth: 28, textAlign: 'right', flexShrink: 0 }}>{t.count}</span>
                        <span style={{ fontSize: 10, color: '#4b5563', minWidth: 60, flexShrink: 0 }}>{t.usuarios_unicos}u · {t.ultimo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Usuarios por área ── */}
      {tab === 'usuarios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {areaStats.length === 0 && (
            <div style={{ color: '#4b5563', textAlign: 'center', padding: 60 }}>
              Sin actividad registrada en este período.<br />
              <span style={{ fontSize: 10 }}>Los usuarios deben navegar al portal para generar eventos.</span>
            </div>
          )}
          {areaStats.map(area => {
            const maxEv = Math.max(...area.combined.map((u: any) => u.eventos), 1);
            return (
              <div key={area.rol} style={{ background: '#0d1117', border: `1px solid ${area.color}20`, borderRadius: 12, overflow: 'hidden' }}>
                {/* Área header */}
                <div style={{ height: 2.5, background: area.color }} />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderBottom: '1px solid #1f2937',
                  background: `${area.color}06`,
                }}>
                  <span style={{ fontSize: 18 }}>{area.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>{area.label}</div>
                    <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>
                      {area.registered.length} registrados · {area.active.length} con actividad en {days}d
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: area.color, fontFamily: 'Oswald, sans-serif', lineHeight: 1 }}>{area.totalEventos}</div>
                      <div style={{ fontSize: 9, color: '#6b7280' }}>eventos</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#6b7280', fontFamily: 'Oswald, sans-serif', lineHeight: 1 }}>{area.totalSesiones}</div>
                      <div style={{ fontSize: 9, color: '#6b7280' }}>sesiones</div>
                    </div>
                  </div>
                </div>

                {/* Users */}
                {area.combined.length === 0 ? (
                  <div style={{ padding: '14px 16px', color: '#374151', fontSize: 11 }}>Sin usuarios registrados en esta área.</div>
                ) : (
                  area.combined.map((u: any, i: number) => (
                    <div key={u.id ?? i} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                      borderBottom: i < area.combined.length - 1 ? '1px solid #1f2937' : 'none',
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: u.has_activity ? `${area.color}18` : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${u.has_activity ? area.color + '40' : '#1f2937'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: u.has_activity ? area.color : '#4b5563',
                      }}>
                        {(u.nombre || u.email).charAt(0).toUpperCase()}
                      </div>

                      {/* Nombre + email */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: u.has_activity ? '#e5e7eb' : '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nombre || u.email}</div>
                        <div style={{ fontSize: 10, color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nombre ? u.email : ''}</div>
                      </div>

                      {/* Activity bar */}
                      <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
                        <div style={{ height: 4, background: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${(u.eventos / maxEv) * 100}%`, height: '100%', background: area.color, borderRadius: 2, transition: 'width 0.6s ease' }} />
                        </div>
                        <div style={{ fontSize: 9, color: '#4b5563', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{u.eventos} ev</span>
                          <span>{u.sesiones} ses</span>
                        </div>
                      </div>

                      {/* Secciones */}
                      <div style={{ width: 160, display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'flex-end', flexShrink: 0 }}>
                        {(u.secciones_usadas || []).slice(0, 4).map((sec: string, j: number) => (
                          <span key={j} style={{ background: '#1f2937', borderRadius: 3, padding: '1px 5px', fontSize: 8, color: '#9ca3af' }}>{sec}</span>
                        ))}
                        {(u.secciones_usadas || []).length > 4 && (
                          <span style={{ fontSize: 8, color: '#4b5563' }}>+{u.secciones_usadas.length - 4}</span>
                        )}
                      </div>

                      {/* Último acceso */}
                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
                        {u.has_activity ? (
                          <span style={{ fontSize: 10, color: '#6b7280' }}>{u.ultimo_acceso}</span>
                        ) : (
                          <span style={{ fontSize: 9, color: '#374151', fontStyle: 'italic' }}>Sin actividad</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Flujos ── */}
      {tab === 'flujos' && Array.isArray(s) && (
        <div>
          <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 16 }}>
            Secuencias de navegación más frecuentes entre secciones
          </div>
          {s.map((f: any, i: number) => {
            const [a, b] = f.flujo.split(' → ');
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', marginBottom: 4,
                background: '#0d1117', borderRadius: 6,
                borderLeft: `3px solid ${COLORS[i % COLORS.length]}`,
              }}>
                <span style={{ color: '#e5e7eb', fontSize: 11, fontWeight: 600, minWidth: 120 }}>{a}</span>
                <ArrowRight size={13} color="#4b5563" />
                <span style={{ color: '#e5e7eb', fontSize: 11, fontWeight: 600, minWidth: 120 }}>{b}</span>
                <div style={{ flex: 1, height: 4, background: '#1f2937', borderRadius: 2, overflow: 'hidden', marginLeft: 8 }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (f.count / (s[0]?.count || 1)) * 100)}%`, background: COLORS[i % COLORS.length], borderRadius: 2 }} />
                </div>
                <span style={{ color: '#6b7280', fontSize: 10, minWidth: 40, textAlign: 'right' }}>{f.count}x</span>
              </div>
            );
          })}
          {s.length === 0 && <div style={{ color: '#4b5563', textAlign: 'center', padding: 40 }}>Sin flujos registrados aún. Se necesitan al menos 2 navegaciones por sesión.</div>}
        </div>
      )}

      {/* ── Sesiones ── */}
      {tab === 'sesiones' && Array.isArray(s) && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 60px 80px 1fr', gap: 8, padding: '6px 12px', color: '#4b5563', fontSize: 10, borderBottom: '1px solid #1f2937', marginBottom: 6 }}>
            <span>USUARIO</span><span>ROL</span><span>INICIO</span><span>MIN</span><span>EVENTOS</span><span>SECCIONES</span>
          </div>
          {s.map((sess: any, i: number) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 70px 80px 60px 80px 1fr',
              gap: 8, padding: '9px 12px', fontSize: 10,
              background: i % 2 === 0 ? '#0d1117' : '#060a0f', borderRadius: 4, marginBottom: 2,
            }}>
              <span style={{ color: '#e5e7eb' }}>{sess.user_email || '—'}</span>
              <span style={{ color: '#00A859' }}>{sess.rol || '—'}</span>
              <span style={{ color: '#6b7280' }}>{sess.inicio}</span>
              <span style={{ color: '#fbbf24' }}>{sess.duracion_min}</span>
              <span style={{ color: '#6b7280' }}>{sess.eventos}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {(sess.secciones || []).map((sc: string, j: number) => (
                  <span key={j} style={{ background: '#1f2937', borderRadius: 3, padding: '1px 5px', fontSize: 9, color: '#9ca3af' }}>{sc}</span>
                ))}
              </div>
            </div>
          ))}
          {s.length === 0 && <div style={{ color: '#4b5563', textAlign: 'center', padding: 40 }}>Sin sesiones en los últimos {Math.min(days, 7)} días.</div>}
        </div>
      )}

      {/* ── Feedback / Sugerencias ── */}
      {tab === 'feedback' && Array.isArray(s) && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ color: '#6b7280', fontSize: 11 }}>
              {s.length} sugerencia{s.length !== 1 ? 's' : ''} registrada{s.length !== 1 ? 's' : ''} en los últimos {days} días
            </div>
          </div>

          {s.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#4b5563' }}>
              <Lightbulb size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div>Sin sugerencias aún.</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Los usuarios verán el botón 💡 en cada sección.</div>
            </div>
          )}

          {s.map((f: any, i: number) => {
            const catColors: Record<string, string> = {
              proceso: '#3b82f6', ux: '#a855f7', datos: '#f59e0b',
              automatizacion: '#00A859', otro: '#6b7280',
            };
            const color = catColors[f.categoria] || '#6b7280';
            return (
              <div key={i} style={{
                background: '#0d1117',
                border: '1px solid #1f2937',
                borderLeft: `3px solid ${color}`,
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      background: `${color}22`, color, border: `1px solid ${color}55`,
                      borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700,
                    }}>{f.categoria}</span>
                    <span style={{
                      background: '#1f2937', color: '#9ca3af',
                      borderRadius: 4, padding: '2px 8px', fontSize: 10,
                    }}>
                      <Tag size={9} style={{ marginRight: 3, display: 'inline' }} />{f.section}
                    </span>
                  </div>
                  <div style={{ color: '#4b5563', fontSize: 10, textAlign: 'right' }}>
                    <div>{f.user_nombre || f.user_email || 'Anónimo'}</div>
                    <div style={{ color: '#374151' }}>{(f.ts || '').slice(0, 16).replace('T', ' ')}</div>
                  </div>
                </div>
                <div style={{ color: '#e5e7eb', fontSize: 13, lineHeight: 1.5 }}>{f.texto}</div>
                {f.rol && <div style={{ color: '#4b5563', fontSize: 10, marginTop: 6 }}>Rol: {f.rol}</div>}
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
