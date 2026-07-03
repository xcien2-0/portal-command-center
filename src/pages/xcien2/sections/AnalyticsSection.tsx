import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../../config';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Users, ArrowRight, RefreshCw, Lightbulb, Tag } from 'lucide-react';

type Tab = 'resumen' | 'secciones' | 'usuarios' | 'flujos' | 'sesiones' | 'feedback';

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

  const load = useCallback(async (t: Tab, d: number) => {
    setLoading(true);
    try {
      const map: Record<Tab, string> = {
        resumen:   `${API_BASE}/api/analytics/summary?days=${d}`,
        secciones: `${API_BASE}/api/analytics/sections?days=${d}`,
        usuarios:  `${API_BASE}/api/analytics/users?days=${d}`,
        flujos:    `${API_BASE}/api/analytics/flows?days=${d}`,
        sesiones:  `${API_BASE}/api/analytics/sessions?days=${Math.min(d, 7)}`,
        feedback:  `${API_BASE}/api/analytics/feedback?days=${d}`,
      };
      const r = await fetch(map[t]);
      if (r.ok) { const json = await r.json(); setData(prev => ({ ...prev, [t]: json })); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tab, days); }, [tab, days, load]);

  const s = data[tab];

  const tabs: { id: Tab; label: string }[] = [
    { id: 'resumen',   label: 'Resumen'    },
    { id: 'secciones', label: 'Secciones'  },
    { id: 'usuarios',  label: 'Usuarios'   },
    { id: 'flujos',    label: 'Flujos'     },
    { id: 'sesiones',  label: 'Sesiones'   },
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

      {/* ── Usuarios ── */}
      {tab === 'usuarios' && Array.isArray(s) && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 70px 130px', gap: 8, padding: '6px 12px', color: '#4b5563', fontSize: 10, borderBottom: '1px solid #1f2937', marginBottom: 6 }}>
            <span>USUARIO</span><span>ROL</span><span>SESIONES</span><span>EVENTOS</span><span>ÚLTIMO ACCESO</span>
          </div>
          {s.map((u: any, i: number) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 80px 70px 130px',
              gap: 8, padding: '10px 12px', fontSize: 11,
              background: i % 2 === 0 ? '#0d1117' : '#060a0f', borderRadius: 4, marginBottom: 2,
            }}>
              <div>
                <div style={{ color: '#e5e7eb', fontWeight: 600 }}>{u.nombre || u.email}</div>
                <div style={{ color: '#4b5563', fontSize: 9 }}>{u.nombre ? u.email : ''}</div>
              </div>
              <span style={{ color: '#00A859', fontSize: 10 }}>{u.rol}</span>
              <span style={{ color: '#6b7280' }}>{u.sesiones}</span>
              <span style={{ color: '#fbbf24' }}>{u.eventos}</span>
              <span style={{ color: '#4b5563', fontSize: 10 }}>{u.ultimo_acceso}</span>
            </div>
          ))}
          {s.length === 0 && <div style={{ color: '#4b5563', textAlign: 'center', padding: 40 }}>Sin actividad registrada en este período.</div>}
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
