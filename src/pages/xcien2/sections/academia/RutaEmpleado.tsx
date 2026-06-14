/**
 * RutaEmpleado — Vista de Ruta de Aprendizaje para el empleado.
 * Muestra la secuencia de cursos obligatorios de su área con progreso visual.
 */
import { useState, useEffect } from 'react';
import { API_BASE } from '../../../../config';
import brand from '../../../../brand';

interface CursoProgreso {
  curso_id: number;
  curso_name: string;
  orden: number;
  obligatorio: boolean;
  pct: number;
  completado: boolean;
}

interface RutaData {
  area: string;
  ruta: {
    nombre: string;
    descripcion: string;
    color: string;
    icono: string;
  } | null;
  progreso: number;
  cursos_progreso: CursoProgreso[];
  completados: number;
  total_obligatorios: number;
}

interface Props {
  nombreUsuario: string;
}

const DIM = '#6b7280';

export default function RutaEmpleado({ nombreUsuario }: Props) {
  const [data, setData]     = useState<RutaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!nombreUsuario) return;
    fetch(`${API_BASE}/api/academia/rutas-progreso/${encodeURIComponent(nombreUsuario)}`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [nombreUsuario]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: DIM, fontSize: 13, padding: '24px 0' }}>
      <div style={{ width: 16, height: 16, border: '2px solid #00C896', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      Cargando ruta…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!data || !data.ruta) return (
    <div style={{ background: 'rgba(255,183,3,0.06)', border: '1px solid rgba(255,183,3,0.2)', borderRadius: 12, padding: 20 }}>
      <p style={{ margin: 0, fontSize: 13, color: '#FFB703' }}>
        📋 Tu área aún no tiene una Ruta de Aprendizaje configurada. El director puede crearla desde la sección Academia → Editor de Rutas.
      </p>
    </div>
  );

  const { ruta, progreso, cursos_progreso, completados, total_obligatorios, area } = data;
  const color = ruta.color || '#00C896';
  const pctRedondeado = Math.round(progreso);

  // Semáforo
  const semaforo = pctRedondeado >= 80 ? '#00C896' : pctRedondeado >= 40 ? '#FFB703' : '#FF4757';

  // Primer curso pendiente (siguiente en la secuencia)
  const siguiente = cursos_progreso.find(c => c.obligatorio && !c.completado);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Hero de la ruta */}
      <div style={{
        background: `linear-gradient(135deg, ${color}12 0%, #0d1117 60%)`,
        border: `1px solid ${color}25`,
        borderRadius: 16, padding: '24px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          {/* Progreso circular SVG */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {(() => {
              const size = 96, stroke = 7;
              const r = (size - stroke) / 2;
              const circ = 2 * Math.PI * r;
              return (
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
                  <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={semaforo} strokeWidth={stroke}
                    strokeDasharray={`${(pctRedondeado/100)*circ} ${circ}`} strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)' }} />
                </svg>
              );
            })()}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: semaforo, lineHeight: 1 }}>{pctRedondeado}%</span>
              <span style={{ fontSize: 9, color: DIM }}>completado</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>{ruta.icono}</span>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>{ruta.nombre}</h3>
            </div>
            {ruta.descripcion && <p style={{ margin: '0 0 10px', fontSize: 13, color: DIM }}>{ruta.descripcion}</p>}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Área', value: area, c: color },
                { label: 'Obligatorios', value: `${completados}/${total_obligatorios}`, c: completados === total_obligatorios ? '#00C896' : '#FFB703' },
                { label: 'Opcionales', value: cursos_progreso.filter(c => !c.obligatorio).length, c: DIM },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ margin: 0, fontSize: 10, color: DIM, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: s.c }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          {siguiente && (
            <a href={`${brand.odooUrl}/slides/${siguiente.curso_id}`} target="_blank" rel="noreferrer"
              style={{ padding: '11px 20px', borderRadius: 10, background: color, color: '#001a12', fontSize: 13, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap', alignSelf: 'flex-start', flexShrink: 0 }}>
              Continuar → {siguiente.curso_name.split(' ').slice(0, 4).join(' ')}…
            </a>
          )}
          {!siguiente && completados > 0 && (
            <div style={{ padding: '11px 20px', borderRadius: 10, background: 'rgba(0,200,150,0.12)', border: '1px solid rgba(0,200,150,0.3)', color: '#00C896', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
              🎉 Ruta completada
            </div>
          )}
        </div>

        {/* Barra de progreso total */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: DIM, fontWeight: 700 }}>Progreso de la ruta</span>
            <span style={{ fontSize: 11, color: semaforo, fontWeight: 700 }}>{pctRedondeado}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${pctRedondeado}%`, height: '100%', background: semaforo, borderRadius: 4, transition: 'width 1.2s ease' }} />
          </div>
        </div>
      </div>

      {/* Secuencia de cursos */}
      <div>
        <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#f3f4f6' }}>
          Secuencia de Cursos
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cursos_progreso.map((c, i) => {
            const lv_color = c.pct >= 80 ? '#00C896' : c.pct >= 40 ? '#FFB703' : '#6b7280';
            const isNext   = siguiente?.curso_id === c.curso_id;
            return (
              <div key={c.curso_id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                background: c.completado ? 'rgba(0,200,150,0.04)' : isNext ? `${color}08` : '#111827',
                borderRadius: 12,
                border: `1px solid ${c.completado ? 'rgba(0,200,150,0.15)' : isNext ? `${color}25` : 'rgba(255,255,255,0.05)'}`,
                transition: 'all 0.2s',
              }}>
                {/* Número / check */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: c.completado ? 'rgba(0,200,150,0.15)' : isNext ? `${color}15` : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${c.completado ? '#00C896' : isNext ? color : 'rgba(255,255,255,0.1)'}`,
                  fontSize: c.completado ? 16 : 13, fontWeight: 700,
                  color: c.completado ? '#00C896' : isNext ? color : DIM,
                }}>
                  {c.completado ? '✓' : i + 1}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: isNext ? 700 : 600, color: c.completado ? '#9ca3af' : '#f3f4f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.curso_name}
                    </p>
                    {!c.obligatorio && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: 'rgba(255,183,3,0.1)', color: '#FFB703', fontWeight: 700, flexShrink: 0 }}>Opcional</span>}
                    {isNext && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: `${color}15`, color, fontWeight: 700, flexShrink: 0 }}>← Siguiente</span>}
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${c.pct}%`, height: '100%', background: lv_color, borderRadius: 2, transition: 'width 1s ease' }} />
                  </div>
                </div>

                {/* Porcentaje y botón */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: lv_color }}>{c.pct}%</span>
                  <a href={`${brand.odooUrl}/slides/${c.curso_id}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: c.completado ? 'rgba(0,200,150,0.1)' : `${color}12`, border: `1px solid ${c.completado ? 'rgba(0,200,150,0.2)' : `${color}20`}`, color: c.completado ? '#00C896' : color, fontWeight: 700, textDecoration: 'none' }}>
                    {c.completado ? 'Repasar ↗' : c.pct > 0 ? 'Continuar ↗' : 'Comenzar ↗'}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
